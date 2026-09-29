// 双击水珠的飞溅必须按水珠撞玻璃的物理走
//
// 为什么要查:v3 以前的飞溅是 7–9 条细长水舌在同一帧里整条出现,450ms 后
// 连同飞出去的小水珠一起被吸回水珠,水珠还会比双击前大 25%(吸回来的比飞出去的多)。
// 截图看着「有动静」,可每一条都和真水相反(2026-09-29 逐帧截图确认)。
//
// 查法:平滑彩色波纹的测试页(背景是算出来的,每个像素的原值都知道),虚拟时钟
// 逐帧推进,随机数固定种子,双击后在这些时刻截图,和原背景比出「水改动了哪里」:
//   1 扩展先快后慢   液膜边缘半径 r(t) 按 √t 增长:前 33ms 的增量 > 最后 33ms 增量的 1.5 倍
//                    (整条水舌一帧出现、或匀速扩展,都不过)
//   2 扩得开也收得回 最大半径是静止半径的 1.8–3.5 倍;600ms 后回到 1.3 倍以内
//   3 落地就不动     900ms 和 1500ms 两张图里,水珠一个个对上,位置差 < 0.75px,
//                    且至少 3 颗(没有水珠留下来也算不过,否则这条查了等于没查)
//   4 水量守恒       飞溅后的水珠不小于双击前的 0.9 倍,也不大于 1.05 倍
//
// 用法: node check_water_splash.mjs [glass.js 路径]
//   不给路径就查本 skill 的 assets/glass.js。
//   反向验证(各只加回一个 bug,每个都必须不过):液膜半径改成匀速扩展 → 第 1 条;
//   落地后每帧把水珠往水珠拉一点 → 第 3 条;飞溅结束时水量减半 → 第 4 条。
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

const W = 640, H = 480, CX = 320, CY = 240;
const dir = mkdtempSync(join(tmpdir(), 'water-splash-'));
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

const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
// 虚拟时钟:rAF 和 performance.now 都由脚本推进,截图多慢都不影响动画里的时间;随机数固定种子。
// __adv(n) 推进整 n 帧(每帧 16.667ms)—— 按毫秒推会差一帧:17ms 比一帧多一点,会走两帧
await page.addInitScript(() => {
  let z = 7; Math.random = () => { z = (z + 0x6D2B79F5) >>> 0; let t = z; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let T = 1000; const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  performance.now = () => T;
  window.__adv = (n) => { for (let i = 0; i < n; i++) { T += 16.667; const c = q.splice(0); c.forEach(f => f(T)); } };
});
await page.goto('file://' + page_html);
await page.waitForTimeout(600);
if (!await page.evaluate(() => !!document.querySelector('.glass-water-head'))) {
  console.log('不通过:水珠没有安装(浏览器不支持 backdrop-filter: url(),或 hover/pointer 条件不满足)');
  await browser.close(); process.exit(1);
}
await page.evaluate(() => __adv(12));
await page.mouse.move(CX - 30, CY - 10); await page.evaluate(() => __adv(6));
await page.mouse.move(CX, CY); await page.evaluate(() => __adv(150));
await page.waitForTimeout(200);
const headW = () => page.evaluate(() => document.querySelector('.glass-water-head').getBoundingClientRect().width);
const w0 = await headW();

// 截图 → 和算出来的原背景比,返回「改动过」的像素图
const shots = {};
const grab = async (t) => {
  const b64 = (await page.screenshot()).toString('base64');
  shots[t] = await page.evaluate(async (b64) => {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height).data, out = [];
    for (let j = 0; j < im.height; j++) for (let i = 0; i < im.width; i++) {
      const k = (j * im.width + i) * 4;
      const e = Math.abs(d[k] - Math.round(110 + 80 * Math.sin(i * 6.2832 / 26))) +
        Math.abs(d[k + 1] - Math.round(110 + 80 * Math.sin(j * 6.2832 / 22 + 1))) +
        Math.abs(d[k + 2] - Math.round(110 + 60 * Math.sin((i + j) * 6.2832 / 38)));
      if (e > 18) out.push(j * im.width + i);
    }
    return out;
  }, b64);
};
// 以 (CX,CY) 为圆心,每条射线上 R 以内最外面的改动点;取 180 条射线的中位数(指状突起和水珠只占少数射线)
const outerR = (t, R = 90) => {
  const set = new Set(shots[t]), rs = [];
  for (let k = 0; k < 180; k++) {
    const a = k * Math.PI / 90; let last = 0;
    for (let r = 0; r <= R; r += 0.5) {
      const X = Math.round(CX + r * Math.cos(a)), Y = Math.round(CY + r * Math.sin(a));
      if (set.has(Y * W + X)) last = r;
    }
    rs.push(last);
  }
  rs.sort((a, b) => a - b);
  return rs[90];
};
// 离开水珠 R 以外的改动像素,按连通块分成一颗颗水珠
const blobs = (t, R) => {
  const set = new Set(shots[t].filter(p => Math.hypot(p % W - CX, Math.floor(p / W) - CY) > R)), seen = new Set(), out = [];
  for (const p of set) {
    if (seen.has(p)) continue;
    const st = [p]; seen.add(p); let n = 0, sx = 0, sy = 0;
    while (st.length) {
      const q = st.pop(); n++; sx += q % W; sy += Math.floor(q / W);
      for (const d of [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1]) {
        const r = q + d; if (set.has(r) && !seen.has(r)) { seen.add(r); st.push(r); }
      }
    }
    if (n >= 2) out.push({ x: sx / n, y: sy / n, n });
  }
  return out;
};

await grab(0);
const r0 = outerR(0);
await page.mouse.dblclick(CX, CY);
// 双击后第 n 帧截图,按 60Hz 记成毫秒(17、33、50…)
const FR = [1, 2, 3, 4, 5, 6, 7, 8, 36, 54, 90, 156];
let fPrev = 0;
for (const f of FR) {
  await page.evaluate(n => __adv(n), f - fPrev); fPrev = f; await page.waitForTimeout(30);
  await grab(Math.round(f * 16.667));
}
const w1 = await headW();
await browser.close();

const rows = [], fail = [];
const r = Object.fromEntries([17, 33, 50, 67, 83, 100, 117, 133, 600].map(t => [t, outerR(t)]));
// 1
const early = r[50] - r[17], late = r[117] - r[83];
const ok1 = r[117] > r[17] && early > 1.5 * Math.max(late, 0.25);
rows.push(`1 扩展先快后慢  半径 ${[17, 33, 50, 67, 83, 100, 117].map(t => r[t].toFixed(1)).join(' → ')} px;` +
  `17→50ms 增 ${early.toFixed(1)},83→117ms 增 ${late.toFixed(1)}(要 > 1.5 倍)  ${ok1 ? '✓' : '✗'}`);
if (!ok1) fail.push(1);
// 2
const rMax = Math.max(...[67, 83, 100, 117, 133].map(t => r[t]));
const ok2 = rMax >= 1.8 * r0 && rMax <= 3.5 * r0 && r[600] <= 1.3 * r0;
rows.push(`2 扩得开收得回  静止 ${r0.toFixed(1)}px,最大 ${rMax.toFixed(1)}px(${(rMax / r0).toFixed(2)} 倍,要 1.8–3.5),` +
  `600ms 时 ${r[600].toFixed(1)}px(${(r[600] / r0).toFixed(2)} 倍,要 ≤ 1.3)  ${ok2 ? '✓' : '✗'}`);
if (!ok2) fail.push(2);
// 3
const b1 = blobs(900, r0 * 1.6), b2 = blobs(1500, r0 * 1.6);
let worst = 0, matched = 0;
for (const q of b2) {
  let best = 1e9; for (const p of b1) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best < 12) { matched++; worst = Math.max(worst, best); }
}
const ok3 = b1.length >= 3 && matched >= Math.min(3, b2.length) && worst < 0.75 && b2.length >= 1;
rows.push(`3 落地就不动    900ms 有 ${b1.length} 颗、1500ms 有 ${b2.length} 颗,对上 ${matched} 颗,最大位移 ${worst.toFixed(2)}px(要 < 0.75)  ${ok3 ? '✓' : '✗'}`);
if (!ok3) fail.push(3);
// 4
const ratio = w1 / w0;
const ok4 = ratio >= 0.9 && ratio <= 1.05;
rows.push(`4 水量守恒      飞溅后水珠是双击前的 ${ratio.toFixed(3)} 倍(要 0.9–1.05)  ${ok4 ? '✓' : '✗'}`);
if (!ok4) fail.push(4);

console.log(`glass.js = ${jsPath}`);
console.log(rows.join('\n'));
console.log(fail.length ? `不通过:第 ${fail.join('、')} 条` : '通过:4 条都符合水珠撞玻璃的物理');
process.exit(fail.length ? 1 : 0);
