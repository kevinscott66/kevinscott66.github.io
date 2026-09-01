# dobropalm.tech

Source for [dobropalm.tech](https://dobropalm.tech) — a single static page, no build step
and no runtime dependencies beyond Google Fonts.

- `index.html` — the entire site: markup, styles and behaviour in one file
- `CNAME` — custom domain for GitHub Pages
- `.nojekyll` — serve files as-is, skip Jekyll processing

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Licence

MIT — see [LICENSE](LICENSE).
