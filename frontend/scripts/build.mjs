import { build } from "vite";
import react from "@vitejs/plugin-react";
import { build as bundle } from "esbuild";
import { readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url)),
  repo = path.resolve(root, "..");
await build({
  root,
  base: "/assets/coreverse/",
  plugins: [react()],
  build: {
    outDir: path.join(repo, "assets/coreverse"),
    emptyOutDir: true,
    assetsDir: "",
    manifest: true,
  },
});
const generated = await readFile(
  path.join(repo, "assets/coreverse/index.html"),
  "utf8",
);
const tags = generated
  .match(/<(?:script|link)\b[^>]*(?:><\/script>|>)/g)
  .join("\n");
await mkdir(path.join(root, ".build"), { recursive: true });
await bundle({
  entryPoints: [path.join(root, "src/server.jsx")],
  outfile: path.join(root, ".build/server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  jsx: "automatic",
});
const { render } = await import("../.build/server.mjs?" + Date.now());
for (const lang of ["en", "ru"]) {
  const template = await readFile(
    path.join(root, `templates/${lang}.html`),
    "utf8",
  );
  await writeFile(
    path.join(repo, lang === "ru" ? "ru/index.html" : "index.html"),
    template.replace("<!-- COREVERSE_ASSETS -->", tags) +
      `<div id="root">${render(lang)}</div>\n</body></html>\n`,
  );
}
await rm(path.join(repo, "assets/coreverse/index.html"));
const notices = [];
for (const p of ["react", "react-dom", "three", "lucide-react"]) {
  try {
    notices.push(
      p +
        "\n" +
        (await readFile(path.join(root, "node_modules", p, "LICENSE"), "utf8")),
    );
  } catch {
    notices.push(
      p +
        "\n" +
        (await readFile(
          path.join(root, "node_modules", p, "LICENSE.txt"),
          "utf8",
        )),
    );
  }
}
await writeFile(
  path.join(repo, "assets/coreverse/THIRD-PARTY.txt"),
  notices.join("\n\n"),
);
await rm(path.join(root, ".build"), { recursive: true });
