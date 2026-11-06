#!/usr/bin/env node
// The computer-assisted proof of PROOFS.md, Theorem 7, in interval arithmetic:
// every surface whose radius stays within T = 0.12 of the ellipsoid with semi-axes
// 1, 0.8, 0.6 has an inscribed regular tetrahedron (in the orientation of
// tetraDirs() in pages/certify-rigorous.js). The 8 faces of the 4D box are checked
// in parallel worker threads. Writes data/certificate-tetrahedron.json and exits with
// code 0 if the certificate is valid.
//
//   node tools/certify-tetra.js            # the full certificate (about two minutes on 4 cores)
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
  const T = quick ? [1, 25] : [3, 25], c = quick ? 0.1 : 0.24, N = quick ? 60 : 200;
  const t0 = Date.now(), P = R.tetraProblem(T, c, N), S = R.setup(P), faces = R.allFaces(4);
  const nw = Math.max(1, Math.min(faces.length, os.cpus().length));
  const groups = [...Array(nw)].map((_, w) => faces.filter((_, i) => i % nw === w));

  Promise.all(groups.map(g => new Promise((res, rej) => {
    const w = new Worker(__filename, { workerData: { T, c, N, S, faces: g } });
    w.on('message', res); w.on('error', rej);
  }))).then(scans => {
    const r = R.finish(P, S, scans), radius = R.tetraRadius(P, r), sMax = R.tetraRadius(P, r, true), seconds = (Date.now() - t0) / 1000, ok = r.ok && radius > 0;
    const f = (x, d = 4) => x.toFixed(d), deg = a => (a * 180) / Math.PI;
    const orient = [0, 0.03, 0.06, 0.09, T[0] / T[1]].map(t => ({ T: t, angle: R.orientationAngle(r, t, sMax) }));
    console.log(`Certificate ${ok ? 'VALID' : 'FAILED'} for T = ${T[0] / T[1]} (ellipsoid 1 × 0.8 × 0.6), interval arithmetic, ${r.method} method`);
    console.log(`  tetrahedron on the ellipsoid: centre (${r.zero.slice(0, 3).map(v => f(v)).join(', ')}), circumradius ${f(r.zero[3])}`);
    console.log(`  degree (sign det J, det ∈ [${f(r.det[0])}, ${f(r.det[1])}]):  ${r.degree}`);
    console.log(`  box half-width c = ${c}; ${r.samples.toLocaleString()} boundary samples`);
    console.log(`  min |G|∞ on the box edge:                   ${f(r.minG)} − ${f(r.gMoveBetweenSamples)} (between samples) = ${f(r.minGBoundary)}`);
    console.log(`  degree: |G − L| < |G| on the edge, margin   ${f(r.degMargin)} > ${f(r.gMoveBetweenSamples + r.betweenSamples)}: ${r.degreeHolds}`);
    console.log(`  perturbation T = ${f(r.Teff)}  <  ${f(r.minGBoundary)}: ${r.direct}`);
    console.log(`  circumradius of the guaranteed tetrahedron between ${f(radius)} and ${f(sMax)}`);
    console.log('  every orientation within angle α of the given one, for surfaces within T:');
    for (const o of orient) console.log(`    T = ${f(o.T, 2)}:  α = ${f(o.angle)} rad = ${f(deg(o.angle), 2)}°`);
    console.log(`  ${seconds.toFixed(0)} s on ${nw} threads`);
    if (!quick) fs.writeFileSync(path.join(__dirname, '..', 'data', 'certificate-tetrahedron.json'), JSON.stringify({
      theorem: 'Every surface ρ(ω)·ω with ρ continuous and |ρ(ω) − r_E(ω)| ≤ T for all unit vectors ω, where r_E is the radial function of the ellipsoid x² + y²/0.8² + z²/0.6² = 1, has an inscribed regular tetrahedron with vertices x + s·w_k, w_k the directions of tetraDirs() in pages/certify-rigorous.js.',
      method: 'interval arithmetic with outward rounding (pages/interval.js, pages/certify-rigorous.js)',
      ellipsoid: { axes: [1, '4/5', '3/5'] }, orientation: 'Cayley rotation with q = (1/8, 1/4, 3/8)', T: `${T[0]}/${T[1]}`, ok, certificate: r, circumradiusLowerBound: radius, circumradiusUpperBound: sMax, orientations: orient, seconds,
    }, null, 1) + '\n');
    process.exit(ok ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(1); });
}
