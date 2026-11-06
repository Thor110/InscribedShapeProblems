// Records the README demonstration GIFs by driving the pages in a headless
// browser. Each demo uses a fixed curve/surface seed and runs the page's own
// auto-search, but the recorder advances the search itself (one step per
// captured frame) so recordings are identical on every run and machine. After
// the search ends a closing sequence (rotation sweep or spin) is added and the
// result is written to images/<name>.gif. Pages without a search (the
// certificate) instead get a scripted sequence of frames.
//
// Usage:  npm install && npm run gifs            (all demos)
//         node tools/record-gifs.js square cube  (only demos whose name matches)
const { chromium } = require('playwright');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const url = rel => 'file://' + path.join(ROOT, rel);

// Closing sequences, run in the page after the search ends. Each returns the
// number of extra frames it wants; `step(i)` updates the page for frame i.
const spin3D = { frames: 48, step: i => { vY += (2 * Math.PI) / 48; draw3D(); } };
const triangleSweep = {
  frames: 40,
  // Turn the jig through 120° with the pivot re-centred at each angle: the
  // triangle stays equilateral (and verified) at every rotation.
  step: i => { $('pivotOnly').checked = true; const a = (jig.ang * 180) / Math.PI + 3; $('rtSl').value = a % 360; onRt(String(a % 360)); },
};

const spinCube = { frames: 32, step: i => { viewYaw += (2 * Math.PI) / 32; draw3D(); } };
// Pages without a search: wait for `ready`, then call `step(i)` once per frame.
const rippleGrow = { frames: 29, step: i => { $('amp').value = (0.005 * i).toFixed(3); drawCurve(true); } };

const DEMOS = [
  { name: 'viewfinder_demo', page: 'pages/inscribed-square-viewfinder.html?curve=random&seed=7', width: 560, running: 'scanning' },
  { name: 'square_demonstration', page: 'pages/skeletal-shapefinder.html?shape=square&curve=random&seed=4&pace=1', width: 560, running: 'search' },
  { name: 'rectangle_demonstration', page: 'pages/skeletal-shapefinder.html?shape=rectangle&p=2&curve=crescent&seed=1&pace=1', width: 560, running: 'search' },
  { name: 'triangle_demonstration', page: 'pages/skeletal-shapefinder.html?shape=triangle&curve=weierstrass&seed=2', width: 560, running: 'search', after: triangleSweep },
  { name: 'cube_demonstration', page: 'pages/skeletal-spacefinder.html?shape=cube&surface=ellipsoid&seed=5&pace=1&rot=35,25,15', width: 520, running: 'search', after: spin3D },
  { name: 'cube_viewfinder_demo', page: 'pages/inscribed-cube-viewfinder.html?surface=egg&seed=3&pace=1', width: 520, running: 'search', after: spinCube },
  { name: 'certificate_demo', page: 'pages/certificate.html', width: 860, ready: "!$('status').textContent.includes('Computing')", frames: rippleGrow },
  { name: 'tetrahedron_demonstration', page: 'pages/skeletal-spacefinder.html?shape=tetrahedron&surface=fractal&seed=2&pace=1&rot=20,40,10', width: 520, running: 'search', after: spin3D },
];

const FRAME_MS = 90;        // capture interval while searching
const MAX_SEARCH_FRAMES = 60;
const HOLD_MS = 2500;       // how long the final frame is held

async function record(browser, demo) {
  const page = await browser.newPage({ viewport: { width: demo.width, height: 1000 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url(demo.page));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  // Timings are meaningless when the recorder steps the search by hand, so hide
  // them; CSS colour fades are disabled so a capture never lands mid-transition.
  await page.addStyleTag({ content: '#timing{display:none !important} *{transition:none !important;animation:none !important}' });
  // Clip from the top of the heading to the bottom of the status line.
  const clip = await page.evaluate(() => {
    const top = document.querySelector('h1').getBoundingClientRect().top;
    const last = document.getElementById('status');
    const b = last.getBoundingClientRect().bottom;
    return { x: 0, y: Math.max(0, top - 8), width: document.documentElement.clientWidth, height: Math.ceil(b - top + 16) };
  });
  // Let any pending paint finish before each capture so recordings are reproducible.
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const shot = async () => { await settle(); return page.screenshot({ clip }); };
  if (demo.frames) {
    await page.waitForFunction(demo.ready, null, { timeout: 120000 });
    const out = [];
    for (let i = 0; i < demo.frames.frames; i++) {
      await page.evaluate(`(${demo.frames.step.toString()})(${i})`);
      out.push({ png: await shot(), delay: 220 });
    }
    out[out.length - 1].delay = HOLD_MS;
    const status = await page.textContent('#status');
    await page.close();
    if (errors.length) throw new Error(`${demo.name}: page errors: ${errors.join('; ')}`);
    return { out, status };
  }
  const frames = [];
  // Start the search, then stop the page's own animation loop and step it by hand.
  await page.evaluate(() => { startScan(); cancelAnimationFrame(scanId); });
  for (let n = 0; await page.evaluate(v => !!window.eval(v), demo.running); n++) {
    if (n > 5000) throw new Error(`${demo.name}: search did not finish`);
    await page.evaluate(() => { scanStep(); cancelAnimationFrame(scanId); });
    frames.push(await shot());
  }
  // Keep at most MAX_SEARCH_FRAMES evenly spaced search frames.
  const search = frames.length > MAX_SEARCH_FRAMES ? Array.from({ length: MAX_SEARCH_FRAMES }, (_, i) => frames[Math.floor((i * frames.length) / MAX_SEARCH_FRAMES)]) : frames;
  const out = search.map(png => ({ png, delay: FRAME_MS }));
  out.push({ png: await shot(), delay: HOLD_MS });
  if (demo.after) {
    for (let i = 0; i < demo.after.frames; i++) {
      await page.evaluate(`(${demo.after.step.toString()})(${i})`);
      out.push({ png: await shot(), delay: FRAME_MS });
    }
    out[out.length - 1].delay = HOLD_MS;
  }
  const status = await page.textContent('#status');
  await page.close();
  if (errors.length) throw new Error(`${demo.name}: page errors: ${errors.join('; ')}`);
  return { out, status };
}

function encode(frames, file) {
  const gif = GIFEncoder();
  for (const { png, delay } of frames) {
    const { width, height, data } = PNG.sync.read(png);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
  }
  gif.finish();
  fs.writeFileSync(file, Buffer.from(gif.bytes()));
}

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const demo of DEMOS.filter(d => !only.length || only.some(o => d.name.includes(o)))) {
    const t = Date.now();
    const { out, status } = await record(browser, demo);
    const file = path.join(ROOT, 'images', demo.name + '.gif');
    encode(out, file);
    console.log(`${demo.name}.gif  ${out.length} frames  ${(fs.statSync(file).size / 1e6).toFixed(2)} MB  ${((Date.now() - t) / 1000).toFixed(0)} s  — ${status.trim()}`);
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
