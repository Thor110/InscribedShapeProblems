// Creates the registry's starting entries from the repository's own verified results:
//   - the square/rectangle studies (data/study-*.json, seed 1),
//   - fresh searches: squares and 2:1 rectangles on seeds 1–3 of every non-fractal
//     curve; tetrahedra, octahedra and cubes on seeds 1–3 of every surface,
//   - regular pentagon and hexagon on the circle (exact, from its vertices).
// Only results that pass Registry.verify are written; existing files are kept.
// Usage: node tools/seed-registry.js
const fs = require('fs'), path = require('path');
const Registry = require('../pages/registry.js'), I2 = require('../pages/inscribed-2d.js'), ND = require('../pages/inscribed-nd.js');
require('../pages/shapes2d.js'); require('../pages/surfaces3d.js');
const S2 = globalThis.Shapes2D, S3 = globalThis.Surfaces3D, ROOT = path.resolve(__dirname, '..');
let added = 0, skipped = 0;
function save(r) {
  if (Registry.catalogueCheck(r)) { skipped++; return; }
  const file = path.join(ROOT, 'results', Registry.key(r) + '.json');
  if (fs.existsSync(file)) return;
  const v = Registry.verify(r); if (!v.ok) { skipped++; return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(Object.assign(Registry.normalise(r), { author: 'repository baseline', finder: r.finder }), null, 1) + '\n');
  added++;
}
const seeds = type => (Registry.catalogueCheck({ dim: 2, shape: 'square', curve: { type, seed: 2 } }) || '').includes('seed') ? [1] : [1, 2, 3];
// 1. studies
const sq = path.join(ROOT, 'data/study-squares.json'), rc = path.join(ROOT, 'data/study-rectangles.json');
if (fs.existsSync(sq)) for (const f of JSON.parse(fs.readFileSync(sq)).families) for (const l of f.levels) if (l.best) save({ dim: 2, shape: 'square', curve: { type: f.family, seed: f.seed || 1, level: l.level }, vertices: l.best, finder: 'square shrinkage study' });
if (fs.existsSync(rc)) { const d = JSON.parse(fs.readFileSync(rc)); for (const c of d.curves) for (const cell of c.cells) if (cell.best) save({ dim: 2, shape: cell.aspect === 1 ? 'square' : 'rectangle', aspect: cell.aspect === 1 ? undefined : cell.aspect, curve: c.level === undefined ? { type: c.type, seed: d.seed || 1 } : { type: c.type, seed: d.seed || 1, level: c.level }, vertices: cell.best, finder: 'rectangle sweep' }); }
console.log(`studies: ${added} added`);
// 2. 2D searches on non-fractal curves
for (const [type] of S2.list) {
  if (S2.LEVELS[type]) continue;
  for (const seed of seeds(type)) for (const aspect of [1, 2]) {
    const res = I2.find(S2.generate(type, seed), { aspect, starts: 6, random: 150, track: 300 });
    if (res.found[0]) save({ dim: 2, shape: aspect === 1 ? 'square' : 'rectangle', aspect: aspect === 1 ? undefined : aspect, curve: { type, seed }, vertices: res.found[0].P.map(p => [p.x, p.y]), finder: 'baseline search' });
  }
  process.stderr.write(`2D ${type} done (${added} added)\n`);
}
// 3. pentagon and hexagon on the circle (a regular 2400-gon: exact vertices)
const circ = S2.generate('circle', 1);
for (const [shape, n] of [['pentagon', 5], ['hexagon', 6]]) save({ dim: 2, shape, curve: { type: 'circle', seed: 1 }, vertices: Array.from({ length: n }, (_, k) => [circ[(k * circ.length) / n].x, circ[(k * circ.length) / n].y]), finder: 'exact' });
// 4. 3D searches at each surface's default level
for (const [type] of S3.list) {
  const L = S3.LEVELS[type], level = L ? L[2] : undefined;
  const sds = (Registry.catalogueCheck({ dim: 3, shape: 'cube', curve: { type, seed: 2, level } }) || '').includes('seed') ? [1] : [1, 2, 3];
  for (const seed of sds) for (const [shape, nd, starts] of [['tetrahedron', 'simplex', 6], ['octahedron', 'cross', 8], ['cube', 'cube', 10]]) {
    const rad = S3.make(type, seed, level), P = ND.makeProblem(nd, 3, null, seed, { rad, rmax: 1.6 });
    const g = P.search({ starts, maxIt: 150 }); let x; while (!(x = g.next()).done);
    if (x.value && x.value.found) save({ dim: 3, shape, curve: level === undefined ? { type, seed } : { type, seed, level }, vertices: x.value.P, finder: 'baseline search' });
  }
  process.stderr.write(`3D ${type} done (${added} added)\n`);
}
console.log(`Baseline: ${added} results added, ${skipped} skipped.`);
