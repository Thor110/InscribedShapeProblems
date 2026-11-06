// For which orientations does a convex polygon contain an inscribed equilateral
// triangle with exactly that orientation? (PROOFS.md, Theorem 3 and Proposition 5.)
// For a convex body the jig search is complete: an inscribed triangle's
// circumcentre is inside it, and each ray from there meets the boundary once.
// Usage: node tests/check-orientations.js
require('../pages/shapes2d.js');
const S = globalThis.Shapes2D;
function scan(K, label) {
  const G = S.accel(K), dirs = t => [0, 1, 2].map(k => t + (2 * Math.PI * k) / 3);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of K) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const W = Math.max(x1 - x0, y1 - y0), starts = [];
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { const x = x0 + ((i + 0.5) / 40) * (x1 - x0), y = y0 + ((j + 0.5) / 40) * (y1 - y0); if (G.inside(x, y)) starts.push([x, y]); }
  const rays = (x, y, t) => dirs(t).map(a => G.far(x, y, Math.cos(a), Math.sin(a)));
  const res = t => p => { const r = rays(p[0], p[1], t); return r.some(v => v < 0) ? null : [(r[0] - r[1]) / W, (r[1] - r[2]) / W]; };
  const missing = [];
  for (let deg = 0; deg < 120; deg += 2) {
    const t = (deg * Math.PI) / 180; let best = 0;
    for (const s of starts) {
      const sol = S.newton(res(t), s, [1e-7 * W, 1e-7 * W], 60); if (!sol || sol.nf > 1e-13) continue;
      const r = rays(sol.x[0], sol.x[1], t); if (!r.some(v => v < 0)) best = Math.max(best, r[0] / W);
    }
    if (best < 1e-3) missing.push(deg);
  }
  const ranges = []; for (const d of missing) { const r = ranges[ranges.length - 1]; if (r && d === r[1] + 2) r[1] = d; else ranges.push([d, d]); }
  console.log(`${label.padEnd(34)} orientations with no inscribed equilateral triangle: ${ranges.length ? ranges.map(([a, b]) => (a === b ? `${a}°` : `${a}°–${b}°`)).join(', ') : 'none'}`);
}
const isosceles = apex => { const h = Math.tan(((apex / 2) * Math.PI) / 180); return [{ x: 0, y: 0 }, { x: 1, y: -h }, { x: 1, y: h }]; };
const regular = n => Array.from({ length: n }, (_, k) => ({ x: Math.cos((2 * Math.PI * k) / n), y: Math.sin((2 * Math.PI * k) / n) }));
console.log('Jig arms at θ, θ+120°, θ+240°; triangles have their apex at the origin, pointing in direction 180°.');
for (const a of [10, 30, 50, 59, 61, 90]) scan(isosceles(a), `isosceles triangle, apex ${a}°`);
scan([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 0.3 }, { x: 0, y: 0.3 }], 'thin rectangle');
scan(regular(5), 'regular pentagon (angles 108°)');
scan(regular(7), 'regular heptagon (angles > 120°)');
