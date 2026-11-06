// Inscribed regular polytopes in any dimension.
//
// The skeletal jig generalises directly to R^n: rays from a pivot point along the
// vertex directions of a regular polytope. When every ray has the same length,
// the hit points are the vertices of that polytope inscribed in the surface.
// The jig has n (position) + n(n-1)/2 (rotation) degrees of freedom.
//
// Works in the browser (window.InscribedND) and in Node (module.exports).
(function (global) {
  'use strict';

  // ---------- random numbers ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const gauss = R => Math.sqrt(-2 * Math.log(R() + 1e-300)) * Math.cos(2 * Math.PI * R());
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const norm = a => Math.sqrt(dot(a, a));
  const unit = a => { const L = norm(a); return a.map(v => v / L); };
  const randUnit = (n, R) => unit(Array.from({ length: n }, () => gauss(R)));

  // ---------- small matrices ----------
  const eye = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const matVec = (A, v) => A.map(r => dot(r, v));
  const matMul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  function solve(A, b) { // Gaussian elimination with partial pivoting
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-300) return null; [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  function inverse(A) { const n = A.length, cols = eye(n).map(e => solve(A, e)); return A.map((_, i) => cols.map(c => c[i])); }
  // Rotation from n(n-1)/2 parameters via the Cayley transform (exactly orthogonal).
  function cayley(w, n) {
    const A = Array.from({ length: n }, () => new Array(n).fill(0)); let k = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { A[i][j] = w[k] / 2; A[j][i] = -w[k] / 2; k++; }
    const P = eye(n).map((r, i) => r.map((v, j) => v + A[i][j])), M = eye(n).map((r, i) => r.map((v, j) => v - A[i][j]));
    return matMul(inverse(M), P);
  }
  function randomRotation(n, R) { // Gram–Schmidt on a Gaussian matrix, with det = +1
    const Q = [];
    for (let i = 0; i < n; i++) {
      let v = Array.from({ length: n }, () => gauss(R));
      for (const q of Q) { const d = dot(v, q); v = v.map((x, k) => x - d * q[k]); }
      Q.push(unit(v));
    }
    // fix orientation: flip the first row if the determinant is negative
    const L = Q.map(r => r.slice()); let det = 1;
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(L[r][c]) > Math.abs(L[p][c])) p = r;
      if (p !== c) { [L[c], L[p]] = [L[p], L[c]]; det = -det; }
      det *= L[c][c];
      for (let r = c + 1; r < n; r++) { const f = L[r][c] / L[c][c]; for (let k = c; k < n; k++) L[r][k] -= f * L[c][k]; }
    }
    if (det < 0) Q[0] = Q[0].map(v => -v);
    return Q;
  }

  // ---------- regular polytopes: unit vertex directions from the centre ----------
  const SHAPES = {
    simplex: { label: 'Regular simplex', vertices: n => n + 1 },
    cross: { label: 'Cross-polytope', vertices: n => 2 * n },
    cube: { label: 'Hypercube', vertices: n => 2 ** n },
  };
  function shapeName(shape, n) {
    const names = { simplex: { 2: 'equilateral triangle', 3: 'regular tetrahedron', 4: 'regular 5-cell' }, cross: { 2: 'square', 3: 'regular octahedron', 4: 'regular 16-cell' }, cube: { 2: 'square', 3: 'cube', 4: 'tesseract' } };
    return (names[shape] && names[shape][n]) || `${n}-${shape === 'cross' ? 'orthoplex' : shape}`;
  }
  function directions(shape, n) {
    if (shape === 'cross') { const out = []; for (let i = 0; i < n; i++) for (const s of [1, -1]) { const v = new Array(n).fill(0); v[i] = s; out.push(v); } return out; }
    if (shape === 'cube') return Array.from({ length: 2 ** n }, (_, m) => Array.from({ length: n }, (_, i) => ((m >> i) & 1 ? 1 : -1) / Math.sqrt(n)));
    // simplex: e_0..e_n in R^{n+1} minus their centroid, written in an orthonormal basis of that hyperplane
    const pts = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === j ? 1 : 0) - 1 / (n + 1)));
    const B = [];
    for (const p of pts) { let v = p.slice(); for (const q of B) { const d = dot(v, q); v = v.map((x, k) => x - d * q[k]); } if (norm(v) > 1e-9 && B.length < n) B.push(unit(v)); }
    return pts.map(p => unit(B.map(b => dot(p, b))));
  }
  // Expected dimension of the solution set: dim of similarities of R^n minus #vertices.
  const simDim = n => n + (n * (n - 1)) / 2 + 1;
  const expectedDim = (shape, n) => simDim(n) - SHAPES[shape].vertices(n);

  // ---------- star-shaped hypersurfaces: rad(u) along unit direction u ----------
  const SURFACES = {
    sphere: 'Sphere',
    ellipsoid: 'Ellipsoid (centrally symmetric)',
    egg: 'Lopsided egg (convex, no symmetry)',
    blob: 'Random blob (no symmetry)',
    fractal: 'Fractal blob (Weierstrass-type)',
  };
  function makeSurface(type, n, seed) {
    const R = rng(seed * 7919 + n * 104729 + 13);
    switch (type) {
      case 'sphere': return { rad: () => 1, rmax: 1 };
      case 'ellipsoid': { const a = Array.from({ length: n }, () => 0.75 + R() * 0.5); return { rad: u => 1 / Math.sqrt(u.reduce((s, v, i) => s + (v / a[i]) ** 2, 0)), rmax: Math.max(...a) }; }
      case 'egg': {
        // Quadratic plus a small cubic term with no symmetry; strictly convex for
        // these coefficients (checked by tests/run-nd.js --check-convex).
        const a = Array.from({ length: n }, () => 0.85 + R() * 0.4), e = 0.1, z = n - 1;
        const F = p => { let s = -1; for (let i = 0; i < n; i++) s += (p[i] / a[i]) ** 2;
          return s + e * (0.5 * p[0] ** 3 + (n > 2 ? p[0] * p[1] * p[2] : p[0] * p[1] * p[1]) + 0.7 * p[1] * p[1] * p[z] + 0.3 * p[z] ** 3); };
        return { F, rad: u => { let lo = 0, hi = 3; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (F(u.map(v => v * m)) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }, rmax: 1.8 };
      }
      case 'blob': { const D = Array.from({ length: 6 }, () => randUnit(n, R)), A = D.map(() => 0.04 + R() * 0.06), f = D.map(() => 2 + R() * 2), p = D.map(() => R() * 6.283);
        return { rad: u => 1 + D.reduce((s, d, k) => s + A[k] * Math.sin(f[k] * dot(u, d) + p[k]), 0), rmax: 1.4 }; }
      case 'fractal': { const D = Array.from({ length: 8 }, () => randUnit(n, R)), p = D.map(() => R() * 6.283);
        // `octaves` limits the detail; the search adds it one level at a time.
        const S = { octaves: Infinity, rmax: 1.4, fractal: true };
        S.rad = u => { let s = 1; for (let k = 0; k < D.length && k < S.octaves; k++) s += 0.09 * 2 ** (-k / 2) * Math.sin(3 * 2 ** k * dot(u, D[k]) + p[k]); return s; };
        return S; }
    }
    throw new Error('unknown surface ' + type);
  }

  // ---------- the solver ----------
  // `surface` (optional) supplies a ready-made surface { rad(u), rmax } instead of surfType/seed.
  function makeProblem(shape, n, surfType, seed, surface) {
    const S = surface || makeSurface(surfType, n, seed), U = directions(shape, n), m = U.length;
    const outside = p => { const L = norm(p); return L > 0 && L > S.rad(p.map(v => v / L)); };
    // Farthest crossing of the ray o + t·u, or -1. With a guess, bracket locally
    // (keeps finite-difference derivatives on the same crossing).
    function hit(o, u, guess) {
      const at = t => o.map((v, i) => v + t * u[i]);
      let lo, hi;
      if (guess > 0) {
        // Find the exit crossing (inside -> outside, moving outward) nearest the
        // remembered one, scanning ever-wider windows. On rough surfaces this keeps
        // each arm on the same crossing as the jig moves.
        let found = false;
        for (const w of [1e-4, 1e-3, 1e-2, 3e-2]) {
          const N = 48, a0 = guess * (1 - w), step = (2 * guess * w) / N;
          let prevOut = outside(at(a0)), bestD = Infinity;
          for (let i = 1; i <= N; i++) {
            const t = a0 + i * step, out = outside(at(t));
            if (out && !prevOut) { const d = Math.abs(t - step / 2 - guess); if (d < bestD) { bestD = d; lo = t - step; hi = t; } }
            prevOut = out;
          }
          if (bestD < Infinity) { found = true; break; }
        }
        if (!found) guess = 0;
      }
      if (!(guess > 0)) {
        const tmax = S.rmax * 1.2 + norm(o), N = 96; let prev = tmax; lo = -1;
        for (let i = N - 1; i >= 0; i--) { const t = (tmax * i) / N; if (!outside(at(t))) { lo = t; hi = prev; break; } prev = t; }
        if (lo < 0) return -1;
      }
      for (let k = 0; k < 60 && hi - lo > 1e-16 * hi; k++) { const mid = (lo + hi) / 2; if (outside(at(mid))) hi = mid; else lo = mid; }
      return lo > 1e-12 ? (lo + hi) / 2 : -1;
    }
    function rays(st, guess) {
      const r = [];
      for (let k = 0; k < m; k++) { const t = hit(st.c, matVec(st.R, U[k]), guess && guess[k]); if (t < 0) return null; r.push(t); }
      return r;
    }
    const spread = r => { const mean = r.reduce((a, b) => a + b, 0) / r.length; return r.map(v => (v - mean) / mean); };
    const npAll = n + (n * (n - 1)) / 2;
    const applyAll = (st, d) => ({ c: st.c.map((v, i) => v + d[i]), R: matMul(cayley(d.slice(n), n), st.R) });
    function points(st, r) { return U.map((u, k) => { const v = matVec(st.R, u); return st.c.map((x, i) => x + r[k] * v[i]); }); }
    // Independent check: every pairwise distance against the template at its
    // best-fit scale, and every vertex's distance from the surface, relative to
    // the template's edge length.
    function verify(st) {
      const r = rays(st); if (!r) return null;
      const P = points(st, r), dd = (a, b) => norm(a.map((v, i) => v - b[i]));
      let num = 0, den = 0, minU = Infinity;
      for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const u = dd(U[i], U[j]); num += dd(P[i], P[j]) * u; den += u * u; minU = Math.min(minU, u); }
      const rho = num / den, edge = rho * minU; let shapeErr = 0, surfErr = 0;
      for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) shapeErr = Math.max(shapeErr, Math.abs(dd(P[i], P[j]) - rho * dd(U[i], U[j])) / edge);
      for (const p of P) { const L = norm(p); surfErr = Math.max(surfErr, Math.abs(L - S.rad(p.map(v => v / L))) / edge); }
      return { r, P, shapeErr, surfErr, err: Math.max(shapeErr, surfErr), size: rho };
    }
    // Levenberg–Marquardt on "all ray lengths equal" over position and rotation
    // (or, with posOnly, over position only using the residual `res`).
    function* lm(st, maxIt, res = spread, posOnly = false) {
      const np = posOnly ? n : npAll;
      const apply = (s0, d) => (posOnly ? { c: s0.c.map((v, i) => v + d[i]), R: s0.R } : applyAll(s0, d));
      let r = rays(st); if (!r) return null;
      let f = res(r), cost = dot(f, f), lam = 1e-3, stall = 0;
      for (let it = 0; it < maxIt; it++) {
        if (Math.max(...f.map(Math.abs)) < 1e-15) break;
        const J = f.map(() => new Array(np)), h = 1e-7;
        for (let j = 0; j < np; j++) {
          const dp = new Array(np).fill(0); dp[j] = h; const dm = dp.map(v => -v);
          const ra = rays(apply(st, dp), r), rb = rays(apply(st, dm), r); if (!ra || !rb) return st;
          const fa = res(ra), fb = res(rb);
          for (let i = 0; i < f.length; i++) J[i][j] = (fa[i] - fb[i]) / (2 * h);
        }
        const A = [], g = [];
        for (let a = 0; a < np; a++) { A.push([]); g.push(-J.reduce((s, row, i) => s + row[a] * f[i], 0)); for (let b = 0; b < np; b++) A[a].push(J.reduce((s, row) => s + row[a] * row[b], 0)); }
        const tr = A.reduce((s, row, i) => s + row[i], 0) / np + 1e-300;
        let improved = false;
        while (lam < 1e14) {
          const d = solve(A.map((row, i) => row.map((v, j) => (i === j ? v + lam * (v + 1e-9 * tr) : v))), g);
          if (d) {
            const s2 = apply(st, d), r2 = rays(s2, r);
            if (r2) { const f2 = res(r2), c2 = dot(f2, f2);
              if (c2 < cost) { stall = cost - c2 < 1e-6 * cost ? stall + 1 : 0; st = s2; r = r2; f = f2; cost = c2; lam = Math.max(lam / 4, 1e-15); improved = true; break; } }
          }
          lam *= 6;
        }
        if (!improved || (stall >= 8 && cost > 1e-24)) break;
        yield st;
      }
      return st;
    }
    // Multi-start search. Yields progress; returns the best result.
    function* search(opts = {}) {
      const starts = opts.starts || 12, tol = opts.tol || 1e-9, Rn = rng(seed * 31 + n * 7 + 1);
      let best = null;
      const consider = st => { const v = verify(st); if (v && (!best || v.err < best.err)) best = Object.assign({ st }, v); return best && best.err < tol && best.size > 0.05; };
      // Square (2D cross-polytope): the jig's own IVT sweep. At each angle, centre
      // the jig so both chords are bisected (a rhombus); rotating by 90° swaps the
      // chords, so the diagonal difference changes sign somewhere. Each sign change
      // seeds a full solve. (Directions are ordered +x, -x, +y, -y.)
      if (n === 2 && shape === 'cross') {
        const bisect = r => [(r[0] - r[1]) / (r[0] + r[1]), (r[2] - r[3]) / (r[2] + r[3])];
        const delta = r => (r[0] + r[1] - r[2] - r[3]) / (r[0] + r[1] + r[2] + r[3]);
        const rot = t => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
        let c = [0, 0], prev = null;
        for (let i = 0; i <= 180; i++) {
          const t = (i / 180) * (Math.PI / 2);
          const g = lm({ c, R: rot(t) }, 40, bisect, true); let x; while (!(x = g.next()).done);
          const st = x.value; const r = st && rays(st);
          if (!r) { prev = null; continue; }
          c = st.c; const d = delta(r);
          if (prev && prev.d * d <= 0) {
            const w = prev.d / (prev.d - d || 1), s0 = { c: prev.c.map((v, k) => v + w * (c[k] - v)), R: rot(prev.t + w * (t - prev.t)) };
            const g2 = lm(s0, 200); let y; while (!(y = g2.next()).done);
            if (y.value && consider(y.value)) return Object.assign({ found: true }, best);
          }
          prev = { t, c, d };
          if (i % 10 === 0) yield { start: 0, starts, best };
        }
      }
      for (let k = 0; k < starts; k++) {
        let st = { c: k === 0 ? new Array(n).fill(0) : randUnit(n, Rn).map(v => v * 0.15 * Rn()), R: k === 0 ? eye(n) : randomRotation(n, Rn) };
        // rattle the pivot toward the mean of the hits (the jig's centring step)
        for (let i = 0; i < 20; i++) { const r = rays(st); if (!r) break; const P = points(st, r); st = { c: st.c.map((v, d) => v + 0.7 * (P.reduce((s, p) => s + p[d], 0) / m - v)), R: st.R }; }
        // On fractal surfaces, alternate between solving directly at full detail and
        // continuation (little detail first, then adding octaves). Each finds
        // solutions the other misses.
        for (const lev of S.fractal && k % 2 === 1 ? [1, 3, 5, Infinity] : [Infinity]) {
          S.octaves = lev;
          const g = lm(st, opts.maxIt || 200); let x;
          while (!(x = g.next()).done) { S.octaves = Infinity; yield { start: k, starts, best }; S.octaves = lev; }
          st = x.value || st;
        }
        S.octaves = Infinity;
        consider(st);
        yield { start: k + 1, starts, best };
        if (best && best.err < tol && best.size > 0.05) break;
      }
      return Object.assign({ found: !!best && best.err < tol && best.size > 0.05 }, best || { err: Infinity });
    }
    // Fixed orientation R ("pivot only"): rattle the pivot toward the mean of the
    // hits, then solve "all rays equal" over the position only. For a simplex this
    // is n equations in n unknowns, so a solution exists at every orientation on a
    // smooth convex surface (PROOFS.md, Theorem 2).
    function solvePose(R, c0, opts = {}) {
      let st = { c: c0.slice(), R };
      for (let i = 0; i < (opts.rattle ?? 20); i++) { const r = rays(st); if (!r) break; const P = points(st, r); st = { c: st.c.map((v, d) => v + 0.7 * (P.reduce((s2, p) => s2 + p[d], 0) / m - v)), R }; }
      const g = lm(st, opts.maxIt || 100, spread, true); let x; while (!(x = g.next()).done);
      st = x.value || st;
      const v = verify(st);
      return v && Object.assign({ st, ok: v.err < (opts.tol || 1e-9) && v.size > 0.02 }, v);
    }
    // Continue a known solution (position and orientation both free): solve
    // "all rays equal" from st with Levenberg–Marquardt over every degree of freedom.
    function refine(st0, opts = {}) {
      const g = lm({ c: st0.c.slice(), R: st0.R }, opts.maxIt || 100); let x; while (!(x = g.next()).done);
      const st = x.value || st0, v = verify(st);
      return v && Object.assign({ st, ok: v.err < (opts.tol || 1e-9) && v.size > 0.02 }, v);
    }
    return { search, verify, solvePose, refine, directions: U, surface: S, np: npAll };
  }

  // Run a search to completion (Node / tests).
  function run(shape, n, surfType, seed, opts) {
    const g = makeProblem(shape, n, surfType, seed).search(opts); let x;
    while (!(x = g.next()).done);
    return x.value;
  }

  // What the literature says, for the chart. 'open' = open for general continuous
  // (Jordan) hypersurfaces.
  function literature(shape, n) {
    if (n === 2 && shape === 'simplex') return 'Solved for all Jordan curves (Meyerson 1980; Nielsen 1992)';
    if (n === 2) return 'Open for continuous curves; proved for smooth (Schnirelmann), convex (Emch), locally monotone (Stromquist)';
    if (shape === 'simplex') return 'Open for continuous; proved for C¹ spheres in every pose (Gromov 1969)';
    if (shape === 'cross' && n === 3) return 'Open; proved for smooth convex bodies (Makeev 2001)';
    if (shape === 'cross') return 'Open; proved for smooth convex bodies when n is an odd prime power (Karasev 2009)';
    if (shape === 'cube' && n === 3) return 'False for generic smooth surfaces (PROOFS.md); true for centrally symmetric convex bodies (Hausel–Makai–Szűcs 2000)';
    return 'False for generic smooth hypersurfaces (PROOFS.md)';
  }

  const api = { rng, randomRotation, SHAPES, SURFACES, shapeName, directions, simDim, expectedDim, makeSurface, makeProblem, run, literature };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.InscribedND = api;
})(typeof window !== 'undefined' ? window : globalThis);
