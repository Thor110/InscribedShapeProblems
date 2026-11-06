// Interval arithmetic with outward rounding, for the rigorous certificates
// (tools/certify-rigorous.js, PROOFS.md Theorems 6–7).
//
// Each operation computes its result with the hardware's round-to-nearest and then
// moves the lower end down and the upper end up by one unit in the last place.
// Round-to-nearest is within half a unit of the exact result for +, −, ×, ÷ and
// sqrt (IEEE 754), so the exact result always lies inside. No trigonometric or
// other library functions are used, because JavaScript does not guarantee their
// accuracy.
(function (global) {
  'use strict';
  const buf = new DataView(new ArrayBuffer(8));
  function nextUp(x) {
    if (x !== x || x === Infinity) return x;
    if (x === 0) return Number.MIN_VALUE;
    buf.setFloat64(0, x); let b = buf.getBigInt64(0);
    b += x > 0 ? 1n : -1n; buf.setBigInt64(0, b); return buf.getFloat64(0);
  }
  const nextDown = x => -nextUp(-x);
  // Fast outward rounding used by the arithmetic below: x ± (|x|·2⁻⁵¹ + 2⁻¹⁰⁷⁴). For
  // normal x the shift is at least two units in the last place, so after rounding to
  // nearest the result is still strictly beyond x; for zero and subnormal x it is at
  // least one subnormal step. (Exactness: |x|·2⁻⁵¹ is an exact power-of-two scaling.)
  const ru = x => x + (Math.abs(x) * 4.440892098500626e-16 + 5e-324);
  const rd = x => x - (Math.abs(x) * 4.440892098500626e-16 + 5e-324);

  const I = (lo, hi = lo) => ({ lo, hi });
  // An interval containing the real number p/q (for constants such as 0.6 = 3/5,
  // which are not exact binary fractions).
  const ratio = (p, q) => I(nextDown(p / q), nextUp(p / q));
  const exact = x => I(x, x);
  const out = (lo, hi) => I(rd(lo), ru(hi));

  const add = (a, b) => out(a.lo + b.lo, a.hi + b.hi);
  const sub = (a, b) => out(a.lo - b.hi, a.hi - b.lo);
  const neg = a => I(-a.hi, -a.lo);
  function mul(a, b) {
    const p = [a.lo * b.lo, a.lo * b.hi, a.hi * b.lo, a.hi * b.hi];
    return out(Math.min(...p), Math.max(...p));
  }
  function div(a, b) {
    if (b.lo <= 0 && b.hi >= 0) throw new Error('interval division by an interval containing 0');
    const p = [a.lo / b.lo, a.lo / b.hi, a.hi / b.lo, a.hi / b.hi];
    return out(Math.min(...p), Math.max(...p));
  }
  function sqr(a) {
    const l = Math.abs(a.lo), h = Math.abs(a.hi), m = Math.max(l, h);
    const lo = a.lo <= 0 && a.hi >= 0 ? 0 : Math.min(l, h) ** 2;
    return I(lo === 0 ? 0 : Math.max(0, rd(lo)), ru(m * m));
  }
  const sqrt = a => I(a.lo <= 0 ? 0 : Math.max(0, rd(Math.sqrt(a.lo))), ru(Math.sqrt(Math.max(0, a.hi))));
  const mag = a => Math.max(Math.abs(a.lo), Math.abs(a.hi));         // upper bound of |a|
  const mig = a => (a.lo > 0 ? a.lo : a.hi < 0 ? -a.hi : 0);          // lower bound of |a|
  const hull = (a, b) => I(Math.min(a.lo, b.lo), Math.max(a.hi, b.hi));
  const scale = (a, k) => mul(a, exact(k));
  const norm = v => sqrt(v.reduce((s, x) => add(s, sqr(x)), exact(0)));  // Euclidean norm of an interval vector
  // Upper-rounded arithmetic on plain numbers (for bounds that are only ever used as upper bounds).
  const up = { add: (a, b) => ru(a + b), mul: (a, b) => ru(a * b), div: (a, b) => ru(a / b), sqrt: a => ru(Math.sqrt(a)) };
  const lowDiv = (a, b) => rd(a / b), lowSub = (a, b) => rd(a - b);

  // Signed distance (negative inside) from the point p (plain numbers, taken as exact)
  // to the ellipsoid Σ x_i²/a_i² = 1 with semi-axes given as intervals (2 or 3 of them).
  // The closest point is q_i = a_i² p_i/(t + a_i²), where t is the unique root above
  // −min a_i² of the decreasing function F(t) = Σ (a_i p_i/(t + a_i²))² − 1, and the
  // distance is |t|·√Σ (p_i/(t + a_i²))². The root is found in floating point and
  // then enclosed: F is verified positive and negative at the two ends of a small
  // bracket, in interval arithmetic. Returns an interval containing sd(p), or null if
  // the bracket could not be verified (it can fail only in the degenerate case of a
  // point exactly on a symmetry plane, deep inside).
  function ellipsoidSD(axes) {
    const a2 = axes.map(sqr), amin2 = a2.reduce((m, v) => (v.hi < m.hi ? v : m));
    const af = axes.map(a => (a.lo + a.hi) / 2), a2f = af.map(v => v * v), amin2f = Math.min(...a2f);
    const Fi = (p, t) => { let s = exact(-1); for (let i = 0; i < p.length; i++) { const den = add(t, a2[i]); s = add(s, sqr(div(mul(axes[i], exact(p[i])), den))); } return s; };
    const Ff = (p, t) => { let s = -1; for (let i = 0; i < p.length; i++) { const r = (af[i] * p[i]) / (t + a2f[i]); s += r * r; } return s; };
    return p => {
      // Floating-point root by Newton's method. F is convex and decreasing on
      // (−min a², ∞), so Newton started where F ≥ 0 increases monotonically to the root.
      // Outside, start at t = 0 (F(0) > 0); inside, at t = −a_k² + a_k|p_k| for the
      // shortest axis k, where the k-th term alone equals 1, so F ≥ 0.
      const k = a2f.indexOf(amin2f);
      let t0 = Ff(p, 0) > 0 ? 0 : -amin2f + af[k] * Math.abs(p[k]);
      for (let it = 0; it < 100; it++) {
        let F = -1, dF = 0;
        for (let i = 0; i < p.length; i++) { const u = t0 + a2f[i], r = (af[i] * p[i]) / u, r2 = r * r; F += r2; dF -= (2 * r2) / u; }
        if (!(dF < 0)) break;
        const step = F / dF; t0 -= step;
        if (Math.abs(step) <= 1e-16 * (1 + Math.abs(t0))) break;
      }
      // Verified bracket [tl, th]: F(tl) > 0 > F(th), evaluated with outward rounding.
      // Plain-number interval code (no allocation): this runs millions of times.
      const n = p.length, aL = axes.map(a => a.lo), aH = axes.map(a => a.hi), a2L = a2.map(v => v.lo), a2H = a2.map(v => v.hi);
      const Fbounds = t => {        // [lower, upper] of F(t) for exact t with t + a_i² > 0
        let lo = -1, hi = -1;
        for (let i = 0; i < n; i++) {
          const dL = rd(t + a2L[i]), dH = ru(t + a2H[i]); if (!(dL > 0)) return null;
          const q = Math.abs(p[i]), nL = rd(aL[i] * q), nH = ru(aH[i] * q), rL = rd(nL / dH), rH = ru(nH / dL);
          lo = rd(lo + rd(rL * rL)); hi = ru(hi + ru(rH * rH));
        }
        return [lo, hi];
      };
      for (let d = 1e-13 * (1 + Math.abs(t0)); d < 1e-3; d *= 16) {
        const tl = t0 - d, th = t0 + d;
        if (!(tl > -amin2.lo)) return null;
        const Fl = Fbounds(tl), Fh = Fbounds(th);
        if (!Fl || !Fh) return null;
        if (Fl[0] > 0 && Fh[1] < 0) {
          // distance = |t|·√Σ (p_i/(t + a_i²))² over t ∈ [tl, th]
          let sL = 0, sH = 0;
          for (let i = 0; i < n; i++) {
            const dL = rd(tl + a2L[i]), dH = ru(th + a2H[i]), q = Math.abs(p[i]), rL = rd(q / dH), rH = ru(q / dL);
            sL = rd(sL + rd(rL * rL)); sH = ru(sH + ru(rH * rH));
          }
          const tL = tl > 0 ? tl : th < 0 ? -th : 0, tH = Math.max(Math.abs(tl), Math.abs(th));
          const dLo = Math.max(0, rd(tL * Math.max(0, rd(Math.sqrt(Math.max(0, sL)))))), dHi = ru(tH * ru(Math.sqrt(sH)));
          return tl > 0 ? I(dLo, dHi) : th < 0 ? I(-dHi, -dLo) : I(-dHi, dHi);
        }
      }
      return null;
    };
  }

  const api = { nextUp, nextDown, ru, rd, I, ratio, exact, add, sub, neg, mul, div, sqr, sqrt, mag, mig, hull, scale, norm, up, lowDiv, lowSub, ellipsoidSD };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Interval = api;
})(typeof window !== 'undefined' ? window : globalThis);
