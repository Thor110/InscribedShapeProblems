#!/usr/bin/env node
// The computer-assisted proof of PROOFS.md, Theorem 6, in interval arithmetic:
// every Jordan curve whose polar radius stays within T = 0.15 of the ellipse
// x² + y²/0.6² = 1's has an inscribed square. Writes data/certificates.json and exits
// with code 0 if the certificate is valid. Takes about a second.
'use strict';
const fs = require('fs'), path = require('path');
const R = require('../pages/certify-rigorous.js');

const T = [15, 100], c = 0.5, N = 20000;
const t0 = Date.now(), P = R.squareProblem(T, c, N), r = R.certify(P), diag = R.squareDiagonal(P, r, 200), seconds = (Date.now() - t0) / 1000;
const ok = r.ok && diag.guaranteed > 0;
const f = (x, d = 4) => x.toFixed(d), Tn = T[0] / T[1];

console.log(`Certificate ${ok ? 'VALID' : 'FAILED'} for T = ${Tn} (ellipse 1 × 0.6), interval arithmetic`);
console.log(`  square on the ellipse at t = t' = ${f(r.zero[0], 6)} (corners γ(t) and −γ(t'))`);
console.log(`  degree (sign det J, det ∈ [${f(r.det[0])}, ${f(r.det[1])}]):  ${r.degree}`);
console.log(`  box half-width c = ${c}; ${r.samples.toLocaleString()} boundary samples`);
console.log(`  min |G|∞ on the box edge:                   ${f(r.minG)} − ${r.gMoveBetweenSamples.toExponential(2)} (between samples) = ${f(r.minGBoundary)}`);
console.log(`  degree: |G − L| < |G| on the edge, margin   ${f(r.degMargin)} > ${f(r.gMoveBetweenSamples + r.betweenSamples)}: ${r.degreeHolds}`);
console.log(`  perturbation (1 + √2)·T = ${f(r.Teff)}  <  ${f(r.minGBoundary)}: ${r.direct}`);
console.log(`  largest T this box certifies:               ${f(r.roomDirect / (1 + Math.SQRT2))}`);
console.log(`  diagonal of the guaranteed square ≥ ${f(diag.minDiagonal)} − 2T = ${f(diag.guaranteed)}`);
console.log(`  Chambers' allowance 1/(10κ) for this ellipse: 0.0360  →  T is ${f(Tn / 0.036, 2)}× larger`);
console.log(`  ${seconds.toFixed(1)} s`);

fs.writeFileSync(path.join(__dirname, '..', 'data', 'certificates.json'), JSON.stringify({
  theorem: 'Every Jordan curve ρ(θ)(cos θ, sin θ) with ρ continuous and |ρ(θ) − r_E(θ)| ≤ T for all θ, where r_E is the polar radius of the ellipse x² + y²/0.6² = 1, has an inscribed square.',
  method: 'interval arithmetic with outward rounding (pages/interval.js, pages/certify-rigorous.js)',
  ellipse: { a: 1, b: '3/5' }, T: `${T[0]}/${T[1]}`, chambersAllowance: 0.036, ok, certificate: r, diagonal: diag, seconds,
}, null, 1) + '\n');
process.exit(ok ? 0 : 1);
