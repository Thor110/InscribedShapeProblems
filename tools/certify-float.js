// Floating-point, exploratory version of the square certificate. It was used to
// explore which curves can be certified (the negative Weierstrass-blob result in
// PROOFS.md). The rigorous, interval-arithmetic certificate of Theorem 6 is
// pages/certify-rigorous.js.
//
// Setting. ρ(θ) = r_K(θ) + (tail), a radial curve ρ(θ)(cos θ, sin θ), where r_K is
// an explicit smooth trigonometric polynomial (the first K octaves of a
// Weierstrass-type function) and the tail is ANY continuous function with
// |tail| ≤ T. Parametrise both curves by u ∈ [0,1), θ = 2πu.
//
// For opposite corners A = γ(u), C = γ(v) the other corners of the square are
//     B, D = M ± R(h),   M = (A + C)/2,   h = (C − A)/2,   R = rotation by 90°,
// and G(u, v) = (sd(B), sd(D)) vanishes exactly at inscribed squares (sd = signed
// distance to the curve).
//
// Certificate for a box Q in (u, v):
//   (1) on ∂Q, max(|g₁|, |g₂|) > (1 + √2)·T + 2e + (rounding margin), where G is
//       computed for r_K, e bounds the error of the polygon used for sd;
//   (2) the winding number of G around ∂Q is non-zero;
//   (3) the corners A, C stay apart on Q (so the square is non-degenerate).
// Then every curve within T of r_K (in particular the full fractal, for every
// choice of the tail's phases) has an inscribed square with (u, v) ∈ Q.
//
// (1) and (2) are checked at sample points with spacing s and a Lipschitz bound L
// for G between samples: if max|g_i| > threshold + L·s at every sample, the bound
// holds on the whole boundary, and every angle step is below π/2 so the winding
// number is computed exactly.
(function (global) {
  'use strict';
  const S2 = () => global.Shapes2D || (require('../pages/shapes2d.js'), globalThis.Shapes2D);
  const TAU = 2 * Math.PI;

  // The Weierstrass blob of shapes2d.js (same seed → same m and phases).
  function weierstrassFamily(seed) {
    const R = S2().rng(seed), m = 2 + Math.floor(R() * 2), ph = Array.from({ length: 16 }, () => R() * TAU);
    const a = k => 0.085 * Math.pow(2, -k / 2);
    return {
      m, ph, a,
      r: K => th => { let s = 1; for (let k = 0; k < K; k++) s += a(k) * Math.cos(m * (1 << k) * th + ph[k]); return s; },
      // |r_K'| and |r_K''| bounds (term by term)
      d1: K => { let s = 0; for (let k = 0; k < K; k++) s += a(k) * m * (1 << k); return s; },
      d2: K => { let s = 0; for (let k = 0; k < K; k++) s += a(k) * (m * (1 << k)) ** 2; return s; },
      // sup of the tail beyond K octaves, for ANY phases: Σ_{k≥K} a_k
      tail: K => a(K) / (1 - Math.SQRT1_2),
    };
  }

  // Smooth radial curve r(θ) sampled as a polygon with n vertices (all on the curve).
  // Returns sd (polygon), gamma (exact curve point), and the parameter-wise distance
  // bound e between the polygon and the curve.
  function radialCurve(r, n, d1, d2, rmax) {
    const pts = Array.from({ length: n }, (_, i) => { const t = (i / n) * TAU, q = r(t); return { x: q * Math.cos(t), y: q * Math.sin(t) }; });
    const G = S2().accel(pts);
    const gamma = u => { const t = u * TAU, q = r(t); return [q * Math.cos(t), q * Math.sin(t)]; };
    // |γ''(θ)| ≤ |r''| + 2|r'| + r for γ = r e^{iθ}; the chord between consecutive
    // vertices deviates from the arc by at most h²/8·sup|γ''|, and the point at the
    // same parameter u by at most h·sup|γ'| (the polygon is parametrised linearly
    // in u on each edge): use e = h·sup|γ'| as a safe parameter-wise bound.
    const h = TAU / n, speed = Math.hypot(rmax, d1), e = h * speed + (h * h / 8) * (d2 + 2 * d1 + rmax);
    return { pts, sd: (x, y) => (G.inside(x, y) ? -1 : 1) * G.dist(x, y), gamma, e, speedU: TAU * (rmax + d1) };
  }

  function makeG(C) {
    return (u, v) => {
      const A = C.gamma(u), Cc = C.gamma(v), mx = (A[0] + Cc[0]) / 2, my = (A[1] + Cc[1]) / 2, hx = (Cc[0] - A[0]) / 2, hy = (Cc[1] - A[1]) / 2;
      return [C.sd(mx - hy, my + hx), C.sd(mx + hy, my - hx)];
    };
  }

  // Newton refinement of a zero of G (finite-difference Jacobian).
  function refine(G, u, v) {
    for (let it = 0; it < 50; it++) {
      const g = G(u, v), h = 1e-9, J = [[0, 0], [0, 0]];
      for (let c = 0; c < 2; c++) { const gp = c ? G(u, v + h) : G(u + h, v), gm = c ? G(u, v - h) : G(u - h, v); J[0][c] = (gp[0] - gm[0]) / (2 * h); J[1][c] = (gp[1] - gm[1]) / (2 * h); }
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; if (!det) return null;
      const du = (-g[0] * J[1][1] + g[1] * J[0][1]) / det, dv = (g[0] * J[1][0] - g[1] * J[0][0]) / det;
      u += du; v += dv;
      if (Math.abs(du) + Math.abs(dv) < 1e-15) return { u, v, J, residual: Math.hypot(...G(u, v)) };
    }
    return null;
  }

  // Check a box: the parallelogram P = z + J⁻¹([−c, c]²), on whose boundary the
  // linearisation of G has sup-norm exactly c. Walk ∂P with spacing s (in the
  // (u, v) max-norm) and return the certified margin and winding number.
  function checkBox(G, z, Jinv, c, lip, s) {
    const corners = [[-c, -c], [c, -c], [c, c], [-c, c]].map(([a, b]) => [z.u + Jinv[0][0] * a + Jinv[0][1] * b, z.v + Jinv[1][0] * a + Jinv[1][1] * b]);
    let minSup = Infinity, wind = 0, prev = null, first = null, samples = 0;
    for (let k = 0; k < 4; k++) {
      const p = corners[k], q = corners[(k + 1) % 4], len = Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])), n = Math.max(2, Math.ceil(len / s));
      for (let i = 0; i < n; i++) {
        const t = i / n, g = G(p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])); samples++;
        minSup = Math.min(minSup, Math.max(Math.abs(g[0]), Math.abs(g[1])));
        if (prev) { let d = Math.atan2(g[1], g[0]) - Math.atan2(prev[1], prev[0]); while (d > Math.PI) d -= TAU; while (d <= -Math.PI) d += TAU; wind += d; } else first = g;
        prev = g;
      }
    }
    let d = Math.atan2(first[1], first[0]) - Math.atan2(prev[1], prev[0]); while (d > Math.PI) d -= TAU; while (d <= -Math.PI) d += TAU; wind += d;
    // margin that holds on the whole boundary: subtract the most G can change between samples
    return { minSup, margin: minSup - lip * s, winding: Math.round(wind / TAU), windRaw: wind / TAU, samples, corners };
  }

  // Full certificate for a smooth radial curve r (with analytic bounds rmax ≥ r,
  // d1 ≥ |r'|, d2 ≥ |r''|, rmin ≤ r), a starting guess (u0, v0) for a square, a
  // box size c and a claimed perturbation radius T. Every quantity used is returned.
  function certify(spec) {
    const n = spec.polygon || 1 << 19, { r, rmax, rmin, d1, d2, T } = spec;
    const C = radialCurve(r, n, d1, d2, rmax), G = makeG(C);
    const eRad = 2 * (TAU / n) * Math.hypot(rmax, d1);          // polygon ↔ curve, radially
    const speedU = TAU * (rmax + d1), lip = Math.SQRT2 * speedU;   // |ΔB| ≤ lip·|Δ(u,v)|∞
    const z = refine(G, spec.u0, spec.v0);
    if (!z) return { ok: false, reason: 'Newton did not converge' };
    const det = z.J[0][0] * z.J[1][1] - z.J[0][1] * z.J[1][0], Jinv = [[z.J[1][1] / det, -z.J[0][1] / det], [-z.J[1][0] / det, z.J[0][0] / det]];
    const s = spec.c / (30 * lip), box = checkBox(G, z, Jinv, spec.c, lip, s);
    const rounding = 1e-9, threshold = (1 + Math.SQRT2) * T + eRad + rounding;
    const boundaryMin = box.minSup - lip * s;   // holds on the whole boundary
    // Non-degeneracy. (i) The u-range and v-range of the box are disjoint (mod 1), so
    // A = γ(u) and C = γ(v) are distinct points of a Jordan curve. (ii) A lower bound
    // for the diagonal: its minimum over a grid on the box, minus the most it can
    // change within a grid cell, minus 2T for the perturbation.
    const us = box.corners.map(q => q[0]), vs = box.corners.map(q => q[1]);
    const uLo = Math.min(...us), uHi = Math.max(...us), vLo = Math.min(...vs), vHi = Math.max(...vs);
    const gap = ((vLo - uHi) % 1 + 1) % 1, gap2 = ((uLo - vHi) % 1 + 1) % 1;
    const disjoint = gap > 0 && gap2 > 0 && gap + gap2 + (uHi - uLo) + (vHi - vLo) <= 1 + 1e-12;
    const A = C.gamma(z.u), Cc = C.gamma(z.v), diag0 = Math.hypot(A[0] - Cc[0], A[1] - Cc[1]);
    const NG = 200, [P0, P1, , P3] = box.corners; let dmin = Infinity;
    for (let i = 0; i <= NG; i++) for (let j = 0; j <= NG; j++) {
      const uu = P0[0] + (i / NG) * (P1[0] - P0[0]) + (j / NG) * (P3[0] - P0[0]), vv = P0[1] + (i / NG) * (P1[1] - P0[1]) + (j / NG) * (P3[1] - P0[1]);
      const p = C.gamma(uu), q2 = C.gamma(vv); dmin = Math.min(dmin, Math.hypot(p[0] - q2[0], p[1] - q2[1]));
    }
    const cell = Math.max(Math.abs(P1[0] - P0[0]) + Math.abs(P3[0] - P0[0]), Math.abs(P1[1] - P0[1]) + Math.abs(P3[1] - P0[1])) / NG;
    const diagMin = dmin - 2 * speedU * cell - 2 * T;
    const ok = box.winding !== 0 && boundaryMin > threshold && disjoint && diagMin > 0 && rmin > T;
    return {
      ok, T, threshold, boundaryMin, winding: box.winding, windingRaw: box.windRaw, samples: box.samples, spacing: s, lip, eRad, rounding,
      polygon: n, zero: { u: z.u, v: z.v, residual: z.residual }, box: box.corners, boxSize: spec.c, uRange: [uLo, uHi], vRange: [vLo, vHi], rangesDisjoint: disjoint, diagonalAtZero: diag0, diagonalLowerBound: diagMin,
      maxT: (boundaryMin - eRad - rounding) / (1 + Math.SQRT2),
    };
  }

  const api = { weierstrassFamily, radialCurve, makeG, refine, checkBox, certify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Certify = api;
})(typeof window !== 'undefined' ? window : globalThis);
