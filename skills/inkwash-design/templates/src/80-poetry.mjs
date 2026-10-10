// 诗词 — the poem is written vertically into the empty paper, one column at a time.
const L = (zh, en) => ({ zh, en });

// write columns right to left; returns when the last column is done
function poem(B, lines, x, y, size, t0, o = {}) {
  const per = o.per || 0.55;
  lines.forEach((ln, i) => B.at(t0 + i * per * ln.length * 0.3, per * ln.length * 0.3, () => B.text(x - i * size * 1.45, y, ln, { size, font: 'long', ink: o.ink || 'jiao', vertical: true })));
  return t0 + lines.reduce((s, ln) => s + per * ln.length * 0.3, 0);
}

const JIANGXUE = ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'];
const FENGQIAO = ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'];
const SHUIDIAO = ['明月几时有', '把酒问青天'];

export default [
  {
    id: 'poem-jiangxue', cat: 'poetry', w: 1000, h: 600, seed: 137, motion: true, wide: true,
    title: L('《江雪》', '"River Snow"'),
    desc: L('柳宗元《江雪》。山只勾阴面,其余空着当雪;一叶孤舟一个蓑笠翁,水不画;诗竖排题在右边的留白里,一列一列写出;雪一直慢慢落。', 'Liu Zongyuan, "River Snow" (9th c.). Hills are inked only on their shaded sides, the rest left as snow; one boat, one fisherman, the water unpainted; the poem is written column by column into the empty right side; snow keeps falling, slowly.'),
    draw(B, P) {
      B.at(0.2, 2.6, () => {
        P.mountain(B, [[20, 330], [90, 190], [150, 130], [200, 210], [260, 160], [330, 330]], { tone: 'qing', ridge: 'zhong', cun: 5, opacity: 0.6 });
        P.mountain(B, [[220, 360], [300, 250], [360, 220], [420, 280], [470, 360]], { tone: 'qing', ridge: 'nong', cun: 3, opacity: 0.5 });
      }, { order: 'wash-first' });
      B.at(3, 1.6, () => { P.boat(B, 420, 470, 120); P.water(B, 330, 500, 200, { lines: 2, gap: 10, tone: 'qing' }); });
      const end = poem(B, JIANGXUE, 900, 80, 40, 4.8);
      B.text(905, 470, '', { size: 14, ink: 'zhong', lang: L('柳宗元', 'Liu Zongyuan'), vertical: true });
      B.seal(840, 520, 40, '寒江', { at: end + 0.2 });
      P.fall(B, { kind: 'snow', n: 60, x1: 1000, y1: 600 });
    },
  },
  {
    id: 'poem-fengqiao', cat: 'poetry', w: 1000, h: 600, seed: 139, motion: true, wide: true, paper: 'dark',
    title: L('《枫桥夜泊》:磁青纸上的泥金夜景', '"Night Mooring by Maple Bridge" in gold on indigo'),
    desc: L('张继《枫桥夜泊》。这张固定用磁青纸配泥金,不随页面主题变:夜景本来就是暗的。渔火一点藤黄,枫叶几点朱膘,寒山寺的钟声一圈圈荡开。', 'Zhang Ji, "Night Mooring by Maple Bridge" (8th c.). Fixed on indigo paper in gold whatever the page theme — a night scene is dark anyway. One gamboge fishing light, a few vermilion maple leaves, and the temple bell rings out in widening circles.'),
    draw(B, P) {
      B.at(0.2, 2, () => {
        P.farHills(B, 0, 330, 1000, { rows: 2, height: 50 });
        P.moon(B, 160, 110, 30, { tone: 'dan', opacity: 0.6 });
      }, { order: 'wash-first' });
      B.at(2.4, 2.4, () => {
        P.bridge(B, 230, 420, 300);
        P.pavilion(B, 680, 300, 110);
        P.boat(B, 420, 470, 110, { figure: false });
        B.dot(436, 452, 9, { tone: 'tenghuang', wet: 1.2 });
      });
      B.at(5, 1.4, () => {
        B.stroke([[110, 520], [130, 420], [100, 330]], { tone: 'nong', width: 9, press: 'ce', load: 0.8 });
        [[100, 330], [140, 360], [80, 380], [125, 410], [150, 330]].forEach(([x, y]) => B.dot(x, y, 14, { tone: 'zhubiao', wet: 0.8 }));
        [[300, 140], [330, 128], [360, 150]].forEach(([x, y]) => B.stroke([[x - 8, y], [x, y - 4], [x + 8, y]], { tone: 'zhong', width: 3, press: 'si', dry: false }));
      });
      // the bell: rings widening from the temple, slow and forever
      const ring = B.keyframes('from{transform:scale(0.2);opacity:0.9}to{transform:scale(3.2);opacity:0}');
      B.raw([0, 2, 4].map(d => `<g class="mv amb" style="animation:${ring} 6s ease-out ${d - 6}s infinite;transform-box:fill-box;transform-origin:center"><circle class="k-jiao" cx="680" cy="260" r="40" fill="none" stroke="currentColor" stroke-width="2"/></g>`).join(''), { kind: 'tag', layer: 'labels' });
      const end = poem(B, FENGQIAO, 930, 60, 36, 6.6, { ink: 'jiao' });
      B.seal(760, 520, 40, '枫桥', { at: end + 0.2 });
    },
  },
  {
    id: 'poem-shuidiao', cat: 'poetry', w: 1000, h: 600, seed: 149, motion: true, wide: true,
    title: L('《水调歌头》:烘云托月', '"Prelude to Water Melody": the moon left unpainted'),
    desc: L('苏轼《水调歌头》开头两句。月亮一笔不画,画的是它周围的淡墨云(烘云托月);云每 14 秒来回移一次;诗只题两句,留白比字多。', 'The opening of Su Shi\'s "Prelude to Water Melody". The moon is never painted — only the pale cloud around it (烘云托月); the clouds drift back and forth every 14 s; just two lines of the poem, more empty paper than words.'),
    draw(B, P) {
      B.at(0.2, 2.2, () => P.moon(B, 380, 250, 90, { tone: 'dan', opacity: 1 }));
      B.animate('0%{transform:translateX(-40px)}50%{transform:translateX(40px)}100%{transform:translateX(-40px)}', 0, 14, () => {
        P.cloud(B, 300, 380, 260, { tone: 'zhong' });
        P.cloud(B, 520, 180, 200, { tone: 'dan' });
      }, { repeat: 'infinite', layer: 'art' });
      B.at(2.6, 1.6, () => P.farHills(B, 0, 560, 1000, { rows: 1, height: 40 }), { order: 'wash-first' });
      const end = poem(B, SHUIDIAO, 860, 110, 44, 4.4);
      B.text(745, 420, '', { size: 14, ink: 'zhong', lang: L('苏轼', 'Su Shi'), vertical: true });
      B.seal(700, 470, 40, '东坡', { at: end + 0.2, kind: 'bai' });
    },
  },
];
