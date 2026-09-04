// interaction-audit.mjs — the gate that clicks.
//
// Every other gate judges one frozen frame. verify.py reads the source,
// visual-audit measures the first paint, axe-audit runs on the DOM as loaded,
// screenshot saves that same first paint. So a page whose tabs do nothing,
// whose accordion opens onto unreadable text, or whose language toggle throws,
// passes all four and ships.
//
// That is not hypothetical. known-bugs 1.40 is this gap showing through from
// the other side: a closed <details> holds text the geometry check counts as
// visible, so four FAQ canonicals each report 7-16 phantom overlaps. The check
// was taught to skip them. The real answer is to open the accordion and measure
// the state a reader actually sees.
//
// What this does, per interactive element:
//   1. records a fingerprint of the page, clicks, records it again
//   2. fails on a console error or unhandled rejection raised by the click
//   3. warns when the fingerprint did not move at all — a control that does
//      nothing is either dead or decorative, and both are worth knowing
//   4. re-runs axe on the new state and reports only violations that were NOT
//      present before the click, so the pre-existing debt of the loaded page
//      stays the other gate's problem
//   5. re-runs the overlap geometry on the newly revealed content
//
// Isolation: the page is reloaded between elements. Clicking accumulates state,
// and a report that depends on the order elements happened to be found in is
// not a report. The cost is one navigation per element, which is why identical
// controls are grouped and only the first few of each shape are exercised.
//
// Usage:
//   node skills/design-review/scripts/interaction-audit.mjs [flags] <html> [...]
//
// Exit code 0 = pass, 1 = errors found under --strict, 2 = bad CLI.
// Requires: playwright, axe-core (both already in this repo's package.json).

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..');
const AXE_PATH = resolve(REPO_ROOT, 'node_modules/axe-core/axe.min.js');

// Controls worth exercising. Anchors are deliberately absent unless they are
// in-page: following a link tests the next page, not this one.
const INTERACTIVE = [
  'button:not([disabled])',
  'summary',
  '[role="tab"]',
  '[role="switch"]',
  '[role="button"]',
  '[aria-expanded]',
  '[aria-controls]',
  'th[aria-sort]',
  'input[type="checkbox"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'select:not([disabled])',
  'a[href^="#"]',
].join(', ');

// axe rules that block here are the same four axe-audit promotes. A rule that
// only appears after a click is worse than one visible on load, not better:
// nobody is looking at that state in review.
const PROMOTED = new Set([
  'link-name',
  'aria-prohibited-attr',
  'svg-img-alt',
  'color-contrast',
]);

function parseArgs(argv) {
  const out = { targets: [], perShape: 2, max: 60 };
  for (const a of argv) {
    if (a.startsWith('--repo=')) out.repo = a.slice(7);
    else if (a.startsWith('--theme=')) out.theme = a.slice(8);
    else if (a.startsWith('--per-shape=')) out.perShape = Number(a.slice(12));
    else if (a.startsWith('--max=')) out.max = Number(a.slice(6));
    else if (a === '--strict') out.strict = true;
    else if (a === '--json') out.json = true;
    else if (a === '--no-axe') out.noAxe = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--')) out.bad = a;
    else out.targets.push(a);
  }
  return out;
}

const HELP = `
interaction-audit.mjs — the gate that clicks

Every other gate judges the first painted frame. This one operates the page and
judges the states a reader reaches by clicking.

Usage:
  node skills/design-review/scripts/interaction-audit.mjs [flags] <html> [...]

Flags:
  --repo=<path>      webroot for serving relative paths (default: cwd)
  --theme=<t>        dark | light — flips html[data-theme] after load
  --per-shape=<n>    controls to exercise per identical shape (default 2)
  --max=<n>          hard cap on controls per page (default 60)
  --no-axe           skip the post-click accessibility re-run (faster)
  --strict           exit 1 on any error (default: report only)
  --json             machine-readable output

What it decides:
  error   a click raised a console error or an unhandled rejection
  error   a click introduced an axe violation in one of the promoted rules
  warn    a click changed nothing measurable — dead or decorative control
  warn    content revealed by a click overlaps other content
`;

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.targets.length) { console.log(HELP); process.exit(args.help ? 0 : 2); }
if (args.bad) { console.error(`interaction-audit: unknown flag ${args.bad}`); process.exit(2); }
if (!Number.isFinite(args.perShape) || args.perShape < 1) {
  console.error('interaction-audit: --per-shape must be a positive integer'); process.exit(2);
}
if (!Number.isFinite(args.max) || args.max < 1) {
  console.error('interaction-audit: --max must be a positive integer'); process.exit(2);
}
const useAxe = !args.noAxe && existsSync(AXE_PATH);
if (!args.noAxe && !useAxe) {
  console.error(`interaction-audit: axe-core not found at ${AXE_PATH} — run \`npm install\` in ${REPO_ROOT}, or pass --no-axe`);
  process.exit(2);
}

const root = args.repo ? resolve(args.repo) : process.cwd();
const MIME = {
  '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8',
  '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
};
const PORT = 8804;

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

const axeSource = useAxe ? await readFile(AXE_PATH, 'utf-8') : null;

// ── in-page helpers ───────────────────────────────────────────────────────────
// Real functions, not source strings: page.evaluate('() => …') evaluates the
// string as an expression, so it yields a function object that serialises to
// undefined rather than calling it. These are serialised by Playwright, so they
// must not close over anything in this module.

// Visibility, done by the engine rather than by hand. A closed <details> does
// not set display:none on its contents — the element keeps a real 640x122 box
// with visibility:visible, which is why the geometry checks in this repo count
// hidden answers as painted text (known-bugs 1.40). checkVisibility() answers
// correctly for that and for content-visibility clipping generally.
//
// It is injected with addInitScript rather than shared as a module function:
// page.evaluate serialises the function it is given and nothing else, so a
// module-scope helper is simply undefined once it lands in the page.
const VIS_INIT = `window.__iaVis = function (el) {
  if (typeof el.checkVisibility === 'function') {
    if (!el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
  } else {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) <= 0.01) return false;
    const d = el.closest('details:not([open])');
    if (d && !el.closest('summary')) return false;
  }
  const r = el.getBoundingClientRect();
  return r.width >= 1 && r.height >= 1;
};`;

function FINGERPRINT() {
  const vis = window.__iaVis;
  const nodes = [...document.querySelectorAll('body *')].filter(vis);
  let text = 0;
  // Order matters. Counting characters alone cannot see a sorted table: the
  // same rows in a new order have the same length and the same node count.
  // So the leaf text is also hashed in document order.
  let order = 5381;
  for (const n of nodes) {
    if (n.children.length) continue;
    const t = n.textContent.trim();
    if (!t) continue;
    text += t.length;
    for (let i = 0; i < t.length; i++) order = ((order * 33) ^ t.charCodeAt(i)) >>> 0;
  }
  return {
    visible: nodes.length,
    textLen: text,
    order,
    expanded: [...document.querySelectorAll('[aria-expanded]')].map((e) => e.getAttribute('aria-expanded')).join(','),
    selected: [...document.querySelectorAll('[aria-selected]')].map((e) => e.getAttribute('aria-selected')).join(','),
    sort: [...document.querySelectorAll('[aria-sort]')].map((e) => e.getAttribute('aria-sort')).join(','),
    open: [...document.querySelectorAll('details')].map((e) => (e.open ? '1' : '0')).join(''),
    theme: document.documentElement.getAttribute('data-theme') || '',
    lang: document.documentElement.getAttribute('data-lang') || document.documentElement.lang || '',
    scrollH: document.documentElement.scrollHeight,
    scrollY: Math.round(window.scrollY),
  };
}

// Rectangles of leaf text nodes, for the overlap pass on revealed content.
function TEXT_BOXES() {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t = el.textContent.trim();
    if (!t) continue;
    if (!window.__iaVis(el)) continue;
    if (el.closest('[data-allow-overlap]')) continue;
    // One box per line, not one per element. getBoundingClientRect on an inline
    // element that wraps returns the union of its lines, which starts at the
    // left edge of the first line and ends at the right edge of the last — a
    // rectangle covering text that belongs to its neighbours. Two adjacent
    // wrapped links then report a 100% overlap while nothing overlaps on
    // screen. getClientRects returns the real per-line boxes.
    for (const r of el.getClientRects()) {
      if (r.width < 4 || r.height < 4) continue;
      out.push({ x: r.x, y: r.y, w: r.width, h: r.height, t: t.slice(0, 40),
                 tag: el.tagName.toLowerCase() });
    }
  }
  return out;
}

function overlaps(boxes) {
  const hits = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.t === b.t && a.tag === b.tag) continue;   // two lines of one element
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      // A line box is taller than the glyphs inside it, and how much taller
      // depends on the font's ascent and descent. Noto Sans SC runs tall enough
      // that a 40px heading with 46px line-height reports a 56px box, so a
      // heading and the paragraph under it touch by three pixels with nothing
      // overlapping on screen. Two lines of text that genuinely collide do so
      // by much more than a third of a line, so a floor in pixels removes the
      // whole class without hiding a real one.
      if (ox < 6 || oy < 6) continue;
      const area = ox * oy;
      const smaller = Math.min(a.w * a.h, b.w * b.h);
      if (area / smaller < 0.12) continue;           // brushing counts as clear
      hits.push({ a: a.t, b: b.t, pct: Math.round((area / smaller) * 100) });
    }
  }
  return hits;
}

async function axeViolations(page) {
  if (!useAxe) return [];
  // Inject once per page. addScriptTag on every call re-registers axe-core in
  // the same document, and the second registration does not necessarily see
  // the same rule set as the first.
  const already = await page.evaluate(() => typeof window.axe !== 'undefined');
  if (!already) await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations'],
      iframes: false,
    });
  });
  const flat = [];
  for (const v of res.violations) {
    for (const n of v.nodes) {
      flat.push({
        rule: v.id,
        impact: v.impact,
        help: v.help,
        target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
        summary: (n.failureSummary || '').split('\n').filter(Boolean).slice(1, 2).join(''),
      });
    }
  }
  return flat;
}

const keyOf = (v) => `${v.rule}::${v.target}`;

// ── main ──────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const report = [];
let blocking = 0;

for (const target of args.targets) {
  const url = urlFor(target);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript(VIS_INIT);
  const entry = { target, theme: args.theme ?? 'as-authored', controls: [], skipped: 0 };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    if (args.theme) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), args.theme);
      await page.waitForTimeout(120);
    }

    // Enumerate once, then address each control by index on a fresh load so the
    // report does not depend on the order clicks happened to land in.
    const found = await page.evaluate((sel) => {
      return [...document.querySelectorAll(sel)].filter(window.__iaVis).map((el, i) => {
        el.setAttribute('data-ia-idx', String(i));
        const cls = [...el.classList].slice(0, 3).join('.');
        // A control already in the active state is meant to do nothing when
        // clicked — the selected tab, the current page's nav item, the language
        // you are already reading. ARIA states it outright; the class-name
        // check is a convention and is treated as a hint, not proof.
        // A page may declare a control inert on purpose, the same way
        // data-allow-overlap declares a deliberate overlap. The attribute must
        // carry a reason, so the declaration is reviewable rather than a mute
        // button: data-inert-by-design="figures cannot be re-sourced here".
        const declaredInert = el.getAttribute('data-inert-by-design');
        // An in-page link whose target is not on the page is its own finding,
        // and a more useful one than "this control did nothing": it names the
        // fragment that is missing.
        let brokenAnchor = null;
        const href = el.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          const id = decodeURIComponent(href.slice(1));
          if (!document.getElementById(id) && !document.getElementsByName(id).length) brokenAnchor = href;
        }
        const active = el.hasAttribute('aria-current')
          || el.getAttribute('aria-selected') === 'true'
          || el.getAttribute('aria-pressed') === 'true'
          || [...el.classList].some((c) => /^(is-)?(active|selected|current)$/.test(c));
        return {
          idx: i,
          active,
          brokenAnchor,
          declaredInert: declaredInert && declaredInert.trim() ? declaredInert.trim() : null,
          shape: `${el.tagName.toLowerCase()}|${el.getAttribute('role') || ''}|${cls}`,
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 46)
                 || el.tagName.toLowerCase(),
        };
      });
    }, INTERACTIVE);

    // Group identical shapes; eight identical FAQ rows teach nothing the first
    // two did not.
    const perShape = new Map();
    const chosen = [];
    for (const c of found) {
      const n = perShape.get(c.shape) ?? 0;
      if (n >= args.perShape) { entry.skipped++; continue; }
      perShape.set(c.shape, n + 1);
      chosen.push(c);
      if (chosen.length >= args.max) break;
    }
    entry.total = found.length;

    for (const c of chosen) {
      const errors = [];
      const p = await ctx.newPage();
      await p.addInitScript(VIS_INIT);
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
      p.on('pageerror', (e) => errors.push(`uncaught: ${String(e.message).slice(0, 160)}`));
      const res = { label: c.label, shape: c.shape, active: c.active,
                    brokenAnchor: c.brokenAnchor,
                    declaredInert: c.declaredInert, errors: [],
                    changed: false, newViolations: [], newOverlaps: [] };
      try {
        await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
        if (args.theme) {
          await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), args.theme);
          await p.waitForTimeout(100);
        }
        await p.evaluate((sel) => {
          [...document.querySelectorAll(sel)].filter(window.__iaVis)
            .forEach((el, i) => el.setAttribute('data-ia-idx', String(i)));
        }, INTERACTIVE);

        const handle = await p.$(`[data-ia-idx="${c.idx}"]`);
        if (!handle) { res.errors.push('control vanished before it could be clicked'); }
        else {
          const before = await p.evaluate(FINGERPRINT);
          const beforeAxe = await axeViolations(p);
          const beforeBoxes = await p.evaluate(TEXT_BOXES);
          const beforeOverlaps = new Set(overlaps(beforeBoxes).map((o) => `${o.a}::${o.b}`));

          await handle.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
          await handle.click({ timeout: 5000, force: true });
          await p.waitForTimeout(260);

          const after = await p.evaluate(FINGERPRINT);
          res.changed = JSON.stringify(before) !== JSON.stringify(after);
          // A stale declaration is worse than none: it tells the next reader
          // this control does nothing, while the control does something.
          if (res.changed && c.declaredInert) {
            res.errors.push(`declared inert-by-design ("${c.declaredInert}") but the click changed the page`);
          }

          if (res.changed) {
            const afterAxe = await axeViolations(p);
            const had = new Set(beforeAxe.map(keyOf));
            res.newViolations = afterAxe.filter((v) => !had.has(keyOf(v)) && PROMOTED.has(v.rule));
            const afterBoxes = await p.evaluate(TEXT_BOXES);
            res.newOverlaps = overlaps(afterBoxes)
              .filter((o) => !beforeOverlaps.has(`${o.a}::${o.b}`))
              .slice(0, 3);
          }
        }
      } catch (err) {
        res.errors.push(String(err && err.message ? err.message : err).split('\n')[0].slice(0, 160));
      } finally {
        res.errors.push(...errors);
        await p.close();
      }
      if (res.errors.length) blocking += res.errors.length;
      blocking += res.newViolations.length;
      entry.controls.push(res);
    }
  } catch (err) {
    entry.error = String(err && err.message ? err.message : err);
    blocking += 1;
  } finally {
    await ctx.close();
  }
  report.push(entry);
}

await browser.close();
if (server) server.close();

if (args.json) {
  console.log(JSON.stringify({ promoted: [...PROMOTED], report }, null, 2));
} else {
  for (const r of report) {
    if (r.error) { console.log(`interaction-audit: ERROR  ${r.target}\n  ${r.error}`); continue; }
    const errs = r.controls.reduce((n, c) => n + c.errors.length, 0);
    const viol = r.controls.reduce((n, c) => n + c.newViolations.length, 0);
    const quiet = r.controls.filter((c) => !c.changed && !c.errors.length);
    const broken = r.controls.filter((c) => c.brokenAnchor);
    const dead = quiet.filter((c) => !c.active && !c.declaredInert && !c.brokenAnchor);
    const inertActive = quiet.filter((c) => c.active && !c.declaredInert);
    const declared = quiet.filter((c) => c.declaredInert);
    const laps = r.controls.reduce((n, c) => n + c.newOverlaps.length, 0);
    const brokenN = r.controls.filter((c) => c.brokenAnchor).length;
    const head = errs || viol
      ? `${errs} error(s), ${viol} new violation(s)`
      : (dead.length || laps || brokenN
          ? `OK with ${dead.length} inert, ${brokenN} broken anchor(s), ${laps} overlap(s)`
          : 'OK');
    console.log(`interaction-audit: ${head}  (${r.target}${args.theme ? ` · ${args.theme}` : ''})`);
    console.log(`  ${r.controls.length} control(s) exercised of ${r.total} found` +
                (r.skipped ? `, ${r.skipped} skipped as repeats of a shape already covered` : ''));
    for (const c of r.controls) {
      for (const e of c.errors) console.log(`  [error] "${c.label}" — ${e}`);
      for (const v of c.newViolations) {
        console.log(`  [error] "${c.label}" introduced ${v.rule} (${v.impact}) on ${v.target}`);
        if (v.summary) console.log(`          ${v.summary}`);
      }
      for (const o of c.newOverlaps) {
        console.log(`  [warn]  "${c.label}" revealed content that overlaps: "${o.a}" ↔ "${o.b}" (${o.pct}%)`);
      }
    }
    for (const c of broken) {
      console.log(`  [warn]  "${c.label}" links to ${c.brokenAnchor}, which is not an id or name on this page`);
    }
    for (const c of dead) {
      console.log(`  [warn]  "${c.label}" changed nothing measurable — dead control, or decoration that looks clickable`);
    }
    if (inertActive.length) {
      console.log(`  ${inertActive.length} control(s) were already in the active state, where doing nothing is correct: ` +
                  inertActive.map((c) => `"${c.label}"`).join(', '));
    }
    for (const c of declared) {
      console.log(`  [declared] "${c.label}" is inert on purpose — ${c.declaredInert}`);
    }
  }
}

if (args.strict && blocking > 0) {
  console.log(`\n✗ interaction-audit: ${blocking} blocking finding(s) (--strict)`);
  process.exit(1);
}
process.exit(0);
