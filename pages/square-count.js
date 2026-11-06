// Counting every inscribed square (and rectangle) on a curve.
//
// Parametrise the curve by u ∈ [0,1) (piecewise linear through its vertices,
// counter-clockwise). Two opposite corners A = γ(u), C = γ(v) determine the
// rectangle with diagonal AC whose other diagonal BD is AC rotated by ψ about the
// midpoint (ψ = 90° for a square, 2·atan(1/aspect) in general). It is inscribed
// exactly when B and D lie on the curve:
//     G(u, v) = ( sd(B), sd(D) ) = 0,     sd = signed distance to the curve.
// G is continuous even for very rough curves (unlike the ray-based jig).
//
// enumerate() finds every zero of G with the diagonal's parameter gap in
// [wMin, 1/2] on a fine grid plus Newton's method, i.e. every inscribed square or
// rectangle (each square is found once per diagonal).
//
// Why count? For a generic smooth curve the number of inscribed squares is odd
// (Schnirelmann's argument): as a curve deforms, squares are created and destroyed
// in pairs, so the parity can only change if a square shrinks to a point, which is
// exactly what the open problem has to rule out for rough curves. Rectangles of
// any other aspect ratio come in even numbers, which is why counting cannot prove
// that they exist. (Counted with signs, the two diagonals of a square have opposite
// signs, so the signed total is always 0; the parity is the invariant.)
(function (global) {
  'use strict';
  const S2 = () => global.Shapes2D || (require('./shapes2d.js'), globalThis.Shapes2D);

  function prepare(pts) {
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; }
    const P = a < 0 ? pts.slice().reverse() : pts.slice(), G = S2().accel(P), N = P.length;
    const gamma = u => { u = ((u % 1) + 1) % 1; const t = u * N, i = Math.floor(t) % N, f = t - Math.floor(t), p = P[i], q = P[(i + 1) % N]; return [p.x + f * (q.x - p.x), p.y + f * (q.y - p.y)]; };
    const sd = (x, y) => (G.inside(x, y) ? -1 : 1) * G.dist(x, y);
    return { P, N, S: G.S, gamma, sd, inside: G.inside };
  }

  // Diagonal formulation: A = γ(u), C = γ(v) are opposite corners; the other two
  // corners are B, D = M ± Rot(ψ)·h with M the midpoint, h = (C − A)/2 and
  // ψ = 2·atan(1/aspect) the angle between the diagonals (90° for a square).
  function makeG(C, aspect = 1) {
    const psi = 2 * Math.atan(1 / aspect), c = Math.cos(psi), s = Math.sin(psi);
    return (u, v) => {
      const A = C.gamma(u), Cc = C.gamma(v), mx = (A[0] + Cc[0]) / 2, my = (A[1] + Cc[1]) / 2, hx = (Cc[0] - A[0]) / 2, hy = (Cc[1] - A[1]) / 2;
      const rx = c * hx - s * hy, ry = s * hx + c * hy;
      return [C.sd(mx + rx, my + ry) / C.S, C.sd(mx - rx, my - ry) / C.S];
    };
  }
  // Same corners, but only which side of the curve each lies on (bit 1: B outside, bit 2: D outside).
  function makeSides(C, aspect = 1) {
    const psi = 2 * Math.atan(1 / aspect), c = Math.cos(psi), s = Math.sin(psi);
    return (u, v) => {
      const A = C.gamma(u), Cc = C.gamma(v), mx = (A[0] + Cc[0]) / 2, my = (A[1] + Cc[1]) / 2, hx = (Cc[0] - A[0]) / 2, hy = (Cc[1] - A[1]) / 2;
      const rx = c * hx - s * hy, ry = s * hx + c * hy;
      return (C.inside(mx + rx, my + ry) ? 0 : 1) | (C.inside(mx - rx, my - ry) ? 0 : 2);
    };
  }

  // Find every zero of G with diagonal gap w = (v − u) mod 1 in [wMin, 1/2], i.e.
  // every inscribed square/rectangle whose opposite corners are at least wMin apart
  // in parameter. (u, w) is scanned on an M × M/2 grid; a cell is a candidate when
  // both components change sign across its corners; Newton's method then finds the
  // zero. With w ≤ 1/2 each rectangle (aspect ≠ 1) appears once and each square
  // twice (once per diagonal). Each zero carries the sign of the Jacobian.
  function* enumerateGen(pts, opts = {}) {
    const C = opts.prepared || prepare(pts), aspect = opts.aspect || 1, G = makeG(C, aspect);
    const M = opts.M || Math.max(512, 2 * C.N), wMin = opts.wMin ?? 0.002, Mw = Math.ceil(M / 2);
    const sides = makeSides(C, aspect), wAt = j => wMin + (0.5 - wMin) * (j / Mw), signs = (u, w) => sides(u, u + w);
    let prev = new Uint8Array(Mw + 1), cur = new Uint8Array(Mw + 1);
    for (let j = 0; j <= Mw; j++) prev[j] = signs(0, wAt(j));
    const zeros = [], h = 1e-9;
    const newton = (u, w) => {
      for (let it = 0; it < 40; it++) {
        const g = G(u, u + w), J = [[0, 0], [0, 0]];
        for (let c = 0; c < 2; c++) { const du = c ? 0 : h, dw = c ? h : 0, gp = G(u + du, u + du + w + dw), gm = G(u - du, u - du + w - dw); J[0][c] = (gp[0] - gm[0]) / (2 * h); J[1][c] = (gp[1] - gm[1]) / (2 * h); }
        const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; if (!det) return null;
        const du = (-g[0] * J[1][1] + g[1] * J[0][1]) / det, dw = (g[0] * J[1][0] - g[1] * J[0][0]) / det;
        u += du; w += dw;
        if (Math.abs(du) + Math.abs(dw) < 1e-15) { const gg = G(u, u + w); return Math.hypot(...gg) < 1e-12 ? { u: ((u % 1) + 1) % 1, w, sign: Math.sign(det) } : null; }
      }
      return null;
    };
    for (let i = 1; i <= M; i++) {
      const u = i / M;
      for (let j = 0; j <= Mw; j++) cur[j] = signs(u, wAt(j));
      for (let j = 0; j < Mw; j++) {
        const a = prev[j], b = prev[j + 1], c = cur[j], d = cur[j + 1];
        const ch1 = ((a ^ b) | (a ^ c) | (a ^ d)) & 1, ch2 = ((a ^ b) | (a ^ c) | (a ^ d)) & 2;
        if (ch1 && ch2) {
          // Several solutions can share a cell: scan a K × K sub-grid of it and solve
          // from every sub-cell that still shows both sign changes.
          const K = 6, u0 = u - 1 / M, w0 = wAt(j), dw = (wAt(j + 1) - w0) / K, sub = [];
          for (let a2 = 0; a2 <= K; a2++) { sub.push([]); for (let b2 = 0; b2 <= K; b2++) sub[a2].push(signs(u0 + a2 / (M * K), w0 + b2 * dw)); }
          const starts = [];
          for (let a2 = 0; a2 < K; a2++) for (let b2 = 0; b2 < K; b2++) {
            const p0 = sub[a2][b2], p1 = sub[a2 + 1][b2], p2 = sub[a2][b2 + 1], p3 = sub[a2 + 1][b2 + 1], x2 = (p0 ^ p1) | (p0 ^ p2) | (p0 ^ p3);
            if ((x2 & 1) && (x2 & 2)) starts.push([u0 + (a2 + 0.5) / (M * K), w0 + (b2 + 0.5) * dw]);
          }
          if (!starts.length) starts.push([u - 0.5 / M, (wAt(j) + wAt(j + 1)) / 2]);
          for (const st of starts) {
          const z = newton(st[0], st[1]);
          // Same diagonal if the unordered pair of corner parameters matches (a gap of
          // exactly 1/2 can be found in both orders).
          const same = q => { const d = (x, y) => Math.min(Math.abs(x - y), 1 - Math.abs(x - y)); const e = ((z.u + z.w) % 1 + 1) % 1, f = ((q.u + q.w) % 1 + 1) % 1; return (d(q.u, z.u) < 1e-9 && d(f, e) < 1e-9) || (d(q.u, e) < 1e-9 && d(f, z.u) < 1e-9); };
          if (z && z.w >= wMin && z.w <= 0.5 + 1e-9 && !zeros.some(same)) {
            const A = C.gamma(z.u), Cc = C.gamma(z.u + z.w); z.diag = Math.hypot(Cc[0] - A[0], Cc[1] - A[1]) / C.S; zeros.push(z);
          }
          }
        }
      }
      [prev, cur] = [cur, prev];
      if (i % 64 === 0) yield { done: i / M, zeros: zeros.length };
    }
    const n = aspect === 1 ? zeros.length / 2 : zeros.length;
    return { zeros, count: n, parity: Number.isInteger(n) ? (n % 2 ? 'odd' : 'even') : 'unpaired', signedSum: zeros.reduce((s2, z) => s2 + z.sign, 0), M, wMin };
  }
  function enumerate(pts, opts) { const g = enumerateGen(pts, opts); let x; while (!(x = g.next()).done); return x.value; }

  const api = { prepare, makeG, enumerate, enumerateGen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.SquareCount = api;
})(typeof window !== 'undefined' ? window : globalThis);
