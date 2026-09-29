// 共用:起 headless chromium 打开页面,拿到 __hw3d
//
// macOS 和 Linux 都能直接跑。两边的差别只在 WebGL 走哪个后端:
//   macOS  → ANGLE metal(用真 GPU)
//   Linux  → ANGLE swiftshader(软件渲染)。服务器多半没有能给 headless 用的 GPU,
//            而传 metal 在 Linux 上不会报错,WebGL 上下文开机就丢,之后每次绘制都什么
//            也不做 —— 采样数照样涨到 200,检查量的是一块空画布(2026-09-29 实测)。
//   有 GPU 的 Linux 想用硬件:HW3D_ANGLE=gl 或 HW3D_ANGLE=vulkan
// 软件渲染慢一个数量级(1280×800 一次采样约 0.1~0.5 秒),所以默认画幅缩小、
// 等收敛的时间放长;单采样帧时间也不再有意义,check_perf 会照实说明。
import { resolve, dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ANGLE = process.env.HW3D_ANGLE || (process.platform === 'darwin' ? 'metal' : 'swiftshader');
export const SOFTWARE_GL = ANGLE === 'swiftshader';

// playwright 从几个常见位置找,找不到就给一句人话的提示。
// 不在本目录放 node_modules —— 那会是台机器专属的绝对路径符号链接,换机就断。
async function loadChromium(){
  const tries = [
    process.env.PLAYWRIGHT_PATH,                    // 环境变量指定,优先
    'playwright',                                   // 本目录或上层已装(仓库根的 node_modules)
    join(HERE, '../../../node_modules/playwright/index.mjs'),
    '/Users/sky/linux-kernel/github/my-chat/node_modules/playwright/index.mjs',
    '/Users/sky/linux-kernel/github/sky-skills/node_modules/playwright/index.mjs',
  ].filter(Boolean);
  for(const t of tries){
    try {
      if(t.startsWith('/') && !existsSync(t)) continue;
      const m = await import(t.startsWith('/') ? 'file://' + t : t);
      return m.chromium;
    } catch { /* 试下一个 */ }
  }
  throw new Error(
    '找不到 playwright。任选一种:\n' +
    '  在仓库根目录 npm i playwright\n' +
    '  或 PLAYWRIGHT_PATH=/path/to/playwright/index.mjs node <脚本>');
}

// playwright 升级后,它要的浏览器版本号变了,缓存里只有旧版本 → launch 直接失败。
// 这时退回到缓存里已有的最新一版 chromium,而不是逼人再下载一遍。
function cachedChromium(){
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(homedir(), '.cache/ms-playwright'),              // Linux
    join(homedir(), 'Library/Caches/ms-playwright')]      // macOS
    .filter(Boolean).filter(existsSync);
  const rel = ['chrome-linux64/chrome', 'chrome-linux/chrome',
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium'];
  const found = [];
  for(const r of roots) for(const d of readdirSync(r)){
    const m = /^chromium-(\d+)$/.exec(d); if(!m) continue;
    for(const x of rel){ const p = join(r, d, x); if(existsSync(p)) found.push([+m[1], p]); }
  }
  found.sort((a,b)=>b[0]-a[0]);
  return found.length ? found[0][1] : null;
}

const chromium = await loadChromium();
async function launch(args){
  const exe = process.env.HW3D_CHROMIUM;               // 手动指定浏览器可执行文件
  if(exe) return chromium.launch({executablePath: exe, args});
  try { return await chromium.launch({args}); }
  catch(e){
    const alt = cachedChromium();
    if(!alt || !/Executable doesn't exist/.test(String(e.message))) throw e;
    return chromium.launch({executablePath: alt, args});
  }
}

export async function open(file, opts={}){
  const args = ['--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=' + ANGLE];
  if(SOFTWARE_GL) args.push('--enable-unsafe-swiftshader');
  else args.push('--enable-gpu');
  const browser = await launch(args);
  const page = await browser.newPage({
    viewport: opts.viewport || (SOFTWARE_GL ? {width:1280,height:800} : {width:1600,height:1000}),
    deviceScaleFactor: opts.dpr || (SOFTWARE_GL ? 1 : 1.5) });
  const logs=[];
  page.on('console', m=>logs.push('['+m.type()+'] '+m.text()));
  page.on('pageerror', e=>logs.push('[pageerror] '+e.message));
  await page.goto('file://' + resolve(file));   // 允许传相对路径
  await page.waitForTimeout(opts.boot || 3500);
  const err = await page.evaluate(()=>{ const e=document.getElementById('err');
    return (e && e.style.display && e.style.display!=='none') ? e.textContent : null; });
  if(err){ await browser.close(); throw new Error('页面报错:\n'+err+'\n'+logs.slice(0,20).join('\n')); }
  const has = await page.evaluate(()=>!!window.__hw3d);
  if(!has){ await browser.close(); throw new Error('页面没有暴露 window.__hw3d'); }
  await assertAlive(page, browser);
  return {browser, page, logs};
}

// 上下文丢了之后页面不会报错,采样数照样涨,截图是一块空画布 —— 必须主动查
export async function assertAlive(page, browser){
  const lost = await page.evaluate(()=>{ const c=document.getElementById('gl')||document.querySelector('canvas');
    const g=c && c.getContext('webgl2'); return !g || g.isContextLost(); });
  if(!lost) return;
  if(browser) await browser.close();
  throw new Error(`WebGL 上下文丢失(ANGLE 后端 = ${ANGLE})。` +
    (process.platform!=='darwin' && ANGLE!=='swiftshader'
      ? '\n  这台机器上这个后端用不了,去掉 HW3D_ANGLE 走默认的 swiftshader。'
      : '\n  换一个后端试:HW3D_ANGLE=swiftshader / gl / vulkan / metal'));
}

// 软件渲染下一次采样慢得多,默认多等(200 次采样 × 约 0.3 秒)
const SETTLE_S = Number(process.env.HW3D_SETTLE_S || (SOFTWARE_GL ? 240 : 20));
export async function settle(page, tries=Math.round(SETTLE_S*5)){
  for(let i=0;i<tries;i++){
    if(await page.evaluate(()=>window.__hw3d.converged())) return true;
    await page.waitForTimeout(200);
  }
  return false;
}
