import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const base = new URL("../", import.meta.url);
const engine = await readFile(new URL("engine.js", base), "utf8");
const app = await readFile(new URL("app.js", base), "utf8");
const library = JSON.parse(await readFile(new URL("assets/library.json", base), "utf8"));

// Execute production handlers. Only automatic network startup and DOM painting
// are suppressed: these tests check state and file sequencing, not browser SVG.
function editor() {
  const controls = new Map();
  const control = (id) => {
    if (!controls.has(id)) controls.set(id, {
      value: id === "scheme" ? "lavender" : "", textContent: "", children: [],
      replaceChildren(...nodes) { this.children = nodes; },
      append(...nodes) { this.children.push(...nodes); },
      querySelector() { return null; }, querySelectorAll() { return []; },
      listeners: {}, capturedPointers: new Set(), focused: false,
      addEventListener(type, handler) { this.listeners[type] = handler; },
      getScreenCTM() { return { inverse: () => ({}) }; },
      focus() { this.focused = true; },
      setPointerCapture(id) { this.capturedPointers.add(id); },
      hasPointerCapture(id) { return this.capturedPointers.has(id); },
      releasePointerCapture(id) { this.capturedPointers.delete(id); },
    });
    return controls.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: control, querySelectorAll: () => [],
      createElement: () => ({ children: [], dataset: {}, setAttribute() {}, append(...nodes) { this.children.push(...nodes); } }),
    },
    initialLibrary: library,
    DOMPoint: class {
      constructor(x, y) { this.x = x; this.y = y; }
      matrixTransform() { return this; }
    },
    renderCalls: 0, libraryRenderCalls: 0, downloads: [],
  });
  assert.equal(app.split("\ninit();").length, 2, "one explicit startup call");
  vm.runInContext(engine + "\n" + app.replace("\ninit();", "\n// startup suppressed by test") + `
    library = initialLibrary;
    editorReady = true;
    $("background").value = palette().backgroundLight;
    render = () => renderCalls++;
    renderLibrary = () => libraryRenderCalls++;
    download = (text, type, name) => downloads.push({text, type, name});
  `, context);
  return {
    control,
    run: (source) => vm.runInContext(source, context),
    state: () => JSON.parse(vm.runInContext("JSON.stringify({objects, selected, w, h, customPalette})", context)),
    event: (id, file) => {
      const target = control(id);
      target.files = file ? [file] : [];
      target.value = "chosen-file";
      return { target };
    },
  };
}
function deferredFile(size = 100) {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { size, text: () => promise, resolve };
}
function project(asset = "book") {
  return {
    version: 1, w: 800, h: 600, scheme: "lavender", palette: null,
    background: "#d7cdf5",
    objects: [{ asset, x: 400, y: 300, rotation: 0, scale: 1, role: "main" }],
  };
}

test("latest project wins when file reads finish in reverse order", async () => {
  const e = editor(), a = deferredFile(), b = deferredFile();
  e.run("add(library[0])");
  const before = e.state();
  const eventA = e.event("project", a);
  const pendingA = e.run("openProject")(eventA);
  assert.equal(eventA.target.value, "", "same file can be selected again");
  const pendingB = e.run("openProject")(e.event("project", b));
  assert.deepEqual(e.state(), before, "pending reads do not mutate composition");
  b.resolve(JSON.stringify(project("wallet")));
  await pendingB;
  assert.equal(e.state().objects[0].asset, "wallet");
  a.resolve(JSON.stringify(project("book")));
  await pendingA;
  assert.equal(e.state().objects[0].asset, "wallet", "stale completion is ignored");
});

test("project read captures its File even if input files later change", async () => {
  const e = editor(), file = deferredFile();
  const event = e.event("project", file);
  e.control("notice").textContent = "Предыдущая ошибка";
  const pending = e.run("openProject")(event);
  event.target.files = [{ size: 2000000 }];
  file.resolve(JSON.stringify(project()));
  await pending;
  assert.equal(e.state().objects[0].asset, "book");
  assert.equal(e.control("notice").textContent, "Картинка открыта.", "successful open clears previous error");
});

test("oversized files are rejected before text is read; invalid JSON preserves state", async () => {
  const e = editor();
  e.run("add(library[0])");
  const before = e.state();
  for (const [handler, id, size] of [["openProject", "project", 1000001], ["importPalette", "palette", 64001]]) {
    let reads = 0;
    await e.run(handler)(e.event(id, { size, text() { reads++; throw Error("must not read"); } }));
    assert.equal(reads, 0);
    assert.match(e.control("notice").textContent, /слишком большой/);
    assert.deepEqual(e.state(), before);
  }
  await e.run("openProject")(e.event("project", { size: 3, text: async () => "bad" }));
  assert.deepEqual(e.state(), before);
  assert.ok(e.control("notice").textContent);
});

test("scheme change supersedes pending custom palette read", async () => {
  const e = editor(), file = deferredFile();
  const pending = e.run("importPalette")(e.event("palette", file));
  assert.equal(e.control("palette").value, "");
  e.control("scheme").value = "peach";
  e.control("scheme").onchange();
  const background = e.control("background").value;
  file.resolve(e.run("JSON.stringify(palettes.aqua)"));
  await pending;
  assert.equal(e.state().customPalette, null);
  assert.equal(e.control("background").value, background);
});

test("100-object boundary rejects add and clone without changing selection or IDs", () => {
  const e = editor();
  e.run("for (let i=0; i<100; i++) add(library[0]);");
  const before = e.state();
  assert.equal(e.run("add(library[0])"), null);
  e.control("duplicate").onclick();
  assert.deepEqual(e.state(), before);
  assert.match(e.control("notice").textContent, /100/);
  e.run("saveProject()");
  e.run("validateProject(JSON.parse(downloads[0].text), downloads[0].text.length)");
});

test("edge coordinates remain loadable after clone and resize", () => {
  const e = editor();
  e.run("add(library[0], {x:5000,y:-5000})");
  e.control("duplicate").onclick();
  assert.equal(e.state().objects[1].x, 5000);
  e.control("size").onchange({ target: { value: "1200 × 800" } });
  assert.ok(e.run("libraryRenderCalls > 0"), "size change refreshes variant previews");
  for (const object of e.state().objects) {
    assert.ok(Math.abs(object.x) <= 5000);
    assert.ok(Math.abs(object.y) <= 5000);
  }
  e.run("saveProject(); validateProject(JSON.parse(downloads[0].text), downloads[0].text.length)");
});

test("uppercase custom palette rejects object-colored background before save", async () => {
  const e = editor();
  const colors = JSON.parse(e.run("JSON.stringify(palettes.peach)"));
  for (const key of Object.keys(colors)) colors[key] = colors[key].toUpperCase();
  await e.run("importPalette")(e.event("palette", { size: 200, text: async () => JSON.stringify(colors) }));
  e.control("background").value = colors.secondary.toLowerCase();
  e.control("background").oninput();
  assert.equal(e.control("background").value, colors.backgroundLight);
  assert.match(e.control("notice").textContent, /другой фон/);
  e.run("add(library[0]); saveProject(); validateProject(JSON.parse(downloads[0].text), downloads[0].text.length)");
});

test("compose/edit/layer/delete/save/open preserves edited project state", async () => {
  const e = editor();
  e.control("prompt").value = "Книга, наушники и кошелек";
  e.run("composeFromPrompt()");
  assert.ok(e.state().objects.length >= 3);
  e.control("size").onchange({ target: { value: "1200 × 800" } });
  e.control("scheme").value = "aqua";
  e.control("scheme").onchange();
  e.control("role").oninput({ target: { value: "background" } });
  e.control("rotation").oninput({ target: { value: "35" } });
  e.control("scale").oninput({ target: { value: "1.7" } });
  e.control("duplicate").onclick();
  const clone = e.state().objects.at(-1);
  assert.equal(clone.rotation, 35);
  assert.equal(clone.scale, 1.7);
  assert.equal(clone.role, "background");
  e.run("moveLayer(selectedObject(), -1)");
  assert.equal(e.state().objects.at(-2).id, clone.id);
  e.control("delete").onclick();
  assert.ok(!e.state().objects.some((o) => o.id === clone.id));
  e.run("saveProject()");
  const saved = JSON.parse(e.run("downloads[0].text"));
  e.run("objects = []; selected = null;");
  await e.run("openProject")(e.event("project", { size: 1000, text: async () => JSON.stringify(saved) }));
  const withoutIds = (objects) => objects.map(({ id, ...object }) => object);
  assert.deepEqual(withoutIds(e.state().objects), withoutIds(saved.objects));
  assert.equal(e.state().w, 1200);
  assert.equal(e.control("scheme").value, "aqua");
  assert.equal(e.state().selected, null);
});

test("unknown/empty prompts and canceled file dialogs preserve composition", async () => {
  const e = editor();
  e.run("add(library[0])");
  const before = e.state();
  for (const prompt of ["", "zxqv123"]) {
    e.control("prompt").value = prompt;
    e.run("composeFromPrompt()");
    assert.deepEqual(e.state(), before);
    assert.match(e.control("notice").textContent, /Не удалось подобрать/);
  }
  await e.run("openProject")(e.event("project", null));
  await e.run("importPalette")(e.event("palette", null));
  assert.deepEqual(e.state(), before);
});

test("actual compose handler preserves all named items and rejects unavailable ones atomically", () => {
  const e=editor();
  e.control("prompt").value="Книга, телефон, пазлы, монета, наушники";
  e.control("compose").onclick();
  assert.deepEqual(e.state().objects.map(o=>o.asset),["book","phone","puzzle","coin","headphones"]);
  const before=e.state();
  e.control("prompt").value="Книга, дракон";
  e.control("compose").onclick();
  assert.deepEqual(e.state(),before);
  assert.match(e.control("notice").textContent,/дракон/);
});


function pointer(id, objectId, x = 400, y = 300, overrides = {}) {
  return {
    pointerId: id, button: 0, isPrimary: true, clientX: x, clientY: y,
    target: { closest: () => objectId == null ? null : { dataset: { object: String(objectId) } } },
    preventDefault() { this.prevented = true; },
    ...overrides,
  };
}

test("drag belongs to one pointer and ignores unrelated touches and cancellations", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0]); add(library[1]);");
  const [first, second] = e.state().objects;
  canvas.onpointerdown(pointer(1, first.id));
  assert.equal(canvas.focused, true);
  assert.equal(canvas.hasPointerCapture(1), true);
  canvas.onpointerdown(pointer(2, second.id, 500, 350, { isPrimary: false }));
  canvas.onpointermove(pointer(2, second.id, 800, 600));
  canvas.listeners.pointercancel(pointer(2, second.id));
  assert.equal(e.state().selected, first.id);
  assert.equal(e.state().objects[0].x, first.x);
  canvas.onpointermove(pointer(1, first.id, 450, 325));
  assert.equal(e.state().objects[0].x, first.x + 50);
  assert.equal(e.state().objects[0].y, first.y + 25);
  canvas.listeners.pointerup(pointer(1, first.id));
  assert.equal(canvas.hasPointerCapture(1), false);
  canvas.onpointermove(pointer(1, first.id, 900, 700));
  assert.equal(e.state().objects[0].x, first.x + 50);
});

test("canceled/lost gestures stop moving; removed objects cannot be dragged", () => {
  for (const event of ["pointercancel", "lostpointercapture"]) {
    const e = editor(), canvas = e.control("canvas");
    e.run("add(library[0])");
    canvas.onpointerdown(pointer(7, e.state().selected));
    canvas.listeners[event](pointer(7));
    const before = e.state();
    canvas.onpointermove(pointer(7, null, 500, 500));
    assert.deepEqual(e.state(), before);
    assert.equal(canvas.hasPointerCapture(7), false);
  }
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0])");
  canvas.onpointerdown(pointer(9, e.state().selected));
  e.control("delete").onclick();
  canvas.onpointermove(pointer(9, null, 500, 500));
  assert.equal(canvas.hasPointerCapture(9), false);
  assert.equal(e.state().objects.length, 0);
});

test("right-click and unavailable canvas geometry do not begin a drag", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0]); selected = null;");
  const id = e.state().objects[0].id, before = e.state();
  canvas.onpointerdown(pointer(1, id, 400, 300, { button: 2 }));
  assert.deepEqual(e.state(), before);
  canvas.getScreenCTM = () => null;
  canvas.onpointerdown(pointer(1, id));
  assert.deepEqual(e.state(), before);
  assert.equal(canvas.capturedPointers.size, 0);
});

test("canvas arrow keys move the selected object, respect bounds and ignore form typing", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0], {x:4999, y:100})");
  const key = (value, extra = {}) => ({ key: value, target: canvas,
    preventDefault() { this.prevented = true; }, ...extra });
  const right = key("ArrowRight", { shiftKey: true });
  canvas.onkeydown(right);
  assert.equal(right.prevented, true);
  assert.equal(e.state().objects[0].x, 5000);
  canvas.onkeydown(key("ArrowUp"));
  assert.equal(e.state().objects[0].y, 99);
  const before = e.state();
  for (const extra of [{ target: e.control("prompt") }, { ctrlKey: true }, { metaKey: true }, { altKey: true }])
    canvas.onkeydown(key("ArrowLeft", extra));
  assert.deepEqual(e.state(), before);
  e.run("selected = null");
  const noSelection = key("ArrowLeft");
  canvas.onkeydown(noSelection);
  assert.equal(noSelection.prevented, undefined);
});

const touch = (id, objectId, x, y, extra = {}) => pointer(id, objectId, x, y,
  { pointerType: "touch", isPrimary: id === 1, ...extra });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

test("two touches rotate, pinch and translate the same object around their midpoint", () => {
  const e=editor(), canvas=e.control("canvas");
  e.run("add(library[0])"); const id=e.state().selected;
  canvas.onpointerdown(touch(1,id,300,300));
  canvas.onpointerdown(touch(2,id,500,300));
  assert.ok(canvas.hasPointerCapture(1)&&canvas.hasPointerCapture(2));
  canvas.onpointermove(touch(1,id,400,200));
  canvas.onpointermove(touch(2,id,400,400));
  let o=e.state().objects[0];near(o.rotation,90);near(o.scale,1);near(o.x,400);near(o.y,300);
  canvas.onpointermove(touch(1,id,400,100));
  canvas.onpointermove(touch(2,id,400,500));
  o=e.state().objects[0];near(o.rotation,90);near(o.scale,2);near(o.x,400);near(o.y,300);
  canvas.onpointerdown(touch(3,id,900,900));
  assert.equal(canvas.hasPointerCapture(3),false);
  const before=e.state();canvas.onpointermove(touch(3,id,100,100));
  canvas.listeners.pointercancel(touch(3,id));assert.deepEqual(e.state(),before);
});

test("lifting either finger resumes one-finger movement without a jump", () => {
  for(const lifted of [1,2]) {
    const e=editor(),canvas=e.control("canvas");e.run("add(library[0])");const id=e.state().selected;
    canvas.onpointerdown(touch(1,id,300,300));canvas.onpointerdown(touch(2,id,500,300));
    canvas.onpointermove(touch(1,id,400,200));canvas.onpointermove(touch(2,id,400,400));
    const before=e.state().objects[0];canvas.listeners.pointerup(touch(lifted,id));
    const remaining=lifted===1?2:1,y=remaining===1?200:400;
    canvas.onpointermove(touch(remaining,id,410,y+15));
    const after=e.state().objects[0];near(after.x,before.x+10);near(after.y,before.y+15);
    near(after.rotation,before.rotation);near(after.scale,before.scale);
    canvas.listeners.pointerup(touch(remaining,id));assert.equal(canvas.capturedPointers.size,0);
  }
});

test("touch cancellation or object deletion releases both captured fingers", () => {
 for(const ending of ['pointercancel','lostpointercapture','delete']) {
  const e=editor(),canvas=e.control("canvas");e.run("add(library[0])");const id=e.state().selected;
  canvas.onpointerdown(touch(1,id,300,300));canvas.onpointerdown(touch(2,id,500,300));
  if(ending==='delete'){e.control('delete').onclick();canvas.onpointermove(touch(1,id,310,300));}
  else canvas.listeners[ending](touch(2,id));
  assert.equal(canvas.capturedPointers.size,0);
  const before=e.state();canvas.onpointermove(touch(1,id,100,500));assert.deepEqual(e.state(),before);
 }
});

test("angle crossing and pinch limits remain finite and can be saved and reopened", async () => {
 const e=editor(),canvas=e.control('canvas');e.run('add(library[0])');const id=e.state().selected;
 const endpoint=degrees=>({x:400+100*Math.cos(degrees*Math.PI/180),y:300+100*Math.sin(degrees*Math.PI/180)});
 const p=endpoint(179);canvas.onpointerdown(touch(1,id,400,300));canvas.onpointerdown(touch(2,id,p.x,p.y));
 for(const angle of [-179,-170]){const q=endpoint(angle);canvas.onpointermove(touch(2,id,q.x,q.y));}
 near(e.state().objects[0].rotation,11);
 canvas.onpointermove(touch(2,id,10000,300));assert.equal(e.state().objects[0].scale,3);
 canvas.onpointermove(touch(2,id,402,300));assert.equal(e.state().objects[0].scale,.2);
 canvas.listeners.pointerup(touch(1,id));canvas.listeners.pointerup(touch(2,id));
 e.control('save').onclick();const saved=JSON.parse(e.run('downloads.at(-1).text'));
 e.run('validateProject')(saved,1000);
 const file=deferredFile();const opened=e.run('openProject')(e.event('project',file));file.resolve(JSON.stringify(saved));await opened;
 const reopened=e.state().objects[0];near(reopened.rotation,saved.objects[0].rotation);near(reopened.scale,saved.objects[0].scale);
});

test("coincident initial touches do not create NaN or jump on gesture start", () => {
 const e=editor(),canvas=e.control('canvas');e.run('add(library[0])');const id=e.state().selected;
 canvas.onpointerdown(touch(1,id,400,300));canvas.onpointerdown(touch(2,id,400,300));
 const before=e.state();canvas.onpointermove(touch(2,id,400,300));assert.deepEqual(e.state(),before);
 canvas.onpointermove(touch(2,id,500,300));assert.deepEqual(e.state(),before);
 canvas.onpointermove(touch(2,id,500,400));assert.ok(Number.isFinite(e.state().objects[0].rotation));
});

test("two-finger rotation can cross a full circle repeatedly without jumps", () => {
 const e=editor(),canvas=e.control('canvas');e.run('add(library[0])');const id=e.state().selected;
 canvas.onpointerdown(touch(1,id,400,300));canvas.onpointerdown(touch(2,id,500,300));
 for(let angle=45;angle<=720;angle+=45) {
  const r=angle*Math.PI/180;
  canvas.onpointermove(touch(2,id,400+100*Math.cos(r),300+100*Math.sin(r)));
  const o=e.state().objects[0];const difference=(o.rotation-angle)*Math.PI/180;
  near(Math.atan2(Math.sin(difference),Math.cos(difference)),0);
  assert.ok(o.rotation>=-180&&o.rotation<=180);near(o.x,400);near(o.y,300);near(o.scale,1);
 }
});

test("deleting or replacing composition immediately ends captured gestures", async () => {
  for (const operation of ["delete", "compose", "open"]) {
    const e = editor(), canvas = e.control("canvas");
    e.run("add(library[0])");
    const id = e.state().selected;
    canvas.onpointerdown(touch(1, id, 300, 300));
    canvas.onpointerdown(touch(2, id, 500, 300));
    if (operation === "delete") e.control("delete").onclick();
    if (operation === "compose") {
      e.control("prompt").value = "Книга, телефон";
      e.control("compose").onclick();
    }
    if (operation === "open") {
      await e.run("openProject")(e.event("project", {
        size: 1000, text: async () => JSON.stringify(project("wallet")),
      }));
    }
    assert.equal(canvas.capturedPointers.size, 0, operation);
    assert.equal(e.run("drag"), null, operation);
    const before = e.state();
    canvas.onpointermove(touch(2, id, 900, 700));
    assert.deepEqual(e.state(), before, "old move cannot change the new composition");
  }
});

test("rejected compose and invalid project leave the current gesture intact", async () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0])");
  const id = e.state().selected;
  canvas.onpointerdown(touch(1, id, 400, 300));
  e.control("prompt").value = "Книга, дракон";
  e.control("compose").onclick();
  await e.run("openProject")(e.event("project", {
    size: 3, text: async () => "bad",
  }));
  assert.equal(canvas.hasPointerCapture(1), true);
  canvas.onpointermove(touch(1, id, 410, 320));
  near(e.state().objects[0].x, 410);
  near(e.state().objects[0].y, 320);
});

test("external transform controls cancel the old gesture baseline", () => {
  for (const operation of ["rotation", "scale", "role", "size"]) {
    const e = editor(), canvas = e.control("canvas");
    e.run("add(library[0])");
    const id = e.state().selected;
    canvas.onpointerdown(touch(1, id, 300, 300));
    canvas.onpointerdown(touch(2, id, 500, 300));
    if (operation === "size") e.control("size").onchange({ target: { value: "1200 × 800" } });
    else e.control(operation).oninput({ target: {
      value: { rotation: "45", scale: "1.5", role: "background" }[operation],
    } });
    const before = e.state();
    assert.equal(canvas.capturedPointers.size, 0, operation);
    canvas.onpointermove(touch(2, id, 700, 600));
    assert.deepEqual(e.state(), before, "old pinch cannot undo external edits");
  }
});

test("owned pointer movement updates only its existing transform and suppresses native selection", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0])");
  const id = e.state().selected, transforms = [];
  const existingGroup = { setAttribute(name, value) { transforms.push([name, value]); } };
  canvas.onpointerdown(touch(1, id, 400, 300));
  canvas.querySelector = () => existingGroup;
  canvas.querySelectorAll = selector => selector.startsWith("[data-object=") ? [existingGroup] : [];
  const before = e.run("renderCalls");
  const move = touch(1, id, 425, 315);
  canvas.onpointermove(move);
  assert.equal(move.prevented, true);
  assert.equal(e.run("renderCalls"), before, "gesture does not replace the SVG subtree");
  assert.deepEqual(transforms, [["transform", "translate(425 315) rotate(0) scale(1)"]]);
  const unrelated = touch(8, id, 10, 10);
  canvas.onpointermove(unrelated);
  assert.equal(unrelated.prevented, undefined, "unowned input is left alone");
  const context = { preventDefault() { this.prevented = true; } };
  canvas.oncontextmenu(context);
  assert.equal(context.prevented, true);
});

test("Delete and Backspace remove only canvas-focused selection and preserve form editing", () => {
  for (const key of ["Delete", "Backspace"]) {
    const e = editor(), canvas = e.control("canvas");
    e.run("add(library[0])");
    const event = (target = canvas, extra = {}) => ({ key, target,
      preventDefault() { this.prevented = true; }, ...extra });
    for (const input of [event(e.control("prompt")), event(canvas, { ctrlKey: true }), event(canvas, { metaKey: true })]) {
      canvas.onkeydown(input);
      assert.equal(input.prevented, undefined);
      assert.equal(e.state().objects.length, 1);
    }
    const remove = event();
    canvas.onkeydown(remove);
    assert.equal(remove.prevented, true);
    assert.equal(e.state().objects.length, 0);
    assert.equal(e.state().selected, null);
    const empty = event(); canvas.onkeydown(empty);
    assert.equal(empty.prevented, undefined);
  }
});

test("object controls share copy/layer/delete state", () => {
  const e = editor();
  e.run("add(library[0], {rotation:179, scale:2.95}); add(library[1]); selected=objects[0].id");
  const original = e.state().objects[0];
  e.control("raise-object").onclick();
  assert.equal(e.state().objects.at(-1).id, original.id);
  e.control("lower-object").onclick();
  assert.equal(e.state().objects[0].id, original.id);
  e.control("duplicate").onclick();
  const copied = e.state().objects.at(-1);
  assert.equal(e.state().selected, copied.id);
  assert.equal(copied.asset, original.asset);
  near(copied.rotation, original.rotation); near(copied.scale, original.scale);
  e.control("delete").onclick();
  assert.equal(e.state().objects.length, 2);
  assert.ok(!e.state().objects.some(o => o.id === copied.id));
});

test("pointerdown preserves an already-selected rectangle as the native event target", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0])");
  const id = e.state().selected;
  let removals = 0, appends = 0;
  const rectangle = { dataset: { object: String(id) }, remove() { removals++; } };
  const group = { querySelector: () => rectangle, append() { appends++; } };
  canvas.querySelectorAll = selector => selector === "[data-selection]" ? [rectangle] : [];
  canvas.querySelector = () => group;
  const before = e.run("renderCalls");
  canvas.onpointerdown(touch(1, id, 400, 300));
  assert.equal(e.run("renderCalls"), before);
  assert.equal(removals, 0);
  assert.equal(appends, 0);
});


test("malformed imported JSON gives a readable error without echoing file contents", async () => {
  const e = editor();
  e.run("add(library[0])");
  const before = e.state();
  for (const [handler, input] of [["openProject", "project"], ["importPalette", "palette"]]) {
    await e.run(handler)(e.event(input, {size: 30, text: async () => "<script>alert(1)</script>"}));
    assert.equal(e.control("notice").textContent,
      "Не удалось прочитать JSON. Проверьте формат файла.");
    assert.deepEqual(e.state(), before);
  }
});


test("adding or selecting a layer ends the previous object's captured gesture", () => {
  for (const operation of ["add", "layer"]) {
    const e = editor(), canvas = e.control("canvas");
    e.run("add(library[0]); add(library[1]); selected = objects[0].id");
    const id = e.state().selected;
    canvas.onpointerdown(touch(1, id, 300, 300));
    canvas.onpointerdown(touch(2, id, 500, 300));
    if (operation === "add") e.run("add(library[2])");
    else {
      e.run("renderLayers()");
      e.control("layers").children[0].children[0].onclick();
    }
    assert.notEqual(e.state().selected, id);
    assert.equal(canvas.capturedPointers.size, 0, operation);
    assert.equal(e.run("drag"), null, operation);
    const before = e.state();
    canvas.onpointermove(touch(2, id, 900, 700));
    assert.deepEqual(e.state(), before, "old pointers cannot move a now-unselected object");
  }
});

test("over-limit composition plans preserve the current picture and gesture atomically", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0]); planComposition = () => ({assets: Array(101).fill(library[1]), unknown: []})");
  const id = e.state().selected;
  canvas.onpointerdown(touch(1, id, 400, 300));
  const before = e.state();
  e.control("compose").onclick();
  assert.deepEqual(e.state(), before);
  assert.equal(canvas.hasPointerCapture(1), true, "rejected plan preserves the gesture");
  assert.match(e.control("notice").textContent, /100.*текущая картинка сохранена/);
  canvas.onpointermove(touch(1, id, 410, 320));
  near(e.state().objects[0].x, 410);
  near(e.state().objects[0].y, 320);
});


test("large ignored project metadata cannot make the saved project impossible to reopen", async () => {
  const e = editor(), input = project();
  input.objects[0].unused = Array(120000).fill(0);
  input.palette = JSON.parse(e.run("JSON.stringify(palettes.peach)"));
  input.palette.unused = Array(120000).fill(0);
  input.background = input.palette.backgroundLight;
  const text = JSON.stringify(input), inputBytes = Buffer.byteLength(text);
  assert.ok(inputBytes < 1000000, "the supplied file is within the import limit");
  assert.ok(Buffer.byteLength(JSON.stringify(input, null, 2)) > 1000000,
    "preserving ignored metadata would make pretty-printed output exceed the limit");
  await e.run("openProject")(e.event("project", { size: inputBytes, text: async () => text }));
  assert.equal(e.control("notice").textContent, "Картинка открыта.");
  assert.deepEqual(Object.keys(e.state().objects[0]).sort(),
    ["asset", "x", "y", "rotation", "scale", "role", "id"].sort());
  assert.equal(Object.hasOwn(e.state().customPalette, "unused"), false);
  const before = e.state();
  e.control("save").onclick();
  const savedText = e.run("downloads.at(-1).text"), savedBytes = Buffer.byteLength(savedText);
  assert.ok(savedBytes < 1000000);
  e.run("objects = []; customPalette = null");
  await e.run("openProject")(e.event("project", { size: savedBytes, text: async () => savedText }));
  assert.equal(e.control("notice").textContent, "Картинка открыта.");
  const withoutIds = (objects) => objects.map(({ id, ...object }) => object);
  assert.deepEqual(withoutIds(e.state().objects), withoutIds(before.objects));
  assert.deepEqual(e.state().customPalette, before.customPalette);
});

test("palette-file imports retain only supported colors in state and saved output", async () => {
  const e = editor(), colors = JSON.parse(e.run("JSON.stringify(palettes.aqua)"));
  const supported = { ...colors };
  colors.metadata = Array(10000).fill(0);
  const text = JSON.stringify(colors), size = Buffer.byteLength(text);
  assert.ok(size < 64000);
  await e.run("importPalette")(e.event("palette", { size, text: async () => text }));
  assert.equal(e.control("notice").textContent, "Цвета обновлены.");
  assert.deepEqual(e.state().customPalette, supported);
  assert.equal(e.control("background").value, supported.backgroundLight);
  e.run("add(library[0]); saveProject()");
  const savedText = e.run("downloads.at(-1).text"), saved = JSON.parse(savedText);
  assert.deepEqual(saved.palette, supported);
  await e.run("openProject")(e.event("project", {
    size: Buffer.byteLength(savedText), text: async () => savedText,
  }));
  assert.equal(e.control("notice").textContent, "Картинка открыта.");
  assert.deepEqual(e.state().customPalette, supported);
});

function handlePointer(id, objectId, x, y, mode, extra = {}) {
  return pointer(id, objectId, x, y, {
    target: { closest: selector => selector === "[data-transform]" ? {dataset:{transform:mode}} : {dataset:{object:String(objectId)}} },
    ...extra,
  });
}
test("corner resizing anchors the opposite corner, keeps proportions and bounds scale", () => {
  for (const rotation of [0, 45, 170]) for (const mode of ["nw","ne","se","sw"]) {
    const e=editor(), canvas=e.control("canvas");
    e.run(`add(library[0], {rotation:${rotation}})`);
    const id=e.state().selected, angle=rotation*Math.PI/180;
    const cx=mode.includes("w")?-124:124, cy=mode.includes("n")?-124:124;
    const vx=cx*Math.cos(angle)-cy*Math.sin(angle), vy=cx*Math.sin(angle)+cy*Math.cos(angle);
    canvas.onpointerdown(handlePointer(1,id,400+vx,300+vy,mode));
    canvas.onpointermove(pointer(1,id,400+3*vx,300+3*vy));
    let o=e.state().objects[0];near(o.scale,2);near(o.x,400+vx);near(o.y,300+vy);
    canvas.onpointermove(pointer(1,id,400+100*vx,300+100*vy));
    o=e.state().objects[0];near(o.scale,3);near(o.x-3*vx,400-vx);near(o.y-3*vy,300-vy);
    canvas.onpointermove(pointer(1,id,400-10*vx,300-10*vy));near(e.state().objects[0].scale,.2);
    canvas.listeners.pointerup(pointer(1,id));assert.equal(canvas.capturedPointers.size,0);
  }
});
test("rotation handle supports mouse and touch, crosses angle boundary and cancels cleanly", () => {
  for (const type of ["mouse","touch"]) {
    const e=editor(),canvas=e.control("canvas");e.run("add(library[0],{rotation:170})");const id=e.state().selected;
    canvas.onpointerdown(handlePointer(1,id,300,301,"rotate",{pointerType:type}));
    canvas.onpointermove(pointer(1,id,300,299));
    let o=e.state().objects[0];assert.ok(o.rotation>170 && o.rotation<173);near(o.x,400);near(o.y,300);near(o.scale,1);
    canvas.onpointerdown(touch(2,id,700,400));assert.equal(canvas.capturedPointers.size,1,"handle retains exclusive ownership");
    canvas.listeners.pointercancel(pointer(1,id));const before=e.state();
    canvas.onpointermove(pointer(1,id,400,100));assert.deepEqual(e.state(),before);assert.equal(canvas.capturedPointers.size,0);
  }
});

test("layer drop uses visual top-first order without changing selection or object poses", () => {
  const e=editor();e.run("add(library[0]);add(library[1]);add(library[2])");
  const before=e.state(), [a,b,c]=before.objects;
  assert.equal(e.run(`reorderLayerBefore(${a.id},${c.id})`),true);
  assert.deepEqual(e.state().objects,[b,c,a]);assert.equal(e.state().selected,c.id);
  assert.equal(e.run(`reorderLayerBefore(${a.id},null)`),true);
  assert.deepEqual(e.state().objects,[a,b,c]);
  for (const [id,target] of [[a.id,null],[b.id,a.id],[a.id,a.id],[999,c.id],[a.id,999]])
    assert.equal(e.run(`reorderLayerBefore(${id},${target})`),false);
  assert.deepEqual(e.state(),before);
});
test("layer pointer cancellation and a tap do not reorder; unrelated pointers cannot end a drag", () => {
  const e=editor(),list=e.control("layers");e.run("add(library[0]);add(library[1])");
  const before=e.state(), id=before.objects[0].id;
  e.run("beginLayerDrag") (pointer(1,id,20,30),id,{});
  list.listeners.pointerup(pointer(2,id));assert.equal(list.capturedPointers.size,1);
  list.listeners.pointercancel(pointer(1,id));assert.equal(list.capturedPointers.size,0);assert.deepEqual(e.state(),before);
  e.run("beginLayerDrag")(pointer(3,id,20,30),id,{});
  list.onpointermove(pointer(3,id,22,31));list.listeners.pointerup(pointer(3,id));
  assert.deepEqual(e.state(),before);assert.equal(list.capturedPointers.size,0);
});

test("layer drop commits only on owner release and cancellation preserves order", () => {
  for (const finish of ["pointerup","pointercancel","lostpointercapture"]) {
    const e=editor(),list=e.control("layers");e.run("add(library[0]);add(library[1]);add(library[2])");
    const before=e.state(),id=before.objects[0].id;
    const rows=before.objects.slice().reverse().map((o,i)=>({dataset:{layerId:String(o.id)},
      classList:{add(){},remove(){}},getBoundingClientRect:()=>({top:100+i*50,height:50})}));
    list.querySelectorAll=selector=>selector==="[data-layer-id]"?rows:[];
    e.run("beginLayerDrag")(pointer(1,id,20,225),id,rows[2]);
    list.onpointermove(pointer(2,id,20,80));assert.deepEqual(e.state(),before);
    list.onpointermove(pointer(1,id,20,80));assert.deepEqual(e.state(),before,"preview does not mutate order");
    e.control("canvas").onpointerdown(touch(2,id));assert.equal(e.control("canvas").capturedPointers.size,0);
    list.listeners[finish](pointer(1,id));assert.equal(list.capturedPointers.size,0);
    assert.deepEqual(e.state().objects,finish==="pointerup"?[before.objects[1],before.objects[2],before.objects[0]]:before.objects);
    assert.equal(e.state().selected,before.selected);
  }
});

test("startup failures show a Russian instruction without raw browser diagnostics", async () => {
  const e=editor();await e.run("init()");
  assert.equal(e.control("notice").textContent,"Не удалось загрузить предметы. Проверьте соединение и обновите страницу.");
  assert.equal(e.run("editorReady"),false);
});


test("touch keeps the active object inside its frame despite overlapping targets", () => {
  const e = editor(), canvas = e.control("canvas");
  e.run("add(library[0]); add(library[1]); objects[0].x=400; objects[0].y=300; objects[1].x=400; objects[1].y=300; selected=objects[0].id;");
  const [active, other] = e.state().objects;
  canvas.onpointerdown(touch(1, other.id, 420, 310));
  canvas.onpointermove(touch(1, other.id, 450, 330));
  assert.equal(e.state().selected, active.id);
  assert.equal(e.state().objects[0].x, 430);
  assert.equal(e.state().objects[0].y, 320);
  assert.deepEqual(e.state().objects[1], other);
  canvas.listeners.pointerup(touch(1, other.id));
  canvas.onpointerdown({...touch(2, other.id, 700, 300), isPrimary: true});
  assert.equal(e.state().selected, other.id, "outside active frame can select another object");
});

test("touch ownership respects rotated scaled frames and desktop hit-testing", () => {
  const e=editor(), canvas=e.control("canvas");
  e.run("add(library[0]); add(library[1]); selected=objects[0].id; objects[0].x=400; objects[0].y=300; objects[0].rotation=45; objects[0].scale=0.5;");
  const [active,other]=e.state().objects;
  assert.equal(e.run("insideObjectFrame")(active,{x:480,y:300}),true);
  assert.equal(e.run("insideObjectFrame")(active,{x:460,y:360}),false);
  canvas.onpointerdown(touch(1,null,400,300));
  assert.equal(e.state().selected,active.id,"transparent area inside active frame can drag");
  canvas.listeners.pointerup(touch(1,null));
  canvas.onpointerdown(pointer(2,other.id,400,300));
  assert.equal(e.state().selected,other.id,"mouse retains direct selection");
});

test('compose executes quantities and centre placement without extra decorations',()=>{
 const e=editor();e.control('prompt').value='2 телефона и цветы по середине';
 e.control('compose').onclick();
 const result=e.state();assert.deepEqual(result.objects.map(o=>o.asset),['phone','phone','plant']);
 assert.equal(result.objects[2].x,result.w/2);assert.equal(result.objects[2].y,result.h/2);
 const before=e.state();e.control('prompt').value='101 телефон';e.control('compose').onclick();
 assert.deepEqual(e.state(),before,'oversized request keeps current composition');
});
