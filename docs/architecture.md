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

## Audience-first presentation (25 September 2026)

The home prioritizes client problems and concrete capabilities: Agent, VahtaHoz, KOM17, then AirChat and DeLabs. Collaboration explicitly seeks a developer partner, as confirmed by the owner. The four-step client process sets expectations without invented price or delivery promises. Engineering evidence remains in case studies. See [audience-check.md](audience-check.md) for human research questions and outstanding demo evidence.

`delabs-walkthrough.mp4` is a 23.52-second read-only recording from the public activity table to a guide and its steps, captured25 September2026. Original recording trimmed to remove initial loading; no product UI or result synthesized. Matching bilingual captions and a real screenshot poster are provided. No wallet connected or activity performed. Previous demo assets retained for existing links.

## Viora demo captures (13 October 2026)

Viora home/player PNGs render the actual public Flutter UI through a disposable local harness. Three track titles/artists are fictional, the covers are original generated demo art, and a non-executing audio adapter simulates playing at 60/180 seconds. No audio was played or published. The owner explicitly requested this staged state. No personal library, lyrics, artwork or device data was used. The screenshot caption and alt text disclose the synthetic data. The home frame is retained at its intrinsic 390/844 ratio.

## Profile presentation (13 October 2026)

The Russian homepage PDF links serve the 11-slide Gamma presentation “Александр Павлович — проекты и сотрудничество”, authored in first person with real project screenshots and credited Unsplash photographs. Viora uses fictional demo records. The existing Russian PDF route is retained; the English route serves the corresponding English presentation. Native Gamma version: https://gamma.app/docs/es55d4hmer0z7jf. PDF is static.

Both language presentations use the Viora home screenshot (390×844) instead of the full player. The English deck retains the six-project structure and the credited decorative photos.

Project slides link to the five public repositories and, where available, the VahtaHoz app, AirChat web app, KOM17 Telegram bot and DeLabs website. No repository URL is invented for DeLabs; Agent and Viora have no public application endpoint in the presentation. Links are exported as PDF annotations.

## Isolated SVG test demo (26 October 2026)

`/demos/svg-studio/` is an isolated, noindex browser application for the Snapbuild selection task. Portfolio pages, navigation and shared stylesheet are unchanged. Unlike the content pages, this route uses local runtime JavaScript for the SVG editor; it introduces no build system, package dependency, backend, analytics or third-party API.

The demo uses 40 supplied vector files: ten objects, S/L, main/background. The source artwork is employer-provided test material and excluded from the portfolio MIT licence (`ASSET-NOTICE.md`). Preview overlays identify the demo and watermark it; editable SVG export remains clean. Assets necessarily download to the browser and are not protected against copying. Input files stay client-side. A CSP restricts resources to the same origin and disables object embedding; the importer removes active/external SVG content and limits input size. This is not a publicly supported upload service.

Meaning matching is deterministic via the documented tag dictionary, with editable layouts and three source palettes. No LLM key or generation endpoint is used. `README.md` in the route documents assumptions, limitations, local start, examples and checks. The route is intentionally omitted from sitemap and homepage navigation; noindex is an indexing preference, not access control.

The SVG demo was subsequently refactored with independent editor, matching, logic and security reviews. SVG attribute validation now lives in `svg-safety.js`, loaded before the editor. Only supported attributes, safe colors and local fragment references survive import; root namespace and duplicate IDs are checked. The standalone-export external-resource bypass found in static review was addressed at this shared boundary and exercised through actual browser import/duplicate/export. Project imports validate supported dimension pairs and foreground/background separation before state changes.

The final visual reference is Higgsfield's creative workspace: dark surfaces, floating graphite panels, lime action accent, a central composition and a description dock beneath it. UI UX Pro Max guidance was used for readable hierarchy, focus/contrast and responsive interaction. No Higgsfield branding, media, remote fonts or generation services are embedded. The UI starts with a real bundled example and uses simple Russian action labels; technical import controls are under Additional options. Preview watermark is the plain dobropalm name; it is not output protection. The source-provided illustration licence remains separate.

Предрелизная приёмка SVG Studio: `demos/svg-studio/QA.md`. Файловые чтения используют токены актуальности; интерфейс и формат проекта имеют общие лимиты.

Подбор SVG Studio разделён в `planComposition`: явные имена без дополнительных объектов, затем локальные смысловые правила для ограниченных тем. `compositionPositions` размещает длинные списки сеткой. Универсальная языковая модель не используется.

Адаптивный редактор SVG Studio: breakpoint-поведение и проверка перечислены в demos/svg-studio/RESPONSIVE.md. Перемещение привязано к pointerId, клавиатурное перемещение ограничено фокусом холста; экспорт удаляет служебные атрибуты доступности.

Четыре SVG монеты содержат дополнительную векторную подложку по существующему замкнутому контуру боковой грани, устраняющую отсутствующую исходную заливку боковой грани. Происхождение и регрессии: demos/svg-studio/README.md и QA.md; остальные36assetвариантов не менялись.

Название редактора — «Слойра». В шапке собственный SVG-логотип с геометрическим начертанием и лаймовым знаком над «й»; основной системный шрифт интерфейса сохранён. Сторонние шрифты не загружаются. Логотип декоративный для screenreader, ссылка имеет явное имя.

SVG Studio версионирует CSS/JS по хешу содержимого через demos/svg-studio/tools/sync_static_versions.py; тест контролирует ссылки в HTML. Каталог/SVG запрашиваются с cache:no-cache для условной перепроверки. Это устраняет смешение новой разметки и старого кэша после релиза.

Редактор SVG поддерживает жест из двух touch Pointer Events: карта двух pointerId, исходная пара/поза объекта и накопленный угол, нормализация угла, ограниченный scale и координаты. При отпускании пальца состояние переносится в одиночный drag; системная отмена освобождает весь жест. Multi-touch тестируется через настоящие обработчики в NodeVM, аппаратная проверка отдельно.

Падающая тень монеты вынесена в единую SVG-группу opacity0.24 позади корпуса; подложка покрывает только боковую грань, чтобы не создавать белый слой под полупрозрачной тенью. Генератор в tools/repair_coin_opacity.py сохраняет набор атрибутов исходных путей, меняя только группировку/порядок тени.
