import * as THREE from "three";
/** Closed thick shell segments. The removed azimuth sector forms a real aperture. */
export function shellSegment(start, length, { inner = false } = {}) {
  const g = new THREE.SphereGeometry(1, 128, 96, start, length, 0, Math.PI);
  g.scale(
    2.45 * (inner ? 0.955 : 1),
    3.72 * (inner ? 0.955 : 1),
    0.86 * (inner ? 0.76 : 1),
  );
  return g;
}
export function cutWall(phi) {
  const vertices = [],
    indices = [],
    n = 96;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI,
      s = Math.sin(t),
      y = Math.cos(t);
    vertices.push(
      -2.45 * Math.cos(phi) * s,
      3.72 * y,
      0.86 * Math.sin(phi) * s,
    );
    vertices.push(
      -2.45 * 0.955 * Math.cos(phi) * s,
      3.72 * 0.955 * y,
      0.86 * 0.76 * Math.sin(phi) * s,
    );
    if (i < n) {
      const j = i * 2;
      indices.push(j, j + 1, j + 3, j, j + 3, j + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function seamCurve(phi, scale = 1) {
  return new THREE.CatmullRomCurve3(
    Array.from({ length: 100 }, (_, i) => {
      const t = 0.025 + ((Math.PI - 0.05) * i) / 99;
      return new THREE.Vector3(
        -2.45 * Math.cos(phi) * Math.sin(t) * scale,
        3.72 * Math.cos(t) * scale,
        0.86 * Math.sin(phi) * Math.sin(t) * scale,
      );
    }),
  );
}
export function roundedFrame(width, height, radius = 0.4, depth = 0.13) {
  const path = new THREE.Shape(),
    w = width / 2,
    h = height / 2,
    r = radius;
  path.moveTo(-w + r, -h);
  path.lineTo(w - r, -h);
  path.quadraticCurveTo(w, -h, w, -h + r);
  path.lineTo(w, h - r);
  path.quadraticCurveTo(w, h, w - r, h);
  path.lineTo(-w + r, h);
  path.quadraticCurveTo(-w, h, -w, h - r);
  path.lineTo(-w, -h + r);
  path.quadraticCurveTo(-w, -h, -w + r, -h);
  const hole = new THREE.Path(),
    k = 0.12;
  hole.moveTo(-w + r, -h + k);
  hole.lineTo(-w + k, -h + r);
  hole.lineTo(-w + k, h - r);
  hole.quadraticCurveTo(-w + k, h - k, -w + r, h - k);
  hole.lineTo(w - r, h - k);
  hole.quadraticCurveTo(w - k, h - k, w - k, h - r);
  hole.lineTo(w - k, -h + r);
  hole.quadraticCurveTo(w - k, -h + k, w - r, -h + k);
  hole.closePath();
  path.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(path, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 3,
    curveSegments: 20,
  });
  g.center();
  return g;
}
