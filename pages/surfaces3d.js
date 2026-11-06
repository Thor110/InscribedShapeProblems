// Shared 3D surfaces for the 3D pages. Every surface is star-shaped about the
// origin and given by rad(u): the distance to the surface along unit direction u.
// Because rad is a function of u (not of polar angles), every surface is seam-free.
// Surfaces are seeded so results can be reproduced with ?surface=<type>&seed=<n>.
(function (global) {
  'use strict';
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function randUnit(R) { for (;;) { const v = [R() * 2 - 1, R() * 2 - 1, R() * 2 - 1], L = Math.hypot(...v); if (L > 0.1 && L <= 1) return v.map(x => x / L); } }

  // ---------- surfaces ----------
  // Each surface is star-shaped about the origin and given by rad(u): the distance
  // to the surface along unit direction u. Being a function of u (not of polar
  // angles) makes every surface seam-free. 'egg' is an implicit convex surface with
  // no symmetry at all; its rad() is found by bisection.
  const SURFACES = [
    ['ellipsoid', 'Ellipsoid'], ['egg', 'Lopsided egg (convex, no symmetry)'], ['blob', 'Random blob'],
    ['bumpy', 'Bumpy sphere'], ['star3d', '3D Star'], ['heart', 'Heart-like'], ['ring', 'Ring-like'],
    ['cube', 'Cube-like'], ['fractal', 'Fractal blob (Weierstrass)'], ['ridged', 'Fractal ridged'], ['sphere', 'Sphere'],
  ];
  // For the fractal surfaces, 'octaves' limits how many layers of detail are used.
  // The search solves on a smoothed surface first and then adds detail one octave
  // at a time (continuation); verification and drawing always use full detail.
  let octaves = Infinity;
  const FRACTAL = new Set(['fractal', 'ridged']);
  function makeSurface(type, seed) {
    const R = rng(seed), dirs = n => Array.from({ length: n }, () => randUnit(R)), dot = (u, d) => u[0] * d[0] + u[1] * d[1] + u[2] * d[2];
    switch (type) {
      case 'sphere': return () => 1;
      case 'ellipsoid': { const a = 0.7 + R() * 0.4, b = 0.9 + R() * 0.5, c = 0.7 + R() * 0.4; return u => 1 / Math.sqrt((u[0] / a) ** 2 + (u[1] / b) ** 2 + (u[2] / c) ** 2); }
      case 'egg': {
        const a = 1, b = 1.25, c = 0.85, e = 0.15;   // verified strictly convex (see README)
        const F = (x, y, z) => x * x / a / a + y * y / b / b + z * z / c / c + e * (0.5 * x ** 3 + x * y * z + 0.7 * y * y * z + 0.3 * z ** 3) - 1;
        return u => { let lo = 0, hi = 3; for (let i = 0; i < 64; i++) { const m = (lo + hi) / 2; if (F(m * u[0], m * u[1], m * u[2]) < 0) lo = m; else hi = m; } return (lo + hi) / 2; };
      }
      case 'blob': { const D = dirs(6), A = D.map(() => 0.04 + R() * 0.06), f = D.map(() => 2 + R() * 2), p = D.map(() => R() * 6.283); return u => 1 + D.reduce((s, d, k) => s + A[k] * Math.sin(f[k] * dot(u, d) + p[k]), 0); }
      case 'bumpy': { const f = [4, 4, 4].map(v => v + R() * 4), p = [R(), R(), R()].map(v => v * 6.283); return u => 1 + 0.12 * Math.sin(f[0] * u[0] + p[0]) * Math.sin(f[1] * u[1] + p[1]) * Math.sin(f[2] * u[2] + p[2]); }
      case 'star3d': { const D = dirs(6 + Math.floor(R() * 4)); return u => 0.75 + 0.55 * D.reduce((s, d) => s + Math.max(0, dot(u, d)) ** 14, 0); }
      case 'heart': { const A = 0.2 + R() * 0.1; return u => 1 + A * (1 - u[1]) * u[0] + 0.1 * u[1] * u[1]; }
      case 'ring': { const A = 0.2 + R() * 0.25; return u => 1 + A * (u[0] * u[0] - u[2] * u[2]); }
      case 'cube': { const q = 4 + R() * 5; return u => Math.pow(Math.abs(u[0]) ** q + Math.abs(u[1]) ** q + Math.abs(u[2]) ** q, -1 / q); }
      case 'fractal': { const D = dirs(10), p = D.map(() => R() * 6.283); return u => { let s = 1; for (let k = 0; k < D.length && k < octaves; k++) s += 0.1 * 2 ** (-k / 2) * Math.sin(3 * 2 ** k * dot(u, D[k]) + p[k]); return s; }; }
      case 'ridged': { const D = dirs(9), p = D.map(() => R() * 6.283); return u => { let s = 0.92; for (let k = 0; k < D.length && k < octaves; k++) s += 0.07 * 2 ** (-0.45 * k) * (1 - 2 * Math.abs(Math.sin(2 * 2 ** k * dot(u, D[k]) + p[k]))); return s; }; }
    }
  }


  // Expected search times (rough, measured on a laptop) used by the pages.
  // '∞' means no exact solution is expected, so the search runs until its start
  // budget is used up and then reports the closest candidate.
  // Surfaces where a cube is expected: those with central or mirror symmetry.
  const CUBE_OK = new Set(['sphere', 'ellipsoid', 'ring', 'cube', 'heart']);
  function estimate(shape, type, pivotOnly) {
    if (pivotOnly) {
      if (shape === 'tetrahedron') return FRACTAL.has(type) ? '~1–3 s' : '~1 s';
      if (type === 'sphere') return '< 1 s';
      return CUBE_OK.has(type) ? '∞ unless the rotation lines up with a symmetry of the surface' : '∞';
    }
    if (shape === 'cube') return CUBE_OK.has(type) ? '~1 s' : '∞';
    return FRACTAL.has(type) ? '~1–3 s' : '~1 s';
  }

  global.Surfaces3D = {
    list: SURFACES, make: makeSurface, rng, randUnit, FRACTAL, estimate,
    setOctaves(n) { octaves = n; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
