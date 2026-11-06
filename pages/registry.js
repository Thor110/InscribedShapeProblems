// Registry of verified inscribed-shape results.
//
// A *result* is one inscribed shape on one catalogued curve or surface:
//   { dim: 2|3, shape, aspect?, curve: { type, seed, level? }, vertices: [[x,y]|[x,y,z], ...], author?, finder? }
// Vertices are in the generator's own coordinates (Shapes2D.generate /
// Surfaces3D.make), in the jig's vertex order.
//
// Only the FIRST verified result for each problem (shape + curve + seed + level)
// is accepted, and only for catalogued curves (seeds 1–10), so the registry
// cannot be flooded with repeats or random seeds. It starts pre-filled with the
// repository's own verified results, so easy cases are already taken.
//
// Used by the pages (check + submit button) and by tools/check-result.js and
// tools/build-registry.js (the GitHub Action). Browser: window.Registry. Node: require().
(function (global) {
  'use strict';
  const REPO = 'https://github.com/Thor110/InscribedSquareProblem';
  const TOL = 1e-9, SEEDS = [1, 10];
  const isNode = typeof module !== 'undefined' && module.exports;
  const S2 = () => global.Shapes2D || (require('./shapes2d.js'), globalThis.Shapes2D);
  const S3 = () => global.Surfaces3D || (require('./surfaces3d.js'), globalThis.Surfaces3D);
  const ND = () => global.InscribedND || require('./inscribed-nd.js');

  // ---------- catalogue ----------
  // Equilateral and other triangles are not collected: that problem is solved and
  // every curve has them, so they would only add noise.
  const SHAPES_2D = ['square', 'rectangle', 'pentagon', 'hexagon'];
  const ASPECTS = [1.5, 2, 3, 4, 6, 8, 12, 16];
  const SHAPES_3D = ['tetrahedron', 'octahedron', 'cube'];
  const NAMES = { square: 'square', rectangle: 'rectangle', pentagon: 'regular pentagon', hexagon: 'regular hexagon', tetrahedron: 'regular tetrahedron', octahedron: 'regular octahedron', cube: 'cube' };

  // Some curves and surfaces ignore the seed (circle, heart, sphere, …). For those
  // only seed 1 is catalogued, so one result cannot be claimed ten times. Detected
  // by generating seeds 1 and 2 and comparing.
  const seedless = {};
  function isSeedless(dim, type) {
    const k = dim + type;
    if (!(k in seedless)) {
      if (dim === 2) { const a = S2().generate(type, 1), b = S2().generate(type, 2); seedless[k] = a.length === b.length && a.every((p, i) => p.x === b[i].x && p.y === b[i].y); }
      else { const a = S3().make(type, 1), b = S3().make(type, 2), us = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.6, 0.48, 0.64]]; seedless[k] = us.every(u => a(u) === b(u)); }
    }
    return seedless[k];
  }
  function catalogueCheck(r) {
    if (!r || (r.dim !== 2 && r.dim !== 3)) return 'dim must be 2 or 3';
    const c = r.curve || {};
    if (!Number.isInteger(c.seed) || c.seed < SEEDS[0] || c.seed > SEEDS[1]) return `only seeds ${SEEDS[0]}–${SEEDS[1]} are catalogued (this one is ${c.seed})`;
    if (c.seed !== 1 && c.type && (r.dim === 2 ? S2().list : S3().list).some(([v]) => v === c.type) && isSeedless(r.dim, c.type)) return `${c.type} does not depend on the seed, so only seed 1 is catalogued`;
    if (r.dim === 2) {
      if (r.shape === 'triangle' || r.shape === 'trianglex') return 'triangles are not collected, since that problem is already solved';
      if (!SHAPES_2D.includes(r.shape)) return `2D shapes collected: ${SHAPES_2D.join(', ')}`;
      if (r.shape === 'rectangle' && !ASPECTS.includes(r.aspect)) return `rectangle aspect ratios collected: ${ASPECTS.join(', ')}`;
      if (!S2().list.some(([v]) => v === c.type)) return `unknown curve ${c.type}`;
      const L = S2().LEVELS[c.type];
      if (L) { if (!Number.isInteger(c.level) || c.level < L[0] || c.level > L[1]) return `${c.type} levels are ${L[0]}–${L[1]}`; }
      else if (c.level !== undefined) return `${c.type} has no levels`;
    } else {
      if (!SHAPES_3D.includes(r.shape)) return `3D shapes collected: ${SHAPES_3D.join(', ')}`;
      if (!S3().list.some(([v]) => v === c.type)) return `unknown surface ${c.type}`;
      const L = S3().LEVELS[c.type];
      if (L) { if (!Number.isInteger(c.level) || c.level < L[0] || c.level > L[1]) return `${c.type} levels are ${L[0]}–${L[1]}`; }
      else if (c.level !== undefined) return `${c.type} has no levels`;
    }
    return null;
  }

  function key(r) {
    const c = r.curve, shape = r.shape === 'rectangle' ? `rectangle-${r.aspect}` : r.shape;
    return `${r.dim}d/${shape}/${c.type}${c.level !== undefined ? '-L' + c.level : ''}/s${c.seed}`;
  }
  const label = r => `${NAMES[r.shape]}${r.shape === 'rectangle' ? ` (aspect ${r.aspect}:1)` : ''} on ${r.curve.type}${r.curve.level !== undefined ? ` level ${r.curve.level}` : ''}, seed ${r.curve.seed}`;

  // ---------- target shapes (unit vertex directions, in jig order) ----------
  function template(r) {
    const ang = a => a.map(t => [Math.cos(t), Math.sin(t)]), reg = n => ang(Array.from({ length: n }, (_, k) => (2 * Math.PI * k) / n));
    switch (r.shape) {
      case 'square': return reg(4);
      case 'pentagon': return reg(5);
      case 'hexagon': return reg(6);
      case 'rectangle': { const a = Math.atan(1 / r.aspect); return ang([a, Math.PI - a, Math.PI + a, 2 * Math.PI - a]); }
      case 'tetrahedron': return ND().directions('simplex', 3);
      case 'octahedron': return ND().directions('cross', 3);
      case 'cube': return ND().directions('cube', 3);
    }
  }

  // ---------- independent verification ----------
  // Rebuilds the curve or surface from (type, seed, level) and checks that the
  // vertices form the target shape (every pairwise distance, at best-fit scale)
  // and lie on it, both to a relative error of TOL.
  function verify(r) {
    const why = catalogueCheck(r); if (why) return { ok: false, reason: why };
    const U = template(r), V = r.vertices;
    if (!Array.isArray(V) || V.length !== U.length || V.some(v => !Array.isArray(v) || v.length !== r.dim || v.some(x => typeof x !== 'number' || !isFinite(x))))
      return { ok: false, reason: `expected ${U.length} vertices with ${r.dim} coordinates each` };
    const d = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
    let num = 0, den = 0, minU = Infinity;
    for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { const u = d(U[i], U[j]); num += d(V[i], V[j]) * u; den += u * u; minU = Math.min(minU, u); }
    const rho = num / den, edge = rho * minU;
    let shapeErr = 0;
    for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) shapeErr = Math.max(shapeErr, Math.abs(d(V[i], V[j]) - rho * d(U[i], U[j])) / edge);
    let surfErr = 0, width;
    if (r.dim === 2) {
      const c = r.curve, pts = c.level === undefined ? S2().generate(c.type, c.seed) : S2().generate(c.type, c.seed, c.level), G = S2().accel(pts);
      width = G.S;
      for (const v of V) surfErr = Math.max(surfErr, G.dist(v[0], v[1]) / edge);
    } else {
      const rad = S3().make(r.curve.type, r.curve.seed, r.curve.level);
      width = 2;
      for (const v of V) { const L = Math.hypot(...v); surfErr = Math.max(surfErr, L > 0 ? Math.abs(L - rad(v.map(x => x / L))) / edge : Infinity); }
    }
    const err = Math.max(shapeErr, surfErr);
    if (!(edge > 1e-3 * width)) return { ok: false, reason: 'shape is too small (degenerate)', err };
    if (!(err < TOL)) return { ok: false, reason: `not verified: relative error ${err.toExponential(2)} (needs < ${TOL})`, err };
    return { ok: true, err, size: (2 * rho) / width };
  }

  // A clean, canonical copy of a result (full-precision coordinates).
  function normalise(r) {
    const out = { dim: r.dim, shape: r.shape };
    if (r.shape === 'rectangle') out.aspect = r.aspect;
    out.curve = { type: r.curve.type, seed: r.curve.seed };
    if (r.curve.level !== undefined) out.curve.level = r.curve.level;
    out.vertices = r.vertices.map(v => v.map(Number));
    if (r.author) out.author = String(r.author).slice(0, 100);
    if (r.finder) out.finder = String(r.finder).slice(0, 100);
    if (r.date) out.date = String(r.date).slice(0, 20);
    return out;
  }

  // ---------- registry lookup (pages) ----------
  let cache = null;
  function load(base) {
    if (!cache) cache = fetch((base || '..') + '/data/registry.json').then(x => { if (!x.ok) throw new Error(x.status); return x.json(); });
    return cache;
  }
  function issueURL(r) {
    const body = JSON.stringify(normalise(r));
    return `${REPO}/issues/new?template=result.yml&labels=result&title=${encodeURIComponent('Result: ' + key(r))}&result=${encodeURIComponent(body)}`;
  }

  // Renders the contribution panel for a verified result into `el`.
  function panel(el, r) {
    if (!el) return;
    el.style.display = '';
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const why = catalogueCheck(r);
    if (why) {
      el.innerHTML = `<span class="reg-muted">Registry: not collected — ${esc(why)}.</span>`;
      if (/seed/.test(why)) {
        // Offer the same shape on a catalogued seed (1 for curves that ignore the seed).
        el.insertAdjacentHTML('beforeend', ' <button class="reg-btn">Try a catalogued seed</button>');
        el.querySelector('.reg-btn').onclick = () => {
          const u = new URL(location.href), one = /does not depend/.test(why) || isSeedless(r.dim, r.curve.type);
          u.searchParams.set('seed', one ? 1 : 1 + Math.floor(Math.random() * SEEDS[1])); location.href = u.toString();
        };
      }
      return;
    }
    const k = key(r), v = verify(r);
    if (!v.ok) { el.innerHTML = `<span class="reg-muted">Registry: this result did not pass the registry's check (${esc(v.reason)}).</span>`; return; }
    el.innerHTML = '<span class="reg-muted">Registry: checking…</span>';
    load().then(reg => {
      const e = reg.entries && reg.entries[k];
      if (e) el.innerHTML = `<span class="reg-muted">Registry: a verified ${esc(NAMES[r.shape])} for this problem is already recorded (${esc(e.author || 'repository baseline')}).</span>`;
      else {
        el.innerHTML = `<span class="reg-new">New: no verified ${esc(label(r))} has been recorded yet.</span> <button class="reg-btn">Submit it</button> <button class="reg-btn reg-copy">Copy JSON</button>`;
        el.querySelector('.reg-btn').onclick = () => window.open(issueURL(r), '_blank', 'noopener');
        el.querySelector('.reg-copy').onclick = () => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(normalise(r), null, 1));
      }
    }).catch(() => {
      el.innerHTML = `<span class="reg-muted">Registry: could not load the list of verified results (open the site online to check). </span><button class="reg-btn reg-copy">Copy JSON</button>`;
      el.querySelector('.reg-copy').onclick = () => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(normalise(r), null, 1));
    });
  }
  const PANEL_CSS = '.registry{margin-top:6px;font-size:10px;letter-spacing:0.06em;text-align:center;max-width:700px}.registry .reg-muted{color:#555}.registry .reg-new{color:#4a9}.registry .reg-btn{background:transparent;border:1px solid #2a5a4a;color:#4a9;padding:3px 9px;font-family:inherit;font-size:10px;letter-spacing:0.08em;cursor:pointer;text-transform:uppercase;margin-left:4px}.registry .reg-btn:hover{background:#111}';

  const api = { REPO, TOL, SEEDS, SHAPES_2D, SHAPES_3D, ASPECTS, catalogueCheck, key, label, template, verify, normalise, load, issueURL, panel, PANEL_CSS };
  if (isNode) module.exports = api; else global.Registry = api;
})(typeof window !== 'undefined' ? window : globalThis);
