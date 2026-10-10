// 物件 — things painted often, each drawn stroke by stroke by assets/props.js.
const L = (zh, en) => ({ zh, en });

export default [
  {
    id: 'four-gentlemen', cat: 'props', w: 1100, h: 520, seed: 113, motion: true, wide: true,
    title: L('梅兰竹菊松', 'Plum, orchid, bamboo, chrysanthemum, pine'),
    desc: L('四君子加一棵松,每样都是 props.js 里一个函数:竹竿分节、节处一笔,竹叶一笔一片;兰叶细粗细交叉一次;梅花五点胭脂;菊瓣短笔围一圈;松针扇形排开。', 'The four gentlemen plus a pine, each one function in props.js: bamboo in segments with a stroke at each node and one stroke per leaf; orchid leaves thin–thick–thin crossing once; plum blossoms five rouge dots; chrysanthemum petals short strokes in rings; pine needles fanned out.'),
    draw(B, P) {
      const items = [
        [110, L('梅', 'plum'), () => P.plum(B, 60, 420, 280)],
        [320, L('兰', 'orchid'), () => P.orchid(B, 330, 420, 180)],
        [540, L('竹', 'bamboo'), () => P.bamboo(B, 540, 430, 340, { segs: 5, leaves: 3 })],
        [760, L('菊', 'chrysanthemum'), () => P.chrysanthemum(B, 760, 430, 260)],
        [980, L('松', 'pine'), () => P.pine(B, 970, 430, 320)],
      ];
      items.forEach(([x, lab, fn], i) => {
        B.at(0.2 + i * 2.4, 2.2, fn);
        B.at(2.2 + i * 2.4, 0.4, () => B.text(x, 482, '', { size: 34, anchor: 'middle', font: 'brush', ink: 'jiao', lang: lab }));
      });
      B.seal(1030, 40, 40, '君子', { at: 12.4 });
    },
  },
  {
    id: 'landscape-pieces', cat: 'props', w: 1100, h: 520, seed: 127, motion: true, wide: true,
    title: L('山石 · 水 · 云 · 舟 · 亭 · 桥', 'Rock, water, cloud, boat, pavilion, bridge'),
    desc: L('山水画里反复出现的几样:山先铺淡墨再勾脊、加几笔皴;石头侧锋勾轮廓、点苔;水只画几道断开的细纹;云一笔回旋;舟、亭、桥都只要四五笔。', 'The pieces a landscape keeps using: a hill is a pale wash, then a ridge and a few texture strokes; a rock is side-tip outline plus moss dots; water is a few broken lines; a cloud one curling stroke; a boat, a pavilion, a bridge four or five strokes each.'),
    draw(B, P) {
      B.at(0.2, 2.6, () => P.mountain(B, [[40, 300], [110, 170], [170, 110], [230, 190], [290, 300]], { tone: 'dan', ridge: 'nong', cun: 6 }), { order: 'wash-first' });
      B.at(2.8, 1.6, () => P.rock(B, 420, 300, 180));
      B.at(4.4, 1.4, () => P.water(B, 560, 220, 220, { lines: 4 }));
      B.at(5.8, 1.2, () => { P.cloud(B, 900, 150, 160); P.cloud(B, 980, 200, 110); });
      B.at(7.0, 1.4, () => P.boat(B, 160, 450, 150));
      B.at(8.4, 1.4, () => P.pavilion(B, 520, 470, 150));
      B.at(9.8, 1.2, () => P.bridge(B, 800, 470, 220));
      const lab = [[160, '山', 'hill'], [420, '石', 'rock'], [670, '水', 'water'], [940, '云', 'cloud'], [160, '舟', 'boat', 506], [520, '亭', 'pavilion', 506], [910, '桥', 'bridge', 506]];
      B.at(11.2, 1.2, () => lab.forEach(([x, zh, en, y]) => B.text(x, y || 340, '', { size: 26, anchor: 'middle', font: 'brush', ink: 'jiao', lang: L(zh, en) })));
      B.seal(1040, 40, 36, '山水', { at: 12.6, kind: 'bai' });
    },
  },
  {
    id: 'people-animals', cat: 'props', w: 1100, h: 480, seed: 131, motion: true, wide: true,
    title: L('人物剪影 · 鹤 · 鱼 · 马', 'Figures, crane, fish, horse'),
    desc: L('人物只画剪影:斗笠、披风一笔湿墨、剑一道干笔;书生长衫两笔;太极一个起势。鹤身留白只勾淡墨,丹顶一点朱砂;鱼一笔兰叶;马身侧锋一大笔。', 'People as silhouettes: a hat, a cloak in one wet stroke, a sword as one dry line; a scholar in two strokes; a taiji opening pose. The crane is pale with a dot of cinnabar on its crown; a fish is one orchid-leaf stroke; a horse one broad side-tip stroke.'),
    draw(B, P) {
      const items = [
        [110, L('侠客', 'swordsman'), () => P.swordsman(B, 110, 390, 200)],
        [290, L('书生', 'scholar'), () => P.scholar(B, 290, 390, 180)],
        [450, L('太极', 'taiji'), () => P.taiji(B, 450, 390, 190, { pose: 1 })],
        [640, L('鹤', 'crane'), () => P.crane(B, 640, 300, 200)],
        [830, L('鱼', 'fish'), () => { P.fish(B, 830, 260, 150); P.water(B, 760, 300, 150, { lines: 2, gap: 10 }); }],
        [1000, L('马', 'horse'), () => P.horse(B, 1000, 390, 200)],
      ];
      items.forEach(([x, lab, fn], i) => {
        B.at(0.2 + i * 1.6, 1.4, fn);
        B.at(1.5 + i * 1.6, 0.3, () => B.text(x, 450, '', { size: 28, anchor: 'middle', font: 'brush', ink: 'jiao', lang: lab }));
      });
      B.seal(40, 30, 36, '形', { at: 10 });
    },
  },
];
