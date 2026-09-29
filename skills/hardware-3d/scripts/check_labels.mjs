// 3D 标签不许互相压住、不许被固定面板挡住、不许伸出屏幕
//
// 为什么要单独查:标签按 3D 锚点投影定位,换视角 / 换窗口宽度 / 实时文字一变长,
// 手调的 dy 就失效。2026-09-29 demo 第 3 站「行缓冲」被「列选」压住半行,第 1 站
// CPU 标签的副标题被渲染状态面板截掉 —— 四个渲染检查都过了,因为它们只看像素统计。
//
// 查法:每站 × 每个窗口尺寸,等标签就位后取所有可见标签(.lb.show)的矩形,两两比,
// 再和固定面板(渲染状态 / 章节条 / 站点圆点 / 标题 / 说明卡)比。有实时文字的标签
// 宽度每拍都变,所以隔一段时间再取一次。
//
// 用法: node check_labels.mjs <页面.html> [宽x高,宽x高...]
import {open} from './_launch.mjs';
const file = process.argv[2];
if(!file){ console.error('用法: node check_labels.mjs <页面.html> [宽x高,...]'); process.exit(2); }
const sizes = (process.argv[3] || '1280x800,1600x1000,1920x1080')
  .split(',').map(s=>s.split('x').map(Number)).map(([w,h])=>({width:w,height:h}));
const TOL = 2;                       // 允许的重叠像素(抗锯齿 / 半像素取整)

const {browser, page} = await open(file, {viewport:sizes[0], dpr:1});
await page.evaluate(()=>window.__hw3d.setSpp(2));   // 只看标签位置,不需要收敛
const n = (await page.evaluate(()=>window.__hw3d.caps())).stations || 1;

const grab = ()=>page.evaluate(()=>{
  const R=el=>{ const r=el.getBoundingClientRect(); return {l:r.left,r:r.right,t:r.top,b:r.bottom}; };
  const name=el=>(el.querySelector('small') ? el.firstChild.textContent : el.textContent).trim().slice(0,28);
  const vis=el=>el && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden';
  const labels=[...document.querySelectorAll('.lb.show')].map(el=>({name:name(el), ...R(el)}));
  const panels=[['渲染状态','hud'],['章节条','acts'],['站点圆点','stations'],['说明卡','caption']]
    .map(([k,id])=>[k,document.getElementById(id)]).filter(([,el])=>vis(el)).map(([k,el])=>({name:k,...R(el)}));
  document.querySelectorAll('.title').forEach(el=>{ if(vis(el)) panels.push({name:'标题',...R(el)}); });
  return {labels, panels, W:innerWidth, H:innerHeight, total:document.querySelectorAll('.lb').length};
});
const ov=(a,b)=>Math.min(a.r,b.r)-Math.max(a.l,b.l) > TOL && Math.min(a.b,b.b)-Math.max(a.t,b.t) > TOL;

let bad=[], checked=0; const shown={};   // 每站显示了几个 / 一共几个
for(const vp of sizes){
  await page.setViewportSize(vp);
  for(let i=0;i<n;i++){
    await page.evaluate(k=>window.__hw3d.go(k,true), i);
    for(const wait of [900, 1500]){           // 两个时间点:实时文字会变长
      await page.waitForTimeout(wait);
      const g = await grab(); checked++;
      const tag=`站 ${String(i+1).padStart(2,'0')} @${vp.width}×${vp.height}`;
      const L=g.labels;
      const k=`站 ${String(i+1).padStart(2,'0')}`; shown[k]=shown[k]||[];
      shown[k].push(`${L.length}/${g.total}`);
      // 一个都没显示也会「没有重叠」—— 那不是通过,是没查到东西
      if(g.total>0 && L.length===0) bad.push(`${tag}: ${g.total} 个标签一个都没显示`);
      for(let a=0;a<L.length;a++){
        const x=L[a];
        if(x.l<0 || x.r>g.W || x.t<0 || x.b>g.H) bad.push(`${tag}: 「${x.name}」伸出屏幕`);
        for(let b=a+1;b<L.length;b++) if(ov(x,L[b])) bad.push(`${tag}: 「${x.name}」和「${L[b].name}」重叠`);
        for(const p of g.panels) if(ov(x,p)) bad.push(`${tag}: 「${x.name}」被${p.name}挡住`);
      }
    }
  }
}
await browser.close();
console.log('显示 / 定义的标签数(按窗口尺寸 × 时间点):');
for(const k in shown) console.log(`  ${k}  ${shown[k].join('  ')}`);
bad=[...new Set(bad)];
if(bad.length){ console.log(bad.join('\n')); console.log(`不通过:${bad.length} 处标签被挡或重叠`); process.exit(1); }
console.log(`通过:${n} 站 × ${sizes.length} 种窗口尺寸 × 2 个时间点,共 ${checked} 次取样,没有标签重叠或被挡`);
