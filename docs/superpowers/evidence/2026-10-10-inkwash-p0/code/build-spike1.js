// 生成小样 1 的页面:几种典型笔画 + 一片淡墨 + 一方印
const fs = require('fs'), path = require('path');
const B = require(process.env.BRUSH || './brush-proto.js');   // BRUSH=./其他版本.js 可换画笔
const b = B.create({ seed: 7, id: 's1' });
b.wash([[420, 330], [500, 250], [560, 270], [640, 210], [720, 260], [760, 330]], { tone: 'qing', start: 0, dur: 1.2, layers: 3 });
const info = [
  b.stroke([[60, 90], [250, 84], [440, 100]], { width: 26, press: 'zhong', load: 0.95, tone: 'jiao', start: 1.2, dur: 0.9 }),
  b.stroke([[560, 50], [500, 140], [400, 230], [270, 300]], { width: 30, press: 'zhong', load: 0.66, tone: 'nong', start: 2.2, dur: 1.0 }),
  b.stroke([[60, 330], [190, 250], [330, 215], [470, 235]], { width: 18, press: 'leaf', load: 0.9, tone: 'zhong', start: 3.3, dur: 1.0 }),
  b.stroke([[640, 110], [662, 146]], { width: 36, press: 'dot', load: 0.95, tone: 'jiao', start: 4.4, dur: 0.3 }),
];
b.seal(690, 20, 56, '墨', { start: 4.9 });
b.seal(690, 86, 40, '水', { start: 5.2, kind: 'bai' });
const html = '<!doctype html><meta charset="utf-8"><title>小样 1 · 一笔</title><style>' + B.CSS +
  'body{margin:0;background:#f2ead8}</style>' + b.svg(780, 360);
fs.writeFileSync(path.join(__dirname, 'spike1.html'), html);
console.log(JSON.stringify(info));
