#!/usr/bin/env python3
"""Build committed WebP variants from original portfolio captures (Pillow required)."""
from pathlib import Path
from hashlib import sha256
from html.parser import HTMLParser
from io import BytesIO
import json,re
from PIL import Image, ImageOps
from site_common import ROOT, page_paths
QUALITY = 86

class Images(HTMLParser):
    def __init__(self):
        super().__init__(); self.paths=set()
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if tag=='img': self.paths.add(d.get('src',''))
        if tag=='video': self.paths.add(d.get('poster',''))

def build(root=ROOT):
    # Originals remain the source for re-encoding, including after HTML is updated.
    parser=Images()
    for page in page_paths(root): parser.feed(page.read_text())
    originals={p for p in parser.paths if p.startswith('/assets/media/') and '/optimized/' not in p and not p.endswith('.webp')}
    old_manifest=root/'frontend/src/optimized-images.json'
    if old_manifest.exists(): originals.update(json.loads(old_manifest.read_text()))
    target=root/'assets/media/optimized'; target.mkdir(exist_ok=True)
    manifest={}; report=[]
    for source in sorted(originals):
        path=root/source.lstrip('/'); data=path.read_bytes()
        image=ImageOps.exif_transpose(Image.open(BytesIO(data))).convert('RGB')
        width,height=image.size; digest=sha256(data).hexdigest()[:8]; variants=[]
        for w in sorted({min(n,width) for n in (320,640,960,1440)}):
            h=round(height*w/width)
            resized=image if w==width else image.resize((w,h),Image.Resampling.LANCZOS)
            name=f'{path.stem}-{digest}-{w}.webp'; output=target/name
            resized.save(output,format='WEBP',quality=QUALITY,method=6)
            variants.append({'width':w,'src':'/assets/media/optimized/'+name,'bytes':output.stat().st_size})
        default=next((v for v in variants if v['width']>=640),variants[-1])
        manifest[source]={'src':default['src'],'srcSet':', '.join(f"{v['src']} {v['width']}w" for v in variants),'width':width,'height':height}
        report.append({'source':source,'originalBytes':len(data),'fullBytes':variants[-1]['bytes'],'variants':variants})
    old_manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    # Only case HTML is maintained by hand; homepages are rendered from React next.
    for page in page_paths(root):
        if 'case-studies' not in page.parts: continue
        def replace(match):
            tag=match.group(0); m=re.search(r'\bsrc="([^"]+)"',tag)
            if not m: return tag
            source=m[1]
            if source not in manifest:
                source=next((key for key,value in manifest.items() if value['src']==source),None)
            if not source: return tag
            item=manifest[source]
            tag=re.sub(r'\s+(?:srcset|sizes|decoding)="[^"]*"','',tag)
            tag=re.sub(r'\bsrc="[^"]*"',f'src="{item["src"]}" srcset="{item["srcSet"]}" sizes="(max-width: 700px) 90vw, 560px" decoding="async"',tag)
            return tag
        page.write_text(re.sub(r'<img\b[^>]*>',replace,page.read_text()))
    return report

if __name__=='__main__':
    report=build(); before=sum(r['originalBytes'] for r in report); after=sum(r['fullBytes'] for r in report)
    print(json.dumps({'images':len(report),'originalBytes':before,'fullSizeWebpBytes':after,'reductionPercent':round(100*(1-after/before),1),'imagesReport':report},indent=2))
