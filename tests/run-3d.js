// Runs the Skeletal Space Finder's auto-search on every surface for each shape
// and reports the verified error (or the best candidate's error if none verified).
// Usage: node tests/run-3d.js [seeds=2] [shapes=cube,tetrahedron,octahedron] [surfaces=all]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const seeds = +(process.argv[2] || 2), shapes = (process.argv[3] || 'cube,tetrahedron,octahedron').split(',');
  const b = await chromium.launch(); const url = 'file://' + path.resolve(__dirname, '../pages/skeletal-spacefinder.html');
  const p0 = await b.newPage(); await p0.goto(url);
  let surfaces = await p0.evaluate(() => SURFACES.map(s => s[0])); await p0.close();
  if (process.argv[4]) surfaces = surfaces.filter(s => process.argv[4].split(',').includes(s));
  const errs = [];
  for (const sh of shapes) {
    console.log(`\n== Inscribed ${sh}`);
    await Promise.all(surfaces.map(async sf => {
      const p = await b.newPage(); p.on('pageerror', e => errs.push(sf + ': ' + e.message)); const row = [];
      for (let s = 1; s <= seeds; s++) {
        await p.goto(`${url}?shape=${sh}&surface=${sf}&seed=${s}`);
        const t0 = Date.now(); await p.evaluate(() => startScan());
        await p.waitForFunction(() => !search, null, { timeout: 900000, polling: 500 });
        const r = await p.evaluate(() => ({ ok: !!locked, st: document.getElementById('status').textContent }));
        const e = (r.st.match(/error ([0-9.e+-]+)/) || [])[1];
        row.push(`${r.ok ? 'VERIFIED' : 'none    '} err ${e} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
      console.log(sf.padEnd(10), row.join(' | ')); await p.close();
    }));
  }
  if (errs.length) console.log('PAGE ERRORS:', errs);
  await b.close();
})();
