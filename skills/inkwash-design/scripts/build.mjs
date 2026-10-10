#!/usr/bin/env node
// build.mjs — draws every ink-wash figure and writes the showcase pages.
//
//   node skills/inkwash-design/scripts/build.mjs           write templates/figures/ and demos/inkwash-design/
//   node skills/inkwash-design/scripts/build.mjs --check   write nothing; exit 1 if anything on disk differs
//   node skills/inkwash-design/scripts/build.mjs --only=ink-tones   draw one figure (dev), print where it went
//
// Why generated: the figures are code (templates/src/*.mjs, drawn with assets/brush.js
// + assets/props.js), so the code is the source and the SVG is output. A gallery that
// says "48 figures" counts them here instead of by hand, and --check catches an SVG
// edited by hand or a source changed without a rebuild.
//
// Also checked on every run (the build stops if one fails):
//   - every text colour in ink.css is ≥ 4.5:1 on paper and card, light and dark (R-N05)
//   - no figure has more than 800 strokes (R-N06, P0 spike 3)
//   - every character written in a brush font (figures + pages) is in the brush-font
//     subsets (scripts/fonts.py); a missing one would silently fall back to system Kaiti
//
// Inputs   templates/src/*.mjs           export default [ {id, cat, w, h, title, desc, motion, draw(B, P, ctx)} ]
//          assets/ink.css                tokens + drawing classes, copied into each standalone SVG
//          site/inkwash-design/*.tpl     page templates with {{…}} placeholders
// Outputs  templates/figures/<id>.svg    standalone, follows the system light / dark setting
//          templates/figures/index.json  id, category, size, title, motion, duration, strokes
//          demos/inkwash-design/*.html   pages
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(HERE, '..');
const ROOT = resolve(SKILL, '../..');
const Brush = require(join(SKILL, 'assets/brush.js'));
const Props = require(join(SKILL, 'assets/props.js'));

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').slice(7);
const SRC = (args.find(a => a.startsWith('--src=')) || '').slice(6);
export const FILTERS = Brush.filters();
export const MAX_STROKES = 800;

function cssText() { return readFileSync(join(SKILL, 'assets/ink.css'), 'utf8'); }
export function figCss() {
  const css = cssText();
  const a = css.indexOf('/* ── 1 tokens'), b = css.indexOf('/* ── 3 page pieces');
  if (a < 0 || b < 0) throw new Error('ink.css: section markers "── 1 tokens" / "── 3 page pieces" not found');
  return css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};:,>])\s*/g, '$1');
}

// ── contrast (R-N05) ─────────────────────────────────────────────────────
function tokens(block) { const o = {}; for (const m of block.matchAll(/--(ink-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) o[m[1]] = m[2]; return o; }
function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
export function contrastProblems(css = cssText()) {
  const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf(':root[data-theme="dark"]')));
  const dark = { ...light, ...tokens(css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('@media (prefers-color-scheme: dark)'))) };
  const TEXT = ['ink-jiao', 'ink-nong', 'ink-zhong', 'ink-t-huaqing', 'ink-t-zheshi', 'ink-t-shilv', 'ink-t-shiqing', 'ink-t-zhusha', 'ink-t-yanzhi'];
  const bad = [];
  for (const [name, T] of [['light', light], ['dark', dark]])
    for (const t of TEXT) for (const bg of ['ink-paper', 'ink-card']) {
      if (!T[t] || !T[bg]) { bad.push(`${name}: --${t} or --${bg} missing`); continue; }
      const r = ratio(T[t], T[bg]);
      if (r < 4.5) bad.push(`${name}: --${t} ${T[t]} on --${bg} ${T[bg]} is ${r.toFixed(2)}:1 (< 4.5)`);
    }
  return bad;
}

// Characters written in a brush font: figure text with f-brush / f-xing / f-long, and page
// elements whose class names one of the brush styles. Both languages, since English
// titles use the brush fonts too.
const BRUSH_CLS = /\b(f-brush|f-xing|f-long|ink-title|ink-poem|ink-big|ink-brush)\b/;
export function brushChars(results, pages) {
  const set = new Set();
  const add = t => { for (const ch of t.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')) if (ch.codePointAt(0) > 0x7f) set.add(ch); };
  for (const r of results) for (const m of r.labels.matchAll(/<text[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g)) if (BRUSH_CLS.test(m[1])) add(m[2]);
  for (const html of pages) for (const m of html.matchAll(/<(h1|h2|h3|p|span|div|b|strong|em|figcaption|a|li|text)\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/g)) if (BRUSH_CLS.test(m[2])) add(m[3]);
  // pages.css sets every h1 and h2 in the brush font
  for (const html of pages) for (const m of html.matchAll(/<(h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/g)) add(m[2]);
  return [...set].sort().join('');
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

async function loadFigures() {
  const dir = join(SKILL, 'templates/src');
  const files = readdirSync(dir).filter(f => f.endsWith('.mjs') && (!SRC || f === SRC)).sort();
  const figs = [], seen = new Set();
  for (const f of files) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    for (const fig of mod.default) {
      if (seen.has(fig.id)) throw new Error(`duplicate figure id ${fig.id} (${f})`);
      seen.add(fig.id);
      figs.push({ ...fig, src: `templates/src/${f}` });
    }
  }
  return figs;
}

// Figures without motion are still drawn on a timeline, so a reader can press
// "watch it drawn"; data-still shows them finished until then.
// Categories starting with "_" are page parts, not gallery figures.
export function draw(fig, taste) {
  const B = Brush.create({ seed: fig.seed || 1, id: 'f-' + fig.id, taste });
  const ctx = {};
  if (fig.motion) fig.draw(B, Props, ctx);
  else B.at(0, fig.drawDur || 5, () => fig.draw(B, Props, ctx));
  const r = { fig, art: B.art(), labels: B.labels(), defs: B.defs(), css: B.css(), dur: B.duration, strokes: B.count(), ctx };
  if (r.strokes > MAX_STROKES) throw new Error(`${fig.id}: ${r.strokes} strokes, limit ${MAX_STROKES} (P0 spike 3: beyond this a software-rendered page cannot keep up)`);
  return r;
}
const isPage = f => f.cat.startsWith('_');
function label(fig) { return `${fig.title.zh} — ${fig.desc ? fig.desc.zh : ''}`.replace(/ — $/, ''); }

function paperAndInk(r, fig) {
  return `<rect class="paper" width="${fig.w}" height="${fig.h}"/>` + (fig.fiber === false ? '' : `<rect class="fiber" width="${fig.w}" height="${fig.h}" filter="url(#ink-fiber)"/>`) +
    (fig.under ? fig.under(fig) : '') +
    `<g class="ink" filter="url(#ink-rough)">${r.art}</g><g>${r.labels}</g>`;
}

export function standalone(r, base) {
  const { fig } = r;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fig.w} ${fig.h}" width="${fig.w}" height="${fig.h}" class="ifig" role="img" aria-label="${esc(label(fig))}"${fig.paper === 'dark' ? ' data-paper="dark"' : ''}${fig.motion ? '' : ' data-still=""'}>` +
    `<title>${esc(fig.title.zh)} · ${esc(fig.title.en)}</title>` +
    `<style>@import url(../../assets/fonts.css);${base}${r.css}</style><defs>${FILTERS}${r.defs}</defs>` + paperAndInk(r, fig) + `</svg>\n`;
}

// The narrowest width at which the smallest label still renders at 9.2 px (check_objective O4: 9 px).
export function panWidth(r) {
  const sizes = [...r.labels.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
  if (!sizes.length) return 0;
  return Math.ceil(r.fig.w * 9.2 / Math.min(...sizes));
}

// Inline version for pages: no tokens (the page has them), filters defined once per page,
// the figure's own masks and gradients in its own <defs>.
export function inline(r, o = {}) {
  const { fig } = r;
  const motion = fig.motion ? ` data-motion="1" data-dur="${r.dur}"` : ` data-still="" data-dur="${r.dur}"`;
  const pw = o.shrink ? 0 : panWidth(r);
  const minw = pw > 0 && pw < fig.w ? `min-width:${pw}px;` : pw >= fig.w ? `min-width:${fig.w}px;` : '';
  const extra = (o.shrink ? ' data-allow-shrink=""' : '') + ` style="${minw}--fw:${fig.w}px;--ar:${(fig.w / fig.h).toFixed(3)}"` + (o.taste ? ` data-taste="${esc(o.taste)}"` : '');
  return `<svg viewBox="0 0 ${fig.w} ${fig.h}" class="ifig${o.cls ? ' ' + o.cls : ''}" role="img" aria-label="${esc(label(fig))}" data-fig="${fig.id}"${fig.paper === 'dark' ? ' data-paper="dark"' : ''}${motion}${extra}>` +
    (r.css ? `<style>${r.css}</style>` : '') + (r.defs ? `<defs>${r.defs}</defs>` : '') + paperAndInk(r, fig) + `</svg>`;
}

const outputs = new Map();
let fontNote = '';
function emit(path, content) { outputs.set(path, content); }

export function renderPage(tplPath, results, cats) {
  let s = readFileSync(tplPath, 'utf8');
  const byId = new Map(results.map(r => [r.fig.id, r]));
  s = s.replace(/\{\{fig:([a-z0-9-]+)(?:\|([a-z -]+))?\}\}/g, (_, id, cls) => {
    const r = byId.get(id);
    if (!r) throw new Error(`${relative(ROOT, tplPath)}: unknown figure ${id}`);
    const shrink = /\bshrink\b/.test(cls || '');
    return `<div class="ipan">${inline(r, { cls: (cls || '').replace(/\bshrink\b/, '').trim(), shrink })}</div>`;
  });
  s = s.replace(/\{\{desc:([a-z0-9-]+)\}\}/g, (_, id) => {
    const r = byId.get(id);
    if (!r || !r.fig.desc) throw new Error(`${relative(ROOT, tplPath)}: no description for figure ${id}`);
    return `<span class="lang-zh">${esc(r.fig.desc.zh)}</span><span class="lang-en">${esc(r.fig.desc.en)}</span>`;
  });
  s = s.replace(/\{\{title:([a-z0-9-]+)\}\}/g, (_, id) => {
    const r = byId.get(id);
    if (!r) throw new Error(`${relative(ROOT, tplPath)}: unknown figure ${id}`);
    return `<span class="lang-zh">${esc(r.fig.title.zh)}</span><span class="lang-en">${esc(r.fig.title.en)}</span>`;
  });
  s = s.replace('{{filters}}', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${FILTERS}</defs></svg>`);
  const gal = results.filter(r => !isPage(r.fig));
  s = s.replace(/\{\{count:([a-z-]+)\}\}/g, (_, c) => {
    if (c === 'all') return String(gal.length);
    if (c === 'motion') return String(gal.filter(r => r.fig.motion).length);
    if (c === 'static') return String(gal.filter(r => !r.fig.motion).length);
    if (c === 'cats') return String(cats.filter(k => gal.some(r => r.fig.cat === k.id)).length);
    const n = results.filter(r => r.fig.cat === c).length;
    if (!n) throw new Error(`count of empty category ${c}`);
    return String(n);
  });
  s = s.replace('{{gallery}}', () => gallery(results, cats));
  s = s.replace('{{gallery-nav}}', () => cats.filter(c => results.some(r => r.fig.cat === c.id)).map(c =>
    `<a href="#${c.id}"${c.highlight ? ' class="hi"' : ''}><span class="lang-zh">${c.nav.zh}</span><span class="lang-en">${c.nav.en}</span>` +
    (c.highlight ? '<span class="hi-tag"><span class="lang-zh">亮点</span><span class="lang-en">key idea</span></span>' : '') + '</a>').join('\n    '));
  s = s.replace(/\{\{json:figures\}\}/g, () => JSON.stringify(gal.map(r => ({ id: r.fig.id, cat: r.fig.cat, dur: r.dur, motion: !!r.fig.motion }))));
  if (/\{\{[^}]+\}\}/.test(s)) throw new Error(`${relative(ROOT, tplPath)}: unreplaced ${s.match(/\{\{[^}]+\}\}/)[0]}`);
  return s;
}

function gallery(results, cats) {
  let n = 0;
  return cats.map(c => {
    const list = results.filter(r => r.fig.cat === c.id);
    if (!list.length) return '';
    return `<section class="gal-sec" id="${c.id}"><div class="gal-head"><h2><span class="lang-zh">${c.zh}</span><span class="lang-en">${c.en}</span></h2>` +
      `<p><span class="lang-zh">${c.dzh}</span><span class="lang-en">${c.den}</span></p></div><div class="gal-grid">` +
      list.map(r => {
        const f = r.fig; n++;
        return `<figure class="gal-card${f.wide ? ' gal-card--wide' : ''}" id="fig-${f.id}"><div class="gal-stage ipan">${inline(r)}</div>` +
          `<figcaption><b><span class="gal-n">${String(n).padStart(2, '0')}</span> <span class="lang-zh">${esc(f.title.zh)}</span><span class="lang-en">${esc(f.title.en)}</span></b>` +
          (f.motion ? `<span class="ink-tag"><span class="lang-zh">动图 ${r.dur}s</span><span class="lang-en">motion ${r.dur}s</span></span>` : '') +
          `<span class="gal-desc"><span class="lang-zh">${esc(f.desc.zh)}</span><span class="lang-en">${esc(f.desc.en)}</span></span>` +
          `<span class="gal-act">` +
          `<button type="button" class="ink-btn gal-play" data-play="${f.id}"${f.motion ? '' : ' data-sketch="1"'}><span class="lang-zh">${f.motion ? '▶ 再画一遍' : '✎ 看它怎么画'}</span><span class="lang-en">${f.motion ? '▶ Draw again' : '✎ Watch it drawn'}</span></button>` +
          `<a class="ink-btn" href="../../skills/inkwash-design/templates/figures/${f.id}.svg" download><span class="lang-zh">下载 SVG</span><span class="lang-en">SVG</span></a>` +
          `<a class="ink-btn" href="https://github.com/TbusOS/sky-skills/blob/main/skills/inkwash-design/${f.src}"><span class="lang-zh">源码</span><span class="lang-en">Code</span></a>` +
          `</span></figcaption></figure>`;
      }).join('') + `</div></section>`;
  }).join('');
}

async function main() {
  const bad = contrastProblems();
  if (bad.length) { console.error('text colours below 4.5:1 (R-N05):\n  ' + bad.join('\n  ')); process.exit(1); }
  const figs = await loadFigures();
  const base = figCss();
  const pick = ONLY ? figs.filter(f => f.id === ONLY) : figs;
  if (ONLY && !pick.length) { console.error(`no figure ${ONLY}`); process.exit(2); }
  const results = pick.map(f => draw(f));
  for (const r of results) if (!isPage(r.fig)) emit(join(SKILL, 'templates/figures', r.fig.id + '.svg'), standalone(r, base));
  if (!ONLY && !SRC) {
    const cats = JSON.parse(readFileSync(join(SKILL, 'templates/categories.json'), 'utf8'));
    const unknown = results.filter(r => !isPage(r.fig) && !cats.some(c => c.id === r.fig.cat));
    if (unknown.length) throw new Error('figures in unknown categories: ' + unknown.map(r => r.fig.id + ':' + r.fig.cat).join(', '));
    emit(join(SKILL, 'templates/figures/index.json'), JSON.stringify(results.filter(r => !isPage(r.fig)).map(r => ({
      id: r.fig.id, cat: r.fig.cat, w: r.fig.w, h: r.fig.h, motion: !!r.fig.motion, duration: r.dur, strokes: r.strokes,
      title: r.fig.title, desc: r.fig.desc, src: r.fig.src,
    })), null, 1) + '\n');
    const tdir = join(ROOT, 'site/inkwash-design'), pages = [];
    if (existsSync(tdir)) for (const t of readdirSync(tdir).filter(f => f.endsWith('.html.tpl')).sort()) {
      const html = renderPage(join(tdir, t), results, cats);
      pages.push(html);
      emit(join(ROOT, 'demos/inkwash-design', t.replace(/\.tpl$/, '')), html);
    }
    const chars = brushChars(results, pages);
    emit(join(SKILL, 'assets/fonts/brush-chars.txt'), chars + '\n');
    const sj = join(SKILL, 'assets/fonts/subset.json');
    const have = existsSync(sj) ? JSON.parse(readFileSync(sj, 'utf8')).chars : '';
    const missing = [...chars].filter(c => !have.includes(c));
    if (missing.length) {
      fontNote = `${missing.length} brush-font character(s) not in the subsets: ${missing.slice(0, 40).join('')}${missing.length > 40 ? '…' : ''}\n  run: python3 skills/inkwash-design/scripts/fonts.py   (after this build has written brush-chars.txt)`;
    }
  }
  let diff = 0;
  for (const [p, c] of outputs) {
    const cur = existsSync(p) ? readFileSync(p, 'utf8') : null;
    if (CHECK) { if (cur !== c) { diff++; console.log('differs: ' + relative(ROOT, p)); } continue; }
    if (cur !== c) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); }
  }
  const g = results.filter(r => !isPage(r.fig));
  if (fontNote) { console.error(fontNote); if (CHECK) diff++; else process.exitCode = 1; }
  if (CHECK) {
    const want = new Set(g.map(r => r.fig.id + '.svg'));
    const fdir = join(SKILL, 'templates/figures');
    if (!ONLY && !SRC && existsSync(fdir)) for (const f of readdirSync(fdir).filter(f => f.endsWith('.svg')))
      if (!want.has(f)) { diff++; console.log('no source for: templates/figures/' + f); }
    console.log(diff ? `${diff} file(s) out of date — run: node skills/inkwash-design/scripts/build.mjs` : `up to date: ${g.length} figures, ${outputs.size} files`);
    process.exit(diff ? 1 : 0);
  }
  console.log(`${g.length} figures (${g.filter(r => r.fig.motion).length} animated, most strokes ${Math.max(0, ...g.map(r => r.strokes))}) + ${results.length - g.length} page parts · ${outputs.size} files written or unchanged`);
  if (ONLY) console.log(join(SKILL, 'templates/figures', ONLY + '.svg'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.stack || e); process.exit(2); });
