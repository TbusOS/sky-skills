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
//   --json            machine-readable summary
//
// Exit: 0 pass / baseline written · 1 regression or missing baseline · 2 bad CLI

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
const BASELINE_DIR = resolve(__dirname, '../baselines');

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
  --full-page  --out=<dir>  --repo=<path>  --json
`;

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.targets.length) { console.log(HELP); process.exit(args.help ? 0 : 2); }
if (args.bad) { console.error(`pixel-gate: unknown flag ${args.bad}`); process.exit(2); }

const root = args.repo ? resolve(args.repo) : process.cwd();
const outDir = args.out ? resolve(args.out) : resolve(REPO_ROOT, 'shots');

// Baseline key: path relative to the repo, slashes flattened, plus the theme.
// Keeping the full path means two skills can both have a `dashboard` page.
function keyFor(target, theme) {
  const rel = resolve(root, target).replace(REPO_ROOT + '/', '');
  return `${rel.replace(/[\/\\]/g, '__').replace(/\.html$/, '')}--${theme || 'as-authored'}.png`;
}

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
let failed = 0;

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

    if (args.baseline) {
      await writeFile(basePath, shot);
      results.push({ target, theme: args.theme ?? 'as-authored', action: 'baseline', file: key });
      continue;
    }

    if (!existsSync(basePath)) {
      results.push({ target, theme: args.theme ?? 'as-authored', status: 'no-baseline', file: key });
      failed++;
      continue;
    }

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
    const pass = ratio <= args.maxDiff;
    let diffFile = null;
    if (!pass) {
      diffFile = resolve(outDir, `pixeldiff-${key}`);
      await writeFile(diffFile, PNG.sync.write(diff));
      failed++;
    }
    results.push({
      target, theme: args.theme ?? 'as-authored',
      status: pass ? 'pass' : 'regression',
      changed, ratio: +(ratio * 100).toFixed(4), maxDiff: +(args.maxDiff * 100).toFixed(4),
      diffFile,
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
    if (r.action === 'baseline') { console.log(`pixel-gate: baseline written  ${r.file}`); continue; }
    if (r.status === 'error') { console.log(`pixel-gate: ERROR  ${r.target}\n  ${r.error}`); continue; }
    if (r.status === 'no-baseline') {
      console.log(`pixel-gate: NO BASELINE  ${r.target}\n  expected ${r.file} — run with --baseline first`);
      continue;
    }
    if (r.status === 'size-changed') {
      console.log(`pixel-gate: SIZE CHANGED  ${r.target}\n  baseline ${r.baseline} → current ${r.current} (page height moved; re-baseline if intended)`);
      continue;
    }
    const mark = r.status === 'pass' ? 'OK' : 'REGRESSION';
    console.log(`pixel-gate: ${mark}  ${r.changed} px changed (${r.ratio}% · budget ${r.maxDiff}%)  ${r.target}${args.theme ? ` · ${args.theme}` : ''}`);
    if (r.diffFile) console.log(`  diff → ${r.diffFile}`);
  }
}

process.exit(failed > 0 && !args.baseline ? 1 : 0);
