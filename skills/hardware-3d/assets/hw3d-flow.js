// hw3d 数据流叠加层 —— 让数据看得懂的那一层
//
// 机制:写实底层照常累积收敛;这一层每个显示帧单独画到自己的 HDR 缓冲,
//      深度复用 G-buffer 的、只测不写,再与累积结果相加后进泛光。
//      不这么分开的话,流动的东西会被累积平均成一条拖影。
//
// 三套网格:box(垫片/丝带) · orb(光球,pow(ndv,1.6)) · flat(无圆角平片)
//   光球不能用圆角盒 —— 26 个面各自算边缘发光,会变成花皮足球;
//   像素格也不能 —— 非等比缩放后角上留黑点。
//
// 页面要提供:FLOW / FC(三色) / gbuf / W,H / CHK() / h1() / lastVP,lastEye
// 用法见 ../references/flow-craft.md

//==============================================================
// S12b · 数据流叠加层
//   写实底层照常累积;这一层每个显示帧单独画到自己的 HDR 缓冲,
//   深度用 G-buffer 的深度只测不写,再与累积结果相加进泛光。
//   颜色纪律:命令=琥珀 · 数据=青 · 像素=洋红;几何本体绝不发光。
//==============================================================
const FLOW_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 iPos; layout(location=3) in vec3 iScl; layout(location=4) in vec3 iCol;
layout(location=5) in vec4 iMat;   // yaw, 强度, 边缘柔和度, -
uniform mat4 uVP;
out vec3 vN; out vec3 vW; out vec3 vCol; out float vInt; out float vSoft;
void main(){
  float c=cos(iMat.x), s=sin(iMat.x);
  vec3 sp=aPos*iScl;
  vec3 rp=vec3(sp.x*c+sp.z*s, sp.y, -sp.x*s+sp.z*c);
  vec3 nn=normalize(aNrm/max(iScl,vec3(1e-4)));
  vN=vec3(nn.x*c+nn.z*s, nn.y, -nn.x*s+nn.z*c);
  vW=iPos+rp; vCol=iCol; vInt=iMat.y; vSoft=iMat.z;
  gl_Position=uVP*vec4(vW,1.0);
}`;
const FLOW_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec3 vCol; in float vInt; in float vSoft;
uniform vec3 uCam; out vec4 o;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCam-vW);
  float ndv=max(dot(N,V),0.0);
  // 光球:中心亮、边缘柔(不是圆角盒那种一格一格的 rim);垫片:均匀
  float k = vSoft>0.5 ? pow(ndv,1.6)*1.45 : 1.0;
  o=vec4(vCol*vInt*k, 1.0);
}`;
const COMBINE_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o; uniform sampler2D uA, uB; uniform float uBOn;
void main(){ o=vec4(texture(uA,vUV).rgb + uBOn*texture(uB,vUV).rgb, 1.0); }`;

const FLOW={ box:null, orb:null, flat:null, list:[], on:0, live:{} };
const FC={ cmd:[1.0,0.60,0.16], data:[0.22,0.82,1.0], px:[1.0,0.32,0.72] };
let lastVP=null, lastEye=[0,0,0];
function mkFlowFBO(w,h){
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  const t=mkTex(w,h,gl.RGBA,gl.RGBA16F,gl.HALF_FLOAT,gl.LINEAR);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,gbuf.dep,0);
  const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(st!==gl.FRAMEBUFFER_COMPLETE) fatal('叠加层帧缓冲创建失败 (0x'+st.toString(16)+')');
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {fb, tex:[t], t, w, h};
}
// —— 几何小工具 ——
const V=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const dist3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function pathAt(pts,u){
  u=Math.max(0,Math.min(0.99999,u));
  let L=0; const seg=[]; for(let i=0;i<pts.length-1;i++){ const d=dist3(pts[i],pts[i+1]); seg.push(d); L+=d; }
  let s=u*L;
  for(let i=0;i<seg.length;i++){ if(s<=seg[i]) return V(pts[i],pts[i+1],seg[i]>0?s/seg[i]:0); s-=seg[i]; }
  return pts[pts.length-1].slice();
}
const pulse=(T,period,ph)=>0.5+0.5*Math.sin((T/period+(ph||0))*6.2831853);
function glow(p,scl,col,inten){ FLOW.list.push({p, s:scl, c:col, me:inten, ro:0.0, orb:0}); }
function packets(T,pts,n,period,col,size,ph){
  for(let i=0;i<n;i++){ const u=((T/period)+i/n+(ph||0))%1;
    FLOW.list.push({p:pathAt(pts,u), s:[size,size,size], c:col, me:3.0, ro:1.0, orb:1}); }
}
function ribbon(pts,col,inten,w){
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1]; const dx=b[0]-a[0], dz=b[2]-a[2]; const len=Math.hypot(dx,dz);
    if(len<1e-3) continue;
    FLOW.list.push({p:V(a,b,0.5), s:[len,0.06,w], c:col, me:inten, yaw:Math.atan2(dz,dx), ro:0.0, orb:0});
  }
}
// ---------- 全局时钟:数据按"拍"走,可暂停 / 单步 / 调速 ----------
const CLK={ t:0, speed:1.0, playing:true, last:0, tps:1.4 };   // tps = 每秒几拍
function clockStep(now){
  if(!CLK.last) CLK.last=now;
  if(CLK.playing) CLK.t += (now-CLK.last)/1000*CLK.tps*CLK.speed;
  CLK.last=now;
}
const tick =()=>Math.floor(CLK.t);
const phase=()=>CLK.t-Math.floor(CLK.t);
const h1=(a,b,c)=>{ const x=Math.sin(a*12.9898+b*78.233+(c||0)*37.719)*43758.5453; return x-Math.floor(x); };
const ease=(x)=>x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2;

// ---------- 数据对象原语(全部落到叠加层) ----------
// 平片(无圆角):通用"格子"
function pad(p,sx,sz,col,inten,yaw){ FLOW.list.push({p, s:[sx,0.02,sz], c:col, me:inten, yaw:yaw||0, ro:0.0, orb:0, flat:1}); }
// 一行 n 位:亮 = 1,暗 = 0;dir 为行方向(弧度,0 = +x)
function wordRow(center,yaw,nbits,pitch,bitFn,col,inten,cellW){
  const dx=Math.cos(yaw), dz=-Math.sin(yaw);
  for(let i=0;i<nbits;i++){
    const o=(i-(nbits-1)/2)*pitch;
    const on=bitFn(i);
    pad([center[0]+dx*o, center[1], center[2]+dz*o], cellW||pitch*0.72, cellW?cellW*1.6:pitch*0.72*1.6, col, inten*(on?1.0:0.12), yaw+Math.PI/2);
  }
}
// n 根并行导线(xz 平面内,a→b,垂直方向等距展开)
function wires(a,b,n,spacing,col,inten,w){
  const dx=b[0]-a[0], dz=b[2]-a[2], len=Math.hypot(dx,dz); if(len<1e-3) return;
  const yaw=Math.atan2(dz,dx);
  const nx=-dz/len, nz=dx/len;            // 垂直单位向量
  for(let i=0;i<n;i++){
    const o=(i-(n-1)/2)*spacing;
    FLOW.list.push({p:[(a[0]+b[0])/2+nx*o,(a[1]+b[1])/2,(a[2]+b[2])/2+nz*o], s:[len,0.02,w||0.10], c:col, me:inten, yaw, ro:0.0, orb:0, flat:1});
  }
}
// 沿导线束移动的一行位(u∈[0,1] 沿 a→b)
function wordOnWires(a,b,u,n,spacing,bitFn,col,inten){
  const p=V(a,b,u); const dx=b[0]-a[0], dz=b[2]-a[2], len=Math.hypot(dx,dz);
  const yaw=Math.atan2(dz,dx);
  wordRow(p, yaw+Math.PI/2, n, spacing, bitFn, col, inten, spacing*0.8);
}
// 一块(缓存行 / 矩阵 / 帧缓冲片)网格
function gridObj(center,yaw,cols,rows,cell,colFn,inten){
  const cy=Math.cos(yaw), sy=-Math.sin(yaw);
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
    const ox=(i-(cols-1)/2)*cell, oz=(j-(rows-1)/2)*cell;
    const c=colFn(i,j); if(!c) continue;
    pad([center[0]+ox*cy-oz*sy, center[1], center[2]+ox*sy+oz*cy], cell*0.9, cell*0.9, c.col||c, c.inten!=null?c.inten:inten, yaw);
  }
}
// 一张"卡"(命令 / 指令):底板 + 三条短线
function cardObj(p,yaw,col,inten,scale){
  const s=scale||1;
  pad(p,3.0*s,2.0*s,col,inten*0.35,yaw);
  const cy=Math.cos(yaw), sy=-Math.sin(yaw);
  for(let k=0;k<3;k++){ const oz=(k-1)*0.55*s, ox=-0.2*s;
    pad([p[0]+ox*cy-oz*sy, p[1]+0.03, p[2]+ox*sy+oz*cy], 1.8*s, 0.22*s, col, inten, yaw); }
}

// ---------- 组合原语 ----------
// 上面那段已给出基础原语(pathAt / pad / glow / wordRow / gridObj / cardObj / wires /
// wordOnWires / packets)。下面四个是从它们拼出来的常用件。
// 完整用法和"什么时候用哪个"见 ../references/flow-craft.md

// 光球:包 / 粒子 / 光子。不能用圆角盒代替 —— 26 个面各自算边缘发光会变花皮足球
function orb(p,r,col,inten){ FLOW.list.push({p, s:[r,r,r], c:col, me:inten, ro:1.0, orb:1}); }
// 数据块沿路径走(底下垫一层淡光,远看也有形)
function tileAlong(P,u,cols,rows,col,seed,inten,cell){
  const p=pathAt(P,u), c=cell||1.45;
  gridObj(p,0,cols,rows,c,(i,j)=>({col,inten:(inten||1.4)*1.5*(h1(seed,i,j)>0.5?1:0.22)}),1);
  glow([p[0],p[1]-0.3,p[2]],[cols*c+1.2,0.02,rows*c+1.2],col,0.25);
}
// 一张卡沿路径走
function tokenAlong(P,u,col){
  const p=pathAt(P,u); cardObj(p,0,col,2.6,1.9); orb([p[0],p[1]+0.9,p[2]],2.2,col,1.6); }
// 逻辑块表面的"在忙"高亮
function blockGlow(p,sx,sz,col,inten){ glow([p[0],p[1]+0.05,p[2]],[sx,0.02,sz],col,inten); }

function renderFlow(){
  if(!FLOW.box||!lastVP) return;
  uploadInst(FLOW.box,  FLOW.list.filter(o=>!o.orb && !o.flat));
  uploadInst(FLOW.orb,  FLOW.list.filter(o=> o.orb));
  uploadInst(FLOW.flat, FLOW.list.filter(o=> o.flat));
  gl.bindFramebuffer(gl.FRAMEBUFFER,flow.fb); gl.viewport(0,0,W,H);
  gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false);
  gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE);
  gl.useProgram(PR.flow);
  gl.uniformMatrix4fv(PR.flow.u.uVP,false,lastVP);
  gl.uniform3fv(PR.flow.u.uCam,lastEye);
  for(const m of [FLOW.box,FLOW.orb,FLOW.flat]){ if(!m.count) continue;
    gl.bindVertexArray(m.vao);
    gl.drawElementsInstanced(gl.TRIANGLES,m.n,m.type,0,m.count); }
  gl.bindVertexArray(null);
  gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.disable(gl.DEPTH_TEST); gl.depthMask(true);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  CHK('pass.flow');
}

