// 防"霓虹回潮":收敛后截图量三个客观指标
//   1 高亮且高饱和的像素占比  2 饱和度中位数  3 是否死黑一片
import {open, settle} from './_launch.mjs';
import fs from 'fs';
const file = process.argv[2];
if(!file){ console.error('用法: node check_realism.mjs <页面.html> [站号...]'); process.exit(2); }
const only = process.argv.slice(3).map(Number).filter(Boolean);
const LIM = { neon: 0.030, satMed: 0.28, black: 0.86 };   // 阈值
const {browser, page} = await open(file);
const n = (await page.evaluate(()=>window.__hw3d.caps())).stations || 1;
let fail=0, rows=[];
for(let i=0;i<n;i++){
  if(only.length && !only.includes(i+1)) continue;
  await page.evaluate(k=>window.__hw3d.go(k,true), i);
  await settle(page);
  const buf = await page.screenshot({type:'png'});
  const m = await page.evaluate(async (b64)=>{
    const img = new Image();
    await new Promise(r=>{ img.onload=r; img.src='data:image/png;base64,'+b64; });
    const W=320, H=Math.round(W*img.height/img.width);
    const c=document.createElement('canvas'); c.width=W; c.height=H;
    const x=c.getContext('2d'); x.drawImage(img,0,0,W,H);
    const d=x.getImageData(0,0,W,H).data;
    let neon=0, black=0, sats=[];
    for(let p=0;p<d.length;p+=4){
      const r=d[p]/255, g=d[p+1]/255, bb=d[p+2]/255;
      const mx=Math.max(r,g,bb), mn=Math.min(r,g,bb);
      const v=mx, s=mx>0?(mx-mn)/mx:0;
      if(v>0.62 && s>0.55) neon++;
      if(v<0.045) black++;
      sats.push(s);
    }
    sats.sort((a,b)=>a-b);
    return { neon:neon/(d.length/4), black:black/(d.length/4), satMed:sats[Math.floor(sats.length/2)] };
  }, buf.toString('base64'));
  const bad = [];
  if(m.neon   > LIM.neon)   bad.push(`霓虹像素 ${(m.neon*100).toFixed(2)}% > ${(LIM.neon*100)}%`);
  if(m.satMed > LIM.satMed) bad.push(`饱和度中位数 ${m.satMed.toFixed(3)} > ${LIM.satMed}`);
  if(m.black  > LIM.black)  bad.push(`死黑 ${(m.black*100).toFixed(1)}% > ${(LIM.black*100)}%`);
  rows.push(`站 ${String(i+1).padStart(2,'0')}  霓虹 ${(m.neon*100).toFixed(2)}%  饱和中位 ${m.satMed.toFixed(3)}  死黑 ${(m.black*100).toFixed(1)}%  ${bad.length?'✗ '+bad.join(' / '):'✓'}`);
  if(bad.length) fail++;
}
await browser.close();
console.log(rows.join('\n'));
console.log(fail ? `不通过:${fail} 站超阈值` : '通过:全部站点在写实区间内');
process.exit(fail?1:0);
