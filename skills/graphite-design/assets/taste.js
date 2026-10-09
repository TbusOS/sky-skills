/* graphite-design · taste.js — learns how one person likes their pencil drawings.
 *
 * The house style (the defaults below) is a starting point. Every time the reader
 * reacts — picks one of two variants, says "too busy", keeps or deletes a figure,
 * or a reviewer flags something — one event is appended to a log. The current
 * taste is computed from the whole log each time, so it is always explainable:
 * `explain()` lists, for every knob, which events moved it and by how much.
 *
 * Shared by scripts/taste.mjs (command line, log in ~/.config/sky-skills/) and the
 * taste lab on the showcase page (log in localStorage). Same code, same answers.
 *
 * How a value is estimated (per numeric knob):
 *   - start at the house default with the weight of 2 events (a prior: one stray
 *     click must not throw the style around)
 *   - walk the events in time order; each one is an observation x with weight w,
 *     and the estimate becomes the weighted mean   m <- (m·W + x·w) / (W + w)
 *       pick    x = the winner's value             w = 1
 *       keep    x = the kept figure's value        w = 0.5
 *       drop    x = mirrored away from m           w = 0.5
 *       say     x = m ± 2 steps (from the lexicon) w = 1
 *       review  x = m ± 2 steps                    w = 0.3   (a critic is not the reader)
 *   - older events count less: weight × 0.5^(age / 90 days). Taste drifts.
 *   - constraints (min / max) are applied last. They come from objective checks
 *     ("labels under 9 px on a phone") and are not preferences: they never decay.
 * Why a weighted mean and not something cleverer: with ten or twenty events a
 * year, anything with more parameters would fit noise. A mean is also the only
 * estimator whose explanation a reader can check by hand.
 *
 * What to ask next (ab): the knob whose estimate is least certain relative to its
 * range, offered as "a bit less" vs "a bit more" around the current value. Asking
 * "current vs other" was tried first: a vote for "current" carries no direction,
 * and a simulated reader needed 3× as many questions. One knob per question, so a
 * pick says something clear.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Taste = factory();
})(this, function () {
  'use strict';

  var KNOBS = {
    rough:        { def: 1,    min: 0.4,  max: 1.8,  step: 0.15, zh: '线条抖动', en: 'line wobble' },
    grain:        { def: 0.5,  min: 0,    max: 1,    step: 0.12, zh: '铅笔颗粒', en: 'pencil grain' },
    warp:         { def: 2.6,  min: 0,    max: 5,    step: 0.5,  zh: '线条弯曲', en: 'line warp' },
    hatchGap:     { def: 3.7,  min: 2.6,  max: 7,    step: 0.5,  zh: '彩铅疏密(大=疏)', en: 'pencil spacing (big = sparse)' },
    hatchOpacity: { def: 0.52, min: 0.3,  max: 0.85, step: 0.06, zh: '彩铅浓淡', en: 'pencil strength' },
    washOpacity:  { def: 0.2,  min: 0.06, max: 0.4,  step: 0.04, zh: '底色浓淡', en: 'colour wash' },
    lineWeight:   { def: 2.1,  min: 1.4,  max: 3,    step: 0.2,  zh: '线条粗细', en: 'line weight' },
    colorBudget:  { def: 3,    min: 1,    max: 6,    step: 1,    zh: '一张图用几支彩铅', en: 'pencils per figure', int: true },
    whitespace:   { def: 0.45, min: 0.25, max: 0.7,  step: 0.05, zh: '留白比例', en: 'empty paper' },
    labelSize:    { def: 18,   min: 14,   max: 26,   step: 1.5,  zh: '图中字号', en: 'label size', int: true },
    pace:         { def: 1,    min: 0.5,  max: 2,    step: 0.15, zh: '动画节奏(大=慢)', en: 'animation pace (big = slow)' }
  };
  var CATS = {
    theme: { def: 'auto', values: ['light', 'dark', 'auto'], zh: '主题', en: 'theme' },
    cast: { def: 'robot', values: ['robot', 'person', 'animal', 'none'], zh: '主角', en: 'main character' },
    source: { def: 'mixed', values: ['code', 'image', 'mixed'], zh: '插画来源', en: 'illustration source' }
  };
  var WEIGHT = { pick: 1, keep: 0.5, drop: 0.5, say: 1, review: 0.3 };
  // WMAX caps how much accumulated evidence can anchor a value: every new event
  // still moves the estimate at least w / (WMAX + w) of the way. Without the cap a
  // long-time reader's taste could never change again.
  var PRIOR = 2, WMAX = 8, HALF_LIFE_DAYS = 90, STREAK_CAP = 2;

  // Words a reader (or a reviewer) uses -> which way knobs should move.
  // Chinese and English. Order matters only for readability; every match applies.
  var LEXICON = [
    { re: '太密|太满|拥挤|太挤|密密麻麻|too dense|cluttered|crowded|too busy|busy', dir: { hatchGap: 1, whitespace: 1, colorBudget: -1 } },
    { re: '太空|太稀|太疏|空荡|too sparse|too empty|bare', dir: { hatchGap: -1, whitespace: -1 } },
    { re: '太淡|看不清|发灰|太浅|too faint|too pale|washed out|too light', dir: { hatchOpacity: 1, washOpacity: 1, lineWeight: 1 } },
    { re: '太浓|太重|太艳|too strong|too heavy|too saturated|too loud', dir: { hatchOpacity: -1, washOpacity: -1 } },
    { re: '太抖|太乱|潦草|毛躁|too wobbly|messy|scribbly|sloppy', dir: { rough: -1, warp: -1 } },
    { re: '太死板|太规整|太工整|像打印|不像手画|stiff|mechanical|too clean|too perfect|looks printed', dir: { rough: 1, warp: 1, grain: 1 } },
    { re: '颗粒太重|太脏|太糙|噪点|dirty|grainy|noisy', dir: { grain: -1 } },
    { re: '质感不够|没有铅笔感|太平|too flat|not pencil enough|no texture', dir: { grain: 1 } },
    { re: '颜色太多|太花|花哨|too colou?rful|too many colou?rs|rainbow', dir: { colorBudget: -1 } },
    { re: '太素|单调|颜色太少|没颜色|dull|too plain|monotone|more colou?r', dir: { colorBudget: 1, hatchOpacity: 1 } },
    { re: '字太小|字看不清|too small text|text too small|labels? too small', dir: { labelSize: 1 } },
    { re: '字太大|text too big|labels? too big', dir: { labelSize: -1 } },
    { re: '线太粗|线条太粗|too thick|too bold', dir: { lineWeight: -1 } },
    { re: '线太细|线条太细|too thin|too weak', dir: { lineWeight: 1 } },
    { re: '太快|看不过来|too fast|too quick', dir: { pace: 1 } },
    { re: '太慢|拖沓|too slow|drags', dir: { pace: -1 } },
    { re: '深色|暗色|夜间|黑底|dark mode|dark theme', cat: { theme: 'dark' } },
    { re: '浅色|亮色|白天|light mode|light theme', cat: { theme: 'light' } },
    { re: '机器人|robot', cat: { cast: 'robot' } },
    { re: '人物|小人|person|people', cat: { cast: 'person' } },
    { re: '动物|小猫|小狗|animal|\\bcat\\b|\\bdog\\b', cat: { cast: 'animal' } },
    { re: '位图|出图|生成的图|ai 画|image model|generated image', cat: { source: 'image' } },
    { re: '代码画|矢量|code-drawn|vector', cat: { source: 'code' } }
  ];

  function clamp(v, k) { var K = KNOBS[k]; v = Math.max(K.min, Math.min(K.max, v)); return K.int ? Math.round(v) : Math.round(v * 1000) / 1000; }
  function age(ts, now) { return Math.max(0, (now - Date.parse(ts)) / 864e5); }
  function decay(ts, now) { return Math.pow(0.5, age(ts, now) / HALF_LIFE_DAYS); }

  // Turn free words into directions. Returns { dir: {knob: ±1}, cat: {name: value}, hits: [pattern] }.
  function parse(text) {
    var dir = {}, cat = {}, hits = [], t = String(text || '').toLowerCase();
    LEXICON.forEach(function (L) {
      var m = t.match(new RegExp(L.re, 'i'));
      if (!m) return;
      hits.push(m[0]);
      for (var k in L.dir || {}) dir[k] = (dir[k] || 0) + L.dir[k];
      for (var c in L.cat || {}) cat[c] = L.cat[c];
    });
    for (var k2 in dir) dir[k2] = Math.max(-1, Math.min(1, dir[k2]));
    return { dir: dir, cat: cat, hits: hits };
  }

  // The current taste from a list of events. now: ms (defaults to Date.now()).
  function estimate(events, now) {
    now = now || Date.now();
    var est = {}, trace = {}, min = {}, max = {};
    for (var k in KNOBS) { est[k] = { m: KNOBS[k].def, W: PRIOR }; trace[k] = []; }
    var cats = {};
    for (var c in CATS) { cats[c] = {}; cats[c][CATS[c].def] = 0.5; }
    events.slice().sort(function (a, b) { return Date.parse(a.ts) - Date.parse(b.ts); }).forEach(function (e, idx) {
      if (e.kind === 'constraint') {
        for (var kk in e.min || {}) min[kk] = Math.max(min[kk] == null ? -Infinity : min[kk], e.min[kk]);
        for (var kx in e.max || {}) max[kx] = Math.min(max[kx] == null ? Infinity : max[kx], e.max[kx]);
        return;
      }
      var w = (e.w != null ? e.w : (WEIGHT[e.kind] || 0.5)) * decay(e.ts, now);
      function obs(k, x) {
        if (!KNOBS[k]) return;
        var s = est[k], before = s.m;
        x = Math.max(KNOBS[k].min, Math.min(KNOBS[k].max, x));
        s.m = (s.m * s.W + x * w) / (s.W + w); s.W = Math.min(WMAX, s.W + w);
        s.E = (s.E || 0) + w;
        trace[k].push({ i: idx, kind: e.kind, ts: e.ts, note: e.note || '', x: Math.round(x * 1000) / 1000, w: Math.round(w * 100) / 100, from: Math.round(before * 1000) / 1000, to: Math.round(s.m * 1000) / 1000 });
      }
      var kv = e.knobs || {};
      for (var k1 in kv) {
        if (e.kind === 'drop') obs(k1, est[k1] ? est[k1].m - (kv[k1] - est[k1].m) : kv[k1]);
        else obs(k1, kv[k1]);
      }
      var dv = e.dir || {};
      for (var k2 in dv) if (KNOBS[k2]) obs(k2, est[k2].m + dv[k2] * KNOBS[k2].step * 2);
      var cv = e.cat || {};
      for (var c2 in cv) if (CATS[c2]) cats[c2][cv[c2]] = (cats[c2][cv[c2]] || 0) + w;
    });
    var out = { knobs: {}, cats: {}, evidence: {}, trace: trace, constraints: { min: min, max: max } };
    for (var k3 in est) {
      var v = est[k3].m;
      if (min[k3] != null) v = Math.max(v, min[k3]);
      if (max[k3] != null) v = Math.min(v, max[k3]);
      out.knobs[k3] = clamp(v, k3);
      out.evidence[k3] = Math.round((est[k3].E || 0) * 100) / 100;
    }
    for (var c3 in cats) {
      var best = CATS[c3].def, bw = -1;
      for (var v2 in cats[c3]) if (cats[c3][v2] > bw) { bw = cats[c3][v2]; best = v2; }
      out.cats[c3] = best;
    }
    return out;
  }

  // Next question: which single knob to test, and the two values to show.
  function ab(events, now) {
    var t = estimate(events, now), best = null;
    // tested: how often each knob was asked; streak: how many answers in a row pointed
    // the same way. A streak means the reader is still far from the current value, so
    // that knob keeps priority until the answers start to alternate around it.
    // The bonus stops growing after STREAK_CAP answers. Uncapped, a knob whose reader
    // sits near its floor (lineWeight 1.6, floor 1.4) took 18 of 24 questions: the
    // "less" option is clamped there, each answer moves the estimate a little, and the
    // answers never alternate (2026-10-10). 200 simulated readers, 40 questions each:
    // gap closed 49% → 73%, the busiest knob's share of questions 60% → 21%.
    var tested = {}, last = {}, streak = {};
    events.forEach(function (e) {
      if (e.kind !== 'pick') return;
      for (var k in e.knobs || {}) {
        tested[k] = (tested[k] || 0) + 1;
        var d = e.other && e.other[k] != null ? (e.knobs[k] > e.other[k] ? 1 : -1) : 0;
        streak[k] = d && d === last[k] ? (streak[k] || 0) + 1 : 0; last[k] = d;
      }
    });
    for (var k in KNOBS) {
      if (k === 'colorBudget' || k === 'whitespace' || k === 'pace') continue;   // only knobs a still pair of drawings can show
      var K = KNOBS[k], u = K.step / (K.max - K.min) / Math.sqrt(1 + t.evidence[k]) / (1 + (tested[k] || 0) * 0.2) * Math.pow(1.8, Math.min(streak[k] || 0, STREAK_CAP));
      if (!best || u > best.u) best = { k: k, u: u };
    }
    var K2 = KNOBS[best.k], cur = t.knobs[best.k], d = K2.step * 2;
    var lo = clamp(cur - d, best.k), hi = clamp(cur + d, best.k);
    if (lo === cur) hi = clamp(cur + 2 * d, best.k);              // at the floor: compare current with more
    if (hi === cur) lo = clamp(cur - 2 * d, best.k);              // at the ceiling: compare current with less
    if (lo === cur && hi !== cur) lo = cur;
    var a = Object.assign({}, t.knobs), b = Object.assign({}, t.knobs);
    a[best.k] = lo; b[best.k] = hi;
    return { knob: best.k, label: { zh: K2.zh, en: K2.en }, a: a, b: b, values: [lo, hi], current: cur };
  }

  // Event constructors (ts filled in by the caller's clock).
  function pick(knob, winnerValue, loserValue, note) {
    var e = { kind: 'pick', knobs: {}, note: note || '' };
    e.knobs[knob] = winnerValue; e.other = {}; e.other[knob] = loserValue;
    return e;
  }
  function say(text) { var p = parse(text); return { kind: 'say', dir: p.dir, cat: p.cat, note: text, hits: p.hits }; }

  // What to pass to the drawing code.
  function apply(t) {
    var k = t.knobs;
    return {
      sketch: { rough: k.rough, hatchGap: k.hatchGap },
      filters: { grain: k.grain, warp: k.warp },
      css: { lineWeight: k.lineWeight, hatchOpacity: k.hatchOpacity, washOpacity: k.washOpacity },
      layout: { colorBudget: k.colorBudget, whitespace: k.whitespace, labelSize: k.labelSize, pace: k.pace },
      prefer: t.cats
    };
  }

  return { KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON, WEIGHT: WEIGHT, PRIOR: PRIOR, WMAX: WMAX, HALF_LIFE_DAYS: HALF_LIFE_DAYS,
    parse: parse, estimate: estimate, ab: ab, pick: pick, say: say, apply: apply };
});
