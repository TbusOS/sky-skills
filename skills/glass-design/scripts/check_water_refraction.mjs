// 水珠光标的折射必须落在水珠里面
//
// 为什么要查:水珠靠 backdrop-filter 的位移图折射页面。Chromium 里元素一带
// rotate(),位移图就贴错位置 —— 折射跑到水珠旁边,水珠自己什么都不折射。
// v2 就是这样:水珠按运动方向旋转,停下后保持最后的角度,所以除非最后一下
// 正好水平向右,静止的水珠都是错的(2026-09-29 实测)。截图肉眼看很难发现,
// 通用的四道检查也不看光标。
//
// 查法:平滑彩色波纹的测试页,从 8 个方向把水珠拖到同一点停住,各拍两张:
//   plain  藏起水珠,只有页面        A  水珠照常,但去掉高光贴图(只剩折射)
// 再按水珠此刻用的位移图(feImage 的 href)和滤镜参数,从 plain 算出「折射后
// 应该是什么样」E。要求水珠内圈(半径 0.8·R)里:
//   · A 和 plain 的平均差 > 6    —— 真的在折射
//   · A 和 E 的平均差 < 0.45 × A 和 plain 的平均差 —— 折射落在位移图说的位置
// 旋转造成的错位会让 A 和 E 对不上。只看「有没有像素变了」抓不到它:
// 错位的折射仍在水珠外框里,内圈也照样被改变(2026-09-29 这样试过,旧版照过)。
//
// 用法: node check_water_refraction.mjs [glass.js 路径] [--dpr=2]
//   不给路径就查本 skill 的 assets/glass.js。
//   反向验证:把新版 head 的 transform 加回 rotate(),必须不过。
import { mkdtempSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { tmpdir, homedir } from 'os';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const jsPath = resolve(args.find(a => !a.startsWith('--')) || join(HERE, '../assets/glass.js'));
const cssPath = resolve(join(HERE, '../assets/glass.css'));
const dpr = Number((args.find(a => a.startsWith('--dpr=')) || '--dpr=1').slice(6)) || 1;
if (!existsSync(jsPath)) { console.error('找不到 ' + jsPath); process.exit(2); }

// playwright:仓库根的 node_modules 或 PLAYWRIGHT_PATH。浏览器版本对不上时退回缓存里最新的
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

const dir = mkdtempSync(join(tmpdir(), 'water-check-'));
const page_html = join(dir, 'grid.html');
writeFileSync(page_html, `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${cssPath}">
<style>html,body{margin:0;height:100%;background:#000}#bg{position:fixed;inset:0;width:100%;height:100%}</style></head>
<body><canvas id="bg"></canvas><script>
// 平滑的彩色波纹:每处颜色都不一样、没有硬边,错位几个像素就看得出来
var c=document.getElementById('bg'),W=c.width=innerWidth,H=c.height=innerHeight,x=c.getContext('2d'),im=x.createImageData(W,H);
for(var j=0;j<H;j++)for(var i=0;i<W;i++){var k=(j*W+i)*4;
 im.data[k]=110+80*Math.sin(i*6.2832/26);im.data[k+1]=110+80*Math.sin(j*6.2832/22+1);
 im.data[k+2]=110+60*Math.sin((i+j)*6.2832/38);im.data[k+3]=255;}
x.putImageData(im,0,0);
</script><script src="file://${jsPath}"></script></body></html>`);

const CX = 300, CY = 200;
const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: dpr });
await page.goto('file://' + page_html);
await page.waitForTimeout(900);
const installed = await page.evaluate(() => !!document.querySelector('.glass-water-head'));
if (!installed) { console.log('不通过:水珠没有安装(浏览器不支持 backdrop-filter: url(),或 hover/pointer 条件不满足)'); await browser.close(); process.exit(1); }

const CLIP = { x: CX - 80, y: CY - 80, width: 160, height: 160 };
const grab = async () => (await page.screenshot({ clip: CLIP })).toString('base64');

let fail = 0;
const rows = [];
for (let i = 0; i < 8; i++) {
  const ang = i * Math.PI / 4 + 0.3;                        // 8 个方向,都避开正好水平
  await page.mouse.move(CX - Math.cos(ang) * 90, CY - Math.sin(ang) * 90);
  await page.waitForTimeout(450);
  await page.mouse.move(CX, CY, { steps: 7 });
  await page.waitForTimeout(1700);                          // 停稳、水痕蒸发、卫星珠消失
  const hide = (on) => page.evaluate((on) => {
    document.querySelectorAll('.glass-water-fx, .glass-water-bead, .glass-water-trail').forEach(e => e.style.visibility = 'hidden');
    const h = document.querySelector('.glass-water-head');
    if (on === 'plain') h.style.visibility = 'hidden';
    else { h.style.visibility = 'visible'; h.dataset.bg = h.dataset.bg || h.style.backgroundImage; h.style.backgroundImage = 'none'; h.style.backgroundColor = 'transparent'; }
  }, on);
  await hide('plain'); await page.waitForTimeout(100);
  const plain = await grab();
  await hide('lens'); await page.waitForTimeout(100);
  const A = await grab();
  const m = await page.evaluate(async ({ plain, A, CLIP }) => {
    const load = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    const px = async (src) => { const im = await load(src); const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      return { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data }; };
    const P = await px('data:image/png;base64,' + plain), Q = await px('data:image/png;base64,' + A);
    const head = document.querySelector('.glass-water-head'), r = head.getBoundingClientRect();
    const mapEl = document.getElementById('glassWaterHeadMap');
    const MAP = await px(mapEl.getAttribute('href'));
    const sc = (id) => Number(document.getElementById(id).getAttribute('scale'));
    // v3 一次位移(glassWaterHeadD);v2 按 R/G/B 三次位移做色散
    const scales = document.getElementById('glassWaterHeadD')
      ? [0, 0, 0].map(() => sc('glassWaterHeadD'))
      : [sc('glassWaterHeadR'), sc('glassWaterHeadG'), sc('glassWaterHeadB')];
    // 光照乘子(v3 有:feComposite in=SourceGraphic 的 arithmetic k1/k2);没有就当 1
    const lit = document.querySelector('#glassWaterHead feComposite[in="SourceGraphic"]');
    const k1 = lit ? Number(lit.getAttribute('k1')) : 0, k2 = lit ? Number(lit.getAttribute('k2')) : 1;
    const S = Number(mapEl.getAttribute('width')), s = P.w / CLIP.width;   // S:元素的 CSS 边长(未缩放)
    const zoom = r.width / S;                                   // 元素 transform 的缩放
    const at = (img, X, Y, ch) => {                             // 截图里 CSS 坐标 (X,Y) 的双线性采样
      const fx = (X - CLIP.x) * s - 0.5, fy = (Y - CLIP.y) * s - 0.5;
      const ix = Math.max(0, Math.min(img.w - 2, Math.floor(fx))), iy = Math.max(0, Math.min(img.h - 2, Math.floor(fy)));
      const ax = Math.max(0, Math.min(1, fx - ix)), ay = Math.max(0, Math.min(1, fy - iy));
      const g = (xx, yy) => img.d[(yy * img.w + xx) * 4 + ch];
      return (g(ix, iy) * (1 - ax) + g(ix + 1, iy) * ax) * (1 - ay) + (g(ix, iy + 1) * (1 - ax) + g(ix + 1, iy + 1) * ax) * ay;
    };
    const mapAt = (X, Y, ch) => {                               // 位移图在屏幕点 (X,Y) 的取值 0..1
      const u = Math.floor((X - r.left) / r.width * MAP.w), v = Math.floor((Y - r.top) / r.height * MAP.h);
      if (u < 0 || v < 0 || u >= MAP.w || v >= MAP.h) return ch === 2 ? null : 0.5;
      return MAP.d[(v * MAP.w + u) * 4 + ch] / 255;
    };
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, R = 16 * 0.8;
    let n = 0, eE = 0, eP = 0;
    for (let yy = 0; yy < Q.h; yy++) for (let xx = 0; xx < Q.w; xx++) {
      const X = CLIP.x + (xx + 0.5) / s, Y = CLIP.y + (yy + 0.5) / s;
      if (Math.hypot(X - cx, Y - cy) > R) continue;
      const cr = mapAt(X, Y, 0), cg = mapAt(X, Y, 1);
      for (let ch = 0; ch < 3; ch++) {
        const SX = X + zoom * scales[ch] * (cr - 0.5), SY = Y + zoom * scales[ch] * (cg - 0.5);
        const b = mapAt(SX, SY, 2);
        const M = lit && b != null ? k2 + k1 * b : 1;
        const E = Math.min(255, at(P, SX, SY, ch) * M);
        const got = Q.d[(yy * Q.w + xx) * 4 + ch];
        eE += Math.abs(got - E); eP += Math.abs(got - P.d[(yy * Q.w + xx) * 4 + ch]);
      }
      n++;
    }
    return { eE: eE / Math.max(1, n * 3), eP: eP / Math.max(1, n * 3), n };
  }, { plain, A, CLIP });
  await page.evaluate(() => {
    document.querySelectorAll('.glass-water-fx, .glass-water-bead, .glass-water-trail').forEach(e => e.style.visibility = '');
    const h = document.querySelector('.glass-water-head'); h.style.visibility = ''; h.style.backgroundImage = h.dataset.bg || ''; });
  const ok = m.eP > 6 && m.eE < 0.45 * m.eP;
  if (!ok) fail++;
  rows.push(`方向 ${String(Math.round(ang * 180 / Math.PI)).padStart(3)}°  折射改变量 ${m.eP.toFixed(1)}  ` +
    `与位移图的偏差 ${m.eE.toFixed(1)}(${(m.eE / Math.max(1e-6, m.eP) * 100).toFixed(0)}%,上限 45%)  ${ok ? '✓' : '✗'}`);
}
await browser.close();
console.log(`glass.js = ${jsPath}  (dpr ${dpr})`);
console.log(rows.join('\n'));
console.log(fail ? `不通过:${fail} / 8 个方向的折射不在位移图说的位置` : '通过:8 个方向停下后,折射都落在位移图说的位置');
process.exit(fail ? 1 : 0);
