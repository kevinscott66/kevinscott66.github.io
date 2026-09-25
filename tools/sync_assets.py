#!/usr/bin/env python3
"""Refresh CSS version references after editing styles; never changes page content."""
import re
from site_common import ROOT, page_paths, stylesheet_url


def sync(root=ROOT):
    updates = []
    for path in page_paths(root):
        old = path.read_text()
        new, count = re.subn(r'/assets/site\.css(?:\?v=[a-zA-Z0-9]+)?(?=")', stylesheet_url(root), old)
        if count != 1:
            raise ValueError(f'{path}: expected exactly one stylesheet reference')
        if new != old:
            updates.append((path, new))
    # Validate all pages before writing any of them.
    for path, content in updates:
        path.write_text(content)
    return len(updates)


if __name__ == '__main__':
    print(f'Updated CSS version in {sync()} pages')
