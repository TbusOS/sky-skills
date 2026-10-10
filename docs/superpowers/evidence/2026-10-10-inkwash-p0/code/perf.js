// 小样 3:N 笔竹叶,量 ① 生成 SVG 的耗时 ② 浏览器实时播放时的帧间隔 ③ 逐帧导出(拨时间 + 截图)每帧耗时
// 用法:SKY=<仓库根> node perf.js 50,100,200,400 [--gpu]
// --gpu:用 --enable-gpu --use-angle=metal 启动(默认无头是软件渲染)。
// 局限:帧间隔量的是主线程的 requestAnimationFrame,只说明主线程每帧都跑了;
//       栅格化跟不上时画面会跳帧而这个数照样是 16.8 ms。真实观感要在有窗口的浏览器里看。
const { chromium } = require(process.env.SKY + '/node_modules/playwright');
const B = require(process.env.BRUSH || './brush-proto.js');   // BRUSH=./其他版本.js 可换画笔做对比
const fs = require('fs'), path = require('path');
function page(n) {
  const t0 = process.hrtime.bigint();
  const b = B.create({ seed: 11, id: 'p' + n }), r = B.rng(5), dur = 6;
  for (let i = 0; i < n; i++) {
    const x = 40 + r() * 1200, y = 40 + r() * 620, ang = r() * Math.PI * 2, len = 40 + r() * 70;
    const mx = x + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 12, my = y + Math.sin(ang) * len * 0.5 + (r() - 0.5) * 12;
    b.stroke([[x, y], [mx, my], [x + Math.cos(ang) * len, y + Math.sin(ang) * len]],
      { width: 8 + r() * 10, press: 'leaf', load: 0.5 + r() * 0.45, tone: ['nong', 'zhong', 'dan'][i % 3], start: i * dur / n, dur: 0.35 });
  }
  const svg = b.svg(1280, 720);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const html = '<!doctype html><meta charset="utf-8"><style>' + B.CSS + 'body{margin:0}</style>' + svg;
  const f = path.join(__dirname, 'perf-' + n + '.html'); fs.writeFileSync(f, html);
  return { f, ms, bytes: html.length, elems: (svg.match(/<(path|g|mask|rect|text)\b/g) || []).length };
}
(async () => {
  const gpu = process.argv.includes('--gpu');
  const browser = await chromium.launch(gpu ? { args: ['--enable-gpu', '--use-angle=metal'] } : {});
  const rows = [];
  for (const n of process.argv[2].split(',').map(Number)) {
    const { f, ms, bytes, elems } = page(n);
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const tl = Date.now(); await p.goto('file://' + f); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const loadMs = Date.now() - tl;
    // 实时播放 3 秒(动画正在画的那段),记下每一帧的间隔
    const gaps = await p.evaluate(() => new Promise(res => { const g = []; let last = performance.now(); const t0 = last;
      function f(now) { g.push(now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(f); else res(g); } requestAnimationFrame(f); }));
    gaps.sort((a, b) => a - b);
    const p95 = gaps[Math.floor(gaps.length * 0.95)];
    // 逐帧导出:拨到某一刻再截图,做 20 帧
    const te = Date.now();
    for (let k = 0; k < 20; k++) {
      await p.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; }), k * 0.3);
      await p.screenshot();
    }
    const perFrame = (Date.now() - te) / 20;
    rows.push({ n, elems, kb: Math.round(bytes / 1024), buildMs: Math.round(ms), loadMs, frames: gaps.length, p95FrameMs: Math.round(p95 * 10) / 10, exportMsPerFrame: Math.round(perFrame) });
    await p.close();
  }
  console.log(gpu ? '浏览器:打开 GPU' : '浏览器:默认无头(软件渲染)');
  console.table(rows);
  await browser.close();
})();
