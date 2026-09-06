// 管线齐全 / 无 GL 错误 / 每站都能收敛
import {open, settle} from './_launch.mjs';
const file = process.argv[2];
if(!file){ console.error('用法: node check_pipeline.mjs <页面.html>'); process.exit(2); }
const NEED = ['shadow','gbuffer','ssao','ibl-lighting','accum','bloom','post'];
let fail = 0;
const {browser, page} = await open(file);
const caps = await page.evaluate(()=>window.__hw3d.caps());
console.log('caps: ' + JSON.stringify(caps));
for(const p of NEED) if(!caps.passes.includes(p)){ console.log('缺少通道: '+p); fail++; }
if(!caps.colorFloat){ console.log('缺少 EXT_color_buffer_float'); fail++; }
const n = caps.stations || 1;
for(let i=0;i<n;i++){
  await page.evaluate(k=>window.__hw3d.go(k,true), i);
  const ok = await settle(page);
  const spp = await page.evaluate(()=>window.__hw3d.spp());
  if(!ok){ console.log(`站 ${i+1} 没收敛(spp=${spp})`); fail++; }
}
const errs = await page.evaluate(()=>window.__hw3d.errs());
if(errs.length){ console.log('GL 打点报错: '+errs.slice(0,10).join('  ')); fail++; }
await browser.close();
console.log(fail ? `不通过:${fail} 项` : `通过:${n} 站全部收敛,${NEED.length} 段通道齐全,无 GL 错误`);
process.exit(fail?1:0);
