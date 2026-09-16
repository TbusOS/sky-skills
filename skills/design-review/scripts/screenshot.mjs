// Screenshot an HTML file with Playwright so you can visually verify a demo.
// Usage:
//   node skills/design-review/scripts/screenshot.mjs [--theme=dark|light] <url-or-path> [out.png]
// Requires: `npm i playwright` (once) then `npx playwright install chromium`.
// If given a file path, the script serves the repo root at :8787 and fetches it.
//
// --theme flips html[data-theme] after load (glass-design dual-theme audit).
// The context runs with reducedMotion:'reduce' so every page renders its
// deterministic terminal frame (glass.js freeze contract; the four light
// skills' CSS already collapses motion under this media query).
//
// That media query collapses transition DURATIONS. It does not reveal anything.
// Four skills ship a reveal-on-scroll pattern where the element starts at
// opacity:0 and JS adds a class when it scrolls into view — see the scroll pass
// below for why that had to be handled separately.
//
// NOTE: unified from 4 byte-identical copies (one per design skill).

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { revealByScrolling } from './_reveal-scroll.mjs';

const argv = process.argv.slice(2);
const themeArg = (argv.find((a) => a.startsWith('--theme=')) || '').split('=')[1] || null;
const [target = '', outRaw] = argv.filter((a) => !a.startsWith('--'));
if (!target) {
  console.error('usage: node screenshot.mjs [--theme=dark|light] <url-or-path> [out.png]');
  process.exit(2);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

let url = target;
let server;
if (/^file:\/\//.test(target)) {
  // Explicit file:// URL — pass through to Playwright directly.
  url = target;
} else if (/^\//.test(target)) {
  // Absolute local path — use file:// directly so any CWD can call us
  // (matches the way visual-audit.mjs handles absolute paths).
  url = `file://${target}`;
} else if (!/^https?:\/\//.test(target)) {
  // Relative path — serve repo root at :8787 and fetch via HTTP.
  const root = process.cwd();
  server = createServer(async (req, res) => {
    try {
      const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      const s = await stat(p);
      if (s.isDirectory()) throw new Error('no index');
      res.writeHead(200, { 'Content-Type': mime[extname(p)] ?? 'application/octet-stream' });
      res.end(await readFile(p));
    } catch {
      res.writeHead(404).end('not found');
    }
  }).listen(8787);
  url = `http://localhost:8787/${target.replace(/^\/+/, '')}`;
}

const out = outRaw || `shot-${Date.now()}.png`;
const VIEWPORT = { width: 1440, height: 900 };
const browser = await chromium.launch();
const page = await browser
  .newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' })
  .then((c) => c.newPage());
await page.goto(url, { waitUntil: 'networkidle' });
// Wait for fonts before measuring anything. `networkidle` does not cover them:
// a face requested by CSS can still be in flight, and with font-display:swap the
// page renders in the fallback until it lands — so the screenshot silently
// captures the wrong typeface and the wrong line breaks. Caught 2026-09-16 while
// vendoring the web fonts: the same page shot against the Google CDN and against
// local files differed by 3.77% of pixels, and the CDN one was the wrong one.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
if (themeArg) {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), themeArg);
  await page.waitForTimeout(200);
}
// Scroll the whole page once, then come back to the top.
//
// Four of the nine skills document a reveal-on-scroll pattern (motion.md): the
// element starts at opacity:0 and an IntersectionObserver adds .is-visible when
// it comes into view. This script never scrolled, so on a full-page capture
// every such element below the first viewport stayed at opacity 0 and the image
// came out with holes in it.
//
// The damage is worse than a cosmetic one because gate 5 exists to be looked at
// by a person. A blank block does not read as "the capture is wrong" — it reads
// as "this section is missing its figure", and the reader goes off to fix
// something that was never broken. The same image fed to a model produces the
// same confident, wrong finding.
//
// Step is half the viewport rather than a round number of pixels: every band of
// the page then sits fully inside the viewport at some stop instead of
// straddling two, which is what an observer with a non-zero threshold needs.
// The dwell is there because the observer is a callback — it does not run
// during the scroll call. The step ceiling is for a page that grows as you
// scroll; without it this loop would not terminate.
// 实现在 _reveal-scroll.mjs —— 四道检查共用一份，
// 免得改一处漏三处（这个仓自己记过这个坑）。
await revealByScrolling(page, VIEWPORT.height);

await page.screenshot({ path: out, fullPage: true });

// Say so when the capture still has holes. Scrolling handles the documented
// pattern; a project with its own reveal mechanism may not respond to it, and
// the failure mode of this whole gate is an image that looks fine and is not.
// Scoped to elements that call themselves reveal — a dropdown parked at
// opacity 0 is doing its job, and reporting it would train people to skip
// this line.
const holes = await page.evaluate(() =>
  [...document.querySelectorAll('[class*="reveal"]')].filter((el) => {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    return parseFloat(st.opacity) === 0;
  }).length);

await browser.close();
if (server) server.close();
console.log(`✓ saved ${out}  ←  ${url}`);
if (holes) {
  console.log(`  ⚠ ${holes} reveal element(s) still at opacity 0 after the scroll pass —`);
  console.log('    this capture has blank areas where content should be. Judging the');
  console.log('    page from it will produce findings about content that is really there.');
}
