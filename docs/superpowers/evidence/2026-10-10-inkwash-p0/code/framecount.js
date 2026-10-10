// 第 3 步的替代:把浏览器实际画出来的画面录下来,数 0.5–6 秒之间有多少帧真的变了(去掉重复帧后剩几帧)。
// 帧间隔只说明主线程每帧都跑了;录屏里的帧是合成器真正交出来的画面,重复多 = 跳帧。
// 用法:node framecount.js <页面.html> [--gpu]
const { chromium } = require(process.env.SKY + '/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const page_ = process.argv[2], gpu = process.argv.includes('--gpu');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));
  const b = await chromium.launch(gpu ? { args: ['--enable-gpu', '--use-angle=metal'] } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 640, height: 360 } } });
  const p = await ctx.newPage(); await p.goto('file://' + path.resolve(page_)); await p.waitForTimeout(6500);
  await ctx.close(); await b.close();
  const vid = path.join(dir, fs.readdirSync(dir)[0]);
  const { spawnSync } = require('child_process');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', '0.5', '-to', '6', '-i', vid, '-vf', 'mpdecimate=hi=200:lo=64:frac=0.1,showinfo', '-f', 'null', '-'], { encoding: 'utf8' });
  const kept = (r.stderr.match(/Parsed_showinfo.*n:\s*\d+/g) || []).length;   // showinfo 每留下一帧打一行(在 stderr)
  console.log(`${path.basename(page_)} · ${gpu ? 'GPU' : '软件渲染'} · 0.5–6 秒里变化的帧 ${kept} 个,约 ${(kept / 5.5).toFixed(1)} 帧/秒`);
})().catch((e) => { console.error(e); process.exit(1); });
