// 让 Playwright 启动的 Chromium 走代理，并把网页字体存在本机。
//
// 为什么需要：
//   · Chromium 不读 HTTPS_PROXY / https_proxy 这些环境变量，Playwright 也不替它读。
//     终端里 curl 走代理上得了外网，Chromium 照样直连；直连不通时，页面里的
//     Google Fonts 样式表一直挂着，load 事件不来，goto 30 秒超时 ——
//     检查报「打不开」，看起来像页面坏了，其实是网没通。
//   · 代理通了也可能慢：一个讲解页要 60 多个字体文件，按 50–80 KB/s 算，
//     加载一次要半分钟到一分钟，而一道检查要把同一页打开好几次。
//   2026-10-09 实测（一台走 HTTP 代理上网的 Linux 机器）：直连 fonts.googleapis.com
//   15 s 超时；走代理一页 24–55 s；用了这里的缓存，两个页面的 check_objective 37 s 跑完。
//
// 缓存只收 https 上的字体和样式表（resourceType 是 font / stylesheet），本机地址不收 ——
// 开发服务器上的样式表天天在改，缓存它就会量到旧版本。只存 200 响应，
// 只留 content-type 和 access-control-allow-origin 两个响应头：跨域字体缺了后者，浏览器不用。
// Google Fonts 按 user-agent 给不同格式，所以下载时带上页面自己的 user-agent。
// 下载用单独的请求上下文，不用页面的：页面先关了，下载照样写进缓存，下一页直接用。
//
// 位置：$SKY_FONT_CACHE，默认 ~/.cache/sky-skills/fonts。删掉这个目录就是清缓存。
//
//   import { launchOptions, useFontCache } from './_net.mjs';
//   const browser = await chromium.launch(launchOptions());
//   const ctx = await browser.newContext({...}); await useFontCache(ctx);
//
//   node _net.mjs --self-test

import { request, chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP_HEADERS = ['content-type', 'access-control-allow-origin'];
const LOCAL = /^https?:\/\/(localhost|127\.|\[::1\])/;
const defaultMatch = (url, type) => url.startsWith('https://') && !LOCAL.test(url) && (type === 'font' || type === 'stylesheet');

export function launchOptions(env = process.env) {
  const server = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
  return server ? { proxy: { server, bypass: env.NO_PROXY || env.no_proxy || '' } } : {};
}

let api = null;
const downloads = new Map();

function download(url, headers, dir, proxy) {
  if (!downloads.has(url)) downloads.set(url, (async () => {
    api = api || request.newContext(proxy ? { proxy } : {});
    const res = await (await api).fetch(url, { headers, timeout: 180000 });
    const body = await res.body();
    const keep = Object.fromEntries(KEEP_HEADERS.filter(k => res.headers()[k]).map(k => [k, res.headers()[k]]));
    if (res.status() === 200) {
      const f = join(dir, createHash('sha1').update(url).digest('hex'));
      mkdirSync(dir, { recursive: true });
      writeFileSync(f + '.tmp', body); renameSync(f + '.tmp', f);
      writeFileSync(f + '.json', JSON.stringify(keep));  // 最后写：有 .json 才算这一条存完了
    }
    return { status: res.status(), headers: keep, body };
  })().catch(e => { downloads.delete(url); throw e; }));  // 失败的下次重试
  return downloads.get(url);
}

export async function useFontCache(context, {
  dir = process.env.SKY_FONT_CACHE || join(homedir(), '.cache/sky-skills/fonts'),
  match = defaultMatch,
  proxy = launchOptions().proxy,
} = {}) {
  await context.route(() => true, async route => {
    const req = route.request(), url = req.url();
    if (!match(url, req.resourceType())) return route.fallback();
    const f = join(dir, createHash('sha1').update(url).digest('hex'));
    let r;
    if (existsSync(f + '.json')) r = { status: 200, headers: JSON.parse(readFileSync(f + '.json', 'utf8')), body: readFileSync(f) };
    else {
      const ua = req.headers()['user-agent'];
      try { r = await download(url, ua ? { 'user-agent': ua } : {}, dir, proxy); }
      catch { return route.abort().catch(() => {}); }
    }
    await route.fulfill(r).catch(() => {});  // 页面可能已经关了
  });
}

export async function closeFontCache() {
  if (api) await (await api).dispose();
  api = null;
}

// ---- 自测 ----
// 本机起一个 HTTP 服务给样式表，数服务器被请求了几次：
//   用缓存：开两个上下文各加载一次，服务器只被请求 1 次，缓存目录里有文件；
//   反向：不用缓存，同样两次，服务器必须被请求 2 次 —— 否则说明是浏览器自己的缓存在起作用，
//   上一条的「1 次」就证明不了什么。
async function selfTest() {
  let ok = 0, bad = 0;
  const check = (name, cond, detail) => { if (cond) { ok++; console.log(`  通过  ${name}`); } else { bad++; console.log(`  失败  ${name}  ${detail}`); } };

  check('没有代理变量 → 不加 proxy', JSON.stringify(launchOptions({})) === '{}', JSON.stringify(launchOptions({})));
  const lo = launchOptions({ https_proxy: 'http://proxy.example:3128', no_proxy: 'localhost,.lan' });
  check('有 https_proxy → 传给 Chromium，带上 no_proxy', lo.proxy?.server === 'http://proxy.example:3128' && lo.proxy?.bypass === 'localhost,.lan', JSON.stringify(lo));
  check('默认只收 https 的字体和样式表', defaultMatch('https://fonts.gstatic.com/a.woff2', 'font') && !defaultMatch('https://x.org/a.js', 'script')
    && !defaultMatch('http://x.org/a.css', 'stylesheet') && !defaultMatch('https://localhost:8000/a.css', 'stylesheet'), '');

  let hits = 0;
  const server = createServer((req, res) => { hits++; res.writeHead(200, { 'content-type': 'text/css' }); res.end('body{color:rgb(1,2,3)}'); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const css = `http://127.0.0.1:${server.address().port}/a.css`;
  const dir = mkdtempSync(join(tmpdir(), 'sky-font-cache-'));
  const page = join(dir, 'p.html'); writeFileSync(page, `<link rel="stylesheet" href="${css}"><p>t</p>`);
  const browser = await chromium.launch();
  const load = async cached => {
    const ctx = await browser.newContext();
    if (cached) await useFontCache(ctx, { dir: join(dir, 'cache'), match: u => u === css, proxy: undefined });
    const p = await ctx.newPage(); await p.goto('file://' + page, { waitUntil: 'load' });
    const color = await p.evaluate(() => getComputedStyle(document.body).color);
    await ctx.close(); return color;
  };
  try {
    const c1 = await load(true), c2 = await load(true);
    check('用缓存：两次加载，服务器只被请求 1 次，样式照样生效', hits === 1 && c1 === 'rgb(1, 2, 3)' && c2 === 'rgb(1, 2, 3)', `hits=${hits} ${c1} ${c2}`);
    hits = 0; await load(false); await load(false);
    check('★ 反向：不用缓存，服务器被请求 2 次', hits === 2, `hits=${hits}`);
  } finally {
    await browser.close(); await closeFontCache(); server.close(); rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n自测:${ok} 通过 / ${bad} 失败`);
  return bad ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--self-test')) process.exit(await selfTest());
