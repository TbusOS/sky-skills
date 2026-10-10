// 用法:node shoot.js <页面.html> <输出目录> <秒,逗号分隔> [--reduced] [--size=780x360]
// 每个时刻把所有动画暂停并拨到这一刻再截图;同时数「墨色像素」(亮度 < 120)
const { chromium } = require(process.env.SKY + '/node_modules/playwright');
const { PNG } = require(process.env.SKY + '/node_modules/pngjs');
const fs = require('fs'), path = require('path');
(async () => {
  const [page_, outDir, ts] = process.argv.slice(2);
  const reduced = process.argv.includes('--reduced');
  const sz = (process.argv.find((x) => x.startsWith('--size=')) || '--size=780x360').slice(7).split('x').map(Number);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: sz[0], height: sz[1] }, deviceScaleFactor: sz[0] > 1000 ? 1 : 2, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await page.goto('file://' + path.resolve(page_));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  const out = {};
  for (const t of ts.split(',').map(Number)) {
    await page.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; }), t);
    const buf = await page.screenshot();
    const name = (reduced ? 'reduced' : 't' + t) + '.png';
    fs.writeFileSync(path.join(outDir, name), buf);
    const png = PNG.sync.read(buf); let dark = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const L = 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
      if (L < 120) dark++;
    }
    out[name] = dark;
  }
  console.log(JSON.stringify(out));
  await browser.close();
})();
