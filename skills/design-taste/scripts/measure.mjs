// measure.mjs — read a picture the reader likes and measure what can honestly be
// measured: how much empty paper, how the ink tones spread, how many colours,
// how soft the edges are. Used by `taste.mjs ref`.
//
// Why a browser: the reader's pictures are JPEG / PNG / WebP of any size, and this
// machine has no Python imaging library. Chromium decodes all of them; we draw the
// picture on a canvas (longest side ≤ 640 px) and count pixels there.
//
// What comes back, per picture (all shares are 0–1):
//   paper      [r,g,b] — the most common colour (in an ink painting that is the paper;
//              on a dark page it is the dark ground, which is still "the empty part")
//   whitespace share of pixels within 24 of the paper colour
//   tones      five shares of the non-paper pixels, strongest contrast first (焦 浓 重 淡 清),
//              by lightness distance from the paper (works on light and dark grounds)
//   colors     how many hue groups hold > 3 % of the non-paper pixels (grey ink not counted)
//   hues       those groups' centre hues in degrees
//   soft       among edge pixels, the share whose step is gentle (wet, bled) rather than sharp
// What is NOT measured: dry-brush streaks (飞白). Tried counting thin light gaps inside
// strokes; paper texture and JPEG noise produce the same pattern, so the number meant
// nothing. Styles must not map anything to it.
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

function pageScript(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('image did not decode'));
    img.onload = () => {
      const s = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, n = w * h;
      // paper = the fullest 4-bit colour bucket, averaged
      const buckets = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const key = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
        const b = buckets.get(key) || [0, 0, 0, 0]; b[0]++; b[1] += d[i]; b[2] += d[i + 1]; b[3] += d[i + 2]; buckets.set(key, b);
      }
      let top = null; for (const b of buckets.values()) if (!top || b[0] > top[0]) top = b;
      const paper = [top[1] / top[0], top[2] / top[0], top[3] / top[0]];
      const lum = (r, g2, b) => 0.299 * r + 0.587 * g2 + 0.114 * b;
      const pl = lum(paper[0], paper[1], paper[2]);
      let blank = 0, ink = 0; const tones = [0, 0, 0, 0, 0], hueBins = new Array(24).fill(0);
      const isPaper = new Uint8Array(n);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const r = d[i], g2 = d[i + 1], b = d[i + 2];
        const dist = Math.hypot(r - paper[0], g2 - paper[1], b - paper[2]);
        if (dist < 24) { blank++; isPaper[p] = 1; continue; }
        ink++;
        // tone = contrast against the paper, so a dark page (gold on indigo) reads the same
        // way as ink on rice paper: the strongest contrast is 焦, the faintest 清
        const L = lum(r, g2, b), span = Math.max(pl, 255 - pl, 1), band = Math.min(4, Math.max(0, 4 - Math.floor(Math.abs(L - pl) / span * 5)));
        tones[band]++;
        const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b);
        if (mx - mn > 40) {
          let hue; const dd = mx - mn;
          if (mx === r) hue = ((g2 - b) / dd + 6) % 6; else if (mx === g2) hue = (b - r) / dd + 2; else hue = (r - g2) / dd + 4;
          hueBins[Math.floor(hue * 4) % 24]++;
        }
      }
      // hue groups: runs of neighbouring bins, kept if the group holds > 3 % of the ink
      const groups = []; let cur = null;
      for (let k = 0; k < 24; k++) {
        if (hueBins[k] > 0) { if (!cur) cur = { from: k, sum: 0, w: 0 }; cur.sum += hueBins[k]; cur.w += hueBins[k] * k; }
        else if (cur) { groups.push(cur); cur = null; }
      }
      if (cur) {
        if (groups.length && groups[0].from === 0) { groups[0].sum += cur.sum; groups[0].w += cur.w - 24 * cur.sum; } else groups.push(cur);
      }
      const big = groups.filter(gr => ink && gr.sum / ink > 0.03);
      // edges: horizontal + vertical steps in lightness
      let soft = 0, hard = 0;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4, L0 = lum(d[i], d[i + 1], d[i + 2]);
        const gx = Math.abs(lum(d[i + 4], d[i + 5], d[i + 6]) - L0), gy = Math.abs(lum(d[i + w * 4], d[i + w * 4 + 1], d[i + w * 4 + 2]) - L0);
        const gm = Math.max(gx, gy);
        if (gm > 45) hard++; else if (gm > 6) soft++;
      }
      resolve({ w, h, paper: paper.map(Math.round), whitespace: blank / n,
        tones: tones.map(t => ink ? t / ink : 0), colors: big.length,
        hues: big.map(gr => Math.round(((gr.w / gr.sum + 24) % 24) * 15)),
        soft: soft + hard ? soft / (soft + hard) : 0 });
    };
    img.src = dataUrl;
  });
}

// measure(['a.jpg', …]) -> [{ file, …numbers }]. Throws on files it cannot decode.
export async function measure(files, { browser } = {}) {
  const { chromium } = require('playwright');
  const own = !browser;
  const b = browser || await chromium.launch();
  try {
    const page = await b.newPage();
    const out = [];
    for (const f of files) {
      const mime = MIME[extname(f).toLowerCase()];
      if (!mime) throw new Error(`${f}: not a picture this can read (png / jpg / webp / gif)`);
      const url = `data:${mime};base64,${readFileSync(f).toString('base64')}`;
      const r = await page.evaluate(pageScript, url);
      const round = v => Math.round(v * 1000) / 1000;
      out.push({ file: f, ...r, whitespace: round(r.whitespace), soft: round(r.soft), tones: r.tones.map(round) });
    }
    return out;
  } finally { if (own) await b.close(); }
}

// For the self-test: a picture with a known share of empty paper, drawn in the browser.
// Ink blobs are rectangles of mixed tones (and a little colour), paper gets ±5 grain.
export async function makeTestPicture(browser, { blank, w = 600, h = 400, seed = 1, colors = [] }) {
  const page = await browser.newPage();
  const b64 = await page.evaluate(({ blank, w, h, seed, colors }) => {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const paper = [242, 234, 216], inkPx = Math.round(w * h * (1 - blank));
    const mark = new Uint8Array(w * h); let used = 0;
    const tonesRGB = [[26, 23, 20], [46, 42, 38], [79, 73, 67], [138, 131, 122], [195, 188, 176]].concat(colors);
    // fill whole rows of a band from the top until the target count is reached
    for (let p = 0; p < w * h && used < inkPx; p++) { mark[p] = 1 + Math.floor(rnd() * tonesRGB.length); used++; }
    for (let p = 0; p < w * h; p++) {
      const i = p * 4, n = Math.round((rnd() - 0.5) * 10);
      const col = mark[p] ? tonesRGB[mark[p] - 1] : paper.map(v => v + n);
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }, { blank, w, h, seed, colors });
  await page.close();
  return Buffer.from(b64, 'base64');
}
