// 引擎副本一致性:页面里内联的引擎必须跟 assets/hw3d.js · hw3d-flow.js 逐行一致
//
// 为什么要查:引擎是"复制进页面"用的,模板和 demo 各内联一份。改了页面里那份
// 而忘了回写 assets,下一个照 starter.html 起步的人拿到的就是旧引擎 ——
// 不报错,只是少了后来加的改进(2026-11-13 查出:视锥剔除、SSAO 先粗后细、
// 泛光迭代次数、L2 切片底色,四处都只在页面里有)。
//
// 比什么:按 "// S<n> ·" 分段。S1-S8、S11、S12 是引擎,必须与 hw3d.js 逐行相同;
//        S12b 是数据流层,去掉注释行和 buildFlow()(每页的示例数据流不同)后
//        必须与 hw3d-flow.js 相同。S9 / S10 / S13 / S14 是页面自己的,不比。
//
// 用法: node check_engine_sync.mjs [页面.html ...]
//       不给参数时查 templates/station-page.html 和 demos/hardware-3d/index.html
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(HERE, '..');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : [
  resolve(SKILL, 'templates/station-page.html'),
  resolve(SKILL, '../../demos/hardware-3d/index.html'),
];
const ENGINE = ['S1','S2','S3','S4','S5','S6','S7','S8','S11','S12'];

// 按 "// S<n> ·" 切段;每段内容 = 标记行之后到下一个分隔线之前
function sections(text){
  const L = text.split('\n'), out = {};
  let cur = null, buf = [];
  const flush = ()=>{ if(cur){
    while(buf.length && (buf.at(-1).trim()==='' || buf.at(-1).startsWith('//===='))) buf.pop();
    out[cur] = buf; } };
  for(const l of L){
    const m = l.match(/^\/\/ (S\d+b?) ·/);
    if(m){ flush(); cur = m[1]; buf = []; continue; }
    if(cur) buf.push(l);
  }
  flush();
  return out;
}
// 数据流层只比代码:去注释行、空行、buildFlow 整个函数
function flowCode(lines){
  const out = []; let skip = false;
  for(const l of lines){
    if(/^function buildFlow\(/.test(l)){ skip = true; continue; }
    if(skip){ if(l === '}') skip = false; continue; }
    const t = l.trim();
    if(t === '' || t.startsWith('//')) continue;
    if(t.startsWith('</script>')) break;
    out.push(l);
  }
  return out;
}
function firstDiff(a, b){
  const n = Math.max(a.length, b.length);
  for(let i=0;i<n;i++) if(a[i] !== b[i]) return {i, a:a[i], b:b[i]};
  return null;
}

const eng = sections(readFileSync(resolve(SKILL,'assets/hw3d.js'),'utf8'));
const flowRef = flowCode(readFileSync(resolve(SKILL,'assets/hw3d-flow.js'),'utf8').split('\n'));
let fail = 0;
for(const s of ENGINE) if(!eng[s]){ console.log(`hw3d.js 缺少段 ${s}`); fail++; }

for(const p of pages){
  const sec = sections(readFileSync(p,'utf8'));
  const bad = [];
  for(const s of ENGINE){
    if(!sec[s]){ bad.push(`${s}: 页面里没有这一段`); continue; }
    if(!eng[s]) continue;
    const d = firstDiff(eng[s], sec[s]);
    if(d) bad.push(`${s}: 段内第 ${d.i+1} 行不同\n      hw3d.js : ${(d.a??'<没有这一行>').trim()}\n      页面    : ${(d.b??'<没有这一行>').trim()}`);
  }
  if(sec.S12b){
    const d = firstDiff(flowRef, flowCode(sec.S12b));
    if(d) bad.push(`S12b: 去注释后第 ${d.i+1} 行代码不同\n      hw3d-flow.js : ${(d.a??'<没有这一行>').trim()}\n      页面         : ${(d.b??'<没有这一行>').trim()}`);
  } else bad.push('S12b: 页面里没有数据流层');
  if(bad.length){ fail += bad.length; console.log(`不一致:${p}`); for(const b of bad) console.log('  '+b); }
  else console.log(`一致:${p}`);
}
console.log(fail ? `不通过:${fail} 处不一致。改了页面里的引擎就回写 assets/,反过来也一样`
                 : `通过:${pages.length} 个页面的引擎段与 assets/hw3d.js · hw3d-flow.js 逐行一致`);
process.exit(fail ? 1 : 0);
