#!/usr/bin/env node
// The computer-assisted proof of PROOFS.md, Theorem 7, in interval arithmetic:
// every surface whose radius stays within T = 0.13 of the ellipsoid with semi-axes
// 1, 0.8, 0.6 has an inscribed regular tetrahedron (in the orientation of
// tetraDirs() in pages/certify-rigorous.js), and, for smaller T, one in every
// orientation within an angle α of that one (Corollary 7.2).
//
// The boundary of the 4D box is checked in adaptive cells (scanAdaptive): each face
// starts as 8³ cells, and a cell is split only where the margin is too small for it.
// The 8 faces are spread over worker threads. Writes data/certificate-tetrahedron.json
// and exits with code 0 if the certificate is valid.
//
//   node tools/certify-tetra.js            # theorem and orientation table (a few minutes)
//   node tools/certify-tetra.js --theorem  # just the theorem (seconds)
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), fs = require('fs'), path = require('path');
const R = require('../pages/certify-rigorous.js');
const OPTS = { start: 8, maxDepth: 12 }, SEARCH = { start: 8, maxDepth: 8, failFast: true };

if (!isMainThread) {
  const { T, c, Teff, S, faces } = workerData, P = R.tetraProblem(T, c, 2);
  if (Teff) P.Teff = Teff;
  // the orientation search (Teff given) only needs a yes/no, so it stops at the first failure
  parentPort.postMessage(R.scanAdaptive(P, S, faces, Teff ? SEARCH : OPTS));
} else {
  const T = [13, 100], c = 0.26, nw = Math.max(1, Math.min(8, os.cpus().length));
  const P = R.tetraProblem(T, c, 2), S = R.setup(P), faces = R.allFaces(4), groups = [...Array(nw)].map((_, w) => faces.filter((_, i) => i % nw === w));
  // one certificate run: problem P with the perturbation allowance Teff (default: P's own)
  const run = Teff => Promise.all(groups.map(g => new Promise((res, rej) => {
    const w = new Worker(__filename, { workerData: { T, c, Teff, S, faces: g } }); w.on('message', res); w.on('error', rej);
  }))).then(scans => { const Q = Object.assign({}, P); if (Teff) Q.Teff = Teff; return R.finishAdaptive(Q, S, scans); });
  const f = (x, d = 4) => x.toFixed(d), deg = a => (a * 180) / Math.PI, t0 = Date.now();

  (async () => {
    const r = await run(), radius = R.tetraRadius(P, r), sMax = R.tetraRadius(P, r, true), ok = r.ok && radius > 0;
    console.log(`Certificate ${ok ? 'VALID' : 'FAILED'} for T = ${T[0] / T[1]} (ellipsoid 1 × 0.8 × 0.6), interval arithmetic, adaptive cells`);
    console.log(`  tetrahedron on the ellipsoid: centre (${r.zero.slice(0, 3).map(v => f(v)).join(', ')}), circumradius ${f(r.zero[3])}`);
    console.log(`  degree (sign det J, det ∈ [${f(r.det[0])}, ${f(r.det[1])}]):  ${r.degree}; box half-width c = ${c}`);
    console.log(`  ${r.cellsChecked.toLocaleString()} cells checked (deepest split level ${r.deepest}), ${r.failedCells} failed`);
    console.log(`  on every cell: |G| − (change across the cell) − T ≥ ${r.slackOverTeff.toExponential(2)} > 0, and the degree condition holds (slack ${r.degreeSlack.toExponential(2)})`);
    console.log(`  circumradius of the guaranteed tetrahedron between ${f(radius)} and ${f(sMax)}  (${((Date.now() - t0) / 1000).toFixed(0)} s on ${nw} threads)`);
    const orientations = [];
    if (!process.argv.includes('--theorem')) {
      // Corollary 7.2: turning by θ moves G by at most s_max·θ, so certify Teff = T + s_max·θ.
      console.log('  every orientation within angle α of the given one, for surfaces within T:');
      for (const t of [0, 0.03, 0.06, 0.09, 0.12]) {
        let lo = 0, hi = 0.15;                         // radians; binary search on the largest certified α
        for (let it = 0; it < 9; it++) {
          const a = (lo + hi) / 2, Teff = R.up(t, sMax, a);
          if ((await run(Teff)).ok) lo = a; else hi = a;
        }
        orientations.push({ T: t, angle: lo, degrees: deg(lo) });
        console.log(`    T = ${f(t, 2)}:  α = ${f(lo)} rad = ${f(deg(lo), 2)}°`);
      }
    }
    console.log(`  ${((Date.now() - t0) / 1000).toFixed(0)} s in all`);
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'certificate-tetrahedron.json'), JSON.stringify({
      theorem: 'Every surface ρ(ω)·ω with ρ continuous and |ρ(ω) − r_E(ω)| ≤ T for all unit vectors ω, where r_E is the radial function of the ellipsoid x² + y²/0.8² + z²/0.6² = 1, has an inscribed regular tetrahedron with vertices x + s·w_k, w_k the directions of tetraDirs() in pages/certify-rigorous.js.',
      method: 'interval arithmetic with outward rounding, adaptive cells (pages/interval.js, pages/certify-rigorous.js)',
      ellipsoid: { axes: [1, '4/5', '3/5'] }, orientation: 'Cayley rotation with q = (1/8, 1/4, 3/8)', T: `${T[0]}/${T[1]}`, ok,
      certificate: r, circumradiusLowerBound: radius, circumradiusUpperBound: sMax, orientations,
    }, null, 1) + '\n');
    process.exit(ok ? 0 : 1);
  })().catch(e => { console.error(e); process.exit(1); });
}
