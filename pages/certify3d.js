// Computer-assisted certificate that every surface close to an ellipsoid has an
// inscribed regular tetrahedron in a given orientation (PROOFS.md, Theorem 7).
//
// Unknowns p = (x, y, z, s): the centre and circumradius of a regular tetrahedron
// with fixed orientation, vertices v_k = c + s·w_k. The map
//     G(p) = (sd(v_0), sd(v_1), sd(v_2), sd(v_3))       (sd = signed distance)
// vanishes exactly at inscribed tetrahedra. Around a zero z of G_E (the ellipsoid)
// with Jacobian J, take the box Q = z + J⁻¹[−c, c]⁴, on whose boundary the linear
// map L(p) = J(p − z) has max-norm exactly c. If on ∂Q
//     ‖G_E − L‖∞ + T + (rounding) < c,
// then for every surface within radial distance T of the ellipsoid (where
// |sd − sd_E| ≤ T) the straight-line homotopy from G to L has no zero on ∂Q, so
// deg(G, Q, 0) = sign det J ≠ 0 and G has a zero in Q: an inscribed tetrahedron
// with circumradius at least min s over Q.
(function (global) {
  'use strict';

  // Signed distance to the ellipsoid Σ x_i²/a_i² = 1 (negative inside), by the
  // standard reduction to one monotone equation in t (bisection to full precision):
  // the closest point is q_i = a_i² p_i / (t + a_i²) with Σ (a_i p_i / (t + a_i²))² = 1.
  function ellipsoidSD(ax) {
    const a2 = ax.map(a => a * a), amin2 = Math.min(...a2);
    return p => {
      const F = t => { let s = 0; for (let i = 0; i < 3; i++) { const r = (ax[i] * p[i]) / (t + a2[i]); s += r * r; } return s - 1; };
      const inside = p[0] ** 2 / a2[0] + p[1] ** 2 / a2[1] + p[2] ** 2 / a2[2] < 1;
      let lo, hi;
      if (inside) {
        lo = -amin2; hi = 0;
        // Degenerate case (p on the plane of the shortest axis, in the middle): F stays
        // below 0 up to t = −a_min², and the closest point leaves that plane.
        const k = a2.indexOf(amin2), lim = p.map((v, i) => (i === k ? 0 : (a2[i] * v) / (a2[i] - amin2)));
        const rest = lim.reduce((s, v, i) => (i === k ? s : s + (v * v) / a2[i]), 0);
        if (Math.abs(p[k]) < 1e-300 || F(-amin2 * (1 - 1e-12)) < 0) {
          if (rest <= 1) { lim[k] = ax[k] * Math.sqrt(1 - rest); return -Math.hypot(p[0] - lim[0], p[1] - lim[1], p[2] - lim[2]); }
        }
      } else { lo = 0; hi = 1; while (F(hi) > 0) hi *= 2; }
      for (let it = 0; it < 200 && hi - lo > 1e-17 * (1 + Math.abs(lo) + Math.abs(hi)); it++) { const m = (lo + hi) / 2; if (F(m) > 0) lo = m; else hi = m; }
      const t = (lo + hi) / 2, q = p.map((v, i) => (a2[i] * v) / (t + a2[i]));
      const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      return inside ? -d : d;
    };
  }

  // Unit vectors to the vertices of a regular tetrahedron, rotated by Euler angles.
  function tetraDirs(e) {
    const W = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => v.map(x => x / Math.sqrt(3)));
    const [a, b, c] = e, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    const R = [[ca * cb, ca * sb * sc - sa * cc, ca * sb * cc + sa * sc], [sa * cb, sa * sb * sc + ca * cc, sa * sb * cc - ca * sc], [-sb, cb * sc, cb * cc]];
    return W.map(w => R.map(r => r[0] * w[0] + r[1] * w[1] + r[2] * w[2]));
  }

  const makeG = (sd, W) => p => W.map(w => sd([p[0] + p[3] * w[0], p[1] + p[3] * w[1], p[2] + p[3] * w[2]]));

  function solve4(A, b) {   // Gaussian elimination with partial pivoting
    const M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < 4; c++) {
      let piv = c; for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = c + 1; r < 4; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = [0, 0, 0, 0]; for (let r = 3; r >= 0; r--) { let s = M[r][4]; for (let k = r + 1; k < 4; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  function jacobian(G, p) {
    const J = [[], [], [], []], h = 1e-7;
    for (let c = 0; c < 4; c++) { const a = p.slice(), b = p.slice(); a[c] += h; b[c] -= h; const ga = G(a), gb = G(b); for (let r = 0; r < 4; r++) J[r][c] = (ga[r] - gb[r]) / (2 * h); }
    return J;
  }
  function refine(G, p) {
    for (let it = 0; it < 60; it++) {
      const g = G(p), d = solve4(jacobian(G, p), g.map(v => -v));
      p = p.map((v, i) => v + d[i]);
      if (Math.max(...d.map(Math.abs)) < 1e-15) break;
    }
    return { p, J: jacobian(G, p), residual: Math.max(...G(p).map(Math.abs)) };
  }
  function inv4(J) { return [0, 1, 2, 3].map(c => solve4(J, [0, 1, 2, 3].map(r => +(r === c)))).reduce((M, col, c) => (col.forEach((v, r) => (M[r][c] = v)), M), [[], [], [], []]); }
  function det4(A) {
    const M = A.map(r => r.slice()); let d = 1;
    for (let c = 0; c < 4; c++) {
      let piv = c; for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (piv !== c) { [M[c], M[piv]] = [M[piv], M[c]]; d = -d; }
      d *= M[c][c]; for (let r = c + 1; r < 4; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
    }
    return d;
  }
  const normInf = M => Math.max(...M.map(r => r.reduce((s, v) => s + Math.abs(v), 0)));

  // spec: { axes, euler, T, c, n (grid points per face edge), start }
  function certifyTetra(spec) {
    const sd = ellipsoidSD(spec.axes), W = tetraDirs(spec.euler), G = makeG(sd, W);
    const z = refine(G, spec.start || [0, 0, 0, Math.min(...spec.axes) * 0.9]);
    const J = z.J, Ji = inv4(J), c = spec.c, n = spec.n, h = (2 * c) / (n - 1);
    // Lipschitz constant of H = G_E − L in the max-norm on p: |Δv| ≤ (√3 + 1)|Δp|∞, sd is 1-Lipschitz.
    const lipH = Math.sqrt(3) + 1 + normInf(J);
    // Any boundary point is within h/2 (max-norm, y-space) of a sample on its face, i.e. within ‖J⁻¹‖∞·h/2 in p.
    const between = lipH * normInf(Ji) * (h / 2);
    let maxH = 0, samples = 0, sMin = Infinity;
    for (let face = 0; face < 8; face++) {
      const fixed = face >> 1, val = face & 1 ? c : -c;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const free = [-c + i * h, -c + j * h, -c + k * h], y = [];
        for (let d = 0, f = 0; d < 4; d++) y.push(d === fixed ? val : free[f++]);
        const p = z.p.map((v, r) => v + Ji[r][0] * y[0] + Ji[r][1] * y[1] + Ji[r][2] * y[2] + Ji[r][3] * y[3]);
        const g = G(p); samples++;
        for (let r = 0; r < 4; r++) maxH = Math.max(maxH, Math.abs(g[r] - y[r]));
      }
    }
    // Smallest circumradius on Q (s is affine in y, so its minimum is at a corner of the cube).
    for (let m = 0; m < 16; m++) { const y = [0, 1, 2, 3].map(b => (m >> b) & 1 ? c : -c); sMin = Math.min(sMin, z.p[3] + Ji[3].reduce((s, v, r) => s + v * y[r], 0)); }
    const rounding = 1e-9, bound = maxH + between + rounding, D = det4(J);
    return {
      ok: bound + spec.T < c && sMin > 0 && D !== 0 && Math.min(...spec.axes) > spec.T,
      T: spec.T, c, maxDeviation: maxH, betweenSamples: between, rounding, samples, maxT: c - bound,
      zero: z.p, residual: z.residual, detJ: D, degree: Math.sign(D), circumradiusLowerBound: sMin, dirs: W,
    };
  }

  const api = { ellipsoidSD, tetraDirs, makeG, refine, certifyTetra };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Certify3D = api;
})(typeof window !== 'undefined' ? window : globalThis);
