// 核对 references/snippets.md 里的每一段标记还能用。
//
// 为什么要有这道检查：片段库最容易的坏法不是写错，是**跟着 CSS 一起老掉** ——
// 某个类改了名，片段还写着旧名，复制过去渲染出来是一堆没有凹凸的方块。
// 这种坏法不报错，人要等到画完一张图觉得「怎么不对劲」才发现。
//
// 四件事：
//   1 类名有定义 —— 片段里每个 relief-* 都真的在 relief.css 里有一条规则。
//     **漏写前缀是这套东西最容易犯的错**（class="sn" 而不是 class="relief-sn"），
//     它不报错、不缺内容，文字只是回落成继承色；verify.py 只收前缀匹配的词，
//     axe 算不了渐变底，皮肤对比度检查只看变量定义 —— 三道都看不见。
//   2 渲染得出来 —— 每段单独塞进 .relief-board 里渲染，根元素要有尺寸。
//   3 七套皮肤下文字都看得清 —— 不传皮肤就等于把默认皮肤测了七遍。
//     渐变底的元素跳过并计数，那部分归 check_skin_contrast.py 管。
//   4 覆盖 —— diagram-craft.md 里点名的部件类，这里都要有一段。
//
// 用法: node skills/relief-design/scripts/check_snippets.mjs [--keep]
//   --keep 把生成的那张总览页留在 .scratch/ 里，可以自己打开看
// 退出码 0 = 全过
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const MD    = `${ROOT}/skills/relief-design/references/snippets.md`;
const CSS   = `${ROOT}/skills/relief-design/assets/relief.css`;
const CRAFT = `${ROOT}/skills/relief-design/references/diagram-craft.md`;
const SKINS = ['', 'gray', 'matte', 'ink', 'mist', 'clay', 'sage'];
const KEEP  = process.argv.includes('--keep');

const fail = [];
const md  = await readFile(MD, 'utf8');
const css = await readFile(CSS, 'utf8');

// ── 1 解析 ─────────────────────────────────────────────
// 每个 ```html 独立算一段，标题往回找最近的一个。
// 原来写成「标题 → 代码块」一条正则，同一个标题下写两段就会漏掉第二段
// —— 而且漏掉的那段不会报错，只是不再被检查，这种漏法最难发现。
const blocks = [];
const lines = md.split('\n');
let head = '(文件开头)';
for (let i = 0; i < lines.length; i += 1) {
  if (/^#{1,3} /.test(lines[i])) { head = lines[i].replace(/^#+ /, ''); continue; }
  if (lines[i] !== '```html') continue;
  const j = lines.indexOf('```', i + 1);
  if (j < 0) { console.error(`✗ 第 ${i + 1} 行的 \`\`\`html 没有收尾`); process.exit(1); }
  blocks.push({ head, line: i + 1, html: lines.slice(i + 1, j).join('\n') });
  i = j;
}

// 取子集的检查要问「子集为空怎么办」。一段都没解析到多半是格式改了，
// 这时候报通过是最坏的结果。
if (blocks.length < 20) {
  console.error(`✗ 只解析到 ${blocks.length} 段标记，snippets.md 的格式变了？`);
  process.exit(1);
}
console.log(`snippets.md 解析到 ${blocks.length} 段`);

// ── 2 类名有定义 ───────────────────────────────────────
// 收 relief.css 里定义过的**所有**类名，不只是 relief- 开头的。
// 探针教训：第一版只查 relief-* 开头的词，于是漏写前缀写成 class="sn" 的
// 那个词根本不在检查范围里 —— 而它正是这道检查最想抓的东西。
// 只查一个前缀，等于默认「写错的人至少会把前缀写对」，这个假设不成立。
const defined = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((x) => x[1]));
for (const b of blocks) {
  const used = new Set([...b.html.matchAll(/class="([^"]*)"/g)]
    .flatMap((x) => x[1].split(/\s+/)).filter(Boolean));
  for (const c of used) if (!defined.has(c)) {
    const hint = defined.has('relief-' + c)
      ? `，但 .relief-${c} 有 —— 漏了前缀`
      : '';
    fail.push(`[类名] ${b.head} (snippets.md:${b.line})：.${c} 在 relief.css 里没有定义${hint}`);
  }
}

// ── 3 覆盖：diagram-craft 点名的部件都要有片段 ────────────
const craft = await readFile(CRAFT, 'utf8');
const wanted = new Set([...craft.matchAll(/`\.(relief-[a-z0-9-]+)`/g)].map((x) => x[1]));
// 反引号提到的、以及片段标记里真的用到的，都算覆盖 ——
// 只数反引号会把「用了但没单独讲」的部件误报成缺失
const inMd = new Set([
  ...[...md.matchAll(/`\.(relief-[a-z0-9-]+)`/g)].map((x) => x[1]),
  ...blocks.flatMap((b) => [...b.html.matchAll(/class="([^"]*)"/g)]
    .flatMap((x) => x[1].split(/\s+/)).filter((c) => c.startsWith('relief-'))),
]);
for (const c of wanted) if (!inMd.has(c)) fail.push(`[覆盖] diagram-craft 用了 .${c}，snippets.md 里没有对应的片段`);

// ── 4 渲染 ─────────────────────────────────────────────
const page1 = blocks.map((b, i) => `<h2>${i}</h2>
<div class="relief-board relief-raised" data-snip="${i}">
  <div class="relief-bt"><span class="lang-en">${b.head.replace(/[<&]/g, '')}</span><span class="lang-zh">${b.head.replace(/[<&]/g, '')}</span></div>
  ${b.html}
</div>`).join('\n');
const html = `<!doctype html><html lang="en" data-lang="en"><head><meta charset="utf-8">
<title>relief snippets</title>
<link rel="stylesheet" href="/skills/relief-design/assets/fonts.css">
<link rel="stylesheet" href="/skills/relief-design/assets/relief.css">
</head><body><div class="relief-wrap">${page1}</div></body></html>`;
await mkdir(`${ROOT}/.scratch/relief-snippets`, { recursive: true });
const OUT = `${ROOT}/.scratch/relief-snippets/all.html`;
await writeFile(OUT, html);

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
               '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml' };
const srv = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = u === '/' ? OUT : resolve(ROOT, u.replace(/^\/+/, ''));
    if (!p.startsWith(ROOT)) throw new Error('out of root');
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));   // 端口交给系统分配，别写死
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 900 } });
await page.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' });

// 尺寸
const sizes = await page.$$eval('[data-snip]', (els) => els.map((e) => {
  const kids = [...e.children].filter((k) => !k.classList.contains('relief-bt'));
  const r = kids[0]?.getBoundingClientRect();
  return { i: e.dataset.snip, w: Math.round(r?.width ?? 0), h: Math.round(r?.height ?? 0) };
}));
for (const s of sizes) {
  if (s.w < 40 || s.h < 8) fail.push(`[渲染] ${blocks[s.i].head}：渲染出来只有 ${s.w}×${s.h}，基本是空的`);
}

// 对比度 × 七套皮肤
let skipped = 0;
for (const skin of SKINS) {
  await page.evaluate((s) => {
    if (s) document.documentElement.setAttribute('data-theme', s);
    else document.documentElement.removeAttribute('data-theme');
  }, skin);
  const bad = await page.evaluate(() => {
    const lin = (c) => { c /= 255; return c > .04045 ? ((c + .055) / 1.055) ** 2.4 : c / 12.92; };
    const lum = ([r, g, b]) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const alpha = (s) => { const n = s.match(/[\d.]+/g); return n && n.length > 3 ? +n[3] : 1; };
    const out = []; let skip = 0;
    for (const el of document.querySelectorAll('[data-snip] *')) {
      const txt = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).length;
      if (!txt) continue;
      if (el.closest('svg')) continue;                 // SVG 的填充规则不同，归别的检查
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      let bg = null, grad = false;
      for (let a = el; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.backgroundImage !== 'none') { grad = true; break; }
        if (alpha(s.backgroundColor) > 0) { bg = rgb(s.backgroundColor); break; }
      }
      if (grad) { skip++; continue; }                  // 渐变底交给 check_skin_contrast.py
      if (!bg) continue;
      const fg = rgb(cs.color);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      if (ratio < 4.5) out.push({
        snip: el.closest('[data-snip]').dataset.snip,
        cls: el.getAttribute('class') || el.tagName.toLowerCase(),
        txt: el.textContent.trim().slice(0, 28),
        ratio: ratio.toFixed(2),
      });
    }
    return { out, skip };
  });
  skipped += bad.skip;
  for (const b of bad.out)
    fail.push(`[对比度·${skin || '默认'}] ${blocks[b.snip].head}：「${b.txt}」${b.ratio}:1 < 4.5  (${b.cls})`);
}

await browser.close(); srv.close();
if (!KEEP) await writeFile(OUT, '');   // 留个空文件，不留误导性的旧渲染

console.log(`类名 ${defined.size} 个已定义 · 覆盖 ${wanted.size} 个部件 · 渐变底跳过 ${skipped} 处（归 check_skin_contrast.py）`);
if (fail.length) { console.log(`\n${fail.length} 条不过：`); fail.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
console.log('全部通过');
