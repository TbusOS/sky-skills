// 越用越懂你 — drawn by the taste engine itself: every curve and number below is the
// output of skills/design-taste on simulated readers, run at build time.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Core = require('../../../design-taste/assets/taste-core.js');
const INK = Core.create(require('../../assets/taste-profile.js'));
const GRA = Core.create(require('../../../graphite-design/assets/taste-profile.js'));
const L = (zh, en) => ({ zh, en });
const DAY = 864e5, T0 = Date.parse('2026-01-01T00:00:00Z'), iso = d => new Date(T0 + d * DAY).toISOString();

// reader A: faint ink in technical diagrams, heavy ink in quiet pictures; 30 questions per scene
function readerA() {
  const want = { tech: 0.25, still: 0.8 }, ev = [], trail = { tech: [], still: [] };
  for (let i = 0; i < 60; i++) {
    const scene = i % 2 ? 'still' : 'tech', q = INK.ab(ev, T0 + i * DAY, { scene });
    const target = q.knob === 'inkDepth' ? want[scene] : INK.KNOBS[q.knob].def, [a, b] = q.values;
    const win = Math.abs(a - target) <= Math.abs(b - target) ? a : b;
    ev.push({ ts: iso(i), ...INK.pick(q.knob, win, win === a ? b : a, 'sim', { scene }) });
    for (const s of ['tech', 'still']) trail[s].push(INK.estimate(ev, T0 + (i + 1) * DAY, { scene: s }).knobs.inkDepth);
  }
  return { trail, ev, end: { tech: trail.tech[59], still: trail.still[59] }, style: INK.estimate(ev, T0 + 60 * DAY).knobs.inkDepth };
}
const A = readerA();

// a reference picture: 72 % empty paper, two pigments (ochre, indigo), soft edges
const MEASURE = { whitespace: 0.72, colors: 2, hues: [24, 208], tones: [0.04, 0.12, 0.24, 0.3, 0.3], soft: 0.66 };
const REF = INK.profile.fromMeasure(MEASURE);
const REFT = INK.estimate([{ ts: iso(0), kind: 'ref', knobs: Object.fromEntries(Object.entries(REF).filter(([k]) => INK.KNOBS[k])), cat: { palette: REF.palette } }], T0 + DAY);

// across styles: in graphite the reader says "labels too small" twice and picks hatch spacing ten times
const GEV = [GRA.say('字太小了'), GRA.say('字还是太小'), ...Array.from({ length: 10 }, () => GRA.pick('hatchGap', 5.5, 3.7))]
  .map((e, i) => GRA.annotate({ ts: iso(i), ...e }));
const CROSS = INK.estimate(GEV, T0 + 12 * DAY);
const moved = Object.keys(INK.KNOBS).filter(k => CROSS.knobs[k] !== INK.KNOBS[k].def);

export default [
  {
    id: 'taste-loop', cat: 'taste', w: 1000, h: 560, seed: 101, motion: true, wide: true,
    title: L('学习过程:一圈是怎么转的', 'How the loop turns'),
    desc: L(`画一张 → 你挑一张、说一句、留下或删掉、给一张参考图 → 记一行日志 → 算出下次的参数。二选一和说一句各算 ${Core.WEIGHT.pick} 份,留下、删掉、参考图各 ${Core.WEIGHT.keep} 份,审查器的意见 ${Core.WEIGHT.review} 份;越旧越轻,半衰期 ${Core.HALF_LIFE_DAYS} 天。`, `Paint → you pick, say, keep, delete or show a picture → one line in a log → the next parameters. A pick or a sentence weighs ${Core.WEIGHT.pick}, keep / delete / a reference ${Core.WEIGHT.keep}, a reviewer ${Core.WEIGHT.review}; older lines fade with a ${Core.HALF_LIFE_DAYS}-day half-life.`),
    draw(B, P) {
      const st = [[500, 90, L('画一张', 'paint')], [800, 280, L('你的反应', 'you react')], [500, 470, L('记一行日志', 'log a line')], [200, 280, L('算出参数', 'new parameters')]];
      B.at(0.2, 2, () => P.enso(B, 500, 280, 190, { width: 14, tone: 'dan', from: -1.4, sweep: 5.9 }));
      st.forEach(([x, y, t], i) => B.at(2.4 + i * 0.8, 0.7, () => P.box(B, x - 80, y - 32, 160, 64, { label: t, weight: i === 1 ? 'heavy' : 'light', fill: i === 1 ? 'tenghuang' : 'qing', fillOpacity: 0.5 })));
      const w = [[L('二选一', 'pick'), Core.WEIGHT.pick], [L('说一句', 'say'), Core.WEIGHT.say], [L('留下 / 删掉', 'keep / delete'), Core.WEIGHT.keep], [L('参考图', 'reference'), Core.WEIGHT.ref], [L('审查器', 'reviewer'), Core.WEIGHT.review]];
      B.at(5.8, 2.2, () => w.forEach(([t, v], i) => {
        const y = 370 + i * 30;
        B.stroke([[840, y], [840 + v * 90, y]], { tone: i === 4 ? 'dan' : 'nong', width: 12, press: 'ce', dry: false, wet: 0.2 });
        B.text(832, y + 5, '', { size: 14, anchor: 'end', ink: 'zhong', lang: t });
        B.text(846 + v * 90, y + 5, `×${v}`, { size: 13, font: 'mono', ink: 'zhong' });
      }));
      B.text(500, 286, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: L(`起点算 ${Core.PRIOR} 份 · 封顶 ${Core.WMAX} 份`, `prior ${Core.PRIOR} · cap ${Core.WMAX}`) });
      B.seal(60, 470, 44, '日志', { at: 8.2 });
    },
  },
  {
    id: 'taste-scenes', cat: 'taste', w: 1000, h: 560, seed: 103, motion: true, wide: true,
    title: L('分场景记:技术图爱淡,静赏爱浓', 'Per scene: faint for diagrams, heavy for quiet pictures'),
    desc: L(`模拟读者 A:技术图喜欢墨色 0.25,静赏喜欢 0.8。两组交替各答 30 题,技术图学到 ${A.end.tech.toFixed(2)},静赏学到 ${A.end.still.toFixed(2)};只算整体口味的话是 ${A.style.toFixed(2)},两头都不对。`, `Simulated reader A likes ink depth 0.25 in diagrams and 0.8 in quiet pictures. 30 questions each, alternating: diagrams learn ${A.end.tech.toFixed(2)}, quiet pictures ${A.end.still.toFixed(2)}; one overall taste would be ${A.style.toFixed(2)}, wrong for both.`),
    draw(B, P) {
      const X = i => 90 + i * 9.5, Y = v => 470 - v * 380;
      B.at(0.2, 0.8, () => {
        B.stroke([[80, 470], [670, 470]], { tone: 'dan', width: 2.4, press: 'si', dry: false });
        [0.25, 0.5, 0.8].forEach(v => { B.text(72, Y(v) + 5, v.toFixed(2), { size: 12, anchor: 'end', font: 'mono', ink: 'zhong' }); B.stroke([[80, Y(v)], [670, Y(v)]], { tone: 'qing', width: 1.4, press: 'si', dry: false }); });
      });
      B.at(1.2, 3, () => {
        B.stroke(A.trail.still.map((v, i) => [X(i), Y(v)]), { tone: 'nong', width: 5, press: 'zhong', dry: false });
        B.stroke(A.trail.tech.map((v, i) => [X(i), Y(v)]), { tone: 'huaqing', width: 5, press: 'zhong', dry: false });
      });
      B.at(4.4, 0.8, () => {
        B.text(X(59) + 10, Y(A.end.still) + 5, '', { size: 15, ink: 'jiao', lang: L(`静赏 ${A.end.still.toFixed(2)}`, `quiet ${A.end.still.toFixed(2)}`) });
        B.text(X(59) + 10, Y(A.end.tech) + 5, '', { size: 15, ink: 'huaqing', lang: L(`技术图 ${A.end.tech.toFixed(2)}`, `diagrams ${A.end.tech.toFixed(2)}`) });
        B.text(370, 510, '', { size: 14, anchor: 'middle', ink: 'zhong', lang: L('答题数 →', 'questions →') });
      });
      // the same hill at the two learned depths
      const hill = (ox, d) => [[ox, 470], [ox + 50, 360 - d * 60], [ox + 90, 300 - d * 80], [ox + 140, 380], [ox + 180, 470]];
      B.at(5.4, 1.6, () => {
        P.mountain(B, hill(770, A.end.tech), { tone: 'dan', ridge: 'zhong', opacity: 0.3 + A.end.tech });
        P.mountain(B, hill(770, A.end.still).map(([x, y]) => [x, y - 230]), { tone: 'nong', ridge: 'jiao', opacity: 0.3 + A.end.still });
      });
      B.seal(900, 60, 40, '分场', { at: 7.2 });
    },
  },
  {
    id: 'taste-ref', cat: 'taste', w: 1000, h: 520, seed: 107, motion: true, wide: true,
    title: L('看图识口味:从一张你喜欢的画里量', 'Learning from a picture you like'),
    desc: L(`以一张留白 ${Math.round(MEASURE.whitespace * 100)}%、两种颜料(赭石、花青)、边缘柔和的画为例:换算成留白 ${REF.whitespace}、颜料 ${REF.colorBudget} 种、湿度 ${REF.wet.toFixed(2)}、设色「${REF.palette === 'qianjiang' ? '浅绛' : REF.palette}」;记一条参考,分量相当于留下一张图,口味往它挪一步(留白 ${INK.KNOBS.whitespace.def} → ${REFT.knobs.whitespace})。飞白量不准,不换算。`, `A picture with ${Math.round(MEASURE.whitespace * 100)}% empty paper, two pigments (ochre, indigo), soft edges becomes empty paper ${REF.whitespace}, ${REF.colorBudget} pigments, wetness ${REF.wet.toFixed(2)}, colouring "${REF.palette}"; one reference weighs as much as keeping a figure, so taste moves one step (empty paper ${INK.KNOBS.whitespace.def} → ${REFT.knobs.whitespace}). Dry brush cannot be measured reliably and is skipped.`),
    draw(B, P) {
      B.raw('<rect class="card" x="40" y="60" width="340" height="300" rx="4"/>', { kind: 'tag' });
      B.at(0.2, 2.4, () => {
        P.mountain(B, [[60, 330], [130, 230], [180, 200], [240, 250], [300, 300], [360, 330]], { tone: 'zheshi', ridge: 'nong', opacity: 0.7 });
        P.farHills(B, 60, 300, 300, { rows: 1, height: 40, tone: 'huaqing' });
        P.boat(B, 280, 330, 50, { line: false });
      }, { order: 'wash-first' });
      const rows = [[L('留白', 'empty paper'), `${Math.round(MEASURE.whitespace * 100)}%`, `${REF.whitespace}`], [L('颜料', 'pigments'), `${MEASURE.colors}`, `${REF.colorBudget}`],
        [L('柔和边缘', 'soft edges'), `${Math.round(MEASURE.soft * 100)}%`, `wet ${REF.wet.toFixed(2)}`], [L('设色', 'colouring'), L('赭石 + 花青', 'ochre + indigo'), REF.palette], [L('飞白', 'dry brush'), L('量不准', 'unreliable'), '—']];
      rows.forEach(([k, m, v], i) => B.at(2.8 + i * 0.6, 0.5, () => {
        const y = 110 + i * 52;
        B.text(440, y, '', { size: 16, ink: 'jiao', lang: k });
        B.text(580, y, typeof m === 'string' ? m : '', { size: 16, font: typeof m === 'string' ? 'mono' : 'kai', ink: 'zhong', lang: typeof m === 'string' ? null : m });
        P.arrow(B, [[700, y - 6], [760, y - 6]], { tone: 'dan', width: 2.4, head: 8 });
        B.text(780, y, String(v), { size: 16, font: 'mono', ink: i === 4 ? 'zhong' : 'jiao' });
      }));
      B.seal(900, 420, 44, '识图', { at: 6.2, kind: 'bai' });
    },
  },
  {
    id: 'taste-cross', cat: 'taste', w: 1000, h: 520, seed: 109, motion: true, wide: true,
    title: L('跨风格:在铅笔画里说的话,水墨也听见', 'Across styles: what you said about pencil reaches ink'),
    desc: L(`读者在 graphite 里说了两次「字太小」,又挑了十次排线疏密。到水墨这边:字号 ${INK.KNOBS.labelSize.def} → ${CROSS.knobs.labelSize}(共享参数,半份分量);排线是铅笔专属,水墨的 ${Object.keys(INK.KNOBS).length - moved.length} 个其他参数一个没动。`, `In graphite the reader said "labels too small" twice and picked hatch spacing ten times. In ink: label size ${INK.KNOBS.labelSize.def} → ${CROSS.knobs.labelSize} (a shared knob, half weight); hatching is pencil-only, so ink's other ${Object.keys(INK.KNOBS).length - moved.length} knobs stay put.`),
    draw(B, P) {
      B.at(0.2, 1.2, () => {
        P.box(B, 60, 80, 300, 300, { fill: 'qing', fillOpacity: 0.3, tone: 'zhong', weight: 'light' });
        B.text(210, 130, 'graphite', { size: 22, anchor: 'middle', font: 'mono', ink: 'jiao' });
        B.text(210, 190, '', { size: 18, anchor: 'middle', ink: 'jiao', lang: L('「字太小」× 2', '"labels too small" × 2') });
        B.text(210, 240, '', { size: 18, anchor: 'middle', ink: 'zhong', lang: L('排线疏密 × 10', 'hatch spacing × 10') });
      });
      B.at(1.6, 1.4, () => {
        P.arrow(B, [[370, 186], [610, 186]], { tone: 'nong', width: 4, label: L('共享:字号,半份', 'shared: label size, half weight'), dy: -14 });
        P.arrow(B, [[370, 236], [470, 236]], { tone: 'dan', width: 3 });
        B.text(480, 242, '', { size: 15, ink: 'yanzhi', lang: L('专属,不传', 'pencil-only, stays') });
      });
      B.at(3.2, 2, () => {
        P.box(B, 620, 80, 320, 300, { fill: 'qing', fillOpacity: 0.3, weight: 'heavy' });
        B.text(780, 130, 'inkwash', { size: 22, anchor: 'middle', font: 'mono', ink: 'jiao' });
        Object.keys(INK.KNOBS).forEach((k, i) => {
          const y = 168 + i * 25, mv = moved.includes(k);
          B.text(650, y, '', { size: 14, ink: mv ? 'zhusha' : 'zhong', lang: L(INK.KNOBS[k].zh, INK.KNOBS[k].en) });
          B.text(910, y, mv ? `${INK.KNOBS[k].def} → ${CROSS.knobs[k]}` : String(CROSS.knobs[k]), { size: 14, anchor: 'end', font: 'mono', ink: mv ? 'zhusha' : 'zhong' });
        });
      });
      B.seal(900, 420, 44, '相通', { at: 5.6 });
    },
  },
];
