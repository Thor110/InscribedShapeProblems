// Rigorous (interval-arithmetic) certificates for PROOFS.md, Theorems 6 and 7.
//
// Both use the same degree argument. Unknowns p ∈ ℝⁿ; G(p) ∈ ℝⁿ vanishes exactly at
// inscribed shapes; a perturbation of the curve or surface moves G by at most Teff.
// Let z be an approximate zero, J an approximate Jacobian (any floating-point
// matrix), K a floating-point approximate inverse of J, and
//     Q = z + K([−c, c]ⁿ),   L(p) = J(p − z).
// On ∂Q, L = (JK)y with ‖y‖∞ = c, so ‖L‖∞ ≥ c(1 − ‖JK − I‖∞) =: c_eff. If
//     ‖G_E − L‖∞ + Teff < c_eff   on ∂Q,
// then for every perturbed G the homotopy from L to G has no zero on ∂Q, so
// deg(G, Q, 0) = deg(L, Q, 0) = sign det J ≠ 0, and G has a zero in Q.
//
// The inequality is checked at a grid of points on each face of the cube [−c, c]ⁿ:
// every point of ∂Q lies within ‖K‖∞·h/2 (+ rounding) of a sample, and G − L is
// (lip_G + ‖J‖∞)-Lipschitz. Every quantity is computed in outward-rounded interval
// arithmetic (pages/interval.js); z, J and K are plain floating-point data whose
// accuracy does not matter for correctness, only for how much margin is left.
(function (global) {
  'use strict';
  const V = global.Interval || require('./interval.js');
  const { I, exact, ratio, add, sub, neg, mul, div, sqr, sqrt, mag, mig, up, nextUp, nextDown, ru, rd } = V;
  const mid = a => (a.lo + a.hi) / 2;

  // Signed distance to the ellipse/ellipsoid over a box B (interval vector): sd at a
  // floating-point centre q, widened by the largest distance from q to the box (sd is 1-Lipschitz).
  function sdBox(sd, B) {
    const q = B.map(mid); let r2 = 0;
    for (let i = 0; i < B.length; i++) { const d = Math.max(q[i] - B[i].lo, B[i].hi - q[i]); r2 = up.add(r2, up.mul(d, d)); }
    const r = up.sqrt(r2), e = sd(q);
    if (!e) throw new Error('signed distance not verified at ' + q);
    return I(rd(e.lo - r), ru(e.hi + r));
  }

  // ---- linear algebra on plain numbers (for z, J, K) ----
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  const inverse = A => { const n = A.length, cols = [...Array(n)].map((_, c) => solve(A, [...Array(n)].map((_, r) => +(r === c)))); return [...Array(n)].map((_, r) => cols.map(col => col[r])); };
  function jacobian(Gf, p) {
    const n = p.length, J = [...Array(n)].map(() => new Array(n)), h = 1e-7;
    for (let c = 0; c < n; c++) { const a = p.slice(), b = p.slice(); a[c] += h; b[c] -= h; const ga = Gf(a), gb = Gf(b); for (let r = 0; r < n; r++) J[r][c] = (ga[r] - gb[r]) / (2 * h); }
    return J;
  }
  function newton(Gf, p) {
    for (let it = 0; it < 60; it++) { const d = solve(jacobian(Gf, p), Gf(p).map(v => -v)); p = p.map((v, i) => v + d[i]); if (Math.max(...d.map(Math.abs)) < 1e-15) break; }
    return p;
  }

  // ---- interval linear algebra ----
  const imat = A => A.map(r => r.map(exact));
  const imatmul = (A, B) => A.map(r => B[0].map((_, c) => r.reduce((s, v, k) => add(s, mul(v, B[k][c])), exact(0))));
  const normInfUp = A => A.reduce((m, r) => Math.max(m, r.reduce((s, v) => up.add(s, mag(v)), 0)), 0);   // ‖A‖∞ (upper bound)
  function idet(A) {   // cofactor expansion (n ≤ 4), in intervals
    const n = A.length; if (n === 1) return A[0][0];
    let d = exact(0);
    for (let c = 0; c < n; c++) { const minor = A.slice(1).map(r => r.filter((_, k) => k !== c)), t = mul(A[0][c], idet(minor)); d = c % 2 ? sub(d, t) : add(d, t); }
    return d;
  }

  // ---- the generic certificate ----
  // problem: { n, Gi(p) → interval vector, lipG (number), Teff (number), start, c, N }
  // Setup: approximate zero z, Jacobian J, inverse K, and everything that does not depend on samples.
  function setup(problem) {
    const { n, Gi, c, N } = problem, Gf = p => Gi(p).map(mid);
    const z = newton(Gf, problem.start), J = jacobian(Gf, z), K = inverse(J);
    const Ji = imat(J), Ki = imat(K), JK = imatmul(Ji, Ki);
    const e = normInfUp(JK.map((r, i) => r.map((v, k) => sub(v, exact(+(i === k)))))), normJ = normInfUp(Ji), normK = normInfUp(Ki);
    const cEff = rd(c * rd(1 - e)), det = idet(Ji), degree = det.lo > 0 ? 1 : det.hi < 0 ? -1 : 0;
    // grid on [−c, c]: endpoints exact, spacing bounded above by hmax
    const ys = Array.from({ length: N }, (_, i) => (i === N - 1 ? c : -c + (2 * c * i) / (N - 1)));
    let hmax = 0; for (let i = 1; i < N; i++) hmax = Math.max(hmax, ru(ys[i] - ys[i - 1]));
    // Rounding in the sample points ps = fl(z + K·y): a sum of 2n correctly rounded
    // operations, so |ps − (z + K·y)| ≤ γ_2n (|z| + |K||y|) with γ_m = m·u/(1 − m·u), u = 2⁻⁵³.
    const u = 2 ** -53, gam = ru((2 * n * u) / (1 - 2 * n * u));
    const flerr = ru(gam * ru(Math.max(...z.map(Math.abs)) + ru(normK * c)) * 1.01);
    return { z, J, K, c, N, n, cEff, contraction: e, normJ, normK, det: [det.lo, det.hi], degree, ys, hmax, flerr };
  }
  const allFaces = n => [...Array(2 * n)].map((_, i) => [i >> 1, i & 1 ? 1 : -1]);

  // Scan some faces of the cube: the largest enclosure of |G − L| at the samples.
  function scan(problem, S, faces = allFaces(S.n)) {
    const { n, z, J, K, c, N, ys } = S, { Gi } = problem, y = new Array(n), ps = new Array(n);
    let maxH = 0, samples = 0, minG = Infinity, degMargin = Infinity;
    for (const [fixed, sign] of faces) {
      const idx = new Array(n - 1).fill(0);
      for (;;) {
        for (let d = 0, f = 0; d < n; d++) y[d] = d === fixed ? sign * c : ys[idx[f++]];
        for (let r = 0; r < n; r++) { let s = z[r]; for (let k = 0; k < n; k++) s += K[r][k] * y[k]; ps[r] = s; }
        const g = Gi(ps);
        let h = 0, gl = 0;
        for (let r = 0; r < n; r++) {
          // L_r = Σ J_rk (ps_k − z_k), enclosed with outward rounding
          let lo = 0, hi = 0;
          for (let k = 0; k < n; k++) {
            const dl = rd(ps[k] - z[k]), dh = ru(ps[k] - z[k]), j = J[r][k];
            const a1 = j * dl, a2 = j * dh; lo = rd(lo + rd(Math.min(a1, a2))); hi = ru(hi + ru(Math.max(a1, a2)));
          }
          h = Math.max(h, ru(Math.max(g[r].hi - lo, hi - g[r].lo)));            // upper bound of |G_r − L_r|
          gl = Math.max(gl, g[r].lo > 0 ? g[r].lo : g[r].hi < 0 ? -g[r].hi : 0); // lower bound of ‖G‖∞
        }
        maxH = Math.max(maxH, h); minG = Math.min(minG, gl); degMargin = Math.min(degMargin, rd(gl - h));
        samples++;
        let f = 0; while (f < n - 1 && ++idx[f] === N) idx[f++] = 0;
        if (f === n - 1) break;
      }
    }
    return { maxH, samples, minG, degMargin };
  }

  // Combine: the certificate holds if the largest deviation, plus the most G − L can
  // change between samples, plus the perturbation, is below c_eff.
  // Combine. Two sufficient conditions, both checked:
  //  (Rouché)  ‖G_E − L‖∞ + Teff < c_eff on ∂Q;
  //  (direct)  ‖G_E − L‖∞ < ‖G_E‖∞ on ∂Q (so deg G_E = deg L = sign det J), and
  //            Teff < min ‖G_E‖∞ on ∂Q (so every G within Teff of G_E has the same degree).
  // The direct form allows larger boxes, because G_E may bend away from L as long as
  // it stays away from zero. Between samples, G moves by at most lip_G·r and G − L by
  // at most (lip_G + ‖J‖∞)·r, where r bounds the distance from ∂Q to the nearest sample.
  function finish(problem, S, scans) {
    const maxH = Math.max(...scans.map(r => r.maxH)), samples = scans.reduce((t, r) => t + r.samples, 0);
    const minG = Math.min(...scans.map(r => r.minG)), degMargin = Math.min(...scans.map(r => r.degMargin));
    const rp = up.add(up.mul(S.normK, S.hmax / 2), S.flerr);          // max-norm distance from ∂Q to the nearest sample
    const between = up.mul(up.add(problem.lipG, S.normJ), rp), gMove = up.mul(problem.lipG, rp);
    const bound = up.add(maxH, between), room = rd(S.cEff - bound);
    const rouche = S.degree !== 0 && ru(bound + problem.Teff) < S.cEff;
    const minGBoundary = rd(minG - gMove), degreeHolds = S.cEff > 0 && rd(degMargin - up.add(gMove, between)) > 0;
    const direct = S.degree !== 0 && degreeHolds && problem.Teff < minGBoundary;
    return {
      ok: rouche || direct, method: rouche ? 'Rouché' : direct ? 'direct' : 'none', rouche, direct,
      degree: S.degree, det: S.det, zero: S.z, J: S.J, K: S.K, c: S.c, cEff: S.cEff, contraction: S.contraction,
      normJ: S.normJ, normK: S.normK, samples, gridPoints: S.N, gridSpacing: S.hmax, roundingInSamples: S.flerr,
      maxDeviation: maxH, betweenSamples: between, bound, Teff: problem.Teff, room,
      minG, gMoveBetweenSamples: gMove, minGBoundary, degMargin, degreeHolds, roomDirect: degreeHolds ? minGBoundary : 0,
    };
  }
  const certify = problem => { const S = setup(problem); return finish(problem, S, [scan(problem, S)]); };
  // ---- adaptive cells ----
  // The same certificate (direct method) with cells instead of a uniform grid. Each face
  // of the cube [−c, c]ⁿ starts as start^(n−1) cells. A cell is checked at its centre p_c:
  // every point of the cell's image in Q lies within r = ‖K‖∞·h + ε of p_c (h the cell's
  // largest half-width in y, ε the rounding in computing p_c), so on the whole cell
  //   ‖G_E‖∞ ≥ ‖G_E(p_c)‖∞ − lip_G·r                    must exceed Teff, and
  //   ‖G_E‖∞ − ‖G_E − L‖∞ ≥ (that difference at p_c) − (2·lip_G + ‖J‖∞)·r   must be > 0.
  // A cell that fails is split in half along every free direction (halving is exact in
  // floating point, so the leaves cover the face exactly), down to maxDepth levels.
  function scanAdaptive(problem, S, faces = allFaces(S.n), opts = {}) {
    const { n, z, J, K, c } = S, { Gi, lipG, Teff, turn } = problem, start = opts.start || 8, maxDepth = opts.maxDepth || 14;
    // problem.turn (optional): an extra allowance turn·s that grows with the circumradius s (the
    // last unknown), for turning the orientation: it is bounded on each cell by s's largest value there.
    const kG = lipG, kD = up.add(up.mul(2, lipG), S.normJ), y = new Array(n), ps = new Array(n);
    let cells = 0, failed = 0, deepest = 0, slackG = Infinity, slackD = Infinity, minG = Infinity;
    for (const [fixed, sign] of faces) {
      const m = n - 1, stack = [];
      // initial cells: an even split of [−c, c] into `start` intervals per free direction
      const edges = Array.from({ length: start + 1 }, (_, i) => (i === start ? c : -c + (2 * c * i) / start));
      const idx = new Array(m).fill(0);
      for (;;) {
        stack.push({ lo: idx.map(i => edges[i]), hi: idx.map(i => edges[i + 1]), depth: 0 });
        let k = 0; while (k < m && ++idx[k] === start) idx[k++] = 0;
        if (k === m) break;
      }
      while (stack.length) {
        const cell = stack.pop(); cells++;
        let hw = 0;
        for (let d = 0, f = 0; d < n; d++) {
          if (d === fixed) { y[d] = sign * c; continue; }
          const mid = (cell.lo[f] + cell.hi[f]) / 2; y[d] = mid;
          hw = Math.max(hw, ru(cell.hi[f] - mid), ru(mid - cell.lo[f])); f++;
        }
        for (let r = 0; r < n; r++) { let s = z[r]; for (let k = 0; k < n; k++) s += K[r][k] * y[k]; ps[r] = s; }
        const g = Gi(ps);
        let h = 0, gl = 0;
        for (let r = 0; r < n; r++) {
          let lo = 0, hi = 0;
          for (let k = 0; k < n; k++) {
            const dl = rd(ps[k] - z[k]), dh = ru(ps[k] - z[k]), j = J[r][k];
            const a1 = j * dl, a2 = j * dh; lo = rd(lo + rd(Math.min(a1, a2))); hi = ru(hi + ru(Math.max(a1, a2)));
          }
          h = Math.max(h, ru(Math.max(g[r].hi - lo, hi - g[r].lo)));
          gl = Math.max(gl, g[r].lo > 0 ? g[r].lo : g[r].hi < 0 ? -g[r].hi : 0);
        }
        const rad = up.add(up.mul(S.normK, hw), S.flerr);
        const Tc = turn ? ru(Teff + up.mul(turn, ru(ps[n - 1] + rad))) : Teff;
        const sG = rd(rd(gl - up.mul(kG, rad)) - Tc), sD = rd(rd(gl - h) - up.mul(kD, rad));
        if (sG > 0 && sD > 0) {
          slackG = Math.min(slackG, sG); slackD = Math.min(slackD, sD); minG = Math.min(minG, rd(gl - up.mul(kG, rad)));
          deepest = Math.max(deepest, cell.depth);
        } else if (cell.depth < maxDepth) {
          // split along every free direction
          for (let mask = 0; mask < 1 << m; mask++) {
            const lo = [], hi = [];
            for (let f = 0; f < m; f++) { const mid = (cell.lo[f] + cell.hi[f]) / 2; if ((mask >> f) & 1) { lo.push(mid); hi.push(cell.hi[f]); } else { lo.push(cell.lo[f]); hi.push(mid); } }
            stack.push({ lo, hi, depth: cell.depth + 1 });
          }
        } else { failed++; if (opts.failFast) return { cells, failed, deepest, slackG, slackD, minG }; }
      }
    }
    return { cells, failed, deepest, slackG, slackD, minG };
  }
  function finishAdaptive(problem, S, scans) {
    const failed = scans.reduce((t, r) => t + r.failed, 0), cells = scans.reduce((t, r) => t + r.cells, 0);
    const slackG = Math.min(...scans.map(r => r.slackG)), slackD = Math.min(...scans.map(r => r.slackD)), minG = Math.min(...scans.map(r => r.minG));
    return {
      ok: S.degree !== 0 && S.cEff > 0 && failed === 0, method: 'adaptive cells', degree: S.degree, det: S.det, zero: S.z, J: S.J, K: S.K, c: S.c, cEff: S.cEff,
      normJ: S.normJ, normK: S.normK, Teff: problem.Teff, cellsChecked: cells, failedCells: failed, deepest: Math.max(...scans.map(r => r.deepest)),
      minGBoundary: minG, slackOverTeff: slackG, degreeSlack: slackD, roundingInSamples: S.flerr,
    };
  }
  const certifyAdaptive = (problem, opts) => { const S = setup(problem); return finishAdaptive(problem, S, [scanAdaptive(problem, S, allFaces(S.n), opts)]); };


  // ---- Theorem 6: squares near the ellipse x² + y²/0.6² = 1 ----
  // Rational parametrisation γ(t) = ((1 − t²)/(1 + t²), 2bt/(1 + t²)), no trigonometry.
  // Opposite corners A = γ(t), C = −γ(t') (the ellipse is centrally symmetric).
  // |γ'(t)| ≤ 2/(1 + t²) ≤ 2 for b ≤ 1, and |ΔB| ≤ (|ΔA| + |ΔC|)/√2, so G is
  // 2√2-Lipschitz in the max-norm on (t, t').
  function squareProblem(T, c, N, bRatio = [3, 5]) {
    const a = exact(1), b = ratio(bRatio[0], bRatio[1]), sd = V.ellipsoidSD([a, b]), one = exact(1), two = exact(2);
    const gam = t => { const t2 = sqr(t), den = add(one, t2); return [div(sub(one, t2), den), div(mul(mul(two, b), t), den)]; };
    const corners = p => {
      const A = gam(exact(p[0])), C = gam(exact(p[1])).map(neg), h = exact(0.5);
      const mx = mul(add(A[0], C[0]), h), my = mul(add(A[1], C[1]), h), hx = mul(sub(C[0], A[0]), h), hy = mul(sub(C[1], A[1]), h);
      return { A, C, B: [sub(mx, hy), add(my, hx)], D: [add(mx, hy), sub(my, hx)] };
    };
    const Gi = p => { const q = corners(p); return [sdBox(sd, q.B), sdBox(sd, q.D)]; };
    const Teff = up.mul(up.add(1, up.sqrt(2)), ratio(T[0], T[1]).hi);
    return { n: 2, Gi, gam, lipG: up.mul(2, up.sqrt(2)), Teff, start: [0.55, 0.55], c, N, T };
  }
  // Lower bound for the diagonal |A − C| = |γ(t) + γ(t')| on Q: cover Q's bounding
  // box with cells and evaluate in intervals; subtract 2T for the perturbation.
  function squareDiagonal(prob, res, cells) {
    const { K, zero: z, c } = res, corners = [[-c, -c], [c, -c], [c, c], [-c, c]].map(y => z.map((v, r) => v + K[r][0] * y[0] + K[r][1] * y[1]));
    const pad = 1e-9, t0 = Math.min(...corners.map(q => q[0])) - pad, t1 = Math.max(...corners.map(q => q[0])) + pad, s0 = Math.min(...corners.map(q => q[1])) - pad, s1 = Math.max(...corners.map(q => q[1])) + pad;
    let m = Infinity;
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
      const T = I(t0 + ((t1 - t0) * i) / cells, t0 + ((t1 - t0) * (i + 1)) / cells), S = I(s0 + ((s1 - s0) * j) / cells, s0 + ((s1 - s0) * (j + 1)) / cells);
      const A = prob.gam(T), B = prob.gam(S);
      m = Math.min(m, mig(sqrt(add(sqr(add(A[0], B[0])), sqr(add(A[1], B[1]))))));
    }
    return { tRange: [t0, t1], tPrimeRange: [s0, s1], minDiagonal: m, guaranteed: nextDown(m - nextUp(2 * ratio(prob.T[0], prob.T[1]).hi)) };
  }

  // ---- Theorem 7: regular tetrahedra near the ellipsoid with semi-axes 1, 0.8, 0.6 ----
  // Orientation: the exactly orthogonal rational rotation (Cayley transform)
  // R = ((1 − |q|²)I + 2qqᵀ + 2[q]×)/(1 + |q|²), q = (1/8, 1/4, 3/8), applied to
  // (±1, ±1, ±1)/√3 with an even number of minus signs.
  function tetraDirs(q = [0.125, 0.25, 0.375]) {
    const Q = q.map(exact), one = exact(1), two = exact(2), qq = Q.reduce((s, v) => add(s, sqr(v)), exact(0)), den = add(one, qq), d0 = sub(one, qq);
    const X = [[exact(0), neg(Q[2]), Q[1]], [Q[2], exact(0), neg(Q[0])], [neg(Q[1]), Q[0], exact(0)]];
    const R = [0, 1, 2].map(i => [0, 1, 2].map(j => div(add(add(i === j ? d0 : exact(0), mul(two, mul(Q[i], Q[j]))), mul(two, X[i][j])), den)));
    const s3 = sqrt(exact(3));
    return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => R.map(r => div(r.reduce((s, x, k) => add(s, mul(x, exact(v[k]))), exact(0)), s3)));
  }
  // q: the orientation's Cayley vector (default: the one of Theorem 7); start: Newton's start.
  function tetraProblem(T, c, N, q, start) {
    const sd = V.ellipsoidSD([exact(1), ratio(4, 5), ratio(3, 5)]), W = tetraDirs(q);
    const Gi = p => W.map(w => sdBox(sd, [0, 1, 2].map(i => add(exact(p[i]), mul(exact(p[3]), w[i])))));
    const wmax = Math.max(...W.map(w => V.norm(w).hi));
    // |Δ(x + s·w)| ≤ |Δx|₂ + |Δs|·|w| ≤ (√3 + |w|)·‖Δp‖∞
    return { n: 4, Gi, W, lipG: up.add(up.sqrt(3), wmax), Teff: ratio(T[0], T[1]).hi, start: start || [0, 0, 0, 0.75], c, N, T };
  }
  // The circumradius s is affine on Q, so its minimum and maximum are at corners.
  function tetraRadius(prob, res, max = false) {
    const { K, zero: z, c } = res; let m = max ? -Infinity : Infinity;
    for (let k = 0; k < 16; k++) {
      let s = exact(z[3]); for (let r = 0; r < 4; r++) s = add(s, mul(exact(K[3][r]), exact((k >> r) & 1 ? c : -c)));
      m = max ? Math.max(m, s.hi) : Math.min(m, s.lo);
    }
    return m;
  }
  // Other orientations. Turning the tetrahedron by an angle θ moves each vertex x + s·w
  // by s·|R'w − Rw| ≤ s·θ, which moves G by at most s_max·θ. So a certificate with
  // room m on ∂Q (m = min ‖G_E‖∞ there, direct method) proves, for every surface within
  // T of the ellipsoid, a tetrahedron in every orientation within angle (m − T)/s_max.
  const orientationAngle = (res, T, sMax) => (res.roomDirect > T ? rd(rd(res.roomDirect - T) / sMax) : 0);

  // up(t, s, a): an upper bound for t + s·a (used for the orientation allowance)
  const upTSA = (t, s, a) => ru(t + up.mul(s, a));
  const api = { up: upTSA, certify, certifyAdaptive, scanAdaptive, finishAdaptive, setup, scan, finish, allFaces, squareProblem, squareDiagonal, tetraDirs, tetraProblem, tetraRadius, orientationAngle, sdBox };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.CertifyRigorous = api;
})(typeof window !== 'undefined' ? window : globalThis);
