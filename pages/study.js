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

  const api = { FAMILIES, SWEEP_CURVES, ASPECTS, QUICK_MAX, squareStudy, rectangleSweep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Study = api;
})(typeof window !== 'undefined' ? window : globalThis);
