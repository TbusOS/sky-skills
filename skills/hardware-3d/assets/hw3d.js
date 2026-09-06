// hw3d · 写实硬件 3D 引擎内核(WebGL2,零外部依赖)
// 从 my-chat 62 号「GPU 从硅片到屏幕」抽出。用法见 ../SKILL.md。
// 内含:数学 / GL 核心 / 真圆角几何 / 实例化 / 程序化棚拍 IBL / 丝印图集 /
//       着色器(G-buffer·阴影·SSAO·IBL 光照·泛光·ACES 后期) / 材质表 / 帧缓冲 / 渲染管线
// 需要页面自己提供:cv(canvas) · buildScene() · SCENE · cam · STATE · reset() · CHK()
//==============================================================
// S1 · 数学
//==============================================================
const M4 = {
  ident(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); },
  mul(a,b,o){ o=o||new Float32Array(16);
    for(let c=0;c<4;c++){ const c4=c*4,
      b0=b[c4],b1=b[c4+1],b2=b[c4+2],b3=b[c4+3];
      o[c4  ]=a[0]*b0+a[4]*b1+a[8 ]*b2+a[12]*b3;
      o[c4+1]=a[1]*b0+a[5]*b1+a[9 ]*b2+a[13]*b3;
      o[c4+2]=a[2]*b0+a[6]*b1+a[10]*b2+a[14]*b3;
      o[c4+3]=a[3]*b0+a[7]*b1+a[11]*b2+a[15]*b3; }
    return o; },
  persp(fovy,asp,zn,zf,o){ o=o||new Float32Array(16);
    const f=1/Math.tan(fovy/2), nf=1/(zn-zf);
    o.fill(0); o[0]=f/asp; o[5]=f; o[10]=(zf+zn)*nf; o[11]=-1; o[14]=2*zf*zn*nf;
    return o; },
  ortho(l,r,b,t,zn,zf,o){ o=o||new Float32Array(16); o.fill(0);
    o[0]=2/(r-l); o[5]=2/(t-b); o[10]=-2/(zf-zn); o[15]=1;
    o[12]=-(r+l)/(r-l); o[13]=-(t+b)/(t-b); o[14]=-(zf+zn)/(zf-zn);
    return o; },
  look(eye,ctr,up,o){ o=o||new Float32Array(16);
    let zx=eye[0]-ctr[0], zy=eye[1]-ctr[1], zz=eye[2]-ctr[2];
    let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
    let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
    l=Math.hypot(xx,xy,xz);
    if(l<1e-6){ xx=1; xy=0; xz=0; } else { xx/=l; xy/=l; xz/=l; }
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    o[0]=xx; o[1]=yx; o[2]=zx; o[3]=0;
    o[4]=xy; o[5]=yy; o[6]=zy; o[7]=0;
    o[8]=xz; o[9]=yz; o[10]=zz; o[11]=0;
    o[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
    o[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
    o[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
    o[15]=1; return o; },
  inv(m,o){ o=o||new Float32Array(16);
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3], a10=m[4],a11=m[5],a12=m[6],a13=m[7],
          a20=m[8],a21=m[9],a22=m[10],a23=m[11], a30=m[12],a31=m[13],a32=m[14],a33=m[15];
    const b00=a00*a11-a01*a10, b01=a00*a12-a02*a10, b02=a00*a13-a03*a10,
          b03=a01*a12-a02*a11, b04=a01*a13-a03*a11, b05=a02*a13-a03*a12,
          b06=a20*a31-a21*a30, b07=a20*a32-a22*a30, b08=a20*a33-a23*a30,
          b09=a21*a32-a22*a31, b10=a21*a33-a23*a31, b11=a22*a33-a23*a32;
    let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if(!d) return o; d=1/d;
    o[0]=(a11*b11-a12*b10+a13*b09)*d;  o[1]=(a02*b10-a01*b11-a03*b09)*d;
    o[2]=(a31*b05-a32*b04+a33*b03)*d;  o[3]=(a22*b04-a21*b05-a23*b03)*d;
    o[4]=(a12*b08-a10*b11-a13*b07)*d;  o[5]=(a00*b11-a02*b08+a03*b07)*d;
    o[6]=(a32*b02-a30*b05-a33*b01)*d;  o[7]=(a20*b05-a22*b02+a23*b01)*d;
    o[8]=(a10*b10-a11*b08+a13*b06)*d;  o[9]=(a01*b08-a00*b10-a03*b06)*d;
    o[10]=(a30*b04-a31*b02+a33*b00)*d; o[11]=(a21*b02-a20*b04-a23*b00)*d;
    o[12]=(a11*b07-a10*b09-a12*b06)*d; o[13]=(a00*b09-a01*b07+a02*b06)*d;
    o[14]=(a31*b01-a30*b03-a32*b00)*d; o[15]=(a20*b03-a21*b01+a22*b00)*d;
    return o; }
};
const V3 = {
  norm(v){ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; },
  add(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; },
  sub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; },
  scale(a,s){ return [a[0]*s,a[1]*s,a[2]*s]; },
  cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
};
// Halton 低差异序列 —— 累积采样的抖动来源
function halton(i,b){ let f=1,r=0; while(i>0){ f/=b; r+=f*(i%b); i=Math.floor(i/b); } return r; }

//==============================================================
// S2 · GL 核心
//==============================================================
const cv = document.getElementById('gl');
const gl = cv.getContext('webgl2', {antialias:false, alpha:false,
  depth:false, powerPreference:'high-performance', preserveDrawingBuffer:true});
function fatal(msg){
  const e=document.getElementById('err');
  e.style.display='grid'; e.textContent=msg; throw new Error(msg);
}
if(!gl) fatal('这台机器/浏览器不支持 WebGL2，页面无法渲染。');

const GLERR=[];
function CHK(tag){ if(GLERR.length>24) return;
  const e=gl.getError(); if(e) GLERR.push(tag+':0x'+e.toString(16)); }
const CAPS = {
  colorFloat : !!gl.getExtension('EXT_color_buffer_float'),
  floatLinear: !!gl.getExtension('OES_texture_float_linear'),
  aniso      : gl.getExtension('EXT_texture_filter_anisotropic')
};
if(!CAPS.colorFloat) fatal('缺少 EXT_color_buffer_float 扩展，无法做 HDR 渲染。');
const MAXANISO = CAPS.aniso ? gl.getParameter(CAPS.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;

function sh(type,src,tag){
  const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    const log=gl.getShaderInfoLog(s);
    console.error('['+tag+'] 着色器编译失败\n'+log);
    console.error(src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n'));
    fatal('着色器 '+tag+' 编译失败：\n'+log);
  }
  return s;
}
function prog(vs,fs,tag){
  const p=gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER,vs,tag+'.vs'));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER,fs,tag+'.fs'));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))
    fatal('着色器 '+tag+' 链接失败：\n'+gl.getProgramInfoLog(p));
  p.u = new Proxy({}, { get:(c,k)=>{ if(!(k in c)) c[k]=gl.getUniformLocation(p,k); return c[k]; } });
  return p;
}
// 2D 渲染目标
function mkTex(w,h,fmt,ifmt,type,filter,wrap){
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter||gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter||gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap||gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap||gl.CLAMP_TO_EDGE);
  return t;
}
function mkFBO(w,h,specs,wantDepth){
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  const texs=[], bufs=[];
  specs.forEach((s,i)=>{
    const t=mkTex(w,h,s.fmt,s.ifmt,s.type,s.filter);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0+i,gl.TEXTURE_2D,t,0);
    texs.push(t); bufs.push(gl.COLOR_ATTACHMENT0+i);
  });
  if(bufs.length>1) gl.drawBuffers(bufs);
  let depth=null;
  if(wantDepth){
    depth=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,depth);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
  }
  const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(st!==gl.FRAMEBUFFER_COMPLETE) fatal('帧缓冲创建失败 (0x'+st.toString(16)+')，尺寸 '+w+'x'+h);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {fb,tex:texs,t:texs[0],depth,w,h};
}
function delFBO(f){ if(!f) return;
  gl.deleteFramebuffer(f.fb); f.tex.forEach(t=>gl.deleteTexture(t));
  if(f.depth) gl.deleteRenderbuffer(f.depth); }

// 全屏三角形
const quadVAO = (()=>{
  const v=gl.createVertexArray(); gl.bindVertexArray(v);
  const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 3,-1, -1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindVertexArray(null); return v;
})();
const FS_VS = `#version 300 es
layout(location=0) in vec2 aP;
out vec2 vUV;
void main(){ vUV = aP*0.5+0.5; gl_Position = vec4(aP,0.0,1.0); }`;
function blit(){ gl.bindVertexArray(quadVAO); gl.drawArrays(gl.TRIANGLES,0,3); }

//==============================================================
// S3 · 几何生成 —— 真圆角盒（6 面 + 12 边 + 8 角）
//==============================================================
function roundedBox(w,h,d,r,seg){
  seg = Math.max(2, seg|0);
  r = Math.min(r, w/2-1e-4, h/2-1e-4, d/2-1e-4);
  const ex=w/2-r, ey=h/2-r, ez=d/2-r;
  const P=[], N=[], I=[];
  const push=(p,n)=>{ P.push(p[0],p[1],p[2]); N.push(n[0],n[1],n[2]); return P.length/3-1; };
  const quad=(a,b,c,dd,flip)=>{ if(flip) I.push(a,c,b, a,dd,c); else I.push(a,b,c, a,c,dd); };

  // ---- 6 个平面（t×b = n）----
  const E=[ex,ey,ez];
  const faces=[
    {n:[ 1,0,0], t:1, b:2, ax:0, s: 1},  {n:[-1,0,0], t:2, b:1, ax:0, s:-1},
    {n:[0, 1,0], t:2, b:0, ax:1, s: 1},  {n:[0,-1,0], t:0, b:2, ax:1, s:-1},
    {n:[0,0, 1], t:0, b:1, ax:2, s: 1},  {n:[0,0,-1], t:1, b:0, ax:2, s:-1}
  ];
  for(const f of faces){
    const mk=(st,sb)=>{ const p=[0,0,0];
      p[f.ax]=f.s*(E[f.ax]+r); p[f.t]=st*E[f.t]; p[f.b]=sb*E[f.b];
      return push(p,f.n); };
    quad(mk(-1,-1), mk(1,-1), mk(1,1), mk(-1,1), false);
  }
  // ---- 12 条边（四分之一圆柱）----
  // 轴 ax，另两轴按循环序 (a1,a2)，满足 cross(e_a1,e_a2)=e_ax
  const cyc=[[1,2],[2,0],[0,1]];
  for(let ax=0; ax<3; ax++){
    const [a1,a2]=cyc[ax];
    for(const s1 of [-1,1]) for(const s2 of [-1,1]){
      const flip = (s1*s2 < 0);
      const base=[];
      for(let k=0;k<=seg;k++){
        const th=k/seg*Math.PI/2, ct=Math.cos(th), st=Math.sin(th);
        for(const tt of [-1,1]){
          const p=[0,0,0], n=[0,0,0];
          p[a1]=s1*(E[a1]+r*ct); p[a2]=s2*(E[a2]+r*st); p[ax]=tt*E[ax];
          n[a1]=s1*ct; n[a2]=s2*st;
          base.push(push(p,n));
        }
      }
      for(let k=0;k<seg;k++){
        const i0=base[k*2], i1=base[k*2+1], i2=base[k*2+3], i3=base[k*2+2];
        quad(i0,i1,i2,i3,flip);
      }
    }
  }
  // ---- 8 个角（球面八分之一）----
  for(const sx of [-1,1]) for(const sy of [-1,1]) for(const sz of [-1,1]){
    const flip = (sx*sy*sz < 0);
    const grid=[];
    for(let i=0;i<=seg;i++){
      const ph=i/seg*Math.PI/2, cp=Math.cos(ph), sp=Math.sin(ph);
      for(let j=0;j<=seg;j++){
        const th=j/seg*Math.PI/2, ct=Math.cos(th), st=Math.sin(th);
        const n=[sx*ct*cp, sy*ct*sp, sz*st];
        grid.push(push([sx*ex+r*n[0], sy*ey+r*n[1], sz*ez+r*n[2]], n));
      }
    }
    const W=seg+1;
    for(let i=0;i<seg;i++) for(let j=0;j<seg;j++){
      quad(grid[i*W+j], grid[(i+1)*W+j], grid[(i+1)*W+j+1], grid[i*W+j+1], flip);
    }
  }
  return { pos:new Float32Array(P), nrm:new Float32Array(N),
           idx:(P.length/3>65535)?new Uint32Array(I):new Uint16Array(I),
           half:[w/2,h/2,d/2] };
}
// 圆柱（用于过孔 / 微凸块 / TSV）
function cylinder(r,h,seg,cap){
  const P=[],N=[],I=[];
  const push=(p,n)=>{ P.push(p[0],p[1],p[2]); N.push(n[0],n[1],n[2]); return P.length/3-1; };
  const ring=[];
  for(let i=0;i<=seg;i++){
    const a=i/seg*Math.PI*2, c=Math.cos(a), s=Math.sin(a);
    ring.push([push([r*c, h/2,r*s],[c,0,s]), push([r*c,-h/2,r*s],[c,0,s])]);
  }
  for(let i=0;i<seg;i++){
    const [t0,b0]=ring[i], [t1,b1]=ring[i+1];
    I.push(t0,b0,b1, t0,b1,t1);
  }
  if(cap!==false){
    const ct=push([0, h/2,0],[0, 1,0]), cb=push([0,-h/2,0],[0,-1,0]);
    for(let i=0;i<seg;i++){
      const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
      const t0=push([r*Math.cos(a0), h/2, r*Math.sin(a0)],[0,1,0]);
      const t1=push([r*Math.cos(a1), h/2, r*Math.sin(a1)],[0,1,0]);
      I.push(ct,t0,t1);
      const u0=push([r*Math.cos(a0),-h/2, r*Math.sin(a0)],[0,-1,0]);
      const u1=push([r*Math.cos(a1),-h/2, r*Math.sin(a1)],[0,-1,0]);
      I.push(cb,u1,u0);
    }
  }
  return { pos:new Float32Array(P), nrm:new Float32Array(N),
           idx:(P.length/3>65535)?new Uint32Array(I):new Uint16Array(I),
           half:[r,h/2,r] };
}

//==============================================================
// S4 · 实例化网格
//   attr 0 aPos / 1 aNrm  |  实例 2 iPos / 3 iScl / 4 iCol / 5 iMat / 6 iAtl / 7 iExt(组,剖切,相位,剖面类型)
//   iMat = (yaw, metallic, roughness, 丝印权重)
//==============================================================
const INST_FLOATS = 3+3+3+4+4+4;            // 21
const INST_BYTES  = INST_FLOATS*4;          // 84
function makeMesh(geo, maxInst){
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  const inter=new Float32Array(geo.pos.length*2);
  for(let i=0,n=geo.pos.length/3;i<n;i++){
    inter[i*6  ]=geo.pos[i*3  ]; inter[i*6+1]=geo.pos[i*3+1]; inter[i*6+2]=geo.pos[i*3+2];
    inter[i*6+3]=geo.nrm[i*3  ]; inter[i*6+4]=geo.nrm[i*3+1]; inter[i*6+5]=geo.nrm[i*3+2];
  }
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
  const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geo.idx,gl.STATIC_DRAW);
  const inb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,inb);
  gl.bufferData(gl.ARRAY_BUFFER, maxInst*INST_BYTES, gl.DYNAMIC_DRAW);
  const lay=[[2,3,0],[3,3,12],[4,3,24],[5,4,36],[6,4,52],[7,4,68]];
  for(const [loc,size,off] of lay){
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,size,gl.FLOAT,false,INST_BYTES,off);
    gl.vertexAttribDivisor(loc,1);
  }
  gl.bindVertexArray(null);
  return { vao, max:maxInst, ib:geo.idx, n:geo.idx.length,
           type:(geo.idx instanceof Uint32Array)?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,
           inb, half:geo.half, count:0, tris:geo.idx.length/3 };
}
function uploadInst(mesh, list){
  if(list.length > mesh.max){
    console.error('实例数超出缓冲容量: '+list.length+' > '+mesh.max+
      '（建缓冲时的 maxInst 要调大）');
    list = list.slice(0, mesh.max);
  }
  const a=new Float32Array(list.length*INST_FLOATS);
  list.forEach((o,i)=>{
    const k=i*INST_FLOATS;
    a[k  ]=o.p[0]; a[k+1]=o.p[1]; a[k+2]=o.p[2];
    a[k+3]=o.s?o.s[0]:1; a[k+4]=o.s?o.s[1]:1; a[k+5]=o.s?o.s[2]:1;
    a[k+6]=o.c[0]; a[k+7]=o.c[1]; a[k+8]=o.c[2];
    a[k+9]=o.yaw||0; a[k+10]=o.me||0; a[k+11]=o.ro==null?0.5:o.ro; a[k+12]=o.tx||0;
    const r=o.atl||[0,0,0,0];
    a[k+13]=r[0]; a[k+14]=r[1]; a[k+15]=r[2]; a[k+16]=r[3];
    a[k+17]=o.g||0; a[k+18]=o.clip||0; a[k+19]=o.ph||0; a[k+20]=o.kind||0;
  });
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.inb);
  gl.bufferSubData(gl.ARRAY_BUFFER,0,a);
  mesh.count=list.length;
}

//==============================================================
// S5 · 程序化棚拍环境 —— 烘 cubemap → 预过滤 → 辐照度 → BRDF LUT
//   全部开机现算，不引入任何外部贴图文件
//==============================================================
const ENV_SIZE=256, ENV_MIPS=6, IRR_SIZE=32, LUT_SIZE=128;

const CUBE_DIR_GLSL = `
vec3 cubeDir(int face, vec2 uv){        // uv in [-1,1]
  float u=uv.x, v=uv.y;
  if(face==0) return normalize(vec3( 1.0, -v, -u));
  if(face==1) return normalize(vec3(-1.0, -v,  u));
  if(face==2) return normalize(vec3( u,  1.0,  v));
  if(face==3) return normalize(vec3( u, -1.0, -v));
  if(face==4) return normalize(vec3( u,  -v,  1.0));
  return              normalize(vec3(-u,  -v, -1.0));
}`;

// —— 棚拍布光：三块柔光箱 + 无缝背景纸渐变 ——
const STUDIO_GLSL = `
float rectLight(vec3 d, vec3 ax, vec3 upv, float hu, float hv, float fe){
  float dd = dot(d,ax);
  if(dd <= 0.05) return 0.0;
  vec3 t = normalize(cross(upv,ax));
  vec3 b = cross(ax,t);
  vec3 p = d/dd;
  float su = 1.0 - smoothstep(hu, hu+fe, abs(dot(p,t)));
  float sv = 1.0 - smoothstep(hv, hv+fe, abs(dot(p,b)));
  return su*sv;
}
vec3 studio(vec3 d){
  // 无缝背景纸：上浅下深的中性灰
  float up = clamp(d.y*0.5+0.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.0125,0.0130,0.0150), vec3(0.105,0.109,0.120), pow(up,1.55));
  // 地面：更暗、略偏暖
  c = mix(c, vec3(0.0095,0.0090,0.0086), smoothstep(0.04,-0.34,d.y));
  // 主光（大柔光箱，左上前方）
  c += rectLight(d, normalize(vec3(-0.34, 0.88, 0.33)), vec3(0,0,1), 0.46,0.30,0.30)
       * vec3(1.00,0.985,0.955) * 6.2;
  // 补光（右侧，低、暗、偏冷）
  c += rectLight(d, normalize(vec3( 0.85, 0.26,-0.18)), vec3(0,1,0), 0.40,0.26,0.34)
       * vec3(0.82,0.88,1.00) * 1.45;
  // 轮廓光（后方窄条）
  c += rectLight(d, normalize(vec3( 0.10, 0.34,-0.93)), vec3(0,1,0), 0.30,0.09,0.16)
       * vec3(1.00,0.96,0.90) * 2.9;
  return c;
}`;

function bakeCubeFaces(program, size, targetCube, level, setup){
  gl.bindVertexArray(quadVAO);
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.viewport(0,0,size,size);
  gl.useProgram(program);
  if(setup) setup();
  for(let f=0;f<6;f++){
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_CUBE_MAP_POSITIVE_X+f, targetCube, level||0);
    gl.uniform1i(program.u.uFace,f);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.deleteFramebuffer(fb);
}
function newCube(size,mips){
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_CUBE_MAP,t);
  gl.texStorage2D(gl.TEXTURE_CUBE_MAP, mips, gl.RGBA16F, size, size);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,
    mips>1?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_R,gl.CLAMP_TO_EDGE);
  return t;
}
const ENV = {};
function bakeEnvironment(){
  // (1) 原始环境
  const pRaw = prog(FS_VS, `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform int uFace;
${CUBE_DIR_GLSL}
${STUDIO_GLSL}
void main(){ o=vec4(studio(cubeDir(uFace, vUV*2.0-1.0)),1.0); }`, 'env.raw');
  ENV.raw = newCube(ENV_SIZE, ENV_MIPS);
  bakeCubeFaces(pRaw, ENV_SIZE, ENV.raw, 0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, ENV.raw);
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

  // (2) 镜面预过滤（GGX 重要性采样，逐 mip 对应一档粗糙度）
  const pPre = prog(FS_VS, `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform int uFace; uniform float uRough; uniform float uSize;
uniform samplerCube uEnv;
${CUBE_DIR_GLSL}
const float PI=3.14159265359;
float rad(uint bits){
  bits=(bits<<16u)|(bits>>16u);
  bits=((bits&0x55555555u)<<1u)|((bits&0xAAAAAAAAu)>>1u);
  bits=((bits&0x33333333u)<<2u)|((bits&0xCCCCCCCCu)>>2u);
  bits=((bits&0x0F0F0F0Fu)<<4u)|((bits&0xF0F0F0F0u)>>4u);
  bits=((bits&0x00FF00FFu)<<8u)|((bits&0xFF00FF00u)>>8u);
  return float(bits)*2.3283064365386963e-10;
}
vec3 ggx(vec2 Xi, vec3 N, float a){
  float phi=2.0*PI*Xi.x;
  float ct=sqrt((1.0-Xi.y)/(1.0+(a*a-1.0)*Xi.y));
  float st=sqrt(1.0-ct*ct);
  vec3 H=vec3(cos(phi)*st, sin(phi)*st, ct);
  vec3 U=abs(N.z)<0.999?vec3(0,0,1):vec3(1,0,0);
  vec3 T=normalize(cross(U,N)), B=cross(N,T);
  return normalize(T*H.x+B*H.y+N*H.z);
}
void main(){
  vec3 N=cubeDir(uFace, vUV*2.0-1.0);
  vec3 V=N;
  float a=max(uRough*uRough, 1e-3);
  const uint NS=192u;
  vec3 sum=vec3(0.0); float wsum=0.0;
  float sa_tex = 4.0*PI/(6.0*uSize*uSize);
  for(uint i=0u;i<NS;i++){
    vec2 Xi=vec2(float(i)/float(NS), rad(i));
    vec3 H=ggx(Xi,N,a);
    vec3 L=normalize(2.0*dot(V,H)*H-V);
    float ndl=dot(N,L);
    if(ndl>0.0){
      float ndh=max(dot(N,H),0.0);
      float d=(a*a)/(PI*pow(ndh*ndh*(a*a-1.0)+1.0,2.0));
      float pdf=d*ndh/(4.0*max(dot(H,V),1e-4))+1e-4;
      float sa_s=1.0/(float(NS)*pdf);
      float lod = uRough<=0.0 ? 0.0 : 0.5*log2(sa_s/sa_tex);
      sum += textureLod(uEnv,L,clamp(lod,0.0,7.0)).rgb*ndl;
      wsum += ndl;
    }
  }
  o=vec4(sum/max(wsum,1e-4),1.0);
}`, 'env.prefilter');
  ENV.spec = newCube(ENV_SIZE, ENV_MIPS);
  for(let m=0;m<ENV_MIPS;m++){
    const size=ENV_SIZE>>m;
    bakeCubeFaces(pPre, size, ENV.spec, m, ()=>{
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, ENV.raw);
      gl.uniform1i(pPre.u.uEnv,0);
      gl.uniform1f(pPre.u.uRough, m/(ENV_MIPS-1));
      gl.uniform1f(pPre.u.uSize, ENV_SIZE);
    });
  }
  // (3) 辐照度（余弦卷积）
  const pIrr = prog(FS_VS, `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform int uFace; uniform samplerCube uEnv;
${CUBE_DIR_GLSL}
const float PI=3.14159265359;
void main(){
  vec3 N=cubeDir(uFace, vUV*2.0-1.0);
  vec3 U=abs(N.y)<0.999?vec3(0,1,0):vec3(1,0,0);
  vec3 T=normalize(cross(U,N)), B=cross(N,T);
  vec3 sum=vec3(0.0); float n=0.0;
  for(float ph=0.0; ph<6.2831; ph+=0.10){
    for(float th=0.0; th<1.5707; th+=0.045){
      float st=sin(th), ct=cos(th);
      vec3 L=T*(st*cos(ph))+B*(st*sin(ph))+N*ct;
      sum += textureLod(uEnv,L,3.0).rgb*ct*st;
      n+=1.0;
    }
  }
  o=vec4(PI*sum/n, 1.0);
}`, 'env.irradiance');
  ENV.irr = newCube(IRR_SIZE,1);
  bakeCubeFaces(pIrr, IRR_SIZE, ENV.irr, 0, ()=>{
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, ENV.raw);
    gl.uniform1i(pIrr.u.uEnv,0);
  });
  // (4) BRDF 积分查找表（split-sum）
  const pLut = prog(FS_VS, `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
const float PI=3.14159265359;
float rad(uint bits){
  bits=(bits<<16u)|(bits>>16u);
  bits=((bits&0x55555555u)<<1u)|((bits&0xAAAAAAAAu)>>1u);
  bits=((bits&0x33333333u)<<2u)|((bits&0xCCCCCCCCu)>>2u);
  bits=((bits&0x0F0F0F0Fu)<<4u)|((bits&0xF0F0F0F0u)>>4u);
  bits=((bits&0x00FF00FFu)<<8u)|((bits&0xFF00FF00u)>>8u);
  return float(bits)*2.3283064365386963e-10;
}
void main(){
  float ndv=max(vUV.x,1e-3), rough=vUV.y;
  vec3 V=vec3(sqrt(1.0-ndv*ndv),0.0,ndv);
  vec3 N=vec3(0,0,1);
  float a=rough*rough;
  float A=0.0,B=0.0;
  const uint NS=512u;
  for(uint i=0u;i<NS;i++){
    vec2 Xi=vec2(float(i)/float(NS), rad(i));
    float phi=2.0*PI*Xi.x;
    float ct=sqrt((1.0-Xi.y)/(1.0+(a*a-1.0)*Xi.y));
    float st=sqrt(1.0-ct*ct);
    vec3 H=vec3(cos(phi)*st,sin(phi)*st,ct);
    vec3 L=normalize(2.0*dot(V,H)*H-V);
    if(L.z>0.0){
      float ndl=L.z, ndh=max(H.z,0.0), vdh=max(dot(V,H),0.0);
      float k=a*a/2.0;
      float gv=ndv/(ndv*(1.0-k)+k), gvl=ndl/(ndl*(1.0-k)+k);
      float G=gv*gvl;
      float gvis=G*vdh/(ndh*ndv+1e-5);
      float fc=pow(1.0-vdh,5.0);
      A+=(1.0-fc)*gvis; B+=fc*gvis;
    }
  }
  o=vec4(A/float(NS), B/float(NS), 0.0, 1.0);
}`, 'env.brdf');
  ENV.lut = mkTex(LUT_SIZE,LUT_SIZE,gl.RGBA,gl.RGBA16F,gl.HALF_FLOAT,gl.LINEAR);
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,ENV.lut,0);
  gl.viewport(0,0,LUT_SIZE,LUT_SIZE); gl.useProgram(pLut); blit();
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fb);
}

//==============================================================
// S6 · 丝印图集 —— Canvas 2D 现画文字，转成纹理，不引外部图片
//   型号一律用自拟编号，不使用任何真实厂商标识
//==============================================================
const ATLAS_N=4, ATLAS_ROWS=2, ATLAS_CELL=1024, ATLAS_W=ATLAS_N*ATLAS_CELL, ATLAS_H=ATLAS_ROWS*ATLAS_CELL;
const ATLAS_RECT=[];
function buildAtlas(){
  const c=document.createElement('canvas'); c.width=ATLAS_W; c.height=ATLAS_H;
  const x=c.getContext('2d');
  x.clearRect(0,0,ATLAS_W,ATLAS_H);
  const cells=[
    {lines:['NX-2408','H9K4G8 D6A','2451-A'],       rot:0},
    {lines:['NX-2408','H9K4G8 D6A','2451-A'],       rot:90},
    {lines:['VRM-8P','PWM CTRL','TN-5512'],         rot:0},
    {lines:['XG-100 · GX204-400-A1'], rot:0, corner:true},
    {lines:['L4R2','082'],                          rot:0, small:true},
    {lines:['DC-DC','3A 5V','SL-330'],              rot:0},
    {lines:['CTRL','IO-88'],                        rot:0},
    {lines:['FLASH','64Mb','FM-641'],               rot:0}
  ];
  cells.forEach((cell,i)=>{
    const cx=(i%ATLAS_N)*ATLAS_CELL, cy=Math.floor(i/ATLAS_N)*ATLAS_CELL;
    x.save();
    x.translate(cx+ATLAS_CELL/2, cy+ATLAS_CELL/2);
    if(cell.rot) x.rotate(cell.rot*Math.PI/180);
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='rgba(198,198,193,0.82)';
    const n=cell.lines.length;
    // 真实芯片丝印:字高约为芯片边长的 6%,一格 512px 对应整颗芯片
    const k=ATLAS_CELL/512;
    // 真实 die 上几乎没字:角落一小行淡字
    if(cell.corner){ x.translate(ATLAS_CELL*0.12, ATLAS_CELL*0.43); x.fillStyle='rgba(198,198,193,0.5)'; }
    const base = (cell.corner?11 : cell.big?26 : cell.small?40 : 31)*k;
    const lead = base*1.42;
    cell.lines.forEach((ln,j)=>{
      const em = (j===0)?1.0:0.84;
      x.font='500 '+Math.round(base*em)+'px ui-monospace,Menlo,"SF Mono",monospace';
      x.fillText(ln, 0, (j-(n-1)/2)*lead);
    });
    // 一脚标记点(die 不画)
    if(!cell.corner){
      x.beginPath();
      x.arc(-ATLAS_CELL*0.36, -ATLAS_CELL*0.34, 8*k, 0, 6.2832);
      x.fillStyle='rgba(226,226,222,0.75)'; x.fill();
    }
    x.restore();
    const px=0.5/ATLAS_W, py=0.5/ATLAS_H;
    ATLAS_RECT.push([
      cx/ATLAS_W+px, cy/ATLAS_H+py,
      (cx+ATLAS_CELL)/ATLAS_W-px, (cy+ATLAS_CELL)/ATLAS_H-py ]);
  });
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(CAPS.aniso) gl.texParameterf(gl.TEXTURE_2D,CAPS.aniso.TEXTURE_MAX_ANISOTROPY_EXT,
    Math.min(8,MAXANISO));
  return t;
}

//==============================================================
// S7 · 着色器
//==============================================================
const NOISE_GLSL = `
float h31(vec3 p){ p=fract(p*0.3183099+vec3(0.71,0.113,0.419));
  p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i+vec3(0,0,0)),h31(i+vec3(1,0,0)),f.x),
                 mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),
                 mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ return 0.6*vnoise(p)+0.3*vnoise(p*2.03)+0.1*vnoise(p*4.11); }`;

const GB_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 iPos;
layout(location=3) in vec3 iScl;
layout(location=4) in vec3 iCol;
layout(location=5) in vec4 iMat;
layout(location=6) in vec4 iAtl;
layout(location=7) in vec4 iExt;
uniform mat4 uVP; uniform vec3 uHalf; uniform float uLift, uCutX;
out vec3 vN; out vec3 vCol; out vec3 vW; out vec3 vLocal;
out vec4 vAtl; out vec3 vMat; out vec4 vExt;
void main(){
  float c=cos(iMat.x), s=sin(iMat.x);
  vec3 sp=aPos*iScl;
  vec3 rp=vec3(sp.x*c+sp.z*s, sp.y, -sp.x*s+sp.z*c);
  vec3 nn=normalize(aNrm/max(iScl,vec3(1e-4)));
  vec3 n=vec3(nn.x*c+nn.z*s, nn.y, -nn.x*s+nn.z*c);
  vec3 w=iPos+rp;
  if(iExt.x>0.5 && iExt.x<1.5) w.y+=uLift;          // 散热组件整体抬起
  if(iExt.y>1.5) w.x=uCutX-0.03+aPos.x*iScl.x;       // 断面盖板贴着剖切面
  vW=w; vN=n; vCol=iCol; vLocal=aPos/max(uHalf,vec3(1e-5));
  vAtl=iAtl; vMat=iMat.yzw; vExt=iExt;
  gl_Position=uVP*vec4(w,1.0);
}`;

const GB_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vCol; in vec3 vW; in vec3 vLocal;
in vec4 vAtl; in vec3 vMat; in vec4 vExt;
layout(location=0) out vec4 oAlb;
layout(location=1) out vec4 oNrm;
uniform sampler2D uAtlas;
uniform float uMicro, uLift, uCutX;
${NOISE_GLSL}
void silk(inout vec3 alb, inout float ro, vec2 lxz, vec4 atl){
  vec2 uv=clamp(lxz*0.5+0.5, 0.0, 1.0);
  vec2 auv=mix(atl.xy, atl.zw, uv);
  vec4 t=texture(uAtlas, auv);
  // 放大时把覆盖率当距离场做阈值重建:边缘随屏幕像素自适应,不再是双线性糊
  float w=max(fwidth(t.a)*0.75, 0.012);
  float a=smoothstep(0.5-w, 0.5+w, t.a);
  alb=mix(alb, vec3(0.78,0.78,0.76), a*0.92);
  ro =mix(ro, 0.70, a*0.6);
}
void main(){
  // 隐藏已抬走的散热组件;剖切封装组
  if(vExt.x>0.5 && vExt.x<1.5 && uLift>150.0) discard;
  if(vExt.x>1.5 && vExt.x<2.5 && vExt.y>0.5 && vExt.y<1.5 && vW.x>uCutX) discard;
  if(vExt.y>1.5 && uCutX>50.0) discard;              // 没剖切时盖板不存在
  vec3 N=normalize(vN);
  bool front=gl_FrontFacing;
  if(!front) N=-N;                          // 剖开后看到的是内壁,法线翻过来
  vec3 alb=vCol;
  float me=vMat.x, ro=vMat.y, txw=vMat.z;
  bool top = N.y>0.65;
  bool cutFace = (vExt.x>1.5 && vExt.x<2.5) && (!front || vExt.y>1.5);

  if(cutFace){
    // ============ 剖面着色 ============
    float kind=vExt.w;
    float ty=vLocal.y*0.5+0.5;
    if(kind<1.5){            // 封装基板:8 层介质 / 铜交替
      float ly=fract(ty*8.0);
      float cu=smoothstep(0.62,0.66,ly)*(1.0-smoothstep(0.86,0.90,ly));
      alb=mix(vec3(0.030,0.052,0.038), vec3(0.62,0.36,0.22), cu); me=cu; ro=mix(0.55,0.35,cu);
    } else if(kind<2.5){     // 硅:深灰,顶部一层薄金属互连
      float metal=smoothstep(0.80,0.84,ty)*(1.0-smoothstep(0.93,0.97,ty));
      alb=mix(vec3(0.085,0.090,0.100), vec3(0.55,0.50,0.40), metal); me=metal; ro=mix(0.45,0.30,metal);
    } else {                 // 锡 / 金属实心
      alb=vec3(0.45,0.46,0.48); me=1.0; ro=0.42;
    }
    txw=0.0;
  }
  else if(top && txw>1.5 && txw<2.5){
    // ============ PCB 板面:铜走线 + 阻焊 + 白丝印框 ============
    vec2 pw=vW.xz;
    float tr=0.0;
    // 真实 PCB 走线以正交为主、少量 45 度,而且是断续的短段
    for(int k=0;k<4;k++){
      float a = (k<2) ? float(k)*1.5708 : (float(k)-1.5)*1.5708+0.7854;
      float ca=cos(a), sa=sin(a);
      float sc = 2.3 + float(k)*0.83;
      vec2 q=vec2(pw.x*ca-pw.y*sa, pw.x*sa+pw.y*ca)*sc;
      float ln=abs(fract(q.y+0.5)-0.5);
      // 沿线方向切成短段,段与段之间断开
      float seg=step(0.52, h31(vec3(floor(q.x*0.55), floor(q.y), float(k)*7.1)));
      float w = (k<2)?0.036:0.028;
      tr=max(tr, seg*(1.0-smoothstep(w, w*1.9, ln)));
    }
    // 阻焊盖在铜上:略提亮、略更光
    alb=mix(alb, alb*2.05+vec3(0.0040,0.0058,0.0042), tr*0.80);
    ro =mix(ro, ro*0.88, tr*0.70);
    // 白色丝印框线(元件位号框)
    vec2 g=pw*0.40;
    vec2 fg=abs(fract(g)-0.5);
    float mx=max(fg.x,fg.y);
    float frame=(1.0-smoothstep(0.418,0.440,mx))*step(0.392,mx);
    float cellOn=step(0.86, h31(vec3(floor(g),11.0)));
    float sk=cellOn*frame;
    alb=mix(alb, vec3(0.115,0.115,0.109), sk*0.85);
    ro =mix(ro, 0.80, sk*0.65);
    // 阻焊哑光颗粒
    ro=clamp(ro+(fbm(vW*88.0)-0.5)*0.18, 0.22, 1.0);
  }
  else if(top && txw>4.5){
    // ============ 城的硅基底:细密单元格 ============
    vec2 g=vW.xz*0.35; vec2 f=abs(fract(g)-0.5);
    float ln=1.0-smoothstep(0.44,0.49,max(f.x,f.y));
    alb*=(0.82+0.40*ln);
    vec2 g2=vW.xz*2.4; float fine=step(0.5,h31(vec3(floor(g2),5.0)));
    alb*=(0.92+0.14*fine);
    ro=clamp(ro+(fbm(vW*12.0)-0.5)*0.12,0.2,1.0);
  }
  else if(top && txw>2.5){
    // ============ 硅 die:SM 阵列版图 ============
    vec2 u=clamp(vLocal.xz*0.5+0.5, 0.0, 1.0);
    vec3 base=alb;
    // 区域:左右边缘 = 显存控制器;底边 = 显示引擎(左) / PCIe(右);中带 = L2;其余 = SM 阵列
    bool edgeX=(u.x<0.085 || u.x>0.915);
    bool ioBand=(u.y>0.915) && u.x>0.30 && !edgeX;
    bool memCtl=edgeX || (u.y<0.085) || (u.y>0.915 && u.x<=0.30);
    bool l2=abs(u.y-0.5)<0.055 && !edgeX;
    if(memCtl){
      float s=step(0.5, fract(u.y*60.0));
      alb=base*(0.85+0.55*s); ro=mix(ro,0.30,0.5);
    } else if(ioBand){
      if(u.x<0.62){
        vec2 g=u*vec2(10.0,40.0); vec2 f=abs(fract(g)-0.5);
        float gap=1.0-smoothstep(0.40,0.47,max(f.x,f.y));
        alb=mix(base*0.5, base*1.35, gap);
      } else {
        float s=step(0.5, fract(u.x*80.0));
        alb=base*(0.9+0.5*s);
      }
    } else if(l2){
      vec2 g=u*vec2(64.0,8.0); vec2 f=abs(fract(g)-0.5);
      float gap=1.0-smoothstep(0.38,0.47,max(f.x,f.y));
      alb=mix(base*1.1, base*1.9, gap);
    } else {
      vec2 g=u*8.0;
      vec2 f=abs(fract(g)-0.5);
      float gap=1.0-smoothstep(0.415,0.474,max(f.x,f.y));
      float blk=h31(vec3(floor(g),3.0));
      alb=base*(0.74+0.52*blk);
      alb=mix(alb*0.48, alb, gap);
      ro =mix(ro*1.85, ro, gap);
      vec2 g2=u*46.0;
      float fine=step(0.55, h31(vec3(floor(g2),9.0)));
      alb*=(0.93+0.14*fine);
    }
    silk(alb, ro, vLocal.xz, vAtl);
  }
  else if(top && txw>0.5){
    silk(alb, ro, vLocal.xz, vAtl);
  }

  // —— 微观表面：粗糙度扰动 + 极轻微法线扰动 ——
  //    现实里没有绝对均匀的表面，这一层是"不假"的关键
  if(uMicro>0.5){
    float f=fbm(vW*46.0);
    ro=clamp(ro + (f-0.5)*0.20, 0.035, 1.0);
    float e=0.010;
    float d0=fbm(vW*150.0);
    vec3 g=vec3(fbm(vW*150.0+vec3(e,0,0))-d0,
                fbm(vW*150.0+vec3(0,e,0))-d0,
                fbm(vW*150.0+vec3(0,0,e))-d0)/e;
    g-=N*dot(g,N);
    N=normalize(N - g*0.00055);
    // 极细的各向异性拉丝（金属件）
    if(me>0.5){
      float b=fbm(vW*vec3(9.0,320.0,320.0));
      ro=clamp(ro+(b-0.5)*0.11, 0.03, 1.0);
    }
  }
  oAlb=vec4(alb, me);
  oNrm=vec4(N, ro);
}`;

const SHADOW_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=2) in vec3 iPos;
layout(location=3) in vec3 iScl;
layout(location=5) in vec4 iMat;
layout(location=7) in vec4 iExt;
uniform mat4 uLVP; uniform float uLift, uCutX;
out vec3 vSh;   // (组, 剖切标记, 世界 x)
void main(){
  float c=cos(iMat.x), s=sin(iMat.x);
  vec3 sp=aPos*iScl;
  vec3 rp=vec3(sp.x*c+sp.z*s, sp.y, -sp.x*s+sp.z*c);
  vec3 w=iPos+rp;
  if(iExt.x>0.5 && iExt.x<1.5) w.y+=uLift;
  if(iExt.y>1.5) w.x=uCutX-0.03+aPos.x*iScl.x;
  vSh=vec3(iExt.x, iExt.y, w.x);
  gl_Position=uLVP*vec4(w,1.0);
}`;
const SHADOW_FS = `#version 300 es
precision highp float;
in vec3 vSh; uniform float uLift, uCutX;
void main(){
  if(vSh.x>0.5 && vSh.x<1.5 && uLift>150.0) discard;
  if(vSh.x>1.5 && vSh.x<2.5 && vSh.y>0.5 && vSh.y<1.5 && vSh.z>uCutX) discard;
  if(vSh.y>1.5 && uCutX>50.0) discard;
}`;

// —— SSAO ——
const SSAO_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uNrm, uDep;
uniform mat4 uVP, uInvVP;
uniform vec3 uCam;
uniform vec2 uRes;
uniform float uRadius, uRot, uIntensity;
vec3 wpos(vec2 uv, float d){
  vec4 c=vec4(uv*2.0-1.0, d*2.0-1.0, 1.0);
  vec4 w=uInvVP*c; return w.xyz/w.w;
}
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  float d=texture(uDep,vUV).r;
  if(d>=1.0){ o=vec4(1.0); return; }
  vec3 P=wpos(vUV,d);
  vec3 N=normalize(texture(uNrm,vUV).xyz);
  float ang=h21(vUV*uRes)*6.2831853+uRot;
  float ca=cos(ang), sa=sin(ang);
  vec3 U=abs(N.y)<0.95?vec3(0,1,0):vec3(1,0,0);
  vec3 T=normalize(cross(U,N)), B=cross(N,T);
  vec3 T2=T*ca+B*sa, B2=-T*sa+B*ca;
  const int NS=14;
  float occ=0.0;
  for(int i=0;i<NS;i++){
    float fi=(float(i)+0.5)/float(NS);
    float r=uRadius*pow(fi,0.72);
    float a2=fi*13.7+ang;
    float z=0.18+0.82*h21(vUV*uRes+vec2(float(i),3.1+uRot));
    float rx=sqrt(max(1.0-z*z,0.0));
    vec3 dir=T2*(rx*cos(a2))+B2*(rx*sin(a2))+N*z;
    vec3 S=P+dir*r+N*uRadius*0.02;
    vec4 cp=uVP*vec4(S,1.0);
    if(cp.w<=0.0) continue;
    vec2 su=(cp.xy/cp.w)*0.5+0.5;
    if(su.x<0.0||su.x>1.0||su.y<0.0||su.y>1.0) continue;
    float sd=texture(uDep,su).r;
    if(sd>=1.0) continue;
    vec3 R=wpos(su,sd);
    float dS=distance(uCam,S), dR=distance(uCam,R);
    if(dR < dS-0.0015){
      float rng=smoothstep(0.0,1.0, uRadius/max(abs(dS-dR),1e-4));
      occ += rng;
    }
  }
  float ao=1.0-uIntensity*occ/float(NS);
  o=vec4(clamp(ao,0.0,1.0));
}`;

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc, uDep;
uniform vec2 uDir;
void main(){
  float c=texture(uDep,vUV).r;
  float sum=texture(uSrc,vUV).r, w=1.0;
  for(int i=1;i<=3;i++){
    vec2 off=uDir*float(i);
    for(int s=-1;s<=1;s+=2){
      vec2 uv=vUV+off*float(s);
      float dd=texture(uDep,uv).r;
      float ww=exp(-abs(dd-c)*900.0)*(1.0-float(i)*0.22);
      sum+=texture(uSrc,uv).r*ww; w+=ww;
    }
  }
  o=vec4(sum/w);
}`;

// —— 光照合成（IBL 为主，阴影作为方向性遮挡）——
const LIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uAlb, uNrm, uDep, uAO, uLut;
uniform samplerCube uIrr, uSpec, uRaw;
uniform mat4 uInvVP, uLVP;
uniform highp sampler2DShadow uShadow;
uniform vec3 uCam, uLightDir;
uniform float uKeyFrac, uEnvInt, uMips;
const float PI=3.14159265359;
vec3 wpos(vec2 uv,float d){ vec4 c=vec4(uv*2.0-1.0,d*2.0-1.0,1.0);
  vec4 w=uInvVP*c; return w.xyz/w.w; }
float shadowAt(vec3 P, float ndl){
  vec4 sc=uLVP*vec4(P,1.0);
  vec3 s=sc.xyz/sc.w*0.5+0.5;
  if(s.x<0.002||s.x>0.998||s.y<0.002||s.y>0.998||s.z>1.0) return 1.0;
  float bias=clamp(0.0016*(1.0-ndl)+0.00035, 0.0, 0.0035);
  float acc=0.0;
  for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++)
    acc+=texture(uShadow, vec3(s.xy+vec2(float(i),float(j))*(0.55/2048.0), s.z-bias));
  return acc/9.0;
}
void main(){
  float d=texture(uDep,vUV).r;
  vec3 P=wpos(vUV,d);
  vec3 V=normalize(uCam-P);
  if(d>=1.0){
    // 背景只给无缝背景纸的渐变；柔光箱本体不入画(但反射里仍有,那才是对的)
    vec3 bd=-V;
    float up=clamp(bd.y*0.5+0.5, 0.0, 1.0);
    vec3 bg=mix(vec3(0.0125,0.0130,0.0150), vec3(0.105,0.109,0.120), pow(up,1.55));
    bg=mix(bg, vec3(0.0095,0.0090,0.0086), smoothstep(0.04,-0.34,bd.y));
    // 一点侧向的光晕,免得背景死板
    bg*=1.0+0.55*pow(max(dot(normalize(bd),normalize(vec3(-0.34,0.60,0.33))),0.0),3.0);
    o=vec4(bg*uEnvInt, 1.0); return;
  }
  vec4 A=texture(uAlb,vUV);
  vec4 Nr=texture(uNrm,vUV);
  vec3 alb=A.rgb; float me=A.a;
  vec3 N=normalize(Nr.xyz); float ro=clamp(Nr.a,0.030,1.0);
  float ao=texture(uAO,vUV).r;

  float ndv=max(dot(N,V),1e-4);
  float ndl=max(dot(N,uLightDir),0.0);
  float sh=shadowAt(P,ndl);
  // 朝背光面本来就照不到，不该再叠阴影
  float lit=mix(1.0, sh, smoothstep(0.0,0.22,ndl));
  float keyOcc = 1.0 - uKeyFrac*(1.0-lit);

  vec3 F0=mix(vec3(0.04), alb, me);
  vec3 F=F0+(max(vec3(1.0-ro),F0)-F0)*pow(1.0-ndv,5.0);
  vec3 kd=(1.0-F)*(1.0-me);

  vec3 irr=texture(uIrr,N).rgb*uEnvInt;
  vec3 diff=kd*alb*irr*ao*keyOcc;

  vec3 R=reflect(-V,N);
  vec3 pre=textureLod(uSpec,R,ro*(uMips-1.0)).rgb*uEnvInt;
  vec2 ab=texture(uLut, vec2(ndv,ro)).rg;
  // 镜面遮蔽：粗糙面受 AO 影响大，镜面反射受影响小
  float sao=clamp(pow(ao, 1.0+ro*2.2), 0.0, 1.0);
  float skey=mix(1.0, keyOcc, 0.55+0.45*ro);
  vec3 spec=pre*(F0*ab.x+ab.y)*sao*skey;

  o=vec4(diff+spec, 1.0);
}`;

// —— 累积 / 泛光 / 合成 ——
const COPY_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc;
void main(){ o=texture(uSrc,vUV); }`;

const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc; uniform float uThr;
void main(){
  vec3 c=texture(uSrc,vUV).rgb;
  float l=dot(c,vec3(0.2126,0.7152,0.0722));
  o=vec4(c*smoothstep(uThr,uThr*2.2,l),1.0);
}`;

const GAUSS_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc; uniform vec2 uDir;
void main(){
  vec3 s=texture(uSrc,vUV).rgb*0.227027;
  s+=texture(uSrc,vUV+uDir*1.3846).rgb*0.316216;
  s+=texture(uSrc,vUV-uDir*1.3846).rgb*0.316216;
  s+=texture(uSrc,vUV+uDir*3.2308).rgb*0.070270;
  s+=texture(uSrc,vUV-uDir*3.2308).rgb*0.070270;
  o=vec4(s,1.0);
}`;

const POST_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc, uBloom;
uniform float uExposure, uBloomStr, uGrain, uVig, uCA, uSharp;
uniform vec2 uPx;
// ACES filmic 近似
vec3 aces(vec3 x){
  const mat3 mi=mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);
  const mat3 mo=mat3( 1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);
  vec3 v=mi*x;
  vec3 a=v*(v+0.0245786)-0.000090537;
  vec3 b=v*(0.983729*v+0.4329510)+0.238081;
  return clamp(mo*(a/b), 0.0, 1.0);
}
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
// 取一个像素的显示值:色散 + 泛光 + 曝光 + ACES
vec3 grade(vec2 uv){
  vec2 d=uv-0.5;
  float r2=dot(d,d);
  vec3 c;
  if(uCA>0.0){
    float k=uCA*r2;
    c.r=texture(uSrc, uv - d*k).r;
    c.g=texture(uSrc, uv).g;
    c.b=texture(uSrc, uv + d*k).b;
  } else c=texture(uSrc,uv).rgb;
  c += texture(uBloom,uv).rgb*uBloomStr;
  return aces(c*uExposure);
}
void main(){
  vec2 uv=vUV;
  vec2 d=uv-0.5;
  float r2=dot(d,d);
  vec3 c=grade(uv);
  // 轻微反锐化掩模(在色调映射之后做,不会在高光边缘拉出光晕)
  if(uSharp>0.0){
    vec3 n=grade(uv+vec2(uPx.x,0.0))+grade(uv-vec2(uPx.x,0.0))
          +grade(uv+vec2(0.0,uPx.y))+grade(uv-vec2(0.0,uPx.y));
    c=clamp(c+(c-n*0.25)*uSharp, 0.0, 1.0);
  }
  // 暗角
  c *= 1.0 - uVig*smoothstep(0.12, 0.82, r2);
  // 胶片颗粒（固定空间种子，静止时不闪）
  float g=(h21(gl_FragCoord.xy)-0.5)*uGrain;
  c += g*(0.35+0.65*(1.0-dot(c,vec3(0.333))));
  // 线性 → sRGB
  c = pow(max(c,vec3(0.0)), vec3(1.0/2.2));
  o=vec4(c,1.0);
}`;

//==============================================================
// S8 · 材质库 —— 数值按参考帧目测调，不是实测光谱数据
//==============================================================
const MAT = {
  pcbBlack : {c:[0.0125,0.0143,0.0132], me:0.0,  ro:0.62},
  pcbGreen : {c:[0.0105,0.0250,0.0145], me:0.0,  ro:0.58},
  epoxy    : {c:[0.0175,0.0180,0.0195], me:0.0,  ro:0.655},
  epoxyGrey: {c:[0.0430,0.0440,0.0465], me:0.0,  ro:0.680},
  goldENIG : {c:[0.6300,0.4750,0.1950], me:1.0,  ro:0.330},
  solder   : {c:[0.4700,0.4750,0.4900], me:1.0,  ro:0.455},
  nickelIHS: {c:[0.5200,0.5300,0.5450], me:1.0,  ro:0.275},
  copper   : {c:[0.6600,0.3950,0.2650], me:1.0,  ro:0.360},
  silicon  : {c:[0.0620,0.0680,0.0790], me:0.0,  ro:0.235},
  tantalum : {c:[0.3200,0.2300,0.0350], me:0.0,  ro:0.440},
  mlcc     : {c:[0.1650,0.1450,0.1230], me:0.0,  ro:0.640},
  ferrite  : {c:[0.0210,0.0215,0.0228], me:0.0,  ro:0.700},
  substrate: {c:[0.0300,0.0390,0.0335], me:0.0,  ro:0.580},
  alu      : {c:[0.4500,0.4580,0.4700], me:1.0,  ro:0.380},
  plasticDark:{c:[0.0160,0.0160,0.0175], me:0.0, ro:0.500},
  connDark : {c:[0.1200,0.1200,0.1250], me:1.0,  ro:0.480},
  // SM 放大模型用的"示意材质":仍是哑光实体,不发光
  smSched  : {c:[0.0700,0.0750,0.0850], me:0.0,  ro:0.400},
  smReg    : {c:[0.0350,0.0400,0.0480], me:0.0,  ro:0.420},
  smLane   : {c:[0.2500,0.2700,0.3000], me:0.0,  ro:0.320},
  smTensor : {c:[0.3000,0.2200,0.0900], me:0.0,  ro:0.350},
  smLdst   : {c:[0.1200,0.1400,0.1600], me:0.0,  ro:0.400},
  smL1     : {c:[0.0450,0.0600,0.0750], me:0.0,  ro:0.380},
  // 显示器 / LCD 剖面
  rubber   : {c:[0.0200,0.0200,0.0210], me:0.0,  ro:0.720},
  bezel    : {c:[0.0180,0.0180,0.0195], me:0.0,  ro:0.420},
  glassDark: {c:[0.0120,0.0125,0.0140], me:0.0,  ro:0.060},
  white    : {c:[0.8200,0.8200,0.8000], me:0.0,  ro:0.500},
  polar    : {c:[0.0900,0.0900,0.0950], me:0.0,  ro:0.520},
  glassClr : {c:[0.5500,0.5700,0.6000], me:0.0,  ro:0.080},
  ito      : {c:[0.6200,0.5000,0.2400], me:1.0,  ro:0.300},
  lcRod    : {c:[0.6800,0.7000,0.7200], me:0.0,  ro:0.250},
  filtR    : {c:[0.6500,0.0400,0.0400], me:0.0,  ro:0.180},
  filtG    : {c:[0.0400,0.5200,0.0900], me:0.0,  ro:0.180},
  filtB    : {c:[0.0400,0.0900,0.7000], me:0.0,  ro:0.180},
  // die 内部"城"
  siliconCity:{c:[0.0550,0.0600,0.0700], me:0.0, ro:0.300},
  blockSM  : {c:[0.1050,0.1250,0.1650], me:0.0,  ro:0.450},
  blockL2  : {c:[0.2800,0.3000,0.3400], me:0.0,  ro:0.400},
  blockMC  : {c:[0.2200,0.1600,0.1000], me:0.0,  ro:0.450},
  blockIO  : {c:[0.0900,0.1000,0.1100], me:0.0,  ro:0.420},
  blockDisp: {c:[0.0800,0.1400,0.1100], me:0.0,  ro:0.420},
  blockROP : {c:[0.1700,0.1200,0.1700], me:0.0,  ro:0.420},
  copperRail:{c:[0.7000,0.4200,0.2800], me:1.0,  ro:0.300}
};
const rnd = (()=>{ let s=20260906; return ()=>{ s=(s*1664525+1013904223)&0x7fffffff;
  return s/0x7fffffff; }; })();
const jit=(v)=>1+(rnd()-0.5)*v;


//==============================================================
// S11 · 帧缓冲
//==============================================================
let W=1,H=1,DPR=1;
let gbuf=null, aoA=null, aoB=null, lit=null, accum=null, frame=null, flow=null,
    bright=null, blurA=null, blurB=null, shadow=null;
function mkGBuffer(w,h){
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  const alb=mkTex(w,h,gl.RGBA,gl.RGBA8,gl.UNSIGNED_BYTE,gl.NEAREST);
  const nrm=mkTex(w,h,gl.RGBA,gl.RGBA16F,gl.HALF_FLOAT,gl.NEAREST);
  const dep=mkTex(w,h,gl.DEPTH_COMPONENT,gl.DEPTH_COMPONENT24,gl.UNSIGNED_INT,gl.NEAREST);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,alb,0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,nrm,0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,dep,0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(st!==gl.FRAMEBUFFER_COMPLETE) fatal('G-buffer 创建失败 (0x'+st.toString(16)+')');
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {fb, alb, nrm, dep, tex:[alb,nrm,dep], w, h};
}
const SHADOW_RES=2048;
function mkShadow(){
  const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,SHADOW_RES,SHADOW_RES,0,
    gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,t,0);
  gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {fb, t};
}
function resize(){
  const scale = QUAL.renderScale;
  DPR = Math.min(window.devicePixelRatio||1, 2) * scale;
  const w = Math.max(2, Math.round(cv.clientWidth*DPR));
  const h = Math.max(2, Math.round(cv.clientHeight*DPR));
  if(w===W && h===H) return;
  W=w; H=h; cv.width=W; cv.height=H;
  [gbuf,aoA,aoB,lit,accum,frame,flow,bright,blurA,blurB].forEach(f=>{
    if(!f) return;
    if(f.alb){ gl.deleteFramebuffer(f.fb); f.tex.forEach(t=>gl.deleteTexture(t)); }
    else delFBO(f);
  });
  gbuf = mkGBuffer(W,H);
  const R8 ={fmt:gl.RED, ifmt:gl.R8,     type:gl.UNSIGNED_BYTE, filter:gl.LINEAR};
  const F16={fmt:gl.RGBA,ifmt:gl.RGBA16F,type:gl.HALF_FLOAT,    filter:gl.LINEAR};
  const F32={fmt:gl.RGBA,ifmt:gl.RGBA32F,type:gl.FLOAT,         filter:gl.NEAREST};
  aoA  = mkFBO(W,H,[R8]);
  aoB  = mkFBO(W,H,[R8]);
  lit  = mkFBO(W,H,[F16]);
  accum= mkFBO(W,H,[F32]);
  frame= mkFBO(W,H,[F16]);
  flow = mkFlowFBO(W,H);
  bright=mkFBO(W>>1,H>>1,[F16]);
  blurA =mkFBO(W>>2,H>>2,[F16]);
  blurB =mkFBO(W>>2,H>>2,[F16]);
  reset();
}

//==============================================================
// S12 · 渲染
//==============================================================
const QUAL = { renderScale:1.0, maxSPP:200, micro:1, bloom:0.022, sharp:0.22,
               grain:0.0055, vig:0.22, ca:0.0006, aoInt:0.92, aoRad:0.85 };
const LIGHT_AXIS = V3.norm([-0.34, 0.88, 0.33]);
const LIGHT_HU = 0.46, LIGHT_HV = 0.30;   // 与 STUDIO_GLSL 里的主光尺寸一致
const ENV_INT = 1.0, KEY_FRAC = 0.80;

let PR={};
let spp=0, dirty=true, lastMs=0, totalTris=0;
function reset(){ spp=0; dirty=true; }

function lightVP(i){
  // 在柔光箱面积内抖动光源方向 —— 累积后自然收敛成真实半影
  let dir=LIGHT_AXIS;
  if(i>0){
    const t=V3.norm(V3.cross([0,0,1], LIGHT_AXIS));
    const b=V3.cross(LIGHT_AXIS,t);
    const u=(halton(i,2)*2-1)*LIGHT_HU, v=(halton(i,3)*2-1)*LIGHT_HV;
    dir=V3.norm([LIGHT_AXIS[0]+t[0]*u+b[0]*v,
                 LIGHT_AXIS[1]+t[1]*u+b[1]*v,
                 LIGHT_AXIS[2]+t[2]*u+b[2]*v]);
  }
  const R=Math.min(Math.max(cam.dist*0.85, 14), 115);
  const c=cam.tgt;
  const eye=[c[0]+dir[0]*260, c[1]+dir[1]*260, c[2]+dir[2]*260];
  const V=M4.look(eye,c,[0,1,0]);
  const P=M4.ortho(-R,R,-R,R, 40, 520);
  return {vp:M4.mul(P,V), dir};
}
function camMats(i){
  const eye=camEye();
  const V=M4.look(eye,cam.tgt,[0,1,0]);      // 中心相机(不抖)
  let Vj=V, e=eye;
  if(i>0 && cam.ap>0){
    // 薄透镜 = 镜头在光圈盘上平移 + 一个剪切,让焦平面上的点投到同一像素
    // (Haeberli & Akeley 1990 累积缓冲景深;焦平面允许任意朝向 → 顺带得到移轴)
    const r=Math.sqrt(halton(i,5)), th=halton(i,7)*Math.PI*2;
    const dx=Math.cos(th)*r*cam.ap, dy=Math.sin(th)*r*cam.ap;
    // 相机右/上轴(世界系) = 视图矩阵旋转部分的前两行
    e=[eye[0]+V[0]*dx+V[1]*dy, eye[1]+V[4]*dx+V[5]*dy, eye[2]+V[8]*dx+V[9]*dy];
    // 焦平面(相机系): n·c = d
    let n, d;
    if(cam.focus==='plane'){
      // 世界里 y = fy 的水平面 → 相机系法线是旋转矩阵第二列
      n=[V[4],V[5],V[6]];
      const c0=[V[4]*cam.fy+V[12], V[5]*cam.fy+V[13], V[6]*cam.fy+V[14]];
      d=n[0]*c0[0]+n[1]*c0[1]+n[2]*c0[2];
    } else {
      n=[0,0,-1]; d=cam.dist;                 // 垂直视线,距离 = 到目标点
    }
    const k=1/(d-(n[0]*dx+n[1]*dy));
    // T: 相机系里平移 -Δ;N: 剪切 c' + Δ·(n·c')·k
    const T=M4.ident(); T[12]=-dx; T[13]=-dy;
    const N=M4.ident();
    N[0]+=dx*n[0]*k; N[4]+=dx*n[1]*k; N[8]+=dx*n[2]*k;
    N[1]+=dy*n[0]*k; N[5]+=dy*n[1]*k; N[9]+=dy*n[2]*k;
    Vj=M4.mul(N, M4.mul(T, V));
  }
  const P=M4.persp(cam.fov*Math.PI/180, W/H, Math.max(cam.dist*0.02,0.05), cam.dist*14+400);
  if(i>0){
    // 亚像素抖动用高斯(σ≈0.32px)而不是均匀 ±0.5px:
    // 均匀抖动累积后等价于 1 像素盒式模糊,画面必软;窄高斯抗锯齿同时保锐
    const u1=Math.max(halton(i,11),1e-6), u2=halton(i,13);
    const r=Math.sqrt(-2*Math.log(u1))*0.32, th=2*Math.PI*u2;
    const jx=Math.max(-1,Math.min(1,r*Math.cos(th)));
    const jy=Math.max(-1,Math.min(1,r*Math.sin(th)));
    P[8]+= jx*2/W;
    P[9]+= jy*2/H;
  }
  return {vp:M4.mul(P,Vj), eye:e};
}
function drawScene(program, isShadow){
  for(const m of SCENE){
    if(!m.count) continue;
    gl.bindVertexArray(m.vao);
    if(!isShadow) gl.uniform3fv(program.u.uHalf, m.half);
    gl.drawElementsInstanced(gl.TRIANGLES, m.n, m.type, 0, m.count);
  }
  gl.bindVertexArray(null);
}
function renderSample(i){
  const {vp:LVP, dir:LDIR}=lightVP(i);
  const {vp:VP, eye}=camMats(i);
  const invVP=M4.inv(VP);
  lastVP=VP; lastEye=eye;

  // 1) 阴影深度
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.fb);
  gl.viewport(0,0,SHADOW_RES,SHADOW_RES);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
  gl.useProgram(PR.shadow);
  gl.uniformMatrix4fv(PR.shadow.u.uLVP,false,LVP);
  gl.uniform1f(PR.shadow.u.uLift,STATE.lift); gl.uniform1f(PR.shadow.u.uCutX,STATE.cutX);
  drawScene(PR.shadow,true);
  gl.disable(gl.CULL_FACE);        // G-buffer 不剔除背面:剖开后要看见内壁  CHK('pass.shadow');

  // 2) G-buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, gbuf.fb);
  gl.viewport(0,0,W,H);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(PR.gb);
  gl.uniformMatrix4fv(PR.gb.u.uVP,false,VP);
  gl.uniform1f(PR.gb.u.uMicro, QUAL.micro);
  gl.uniform1f(PR.gb.u.uLift,STATE.lift); gl.uniform1f(PR.gb.u.uCutX,STATE.cutX);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ATLAS_TEX);
  gl.uniform1i(PR.gb.u.uAtlas,0);
  drawScene(PR.gb,false);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);  CHK('pass.gbuffer');

  // 3) SSAO + 双边模糊
  gl.bindFramebuffer(gl.FRAMEBUFFER, aoA.fb); gl.viewport(0,0,W,H);
  gl.useProgram(PR.ssao);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,gbuf.nrm);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,gbuf.dep);
  gl.uniform1i(PR.ssao.u.uNrm,0); gl.uniform1i(PR.ssao.u.uDep,1);
  gl.uniformMatrix4fv(PR.ssao.u.uVP,false,VP);
  gl.uniformMatrix4fv(PR.ssao.u.uInvVP,false,invVP);
  gl.uniform3fv(PR.ssao.u.uCam,eye);
  gl.uniform2f(PR.ssao.u.uRes,W,H);
  gl.uniform1f(PR.ssao.u.uRadius,QUAL.aoRad);
  gl.uniform1f(PR.ssao.u.uIntensity,QUAL.aoInt);
  gl.uniform1f(PR.ssao.u.uRot, i*2.39996);
  blit();
  // 累积够几帧后噪声自己收敛,不再模糊 → 接触阴影边缘保持锐利
  for(const [src,dst,dx,dy] of (i<6 ? [[aoA,aoB,1,0],[aoB,aoA,0,1]] : [])){
    gl.bindFramebuffer(gl.FRAMEBUFFER,dst.fb);
    gl.useProgram(PR.blur);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,src.t);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,gbuf.dep);
    gl.uniform1i(PR.blur.u.uSrc,0); gl.uniform1i(PR.blur.u.uDep,1);
    gl.uniform2f(PR.blur.u.uDir, dx/W, dy/H);
    blit();
  }
  CHK('pass.ssao');

  // 4) 光照
  gl.bindFramebuffer(gl.FRAMEBUFFER, lit.fb); gl.viewport(0,0,W,H);
  gl.useProgram(PR.light);
  const bind=(unit,tex,name,cube)=>{ gl.activeTexture(gl.TEXTURE0+unit);
    gl.bindTexture(cube?gl.TEXTURE_CUBE_MAP:gl.TEXTURE_2D,tex);
    gl.uniform1i(PR.light.u[name],unit); };
  bind(0,gbuf.alb,'uAlb'); bind(1,gbuf.nrm,'uNrm'); bind(2,gbuf.dep,'uDep');
  bind(3,aoA.t,'uAO');     bind(4,ENV.lut,'uLut');
  bind(5,ENV.irr,'uIrr',1);bind(6,ENV.spec,'uSpec',1); bind(7,ENV.raw,'uRaw',1);
  bind(8,shadow.t,'uShadow');
  gl.uniformMatrix4fv(PR.light.u.uInvVP,false,invVP);
  gl.uniformMatrix4fv(PR.light.u.uLVP,false,LVP);
  gl.uniform3fv(PR.light.u.uCam,eye);
  gl.uniform3fv(PR.light.u.uLightDir,LDIR);
  gl.uniform1f(PR.light.u.uKeyFrac,KEY_FRAC);
  gl.uniform1f(PR.light.u.uEnvInt,ENV_INT);
  gl.uniform1f(PR.light.u.uMips,ENV_MIPS);
  blit(); CHK('pass.light');

  // 5) 累积平均
  gl.bindFramebuffer(gl.FRAMEBUFFER, accum.fb);
  gl.useProgram(PR.copy);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,lit.t);
  gl.uniform1i(PR.copy.u.uSrc,0);
  if(i===0){ gl.disable(gl.BLEND); }
  else {
    gl.enable(gl.BLEND);
    gl.blendColor(0,0,0, 1/(i+1));
    gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
  }
  blit();
  gl.disable(gl.BLEND);
  CHK('pass.accum');
}
function composite(){
  // 写实底层 + 数据流叠加层
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame.fb); gl.viewport(0,0,W,H);
  gl.useProgram(PR.combine);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,accum.t);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,flow.t);
  gl.uniform1i(PR.combine.u.uA,0); gl.uniform1i(PR.combine.u.uB,1); gl.uniform1f(PR.combine.u.uBOn,FLOW.on);
  blit();
  // 泛光
  gl.bindFramebuffer(gl.FRAMEBUFFER,bright.fb); gl.viewport(0,0,bright.w,bright.h);
  gl.useProgram(PR.bright);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,frame.t);
  gl.uniform1i(PR.bright.u.uSrc,0); gl.uniform1f(PR.bright.u.uThr,1.0);
  blit();
  let src=bright;
  for(let k=0;k<2;k++){
    gl.bindFramebuffer(gl.FRAMEBUFFER,blurA.fb); gl.viewport(0,0,blurA.w,blurA.h);
    gl.useProgram(PR.gauss);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,src.t);
    gl.uniform1i(PR.gauss.u.uSrc,0); gl.uniform2f(PR.gauss.u.uDir,1/blurA.w,0);
    blit();
    gl.bindFramebuffer(gl.FRAMEBUFFER,blurB.fb);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,blurA.t);
    gl.uniform2f(PR.gauss.u.uDir,0,1/blurA.h);
    blit();
    src=blurB;
  }
  // 最终合成
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,W,H);
  gl.useProgram(PR.post);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,frame.t);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,src.t);
  gl.uniform1i(PR.post.u.uSrc,0); gl.uniform1i(PR.post.u.uBloom,1);
  gl.uniform1f(PR.post.u.uExposure,cam.ex);
  gl.uniform1f(PR.post.u.uBloomStr,QUAL.bloom);
  gl.uniform1f(PR.post.u.uGrain,QUAL.grain);
  gl.uniform1f(PR.post.u.uVig,QUAL.vig);
  gl.uniform1f(PR.post.u.uCA,QUAL.ca);
  gl.uniform1f(PR.post.u.uSharp,QUAL.sharp);
  gl.uniform2f(PR.post.u.uPx,1/W,1/H);
  blit();
  CHK('pass.post');
}


