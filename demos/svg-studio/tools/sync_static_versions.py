"""Version demo resources by content, so repeat visitors receive matching UI files."""
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FILES = ("style.css", "engine.js", "svg-safety.js", "app.js")


def sync():
    for filename, resources in (("index.html", FILES), ("privacy.html", ("style.css",))):
        sync_page(ROOT / filename, resources)


def sync_page(page, resources):
    text = page.read_text()
    for name in resources:
        version = sha256((ROOT / name).read_bytes()).hexdigest()[:12]
        text, count = re.subn(
            r'((?:href|src)=")' + re.escape(name) + r'(?:\?v=[a-zA-Z0-9]+)?(?=")',
            lambda match: match[1] + name + "?v=" + version, text)
        if count != 1:
            raise ValueError(f"Expected one reference to {name}, found {count}")
    if page.read_text() != text:
        page.write_text(text)


if __name__ == "__main__":
    sync()
