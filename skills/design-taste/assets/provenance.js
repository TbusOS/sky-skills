/* design-taste · provenance.js — a small seal in the corner of every drawing that was
 * drawn to someone's taste. Click it: which knobs were moved away from the house
 * style, to what, and the reactions that moved them.
 *
 * Why: "it learned me" is only believable if the reader can check it. The list is the
 * engine's explain() output, the same rows `taste.mjs explain` prints, so the page
 * and the command line can never tell two different stories.
 *
 *   TasteProvenance.mark(figureEl, engine.explain(taste), { lang: 'zh', stamp: engine.stampOf(taste) })
 *
 * figureEl gets position:relative if it has none; the SVG inside (if any) gets
 * data-taste = stamp, so a saved SVG still says what taste it was drawn with.
 * Exported wallpapers and videos do not get the seal (they are finished pictures);
 * the export scripts add a one-line colophon only with --provenance.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TasteProvenance = factory();
})(this, function () {
  'use strict';

  var CSS = '.tp-seal{position:absolute;right:8px;bottom:8px;width:26px;height:26px;border:0;border-radius:3px;' +
    'background:var(--tp-seal,#b8322a);color:#fff;font:600 14px/26px "LXGW WenKai Screen","Noto Serif SC",serif;cursor:pointer;' +
    'opacity:.82;padding:0;box-shadow:0 0 0 1px rgba(0,0,0,.08)}.tp-seal:hover,.tp-seal:focus-visible{opacity:1}' +
    '.tp-pop{position:absolute;right:8px;bottom:40px;max-width:min(360px,calc(100% - 16px));max-height:70%;overflow:auto;' +
    'background:var(--tp-bg,#f8f3e7);color:var(--tp-fg,#2e2a26);border:1px solid var(--tp-rule,#d9ccb2);border-radius:6px;' +
    'padding:10px 12px;font:13px/1.5 "Noto Serif SC",serif;text-align:left;z-index:5;box-shadow:0 4px 18px rgba(0,0,0,.12)}' +
    '.tp-pop h4{margin:0 0 6px;font-size:13px}.tp-pop ul{margin:0;padding:0 0 0 1em}.tp-pop li{margin:0 0 6px}' +
    '.tp-pop small{display:block;opacity:.75}.tp-pop[hidden]{display:none}';
  var injected = false;
  function injectCss(doc) {
    if (injected || !doc || !doc.head) return;
    var st = doc.createElement('style'); st.textContent = CSS; doc.head.appendChild(st); injected = true;
  }

  var KIND = {
    zh: { pick: '二选一', say: '说了', keep: '留下', drop: '删掉', review: '审查', ref: '参考图' },
    en: { pick: 'picked', say: 'said', keep: 'kept', drop: 'deleted', review: 'review', ref: 'reference' }
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // The list as HTML. rows: engine.explain(t).
  function render(rows, lang) {
    var zh = lang !== 'en', K = KIND[zh ? 'zh' : 'en'];
    if (!rows.length) return '<h4>' + (zh ? '按默认画的,还没学到偏好' : 'House style — nothing learned yet') + '</h4>';
    var out = '<h4>' + (zh ? '这张按你的口味改了:' : 'Drawn to your taste:') + '</h4><ul>';
    rows.forEach(function (r) {
      out += '<li><b>' + esc(zh ? r.zh : r.en) + '</b> ' + esc(r.def) + ' → ' + esc(r.value);
      if (r.floor != null) out += zh ? '(下限 ' + r.floor + ')' : ' (floor ' + r.floor + ')';
      (r.why || []).forEach(function (w) {
        var src = w.style ? (zh ? '来自 ' + w.style + ',' : 'from ' + w.style + ', ') : '';
        var sc = w.scene ? (zh ? '场景 ' + w.scene + ',' : 'scene ' + w.scene + ', ') : '';
        out += '<small>' + esc(String(w.ts || '').slice(0, 10)) + ' ' + esc(K[w.kind] || w.kind) + ' ' + esc(w.note || '') +
          '(' + esc(src + sc) + esc(w.from) + ' → ' + esc(w.to) + ')</small>';
      });
      if (r.count > (r.why || []).length) out += '<small>' + (zh ? '……共 ' + r.count + ' 条' : '… ' + r.count + ' in all') + '</small>';
      out += '</li>';
    });
    return out + '</ul>';
  }

  function mark(host, rows, opts) {
    opts = opts || {};
    var doc = host.ownerDocument; injectCss(doc);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var svg = host.querySelector('svg');
    if (svg && opts.stamp) svg.setAttribute('data-taste', opts.stamp);
    var old = host.querySelector('.tp-seal'); if (old) old.remove();
    var oldPop = host.querySelector('.tp-pop'); if (oldPop) oldPop.remove();
    var b = doc.createElement('button'), pop = doc.createElement('div');
    b.type = 'button'; b.className = 'tp-seal'; b.textContent = opts.lang === 'en' ? 'T' : '味';
    b.setAttribute('aria-label', opts.lang === 'en' ? 'Why it looks like this' : '为什么画成这样');
    b.setAttribute('aria-expanded', 'false');
    pop.className = 'tp-pop'; pop.hidden = true; pop.innerHTML = render(rows, opts.lang);
    b.addEventListener('click', function () { pop.hidden = !pop.hidden; b.setAttribute('aria-expanded', String(!pop.hidden)); });
    host.appendChild(pop); host.appendChild(b);
    return { seal: b, pop: pop };
  }

  return { mark: mark, render: render, CSS: CSS };
});
