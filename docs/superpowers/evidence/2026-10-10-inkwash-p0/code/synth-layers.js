// 合成两张「画在宣纸上」的测试图:远山(淡墨,上浓下淡)和近处一团浓墨,验证视差页能跑
const { PNG } = require(process.env.SKY + '/node_modules/pngjs');
const fs = require('fs');
const W = 1536, H = 864, paper = [242, 234, 216];
function make(file, inkAt) {
  const png = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, g = ((x * 7 + y * 13) % 11) - 5, k = inkAt(x, y);
    for (let ch = 0; ch < 3; ch++) png.data[i + ch] = Math.round((paper[ch] + g * 0.6) * (1 - k));
    png.data[i + 3] = 255;
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}
make('far.png', (x, y) => { const ridge = 330 + 90 * Math.sin(x / 210) + 40 * Math.sin(x / 63); return y > ridge ? Math.max(0, 0.38 - (y - ridge) / 600) : 0; });
make('near.png', (x, y) => (Math.hypot((x - 420) / 1.8, y - 640) < 70 ? 0.85 : 0));
console.log('far.png near.png');
