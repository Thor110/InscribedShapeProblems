#!/usr/bin/env node
// The computer-assisted proof of PROOFS.md, Theorem 7, in interval arithmetic:
// every surface whose radius stays within T = 0.06 of the ellipsoid with semi-axes
// 1, 0.8, 0.6 has an inscribed regular tetrahedron (in the orientation of
// tetraDirs() in pages/certify-rigorous.js). The 8 faces of the 4D box are checked
// in parallel worker threads. Writes data/certificate-tetrahedron.json and exits with
// code 0 if the certificate is valid.
//
//   node tools/certify-tetra.js            # the full certificate (about a minute on 4 cores)
//   node tools/certify-tetra.js --quick    # coarser grid, smaller T (seconds)
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), fs = require('fs'), path = require('path');
const R = require('../pages/certify-rigorous.js');

if (!isMainThread) {
  const { T, c, N, S, faces } = workerData;
  parentPort.postMessage(R.scan(R.tetraProblem(T, c, N), S, faces));
} else {
  const quick = process.argv.includes('--quick');
  const T = quick ? [1, 25] : [3, 50], c = quick ? 0.1 : 0.14, N = quick ? 60 : 200;
  const t0 = Date.now(), P = R.tetraProblem(T, c, N), S = R.setup(P), faces = R.allFaces(4);
  const nw = Math.max(1, Math.min(faces.length, os.cpus().length));
  const groups = [...Array(nw)].map((_, w) => faces.filter((_, i) => i % nw === w));

  Promise.all(groups.map(g => new Promise((res, rej) => {
    const w = new Worker(__filename, { workerData: { T, c, N, S, faces: g } });
    w.on('message', res); w.on('error', rej);
  }))).then(scans => {
    const r = R.finish(P, S, scans), radius = R.tetraRadius(P, r), seconds = (Date.now() - t0) / 1000, ok = r.ok && radius > 0;
    const f = (x, d = 4) => x.toFixed(d);
    console.log(`Certificate ${ok ? 'VALID' : 'FAILED'} for T = ${T[0] / T[1]} (ellipsoid 1 × 0.8 × 0.6), interval arithmetic`);
    console.log(`  tetrahedron on the ellipsoid: centre (${r.zero.slice(0, 3).map(v => f(v)).join(', ')}), circumradius ${f(r.zero[3])}`);
    console.log(`  degree (sign det J, det ∈ [${f(r.det[0])}, ${f(r.det[1])}]):  ${r.degree}`);
    console.log(`  box half-width c = ${c}; on ∂Q, |L|∞ ≥ c_eff = ${r.cEff.toFixed(9)}`);
    console.log(`  max |G − L| over ${r.samples.toLocaleString()} boundary samples:  ${f(r.maxDeviation)}`);
    console.log(`  + most it can change between samples:       ${f(r.betweenSamples)}`);
    console.log(`  + perturbation T:                           ${f(r.Teff)}`);
    console.log(`  = ${f(r.bound + r.Teff)}  <  c_eff = ${f(r.cEff)}: ${r.ok}`);
    console.log(`  largest T this box certifies:               ${f(r.room)}`);
    console.log(`  circumradius of the guaranteed tetrahedron ≥ ${f(radius)}`);
    console.log(`  ${seconds.toFixed(0)} s on ${nw} threads`);
    if (!quick) fs.writeFileSync(path.join(__dirname, '..', 'data', 'certificate-tetrahedron.json'), JSON.stringify({
      theorem: 'Every surface ρ(ω)·ω with ρ continuous and |ρ(ω) − r_E(ω)| ≤ T for all unit vectors ω, where r_E is the radial function of the ellipsoid x² + y²/0.8² + z²/0.6² = 1, has an inscribed regular tetrahedron with vertices x + s·w_k, w_k the directions of tetraDirs() in pages/certify-rigorous.js.',
      method: 'interval arithmetic with outward rounding (pages/interval.js, pages/certify-rigorous.js)',
      ellipsoid: { axes: [1, '4/5', '3/5'] }, orientation: 'Cayley rotation with q = (1/8, 1/4, 3/8)', T: `${T[0]}/${T[1]}`, ok, certificate: r, circumradiusLowerBound: radius, seconds,
    }, null, 1) + '\n');
    process.exit(ok ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(1); });
}
