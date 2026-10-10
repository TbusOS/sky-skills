// layers.mjs — cut an ink painting made on plain paper into a transparent layer, so the
// layers of one landscape (far / middle / near, each painted separately by the image
// model) can move at different speeds over the page (parallax) with mist between them.
//
// From P0 spike 2 (design §7, §16.4), unchanged except this header:
// 小样 2:把画在宣纸上的水墨位图抠成透明层。
//
// 做法(和 GIMP 的「颜色转透明」同一个思路):假设墨最深能到纯黑,每个像素取
// 「把纸色变成它,最少要盖多少墨」当透明度 a = max_c (P_c − C_c) / P_c,
// 再按「叠在纸上」反推墨的颜色 I_c = (C_c − (1 − a)·P_c) / a。
// 叠回同一张纸上,结果和原图逐像素相同;叠到别的底上,颜色也说得通。
// 纸上细小的颗粒(a < floor)直接清零,不然换个底色会带出一层灰。
//
// 用法:node layers.mjs extract <输入图> <输出.png> [--floor=0.04] [--paper=r,g,b]
//       node layers.mjs --selftest
// 本机 python 没有 PIL,所以像素处理放在 playwright 打开的浏览器里做。
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// the repository root (scripts/ → skill → skills → root), for its node_modules
const SKY = process.env.SKY || new URL('../../..', import.meta.url).pathname;
const require = createRequire(join(SKY, 'package.json'));
const { chromium } = require('playwright');
const { PNG } = require('pngjs');

// 在浏览器里跑的部分:估纸色、算透明度和墨色
function extractInPage({ dataUrl, floor, paper }) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
      // 纸色:亮度直方图里像素最多的那一档(水墨画留白多,这一档就是纸),
      // 取这一档 ±6 以内像素的各通道中位数。不用「最亮的一批」:那批落在纸纹的亮端,
      // 估出来偏亮,纸纹就被当成淡墨留了下来(2026-10-10 自测实测:白底上 4.4% 灰点)。
      const hist = new Array(256).fill(0), L = new Uint8Array(px.length / 4);
      for (let i = 0, k = 0; i < px.length; i += 4, k++) { L[k] = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]); hist[L[k]]++; }
      let mode = 0; for (let v = 1; v < 256; v++) if (hist[v] > hist[mode]) mode = v;
      const top = []; for (let k = 0; k < L.length; k++) if (Math.abs(L[k] - mode) <= 6) top.push([0, k * 4]);
      const med = (ch) => { const v = top.map(([, i]) => px[i + ch]).sort((a, b) => a - b); return v[v.length >> 1]; };
      // 纸那一档像素太少、或者太暗,说明画面大半是墨(满幅泼墨),众数不是纸 —— 估出来的值不可信
      const share = top.length / L.length, suspicious = share < 0.15 || mode < 150;
      const P = paper || [med(0), med(1), med(2)];
      for (let i = 0; i < px.length; i += 4) {
        let a = 0;
        for (let ch = 0; ch < 3; ch++) a = Math.max(a, (P[ch] - px[i + ch]) / P[ch]);
        // 纸纹清零用软过渡:floor/2 以下清零,floor/2 到 2·floor 之间按比例淡出。
        // 一刀切(a < floor 就清零)会把平滑变淡的雾切出一圈参差的硬边(2026-10-11 真图实测)
        const lo = floor / 2, hi = floor * 2;
        if (a < lo) { px[i + 3] = 0; continue; }
        if (a < hi) a = a * (a - lo) / (hi - lo);
        a = Math.min(1, a);
        for (let ch = 0; ch < 3; ch++) px[i + ch] = Math.max(0, Math.min(255, Math.round((px[i + ch] - (1 - a) * P[ch]) / a)));
        px[i + 3] = Math.round(a * 255);
      }
      g.putImageData(d, 0, 0);
      resolve({ paper: P, share, mode, suspicious: !paper && suspicious, png: c.toDataURL('image/png') });
    };
    img.src = dataUrl;
  });
}

export async function extract(input, output, floor = 0.04, paper = null) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const mime = input.endsWith('.png') ? 'image/png' : input.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,` + readFileSync(input).toString('base64');
    const r = await page.evaluate(extractInPage, { dataUrl, floor, paper });
    if (r.suspicious) console.warn(`警告:像素最多的那一档亮度 ${r.mode}、占 ${(r.share * 100).toFixed(1)}%,看起来不是纸;估出的纸色 ${r.paper} 可能不对,画面大半是墨时请用 --paper=r,g,b 指定`);
    writeFileSync(output, Buffer.from(r.png.split(',')[1], 'base64'));
    return r;
  } finally { await browser.close(); }
}

// 把透明层叠到纯色底上(普通混合),返回 RGBA 缓冲
function over(layer, bg) {
  const out = Buffer.alloc(layer.data.length);
  for (let i = 0; i < layer.data.length; i += 4) {
    const a = layer.data[i + 3] / 255;
    for (let ch = 0; ch < 3; ch++) out[i + ch] = Math.round(layer.data[i + ch] * a + bg[ch] * (1 - a));
    out[i + 3] = 255;
  }
  return out;
}

async function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'layers-'));
  const W = 240, H = 160, paper = [242, 234, 216];
  const src = new PNG({ width: W, height: H }), inkMask = new Uint8Array(W * H);
  let seed = 7; const r = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, grain = (r() - 0.5) * 10;         // 纸上 ±5 的颗粒(去掉清零那步时,白底上会留下灰点)
    let c = paper.map((v) => v + grain);
    if (Math.hypot(x - 70, y - 80) < 34) { c = c.map((v) => v * 0.15); inkMask[y * W + x] = 1; }            // 一团焦墨
    else if (x > 130 && x < 220 && y > 40 && y < 120) { c = [c[0] * 0.55, c[1] * 0.7, c[2] * 0.9]; inkMask[y * W + x] = 1; } // 一片花青
    for (let ch = 0; ch < 3; ch++) src.data[i + ch] = Math.max(0, Math.min(255, Math.round(c[ch])));
    src.data[i + 3] = 255;
  }
  const inPath = join(dir, 'in.png'), outPath = join(dir, 'out.png');
  writeFileSync(inPath, PNG.sync.write(src));
  const est = (await extract(inPath, outPath, 0.04)).paper;
  const layer = PNG.sync.read(readFileSync(outPath));
  let fail = 0;
  const check = (name, ok, detail) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + ' — ' + detail); if (!ok) fail = 1; };

  check('估出的纸色接近真纸色', est.every((v, k) => Math.abs(v - paper[k]) <= 3), `估 ${est} / 真 ${paper}`);
  // 叠回原纸色:有墨的地方逐像素接近原图
  const back = over(layer, est); let sum = 0, cnt = 0;
  for (let p = 0; p < W * H; p++) if (inkMask[p]) { for (let ch = 0; ch < 3; ch++) sum += Math.abs(back[p * 4 + ch] - src.data[p * 4 + ch]); cnt += 3; }
  check('叠回原纸,墨的部分和原图一样', sum / cnt < 1.5, `平均差 ${(sum / cnt).toFixed(2)}`);
  // 叠到磁青纸上:原本是纸的地方不能留下灰色残留
  const dark = [20, 33, 58], onDark = over(layer, dark); let residue = 0, paperPx = 0;
  for (let p = 0; p < W * H; p++) if (!inkMask[p]) {
    paperPx++;
    const diff = Math.max(...[0, 1, 2].map((ch) => Math.abs(onDark[p * 4 + ch] - dark[ch])));
    if (diff > 8) residue++;
  }
  check('换到深底,纸的部分没有残留', residue / paperPx < 0.005, `残留 ${(100 * residue / paperPx).toFixed(2)}%`);
  // 叠到白底上:纸颗粒没清掉的话,会在白底上显成灰点
  const white = [255, 255, 255], onWhite = over(layer, white); let grey = 0;
  for (let p = 0; p < W * H; p++) if (!inkMask[p]) {
    const diff = Math.max(...[0, 1, 2].map((ch) => Math.abs(onWhite[p * 4 + ch] - white[ch])));
    if (diff > 4) grey++;                 // 纸纹 ±5 不清零时,灰点偏差约 5–6,超过 4
  }
  check('换到白底,纸的部分没有灰点', grey / paperPx < 0.005, `灰点 ${(100 * grey / paperPx).toFixed(2)}%`);
  // 焦墨那团要几乎不透明
  const core = layer.data[(80 * W + 70) * 4 + 3];
  check('焦墨处几乎不透明', core > 200, `alpha ${core}`);
  // 满幅泼墨:七成画面是一片均匀的墨,众数落在墨上,必须报警告;手动给纸色后不再警告。
  // (墨色深浅不一时众数仍是纸,估得对,不该报 —— 第一版测试图就是这样,警告没触发是对的)
  const big = new PNG({ width: W, height: H });
  for (let p = 0; p < W * H; p++) { const ink = (p % W) < W * 0.7; for (let ch = 0; ch < 3; ch++) big.data[p * 4 + ch] = ink ? 40 : paper[ch]; big.data[p * 4 + 3] = 255; }
  const bigIn = join(dir, 'big.png'); writeFileSync(bigIn, PNG.sync.write(big));
  const r1 = await extract(bigIn, join(dir, 'big-out.png'), 0.04);
  check('满幅泼墨时报警告', r1.suspicious === true, `最多那一档亮度 ${r1.mode}、占 ${(r1.share * 100).toFixed(1)}%`);
  const r2 = await extract(bigIn, join(dir, 'big-out2.png'), 0.04, paper);
  check('手动给纸色后不再警告、用的是给的值', r2.suspicious === false && r2.paper.join() === paper.join(), `纸色 ${r2.paper}`);
  console.log(fail ? 'selftest: 有失败' : 'selftest: 全部通过');
  process.exit(fail);
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === '--selftest') await selftest();
else if (cmd === 'extract' && a && b) {
  const fl = process.argv.find((x) => x.startsWith('--floor='));
  const pp = process.argv.find((x) => x.startsWith('--paper='));
  const given = pp ? pp.split('=')[1].split(',').map(Number) : null;
  if (given && (given.length !== 3 || given.some((v) => !(v >= 0 && v <= 255)))) { console.error('--paper 要写成 r,g,b,每个 0–255'); process.exit(2); }
  const r = await extract(a, b, fl ? Number(fl.split('=')[1]) : 0.04, given);
  console.log('纸色', r.paper.join(','), '→', b);
} else { console.log('用法: node layers.mjs extract <输入图> <输出.png> [--floor=0.04] [--paper=r,g,b] | --selftest'); process.exit(2); }
