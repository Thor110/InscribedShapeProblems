// Shared 2D Jordan-curve generators for the 2D pages.
// Every curve is returned as a closed, simple polygon (array of {x,y}) in unit
// coordinates; use Shapes2D.fit() to place it on a canvas. Curves are seeded so
// any result can be reproduced with ?curve=<type>&seed=<n>.
(function (global) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const TAU = Math.PI * 2;

  function polar(N, r) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * TAU, R = r(t, i);
      pts.push({ x: R * Math.cos(t), y: R * Math.sin(t) });
    }
    return pts;
  }

  function regular(n, rot) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: Math.cos(rot + (i * TAU) / n), y: Math.sin(rot + (i * TAU) / n) });
    return pts;
  }

  // Koch refinement. For a counter-clockwise polygon, sign = -1 puts the bumps
  // outside (snowflake) and sign = +1 puts them inside (anti-snowflake).
  function koch(pts, levels, sign) {
    const c = Math.cos((sign * Math.PI) / 3), s = Math.sin((sign * Math.PI) / 3);
    for (let l = 0; l < levels; l++) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        const dx = (q.x - p.x) / 3, dy = (q.y - p.y) / 3;
        const a = { x: p.x + dx, y: p.y + dy };
        out.push(p, a, { x: a.x + dx * c - dy * s, y: a.y + dx * s + dy * c }, { x: p.x + 2 * dx, y: p.y + 2 * dy });
      }
      pts = out;
    }
    return pts;
  }

  // Minkowski "sausage" refinement: each edge becomes 8 edges of a quarter length.
  function minkowski(pts, levels) {
    const steps = [[1, 0], [0, 1], [1, 0], [0, -1], [0, -1], [1, 0], [0, 1], [1, 0]];
    for (let l = 0; l < levels; l++) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        const dx = (q.x - p.x) / 4, dy = (q.y - p.y) / 4;
        let x = p.x, y = p.y;
        out.push({ x, y });
        for (let k = 0; k < 7; k++) {
          const [u, v] = steps[k];
          x += u * dx - v * dy; y += u * dy + v * dx;
          out.push({ x, y });
        }
      }
      pts = out;
    }
    return pts;
  }

  const GEN = {
    random(R) {
      const b = Array.from({ length: 5 }, () => 0.45 + R() * 0.85);
      return polar(2400, t => 1 + b.reduce((s, v, j) => s + 0.13 * v * Math.cos((j + 2) * t + j * 2.1), 0));
    },
    star(R) {
      const n = 4 + Math.floor(R() * 3), inner = 0.42 + R() * 0.2, rot = R() * Math.PI;
      return polar(2400, t => inner + (1 - inner) * (Math.sin(n * (t + rot)) + 1) / 2);
    },
    circle() { return polar(2400, () => 1); },
    ellipse(R) {
      const rx = 0.55 + R() * 0.5, ry = 0.4 + R() * 0.5;
      return polar(2400, () => 1).map(p => ({ x: p.x * rx, y: p.y * ry }));
    },
    triangle(R) { return regular(3, R() * TAU); },
    polygon(R) {
      const n = 5 + Math.floor(R() * 4), rot = R() * TAU;
      return regular(n, rot).map(p => { const k = 0.8 + 0.4 * R(); return { x: p.x * k, y: p.y * k }; });
    },
    crescent(R) {
      // Boundary of (disc of radius 1) minus (disc of radius R2 centred at (d,0)).
      const R2 = 0.72 + R() * 0.12, d = 0.38 + R() * 0.12, pts = [];
      const x = (1 - R2 * R2 + d * d) / (2 * d), y = Math.sqrt(1 - x * x);
      const a = Math.atan2(y, x), b = Math.atan2(y, x - d), N = 1600;
      for (let i = 0; i < N; i++) { const t = a + ((TAU - 2 * a) * i) / N; pts.push({ x: Math.cos(t), y: Math.sin(t) }); }
      for (let i = 0; i < N; i++) { const t = TAU - b - ((TAU - 2 * b) * i) / N; pts.push({ x: d + R2 * Math.cos(t), y: R2 * Math.sin(t) }); }
      return pts;
    },
    teardrop(R) {
      const ry = 0.72 + R() * 0.22, rx = 0.48 + R() * 0.22, pts = [];
      for (let i = 0; i < 2400; i++) {
        const t = (i / 2400) * TAU;
        pts.push({ x: rx * Math.sin(t) * (1 + 0.32 * Math.sin(t)), y: ry * (Math.cos(t) - 0.18 * Math.cos(2 * t)) * 0.88 });
      }
      return pts;
    },
    heart() {
      const pts = [];
      for (let i = 0; i < 2400; i++) {
        const t = (i / 2400) * TAU;
        pts.push({ x: 0.68 * Math.sin(t) ** 3, y: -0.58 * (0.8125 * Math.cos(t) - 0.3125 * Math.cos(2 * t) - 0.125 * Math.cos(3 * t) - 0.0625 * Math.cos(4 * t)) });
      }
      return pts;
    },
    comb(R) {
      const k = 5 + Math.floor(R() * 4), H = 0.7, D = 0.45 + R() * 0.15, g = 0.45 / k;
      const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: H }];
      for (let j = k - 1; j >= 1; j--) {
        const xj = j / k;
        pts.push({ x: xj + g / 2, y: H }, { x: xj + g / 2, y: H - D }, { x: xj - g / 2, y: H - D }, { x: xj - g / 2, y: H });
      }
      pts.push({ x: 0, y: H });
      return pts;
    },
    spiral(R) {
      // A thick spiral arm: not star-shaped from any point.
      const turns = 1.4 + R() * 0.4, T = turns * TAU, a = 0.16, b = 0.85 / T, w = 0.11, N = 1500;
      const c = t => ({ x: (a + b * t) * Math.cos(t), y: (a + b * t) * Math.sin(t) });
      const nrm = t => {
        const h = 1e-6, p = c(t - h), q = c(t + h), dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy);
        return { x: -dy / L, y: dx / L };
      };
      const left = [], right = [];
      for (let i = 0; i <= N; i++) {
        const t = (T * i) / N, p = c(t), n = nrm(t);
        left.push({ x: p.x + w * n.x, y: p.y + w * n.y }); right.push({ x: p.x - w * n.x, y: p.y - w * n.y });
      }
      // Semicircular caps; with n = tangent rotated +90 deg, sweeping clockwise from n passes the forward tangent.
      const cap = (t, a0) => {
        const p = c(t), out = [];
        for (let i = 1; i < 60; i++) { const ang = a0 - (Math.PI * i) / 60; out.push({ x: p.x + w * Math.cos(ang), y: p.y + w * Math.sin(ang) }); }
        return out;
      };
      const nE = nrm(T), n0 = nrm(0);
      const end = cap(T, Math.atan2(nE.y, nE.x)), start = cap(0, Math.atan2(-n0.y, -n0.x));
      return left.concat(end, right.reverse(), start);
    },
    // Fractals take an optional `level` (roughness). Each level refines the previous
    // one with the same seed, so a family of levels is a sequence of ever-rougher
    // approximations of one limiting fractal curve.
    koch(R, level = 6) { return koch(regular(3, R() * TAU), level, -1); },
    antikoch(R, level = 5) { return koch(regular(6, R() * TAU), level, 1); },
    minkowski(R, level = 4) { return minkowski(regular(4, Math.PI / 4), level); },
    weierstrass(R, level = 11) {
      // Radial Weierstrass-type function with `level` octaves: continuous, and
      // nowhere differentiable in the limit. Phases are drawn for all octaves so
      // lower levels are truncations of higher ones.
      const MAXK = 16, m = 2 + Math.floor(R() * 2), ph = Array.from({ length: MAXK }, () => R() * TAU), K = Math.min(level, MAXK);
      const N = Math.min(1 << 17, Math.max(2400, 8 * m * (1 << K)));
      return polar(N, t => { let s = 1; for (let k = 0; k < K; k++) s += 0.085 * Math.pow(2, -k / 2) * Math.cos(m * (1 << k) * t + ph[k]); return s; });
    },
    coastline(R, level = 14) {
      // Periodic midpoint displacement of log-radius (Hurst 0.35): a rough random
      // fractal. `level` = number of refinement levels (2^level points); coarse
      // values are identical across levels.
      const MAXL = 16, N = 1 << MAXL, v = new Float64Array(N + 1), L = Math.max(2, Math.min(level, MAXL));
      for (let k = 0; k < 4; k++) v[(k * N) / 4] = (R() - 0.5) * 0.4;
      v[N] = v[0];
      const last = N >> L;
      for (let step = N / 4, amp = 0.2; step > last; step /= 2, amp *= Math.pow(2, -0.35)) {
        for (let i = step / 2; i < N; i += step) v[i] = (v[i - step / 2] + v[i + step / 2]) / 2 + (R() - 0.5) * 2 * amp;
      }
      const out = [];
      for (let i = 0; i < N; i += last) { const t = (i / N) * TAU, r = Math.exp(v[i]); out.push({ x: r * Math.cos(t), y: r * Math.sin(t) }); }
      return out;
    },
  };

  const LIST = [
    ['random', 'Random blob'], ['star', 'Star'], ['circle', 'Circle (control)'], ['ellipse', 'Ellipse'], ['triangle', 'Triangle'],
    ['crescent', 'Crescent'], ['polygon', 'Polygon'], ['teardrop', 'Teardrop'], ['heart', 'Heart-like'],
    ['comb', 'Comb (non-convex)'], ['spiral', 'Spiral (not star-shaped)'],
    ['koch', 'Koch snowflake (fractal)'], ['antikoch', 'Hexagonal anti-snowflake (fractal)'],
    ['minkowski', 'Minkowski island (fractal)'], ['weierstrass', 'Weierstrass blob (fractal)'],
    ['coastline', 'Random coastline (fractal)'],
  ];

  function dedupe(pts) {
    const out = [];
    for (const p of pts) { const q = out[out.length - 1]; if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 1e-12) out.push(p); }
    while (out.length > 1 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].y - out[out.length - 1].y) < 1e-12) out.pop();
    return out;
  }

  function generate(type, seed, level) {
    const g = GEN[type] || GEN.random;
    return dedupe(level === undefined ? g(rng(seed)) : g(rng(seed), level));
  }
  // Roughness levels available for each fractal family: [min, max].
  const LEVELS = { koch: [0, 7], antikoch: [0, 6], minkowski: [0, 5], weierstrass: [0, 14], coastline: [2, 16] };
  // The level each fractal uses when no level is given (as in the finders).
  const DEFAULT_LEVEL = { koch: 6, antikoch: 5, minkowski: 4, weierstrass: 11, coastline: 14 };

  // The scale and offset fit() uses: canvas = (ox + s·x, oy + s·y).
  function fitTransform(pts, W, H, margin) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const s = Math.min((W - 2 * margin) / (x1 - x0), (H - 2 * margin) / (y1 - y0));
    return { s, ox: W / 2 - (s * (x0 + x1)) / 2, oy: H / 2 - (s * (y0 + y1)) / 2 };
  }
  function fit(pts, W, H, margin) {
    const { s, ox, oy } = fitTransform(pts, W, H, margin);
    return pts.map(p => ({ x: ox + s * p.x, y: oy + s * p.y }));
  }

  function populateSelect(sel) {
    sel.innerHTML = '';
    for (const [v, l] of LIST) { const o = document.createElement('option'); o.value = v; o.textContent = l; sel.appendChild(o); }
  }

  // Accelerated queries on a closed polygon: farthest ray hit, distance to the
  // curve and point-in-polygon. Edges are grouped in chunks with bounding boxes.
  function accel(pts) {
    const n = pts.length, AX = new Float64Array(n), AY = new Float64Array(n), EX = new Float64Array(n), EY = new Float64Array(n), CH = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      AX[i] = a.x; AY[i] = a.y; EX[i] = b.x - a.x; EY[i] = b.y - a.y;
      x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y);
    }
    const S = Math.max(x1 - x0, y1 - y0), pad = 1e-9 * S;
    for (let s = 0; s < n; s += 32) {
      const c = { s, e: Math.min(n, s + 32), x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      for (let i = c.s; i < c.e; i++) for (const [x, y] of [[AX[i], AY[i]], [AX[i] + EX[i], AY[i] + EY[i]]]) {
        c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
      }
      c.x0 -= pad; c.x1 += pad; c.y0 -= pad; c.y1 += pad; CH.push(c);
    }
    function far(ox, oy, dx, dy) {
      let best = -1; const tmin = 1e-9 * S;
      for (const c of CH) {
        let t0 = -Infinity, t1 = Infinity;
        if (dx !== 0) { let a = (c.x0 - ox) / dx, b = (c.x1 - ox) / dx; if (a > b) [a, b] = [b, a]; t0 = a; t1 = b; } else if (ox < c.x0 || ox > c.x1) continue;
        if (dy !== 0) { let a = (c.y0 - oy) / dy, b = (c.y1 - oy) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } else if (oy < c.y0 || oy > c.y1) continue;
        if (t1 < t0 || t1 <= best || t1 <= tmin) continue;
        for (let i = c.s; i < c.e; i++) {
          const ex = EX[i], ey = EY[i], den = dx * ey - dy * ex; if (den === 0) continue;
          const px = AX[i] - ox, py = AY[i] - oy, t = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den;
          if (t > tmin && u >= 0 && u <= 1 && t > best) best = t;
        }
      }
      return best;
    }
    function dist(px, py) {
      let best = Infinity;
      for (const c of CH) {
        const bx = Math.max(c.x0 - px, 0, px - c.x1), by = Math.max(c.y0 - py, 0, py - c.y1);
        if (bx * bx + by * by >= best * best) continue;
        for (let i = c.s; i < c.e; i++) {
          const ex = EX[i], ey = EY[i], L = ex * ex + ey * ey;
          const u = Math.max(0, Math.min(1, L ? ((px - AX[i]) * ex + (py - AY[i]) * ey) / L : 0));
          best = Math.min(best, Math.hypot(AX[i] + u * ex - px, AY[i] + u * ey - py));
        }
      }
      return best;
    }
    function inside(px, py) {
      let ins = false;
      for (const c of CH) {
        if (py < c.y0 || py > c.y1 || px > c.x1) continue;
        for (let i = c.s; i < c.e; i++) {
          const yi = AY[i], yj = AY[i] + EY[i];
          if ((yi > py) !== (yj > py) && px < (EX[i] * (py - yi)) / EY[i] + AX[i]) ins = !ins;
        }
      }
      return ins;
    }
    return { far, dist, inside, S };
  }

  // Newton's method with a central-difference Jacobian and backtracking.
  function newton(F, x0, h, maxIt) {
    const norm = f => Math.sqrt(f.reduce((s, v) => s + v * v, 0));
    let x = x0.slice(), f = F(x); if (!f) return null; let nf = norm(f);
    for (let it = 0; it < maxIt && nf > 1e-16; it++) {
      const J = f.map(() => []);
      for (let j = 0; j < x.length; j++) {
        const xp = x.slice(), xm = x.slice(); xp[j] += h[j]; xm[j] -= h[j];
        const fp = F(xp), fm = F(xm); if (!fp || !fm) return { x, f, nf };
        for (let i = 0; i < f.length; i++) J[i][j] = (fp[i] - fm[i]) / (2 * h[j]);
      }
      // Square systems: Gaussian elimination with partial pivoting. More equations than
      // unknowns: a Gauss–Newton step on the (slightly regularised) normal equations.
      let Am = J, bv = f.map(v => -v);
      if (f.length !== x.length) {
        const n = x.length, A = [], g = [];
        for (let a = 0; a < n; a++) { A.push([]); g.push(-J.reduce((s, row, i) => s + row[a] * f[i], 0)); for (let b = 0; b < n; b++) A[a].push(J.reduce((s, row) => s + row[a] * row[b], 0)); }
        const tr = A.reduce((s, r, i) => s + r[i], 0) / n; for (let a = 0; a < n; a++) A[a][a] += 1e-12 * tr;
        Am = A; bv = g;
      }
      const n = bv.length, M = Am.map((row, i) => row.concat([bv[i]]));
      let singular = false;
      for (let c = 0; c < n && !singular; c++) {
        let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        if (Math.abs(M[p][c]) < 1e-300) { singular = true; break; }
        [M[c], M[p]] = [M[p], M[c]];
        for (let r = c + 1; r < n; r++) { const q = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= q * M[c][k]; }
      }
      if (singular) break;
      const d = new Array(n).fill(0);
      for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * d[k]; d[r] = s / M[r][r]; }
      let ok = false;
      for (let a = 1; a > 1e-4; a /= 2) {
        const xn = x.map((v, i) => v + a * d[i]), fn = F(xn);
        if (fn && norm(fn) < nf) { x = xn; f = fn; nf = norm(fn); ok = true; break; }
      }
      if (!ok) break;
    }
    return { x, f, nf };
  }

  // Expected search times (rough, measured on a laptop). '∞' means no exact
  // solution is expected, e.g. a square with the rotation held fixed.
  const SQUARE_EST = { comb: '~1 s', crescent: '~2 s', spiral: '~2 s', weierstrass: '~2–20 s', coastline: '~10–60 s' };
  const RECT_EST = { comb: '~1–5 s', crescent: '~2–5 s', spiral: '~2–5 s', weierstrass: '~5–30 s', coastline: '~10–60 s' };
  const ROUGH = new Set(['coastline', 'weierstrass']);
  function estimate(shape, type, pivotOnly) {
    const family = shape === 'triangle' || shape === 'trianglex';
    if (type === 'circle') return '< 1 s';   // every inscribed polygon target fits a circle
    if (pivotOnly) return !family ? '∞' : ROUGH.has(type) ? '~1–3 s' : '< 1 s';
    if (shape === 'pentagon' || shape === 'hexagon') return '∞';
    if (shape === 'square') return SQUARE_EST[type] || '< 1 s';
    if (shape === 'rectangle') return RECT_EST[type] || '< 2 s';
    return ROUGH.has(type) ? '~1–3 s' : '< 1 s';
  }

  global.Shapes2D = { list: LIST, generate, fit, fitTransform, populateSelect, rng, accel, newton, estimate, LEVELS, DEFAULT_LEVEL };
})(typeof window !== 'undefined' ? window : globalThis);
