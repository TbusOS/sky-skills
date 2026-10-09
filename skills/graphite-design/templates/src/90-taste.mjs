// Learns your taste: how graphite-design adapts to one reader. These figures are
// drawn from the real learner. assets/taste.js runs here at build time on simulated
// readers, so every value on the curves is what `scripts/taste.mjs show` would print
// for the same answers on the same dates.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Taste = require('../../assets/taste.js');
const Sketch = require('../../assets/sketch.js');

const DAY = 864e5, T0 = Date.UTC(2026, 0, 1);
const iso = d => new Date(T0 + d * DAY).toISOString();
const r3 = v => Math.round(v * 1000) / 1000;
const fx = (v, n = 2) => Number(v).toFixed(n);

// ── one knob, one reader ────────────────────────────────────────────────
// The reader wants sparse colouring (hatchGap 5.5). Each question shows the current
// value ± 2 steps, the pair `taste.mjs ab` shows; the reader picks the side closer to
// what they want. One sentence and one reviewer note on the way, then 100 days of
// not using it, and by then they want 4.2.
const CONV = (() => {
  const K = 'hatchGap', step = Taste.KNOBS[K].step, ev = [], rows = [];
  let d = 0;
  const est = day => Taste.estimate(ev, T0 + day * DAY).knobs[K];
  function pick(want) {
    d += 3;
    const before = est(d), lo = r3(before - 2 * step), hi = r3(before + 2 * step);
    const win = Math.abs(lo - want) < Math.abs(hi - want) ? lo : hi;
    ev.push({ ts: iso(d), ...Taste.pick(K, win, win === lo ? hi : lo) });
    rows.push({ kind: 'pick', d, before, lo, hi, win, est: est(d), want });
  }
  function say(text, want) {
    d += 2; const before = est(d);
    ev.push({ ts: iso(d), ...Taste.say(text) });
    rows.push({ kind: 'say', d, before, note: text, est: est(d), want });
  }
  function review(text, want) {
    d += 1; const before = est(d), p = Taste.parse(text);
    ev.push({ ts: iso(d), kind: 'review', dir: p.dir, note: 'critic: ' + text });
    rows.push({ kind: 'review', d, before, note: text, est: est(d), want });
  }
  const A = 5.5, B = 4.2;
  for (let i = 0; i < 4; i++) pick(A);
  say('还是太密了', A);
  for (let i = 0; i < 3; i++) pick(A);
  review('too busy', A);
  pick(A);
  const split = rows.length;            // the long break comes after this many events
  d += 97;                              // + the 3 days a pick adds = a 100-day break
  for (let i = 0; i < 7; i++) pick(B);
  return { K, rows, split, A, B, def: Taste.KNOBS[K].def, gapDays: rows[split].d - rows[split - 1].d,
    // the estimate during the break, with no new events: old answers fade
    fade: Array.from({ length: 9 }, (_, j) => { const day = rows[split - 1].d + (rows[split].d - rows[split - 1].d) * j / 8; return Taste.estimate(ev.filter(e => Date.parse(e.ts) <= T0 + rows[split - 1].d * DAY), T0 + day * DAY).knobs[K]; }) };
})();
const C1 = CONV.rows[CONV.split - 1], CEND = CONV.rows[CONV.rows.length - 1];

// ── three readers, same drawing ─────────────────────────────────────────
// Each reader says two things, then answers 60 questions chosen by Taste.ab (the knob
// the learner is least sure about). Their answers come from what they want.
const READERS = [
  { id: 'clean', zh: '读者甲 · 喜欢干净', en: 'Reader A · likes it clean', words: ['太乱了', '太密了'],
    want: { rough: 0.55, warp: 1, hatchGap: 5.8, hatchOpacity: 0.4, lineWeight: 1.6, grain: 0.2, washOpacity: 0.12 } },
  { id: 'house', zh: '出厂默认', en: 'House default', words: [], want: null },
  { id: 'bold', zh: '读者乙 · 喜欢手感重', en: 'Reader B · likes it heavy', words: ['太死板了,像打印的', '太淡了'],
    want: { rough: 1.6, warp: 4, hatchGap: 2.8, hatchOpacity: 0.78, lineWeight: 2.7, grain: 0.85, washOpacity: 0.32 } },
];
const ROUNDS = 60;
READERS.forEach(r => {
  const ev = []; let d = 0;
  r.words.forEach(w => { d += 1; ev.push({ ts: iso(d), ...Taste.say(w) }); });
  if (r.want) for (let i = 0; i < ROUNDS; i++) {
    d += 1;
    const q = Taste.ab(ev, T0 + d * DAY), k = q.knob, [lo, hi] = q.values, tv = r.want[k] ?? Taste.KNOBS[k].def;
    const win = Math.abs(lo - tv) <= Math.abs(hi - tv) ? lo : hi;
    ev.push({ ts: iso(d), ...Taste.pick(k, win, win === lo ? hi : lo) });
  }
  r.taste = Taste.estimate(ev, T0 + d * DAY);
  r.apply = Taste.apply(r.taste);
});

export default [
  {
    id: 'taste-loop', cat: 'taste', w: 840, h: 500, seed: 91, motion: true,
    title: { zh: '越用越懂你 · 一圈是怎么转的', en: 'Learns your taste · how the loop turns' },
    desc: { zh: `你的每个反应记一行日志:二选一和说一句各算 ${Taste.WEIGHT.pick} 份,留下或删掉算 ${Taste.WEIGHT.keep} 份,审查器的意见算 ${Taste.WEIGHT.review} 份。每个旋钮从日志里算一个加权平均,越旧的记录越轻(半衰期 ${Taste.HALF_LIFE_DAYS} 天)。审查器查出的客观问题不算口味,是硬下限,永远不会被淡忘。下一次,它挑自己最没把握的那个旋钮,拿两张只差这一处的图问你。`,
      en: `Every reaction is one line in a log: a pick or a sentence weighs ${Taste.WEIGHT.pick}, keep or delete ${Taste.WEIGHT.keep}, a reviewer's note ${Taste.WEIGHT.review}. Each knob is a weighted mean over the log, older lines weigh less (half-life ${Taste.HALF_LIFE_DAYS} days). An objective problem found by a checker is not taste: it is a hard floor and never fades. Next time it asks about the knob it is least sure of, with two drawings that differ only there.` },
    draw(S, P) {
      // you
      S.at(0, 1.4, () => {
        P.person(S, 92, 476, 0.9, { pose: 'think', shirt: 'blue', hair: 'bob' });
        S.rect(20, 214, 148, 46, { r: 16, fill: 'paper', style: 'wash' });
        S.line(72, 260, 84, 282, { w: 't', double: false });
        P.say(S, 94, 244, { zh: '「还是太密了」', en: '"still too dense"' }, { anchor: 'middle', size: 16 });
        P.say(S, 32, 392, { zh: '你', en: 'you' }, { anchor: 'middle', size: 18, ink: '2' });
      });
      // the four kinds of reaction, with their weights
      S.at(1.2, 1.6, () => {
        P.node(S, 196, 26, 250, 172, '', { pen: 'paper', style: 'wash' });
        P.say(S, 321, 56, { zh: '你的反应', en: 'what you do' }, { anchor: 'middle', size: 18 });
        const rows = [
          [{ zh: '二选一', en: 'pick A or B' }, 'blue', Taste.WEIGHT.pick],
          [{ zh: '说一句', en: 'say a sentence' }, 'orange', Taste.WEIGHT.say],
          [{ zh: '留下 / 删掉', en: 'keep / delete' }, 'green', Taste.WEIGHT.keep],
          [{ zh: '审查器的意见', en: "a reviewer's note" }, 'grey', Taste.WEIGHT.review],
        ];
        rows.forEach(([t, pen, w], i) => {
          const y = 88 + i * 30;
          S.circle(220, y - 5, 7, { fill: pen, style: 'wash', w: 't', double: false });
          P.say(S, 236, y, t, { size: 15 });
          P.say(S, 430, y, '×' + w, { anchor: 'end', size: 15, font: 'mono', ink: pen === 'grey' ? '2' : pen });
        });
      });
      S.at(2.6, 0.5, () => S.arrow([[110, 210], [140, 150], [188, 120]], { w: 't', head: 9 }));
      // the log
      S.at(3.0, 1.4, () => {
        S.poly([[494, 26], [628, 26], [648, 46], [648, 214], [494, 214]], { fill: 'paper', style: 'wash' });
        S.path([[628, 26], [630, 44], [648, 46]], { w: 't', double: false });
        P.say(S, 571, 58, { zh: '口味日志', en: 'taste log' }, { anchor: 'middle', size: 18 });
        ['blue', 'orange', 'blue', 'grey', 'green', 'blue'].forEach((pen, i) => {
          const y = 84 + i * 18, len = [96, 70, 104, 80, 60, 90][i];
          S.circle(512, y, 3.5, { fill: pen, style: 'wash', w: 'h', double: false });
          S.line(524, y, 524 + len, y, { w: 'h', double: false });
        });
        P.say(S, 571, 200, { zh: '只追加,不改写', en: 'append only' }, { anchor: 'middle', size: 13, ink: '2' });
        P.say(S, 571, 236, 'graphite-taste.jsonl', { anchor: 'middle', size: 13, font: 'mono', ink: '2' });
        S.arrow([[452, 112], [486, 112]], { w: 't', head: 9 });
      });
      // the estimate
      S.at(4.4, 1.6, () => {
        P.node(S, 560, 268, 240, 120, '', { pen: 'orange', style: 'wash' });
        P.say(S, 680, 294, { zh: '每个旋钮算一个值', en: 'one value per knob' }, { anchor: 'middle', size: 16 });
        P.say(S, 680, 322, 'm ← (m·W + x·w) / (W + w)', { anchor: 'middle', size: 14, font: 'mono' });
        P.say(S, 680, 350, { zh: `起点算 ${Taste.PRIOR} 份 · 越旧越轻`, en: `starts at ${Taste.PRIOR} · older = lighter` }, { anchor: 'middle', size: 14, ink: '2' });
        P.say(S, 680, 372, { zh: `(半衰期 ${Taste.HALF_LIFE_DAYS} 天)`, en: `(half-life ${Taste.HALF_LIFE_DAYS} days)` }, { anchor: 'middle', size: 13, ink: '2' });
        S.arrow([[654, 186], [690, 214], [698, 258]], { w: 't', head: 9 });
      });
      // the reviewers
      S.at(6.0, 1.4, () => {
        P.robot(S, 768, 206, 0.5, { pose: 'think' });
        P.say(S, 768, 236, { zh: '审查器', en: 'reviewers' }, { anchor: 'middle', size: 15, ink: '2' });
        S.arrow([[728, 120], [656, 120]], { w: 't', head: 8, pen: 'grey' });
        P.say(S, 692, 108, '×' + Taste.WEIGHT.review, { anchor: 'middle', size: 13, font: 'mono', ink: '2' });
      });
      // the hard floor: objective problems are constraints, applied last
      S.at(7.2, 1.2, () => {
        P.node(S, 580, 420, 222, 62, '', { pen: 'red', style: 'wash' });
        P.say(S, 691, 444, { zh: '硬下限(不算口味)', en: 'hard floor (not taste)' }, { anchor: 'middle', size: 15 });
        P.say(S, 691, 468, { zh: '手机上字太小 → 字号至少 +2', en: 'labels too small on phone → +2' }, { anchor: 'middle', size: 13, ink: '2' });
        S.arrow([[806, 248], [826, 330], [796, 414]], { w: 't', head: 8, pen: 'red', cls: 'dash' });
        P.say(S, 768, 256, { zh: '客观问题', en: 'objective' }, { anchor: 'middle', size: 13, ink: 'red' });
        S.arrow([[680, 392], [680, 414]], { w: 't', head: 8 });
      });
      // next time: two drawings that differ in one knob
      const fr = [[266, 'A', 2.9], [416, 'B', 5.1]];
      S.at(8.4, 1.8, () => {
        fr.forEach(([x, name, gap]) => {
          S.rect(x, 380, 126, 96, { r: 6, fill: 'paper', style: 'wash' });
          S.circle(x + 44, 432, 24, { fill: 'orange', gap });
          S.rect(x + 76, 414, 36, 44, { fill: 'blue', gap });
          P.say(S, x + 63, 404, name, { anchor: 'middle', size: 15, font: 'mono', ink: '2' });
        });
        P.say(S, 404, 360, { zh: '下一次:挑一张(只差最没把握的那个旋钮)', en: 'next: pick one (they differ in the least certain knob)' }, { anchor: 'middle', size: 15 });
        S.arrow([[574, 452], [550, 446]], { w: 't', head: 9 });
        S.arrow([[260, 430], [180, 410]], { w: 't', head: 9 });
      });
      // a reaction travels the loop, again and again
      const loop = [[110, 210], [140, 150], [188, 120], [452, 112], [486, 112], [654, 186], [690, 214], [698, 258], [680, 392], [680, 414], [574, 452], [550, 446], [260, 430], [180, 410], [110, 300], [110, 210]];
      P.token(S, loop, 10.4, 7, { pen: 'orange', r: 7, ease: 'linear' });
    },
  },
  {
    id: 'taste-converge', cat: 'taste', w: 840, h: 470, seed: 93, motion: true,
    title: { zh: '一个旋钮怎么学到位', en: 'How one knob learns' },
    desc: { zh: `读者想要疏一点的彩铅(间距 ${CONV.A})。出厂是 ${CONV.def};答了 ${CONV.split} 次之后学到 ${fx(C1.est)}。${CONV.gapDays} 天没用,旧答案按半衰期变轻,值往出厂回落到 ${fx(CONV.fade[CONV.fade.length - 1])};读者这时改成想要 ${CONV.B},又答 ${CONV.rows.length - CONV.split} 次,学到 ${fx(CEND.est)}。曲线上每个点都是 taste.js 在那一天真算出来的。`,
      en: `The reader wants sparser colouring (spacing ${CONV.A}). House value ${CONV.def}; after ${CONV.split} answers it has learned ${fx(C1.est)}. ${CONV.gapDays} days unused: old answers fade and the value drifts back to ${fx(CONV.fade[CONV.fade.length - 1])}. The reader now wants ${CONV.B}; ${CONV.rows.length - CONV.split} more answers and it is at ${fx(CEND.est)}. Every point is what taste.js computes on that day.` },
    draw(S, P) {
      const R = CONV.rows, n1 = CONV.split;
      const X = i => i <= n1 ? 120 + i * 37 : 600 + (i - n1 - 1) * 33;   // i = event number, 0 = before any
      const Y = v => 420 - (v - 2.6) / 4 * 330;
      const top = Y(6.6), base = Y(2.6);
      S.at(0, 1.4, () => {
        S.line(96, top - 10, 96, base + 4, { w: 't' });
        S.line(96, base, 812, base, { w: 't' });
        [3, 4, 5, 6].forEach(v => { S.line(90, Y(v), 96, Y(v), { w: 'h', double: false }); P.say(S, 84, Y(v) + 5, String(v), { anchor: 'end', size: 13, font: 'mono', ink: '2' }); });
        // the break in the time axis
        S.line(536, base + 8, 546, base - 8, { w: 'h', double: false });
        S.line(546, base + 8, 556, base - 8, { w: 'h', double: false });
        P.say(S, 546, base + 30, { zh: `${CONV.gapDays} 天没用`, en: `${CONV.gapDays} days unused` }, { anchor: 'middle', size: 14, ink: '2' });
        P.say(S, 308, base + 30, { zh: '每一格 = 一次反应', en: 'one step = one reaction' }, { anchor: 'middle', size: 14, ink: '2' });
      });
      // what the knob means: two swatches at its two ends
      S.at(0.6, 1.2, () => {
        [[3, { zh: '密', en: 'dense' }], [6, { zh: '疏', en: 'sparse' }]].forEach(([v, t]) => {
          S.rect(14, Y(v) - 16, 32, 32, { fill: 'blue', gap: v, w: 't' });
          P.say(S, 30, Y(v) + 34, t, { anchor: 'middle', size: 13, ink: '2' });
        });
        P.say(S, 96, 30, { zh: '彩铅间距(hatchGap)', en: 'pencil spacing (hatchGap)' }, { size: 15 });
      });
      // dashed lines cannot be drawn on (sketch.js leaves them untimed), so they appear at their moment
      S.window(1.2, null, () => {
        S.line(100, Y(CONV.def), 808, Y(CONV.def), { w: 'h', cls: 'dash', double: false });
        S.line(110, Y(CONV.A), X(n1) + 12, Y(CONV.A), { w: 't', pen: 'green', cls: 'dash', double: false });
      });
      S.at(1.2, 1, () => {
        P.say(S, 808, Y(CONV.def) + 18, { zh: `出厂默认 ${CONV.def}`, en: `house default ${CONV.def}` }, { anchor: 'end', size: 13, ink: '2' });
        P.say(S, 110, Y(CONV.A) - 10, { zh: `读者心里想要的 ${CONV.A}(程序看不到)`, en: `what the reader wants, ${CONV.A} (hidden)` }, { size: 14, ink: 'green' });
      });
      S.at(1.6, 0.8, () => {
        // legend
        S.line(470, 30, 486, 30, { w: 't', double: false });
        S.line(470, 40, 486, 40, { w: 't', double: false });
        P.say(S, 494, 40, { zh: '给你看的两张', en: 'the two shown' }, { size: 13, ink: '2' });
        S.raw('<circle cx="610" cy="35" r="5" class="tok p-blue"/>', { kind: 'tag' });
        P.say(S, 622, 40, { zh: '你挑中的', en: 'your pick' }, { size: 13, ink: '2' });
        S.line(700, 34, 724, 34, { w: 'b', pen: 'orange', double: false });
        P.say(S, 730, 40, { zh: '学到的值', en: 'learned' }, { size: 13, ink: '2' });
      });
      let t = 2.4, prev = [X(0), Y(CONV.def)];
      const per = 0.72;
      R.forEach((r, k) => {
        const i = k + 1, x = X(i);
        if (k === n1) {
          // the break: no events, the value drifts back toward the house value
          const fade = CONV.fade.map((v, j) => [X(n1) + (x - 18 - X(n1)) * j / 8, Y(v)]);
          S.window(t, null, () => S.path(fade, { w: 't', pen: 'orange', cls: 'dash', jitter: 0.4 }));
          S.window(t + 0.2, null, () => P.say(S, 604, Y(CONV.fade[4]) - 34, { zh: '旧答案慢慢变轻', en: 'old answers fade' }, { anchor: 'middle', size: 14, ink: 'orange' }), { layer: 'labels' });
          S.window(t + 0.3, null, () => S.line(x - 22, Y(CONV.B), 812, Y(CONV.B), { w: 't', pen: 'green', cls: 'dash', double: false }));
          S.at(t + 0.3, 0.8, () => {
            P.say(S, 812, Y(CONV.B) + 22, { zh: `口味变了:想要 ${CONV.B}`, en: `taste changed: wants ${CONV.B}` }, { anchor: 'end', size: 14, ink: 'green' });
          });
          prev = fade[fade.length - 1];
          t += 1.6;
        }
        if (r.kind === 'pick') {
          S.at(t, 0.3, () => { S.line(x - 7, Y(r.lo), x + 7, Y(r.lo), { w: 't', double: false }); S.line(x - 7, Y(r.hi), x + 7, Y(r.hi), { w: 't', double: false }); });
          S.window(t + 0.3, null, () => S.raw(`<circle cx="${x}" cy="${fx(Y(r.win), 1)}" r="5" class="tok p-blue"/>`, { kind: 'tag' }));
        } else {
          const say = r.kind === 'say';
          S.at(t, 0.5, () => {
            S.ring(x, Y(r.est) - 2, 12, 12, { pen: say ? 'orange' : 'grey' });
            const lbl = say ? { zh: `说了「${r.note}」`, en: `said "${r.note}"` } : { zh: `审查器:「${r.note}」×${Taste.WEIGHT.review}`, en: `reviewer: "${r.note}" ×${Taste.WEIGHT.review}` };
            P.say(S, x, Y(r.est) + 44, lbl, { anchor: 'middle', size: 14, ink: say ? 'orange' : '2' });
          });
        }
        S.at(t + 0.32, 0.36, () => S.path([prev, [x, Y(r.est)]], { w: 'b', pen: 'orange', jitter: 0.4 }));
        prev = [x, Y(r.est)];
        t += per;
      });
      S.at(t + 0.2, 0.8, () => P.say(S, X(R.length) - 6, Y(CEND.est) - 22, { zh: `学到 ${fx(CEND.est)}`, en: `learned ${fx(CEND.est)}` }, { anchor: 'end', size: 15, ink: 'orange' }));
      // the last answers point up, down, up: the value sits where the reader is
      const flips = R.slice(n1).filter((r, j, a) => j && r.kind === 'pick' && a[j - 1].kind === 'pick' && Math.sign(r.win - r.before) !== Math.sign(a[j - 1].win - a[j - 1].before)).length;
      if (flips) S.at(t + 0.6, 0.8, () => P.say(S, 812, Y(6.5), { zh: '最后的答案开始一上一下:学到位了', en: 'answers start to alternate: it has arrived' }, { anchor: 'end', size: 14, ink: '2' }));
    },
  },
  {
    id: 'taste-three', cat: 'taste', w: 840, h: 440, seed: 95, motion: true,
    title: { zh: '同一张图,三个人用出三种样子', en: 'One drawing, three readers, three looks' },
    desc: { zh: `中间是出厂样子。左右两位各说了两句话,再各答了 ${ROUNDS} 个二选一(每次问哪个旋钮,由程序挑它最没把握的那个)。画的内容和随机种子一模一样,不同的只有学到的口味:线条抖动、彩铅疏密、浓淡、线宽。`,
      en: `The middle is the house look. The readers on either side each said two things, then answered ${ROUNDS} A-or-B questions (the learner chose which knob to ask each time). Same drawing, same random seed; only the learned taste differs: wobble, pencil spacing, strength, line weight.` },
    draw(S, P) {
      READERS.forEach((r, i) => {
        const x0 = 18 + i * 274, t0 = i * 1.6;
        const k = r.taste.knobs, css = r.apply.css;
        // the drawing itself, made by its own sketch with this reader's taste
        const S2 = Sketch.create({ seed: 7, id: 'f-taste-three-' + r.id, taste: r.apply.sketch });
        S2.at(t0 + 0.6, 2.2, () => {
          S2.line(x0 + 10, 300, x0 + 250, 300, { w: 't' });
          P.robot(S2, x0 + 70, 296, 0.6, { pose: 'wave' });
          S2.rect(x0 + 130, 214, 104, 86, { fill: 'orange' });
          S2.line(x0 + 130, 240, x0 + 234, 240, { w: 'h', double: false });
          S2.circle(x0 + 206, 150, 26, { fill: 'yellow' });
          P.plant(S2, x0 + 150, 214, 0.7);
        });
        S.raw(`<g style="--g-lw:${css.lineWeight};--g-hz-o:${css.hatchOpacity};--g-wash-o:${css.washOpacity}">` + S2.art() + '</g>', { kind: 'tag' });
        S.raw(S2.labels(), { kind: 'tag', layer: 'labels' });
        S.at(t0, 0.8, () => {
          P.say(S, x0 + 128, 36, { zh: r.zh, en: r.en }, { anchor: 'middle', size: 17 });
          const said = r.words.length ? { zh: r.words.map(w => `「${w}」`).join(' '), en: r.id === 'clean' ? '"too messy" "too dense"' : '"too stiff, looks printed" "too faint"' } : { zh: '(还没用过)', en: '(not used yet)' };
          P.say(S, x0 + 128, 66, said, { anchor: 'middle', size: 14, ink: r.words.length ? 'orange' : '2' });
        });
        S.at(t0 + 2.6, 0.8, () => {
          const rows = [
            [{ zh: '线条抖动', en: 'wobble' }, fx(k.rough)], [{ zh: '彩铅间距', en: 'spacing' }, fx(k.hatchGap)],
            [{ zh: '彩铅浓淡', en: 'strength' }, fx(k.hatchOpacity)], [{ zh: '线条粗细', en: 'line weight' }, fx(k.lineWeight)],
          ];
          rows.forEach(([lab, v], j) => {
            const y = 340 + j * 24;
            P.say(S, x0 + 40, y, lab, { size: 14, ink: '2' });
            P.say(S, x0 + 214, y, v, { anchor: 'end', size: 14, font: 'mono' });
          });
        });
      });
    },
  },
];
