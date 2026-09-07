// hw3d 页面外壳逻辑 —— 站点切换 / 相机缓动 / 3D 标签层 / 术语表 / 时钟控件 / 鼠标
//
// 页面要提供这几样(见 templates/station-page.html):
//   STATIONS[]  每站 {act,title,cam,state,labels,body,flow}
//   ACTS[]      幕名        GLOSSARY[]  术语表 [英文,中文,一句话]
//   cam / STATE / reset() / camMats() / resize() / FLOW / buildFlow() / renderFlow()
//   BI(en,zh)   中英一对的助手,必须在 STATIONS 之前定义(见 templates/station-page.html)。
//               **别叫 T** —— buildFlow(kind,T) 的第二个参数就叫 T(秒数),同名会把它挡住,
//               而且只在有数据流的站才炸。
// 主循环里那行拍号也要改:$('cTick').textContent='拍 '+tick() → $('cTickN').textContent=tick()
//               (外壳 DOM 里 #cTick 已经拆成 中/英 前缀 + #cTickN 数字两段)
//
// 三个要点:
//   1 站点切换用 1.7s 三次缓动;dist 走**指数插值**(线性会先冲远再拉回);
//     方位角取最短弧(差值归一到 ±π)
//   2 标签是 HTML 元素按 3D 锚点投影定位 + SVG 引线。挤在一起就靠 dy 拉开(正值放锚点下方)
//   3 标签支持 live:'键名',每帧从 FLOW.live[键名] 取实时文字 —— 这是"看得懂"的一半

//==============================================================
// S13 · 站点切换(相机缓动) / 3D 标签层 / 交互
//==============================================================
let cur=0, tween=null, labelsOn=false;
const $=id=>document.getElementById(id);
function snapshot(){ return {cam:{tgt:cam.tgt.slice(),az:cam.az,el:cam.el,dist:cam.dist,fov:cam.fov,ap:cam.ap,fy:cam.fy,ex:cam.ex},
                             state:{lift:STATE.lift,cutX:STATE.cutX}}; }
function applyPose(p){
  cam.tgt=p.cam.tgt.slice(); cam.az=p.cam.az; cam.el=p.cam.el; cam.dist=p.cam.dist;
  cam.fov=p.cam.fov; cam.ap=p.cam.ap; cam.fy=p.cam.fy; cam.ex=p.cam.ex;
  STATE.lift=p.state.lift; STATE.cutX=p.state.cutX;
}
const lerp=(a,b,t)=>a+(b-a)*t;
function goTo(i, instant){
  i=Math.max(0,Math.min(STATIONS.length-1,i)); cur=i;
  const st=STATIONS[i];
  const to={cam:Object.assign({},st.cam), state:Object.assign({lift:0,cutX:60},st.state)};
  cam.focus=st.cam.focus||'plane';
  const from=snapshot();
  let dAz=to.cam.az-from.cam.az;
  while(dAz>Math.PI) dAz-=2*Math.PI; while(dAz<-Math.PI) dAz+=2*Math.PI;
  to.cam.az=from.cam.az+dAz;
  labelsOn=false; buildLabels();
  if(instant){ applyPose(to); tween=null; labelsOn=true; }
  else tween={t0:performance.now(), dur:1700, from, to};
  renderUI(); reset();
}
function stepTween(now){
  if(!tween) return false;
  let t=(now-tween.t0)/tween.dur;
  if(t>=1){ applyPose(tween.to); tween=null; labelsOn=true; reset(); return false; }
  const e=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const f=tween.from, o=tween.to;
  applyPose({
    cam:{ tgt:[lerp(f.cam.tgt[0],o.cam.tgt[0],e),lerp(f.cam.tgt[1],o.cam.tgt[1],e),lerp(f.cam.tgt[2],o.cam.tgt[2],e)],
          az:lerp(f.cam.az,o.cam.az,e), el:lerp(f.cam.el,o.cam.el,e),
          dist:Math.exp(lerp(Math.log(f.cam.dist),Math.log(o.cam.dist),e)),
          fov:lerp(f.cam.fov,o.cam.fov,e), ap:lerp(f.cam.ap,o.cam.ap,e), fy:lerp(f.cam.fy,o.cam.fy,e), ex:lerp(f.cam.ex,o.cam.ex,e) },
    state:{ lift:lerp(f.state.lift,o.state.lift,e), cutX:lerp(f.state.cutX,o.state.cutX,e) }
  });
  reset(); return true;
}
// —— 标签层:HTML 元素按 3D 锚点投影定位,SVG 画引线 ——
const labelEls=[];
function resolveAnchor(p){
  let a = (typeof p==='string') ? POS[p] : (Array.isArray(p)&&typeof p[0]==='string') ? POS[p[0]][p[1]] : p;
  if(!a) return null;
  if(Array.isArray(a[0])) a=a[Math.floor(a.length/2)];
  return a;
}
function buildLabels(){
  const box=$('labels'), svg=$('leaders');
  box.innerHTML=''; svg.innerHTML=''; labelEls.length=0;
  for(const lb of (STATIONS[cur].labels||[])){
    const p=resolveAnchor(lb.p); if(!p) continue;
    const el=document.createElement('div'); el.className='lb';
    el.innerHTML=lb.t+(lb.s?'<small>'+lb.s+'</small>':'');
    box.appendChild(el);
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('stroke','rgba(120,180,245,.75)'); ln.setAttribute('stroke-width','1.2');
    svg.appendChild(ln);
    labelEls.push({el,ln,p,dy:lb.dy||-34,live:lb.live||null,base:lb.t+(lb.s?'<small>'+lb.s+'</small>':''),last:null});
  }
}
function updateLabels(){
  if(!labelEls.length) return;
  const vp=camMats(0).vp, cw=cv.clientWidth, ch=cv.clientHeight;
  for(const L of labelEls){
    const [x,y,z]=L.p;
    const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
    if(w<=0.01){ L.el.classList.remove('show'); L.ln.setAttribute('opacity','0'); continue; }
    const sx=((vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w*0.5+0.5)*cw;
    const sy=(1-((vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w*0.5+0.5))*ch;
    const on=labelsOn && sx>-50 && sx<cw+50 && sy>-50 && sy<ch+50;
    if(L.live && FLOW.live && FLOW.live[L.live]!=null && FLOW.live[L.live]!==L.last){
      L.last=FLOW.live[L.live]; L.el.innerHTML=L.base.replace(/<small>.*<\/small>/,'')+'<small>'+L.last+'</small>'; }
    L.el.style.left=sx+'px'; L.el.style.top=(sy+L.dy)+'px';
    L.el.classList.toggle('show',on);
    L.ln.setAttribute('x1',sx); L.ln.setAttribute('y1',sy);
    L.ln.setAttribute('x2',sx); L.ln.setAttribute('y2',sy+L.dy+4);
    L.ln.setAttribute('opacity',on?'1':'0');
  }
}
// —— UI ——
function renderUI(){
  const st=STATIONS[cur];
  document.querySelectorAll('#acts button').forEach((b,k)=>b.classList.toggle('on',k===st.act));
  document.querySelectorAll('#stations button').forEach((b,k)=>{
    b.classList.toggle('on',k===cur); b.classList.toggle('done',k<cur); });
  $('cK').innerHTML=ACTS[st.act]+' · '+String(cur+1).padStart(2,'0')+' / '+STATIONS.length;
  $('cT').innerHTML=st.title;
  $('cB').innerHTML=st.body;
  $('bPrev').disabled=(cur===0);
  $('clk').classList.toggle('on', !!st.flow);
  $('bNext').innerHTML=(cur===STATIONS.length-1)
    ? BI('Start over ↺','回到开头 ↺') : BI('Next','下一站')+' →';
  const sl=$('hAp'); if(sl) sl.value=50;
  const ts=$('hTs'); if(ts) ts.checked=(cam.focus==='plane');
}
function buildUI(){
  const acts=$('acts');
  ACTS.forEach((n,i)=>{ const b=document.createElement('button'); b.innerHTML=n;
    b.onclick=()=>goTo(STATIONS.findIndex(s=>s.act===i)); acts.appendChild(b); });
  const sts=$('stations');
  STATIONS.forEach((s,i)=>{ const b=document.createElement('button'); b.textContent=i+1;
    b.title=s.title.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    b.onclick=()=>goTo(i); sts.appendChild(b); });
  $('bPrev').onclick=()=>goTo(cur-1);
  $('bNext').onclick=()=>goTo((cur+1)%STATIONS.length);
  const gl_=$('gList');
  GLOSSARY.forEach(([en,zh,ex])=>{ const dt=document.createElement('dt'); dt.innerHTML=en+'<span>'+zh+'</span>';
    const dd=document.createElement('dd'); dd.innerHTML=ex; gl_.appendChild(dt); gl_.appendChild(dd); });
  // 说明卡收起:它占着左下一大块,挡住主体时收成一条。收起状态跨站保留
  const cap=$('caption'), capBtn=$('cHide');
  const setMini=(on)=>{ cap.classList.toggle('mini',on);
    capBtn.innerHTML = on ? BI('Caption ⌃','说明 ⌃') : BI('Hide ⌄','收起 ⌄');
    capBtn.title = on ? '展开说明卡（H）' : '收起说明卡（H）';
    capBtn.setAttribute('aria-expanded', String(!on)); };
  const toggleMini=()=>setMini(!cap.classList.contains('mini'));
  // 渲染状态同理:收起后只留标题和累积进度条
  const hud=$('hud'), hudBtn=$('hHide');
  const setHud=(on)=>{ hud.classList.toggle('mini',on);
    hudBtn.innerHTML = on ? BI('Show ⌃','展开 ⌃') : BI('Hide ⌄','收起 ⌄');
    hudBtn.title = on ? '展开渲染状态（R）' : '收起渲染状态（R）';
    hudBtn.setAttribute('aria-expanded', String(!on)); };
  const toggleHud=()=>setHud(!hud.classList.contains('mini'));
  hudBtn.onclick=toggleHud;
  capBtn.onclick=toggleMini;
  // 中英切换:整页靠 html[data-lang] 一个属性驱动,不用重建 DOM
  const langBtn=$('langBtn'), docEl=document.documentElement;
  langBtn.onclick=()=>{ const zh = docEl.getAttribute('data-lang')==='zh';
    docEl.setAttribute('data-lang', zh?'en':'zh');
    docEl.setAttribute('lang', zh?'en':'zh');
    langBtn.textContent = zh ? '中文' : 'English'; };
  $('gBtn').onclick=()=>$('gPanel').classList.toggle('open');
  $('gClose').onclick=()=>$('gPanel').classList.remove('open');
  window.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='PageDown'){ goTo(Math.min(cur+1,STATIONS.length-1)); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ goTo(Math.max(cur-1,0)); }
    else if(e.key==='h'||e.key==='H'){ toggleMini(); }
    else if(e.key==='r'||e.key==='R'){ toggleHud(); }
    else if(e.key==='Escape'){ $('gPanel').classList.remove('open'); }
  });
  $('cPlay').onclick=()=>{ CLK.playing=!CLK.playing; $('cPlay').textContent=CLK.playing?'⏸':'▶'; };
  $('cStep').onclick=()=>{ CLK.playing=false; $('cPlay').textContent='▶'; CLK.t=Math.floor(CLK.t)+1; };
  $('cSpd').addEventListener('input',e=>{ CLK.speed=e.target.value/100; });
  $('hAp').addEventListener('input',e=>{ cam.ap=STATIONS[cur].cam.ap*(e.target.value/50); reset(); });
  $('hTs').addEventListener('change',e=>{ cam.focus=e.target.checked?'plane':'point'; reset(); });
}
// —— 鼠标:接管相机时取消缓动 ——
let drag=null;
cv.addEventListener('mousedown',e=>{ drag={x:e.clientX,y:e.clientY,btn:e.button}; tween=null; labelsOn=true; e.preventDefault(); });
window.addEventListener('mouseup',()=>drag=null);
window.addEventListener('mousemove',e=>{
  if(!drag) return;
  const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
  if(drag.btn===2||e.shiftKey){
    const rx=Math.cos(cam.az), rz=-Math.sin(cam.az), k=cam.dist*0.0016;
    cam.tgt[0]-=dx*rx*k; cam.tgt[2]-=dx*rz*k; cam.tgt[1]+=dy*k;
  } else {
    cam.az-=dx*0.0052; cam.el=Math.max(0.02,Math.min(1.52,cam.el+dy*0.0042));
  }
  reset();
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{ e.preventDefault(); tween=null;
  cam.dist=Math.max(4,Math.min(700,cam.dist*Math.exp(e.deltaY*0.0011))); reset(); },{passive:false});
window.addEventListener('resize',resize);

