// Visual audit — renders the HTML in Playwright and flags classes of bugs
// that static source-scanning misses:
//   1. CTAs / buttons with low-contrast text (cream on dark-brown, etc.)
//   2. Hero-row diagrams that render too narrow (<900px → text becomes illegible)
//   3. SVG <text> that renders under 9px on a 1440-wide viewport
//   4. Orphan figure cards in multi-col grids next to full-row hero siblings
//   5. SVG text elements whose rendered bounding boxes overlap (e.g. rotated
//      decorative text intersecting static labels) — known-bugs 1.8
//   6. Diagram content letterboxed inside an oversized viewBox — known-bugs 1.28
//   7. Dense diagrams (≥20 labels) crammed into narrow containers — known-bugs 1.29
//   8. Engineering diagrams with zero saturated hues (anthropic only) — known-bugs 1.30
//   9. Text deserts: >2600px of prose with no visual element — known-bugs 1.31
//  10. Note: the <9px SVG text check covers ALL content figures, not just hero rows
//  11. Keyboard a11y: focusables present but no :focus/:focus-visible style
//      anywhere (outline stripped) · positive tabindex hijacking tab order
//  12. Perf: LCP > 4000ms / CLS > 0.1 via buffered PerformanceObserver —
//      local render, indicative only; skipped silently if API unavailable
//
// Usage:
//   node skills/design-review/scripts/visual-audit.mjs [--ignore-intentional] <html-path>
//
// Flags:
//   --ignore-intentional  Suppress contrast warnings for colour pairs explicitly
//                         documented as brand-intentional in INTENTIONAL_EXCEPTIONS
//                         (e.g. white on anthropic orange #d97757 is a known 3.12
//                         trade-off, see known-bugs.md 2.1). Reduces noise so real
//                         new-bug warnings don't get lost in "the usual 5 warnings."
//
// Exit code 0 = pass, 1 = errors found, 2 = bad CLI. Run from repo root.
// Requires: playwright  (npm i playwright --no-save, then npx playwright install chromium)

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import process from 'node:process';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const ignoreIntentional = args.includes('--ignore-intentional');
// --theme=dark|light — flips html[data-theme] after load. Glass pages are
// dual-theme; the harness audits dark (canonical) and light separately.
const themeArg = (args.find((a) => a.startsWith('--theme=')) || '').split('=')[1] || null;
// --viewport=375x812 — audit at a phone viewport. Brand-presence is skipped
// (its 1440×500 clip and thresholds are desktop-calibrated); the page-overflow
// check below is the mobile-specific gate.
const vpArg = (args.find((a) => a.startsWith('--viewport=')) || '').split('=')[1] || null;
const vpMatch = vpArg ? vpArg.match(/^(\d+)x(\d+)$/) : null;
const VIEWPORT = vpMatch ? { width: +vpMatch[1], height: +vpMatch[2] } : { width: 1440, height: 900 };
// --viewport2=WxH / --no-second-viewport — issue #20 FU2. After the main pass,
// re-run the in-page checks at a narrower viewport and keep only the width-
// sensitive geometry kinds (overlap / overflow) as warnings. A collision that's
// a near-miss at 1440 (clamped grid tracks) becomes a real overrun once the
// container shrinks; one test width can't see it. Default: 1024, but ONLY when
// the caller didn't already ask for a narrow main viewport (nothing to add).
const vp2Arg = (args.find((a) => a.startsWith('--viewport2=')) || '').split('=')[1] || null;
const vp2Match = vp2Arg ? vp2Arg.match(/^(\d+)x(\d+)$/) : null;
let secondViewport = null;
if (!args.includes('--no-second-viewport')) {
  if (vp2Match) secondViewport = { width: +vp2Match[1], height: +vp2Match[2] };
  else if (!vpArg) secondViewport = { width: 1024, height: 900 };
}
const target = args.filter((a) => !a.startsWith('--'))[0];
if (!target) {
  console.error('usage: node visual-audit.mjs [--ignore-intentional] [--theme=dark|light] <html-path>');
  process.exit(2);
}

// Brand-intentional contrast patterns — when --ignore-intentional is set, any
// finding matching one of these gets filtered out (or downgraded to an info
// line). Keep this list short and cross-reference known-bugs.md.
const INTENTIONAL_EXCEPTIONS = [
  // Anthropic brand orange CTA. white(255,255,255) on orange(217,119,87) = 3.12
  // — documented in known-bugs.md §2.1. Brand-intentional, reviewed, accepted.
  { fg: [255, 255, 255], bg: [217, 119, 87], tolerance: 2,
    note: 'anthropic brand orange CTA (known-bugs 2.1)' },
  // Apple brand link colour. blue(0,113,227) on pale-gray(245,245,247) = 4.31
  // — 0.19 below AA but apple.com's standard link styling on its subtle band.
  { fg: [0, 113, 227], bg: [245, 245, 247], tolerance: 2,
    note: 'apple brand link on pale-gray section (known-bugs 3.2)' },
];

function matchesIntentional(finding) {
  if (finding.kind !== 'contrast') return false;
  const fg = /rgb\((\d+),(\d+),(\d+)\)/.exec(finding.fg);
  const bg = /rgb\((\d+),(\d+),(\d+)\)/.exec(finding.bg);
  if (!fg || !bg) return false;
  const [fr, fgr, fb] = [+fg[1], +fg[2], +fg[3]];
  const [br, bgr, bb] = [+bg[1], +bg[2], +bg[3]];
  return INTENTIONAL_EXCEPTIONS.some((ex) => {
    const [efr, efgr, efb] = ex.fg;
    const [ebr, ebgr, ebb] = ex.bg;
    const t = ex.tolerance;
    return Math.abs(fr - efr) <= t && Math.abs(fgr - efgr) <= t && Math.abs(fb - efb) <= t &&
           Math.abs(br - ebr) <= t && Math.abs(bgr - ebgr) <= t && Math.abs(bb - ebb) <= t;
  });
}

// Per-skill signatures — the brand colors a page of this skill MUST have
// visible presence of in its top region, and foreign signatures that must
// NOT leak in. Added 2026-04-21 as part of Phase A evaluator completion
// (addresses "sage nav looked yellow" — brand identity wasn't visible at top).
const SKILL_SIGNATURES = {
  anthropic: {
    name: 'anthropic orange',
    accents: [[217, 119, 87]],        // #d97757
    threshold: 0.004,                  // canonical pages 0.5-0.9%; catch "no orange at all"
    forbiddenColors: [
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [151, 176, 119], note: 'sage brand green #97B077' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Space Grotesk'],
  },
  apple: {
    name: 'apple blue',
    accents: [[0, 113, 227]],          // #0071E3
    threshold: 0.0002,                 // apple is minimalist; even tiny blue signals OK
    forbiddenColors: [
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk'],
  },
  ember: {
    name: 'ember gold',
    accents: [[196, 148, 100]],        // #c49464
    threshold: 0.0001,                 // gold is a hairline/accent — catch total absence only
    forbiddenColors: [
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Instrument Serif', 'Poppins', 'Lora', 'Space Grotesk'],
  },
  sage: {
    name: 'sage green',
    accents: [[151, 176, 119], [212, 225, 184]],  // #97B077 + pale sage
    threshold: 0.015,                  // sage must carry visibly green identity — real nav band
    forbiddenColors: [
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Fraunces', 'Poppins', 'Lora', 'Space Grotesk'],
  },
  glass: {
    name: 'glass aurora cyan',
    accents: [[34, 211, 238]],         // #22D3EE — only SOLID foreground cyan
                                       // registers; aurora blobs blend toward the
                                       // navy canvas and never match at TOL 55.
    threshold: 0.002,                  // hero carries ≥3 solid cyan moves (kicker,
                                       // nav CTA, hairline); calibrated 2026-06-11
    forbiddenColors: [
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora'],
  },
  eclat: {
    name: 'eclat flare',
    accents: [[255, 91, 52]],           // #ff5b34 — flare CTA + live dot (only saturated foreground)
    threshold: 0.00002,                  // dark cinematic hero puts the CTA mid-screen; catch total absence only
    // anthropic orange OMITTED on purpose: eclat's flare-soft #ff7a4d is within
    // TOL 55 of #d97757, so forbidding it would false-flag eclat's own warm family.
    forbiddenColors: [
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Lora', 'Poppins', 'Space Grotesk'],
  },
  lectern: {
    name: 'lectern navy',
    accents: [[29, 58, 110], [47, 91, 176]],   // #1d3a6e + #2f5bb0
    threshold: 0.0002,                          // navy square + kicker + agenda numbers carry it in the top region
    // apple blue OMITTED: lectern is a navy/blue-family skin; forbidding apple's
    // blue would risk flagging lectern's own chart blues.
    forbiddenColors: [
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
      { rgb: [34, 211, 238], note: 'glass aurora cyan #22D3EE' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Lora', 'Poppins', 'Space Grotesk'],
  },
};

function detectSkill(target, html) {
  const m = target.match(/skills\/([a-z]+)-design\//);
  if (m && SKILL_SIGNATURES[m[1]]) return m[1];
  // Fallback: look for a <link href=".../<skill>.css"> inside the HTML.
  for (const name of Object.keys(SKILL_SIGNATURES)) {
    const re = new RegExp(`<link[^>]+href=["'][^"']*${name}\\.css`, 'i');
    if (re.test(html)) return name;
  }
  return null;
}

// Decide how Playwright loads the target: explicit file:// / absolute path
// go direct as file://; relative path is served over a local HTTP server
// anchored at cwd (original behaviour). Callers passing an absolute path
// don't need to cd into a specific repo root first.
const root = process.cwd();
const mime = { '.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2' };
const PORT = 8801;
let server = null;
let url;
if (/^file:\/\//.test(target)) {
  url = target;
} else if (/^\//.test(target)) {
  url = `file://${target}`;
} else {
  server = createServer(async (req, res) => {
    try {
      const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      const s = await stat(p); if (s.isDirectory()) throw 0;
      res.writeHead(200, { 'Content-Type': mime[extname(p)] ?? 'application/octet-stream' });
      res.end(await readFile(p));
    } catch { res.writeHead(404).end(); }
  }).listen(PORT);
  url = `http://localhost:${PORT}/${target.replace(/^\/+/, '')}`;
}
const browser = await chromium.launch();
// reducedMotion:'reduce' — deterministic rendering. All four light skills'
// CSS already collapses transitions under this media query; glass.js reads
// it and renders every animation's terminal state (reveal visible, count-up
// final, paths drawn). Without it, IntersectionObserver reveal elements
// below the fold would still be opacity:0 when fullPage screenshots are
// taken (captureBeyondViewport never scrolls, so IO never fires).
const page = await (await browser.newContext({
  viewport: VIEWPORT,
  reducedMotion: 'reduce',
})).newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
if (themeArg) {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), themeArg);
  await page.waitForTimeout(200);
}

// Read the HTML so we can detect the skill, then pass cross-skill-smell
// data into page.evaluate. The smell check needs to know this skill's
// forbidden foreign signatures.
const rawHtml = await readFile(
  resolve(root, target.replace(/^file:\/\//, '')), 'utf-8'
).catch(() => '');
const skillId = detectSkill(target, rawHtml);
const crossSkillData = skillId
  ? {
      skill: skillId,
      forbiddenColors: SKILL_SIGNATURES[skillId].forbiddenColors,
      forbiddenFonts: SKILL_SIGNATURES[skillId].forbiddenFonts,
    }
  : null;

// Linked-CSS focus hint for the keyboard check. Under file:// every linked
// stylesheet is an opaque origin, so in-page cssRules access throws and the
// no-focus-style gate would have to skip. Scan the linked CSS files from the
// Node side instead and hand the verdict in. Remote (http/https) stylesheets
// can't be scanned — record their presence so the gate stays conservative.
let focusInExternalCss = false;
let remoteCssPresent = false;
{
  const htmlDir = dirname(resolve(root, target.replace(/^file:\/\//, '')));
  for (const m of rawHtml.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)) {
    const href = m[1];
    if (/^(https?:)?\/\//i.test(href)) { remoteCssPresent = true; continue; }
    try {
      const cssText = await readFile(resolve(htmlDir, href.split('?')[0]), 'utf-8');
      if (cssText.includes(':focus')) { focusInExternalCss = true; break; }
    } catch { /* unresolvable link — treat as absent */ }
  }
}

const auditFn = (arg) => {
  const cs = arg.crossSkill;
  const issues = [];

  // ---------- Helpers ----------
  const parseRgb = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
    return { r, g, b, a };
  };
  // Relative luminance per WCAG
  const lum = ({ r, g, b }) => {
    const c = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (fg, bg) => {
    const L1 = lum(fg), L2 = lum(bg);
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  };
  // Walk up ancestors compositing semi-transparent backgrounds until an
  // opaque layer (or the white default). The old version returned the FIRST
  // layer with a>0.05 as-is, which mis-read frosted-glass panels: a
  // rgba(255,255,255,0.06) glass card on a #0B1020 navy canvas was treated
  // as a WHITE background, so white text on it scored contrast 1.0. Proper
  // alpha compositing fixes glass and only shifts legacy translucent navs
  // (e.g. sage's 0.88 band) by a few RGB points.
  const effectiveBg = (el) => {
    const layers = [];
    let node = el;
    let base = null;
    while (node && node !== document.body.parentElement) {
      const c = parseRgb(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.05) {
        if (c.a >= 0.95) { base = c; break; }
        layers.push(c);
      }
      node = node.parentElement;
    }
    let bg = base ? { r: base.r, g: base.g, b: base.b } : { r: 255, g: 255, b: 255 };
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      bg = {
        r: l.r * l.a + bg.r * (1 - l.a),
        g: l.g * l.a + bg.g * (1 - l.a),
        b: l.b * l.a + bg.b * (1 - l.a),
      };
    }
    return { r: Math.round(bg.r), g: Math.round(bg.g), b: Math.round(bg.b), a: 1 };
  };

  // ---------- 1) Button / CTA contrast audit ----------
  // Cross-skill CTA selectors — add here when a new skill ships.
  const ctaSelectors = [
    '.apple-link', '.apple-badge', 'button',
    '.anth-button', '.anth-badge',
    '.ember-button', '.ember-badge', '.ember-nav-brand',
    '.sage-button', '.sage-badge',
    '.glass-button', '.glass-badge',
    'a[class*="button"]', 'a[class*="-cta"]'
  ];
  const seen = new Set();
  document.querySelectorAll(ctaSelectors.join(',')).forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return;
    const fg = parseRgb(style.color);
    const bg = parseRgb(style.backgroundColor);
    const ownBg = bg && bg.a > 0.5 ? bg : effectiveBg(el);
    if (!fg || !ownBg) return;
    const ratio = contrast(fg, ownBg);
    if (ratio < 4.5) {
      const text = (el.innerText || '').trim().slice(0, 40);
      issues.push({
        kind: 'contrast',
        severity: ratio < 3 ? 'error' : 'warn',
        ratio: +ratio.toFixed(2),
        fg: `rgb(${fg.r},${fg.g},${fg.b})`,
        bg: `rgb(${ownBg.r},${ownBg.g},${ownBg.b})`,
        text: text || el.className,
        selector: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'),
      });
    }
  });

  // ---------- 1b) Orphan-card audit ----------
  // If a figure sits in a grid alongside siblings that all span the full row
  // (grid-column: 1 / -1) but this one doesn't, it ends up leaving awkward
  // empty space next to it. Flag so we either span it or pair it.
  const grids = new Set();
  document.querySelectorAll('figure').forEach((f) => {
    const parent = f.parentElement;
    if (!parent) return;
    const pStyle = getComputedStyle(parent);
    if (pStyle.display.includes('grid')) grids.add(parent);
  });
  grids.forEach((grid) => {
    const figs = [...grid.querySelectorAll(':scope > figure')];
    if (figs.length < 2) return;
    const spans = figs.map((f) => {
      const inline = (f.getAttribute('style') || '').includes('1 / -1');
      return inline || getComputedStyle(f).gridColumnEnd === '-1';
    });
    const heroCount = spans.filter(Boolean).length;
    if (heroCount < figs.length - 0 && heroCount >= figs.length - 1 && heroCount > 0) {
      figs.forEach((f, i) => {
        if (spans[i]) return;
        const neighbors = spans.filter((_, j) => j !== i);
        const allNeighborsHero = neighbors.every(Boolean);
        if (!allNeighborsHero) return;
        const rect = f.getBoundingClientRect();
        const parentRect = grid.getBoundingClientRect();
        if (rect.width < parentRect.width * 0.7) {
          const label = f.querySelector('h3')?.innerText || f.querySelector('svg')?.getAttribute('aria-label') || 'figure';
          issues.push({
            kind: 'orphan-figure',
            severity: 'warn',
            label,
            rendered: `${Math.round(rect.width)}px of ${Math.round(parentRect.width)}px row`,
          });
        }
      });
    }
  });

  // ---------- 1c) Figure without <figcaption> (bug 1.18) ----------
  document.querySelectorAll('figure').forEach((f) => {
    const hasCaption = !!f.querySelector(':scope > figcaption');
    if (!hasCaption) {
      const svg = f.querySelector('svg');
      const label = (svg && svg.getAttribute('aria-label'))
        || (f.querySelector('h3, h4') && f.querySelector('h3, h4').innerText)
        || 'figure';
      issues.push({
        kind: 'figure-no-caption',
        severity: 'warn',
        label: String(label).slice(0, 60),
      });
    }
  });

  // ---------- 2) Hero diagram sizing audit ----------
  // Hero rows: figure elements with grid-column spanning the whole row (1 / -1).
  document.querySelectorAll('figure').forEach((fig) => {
    const style = getComputedStyle(fig);
    const gridCol = style.gridColumnStart + ' / ' + style.gridColumnEnd;
    const isHero =
      gridCol === '1 / -1' ||
      gridCol.includes('-1') ||
      fig.style.gridColumn === '1 / -1';
    if (!isHero) return;
    const svg = fig.querySelector('svg[role="img"], svg[aria-label]');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // Skip if the author deliberately constrained the SVG (centered + max-width)
    // — that's an intentional design choice, not a sizing accident.
    const inlineStyle = svg.getAttribute('style') || '';
    const hasMaxWidth = /max-width\s*:/.test(inlineStyle);
    const isCentered = /margin\s*:\s*0\s+auto|margin-(left|right|inline)\s*:\s*auto/.test(inlineStyle);
    if (rect.width < 900 && !(hasMaxWidth && isCentered)) {
      issues.push({
        kind: 'diagram-narrow',
        severity: 'warn',
        renderedWidth: Math.round(rect.width),
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
    // (tiny-text moved to block 2c — it now covers ALL content SVGs, not just hero rows)
  });

  // ---------- 2c) Diagram tiny text — ALL content SVGs (scope widened 2026-06-11) ----------
  // Was hero-only. The real-world failure class is the dense diagram squeezed
  // into a prose column: a non-hero figure whose viewBox is far wider than its
  // rendered box, so every label lands under 9px. Icon-scale SVGs (<300px) and
  // decorative illustrations (<4 labels) are out of scope.
  document.querySelectorAll('svg').forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 300) return;
    if (svg.getAttribute('aria-hidden') === 'true') return;
    const texts = [...svg.querySelectorAll('text')];
    if (texts.length < 4) return;
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    const vbW = vb[2] || 0;
    const scale = vbW ? rect.width / vbW : 1;
    let minText = Infinity;
    texts.forEach((t) => {
      const size = parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize);
      if (!isFinite(size)) return;
      const effective = size * scale;
      if (effective < minText) minText = effective;
    });
    if (isFinite(minText) && minText < 9) {
      issues.push({
        kind: 'diagram-tiny-text',
        severity: 'warn',
        renderedPx: +minText.toFixed(1),
        renderedWidth: Math.round(rect.width),
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

  // ---------- 2b) Saturated band fill audit (known-bugs §1.27) ----------
  // Diagram-craft rule: colour encodes meaning, it doesn't fill area.
  // The smell is the "full-width colour band": a hue-saturated rect spanning
  // ≥ 60% of the viewBox width with real height — three of those stacked is
  // PowerPoint SmartArt. Per-element, hue-saturated only: dark-neutral panels
  // (terminal / dark-window mocks) and low-saturation tints are legitimate and
  // pass. Icon-scale SVGs (< 300px rendered) are out of scope because a filled
  // icon tile legitimately covers its whole viewBox.
  const toHsl = ({ r, g, b }) => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = 60 * (((gn - bn) / d) % 6);
      else if (max === gn) h = 60 * ((bn - rn) / d + 2);
      else h = 60 * ((rn - gn) / d + 4);
      if (h < 0) h += 360;
    }
    return { h, s, l };
  };
  document.querySelectorAll('svg').forEach((svg) => {
    if (svg.getBoundingClientRect().width < 300) return;
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    const vbW = vb[2] || 0;
    const vbArea = vbW * (vb[3] || 0);
    if (!vbArea) return;
    const bands = [];
    svg.querySelectorAll('rect').forEach((el) => {
      if (el.closest('defs, pattern, marker, clipPath, mask')) return;
      const cs = getComputedStyle(el);
      const fill = parseRgb(cs.fill);
      if (!fill) return;
      const op = (parseFloat(cs.opacity) || 1) * (parseFloat(cs.fillOpacity) || 1);
      if (op < 0.5) return;
      const { s, l } = toHsl(fill);
      if (!(s > 0.25 && l < 0.85)) return; // hue-saturated only
      let box;
      try { box = el.getBBox(); } catch { return; }
      if (box.width < 0.6 * vbW) return;          // not a full-width band
      if (box.height < 24) return;                 // divider line, not a band
      if (box.width * box.height < 0.08 * vbArea) return;
      bands.push({ w: Math.round(box.width), h: Math.round(box.height), pct: +((box.width * box.height / vbArea) * 100).toFixed(1) });
    });
    if (bands.length) {
      const biggest = bands.reduce((a, b) => (b.pct > a.pct ? b : a));
      issues.push({
        kind: 'saturated-band',
        severity: 'warn',
        count: bands.length,
        dims: `${biggest.w}×${biggest.h}`,
        coveragePct: biggest.pct,
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

  // ---------- 2c2) SVG letterbox — content doesn't fill the viewBox (known-bugs §1.28) ----------
  // The author sized the viewBox, then drew everything in the middle. Both
  // side margins are dead space, and because the figure is width-constrained,
  // every label shrinks to pay for them. Measure the union client-rect of all
  // content elements; full-size backplates (background panel, dot-grid layer,
  // ≥96% of BOTH axes) don't count as content. Escape hatch: data-allow-letterbox
  // on the svg or any ancestor (deliberately centered spot illustrations).
  document.querySelectorAll('figure svg').forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 300 || rect.height === 0) return;
    if (svg.getAttribute('aria-hidden') === 'true') return;
    for (let n = svg; n; n = n.parentElement) {
      if (n.hasAttribute && n.hasAttribute('data-allow-letterbox')) return;
    }
    let u = null;
    svg.querySelectorAll('rect, circle, ellipse, path, polygon, polyline, line, text, image').forEach((el) => {
      if (el.closest('defs, pattern, marker, clipPath, mask')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.width >= 0.96 * rect.width && r.height >= 0.96 * rect.height) return; // backplate
      u = u
        ? { left: Math.min(u.left, r.left), top: Math.min(u.top, r.top),
            right: Math.max(u.right, r.right), bottom: Math.max(u.bottom, r.bottom) }
        : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    });
    if (!u) return;
    const fillW = (u.right - u.left) / rect.width;
    const fillH = (u.bottom - u.top) / rect.height;
    if (fillW < 0.72 || fillH < 0.5) {
      const axis = fillW < 0.72 ? 'width' : 'height';
      issues.push({
        kind: 'svg-letterbox',
        severity: 'warn',
        axis,
        fillPct: Math.round((axis === 'width' ? fillW : fillH) * 100),
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

  // ---------- 2c3) Dense diagram crammed into a narrow container (known-bugs §1.29) ----------
  // ≥20 <text> labels rendered under 760px: even when every label clears the
  // 9px floor, a diagram this dense belongs in the wide container (1200px) or
  // should be split. Deliberately narrow thresholds — this is the backstop for
  // the worst cases; the positive guidance lives in diagram-craft §8.
  document.querySelectorAll('figure svg').forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    if (svg.getAttribute('aria-hidden') === 'true') return;
    const textCount = svg.querySelectorAll('text').length;
    if (textCount >= 20 && rect.width < 760) {
      issues.push({
        kind: 'dense-diagram-cramped',
        severity: 'warn',
        textCount,
        renderedWidth: Math.round(rect.width),
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

  // ---------- 2c4) Monochrome engineering diagram — skill whitelist (known-bugs §1.30) ----------
  // Reverse gate to saturated-band: a diagram with ZERO saturated hues (white
  // cards + gray strokes + gray text) reads as an unfinished wireframe.
  // The machine gate only catches the unambiguous failure (0 hues) because
  // legitimate single-hue diagrams exist (git graphs, timelines). Tints
  // (l ≥ 0.85) don't count as hues — color presence must come from solid
  // dots/badges/bars/lines.
  // Whitelist rationale per skill:
  //   anthropic — wants ≥2 semantic hues per engineering diagram (craft §1).
  //   ember     — warm browns (#312520/#6b5a4f/#8a7564) sit below the s>0.25
  //               bar; the gold focus #c49464 is what registers as a hue.
  //               A 0-hue ember diagram means the gold focus is missing or
  //               cold neutral gray crept in — both are dos-and-donts fails.
  //   sage      — green #97B077 is the identity; indigo ink #393C54 is too
  //               desaturated to count. 0 hue = a gray wireframe, not sage.
  //   apple     — EXEMPT by design: achromatic grayscale + single blue focus
  //               is the identity, so an all-gray diagram can be legitimate.
  //   glass     — dark-glass diagram language is white-alpha node fills +
  //               white-alpha strokes (all s=0); the cyan glow nodes ARE the
  //               semantic layer. 0 hue = the cyan focus is missing.
  if (cs && ['anthropic', 'ember', 'sage', 'glass'].includes(cs.skill)) {
    document.querySelectorAll('figure svg').forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width < 300) return;
      if (svg.getAttribute('aria-hidden') === 'true') return;
      const nodeRects = [...svg.querySelectorAll('rect')].filter(
        (el) => !el.closest('defs, pattern, marker, clipPath, mask')
      );
      const textCount = svg.querySelectorAll('text').length;
      if (nodeRects.length < 4 || textCount < 6) return;   // not an engineering diagram
      const hues = new Set();
      svg.querySelectorAll('rect, circle, ellipse, path, polygon, polyline, line, text').forEach((el) => {
        if (el.closest('defs, pattern, marker, clipPath, mask')) return;
        const st = getComputedStyle(el);
        for (const v of [st.fill, st.stroke]) {
          const c = parseRgb(v || '');
          if (!c) continue;
          const { h, s, l } = toHsl(c);
          if (s > 0.25 && l > 0.15 && l < 0.85) hues.add(Math.round(h / 30));
        }
      });
      if (hues.size === 0) {
        issues.push({
          kind: 'diagram-monochrome',
          severity: 'warn',
          nodeCount: nodeRects.length,
          textCount,
          label: svg.getAttribute('aria-label') || 'unlabeled',
        });
      }
    });
  }

  // ---------- 2c5) Text desert — long prose stretch with no visual element (known-bugs §1.31) ----------
  // Diagram-density contract (diagram-craft §12): ≥1 visual per 1.5 screens
  // (~1300px). The machine gate fires at 2600px (two screens) — only the worst
  // offenders. Card grids count as visual relief (pricing tiers, stat strips).
  // Exempt: md-mirror document pages (.md-banner), short pages (<1800px),
  // <body data-allow-text-desert>.
  {
    const docH = document.body.scrollHeight;
    const exempt =
      docH < 1800 ||
      document.body.hasAttribute('data-allow-text-desert') ||
      !!document.querySelector('.md-banner');
    if (!exempt) {
      const visuals = [];
      document.querySelectorAll('svg, figure, img, table, blockquote, pre, [class*="stat"]').forEach((el) => {
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.height < 60 || r.width < 80) return;
        visuals.push(r);
      });
      document.querySelectorAll('*').forEach((el) => {
        const st = getComputedStyle(el);
        if (!st.display.includes('grid')) return;
        if (el.children.length < 2) return;
        const r = el.getBoundingClientRect();
        if (r.height < 200 || r.width < 400) return;
        visuals.push(r);
      });
      visuals.sort((a, b) => a.top - b.top);
      let cursor = 0;            // page is unscrolled, so client-rect top == document y
      let worst = null;
      for (const r of visuals) {
        const gap = r.top - cursor;
        if (!worst || gap > worst.gap) worst = { gap, from: cursor, to: r.top };
        cursor = Math.max(cursor, r.bottom);
      }
      const tailGap = docH - cursor;
      if (!worst || tailGap > worst.gap) worst = { gap: tailGap, from: cursor, to: docH };
      if (worst && worst.gap > 2600) {
        issues.push({
          kind: 'text-desert',
          severity: 'warn',
          gap: Math.round(worst.gap),
          from: Math.round(worst.from),
          to: Math.round(worst.to),
          pageHeight: Math.round(docH),
        });
      }
    }
  }

  // ---------- 5) SVG text overlap audit ----------
  // Catches the class of bug where a rotated decorative label intersects
  // static labels, whose coords looked safe in non-rotated source.
  // Rule: require overlap ≥ 4px on BOTH axes — title+subtitle pairs with 1-2px
  // font-metric overlap don't count; crossing-decorations do.
  document.querySelectorAll('svg').forEach((svg) => {
    const texts = [...svg.querySelectorAll('text')].filter((t) => {
      const r = t.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (let i = 0; i < texts.length; i++) {
      const a = texts[i].getBoundingClientRect();
      for (let j = i + 1; j < texts.length; j++) {
        const b = texts[j].getBoundingClientRect();
        const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (xOverlap < 4 || yOverlap < 4) continue;
        // Skip if one text fully contains the other (tspans, etc.)
        const aInB = a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
        const bInA = b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom;
        if (aInB || bInA) continue;
        issues.push({
          kind: 'svg-text-overlap',
          severity: 'error',
          textA: (texts[i].textContent || '').trim().slice(0, 34),
          textB: (texts[j].textContent || '').trim().slice(0, 34),
          rectA: `${Math.round(a.left)},${Math.round(a.top)}+${Math.round(a.width)}×${Math.round(a.height)}`,
          rectB: `${Math.round(b.left)},${Math.round(b.top)}+${Math.round(b.width)}×${Math.round(b.height)}`,
          svg: svg.getAttribute('aria-label') || 'unlabeled',
        });
      }
    }
  });

  // ---------- 5b) General text-bbox overlap audit (known-bugs §1.25) ----------
  // §1.8 above only catches intra-SVG <text> with ≥4px on both axes. It misses
  // two real-world classes seen in a dog-food project (technical doc set,
  // 12 pages of mixed-content HTML with dense SVG diagrams):
  //   (a) SVG sibling labels stacked with 1-2px y-overlap (font-metric height
  //       eats the gap when designer hard-coded y= without measuring leading)
  //   (b) HTML <code>/<span> in 2-col grid widening past its column and
  //       crashing into the neighbor cell's content
  // This check covers both: scan every visible leaf text-bearing element,
  // measure pairwise bbox intersection, exclude ancestor/descendant pairs, and
  // require overlap ≥ 10% of the smaller bbox AND ≥ 16 px² absolute floor.
  // Escape hatch: <element data-allow-overlap> or any ancestor with it
  // suppresses the check (for tooltips, decorative shadow text, etc.).
  {
    const allowOverlap = (el) => {
      for (let n = el; n; n = n.parentElement) if (n.hasAttribute && n.hasAttribute('data-allow-overlap')) return true;
      return false;
    };
    const isAncestor = (a, b) => { for (let n = b.parentElement; n; n = n.parentElement) if (n === a) return true; return false; };
    // The content of a collapsed native <details> is NOT painted (only its
    // <summary> is), yet Chromium still reports getClientRects()/computed
    // visibility:visible for it — so a closed accordion answer is invisible
    // on screen but geometrically "present", and naively overlaps the next
    // question. Skip any node inside a closed <details> that isn't its summary.
    // (known-bugs §1.40)
    const inClosedDetails = (el) => {
      const d = el.closest && el.closest('details:not([open])');
      if (!d) return false;
      const summary = d.querySelector(':scope > summary');
      return !(summary && summary.contains(el));
    };
    const leaves = [...document.querySelectorAll('*')].filter((el) => {
      if (el.children.length > 0) return false;
      const txt = (el.textContent || '').trim();
      if (!txt) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
      if (inClosedDetails(el)) return false;
      if (allowOverlap(el)) return false;
      return true;
    });
    // Use getClientRects() per-line-fragment instead of union bbox: an inline
    // <code> that wraps across 2 lines produces a single bbox spanning both
    // lines, mathematically intersecting any element on the start line even
    // when there's no actual visual collision. Per-fragment comparison fixes it.
    const rectsOf = (el) => [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    const fragments = leaves.map((el) => ({ el, rects: rectsOf(el) }));
    for (let i = 0; i < fragments.length; i++) {
      const A = fragments[i];
      for (let j = i + 1; j < fragments.length; j++) {
        const B = fragments[j];
        if (isAncestor(A.el, B.el) || isAncestor(B.el, A.el)) continue;
        // find any pair (one rect from A × one from B) that overlaps enough
        let hit = null;
        outer:
        for (const ra of A.rects) {
          for (const rb of B.rects) {
            const ox = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
            const oy = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
            const area = ox * oy;
            if (area < 16) continue;
            const smaller = Math.min(ra.width * ra.height, rb.width * rb.height);
            const pct = area / smaller;
            if (pct < 0.10) continue;
            // Exclude intentional vertical-stack designs where the y-overlap
            // is only font-metric tolerance, not actual glyph collision:
            // (1) x-aligned siblings of similar width (SAME/IDEA layered label):
            //     widthRatio ≥ 0.5 + oy ≤ 3 + xLeftClose
            // (2) SVG kicker+body pattern (small label above wider description,
            //     e.g. "证据 1" stacked over "build log 明文宣称..."):
            //     both A and B are SVG <text> + oy ≤ 2 + xLeftClose
            const xLeftClose = Math.abs(ra.left - rb.left) <= 5;
            const widthRatio = Math.min(ra.width, rb.width) / Math.max(ra.width, rb.width);
            if (oy <= 3 && xLeftClose && widthRatio >= 0.5) continue;
            const aIsSvgText = A.el.tagName === 'text' && !!A.el.closest('svg');
            const bIsSvgText = B.el.tagName === 'text' && !!B.el.closest('svg');
            if (aIsSvgText && bIsSvgText && oy <= 2 && xLeftClose) continue;
            hit = { ra, rb, ox, oy, pct }; break outer;
          }
        }
        if (!hit) continue;
        const aSvg = A.el.closest('svg'), bSvg = B.el.closest('svg');
        const inSameSvg = aSvg && aSvg === bSvg;
        const { ra, rb, ox, oy, pct } = hit;
        issues.push({
          kind: 'text-overlap',
          severity: 'warn',
          location: inSameSvg ? `svg "${aSvg.getAttribute('aria-label') || 'unlabeled'}"` : 'html-flow',
          textA: (A.el.textContent || '').trim().slice(0, 40),
          textB: (B.el.textContent || '').trim().slice(0, 40),
          tagA: A.el.tagName.toLowerCase(),
          tagB: B.el.tagName.toLowerCase(),
          overlap: `${Math.round(ox)}×${Math.round(oy)}=${Math.round(pct * 100)}%`,
          rectA: `${Math.round(ra.left)},${Math.round(ra.top)}+${Math.round(ra.width)}×${Math.round(ra.height)}`,
          rectB: `${Math.round(rb.left)},${Math.round(rb.top)}+${Math.round(rb.width)}×${Math.round(rb.height)}`,
        });
      }
    }
  }

  // ---------- 5c) SVG shape over text (known-bugs §1.26) ----------
  // Catches the class where a decorative <circle>/<rect>/<path> drawn AFTER
  // a <text> in DOM order lands on top of the text and visually obscures it.
  // Real-world example: timeline-axis dots crossing through card text labels
  // (timeline diagram dog-food: a horizontal axis crosses the cards, and the
  // axis dots end up on top of card-internal text labels). Only flag when
  // shape comes after text in DOM order (text drawn first, shape later = shape
  // on top = z-axis cover) and shape's fill is not transparent.
  // Escape hatch: data-allow-overlap on either element or any ancestor.
  {
    const SHAPE_TAGS = new Set(['circle', 'rect', 'ellipse', 'polygon', 'path']);
    const allowsOverlap = (el) => {
      for (let n = el; n; n = n.parentElement) if (n.hasAttribute && n.hasAttribute('data-allow-overlap')) return true;
      return false;
    };
    document.querySelectorAll('svg').forEach((svg) => {
      const all = [...svg.querySelectorAll('*')];
      const texts = all.filter((e) => e.tagName === 'text');
      for (const t of texts) {
        if (allowsOverlap(t)) continue;
        const tIdx = all.indexOf(t);
        const tr = t.getBoundingClientRect();
        if (tr.width < 4 || tr.height < 4) continue;
        for (let i = tIdx + 1; i < all.length; i++) {
          const s = all[i];
          if (!SHAPE_TAGS.has(s.tagName)) continue;
          if (allowsOverlap(s)) continue;
          const fill = (s.getAttribute('fill') || '').trim();
          if (fill === 'none' || fill === 'transparent') continue;
          const sr = s.getBoundingClientRect();
          const ox = Math.max(0, Math.min(tr.right, sr.right) - Math.max(tr.left, sr.left));
          const oy = Math.max(0, Math.min(tr.bottom, sr.bottom) - Math.max(tr.top, sr.top));
          const area = ox * oy;
          if (area < 16) continue;
          const pct = area / (tr.width * tr.height);
          if (pct < 0.10) continue;
          issues.push({
            kind: 'svg-shape-over-text',
            severity: 'warn',
            text: (t.textContent || '').trim().slice(0, 40),
            shape: s.tagName,
            fill,
            overlap: `${Math.round(ox)}×${Math.round(oy)}=${Math.round(pct * 100)}%`,
            svg: svg.getAttribute('aria-label') || 'unlabeled',
            textBbox: `${Math.round(tr.left)},${Math.round(tr.top)}+${Math.round(tr.width)}×${Math.round(tr.height)}`,
          });
        }
      }
    });
  }

  // ---------- 6) Multiple <h1> ----------
  // Each page must have exactly one <h1>. More than one = broken SEO +
  // screen-reader hierarchy + indicates semantic sloppiness.
  const h1s = [...document.querySelectorAll('h1')].filter((h) => {
    const s = getComputedStyle(h);
    return s.display !== 'none' && s.visibility !== 'hidden';
  });
  if (h1s.length > 1) {
    issues.push({
      kind: 'multiple-h1',
      severity: 'error',
      count: h1s.length,
      texts: h1s.map((h) => (h.innerText || '').trim().slice(0, 34)),
    });
  } else if (h1s.length === 0) {
    issues.push({
      kind: 'no-h1',
      severity: 'warn',
      note: 'page has no <h1> — every public page needs exactly one',
    });
  }

  // ---------- 7) Heading level skip (main content only) ----------
  // <h1> → <h3> without <h2> in between breaks reading order. Allow jumping
  // DOWN freely, only flag skipping UP. Skip headings inside footer/aside/nav
  // landmarks, where h5 column-header convention is widespread.
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(
    (h) => !h.closest('footer, aside, nav')
  );
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName.substring(1), 10);
    if (lastLevel && level > lastLevel + 1) {
      issues.push({
        kind: 'heading-skip',
        severity: 'warn',
        from: `h${lastLevel}`,
        to: `h${level}`,
        text: (h.innerText || '').trim().slice(0, 50),
      });
    }
    lastLevel = level;
  }

  // ---------- 8) Images without alt ----------
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        kind: 'img-no-alt',
        severity: 'error',
        src: (img.getAttribute('src') || '').slice(0, 60),
      });
    }
  });

  // ---------- 9) Links without accessible text ----------
  document.querySelectorAll('a').forEach((a) => {
    const style = getComputedStyle(a);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const text = (a.innerText || '').trim();
    const aria = a.getAttribute('aria-label');
    const title = a.getAttribute('title');
    if (!text && !aria && !title) {
      issues.push({
        kind: 'link-no-text',
        severity: 'error',
        href: (a.getAttribute('href') || '').slice(0, 50),
      });
    }
  });

  // ---------- 10b) Hollow cards in equal-width grid ----------
  // Catches "ABC-style" layouts where 3+ equal cards get stretched wider than
  // their content wants to be. Heuristic: card aspect > 2.0 AND text < 120
  // chars in an equal-column grid (3+ cols) → card feels hollow. User this
  // was the "三种方式 abc 太宽" bug (2026-04-20).
  document.querySelectorAll('*').forEach((el) => {
    const style = getComputedStyle(el);
    if (!style.display.includes('grid')) return;
    const tmpl = style.gridTemplateColumns || '';
    // Crude: count column tracks by splitting on whitespace (px / fr / auto).
    const cols = tmpl.trim().split(/\s+/).filter(Boolean).length;
    if (cols < 3) return;
    const children = [...el.children];
    if (children.length < 3) return;
    const widths = children.map((c) => c.getBoundingClientRect().width);
    const maxW = Math.max(...widths);
    const minW = Math.min(...widths);
    if (maxW - minW > 10) return;  // columns not actually equal
    for (const c of children) {
      const rect = c.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 40) continue;
      // Skip stat-strip pattern: if any descendant has a very large font
      // (≥36px), this is a number/metric display, not a content card —
      // the sparse text is intentional (big digit + small label).
      const hasBigNumber = [...c.querySelectorAll('*')].some((d) => {
        const fs = parseFloat(getComputedStyle(d).fontSize);
        return fs >= 36;
      });
      if (hasBigNumber) continue;
      // Skip elements that are not cards at all — bare <div> wrappers in a
      // stat-strip row inside a parent card. No border, no box-shadow,
      // no distinct background = not a card, just a text group.
      // Background check is relative to parent: if child and parent render
      // the same colour, there's no visual boundary.
      const cStyle = getComputedStyle(c);
      const hasBorder = ['Top','Right','Bottom','Left'].some(
        (s) => parseFloat(cStyle[`border${s}Width`]) > 0
      );
      const hasShadow = cStyle.boxShadow && cStyle.boxShadow !== 'none';
      const parentBg = getComputedStyle(el).backgroundColor;
      const hasDistinctBg =
        cStyle.backgroundColor &&
        cStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        cStyle.backgroundColor !== parentBg;
      if (!hasBorder && !hasShadow && !hasDistinctBg) continue;
      const aspect = rect.width / rect.height;
      const text = (c.innerText || '').trim();
      const chars = text.length;
      if (aspect > 1.8 && chars < 180) {
        issues.push({
          kind: 'hollow-card',
          severity: 'warn',
          aspect: +aspect.toFixed(2),
          chars,
          dims: `${Math.round(rect.width)}×${Math.round(rect.height)}`,
          preview: text.slice(0, 40),
        });
      }
    }
  });

  // ---------- 10c) Asymmetric first-col-wider 3-col grid ----------
  // A 3-col grid with col-1 meaningfully wider than its siblings reads as
  // "row pulled left" rather than "col-1 is the hero". Verdict source:
  // human-eye 2026-04-22 (gated-dual-clone three safety gates). known-bugs 1.21.
  // Heuristic: track rendered widths, not declared fr — resolves minmax/auto.
  document.querySelectorAll('*').forEach((el) => {
    const style = getComputedStyle(el);
    if (!style.display.includes('grid')) return;
    const tmpl = style.gridTemplateColumns || '';
    const tracks = tmpl.trim().split(/\s+/).filter(Boolean);
    if (tracks.length !== 3) return;          // scoped to 3-col for now
    // Skip form rows (label + control + unit). The "left-weighted hero" reading
    // doesn't apply to data-entry patterns where the left column is a short
    // label and the middle is a wide control.
    if (el.querySelector('input, select, textarea, [contenteditable], output')) return;
    const children = [...el.children].filter((c) => {
      const cs = getComputedStyle(c);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    if (children.length < 3) return;
    const w = children.slice(0, 3).map((c) => c.getBoundingClientRect().width);
    if (w.some((x) => x < 40)) return;
    const restMin = Math.min(w[1], w[2]);
    const ratio = w[0] / restMin;
    if (ratio < 1.2) return;                   // near-symmetric, ignore
    // Skip if col-1 child spans the full row (grid-column: 1 / -1) — recommended pattern.
    const leadSpan = getComputedStyle(children[0]).gridColumnEnd;
    if (leadSpan === '-1' || (children[0].style.gridColumn || '').includes('1 / -1')) return;
    // Skip if leading card has a distinguishing visual anchor (dark bg or
    // thick chromatic left-border) — reads as "different material" not "just wider".
    const leadStyle = getComputedStyle(children[0]);
    const bgRgb = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(leadStyle.backgroundColor);
    const bgLum = bgRgb ? (0.299*+bgRgb[1] + 0.587*+bgRgb[2] + 0.114*+bgRgb[3]) / 255 : 1;
    const blw = parseFloat(leadStyle.borderLeftWidth || '0');
    if (bgLum < 0.25 || blw >= 3) return;
    issues.push({
      kind: 'asymmetric-first-col-hero',
      severity: 'warn',
      ratio: +ratio.toFixed(2),
      widths: w.map(Math.round),
      tmpl,
      hint: 'first col is ' + ratio.toFixed(2) + 'x the narrower peers; reads as "row pulled left" not "col-1 is hero". Prefer 1-hero-full-row + 2-col-alt, or center the wide column (1fr 1.2fr 1fr).',
    });
  });

  // ---------- 10) SVG text on same-colour shape ----------
  // Simple heuristic: for every <text> inside an SVG, find the first ancestor
  // shape (rect/circle/polygon/path) whose bbox contains the text's centre,
  // compare fills — if they differ by < 40 in RGB distance, contrast is too low.
  const colourDist = (r1, g1, b1, r2, g2, b2) =>
    Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
  const hexOrRgb = (s) => {
    if (!s) return null;
    if (s.startsWith('#')) {
      const h = s.length === 4 ? s.slice(1).split('').map((c) => parseInt(c+c, 16)) : [s.slice(1,3), s.slice(3,5), s.slice(5,7)].map((c) => parseInt(c, 16));
      return h.length === 3 ? h : null;
    }
    const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  };
  document.querySelectorAll('svg text').forEach((t) => {
    const rect = t.getBoundingClientRect();
    if (rect.width === 0) return;
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const textFill = hexOrRgb(t.getAttribute('fill') || getComputedStyle(t).fill);
    if (!textFill) return;
    const svg = t.closest('svg');
    if (!svg) return;
    // Find the deepest OPAQUE shape whose bbox contains the text centre.
    // Skip semi-transparent overlay rects (fill-opacity / opacity < 0.5) —
    // they're painterly overlays, the "true" background is beneath them.
    const shapes = [...svg.querySelectorAll('rect, circle, polygon, path, ellipse')];
    let best = null;
    for (const s of shapes) {
      const fillAttr = s.getAttribute('fill') || '';
      if (fillAttr.startsWith('url(') || fillAttr === 'none') continue;
      const st = getComputedStyle(s);
      const fillOp = parseFloat(st.fillOpacity || '1');
      const op = parseFloat(st.opacity || '1');
      if (fillOp < 0.5 || op < 0.5) continue;
      const sr = s.getBoundingClientRect();
      if (sr.width === 0 || sr.height === 0) continue;
      if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) continue;
      if (!best || (sr.width * sr.height < best.rect.width * best.rect.height)) {
        best = { shape: s, rect: sr };
      }
    }
    if (!best) return;
    const shapeFill = hexOrRgb(best.shape.getAttribute('fill') || getComputedStyle(best.shape).fill);
    if (!shapeFill) return;
    const d = colourDist(...textFill, ...shapeFill);
    if (d < 40) {
      issues.push({
        kind: 'svg-text-on-same-colour',
        severity: 'warn',
        distance: Math.round(d),
        text: (t.textContent || '').trim().slice(0, 30),
        textFill: `rgb(${textFill.join(',')})`,
        shapeFill: `rgb(${shapeFill.join(',')})`,
        svg: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

  // ---------- 11) Italic discipline (§J) ----------
  // Blanket italic on display headings reads as "wedding invitation," not
  // editorial. Count visible display headings; exclude ones living inside a
  // pull-quote (where italic is earned). If >40% are italic → warn.
  const DISPLAY_SELECTORS = [
    'h1', 'h2', 'h3',
    '.feat-title', '.tier-card__name', '.section-title',
    '.hero-headline', '.ref-card__name', '.canon-card__title',
    '.use-tile h3', '.faq-q', '.tier-card__price-num',
  ].join(', ');
  const displayHeadings = [...document.querySelectorAll(DISPLAY_SELECTORS)].filter((h) => {
    if (h.closest('blockquote, .ember-quote, .pull-quote-dark, .quote-dark, .sage-section--dark')) return false;
    const s = getComputedStyle(h);
    return s.display !== 'none' && s.visibility !== 'hidden';
  });
  if (displayHeadings.length >= 5) {
    const italics = displayHeadings.filter((h) => getComputedStyle(h).fontStyle === 'italic');
    const ratio = italics.length / displayHeadings.length;
    if (ratio > 0.4) {
      issues.push({
        kind: 'italic-overuse',
        severity: 'warn',
        italicCount: italics.length,
        totalCount: displayHeadings.length,
        pct: Math.round(ratio * 100),
        sample: italics.slice(0, 3).map((h) => (h.textContent || '').trim().slice(0, 30)),
      });
    }
  }

  // ---------- 12) Cross-skill smell ----------
  // If a sage page uses ember-gold or anthropic-orange, or apple uses Fraunces,
  // the page is visually impersonating another skill. Warn once per offending
  // signature so users know a cross-skill pattern slipped in.
  if (cs) {
    const smellMap = new Map();
    const allEls = document.querySelectorAll('body, body *');
    for (const el of allEls) {
      const st = getComputedStyle(el);
      // Font check — look at the primary family
      const ff = (st.fontFamily || '').toLowerCase();
      for (const f of cs.forbiddenFonts) {
        if (ff.includes(f.toLowerCase()) && !smellMap.has(`font:${f}`)) {
          // Ignore fallbacks — flag only when the forbidden font is the
          // FIRST entry in the stack (the one actually used if installed).
          const firstFamily = (st.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
          if (firstFamily === f.toLowerCase()) {
            smellMap.set(`font:${f}`, {
              kind: 'cross-skill-smell',
              severity: 'warn',
              type: 'font',
              foreign: f,
              skill: cs.skill,
              sample: ((el.tagName || '').toLowerCase()) + (el.className ? '.' + (typeof el.className === 'string' ? el.className : el.className.baseVal || '').split(' ').slice(0, 2).join('.') : ''),
              text: (el.textContent || '').trim().slice(0, 30),
            });
          }
        }
      }
      // Color check — bg / color / fill — skip if rect is 0
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (rect && (rect.width === 0 || rect.height === 0)) continue;
      const vals = [st.color, st.backgroundColor, st.fill, st.borderColor, st.borderTopColor].filter(Boolean);
      for (const c of vals) {
        const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) continue;
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        for (const fc of cs.forbiddenColors) {
          const [fr, fg, fb] = fc.rgb;
          const d = Math.sqrt((r-fr)*(r-fr) + (g-fg)*(g-fg) + (b-fb)*(b-fb));
          if (d < 22) {
            const key = `color:${fr},${fg},${fb}`;
            if (!smellMap.has(key)) {
              smellMap.set(key, {
                kind: 'cross-skill-smell',
                severity: 'warn',
                type: 'color',
                foreign: `rgb(${fr},${fg},${fb})`,
                foreignNote: fc.note,
                skill: cs.skill,
                sample: ((el.tagName || '').toLowerCase()) + (el.className ? '.' + (typeof el.className === 'string' ? el.className : el.className.baseVal || '').split(' ').slice(0, 2).join('.') : ''),
                text: (el.textContent || '').trim().slice(0, 30),
              });
            }
          }
        }
      }
    }
    for (const v of smellMap.values()) issues.push(v);
  }

  // ---------- 14) Keyboard accessibility ----------
  // (a) no-focus-style: the page has focusable elements, every one of them
  //     rests at outline:none, AND no stylesheet defines a :focus or
  //     :focus-visible rule anywhere — a keyboard user tabbing through gets
  //     no visible focus indicator. Conservative by design: if ANY stylesheet
  //     is unreadable (cross-origin cssRules throws), skip rather than guess.
  //     No real Tab traversal — headless focus simulation is unreliable.
  // (b) positive-tabindex: tabindex > 0 overrides natural DOM tab order and
  //     almost always breaks it for everything after the jump.
  {
    const focusables = [...document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]'
    )].filter((el) => {
      const st = getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden';
    });
    const positive = focusables.filter(
      (el) => parseInt(el.getAttribute('tabindex') || '', 10) > 0
    );
    if (positive.length > 0) {
      issues.push({
        kind: 'positive-tabindex',
        severity: 'warn',
        count: positive.length,
        sample: positive.slice(0, 3).map(
          (el) => `<${el.tagName.toLowerCase()} tabindex="${el.getAttribute('tabindex')}">`
        ),
      });
    }
    if (focusables.length >= 1 && document.styleSheets.length > 0) {
      // Node already scanned same-dir linked CSS (file:// sheets are opaque
      // origins in-page); remote sheets it couldn't scan keep the gate quiet.
      let focusRuleFound = arg.focusInExternalCss;
      const unreadableRemote = arg.remoteCssPresent;
      for (const sheet of document.styleSheets) {
        if (focusRuleFound) break;
        let rules = null;
        try { rules = sheet.cssRules; } catch { continue; } // linked file:// sheet — covered by the Node-side scan
        if (!rules) continue;
        for (const r of rules) {
          // cssText of grouping rules (@media etc.) includes child rule text.
          if ((r.cssText || '').includes(':focus')) { focusRuleFound = true; break; }
        }
      }
      const allOutlineNone = focusables.every((el) => {
        const st = getComputedStyle(el);
        return st.outlineStyle === 'none' || parseFloat(st.outlineWidth) === 0;
      });
      if (!focusRuleFound && !unreadableRemote && allOutlineNone) {
        issues.push({
          kind: 'no-focus-style',
          severity: 'warn',
          focusableCount: focusables.length,
        });
      }
    }
  }

  // ---------- 15b) Horizontal page overflow ----------
  // Any viewport: the root must not scroll sideways. Content wider than the
  // screen on a phone is the #1 "layout broken on mobile" symptom. Designed
  // pan areas (.glass-scroll / [data-scroll-x] / .glass-table-wrap) own their
  // overflow locally and never propagate to the root, so they pass.
  {
    const docW = document.documentElement.scrollWidth;
    if (docW > window.innerWidth + 2) {
      issues.push({
        kind: 'page-overflow-x',
        severity: 'error',
        docWidth: docW,
        viewport: window.innerWidth,
      });
    }
  }

  // ---------- 16) Glass-only material + motion-determinism checks ----------
  // glass-design is the one skill with heavy JS motion and translucent
  // panels, so it carries four extra gates:
  //  (a) glass-reveal-stuck   — this context runs prefers-reduced-motion:
  //      reduce, so every [data-reveal] MUST already sit at its terminal
  //      (visible) state. opacity<0.99 here means the freeze contract is
  //      broken and screenshots/checks below the fold are lies.
  //  (b) glass-fake-glass     — a "glass" page whose panels have no real
  //      backdrop-filter (or an opaque background pretending to be glass).
  //  (c) glass-countup-mismatch — [data-count-to] markup text must equal the
  //      declared target; under freeze the markup IS the final render.
  //  (d) glass-cta-obstructed — aurora/decoration layers must never eat
  //      clicks; elementFromPoint at each visible CTA centre must resolve to
  //      the CTA itself (missing pointer-events:none is the usual culprit).
  if (cs && cs.skill === 'glass') {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      if (parseFloat(st.opacity) < 0.99) {
        issues.push({
          kind: 'glass-reveal-stuck',
          severity: 'error',
          text: (el.textContent || '').trim().slice(0, 40),
          opacity: st.opacity,
        });
      }
    });

    const panels = [...document.querySelectorAll('.glass-panel, .glass-card, .glass-overlay, .glass-nav')];
    if (panels.length === 0) {
      issues.push({ kind: 'glass-no-material', severity: 'warn' });
    } else {
      const realGlass = panels.some((el) => {
        const st = getComputedStyle(el);
        const bf = st.backdropFilter || st.webkitBackdropFilter || 'none';
        const bg = parseRgb(st.backgroundColor);
        return bf !== 'none' && (!bg || bg.a < 0.9);
      });
      if (!realGlass) {
        issues.push({ kind: 'glass-fake-glass', severity: 'error', panelCount: panels.length });
      }
    }

    document.querySelectorAll('[data-count-to]').forEach((el) => {
      const want = parseFloat(el.getAttribute('data-count-to'));
      const got = parseFloat((el.textContent || '').replace(/[^0-9.\-]/g, ''));
      if (isFinite(want) && (!isFinite(got) || Math.abs(got - want) > 0.001)) {
        issues.push({
          kind: 'glass-countup-mismatch',
          severity: 'warn',
          markup: (el.textContent || '').trim().slice(0, 24),
          target: el.getAttribute('data-count-to'),
        });
      }
    });

    // Cyan TEXT in the light theme — the contrast gate only reads HTML text,
    // so a literal fill="#22D3EE" on SVG <text> slips through and renders at
    // ~1.7:1 on light panels. The sanctioned path is .glass-svg-accent-ink
    // (var(--glass-accent-ink) flips to #0E7490 in light), so under
    // --theme=light any computed cyan text fill is by definition a literal.
    // Caught by the gallery canonical's critic pass 2026-06-11 (known-bugs §6).
    if (arg.theme === 'light') {
      document.querySelectorAll('svg text').forEach((t) => {
        const f = parseRgb(getComputedStyle(t).fill || '');
        if (!f) return;
        const d = Math.sqrt((f.r - 34) ** 2 + (f.g - 211) ** 2 + (f.b - 238) ** 2);
        if (d < 40) {
          issues.push({
            kind: 'glass-cyan-svg-text',
            severity: 'error',
            text: (t.textContent || '').trim().slice(0, 40),
            fill: `rgb(${f.r},${f.g},${f.b})`,
          });
        }
      });
    } else {
      // Dark run (the default): aurora hues as TEXT die here instead.
      // Literal indigo #4F46E5 is ~2.7:1 on dark panels; violet/pink as text
      // are banned outright (dos-and-donts). The sanctioned indigo text path
      // .glass-svg-ref-ink computes #818CF8 in dark — distance 88 from the
      // indigo anchor and 38 from violet, so the radius is 30, not 40.
      const AURORA_TEXT = [
        { rgb: [79, 70, 229], name: 'indigo #4F46E5 (use .glass-svg-ref-ink)' },
        { rgb: [167, 139, 250], name: 'violet #A78BFA (never text)' },
        { rgb: [244, 114, 182], name: 'pink #F472B6 (never text)' },
      ];
      document.querySelectorAll('svg text').forEach((t) => {
        const f = parseRgb(getComputedStyle(t).fill || '');
        if (!f) return;
        for (const a of AURORA_TEXT) {
          const d = Math.sqrt((f.r - a.rgb[0]) ** 2 + (f.g - a.rgb[1]) ** 2 + (f.b - a.rgb[2]) ** 2);
          if (d < 30) {
            issues.push({
              kind: 'glass-aurora-text',
              severity: 'error',
              text: (t.textContent || '').trim().slice(0, 40),
              fill: `rgb(${f.r},${f.g},${f.b})`,
              hue: a.name,
            });
            break;
          }
        }
      });
    }

    document.querySelectorAll('.glass-button').forEach((el) => {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return;
      const hit = document.elementFromPoint(cx, cy);
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
        issues.push({
          kind: 'glass-cta-obstructed',
          severity: 'error',
          text: (el.textContent || '').trim().slice(0, 30),
          coveredBy: hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.split(' ').slice(0, 2).join('.') : ''),
        });
      }
    });
  }

  // ---------- 12c) layout-overflow + margin:auto centering (§1.32) ----------
  // The classic miss: a wide <table> bursting its max-width shell renders
  // 400px past the container edge and nothing flags it. Two checks:
  //  (a) content-bearing block elements whose bbox breaks out of their parent
  //  (b) elements TARGETED by a margin:auto rule that render off-center
  // Conservative scoping keeps this out of the false-positive factory:
  // static/relative only (absolute layers escape on purpose), parents that
  // scroll or clip horizontally are exempt, breakout must exceed 8px.
  const sigSelector = (el) =>
    el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].slice(0, 3).join('.') : '');
  document.querySelectorAll('table, pre, img, video, iframe, canvas, figure, svg').forEach((el) => {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return; // shapes inside svg
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return;
    if (st.position === 'absolute' || st.position === 'fixed' || st.position === 'sticky') return;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 24) return;
    const parent = el.parentElement;
    if (!parent || parent === document.body) return;
    const ps = getComputedStyle(parent);
    if (/(auto|scroll|hidden)/.test(ps.overflowX) || /(auto|scroll|hidden)/.test(ps.overflow)) return;
    const pr = parent.getBoundingClientRect();
    if (pr.width < 1) return;
    const rightBreak = r.right - pr.right;
    const leftBreak = pr.left - r.left;
    const breakPx = Math.max(rightBreak, leftBreak);
    if (breakPx > 8) {
      issues.push({
        kind: 'layout-overflow',
        severity: 'warn',
        selector: sigSelector(el),
        breakPx: Math.round(breakPx),
        side: rightBreak >= leftBreak ? 'right' : 'left',
        childBox: `L${Math.round(r.left)} R${Math.round(r.right)} W${Math.round(r.width)}`,
        parentBox: `L${Math.round(pr.left)} R${Math.round(pr.right)} W${Math.round(pr.width)}`,
      });
    }
  });
  // ---------- 12c2) text glyph spilling its own box (§1.33) ----------
  // The box-rect blind spot behind 1.32a/1.25: a display:block text element
  // with overflow:visible whose glyphs are WIDER than the element keeps its
  // border box at the (clamped) layout width. getBoundingClientRect() returns
  // that clamped box, so neither the overflow check (boxes vs parent) nor the
  // overlap check (box vs sibling box) sees anything — yet the glyphs spill out
  // and collide with the neighbour. scrollWidth reports the true content width
  // even under overflow:visible, so scrollWidth − clientWidth catches it at any
  // single viewport. Classic trigger: a big non-wrapping number/token in a grid
  // cell sized by `minmax(0, max-content)` — the 0 min lets the track shrink
  // below the glyph width, so the number overruns its cell into the next stat.
  // Scope: explicit display:block big-text loci (.glass-stat-number /
  // [data-no-wrap-text]) ALWAYS checked, plus a generalized sweep (issue #20
  // FU1) of any large non-wrapping text under overflow:visible — the same spill
  // can hit a wide heading or a metric in any skill, not just glass stats. The
  // generalized path is gated to display-size text (≥32px) so small nowrap UI
  // labels don't trip it, and skips pre/code (covered by layout-overflow) and
  // editable fields. Opt out with data-allow-text-overflow (marquee/ticker).
  {
    const glyphSeen = new Set();
    const flagGlyphSpill = (el, optIn) => {
      if (glyphSeen.has(el)) return;
      glyphSeen.add(el);
      if (el.hasAttribute('data-allow-text-overflow')) return;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      if (/(auto|scroll|hidden|clip)/.test(st.overflowX) || /(auto|scroll|hidden|clip)/.test(st.overflow)) return;
      if (!optIn) {
        // generalized path — only display-size non-wrapping text
        if (!/^(nowrap|pre)$/.test(st.whiteSpace)) return;
        if (parseFloat(st.fontSize) < 32) return;
        const tag = el.tagName.toLowerCase();
        if (tag === 'pre' || tag === 'code' || tag === 'svg' || el.closest('svg')) return;
        if (el.isContentEditable) return;
        // must directly hold non-empty text (not merely wrap children)
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasOwnText) return;
      }
      const spill = el.scrollWidth - el.clientWidth;
      if (spill > 3) {
        issues.push({
          kind: 'text-glyph-overflow',
          severity: 'error',
          selector: sigSelector(el),
          text: (el.textContent || '').trim().slice(0, 24),
          spillPx: Math.round(spill),
          boxW: el.clientWidth,
          contentW: el.scrollWidth,
          via: optIn ? 'opt-in' : 'generalized',
        });
      }
    };
    document.querySelectorAll('.glass-stat-number, [data-no-wrap-text]').forEach((el) => flagGlyphSpill(el, true));
    document.querySelectorAll('body *').forEach((el) => flagGlyphSpill(el, false));
  }

  // ---------- 12c3) grid track minmax(0, max-content) holding big text (§1.33b / issue #20 FU3) ----------
  // The CAUSE behind the stat-spill, caught statically so it flags even at a
  // width where nothing overruns yet: a grid whose track is declared
  // `minmax(0, max-content)` can shrink BELOW its content (the 0 minimum), so a
  // big non-wrapping number/token in that cell overruns into the next. Computed
  // style resolves the track to px and hides the expression, so this reads the
  // STYLESHEETS (same approach as the margin:auto scan below).
  {
    const riskyGridSelectors = new Set();
    const gridWalk = (list) => {
      for (const rule of list) {
        if (rule.style && rule.selectorText) {
          const gtc = (rule.style.gridTemplateColumns || rule.style.gridTemplate || '');
          if (/minmax\(\s*0(?:px|fr|%)?\s*,\s*max-content\s*\)/i.test(gtc)) riskyGridSelectors.add(rule.selectorText);
        }
        if (rule.cssRules && rule.cssRules.length) gridWalk(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      if (rules) gridWalk(rules);
    }
    const gridSeen = new Set();
    for (const sel of riskyGridSelectors) {
      let els; try { els = document.querySelectorAll(sel); } catch (e) { continue; }
      els.forEach((grid) => {
        if (gridSeen.has(grid)) return; gridSeen.add(grid);
        const gst = getComputedStyle(grid);
        if (gst.display.indexOf('grid') === -1) return;
        if (gst.display === 'none' || gst.visibility === 'hidden') return;
        const risky = [...grid.querySelectorAll('*')].find((c) => {
          const cs = getComputedStyle(c);
          if (!/^(nowrap|pre)$/.test(cs.whiteSpace)) return false;
          if (parseFloat(cs.fontSize) < 28) return false;
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          return (c.textContent || '').trim().length > 0;
        });
        if (risky) {
          issues.push({
            kind: 'grid-track-shrink-risk',
            severity: 'warn',
            selector: sigSelector(grid),
            sample: (risky.textContent || '').trim().slice(0, 24),
          });
        }
      });
    }
  }
  // (b) margin:auto intent must come from the STYLESHEETS — getComputedStyle
  // resolves auto margins to used px values, so we scan cssRules for
  // selectors declaring marginLeft/Right auto, then measure those elements.
  const autoSelectors = new Set();
  const walkRules = (list) => {
    for (const rule of list) {
      // NB: with CSS-nesting support every CSSStyleRule HAS a (usually
      // empty) .cssRules — test style first, then recurse, never either/or.
      if (rule.style && rule.selectorText &&
          rule.style.marginLeft === 'auto' && rule.style.marginRight === 'auto') {
        autoSelectors.add(rule.selectorText);
      }
      if (rule.cssRules && rule.cssRules.length) walkRules(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    if (rules) walkRules(rules);
  }
  const centeredSeen = new Set();
  for (const selText of autoSelectors) {
    let els; try { els = document.querySelectorAll(selText); } catch (e) { continue; }
    els.forEach((el) => {
      if (centeredSeen.has(el)) return; centeredSeen.add(el);
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      if (st.position === 'absolute' || st.position === 'fixed') return;
      if (st.display.indexOf('inline') === 0) return;
      const parent = el.parentElement;
      if (!parent) return;
      const pst = getComputedStyle(parent);
      // in flex/grid auto margins are an alignment tool, not centering intent
      if (pst.display.includes('flex') || pst.display.includes('grid')) return;
      const r = el.getBoundingClientRect();
      const pr = parent.getBoundingClientRect();
      if (r.width < 40 || pr.width - r.width < 24) return; // not meaningfully narrower
      const lGap = r.left - pr.left;
      const rGap = pr.right - r.right;
      if (Math.abs(lGap - rGap) > 12) {
        issues.push({
          kind: 'margin-auto-offcenter',
          severity: 'warn',
          selector: sigSelector(el),
          leftGap: Math.round(lGap),
          rightGap: Math.round(rGap),
          delta: Math.round(Math.abs(lGap - rGap)),
        });
      }
    });
  }

  return issues;
};
const evalArg = { crossSkill: crossSkillData, focusInExternalCss, remoteCssPresent, theme: themeArg };
let findings = await page.evaluate(auditFn, evalArg);

// ---------- 12d) Second-viewport geometry pass (issue #20 FU2) ----------
// The overlap/overflow checks above run at one width. A collision that's a
// near-miss at 1440 (grid tracks clamped wide) becomes a real overrun once the
// container shrinks — invisible to a single test width. Re-run the SAME checks
// at a narrower viewport and keep ONLY the width-sensitive geometry kinds, as
// warnings tagged with the width (so a desktop-first page is informed, never
// newly failed). Empirically clean: across the 31 canonical pages this surfaces
// ~1 real near-miss per width, not a flood. Skipped when the caller already
// asked for a narrow main viewport, or via --no-second-viewport.
if (secondViewport && VIEWPORT.width >= secondViewport.width + 80) {
  try {
    await page.setViewportSize(secondViewport); // Playwright resize API
    await page.waitForTimeout(150);             // let the layout reflow
    const narrow = await page.evaluate(auditFn, evalArg);
    const GEOM_KEEP = new Set(['text-overlap', 'text-glyph-overflow', 'layout-overflow', 'page-overflow-x']);
    const fkey = (f) => [f.kind, f.selector || '', f.text || '', f.textA || '', f.textB || '', f.tagA || '', f.tagB || ''].join('|');
    const seen = new Set(findings.map(fkey));
    for (const f of narrow) {
      if (!GEOM_KEEP.has(f.kind)) continue;
      const k = fkey(f);
      if (seen.has(k)) continue;
      seen.add(k);
      findings.push({ ...f, severity: 'warn', atNarrow: secondViewport.width });
    }
    await page.setViewportSize(VIEWPORT); // restore for the brand-presence screenshot
    await page.waitForTimeout(150);
  } catch {
    // best-effort — a flaky second pass must never kill the audit
  }
}

// ---------- 13) Brand-presence (pixel count in top hero region) ----------
// Root issue caught 2026-04-21: sage-design nav was a warm yellow (ember-
// cream rgba(255,242,223,...)) that made the top look ember, not sage. If
// the skill's signature color(s) are not visibly present in the top 500px
// of the 1440-wide viewport, the page fails to tell the reader "this is
// a <skill> page at first glance".
// Light theme is skipped: dark is the brand-canonical state for glass, and a
// single threshold can't fit both modes' coverage profiles.
if (skillId && themeArg !== 'light' && VIEWPORT.width === 1440) {
  const sig = SKILL_SIGNATURES[skillId];
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: 1440, height: 500 },
    type: 'png',
  });
  const png = PNG.sync.read(buf);
  let hits = 0;
  const { data, width, height } = png;
  // Tolerance 55: antialiased text on a light background blends toward
  // mid-tone; pure-match 35 misses most glyph pixels. 55 (distance² = 3025)
  // catches "color-family" pixels without false-flagging neutrals.
  const TOL_SQ = 55 * 55;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    for (const [ar, ag, ab] of sig.accents) {
      const dr = r - ar, dg = g - ag, db = b - ab;
      if (dr * dr + dg * dg + db * db < TOL_SQ) {
        hits++;
        break;
      }
    }
  }
  const total = width * height;
  const coverage = hits / total;
  if (coverage < sig.threshold) {
    findings.push({
      kind: 'no-brand-presence',
      severity: 'warn',
      skill: skillId,
      brandName: sig.name,
      coveragePct: +(coverage * 100).toFixed(2),
      thresholdPct: +(sig.threshold * 100).toFixed(2),
    });
  }
}

// ---------- 15) Performance — LCP / CLS (local render, indicative only) ----------
// Buffered PerformanceObserver readout taken ≥2s after goto (500ms settle
// above + 1500ms here), so late layout shifts are counted. Numbers from a
// file:// or localhost render are NOT field data — thresholds are loose on
// purpose (LCP > 4000ms, CLS > 0.1) so only egregious regressions fire and
// CI timing jitter never does. If the API is unavailable in this headless
// build, skip silently rather than fail the whole audit.
try {
  await page.waitForTimeout(1500);
  const perf = await page.evaluate(() => new Promise((done) => {
    const out = { lcp: null, cls: null };
    try {
      let lcp = 0;
      let cls = 0;
      const lcpObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) lcp = Math.max(lcp, e.startTime);
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      const clsObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) { if (!e.hadRecentInput) cls += e.value; }
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      // Buffered entries arrive asynchronously — give observers one beat.
      setTimeout(() => {
        lcpObs.disconnect();
        clsObs.disconnect();
        done({ lcp: lcp > 0 ? Math.round(lcp) : null, cls: +cls.toFixed(4) });
      }, 300);
    } catch { done(out); }
  }));
  if (perf.lcp !== null && perf.lcp > 4000) {
    findings.push({ kind: 'perf-lcp', severity: 'warn', lcp: perf.lcp });
  }
  if (perf.cls !== null && perf.cls > 0.1) {
    findings.push({ kind: 'perf-cls', severity: 'warn', cls: perf.cls });
  }
} catch {
  // PerformanceObserver / evaluate failed — perf numbers are advisory, never
  // worth killing the audit over.
}

await browser.close();
if (server) server.close();

// Filter out brand-intentional contrast findings if asked.
let suppressed = 0;
const visibleFindings = ignoreIntentional
  ? findings.filter((f) => {
      if (matchesIntentional(f)) { suppressed++; return false; }
      return true;
    })
  : findings;

const errors = visibleFindings.filter((i) => i.severity === 'error');
const warns = visibleFindings.filter((i) => i.severity === 'warn');

if (visibleFindings.length === 0) {
  const noise = suppressed > 0 ? ` (${suppressed} brand-intentional suppressed)` : '';
  console.log(`visual-audit: OK  (${target})${noise}`);
  process.exit(0);
}

const noise = suppressed > 0 ? ` · ${suppressed} brand-intentional suppressed` : '';
console.log(`visual-audit: ${errors.length} error(s), ${warns.length} warning(s)  (${target})${noise}`);
for (const i of visibleFindings) {
  if (i.kind === 'contrast') {
    console.log(
      `  [${i.severity}] contrast ${i.ratio}:1  fg=${i.fg} bg=${i.bg}  "${i.text}"  (${i.selector})`
    );
  } else if (i.kind === 'diagram-narrow') {
    console.log(
      `  [${i.severity}] hero diagram rendered at only ${i.renderedWidth}px — widen container or reduce card padding  (aria-label: "${i.label}")`
    );
  } else if (i.kind === 'diagram-tiny-text') {
    console.log(
      `  [${i.severity}] diagram smallest text renders at ${i.renderedPx}px (svg rendered ${i.renderedWidth ?? '?'}px wide) — bump font-size, tighten viewBox, or move the figure to a wider container  (aria-label: "${i.label}")`
    );
  } else if (i.kind === 'svg-letterbox') {
    console.log(
      `  [${i.severity}] svg-letterbox in "${i.label}": content fills only ${i.fillPct}% of the rendered ${i.axis} — shrink the viewBox to hug content (≤24px margins) or spread content across the canvas; dead margins shrink every label (known-bugs 1.28, diagram-craft §8)`
    );
  } else if (i.kind === 'dense-diagram-cramped') {
    console.log(
      `  [${i.severity}] dense diagram cramped: ${i.textCount} <text> labels rendered at only ${i.renderedWidth}px in "${i.label}" — a diagram this dense needs the wide container (anth-container--wide / 1200px) or splitting into two figures (known-bugs 1.29, diagram-craft §8)`
    );
  } else if (i.kind === 'diagram-monochrome') {
    console.log(
      `  [${i.severity}] diagram-monochrome: engineering diagram "${i.label}" (${i.nodeCount} nodes, ${i.textCount} labels) has zero saturated hues — reads gray/unfinished; this skill's accent must be present as a hue (anthropic ≥2 semantic hues · ember gold focus · sage green focus; tints don't count, use solid dots/badges/bars/lines), see the skill's diagram-craft.md (known-bugs 1.30)`
    );
  } else if (i.kind === 'text-desert') {
    console.log(
      `  [${i.severity}] text-desert: ${i.gap}px of continuous prose (y ${i.from}→${i.to}, page ${i.pageHeight}px) with no figure/stat/table/mock — diagram-density contract wants ≥1 visual per 1.5 screens; add a flow diagram, stat callout, or window mock (known-bugs 1.31, diagram-craft §12)`
    );
  } else if (i.kind === 'orphan-figure') {
    console.log(
      `  [${i.severity}] orphan figure "${i.label}" sits alone (${i.rendered}) next to full-row hero siblings — span 2 cols or center it`
    );
  } else if (i.kind === 'figure-no-caption') {
    console.log(
      `  [${i.severity}] <figure> without <figcaption>: "${i.label}" — SVG aria-label + inner <text> don't satisfy the semantic figure+caption pair; add real <figcaption> after </svg> (known-bugs 1.18)`
    );
  } else if (i.kind === 'svg-text-overlap') {
    console.log(
      `  [${i.severity}] SVG text overlap in "${i.svg}": "${i.textA}" [${i.rectA}] ↔ "${i.textB}" [${i.rectB}] — move one element or drop the decorative label`
    );
  } else if (i.kind === 'text-overlap') {
    console.log(
      `  [${i.severity}] text-overlap (${i.location}): <${i.tagA}> "${i.textA}" [${i.rectA}] ↔ <${i.tagB}> "${i.textB}" [${i.rectB}] — overlap ${i.overlap} — fix layout (column width / line gap / wrap policy) or add data-allow-overlap if intentional (known-bugs 1.25)${i.atNarrow ? ` [only at ${i.atNarrow}px viewport — width-dependent, §1.34]` : ''}`
    );
  } else if (i.kind === 'svg-shape-over-text') {
    console.log(
      `  [${i.severity}] svg-shape-over-text in "${i.svg}": <${i.shape} fill="${i.fill}"> drawn after & on top of text "${i.text}" [${i.textBbox}] — overlap ${i.overlap} — move shape, change DOM order (text after shape), set fill=none, or add data-allow-overlap if shape is same-bg-color (known-bugs 1.26)`
    );
  } else if (i.kind === 'multiple-h1') {
    console.log(
      `  [${i.severity}] ${i.count} <h1> elements on the page: ${i.texts.map((t) => `"${t}"`).join(', ')} — every page should have exactly one`
    );
  } else if (i.kind === 'no-h1') {
    console.log(`  [${i.severity}] ${i.note}`);
  } else if (i.kind === 'heading-skip') {
    console.log(
      `  [${i.severity}] heading level skipped: ${i.from} → ${i.to} at "${i.text}" — don't jump levels down, always step one`
    );
  } else if (i.kind === 'img-no-alt') {
    console.log(
      `  [${i.severity}] <img> without alt: ${i.src} — add alt="" for decorative or alt="description" for content`
    );
  } else if (i.kind === 'link-no-text') {
    console.log(
      `  [${i.severity}] <a> with no text, aria-label, or title: href=${i.href}`
    );
  } else if (i.kind === 'hollow-card') {
    console.log(
      `  [${i.severity}] hollow card in equal-width grid: ${i.dims} aspect=${i.aspect}:1 only ${i.chars} chars "${i.preview}…" — content too sparse for width, consider narrower container or 1-hero + N-alternatives layout`
    );
  } else if (i.kind === 'asymmetric-first-col-hero') {
    console.log(
      `  [${i.severity}] asymmetric 3-col grid, first col ${i.ratio}× wider (widths=${i.widths.join('/')}px, tmpl="${i.tmpl}") — ${i.hint} (known-bugs 1.21)`
    );
  } else if (i.kind === 'svg-text-on-same-colour') {
    console.log(
      `  [${i.severity}] SVG text colour too close to shape fill in "${i.svg}": "${i.text}" fg=${i.textFill} bg=${i.shapeFill} (RGB distance=${i.distance}) — probably unreadable`
    );
  } else if (i.kind === 'italic-overuse') {
    console.log(
      `  [${i.severity}] italic overuse: ${i.italicCount}/${i.totalCount} display headings are italic (${i.pct}%) — italic should be reserved for pull-quotes and single emphasis words, see cross-skill-rules §J. Sample: ${i.sample.map((s) => `"${s}"`).join(', ')}`
    );
  } else if (i.kind === 'cross-skill-smell') {
    if (i.type === 'font') {
      console.log(
        `  [${i.severity}] cross-skill smell: foreign font "${i.foreign}" used in ${i.skill}-design page (e.g. <${i.sample}>: "${i.text}") — that's another skill's signature font`
      );
    } else {
      console.log(
        `  [${i.severity}] cross-skill smell: foreign color ${i.foreign} (${i.foreignNote}) used in ${i.skill}-design page (e.g. <${i.sample}>: "${i.text}") — that's another skill's signature color`
      );
    }
  } else if (i.kind === 'saturated-band') {
    console.log(
      `  [${i.severity}] ${i.count} full-width saturated band(s) in diagram "${i.label}" (largest ${i.dims}, ${i.coveragePct}% of viewBox) — colour encodes meaning, it doesn't fill area; use 8-12% tints + accent bars + colored dots, keep full-saturation fills for ≤56px elements (known-bugs 1.27, diagram-craft.md)`
    );
  } else if (i.kind === 'no-brand-presence') {
    console.log(
      `  [${i.severity}] brand not visible in top region: "${i.brandName}" covers only ${i.coveragePct}% of top 1440×500 (threshold ${i.thresholdPct}%) — ${i.skill}-design page should carry its signature color in hero/nav so readers recognise the brand at first glance`
    );
  } else if (i.kind === 'no-focus-style') {
    console.log(
      `  [${i.severity}] no visible focus style: ${i.focusableCount} focusable element(s) but no :focus / :focus-visible rule in any stylesheet and resting outline is none — keyboard users can't see where they are; add a :focus-visible outline`
    );
  } else if (i.kind === 'positive-tabindex') {
    console.log(
      `  [${i.severity}] positive tabindex on ${i.count} element(s): ${i.sample.join(', ')} — tabindex > 0 hijacks natural tab order; use tabindex="0" + DOM order instead`
    );
  } else if (i.kind === 'perf-lcp') {
    console.log(
      `  [${i.severity}] LCP ${i.lcp}ms exceeds 4000ms (local render, indicative only) — largest content paints late; check render-blocking fonts/scripts and oversized hero assets`
    );
  } else if (i.kind === 'perf-cls') {
    console.log(
      `  [${i.severity}] CLS ${i.cls} exceeds 0.1 (local render, indicative only) — layout shifts after load; reserve space for late-loading elements (explicit dimensions, font fallback metrics)`
    );
  } else if (i.kind === 'layout-overflow') {
    console.log(
      `  [${i.severity}] layout-overflow: <${i.selector}> breaks ${i.breakPx}px past parent ${i.side} edge  child[${i.childBox}] parent[${i.parentBox}] — wrap in a horizontal scroller or constrain width  (§1.32)${i.atNarrow ? ` [only at ${i.atNarrow}px viewport — width-dependent, §1.34]` : ''}`
    );
  } else if (i.kind === 'text-glyph-overflow') {
    console.log(
      `  [${i.severity}] text-glyph-overflow${i.via === 'generalized' ? ' (any big non-wrapping text)' : ''}: <${i.selector}> "${i.text}" content ${i.contentW}px spills its ${i.boxW}px box by ${i.spillPx}px — the glyphs overrun the element (box-rect checks miss this); a non-wrapping big number in a grid cell sized by minmax(0, max-content) overruns into the next cell. Fix: minmax(max-content, 1fr) / wider track / smaller font / wrap; or data-allow-text-overflow if intentional (§1.33)${i.atNarrow ? ` [only at ${i.atNarrow}px viewport — width-dependent, §1.34]` : ''}`
    );
  } else if (i.kind === 'grid-track-shrink-risk') {
    console.log(
      `  [${i.severity}] grid-track-shrink-risk: <${i.selector}> declares a track minmax(0, max-content) and holds big non-wrapping text "${i.sample}" — the 0 minimum lets the track shrink below the content, so the text can overrun the next cell at narrower widths. Prefer minmax(max-content, 1fr) (or allow wrap) (§1.33b)`
    );
  } else if (i.kind === 'margin-auto-offcenter') {
    console.log(
      `  [${i.severity}] margin:auto block renders off-center: <${i.selector}> leftGap=${i.leftGap}px rightGap=${i.rightGap}px (Δ${i.delta}px) — check overflowing children / width overrides  (§1.32)`
    );
  } else if (i.kind === 'glass-reveal-stuck') {
    console.log(
      `  [${i.severity}] glass-reveal-stuck: [data-reveal] element still at opacity ${i.opacity} under prefers-reduced-motion ("${i.text}") — the freeze contract is broken; reveal initial state must be gated behind html.js-enabled:not([data-motion="off"]) (see glass-design motion.md)`
    );
  } else if (i.kind === 'glass-no-material') {
    console.log(
      `  [${i.severity}] glass-no-material: page detected as glass but has no .glass-panel/.glass-card/.glass-overlay/.glass-nav — either it isn't a glass page or the material system was bypassed`
    );
  } else if (i.kind === 'glass-fake-glass') {
    console.log(
      `  [${i.severity}] glass-fake-glass: ${i.panelCount} glass panel(s) but none has a live backdrop-filter with a translucent background — opaque panels with a blur declaration are decoration, not glass (glass-material.md tier table)`
    );
  } else if (i.kind === 'glass-countup-mismatch') {
    console.log(
      `  [${i.severity}] glass-countup-mismatch: markup text "${i.markup}" ≠ data-count-to="${i.target}" — the final value must live in the markup; JS only animates toward it (motion.md count-up contract)`
    );
  } else if (i.kind === 'glass-cta-obstructed') {
    console.log(
      `  [${i.severity}] glass-cta-obstructed: CTA "${i.text}" centre is covered by <${i.coveredBy}> — a decoration layer is eating clicks; add pointer-events:none to aurora/sheen layers`
    );
  } else if (i.kind === 'glass-cyan-svg-text') {
    console.log(
      `  [${i.severity}] glass-cyan-svg-text: SVG text "${i.text}" computes to ${i.fill} under the LIGHT theme (~1.7:1 on light panels) — a literal cyan fill; use class="glass-svg-accent-ink" so the ink flips to #0E7490 in light (known-bugs 6.4)`
    );
  } else if (i.kind === 'page-overflow-x') {
    console.log(
      `  [${i.severity}] page-overflow-x: document is ${i.docWidth}px wide in a ${i.viewport}px viewport — the page scrolls sideways; collapse the offending grid/figure or wrap it in a designed pan container (.glass-scroll / .glass-table-wrap)${i.atNarrow ? ` [surfaced by the ${i.atNarrow}px second-viewport pass — width-dependent, §1.34]` : ''}`
    );
  } else if (i.kind === 'glass-aurora-text') {
    console.log(
      `  [${i.severity}] glass-aurora-text: SVG text "${i.text}" computes to ${i.fill} (${i.hue}) on the dark theme — aurora hues are geometry/blob colors, not ink; route indigo labels through .glass-svg-ref-ink, never use violet/pink as text (known-bugs 6.4)`
    );
  }
}
process.exit(errors.length > 0 ? 1 : 0);
