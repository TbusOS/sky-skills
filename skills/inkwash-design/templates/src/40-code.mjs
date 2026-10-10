// 代码大白话 — code on one side, picture on the other, on one clock.
const L = (zh, en) => ({ zh, en });

// the hash the picture uses, computed here so the caption cannot drift from it
const KEYS = ['梅', '兰', '竹', '菊', '松'];
const SLOTS = 7;
const hash = k => k.codePointAt(0) % SLOTS;
const PLACED = KEYS.map(k => ({ k, h: hash(k) }));
const COLL = PLACED.filter((p, i) => PLACED.findIndex(q => q.h === p.h) !== i);

function fact(n, out) { out.push(n); return n <= 1 ? 1 : n * fact(n - 1, out); }
const CALLS = []; const FACT4 = fact(4, CALLS);

export default [
  {
    id: 'hash-drawers', cat: 'code', w: 1000, h: 560, seed: 47, motion: true, wide: true,
    title: L('哈希表:墨点落进对应的抽屉', 'A hash table: each drop falls into its drawer'),
    desc: L(`五个字按「码点 mod ${SLOTS}」算出抽屉号,墨点落进去;${COLL.length ? COLL.map(c => '「' + c.k + '」').join('') + '和别的字算到同一个抽屉,挂在后面(链表)' : '这五个字恰好没有撞号'}。左边高亮到哪一行,右边就落到哪一滴。`, `Five characters, drawer = code point mod ${SLOTS}; each drop falls in. ${COLL.length ? COLL.map(c => c.k).join(', ') + ' lands in a drawer already taken and hangs behind it (a chain)' : 'No two collide'}. The lit line on the left and the falling drop on the right move together.`),
    draw(B, P) {
      const lines = [[['def ', 'term-key'], ['put(key):', 'term']], [['  i = ord(key) % ' + SLOTS, 'term']], [['  drawers[i].append(key)', 'term']]];
      P.codeCard(B, 30, 60, 360, lines, { size: 16, lineHeight: 30 });
      B.at(0.2, 2.2, () => {
        for (let i = 0; i < SLOTS; i++) P.box(B, 450 + i * 75, 300, 62, 70, { label: String(i), font: 'mono', size: 18, tone: 'zhong', weight: 'light', fill: 'qing', ink: 'zhong' });
      });
      const depth = {};
      PLACED.forEach((p, i) => {
        const t0 = 2.8 + i * 1.6, x = 450 + p.h * 75 + 31, lvl = depth[p.h] = (depth[p.h] || 0) + 1;
        const yEnd = lvl === 1 ? 335 : 335 + 64 * (lvl - 1) + 40;
        B.window(t0, t0 + 1.6, () => B.raw(`<rect class="k-tenghuang" x="34" y="${76 + (i % 3) * 30}" width="352" height="26" rx="3" fill="currentColor" opacity="0.28"/>`, { kind: 'tag', layer: 'art' }));
        B.at(t0, 0.3, () => B.text(100 + i * 52, 230, p.k, { size: 30, font: 'kai', ink: 'jiao', anchor: 'middle' }));
        B.follow([[t0 + 0.3, 100 + i * 52, 240], [t0 + 0.9, x, 180], [t0 + 1.4, x, yEnd]], (fx, fy) => B.dot(fx, fy, 22, { tone: lvl > 1 ? 'yanzhi' : 'nong', angle: 90 }));
        if (lvl > 1) B.at(t0 + 1.4, 0.3, () => B.stroke([[x, 372], [x, yEnd - 14]], { tone: 'yanzhi', width: 2.4, press: 'si', dry: false }));
        B.at(t0 + 1.4, 0.3, () => B.text(x, yEnd + 6, p.k, { size: 15, anchor: 'middle', ink: 'paper' }));
      });
      B.text(60, 520, '', { size: 16, ink: 'zhong', lang: L(`${KEYS.join('')} → 抽屉 ${PLACED.map(p => p.h).join(' ')}`, `drawers ${PLACED.map(p => p.h).join(' ')}`) });
      B.seal(910, 470, 44, '散列', { at: 2.8 + KEYS.length * 1.6 + 0.4, kind: 'bai' });
    },
  },
  {
    id: 'recursion-hills', cat: 'code', w: 1000, h: 560, seed: 53, motion: true, wide: true,
    title: L('递归:山里套山', 'Recursion: hills inside hills'),
    desc: L(`fact(4) 调 fact(3),一层套一层,每进一层画一座更小、更浓的山;到 fact(1) 见底,再一层层带着结果回来:1、2、6,最后 ${FACT4}。`, `fact(4) calls fact(3), and so on: each call is a smaller, darker hill inside the last; at fact(1) it bottoms out and the results climb back: 1, 2, 6, and finally ${FACT4}.`),
    draw(B, P) {
      P.codeCard(B, 30, 50, 330, [[['def ', 'term-key'], ['fact(n):', 'term']], [['  if n <= 1: ', 'term'], ['return 1', 'term-ok']], [['  return n * fact(n-1)', 'term']]], { size: 15, lineHeight: 28 });
      const tones = ['qing', 'dan', 'zhong', 'nong'], cx = 680;
      CALLS.forEach((n, i) => {
        const w = 560 - i * 120, h = 360 - i * 72, base = 500, t0 = 0.3 + i * 1.5;
        B.at(t0, 1.3, () => {
          P.mountain(B, [[cx - w / 2, base], [cx - w * 0.18, base - h * 0.8], [cx, base - h], [cx + w * 0.2, base - h * 0.75], [cx + w / 2, base]], { tone: tones[i], ridge: 'nong', ridgeWidth: 3 + i, opacity: 0.7 + i * 0.15 });
          B.text(cx, base - h + 34, `fact(${n})`, { size: 17, anchor: 'middle', font: 'mono', ink: i > 1 ? 'jiao' : 'zhong' });
        });
      });
      const back = []; let v = 1;
      for (let i = CALLS.length - 1; i >= 0; i--) { v = CALLS[i] <= 1 ? 1 : CALLS[i] * v; back.push([CALLS[i], v]); }
      back.forEach(([n, val], j) => {
        const i = CALLS.indexOf(n), h = 360 - i * 72, t = 6.6 + j * 0.9;
        B.at(t, 0.5, () => B.text(cx + 66 + (4 - i) * 4, 500 - h + 36, `= ${val}`, { size: 17, font: 'mono', ink: 'zhusha' }));
      });
      B.text(70, 250, '', { size: 16, ink: 'zhong', lang: L('往里走:调用,一层比一层小', 'going in: calls, each one smaller') });
      B.text(70, 280, '', { size: 16, ink: 'zhusha', lang: L('往外走:带着结果回来', 'coming out: results return') });
      B.seal(70, 330, 46, String(FACT4), { at: 10.4 });
    },
  },
];
