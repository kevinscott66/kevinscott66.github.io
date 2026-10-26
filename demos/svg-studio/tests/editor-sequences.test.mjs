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
      value: id === "scheme" ? "lavender" : "", textContent: "",
      addEventListener() {},
    });
    return controls.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: control, querySelectorAll: () => [] },
    initialLibrary: library,
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
