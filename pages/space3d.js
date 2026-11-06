// Shared 3D helpers for the 3D finder pages (rotations and a small linear solver).
// Plain script: defines window.Space3D; the pages unpack it into local names.
(function (global) {
  'use strict';
  const matMul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const matVec = (A, v) => A.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  function rotVec(w) { // Rodrigues: rotation matrix for rotation vector w
    const th = Math.hypot(...w); if (th < 1e-300) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const [x, y, z] = w.map(v => v / th), c = Math.cos(th), s = Math.sin(th), C = 1 - c;
    return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
  }
  function euler(p, r, y) { // rotate about x (pitch), then y (roll), then z (yaw)
    const Rx = [[1, 0, 0], [0, Math.cos(p), -Math.sin(p)], [0, Math.sin(p), Math.cos(p)]];
    const Ry = [[Math.cos(r), 0, Math.sin(r)], [0, 1, 0], [-Math.sin(r), 0, Math.cos(r)]];
    const Rz = [[Math.cos(y), -Math.sin(y), 0], [Math.sin(y), Math.cos(y), 0], [0, 0, 1]];
    return matMul(Rz, matMul(Ry, Rx));
  }
  function toEuler(R) { return [Math.atan2(R[2][1], R[2][2]), Math.asin(Math.max(-1, Math.min(1, -R[2][0]))), Math.atan2(R[1][0], R[0][0])]; }
  function randRot(Rn) { // uniform random rotation via a random unit quaternion
    const [u1, u2, u3] = [Rn(), Rn(), Rn()], a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
    const [w, x, y, z] = [a * Math.sin(2 * Math.PI * u2), a * Math.cos(2 * Math.PI * u2), b * Math.sin(2 * Math.PI * u3), b * Math.cos(2 * Math.PI * u3)];
    return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]];
  }
  function solveSym(A, b) {
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

  const api = { matMul, matVec, rotVec, euler, toEuler, randRot, solveSym };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Space3D = api;
})(typeof window !== 'undefined' ? window : globalThis);
