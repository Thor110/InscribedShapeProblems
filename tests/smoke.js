#!/usr/bin/env node
// Website smoke test: serves the repository on a local port, loads every page at desktop
// and phone width, and fails if any page throws an error, fails to load a resource,
// overflows sideways, or has an input without an accessible label.
//
//   node tests/smoke.js
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const pages = ['index.html', ...fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html')).sort().map(f => 'pages/' + f)];

server.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}/`, browser = await chromium.launch();
  let failures = 0;
  for (const vp of [{ width: 1280, height: 900, tag: 'desktop' }, { width: 390, height: 844, tag: 'phone' }]) {
    for (const pg of pages) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } }), page = await ctx.newPage();
      const problems = [];
      page.on('pageerror', e => problems.push('error: ' + e.message.slice(0, 100)));
      page.on('console', m => m.type() === 'error' && problems.push('console: ' + m.text().slice(0, 100)));
      page.on('requestfailed', r => problems.push('failed: ' + r.url().replace(base, '')));
      const t0 = Date.now();
      await page.goto(base + pg, { waitUntil: 'load' });
      const ms = Date.now() - t0;
      await page.waitForTimeout(1500);   // let pages finish their start-up work
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        unlabeled: [...document.querySelectorAll('input, select, textarea')].filter(x => x.type !== 'hidden' && !x.labels?.length && !x.getAttribute('aria-label') && !x.title).map(x => x.id || x.name || x.type),
      }));
      if (info.overflow > 0) problems.push(`overflows sideways by ${info.overflow}px`);
      if (info.unlabeled.length) problems.push('unlabeled: ' + info.unlabeled.join(', '));
      failures += problems.length ? 1 : 0;
      console.log(`${problems.length ? 'FAIL' : 'ok  '} ${vp.tag.padEnd(7)} ${pg.padEnd(40)} ${String(ms).padStart(5)} ms  ${problems.join('; ')}`);
      await ctx.close();
    }
  }
  await browser.close(); server.close();
  console.log(failures ? `${failures} page load(s) with problems` : 'All pages load cleanly at desktop and phone width.');
  process.exit(failures ? 1 : 0);
});
