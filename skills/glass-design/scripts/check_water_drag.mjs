// 拖动水珠必须按水珠在玻璃上滑动的物理走
//
// 为什么要查:v3 以前的拖动是弹簧:急停时水珠冲过指针再弹回来;稍快一点就在
// 身后拖出一条几百像素长的连续水管,不到 1 秒蒸发完,停下时附近那段还被吸回水珠
// (2026-09-29 逐帧截图确认)。真的水珠滑动是过阻尼的,速度跟着拉力走,不会冲过头;
// 慢的时候身后什么都不留,只有快到尾部拉成尖嘴后才沿中线甩下一串间距均匀的小珠,
// 小珠留在原地蒸发(Le Grand, Daerr & Limat 2005, JFM 541)。
//
// 查法:平滑彩色波纹的测试页(背景是算出来的,每个像素的原值都知道),虚拟时钟
// 逐帧推进,随机数固定种子:
//   1 不冲过头   以 12px/帧拖 30 帧后停住,之后 40 帧里水珠中心不超过指针 0.5px、
//                也不往回退(弹簧会冲过去再回来)
//   2 慢了不留痕 以 5px/帧拖过去,水珠刚走过的 230px 路径上被改动的像素 < 30 个
//   3 快了留串珠 以 20px/帧拖过去:路径上至少 5 颗珠子,大珠之间的间距变异系数
//                < 0.35(间距均匀,不是连成一条水管);水珠停在最后几颗旁边,
//                400ms 后珠子位置差的中位数 < 0.4px、九成 < 1.2px(没被吸回去;
//                不看单个最大值:挨着的珠子和卫星珠蒸发变小时会从一块分成两块,
//                质心看着挪了 2px,其实谁都没动)
//   4 静止回原样 在 6 条不同的线上各快拖一次(每颗珠子都带走水,不走回头路就捡不回来),
//                静止 5 秒后水珠回到原大小的 0.97–1.03 倍
//
// 用法: node check_water_drag.mjs [glass.js 路径]
//   不给路径就查本 skill 的 assets/glass.js。
//   反向验证(各只加回一个问题,每个都必须不过):运动改回弹簧 → 第 1 条;
//   串珠门槛降到 3px/帧 → 第 2 条;落地后每帧把珠子往水珠拉一点 → 第 3 条;
//   去掉静止回填 → 第 4 条。
import { mkdtempSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { tmpdir, homedir } from 'os';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const jsPath = resolve(args.find(a => !a.startsWith('--')) || join(HERE, '../assets/glass.js'));
const cssPath = resolve(join(HERE, '../assets/glass.css'));
if (!existsSync(jsPath)) { console.error('找不到 ' + jsPath); process.exit(2); }

async function loadChromium() {
  for (const t of [process.env.PLAYWRIGHT_PATH, 'playwright', join(HERE, '../../../node_modules/playwright/index.mjs')]) {
    if (!t) continue;
    try {
      if (t.startsWith('/') && !existsSync(t)) continue;
      return (await import(t.startsWith('/') ? 'file://' + t : t)).chromium;
    } catch { /* 下一个 */ }
  }
  throw new Error('找不到 playwright:在仓库根目录 npm i playwright,或设 PLAYWRIGHT_PATH');
}
function cachedChromium() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache/ms-playwright'),
    join(homedir(), 'Library/Caches/ms-playwright')].filter(Boolean).filter(existsSync);
  const rel = ['chrome-linux64/chrome', 'chrome-linux/chrome',
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium'];
  const found = [];
  for (const r of roots) for (const d of readdirSync(r)) {
    const m = /^chromium-(\d+)$/.exec(d); if (!m) continue;
    for (const x of rel) { const p = join(r, d, x); if (existsSync(p)) found.push([+m[1], p]); }
  }
  found.sort((a, b) => b[0] - a[0]);
  return found.length ? found[0][1] : null;
}
const chromium = await loadChromium();
let browser;
try { browser = await chromium.launch(); }
catch (e) {
  const alt = cachedChromium();
  if (!alt) throw e;
  browser = await chromium.launch({ executablePath: alt });
}

const W = 1000, H = 400;
const dir = mkdtempSync(join(tmpdir(), 'water-drag-'));
const page_html = join(dir, 'wave.html');
writeFileSync(page_html, `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${cssPath}">
<style>html,body{margin:0;height:100%;background:#000}#bg{position:fixed;inset:0;width:100%;height:100%}</style></head>
<body><canvas id="bg"></canvas><script>
var c=document.getElementById('bg'),W=c.width=innerWidth,H=c.height=innerHeight,x=c.getContext('2d'),im=x.createImageData(W,H);
for(var j=0;j<H;j++)for(var i=0;i<W;i++){var k=(j*W+i)*4;
 im.data[k]=110+80*Math.sin(i*6.2832/26);im.data[k+1]=110+80*Math.sin(j*6.2832/22+1);
 im.data[k+2]=110+60*Math.sin((i+j)*6.2832/38);im.data[k+3]=255;}
x.putImageData(im,0,0);
</script><script src="file://${jsPath}"></script></body></html>`);

// 虚拟时钟:__adv(n) 推进整 n 帧(每帧 16.667ms);随机数固定种子
const fresh = async () => {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    let z = 7; Math.random = () => { z = (z + 0x6D2B79F5) >>> 0; let t = z; t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let T = 1000; const q = [];
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    performance.now = () => T;
    window.__adv = (n) => { for (let i = 0; i < n; i++) { T += 16.667; const c = q.splice(0); c.forEach(f => f(T)); } };
  });
  await page.goto('file://' + page_html);
  await page.waitForTimeout(500);
  if (!await page.evaluate(() => !!document.querySelector('.glass-water-head'))) {
    console.log('不通过:水珠没有安装(浏览器不支持 backdrop-filter: url(),或 hover/pointer 条件不满足)');
    await browser.close(); process.exit(1);
  }
  await page.evaluate(() => __adv(12));
  return page;
};
const center = (page) => page.evaluate(() => { const r = document.querySelector('.glass-water-head').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
// 一帧指针走 v px,共 n 帧(沿 y 这条水平线)
const drag = async (page, x0, y, v, n) => {
  for (let i = 1; i <= n; i++) { await page.mouse.move(x0 + v * i, y); await page.evaluate(() => __adv(1)); }
};
// 截图和算出来的原背景比,返回改动过的像素(可限定一块区域)
const changed = async (page, box) => {
  const b64 = (await page.screenshot({ clip: box })).toString('base64');
  return page.evaluate(async ({ b64, box }) => {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height).data, out = [];
    for (let j = 0; j < im.height; j++) for (let i = 0; i < im.width; i++) {
      const k = (j * im.width + i) * 4, X = i + box.x, Y = j + box.y;
      const e = Math.abs(d[k] - Math.round(110 + 80 * Math.sin(X * 6.2832 / 26))) +
        Math.abs(d[k + 1] - Math.round(110 + 80 * Math.sin(Y * 6.2832 / 22 + 1))) +
        Math.abs(d[k + 2] - Math.round(110 + 60 * Math.sin((X + Y) * 6.2832 / 38)));
      if (e > 18) out.push([X, Y]);
    }
    return out;
  }, { b64, box });
};
const blobs = (pts) => {
  const key = (x, y) => y * 100000 + x, set = new Map(pts.map(p => [key(p[0], p[1]), p])), seen = new Set(), out = [];
  for (const [k0, p0] of set) {
    if (seen.has(k0)) continue;
    const st = [p0]; seen.add(k0); let n = 0, sx = 0, sy = 0;
    while (st.length) {
      const [x, y] = st.pop(); n++; sx += x; sy += y;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const kk = key(x + dx, y + dy); if (set.has(kk) && !seen.has(kk)) { seen.add(kk); st.push(set.get(kk)); }
      }
    }
    out.push({ x: sx / n, y: sy / n, n });
  }
  return out;
};

const rows = [], fail = [];
// 1 不冲过头
{
  const page = await fresh();
  await page.mouse.move(100, 200); await page.evaluate(() => __adv(4));
  await page.mouse.move(101, 200); await page.evaluate(() => __adv(90));
  await drag(page, 101, 200, 12, 30);
  const X = 101 + 12 * 30;
  let over = -1e9, back = 0, prev = (await center(page)).x;
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => __adv(1));
    const c = await center(page);
    over = Math.max(over, c.x - X); back = Math.max(back, prev - c.x); prev = c.x;
  }
  const ok = over <= 0.5 && back <= 0.25;
  rows.push(`1 不冲过头    停住后水珠最多越过指针 ${Math.max(0, over).toFixed(2)}px(要 ≤ 0.5)、最多往回退 ${back.toFixed(2)}px(要 ≤ 0.25)  ${ok ? '✓' : '✗'}`);
  if (!ok) fail.push(1);
  await page.close();
}
// 2 慢了不留痕
{
  const page = await fresh();
  await page.mouse.move(80, 200); await page.evaluate(() => __adv(4));
  await page.mouse.move(81, 200); await page.evaluate(() => __adv(90));
  await drag(page, 81, 200, 5, 150);                     // 走到 x=831
  await page.evaluate(() => __adv(1));
  // 水珠刚走过的 230px(46 帧以内):留下的东西就算会蒸发,这时也还在
  const pts = await changed(page, { x: 560, y: 160, width: 230, height: 80 });
  const ok = pts.length < 30;
  rows.push(`2 慢了不留痕  以 5px/帧拖过后,水珠刚走过的 230px 路径上被改动的像素 ${pts.length} 个(要 < 30)  ${ok ? '✓' : '✗'}`);
  if (!ok) fail.push(2);
  await page.close();
}
// 3 快了留串珠 + 4 静止回原样
{
  const page = await fresh();
  await page.mouse.move(60, 200); await page.evaluate(() => __adv(4));
  await page.mouse.move(61, 200); await page.evaluate(() => __adv(90));
  const w0 = (await center(page)).w;
  await drag(page, 61, 200, 20, 34);                     // 走到 x=741,停在最后几颗珠子旁边
  await page.evaluate(() => __adv(6));
  const box = { x: 150, y: 170, width: 560, height: 60 };
  const b1 = blobs(await changed(page, box));
  await page.evaluate(() => __adv(24));                  // 再过 400ms
  const b2 = blobs(await changed(page, box));
  const big = b1.filter(b => b.n >= 0.5 * Math.max(...b1.map(q => q.n), 1)).sort((a, b) => a.x - b.x);
  const gaps = big.slice(1).map((b, i) => b.x - big[i].x);
  const mean = gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length);
  const cv = gaps.length ? Math.sqrt(gaps.reduce((a, g) => a + (g - mean) * (g - mean), 0) / gaps.length) / mean : 9;
  const moves = [];
  for (const q of b2) {
    let best = 1e9; for (const p of b1) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
    if (best < 12) moves.push(best);
  }
  moves.sort((a, b) => a - b);
  const med = moves.length ? moves[Math.floor(moves.length / 2)] : 99, p90 = moves.length ? moves[Math.floor(moves.length * 0.9)] : 99;
  const ok3 = b1.length >= 5 && cv < 0.35 && moves.length >= Math.min(5, b2.length) && b2.length >= 3 && med < 0.4 && p90 < 1.2;
  rows.push(`3 快了留串珠  以 20px/帧拖过后 ${b1.length} 颗(大珠 ${big.length} 颗,间距 ${mean.toFixed(1)}px,变异系数 ${cv.toFixed(2)},要 < 0.35);` +
    `400ms 后 ${b2.length} 颗,对上 ${moves.length} 颗,位移中位数 ${med.toFixed(2)}px(要 < 0.4)、九成 ${p90.toFixed(2)}px(要 < 1.2)  ${ok3 ? '✓' : '✗'}`);
  if (!ok3) fail.push(3);
  for (const [i, y] of [60, 110, 160, 250, 300].entries()) {   // 再拖 5 条,方向来回交替、各走各的线
    const x0 = i % 2 ? 61 : 741, v = i % 2 ? 20 : -20;
    await page.mouse.move(x0, y); await page.evaluate(() => __adv(12));
    await drag(page, x0, y, v, 34);
  }
  await page.evaluate(() => __adv(8));
  const wLost = (await center(page)).w / w0;
  await page.evaluate(() => __adv(300));                 // 静止 5 秒
  const w1 = (await center(page)).w, ratio = w1 / w0;
  const ok4 = ratio >= 0.97 && ratio <= 1.03;
  rows.push(`4 静止回原样  6 次快拖后水珠是原来的 ${wLost.toFixed(3)} 倍,静止 5 秒后 ${ratio.toFixed(3)} 倍(要 0.97–1.03)  ${ok4 ? '✓' : '✗'}`);
  if (!ok4) fail.push(4);
  await page.close();
}
await browser.close();
console.log(`glass.js = ${jsPath}`);
console.log(rows.join('\n'));
console.log(fail.length ? `不通过:第 ${fail.join('、')} 条` : '通过:4 条都符合水珠在玻璃上滑动的物理');
process.exit(fail.length ? 1 : 0);
