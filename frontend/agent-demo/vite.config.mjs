import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
export default defineConfig({
  plugins: [
    preact(),
    {
      name: "license-notices",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "PREACT-LICENSE.txt",
          source: readFileSync(
            new URL("./node_modules/preact/LICENSE", import.meta.url),
            "utf8",
          ),
        });
      },
    },
  ],
  base: "/demos/agent/",
  resolve: {
    alias: {
      "react-dom/client": "preact/compat/client",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
      react: "preact/compat",
    },
  },
  build: { outDir: "../../demos/agent", emptyOutDir: true, target: "es2019" },
});
