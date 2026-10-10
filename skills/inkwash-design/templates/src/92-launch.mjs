// 发布会 — one sentence per screen, an ink-splash reveal, huge brush letters.
const L = (zh, en) => ({ zh, en });
// the five fixed elements; the big number on the second slide is this list's length
const FIVE = [L('宣纸', 'rice paper'), L('水墨', 'ink & water'), L('提按', 'press & lift'), L('留白', 'empty paper'), L('印章', 'a seal')];

export default [
  {
    id: 'launch-splash', cat: 'launch', w: 1280, h: 720, seed: 241, motion: true, wide: true, paper: 'dark',
    title: L('泼墨揭幕', 'An ink-splash reveal'),
    desc: L('磁青纸上一团泥金泼开,扩到半屏停住,然后一笔写出产品名。发布会一屏只讲一件事。', 'On indigo paper a splash of gold spreads to half the screen and stops; then the product name is written in one go. One thing per screen.'),
    draw(B, P) {
      B.animate('from{transform:scale(0.05);opacity:0.2}to{transform:scale(1);opacity:1}', 0.2, 1.6, () => {
        B.splash(420, 360, 260, { tone: 'jiao', sx: 1.2, sy: 0.9, opacity: 1.4 });
        B.splash(300, 300, 120, { tone: 'nong', opacity: 1.2 });
      }, { origin: '420px 360px', ease: 'cubic-bezier(.2,.9,.3,1)', layer: 'art' });
      B.at(1.9, 1.2, () => B.stroke([[160, 560], [500, 520], [900, 540], [1120, 520]], { tone: 'jiao', width: 26, press: 'ce', load: 0.6 }));
      B.at(3.2, 1.4, () => B.text(880, 330, '', { size: 150, anchor: 'middle', font: 'xing', ink: 'jiao', lang: L('水墨', 'Ink') }));
      B.at(4.8, 0.8, () => B.text(880, 430, '', { size: 28, anchor: 'middle', font: 'song', ink: 'nong', lang: L('给 AI 的水墨画风指引', 'An ink-wash style guide for AI') }));
      B.seal(1140, 600, 64, '首发', { at: 5.8 });
    },
  },
  {
    id: 'launch-number', cat: 'launch', w: 1280, h: 720, seed: 251, motion: true, wide: true,
    title: L('一屏一个巨大的书法数字', 'One huge brush numeral per screen'),
    desc: L(`一屏只放一个数:${FIVE.length}。下面一行小字说它是什么 —— 只定死${FIVE.map(f => f.zh).join('、')}这 ${FIVE.length} 样,其余都按场景放开。数字由这五样的清单长度算出。`, `One number per screen: ${FIVE.length}. One small line says what it is — only ${FIVE.length} things are fixed (${FIVE.map(f => f.en).join(', ')}), everything else follows the scene. The number is the length of that list.`),
    draw(B, P) {
      B.at(0.2, 1.6, () => B.text(640, 470, String(FIVE.length), { size: 420, anchor: 'middle', font: 'brush', ink: 'jiao' }));
      B.at(1.9, 0.8, () => B.stroke([[440, 540], [640, 532], [840, 540]], { tone: 'zhusha', width: 10, press: 'zhong', load: 0.8 }));
      B.at(2.8, 1.4, () => B.text(640, 610, '', { size: 30, anchor: 'middle', font: 'song', ink: 'nong', lang: L(`只定死 ${FIVE.length} 样:${FIVE.map(f => f.zh).join(' · ')}`, `Only ${FIVE.length} things are fixed: ${FIVE.map(f => f.en).join(' · ')}`) }));
      B.seal(1160, 70, 56, '五样', { at: 4.3, kind: 'bai' });
    },
  },
  {
    id: 'launch-keynote', cat: 'launch', w: 1280, h: 720, seed: 257, motion: true, wide: true, paper: 'dark',
    title: L('磁青泥金 keynote 页', 'An indigo-and-gold keynote slide'),
    desc: L('标题一行毛笔字,三个要点各配一笔画成的小图标(笔、山、印),一道泥金线分开标题和正文;颜色只有泥金和一方朱印。', 'A brush-lettered title, three points each with a one-stroke icon (brush, hill, seal), one gold line between title and body; only gold and one red seal.'),
    draw(B, P) {
      B.at(0.2, 1.2, () => B.text(120, 190, '', { size: 76, font: 'brush', ink: 'jiao', lang: L('越用越懂你', 'It learns your taste') }));
      B.at(1.6, 0.8, () => B.stroke([[120, 240], [600, 232], [1160, 240]], { tone: 'nong', width: 6, press: 'zhong', load: 0.7 }));
      const pts = [L('按场景分开记:技术图爱淡,壁纸爱浓', 'Per scene: faint for diagrams, heavy for wallpapers'), L('看一张你喜欢的画,量出留白和设色', 'Show it a picture you like; it measures space and colour'), L('点开画上的小印,看它为什么这样画', 'Click the little seal to see why it drew it so')];
      pts.forEach((t, i) => B.at(2.6 + i * 1.2, 1, () => {
        const y = 340 + i * 110;
        if (i === 0) B.stroke([[140, y - 30], [170, y - 10], [180, y + 20]], { tone: 'jiao', width: 14, press: 'zhong' });
        if (i === 1) P.mountain(B, [[130, y + 20], [160, y - 20], [175, y - 30], [200, y + 20]], { tone: 'nong', ridge: 'jiao' });
        if (i === 2) B.raw(`<rect class="k-zhusha" x="140" y="${y - 30}" width="44" height="44" rx="3" fill="currentColor"/>`, { kind: 'wash', len: 20 });
        B.text(240, y + 4, '', { size: 34, font: 'song', ink: 'jiao', lang: t });
      }));
      B.seal(1120, 600, 60, '懂你', { at: 6.4 });
    },
  },
];
