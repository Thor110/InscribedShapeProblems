#!/usr/bin/env node
// Nearest misses: how close do odd numbers come to being perfect?
//
// For every odd n up to LIMIT, computes σ(n) (the sum of all divisors) with a
// segmented sieve and records how far it lands from 2n, the target of a perfect
// number. Like the best undersized and best oversized constructions of a classical
// geometry problem, it keeps two sides:
//   below: deficient odd numbers, σ(n) < 2n, and how close they come from under the mark;
//   above: abundant odd numbers, σ(n) > 2n, and how close they come from over it.
// Output: data/nearest-misses.json and images/nearest-misses.svg.
//
//   node tools/nearest-misses.js            # odd numbers up to 10^10 (a few minutes on 4 cores)
//   node tools/nearest-misses.js 1e8        # a smaller limit
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), fs = require('fs'), path = require('path');

const SEG = 1 << 22;          // odd numbers per segment
const SMALL = 12;             // keep every n with |σ(n) − 2n| ≤ SMALL

// σ(n) for the odd numbers lo, lo + 2, …, lo + 2(len − 1), lo odd, using divisor pairs
// (d, n/d) with d ≤ √n. Only odd d can divide an odd n.
function sieveSegment(lo, len, sig) {
  sig.fill(0, 0, len);
  const hi = lo + 2 * (len - 1);
  for (let d = 1; d * d <= hi; d += 2) {
    // first odd multiple of d that is ≥ max(lo, d²)
    let m = Math.max(lo, d * d); const r = m % d; if (r) m += d - r; if (m % 2 === 0) m += d;
    let q = m / d, i = (m - lo) / 2;
    const d2 = d * d;
    if (m === d2) { sig[i] += d; q += 2; i += d; }     // n = d²: d counted once
    for (; i < len; i += d, q += 2) sig[i] += d + q;   // each step: n += 2d, n/d += 2
  }
}

function scan(task) {
  const { start, end } = task;            // odd n in [start, end)
  const sig = new Float64Array(SEG);
  const out = { below: [], above: [], small: [], decades: {}, odd: 0, abundant: 0 };
  let bestB = Infinity, bestA = Infinity;  // local running records (relative miss)
  for (let lo = start; lo < end; lo += 2 * SEG) {
    const len = Math.min(SEG, Math.ceil((end - lo) / 2));
    sieveSegment(lo, len, sig);
    let dec = Math.floor(Math.log10(lo)), next = 10 ** (dec + 1), D = out.decades[dec] || (out.decades[dec] = { below: null, above: null, abundant: 0, odd: 0 });
    for (let i = 0, n = lo; i < len; i++, n += 2) {
      if (n >= next) { dec++; next *= 10; D = out.decades[dec] || (out.decades[dec] = { below: null, above: null, abundant: 0, odd: 0 }); }
      const g = sig[i] - 2 * n, rel = Math.abs(g) / n;
      D.odd++;
      if (g < 0) {
        if (rel < bestB) { bestB = rel; out.below.push([n, g]); }
        if (!D.below || rel < Math.abs(D.below[1]) / D.below[0]) D.below = [n, g];
      } else if (g > 0) {
        D.abundant++;
        if (rel < bestA) { bestA = rel; out.above.push([n, g]); }
        if (!D.above || rel < Math.abs(D.above[1]) / D.above[0]) D.above = [n, g];
      } else out.small.push([n, 0, 'PERFECT']);
      if (Math.abs(g) <= SMALL && g !== 0) out.small.push([n, g]);
    }
  }
  return out;
}

if (!isMainThread) { parentPort.postMessage(scan(workerData)); return; }

const LIMIT = Number(process.argv[2] || 1e10);
const t0 = Date.now();
// Tasks: chunks of the range, interleaved over the workers so each gets a fair share.
const CHUNK = 2 * SEG * 8, tasks = [];
for (let s = 3; s < LIMIT; s += CHUNK) tasks.push({ start: s, end: Math.min(LIMIT, s + CHUNK) });
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
  // Merge in order: global records are the local records that beat everything before them.
  const below = [], above = [], small = [], decades = {};
  let bB = Infinity, bA = Infinity, odd = 0, abundant = 0;
  for (const r of results) {
    for (const [n, g] of r.below) { const rel = -g / n; if (rel < bB) { bB = rel; below.push({ n, gap: g, rel }); } }
    for (const [n, g] of r.above) { const rel = g / n; if (rel < bA) { bA = rel; above.push({ n, gap: g, rel }); } }
    small.push(...r.small.map(([n, g]) => ({ n, gap: g })));
    for (const [k, D] of Object.entries(r.decades)) {
      const T = decades[k] || (decades[k] = { decade: +k, odd: 0, abundant: 0, below: null, above: null });
      T.odd += D.odd; T.abundant += D.abundant; odd += D.odd; abundant += D.abundant;
      for (const side of ['below', 'above']) if (D[side] && (!T[side] || Math.abs(D[side][1]) / D[side][0] < Math.abs(T[side].gap) / T[side].n)) T[side] = { n: D[side][0], gap: D[side][1], rel: Math.abs(D[side][1]) / D[side][0] };
    }
  }
  const byGap = {}; for (const s of small) byGap[s.gap] = (byGap[s.gap] || 0) + 1;
  const seconds = (Date.now() - t0) / 1000;
  const data = {
    limit: LIMIT, oddNumbers: odd, oddAbundant: abundant, perfect: small.filter(s => s.gap === 0).length,
    records: { below, above }, decades: Object.values(decades).sort((a, b) => a.decade - b.decade),
    smallGaps: { max: SMALL, counts: byGap, numbers: small.sort((a, b) => a.n - b.n) }, seconds,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'nearest-misses.json'), JSON.stringify(data, null, 1) + '\n');
  const Charts = require('../pages/study-charts.js');
  fs.writeFileSync(path.join(__dirname, '..', 'images', 'nearest-misses.svg'), Charts.missesChart(data));

  const f = x => x.toLocaleString('en-US');
  console.log(`Odd numbers up to ${f(LIMIT)}: ${f(odd)} checked, ${f(abundant)} abundant, ${data.perfect} perfect  (${seconds.toFixed(0)} s on ${nw} threads)`);
  console.log('\nRecord nearest misses, from below (σ(n) < 2n):');
  for (const r of below.slice(-8)) console.log(`  n = ${f(r.n).padStart(15)}   σ(n) − 2n = ${String(r.gap).padStart(8)}   σ(n)/n = 2 − ${r.rel.toExponential(3)}`);
  console.log('Record nearest misses, from above (σ(n) > 2n):');
  for (const r of above.slice(-8)) console.log(`  n = ${f(r.n).padStart(15)}   σ(n) − 2n = ${String(r.gap).padStart(8)}   σ(n)/n = 2 + ${r.rel.toExponential(3)}`);
  console.log(`\nOdd n with |σ(n) − 2n| ≤ ${SMALL}, by gap:`, Object.entries(byGap).sort((a, b) => a[0] - b[0]).map(([g, c]) => `${g}: ${c}`).join(', '));
}).catch(e => { console.error(e); process.exit(1); });
