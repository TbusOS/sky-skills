// pixel-gate.mjs — pixel-level visual regression, powered by pixelmatch.
//
// THE GAP THIS CLOSES
// regression-gate.mjs compares the mechanical evaluator's FINDING COUNTS. That
// catches "this change introduced two new errors". It cannot catch a change
// that introduces no findings at all: a card shifting 40px, a colour drifting
// two shades, a chart losing its axis labels, a font falling back. Every one of
// those renders a different page while the finding count stays identical, so
// the gate reports green on a page nobody would ship.
//
// This script compares the RENDERED PIXELS against a committed baseline. It is
// the only gate in the harness that can fail on something no rule describes.
//
// WHY NOT BackstopJS / lost-pixel / argos
// They are platforms: config files, report servers, a workflow. What this repo
// needs is one comparison against one PNG. pixelmatch is ~150 lines and pngjs
// was already a transitive dependency, so the whole gate is this file.
//
// DETERMINISM IS THE WHOLE GAME. A pixel gate that flickers is worse than no
// gate — it teaches people to re-run until green. Three things are pinned:
//   1. reducedMotion:'reduce' + ?freeze=1, so every animation is at its
//      terminal state on the first frame (the freeze contract each design
//      skill already implements).
//   2. deviceScaleFactor:1 and a fixed viewport, so the raster is stable.
//   3. Web fonts are awaited via document.fonts.ready — a fallback font
//      renders a completely different page and would look like a real diff.
// Even so, antialiasing differs between machines. `threshold` (per-pixel colour
// tolerance) and `--max-diff` (share of pixels allowed to differ) exist for
// that, and baselines are per-machine-family, not universal: regenerate after
// a Chromium bump and commit the result as a deliberate act.
//
// WHICH IS WHY EACH BASELINE RECORDS THE ENVIRONMENT IT WAS TAKEN IN.
// The line above said "regenerate after a Chromium bump" and nothing told you
// a bump had happened. On 2026-09-11 all seven committed baselines reported a
// regression — 1.65% on atelier's dashboard — and it took an afternoon to
// establish that nothing about the page had changed: the baselines were taken
// on Chromium 147 and the machine had moved to 148. Rendering with 147 again
// brought the difference down 4.5×, and the difference vanished entirely when
// the images were downsampled, which is the signature of glyph rasterisation
// rather than of anything moving.
//
// The defect was not the stale baseline. It was that "the design changed" and
// "the browser changed" came out of this script looking identical — one
// percentage, no way to tell which. A number you cannot interpret is not a
// result. So a baseline now carries a sidecar .json naming the Chromium build,
// the viewport, and the web fonts that were actually loaded, and a comparison
// against a different environment says so instead of reporting a regression.
//
// Web fonts are in there for the same reason: rendering this repo's pages with
// the network cut off differs from the baseline by 3.55% — worse than the
// browser bump — because the faces come from a CDN at render time.
//
// Usage:
//   node pixel-gate.mjs --baseline [--theme=t] <html> [...]   record
//   node pixel-gate.mjs           [--theme=t] <html> [...]   compare
//
// Flags:
//   --baseline        write/overwrite the reference PNG instead of comparing
//   --theme=<t>       dark | light
//   --max-diff=<f>    share of pixels allowed to differ (default 0.0005 = 0.05%)
//   --threshold=<f>   pixelmatch per-pixel sensitivity 0-1 (default 0.03; see
//                     the calibration note in parseArgs — 0.06+ is blind)
//   --full-page       capture the whole scroll height (default: viewport only)
//   --out=<dir>       where diff PNGs land (default <repo>/shots)
//   --baseline-dir=<dir>  where baselines live (default skills/design-review/
//                     baselines) — for tests, so they never touch committed ones
//   --json            machine-readable summary
//
// Exit: 0 pass / baseline written · 1 regression or missing baseline · 2 bad CLI
//       3 the baseline was taken in a different environment, so the comparison
//         cannot mean anything either way — re-record, or go back to the build
//         it was taken on. Separate from 1 on purpose: these need opposite
//         responses, and a caller that cannot tell them apart will treat the
//         next real regression as "probably just the browser again".

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const DEFAULT_BASELINE_DIR = resolve(__dirname, '../baselines');

function parseArgs(argv) {
  // CALIBRATED 2026-08-14 against a real change, not guessed. Probe: move
  // --atl-ink-2 from #5C534D to #6A615B (14 steps — barely visible by eye) and
  // re-render atelier's dashboard canonical:
  //     threshold 0.30 / 0.12 / 0.06 →     0 px   (gate is blind)
  //     threshold 0.03               → 1298 px = 0.090%
  //     threshold 0.01               → 1751 px = 0.122%
  // A second probe moving --atl-accent-ink gave 1463 px = 0.102% at 0.03.
  // So 0.12 — pixelmatch's own neighbourhood of the default — cannot see a
  // palette change at all, and the old 0.2% budget would have swallowed both
  // probes even if it had. A gate that cannot fail is dead code.
  //
  // maxDiff calibration, updated 2026-08-14 after the glass-v2 recolour: most
  // pages repeat at exactly 0 px on the same machine, but a page whose 48px
  // backdrop-filter cuts across a steep wallpaper gradient (atelier's signin,
  // dark panel edge) shows up to 608 px = 0.042% of run-to-run render noise
  // with NO change to the page. The real-change floor measured by the probes
  // is 0.090%. 0.05% sits between the two: above every observed noise level,
  // 1.8× under the smallest real change we ever measured.
  const out = { targets: [], maxDiff: 0.0005, threshold: 0.03 };
  for (const a of argv) {
    if (a === '--baseline') out.baseline = true;
    else if (a === '--full-page') out.fullPage = true;
    else if (a === '--json') out.json = true;
    else if (a.startsWith('--theme=')) out.theme = a.slice(8);
    else if (a.startsWith('--max-diff=')) out.maxDiff = parseFloat(a.slice(11));
    else if (a.startsWith('--threshold=')) out.threshold = parseFloat(a.slice(12));
    else if (a.startsWith('--out=')) out.out = a.slice(6);
    // So a test can exercise recording and comparing without writing into the
    // committed baselines. A self-test that has to clean up after itself is one
    // crash away from overwriting a real baseline.
    else if (a.startsWith('--baseline-dir=')) out.baselineDir = a.slice(15);
    else if (a.startsWith('--repo=')) out.repo = a.slice(7);
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--')) out.bad = a;
    else out.targets.push(a);
  }
  return out;
}

const HELP = `
pixel-gate.mjs — pixel visual regression (pixelmatch)

  node skills/design-review/scripts/pixel-gate.mjs --baseline <html> [...]
  node skills/design-review/scripts/pixel-gate.mjs            <html> [...]

  --theme=dark|light  --max-diff=0.0005  --threshold=0.03
  --full-page  --out=<dir>  --repo=<path>  --json  --baseline-dir=<dir>
`;

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.targets.length) { console.log(HELP); process.exit(args.help ? 0 : 2); }
if (args.bad) { console.error(`pixel-gate: unknown flag ${args.bad}`); process.exit(2); }

const root = args.repo ? resolve(args.repo) : process.cwd();
const outDir = args.out ? resolve(args.out) : resolve(REPO_ROOT, 'shots');
const BASELINE_DIR = args.baselineDir ? resolve(args.baselineDir) : DEFAULT_BASELINE_DIR;

// Baseline key: path relative to the repo, slashes flattened, plus the theme.
// Keeping the full path means two skills can both have a `dashboard` page.
function keyFor(target, theme) {
  const rel = resolve(root, target).replace(REPO_ROOT + '/', '');
  return `${rel.replace(/[\/\\]/g, '__').replace(/\.html$/, '')}--${theme || 'as-authored'}.png`;
}

// What has to be the same for two renders of one page to be comparable.
//
// Only things that change the raster go in here. The Chromium build because it
// rasterises glyphs; the viewport and scale factor because they set the grid;
// the web fonts that actually arrived because a page rendered in the fallback
// face is a different page (3.55% different, measured — more than a browser
// bump costs). The date is carried for the reader and never compared.
//
// The font list is families-plus-count rather than the raw FontFace set: the
// set also holds every face the stylesheet declares and never used, and its
// size moves with the stylesheet instead of with what was painted. Measured
// stable across three consecutive renders of the same page before being
// trusted — a field that flickers here would report "the environment changed"
// at random, which is the one thing this must not do.
async function envOf(page) {
  const fonts = await page.evaluate(() => {
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded');
    const families = [...new Set(loaded.map((f) => f.family))].sort();
    return families.length ? `${families.join(', ')} (${loaded.length})` : 'none';
  });
  return {
    chromium: browser.version(),
    viewport: '1440x1000@1',
    fonts,
    recorded: new Date().toISOString().slice(0, 10),
  };
}

const ENV_KEYS = ['chromium', 'viewport', 'fonts'];   // `recorded` is prose, not a condition
const envDiff = (was, now) => ENV_KEYS
  .filter((k) => (was[k] ?? '(not recorded)') !== now[k])
  .map((k) => `${k}: baseline ${was[k] ?? '(not recorded)'} · now ${now[k]}`);

const sidecarFor = (pngPath) => pngPath.replace(/\.png$/, '.json');

const MIME = {
  '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8',
  '.js': 'application/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
};
const PORT = 8804;
let server = null;
if (args.targets.some((t) => !/^file:\/\//.test(t) && !/^\//.test(t))) {
  server = createServer(async (req, res) => {
    try {
      const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      const s = await stat(p); if (s.isDirectory()) throw 0;
      res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
      res.end(await readFile(p));
    } catch { res.writeHead(404).end(); }
  }).listen(PORT);
}
function urlFor(t) {
  const q = 'freeze=1';
  if (/^file:\/\//.test(t)) return `${t}?${q}`;
  if (/^\//.test(t)) return `file://${t}?${q}`;
  return `http://localhost:${PORT}/${t.replace(/^\/+/, '')}?${q}`;
}

await mkdir(BASELINE_DIR, { recursive: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];
let failed = 0;        // real regressions
let envFailed = 0;     // comparisons that cannot mean anything — a different exit code

for (const target of args.targets) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const key = keyFor(target, args.theme);
  const basePath = resolve(BASELINE_DIR, key);
  try {
    await page.goto(urlFor(target), { waitUntil: 'networkidle', timeout: 45000 });
    if (args.theme) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), args.theme);
    }
    // A fallback font renders a different page and reads as a real regression.
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(160);
    const shot = await page.screenshot({ fullPage: !!args.fullPage });

    const env = await envOf(page);

    if (args.baseline) {
      await writeFile(basePath, shot);
      // Written in the same statement as the PNG so the two cannot drift apart.
      await writeFile(sidecarFor(basePath), `${JSON.stringify(env, null, 2)}\n`);
      results.push({ target, theme: args.theme ?? 'as-authored', action: 'baseline', file: key, env });
      continue;
    }

    if (!existsSync(basePath)) {
      results.push({ target, theme: args.theme ?? 'as-authored', status: 'no-baseline', file: key });
      failed++;
      continue;
    }

    // Before any pixels are counted. A baseline from another environment does
    // not produce a wrong number — it produces a number that answers a
    // different question, which is worse, because it still looks like an answer.
    let recordedEnv = null;
    if (existsSync(sidecarFor(basePath))) {
      try { recordedEnv = JSON.parse(await readFile(sidecarFor(basePath), 'utf-8')); } catch { /* treated as missing */ }
    }
    const drift = recordedEnv ? envDiff(recordedEnv, env) : null;

    const a = PNG.sync.read(await readFile(basePath));
    const b = PNG.sync.read(shot);
    if (a.width !== b.width || a.height !== b.height) {
      results.push({
        target, theme: args.theme ?? 'as-authored', status: 'size-changed',
        baseline: `${a.width}×${a.height}`, current: `${b.width}×${b.height}`,
      });
      failed++;
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: args.threshold,
      includeAA: false,           // antialiasing differences are machine noise
      alpha: 0.25,
    });
    const ratio = changed / (a.width * a.height);
    const withinBudget = ratio <= args.maxDiff;

    // The comparison still runs when the environment moved, and the number is
    // still printed — sometimes it is 0 and that is worth knowing. It is just
    // never presented as a verdict, because it is not one.
    let status = withinBudget ? 'pass' : 'regression';
    if (!recordedEnv) status = 'no-env';
    else if (drift.length) status = 'env-changed';

    let diffFile = null;
    if (status === 'regression' || (status !== 'pass' && !withinBudget)) {
      diffFile = resolve(outDir, `pixeldiff-${key}`);
      await writeFile(diffFile, PNG.sync.write(diff));
    }
    if (status === 'regression') failed++;
    else if (status !== 'pass') envFailed++;

    results.push({
      target, theme: args.theme ?? 'as-authored', status,
      changed, ratio: +(ratio * 100).toFixed(4), maxDiff: +(args.maxDiff * 100).toFixed(4),
      diffFile, drift: drift ?? undefined, env, recordedEnv: recordedEnv ?? undefined,
    });
  } catch (err) {
    results.push({ target, status: 'error', error: String(err && err.message ? err.message : err) });
    failed++;
  } finally {
    await ctx.close();
  }
}

await browser.close();
if (server) server.close();

if (args.json) {
  console.log(JSON.stringify({ maxDiff: args.maxDiff, threshold: args.threshold, results }, null, 2));
} else {
  for (const r of results) {
    if (r.action === 'baseline') {
      console.log(`pixel-gate: baseline written  ${r.file}`);
      console.log(`  taken on ${r.env.chromium} · ${r.env.viewport} · fonts ${r.env.fonts}`);
      continue;
    }
    if (r.status === 'error') { console.log(`pixel-gate: ERROR  ${r.target}\n  ${r.error}`); continue; }
    if (r.status === 'no-baseline') {
      console.log(`pixel-gate: NO BASELINE  ${r.target}\n  expected ${r.file} — run with --baseline first`);
      continue;
    }
    if (r.status === 'size-changed') {
      console.log(`pixel-gate: SIZE CHANGED  ${r.target}\n  baseline ${r.baseline} → current ${r.current} (page height moved; re-baseline if intended)`);
      continue;
    }
    // Two failures that need opposite responses must not print the same word.
    // "REGRESSION" tells you to look at the page; the ones below tell you the
    // comparison never had standing, and looking at the page would waste the
    // afternoon it wasted on 2026-09-11.
    if (r.status === 'no-env') {
      console.log(`pixel-gate: BASELINE PREDATES ENVIRONMENT RECORDING  ${r.target}`);
      console.log(`  ${r.changed} px differ (${r.ratio}%) — but this baseline does not say what it was`);
      console.log('  taken in, so that number cannot be read as a regression or as a pass.');
      console.log(`  here and now: ${r.env.chromium} · ${r.env.viewport} · fonts ${r.env.fonts}`);
      console.log('  re-record it (--pixel-baseline) and the next comparison will mean something.');
      if (r.diffFile) console.log(`  diff → ${r.diffFile}`);
      continue;
    }
    if (r.status === 'env-changed') {
      console.log(`pixel-gate: ENVIRONMENT CHANGED, NOT THE PAGE  ${r.target}`);
      for (const d of r.drift) console.log(`  ${d}`);
      console.log(`  ${r.changed} px differ (${r.ratio}%) — reported for context, not as a verdict.`);
      console.log('  Either go back to the build the baseline was taken on, or re-record it');
      console.log('  (--pixel-baseline) as a deliberate act. Do not read this as a regression.');
      if (r.diffFile) console.log(`  diff → ${r.diffFile}`);
      continue;
    }
    const mark = r.status === 'pass' ? 'OK' : 'REGRESSION';
    console.log(`pixel-gate: ${mark}  ${r.changed} px changed (${r.ratio}% · budget ${r.maxDiff}%)  ${r.target}${args.theme ? ` · ${args.theme}` : ''}`);
    if (r.diffFile) console.log(`  diff → ${r.diffFile}`);
  }
}

// 1 and 3 are different questions, so they are different exit codes. A real
// regression outranks an unusable comparison: if both are present the run has
// something to look at, and that is what the caller should hear first.
if (args.baseline) process.exit(0);
if (failed > 0) process.exit(1);
process.exit(envFailed > 0 ? 3 : 0);
