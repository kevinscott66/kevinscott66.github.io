# Portfolio architecture and editorial rules

The website is a static GitHub Pages tree. There is no application backend or build step. English routes are rooted at `/`; Russian equivalents use `/ru/`. Each of the three cases has its own directory and `index.html`. Shared CSS is in `assets/site.css`; no JavaScript is required for content, navigation or language switching.

## Publishing

`main` is served through the existing custom domain. Run `python3 tools/check_site.py`, check both languages at desktop/mobile widths, verify the PDFs visually and confirm media playback before publishing. Check GitHub Actions and the public HTTPS response after deployment. Stylesheet URLs include `?v=` followed by the first 12 characters of the CSS SHA-256; run `python3 tools/sync_assets.py` to update all eight references when CSS changes. The static checker enforces this to avoid new HTML using cached, incompatible image styles.

## Maintenance tools

`tools/site_common.py` defines the supported languages, cases, routes and stylesheet hash. HTML remains hand-editable and deployable as-is: tools are development checks, not a site build. `sync_assets.py` validates all references before writing and is idempotent. `check_site.py` checks exact sitemap/canonical routes, reciprocal language links, language-specific metadata, per-video caption tracks, intrinsic image dimensions and full-frame portrait classes. `test_site.py` exercises common publication failures in temporary copies. Both check commands run in CI.

CSS uses readable blocks and explicit `portrait` image classes. Shared full-frame rules override landscape previews for phone screenshots, including in case studies and product cards. Original media and bilingual copy are preserved.

## Content ownership

Project repositories own implementation facts. Portfolio case studies summarize them and link to reviewed source revisions. Biography and personal responsibility come from the owner, not commit volume. Public snapshot dates must not be presented as the beginning of all development. Keep outcome claims distinct from planned improvements and unmeasured business metrics.

The owner directs product logic, architecture and final outcomes; AI tools are used in code development. KOM17 is the owner's own product, first built as a monolith and later modularized. Do not describe it as an inherited system. Omit unfinished transport features from promotional copy until implementation is verified.

## Media provenance

Captured 24 September 2026:

- AirChat: public web onboarding in a clean browser; no account, messages or seed phrase.
- DeLabs: public project catalog and activity guides; no account.
- VahtaHoz: clean public entry screen; no operational records.
- Agent: actual public-source Preact dashboard, local build of reviewed source, with API fixtures. Every role is paused, autonomy locked, provider actions disconnected; the image and video carry a demo label. Counters are not production metrics.
- KOM17: authored diagram of the documented post-cutover request path, not a UI screenshot.

Videos are silent MP4 with English/Russian WebVTT explanation tracks and transcript-like descriptions beside the controls. Posters and `preload="none"` avoid fetching video on initial load. Browser captures use WebP; owner screenshots retain original JPEG; Open Graph uses 1200×630 PNG. PDF profiles have selectable text and clickable product links.

## Limits

Working accounts, production logs and private operational details stay out of the public tree. No analytics or contact form is added; contact links use Telegram/email. Keep services' own release and availability requirements distinct from the portfolio release.

### Owner-provided mobile screenshots (24 September 2026)

The home project cards and three cases use original JPEG screenshots supplied by the owner: AirChat profile, KOM17 daily bonus, Agent Telegram dashboard and native iPhone menu. Images are copied without alteration; CSS preserves the full frame. Dashboard counts are capture-time interface values, not independently measured impact. Previous isolated Agent fixtures remain only as the explicitly labelled video/poster. Other original public captures remain available. The owner explicitly approved publication of all nine supplied screenshots. Seven visually clear screens were selected: the four above, AirChat contact card, VahtaHoz inventory and settings. Screens 4 and 6 were omitted because Telegram overlays obscure the presentation and their conversations require extra context. Operational values are screenshot contents, not portfolio impact metrics.

## Commit attribution

The author remains `kevinscott66` with the exact owner noreply address. GitHub rebase may set the committer display name to `Alexander Pavlovich`; this is accepted only with that same owner address. GitHub platform commits remain allowed. Additional author trailers are rejected. This does not authorize another account.
