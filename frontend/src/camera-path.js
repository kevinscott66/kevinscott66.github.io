/** Scroll is the only timeline. Reversing it selects exactly the same pose. */
export const CAMERA_KEYS = [
  { at: 0, p: [0, 0, 10], look: [0, 0, 0] },
  { at: 0.2, p: [-0.2, 0.05, 9.5], look: [-0.5, 0, -1] },
  { at: 0.46, p: [-2.2, 0.12, 4], look: [-2.8, 0, -6] },
  { at: 0.65, p: [-2.8, 0.08, -1.8], look: [-2.8, 0, -12] },
  { at: 0.95, p: [0, 0, -7.4], look: [0, 0, -17] },
  { at: 1.23, p: [0, 0, -7.4], look: [0, 0, -17] },
  { at: 1.55, p: [-2, 0.08, -14.2], look: [-2, 0, -27] },
  { at: 1.76, p: [-2, 0.06, -20], look: [-2, 0, -33] },
  { at: 1.98, p: [0, 0, -23], look: [0, 0, -33] },
  { at: 2.23, p: [0, 0, -23], look: [0, 0, -33] },
  { at: 2.53, p: [-2, 0, -31], look: [-2, 0, -42] },
  { at: 2.74, p: [-2, 0, -39], look: [-2, 0, -51] },
  { at: 2.98, p: [0, 0, -43], look: [0, 0, -53] },
  { at: 3.65, p: [0, 0, -43], look: [0, 0, -53] },
  { at: 4, p: [0, 0.6, -40.5], look: [0, 0, -53] },
];
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export function smoothRange(a, b, v) {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function tangent(keys, i, field, axis) {
  const prev = keys[Math.max(0, i - 1)],
    next = keys[Math.min(keys.length - 1, i + 1)],
    now = keys[i];
  if (
    (i > 0 && prev[field].every((v, k) => v === now[field][k])) ||
    (i < keys.length - 1 && next[field].every((v, k) => v === now[field][k]))
  )
    return 0;
  return (next[field][axis] - prev[field][axis]) / (next.at - prev.at);
}
export function cameraPose(progress, keys = CAMERA_KEYS) {
  const p = clamp(progress, keys[0].at, keys.at(-1).at);
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].at) i++;
  const a = keys[i],
    b = keys[i + 1],
    dt = b.at - a.at,
    t = (p - a.at) / dt,
    t2 = t * t,
    t3 = t2 * t;
  const sample = (field) =>
    a[field].map(
      (v, k) =>
        (2 * t3 - 3 * t2 + 1) * v +
        (t3 - 2 * t2 + t) * dt * tangent(keys, i, field, k) +
        (-2 * t3 + 3 * t2) * b[field][k] +
        (t3 - t2) * dt * tangent(keys, i + 1, field, k),
    );
  return { position: sample("p"), look: sample("look") };
}
export function damp(current, target, seconds) {
  return (
    current +
    (target - current) * (1 - Math.exp(-Math.min(0.1, seconds) / 0.115))
  );
}
export function progressFromTops(tops) {
  if (tops.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < tops.length - 1; i++) {
    if (tops[i] <= 0) p = i + clamp(-tops[i] / (tops[i + 1] - tops[i]));
  }
  return clamp(p, 0, tops.length - 1);
}
