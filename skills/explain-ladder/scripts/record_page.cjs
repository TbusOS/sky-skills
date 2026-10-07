#!/usr/bin/env node
// record_page.cjs —— 把一个 HTML 动画页录成无声 webm,录完自己打开一遍核对。
//
//   node record_page.cjs <page.html> [--seconds=10] [--size=1280x720] [--out=x.webm]
//                        [--actions=actions.json] [--allow-static]
//   node record_page.cjs --self-test
//
// 只在 user 点头要视频之后用(见 SKILL.md 第 4 级)。
//
// --actions 是一个 JSON 数组,按顺序执行,用来点开分步讲解的页面:
//   [{"wait": 1500}, {"click": "#next"}, {"press": "ArrowRight"}, {"scroll": 800}]
// 动作做完后,不足 --seconds 的部分继续录,让最后一个画面停住。
//
// 录完的核对(不过就退出码 1):
//   V1 文件能播:Chromium 打开 webm,读得到时长和宽度
//   V2 画面动了:首帧和末帧缩成 160×90 比平均像素差,小于 1.0 就算没动
//      —— 动画在录之前就播完了、或者页面开了「减少动态效果」,录出来是一张静止图
//   静止画面确实是想要的(比如只录一张图慢慢滚),加 --allow-static
//
// 依赖:playwright(sky-skills 仓根目录的 node_modules 里有)。录屏用的是 Playwright 自带的
// ffmpeg,只出 VP8 webm,不带声音。要配音 / 字幕 / mp4,走 wechat-video-publisher。
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const a = { seconds: 10, width: 1280, height: 720, out: null, actions: null, allowStatic: false, page: null };
  for (const x of argv) {
    if (x.startsWith('--seconds=')) a.seconds = Number(x.slice(10));
    else if (x.startsWith('--size=')) { const [w, h] = x.slice(7).split('x').map(Number); a.width = w; a.height = h; }
    else if (x.startsWith('--out=')) a.out = path.resolve(x.slice(6));
    else if (x.startsWith('--actions=')) a.actions = JSON.parse(fs.readFileSync(x.slice(10), 'utf8'));
    else if (x === '--allow-static') a.allowStatic = true;
    else if (!x.startsWith('--')) a.page = x;
  }
  return a;
}

function toUrl(p) {
  return /^(https?|file):/.test(p) ? p : 'file://' + path.resolve(p);
}

async function record(a) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));
  const browser = await chromium.launch();
  const size = { width: a.width, height: a.height };
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(toUrl(a.page));
  for (const act of a.actions || []) {
    if (act.wait) await page.waitForTimeout(act.wait);
    if (act.click) await page.click(act.click);
    if (act.press) await page.keyboard.press(act.press);
    if (act.scroll !== undefined) await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), act.scroll);
  }
  const left = a.seconds * 1000 - (Date.now() - t0);
  if (left > 0) await page.waitForTimeout(left);
  const video = page.video();
  await ctx.close();
  const raw = await video.path();
  await browser.close();
  fs.mkdirSync(path.dirname(a.out), { recursive: true });
  fs.copyFileSync(raw, a.out);
  fs.rmSync(tmp, { recursive: true, force: true });
  return a.out;
}

// 打开录好的 webm:读时长 / 宽度,比首帧和末帧
async function probe(file) {
  const dir = path.dirname(file);
  const probeHtml = path.join(dir, '.probe-' + process.pid + '.html');
  fs.writeFileSync(probeHtml, '<!doctype html><video id=v muted src="' + encodeURI(path.basename(file)) +
    '"></video><canvas id=c width=160 height=90></canvas>');
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + probeHtml);
    return await page.evaluate(async () => {
      const v = document.getElementById('v');
      for (let i = 0; i < 100 && v.readyState < 2 && !v.error; i++) await new Promise((ok) => setTimeout(ok, 100));
      if (v.readyState < 2) return { ok: false, why: v.error ? 'MediaError ' + v.error.code : '10 秒内没加载出来' };
      const seek = (t) => new Promise((ok) => {
        const to = setTimeout(() => ok(false), 4000);
        v.onseeked = () => { clearTimeout(to); ok(true); };
        v.currentTime = t;
      });
      let dur = v.duration;
      if (!isFinite(dur)) { await seek(1e6); dur = v.currentTime; }
      const c = document.getElementById('c').getContext('2d');
      async function frame(t) { await seek(t); c.drawImage(v, 0, 0, 160, 90); return c.getImageData(0, 0, 160, 90).data; }
      const a = await frame(Math.min(0.2, dur / 4));
      const b = await frame(Math.max(0, dur - 0.2));
      let sum = 0;
      for (let i = 0; i < a.length; i += 4) sum += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
      return { ok: true, duration: dur, width: v.videoWidth, height: v.videoHeight, diff: sum / (a.length / 4) };
    });
  } finally {
    await browser.close();
    fs.rmSync(probeHtml, { force: true });
  }
}

async function run(a, quiet) {
  const out = await record(a);
  const p = await probe(out);
  const lines = [];
  let fail = 0;
  if (!p.ok) { lines.push('❌ V1 文件能播:' + p.why); fail++; }
  else {
    lines.push('✅ V1 文件能播:' + p.duration.toFixed(2) + ' 秒 · ' + p.width + '×' + p.height);
    if (p.diff < 1.0 && !a.allowStatic) {
      lines.push('❌ V2 画面动了:首帧和末帧平均差 ' + p.diff.toFixed(2) + ' < 1.0,录出来是静止画面' +
        '(动画录之前就播完了?页面开了减少动态效果?确实要静止就加 --allow-static)');
      fail++;
    } else {
      lines.push((p.diff < 1.0 ? '⚠ ' : '✅ ') + 'V2 画面动了:首帧和末帧平均差 ' + p.diff.toFixed(2));
    }
  }
  if (!quiet) { console.log(out); for (const l of lines) console.log('  ' + l); }
  return { fail, probe: p, out };
}

async function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-selftest-'));
  const moving = path.join(dir, 'moving.html');
  const still = path.join(dir, 'still.html');
  const done = path.join(dir, 'done.html');
  const css = 'body{margin:0;background:#faf9f5}#b{width:60px;height:60px;background:#d97757;position:absolute;top:120px}';
  fs.writeFileSync(moving, `<!doctype html><style>${css}#b{animation:m 2s linear forwards}@keyframes m{from{left:0}to{left:400px}}</style><div id=b></div>`);
  fs.writeFileSync(still, `<!doctype html><style>${css}#b{left:200px}</style><div id=b></div>`);
  // 动画只有 0.05 秒:页面打开前就播完了,录到的全是终点 —— 典型的「录了个寂寞」
  fs.writeFileSync(done, `<!doctype html><style>${css}#b{animation:m .05s linear forwards}@keyframes m{from{left:0}to{left:400px}}</style><div id=b></div>`);
  const cases = [
    ['有动画的页面:V1 V2 都过', { page: moving }, 0],
    ['★ 静止页面:V2 必须报', { page: still }, 1],
    ['★ 静止页面加 --allow-static:不报', { page: still, allowStatic: true }, 0],
    ['★ 动画在录之前就播完了:V2 必须报', { page: done }, 1],
  ];
  let passed = 0, failed = 0;
  try {
    for (const [desc, over, want] of cases) {
      const a = Object.assign({ seconds: 2.5, width: 640, height: 360, actions: null, allowStatic: false },
        over, { out: path.join(dir, path.basename(over.page, '.html') + (over.allowStatic ? '-s' : '') + '.webm') });
      const r = await run(a, true);
      const good = r.fail === want;
      good ? passed++ : failed++;
      console.log('  ' + (good ? '通过' : '失败') + '  ' + desc + (good ? '' : '(期望失败数 ' + want + ',实际 ' + r.fail + ' · ' + JSON.stringify(r.probe) + ')'));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n自测:' + passed + ' 通过 / ' + failed + ' 失败');
  return failed ? 1 : 0;
}

(async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(await selfTest());
  const a = parseArgs(argv);
  if (!a.page) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 22).map((l) => l.slice(3)).join('\n'));
    process.exit(2);
  }
  if (!a.out) a.out = /^https?:/.test(a.page) ? path.resolve('recording.webm') : path.resolve(a.page).replace(/\.html?$/, '') + '.webm';
  const r = await run(a, false);
  process.exit(r.fail ? 1 : 0);
})().catch((e) => { console.error('出错:' + e.message); process.exit(2); });
