/* === Atelier Design System — interaction engine ===
 * Last verified: 2026-08-14
 * Docs: ../references/motion.md · ../references/app-shell.md
 *
 * Why this file exists at all: atelier draws APPLICATIONS, and an application
 * that cannot be clicked is a screenshot. The other design skills in this repo
 * generate documents, where JS is decoration. Here it is half the deliverable.
 *
 * Every behaviour is ATTRIBUTE-DRIVEN — a page never writes atelier JS, it
 * writes data-* on markup. That keeps the generator honest: if a behaviour is
 * not expressible as an attribute, it does not belong in a canonical page.
 *
 *   data-route="<pane>"        rail item → shows [data-pane="<pane>"]
 *   data-tab="<pane>"          tab → shows [data-tabpane="<pane>"]
 *   data-seg-group="<name>"    segmented control member
 *   data-accordion             <button> toggles its sibling body
 *   data-expand="<id>"         result row toggles #<id>
 *   data-switch                toggle switch
 *   data-sort="<col>"          table header → sorts on td[data-col]
 *   data-count-to="<number>"   KPI counts 0 → N, then restores markup text
 *   data-reveal                fades in on scroll
 *   data-grow                  bar/meter fill grows to its inline height/width
 *   data-lang-toggle           EN / 中文
 *   data-theme-toggle          light / dark
 *
 * FREEZE CONTRACT — the reason the gates can screenshot this deterministically:
 * add ?freeze=1 to the URL, or set html[data-motion="off"], and every animated
 * value jumps to its terminal state on the first frame. The terminal state is
 * ALWAYS what is already written in the markup, so a no-JS reader, the audit
 * gate and the screenshot all agree. JS never invents a number.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var frozen =
    /[?&]freeze=1/.test(location.search) ||
    root.getAttribute('data-motion') === 'off' ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (frozen) root.setAttribute('data-motion', 'off');

  function all(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ---------- 1. Rail routing ---------- */
  /* Panes are real markup, hidden with [hidden]. Nothing is fetched or built
   * at runtime — a reader with JS off still gets every pane's content in the
   * DOM, and the audit gate sees the default pane exactly as shipped. */
  function initRoutes() {
    var items = all('[data-route]');
    if (!items.length) return;
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var target = item.getAttribute('data-route');
        items.forEach(function (i) {
          i.classList.toggle('is-active', i === item);
          if (i.hasAttribute('aria-current')) i.removeAttribute('aria-current');
        });
        item.setAttribute('aria-current', 'page');
        all('[data-pane]').forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-pane') !== target;
        });
        var title = item.getAttribute('data-route-title');
        var slot = document.querySelector('[data-route-title-slot]');
        if (title && slot) slot.textContent = title;
        replay();
      });
    });
  }

  /* ---------- 2. Tabs ---------- */
  function initTabs() {
    var groups = {};
    all('[data-tab]').forEach(function (tab) {
      var g = tab.getAttribute('data-tab-group') || 'default';
      (groups[g] = groups[g] || []).push(tab);
    });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = tab.getAttribute('data-tab');
          groups[g].forEach(function (t) {
            t.classList.toggle('is-active', t === tab);
            t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
          });
          all('[data-tabpane]').forEach(function (p) {
            if ((p.getAttribute('data-tab-group') || 'default') !== g) return;
            p.hidden = p.getAttribute('data-tabpane') !== target;
          });
          replay();
        });
      });
    });
  }

  /* ---------- 3. Segmented controls ---------- */
  /* Decorative by contract: switching the range does NOT rewrite the numbers.
   * A canonical page must never show data it cannot source — see
   * dos-and-donts §7 (no fake data mutation). */
  function initSegments() {
    var groups = {};
    all('[data-seg-group]').forEach(function (btn) {
      var g = btn.getAttribute('data-seg-group');
      (groups[g] = groups[g] || []).push(btn);
    });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (btn) {
        btn.addEventListener('click', function () {
          groups[g].forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        });
      });
    });
  }

  /* ---------- 4. Accordions ---------- */
  function initAccordions() {
    all('[data-accordion]').forEach(function (head) {
      var body = head.parentNode.querySelector('.atl-accordion__body');
      if (!body) return;
      var sign = head.querySelector('.atl-accordion__sign');
      head.addEventListener('click', function () {
        var open = !body.hidden;
        body.hidden = open;
        head.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (sign) sign.textContent = open ? '+' : '−';
      });
    });
  }

  /* ---------- 5. Expandable result rows ---------- */
  function initExpanders() {
    all('[data-expand]').forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('data-expand'));
      if (!panel) return;
      trigger.addEventListener('click', function (e) {
        if (e.target.closest('a, button') && e.target.closest('a, button') !== trigger) return;
        var open = !panel.hidden;
        panel.hidden = open;
        trigger.classList.toggle('is-open', !open);
        trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!open) replay(panel);
      });
    });
  }

  /* ---------- 6. Switches ---------- */
  function initSwitches() {
    all('[data-switch]').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var on = sw.classList.toggle('is-on');
        sw.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
  }

  /* ---------- 7. Table sort ---------- */
  /* Sorts the rows already in the DOM. Numeric when every cell parses as a
   * number after stripping currency/percent, lexical otherwise. */
  function initSort() {
    all('[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var table = th.closest('table');
        var tbody = table && table.querySelector('tbody');
        if (!tbody) return;
        var col = th.getAttribute('data-sort');
        var dir = th.getAttribute('data-sort-dir') === 'asc' ? -1 : 1;
        all('[data-sort]', table).forEach(function (o) { o.removeAttribute('data-sort-dir'); });
        th.setAttribute('data-sort-dir', dir === 1 ? 'asc' : 'desc');

        var rows = all('tr', tbody);
        var read = function (tr) {
          var cell = tr.querySelector('[data-col="' + col + '"]');
          if (!cell) return '';
          return cell.getAttribute('data-value') !== null
            ? cell.getAttribute('data-value')
            : cell.textContent.trim();
        };
        var numeric = rows.every(function (tr) {
          var v = read(tr).replace(/[$,%\s+]/g, '').replace(/^-/, '');
          return v !== '' && !isNaN(Number(v));
        });
        rows.sort(function (a, b) {
          var x = read(a), y = read(b);
          if (numeric) {
            return dir * (parseFloat(x.replace(/[$,%\s]/g, '')) - parseFloat(y.replace(/[$,%\s]/g, '')));
          }
          return dir * x.localeCompare(y);
        });
        rows.forEach(function (tr) { tbody.appendChild(tr); });
      });
    });
  }

  /* ---------- 8. Count-up ---------- */
  /* The markup already holds the final string. We stash it, animate a number
   * toward it, then restore the ORIGINAL text — so formatting (currency,
   * separators, suffixes) is never reconstructed by JS and never drifts. */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    if (isNaN(target)) return;
    var final = el.getAttribute('data-count-final') || el.textContent;
    el.setAttribute('data-count-final', final);
    if (frozen) { el.textContent = final; return; }

    var decimals = (String(el.getAttribute('data-count-to')).split('.')[1] || '').length;
    var dur = 900, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = final;
    }
    el.textContent = (0).toFixed(decimals);
    requestAnimationFrame(step);
  }

  /* ---------- 9. Bar / meter growth ---------- */
  /* Terminal size lives in the inline style. We drop to zero for one frame
   * and let CSS transition it back — no size is computed here. */
  function grow(el) {
    var axis = el.getAttribute('data-grow') === 'width' ? 'width' : 'height';
    var final = el.style[axis];
    if (!final) return;
    if (frozen) return;
    el.style[axis] = '0';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.style[axis] = final; });
    });
  }

  /* ---------- 10. Reveal on scroll ---------- */
  function initReveal() {
    var els = all('[data-reveal]');
    if (frozen || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Re-run the one-shot animations inside a pane that just became visible. */
  function replay(ctx) {
    all('[data-count-to]', ctx).forEach(countUp);
    all('[data-grow]', ctx).forEach(grow);
    all('[data-reveal]', ctx).forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 11. Language + theme ---------- */
  function initToggles() {
    all('[data-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang-toggle');
        root.setAttribute('data-lang', lang);
        root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
        all('[data-lang-toggle]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
    all('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.setAttribute('data-theme',
          root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    });
  }

  function init() {
    initRoutes();
    initTabs();
    initSegments();
    initAccordions();
    initExpanders();
    initSwitches();
    initSort();
    initToggles();
    initReveal();
    all('[data-count-to]').forEach(countUp);
    all('[data-grow]').forEach(grow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
