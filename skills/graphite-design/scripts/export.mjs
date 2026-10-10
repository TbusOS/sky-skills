#!/usr/bin/env node
// export.mjs — turn a graphite drawing (SVG or HTML page) into a picture or a clip.
//
//   node export.mjs png   <in.svg|html> <out.png>  [--t=3.5] [--theme=light|dark] [--lang=zh|en] [--size=1600x900] [--scale=2] [--selector=#stage]
//   node export.mjs video <in.svg|html> <out.mp4|webm|gif> [--fps=30] [--from=0] [--to=auto] [--hold=1.5]
//                                                    [--theme=…] [--lang=…] [--size=1280x720] [--selector=…]
//
// --lang: every figure carries both languages and shows Chinese unless the root
// says data-lang="en". Left out, the picture is whatever the file shows by itself
// (Chinese for the figures and pages here).
//
// How a frame is taken: every CSS animation on the page is paused and set to the
// same time t (document.getAnimations(), currentTime = t), then a screenshot is
// taken. Frames are exact and repeatable — frame 300 is always t = 10 s, however
// slow the machine. Screen recording would drop frames under load and record
// whatever the page was doing, not what the timeline says.
//
// A page with its own JS timeline can expose  window.graphite = { duration, seek(t) }
// and this script calls seek(t) instead (the reel page does).
//
// --to=auto uses the drawing's own length: data-dur on the svg, graphite.duration,
// or the end of the last finite CSS animation. --hold adds that many seconds of
// the finished picture at the end (a clip that cuts the moment the last line lands
// feels unfinished).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [mode, input, output] = process.argv.slice(2);
// split at the first "=" only: --selector='section[aria-label="x"]' has more of them
const opt = Object.fromEntries(process.argv.slice(5).filter(a => a.startsWith('--')).map(a => {
  const i = a.indexOf('='); return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)];
}));
if (!['png', 'video'].includes(mode) || !input || !output) {
  console.error('usage: export.mjs png|video <in.svg|html> <out> [--t= --theme= --lang=zh|en --size=WxH --scale= --fps= --from= --to= --hold= --selector=]');
  process.exit(2);
}
const lang = opt.lang || null;
if (lang && !['zh', 'en'].includes(lang)) { console.error(`--lang=${lang}: use zh or en`); process.exit(2); }
const [W, H] = String(opt.size || (mode === 'video' ? '1280x720' : '1600x900')).split('x').map(Number);
const theme = opt.theme || 'light';

async function open() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: Number(opt.scale || 1), colorScheme: theme });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(([t, l]) => {
    try { localStorage.setItem('graphite-theme', t); } catch (e) {}
    // the pages' own switch (player.js) reads this key and also swaps lang and the aria-labels
    if (l) try { localStorage.setItem('sky-lang', l); } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => { if (document.documentElement.tagName === 'HTML') document.documentElement.setAttribute('data-theme', t); });
  }, [theme, lang]);
  // a query string ("reel.html?export=1") is passed through to the page
  const [file, query] = input.split('?');
  await page.goto(pathToFileURL(resolve(file)).href + (query ? '?' + query : ''), { waitUntil: 'load' });
  if (extname(file) === '.svg') {
    // a bare SVG fills the window, centred, on its own paper colour
    await page.evaluate(() => { const s = document.documentElement; s.setAttribute('width', '100%'); s.setAttribute('height', '100%'); });
  }
  // set on the root as well: a bare SVG has no script to read the key above
  if (lang) await page.evaluate(l => document.documentElement.setAttribute('data-lang', l), lang);
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { browser, page, errors };
}

async function seek(page, t) {
  await page.evaluate(t => {
    if (window.graphite && window.graphite.seek) return window.graphite.seek(t);
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; });
  }, t);
}

async function duration(page) {
  return page.evaluate(() => {
    if (window.graphite && window.graphite.duration) return window.graphite.duration;
    const d = document.querySelector('[data-dur]');
    if (d) return parseFloat(d.getAttribute('data-dur'));
    let end = 0;
    document.getAnimations().forEach(a => {
      const t = a.effect.getComputedTiming();
      if (Number.isFinite(t.endTime)) end = Math.max(end, t.endTime);
    });
    return end / 1000;
  });
}

async function shot(page) {
  if (opt.selector) return (await page.$(opt.selector)).screenshot({ type: 'png' });
  return page.screenshot({ type: 'png' });
}

async function main() {
  const { browser, page, errors } = await open();
  try {
    if (mode === 'png') {
      const t = opt.t === undefined ? await duration(page) + 1 : Number(opt.t);
      await seek(page, t);
      const buf = await shot(page);
      require('node:fs').writeFileSync(output, buf);
      console.log(`${output}  t=${t}s  ${W}x${H}@${opt.scale || 1}x  ${theme}${lang ? '  ' + lang : ''}`);
    } else {
      const fps = Number(opt.fps || 30), from = Number(opt.from || 0);
      const to = opt.to && opt.to !== 'auto' ? Number(opt.to) : await duration(page);
      const hold = Number(opt.hold == null ? 1.5 : opt.hold);
      const n = Math.max(1, Math.round((to - from + hold) * fps));
      const ffmpeg = require('ffmpeg-static');
      const ext = extname(output).toLowerCase();
      const enc = ext === '.gif'
        ? ['-vf', `fps=${Math.min(fps, 15)},scale=${Math.min(W, 800)}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`]
        : ext === '.webm' ? ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-pix_fmt', 'yuv420p']
          : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
      const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', ...enc, output], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let i = 0; i < n; i++) {
        await seek(page, Math.min(from + i / fps, to));
        const buf = await shot(page);
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (i % fps === 0) process.stdout.write(`\r${i}/${n} frames`);
      }
      ff.stdin.end();
      const code = await new Promise(r => ff.on('close', r));
      if (code) throw new Error('ffmpeg exited ' + code);
      console.log(`\r${output}  ${n} frames  ${fps} fps  ${(n / fps).toFixed(1)} s  ${W}x${H}  ${theme}${lang ? '  ' + lang : ''}`);
    }
    if (errors.length) { console.error('page errors:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
  } finally { await browser.close(); }
}

main().catch(e => { console.error(e.stack || e); process.exit(2); });
