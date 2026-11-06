// Collects inscribed squares and rectangles on a closed polygonal curve.
//
// Same skeletal jig as the Skeletal Shape Finder (four rays from a pivot; equal
// lengths <=> the target rectangle), but instead of stopping at the first verified
// shape it keeps every distinct verified one, so studies can ask "how large is the
// largest inscribed square?" A verified size is a guaranteed lower bound on the
// true largest size.
//
// Browser: window.Inscribed2D (load shapes2d.js first). Node: require().
(function (global) {
  'use strict';
  const Shapes2D = global.Shapes2D || (typeof require !== 'undefined' && (require('./shapes2d.js'), globalThis.Shapes2D));
  const TAU = 2 * Math.PI;

  // ---------- geometry with farthest / nearest / all crossings ----------
  function geometry(pts) {
    const n = pts.length, AX = new Float64Array(n), AY = new Float64Array(n), EX = new Float64Array(n), EY = new Float64Array(n), CH = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      AX[i] = a.x; AY[i] = a.y; EX[i] = b.x - a.x; EY[i] = b.y - a.y;
      x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y);
    }
    const S = Math.max(x1 - x0, y1 - y0), pad = 1e-9 * S, CS = 32;
    for (let s = 0; s < n; s += CS) {
      const c = { s, e: Math.min(n, s + CS), x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      for (let i = c.s; i < c.e; i++) for (const [x, y] of [[AX[i], AY[i]], [AX[i] + EX[i], AY[i] + EY[i]]]) {
        c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
      }
      c.x0 -= pad; c.x1 += pad; c.y0 -= pad; c.y1 += pad; CH.push(c);
    }
    const tmin = 1e-9 * S;
    // mode: 'far' | 'near' | number (crossing closest to that distance)
    function hit(ox, oy, dx, dy, mode) {
      const far = mode === 'far', near = mode === 'near', target = typeof mode === 'number' ? mode : 0;
      let best = far ? -1 : Infinity, bestKey = Infinity;
      for (const c of CH) {
        let t0 = -Infinity, t1 = Infinity;
        if (dx !== 0) { let a = (c.x0 - ox) / dx, b = (c.x1 - ox) / dx; if (a > b) [a, b] = [b, a]; t0 = a; t1 = b; } else if (ox < c.x0 || ox > c.x1) continue;
        if (dy !== 0) { let a = (c.y0 - oy) / dy, b = (c.y1 - oy) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } else if (oy < c.y0 || oy > c.y1) continue;
        if (t1 < t0 || t1 <= tmin) continue;
        if (far && t1 <= best) continue;
        if (near && t0 >= best) continue;
        if (!far && !near && Math.max(t0 - target, target - t1, 0) >= bestKey) continue;
        for (let i = c.s; i < c.e; i++) {
          const ex = EX[i], ey = EY[i], den = dx * ey - dy * ex; if (den === 0) continue;
          const px = AX[i] - ox, py = AY[i] - oy, t = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den;
          if (!(t > tmin && u >= 0 && u <= 1)) continue;
          if (far) { if (t > best) best = t; }
          else if (near) { if (t < best) best = t; }
          else if (Math.abs(t - target) < bestKey) { bestKey = Math.abs(t - target); best = t; }
        }
      }
      return best === Infinity ? -1 : best;
    }
    function all(ox, oy, dx, dy) {
      const out = [];
      for (const c of CH) {
        let t0 = -Infinity, t1 = Infinity;
        if (dx !== 0) { let a = (c.x0 - ox) / dx, b = (c.x1 - ox) / dx; if (a > b) [a, b] = [b, a]; t0 = a; t1 = b; } else if (ox < c.x0 || ox > c.x1) continue;
        if (dy !== 0) { let a = (c.y0 - oy) / dy, b = (c.y1 - oy) / dy; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } else if (oy < c.y0 || oy > c.y1) continue;
        if (t1 < t0 || t1 <= tmin) continue;
        for (let i = c.s; i < c.e; i++) {
          const ex = EX[i], ey = EY[i], den = dx * ey - dy * ex; if (den === 0) continue;
          const px = AX[i] - ox, py = AY[i] - oy, t = (px * ey - py * ex) / den, u = (px * dy - py * dx) / den;
          if (t > tmin && u >= 0 && u <= 1) out.push(t);
        }
      }
      return out.sort((a, b) => a - b);
    }
    function dist(px, py) {
      let best = Infinity;
      for (const c of CH) {
        const bx = Math.max(c.x0 - px, 0, px - c.x1), by = Math.max(c.y0 - py, 0, py - c.y1);
        if (bx * bx + by * by >= best * best) continue;
        for (let i = c.s; i < c.e; i++) {
          const ex = EX[i], ey = EY[i], L = ex * ex + ey * ey, u = Math.max(0, Math.min(1, L ? ((px - AX[i]) * ex + (py - AY[i]) * ey) / L : 0));
          best = Math.min(best, Math.hypot(AX[i] + u * ex - px, AY[i] + u * ey - py));
        }
      }
      return best;
    }
    function inside(px, py) {
      let ins = false;
      for (const c of CH) {
        if (py < c.y0 || py > c.y1 || px > c.x1) continue;
        for (let i = c.s; i < c.e; i++) { const yi = AY[i], yj = AY[i] + EY[i]; if ((yi > py) !== (yj > py) && px < (EX[i] * (py - yi)) / EY[i] + AX[i]) ins = !ins; }
      }
      return ins;
    }
    return { S, x0, x1, y0, y1, hit, all, dist, inside, n };
  }

  // ---------- search ----------
  // Rectangle with aspect a = long/short side >= 1. Rays point at its vertices
  // from the centre: angles α, π-α, π+α, -α with tan α = 1/a.
  function rectDirs(aspect) { const a = Math.atan(1 / Math.max(1, aspect)); return [a, Math.PI - a, Math.PI + a, TAU - a]; }

  function* findGen(pts, opts = {}) {
    const aspect = Math.max(1, opts.aspect || 1), tol = opts.tol || 1e-9, seed = opts.seed || 1;
    const nStarts = opts.starts ?? 10, stepDeg = opts.stepDeg ?? 0.5, nRandom = opts.random ?? 300, nTrack = opts.track ?? 600;
    const G = geometry(pts), S = G.S, D = rectDirs(aspect), period = aspect === 1 ? Math.PI / 2 : Math.PI;
    const R = Shapes2D.rng(seed * 101 + 7);
    let mode = 'far', targets = null;
    const rays = (x, y, ang) => {
      const r = [];
      for (let k = 0; k < 4; k++) {
        const a = ang + D[k], t = G.hit(x, y, Math.cos(a), Math.sin(a), mode === 'track' ? targets[k] : mode);
        if (t < 0) return null; r.push(t);
      }
      return r;
    };
    const center = ang => p => { const r = rays(p[0], p[1], ang); return r && [(r[0] - r[2]) / S, (r[1] - r[3]) / S]; };
    const full = p => { const r = rays(p[0], p[1], p[2]); return r && [(r[0] - r[2]) / S, (r[1] - r[3]) / S, (r[0] + r[2] - r[1] - r[3]) / S]; };
    const H2 = [1e-7 * S, 1e-7 * S], H3 = [1e-7 * S, 1e-7 * S, 1e-8];
    const U = D.map(t => ({ x: Math.cos(t), y: Math.sin(t) }));

    // Independent check (as in the finders): pairwise distances vs the target at
    // best-fit scale, and distance of each vertex to the curve.
    function verify(x, y, ang) {
      const r = rays(x, y, ang); if (!r) return null;
      const P = r.map((t, k) => ({ x: x + t * Math.cos(ang + D[k]), y: y + t * Math.sin(ang + D[k]) }));
      const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      let num = 0, den = 0, minU = Infinity;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const u = d(U[i], U[j]); num += d(P[i], P[j]) * u; den += u * u; minU = Math.min(minU, u); }
      const rho = num / den, edge = rho * minU; let err = 0;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) err = Math.max(err, Math.abs(d(P[i], P[j]) - rho * d(U[i], U[j])) / edge);
      for (const p of P) err = Math.max(err, G.dist(p.x, p.y) / edge);
      return { P, r, err, diag: 2 * rho, x, y, ang };
    }
    const found = [];
    let tries = 0;
    // Returns the recorded (or already known) rectangle, or null if it does not verify.
    function record(x, y, ang) {
      tries++;
      const v = verify(x, y, ang); if (!v || !(v.err < tol) || v.diag < 1e-4 * S) return null;
      // the same rectangle can be found from different starts or jig rotations
      for (const f of found) if (Math.hypot(f.x - x, f.y - y) < 1e-6 * S && Math.abs(f.diag - v.diag) < 1e-6 * S) return f;
      v.mode = mode; if (mode === 'track') v.r = v.r.slice(); found.push(v);
      return v;
    }

    // Starting points: deepest interior grid point first, then a random spread.
    const grid = [], NG = 20;
    for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) {
      const x = G.x0 + ((i + 0.5) / NG) * (G.x1 - G.x0), y = G.y0 + ((j + 0.5) / NG) * (G.y1 - G.y0);
      if (G.inside(x, y)) grid.push({ x, y, d: G.dist(x, y) });
    }
    grid.sort((a, b) => b.d - a.d);
    const starts = grid.slice(0, Math.min(1, nStarts)), rest = grid.slice(1);
    while (starts.length < nStarts && rest.length) starts.push(rest.splice(Math.floor(R() * rest.length), 1)[0]);
    // the sweep below visits angles 0, step, …, period (inclusive), so count period/step + 1 of them
    const total = 2 * starts.length * (Math.floor(period / ((stepDeg * Math.PI) / 180) + 0.5) + 1) + nRandom + nTrack;
    let done = 0;
    const progress = phase => ({ phase, done, total, found: found.length, best: found.reduce((b, f) => (!b || f.diag > b.diag ? f : b), null) });

    // Phase 0: continue given rectangles (e.g. those found on the previous, smoother
    // level of a fractal): re-solve from each one with every jig mode.
    // Each seed's `next` is set to its continuation (or null), so callers can follow
    // how a rectangle's size changes as the curve gets rougher.
    const seedList = opts.seeds || [];
    for (const sd of seedList) {
      sd.next = null;
      for (mode of ['far', 'near', 'track']) {
        if (mode === 'track') { if (!sd.r) continue; targets = sd.r.slice(); }
        let p = [sd.x, sd.y, sd.ang];
        for (let outer = 0; outer < (mode === 'track' ? 25 : 1); outer++) {
          const sol = Shapes2D.newton(full, p, H3, mode === 'track' ? 3 : 80); if (!sol) break;
          p = sol.x;
          if (mode === 'track') { const r = rays(...p); if (!r) break; targets = r; if (sol.nf < 1e-15) break; }
        }
        const f = record(...p);
        // prefer the continuation closest in size to the seed
        if (f && (!sd.next || Math.abs(f.diag - sd.diag) < Math.abs(sd.next.diag - sd.diag))) sd.next = f;
      }
      yield progress(0);
    }

    // Phase 1: the jig's IVT sweep (farthest-hit, then nearest-hit jig).
    const step = (stepDeg * Math.PI) / 180;
    for (mode of ['far', 'near']) {
      for (const st of starts) {
        let x = st.x, y = st.y, prev = null;
        for (let ang = 0; ang <= period + step / 2; ang += step) {
          done++;
          const c = Shapes2D.newton(center(ang), [x, y], H2, prev ? 30 : 60);
          if (c && c.nf < 1e-11) {
            [x, y] = c.x;
            const r = rays(x, y, ang), delta = r && (r[0] + r[2] - r[1] - r[3]) / S;
            if (r && prev && prev.delta * delta <= 0) {
              const w = prev.delta / (prev.delta - delta || 1);
              const sol = Shapes2D.newton(full, [prev.x + w * (x - prev.x), prev.y + w * (y - prev.y), prev.ang + w * (ang - prev.ang)], H3, 80);
              if (sol) record(...sol.x);
            }
            prev = r ? { x, y, ang, delta } : null;
          } else { prev = null; x = st.x; y = st.y; }
          if (done % 8 === 0) yield progress(1);
        }
      }
    }
    // Phase 2: Newton from random positions and angles.
    for (let k = 0; k < nRandom; k++, done++) {
      mode = k % 2 ? 'near' : 'far';
      const sol = Shapes2D.newton(full, [G.x0 + R() * (G.x1 - G.x0), G.y0 + R() * (G.y1 - G.y0), R() * period], H3, 80);
      if (sol) record(...sol.x);
      if (k % 8 === 0) yield progress(2);
    }
    // Phase 3: tracking jig — each arm starts on a random crossing and follows it.
    mode = 'track';
    for (let k = 0; k < nTrack; k++, done++) {
      const x = G.x0 + R() * (G.x1 - G.x0), y = G.y0 + R() * (G.y1 - G.y0), ang = R() * period;
      targets = [];
      for (let j = 0; j < 4; j++) { const all = G.all(x, y, Math.cos(ang + D[j]), Math.sin(ang + D[j])); if (!all.length) break; targets.push(all[Math.floor(R() * all.length)]); }
      if (targets.length === 4) {
        let p = [x, y, ang];
        for (let outer = 0; outer < 25; outer++) {
          const sol = Shapes2D.newton(full, p, H3, 3); if (!sol) break;
          p = sol.x; const r = rays(...p); if (!r) break; targets = r;
          if (sol.nf < 1e-15) break;
        }
        record(...p);
      }
      if (k % 8 === 0) yield progress(3);
    }
    found.sort((a, b) => b.diag - a.diag);
    return { found, tries, S, aspect };
  }

  function find(pts, opts) { const g = findGen(pts, opts); let x; while (!(x = g.next()).done); return x.value; }

  const api = { find, findGen, geometry, rectDirs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Inscribed2D = api;
})(typeof window !== 'undefined' ? window : globalThis);
