// 四季 — colouring follows the season.
const L = (zh, en) => ({ zh, en });
const title = (B, x, y, zh, en, t) => B.at(t, 0.6, () => B.text(x, y, '', { size: 56, font: 'brush', ink: 'jiao', vertical: true, lang: L(zh, en) }));

export default [
  {
    id: 'season-spring', cat: 'seasons', w: 800, h: 600, seed: 151, motion: true,
    title: L('春:桃花落', 'Spring: peach petals falling'),
    desc: L('没骨画法:桃花不勾线,胭脂直接点染;柳条几笔嫩绿;两只燕子;花瓣一直慢慢飘。', 'Boneless style: the peach blossoms have no ink outline, rouge laid straight on; a few young-green willow strands; two swallows; petals keep drifting down.'),
    draw(B, P) {
      B.at(0.2, 2.6, () => P.plum(B, 560, 260, 300, { petal: 'yanzhi', flowers: [[0.62, -0.8], [0.72, -0.37], [0.42, -1.04], [0.5, -0.6], [0.3, -0.2], [0.55, -0.42], [0.2, -0.75]] }));
      B.at(2.9, 1.8, () => { for (let i = 0; i < 6; i++) B.stroke([[120 + i * 26, 0], [110 + i * 28, 140], [130 + i * 24, 280 + i * 18]], { tone: 'shilv', width: 3.4, press: 'leaf', dry: false, wet: 0.5 }); });
      B.at(4.8, 0.8, () => [[300, 200], [360, 160]].forEach(([x, y]) => { B.stroke([[x - 20, y + 6], [x, y], [x + 22, y + 8]], { tone: 'jiao', width: 5, press: 'leaf', dry: false }); B.dot(x, y + 2, 7, { tone: 'jiao' }); }));
      title(B, 80, 330, '春', 'Spring', 5.6);
      B.seal(70, 470, 40, '桃夭', { at: 6.3 });
      P.fall(B, { kind: 'petal', n: 22, x0: 250, x1: 800, y1: 600 });
    },
  },
  {
    id: 'season-summer', cat: 'seasons', w: 800, h: 600, seed: 157, motion: true,
    title: L('夏:荷与雨', 'Summer: lotus in the rain'),
    desc: L('浓墨重绿:荷叶是大片泼墨加石绿,荷花几瓣胭脂;雨用细线斜着下,比 graphite 的雨慢。', 'Heavy ink and deep green: lotus leaves are splashed ink over malachite, the flower a few rouge petals; rain falls in fine slanting lines, slower than graphite rain.'),
    draw(B, P) {
      B.at(0.2, 2.6, () => {
        B.splash(330, 400, 120, { tone: 'shilv', sx: 1.4, sy: 0.6, opacity: 1.6 });
        B.splash(560, 450, 90, { tone: 'nong', sx: 1.5, sy: 0.55, opacity: 1.1 });
        B.splash(200, 470, 70, { tone: 'shilv', sx: 1.3, sy: 0.6, opacity: 1.3 });
        [[330, 400, 330, 600], [560, 450, 545, 600], [460, 260, 470, 600]].forEach(([x1, y1, x2, y2]) => B.stroke([[x1, y1], [x2, y2]], { tone: 'nong', width: 5, press: 'si', dry: false }));
      }, { order: 'wash-first' });
      B.at(3, 1.4, () => {
        [[-0.6, 1], [0, 1.1], [0.6, 1], [-0.3, 0.8], [0.3, 0.8]].forEach(([a, l]) => B.stroke([[460, 262], [460 + Math.sin(a) * 30 * l, 262 - Math.cos(a) * 70 * l]], { tone: 'yanzhi', width: 26, press: 'leaf', dry: false, wet: 0.7 }));
        B.dot(460, 250, 10, { tone: 'tenghuang' });
      });
      title(B, 700, 90, '夏', 'Summer', 4.6);
      B.seal(700, 300, 40, '听雨', { at: 5.3, kind: 'bai' });
      P.fall(B, { kind: 'rain', n: 70, x1: 860, y1: 600, period: 1.8 });
    },
  },
  {
    id: 'season-autumn', cat: 'seasons', w: 800, h: 600, seed: 163, motion: true,
    title: L('秋:枫叶与雁', 'Autumn: maples and geese'),
    desc: L('浅绛:山是淡赭石,枫叶点朱膘;一行雁排成人字,慢慢飞过空着的天。', 'Light ochre: pale ochre hills, maple leaves dotted in vermilion; a line of geese in a V crossing the empty sky, slowly.'),
    draw(B, P) {
      B.at(0.2, 2.4, () => {
        P.mountain(B, [[0, 520], [120, 380], [200, 330], [300, 420], [420, 520]], { tone: 'zheshi', ridge: 'zhong', cun: 4, opacity: 0.7 });
        P.mountain(B, [[300, 540], [430, 420], [520, 380], [640, 460], [800, 540]], { tone: 'dan', ridge: 'nong', cun: 4 });
      }, { order: 'wash-first' });
      B.at(2.8, 2.4, () => {
        B.stroke([[560, 600], [580, 470], [550, 380]], { tone: 'nong', width: 12, press: 'ce', load: 0.8 });
        B.stroke([[575, 480], [640, 430]], { tone: 'nong', width: 6, press: 'zhong' });
        for (let i = 0; i < 14; i++) B.dot(520 + B.rnd(0, 150), 350 + B.rnd(0, 110), B.rnd(10, 17), { tone: i % 4 ? 'zhubiao' : 'zhusha', angle: B.rnd(0, 360), wet: 0.8 });
      });
      const geese = [[0, 0], [-26, 16], [-52, 32], [26, 16], [52, 32], [-78, 48]];
      B.track([[5.4, -360, 60], [17.4, 160, -40]], () => geese.forEach(([dx, dy]) => B.stroke([[300 + dx - 9, 150 + dy + 3], [300 + dx, 150 + dy], [300 + dx + 9, 150 + dy + 3]], { tone: 'nong', width: 3, press: 'leaf', dry: false })), { repeat: 'infinite' });
      title(B, 90, 90, '秋', 'Autumn', 5.2);
      B.seal(80, 300, 40, '霜叶', { at: 5.9 });
    },
  },
  {
    id: 'season-winter', cat: 'seasons', w: 800, h: 600, seed: 167, motion: true,
    title: L('冬:雪与梅', 'Winter: snow and plum'),
    desc: L('冬天留白当雪:山只画阴面,树枝上面空着一道就是积雪;一枝红梅是全图唯一的颜色;雪一直落。', 'In winter the paper is the snow: hills inked only on their shaded side, a bare strip along each branch is the snow on it; one red plum branch is the only colour; snow keeps falling.'),
    draw(B, P) {
      B.at(0.2, 2.4, () => {
        P.mountain(B, [[0, 360], [140, 220], [220, 170], [330, 260], [460, 360]], { tone: 'qing', ridge: 'zhong', cun: 6, opacity: 0.5 });
        P.mountain(B, [[380, 380], [520, 260], [600, 230], [700, 300], [800, 380]], { tone: 'qing', ridge: 'zhong', cun: 4, opacity: 0.4 });
      }, { order: 'wash-first' });
      B.at(2.8, 2.6, () => P.plum(B, 120, 600, 380, { petal: 'zhusha' }));
      title(B, 690, 100, '冬', 'Winter', 5.6);
      B.seal(690, 320, 40, '暗香', { at: 6.3 });
      P.fall(B, { kind: 'snow', n: 70, x1: 800, y1: 600 });
    },
  },
];
