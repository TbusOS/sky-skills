// Marks and overlays: what you draw ON something — a screenshot, a photo, a codex
// illustration, another figure. Kept separate so they can be layered.
export default [
  {
    id: 'mark-kit', cat: 'mark', w: 760, h: 380, seed: 71,
    title: { zh: '批注工具 · 圈、箭头、划线、对错', en: 'Annotation kit · rings, arrows, underlines, ticks' },
    desc: { zh: '老师改作业的那几样:圈重点、画箭头、划线、荧光笔、打勾打叉、编号。叠在任何截图上都像人改过。', en: 'What a teacher marks a page with: rings, arrows, underlines, highlighter, ticks and crosses, numbers. On any screenshot they read as a person\'s notes.' },
    draw(S, P) {
      P.say(S, 60, 70, { zh: '这里是重点', en: 'the key part' }, { size: 22 });
      S.ring(120, 63, 86, 26, {});
      S.arrow([[250, 110], [210, 82]], { w: 't', pen: 'orange', head: 9 });
      P.say(S, 258, 124, { zh: '圈起来', en: 'ring it' }, { size: 15, ink: 'orange' });
      P.say(S, 60, 170, { zh: '这一句要读两遍', en: 'read this one twice' }, { size: 22 });
      S.underline(58, 250, 180, { pen: 'red', w: 't' });
      S.underline(62, 244, 186, { pen: 'red', w: 'h' });
      S.fill([[56, 228], [260, 226], [262, 252], [58, 254]], 'yellow', { style: 'wash', washCls: 'half' });
      P.say(S, 60, 248, { zh: '荧光笔划过的字', en: 'highlighted words' }, { size: 22 });
      // tick and cross
      S.path([[420, 70], [436, 88], [470, 44]], { w: 'b', pen: 'green', smooth: false });
      P.say(S, 488, 76, { zh: '对', en: 'right' }, { size: 20, ink: 'green' });
      S.line(420, 130, 462, 172, { w: 'b', pen: 'red' }); S.line(462, 130, 420, 172, { w: 'b', pen: 'red' });
      P.say(S, 488, 160, { zh: '不对', en: 'wrong' }, { size: 20, ink: 'red' });
      // numbered callouts
      [1, 2, 3].forEach((n, i) => {
        S.circle(436 + i * 70, 236, 17, { fill: 'orange', w: 't', gap: 3.4 });
        P.say(S, 436 + i * 70, 243, String(n), { anchor: 'middle', size: 19, font: 'mono' });
      });
      // bracket
      S.path([[640, 40], [628, 46], [628, 120], [616, 130], [628, 140], [628, 214], [640, 220]], { w: 't' });
      P.say(S, 610, 136, { zh: '这一段', en: 'this part' }, { anchor: 'end', size: 15, ink: '2' });
      // sticky note
      S.poly([[90, 290], [330, 284], [334, 362], [94, 368]], { fill: 'yellow', gap: 4.4, w: 't' });
      P.say(S, 106, 322, { zh: '便签:回头再看', en: 'note: come back to this' }, { size: 18 });
      P.say(S, 106, 350, { zh: '贴歪一点更像真的', en: 'a little crooked looks real' }, { size: 14, ink: '2' });
      S.rect(470, 300, 240, 60, { r: 10, w: 't', fill: 'sky', style: 'wash' });
      P.say(S, 590, 337, { zh: '手画边框的提示框', en: 'a hand-drawn callout box' }, { anchor: 'middle', size: 16 });
    },
  },
  {
    id: 'mark-terminal', cat: 'mark', w: 760, h: 360, seed: 73, motion: true,
    title: { zh: '终端卡 · 一行一行打出来', en: 'Terminal card · typed line by line' },
    desc: { zh: '深色终端在浅色和深色主题里都保持深色。命令一行一行出现,结果的颜色有意思:绿是通过,红是失败。', en: 'The terminal stays dark in both themes. Lines appear one at a time; colours mean something: green passed, red failed.' },
    draw(S, P) {
      S.raw('<rect x="60" y="40" width="640" height="280" rx="14" class="term"/>', { kind: 'tag', layer: 'labels' });
      [0, 1, 2].forEach(i => S.raw(`<circle cx="${86 + i * 20}" cy="62" r="5" class="tok p-${['red', 'yellow', 'green'][i]}" style="stroke:none"/>`, { kind: 'tag', layer: 'labels' }));
      const L = [
        ['$ ', 'npm test', 'i-term'], ['', '  ✓ parser       42 passed', 'i-term-ok'], ['', '  ✓ renderer     17 passed', 'i-term-ok'],
        ['', '  ✗ export       1 failed: frame 300 differs', 'i-term-err'], ['', '  59 passed · 1 failed · 3.1 s', 'i-term-dim'], ['$ ', '', 'i-term'],
      ];
      L.forEach((l, i) => S.at(0.4 + i * 0.7, 0.6, () => {
        const y = 104 + i * 34;
        if (l[0]) S.text(84, y, l[0], { size: 17, font: 'mono', ink: 'term-dim' });
        if (l[1]) S.text(84 + (l[0] ? 22 : 0), y, l[1], { size: 17, font: 'mono', ink: l[2].slice(2) });
      }));
      S.animate('0%,49%{opacity:1}50%,100%{opacity:0}', 4.6, 1, () => S.raw('<rect x="106" y="272" width="11" height="20" class="tok p-paper" style="stroke:none"/>', { kind: 'tag', layer: 'labels' }), { repeat: 'infinite', ease: 'linear' });
    },
  },
  {
    id: 'mark-screenshot', cat: 'mark', w: 760, h: 420, seed: 75,
    title: { zh: '给界面截图加讲解', en: 'Explaining a screen with callouts' },
    desc: { zh: '一个手画的窗口(换成真实截图也行),旁边三个编号标注。编号和正文里的 1 2 3 对应,读者不用找。', en: 'A hand-drawn window (or a real screenshot) with three numbered callouts that match 1 2 3 in the text, so nobody hunts.' },
    draw(S, P) {
      S.rect(110, 40, 430, 330, { r: 14, fill: 'paper', style: 'wash', washCls: 'solid' });
      S.line(110, 78, 540, 78, { w: 't' });
      [0, 1, 2].forEach(i => S.circle(134 + i * 20, 59, 6, { w: 'h' }));
      S.rect(200, 52, 260, 16, { r: 8, w: 'h' });
      S.rect(130, 98, 110, 250, { r: 8, fill: 'grey', style: 'wash', w: 't' });
      [0, 1, 2, 3].forEach(i => S.line(146, 124 + i * 30, 222, 124 + i * 30, { w: 'h', double: false }));
      S.rect(256, 98, 266, 120, { r: 8, fill: 'sky', style: 'wash', w: 't' });
      S.rect(256, 232, 126, 116, { r: 8, w: 't' });
      S.rect(396, 232, 126, 116, { r: 8, w: 't' });
      S.rect(420, 312, 82, 26, { r: 13, fill: 'orange', w: 't', gap: 3.6 });
      const call = [[1, 60, 160, 138, 150, { zh: '左边是目录', en: 'contents on the left' }, 'start', 30],
        [2, 610, 150, 530, 156, { zh: '主画面', en: 'the main view' }, 'start', 592],
        [3, 610, 300, 508, 324, { zh: '只有这个按钮会动数据', en: 'only this button changes data' }, 'start', 592]];
      call.forEach(([n, x, y, tx, ty, txt, anchor, lx]) => {
        S.arrow([[x + (x < 300 ? 16 : -16), y], [tx, ty]], { w: 't', pen: 'orange', head: 8 });
        S.circle(x, y, 15, { fill: 'orange', w: 't', gap: 3.2 });
        P.say(S, x, y + 6, String(n), { anchor: 'middle', size: 17, font: 'mono' });
        P.say(S, lx, y + 40, txt, { anchor, size: 15, ink: '2' });
      });
    },
  },
  {
    id: 'mark-video-safe', cat: 'mark', w: 760, h: 440, seed: 77,
    title: { zh: '短视频画面 · 横屏和竖屏的安全区', en: 'Video frames · safe areas, landscape and portrait' },
    desc: { zh: '做小视频时字和主体放哪:标题在上、字幕在下,右侧和底部留给平台按钮。比例按 16:9 和 9:16 画。', en: 'Where words and subjects go in a short video: title on top, subtitles below, the right edge and bottom left for the platform\'s buttons. Drawn at 16:9 and 9:16.' },
    draw(S, P) {
      // 16:9 frame
      const fx = 30, fy = 50, fw = 432, fh = 243;
      S.rect(fx, fy, fw, fh, { w: 't' });
      S.rect(fx + fw * 0.05, fy + fh * 0.05, fw * 0.9, fh * 0.9, { w: 'h', cls: 'dash', double: false });
      S.rect(fx + 60, fy + 22, fw - 120, 30, { fill: 'blue', style: 'wash', w: 'h' });
      P.say(S, fx + fw / 2, fy + 43, { zh: '标题', en: 'title' }, { anchor: 'middle', size: 16 });
      S.rect(fx + 120, fy + 70, 190, 110, { fill: 'orange', w: 't' });
      P.say(S, fx + 215, fy + 132, { zh: '主体', en: 'subject' }, { anchor: 'middle', size: 18 });
      S.rect(fx + 40, fy + fh - 52, fw - 80, 30, { fill: 'yellow', style: 'wash', w: 'h' });
      P.say(S, fx + fw / 2, fy + fh - 31, { zh: '字幕', en: 'subtitles' }, { anchor: 'middle', size: 16 });
      P.say(S, fx + fw / 2, fy + fh + 34, { zh: '16:9 横屏 · 字幕离底边 ≥ 8%', en: '16:9 · subtitles ≥ 8% above the edge' }, { anchor: 'middle', size: 15, ink: '2' });
      // 9:16 frame
      const vx = 540, vy = 30, vw = 189, vh = 336;
      S.rect(vx, vy, vw, vh, { w: 't', r: 10 });
      S.rect(vx + vw - 34, vy + vh * 0.42, 26, vh * 0.42, { fill: 'grey', style: 'wash', w: 'h', r: 6 });
      S.rect(vx + 8, vy + vh - 52, vw - 50, 44, { fill: 'grey', style: 'wash', w: 'h', r: 6 });
      P.say(S, vx + vw - 21, vy + vh * 0.42 - 8, { zh: '按钮', en: 'UI' }, { anchor: 'middle', size: 13, ink: '2' });
      P.say(S, vx + 60, vy + vh - 26, { zh: '平台文字', en: 'platform text' }, { anchor: 'middle', size: 13, ink: '2' });
      S.rect(vx + 16, vy + 30, vw - 50, 34, { fill: 'blue', style: 'wash', w: 'h' });
      P.say(S, vx + (vw - 34) / 2, vy + 53, { zh: '标题', en: 'title' }, { anchor: 'middle', size: 15 });
      S.rect(vx + 20, vy + 92, vw - 64, 120, { fill: 'orange', w: 't' });
      P.say(S, vx + (vw - 44) / 2, vy + 158, { zh: '主体', en: 'subject' }, { anchor: 'middle', size: 16 });
      S.rect(vx + 16, vy + 228, vw - 54, 30, { fill: 'yellow', style: 'wash', w: 'h' });
      P.say(S, vx + (vw - 38) / 2, vy + 248, { zh: '字幕', en: 'subtitles' }, { anchor: 'middle', size: 14 });
      P.say(S, vx + vw / 2, vy + vh + 34, { zh: '9:16 竖屏 · 避开右侧和底部', en: '9:16 · keep off the right and bottom' }, { anchor: 'middle', size: 15, ink: '2' });
    },
  },
];

