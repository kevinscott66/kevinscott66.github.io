# dobropalm.tech

[Русский README](README.ru.md)

[![Static site checks](https://github.com/kevinscott66/kevinscott66.github.io/actions/workflows/site-checks.yml/badge.svg)](https://github.com/kevinscott66/kevinscott66.github.io/actions/workflows/site-checks.yml) · [MIT](LICENSE)

Alexander Pavlovich's product portfolio: AI assistants, messaging, community platforms, research and field software.

**[English](https://dobropalm.tech)** · **[Русский](https://dobropalm.tech/ru/)** · [GitHub profile](https://github.com/kevinscott66)

## What is here

- Outcome-led homepage and three detailed case studies in English and Russian.
- Product screenshots, two short captioned demos and architecture diagrams.
- A concise professional profile in PDF, in both languages.
- Source evidence, explicit limitations and links to real products and CI.

Agent footage uses the actual UI with labelled sample data and disabled execution. DeLabs footage records the public site. Additional mobile screenshots were supplied and approved for publication by the owner.

## Quick start

```bash
git clone https://github.com/kevinscott66/kevinscott66.github.io.git
cd kevinscott66.github.io
python3 tools/check_site.py
python3 -m http.server 8000 --bind 127.0.0.1
# Open http://127.0.0.1:8000 and /ru/
```

No build, framework, package installation or runtime JavaScript is required. Fonts are loaded from Google Fonts with system fallbacks.

## Structure

- `index.html`, `ru/index.html`: homepages.
- `case-studies/`, `ru/case-studies/`: Agent, AirChat and KOM17.
- `assets/site.css`: shared responsive styles.
- `assets/media/`: screenshots, architecture image, videos and WebVTT captions.
- `assets/`: bilingual PDF profiles and Open Graph images.
- `tools/`: shared routes, CSS version synchronization and static publication checks.
- `sitemap.xml`, `robots.txt`, `CNAME`, `.nojekyll`: GitHub Pages configuration.

## Editing styles

After changing `assets/site.css`, run:

```bash
python3 tools/sync_assets.py
python3 tools/check_site.py
python3 tools/test_site.py
```

This updates the CSS version on every page so returning browsers receive the correct layout. Use `class="portrait"` for full-frame mobile screenshots, with original width/height attributes. Keep translations and their language-switch targets aligned.

## Deployment & changes

GitHub Pages publishes `main`. Check the static-site and attribution workflows, then verify the public routes and media. Keep both language versions aligned. Preserve source evidence and distinguish demo fixtures from live operational data.

[Changelog](CHANGELOG.md) · [Architecture and editorial rules](docs/architecture.md) · [Security disclosure](SECURITY.md)

Project milestones are not employment dates. Some source repositories are public snapshots rather than full development histories. Portfolio releases describe this website, not a certification or stable release of the featured applications.

## License

MIT - [LICENSE](LICENSE). Featured projects retain their own licenses. Screenshots document the linked products; third-party marks remain their owners' property.
