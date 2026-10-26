"""Rebuild opaque coin backing from the supplied vector silhouette.

Development-only dependencies: fonttools and skia-pathops. No runtime dependency.
Original paths stay byte-for-byte unchanged. Only the large enclosed side-face
hole is filled; no generic hole filling is applied to other library objects.
"""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET

import pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
BACKING_ID = "coin-solid-backing"
VARIANTS = {"S-13": "white", "L-26": "white", "S-22": "#D7CDF5", "L-27": "#D7CDF5"}


def original_paths(root):
    return [dict(node.attrib) for node in root.iter()
            if node.tag.endswith("}path") and node.get("id") != BACKING_ID]


def repair(name, fill):
    path = ROOT / "assets" / f"{name}.svg"
    text = path.read_text()
    before = original_paths(ET.fromstring(text))
    silhouette = pathops.Path()
    for attrs in before:
        shape = pathops.Path()
        parse_path(attrs["d"], shape.getPen())
        silhouette = pathops.op(silhouette, shape, pathops.PathOp.UNION)
    # Boolean union retains Bezier geometry. The sole large inner contour is
    # the transparent side of the coin; retaining only the largest outer
    # contour creates a backing without extending the source silhouette.
    outer = max((c for c in silhouette.contours if not c.clockwise), key=lambda c: c.area)
    pen = SVGPathPen(None)
    outer.draw(pen)
    backing = f'<ns0:path id="{BACKING_ID}" d="{pen.getCommands()}" fill="{fill}" />\n'
    text = re.sub(r'<ns0:path id="coin-solid-backing"[^>]*\s*/>\s*', '', text)
    position = text.index('<ns0:g ')
    text = text[:position] + backing + text[position:]
    assert original_paths(ET.fromstring(text)) == before, "Original vector paths changed"
    path.write_text(text)
    return {"count": len(before), "sha256": hashlib.sha256(
        json.dumps(before, ensure_ascii=True, separators=(',', ':')).encode()).hexdigest()}


if __name__ == "__main__":
    manifest = {name: repair(name, fill) for name, fill in VARIANTS.items()}
    print(json.dumps(manifest, indent=2))
