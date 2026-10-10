// 壁纸 — wide empty paper; where the icons and the clock go stays empty.
const L = (zh, en) => ({ zh, en });

export default [
  {
    id: 'wall-desktop', cat: 'wallpaper', w: 1280, h: 800, seed: 233, motion: true, wide: true,
    title: L('桌面壁纸 16:10', 'Desktop wallpaper, 16:10'),
    desc: L('山水全压在右下,左上三分之二只有极淡的远山:桌面图标放在那里不会压到画。雾 12 秒来回移一次。导出动态版:scripts/export.mjs。', 'The landscape sits in the lower right; the upper-left two thirds hold only the faintest far hills, so desktop icons never cover the painting. Mist drifts every 12 s. Export a moving version with scripts/export.mjs.'),
    draw(B, P) {
      B.at(0.2, 2, () => P.farHills(B, 0, 470, 1280, { rows: 2, height: 60, step: 20, tone: 'qing' }), { order: 'wash-first' });
      B.at(2.4, 3, () => {
        P.mountain(B, [[640, 800], [800, 560], [900, 470], [1000, 540], [1100, 430], [1280, 640], [1280, 800]], { tone: 'dan', ridge: 'nong', cun: 10 });
        P.pine(B, 880, 800, 260); P.pine(B, 980, 810, 200);
        P.pavilion(B, 1130, 640, 110);
      }, { order: 'wash-first' });
      B.animate('0%{transform:translateX(-40px)}50%{transform:translateX(40px)}100%{transform:translateX(-40px)}', 0, 12, () => P.mist(B, 600, 600, 680, 90, { opacity: 0.7 }), { repeat: 'infinite', layer: 'art' });
      B.seal(1200, 740, 40, '卧游', { at: 5.6 });
    },
  },
  {
    id: 'wall-phone', cat: 'wallpaper', w: 540, h: 1170, seed: 239, motion: true,
    title: L('手机竖屏壁纸', 'Phone wallpaper'),
    desc: L('上面四分之一留给时间和日期,一个淡淡的月亮放在时间下面一点;一枝梅从左下伸进来;花瓣慢慢落。', 'The top quarter is left for the clock and date, a pale moon just below it; a plum branch reaches in from the lower left; petals drift down slowly.'),
    draw(B, P) {
      B.at(0.2, 1.4, () => P.moon(B, 360, 420, 56, { tone: 'qing' }));
      B.at(1.8, 3, () => P.plum(B, -20, 1170, 620, { petal: 'yanzhi' }));
      B.seal(450, 1060, 40, '疏影', { at: 5 });
      P.fall(B, { kind: 'petal', n: 16, x0: 100, x1: 540, y0: 350, y1: 1170, period: 14 });
    },
  },
];
