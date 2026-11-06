// SVG charts for the inscribed-shape study (square shrinkage and rectangle sweep).
// Produces standalone SVG strings that follow the light/dark colour scheme; used
// by tests/run-study.js (static images for the README) and by
// pages/inscribed-study.html (where marks carry data-tip for hover tooltips).
(function (global) {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Validated categorical slots 1–4 (light / dark) and the blue sequential ramp.
  const STYLE = `
  <style>
    .viz{--surface:#fcfcfb;--text1:#0b0b0b;--text2:#52514e;--grid:#e4e3df;--axis:#a3a29c;--none:#efeeea;
         --s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--s4:#eda100;}
    @media (prefers-color-scheme: dark){.viz{--surface:#1a1a19;--text1:#f0efec;--text2:#c3c2b7;--grid:#2c2c2a;--axis:#5d5c57;--none:#262624;
         --s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;}}
    .viz text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;fill:var(--text2);font-size:12px}
    .viz .t1{fill:var(--text1)} .viz .title{font-size:15px;font-weight:600;fill:var(--text1)}
    .viz .grid{stroke:var(--grid);stroke-width:1} .viz .axis{stroke:var(--axis);stroke-width:1}
    __RAMP__
  </style>`;
  // Sequential blue ramp: light → dark on a light surface; reversed on a dark
  // surface so small values always recede toward the background.
  const SEQ = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
  const RAMP_CSS = SEQ.map((c, k) => `.viz .q${k}{fill:${c}}`).join(' ') +
    ` @media (prefers-color-scheme: dark){${SEQ.map((c, k) => `.viz .q${k}{fill:${SEQ[SEQ.length - 1 - k]}}`).join(' ')}}`;
  const styleFor = dark => STYLE.replace('__RAMP__', dark ? SEQ.map((c, k) => `.viz .q${k}{fill:${SEQ[SEQ.length - 1 - k]}}`).join(' ') : RAMP_CSS);

  // Line chart: largest verified square (diagonal / curve width) per roughness level, one line per family.
  function shrinkageChart(families, opts = {}) {
    const W = 760, H = 380, m = { l: 64, r: 150, t: 64, b: 52 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    const maxL = Math.max(...families.flatMap(f => f.levels.map(l => l.level)));
    const top = Math.max(1, Math.ceil(Math.max(...families.flatMap(f => f.levels.map(l => l.largest))) * 4) / 4);
    const x = L => m.l + (L / maxL) * pw, y = v => m.t + (1 - v / top) * ph;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opts.title || 'Largest inscribed square by roughness level')}">${styleFor(opts.dark)}
  <g class="viz"><rect width="${W}" height="${H}" fill="var(--surface)" rx="6"/>
  <text class="title" x="${m.l}" y="26">${esc(opts.title || 'Largest inscribed square as the curves get rougher')}</text>
  <text x="${m.l}" y="45">${esc(opts.subtitle || 'Diagonal of the largest verified square ÷ curve width, at each fractal refinement level')}</text>`;
    for (let v = 0; v <= top + 1e-9; v += 0.25) s += `<line class="grid" x1="${m.l}" x2="${m.l + pw}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v.toFixed(2)}</text>`;
    s += `<line class="axis" x1="${m.l}" x2="${m.l + pw}" y1="${y(0)}" y2="${y(0)}"/>`;
    for (let L = 0; L <= maxL; L += 2) s += `<text x="${x(L)}" y="${y(0) + 18}" text-anchor="middle">${L}</text>`;
    s += `<text x="${m.l + pw / 2}" y="${H - 12}" text-anchor="middle">Roughness level (refinements of the fractal)</text>`;
    s += `<text transform="translate(16 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">Largest square (diagonal ÷ width)</text>`;
    // Direct labels at line ends, nudged apart so they never overlap.
    const ends = families.map((f, i) => { const pts = f.levels.filter(l => l.largest > 0); const last = pts[pts.length - 1]; return { i, f, yy: last ? y(last.largest) : y(0) }; }).sort((a, b) => a.yy - b.yy);
    for (let k = 1; k < ends.length; k++) if (ends[k].yy - ends[k - 1].yy < 16) ends[k].yy = ends[k - 1].yy + 16;
    families.forEach((f, i) => {
      const col = `var(--s${i + 1})`, pts = f.levels.filter(l => l.largest > 0);
      if (pts.length) s += `<polyline fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" points="${pts.map(l => `${x(l.level)},${y(l.largest)}`).join(' ')}"/>`;
      for (const l of f.levels) {
        const tip = l.largest > 0 ? `${f.label}, level ${l.level} (${l.vertices.toLocaleString()} edges): largest square ${l.largest.toFixed(4)} of width; ${l.count} distinct squares verified` : `${f.label}, level ${l.level}: no square verified`;
        s += l.largest > 0
          ? `<circle cx="${x(l.level)}" cy="${y(l.largest)}" r="4" fill="${col}" stroke="var(--surface)" stroke-width="2" data-tip="${esc(tip)}" data-key="sq|${i}|${l.level}" style="cursor:pointer"><title>${esc(tip)}</title></circle>`
          : `<text x="${x(l.level)}" y="${y(0) - 6}" text-anchor="middle" data-tip="${esc(tip)}">✗<title>${esc(tip)}</title></text>`;
      }
    });
    const end = ends.reduce((o, e) => ((o[e.i] = e.yy), o), {});
    families.forEach((f, i) => { s += `<rect x="${m.l + pw + 10}" y="${end[i] - 5}" width="10" height="10" rx="2" fill="var(--s${i + 1})"/><text class="t1" x="${m.l + pw + 26}" y="${end[i] + 4}">${esc(f.label)}</text>`; });
    return s + `</g></svg>`;
  }

  // Heatmap: curves × aspect ratios; colour = largest verified rectangle (diagonal / width), ✗ = none verified.
  function sweepChart(sweep, opts = {}) {
    const rows = sweep.curves, cols = sweep.aspects, cw = 62, chh = 30, m = { l: 210, r: 24, t: 74, b: 70 };
    const W = m.l + cols.length * cw + m.r, H = m.t + rows.length * chh + m.b;
    const vals = rows.flatMap(r => r.cells.map(c => c.largest).filter(v => v > 0)), lo = Math.min(...vals, 1), hi = Math.max(...vals, 0);
    const step = v => Math.max(0, Math.min(SEQ.length - 1, Math.round(((v - lo) / (hi - lo || 1)) * (SEQ.length - 1))));
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opts.title || 'Rectangle sweep')}">${styleFor(opts.dark)}
  <g class="viz"><rect width="${W}" height="${H}" fill="var(--surface)" rx="6"/>
  <text class="title" x="16" y="26">${esc(opts.title || 'Inscribed rectangles across aspect ratios')}</text>
  <text x="16" y="45">${esc(opts.subtitle || 'Colour: diagonal of the largest verified rectangle ÷ curve width. ✗: none found by the search.')}</text>`;
    cols.forEach((a, j) => { s += `<text x="${m.l + j * cw + cw / 2}" y="${m.t - 8}" text-anchor="middle">${a}:1</text>`; });
    rows.forEach((r, i) => {
      const yy = m.t + i * chh;
      s += `<text class="t1" x="${m.l - 10}" y="${yy + chh / 2 + 4}" text-anchor="end">${esc(r.label)}</text>`;
      r.cells.forEach((c, j) => {
        const xx = m.l + j * cw, tip = c.largest > 0 ? `${r.label}, aspect ${c.aspect}:1 — largest rectangle ${c.largest.toFixed(4)} of width; ${c.count} verified` : `${r.label}, aspect ${c.aspect}:1 — none verified`;
        if (c.pending) { s += `<rect x="${xx + 1}" y="${yy + 1}" width="${cw - 2}" height="${chh - 2}" rx="3" fill="var(--none)" opacity="0.5"/>`; return; }
        s += c.largest > 0
          ? `<rect x="${xx + 1}" y="${yy + 1}" width="${cw - 2}" height="${chh - 2}" rx="3" class="q${step(c.largest)}" data-tip="${esc(tip)}" data-key="rc|${i}|${j}" style="cursor:pointer"><title>${esc(tip)}</title></rect>`
          : `<g data-tip="${esc(tip)}"><rect x="${xx + 1}" y="${yy + 1}" width="${cw - 2}" height="${chh - 2}" rx="3" fill="var(--none)"/><text x="${xx + cw / 2}" y="${yy + chh / 2 + 4}" text-anchor="middle">✗</text><title>${esc(tip)}</title></g>`;
      });
    });
    s += `<text x="${m.l + (cols.length * cw) / 2}" y="${m.t + rows.length * chh + 22}" text-anchor="middle">Aspect ratio (long side : short side)</text>`;
    // colour scale
    const ly = H - 26, lw = 180, lx = m.l;
    SEQ.forEach((c, k) => { s += `<rect x="${lx + (k * lw) / SEQ.length}" y="${ly}" width="${lw / SEQ.length + 0.5}" height="10" class="q${k}"/>`; });
    s += `<text x="${lx - 6}" y="${ly + 9}" text-anchor="end">${lo.toFixed(2)}</text><text x="${lx + lw + 6}" y="${ly + 9}">${hi.toFixed(2)}</text>`;
    return s + `</g></svg>`;
  }

  const api = { shrinkageChart, sweepChart };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.StudyCharts = api;
})(typeof window !== 'undefined' ? window : globalThis);
