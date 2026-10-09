#!/usr/bin/env node
// build.mjs — draws every figure and writes the showcase pages.
//
//   node skills/graphite-design/scripts/build.mjs           write templates/figures/ and demos/graphite-design/
//   node skills/graphite-design/scripts/build.mjs --check   write nothing; exit 1 if anything on disk differs
//   node skills/graphite-design/scripts/build.mjs --only=robot-desk   draw one figure (dev), print where it went
//
// Why generated: the figures are code (templates/src/*.mjs, drawn with
// assets/sketch.js + assets/props.js), so the code is the source and the SVG is
// output. A gallery that lists "36 figures" counts them here instead of by hand,
// and --check catches an SVG edited by hand or a source changed without a rebuild.
//
// Inputs   templates/src/*.mjs           figure definitions (export default [ {id, …, draw(S, P)} ])
//          assets/graphite.css           tokens + drawing classes, copied into each standalone SVG
//          site/graphite-design/*.tpl    page templates with {{…}} placeholders
// Outputs  templates/figures/<id>.svg    standalone, follows the system light / dark setting
//          templates/figures/index.json  id, category, size, title, motion, duration
//          demos/graphite-design/*.html  pages
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(HERE, '..');
const ROOT = resolve(SKILL, '../..');
const Sketch = require(join(SKILL, 'assets/sketch.js'));
const Props = require(join(SKILL, 'assets/props.js'));

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').slice(7);
const SRC = (args.find(a => a.startsWith('--src=')) || '').slice(6);   // dev: load only this templates/src file

// The pencil filter lives in sketch.js (Sketch.filters) so pages, this builder and
// anyone else's code use the same one. House style = default taste values.
export const FILTERS = Sketch.filters();

function figCss() {
  const css = readFileSync(join(SKILL, 'assets/graphite.css'), 'utf8');
  const a = css.indexOf('/* ── 1 tokens'), b = css.indexOf('/* ── 3 page pieces');
  if (a < 0 || b < 0) throw new Error('graphite.css: section markers "── 1 tokens" / "── 3 page pieces" not found');
  return css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};:,>])\s*/g, '$1');
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

// Figures without motion are still drawn on a timeline (the whole drawing in one
// S.at), so a reader can press "watch it drawn"; data-still shows them finished
// until then. Categories starting with "_" are page parts, not gallery figures.
function draw(fig) {
  const S = Sketch.create({ seed: fig.seed || 1, id: 'f-' + fig.id, rough: fig.rough });
  const ctx = {};
  if (fig.motion) fig.draw(S, Props, ctx);
  else S.at(0, fig.drawDur || 5, () => fig.draw(S, Props, ctx));
  return { fig, art: S.art(), labels: S.labels(), css: S.css(), dur: S.duration, ctx };
}
const isPage = f => f.cat.startsWith('_');

function label(fig) { return `${fig.title.zh} — ${fig.desc ? fig.desc.zh : ''}`.replace(/ — $/, ''); }

export function standalone(r, base) {
  const { fig } = r;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fig.w} ${fig.h}" width="${fig.w}" height="${fig.h}" class="gfig" role="img" aria-label="${esc(label(fig))}"${fig.motion ? '' : ' data-still=""'}>` +
    `<title>${esc(fig.title.zh)} · ${esc(fig.title.en)}</title>` +
    `<style>${base}${r.css}</style><defs>${FILTERS}</defs>` +
    `<rect class="paper" width="${fig.w}" height="${fig.h}"/><rect width="${fig.w}" height="${fig.h}" filter="url(#g-tooth)"/>` +
    (fig.under ? fig.under(fig) : '') +
    `<g filter="url(#g-pencil)">${r.art}</g><g>${r.labels}</g></svg>\n`;
}

// The narrowest width at which the smallest label still renders at 9.2 px (O4 limit: 9). Pages wrap
// a figure in a frame that pans sideways below that width (check_objective O4 fails
// any SVG text under 9 px on a 390 px phone) instead of letting labels shrink to 5 px.
export function panWidth(r) {
  const sizes = [...r.labels.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
  if (!sizes.length) return 0;
  return Math.ceil(r.fig.w * 9.2 / Math.min(...sizes));
}

// Inline version for pages: no tokens (the page has them), no filter defs (the page
// defines them once), keyframes scoped by figure id.
export function inline(r, o = {}) {
  const { fig } = r;
  const motion = fig.motion ? ` data-motion="1" data-dur="${r.dur}"` : ` data-still="" data-dur="${r.dur}"`;
  const pw = o.shrink ? 0 : panWidth(r);
  const extra = (o.shrink ? ' data-allow-shrink=""' : '') + (pw > 0 && pw < fig.w ? ` style="min-width:${pw}px"` : pw >= fig.w ? ` style="min-width:${fig.w}px"` : '');
  return `<svg viewBox="0 0 ${fig.w} ${fig.h}" class="gfig${o.cls ? ' ' + o.cls : ''}" role="img" aria-label="${esc(label(fig))}" data-fig="${fig.id}"${motion}${extra}>` +
    (r.css ? `<style>${r.css}</style>` : '') +
    (fig.under ? fig.under(fig) : '') +
    `<g filter="url(#g-pencil)">${r.art}</g><g>${r.labels}</g></svg>`;
}

const outputs = new Map();   // path -> content
function emit(path, content) { outputs.set(path, content); }

function renderPage(tplPath, results, cats) {
  let s = readFileSync(tplPath, 'utf8');
  const byId = new Map(results.map(r => [r.fig.id, r]));
  // {{fig:id}} plain · {{fig:id|class names}} · {{fig:id|shrink}} lets labels shrink (picture-like use)
  s = s.replace(/\{\{fig:([a-z0-9-]+)(?:\|([a-z -]+))?\}\}/g, (_, id, cls) => {
    const r = byId.get(id);
    if (!r) throw new Error(`${relative(ROOT, tplPath)}: unknown figure ${id}`);
    const shrink = /\bshrink\b/.test(cls || '');
    return `<div class="gpan">${inline(r, { cls: (cls || '').replace(/\bshrink\b/, '').trim(), shrink })}</div>`;
  });
  // {{desc:id}}: the figure's own description, both languages. Descriptions quote
  // numbers the figure computed, so a page caption written this way cannot go stale.
  s = s.replace(/\{\{desc:([a-z0-9-]+)\}\}/g, (_, id) => {
    const r = byId.get(id);
    if (!r || !r.fig.desc) throw new Error(`${relative(ROOT, tplPath)}: no description for figure ${id}`);
    return `<span class="lang-zh">${esc(r.fig.desc.zh)}</span><span class="lang-en">${esc(r.fig.desc.en)}</span>`;
  });
  s = s.replace('{{filters}}', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${FILTERS}</defs></svg>`);
  const gal = results.filter(r => !isPage(r.fig));
  s = s.replace(/\{\{count:([a-z-]+)\}\}/g, (_, c) => {
    if (c === 'all') return String(gal.length);
    if (c === 'motion') return String(gal.filter(r => r.fig.motion).length);
    if (c === 'static') return String(gal.filter(r => !r.fig.motion).length);
    const n = results.filter(r => r.fig.cat === c).length;
    if (!n) throw new Error(`count of empty category ${c}`);
    return String(n);
  });
  s = s.replace('{{gallery}}', () => gallery(results, cats));
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
        const wide = f.h > f.w ? ' tall' : '';
        return `<figure class="gal-card g-box${wide}" id="fig-${f.id}"><div class="gal-stage gpan">${inline(r)}</div>` +
          `<figcaption><b><span class="gal-n">${String(n).padStart(2, '0')}</span> <span class="lang-zh">${esc(f.title.zh)}</span><span class="lang-en">${esc(f.title.en)}</span></b>` +
          (f.motion ? `<span class="g-tag g-tag--illus"><span class="lang-zh">动图 ${r.dur}s</span><span class="lang-en">motion ${r.dur}s</span></span>` : '') +
          `<span class="gal-desc"><span class="lang-zh">${esc(f.desc.zh)}</span><span class="lang-en">${esc(f.desc.en)}</span></span>` +
          `<span class="gal-act">` +
          (f.motion ? `<button type="button" class="g-btn gal-play" data-play="${f.id}"><span class="lang-zh">▶ 再画一遍</span><span class="lang-en">▶ Draw again</span></button>` : `<button type="button" class="g-btn gal-play" data-play="${f.id}" data-sketch="1"><span class="lang-zh">✎ 看它怎么画</span><span class="lang-en">✎ Watch it drawn</span></button>`) +
          `<a class="g-btn" href="../../skills/graphite-design/templates/figures/${f.id}.svg" download><span class="lang-zh">下载 SVG</span><span class="lang-en">SVG</span></a>` +
          `<a class="g-btn" href="https://github.com/TbusOS/sky-skills/blob/main/skills/graphite-design/${f.src}"><span class="lang-zh">源码</span><span class="lang-en">Code</span></a>` +
          `</span></figcaption></figure>`;
      }).join('') + `</div></section>`;
  }).join('');
}

async function main() {
  const figs = await loadFigures();
  const base = figCss();
  const pick = ONLY ? figs.filter(f => f.id === ONLY) : figs;
  if (ONLY && !pick.length) { console.error(`no figure ${ONLY}`); process.exit(2); }
  const results = pick.map(draw);
  for (const r of results) if (!isPage(r.fig)) emit(join(SKILL, 'templates/figures', r.fig.id + '.svg'), standalone(r, base));
  if (!ONLY) {
    const cats = JSON.parse(readFileSync(join(SKILL, 'templates/categories.json'), 'utf8'));
    const unknown = results.filter(r => !isPage(r.fig) && !cats.some(c => c.id === r.fig.cat));
    if (unknown.length) throw new Error('figures in unknown categories: ' + unknown.map(r => r.fig.id + ':' + r.fig.cat).join(', '));
    emit(join(SKILL, 'templates/figures/index.json'), JSON.stringify(results.filter(r => !isPage(r.fig)).map(r => ({
      id: r.fig.id, cat: r.fig.cat, w: r.fig.w, h: r.fig.h, motion: !!r.fig.motion, duration: r.dur,
      title: r.fig.title, desc: r.fig.desc, src: r.fig.src,
    })), null, 1) + '\n');
    const tdir = join(ROOT, 'site/graphite-design');
    for (const t of readdirSync(tdir).filter(f => f.endsWith('.html.tpl')).sort())
      emit(join(ROOT, 'demos/graphite-design', t.replace(/\.tpl$/, '')), renderPage(join(tdir, t), results, cats));
  }

  let diff = 0;
  for (const [p, c] of outputs) {
    const cur = existsSync(p) ? readFileSync(p, 'utf8') : null;
    if (CHECK) { if (cur !== c) { diff++; console.log('differs: ' + relative(ROOT, p)); } continue; }
    if (cur !== c) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); }
  }
  if (CHECK) {
    // stale files: an SVG whose source figure is gone
    const want = new Set(results.filter(r => !isPage(r.fig)).map(r => r.fig.id + '.svg'));
    for (const f of readdirSync(join(SKILL, 'templates/figures')).filter(f => f.endsWith('.svg')))
      if (!want.has(f)) { diff++; console.log('no source for: templates/figures/' + f); }
    console.log(diff ? `${diff} file(s) out of date — run: node skills/graphite-design/scripts/build.mjs` : `up to date: ${results.filter(r => !isPage(r.fig)).length} figures, ${outputs.size} files`);
    process.exit(diff ? 1 : 0);
  }
  const g = results.filter(r => !isPage(r.fig));
  console.log(`${g.length} figures (${g.filter(r => r.fig.motion).length} animated) + ${results.length - g.length} page parts · ${outputs.size} files written or unchanged`);
  if (ONLY) console.log(join(SKILL, 'templates/figures', ONLY + '.svg'));
}

main().catch(e => { console.error(e.stack || e); process.exit(2); });
