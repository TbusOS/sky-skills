// 一次试几组机位并各出一张图。取景靠改文件重开来试,一轮要几分钟;这样一轮几十秒。
// 用法: node try_cameras.mjs <页面.html> <站号(0 起)> '<机位 JSON 数组>' [输出目录]
//   node try_cameras.mjs page.html 0 '[{"tgt":[0,2,0],"az":-1.0,"el":0.8,"dist":260,"fov":28}]'
// 页面需要提供 window.__setCam(见 templates/station-page.html)。
import { open } from './_launch.mjs';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const [file, stationArg, candsArg, outArg] = process.argv.slice(2);
if(!file || stationArg===undefined || !candsArg){
  console.error("用法: node try_cameras.mjs <页面.html> <站号(0 起)> '<机位 JSON 数组>' [输出目录]");
  process.exit(2);
}
const station = parseInt(stationArg, 10);
let cands;
try { cands = JSON.parse(candsArg); }
catch(e){ console.error('机位参数不是合法 JSON:', e.message); process.exit(2); }
if(!Array.isArray(cands) || !cands.length){ console.error('机位参数要是非空数组'); process.exit(2); }

const out = resolve(outArg || 'cam-tries');
mkdirSync(out, {recursive:true});

// 出图给人看构图,不是验收画质 —— dpr 1.25 够用,省一半时间
const {browser, page} = await open(file, {viewport:{width:1280,height:800}, dpr:1.25});
const has = await page.evaluate(()=>typeof window.__setCam==='function');
if(!has){ await browser.close();
  console.error('页面没有 window.__setCam。照 templates/station-page.html 加一行:\n' +
    '  window.__setCam=(c)=>{ Object.assign(cam,c); tween=null; reset(); updateLabels(); };');
  process.exit(1); }

for(let k=0;k<cands.length;k++){
  await page.evaluate(i=>window.__hw3d.go(i,true), station);
  await page.evaluate(c=>window.__setCam(c), cands[k]);
  for(let t=0;t<90;t++){
    if(await page.evaluate(()=>window.__hw3d.converged())) break;
    await page.waitForTimeout(200);
  }
  const f = `${out}/st${station+1}_${k}.png`;
  await page.screenshot({path:f});
  console.log(`${f}  ${JSON.stringify(cands[k])}`);
}
await browser.close();
console.log(`${cands.length} 张已出,逐张看构图再定`);
