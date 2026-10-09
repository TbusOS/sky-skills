/* graphite-design · player.js — small page helpers for graphite drawings.
 *
 * A drawing's motion is plain CSS animation (sketch.js writes the delays), so it
 * plays with no JavaScript at all. This file adds what CSS cannot do:
 *   - replay a figure when it scrolls into view (the first time) or on a button
 *   - scrub: pause every animation inside a figure and set them all to time t
 *   - theme (light / dark / follow the system) and language switches
 * Seeking uses the Web Animations API on the figure's own CSS animations — the
 * same call scripts/export.mjs makes for every video frame, so what a reader
 * scrubs to and what a video shows at that second are the same picture.
 *
 *   Graphite.replay(svg)     Graphite.seek(svg, seconds)     Graphite.duration(svg)
 */
(function () {
  'use strict';
  var root = document.documentElement;

  // ── theme ──
  function systemDark() { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches; }
  function currentTheme() { return root.getAttribute('data-theme') || (systemDark() ? 'dark' : 'light'); }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('graphite-theme', t); } catch (e) { /* private mode */ }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(t === 'dark')); });
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
    b.addEventListener('click', function () { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); });
  });

  // ── language (same key as the other sky-skills pages) ──
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    try { localStorage.setItem('sky-lang', l); } catch (e) { /* private mode */ }
    document.querySelectorAll('[data-lang-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-toggle') === l)); });
    document.querySelectorAll('[data-label-zh]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute(l === 'zh' ? 'data-label-zh' : 'data-label-en')); });
  }
  document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-toggle')); });
  });
  try { var savedLang = localStorage.getItem('sky-lang'); if (savedLang === 'en' || savedLang === 'zh') setLang(savedLang); } catch (e) { /* private mode */ }

  // ── figures ──
  function anims(el) { return el && el.getAnimations ? el.getAnimations({ subtree: true }) : []; }
  function duration(svg) {
    var d = parseFloat(svg.getAttribute('data-dur'));
    if (d) return d;
    var end = 0;
    anims(svg).forEach(function (a) { var t = a.effect.getComputedTiming(); if (isFinite(t.endTime)) end = Math.max(end, t.endTime); });
    return end / 1000;
  }
  function replay(svg) {
    if (svg.hasAttribute('data-still')) {
      svg.removeAttribute('data-still');      // CSS starts the animations fresh
      getComputedStyle(svg).opacity;           // make the browser notice before we touch them
    }
    anims(svg).forEach(function (a) { a.currentTime = 0; a.play(); });
  }
  function seek(svg, t) {
    if (svg.hasAttribute('data-still')) { svg.removeAttribute('data-still'); getComputedStyle(svg).opacity; }
    anims(svg).forEach(function (a) { a.pause(); a.currentTime = t * 1000; });
  }
  window.Graphite = { replay: replay, seek: seek, duration: duration, anims: anims, setTheme: setTheme, setLang: setLang };

  // On a narrow screen a figure keeps its labels readable (min-width) and scrolls
  // sideways instead of shrinking. Say so under the figures that actually overflow,
  // so a reader knows the rest is there.
  function panHints() {
    document.querySelectorAll('.gpan').forEach(function (p) {
      var over = p.scrollWidth > p.clientWidth + 2, hint = p.nextElementSibling;
      var has = hint && hint.classList && hint.classList.contains('pan-hint');
      if (over && !has) {
        hint = document.createElement('p'); hint.className = 'pan-hint';
        hint.innerHTML = '<span class="lang-zh">← 左右拖动看全图 →</span><span class="lang-en">← drag sideways to see it all →</span>';
        p.parentNode.insertBefore(hint, p.nextSibling);
      } else if (!over && has) hint.remove();
    });
  }
  panHints();
  window.addEventListener('resize', function () { clearTimeout(panHints.t); panHints.t = setTimeout(panHints, 150); });

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // motion figures play once when they first come into view (they already played at
  // load, off screen, where nobody saw it)
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); replay(e.target); } });
    }, { threshold: 0.35 });
    document.querySelectorAll('svg.gfig[data-motion]').forEach(function (s) { if (!s.closest('[data-no-autoplay]')) io.observe(s); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-play]');
    if (!b) return;
    var svg = document.querySelector('svg[data-fig="' + b.getAttribute('data-play') + '"]');
    if (svg) replay(svg);
  });

  // scrubbers: <input type=range data-scrub="figure-id"> (+ optional play button data-scrub-play)
  document.querySelectorAll('input[data-scrub]').forEach(function (r) {
    var svg = document.querySelector('svg[data-fig="' + r.getAttribute('data-scrub') + '"]');
    if (!svg) return;
    var d = duration(svg), out = document.querySelector('[data-scrub-out="' + r.getAttribute('data-scrub') + '"]');
    r.max = String(d); r.step = '0.05';
    function show(t) { if (out) out.textContent = (+t).toFixed(1) + ' / ' + d.toFixed(1) + ' s'; }
    r.addEventListener('input', function () { seek(svg, +r.value); show(r.value); });
    var pb = document.querySelector('[data-scrub-play="' + r.getAttribute('data-scrub') + '"]'), raf = 0;
    if (pb) pb.addEventListener('click', function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; pb.setAttribute('aria-pressed', 'false'); return; }
      var t0 = performance.now() - (+r.value >= d ? 0 : +r.value) * 1000;
      pb.setAttribute('aria-pressed', 'true');
      (function step(now) {
        var t = Math.min(d, (now - t0) / 1000);
        r.value = String(t); seek(svg, t); show(t);
        raf = t < d ? requestAnimationFrame(step) : 0;
        if (!raf) pb.setAttribute('aria-pressed', 'false');
      })(performance.now());
    });
    document.querySelectorAll('[data-scrub-step="' + r.getAttribute('data-scrub') + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = Math.max(0, Math.min(d, +r.value + (+b.getAttribute('data-delta')))); r.value = String(t); seek(svg, t); show(t);
      });
    });
    show(0);
  });
})();
