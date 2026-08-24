// axe-audit.mjs — accessibility conformance gate, powered by axe-core.
//
// WHY THIS IS A SEPARATE SCRIPT, NOT MORE CHECKS IN visual-audit.mjs
// visual-audit is a TASTE evaluator: hollow cards, brand presence, prose walls,
// diagram density. Its thresholds were calibrated against this repo's corpus
// and its findings are argued in known-bugs.md. axe is a CONFORMANCE engine:
// ~100 rules written against WCAG, calibrated against the whole web. Mixing
// them would make it impossible to say which body of rules a finding came from,
// and a change in axe's ruleset would look like a change in our taste.
//
// It also protects the existing gate. visual-audit has a regression baseline
// per skill; bolting 100 new rules into it would invalidate every baseline in
// one commit.
//
// WHY axe AT ALL, GIVEN visual-audit ALREADY CHECKS CONTRAST
// Because our version is a hand-rolled approximation and it demonstrably
// misreads. On atelier's filled accent button it reported 1.11:1 — it sampled
// `background-color`, found a gradient (which computes as transparent), and
// fell through to the page background. The true figure is 2.5:1. The verdict
// was right by luck; the measurement was wrong. axe composites layered and
// gradient backgrounds properly, and brings ~90 rules we have none of.
//
// LICENSE: axe-core is MPL-2.0 — file-level copyleft. Consuming it unmodified
// as a dependency places no obligation on this repo's MIT code. If we ever
// patch a file inside node_modules/axe-core, that file must be published.
//
// Usage:
//   node axe-audit.mjs [--repo=<path>] [--theme=dark|light] [--strict]
//                      [--json] [--tags=wcag2a,wcag2aa] <html> [...]
//
// Exit: 0 clean (or violations found but not --strict) · 1 violations under
//       --strict · 2 bad CLI.
//
// DEFAULT IS WARN-ONLY ON PURPOSE. 55 canonical pages predate this gate; a
// blocking rollout would turn one commit into a 55-page repair job with no way
// to tell a real defect from a rule we have simply never applied. Measure
// first, then promote rule-by-rule via PROMOTED below.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const AXE_PATH = resolve(REPO_ROOT, 'node_modules/axe-core/axe.min.js');

// Rules promoted to BLOCKING. A rule goes here after a measured pass shows the
// corpus satisfies it — but "measured" is only as wide as what the pass actually
// rendered, and the 2026-08-14 pass rendered ONE THEME PER PAGE. glass's light
// theme was never in it, so a promotion here is not a promise that the gate
// cannot fail on inherited debt: on glass pages it does. See known-bugs §6.6.
//
// Measured 2026-08-14 over 74 pages (55 canonical + 9 demos + site + docs),
// each page in its default theme only:
// 1,023 violating elements, of which 1,013 were ONE rule — color-contrast.
// The remaining 10 were three defects, all fixed in the same commit:
//   link-name ×8            index.html — eight demo-preview <a> wrapping an
//                           aria-hidden SVG, so the link had no accessible
//                           name at all. (Seven predated atelier; the eighth
//                           was added by copying the same broken pattern.)
//   aria-prohibited-attr ×1 anthropic feature-deep — aria-label on a plain
//   svg-img-alt ×1          <div>, while the role="img" SVG inside it had no
//                           alternative text. Moving the label fixed both.
// Those three have no known debt behind them. Beyond the 2026-08-14 default-
// theme pass, they were re-measured 2026-08-25 on everything that pass could
// not see: the second theme of the only two dual-theme skills (seven glass
// surfaces in light, seven atelier surfaces in dark) and the five primer pages
// added after it. The only blocking rule that fired anywhere was color-contrast.
//
// color-contrast was WARN at rollout (1,013 elements — one systemic palette
// decision across four skills, not a scatter of mistakes) and was promoted the
// same day, after the SAMPLED debt was paid down. The sample missed glass's
// light theme, which still fails. The four failure modes that produced all
// 1,013 are codified in known-bugs §7.11.
const PROMOTED = new Set([
  'link-name',
  'aria-prohibited-attr',
  'svg-img-alt',
  // Promoted 2026-08-14, same day, after the SAMPLED debt was paid: the 1,013
  // failing elements were cleared skill-by-skill in five commits (sage 394,
  // anthropic +site 270, lectern+ember 267, apple+eclat 49, atelier 27 at
  // birth). The recurring failure modes and their fixes are codified in
  // known-bugs §7.11. What that pass did NOT cover is theme: it rendered one
  // theme per page, so glass's light theme was never measured and still
  // carries 84 blocking elements across its seven surfaces (known-bugs §6.6).
  // This rule therefore CAN fail on inherited debt — it does, on every glass
  // page run in the light theme — until that debt is paid in glass's CSS.
  'color-contrast',
]);

// Rules that do not apply to what this repo produces, each with the reason.
// A rule is only muted when it is testing an assumption our artefacts do not
// make — never because the finding was inconvenient.
const NOT_APPLICABLE = new Map([
  ['region',
    'canonical pages are reference specimens embedded in a review harness, ' +
    'not standalone documents; the top-level landmark belongs to the page ' +
    'that embeds them'],
]);

function parseArgs(argv) {
  const out = { targets: [], tags: null };
  for (const a of argv) {
    if (a.startsWith('--repo=')) out.repo = a.slice(7);
    else if (a.startsWith('--theme=')) out.theme = a.slice(8);
    else if (a.startsWith('--tags=')) out.tags = a.slice(7).split(',').filter(Boolean);
    else if (a === '--strict') out.strict = true;
    else if (a === '--json') out.json = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--')) { out.bad = a; }
    else out.targets.push(a);
  }
  return out;
}

const HELP = `
axe-audit.mjs — accessibility conformance gate (axe-core ${'4.x'})

Usage:
  node skills/design-review/scripts/axe-audit.mjs [flags] <html> [...]

Flags:
  --repo=<path>   webroot for serving relative paths (default: cwd)
  --theme=<t>     dark | light — flips html[data-theme] after load
  --tags=a,b      restrict to axe tag sets (default: wcag2a,wcag2aa,wcag21a,wcag21aa)
  --strict        exit 1 on any violation (default: report only)
  --json          machine-readable output
`;

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.targets.length) { console.log(HELP); process.exit(args.help ? 0 : 2); }
if (args.bad) { console.error(`axe-audit: unknown flag ${args.bad}`); process.exit(2); }
if (!existsSync(AXE_PATH)) {
  console.error(`axe-audit: axe-core not found at ${AXE_PATH} — run \`npm install\` in ${REPO_ROOT}`);
  process.exit(2);
}

const TAGS = args.tags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const root = args.repo ? resolve(args.repo) : process.cwd();

const MIME = {
  '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8',
  '.js': 'application/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
};
const PORT = 8803;

let server = null;
function needsServer(t) { return !/^file:\/\//.test(t) && !/^\//.test(t); }
if (args.targets.some(needsServer)) {
  server = createServer(async (req, res) => {
    try {
      const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      const s = await stat(p);
      if (s.isDirectory()) throw 0;
      res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
      res.end(await readFile(p));
    } catch { res.writeHead(404).end(); }
  }).listen(PORT);
}
function urlFor(t) {
  if (/^file:\/\//.test(t)) return t;
  if (/^\//.test(t)) return `file://${t}`;
  return `http://localhost:${PORT}/${t.replace(/^\/+/, '')}`;
}

const axeSource = await readFile(AXE_PATH, 'utf-8');
const browser = await chromium.launch();
const report = [];
let blocking = 0;

for (const target of args.targets) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',          // same freeze contract the other gates use
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(urlFor(target), { waitUntil: 'networkidle', timeout: 45000 });
    if (args.theme) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), args.theme);
      await page.waitForTimeout(120);
    }
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async (tags) => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations'],
        // Screenshots and colour maths need the real painted page; axe's
        // iframe crawling is pointless here because these pages have none.
        iframes: false,
      });
    }, TAGS);

    const violations = [];
    for (const v of results.violations) {
      const muted = NOT_APPLICABLE.get(v.id);
      const severity = muted ? 'muted' : (PROMOTED.has(v.id) ? 'error' : 'warn');
      if (severity === 'error') blocking += v.nodes.length;
      violations.push({
        rule: v.id,
        impact: v.impact,
        severity,
        mutedBecause: muted ?? null,
        help: v.help,
        count: v.nodes.length,
        nodes: v.nodes.slice(0, 4).map((n) => ({
          target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
          summary: (n.failureSummary || '').split('\n').filter(Boolean).slice(1, 3).join(' · '),
        })),
      });
    }
    report.push({ target, theme: args.theme ?? 'as-authored', violations });
  } catch (err) {
    report.push({ target, error: String(err && err.message ? err.message : err) });
    blocking += 1;
  } finally {
    await ctx.close();
  }
}

await browser.close();
if (server) server.close();

if (args.json) {
  console.log(JSON.stringify({ tags: TAGS, promoted: [...PROMOTED], report }, null, 2));
} else {
  for (const r of report) {
    if (r.error) { console.log(`axe-audit: ERROR  ${r.target}\n  ${r.error}`); continue; }
    const live = r.violations.filter((v) => v.severity !== 'muted');
    const muted = r.violations.filter((v) => v.severity === 'muted');
    const nodes = live.reduce((n, v) => n + v.count, 0);
    const head = live.length
      ? `${live.length} rule(s), ${nodes} element(s)`
      : 'OK';
    console.log(`axe-audit: ${head}  (${r.target}${args.theme ? ` · ${args.theme}` : ''})`);
    for (const v of live) {
      console.log(`  [${v.severity}] ${v.rule} (${v.impact}) ×${v.count} — ${v.help}`);
      for (const n of v.nodes) {
        console.log(`      ${n.target}${n.summary ? `  ·  ${n.summary}` : ''}`);
      }
      if (v.count > v.nodes.length) console.log(`      … and ${v.count - v.nodes.length} more`);
    }
    for (const v of muted) {
      console.log(`  [muted] ${v.rule} ×${v.count} — ${v.mutedBecause}`);
    }
  }
}

if (args.strict && blocking > 0) {
  console.log(`\n✗ axe-audit: ${blocking} blocking element(s) (--strict)`);
  process.exit(1);
}
process.exit(0);
