// 调用链定位图 + 终端标注图的两条硬约束，做成能跑的检查。
//
// 为什么单开一道：这两类图的价值全在「读者能自己去核」上，而它们坏掉的方式
// **全部不报错、而且看不出来**：
//
//   1 少一个 file:line。图还是那个图，只是那一层核不了了 —— 读者要先问
//     「你说的是哪个函数」，图才开始起作用。没有出处的那一层等于一句转述。
//   2 「给不出行号」那一格只写了个破折号。约定是必须写清**为什么**拿不到
//     （运行时按表分派 / 宏展开后才有），不写就只是个空格。
//   3 关键行没贴原文，或者贴了原文但没标出决定结论的那几个字。
//   4 **高亮色块偏了半个字符。** 这条最危险：SVG 里色块的 x 是算出来的
//     （字符步进 × 起始下标），算错了肉眼分辨不出 —— 0.94 的渲染缩放、
//     3px 圆角、字形本身的左边距，任何一个都足以掩盖一个字符的偏移。
//     于是色块盖住的是 `/ship_manifest.tx` 而不是 `ship_manifest.txt`,
//     看着完全正常。
//     **这里不目测，用 SVG DOM 自己的 `getStartPositionOfChar(i)` 反查**：
//     它给出第 i 个字符的真实起点，和色块边缘对一遍就知道有没有错位。
//
// 用法:
//   node skills/design-review/scripts/check_call_site_figures.mjs
//   node skills/design-review/scripts/check_call_site_figures.mjs --self-test
//     用内置的坏例子跑一遍,每一条都必须被报出来 —— 探针不过就说明这道检查是摆设
// 退出码 0 = 全过
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { extname, resolve, relative, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SELFTEST = process.argv.includes('--self-test');
// 一个字符的步进约 7.2px；容差取它的 18%，够吃掉舍入,又抓得住半个字符的偏移
const TOL_CHARS = 0.18;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.js': 'application/javascript', '.mjs': 'application/javascript', '.png': 'image/png' };

const srv = createServer(async (req, res) => {
  try {
    const p = resolve(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, ''));
    if (!p.startsWith(ROOT)) throw new Error('out of root');
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

// 页面里跑的那一段。返回的是「事实」,判断留在外面。
const PROBE = () => {
  const out = { rows: [], nolines: [], boards: [], codes: [], marks: [] };
  const vis = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();

  for (const b of document.querySelectorAll('.relief-board')) {
    if (!b.querySelector('.relief-site')) continue;
    out.boards.push({ id: b.id || '(无 id)',
      hasCode: !!b.querySelector('.relief-sitecode'),
      codesWithMark: [...b.querySelectorAll('.relief-sitecode')].filter((c) => c.querySelector('em')).length,
      codeCount: b.querySelectorAll('.relief-sitecode').length });
  }
  for (const r of document.querySelectorAll('.relief-siterow')) {
    const board = r.closest('.relief-board');
    out.rows.push({ board: board?.id || '(无 id)',
      fn: vis(r.querySelector('.relief-sitefn')).slice(0, 34),
      ats: r.querySelectorAll('.relief-siteat').length });
  }
  for (const a of document.querySelectorAll('.relief-siteat.relief-noline')) {
    out.nolines.push({ board: a.closest('.relief-board')?.id || '(无 id)', text: vis(a) });
  }

  // ── SVG：深色代码卡上的等宽行 + 压在它下面的高亮块 ──
  for (const svg of document.querySelectorAll('svg')) {
    // 深色代码卡的色值每个 skill 各定各的（anthropic #1f1e1b · apple #1d1d1f），
    // 所以按「暗到能承白字」判，不按某一个写死的值判 —— 只认一个值，
    // 等于假设别的 skill 不会画这类图，而 apple 这次就画了。
    const dark = [...svg.querySelectorAll('rect')].filter((r) => {
      const f = (r.getAttribute('fill') || '').trim();
      if (!/^#[0-9a-f]{6}$/i.test(f)) return false;
      const [x, y, z] = [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16));
      const lum = 0.2126 * x + 0.7152 * y + 0.0722 * z;
      const box = r.getBBox ? r.getBBox() : null;
      if (!(lum < 60 && box && box.width > 120 && box.height > 20)) return false;
      // 还要装着成行的代码才算代码卡。**光看「暗 + 够大」会把装饰图形收进来** ——
      // apple 那张首页图里有个芯片图标：深色方块、蓝色内芯、当中一个字母 K，
      // 三样都对上了「深色卡 + 高亮块 + 一行字」的形状，于是被报了三条。
      // 判断依据只能是「这块里有没有成行的代码」，不是「它是不是暗的」。
      return [...svg.querySelectorAll('text')].some((t) => {
        if ((t.textContent || '').trim().length < 8) return false;
        let b; try { b = t.getBBox(); } catch { return false; }
        return b.x >= box.x - 2 && b.x <= box.x + box.width + 2
            && b.y >= box.y - 2 && b.y + b.height <= box.y + box.height + 6;
      });
    });
    if (!dark.length) continue;
    const label = (svg.getAttribute('aria-label') || '(no aria-label)').slice(0, 48);
    const inDark = (bb) => dark.some((d) => {
      const r = d.getBBox();
      return bb.x >= r.x - 2 && bb.x <= r.x + r.width + 2
          && bb.y >= r.y - 2 && bb.y + bb.height <= r.y + r.height + 4;
    });

    const lines = [];
    for (const t of svg.querySelectorAll('text')) {
      let bb; try { bb = t.getBBox(); } catch { continue; }
      if (!bb.width || !inDark(bb)) continue;
      const s = t.textContent;
      const tl = t.getAttribute('textLength');
      const rec = { label, txt: s.slice(0, 30), chars: s.length,
        textLength: tl ? +tl : null, adjust: t.getAttribute('lengthAdjust'),
        y: bb.y, h: bb.height, full: s };
      if (tl && s.length > 1) {
        rec.x0 = t.getStartPositionOfChar(0).x;
        rec.step = t.getStartPositionOfChar(1).x - rec.x0;
      }
      lines.push(rec);
      out.codes.push({ ...rec, full: undefined });
    }
    // 高亮块：半透明的实色小 rect，压在深卡里
    for (const r of svg.querySelectorAll('rect')) {
      const op = parseFloat(r.getAttribute('opacity') ?? r.style.opacity ?? '1');
      if (!(op > 0.12 && op < 0.65)) continue;
      let bb; try { bb = r.getBBox(); } catch { continue; }
      if (!inDark(bb)) continue;
      const mid = bb.y + bb.height / 2;
      const line = lines.find((l) => mid >= l.y - 4 && mid <= l.y + l.h + 4);
      if (!line) { out.marks.push({ label, x: bb.x, orphan: true }); continue; }
      if (line.textLength == null) {
        // 有色块压着却没定步进 —— 色块只能靠目测放，改一次文字就错一次
        out.marks.push({ label, x: +bb.x.toFixed(2), noLen: true, line: line.txt });
        continue;
      }
      if (line.adjust !== 'spacing') {
        out.marks.push({ label, x: +bb.x.toFixed(2), badAdjust: line.adjust, line: line.txt });
        continue;
      }
      const i = (bb.x - line.x0) / line.step;
      const j = (bb.x + bb.width - line.x0) / line.step;
      const a = Math.round(i), b = Math.round(j);
      const w = (ch) => !!ch && /[A-Za-z0-9_]/.test(ch);
      let cut = null;
      if (w(line.full[a]) && w(line.full[a - 1])) cut = '左边缘切在一个词中间';
      else if (w(line.full[b - 1]) && w(line.full[b])) cut = '右边缘切在一个词中间';
      out.marks.push({ label, orphan: false, x: +bb.x.toFixed(2),
        i: +i.toFixed(3), j: +j.toFixed(3), cut,
        covers: line.full.slice(a, b),
        line: line.txt });
    }
  }
  return out;
};

const fail = [];
let seenRows = 0, seenMarks = 0, seenCodeLines = 0;

function judge(where, r) {
  for (const b of r.boards) {
    if (!b.hasCode)
      fail.push(`[缺原文] ${where} ${b.id}：这张图一层都没贴代码原文 —— 少了它，图只是把调用栈抄了一遍`);
    else if (b.codesWithMark === 0)
      fail.push(`[没标关键] ${where} ${b.id}：贴了 ${b.codeCount} 段原文，但一个 <em> 都没有 —— 决定结论的那几个字没标出来`);
  }
  for (const row of r.rows) {
    seenRows += 1;
    if (row.ats !== 1)
      fail.push(`[缺出处] ${where} ${row.board}：「${row.fn}」这一层有 ${row.ats} 个 file:line 格（要恰好 1 个）`);
  }
  for (const n of r.nolines) {
    if (n.text.replace(/[\s—–-]/g, '').length < 6)
      fail.push(`[没写原因] ${where} ${n.board}：给不出行号的那一格只写了「${n.text}」—— 要写清为什么拿不到`);
  }
  seenCodeLines += r.codes.length;
  for (const m of r.marks) {
    seenMarks += 1;
    if (m.orphan) {
      fail.push(`[孤立高亮] ${where}：x=${m.x} 那个高亮块找不到它对应的那一行`);
      continue;
    }
    if (m.noLen) {
      fail.push(`[无 textLength] ${where}「${m.line}」：这一行压着一个高亮块，却没写 textLength`
        + ` —— 色块只能靠目测放，改一次文字就错一次`);
      continue;
    }
    if (m.badAdjust !== undefined) {
      fail.push(`[lengthAdjust] ${where}「${m.line}」：写了 textLength 但 lengthAdjust 是 ${m.badAdjust}，要 spacing`);
      continue;
    }
    // 左右各向外扩多少个字符。对称 = 有意的 padding；不对称 = 算错了
    const padL = Math.round(m.i) - m.i, padR = m.j - Math.round(m.j);
    if (Math.abs(padL - padR) > TOL_CHARS)
      fail.push(`[高亮偏了] ${where}「${m.line}」：色块左右外扩不一样（左 ${padL.toFixed(2)} 右 ${padR.toFixed(2)} 个字符）`
        + ` —— 对称外扩是 padding，不对称就是起始下标算错了。现在盖住的是「${m.covers}」`);
    else if (!m.covers.trim())
      fail.push(`[高亮空白] ${where}「${m.line}」：色块盖住的是一段空白`);
    else if (m.cut)
      fail.push(`[高亮切词] ${where}「${m.line}」：色块盖住的是「${m.covers}」—— ${m.cut}。`
        + `边缘落在字符边界上了，但落错了字符，这种偏移目测看不出来`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

if (SELFTEST) {
  // 探针。**每一条都必须被抓到** —— 抓不到就说明这道检查放行了它本该拦的东西。
  const bad = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/skills/relief-design/assets/relief.css"></head><body>
<div class="relief-board relief-raised" id="probe-a">
  <div class="relief-site">
    <div class="relief-siterow" style="--d:0"><span class="relief-sitefn relief-raised relief-thin"><b>a_fn()</b></span></div>
    <div class="relief-siterow" style="--d:1"><span class="relief-sitefn relief-raised relief-thin"><b>b_fn()</b></span><span class="relief-siteat relief-noline">&mdash;</span></div>
  </div>
</div>
<div class="relief-board relief-raised" id="probe-b">
  <div class="relief-site">
    <div class="relief-siterow" style="--d:0"><span class="relief-sitefn relief-raised relief-thin"><b>c_fn()</b></span><span class="relief-siteat">x.c:1</span></div>
    <div class="relief-sitesrc" style="--d:0"><code class="relief-sitecode">return 0;</code></div>
  </div>
</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150" width="400" height="150" aria-label="probe svg">
  <rect x="10" y="10" width="360" height="40" fill="#1f1e1b"/>
  <rect x="182.0" y="22" width="57.6" height="17" rx="3" fill="#d97757" opacity="0.32"/>
  <text x="20" y="34" font-size="12" textLength="216" lengthAdjust="spacing"
        font-family="monospace">[ -n "$manifest" ] || return 1</text>
  <rect x="10" y="60" width="360" height="40" fill="#1f1e1b"/>
  <rect x="178.4" y="72" width="36" height="17" rx="3" fill="#c9913f" opacity="0.3"/>
  <text x="20" y="84" font-size="12" textLength="216" lengthAdjust="spacing"
        font-family="monospace">[ -n "$manifest" ] || return 1</text>
  <rect x="10" y="110" width="360" height="30" fill="#1f1e1b"/>
  <rect x="40" y="118" width="50" height="15" fill="#788c5d" opacity="0.3"/>
  <text x="20" y="130" font-size="12" font-family="monospace">no textLength on this line</text>
</svg>
</body></html>`;
  await mkdir(`${ROOT}/.scratch/csl-probe`, { recursive: true });
  await writeFile(`${ROOT}/.scratch/csl-probe/bad.html`, bad);
  await page.goto(`${BASE}/.scratch/csl-probe/bad.html`, { waitUntil: 'networkidle' });
  judge('probe', await page.evaluate(PROBE));
  await writeFile(`${ROOT}/.scratch/csl-probe/bad.html`, '');

  const want = ['[缺出处]', '[没写原因]', '[缺原文]', '[没标关键]', '[无 textLength]', '[高亮偏了]', '[高亮切词]'];
  const missed = want.filter((k) => !fail.some((f) => f.startsWith(k)));
  console.log(`探针：内置 ${want.length} 种坏法，抓到 ${want.length - missed.length} 种`);
  fail.forEach((f) => console.log('   · ' + f));
  await browser.close(); srv.close();
  if (missed.length) { console.log(`\n✗ 这几种没抓到：${missed.join(' ')}`); process.exit(1); }
  console.log('\n探针通过 —— 每种坏法都报出来了');
  process.exit(0);
}

// 先按内容预筛，别把整仓的页面都用浏览器打开一遍
async function walk(rel, depth = 3) {
  const out = [];
  let ents = [];
  try { ents = await readdir(resolve(ROOT, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = join(rel, e.name);
    if (e.isDirectory()) {
      if (depth > 0 && e.name !== 'node_modules' && !e.name.startsWith('.')) out.push(...await walk(p, depth - 1));
    } else if (/\.(html|svg)$/i.test(e.name)) out.push(p);
  }
  return out;
}
const candidates = [...await walk('skills', 4), ...await walk('demos', 2), ...await walk('docs', 1)];
const files = [];
for (const f of candidates) {
  const src = await readFile(resolve(ROOT, f), 'utf8');
  if (/relief-siterow|<rect[^>]*fill="#(1f1e1b|1d1d1f|0b0b0c|111112)"/i.test(src)) files.push(f);
}
if (files.length === 0) {
  // 取子集的检查要问「子集为空怎么办」：一个文件都没筛到多半是类名改了,
  // 这时候报通过是最坏的结果。
  console.error('✗ 一个含调用链定位图 / 深色代码卡的文件都没筛到 —— 类名或色值改过？');
  await browser.close(); srv.close(); process.exit(1);
}

for (const f of files.sort()) {
  await page.goto(`${BASE}/${f}`, { waitUntil: 'networkidle' });
  judge(relative('.', f), await page.evaluate(PROBE));
}

await browser.close(); srv.close();
console.log(`扫了 ${files.length} 个文件 · ${seenRows} 层调用链 · ${seenCodeLines} 行原文 · ${seenMarks} 个高亮块`);
if (fail.length) {
  console.log(`\n${fail.length} 条不过：`);
  fail.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('全部通过');
