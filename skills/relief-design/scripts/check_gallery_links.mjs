// 图集页的每个按钮，点下去要落到它写的那张图上。
//
// 为什么要有这道检查：图集页刚做出来时，45 个按钮的链接全都只写到页面
// （hardware.html），一个锚点都没有。点「MESI 状态迁移」和点「时钟树」
// 落到的是同一个地方 —— 页面顶部。这种坏法不报错、不缺内容、截图也正常，
// 只有真去点的人才发现，而多数人点错两次就不再点了。
//
// 判断依据不是「链接里有没有 #」—— 那种查法跟改链接用的是同一套字符串匹配，
// 改对改错它都说过。这里用浏览器解析出来的 :target 元素，取它自己的标题，
// 跟按钮上的字比。两条完全独立的路，才能互相验证。
//
// 用法: node skills/relief-design/scripts/check_gallery_links.mjs
// 退出码 0 = 全部对得上
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const GALLERY = 'demos/relief-design/diagrams.html';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
};

const srv = createServer(async (req, res) => {
  try {
    const p = resolve(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\/+/, ''));
    if (!p.startsWith(ROOT)) throw new Error('out of root');
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end('not found'); }
});
// 端口交给系统分配。写死端口在这台机器上撞过 —— 另一个会话占着 8787 时
// 报出来的是一片失败，看着像页面全坏了，其实一个页面都没打开。
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${base}/${GALLERY}`, { waitUntil: 'networkidle' });
const entries = await page.$$eval('a.relief-gitem', (as) => as.map((a) => ({
  label: a.querySelector('.lang-en')?.textContent.trim() ?? '(按钮上没有英文标题)',
  href: a.getAttribute('href'),
})));

if (entries.length === 0) {
  // 取子集的检查要问「子集为空怎么办」。一个都没抓到，多半是类名改了，
  // 而不是图集页真的空了 —— 这种情况报通过是最坏的结果。
  console.error('✗ 图集页上一个 a.relief-gitem 都没抓到。类名改过？');
  await browser.close(); srv.close(); process.exit(1);
}

const bad = [];
for (const e of entries) {
  const url = new URL(e.href, `${base}/${GALLERY}`).href;
  if (!url.includes('#')) { bad.push([e.label, '链接没有锚点，点了只能落到页面顶部']); continue; }
  await page.goto(url, { waitUntil: 'load' });
  const landed = await page.evaluate(() => {
    const t = document.querySelector(':target');
    if (!t) return { err: 'URL 里的 # 在目标页面上匹配不到任何元素' };
    const r = t.getBoundingClientRect();
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return {
      id: t.id,
      title: t.querySelector('.relief-bt .lang-en')?.textContent.trim() ?? null,
      isBoard: t.classList.contains('relief-board'),
      top: Math.round(r.top),
      // 页面已经滚到底就不可能再把图顶推上去，这时只要整张图看得全就算落对了
      atBottom: window.scrollY >= max - 2,
      fullyVisible: r.top >= -8 && r.bottom <= window.innerHeight + 8,
      // 被套进别的图板块里 = 目标页少了闭合标签，图会缩进一层渲染
      nested: !!t.parentElement?.closest('.relief-board'),
    };
  });
  if (landed.err) bad.push([e.label, landed.err]);
  else if (!landed.isBoard) bad.push([e.label, `落到的不是图板块（id=${landed.id}）`]);
  else if (landed.nested) bad.push([e.label, '这张图被套在另一张图里了 —— 目标页少了 </div>']);
  else if (landed.title !== e.label) bad.push([e.label, `落到的是「${landed.title}」`]);
  else if (landed.top > 120 && !(landed.atBottom && landed.fullyVisible))
    bad.push([e.label, `落点偏了，图顶距视口 ${landed.top}px，页面也没到底`]);
  else if (landed.top < -8) bad.push([e.label, `滚过头了 ${landed.top}px`]);
}

console.log(`图集页 ${entries.length} 个按钮，对上 ${entries.length - bad.length} 个`);
bad.forEach(([l, w]) => console.log(`  ✗ ${l} → ${w}`));
await browser.close(); srv.close();
process.exit(bad.length ? 1 : 0);
