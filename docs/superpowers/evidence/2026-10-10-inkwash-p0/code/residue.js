// 数抠出来的透明层里「淡得几乎看不见、但又没清零」的像素:0 < alpha < 0.1。
// 这类像素多,说明纸纹没清干净,换个底色会显成一层灰,要调高 --floor。
// 用法:node residue.js <抠出的.png> [更多…]
const { PNG } = require(process.env.SKY + '/node_modules/pngjs');
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const png = PNG.sync.read(fs.readFileSync(f));
  let faint = 0, clear = 0, total = png.width * png.height;
  for (let i = 3; i < png.data.length; i += 4) {
    const a = png.data[i];
    if (a === 0) clear++; else if (a < 26) faint++;
  }
  console.log(`${f}: 全透明 ${(100 * clear / total).toFixed(1)}% · 残留(0<alpha<0.1)${(100 * faint / total).toFixed(2)}%`);
}
