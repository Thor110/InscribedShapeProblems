// Checks one submitted result: is it catalogued, does it verify independently,
// and is it new (no verified result for the same problem in results/)?
// Prints a JSON verdict: { status: 'new'|'duplicate'|'invalid', key, reason?, err?, file? }
//
// Usage: node tools/check-result.js result.json [--write]
//        ISSUE_BODY="..." node tools/check-result.js --issue [--write] [--issue-number N]
// With --write, a new result is saved to results/<key>.json.
const fs = require('fs'), path = require('path');
const Registry = require('../pages/registry.js');
const ROOT = path.resolve(__dirname, '..'), args = process.argv.slice(2);
const out = v => { console.log(JSON.stringify(v)); process.exit(0); };

// Issue-form bodies look like "### Result (JSON)\n\n```json\n{...}\n```\n\n### Author\n\nname".
function fromIssue(body) {
  const section = name => { const m = body.match(new RegExp(`###\\s*${name}[^\\n]*\\n+([\\s\\S]*?)(?=\\n###\\s|$)`, 'i')); return m ? m[1].trim() : ''; };
  const raw = section('Result');
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('no JSON object found in the "Result" field');
  const r = JSON.parse(raw.slice(a, b + 1));
  const author = section('Author'); if (author && author !== '_No response_') r.author = author;
  return r;
}

let r;
try {
  r = args.includes('--issue') ? fromIssue(process.env.ISSUE_BODY || '') : JSON.parse(fs.readFileSync(args.find(a => !a.startsWith('--')), 'utf8'));
} catch (e) { out({ status: 'invalid', reason: 'could not read the result: ' + e.message }); }
const why = Registry.catalogueCheck(r);
if (why) out({ status: 'invalid', reason: why });
const key = Registry.key(r), file = path.join(ROOT, 'results', key + '.json');
const v = Registry.verify(r);
if (!v.ok) out({ status: 'invalid', key, reason: v.reason, err: v.err });
if (fs.existsSync(file)) {
  const prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  out({ status: 'duplicate', key, reason: `a verified ${Registry.label(r)} is already recorded (${prev.author || 'repository baseline'})` });
}
const rec = Registry.normalise(r);
rec.date = rec.date || new Date().toISOString().slice(0, 10);
const n = args[args.indexOf('--issue-number') + 1];
if (args.includes('--issue-number') && n) rec.issue = +n;
if (args.includes('--write')) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(rec, null, 1) + '\n'); }
out({ status: 'new', key, err: v.err, size: v.size, file: path.relative(ROOT, file), label: Registry.label(r) });
