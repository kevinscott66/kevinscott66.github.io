#!/usr/bin/env python3
"""Validate routes, translations, metadata and media without network access."""
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys
import xml.etree.ElementTree as ET
from site_common import ROOT, ORIGIN, page_paths, route, stylesheet_url


def require(condition, message):
    if not condition:
        raise ValueError(message)


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids, self.links, self.canonicals = [], [], []
        self.alternates, self.meta = {}, {}
        self.h1 = 0
        self.lang = None
        self.video = None
        self.videos = []
        self.portraits = []
        self.switch = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'h1':
            self.h1 += 1
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'meta':
            self.meta[a.get('property', a.get('name'))] = a.get('content')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a.get('href'))
        if tag == 'link' and a.get('rel') == 'alternate':
            self.alternates[a.get('hreflang')] = a.get('href')
        if tag == 'a' and 'language' in a.get('class', '').split():
            self.switch = a.get('href')
        if tag == 'img':
            require(a.get('alt'), f'{self.path}: image without alt')
            require(all(a.get(k, '').isdigit() and int(a[k]) > 0 for k in ('width', 'height')),
                    f'{self.path}: image without intrinsic dimensions')
            if int(a['height']) > int(a['width']):
                require('portrait' in a.get('class', '').split(), f'{self.path}: portrait without full-frame class')
                self.portraits.append(a['src'])
        if tag == 'video':
            require('controls' in a, f'{self.path}: video without controls')
            self.video = []
            self.videos.append(self.video)
        if tag == 'track' and a.get('kind') == 'captions' and self.video is not None:
            self.video.append(a)
        for key in ('href', 'src', 'poster'):
            if key in a:
                self.links.append(a[key])

    def handle_endtag(self, tag):
        if tag == 'video':
            self.video = None


def check_site(root=ROOT):
    root = root.resolve()
    pages = {}
    for path in page_paths(root):
        p = Page(path.relative_to(root))
        p.feed(path.read_text())
        current = route(path, root)
        language = 'ru' if current.startswith('/ru/') else 'en'
        english = current.removeprefix('/ru') if language == 'ru' else current
        russian = '/ru' + english
        require(p.lang == language, f'{path}: wrong page language')
        require(p.h1 == 1, f'{path}: expected one h1')
        require(p.canonicals == [ORIGIN + current], f'{path}: incorrect canonical')
        require(p.alternates == {'en': ORIGIN + english, 'ru': ORIGIN + russian, 'x-default': ORIGIN + english},
                f'{path}: incorrect translation links')
        require(p.switch == (english if language == 'ru' else russian), f'{path}: incorrect language switch')
        require(len(p.ids) == len(set(p.ids)), f'{path}: duplicate IDs')
        require(stylesheet_url(root) in p.links, f'{path}: stale stylesheet version; run python3 tools/sync_assets.py')
        require(p.meta.get('og:url') == ORIGIN + current, f'{path}: incorrect Open Graph URL')
        require(p.meta.get('og:image') == f'{ORIGIN}/assets/og-{language}.png', f'{path}: incorrect Open Graph image')
        for key in ('description', 'og:title', 'og:description', 'og:image:alt'):
            require(p.meta.get(key), f'{path}: missing {key}')
        for tracks in p.videos:
            require(any(t.get('srclang') == language for t in tracks), f'{path}: video missing {language} captions')
        pages[path.resolve()] = p

    for path, page in pages.items():
        for href in page.links + [page.meta['og:image']]:
            u = urlsplit(href)
            if u.netloc and u.netloc != urlsplit(ORIGIN).netloc:
                continue
            if u.scheme and u.scheme not in ('http', 'https'):
                continue
            target = (root / unquote(u.path.lstrip('/'))) if u.path.startswith('/') else (path.parent / unquote(u.path))
            if not u.path:
                target = path
            if target.is_dir():
                target /= 'index.html'
            target = target.resolve()
            require(target.is_relative_to(root), f'{page.path}: outside tree {href}')
            require(target.is_file(), f'{page.path}: missing asset/page {href}')
            if u.fragment and target in pages:
                require(unquote(u.fragment) in pages[target].ids, f'{page.path}: missing anchor {href}')
            if target.suffix == '.vtt':
                require(target.read_text().startswith('WEBVTT'), f'{target}: invalid caption file')
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = [e.text for e in ET.parse(root / 'sitemap.xml').findall('s:url/s:loc', ns)]
    expected = {ORIGIN + route(path, root) for path in pages}
    require(len(urls) == len(expected) and set(urls) == expected, 'Sitemap routes do not match public pages')
    for language in ('en', 'ru'):
        require((root / f'assets/alexander-pavlovich-{language}.pdf').read_bytes().startswith(b'%PDF-'), 'Invalid profile PDF')
    return len(pages)


if __name__ == '__main__':
    try:
        print(f'PASS: {check_site()} pages; routes, translations, metadata, media and CSS version')
    except (ValueError, OSError, ET.ParseError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        sys.exit(1)
