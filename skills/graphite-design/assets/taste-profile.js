/* graphite-design · taste-profile.js — graphite's knobs for the shared taste engine.
 *
 * The learning rule lives in skills/design-taste/assets/taste-core.js (shared by every
 * design style). This file is only graphite's table: which knobs a pencil drawing
 * has, their house values and ranges, the words that move them, which of them are
 * the five shared knobs, and how the estimate is handed to the drawing code.
 * Values and words are exactly what taste.js held before the move (2026-10-11).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GraphiteTasteProfile = factory();
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

  // Which of graphite's knobs are the shared ones (design-taste/assets/shared.js).
  var SHARED = { labelSize: 'labelSize', colorBudget: 'colorBudget', whitespace: 'whitespace', pace: 'pace', theme: 'theme' };

  // From a reference picture's measurements (design-taste scripts/measure.mjs) to
  // graphite knobs. Only what a photo of someone else's drawing can honestly show:
  // empty space and number of colours. Hatch spacing cannot be read off an ink painting.
  function fromMeasure(m) {
    var out = {};
    if (m.whitespace != null) out.whitespace = Math.max(0.25, Math.min(0.7, m.whitespace));
    if (m.colors != null) out.colorBudget = Math.max(1, Math.min(6, Math.round(m.colors)));
    return out;
  }

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

  // What `design-taste/scripts/taste.mjs suggest` prints for graphite (the old
  // graphite taste.mjs output). req loads a file from this skill's assets/; Node only.
  function describe(a, req, flags) {
    var Sketch = req('sketch.js');
    if (flags.css) return [Sketch.cssVars(a.css)];
    if (flags.js) return ['Sketch.create({ seed: 1, taste: ' + JSON.stringify(a.sketch) + ' })', 'Sketch.filters(' + JSON.stringify(a.filters) + ')'];
    return ['draw with:',
      '  sketch.js   Sketch.create({ taste: ' + JSON.stringify(a.sketch) + ' })',
      '  filter      Sketch.filters(' + JSON.stringify(a.filters) + ')',
      '  css         ' + (Sketch.cssVars(a.css) || '(house values)'),
      '  layout      at most ' + a.layout.colorBudget + ' pencils per figure · about ' + Math.round(a.layout.whitespace * 100) + '% empty paper · labels ' + a.layout.labelSize + 'px · animation × ' + a.layout.pace,
      '  prefers     theme ' + a.prefer.theme + ' · main character ' + a.prefer.cast + ' · illustrations ' + a.prefer.source];
  }

  return { style: 'graphite', KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON, shared: SHARED, SCENES: [],
    // only knobs a still pair of drawings can show
    abSkip: ['colorBudget', 'whitespace', 'pace'],
    fromMeasure: fromMeasure, apply: apply, describe: describe };
});
