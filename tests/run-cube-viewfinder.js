// Runs the Inscribed Cube Viewfinder's search on every surface and reports
// whether an inscribed cube was verified, or the closest cube's error.
// Usage: node tests/run-cube-viewfinder.js [seeds=2]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const seeds = +(process.argv[2] || 2), b = await chromium.launch(), errs = [];
  const url = 'file://' + path.resolve(__dirname, '../pages/inscribed-cube-viewfinder.html');
  const p0 = await b.newPage(); await p0.goto(url);
  const surfaces = await p0.evaluate(() => Surfaces3D.list.map(s => s[0])); await p0.close();
  await Promise.all(surfaces.map(async sf => {
    const p = await b.newPage(); p.on('pageerror', e => errs.push(sf + ': ' + e.message)); const row = [];
    for (let s = 1; s <= seeds; s++) {
      await p.goto(`${url}?surface=${sf}&seed=${s}`);
      await p.evaluate(() => startScan());
      await p.waitForFunction(() => !search, null, { timeout: 900000, polling: 300 });
      const st = await p.textContent('#status'), t = await p.textContent('#timing');
      row.push(`${/verified —/.test(st) ? 'VERIFIED' : 'none    '} err ${(st.match(/error ([0-9.e+-]+)/) || [])[1]} (${(t.match(/took ([0-9.]+) s/) || [])[1]}s)`);
    }
    console.log(sf.padEnd(10), row.join(' | ')); await p.close();
  }));
  if (errs.length) console.log('PAGE ERRORS:', errs);
  await b.close();
})();
