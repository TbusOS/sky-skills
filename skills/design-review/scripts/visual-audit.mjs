// Visual audit — renders the HTML in Playwright and flags classes of bugs
// that static source-scanning misses:
//   1. CTAs / buttons with low-contrast text (cream on dark-brown, etc.)
//   2. Hero-row diagrams that render too narrow (<900px → text becomes illegible)
//   3. SVG <text> that renders under 9px on a 1440-wide viewport
//   4. Orphan figure cards in multi-col grids next to full-row hero siblings
//   5. SVG text elements whose rendered bounding boxes overlap (e.g. rotated
//      decorative text intersecting static labels) — known-bugs 1.8
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
import { extname, resolve } from 'node:path';
import process from 'node:process';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const ignoreIntentional = args.includes('--ignore-intentional');
const target = args.filter((a) => !a.startsWith('--'))[0];
if (!target) {
  console.error('usage: node visual-audit.mjs [--ignore-intentional] <html-path>');
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
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif'],
  },
  apple: {
    name: 'apple blue',
    accents: [[0, 113, 227]],          // #0071E3
    threshold: 0.0002,                 // apple is minimalist; even tiny blue signals OK
    forbiddenColors: [
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
    ],
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora'],
  },
  ember: {
    name: 'ember gold',
    accents: [[196, 148, 100]],        // #c49464
    threshold: 0.0001,                 // gold is a hairline/accent — catch total absence only
    forbiddenColors: [
      { rgb: [0, 113, 227], note: 'apple brand blue #0071E3' },
      { rgb: [151, 176, 119], note: 'sage green #97B077' },
    ],
    forbiddenFonts: ['Instrument Serif', 'Poppins', 'Lora'],
  },
  sage: {
    name: 'sage green',
    accents: [[151, 176, 119], [212, 225, 184]],  // #97B077 + pale sage
    threshold: 0.015,                  // sage must carry visibly green identity — real nav band
    forbiddenColors: [
      { rgb: [196, 148, 100], note: 'ember gold #c49464' },
      { rgb: [217, 119, 87], note: 'anthropic orange #d97757' },
    ],
    forbiddenFonts: ['Fraunces', 'Poppins', 'Lora'],
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
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Read the HTML so we can detect the skill, then pass cross-skill-smell
// data into page.evaluate. The smell check needs to know this skill's
// forbidden foreign signatures.
const rawHtml = await readFile(resolve(root, target), 'utf-8').catch(() => '');
const skillId = detectSkill(target, rawHtml);
const crossSkillData = skillId
  ? {
      skill: skillId,
      forbiddenColors: SKILL_SIGNATURES[skillId].forbiddenColors,
      forbiddenFonts: SKILL_SIGNATURES[skillId].forbiddenFonts,
    }
  : null;

const findings = await page.evaluate((cs) => {
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
  // Walk up ancestors to find first non-transparent background
  const effectiveBg = (el) => {
    let node = el;
    while (node && node !== document.body.parentElement) {
      const c = parseRgb(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.05) return c;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  // ---------- 1) Button / CTA contrast audit ----------
  // Cross-skill CTA selectors — add here when a new skill ships.
  const ctaSelectors = [
    '.apple-link', '.apple-badge', 'button',
    '.anth-button', '.anth-badge',
    '.ember-button', '.ember-badge', '.ember-nav-brand',
    '.sage-button', '.sage-badge',
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

    // Smallest readable text inside the hero SVG (rendered px)
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    const vbW = vb[2] || 0;
    const scale = vbW ? rect.width / vbW : 1;
    let minText = Infinity;
    svg.querySelectorAll('text').forEach((t) => {
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
        label: svg.getAttribute('aria-label') || 'unlabeled',
      });
    }
  });

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
    const leaves = [...document.querySelectorAll('*')].filter((el) => {
      if (el.children.length > 0) return false;
      const txt = (el.textContent || '').trim();
      if (!txt) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
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

  return issues;
}, crossSkillData);

// ---------- 13) Brand-presence (pixel count in top hero region) ----------
// Root issue caught 2026-04-21: sage-design nav was a warm yellow (ember-
// cream rgba(255,242,223,...)) that made the top look ember, not sage. If
// the skill's signature color(s) are not visibly present in the top 500px
// of the 1440-wide viewport, the page fails to tell the reader "this is
// a <skill> page at first glance".
if (skillId) {
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
      `  [${i.severity}] hero diagram smallest text renders at ${i.renderedPx}px — bump font-size or tighten viewBox  (aria-label: "${i.label}")`
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
      `  [${i.severity}] text-overlap (${i.location}): <${i.tagA}> "${i.textA}" [${i.rectA}] ↔ <${i.tagB}> "${i.textB}" [${i.rectB}] — overlap ${i.overlap} — fix layout (column width / line gap / wrap policy) or add data-allow-overlap if intentional (known-bugs 1.25)`
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
  } else if (i.kind === 'no-brand-presence') {
    console.log(
      `  [${i.severity}] brand not visible in top region: "${i.brandName}" covers only ${i.coveragePct}% of top 1440×500 (threshold ${i.thresholdPct}%) — ${i.skill}-design page should carry its signature color in hero/nav so readers recognise the brand at first glance`
    );
  }
}
process.exit(errors.length > 0 ? 1 : 0);
