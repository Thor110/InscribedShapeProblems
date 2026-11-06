// Runs the Skeletal Shape Finder's auto-search on every curve type and reports
// whether a verified shape was found and its independently measured error.
// Usage: node tests/run-2d.js [seeds=3]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const seeds = +(process.argv[2] || 3);
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.resolve(__dirname, '../pages/skeletal-shapefinder.html');
  await p.goto(url);
  const curves = await p.evaluate(() => Shapes2D.list.map(x => x[0]));
  for (const ins of ['square', 'triangle']) {
    console.log(`\n== Inscribed ${ins}`);
    for (const c of curves) {
      const row = [];
      for (let s = 1; s <= seeds; s++) {
        await p.goto(`${url}?shape=${ins}&curve=${c}&seed=${s}`);
        const t0 = Date.now();
        await p.evaluate(() => startScan());
        await p.waitForFunction(() => !search, null, { timeout: 300000, polling: 200 });
        const r = await p.evaluate(() => ({ ok: !!locked, err: locked ? locked.v.err : null, st: document.getElementById('status').textContent }));
        row.push(r.ok ? `ok ${r.err.toExponential(1)} (${((Date.now() - t0) / 1000).toFixed(1)}s)` : `NONE (${r.st.slice(0, 60)})`);
      }
      console.log(c.padEnd(12), row.join(' | '));
    }
  }
  if (errs.length) console.log('PAGE ERRORS:', errs);
  await b.close();
})();
