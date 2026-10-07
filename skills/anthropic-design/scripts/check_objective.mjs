#!/usr/bin/env node
// check_objective.mjs — anthropic-design 页面的客观缺陷检查:只查 bug,不查品味。
//
//   node check_objective.mjs <page.html> [...]
//   node check_objective.mjs --self-test
//
// O1 JS 报错        加载并从头滚到尾,出现 pageerror / console.error 就失败
// O2 文字对比度      滚到底让滚动浮现的内容都出来,再跑 axe-core 的 color-contrast(WCAG AA)
// O3 横向滚动        1280 / 390 两个宽度下用鼠标真的横滚一次,页面动了才算失败;
//                   只是布局超宽、被 overflow-x:hidden 挡住的,记「提醒」——
//                   scrollWidth 大于窗口 ≠ 用户滚得动(2026-10-07 实测,见 SKILL.md)
// O4 手机上图里的字   390 宽下 SVG <text> 实际渲染字号 < 9px 就失败;
//                   标了 data-allow-shrink 的图片类不查(字不需要读)
// O5 关掉动画也完整   prefers-reduced-motion: reduce 下不滚动,h1–h3 / p / li 不能是看不见的
//
// 版式、字体、配色比例、组件写法一概不管 —— 那些交给模型和人。
// 退出码:0 没有失败(可能有提醒)· 1 有失败 · 2 用法错 / 环境缺 playwright
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const MIN_SVG_PX = 9;

async function scrollThrough(p) {
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(40); }
  // 等滚动浮现的过渡播完再量:播到一半时透明度没到 1,颜色被冲淡,对比度会被误报
  // (2026-10-07 实测:固定等 1.2s,页尾一段代码在渐显中被量成 4.11)。循环动画不等。
  for (let i = 0; i < 60; i++) {
    const running = await p.evaluate(() => document.getAnimations().filter(a =>
      a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity).length);
    if (!running) break;
    await p.waitForTimeout(100);
  }
  await p.waitForTimeout(200);
}

async function checkPage(browser, file) {
  const url = 'file://' + resolve(file);
  const res = [];
  const add = (id, st, msg) => res.push({ id, st, msg });

  // O1 + O2:1280 宽
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(400);
  await scrollThrough(p);
  add('O1 JS 报错', errs.length ? 'FAIL' : 'PASS', errs.length ? `${errs.length} 条,第一条:${errs[0].slice(0, 160)}` : '没有');
  await p.addScriptTag({ path: AXE });
  const low = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: ['color-contrast'] });
    return r.violations.flatMap(v => v.nodes.map(n => {
      const d = (n.any[0] && n.any[0].data) || {};
      return `${n.target.join(' ').slice(-40)}:字 ${d.fgColor} / 底 ${d.bgColor} = ${d.contrastRatio}`;
    }));
  });
  add('O2 文字对比度', low.length ? 'FAIL' : 'PASS', low.length ? `${low.length} 处不到 AA,例:${low.slice(0, 3).join(' ; ')}` : 'axe color-contrast 0 处');
  await ctx.close();

  // O3:两个宽度真的横滚
  const o3 = [], o3warn = [];
  for (const w of [1280, 390]) {
    ctx = await browser.newContext({ viewport: { width: w, height: 860 } }); p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(300);
    await scrollThrough(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    await p.mouse.move(Math.floor(w / 2), 400);
    await Promise.race([p.mouse.wheel(500, 0), new Promise(r => setTimeout(r, 4000))]);
    await p.waitForTimeout(300);
    const sx = await p.evaluate(() => window.scrollX);
    if (sx > 0) o3.push(`${w}px 宽横滚了 ${sx}px(页面宽 ${sw})`);
    else if (sw > w + 1) o3warn.push(`${w}px 宽布局超出 ${sw - w}px,被 overflow-x:hidden 挡住`);
    await ctx.close();
  }
  if (o3.length) add('O3 横向滚动', 'FAIL', o3.join(' ; '));
  else if (o3warn.length) add('O3 横向滚动', 'WARN', o3warn.join(' ; ') + '(桌面滚不动;手机触摸能不能拖,本脚本测不了)');
  else add('O3 横向滚动', 'PASS', '1280 / 390 都滚不动,布局也不超宽');

  // O4:390 宽下 SVG 文字
  ctx = await browser.newContext({ viewport: { width: 390, height: 860 } }); p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(300); await scrollThrough(p);
  const tiny = await p.evaluate((MIN) => {
    const out = [];
    for (const t of document.querySelectorAll('svg text')) {
      if (!t.getClientRects().length || t.closest('[data-allow-shrink]')) continue;
      if (!t.textContent.trim()) continue;
      const m = t.getScreenCTM(); if (!m) continue;
      const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      if (px < MIN) out.push(`「${t.textContent.trim().slice(0, 18)}」${px.toFixed(1)}px`);
    }
    return out;
  }, MIN_SVG_PX);
  add('O4 手机上图里的字', tiny.length ? 'FAIL' : 'PASS',
      tiny.length ? `${tiny.length} 处 < ${MIN_SVG_PX}px,例:${tiny.slice(0, 3).join(' ; ')}(讲解图包进可拖图框并设 --pan-w,图片类标 data-allow-shrink)` : `都 ≥ ${MIN_SVG_PX}px`);
  await ctx.close();

  // O5:减少动态效果下不滚动
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }); p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const hidden = await p.evaluate(() => {
    const vis = e => { for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none') return 'skip'; if (+s.opacity < 0.1 || s.visibility === 'hidden') return false; } return true; };
    return [...document.querySelectorAll('h1,h2,h3,p,li')].filter(e => e.textContent.trim() && e.getClientRects().length && vis(e) === false)
      .map(e => `${e.tagName.toLowerCase()}「${e.textContent.trim().slice(0, 16)}」`);
  });
  add('O5 关掉动画也完整', hidden.length ? 'FAIL' : 'PASS', hidden.length ? `${hidden.length} 处看不见,例:${hidden.slice(0, 3).join(' ; ')}` : '标题和正文都看得见');
  await ctx.close();
  return res;
}

function report(file, res) {
  const mark = { PASS: '✅', FAIL: '❌', WARN: '⚠️ ' };
  console.log(file);
  for (const r of res) console.log(`  ${mark[r.st]} ${r.id}:${r.msg}`);
  const n = k => res.filter(r => r.st === k).length;
  console.log(`  ${n('PASS')} 通过 / ${n('FAIL')} 失败 / ${n('WARN')} 提醒`);
  return n('FAIL');
}

const PAGE = (body, css = '', js = '') => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>t</title>
<style>body{margin:0;background:#faf9f5;color:#141413;font:16px/1.6 system-ui,sans-serif}main{max-width:760px;margin:0 auto;padding:24px}${css}</style>
</head><body><main>${body}</main><script>${js}</script></body></html>`;
const SVG = (attrs = '') => `<div ${attrs}><svg viewBox="0 0 1200 200" width="100%"><text x="10" y="100" font-size="12">节点标签</text></svg></div>`;

async function selfTest(browser) {
  const dir = mkdtempSync(join(tmpdir(), 'anth-objective-'));
  const cases = [
    // 宽图包进可横拖的图框、给足最小宽度:手机上字保持可读,页面本身不横滚
    ['正常页面:五项都过', PAGE('<h1>标题</h1><p>正文。</p><div style="overflow-x:auto"><div style="min-width:1000px">'
      + '<svg viewBox="0 0 1200 200" width="100%"><text x="10" y="100" font-size="12">节点标签</text></svg></div></div>'), {}],
    ['★ 脚本报错 → O1 失败', PAGE('<h1>t</h1>', '', 'notDefined();'), { 'O1 JS 报错': 'FAIL' }],
    ['★ 浅灰字 → O2 失败', PAGE('<p style="color:#c8c6bd">看不清的字</p>'), { 'O2 文字对比度': 'FAIL' }],
    ['★ 超宽元素且没挡住 → O3 失败', PAGE('<h1>t</h1><div style="width:1700px;height:20px;background:#e8e6dc"></div>'), { 'O3 横向滚动': 'FAIL' }],
    ['★ 超宽但 body 挡住 → O3 只提醒', PAGE('<h1>t</h1><div style="width:1700px;height:20px"></div>', 'body{overflow-x:hidden}'), { 'O3 横向滚动': 'WARN' }],
    ['★ 宽图在手机上跟着缩 → O4 失败', PAGE('<h1>t</h1>' + SVG()), { 'O4 手机上图里的字': 'FAIL' }],
    ['  同一张图标成图片类 → O4 不报', PAGE('<h1>t</h1>' + SVG('data-allow-shrink')), { 'O4 手机上图里的字': 'PASS' }],
    ['★ 滚动浮现不认减少动态 → O5 失败', PAGE('<h1>t</h1>' + '<p>占位</p>'.repeat(40) + '<p class="rv">只靠滚动才出现的段落</p>',
      '.rv{opacity:0}', 'addEventListener("scroll",()=>document.querySelector(".rv").style.opacity=1)'), { 'O5 关掉动画也完整': 'FAIL' }],
  ];
  let ok = 0, bad = 0;
  for (const [name, html, want] of cases) {
    const f = join(dir, `c${ok + bad}.html`); writeFileSync(f, html);
    const res = await checkPage(browser, f);
    const by = Object.fromEntries(res.map(r => [r.id, r.st]));
    const exp = Object.keys(want).length ? want : Object.fromEntries(res.map(r => [r.id, 'PASS']));
    const good = Object.entries(exp).every(([k, v]) => by[k] === v)
      && (Object.keys(want).length === 0 || res.filter(r => !(r.id in want)).every(r => r.st === 'PASS'));
    if (good) { ok++; console.log(`  通过  ${name}`); }
    else { bad++; console.log(`  失败  ${name}\n${res.map(r => `      ${r.st} ${r.id}:${r.msg}`).join('\n')}`); }
  }
  rmSync(dir, { recursive: true, force: true });
  console.log(`\n自测:${ok} 通过 / ${bad} 失败`);
  return bad ? 1 : 0;
}

const args = process.argv.slice(2);
if (!args.length) { console.log('用法:node check_objective.mjs <page.html> [...] | --self-test'); process.exit(2); }
let browser;
try { browser = await chromium.launch(); } catch (e) { console.log('起不来 Chromium(playwright 没装好?):' + e.message.slice(0, 200)); process.exit(2); }
let code = 0;
if (args.includes('--self-test')) code = await selfTest(browser);
else for (const f of args) { if (report(f, await checkPage(browser, f))) code = 1; }
await browser.close();
process.exit(code);
