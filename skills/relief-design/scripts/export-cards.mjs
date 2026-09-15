// 卡片导出：把每个 .card 元素单独截成一张 png，尺寸就是元素自身尺寸。
// 用 fullPage 截整页会把 body 背景和别的卡片一起带进去，发公众号还得再裁一次。
// 用法: node shoot.mjs <html路径> [输出前缀] [--scale=2]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const scale = Number((argv.find(a => a.startsWith('--scale=')) || '=1').split('=')[1]) || 1;
const [file, prefixRaw] = argv.filter(a => !a.startsWith('--'));
if (!file) { console.error('usage: node shoot.mjs <html> [prefix] [--scale=2]'); process.exit(2); }
const prefix = prefixRaw || basename(file, '.html');
// 仓库根目录从脚本自身位置推出来。写死绝对路径既把作者的用户名带进公开仓，
// 别人 clone 下来也直接跑不了 —— 而且它不会报错，只会 404。
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg' };

const srv = createServer(async (req, res) => {
  const p = resolve(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, ''));
  if (!p.startsWith(ROOT)) return res.writeHead(403).end();
  try { res.writeHead(200, { 'Content-Type': mime[extname(p)] ?? 'application/octet-stream' });
        res.end(await readFile(p)); }
  catch { res.writeHead(404).end('not found'); }
}).listen(0);
await new Promise(r => srv.once('listening', r));
const PORT = srv.address().port;   // 端口写死会跟并行的会话/僵尸进程撞，交给系统分配

const browser = await chromium.launch();
const page = await browser.newContext({
  viewport: { width: 1280, height: 1280 }, deviceScaleFactor: scale, reducedMotion: 'reduce'
}).then(c => c.newPage());
await page.goto(`http://localhost:${PORT}/${file.replace(/^\/+/, '')}`, { waitUntil: 'networkidle' });
// 字体是异步的：不等它就位，截出来是回落字体，而且看不出哪里不对。
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const cards = await page.locator('.card').all();
if (!cards.length) { console.error('✗ 页面里没有 .card 元素'); await browser.close(); srv.close(); process.exit(1); }
let n = 0;
for (const card of cards) {
  n += 1;
  const out = cards.length === 1 ? `${prefix}.png` : `${prefix}-${String(n).padStart(2, '0')}.png`;
  await card.screenshot({ path: out });
  const b = await card.boundingBox();
  console.log(`✓ ${out}  ${Math.round(b.width)}×${Math.round(b.height)} @${scale}x`);
}
// 溢出自检：卡片是 overflow:hidden 的，内容超了不会报错，只会安静地少掉一截。
const over = await page.evaluate(() =>
  [...document.querySelectorAll('.card')].map((c, i) => ({
    i: i + 1, h: c.clientHeight, need: Math.max(...[...c.children].map(el => el.offsetTop + el.offsetHeight))
  })).filter(x => x.need > x.h));
if (over.length) for (const o of over) console.error(`✗ 卡 ${o.i} 内容溢出 ${o.need - o.h}px（${o.need} > ${o.h}），底部被 overflow:hidden 切掉了`);
else console.log('✓ 无内容溢出');
await browser.close(); srv.close();
