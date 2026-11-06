#!/usr/bin/env node
// Nearest misses: how close do numbers come to being perfect?
//
// For every n up to LIMIT, computes σ(n) (the sum of all divisors) and records how
// far it lands from 2n, the target of a perfect number. Like the best undersized
// and best oversized constructions of a classical geometry problem, it keeps two sides:
//   below: deficient numbers, σ(n) < 2n, closing in from under the mark;
//   above: abundant numbers, σ(n) > 2n, closing in from over it.
// Classes: odd n; odd n not divisible by 3 (the exceptions to the steps-of-6 rule);
// even n. Odd σ comes from a segmented sieve over odd numbers, and even σ from
// σ(2^k·m) = (2^(k+1) − 1)·σ(m) for odd m.
// Output: data/nearest-misses.json and images/nearest-misses.svg.
//
//   node tools/nearest-misses.js            # every n up to 10^11 (about 20 minutes on 4 cores)
//   node tools/nearest-misses.js 1e8        # a smaller limit
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), fs = require('fs'), path = require('path');

const SEG = 1 << 22;          // odd numbers per segment
const SMALL = 10;             // keep every n with |σ(n) − 2n| ≤ SMALL
const CLASSES = ['odd', 'oddNot3', 'even'];

// σ(n) for the odd numbers lo, lo + 2, …, lo + 2(len − 1), lo odd, using divisor pairs
// (d, n/d) with d ≤ √n. Only odd d can divide an odd n.
function sieveSegment(lo, len, sig) {
  sig.fill(0, 0, len);
  const hi = lo + 2 * (len - 1);
  for (let d = 1; d * d <= hi; d += 2) {
    // first odd multiple of d that is ≥ max(lo, d²)
    let m = Math.max(lo, d * d); const r = m % d; if (r) m += d - r; if (m % 2 === 0) m += d;
    let q = m / d, i = (m - lo) / 2;
    if (m === d * d) { sig[i] += d; q += 2; i += d; }    // n = d²: d counted once
    for (; i < len; i += d, q += 2) sig[i] += d + q;    // each step: n += 2d, n/d += 2
  }
}

// Per-class accumulator. Local running records are kept per monotone stream of n
// (for even numbers, one stream per power of two), so their union contains every
// global record; the main thread merges them in order of n.
// Even numbers keep no running records: every 6·p (p prime) misses by exactly +12, so
// its relative miss 12/n would set a new record at every prime. Decade bests only.
function acc(records = true) { return { below: [], above: [], decades: {}, count: 0, abundant: 0, records }; }
function stream() { return { bB: Infinity, bA: Infinity }; }
function record(A, S, n, g, dec) {
  const rel = Math.abs(g) / n;
  A.count++;
  const D = A.decades[dec] || (A.decades[dec] = { count: 0, abundant: 0, perfect: 0, below: null, above: null });
  D.count++;
  if (g < 0) {
    if (A.records && rel < S.bB) { S.bB = rel; A.below.push([n, g]); }
    if (!D.below || rel < Math.abs(D.below[1]) / D.below[0]) D.below = [n, g];
  } else if (g > 0) {
    A.abundant++; D.abundant++;
    if (A.records && rel < S.bA) { S.bA = rel; A.above.push([n, g]); }
    if (!D.above || rel < D.above[1] / D.above[0]) D.above = [n, g];
  } else D.perfect++;
}

function scan(task) {
  const { start, end, limit } = task;     // odd m in [start, end)
  const sig = new Float64Array(SEG);
  const out = { odd: acc(), oddNot3: acc(), even: acc(false), small: [] };
  const sOdd = stream(), sNot3 = stream(), sEven = [];
  for (let lo = start; lo < end; lo += 2 * SEG) {
    const len = Math.min(SEG, Math.ceil((end - lo) / 2));
    sieveSegment(lo, len, sig);
    // odd n
    let dec = Math.floor(Math.log10(lo)), next = 10 ** (dec + 1);
    for (let i = 0, n = lo; i < len; i++, n += 2) {
      if (n === 1) continue;                               // 1 is not counted
      if (n >= next) { dec++; next *= 10; }
      const g = sig[i] - 2 * n;
      record(out.odd, sOdd, n, g, dec);
      if (n % 3) record(out.oddNot3, sNot3, n, g, dec);
      if (Math.abs(g) <= SMALL) out.small.push([n, g]);
    }
    // even n = 2^k·m: σ = (2^(k+1) − 1)·σ(m); one monotone stream per k
    for (let k = 1, p2 = 2; lo * p2 < limit; k++, p2 *= 2) {
      const S = sEven[k] || (sEven[k] = stream()), f = 2 * p2 - 1;
      let n = lo * p2, d2 = Math.floor(Math.log10(n)), nx = 10 ** (d2 + 1);
      for (let i = 0; i < len && n < limit; i++, n += 2 * p2) {
        if (n >= nx) { d2++; nx *= 10; }
        const g = f * sig[i] - 2 * n;
        record(out.even, S, n, g, d2);
        if (Math.abs(g) <= SMALL) out.small.push([n, g]);
      }
    }
  }
  return out;
}

if (!isMainThread) { parentPort.postMessage(scan(workerData)); return; }

const LIMIT = Number(process.argv[2] || 1e11);
const t0 = Date.now();
const CHUNK = 2 * SEG * 8, tasks = [];
for (let s = 1; s < LIMIT; s += CHUNK) tasks.push({ start: s, end: Math.min(LIMIT, s + CHUNK), limit: LIMIT });
const nw = Math.max(1, os.cpus().length), results = new Array(tasks.length);
let nextTask = 0, done = 0;

function runWorker() {
  return new Promise((res, rej) => {
    const go = () => {
      if (nextTask >= tasks.length) return res();
      const k = nextTask++, w = new Worker(__filename, { workerData: tasks[k] });
      w.on('message', r => { results[k] = r; done++; if (done % 25 === 0 || done === tasks.length) process.stdout.write(`\r  ${done}/${tasks.length} chunks, ${((Date.now() - t0) / 1000).toFixed(0)} s`); w.terminate(); go(); });
      w.on('error', rej);
    };
    go();
  });
}

Promise.all([...Array(nw)].map(runWorker)).then(() => {
  process.stdout.write('\n');
  const data = { limit: LIMIT, smallGapsMax: SMALL };
  for (const C of CLASSES) {
    // global records: sort every local record by n, keep those that beat all before them
    const merge = side => {
      const all = results.flatMap(r => r[C][side]).sort((a, b) => a[0] - b[0]), recs = []; let best = Infinity;
      for (const [n, g] of all) { const rel = Math.abs(g) / n; if (rel < best) { best = rel; recs.push({ n, gap: g, rel }); } }
      return recs;
    };
    const decades = {};
    let count = 0, abundant = 0;
    for (const r of results) {
      count += r[C].count; abundant += r[C].abundant;
      for (const [k, D] of Object.entries(r[C].decades)) {
        const T = decades[k] || (decades[k] = { decade: +k, count: 0, abundant: 0, perfect: 0, below: null, above: null });
        T.count += D.count; T.abundant += D.abundant; T.perfect += D.perfect;
        for (const side of ['below', 'above']) if (D[side] && (!T[side] || Math.abs(D[side][1]) / D[side][0] < Math.abs(T[side].gap) / T[side].n)) T[side] = { n: D[side][0], gap: D[side][1], rel: Math.abs(D[side][1]) / D[side][0] };
      }
    }
    data[C] = { count, abundant, records: { below: merge('below'), above: merge('above') }, decades: Object.values(decades).sort((a, b) => a.decade - b.decade) };
  }
  const small = results.flatMap(r => r.small).map(([n, g]) => ({ n, gap: g, parity: n % 2 ? 'odd' : 'even' })).sort((a, b) => a.n - b.n);
  data.smallGaps = { max: SMALL, numbers: small, counts: { odd: {}, even: {} } };
  for (const s of small) data.smallGaps.counts[s.parity][s.gap] = (data.smallGaps.counts[s.parity][s.gap] || 0) + 1;
  data.perfect = small.filter(s => s.gap === 0).map(s => s.n);
  data.seconds = (Date.now() - t0) / 1000;
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'nearest-misses.json'), JSON.stringify(data, null, 1) + '\n');
  const Charts = require('../pages/study-charts.js');
  fs.writeFileSync(path.join(__dirname, '..', 'images', 'nearest-misses.svg'), Charts.missesChart(data));

  const f = x => x.toLocaleString('en-US');
  console.log(`Every n up to ${f(LIMIT)} (${data.seconds.toFixed(0)} s on ${nw} threads). Perfect: ${data.perfect.map(f).join(', ')}`);
  for (const C of CLASSES) {
    const D = data[C];
    console.log(`\n${C}: ${f(D.count)} numbers, ${f(D.abundant)} abundant`);
    for (const side of ['below', 'above']) {
      console.log(`  closest miss from ${side} in each of the last decades:`);
      for (const T of D.decades.slice(-4)) { const r = T[side]; if (r) console.log(`    10^${T.decade}: n = ${f(r.n).padStart(15)}   σ(n) − 2n = ${String(r.gap).padStart(7)}   relative ${r.rel.toExponential(3)}`); }
    }
  }
  for (const p of ['odd', 'even']) console.log(`\n${p} n with |σ(n) − 2n| ≤ ${SMALL}, by gap:`, Object.entries(data.smallGaps.counts[p]).sort((a, b) => a[0] - b[0]).map(([g, c]) => `${g}: ${c}`).join(', '));
}).catch(e => { console.error(e); process.exit(1); });
