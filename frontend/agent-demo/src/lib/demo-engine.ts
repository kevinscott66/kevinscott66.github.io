import { TASK_TRANSITIONS } from "./task-fsm";
/** Local-only portfolio adapter. No network, model providers or real credentials. */
const now = () => Date.now();
const roles = ["Lead", "Product", "Backend", "QA"];
const agents = roles.map((title, i) => ({
  key: title.toLowerCase(),
  title,
  provider: "internal",
  execution_state: "running",
  status: "running",
  paused: false,
  health: { alive: true, lastOkAt: now(), consecutiveFailures: 0 },
}));
let seq = 0,
  mode = "manual";
const tasks: any[] = [];
const actions: any[] = [];
const approvals: any[] = [];
const update = () => window.dispatchEvent(new Event("demo-update"));
function log(
  agent: string,
  type: string,
  status: string,
  task: any,
  result: any = null,
) {
  actions.unshift({
    id: "action-" + ++seq,
    agent_key: agent,
    task_id: task?.id || null,
    chat_id: 1,
    action_type: type,
    status,
    payload: { summary: task?.title },
    result,
    error: null,
    created_at: now(),
  });
}
function create(title: string) {
  const t = {
    id: "demo-" + ++seq,
    parent_id: null,
    depth: 0,
    chat_id: 1,
    created_by: "demo-owner",
    assigned_to: "backend",
    title,
    description:
      "Локальная проверка демонстрационного набора данных. Без внешних сервисов.",
    status: "pending",
    priority: 1,
    deadline: null,
    input: { demo: true },
    output: null,
    error: null,
    created_at: now(),
    updated_at: now(),
  };
  tasks.unshift(t);
  log("lead", "task.create", "ok", t);
  update();
  return t;
}
// The worker performs a real local computation. Timed batches keep the workflow inspectable.
const workerCode = `let n=0,total=0;const timer=setInterval(()=>{for(let i=0;i<12000;i++){total+=(i*17+n)%97;}n++;postMessage({progress:n*10,total});if(n===10)clearInterval(timer)},700);`;
const running = new Set<string>();
function run(t: any) {
  if (running.has(t.id) || t.status === "done") return;
  running.add(t.id);
  t.status = "running";
  t.updated_at = now();
  log("backend", "task.execute", "attempted", t);
  update();
  const url = URL.createObjectURL(
    new Blob([workerCode], { type: "text/javascript" }),
  );
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  worker.onmessage = (e) => {
    if (t.status !== "running") {
      worker.terminate();
      running.delete(t.id);
      return;
    }
    t.output = { progress: e.data.progress, checksum: e.data.total };
    t.updated_at = now();
    update();
    if (e.data.progress === 100) {
      worker.terminate();
      running.delete(t.id);
      t.status = "awaiting_approval";
      log("qa", "task.review", "pending_approval", t, e.data);
      approvals.unshift({
        id: "approval-" + ++seq,
        action_id: actions[0].id,
        chat_id: 1,
        requested_by: "qa",
        action_type: "task.complete",
        payload: { summary: t.title, task_id: t.id, checksum: e.data.total },
        status: "pending",
        created_at: now(),
        decided_by: null,
        decided_at: null,
        reason: null,
      });
      update();
    }
  };
  worker.onerror = () => {
    worker.terminate();
    running.delete(t.id);
    t.status = "failed";
    t.error = "Локальный worker недоступен";
    update();
  };
}
const first = create("Проверить демонстрационный набор данных");
create("Подготовить сводку по результатам проверки");
setTimeout(() => run(first), 1500);
const budgets = agents.map((a, i) => ({
  agentKey: a.key,
  usedTokens: 0,
  outputTokens: 0,
  limit: null,
  resetAt: now() + 86400000,
}));
export async function demoRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const u = new URL(path, "https://demo.invalid"),
    p = u.pathname,
    body = init.body ? JSON.parse(String(init.body)) : {};
  const post = init.method === "POST";
  let result: any;
  if (p === "/api/health") result = { ok: true, ts: now(), mac_online: false };
  else if (p === "/api/dashboard")
    result = {
      counts: {
        tasksPending: tasks.filter(
          (t) => t.status === "pending" || t.status === "running",
        ).length,
        approvalsPending: approvals.filter((a) => a.status === "pending")
          .length,
        actionsSince: actions.length,
        since: 0,
      },
      agents,
      recentTasks: tasks,
      pendingApprovals: approvals.filter((a) => a.status === "pending"),
      recentActions: actions,
      budgets,
    };
  else if (p === "/api/agents") result = { agents };
  else if (p === "/api/budgets" || p === "/api/budget-settings")
    result = { budgets, settings: [], admin: true };
  else if (p === "/api/autonomy") {
    if (post) {
      mode = body.mode;
      update();
    }
    result = { mode, admin: true, overrides: [] };
  } else if (p === "/api/tasks" && post) {
    result = {
      task: create(String(body.title || "Локальная задача").slice(0, 200)),
    };
  } else if (p === "/api/tasks") {
    result = {
      tasks: tasks.filter(
        (t) =>
          (!u.searchParams.get("status") ||
            t.status === u.searchParams.get("status")) &&
          (!u.searchParams.get("assignee") ||
            t.assigned_to === u.searchParams.get("assignee")),
      ),
      truncated: false,
      nextOffset: null,
    };
  } else if (/^\/api\/tasks\/[^/]+\/status$/.test(p)) {
    const t = tasks.find((t) => t.id === p.split("/")[3]);
    if (!t) throw Error("Задача не найдена");
    if (!(TASK_TRANSITIONS as any)[t.status]?.includes(body.status))
      throw Error("Недопустимый переход состояния");
    if (body.status === "running") run(t);
    else {
      t.status = body.status;
      t.updated_at = now();
      log("lead", "task.update", "ok", t);
      update();
    }
    result = { task: t };
  } else if (/^\/api\/tasks\/[^/]+$/.test(p))
    result = { task: tasks.find((t) => t.id === p.split("/")[3]) };
  else if (p === "/api/approvals")
    result = {
      approvals: approvals.filter(
        (a) =>
          !u.searchParams.get("status") ||
          a.status === u.searchParams.get("status"),
      ),
    };
  else if (p.endsWith("/decide")) {
    const a = approvals.find((a) => a.id === p.split("/")[3]);
    if (!a) throw Error("Согласование не найдено");
    if (a.status !== "pending") throw Error("Согласование уже обработано");
    if (!["approved", "rejected"].includes(body.decision))
      throw Error("Неизвестное решение");
    a.status = body.decision;
    a.decided_at = now();
    a.decided_by = "demo-owner";
    const t = tasks.find((t) => t.id === a.payload.task_id);
    t.status = body.decision === "approved" ? "done" : "pending";
    log(
      "lead",
      "task.complete",
      body.decision === "approved" ? "ok" : "forbidden",
      t,
    );
    update();
    result = { approval: a };
  } else if (p === "/api/actions")
    result = {
      actions: actions.filter(
        (a) =>
          (!u.searchParams.get("agent") ||
            a.agent_key === u.searchParams.get("agent")) &&
          (!u.searchParams.get("status") ||
            a.status === u.searchParams.get("status")),
      ),
    };
  else if (p === "/api/permissions") result = { permissions: [] };
  else if (/^\/api\/agents\/[^/]+\/(pause|resume)$/.test(p)) {
    const a = agents.find((a) => a.key === p.split("/")[3]);
    if (!a) throw Error("Роль не найдена");
    a.paused = p.endsWith("/pause");
    a.status = a.paused ? "paused" : "running";
    a.execution_state = a.paused ? "paused" : "running";
    update();
    result = { ok: true, paused: a.paused };
  } else throw new Error("Эта функция не входит в локальное демо");
  return structuredClone(result) as T;
}
