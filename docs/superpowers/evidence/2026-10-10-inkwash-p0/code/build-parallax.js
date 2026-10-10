// 小样 2 的视差测试页:远景、雾、近景三层,各自以不同速度横移;开场用打毛的圆形遮罩从中间晕开。
// 两种叠法:
//   A  用 layers.mjs 抠出的透明层,普通混合
//   B  直接用原图,先用颜色矩阵把纸色拉成纯白,再正片叠底(纸 × 白 = 纸,墨照常变深)
// 用法:node build-parallax.js <A|B> <远景图> <近景图> <输出.html> [--paper=r,g,b](B 需要)
const fs = require('fs'), path = require('path');
const [mode, far, near, out] = process.argv.slice(2);
const pp = process.argv.find((x) => x.startsWith('--paper='));
if (!['A', 'B'].includes(mode) || !far || !near || !out || (mode === 'B' && !pp)) {
  console.error('用法: node build-parallax.js <A|B> <远景图> <近景图> <输出.html> [--paper=r,g,b](B 需要)'); process.exit(2);
}
const P = pp ? pp.split('=')[1].split(',').map(Number) : null;
const rel = (f) => path.relative(path.dirname(path.resolve(out)), path.resolve(f));
const norm = P ? `${(255 / P[0]).toFixed(4)} 0 0 0 0  0 ${(255 / P[1]).toFixed(4)} 0 0 0  0 0 ${(255 / P[2]).toFixed(4)} 0 0  0 0 0 1 0` : '';
const layerCss = mode === 'B' ? 'mix-blend-mode:multiply;filter:url(#norm);' : '';
const html = `<!doctype html><meta charset="utf-8"><title>小样 2 · ${mode}</title>
<style>
:root{--paper:#f2ead8}
body{margin:0;background:var(--paper)}
.stage{position:relative;width:1280px;height:720px;overflow:hidden;background:var(--paper);isolation:isolate}
.layer{position:absolute;inset:-4% -8%;width:116%;height:108%;object-fit:cover;${layerCss}}
.far{animation:drift-far 12s linear forwards}
.near{animation:drift-near 12s linear forwards}
.mist{position:absolute;inset:0;background:radial-gradient(ellipse 60% 30% at 30% 62%,rgba(242,234,216,.85),rgba(242,234,216,0) 70%);animation:mist 12s ease-in-out forwards}
@keyframes drift-far{from{transform:translateX(0)}to{transform:translateX(-2%)}}
@keyframes drift-near{from{transform:translateX(0)}to{transform:translateX(-6%)}}
@keyframes mist{from{transform:translateX(-10%)}to{transform:translateX(12%)}}
.reveal{mask:url(#m);-webkit-mask:url(#m)}
#m circle{animation:open 2.4s ease-out forwards;r:0}
@keyframes open{to{r:900px}}
@media (prefers-reduced-motion:reduce){.far,.near,.mist{animation:none}#m circle{animation:none;r:900px}}
</style>
<svg width="0" height="0" style="position:absolute">
  <filter id="norm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${norm || '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0'}"/></filter>
  <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="90"/></filter>
  <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720"><g filter="url(#rough)"><circle cx="640" cy="360" fill="#fff"/></g></mask>
</svg>
<div class="stage reveal">
  <img class="layer far" src="${rel(far)}" alt="">
  <div class="mist"></div>
  <img class="layer near" src="${rel(near)}" alt="">
</div>`;
fs.writeFileSync(out, html);
console.log('写出', out);
