// Verifies every 2D curve generator yields a simple closed polygon (a Jordan curve):
// no two non-adjacent edges intersect. Uses a uniform grid to keep it fast.
// Usage: node tests/jordan-check.js
require('../pages/shapes2d.js');
const S = globalThis.Shapes2D;
function simple(P) {
  const n = P.length; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const G = Math.ceil(Math.sqrt(n)) * 2, cw = (x1 - x0) / G + 1e-15, ch = (y1 - y0) / G + 1e-15, cells = new Map();
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const ia = Math.floor((Math.min(a.x, b.x) - x0) / cw), ib = Math.floor((Math.max(a.x, b.x) - x0) / cw);
    const ja = Math.floor((Math.min(a.y, b.y) - y0) / ch), jb = Math.floor((Math.max(a.y, b.y) - y0) / ch);
    for (let i2 = ia; i2 <= ib; i2++) for (let j2 = ja; j2 <= jb; j2++) { const k = i2 * 100003 + j2; (cells.get(k) || cells.set(k, []).get(k)).push(i); }
  }
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  for (const list of cells.values()) for (let u = 0; u < list.length; u++) for (let v = u + 1; v < list.length; v++) {
    const i = list[u], j = list[v];
    if (Math.abs(i - j) <= 1 || Math.abs(i - j) === n - 1) continue;
    const a = P[i], b = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
    const d1 = cr(a, b, c), d2 = cr(a, b, d), d3 = cr(c, d, a), d4 = cr(c, d, b);
    const eps = 1e-12 * ((x1 - x0) + (y1 - y0)) ** 2;
    const on = (p, q, r) => Math.min(p.x, q.x) - 1e-12 <= r.x && r.x <= Math.max(p.x, q.x) + 1e-12 && Math.min(p.y, q.y) - 1e-12 <= r.y && r.y <= Math.max(p.y, q.y) + 1e-12;
    const z = v => Math.abs(v) <= eps, sg = v => (z(v) ? 0 : Math.sign(v));
    let hit = sg(d1) * sg(d2) < 0 && sg(d3) * sg(d4) < 0;
    if (!hit) hit = (z(d1) && on(a, b, c)) || (z(d2) && on(a, b, d)) || (z(d3) && on(c, d, a)) || (z(d4) && on(c, d, b));
    if (hit) return `edges ${i} and ${j} intersect`;
  }
  return null;
}
let bad = 0;
for (const [type, label] of S.list) for (const seed of [1, 2, 3, 4, 5]) {
  const P = S.generate(type, seed), e = simple(P);
  if (e) { bad++; console.log(`FAIL ${label} seed ${seed}: ${e}`); }
  else if (seed === 1) console.log(`ok   ${label.padEnd(32)} ${P.length} vertices`);
}
console.log(bad ? `${bad} failures` : 'All curves are simple closed polygons (5 seeds each).');
process.exit(bad ? 1 : 0);
