// 把抠出的透明层放大 3 倍,分别叠在白底和磁青底上截图,看纸的位置有没有灰点、墨的边缘有没有白边
// 用法:node edge-check.js <抠出的.png> <输出.png> [--at=x,y](原图像素坐标,截取以它为中心;默认图中心)
const { chromium } = require(process.env.SKY + '/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [layer, out] = process.argv.slice(2);
  const at = (process.argv.find((x) => x.startsWith('--at=')) || '').slice(5).split(',').map(Number);
  const html = path.join(path.dirname(path.resolve(out)), 'edge-check.html');
  fs.writeFileSync(html, '<!doctype html><body style="margin:0;display:flex">' + ['#ffffff', '#14213a'].map((c) =>
    `<div style="position:relative;width:600px;height:420px;background:${c};overflow:hidden"><img src="${path.resolve(layer)}" style="position:absolute"></div>`).join('') + '</body>');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 420 } });
  await p.goto('file://' + html);
  await p.evaluate((at) => Promise.all([...document.images].map(async (i) => {
    await i.decode();
    const Z = 3, cx = at.length === 2 && at.every((v) => v >= 0) ? at[0] : i.naturalWidth / 2, cy = at.length === 2 ? at[1] : i.naturalHeight / 2;
    i.style.width = i.naturalWidth * Z + 'px';
    i.style.left = (300 - cx * Z) + 'px'; i.style.top = (210 - cy * Z) + 'px';
  })), at);
  await p.screenshot({ path: out }); await b.close(); console.log('写出', out);
})();
