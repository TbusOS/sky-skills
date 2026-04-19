// Visual audit — renders the HTML in Playwright and flags the classes of bugs
// that static source-scanning misses:
//   1. CTAs / buttons with low-contrast text (cream on dark-brown, etc.)
//   2. Hero-row diagrams that render too narrow (<900px → text becomes illegible)
//   3. SVG <text> that renders under 9px on a 1440-wide viewport
//
// Usage:
//   node skills/apple-design/scripts/visual-audit.mjs demos/apple-design/index.html
//
// Exit code 0 = pass, 1 = issues found. Run from repo root.
// Requires: playwright  (npm i playwright --no-save, then npx playwright install chromium)

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import process from 'node:process';

const [, , target] = process.argv;
if (!target) {
  console.error('usage: node visual-audit.mjs <html-path>');
  process.exit(2);
}

const root = process.cwd();
const mime = { '.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2' };
const PORT = 8801;
const server = createServer(async (req, res) => {
  try {
    const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    const s = await stat(p); if (s.isDirectory()) throw 0;
    res.writeHead(200, { 'Content-Type': mime[extname(p)] ?? 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404).end(); }
}).listen(PORT);

const url = `http://localhost:${PORT}/${target.replace(/^\/+/, '')}`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const findings = await page.evaluate(() => {
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

  return issues;
});

await browser.close();
server.close();

const errors = findings.filter((i) => i.severity === 'error');
const warns = findings.filter((i) => i.severity === 'warn');

if (findings.length === 0) {
  console.log(`visual-audit: OK  (${target})`);
  process.exit(0);
}

console.log(`visual-audit: ${errors.length} error(s), ${warns.length} warning(s)  (${target})`);
for (const i of findings) {
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
  }
}
process.exit(errors.length > 0 ? 1 : 0);
