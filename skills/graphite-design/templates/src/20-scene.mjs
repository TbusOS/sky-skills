// Scenes and cinematic frames drawn with code. For large, rich scenes an image
// model usually draws better (see references/image-prompts.md and the showcase,
// where the same brief was given to both); these exist for the cases code wins:
// every part can move, recolour with the theme, and be edited by hand.
export default [
  {
    id: 'scene-idea', cat: 'scene', w: 760, h: 420, seed: 81, motion: true,
    title: { zh: '想到了 · 灯泡亮起来', en: 'An idea · the bulb lights up' },
    desc: { zh: '一个人在桌前想事情,先画桌子、人、电脑,最后灯泡一亮。讲「为什么要做这件事」的开场画面。', en: 'Someone thinking at a desk: desk, person and laptop are drawn first, then the bulb lights. An opening shot for "why we are doing this".' },
    draw(S, P) {
      S.at(0, 1.2, () => { S.line(40, 380, 720, 380, { w: 't' }); P.desk(S, 420, 380, 1, { w: 360, h: 120 }); });
      S.at(1, 1.6, () => { P.chair(S, 300, 380, 1.05, { flip: false }); P.person(S, 318, 388, 0.92, { pose: 'think', legs: 'sit', shirt: 'blue', hair: 'bob', eyes: 'open' }); });
      S.at(2.4, 1.2, () => { P.laptop(S, 470, 260, 0.9, { screen: 'sky' }); P.mug(S, 570, 260, 0.9); P.plant(S, 640, 260, 0.8); });
      S.at(3.8, 0.8, () => P.bulb(S, 330, 70, 0.9, { off: true }));
      S.window(4.8, null, () => {
        P.bulb(S, 330, 70, 0.9, {});
        S.burst(330, 68, 52, 70, 150, 390, 7, { pen: 'orange' });
      });
      S.at(5.2, 0.8, () => P.say(S, 420, 74, { zh: '对了!', en: 'got it!' }, { size: 26, ink: 'orange' }));
    },
  },
  {
    id: 'scene-whiteboard', cat: 'scene', w: 760, h: 420, seed: 83, motion: true,
    title: { zh: '白板讲解 · 代码画的版本', en: 'At the whiteboard · drawn with code' },
    desc: { zh: '和展示页首屏同一个题目,这张用代码画。对比看:大场景位图更好看,代码画的胜在每一笔都能动、能换主题、能改。', en: 'The same brief as the showcase hero, drawn with code. Side by side: the bitmap looks richer; the code version can move every stroke, follow the theme and be edited.' },
    draw(S, P) {
      S.at(0, 1.4, () => {
        S.line(30, 390, 730, 390, { w: 't' });
        S.rect(250, 60, 380, 240, { r: 8, fill: 'paper', style: 'wash', washCls: 'solid' });
        S.rect(240, 52, 400, 256, { r: 10, fill: 'wood', style: 'wash', w: 't' });
        S.line(300, 308, 280, 390, {}); S.line(580, 308, 600, 390, {});
      });
      S.at(1.2, 1.6, () => { P.chair(S, 140, 390, 0.9); P.person(S, 136, 392, 0.85, { pose: 'think', legs: 'sit', shirt: 'blue', hair: 'bob', eyes: 'open' }); });
      S.at(2.6, 1.2, () => P.robot(S, 680, 388, 0.72, { pose: 'wave' }));
      // what the robot draws on the board: a tiny flowchart, written while you watch
      S.at(4, 3, () => {
        const a = P.node(S, 280, 96, 110, 52, { zh: '输入', en: 'input' }, { pen: 'blue', size: 18 });
        const b = P.node(S, 440, 96, 150, 52, { zh: '处理', en: 'process' }, { pen: 'orange', size: 18 });
        const c = P.node(S, 360, 206, 140, 52, { zh: '结果', en: 'result' }, { pen: 'green', size: 18 });
        P.link(S, a, b, { side: 'h' }); P.link(S, b, c, { side: 'v' });
      });
      S.at(7, 0.8, () => S.ring(430, 232, 92, 40, {}));
    },
  },
  {
    id: 'cinema-storyboard', cat: 'cinema', w: 760, h: 360, seed: 85, motion: true,
    title: { zh: '分镜 · 远景、中景、特写', en: 'Storyboard · wide, medium, close-up' },
    desc: { zh: '拍短片前先画分镜:三格各写清楚镜头怎么动、停几秒。做 HTML 动画时,这三格就是三段时间线。', en: 'Before filming, a storyboard: each panel says how the camera moves and for how long. In an HTML animation the three panels are three stretches of the timeline.' },
    draw(S, P) {
      const fw = 220, fh = 124, ys = 60, xs = [24, 270, 516];
      const notes = [{ zh: '远景 · 3 秒 · 慢慢推近', en: 'wide · 3 s · slow push in' }, { zh: '中景 · 2 秒 · 跟着走', en: 'medium · 2 s · follow' }, { zh: '特写 · 2 秒 · 停住', en: 'close-up · 2 s · hold' }];
      xs.forEach((x, k) => S.at(k * 1.4, 1.4, () => {
        S.rect(x, ys, fw, fh, { r: 4, w: 't' });
        S.text(x, ys - 12, String(k + 1), { size: 18, font: 'mono', ink: 'orange' });
        if (k === 0) { S.path([[x + 10, ys + 92], [x + 70, ys + 80], [x + 140, ys + 94], [x + 210, ys + 84]], { w: 't' }); P.tree(S, x + 172, ys + 92, 0.3); P.robot(S, x + 60, ys + 98, 0.2, {}); P.person(S, x + 86, ys + 98, 0.22, { shirt: 'blue', hair: 'bob' }); P.sun(S, x + 40, ys + 28, 0.36); }
        if (k === 1) { P.robot(S, x + 80, ys + 120, 0.5, { pose: 'wave' }); P.person(S, x + 150, ys + 120, 0.48, { shirt: 'blue', hair: 'bob', pose: 'walk' }); }
        if (k === 2) { S.circle(x + 110, ys + 74, 44, { fill: 'grey', style: 'wash' }); S.rect(x + 76, ys + 52, 68, 40, { r: 12, fill: 'paper', style: 'wash', washCls: 'solid', w: 't' }); S.dot(x + 98, ys + 70, 5); S.dot(x + 122, ys + 70, 5); S.path([[x + 102, ys + 82], [x + 110, ys + 86], [x + 118, ys + 82]], { w: 't' }); }
        P.say(S, x + fw / 2, ys + fh + 34, notes[k], { anchor: 'middle', size: 16 });
        if (k < 2) S.arrow([[x + fw + 6, ys + fh / 2], [xs[k + 1] - 8, ys + fh / 2]], { w: 't', head: 8 });
      }));
      S.at(4.4, 1, () => {
        S.line(24, 300, 736, 300, { w: 't' });
        [[24, 0], [348, 3], [564, 5], [736, 7]].forEach(([x, t]) => { S.line(x, 293, x, 307, { w: 't', double: false }); P.say(S, x, 330, t + ' s', { anchor: 'middle', size: 14, font: 'mono', ink: '2' }); });
        P.say(S, 380, 352, { zh: '时间线:一共 7 秒', en: 'timeline: 7 s in all' }, { anchor: 'middle', size: 14, ink: '2' });
      });
    },
  },
  {
    id: 'cinema-rain', cat: 'cinema', w: 840, h: 360, seed: 87, motion: true,
    title: { zh: '电影感 · 雨夜路灯(镜头慢推)', en: 'Cinematic · a lamp in the rain (slow push)' },
    desc: { zh: '电影感的四个手法都在这一格:上下黑边、只有一个光源、镜头慢慢推近、雨一直在下。黑边里的字幕不跟着推。', en: 'Four film devices in one frame: letterbox bars, a single light source, a slow push in, rain that keeps falling. The subtitle in the bar does not move with the camera.' },
    draw(S, P) {
      const W = 840, H = 360, bar = 40;
      // camera: the whole frame inside the bars scales up 7 % over 12 s, about the lamp
      S.animate('from{transform:scale(1)}to{transform:scale(1.07)}', 0, 12, () => {
        S.at(0, 1.4, () => { S.line(0, 286, W, 282, {}); S.path([[0, 300], [300, 306], [W, 302]], { w: 'h', double: false }); });
        S.at(1, 1.6, () => {
          S.poly([[392, 290], [408, 290], [404, 92], [396, 92]], { fill: 'grey', gap: 3.4, w: 't' });
          S.path([[400, 96], [404, 80], [430, 72], [452, 78]], { w: 't' });
          S.poly([[440, 78], [466, 78], [474, 96], [432, 96]], { fill: 'yellow', gap: 3, w: 't' });
        });
        S.at(2.4, 1.6, () => {
          S.fill([[434, 98], [472, 98], [560, 290], [348, 290]], 'yellow', { style: 'wash', washCls: 'half' });
          S.fill([[380, 290], [530, 290], [560, 312], [350, 312]], 'yellow', { style: 'wash' });
        });
        S.at(3.6, 1.6, () => {
          P.person(S, 500, 290, 0.78, { shirt: 'red', hair: 'bob', pose: 'stand', eyes: 'closed' });
          S.loop([[452, 148], [470, 126], [500, 118], [530, 124], [548, 146]], { w: 't', fill: 'blue', gap: 3.4 });
          S.line(500, 120, 506, 184, { w: 't' });
        });
        // rain: two layers of short strokes falling forever (CSS translate, repeat)
        const rain = (n, dx, len, seed, dur, delay) => {
          const out = []; let s = seed;
          for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const x = (s / 233280) * W; s = (s * 9301 + 49297) % 233280; const y = (s / 233280) * (H - 2 * bar) + bar - 60; out.push(`M${x.toFixed(1)} ${y.toFixed(1)}l${dx} ${len}`); }
          S.animate(`from{transform:translate(0,-60px)}to{transform:translate(${-dx * 3}px,60px)}`, delay, dur, () => S.raw(`<path d="${out.join('')}" class="ln w-h rain"/>`, { kind: 'tag' }), { repeat: 'infinite', ease: 'linear' });
        };
        rain(70, -4, 16, 7, 0.7, 5);        // far: short, slow
        rain(50, -6, 24, 13, 0.5, 5.2);     // near: longer, faster
      }, { ease: 'ease-out', origin: '450px 180px', fill: 'both' });
      // letterbox bars and the subtitle: outside the camera move
      S.raw(`<rect x="0" y="0" width="${W}" height="${bar}" class="term"/><rect x="0" y="${H - bar}" width="${W}" height="${bar}" class="term"/>`, { kind: 'tag', layer: 'labels' });
      S.window(6, null, () => P.say(S, W / 2, H - 14, { zh: '那天晚上,雨一直没停。', en: 'That night the rain never stopped.' }, { anchor: 'middle', size: 18, ink: 'term' }), { layer: 'labels' });
    },
  },
];
