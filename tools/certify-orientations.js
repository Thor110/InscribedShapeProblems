#!/usr/bin/env node
// Every orientation (PROOFS.md, Corollary 7.3): every surface whose radius stays within
// T of the ellipsoid with semi-axes 1, 0.8, 0.6 has an inscribed regular tetrahedron in
// EVERY orientation. T = 7/100 by default (--T p/q to choose another).
//
// Orientations. A rotation is a unit quaternion ±(1, a, b, c)/|·| with Cayley vector
// (a, b, c); certify-rigorous.js builds its exactly orthogonal rational matrix. The
// tetrahedron's 12 rotational symmetries form, as quaternions, the 24 Hurwitz units
// ±1, ±i, ±j, ±k, (±1 ± i ± j ± k)/2. Turning a tetrahedron by a symmetry gives the same
// tetrahedron, and every quaternion can be turned by one into the region nearest to ±1,
// which in the (a, b, c) chart is the solid octahedron |a| + |b| + |c| ≤ 1. So it is
// enough to cover that octahedron.
//
// Covering. [−1, 1]³ is split into cubes; every cube that meets the octahedron is
// certified around its centre q. For q' in the cube, |u(q') − u(q)| ≤ |q' − q|₂/d ≤ √3·h/d,
// where u(q) = (1, q)/|(1, q)|, h is the cube's half-width and d = min |(1, q)| over the
// cube (radial projection onto the unit sphere is (1/d)-Lipschitz on points at distance at
// least d from the origin). Turning by the rotation from u(q) to u(q') moves each vertex
// x + s·w by at most s·2|u(q') − u(q)|. So a certificate for orientation q with the
// allowance T + s·(2√3·h/d), bounded on each cell by that cell's largest s, proves the
// theorem for every orientation in the cube. A cube that fails is retried with other box
// sizes and then split into 8.
//
// Progress is appended to data/orientations-progress-T<p>-<q>.jsonl, so an interrupted run resumes.
// The result is data/certificate-orientations-T<p>-<q>.json; the program exits with code 0 only
// if every cube is certified.
//
//   node tools/certify-orientations.js [--T 7/100]          # the full covering (hours on 4 cores)
//   node tools/certify-orientations.js [--T 7/100] --check  # just re-check the covering from the data
//   node tools/certify-orientations.js [--T 7/100] --sample 100  # a random sample for ./verify orientations
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path'), os = require('os');
const R = require('../pages/certify-rigorous.js');
const { up, ru } = require('../pages/interval.js');

// T comes from --T in the main thread, and is handed to the worker threads explicitly (they do not
// see the command line). Every progress record carries the T it was certified for.
const ti = process.argv.indexOf('--T');
const T = !isMainThread ? workerData.T : ti > 0 ? process.argv[ti + 1].split('/').map(Number) : [7, 100];
const N_GRID = 36, BOXES = [0.24, 0.22, 0.20], MAX_SPLIT = 2;
const STARTS = [[0, 0, 0, 0.75], [0, 0, 0, 0.6], [0, 0, 0, 0.9]];
const ROOT = path.join(__dirname, '..'), TAG = `T${T[0]}-${T[1]}`;
const PROGRESS = path.join(ROOT, 'data', `orientations-progress-${TAG}.jsonl`), OUT = path.join(ROOT, 'data', `certificate-orientations-${TAG}.json`);

// Certify one cube [lo, hi] (Cayley-vector coordinates). Returns the first passing set-up.
function certifyCube(lo, hi) {
  const q = lo.map((v, i) => (v + hi[i]) / 2);
  let h = 0; for (let i = 0; i < 3; i++) h = Math.max(h, ru(hi[i] - q[i]), ru(q[i] - lo[i]));
  // d = a lower bound of |(1, q)| over the cube
  let mq = 0; for (let i = 0; i < 3; i++) { const t = lo[i] > 0 ? lo[i] : hi[i] < 0 ? -hi[i] : 0; mq += t * t; }
  const d = Math.sqrt(1 + mq) * (1 - 1e-15);
  const turn = ru(up.mul(up.mul(2, up.sqrt(3)), h) / d);   // vertex movement per unit circumradius
  for (const c of BOXES) for (const start of STARTS) {
    const P = R.tetraProblem(T, c, 2, q, start), S = R.setup(P);
    if (!S.degree || !(S.cEff > 0)) continue;
    const res = { K: S.K, zero: S.z, c: S.c }, sMin = R.tetraRadius(P, res), sMax = R.tetraRadius(P, res, true);
    if (!(sMin > 0)) continue;
    P.turn = turn;   // allowance T + turn·s, bounded cell by cell
    const r = R.finishAdaptive(P, S, [R.scanAdaptive(P, S, R.allFaces(4), { start: 4, maxDepth: 8, failFast: true })]);
    if (r.ok) return { ok: true, q, h, c, start, sMin, sMax, turn, cells: r.cellsChecked, slack: r.slackOverTeff, degSlack: r.degreeSlack };
  }
  return { ok: false, q, h };
}

if (!isMainThread) {
  parentPort.on('message', job => parentPort.postMessage({ key: job.key, lo: job.lo, hi: job.hi, depth: job.depth, T, ...certifyCube(job.lo, job.hi) }));
  return;
}

// ---- the cube grid on [−1, 1]³; the last edge is exactly 1 ----
const edges = Array.from({ length: N_GRID + 1 }, (_, i) => (i === N_GRID ? 1 : -1 + (2 * i) / N_GRID));
// Lower bound of |a| + |b| + |c| over a cube (a coordinate's distance from 0 to its interval).
const minL1 = (lo, hi) => lo.reduce((s, v, i) => s + (v > 0 ? v : hi[i] < 0 ? -hi[i] : 0), 0);
const key = (lo, hi) => lo.join(',') + '|' + hi.join(',');
const topCubes = [];
for (let i = 0; i < N_GRID; i++) for (let j = 0; j < N_GRID; j++) for (let k = 0; k < N_GRID; k++) {
  const lo = [edges[i], edges[j], edges[k]], hi = [edges[i + 1], edges[j + 1], edges[k + 1]];
  if (minL1(lo, hi) <= 1) topCubes.push({ lo, hi, depth: 0, key: key(lo, hi) });
}
const children = c => {
  const mid = c.lo.map((v, i) => (v + c.hi[i]) / 2), out = [];
  for (let m = 0; m < 8; m++) {
    const lo = [0, 1, 2].map(i => ((m >> i) & 1 ? mid[i] : c.lo[i])), hi = [0, 1, 2].map(i => ((m >> i) & 1 ? c.hi[i] : mid[i]));
    if (minL1(lo, hi) <= 1) out.push({ lo, hi, depth: c.depth + 1, key: key(lo, hi) });
  }
  return out;
};

// ---- resume ----
const done = new Map();
if (fs.existsSync(PROGRESS)) for (const line of fs.readFileSync(PROGRESS, 'utf8').split('\n')) if (line.trim()) {
  const r = JSON.parse(line);
  if (!Array.isArray(r.T) || r.T[0] !== T[0] || r.T[1] !== T[1]) { console.error(`${path.basename(PROGRESS)}: a record for T = ${r.T} in the file for T = ${T.join('/')}`); process.exit(2); }
  done.set(r.key, r);
}

// Covering check: every top cube is certified, or split into certified (or further split) children.
function coverage() {
  let certified = 0, missing = 0, failed = 0;
  const visit = c => {
    const r = done.get(c.key);
    if (r && r.ok) { certified++; return; }
    if (r && !r.ok && c.depth < MAX_SPLIT) { for (const ch of children(c)) visit(ch); return; }
    if (r) failed++; else missing++;
  };
  topCubes.forEach(visit);
  return { certified, missing, failed };
}

function finish() {
  const cov = coverage(), all = [...done.values()].filter(r => r.ok);
  const ok = cov.missing === 0 && cov.failed === 0;
  const summary = {
    theorem: `Every surface ρ(ω)·ω with ρ continuous and |ρ(ω) − r_E(ω)| ≤ ${T[0]}/${T[1]}, where r_E is the radial function of the ellipsoid x² + y²/0.8² + z²/0.6² = 1, has an inscribed regular tetrahedron in every orientation.`,
    method: 'cover the octahedron |a|+|b|+|c| ≤ 1 of Cayley vectors (a fundamental domain of the tetrahedral group) by cubes; certify each cube centre in interval arithmetic with adaptive cells, with a perturbation allowance T + turn·s for turning within the cube',
    T: `${T[0]}/${T[1]}`, grid: N_GRID, ok, cubesCertified: cov.certified, missing: cov.missing, failed: cov.failed,
    smallestCircumradius: Math.min(...all.map(r => r.sMin)), smallestSlack: Math.min(...all.map(r => r.slack)), smallestDegreeSlack: Math.min(...all.map(r => r.degSlack)),
    boxesUsed: all.reduce((o, r) => ((o[r.c] = (o[r.c] || 0) + 1), o), {}), splitCubes: all.filter(r => r.depth > 0).length,
  };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1) + '\n');
  console.log(`\n${ok ? 'VALID' : 'INCOMPLETE'}: ${cov.certified} cubes certified, ${cov.missing} not yet checked, ${cov.failed} failed after splitting.`);
  console.log(`  smallest circumradius ${summary.smallestCircumradius.toFixed(4)}; smallest slack ${summary.smallestSlack.toExponential(2)}; boxes used ${JSON.stringify(summary.boxesUsed)}; ${summary.splitCubes} cubes needed splitting`);
  return ok;
}

if (process.argv.includes('--check')) process.exit(finish() ? 0 : 1);

// --sample N: a seeded random sample of the certified cubes, with their box data (z, J, K),
// for the independent check `./verify orientations` (tools/verify-certificates.c).
const si = process.argv.indexOf('--sample');
if (si > 0) {
  const n = +process.argv[si + 1] || 100, pool = [...done.values()].filter(r => r.ok).sort((a, b) => (a.key < b.key ? -1 : 1));
  let seed = 20261107; const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = [];
  while (pick.length < Math.min(n, pool.length)) { const r = pool.splice(Math.floor(rand() * pool.length), 1)[0]; pick.push(r); }
  const cubes = pick.map(r => {
    const S = R.setup(R.tetraProblem(T, r.c, 2, r.q, r.start));
    return { lo: r.lo, hi: r.hi, q: r.q, c: r.c, zero: S.z, J: S.J, K: S.K };
  });
  const file = path.join(ROOT, 'data', `orientation-sample-${TAG}.json`);
  fs.writeFileSync(file, '{"T": ' + JSON.stringify(T) + ', "cubes": [\n' + cubes.map(c => JSON.stringify(c)).join(',\n') + '\n]}\n');
  console.log(`wrote ${cubes.length} cubes to data/orientation-sample-${TAG}.json`);
  process.exit(0);
}

// ---- run: a queue of cubes over worker threads ----
const queue = [], t0 = Date.now();
const enqueue = c => {
  const r = done.get(c.key);
  if (r && r.ok) return;
  if (r && !r.ok) { if (c.depth < MAX_SPLIT) children(c).forEach(enqueue); return; }
  queue.push(c);
};
topCubes.forEach(enqueue);
if (process.env.LIMIT) queue.splice(+process.env.LIMIT);   // testing: only the first few cubes
const total = queue.length; let finished = 0, active = 0;
console.log(`${topCubes.length} cubes cover the octahedron; ${done.size} already done; ${total} to check now.`);
const out = fs.openSync(PROGRESS, 'a'), nw = Math.max(1, os.cpus().length);
const workers = [...Array(nw)].map(() => new Worker(__filename, { workerData: { T } }));
let resolveAll; const allDone = new Promise(r => (resolveAll = r));
const idle = [];
const feed = w => {
  const job = queue.shift();
  if (!job) { idle.push(w); if (active === 0) resolveAll(); return; }
  active++; w.postMessage(job);
};
for (const w of workers) {
  w.on('message', r => {
    active--; finished++;
    fs.writeSync(out, JSON.stringify(r) + '\n'); done.set(r.key, r);
    if (!r.ok && r.depth < MAX_SPLIT) children(r).forEach(c => queue.push(c));
    if (finished % 50 === 0) process.stdout.write(`\r  ${finished} checked, ${queue.length} queued, ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    while (idle.length && queue.length) feed(idle.pop());   // wake idle workers for any new (split) cubes
    feed(w);
  });
  feed(w);
}
allDone.then(() => { workers.forEach(w => w.terminate()); fs.closeSync(out); process.exit(finish() ? 0 : 1); });
