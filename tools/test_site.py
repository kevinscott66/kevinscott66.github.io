"""Regression checks for publication mistakes, using temporary copies only."""
import shutil
import tempfile
import unittest
from pathlib import Path
from check_site import check_site
from site_common import ROOT, page_paths
from sync_assets import sync


class PublicationChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / 'assets', self.root / 'assets')
        shutil.copyfile(ROOT / 'sitemap.xml', self.root / 'sitemap.xml')
        for path in page_paths():
            target = self.root / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, target)

    def replace(self, relative, old, new):
        path = self.root / relative
        content = path.read_text()
        self.assertIn(old, content)
        path.write_text(content.replace(old, new, 1))

    def test_css_update_requires_sync_and_sync_is_idempotent(self):
        path = self.root / 'assets/site.css'
        path.write_text(path.read_text() + '\n/* changed */\n')
        with self.assertRaisesRegex(ValueError, 'stale stylesheet'):
            check_site(self.root)
        self.assertEqual(sync(self.root), 8)
        self.assertEqual(check_site(self.root), 8)
        self.assertEqual(sync(self.root), 0)

    def test_sync_does_not_partially_write_invalid_site(self):
        self.replace('ru/index.html', '/assets/site.css', '/assets/missing.css')
        css = self.root / 'assets/site.css'
        css.write_text(css.read_text() + '\n/* changed */\n')
        before = (self.root / 'index.html').read_text()
        with self.assertRaises(ValueError):
            sync(self.root)
        self.assertEqual((self.root / 'index.html').read_text(), before)

    def test_wrong_translation_target(self):
        self.replace('index.html', 'hreflang="ru" href="https://dobropalm.tech/ru/"',
                     'hreflang="ru" href="https://dobropalm.tech/"')
        with self.assertRaisesRegex(ValueError, 'translation links'):
            check_site(self.root)

    def test_wrong_sitemap_with_same_page_count(self):
        self.replace('sitemap.xml', '<loc>https://dobropalm.tech/</loc>', '<loc>https://dobropalm.tech/missing/</loc>')
        with self.assertRaisesRegex(ValueError, 'Sitemap routes'):
            check_site(self.root)

    def test_portrait_without_full_frame_style(self):
        self.replace('index.html', 'class="portrait"', 'class="landscape"')
        with self.assertRaisesRegex(ValueError, 'portrait without'):
            check_site(self.root)

    def test_caption_cannot_be_borrowed_from_another_video(self):
        self.replace('index.html', 'kind="captions"', 'kind="metadata"')
        with self.assertRaisesRegex(ValueError, 'missing en captions'):
            check_site(self.root)


if __name__ == '__main__':
    unittest.main()
