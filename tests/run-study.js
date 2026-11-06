// Runs the square-shrinkage study and/or the rectangle sweep, then writes
//   data/study-squares.json, data/study-rectangles.json   (raw results)
//   images/square-shrinkage.svg, images/rectangle-sweep.svg (charts for the README)
// and prints Markdown tables.
// Usage: node tests/run-study.js [squares|rectangles|tetra|parity|both|all|charts] [--quick] [--seed N]
//   both = squares + rectangles; all = squares + rectangles + tetra
//   charts: rebuild the two SVGs from the saved JSON without re-running anything
const fs = require('fs'), path = require('path');
const Study = require('../pages/study.js'), Charts = require('../pages/study-charts.js');
const ROOT = path.resolve(__dirname, '..'), args = process.argv.slice(2);
const which = args.find(a => !a.startsWith('--')) || 'both', quick = args.includes('--quick');
const seed = +(args[args.indexOf('--seed') + 1] || 1) || 1;
const run = g => { let x, last = ''; while (!(x = g.next()).done) { const v = x.value; const tag = v.kind === 'rect' ? `${v.curve} ${v.aspect}:1` : v.kind === 'parity' ? v.label : `${v.family} level ${v.level}`; if ((v.levelDone || v.cellDone || v.rowDone) && tag !== last) { process.stderr.write(`done: ${tag}\n`); last = tag; } } return x.value; };
const f4 = v => (v > 0 ? v.toFixed(3) : '—');
const tetraChart = families => Charts.tetraChart(families);
if (which === 'charts') {
  const sq = path.join(ROOT, 'data/study-squares.json'), rc = path.join(ROOT, 'data/study-rectangles.json');
  if (fs.existsSync(sq)) fs.writeFileSync(path.join(ROOT, 'images/square-shrinkage.svg'), Charts.shrinkageChart(JSON.parse(fs.readFileSync(sq)).families));
  if (fs.existsSync(rc)) fs.writeFileSync(path.join(ROOT, 'images/rectangle-sweep.svg'), Charts.sweepChart(JSON.parse(fs.readFileSync(rc))));
  const pa = path.join(ROOT, 'data/study-parity.json');
  if (fs.existsSync(pa)) fs.writeFileSync(path.join(ROOT, 'images/square-parity.svg'), Charts.parityChart(JSON.parse(fs.readFileSync(pa)).rows));
  const te = path.join(ROOT, 'data/study-tetrahedra.json');
  if (fs.existsSync(te)) fs.writeFileSync(path.join(ROOT, 'images/tetrahedron-shrinkage.svg'), tetraChart(JSON.parse(fs.readFileSync(te)).families));
  console.log('Charts rebuilt from data/.');
  process.exit(0);
}

if (which === 'parity' || which === 'all') {
  const res = run(Study.parityStudy({ quick, seed }));
  fs.writeFileSync(path.join(ROOT, 'data/study-parity.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(ROOT, 'images/square-parity.svg'), Charts.parityChart(res.rows));
  console.log('\n| Curve | Edges | Inscribed squares | 2:1 rectangles | Largest square (diag ÷ width) |');
  console.log('|---|---|---|---|---|');
  for (const r of res.rows) console.log(`| ${r.label} | ${r.vertices.toLocaleString()} | ${r.squaresParity === 'unresolved' ? 'did not settle' : `${r.squares} (${r.squaresParity})`} | ${r.rect2Parity === 'unresolved' ? 'did not settle' : `${r.rect2} (${r.rect2Parity})`} | ${f4(r.largest)} |`);
}
if (which === 'tetra' || which === 'all') {
  const res = run(Study.tetraStudy({ quick, seed }));
  fs.writeFileSync(path.join(ROOT, 'data/study-tetrahedra.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(ROOT, 'images/tetrahedron-shrinkage.svg'), tetraChart(res.families));
  console.log('\n| Family | Level | Tetrahedra carried over | Smallest | Median | Largest | Smallest size ratio vs previous level |');
  console.log('|---|---|---|---|---|---|---|');
  for (const f of res.families) for (const l of f.levels)
    console.log(`| ${f.label} | ${l.level} | ${l.count}/${l.tracked} | ${f4(l.smallest)} | ${f4(l.median)} | ${f4(l.largest)} | ${Number.isFinite(l.minRatio) ? l.minRatio.toFixed(3) : '—'} |`);
}
if (which === 'squares' || which === 'both' || which === 'all') {
  const res = run(Study.squareStudy({ quick, seed }));
  fs.writeFileSync(path.join(ROOT, 'data/study-squares.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(ROOT, 'images/square-shrinkage.svg'), Charts.shrinkageChart(res.families));
  console.log('\n| Family | Level | Edges | Squares verified | Largest (diag ÷ width) | Continued from previous level | Smallest size ratio vs previous level |');
  console.log('|---|---|---|---|---|---|---|');
  for (const f of res.families) for (const l of f.levels)
    console.log(`| ${f.label} | ${l.level} | ${l.vertices.toLocaleString()} | ${l.count} | ${f4(l.largest)} | ${l.seeds ? `${l.continued}/${l.seeds}` : '—'} | ${Number.isFinite(l.minRatio) ? l.minRatio.toFixed(3) : '—'} |`);
}
if (which === 'rectangles' || which === 'both' || which === 'all') {
  const res = run(Study.rectangleSweep({ quick, seed }));
  fs.writeFileSync(path.join(ROOT, 'data/study-rectangles.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(ROOT, 'images/rectangle-sweep.svg'), Charts.sweepChart(res));
  console.log(`\n| Curve | ${res.aspects.map(a => `${a}:1`).join(' | ')} |`);
  console.log(`|---|${res.aspects.map(() => '---').join('|')}|`);
  for (const r of res.curves) console.log(`| ${r.label} | ${r.cells.map(c => (c.largest > 0 ? `${c.largest.toFixed(2)} (${c.count})` : '✗')).join(' | ')} |`);
}
