#!/usr/bin/env node
// The computer-assisted proof of PROOFS.md, Theorem 7: every surface whose radius
// stays within T = 0.04 of the ellipsoid with semi-axes 1, 0.8, 0.6 has an inscribed
// regular tetrahedron (in the orientation given below). Writes
// data/certificate-tetrahedron.json and exits with code 0 if the certificate is valid.
//
//   node tools/certify-tetra.js            # the full certificate (about a minute)
//   node tools/certify-tetra.js --quick    # coarser grid, smaller T (seconds)
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../pages/certify3d.js');

const quick = process.argv.includes('--quick');
const spec = { axes: [1, 0.8, 0.6], euler: [0.3, 0.5, 0.7], T: quick ? 0.02 : 0.04, c: 0.09, n: quick ? 40 : 120 };
const t0 = Date.now(), r = C.certifyTetra(spec), seconds = (Date.now() - t0) / 1000;
const f = (x, d = 4) => x.toFixed(d);

console.log(`Certificate ${r.ok ? 'VALID' : 'FAILED'} for T = ${spec.T} (ellipsoid ${spec.axes.join(' × ')}, orientation ${spec.euler.join(', ')})`);
console.log(`  tetrahedron on the ellipsoid: centre (${r.zero.slice(0, 3).map(v => f(v)).join(', ')}), circumradius ${f(r.zero[3])}, residual ${r.residual.toExponential(1)}`);
console.log(`  degree of G on the box (sign det J):         ${r.degree}`);
console.log(`  box half-width c (in G units):               ${r.c}`);
console.log(`  max |G − L| at ${r.samples.toLocaleString()} boundary samples:  ${f(r.maxDeviation)}`);
console.log(`  + most it can change between samples:      ${f(r.betweenSamples)}`);
console.log(`  + rounding allowance:                      ${r.rounding}`);
console.log(`  = room left for a perturbation:            ${f(r.maxT)}  (needed: T = ${spec.T})`);
console.log(`  circumradius of the guaranteed tetrahedron ≥ ${f(r.circumradiusLowerBound)}`);
console.log(`  ${seconds.toFixed(0)} s`);

if (!quick) {
  const out = {
    theorem: 'Every surface ρ(ω)·ω with ρ continuous and |ρ(ω) − r_E(ω)| ≤ T for all unit vectors ω, where r_E is the radial function of the ellipsoid x² + y²/0.8² + z²/0.6² = 1, has an inscribed regular tetrahedron with the orientation given by the Euler angles below.',
    ...spec, certificate: { ...r, dirs: undefined }, seconds,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'certificate-tetrahedron.json'), JSON.stringify(out, null, 1) + '\n');
}
process.exit(r.ok ? 0 : 1);
