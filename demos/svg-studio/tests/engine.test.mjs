import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
const base = new URL("../", import.meta.url);
const code = await readFile(new URL("engine.js", base), "utf8");
const { chooseAssets, validatePalette, palettes } = await import(
  "data:text/javascript," +
    encodeURIComponent(
      code + ";export {chooseAssets,validatePalette,palettes};",
    )
);
const lib = JSON.parse(
  await readFile(new URL("assets/library.json", base), "utf8"),
);
test("explicit component names survive Russian inflections", () => {
  const ids = chooseAssets("Книга, наушники и кошелек", lib).map((x) => x.id);
  assert.deepEqual(ids.slice(0, 3), ["book", "headphones", "wallet"]);
});
test("metaphor uses meaning tags and never unknown generated art", () => {
  const ids = chooseAssets("Рост знаний и новые идеи", lib).map((x) => x.id);
  for (const id of ["book", "plant", "lamp"]) assert.ok(ids.includes(id), id);
  assert.equal(chooseAssets("zxqv123", lib).length, 0);
});
test("all preset palettes respect background/object separation", () => {
  for (const p of Object.values(palettes))
    assert.equal(validatePalette(p), true);
  assert.throws(() =>
    validatePalette({
      ...palettes.lavender,
      backgroundLight: palettes.lavender.primary,
    }),
  );
  assert.throws(() => validatePalette({ backgroundLight: "red" }));
});
test("every object has real S/L and main/background source assets", async () => {
  for (const a of lib)
    for (const size of ["S", "L"])
      for (const role of ["main", "background"]) {
        const svg = await readFile(
          new URL(a.variants[size][role], base),
          "utf8",
        );
        assert.ok(svg.includes("<svg") || svg.includes(":svg"));
        assert.ok(svg.includes("viewBox="));
        assert.ok(!svg.includes("<image"));
      }
});

test("invalid palette shapes report a usable validation error", () => {
  for (const palette of [null, undefined, [], "#ffffff", 42]) {
    assert.throws(() => validatePalette(palette), /Нужна палитра/);
  }
  for (const color of [null, 123456, "#fff", "#12345g", " #123456"])
    assert.throws(
      () => validatePalette({ ...palettes.peach, ink: color }),
      /Нужен цвет ink/,
    );
});

test("palette separation is case insensitive and permits shared paper", () => {
  assert.throws(
    () =>
      validatePalette({
        ...palettes.peach,
        backgroundDark: palettes.peach.primary.toUpperCase(),
      }),
    /фоновую палитру/,
  );
  assert.equal(
    validatePalette({ ...palettes.peach, backgroundLight: "#FFFFFF" }),
    true,
  );
});

test("empty or short-only prompts return no matches", () => {
  for (const prompt of ["", "  ", "и в на", "!? 12"])
    assert.deepEqual(chooseAssets(prompt, lib), []);
  assert.deepEqual(chooseAssets("книга", []), []);
});

test("matching normalizes case and ё without mutating the library", () => {
  const original = JSON.stringify(lib);
  assert.deepEqual(chooseAssets("КОШЕЛЁК", lib), chooseAssets("кошелек", lib));
  assert.equal(JSON.stringify(lib), original);
});

test("semantic matching is deterministic and does not add unknown objects", () => {
  assert.deepEqual(chooseAssets("рост знаний", lib), chooseAssets("рост знаний", lib));
  assert.ok(chooseAssets("рост знаний", lib).every(asset => lib.includes(asset)));
});
