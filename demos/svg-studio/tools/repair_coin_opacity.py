"""Rebuild the coin's solid side and separate its translucent cast shadow.

Development dependencies: fonttools and skia-pathops. No runtime dependency.
Original path attributes stay unchanged; shadow paths move into one background
layer so opacity is applied once, without dark overlap seams.
"""
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET

import pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
NS = "http://www.w3.org/2000/svg"
BACKING_ID = "coin-solid-backing"
# (body fill, source shadow range, edge range, base contour)
VARIANTS = {
    "S-13": ("white", 547, 594, 596, 598, "Vector 3"),
    "S-22": ("#D7CDF5", 1180, 1227, 1229, 1231, "Vector 3_2"),
    "L-26": ("white", 1108, 1155, 1157, 1159, "Vector 3"),
    "L-27": ("#D7CDF5", 1242, 1289, 1291, 1293, "Vector 3_2"),
}


def original_paths(root):
    return sorted((dict(n.attrib) for n in root.iter(f"{{{NS}}}path")
                   if n.get("id") != BACKING_ID), key=lambda a: a["id"])


def repair(name, spec):
    fill, start, end, edge_start, edge_end, base = spec
    path = ROOT / "assets" / f"{name}.svg"
    root = ET.fromstring(path.read_text())
    before = original_paths(root)
    silhouette = pathops.Path()
    for attrs in before:
        shape = pathops.Path()
        parse_path(attrs["d"], shape.getPen())
        silhouette = pathops.op(silhouette, shape, pathops.PathOp.UNION)
    # Fill only the enclosed side-face hole, never the floor shadow.
    side = max((c for c in silhouette.contours if c.clockwise), key=lambda c: c.area)
    pen = SVGPathPen(None)
    side.draw(pen)
    shadow_ids = {f"Vector_{i}" for i in range(start, end + 1)}
    shadow_ids.update(f"Vector_{i}" for i in range(edge_start, edge_end + 1))
    shadow_ids.add(base)
    shadow = ET.Element(f"{{{NS}}}g", {"id": "coin-cast-shadow", "opacity": "0.24"})
    for parent in list(root.iter()):
        for node in list(parent):
            if node.get("id") == BACKING_ID:
                parent.remove(node)
            elif node.tag == f"{{{NS}}}path" and node.get("id") in shadow_ids:
                parent.remove(node)
                shadow.append(node)
    assert {n.get("id") for n in shadow} == shadow_ids
    # Remove obsolete empty shadow wrappers from earlier regenerations.
    for parent in list(root.iter()):
        for node in list(parent):
            if node.tag == f"{{{NS}}}g" and not len(node):
                parent.remove(node)
    root.insert(0, shadow)
    root.insert(1, ET.Element(f"{{{NS}}}path", {
        "id": BACKING_ID, "d": pen.getCommands(), "fill": fill}))
    assert original_paths(root) == before, "Original vector path attributes changed"
    path.write_text(ET.tostring(root, encoding="unicode"))
    return {"count": len(before), "sha256": hashlib.sha256(
        json.dumps(before, ensure_ascii=True, separators=(',', ':')).encode()).hexdigest()}


if __name__ == "__main__":
    print(json.dumps({name: repair(name, spec) for name, spec in VARIANTS.items()}, indent=2))
