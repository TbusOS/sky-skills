// 单采样帧时间上限(默认 40ms @1600×1000 dpr1.5)
//
// 为什么是 40:这个数量的是"一次完整采样"的耗时(阴影+G-buffer+SSAO+光照+累积)。
// 相机静止时它决定收敛快慢(40ms → 200 采样约 8 秒),相机拖动时它就是帧时间。
// 40ms = 25fps,拖动时略有顿挫但可用;实测 62 号 15 站里 13 站在 30ms 以内,
// 最重的是层叠剖面(重叠面多、overdraw 大)。低于 30 才算宽裕。
import {open} from './_launch.mjs';
const file = process.argv[2];
const LIMIT = Number(process.argv[3] || 40);
if(!file){ console.error('用法: node check_perf.mjs <页面.html> [毫秒上限]'); process.exit(2); }
const {browser, page} = await open(file);
const n = (await page.evaluate(()=>window.__hw3d.caps())).stations || 1;
let worst=0, worstAt=0, rows=[];
for(let i=0;i<n;i++){
  await page.evaluate(k=>{ window.__hw3d.go(k,true); window.__hw3d.setSpp(100000); }, i);
  await page.waitForTimeout(1600);                        // 让它一直在采样
  const ms = await page.evaluate(()=>new Promise(res=>{
    const t=[]; let last=performance.now();
    const tick=()=>{ const now=performance.now(); t.push(now-last); last=now;
      if(t.length<40) requestAnimationFrame(tick);
      else { t.sort((a,b)=>a-b); res(t[Math.floor(t.length/2)]); } };
    requestAnimationFrame(tick);
  }));
  rows.push(`站 ${String(i+1).padStart(2,'0')}  ${ms.toFixed(1)} ms`);
  if(ms>worst){ worst=ms; worstAt=i+1; }
}
await browser.close();
console.log(rows.join('\n'));
console.log(`最慢:站 ${worstAt} ${worst.toFixed(1)} ms(上限 ${LIMIT} ms)`);
process.exit(worst>LIMIT?1:0);
