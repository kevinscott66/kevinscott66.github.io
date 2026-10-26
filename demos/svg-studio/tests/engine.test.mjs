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
