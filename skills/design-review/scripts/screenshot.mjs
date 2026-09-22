// Screenshot an HTML file with Playwright so you can visually verify a demo.
// Usage:
//   node skills/design-review/scripts/screenshot.mjs [flags] <url-or-path> [out.png]
//     --theme=dark|light   flip html[data-theme] after load
//     --lang=en|zh         render the page in one language (see below)
//     --el=<selector>      capture just that element instead of the whole page
//     --scale=<n>          deviceScaleFactor, default 1 (2 reads better on screen)
// Requires: `npm i playwright` (once) then `npx playwright install chromium`.
// If given a file path, the script serves the repo root at :8787 and fetches it.
//
// --theme flips html[data-theme] after load (glass-design dual-theme audit).
//
// --lang EXISTS BECAUSE THE ZH SIDE OF EVERY PAGE HERE HAD NEVER BEEN CAPTURED.
// Every canonical in this repo ships two languages in one file (.lang-en /
// .lang-zh, switched by html[data-lang]), and the pages pick their side from
// navigator.language on load. Playwright's default locale is en-US, so for as
// long as this gate has existed it has only ever photographed the English half.
// Chinese line-height, punctuation and the CJK font fallback are a different
// render — nothing, this script included, was looking at it.
//
// Two mechanisms, because one is not enough: the browser context is given the
// matching `locale` (so a page that chooses for itself chooses right), AND
// html[data-lang] is set explicitly after load (so a page that hard-codes the
// attribute is overridden too).
//
// AND THEN IT IS VERIFIED, because "the switch did not take" is silent: the
// capture comes out in the other language and looks perfectly fine. If the page
// carries bilingual markup and not one element of the requested side is
// visible, this exits non-zero rather than handing back a plausible image of
// the wrong thing.
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
const flag = (name) => (argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=') || null;
const themeArg = flag('theme');
const langArg = flag('lang');
const elArg = flag('el');
const scaleArg = Number(flag('scale') || 1);
const [target = '', outRaw] = argv.filter((a) => !a.startsWith('--'));
if (!target) {
  console.error('usage: node screenshot.mjs [--theme=t] [--lang=en|zh] [--el=sel] [--scale=n] <url-or-path> [out.png]');
  process.exit(2);
}
if (langArg && !['en', 'zh'].includes(langArg)) {
  console.error(`screenshot: --lang=${langArg} is not one of en|zh`);
  process.exit(2);
}
if (!(scaleArg > 0 && scaleArg <= 4)) {
  console.error(`screenshot: --scale=${scaleArg} out of range (0 < n <= 4)`);
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
// locale is half of what --lang does: a page that reads navigator.language then
// picks the right side by itself, before first paint, so nothing flashes.
const page = await browser
  .newContext({
    viewport: VIEWPORT,
    reducedMotion: 'reduce',
    deviceScaleFactor: scaleArg,
    ...(langArg ? { locale: langArg === 'zh' ? 'zh-CN' : 'en-US' } : {}),
  })
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
let langReport = null;
if (langArg) {
  await page.evaluate((l) => document.documentElement.setAttribute('data-lang', l), langArg);
  await page.waitForTimeout(200);
  // Did it actually take? Count the elements of each side that have boxes.
  // `getClientRects().length` rather than a style read: the switch is done with
  // `display:none` on the other side, and a zero-box element is exactly what
  // "hidden" means here regardless of which rule hid it.
  langReport = await page.evaluate(() => {
    const boxed = (sel) => [...document.querySelectorAll(sel)]
      .filter((e) => e.getClientRects().length > 0).length;
    return {
      attr: document.documentElement.getAttribute('data-lang'),
      en: document.querySelectorAll('.lang-en').length,
      zh: document.querySelectorAll('.lang-zh').length,
      enShown: boxed('.lang-en'),
      zhShown: boxed('.lang-zh'),
    };
  });
}
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

// Element mode. Zero matches is a hard failure: falling back to a full-page
// capture would hand back an image that answers a different question, and the
// filename would still say what you asked for.
let elCount = null;
let hidden = 0;
if (elArg) {
  const els = await page.$$(elArg);
  elCount = els.length;
  if (!elCount) {
    console.error(`✗ --el=${elArg} matched nothing on ${url}`);
    await browser.close(); if (server) server.close();
    process.exit(1);
  }
  // A sticky or fixed element parks itself over the viewport, and an element
  // capture photographs the RECTANGLE, not the element — so whatever is
  // floating above the target lands in the image too. Found by taking a figure
  // out of the anthropic gallery and getting a slice of its sticky <nav>
  // across the top: not an error, not a crash, just a picture with a piece of
  // something else in it, which is the failure mode this whole gate is about.
  //
  // Scroll first. elementHandle.screenshot() scrolls the target into view by
  // itself, but it does that AFTER this check would have run — so the overlap
  // test would be reading rectangles from the wrong scroll position and
  // dutifully report "0 to hide" while the sticky bar still lands in the image.
  // That is the "counted zero because the code never got there" shape, and it
  // looks exactly like "counted zero because there was nothing to count".
  await els[0].scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  // Only the ones that actually overlap the target and are not part of it get
  // hidden — a table's own sticky header belongs in a capture of that table.
  hidden = await els[0].evaluate((target) => {
    const box = target.getBoundingClientRect();
    let n = 0;
    for (const el of document.querySelectorAll('*')) {
      const pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;
      if (el === target || target.contains(el) || el.contains(target)) continue;
      const r = el.getBoundingClientRect();
      if (r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom) continue;
      el.style.visibility = 'hidden';
      n += 1;
    }
    return n;
  });
  await els[0].screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: true });
}

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

// A capture of the wrong language, or of the wrong one of several matches, is
// the same class of defect as a blank block: it does not fail, it misleads.
// So both get said out loud, and the language one can fail the run.
let langBad = false;
if (langReport) {
  const { attr, en, zh, enShown, zhShown } = langReport;
  const bilingual = en + zh > 0;
  const want = langArg === 'zh' ? zhShown : enShown;
  const other = langArg === 'zh' ? enShown : zhShown;
  if (!bilingual) {
    console.log(`  · --lang=${langArg} had nothing to switch: this page carries no .lang-en/.lang-zh markup`);
  } else if (want === 0) {
    console.error(`✗ --lang=${langArg} did not take: html[data-lang]=${attr}, and 0 of `
      + `${langArg === 'zh' ? zh : en} .lang-${langArg} elements are visible `
      + `(${other} of the other side are). The image is in the wrong language.`);
    langBad = true;
  } else if (other > 0) {
    // Found by probing rather than by reasoning: a page that sets the attribute
    // but is missing the `html[data-lang="zh"] .lang-en{display:none}` rule
    // shows BOTH sides, and the first version of this check passed it — it only
    // asked whether the requested side was visible. The capture is then a
    // bilingual-looking page that does not exist, which misleads exactly as
    // much as the wrong language does. Two conditions, not one: the side you
    // asked for appears AND the other one is gone.
    console.error(`✗ --lang=${langArg} only half took: ${want} .lang-${langArg} visible, but `
      + `${other} .lang-${langArg === 'zh' ? 'en' : 'zh'} element(s) are still showing. `
      + `The page is missing its html[data-lang] hide rule, so this capture is a `
      + `both-languages-at-once render of a page nobody sees.`);
    langBad = true;
  } else {
    console.log(`  · lang=${langArg}: ${want} .lang-${langArg} element(s) visible, ${other} of the other side`);
  }
}
console.log(`✓ saved ${out}  ←  ${url}`);
if (elCount !== null) {
  console.log(`  · --el=${elArg} matched ${elCount}; captured the first one`
    + (elCount > 1 ? ` — the other ${elCount - 1} are NOT in this image` : ''));
  if (hidden) {
    console.log(`  · hid ${hidden} sticky/fixed element(s) that overlapped it —`
      + ' they would have been photographed on top of the target');
  }
}
if (holes) {
  console.log(`  ⚠ ${holes} reveal element(s) still at opacity 0 after the scroll pass —`);
  console.log('    this capture has blank areas where content should be. Judging the');
  console.log('    page from it will produce findings about content that is really there.');
}
if (langBad) process.exit(1);
