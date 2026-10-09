// Page parts for the showcase (category "_page": not in the gallery, not counted).
export default [
  {
    // drawn over the blank whiteboard of the codex hero illustration; the page positions it
    // at left 41.9 % / top 25 % / width 39.5 % of the picture (measured from both versions)
    id: 'hero-board', cat: '_page', w: 660, h: 350, seed: 91, motion: true,
    title: { zh: '白板上:这种画是怎么来的', en: 'On the board: how this look is made' },
    desc: { zh: '纸、石墨线、彩铅、动起来四步。', en: 'Paper, graphite line, coloured pencil, motion.' },
    draw(S, P) {
      const st = [
        { zh: '暖纸', en: 'paper', pen: 'yellow' }, { zh: '石墨线', en: 'graphite', pen: 'grey' },
        { zh: '彩铅', en: 'pencils', pen: 'orange' }, { zh: '动起来', en: 'motion', pen: 'green' },
      ];
      const boxes = [];
      st.forEach((s, i) => S.at(0.6 + i * 1.1, 1.2, () => {
        const x = 20 + i * 162, y = 110;
        boxes.push(P.node(S, x, y, 130, 74, { zh: s.zh, en: s.en }, { pen: s.pen, size: 26, opaque: false }));
        if (i) P.link(S, boxes[i - 1], boxes[i], { side: 'h', gap: 4, head: 9 });
      }));
      S.at(5, 1.2, () => {
        P.say(S, 330, 60, { zh: '怎么画出这种画?', en: 'How is it drawn?' }, { anchor: 'middle', size: 34 });
        S.underline(190, 470, 72, { pen: 'orange', w: 't' });
      });
      S.at(6.2, 1.2, () => {
        P.say(S, 330, 268, { zh: '一支笔,按讲故事的顺序画', en: 'one pen, in story order' }, { anchor: 'middle', size: 24, ink: '2' });
        S.ring(504, 147, 86, 52, {});
      });
    },
  },
  {
    id: 'sw-line', cat: '_page', w: 320, h: 120, seed: 92, motion: true,
    title: { zh: '石墨线', en: 'graphite line' }, desc: { zh: '会抖、会冲出角', en: 'wobbles, overshoots corners' },
    draw(S, P) {
      S.at(0, 1.6, () => { S.rect(20, 24, 110, 70, { r: 14 }); S.path([[160, 80], [200, 40], [240, 86], [290, 36]], { w: 'b' }); });
    },
  },
  {
    id: 'sw-pencils', cat: '_page', w: 320, h: 120, seed: 93, motion: true,
    title: { zh: '彩铅', en: 'pencils' }, desc: { zh: '十支彩铅', en: 'ten pencils' },
    draw(S, P) {
      const pens = ['blue', 'sky', 'orange', 'green', 'red', 'yellow', 'wood', 'pink', 'grey', 'violet'];
      S.at(0, 2.2, () => pens.forEach((p, i) => S.rect(14 + (i % 5) * 60, 14 + Math.floor(i / 5) * 50, 50, 40, { fill: p, w: 'h', r: 6 })));
    },
  },
  {
    id: 'sw-motion', cat: '_page', w: 320, h: 120, seed: 94, motion: true,
    title: { zh: '先线后色', en: 'ink, then colour' }, desc: { zh: '一支笔按顺序画', en: 'one pen, in order' },
    draw(S, P) {
      S.at(0, 2.4, () => { S.star(70, 60, 40, { fill: 'yellow', w: 't' }); P.say(S, 210, 70, { zh: '线 → 色', en: 'ink → colour' }, { anchor: 'middle', size: 24 }); });
    },
  },
  {
    // the reel's second shot: a ring drawn around the red light (positioned by the page)
    id: 'reel-ring', cat: '_page', w: 300, h: 200, seed: 95, motion: true,
    title: { zh: '圈出红灯', en: 'Ring the red light' }, desc: { zh: '', en: '' },
    draw(S, P) {
      S.at(0, 0.9, () => S.ring(150, 96, 70, 52, { w: 'b' }));
      S.at(0.9, 0.7, () => P.say(S, 150, 186, { zh: '就是这一台', en: 'this one' }, { anchor: 'middle', size: 30, ink: 'term' }));
    },
  },
  {
    id: 'reel-title', cat: '_page', w: 640, h: 220, seed: 96, motion: true,
    title: { zh: '片尾', en: 'End card' }, desc: { zh: '', en: '' },
    draw(S, P) {
      S.at(0, 1.2, () => P.say(S, 320, 96, 'graphite · 石墨', { anchor: 'middle', size: 64 }));
      S.at(1.1, 0.7, () => S.underline(150, 490, 116, { pen: 'orange', w: 'b' }));
      S.at(1.7, 1, () => P.say(S, 320, 176, { zh: '用铅笔,把一件事讲清楚', en: 'explain it in pencil' }, { anchor: 'middle', size: 30, ink: '2' }));
    },
  },
];

