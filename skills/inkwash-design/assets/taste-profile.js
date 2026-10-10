/* inkwash-design · taste-profile.js — ink wash's knobs for the shared taste engine
 * (skills/design-taste/assets/taste-core.js).
 *
 * Scene groups are the five rows of the scene table (SKILL.md §3): a reader who likes
 * faint ink in a technical diagram may want heavy ink on a wallpaper, and one group's
 * picks must not drag the other along.
 *
 *   var T = TasteCore.create(InkwashTasteProfile);
 *   var t = T.estimate(events, null, { scene: 'tech' });
 *   Brush.create({ seed: 3, taste: T.apply(t).brush });
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InkwashTasteProfile = factory();
})(this, function () {
  'use strict';

  var KNOBS = {
    inkDepth:    { def: 0.5,  min: 0.15, max: 0.9,  step: 0.08, zh: '墨色浓淡', en: 'ink depth' },
    wet:         { def: 0.5,  min: 0.1,  max: 1,    step: 0.08, zh: '湿度(晕开多少)', en: 'wetness (how far ink bleeds)' },
    dry:         { def: 0.5,  min: 0.1,  max: 0.9,  step: 0.08, zh: '飞白多少', en: 'dry brush' },
    weight:      { def: 1,    min: 0.7,  max: 1.4,  step: 0.06, zh: '笔的粗细', en: 'brush width' },
    whitespace:  { def: 0.6,  min: 0.35, max: 0.85, step: 0.05, zh: '留白', en: 'empty paper' },
    colorBudget: { def: 2,    min: 0,    max: 5,    step: 1,    zh: '一张图用几种颜料', en: 'pigments per picture', int: true },
    labelSize:   { def: 18,   min: 14,   max: 26,   step: 1.5,  zh: '图中字号', en: 'label size', int: true },
    pace:        { def: 1,    min: 0.5,  max: 2,    step: 0.15, zh: '动画节奏(大=慢)', en: 'pace (big = slow)' }
  };
  var CATS = {
    theme:   { def: 'auto', values: ['light', 'dark', 'auto'], zh: '主题', en: 'theme' },
    palette: { def: 'mo', values: ['mo', 'qianjiang', 'qinglv', 'mogu'], zh: '设色', en: 'colouring' },
    source:  { def: 'mixed', values: ['code', 'image', 'mixed'], zh: '插画来源', en: 'illustration source' }
  };
  var SCENES = [
    { id: 'tech', zh: '技术图', en: 'technical diagrams' },
    { id: 'ui', zh: '页面与界面', en: 'pages and interfaces' },
    { id: 'launch', zh: '发布会', en: 'launch' },
    { id: 'story', zh: '叙事画面', en: 'story pictures' },
    { id: 'still', zh: '静赏', en: 'quiet pictures' }
  ];
  var LEXICON = [
    { re: '太湿|太糊|晕得太开|化开太多|too wet|blurry|smudged', dir: { wet: -1 } },
    { re: '太干|太硬|不够湿|没晕开|too dry|too crisp|too sharp', dir: { wet: 1 } },
    { re: '飞白太多|太毛|太碎|太枯|too much dry.?brush|scratchy', dir: { dry: -1 } },
    { re: '没有飞白|太光滑|太顺|太平滑|too smooth|no dry.?brush', dir: { dry: 1 } },
    { re: '太淡|看不清|发灰|太浅|too pale|too faint|washed out', dir: { inkDepth: 1 } },
    { re: '太浓|太黑|墨太重|too dark|too heavy|too black', dir: { inkDepth: -1 } },
    { re: '笔太粗|线太粗|太粗|too thick|too bold', dir: { weight: -1 } },
    { re: '笔太细|线太细|太细|too thin|too weak', dir: { weight: 1 } },
    { re: '太满|太挤|太密|拥挤|画满了|cluttered|crowded|too busy|too dense', dir: { whitespace: 1, colorBudget: -1 } },
    { re: '太空|太稀|空荡|too empty|too sparse', dir: { whitespace: -1 } },
    { re: '颜色太多|太花|花哨|too colou?rful|too many colou?rs', dir: { colorBudget: -1 } },
    { re: '太素|颜色太少|单调|没颜色|more colou?r|too plain|dull', dir: { colorBudget: 1 } },
    { re: '字太小|字看不清|text too small|labels? too small', dir: { labelSize: 1 } },
    { re: '字太大|text too big|labels? too big', dir: { labelSize: -1 } },
    { re: '太快|看不过来|too fast|too quick', dir: { pace: 1 } },
    { re: '太慢|拖沓|too slow|drags', dir: { pace: -1 } },
    { re: '深色|暗色|夜间|磁青|泥金|dark mode|dark theme', cat: { theme: 'dark' } },
    { re: '浅色|白天|宣纸|light mode|light theme', cat: { theme: 'light' } },
    { re: '黑白|纯水墨|只要墨|black and white|pure ink', cat: { palette: 'mo' } },
    { re: '浅绛|淡彩|light ochre', cat: { palette: 'qianjiang' } },
    { re: '青绿|重彩|blue.?green', cat: { palette: 'qinglv' } },
    { re: '没骨|彩墨|泼彩|boneless|splashed colou?r', cat: { palette: 'mogu' } },
    { re: '位图|出图|生成的图|image model|generated image', cat: { source: 'image' } },
    { re: '代码画|会动的|逐笔|code-drawn|animated', cat: { source: 'code' } }
  ];
  var SHARED = { labelSize: 'labelSize', colorBudget: 'colorBudget', whitespace: 'whitespace', pace: 'pace', theme: 'theme' };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  // From a reference picture (design-taste scripts/measure.mjs) to ink knobs. Dry brush
  // is not measured (paper grain and JPEG noise look the same to a pixel counter).
  function fromMeasure(m) {
    var out = {};
    if (m.whitespace != null) out.whitespace = clamp(m.whitespace, 0.35, 0.85);
    if (m.colors != null) out.colorBudget = clamp(Math.round(m.colors), 0, 5);
    if (m.tones) out.inkDepth = clamp(0.15 + 0.75 * Math.min(1, (m.tones[0] + m.tones[1]) * 1.6), 0.15, 0.9);
    if (m.soft != null) out.wet = clamp(0.1 + 0.9 * m.soft, 0.1, 1);
    // colouring: no pigment -> pure ink; warm earth + a little indigo -> light ochre;
    // strong blue-green -> blue-green; anything else with colour -> boneless / colour ink
    if (m.colors === 0) out.palette = 'mo';
    else if (m.hues && m.hues.length) {
      var warm = m.hues.filter(function (h) { return h <= 45 || h >= 345; }).length;
      var bg = m.hues.filter(function (h) { return h >= 140 && h <= 230; }).length;
      out.palette = bg && bg >= warm ? 'qinglv' : warm && m.colors <= 2 ? 'qianjiang' : 'mogu';
    }
    return out;
  }

  function apply(t) {
    var k = t.knobs;
    return {
      brush: { depth: k.inkDepth, wet: k.wet, dry: k.dry, weight: k.weight, pace: k.pace },
      layout: { whitespace: k.whitespace, colorBudget: k.colorBudget, labelSize: k.labelSize },
      prefer: t.cats
    };
  }

  var PALETTE = { mo: '纯水墨', qianjiang: '浅绛', qinglv: '青绿', mogu: '没骨 / 彩墨' };
  function describe(a) {
    return ['draw with:',
      '  brush.js    Brush.create({ seed: 1, taste: ' + JSON.stringify(a.brush) + ' })',
      '  layout      about ' + Math.round(a.layout.whitespace * 100) + '% empty paper · at most ' + a.layout.colorBudget + ' pigments · labels ' + a.layout.labelSize + 'px',
      '  prefers     colouring ' + a.prefer.palette + ' (' + PALETTE[a.prefer.palette] + ') · theme ' + a.prefer.theme + ' · illustrations ' + a.prefer.source];
  }

  return { style: 'inkwash', KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON, shared: SHARED, SCENES: SCENES,
    abSkip: ['colorBudget', 'whitespace', 'pace'], fromMeasure: fromMeasure, apply: apply, describe: describe };
});
