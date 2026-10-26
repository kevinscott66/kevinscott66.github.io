import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
const base = new URL("../", import.meta.url),
  app = await readFile(new URL("app.js", base), "utf8"),
  engine = await readFile(new URL("engine.js", base), "utf8") + "\n" + await readFile(new URL("composition-agent.js", base), "utf8"),
  library = JSON.parse(
    await readFile(new URL("assets/library.json", base), "utf8"),
  );
const context = vm.createContext({});
vm.runInContext(
  engine +
    `;const library=${JSON.stringify(library)};` +
    // Load production limits together with the production validator.
    app.slice(app.indexOf("const MAX_OBJECTS ="), app.indexOf("let editorReady =")) +
    app.slice(
      app.indexOf("function validateProject("),
      app.indexOf("async function openProject("),
    ),
  context,
);
const validate = (p) => {
  context.project = p;
  return vm.runInContext("validateProject(project, 500)", context);
};
const valid = JSON.parse(
  await readFile(new URL("examples/learning.json", base), "utf8"),
);
test("bundled example projects remain valid", async () => {
  for (const name of ["learning", "music", "finance"]) {
    const p = JSON.parse(
      await readFile(new URL(`examples/${name}.json`, base), "utf8"),
    );
    assert.doesNotThrow(() => validate(p));
  }
});
test("invalid input does not bypass dimension or asset guards", () => {
  for (const p of [
    null,
    [],
    { ...valid, w: 1200, h: 600 },
    { ...valid, w: 600, h: 800 },
    { ...valid, objects: [null] },
    { ...valid, objects: [{ ...valid.objects[0], asset: "unknown" }] },
    { ...valid, objects: [{ ...valid.objects[0], scale: Infinity }] },
  ])
    assert.throws(() => validate(p), /Неподдерживаемый проект|Некорректный объект/);
});
test("import cannot bypass background/color or own-scheme checks", () => {
  assert.throws(() => validate({ ...valid, background: "#F9ECB0" }), /Этот цвет уже/);
  assert.throws(() => validate({ ...valid, scheme: "constructor" }), /Некорректная палитра/);
  assert.throws(() =>
    validate({
      ...valid,
      palette: { primary: "javascript:x" },
    }),
    /Нужен цвет/,
  );
});


test("maximum-size automatic layout remains a reopenable project", () => {
  const positions = vm.runInContext("compositionPositions(100, 800, 600)", context);
  const p = { ...valid, w: 800, h: 600,
    objects: positions.map((position) => ({...valid.objects[0], ...position})) };
  assert.equal(p.objects.length, 100);
  assert.doesNotThrow(() => validate(p));
});
