# COREVERSE frontend

The portfolio is prerendered into the existing English `/` and Russian `/ru/` pages. GitHub Pages serves committed HTML and assets; Node is only needed to rebuild. All content and project links are available before JavaScript. React hydrates controls, and Three.js loads as a separate scene chunk. Reduced-motion, simple mode and WebGL failure retain the HTML experience.

## Rebuild

```sh
cd frontend
npm ci --ignore-scripts
npm run build
npm test
cd agent-demo
bun install --frozen-lockfile
npm run build
cd ../..
python3 tools/check_site.py
python3 tools/test_site.py
```

`src/projects.js` owns portfolio project text and links. Components own the page sections; `Scene.jsx` owns the disposable Three.js renderer; `core-geometry.js` owns model construction; `camera-path.js` owns reversible section-relative camera timing. `templates/` preserves canonical and translated metadata. Do not edit generated homepage bodies or hashed bundles directly.

## Agent demo

`agent-demo/src` is an isolated copy of the owner's MIT-licensed Mini App UI from ai-agents commit 398f84371fb867a878f9e6c1999aebe09c1caf29. Only this copy changes: Telegram bootstrap, local transport, five full-width tabs, theme and demo labels. The original application and access-control backend are unchanged.

`demo-engine.ts` runs a local Web Worker calculation, produces an approval, and updates in-memory tasks and event logs. Role rows are illustrative local roles, not remote model processes. No model provider, Telegram backend, credentials or production tasks are connected. The CSP prohibits network connections. Reload resets the session. Admin controls apply exclusively to this local adapter. The five supported sections are overview, tasks, approvals, agents and logs; other product modules are outside this demo.

The dated portrait video is an actual browser recording of this demo, with caption tracks; it is not a recording of live production agents. The previous video is retained as an asset but no longer featured. Re-record after visual or workflow changes; don't replace the video with a generated simulation.

## Image optimization

Original captures stay at their existing public URLs and remain the targets of full-image links. Display images use WebP quality86 variants at up to320/640/960/1440pixels, capped at the original width and preserving the full frame/aspect ratio. `srcset`/`sizes` let the browser choose for viewport and pixel density; below-fold captures keep lazy loading and decode asynchronously. The Agent chapter retains the original dashboard capture, not the new Mini App poster. Video/demo stay updated.

To regenerate derivatives after replacing an original: install `tools/requirements-images.txt`, run `python3 tools/optimize_images.py`, then rebuild the frontend and run publication checks. The encoder tool writes the shared manifest and the six static case pages; homepages consume it through `ImageAsset`. Do not crop originals or replace those original URLs with lossy files.
