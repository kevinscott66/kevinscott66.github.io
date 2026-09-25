"""Shared static-site paths and content-version helpers (standard library only)."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://dobropalm.tech'
LANGUAGES = ('en', 'ru')
CASES = ('agent', 'airchat', 'kom17')


def page_paths(root=ROOT):
    for language in LANGUAGES:
        base = root / ('ru' if language == 'ru' else '')
        yield base / 'index.html'
        for case in CASES:
            yield base / 'case-studies' / case / 'index.html'


def route(path, root=ROOT):
    relative = path.relative_to(root).as_posix()
    return '/' + relative.removesuffix('index.html')


def stylesheet_url(root=ROOT):
    version = sha256((root / 'assets/site.css').read_bytes()).hexdigest()[:12]
    return f'/assets/site.css?v={version}'
