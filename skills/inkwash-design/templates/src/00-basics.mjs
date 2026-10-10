// 笔墨基础 — the four figures that show the material itself.
const tones = [
  ['jiao', '焦', 'burnt', '最要紧的一笔', 'the stroke that matters most'],
  ['nong', '浓', 'thick', '主体轮廓', 'main outlines'],
  ['zhong', '重', 'heavy', '次要轮廓', 'secondary outlines'],
  ['dan', '淡', 'light', '远处、基础设施', 'far things, infrastructure'],
  ['qing', '清', 'clear', '最远的山、雾', 'farthest hills, mist'],
];

// the same mountain, four ways of colouring
function hill(B, P, ox, oy, mode) {
  const far = [[ox - 10, oy + 150], [ox + 30, oy + 92], [ox + 70, oy + 70], [ox + 112, oy + 98], [ox + 150, oy + 84], [ox + 210, oy + 150]];
  const near = [[ox + 10, oy + 170], [ox + 50, oy + 80], [ox + 88, oy + 32], [ox + 120, oy + 70], [ox + 150, oy + 118], [ox + 190, oy + 170]];
  if (mode === 'mo') {
    P.mountain(B, far, { tone: 'qing', ridge: 'dan' });
    P.mountain(B, near, { tone: 'dan', ridge: 'nong', ridgeWidth: 5, cun: 5 });
  } else if (mode === 'qianjiang') {
    P.mountain(B, far, { tone: 'huaqing', ridge: 'dan', opacity: 0.55 });
    P.mountain(B, near, { tone: 'zheshi', ridge: 'nong', ridgeWidth: 5, cun: 5, opacity: 0.8 });
  } else if (mode === 'qinglv') {
    P.mountain(B, far, { tone: 'shiqing', ridge: 'zhong', opacity: 1.2 });
    P.mountain(B, near, { tone: 'shilv', ridge: 'nong', ridgeWidth: 5, cun: 4, opacity: 1.6 });
    B.wash([[ox + 60, oy + 60], [ox + 88, oy + 34], [ox + 116, oy + 66]], { tone: 'shiqing', layers: 2, opacity: 1.6 });
  } else {
    // 没骨 boneless: no outline at all, colour laid straight on
    B.wash(far, { tone: 'huaqing', layers: 3, opacity: 1 });
    B.wash(near, { tone: 'shilv', layers: 4, opacity: 1.5 });
    B.splash(ox + 150, oy + 40, 16, { tone: 'zhubiao', opacity: 1.6 });
  }
}

export default [
  {
    id: 'ink-tones', cat: 'basics', w: 960, h: 380, seed: 5, motion: true,
    title: { zh: '墨分五色', en: 'Five tones of one ink' },
    desc: { zh: '焦、浓、重、淡、清,同一锭墨兑不同的水。层级靠浓淡:最要紧的一笔用焦墨,远处和背景用淡墨、清墨。写字只用焦、浓两档。', en: 'Burnt, thick, heavy, light, clear: one ink, different amounts of water. Hierarchy comes from depth — the key stroke in burnt ink, far things in light and clear. Words only in the two darkest.' },
    draw(B) {
      B.at(0.2, 4.2, () => {
        tones.forEach(([t], i) => {
          const x = 70 + i * 176;
          B.stroke([[x, 138], [x + 46, 118], [x + 100, 124], [x + 138, 146]], { tone: t, width: 44, press: 'zhong', load: 0.96 - i * 0.04, wet: 0.6 });
        });
      });
      B.at(4.5, 2.2, () => {
        tones.forEach(([, zh, en, nzh, nen], i) => {
          const x = 138 + i * 176;
          B.text(x, 226, zh, { size: 46, anchor: 'middle', font: 'brush', ink: 'jiao' });
          B.text(x, 262, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: { zh: nzh, en: en + ' · ' + nen } });
        });
      });
      B.text(70, 330, '', { size: 15, ink: 'zhong', lang: { zh: '字只用焦、浓两档:与纸的对比度 ≥ 4.5:1', en: 'Text only in the two darkest tones: ≥ 4.5:1 against the paper' } });
      B.seal(866, 300, 46, '五色', { at: 7 });
    },
  },
  {
    id: 'three-brushes', cat: 'basics', w: 960, h: 420, seed: 11, motion: true,
    title: { zh: '三种笔:提按 · 飞白 · 晕染', en: 'Three brush effects: pressure, dry brush, bleed' },
    desc: { zh: '提按:起笔斜切按下,行笔略提,收笔出锋。飞白:墨少了笔毛分开,白丝出在笔画里面,边上的毛先断。晕染:一笔落定后墨往纸里渗开。', en: 'Pressure: a slanted press, a lighter run, a pointed exit. Dry brush: as ink runs out the hairs part and white streaks open inside the stroke, edge hairs first. Bleed: once a stroke lands, ink creeps into the paper.' },
    draw(B) {
      B.at(0.2, 2.4, () => {
        B.stroke([[60, 150], [140, 110], [230, 128], [300, 182]], { tone: 'jiao', width: 34, press: 'zhong', load: 1, wet: 0.35, dry: false });
      });
      B.at(2.8, 2.2, () => {
        B.stroke([[360, 120], [470, 108], [580, 132], [640, 150]], { tone: 'jiao', width: 40, press: 'ce', load: 0.62, wet: 0.2 });
      });
      B.at(5.2, 1.6, () => {
        B.stroke([[700, 150], [780, 112], [880, 140]], { tone: 'nong', width: 30, press: 'leaf', load: 1, wet: 1.4, dry: false });
        B.dot(760, 196, 18, { tone: 'nong', wet: 1.4 });
        B.dot(820, 204, 12, { tone: 'dan', wet: 1.4 });
      });
      const lab = [[180, '提按', 'press and lift', '起笔重 · 行笔轻 · 收笔出锋', 'heavy start, light run, pointed exit'],
        [500, '飞白', 'dry brush', '墨少了笔毛分开,露出纸白', 'hairs part as ink runs out'],
        [790, '晕染', 'bleed', '落定后,墨往纸里渗', 'ink creeps into the paper']];
      B.at(7.4, 1.6, () => {
        lab.forEach(([x, zh, en, nzh, nen]) => {
          B.text(x, 300, '', { size: 40, anchor: 'middle', font: 'brush', ink: 'jiao', lang: { zh, en } });
          B.text(x, 338, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: { zh: nzh, en: nen } });
        });
      });
      B.seal(880, 360, 38, '笔', { at: 9.2, kind: 'bai' });
    },
  },
  {
    id: 'seals', cat: 'basics', w: 960, h: 400, seed: 17, motion: true,
    title: { zh: '印章:朱文 · 白文 · 盖印', en: 'Seals: red text, white text, stamping' },
    desc: { zh: '一方朱印是画面的句号。朱文是红字,白文是红底留出纸色的字;边缘蚀出残缺才像石头刻的。盖印:印落下、颜色压实。', en: 'A red seal is the full stop of a picture. Red-text seals carve the characters; white-text seals carve the ground. A chipped edge reads as stone. Stamping: the seal lands and the colour presses in.' },
    draw(B, P) {
      B.at(0.2, 2.6, () => {
        P.orchid(B, 492, 330, 120);
      });
      B.seal(130, 120, 92, '水墨', { at: 3.2 });
      B.seal(300, 120, 92, '天地', { at: 3.8, kind: 'bai' });
      B.seal(620, 130, 80, '墨', { at: 4.4, round: true });
      B.seal(760, 112, 104, '越用越懂', { at: 5.0, kind: 'bai' });
      B.at(5.8, 1.6, () => {
        [[176, '朱文', 'red text'], [346, '白文', 'white text'], [660, '圆印', 'round'], [812, '四字印', 'four characters']].forEach(([x, zh, en]) => {
          B.text(x, 268, '', { size: 30, anchor: 'middle', font: 'brush', ink: 'jiao', lang: { zh, en } });
        });
        B.text(480, 368, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: { zh: '一张画至少一方印,放在留白处,当句号', en: 'At least one seal per picture, in the empty paper, as its full stop' } });
      });
    },
  },
  {
    id: 'four-palettes', cat: 'basics', w: 1000, h: 420, seed: 23, motion: true, wide: true,
    title: { zh: '同一座山,四种设色', en: 'One mountain, four ways of colouring' },
    desc: { zh: '水墨不一定是黑白的。纯水墨只有墨和印;浅绛加淡赭石、淡花青;青绿用石青石绿,颜色重;没骨不勾墨线,颜色直接泼染。', en: 'Ink wash need not be black and white. Pure ink: ink and a seal. Light-ochre: pale ochre and indigo. Blue-green: heavy azurite and malachite. Boneless: no ink outline, colour laid straight on.' },
    draw(B, P) {
      const modes = [['mo', '纯水墨', 'pure ink'], ['qianjiang', '浅绛', 'light ochre'], ['qinglv', '青绿', 'blue-green'], ['mogu', '没骨', 'boneless']];
      modes.forEach(([m, zh, en], i) => {
        const ox = 40 + i * 240;
        B.at(0.3 + i * 2.2, 2.0, () => hill(B, P, ox, 70, m), { order: m === 'mogu' ? 'wash-first' : undefined });
        B.text(ox + 100, 300, '', { size: 34, anchor: 'middle', font: 'brush', ink: 'jiao', lang: { zh, en } });
      });
      B.text(500, 372, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: { zh: '同一种颜色在一张图里只代表一件事;颜色种类少于要讲的事', en: 'One colour means one thing in a picture; fewer colours than things to say' } });
      B.seal(930, 330, 40, '设色', { at: 9 });
    },
  },
];
