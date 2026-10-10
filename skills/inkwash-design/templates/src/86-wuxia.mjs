// 武侠 · 太极 — splashed ink, burnt-ink contrast; a blade's flash is dry brush.
const L = (zh, en) => ({ zh, en });

export default [
  {
    id: 'bamboo-duel', cat: 'wuxia', w: 1000, h: 600, seed: 191, motion: true, wide: true,
    title: L('竹林对决:刀光一道飞白', 'A duel in the bamboo: one flash of dry brush'),
    desc: L('竹林泼墨,两个剪影隔着一片空地对立;最后一刀用一笔含墨极少的长笔,整道都是飞白;竹叶被刀风切落,一直飘。', 'Splashed-ink bamboo, two silhouettes facing across an empty clearing; the final cut is one long stroke with almost no ink, all dry brush; bamboo leaves cut by the blade keep drifting down.'),
    draw(B, P) {
      B.at(0.2, 3, () => {
        [[60, 'dan'], [140, 'zhong'], [860, 'zhong'], [940, 'dan'], [30, 'qing'], [980, 'qing']].forEach(([x, t], i) => P.bamboo(B, x, 640, 620, { segs: 6, tone: t, leaves: i < 4 ? 2 : 0, lean: (i % 2 ? -1 : 1) * 0.03 }));
      });
      B.at(3.4, 1.6, () => { P.swordsman(B, 330, 520, 220, { facing: 1 }); P.swordsman(B, 680, 520, 230, { facing: -1 }); });
      B.at(5.2, 0.35, () => B.stroke([[180, 380], [420, 300], [700, 230], [880, 200]], { tone: 'jiao', width: 22, press: 'ce', load: 0.42, wet: 0.1 }));
      B.at(5.7, 0.8, () => B.text(500, 110, '', { size: 64, anchor: 'middle', font: 'xing', ink: 'jiao', lang: L('一剑', 'One cut') }));
      B.seal(900, 520, 44, '侠', { at: 6.6 });
      P.fall(B, { kind: 'petal', tone: 'nong', n: 18, x0: 200, x1: 900, y1: 600, period: 7 });
    },
  },
  {
    id: 'rain-swordsman', cat: 'wuxia', w: 800, h: 600, seed: 193, motion: true,
    title: L('雨夜剑客', 'A swordsman on a rainy night'),
    desc: L('焦墨剪影站在雨里,一盏灯笼是全图唯一的暖色;城墙、塔用淡墨推远;雨一直斜着下。', 'A burnt-ink silhouette standing in the rain, one lantern the only warm colour; a city wall and pagoda pushed back in pale ink; the rain keeps slanting down.'),
    draw(B, P) {
      B.at(0.2, 2.2, () => {
        B.wash([[0, 420], [0, 330], [800, 340], [800, 420]], { tone: 'qing', layers: 2, dir: 'down' });
        [[540, 330, 60], [560, 260, 46], [575, 200, 34]].forEach(([x, y, w]) => B.stroke([[x - w, y], [x, y - 20], [x + w, y]], { tone: 'dan', width: 6, press: 'zhong', dry: false }));
        B.stroke([[575, 340], [575, 180]], { tone: 'dan', width: 10, press: 'ce', dry: false });
      }, { order: 'wash-first' });
      B.at(2.6, 1.6, () => P.swordsman(B, 260, 560, 300, { facing: 1 }));
      B.at(4.3, 0.8, () => { B.stroke([[120, 330], [120, 380]], { tone: 'zhong', width: 2, press: 'si', dry: false }); B.dot(120, 400, 26, { tone: 'zhubiao', angle: 90, wet: 1.3 }); });
      B.at(5.2, 0.8, () => B.text(700, 90, '', { size: 46, font: 'xing', ink: 'jiao', vertical: true, lang: L('夜雨', 'Night rain') }));
      B.seal(640, 520, 40, '江湖', { at: 6.1, kind: 'bai' });
      P.fall(B, { kind: 'rain', n: 90, x1: 900, y1: 600, period: 1.6 });
    },
  },
  {
    id: 'taiji-forms', cat: 'wuxia', w: 1000, h: 560, seed: 197, motion: true, wide: true,
    title: L('太极:阴阳一笔,四式连贯', 'Taiji: yin-yang in one stroke, four forms in a row'),
    desc: L('左边阴阳鱼:一个圆相、一道 S 形、两点,三笔画完;右边一个人连着打四式:起势、单鞭、云手、收势,每式停一下,循环。', 'Left: yin-yang as one circle, one S-curve and two dots — three strokes; right: one figure moves through four forms (opening, single whip, cloud hands, closing), pausing on each, looping.'),
    draw(B, P) {
      const cx = 230, cy = 280, r = 160;
      B.at(0.2, 1.4, () => P.enso(B, cx, cy, r, { width: 18, from: -1.57, sweep: 6.2 }));
      // the dark fish: from the top along the S-curve to the bottom, back up the left half of the circle
      B.at(1.7, 1, () => {
        const S = []; for (let i = 0; i <= 24; i++) { const t = i / 24; S.push([cx + Math.sin(t * Math.PI * 2) * r * 0.5, cy - r + 2 * r * t]); }
        const left = Array.from({ length: 13 }, (_, k) => { const a = -Math.PI / 2 - Math.PI * k / 12; return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]; });
        B.wash([...S, ...left], { tone: 'nong', layers: 3, dir: 'flat', jitter: 3, opacity: 2 });
        B.stroke(S, { tone: 'jiao', width: 10, press: 'zhong', dry: false });
      });
      B.at(2.9, 0.6, () => { B.dot(cx, cy - r / 2, 22, { tone: 'paper', angle: 90 }); B.dot(cx, cy + r / 2, 22, { tone: 'nong', angle: 90 }); });
      const names = [L('起势', 'opening'), L('单鞭', 'single whip'), L('云手', 'cloud hands'), L('收势', 'closing')];
      const loop = 8;
      names.forEach((nm, i) => {
        const vis = B.keyframes(`0%{opacity:0}${i * 25}%{opacity:0}${i * 25 + 0.1}%{opacity:1}${(i + 1) * 25}%{opacity:1}${(i + 1) * 25 + 0.1}%{opacity:0}100%{opacity:0}`);
        B.group(`<g class="mv amb${i < 3 ? ' tmp' : ''}" style="animation:${vis} ${loop}s step-end 3.6s infinite both">`, () => {
          P.taiji(B, 680, 470, 300, { pose: i });
          B.text(680, 530, '', { size: 26, anchor: 'middle', font: 'brush', ink: 'jiao', lang: nm });
        });
      });
      B.seal(900, 50, 44, '太极', { at: 3.6 });
    },
  },
];
