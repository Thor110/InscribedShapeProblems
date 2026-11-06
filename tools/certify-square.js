// Computer-assisted certificate (PROOFS.md, Theorem 6): every radial Jordan curve
// whose radius stays within T of the 1 × 0.6 ellipse's has an inscribed square,
// in particular nowhere-differentiable, non-symmetric fractal curves such as the
// ellipse plus a random-phase Weierstrass ripple of size up to T.
// Writes data/certificates.json and prints every quantity the proof uses.
// Usage: node tools/certify-square.js
const fs = require('fs'), path = require('path');
const Cf = require('../pages/certify.js');
const a = 1, b = 0.6, T = 0.13;
// Ellipse in polar form about its centre, with analytic bounds:
//   r = (cos²θ/a² + sin²θ/b²)^(-1/2),  b ≤ r ≤ a,
//   r' = −(r³/2)·sin 2θ·(1/b² − 1/a²)          ⇒ |r'| ≤ (a³/2)·q,  q = 1/b² − 1/a²,
//   r'' = (3/r)·r'² − r³·cos 2θ·q             ⇒ |r''| ≤ 3a⁵q²/4·(4/(b·a))… bounded crudely by 3a⁵q² + a³q.
const q = 1 / b ** 2 - 1 / a ** 2;
const spec = {
  r: th => 1 / Math.sqrt((Math.cos(th) / a) ** 2 + (Math.sin(th) / b) ** 2),
  rmax: a, rmin: b, d1: (a ** 3 * q) / 2, d2: 3 * a ** 5 * q * q + a ** 3 * q,
  T, u0: 0.125, v0: 0.625, c: 0.5, polygon: 1 << 19,
};
const t0 = Date.now(), cert = Cf.certify(spec);
const curvature = a / b ** 2;   // maximum curvature of the ellipse
const out = {
  theorem: 'Every Jordan curve ρ(θ)(cos θ, sin θ) with ρ continuous and |ρ(θ) − r_E(θ)| ≤ T for all θ, where r_E is the polar radius of the ellipse x² + y²/0.6² = 1, has an inscribed square.',
  ellipse: { a, b }, T, chambersAllowance: 1 / (10 * curvature), ratioToChambers: T / (1 / (10 * curvature)),
  certificate: cert, seconds: (Date.now() - t0) / 1000,
};
fs.writeFileSync(path.resolve(__dirname, '../data/certificates.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Certificate ${cert.ok ? 'VALID' : 'FAILED'} for T = ${T} (ellipse ${a} × ${b})`);
console.log(`  winding number of G around the box:        ${cert.winding} (computed ${cert.windingRaw.toFixed(6)})`);
console.log(`  min max(|g1|,|g2|) on the box boundary:     ${cert.boundaryMin.toFixed(6)}  (after the Lipschitz allowance between ${cert.samples} samples)`);
console.log(`  needed: (1+√2)T + e + rounding =            ${cert.threshold.toFixed(6)}`);
console.log(`  polygon error e (2^19 vertices):            ${cert.eRad.toExponential(2)}`);
console.log(`  box u-range ${cert.uRange.map(x=>x.toFixed(4)).join('–')}, v-range ${cert.vRange.map(x=>x.toFixed(4)).join('–')}: disjoint = ${cert.rangesDisjoint}`);
 console.log(`  diagonal of the guaranteed square ≥        ${cert.diagonalLowerBound.toFixed(4)}  (the ellipse's own square: ${cert.diagonalAtZero.toFixed(4)})`);
console.log(`  largest T this box certifies:               ${cert.maxT.toFixed(4)}`);
console.log(`  Chambers' allowance for this ellipse 1/(10κ): ${out.chambersAllowance.toFixed(4)}  →  T is ${out.ratioToChambers.toFixed(2)}× larger`);
process.exit(cert.ok ? 0 : 1);
