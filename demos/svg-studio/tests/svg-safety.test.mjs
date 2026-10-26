import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
const source = await readFile(
  new URL("../svg-safety.js", import.meta.url),
  "utf8",
);
const context = vm.createContext({});
vm.runInContext(source, context);
const safe = (name, value) =>
  vm.runInContext(
    `safeSvgAttribute(${JSON.stringify(name)}, ${JSON.stringify(value)})`,
    context,
  );
test("drops escaped external cursor and unknown CSS-bearing attributes", () => {
  for (const value of [
    "u\\72l(https://example.invalid/tracker.cur), auto",
    "url(https://example.invalid/a)",
    "url(/**/https://example.invalid/a)",
  ])
    assert.equal(safe("cursor", value), null);
  assert.equal(safe("style", "fill:red"), null);
  assert.equal(safe("onclick", "alert(1)"), null);
  assert.equal(safe("xml:base", "https://example.invalid"), null);
});
test("paint and effects accept only safe colors or local fragment URLs", () => {
  for (const name of [
    "fill",
    "stroke",
    "clip-path",
    "mask",
    "filter",
    "marker-start",
  ]) {
    for (const value of [
      "u\\72l(https://example.invalid/a)",
      "url(https://example.invalid/a)",
      "url(//example.invalid/a)",
      "url(data:text/html,x)",
      "var(--foreign)",
    ])
      assert.equal(safe(name, value), null, `${name}:${value}`);
    assert.equal(safe(name, `url( '#gradient' )`), "url(#gradient)");
    assert.equal(safe(name, 'url("#gradient")'), "url(#gradient)");
  }
  for (const color of [
    "#FFE3E1",
    "white",
    "none",
    "rgb(12, 20, 30)",
    "rgba(12,20,30,.5)",
  ])
    assert.equal(safe("fill", color), color);
});
test("hrefs never point outside the SVG and reference normalization is stable", () => {
  for (const name of ["href", "xlink:href"]) {
    assert.equal(safe(name, "#symbol"), "#symbol");
    for (const value of [
      "https://example.invalid",
      "javascript:alert(1)",
      "data:image/svg+xml,x",
      "#bad id",
    ])
      assert.equal(safe(name, value), null);
  }
  assert.equal(safe("gradientTransform", "rotate(45)"), "rotate(45)");
  assert.equal(safe("stop-color", "#ABCDEF"), "#ABCDEF");
});
test("SVG geometry and original Figma IDs survive attribute validation", () => {
  assert.equal(safe("id", "Книга 2"), "Книга 2");
  assert.equal(safe("d", "M 0 0 L 20 20 Z"), "M 0 0 L 20 20 Z");
  assert.equal(safe("viewBox", "0 0 200 300"), "0 0 200 300");
});

test("local paint references retain safe fallback colors", () => {
  assert.equal(safe("fill", 'url("#gradient") red'), "url(#gradient) red");
  assert.equal(safe("stroke", "url(#missing) #fff"), "url(#missing) #fff");
  assert.equal(
    safe("fill", "url(#gradient) u\\72l(https://example.invalid/a)"),
    null,
  );
});


test("cloned artwork references stay inside their own instance", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const scope = vm.createContext({});
  vm.runInContext(app.slice(app.indexOf("function rewriteLocalReferences("),
    app.indexOf("function cloneArtwork(")), scope);
  const rewrite = vm.runInContext("rewriteLocalReferences", scope);
  const ids = new Map([["gradient", "o1-id-0"]]);
  assert.equal(rewrite("#gradient", ids, "href"), "#o1-id-0");
  assert.equal(rewrite("#canvas", ids, "href"), null);
  assert.equal(rewrite("#o2-id-0", ids, "xlink:href"), null);
  assert.equal(rewrite("url(#gradient)", ids, "fill"), "url(#o1-id-0)");
  assert.equal(rewrite("url(#canvas)", ids, "mask"), "none");
  assert.equal(rewrite("url(#foreign) #fff", ids, "fill"), "#fff");
  assert.equal(rewrite("#fff", ids, "fill"), "#fff");
});


test("oversized SVG text is rejected before the XML parser is invoked", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  let parsed = false;
  const scope = vm.createContext({DOMParser: class {
    parseFromString() { parsed = true; throw Error("parser must not run"); }
  }});
  vm.runInContext(app.slice(app.indexOf("function cleanSVG("),
    app.indexOf("function palette(")), scope);
  const clean = vm.runInContext("cleanSVG", scope);
  assert.throws(() => clean("x".repeat(2000001)), /SVG слишком большой/);
  assert.equal(parsed, false);
});
