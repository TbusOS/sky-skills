// 共用:起 headless chromium 打开页面,拿到 __hw3d
import { resolve } from 'path';
import { existsSync } from 'fs';

// playwright 从几个常见位置找,找不到就给一句人话的提示。
// 不在本目录放 node_modules —— 那会是台机器专属的绝对路径符号链接,换机就断。
async function loadChromium(){
  const tries = [
    'playwright',                                   // 本目录或上层已装
    process.env.PLAYWRIGHT_PATH,                    // 环境变量指定
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
    '  cd <本 skill 的 scripts 目录> && npm i playwright\n' +
    '  或 PLAYWRIGHT_PATH=/path/to/playwright/index.mjs node <脚本>');
}
const chromium = await loadChromium();
export async function open(file, opts={}){
  const browser = await chromium.launch({args:[
    '--enable-gpu','--use-angle=metal','--ignore-gpu-blocklist','--use-gl=angle']});
  const page = await browser.newPage({
    viewport: opts.viewport || {width:1600,height:1000},
    deviceScaleFactor: opts.dpr || 1.5 });
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
  return {browser, page, logs};
}
export async function settle(page, tries=100){
  for(let i=0;i<tries;i++){
    if(await page.evaluate(()=>window.__hw3d.converged())) return true;
    await page.waitForTimeout(200);
  }
  return false;
}
