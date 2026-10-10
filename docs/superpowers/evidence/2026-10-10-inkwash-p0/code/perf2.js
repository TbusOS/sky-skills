// 对照:同一个 200 笔页面,分别去掉各个滤镜;再量 graphite 的图例库页;两种浏览器启动方式
const { chromium } = require(process.env.SKY + '/node_modules/playwright');
const fs = require('fs'), path = require('path');
const base = fs.readFileSync(path.join(__dirname, 'perf-200.html'), 'utf8');
const variants = {
  '原样': base,
  '去掉整组打毛滤镜': base.replace('filter="url(#bp-rough)"', ''),
  '去掉晕边滤镜': base.replace(/filter:url\(#bp-halo\)/g, 'filter:none'),
  '去掉正片叠底': base.replace('.bp-ink{mix-blend-mode:multiply}', ''),
  '三样都去掉': base.replace('filter="url(#bp-rough)"', '').replace(/filter:url\(#bp-halo\)/g, 'filter:none').replace('.bp-ink{mix-blend-mode:multiply}', ''),
};
async function measure(browser, url) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(url); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const gaps = await p.evaluate(() => new Promise(res => { const g = []; let last = performance.now(); const t0 = last;
    function f(now) { g.push(now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(f); else res(g); } requestAnimationFrame(f); }));
  gaps.sort((a, b) => a - b); await p.close();
  return Math.round(gaps[Math.floor(gaps.length * 0.95)] * 10) / 10;
}
(async () => {
  for (const [label, opts] of [['默认无头', {}], ['打开 GPU', { args: ['--enable-gpu', '--use-angle=metal', '--enable-unsafe-swiftshader'] }]]) {
    const browser = await chromium.launch(opts);
    const rows = [];
    for (const [k, html] of Object.entries(variants)) {
      const f = path.join(__dirname, 'v.html'); fs.writeFileSync(f, html);
      rows.push({ 浏览器: label, 页面: '200 笔 · ' + k, p95帧间隔ms: await measure(browser, 'file://' + f) });
    }
    rows.push({ 浏览器: label, 页面: 'graphite 图例库(对照)', p95帧间隔ms: await measure(browser, 'file://' + process.env.SKY + '/demos/graphite-design/diagrams.html') });
    console.table(rows);
    await browser.close();
  }
})();
