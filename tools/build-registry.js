// Rebuilds data/registry.json from results/**/*.json, re-verifying every entry.
// Usage: node tools/build-registry.js          (write data/registry.json)
//        node tools/build-registry.js --check  (exit 1 if any entry fails or the file is out of date)
const fs = require('fs'), path = require('path');
const Registry = require('../pages/registry.js');
const ROOT = path.resolve(__dirname, '..'), DIR = path.join(ROOT, 'results'), OUT = path.join(ROOT, 'data/registry.json');
const files = [];
(function walk(d) { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : f.endsWith('.json') && files.push(p); } })(DIR);
const entries = {}, problems = [];
for (const f of files) {
  const rel = path.relative(ROOT, f);
  let r; try { r = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { problems.push(`${rel}: not valid JSON`); continue; }
  const v = Registry.verify(r);
  if (!v.ok) { problems.push(`${rel}: ${v.reason}`); continue; }
  const key = Registry.key(r);
  if (rel !== path.join('results', key + '.json')) { problems.push(`${rel}: should be results/${key}.json`); continue; }
  entries[key] = { label: Registry.label(r), author: r.author || 'repository baseline', date: r.date || null, issue: r.issue || null, size: +v.size.toFixed(6), err: +v.err.toExponential(2) };
}
const counts = {};
for (const k of Object.keys(entries)) { const g = k.split('/').slice(0, 2).join('/'); counts[g] = (counts[g] || 0) + 1; }
const json = JSON.stringify({ count: Object.keys(entries).length, counts, entries }, null, 1) + '\n';
if (problems.length) { console.error('Problems:\n' + problems.map(p => '  ' + p).join('\n')); }
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== json) console.error('data/registry.json is out of date; run node tools/build-registry.js');
  process.exit(problems.length || cur !== json ? 1 : 0);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, json);
console.log(`Registry: ${Object.keys(entries).length} verified results` + (problems.length ? ` (${problems.length} files rejected)` : ''));
process.exit(problems.length ? 1 : 0);
