// 山水 — far is pale, near is dark; water and sky unpainted; mist drifts slowly.
const L = (zh, en) => ({ zh, en });

export default [
  {
    id: 'scroll-pingyuan', cat: 'landscape', w: 1200, h: 480, seed: 173, motion: true, wide: true,
    title: L('平远横卷:镜头横移', 'A level-distance handscroll: the camera pans'),
    desc: L('横卷是边走边看的:整幅比画框宽一半,画完后镜头 16 秒一个来回慢慢横移;远山淡、近岸浓,中间一大片水不画。', 'A handscroll is read while moving: the painting is half again as wide as the frame, and once painted the camera pans across and back every 16 s; far hills pale, near banks dark, a wide river left unpainted.'),
    draw(B, P) {
      B.animate('0%{transform:translateX(0)}50%{transform:translateX(-560px)}100%{transform:translateX(0)}', 9, 16, () => {
        B.at(0.2, 2.4, () => P.farHills(B, 0, 260, 1760, { rows: 2, height: 70, step: 24 }), { order: 'wash-first' });
        B.at(2.8, 2.8, () => {
          P.mountain(B, [[0, 420], [80, 300], [160, 270], [250, 340], [330, 420]], { tone: 'dan', ridge: 'nong', cun: 6 });
          P.pine(B, 120, 420, 160); P.pine(B, 210, 425, 120);
          P.rock(B, 330, 440, 90);
        }, { order: 'wash-first' });
        B.at(5.8, 1.6, () => { P.water(B, 420, 380, 500, { lines: 3 }); P.boat(B, 700, 360, 80); });
        B.at(7.6, 1.4, () => {
          P.mountain(B, [[1200, 430], [1300, 320], [1380, 280], [1480, 360], [1560, 330], [1700, 430]], { tone: 'dan', ridge: 'nong', cun: 6 });
          P.pavilion(B, 1420, 410, 90);
          P.bridge(B, 1080, 440, 140);
        }, { order: 'wash-first' });
      }, { layer: 'all', repeat: 'infinite', ease: 'ease-in-out' });
      B.seal(1130, 40, 40, '平远', { at: 9 });
    },
  },
  {
    id: 'scroll-gaoyuan', cat: 'landscape', w: 600, h: 960, seed: 179, motion: true,
    title: L('高远竖轴:瀑布', 'A high-distance hanging scroll: a waterfall'),
    desc: L('竖轴从山脚仰望山顶:主峰压满上半幅,一道瀑布从两崖之间落下,白练不画,只画两边的崖;水一直往下流;山脚一个小小的书生。', 'A hanging scroll looks up from the foot: the main peak fills the top half, a waterfall drops between two cliffs — the water is the unpainted gap, only the cliffs are inked — and keeps flowing; a tiny scholar at the foot.'),
    draw(B, P) {
      B.at(0.2, 3, () => {
        P.mountain(B, [[0, 560], [80, 300], [180, 120], [260, 60], [340, 140], [430, 280], [600, 520]], { tone: 'dan', ridge: 'nong', cun: 10 });
        P.farHills(B, 0, 200, 600, { rows: 1, height: 50 });
      }, { order: 'wash-first' });
      // two cliffs; the fall is the unpainted gap between their inner edges
      B.at(3.4, 2.4, () => {
        B.wash([[60, 860], [120, 520], [200, 400], [292, 380], [296, 600], [290, 860]], { tone: 'zhong', layers: 3, dir: 'down' });
        B.wash([[330, 860], [326, 600], [332, 390], [420, 420], [500, 540], [560, 860]], { tone: 'zhong', layers: 3, dir: 'down' });
        B.stroke([[292, 380], [296, 520], [292, 700], [296, 860]], { tone: 'jiao', width: 12, press: 'ce', load: 0.8 });
        B.stroke([[332, 390], [326, 540], [330, 700], [328, 860]], { tone: 'jiao', width: 12, press: 'ce', load: 0.8 });
        for (let i = 0; i < 8; i++) { const lx = i < 4 ? 160 + i * 30 : 360 + (i - 4) * 36, ly = 480 + (i % 4) * 80; B.stroke([[lx, ly], [lx - 8, ly + 40]], { tone: 'nong', width: 4, press: 'ce', load: 0.5 }); }
        P.pine(B, 150, 560, 160); P.pine(B, 470, 600, 140);
      });
      // the fall: a narrow band of moving pale dashes between the cliffs
      B.raw('<path class="flow" style="stroke:var(--ink-qing);stroke-width:5;animation-duration:1.2s" d="M300 380 L302 520 L306 680 L308 820"/><path class="flow" style="stroke:var(--ink-qing);stroke-width:3" d="M316 380 L318 520 L320 680 L322 820"/>', { kind: 'tag' });
      B.at(5.9, 1.2, () => { P.mist(B, 0, 820, 600, 80, { opacity: 0.8 }); P.scholar(B, 400, 900, 70); });
      B.seal(520, 40, 40, '高远', { at: 7.3 });
    },
  },
  {
    id: 'qinglv-shanshui', cat: 'landscape', w: 1000, h: 600, seed: 181, motion: true, wide: true,
    title: L('青绿山水', 'Blue-green landscape'),
    desc: L('青绿设色:山先勾墨线,再上石青、石绿,颜色重;山腰几道泥金雾;亭子和桥点在中景。这是设色最重的一种,适合发布会和壁纸。', 'Blue-green colouring: ink outlines first, then heavy azurite and malachite; a few gold mist bands across the slopes; a pavilion and a bridge in the middle distance. The heaviest colouring of the four — for launches and wallpapers.'),
    draw(B, P) {
      B.at(0.2, 2.6, () => {
        P.mountain(B, [[0, 560], [120, 300], [210, 180], [300, 280], [420, 560]], { tone: 'shiqing', ridge: 'nong', cun: 6, opacity: 1.5 });
        P.mountain(B, [[300, 560], [450, 320], [560, 220], [680, 300], [800, 260], [1000, 560]], { tone: 'shilv', ridge: 'nong', cun: 8, opacity: 1.6 });
      }, { order: 'wash-first' });
      B.at(3, 1.4, () => {
        [[60, 380, 380], [420, 420, 560]].forEach(([x, y, w]) => B.wash([[x, y + 20], [x + 40, y], [x + w * 0.5, y + 6], [x + w, y + 2], [x + w + 40, y + 22]], { tone: 'gold', layers: 2, dir: 'flat', jitter: 6, opacity: 0.8 }));
      });
      B.at(4.6, 1.8, () => { P.pavilion(B, 560, 430, 90); P.bridge(B, 640, 520, 160); P.water(B, 400, 540, 500, { lines: 2, tone: 'huaqing' }); });
      B.animate('0%{transform:translateX(-24px)}50%{transform:translateX(24px)}100%{transform:translateX(-24px)}', 0, 10, () => P.mist(B, 100, 300, 800, 60, { opacity: 0.6 }), { repeat: 'infinite', layer: 'art' });
      B.seal(920, 40, 44, '青绿', { at: 6.6 });
    },
  },
];
