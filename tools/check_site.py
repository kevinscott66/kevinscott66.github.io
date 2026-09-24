#!/usr/bin/env python3
"""Check the published static tree with Python's standard library."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links = path, [], []
        self.h1 = self.canonical = 0
        self.lang = None
        self.videos = self.captions = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'h1':
            self.h1 += 1
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical += 1
        if tag == 'img':
            assert a.get('alt'), f'{self.path}: image without alt'
        if tag == 'video':
            self.videos += 1
            assert 'controls' in a, f'{self.path}: video without controls'
        if tag == 'track' and a.get('kind') == 'captions':
            self.captions += 1
        for key in ('href', 'src', 'poster'):
            if key in a:
                self.links.append(a[key])


pages = {}
for path in [ROOT / 'index.html', ROOT / 'ru/index.html', *ROOT.glob('case-studies/*/index.html'), *ROOT.glob('ru/case-studies/*/index.html')]:
    p = Page(path.relative_to(ROOT))
    p.feed(path.read_text())
    assert p.lang in ('en', 'ru'), f'{path}: language missing'
    assert p.h1 == 1 and p.canonical == 1, f'{path}: h1/canonical count'
    assert len(p.ids) == len(set(p.ids)), f'{path}: duplicate IDs'
    assert p.captions == p.videos, f'{path}: video caption track missing'
    pages[path.resolve()] = p
assert len(pages) == 8, f'Expected 8 public pages, got {len(pages)}'
for path, page in pages.items():
    for href in page.links:
        u = urlsplit(href)
        if u.scheme or u.netloc:
            continue
        target = (ROOT / unquote(u.path.lstrip('/'))) if u.path.startswith('/') else (path.parent / unquote(u.path))
        if not u.path:
            target = path
        if target.is_dir():
            target /= 'index.html'
        target = target.resolve()
        assert target.is_relative_to(ROOT), f'{page.path}: outside tree {href}'
        assert target.is_file(), f'{page.path}: missing asset/page {href}'
        if u.fragment and target in pages:
            assert unquote(u.fragment) in pages[target].ids, f'{page.path}: missing anchor {href}'
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = ET.parse(ROOT / 'sitemap.xml').findall('s:url/s:loc', ns)
assert len(urls) == len(pages), 'Sitemap coverage'
for lang in ['en', 'ru']:
    assert (ROOT / f'assets/alexander-pavlovich-{lang}.pdf').read_bytes().startswith(b'%PDF-')
print(f'PASS: {len(pages)} pages; local links, anchors, media, captions, languages and sitemap')
