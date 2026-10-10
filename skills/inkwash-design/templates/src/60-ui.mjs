// 文档 · 网页 · 界面 — in an interface ink is an accent; body text stays plain and readable.
const L = (zh, en) => ({ zh, en });
const rect = (x, y, w, h, cls, extra = '') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"${extra}/>`;

export default [
  {
    id: 'doc-page', cat: 'ui', w: 1000, h: 640, seed: 73, motion: true, wide: true,
    title: L('技术文档页', 'A documentation page'),
    desc: L('毛笔字只用在页标题;正文、代码、侧栏照常是宋体和等宽字;一道墨痕当分隔线,一方印章当「稳定版」标记。宣纸纹理很淡,正文对比度不受影响。', 'Brush lettering only for the page title; body, code and sidebar stay in serif and monospace; one ink stroke as a divider, one seal as the "stable" badge. The paper grain is faint enough not to cost body contrast.'),
    draw(B, P) {
      B.raw(rect(30, 30, 940, 580, 'card', ' stroke="none"'), { kind: 'tag' });
      B.at(0.2, 1.4, () => {
        ['安装', '快速上手', '画笔 brush.js', '物件 props.js', '口味学习'].forEach((t, i) => B.text(60, 110 + i * 38, t, { size: 16, font: 'song', ink: i === 2 ? 'jiao' : 'zhong', weight: i === 2 ? 600 : null }));
        B.stroke([[52, 96 + 2 * 38], [52, 122 + 2 * 38]], { tone: 'zhusha', width: 4, press: 'si', dry: false });
      });
      B.at(1.6, 1.4, () => B.text(260, 120, '', { size: 46, font: 'brush', ink: 'jiao', lang: L('画笔 brush.js', 'The brush') }));
      B.at(3.0, 0.8, () => B.stroke([[260, 150], [520, 144], [760, 150], [920, 146]], { tone: 'nong', width: 7, press: 'zhong', load: 0.7, wet: 0.2 }));
      B.seal(860, 74, 46, '稳定', { at: 3.6, kind: 'bai' });
      B.at(3.8, 1.2, () => {
        [L('一笔 = 中心线 + 提按曲线 + 含墨量。墨少了笔毛分开,露出纸白。', 'A stroke = a centre line + a pressure curve + ink load. As ink runs out the hairs part.'),
          L('同一个 seed 永远画出同一张,重新构建不会改变已发布的图。', 'The same seed always draws the same picture, so a rebuild never changes a published figure.')]
          .forEach((t, i) => B.text(260, 196 + i * 32, '', { size: 17, font: 'song', ink: 'nong', lang: t }));
      });
      B.at(5.0, 1.2, () => P.codeCard(B, 260, 270, 660, [[['var ', 'term-key'], ['B = Brush.create({ seed: 7 });', 'term']], [['B.stroke(pts, { tone: ', 'term'], ["'nong'", 'term-ok'], [', width: 14 });', 'term']], [['// 墨少了就出飞白', 'term-dim']]], { size: 15, lineHeight: 28 }));
      B.at(6.4, 1, () => {
        P.box(B, 260, 420, 660, 120, { fill: 'tenghuang', fillOpacity: 0.35, tone: 'zhong', weight: 'light' });
        B.text(290, 462, '', { size: 17, font: 'song', ink: 'jiao', weight: 600, lang: L('注意', 'Note') });
        B.text(290, 498, '', { size: 16, font: 'song', ink: 'nong', lang: L('技术图里的线一律 dry: false —— 飞白会把箭头断开。', 'In diagrams every line is dry: false — dry brush breaks arrows.') });
      });
    },
  },
  {
    id: 'ui-kit', cat: 'ui', w: 1000, h: 560, seed: 79, motion: true, wide: true,
    title: L('界面组件:按钮墨晕 · 开关 · 输入框 · 空状态', 'UI pieces: an ink-bleed button, a switch, an input, an empty state'),
    desc: L('按钮按下时墨从中间晕开;开关拨到「开」是一滴浓墨,「关」是一圈淡墨;输入框只有一道毛笔下划线;空状态画一只空船,不写「暂无数据」那种冷冰冰的字。', 'A pressed button lets ink bleed from its centre; a switch is a drop of thick ink when on and a pale ring when off; an input is one brushed underline; an empty state is an empty boat instead of a cold "no data".'),
    draw(B, P) {
      B.at(0.2, 1.2, () => {
        P.box(B, 60, 70, 180, 64, { label: L('确定', 'OK'), size: 22, weight: 'heavy', fill: false });
        P.box(B, 280, 70, 180, 64, { label: L('取消', 'Cancel'), size: 22, tone: 'zhong', weight: 'light', fill: false, ink: 'zhong' });
      });
      // the pressed state: ink bleeding out from the middle, repeating slowly
      B.animate('0%{opacity:0;transform:scale(0.2)}40%{opacity:0.9;transform:scale(1)}100%{opacity:0;transform:scale(1.05)}', 1.6, 2.4, () => {
        B.raw('<ellipse class="k-nong" cx="150" cy="102" rx="84" ry="28" fill="currentColor" filter="url(#ink-halo)"/>', { kind: 'tag' });
      }, { repeat: 'infinite', origin: '150px 102px', layer: 'art' });
      B.text(60, 170, '', { size: 14, ink: 'zhong', lang: L('按下:墨从中间晕开', 'pressed: ink bleeds from the centre') });
      B.at(1.6, 1.2, () => {
        B.stroke([[560, 102], [660, 102]], { tone: 'dan', width: 30, press: 'si', dry: false, wet: 0.3 });
        B.dot(645, 102, 30, { tone: 'jiao', angle: 0 });
        B.stroke([[740, 102], [840, 102]], { tone: 'qing', width: 30, press: 'si', dry: false, wet: 0.3 });
        P.enso(B, 757, 102, 13, { width: 3, tone: 'dan', sweep: 6.2 });
        B.text(610, 160, '', { size: 14, anchor: 'middle', ink: 'zhong', lang: L('开', 'on') });
        B.text(790, 160, '', { size: 14, anchor: 'middle', ink: 'zhong', lang: L('关', 'off') });
      });
      B.at(3.0, 1.2, () => {
        B.text(60, 268, '', { size: 16, font: 'song', ink: 'zhong', lang: L('称呼', 'Name') });
        B.text(60, 312, '', { size: 22, font: 'kai', ink: 'jiao', lang: L('寒江钓叟', 'Old fisherman') });
        B.stroke([[56, 330], [260, 326], [420, 330]], { tone: 'nong', width: 4, press: 'zhong', load: 0.8, wet: 0.2 });
        B.stroke([[56, 400], [260, 396], [420, 400]], { tone: 'yanzhi', width: 4, press: 'zhong', load: 0.8, wet: 0.2 });
        B.text(60, 386, '', { size: 18, font: 'kai', ink: 'dan', lang: L('邮箱', 'Email') });
        B.text(60, 426, '', { size: 14, ink: 'yanzhi', lang: L('胭脂只标出错的那一处', 'rouge marks only the error') });
      });
      B.at(4.4, 2.2, () => {
        P.water(B, 560, 400, 360, { lines: 3, gap: 12 });
        P.boat(B, 740, 380, 120, { line: false });
        B.text(740, 470, '', { size: 18, anchor: 'middle', font: 'kai', ink: 'zhong', lang: L('这里还空着,画第一张吧', 'Nothing here yet — paint the first one') });
      });
      B.seal(900, 70, 40, '组件', { at: 6.8 });
    },
  },
  {
    id: 'phone-app', cat: 'ui', w: 420, h: 820, seed: 83, motion: true,
    title: L('手机 App 一屏', 'One phone screen'),
    desc: L('顶上一抹远山当页头,标题毛笔字;列表照常是清楚的楷体和宋体,完成的那项盖一方小印;底栏四个图标都是一两笔画出来的。', 'A strip of far hills as the header with a brush title; the list stays plain kai and serif, a done item gets a small seal; the four tab icons are one or two strokes each.'),
    draw(B, P) {
      B.raw(rect(10, 10, 400, 800, 'card', ' rx="36" stroke="none"'), { kind: 'tag' });
      B.at(0.2, 1.4, () => P.farHills(B, 10, 150, 400, { rows: 2, height: 46, step: 16 }), { order: 'wash-first' });
      B.at(1.4, 1, () => B.text(40, 92, '', { size: 40, font: 'brush', ink: 'jiao', lang: L('今日', 'Today') }));
      const items = [[L('读完《江雪》', 'Read "River Snow"'), true], [L('临帖二十分钟', 'Copy calligraphy, 20 min'), true], [L('画一张墨竹', 'Paint a bamboo'), false], [L('给友人回信', 'Reply to a friend'), false]];
      items.forEach(([t, done], i) => {
        const y = 200 + i * 104;
        B.at(2.4 + i * 0.6, 0.6, () => {
          B.stroke([[34, y + 84], [200, y + 82], [386, y + 84]], { tone: 'qing', width: 2.4, press: 'si', dry: false });
          B.text(40, y + 46, '', { size: 21, font: 'kai', ink: done ? 'zhong' : 'jiao', lang: t });
          B.text(40, y + 72, '', { size: 13, font: 'song', ink: 'zhong', lang: done ? L('已完成', 'done') : L('今天', 'today') });
        });
        if (done) B.seal(336, y + 22, 40, '已', { at: 2.9 + i * 0.6, round: true });
      });
      B.at(5.2, 1.2, () => {
        B.raw('<path class="k-qing" d="M10 720H410" stroke="currentColor" stroke-width="1"/>', { kind: 'tag' });
        const ic = [[70, 'nong'], [160, 'dan'], [250, 'dan'], [340, 'dan']];
        B.stroke([[55, 772], [70, 752], [85, 772]], { tone: ic[0][1], width: 5, press: 'zhong', dry: false });
        P.enso(B, 160, 764, 13, { width: 4, tone: 'dan' });
        B.stroke([[238, 752], [262, 776]], { tone: 'dan', width: 5, press: 'zhong', dry: false });
        B.stroke([[262, 752], [238, 776]], { tone: 'dan', width: 5, press: 'zhong', dry: false });
        B.dot(340, 764, 16, { tone: 'dan' });
      });
    },
  },
  {
    id: 'web-hero', cat: 'ui', w: 1000, h: 600, seed: 89, motion: true, wide: true,
    title: L('网站首屏', 'A website first screen'),
    desc: L('一句话大标题用毛笔写出,一个按钮,右边一幅会动的小山水;导航和正文照常是清楚的宋体。首屏只讲一件事。', 'One sentence in brush letters, one button, a small moving landscape on the right; navigation and body stay in plain serif. The first screen says one thing.'),
    draw(B, P) {
      B.at(0.1, 0.6, () => {
        B.text(60, 64, 'inkwash', { size: 22, font: 'brush', ink: 'jiao' });
        [L('图例', 'Figures'), L('择优', 'Compare'), L('口味', 'Taste'), L('文档', 'Docs')].forEach((t, i) => B.text(560 + i * 96, 62, '', { size: 16, font: 'song', ink: 'zhong', lang: t }));
      });
      B.at(0.8, 2.2, () => {
        B.text(60, 230, '', { size: 72, font: 'brush', ink: 'jiao', lang: L('一笔一画', 'Stroke by stroke') });
        B.text(60, 300, '', { size: 72, font: 'brush', ink: 'jiao', lang: L('按场景画', 'for the scene') });
      });
      B.at(3.2, 1, () => {
        B.text(62, 360, '', { size: 18, font: 'song', ink: 'nong', lang: L('给 AI 的水墨画风指引:网页、动图、壁纸、发布会都能用。', 'An ink-wash style guide for AI: pages, motion, wallpapers, launches.') });
        P.box(B, 62, 400, 200, 64, { label: L('开始画', 'Start painting'), size: 22, weight: 'heavy', fill: 'zhusha', fillOpacity: 0.85, ink: 'paper' });
      });
      B.at(1.2, 3.4, () => {
        P.mountain(B, [[560, 520], [640, 380], [700, 300], [760, 360], [830, 260], [900, 380], [960, 520]], { tone: 'dan', ridge: 'nong', cun: 6 });
        P.pine(B, 640, 520, 150);
      }, { order: 'wash-first' });
      B.animate('0%{transform:translateX(-30px)}50%{transform:translateX(30px)}100%{transform:translateX(-30px)}', 0, 12, () => P.mist(B, 560, 400, 400, 60, { opacity: 0.7 }), { repeat: 'infinite', layer: 'art' });
      B.seal(930, 520, 44, '水墨', { at: 4.8 });
    },
  },
];
