/* design-taste · shared.js — the five knobs every design style shares, and the words
 * that move them.
 *
 * Why only five: a reader who says "the labels are too small" in a pencil drawing
 * means the same thing in any other style. "Too much dry-brush" means nothing to a
 * pencil. So only knobs whose meaning survives a change of style travel between
 * styles: label size, number of colours, empty space, animation pace, theme.
 * Everything else (hatch spacing, ink wetness …) stays inside its own style.
 *
 * Each style's taste-profile.js says which of its knobs is which shared knob
 * (`shared: { labelSize: 'labelSize', … }`). A record from another style travels as
 * "how far from that style's default, as a share of that style's range", never as
 * a raw value: graphite's default empty space is 0.45; for a style whose default is
 * 0.6, copying 0.5 across would make it *fuller*, not emptier.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TasteShared = factory();
})(this, function () {
  'use strict';

  var KNOBS = {
    labelSize:   { zh: '字号', en: 'label size' },
    colorBudget: { zh: '颜色数', en: 'number of colours' },
    whitespace:  { zh: '留白', en: 'empty space' },
    pace:        { zh: '节奏(大=慢)', en: 'pace (big = slow)' }
  };
  var CATS = {
    theme: { values: ['light', 'dark', 'auto'], zh: '主题', en: 'theme' }
  };

  // Words that mean the same thing in every style. Only these travel to other styles;
  // a style's own word list (taste-profile.js LEXICON) still decides what they do
  // inside that style.
  var LEXICON = [
    { re: '字太小|字看不清|too small text|text too small|labels? too small', dir: { labelSize: 1 } },
    { re: '字太大|text too big|labels? too big', dir: { labelSize: -1 } },
    { re: '颜色太多|太花|花哨|too colou?rful|too many colou?rs|rainbow', dir: { colorBudget: -1 } },
    { re: '太素|单调|颜色太少|没颜色|dull|too plain|monotone|more colou?r', dir: { colorBudget: 1 } },
    { re: '太密|太满|拥挤|太挤|密密麻麻|too dense|cluttered|crowded|too busy', dir: { whitespace: 1 } },
    { re: '太空|太稀|太疏|空荡|too sparse|too empty', dir: { whitespace: -1 } },
    { re: '太快|看不过来|too fast|too quick', dir: { pace: 1 } },
    { re: '太慢|拖沓|too slow|drags', dir: { pace: -1 } },
    { re: '深色|暗色|夜间|黑底|dark mode|dark theme', cat: { theme: 'dark' } },
    { re: '浅色|亮色|白天|light mode|light theme', cat: { theme: 'light' } }
  ];

  return { KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON };
});
