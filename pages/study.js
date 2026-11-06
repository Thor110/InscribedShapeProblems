// The two experiments: square shrinkage and the rectangle sweep.
// Shared by tests/run-study.js (Node) and pages/inscribed-study.html (browser).
//
// Square shrinkage: for each fractal family, walk up its roughness levels. At each
// level, collect verified inscribed squares, starting from the previous level's
// squares (continuation) plus a fresh search. Record the largest square and how
// each square's size changed from one level to the next.
//
// Rectangle sweep: for each curve, walk up a list of aspect ratios, continuing the
// rectangles from the previous aspect ratio plus a fresh search.
(function (global) {
  'use strict';
  const Shapes2D = global.Shapes2D || (require('./shapes2d.js'), globalThis.Shapes2D);
  const Inscribed2D = global.Inscribed2D || require('./inscribed-2d.js');
  // 3D modules are only needed for the tetrahedron study; looked up when it starts,
  // so the page may load them after this file.
  const mod3D = () => ({
    Surfaces3D: global.Surfaces3D || (require('./surfaces3d.js'), globalThis.Surfaces3D),
    InscribedND: global.InscribedND || require('./inscribed-nd.js'),
  });

  const FAMILIES = [
    { family: 'koch', label: 'Koch snowflake', levels: [0, 7] },
    { family: 'minkowski', label: 'Minkowski island', levels: [0, 5] },
    { family: 'weierstrass', label: 'Weierstrass blob', levels: [0, 14] },
    { family: 'coastline', label: 'Random coastline', levels: [2, 16] },
  ];
  const QUICK_MAX = { koch: 5, minkowski: 4, weierstrass: 9, coastline: 11 };
  const SWEEP_CURVES = [
    { type: 'ellipse', label: 'Ellipse' }, { type: 'star', label: 'Star' }, { type: 'crescent', label: 'Crescent' },
    { type: 'spiral', label: 'Spiral' }, { type: 'comb', label: 'Comb' },
    { type: 'koch', level: 5, label: 'Koch snowflake (level 5)' }, { type: 'minkowski', level: 4, label: 'Minkowski island (level 4)' },
    { type: 'weierstrass', level: 10, label: 'Weierstrass blob (level 10)' }, { type: 'coastline', level: 12, label: 'Random coastline (level 12)' },
  ];
  const ASPECTS = [1, 1.5, 2, 3, 4, 6, 8, 12, 16];
  const MAX_SEEDS = 40;

  const budget = verts => (verts <= 4096 ? { starts: 10, random: 300, track: 600 } : { starts: 4, random: 80, track: 150 });
  // the median, taking the upper of the two middle values for even counts (as in the saved data)
  const median = a => { if (!a.length) return NaN; const b = a.slice().sort((p, q) => p - q); return b[Math.floor(b.length / 2)]; };
  const topSeeds = found => found.slice(0, MAX_SEEDS).map(f => ({ x: f.x, y: f.y, ang: f.ang, r: f.r, diag: f.diag }));

  // Yields progress objects; returns { families: [...] }.
  function* squareStudy(opts = {}) {
    const seed = opts.seed || 1, out = [];
    for (const F of opts.families || FAMILIES) {
      const maxL = opts.quick ? Math.min(F.levels[1], QUICK_MAX[F.family]) : F.levels[1];
      const rec = { family: F.family, label: F.label, seed, levels: [] };
      out.push(rec);
      let seeds = [];
      for (let L = F.levels[0]; L <= maxL; L++) {
        const pts = Shapes2D.generate(F.family, seed, L), t0 = Date.now();
        // Seeds are in the previous level's units; each level is fitted the same way
        // (same coordinates), so positions carry over directly.
        const g = Inscribed2D.findGen(pts, Object.assign({ aspect: 1, seed: seed * 1000 + L, seeds }, budget(pts.length)));
        let x; while (!(x = g.next()).done) yield { kind: 'square', family: F.label, level: L, maxLevel: maxL, inner: x.value, data: out };
        const r = x.value, S = r.S;
        const ratios = seeds.filter(s => s.next).map(s => s.next.diag / s.diag);
        rec.levels.push({
          level: L, vertices: pts.length, count: r.found.length,
          largest: r.found.length ? r.found[0].diag / S : 0,
          smallest: r.found.length ? r.found[r.found.length - 1].diag / S : 0,
          seeds: seeds.length, continued: seeds.filter(s => s.next).length,
          minRatio: ratios.length ? Math.min(...ratios) : NaN, medianRatio: median(ratios),
          best: r.found[0] ? r.found[0].P.map(p => [p.x, p.y]) : null, ms: Date.now() - t0,
        });
        seeds = topSeeds(r.found);
        yield { kind: 'square', family: F.label, level: L, maxLevel: maxL, data: out, levelDone: true };
      }
    }
    return { families: out };
  }

  function* rectangleSweep(opts = {}) {
    const seed = opts.seed || 1, curves = opts.curves || SWEEP_CURVES, aspects = opts.aspects || ASPECTS, out = { aspects, seed, curves: [] };
    for (const C of curves) {
      const pts = C.level === undefined ? Shapes2D.generate(C.type, seed) : Shapes2D.generate(C.type, seed, C.level);
      const row = { type: C.type, level: C.level, label: C.label, cells: [] };
      out.curves.push(row);
      let seeds = [];
      const kept = [];   // top rectangles per aspect, for the backward pass
      for (const a of aspects) {
        const t0 = Date.now();
        const g = Inscribed2D.findGen(pts, Object.assign({ aspect: a, seed: seed * 7 + Math.round(a * 100), seeds }, opts.quick ? { starts: 3, random: 60, track: 120 } : { starts: 6, random: 150, track: 300 }));
        let x; while (!(x = g.next()).done) yield { kind: 'rect', curve: C.label, aspect: a, inner: x.value, data: out };
        const r = x.value;
        row.cells.push({ aspect: a, count: r.found.length, largest: r.found.length ? r.found[0].diag / r.S : 0, best: r.found[0] ? r.found[0].P.map(p => [p.x, p.y]) : null, ms: Date.now() - t0 });
        seeds = topSeeds(r.found); kept.push(seeds);
        yield { kind: 'rect', curve: C.label, aspect: a, data: out, cellDone: true };
      }
      // Backward pass: continue rectangles from each aspect ratio down to the one
      // before it, filling cells the forward pass missed and keeping the larger result.
      for (let j = aspects.length - 2; j >= 0; j--) {
        const from = kept[j + 1]; if (!from.length) continue;
        const g = Inscribed2D.findGen(pts, { aspect: aspects[j], seeds: from.map(s => Object.assign({}, s)), starts: 0, random: 0, track: 0 });
        let x; while (!(x = g.next()).done) yield { kind: 'rect', curve: C.label, aspect: aspects[j], inner: x.value, data: out };
        const r = x.value, cell = row.cells[j], big = r.found.length ? r.found[0].diag / r.S : 0;
        if (r.found.length) {
          if (big > cell.largest) { cell.largest = big; cell.best = r.found[0].P.map(p => [p.x, p.y]); }
          cell.count = Math.max(cell.count, r.found.length);
          if (!kept[j].length) kept[j] = topSeeds(r.found);
        }
      }
      yield { kind: 'rect', curve: C.label, aspect: aspects[0], data: out, cellDone: true };
    }
    return out;
  }

  // ---------- tetrahedron shrinkage (3D) ----------
  // Regular tetrahedra on a smooth surface form a 3-parameter family (one for every
  // orientation), so instead of "the largest" we follow a fixed set of them. Level 0:
  // K tetrahedra at K fixed random orientations (pivot-only solve). Each later level
  // adds one octave of detail; every tetrahedron is carried across by blending the
  // new octave in gradually while position and orientation are both free to adjust.
  // Sizes are circumradius ÷ the surface's mean radius at that level.
  const TETRA_FAMILIES = [
    { family: 'fractal', label: 'Weierstrass (Hölder 0.5)', levels: [0, 16] },
    { family: 'ridged', label: 'Ridged', levels: [0, 16] },
    { family: 'rough', label: 'Rough (Hölder 0.3)', levels: [0, 16] },
  ];
  function meanRadius(rad, R) {
    let s = 0; const N = 2000;
    for (let i = 0; i < N; i++) { let v = [R() - 0.5, R() - 0.5, R() - 0.5]; const L = Math.hypot(...v); v = v.map(x => x / L); s += rad(v); }
    return s / N;
  }
  // Run a solver step by step, reporting `tick` as progress after each step.
  function* paced(steps, tick) { let x; while (!(x = steps.next()).done) yield tick; return x.value; }
  function* tetraStudy(opts = {}) {
    const { Surfaces3D, InscribedND } = mod3D();
    const seed = opts.seed || 1, K = opts.orientations || 16, out = [];
    for (const F of opts.families || TETRA_FAMILIES) {
      const maxL = opts.quick ? 10 : F.levels[1], rec = { family: F.family, label: F.label, seed, orientations: K, levels: [] };
      out.push(rec);
      const Rn = InscribedND.rng(seed * 977 + 3), Qs = Array.from({ length: K }, (_, i) => (i === 0 ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : InscribedND.randomRotation(3, Rn)));
      const problem = rad => InscribedND.makeProblem('simplex', 3, null, seed, { rad, rmax: 1.6 });
      let sols = [];
      for (let L = F.levels[0]; L <= maxL; L++) {
        const t0 = Date.now(), b = Surfaces3D.make(F.family, seed, L), next = [];
        const tick = { kind: 'tetra', family: F.label, level: L, maxLevel: maxL, data: out };
        yield tick;   // let the page update between heavy steps (results are unaffected)
        if (L === F.levels[0]) {
          const P = problem(b);
          for (const Q of Qs) { const v = yield* paced(P.solvePoseSteps(Q, [0, 0, 0]), tick); next.push(v && v.ok ? v : null); yield tick; }
        } else {
          const a = Surfaces3D.make(F.family, seed, L - 1);
          yield tick;
          for (const v0 of sols) {
            if (!v0) { next.push(null); continue; }
            // adaptive homotopy from the previous level's surface to this one
            let t = 0, h = 1, cur = v0.st, last = null;
            while (t < 1) {
              const tt = Math.min(1, t + h), v = yield* paced(problem(u => (1 - tt) * a(u) + tt * b(u)).refineSteps(cur, { maxIt: 60 }), tick);
              if (v && v.ok) { t = tt; cur = v.st; last = v; h = Math.min(1, h * 2); } else { h /= 2; if (h < 1 / 128) break; }
              yield { kind: 'tetra', family: F.label, level: L, maxLevel: maxL, data: out };
            }
            next.push(t >= 1 ? last : null);
          }
        }
        yield tick;
        const mr = meanRadius(b, InscribedND.rng(seed + L)), live = next.filter(Boolean), sizes = live.map(v => v.size / mr);
        const ratios = next.map((v, i) => (v && sols[i] ? v.size / sols[i].size : null)).filter(x => x !== null);
        const big = live.reduce((m, v) => (!m || v.size > m.size ? v : m), null), small = live.reduce((m, v) => (!m || v.size < m.size ? v : m), null);
        rec.levels.push({
          level: L, vertices: L, count: live.length, tracked: L === F.levels[0] ? K : sols.filter(Boolean).length,   // all K at the first level
          smallest: sizes.length ? Math.min(...sizes) : 0, largest: sizes.length ? Math.max(...sizes) : 0, median: median(sizes),
          minRatio: ratios.length ? Math.min(...ratios) : NaN, best: big ? big.P : null, smallestP: small ? small.P : null, ms: Date.now() - t0,
        });
        sols = next;
        yield { kind: 'tetra', family: F.label, level: L, maxLevel: maxL, data: out, levelDone: true };
      }
    }
    return { families: out };
  }

  // ---------- counting squares: parity ----------
  // Find EVERY inscribed square and every 2:1 rectangle (pages/square-count.js),
  // twice: on a base grid and on a grid twice as fine. The count is only reported
  // when both agree (and every square was found through both of its diagonals);
  // otherwise it is marked unresolved. Part 1: smooth and polygonal curves.
  // Part 2: fractal families level by level, until the count stops converging
  // (on rough curves, small squares multiply at every scale).
  const PARITY_CURVES = [
    ...['ellipse', 'random', 'star', 'teardrop', 'polygon', 'triangle'].flatMap(t => [1, 2, 3].map(seed => ({ type: t, seed }))),
    { type: 'heart', seed: 1 }, { type: 'crescent', seed: 1 }, { type: 'comb', seed: 1 }, { type: 'spiral', seed: 1 },
  ];
  const PARITY_FAMILIES = [
    { family: 'coastline', label: 'Random coastline', levels: [2, 11] },
    { family: 'weierstrass', label: 'Weierstrass blob', levels: [0, 8] },
    { family: 'koch', label: 'Koch snowflake (jittered)', levels: [0, 5], jitter: 0.03 },
  ];
  function jittered(pts, amount, seed) {
    const R = Shapes2D.rng(seed * 7717 + 11); let e = 0;
    for (let i = 0; i < pts.length; i++) e += Math.hypot(pts[(i + 1) % pts.length].x - pts[i].x, pts[(i + 1) % pts.length].y - pts[i].y);
    const a = (amount * e) / pts.length;
    return pts.map(p => ({ x: p.x + (R() * 2 - 1) * a, y: p.y + (R() * 2 - 1) * a }));
  }
  // Count on grids of increasing resolution (512, 1024, …) until two successive
  // grids agree and every square was found through both diagonals; give up at
  // max(4096, 4·edges).
  function* countBoth(SC, pts, aspect, tag, quick) {
    const C = SC.prepare(pts), limit = quick ? 2048 : Math.max(4096, 4 * pts.length); let prev = null;
    for (let M = 512; M <= limit; M *= 2) {
      const g = SC.enumerateGen(pts, { aspect, prepared: C, M }); let x; while (!(x = g.next()).done) yield tag;
      const r = x.value;
      if (prev && prev.count === r.count && Number.isInteger(r.count)) return { count: r.count, parity: r.parity, ok: true, zeros: r.zeros, M };
      prev = r;
    }
    return { count: prev.count, parity: 'unresolved', ok: false, zeros: prev.zeros };
  }
  function* parityStudy(opts = {}) {
    const SC = global.SquareCount || require('./square-count.js'), seed = opts.seed || 1, rows = [];
    const entry = function* (label, group, pts) {
      const t0 = Date.now(), tag = { kind: 'parity', label, data: rows };
      const sq = yield* countBoth(SC, pts, 1, tag, opts.quick), r2 = yield* countBoth(SC, pts, 2, tag, opts.quick), d = sq.zeros.map(z => z.diag);
      const row = { label, group, vertices: pts.length, squares: sq.count, squaresParity: sq.parity, rect2: r2.count, rect2Parity: r2.parity, largest: d.length ? Math.max(...d) : 0, smallest: d.length ? Math.min(...d) : 0, ms: Date.now() - t0 };
      rows.push(row); yield { kind: 'parity', label, data: rows, rowDone: true };
      return row;
    };
    const QUICK = ['ellipse', 'random', 'star', 'triangle', 'teardrop'];
    for (const c of opts.curves || PARITY_CURVES) {
      if (opts.quick && (c.seed > 1 || !QUICK.includes(c.type))) continue;
      yield* entry(`${c.type}, seed ${c.seed}`, 'smooth and polygonal curves', Shapes2D.generate(c.type, c.seed));
    }
    for (const F of opts.families || PARITY_FAMILIES) {
      let misses = 0;
      for (let L = F.levels[0]; L <= F.levels[1] && misses < 2; L++) {
        const raw = Shapes2D.generate(F.family, seed, L), pts = F.jitter ? jittered(raw, F.jitter, seed * 100 + L) : raw;
        if (opts.quick && pts.length > 256) break;
        const row = yield* entry(`${F.label}, level ${L}`, F.label, pts);
        if (row.squaresParity === 'unresolved') misses++;
      }
    }
    return { rows };
  }

  const api = { jittered, FAMILIES, SWEEP_CURVES, ASPECTS, QUICK_MAX, TETRA_FAMILIES, PARITY_FAMILIES, PARITY_CURVES, squareStudy, rectangleSweep, tetraStudy, parityStudy };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Study = api;
})(typeof window !== 'undefined' ? window : globalThis);
