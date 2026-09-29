// 防"霓虹回潮":收敛后截图量三个客观指标
//   1 高亮且高饱和的像素占比  2 饱和度中位数  3 是否死黑一片
// 外加一道前提:画布上真的有东西。上下文丢了或者什么都没画,整屏只剩 UI 面板,
// 前三个指标照样落在"写实区间"里 —— 2026-09-29 在 Linux 上就这样假通过了 5 站。
import {open, settle, assertAlive} from './_launch.mjs';
const file = process.argv[2];
if(!file){ console.error('用法: node check_realism.mjs <页面.html> [站号...]'); process.exit(2); }
const only = process.argv.slice(3).map(Number).filter(Boolean);
const LIM = { neon: 0.030, satMed: 0.28, black: 0.86, flat: 0.012 };   // 阈值
const {browser, page} = await open(file);
const n = (await page.evaluate(()=>window.__hw3d.caps())).stations || 1;

// 把 png 缩到 320 宽后逐像素统计,在页面里算(省得装图像库)
const stats = (b64)=>page.evaluate(async (b64)=>{
  const img = new Image();
  await new Promise(r=>{ img.onload=r; img.src='data:image/png;base64,'+b64; });
  const W=320, H=Math.round(W*img.height/img.width);
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'); x.drawImage(img,0,0,W,H);
  const d=x.getImageData(0,0,W,H).data;
  let neon=0, black=0, sats=[], sum=0, sum2=0;
  for(let p=0;p<d.length;p+=4){
    const r=d[p]/255, g=d[p+1]/255, bb=d[p+2]/255;
    const mx=Math.max(r,g,bb), mn=Math.min(r,g,bb);
    const v=mx, s=mx>0?(mx-mn)/mx:0;
    if(v>0.62 && s>0.55) neon++;
    if(v<0.045) black++;
    sats.push(s);
    const l=0.2126*r+0.7152*g+0.0722*bb; sum+=l; sum2+=l*l;
  }
  sats.sort((a,b)=>a-b);
  const N=d.length/4, mean=sum/N;
  return { neon:neon/N, black:black/N, satMed:sats[Math.floor(sats.length/2)],
           lumStd:Math.sqrt(Math.max(0,sum2/N-mean*mean)) };
}, b64);

let fail=0, rows=[];
for(let i=0;i<n;i++){
  if(only.length && !only.includes(i+1)) continue;
  await page.evaluate(k=>window.__hw3d.go(k,true), i);
  await settle(page);
  await assertAlive(page, browser);
  // 先只拍画布(把面板全藏起来),看它是不是一片纯色
  await page.addStyleTag({content:'body>*:not(#gl){visibility:hidden !important}'}).then(h=>h.evaluate(e=>e.id='__hideui'));
  const bare = await stats((await page.screenshot({type:'png'})).toString('base64'));
  await page.evaluate(()=>document.getElementById('__hideui').remove());
  const m = await stats((await page.screenshot({type:'png'})).toString('base64'));
  const bad = [];
  if(bare.lumStd < LIM.flat) bad.push(`画布是空的(亮度标准差 ${bare.lumStd.toFixed(4)} < ${LIM.flat})`);
  if(m.neon   > LIM.neon)   bad.push(`霓虹像素 ${(m.neon*100).toFixed(2)}% > ${(LIM.neon*100)}%`);
  if(m.satMed > LIM.satMed) bad.push(`饱和度中位数 ${m.satMed.toFixed(3)} > ${LIM.satMed}`);
  if(m.black  > LIM.black)  bad.push(`死黑 ${(m.black*100).toFixed(1)}% > ${(LIM.black*100)}%`);
  rows.push(`站 ${String(i+1).padStart(2,'0')}  霓虹 ${(m.neon*100).toFixed(2)}%  饱和中位 ${m.satMed.toFixed(3)}  死黑 ${(m.black*100).toFixed(1)}%  画布起伏 ${bare.lumStd.toFixed(3)}  ${bad.length?'✗ '+bad.join(' / '):'✓'}`);
  if(bad.length) fail++;
}
await browser.close();
console.log(rows.join('\n'));
console.log(fail ? `不通过:${fail} 站超阈值` : '通过:全部站点在写实区间内');
process.exit(fail?1:0);
