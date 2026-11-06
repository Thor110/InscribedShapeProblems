// Runs the n-dimensional jig search over dimensions, polytopes and surfaces and
// prints a Markdown table (the "problem map" data in the README).
// Usage: node tests/run-nd.js [maxDim=5] [seed=1]
//        node tests/run-nd.js --check-convex      (checks the lopsided egg is convex in 2..6 D)
const N = require('../pages/inscribed-nd.js');

if (process.argv.includes('--check-convex')) {
  // Sample surface points and random tangent directions; the second derivative of
  // F along each tangent direction must be positive for a strictly convex surface.
  for (let n = 2; n <= 6; n++) {
    const S = N.makeSurface('egg', n, 1), R = N.rng(99 + n); let min = Infinity;
    const grad = p => p.map((_, i) => { const a = p.slice(), b = p.slice(); a[i] += 1e-6; b[i] -= 1e-6; return (S.F(a) - S.F(b)) / 2e-6; });
    for (let s = 0; s < 4000; s++) {
      let u = Array.from({ length: n }, () => R() * 2 - 1); const L = Math.hypot(...u); u = u.map(v => v / L);
      const p = u.map(v => v * S.rad(u)), g = grad(p), gl = Math.hypot(...g);
      let t = Array.from({ length: n }, () => R() * 2 - 1); const tg = t.reduce((s2, v, i) => s2 + v * g[i], 0) / gl;
      t = t.map((v, i) => v - (tg * g[i]) / gl); const tl = Math.hypot(...t); t = t.map(v => v / tl);
      const h = 1e-4, f = k => S.F(p.map((v, i) => v + k * h * t[i]));
      min = Math.min(min, (f(1) - 2 * f(0) + f(-1)) / (h * h) / gl);
    }
    console.log(`n=${n}: minimum normal curvature of the egg ≈ ${min.toFixed(3)} ${min > 0 ? '(strictly convex)' : '(NOT convex)'}`);
  }
  process.exit(0);
}

const maxDim = +(process.argv[2] || 5), seed = +(process.argv[3] || 1);
const surfaces = Object.keys(N.SURFACES);
const rows = [];
console.log(`| n | Shape | Vertices | Expected dimension | ${surfaces.map(s => N.SURFACES[s].split(' (')[0]).join(' | ')} | Literature |`);
console.log(`|---|---|---|---|${surfaces.map(() => '---').join('|')}|---|`);
for (let n = 2; n <= maxDim; n++) {
  for (const shape of ['simplex', 'cross', 'cube']) {
    if (n === 2 && shape === 'cube') continue;          // in 2D the cube and cross-polytope are both the square
    const e = N.expectedDim(shape, n), cells = [];
    for (const sf of surfaces) {
      // Over-determined shapes get more starts, so a miss is not just bad luck.
      const starts = e >= 0 ? 8 : n <= 3 ? 16 : 4, t0 = Date.now();
      const r = N.run(shape, n, sf, seed, { starts, maxIt: e >= 0 ? 200 : 120 });
      cells.push(r.found ? `✅ ${r.err.toExponential(0)}` : `❌ ${isFinite(r.err) ? r.err.toExponential(0) : 'n/a'}`);
      process.stderr.write(`n=${n} ${shape} ${sf}: ${r.found ? 'found' : 'none'} ${r.err.toExponential(2)} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);
    }
    const line = `| ${n} | ${N.shapeName(shape, n)} | ${N.SHAPES[shape].vertices(n)} | ${e} | ${cells.join(' | ')} | ${N.literature(shape, n)} |`;
    rows.push(line); console.log(line);
  }
}
