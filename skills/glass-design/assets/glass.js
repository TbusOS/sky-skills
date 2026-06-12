/* === Glass Design System — motion engine ===
 * Attribute-driven, zero-dependency. Modules:
 *   [data-reveal]               scroll-in fade/rise (IntersectionObserver)
 *   [data-count-to="N"]         stat count-up — FINAL VALUE LIVES IN MARKUP,
 *                               JS only animates 0 → N then restores the text
 *   [data-tilt]                 3D tilt following the pointer (≤6°, hero only)
 *   [data-draw]                 SVG stroke path-draw on first view
 *   [data-parallax="0.1"]       slow translate on scroll (decorative only)
 *   .glass-theme-toggle         dark/light flip via html[data-theme] + localStorage
 *
 * Freeze contract (deterministic rendering for the review gates):
 * any of  (a) prefers-reduced-motion: reduce   (b) URL hash contains "freeze"
 *         (c) <html data-motion-freeze>
 * → html[data-motion="off"], no module installs, page renders its terminal
 * state — which is byte-identical to the static markup. The review harness
 * runs Playwright with reducedMotion:'reduce' and relies on this.
 */
(function () {
  var html = document.documentElement;
  html.classList.add('js-enabled');

  /* ---------- theme ---------- */
  var theme = null;
  try {
    var q = new URLSearchParams(location.search).get('theme');
    if (q === 'light' || q === 'dark') theme = q;
  } catch (e) { /* file:// without search support — fall through */ }
  if (!theme) {
    var h = /(^|[#&,])(light|dark)\b/.exec(location.hash || '');
    if (h) theme = h[2];
  }
  if (!theme) {
    try {
      var saved = localStorage.getItem('sky-theme');
      if (saved === 'light' || saved === 'dark') theme = saved;
    } catch (e) { /* storage unavailable */ }
  }
  if (!theme) theme = html.getAttribute('data-theme') || 'dark';

  function applyTheme(t, persist) {
    html.setAttribute('data-theme', t);
    if (persist) {
      try { localStorage.setItem('sky-theme', t); } catch (e) { /* ignore */ }
    }
    var btns = document.querySelectorAll('.glass-theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = t === 'dark' ? 'light' : 'dark';
      btns[i].setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    }
  }
  applyTheme(theme, false);
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(html.getAttribute('data-theme') || 'dark', false);
    var btns = document.querySelectorAll('.glass-theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
      });
    }
  });

  /* ---------- mobile nav (hamburger) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var burgers = document.querySelectorAll('.glass-nav-burger');
    for (var i = 0; i < burgers.length; i++) {
      burgers[i].addEventListener('click', function (e) {
        var nav = e.currentTarget.closest('.glass-nav');
        if (!nav) return;
        var open = nav.classList.toggle('is-open');
        e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  });

  /* ---------- freeze gate ---------- */
  var frozen = false;
  try {
    frozen =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      /freeze/.test(location.hash || '') ||
      html.hasAttribute('data-motion-freeze');
  } catch (e) { frozen = true; }
  if (frozen) {
    html.setAttribute('data-motion', 'off');
    return; // terminal state == static markup; install nothing
  }

  var ready = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  ready(function () {
    var supportsIO = 'IntersectionObserver' in window;

    /* ---------- scroll reveal ---------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (revealEls.length) {
      if (!supportsIO) {
        revealEls.forEach(function (el) { el.classList.add('is-in'); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            var sibs = el.parentElement
              ? Array.prototype.filter.call(el.parentElement.children, function (c) {
                  return c.hasAttribute && c.hasAttribute('data-reveal');
                })
              : [el];
            var idx = sibs.indexOf(el);
            el.style.transitionDelay = (Math.min(idx > 0 ? idx : 0, 4) * 70) + 'ms';
            el.classList.add('is-in');
            io.unobserve(el);
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
      }
    }

    /* ---------- count-up ---------- */
    var countEls = Array.prototype.slice.call(document.querySelectorAll('[data-count-to]'));
    function runCount(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (!isFinite(target)) return;
      var finalText = el.textContent; // markup is the source of truth
      var decimals = ((el.getAttribute('data-count-to').split('.')[1]) || '').length;
      var prefix = el.getAttribute('data-count-prefix') || '';
      var suffix = el.getAttribute('data-count-suffix') || '';
      var t0 = null;
      var dur = 1200;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
        var num = (target * eased).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.textContent = p >= 1 ? finalText : prefix + num + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (countEls.length && supportsIO) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          runCount(en.target);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      countEls.forEach(function (el) { cio.observe(el); });
    }

    /* ---------- SVG path draw ---------- */
    var drawSvgs = Array.prototype.slice.call(document.querySelectorAll('svg[data-draw]'));
    function primeDraw(svg) {
      var paths = Array.prototype.slice.call(
        svg.querySelectorAll('path[stroke], line[stroke], polyline[stroke]')
      ).slice(0, 8);
      paths.forEach(function (p) {
        var len = 0;
        try { len = p.getTotalLength(); } catch (e) { return; }
        if (!len) return;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
      });
      return paths;
    }
    function playDraw(paths) {
      paths.forEach(function (p, i) {
        if (!p.style.strokeDasharray) return;
        p.style.transition = 'stroke-dashoffset 1100ms ' + (i * 90) + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
        p.style.strokeDashoffset = '0';
        p.addEventListener('transitionend', function done() {
          p.style.strokeDasharray = '';
          p.style.transition = '';
          p.removeEventListener('transitionend', done);
        });
      });
    }
    if (drawSvgs.length && supportsIO) {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          playDraw(en.target.__glassDrawPaths || []);
          dio.unobserve(en.target);
        });
      }, { threshold: 0.3 });
      drawSvgs.forEach(function (svg) {
        svg.__glassDrawPaths = primeDraw(svg);
        dio.observe(svg);
      });
    }

    /* ---------- 3D tilt (≤1 element per viewport — see motion.md) ---------- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      Array.prototype.slice.call(document.querySelectorAll('[data-tilt]')).forEach(function (el) {
        var rect = null;
        var raf = null;
        var MAX_DEG = 6;
        el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
        el.addEventListener('pointermove', function (e) {
          if (!rect) rect = el.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            el.style.transform =
              'perspective(900px) rotateX(' + (-py * MAX_DEG).toFixed(2) + 'deg)' +
              ' rotateY(' + (px * MAX_DEG).toFixed(2) + 'deg)';
            raf = null;
          });
        });
        el.addEventListener('pointerleave', function () {
          rect = null;
          el.style.transform = '';
        });
      });
    }

    /* ---------- liquid cursor v2 — the pointer IS water ----------
     * Head bead refracts the real page behind it (backdrop-filter + SDF dome
     * displacement, RGB dispersion). Fast moves lay a continuous rivulet that
     * necks and breaks per Plateau–Rayleigh, then evaporates < 1s. Stopping
     * retracts nearby trail water back into the bead. Double-click bursts the
     * bead into radial tongues + satellites that surface-tension re-coalesce.
     * Light theme swaps the highlight bake. Never installed under freeze;
     * opt out per page with <html data-no-liquid>; runtime water/system
     * switch via .glass-cursor-toggle (localStorage sky-cursor). */
    if (!html.hasAttribute('data-no-liquid') &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        typeof CSS !== 'undefined' && CSS.supports &&
        CSS.supports('backdrop-filter', 'url(#x)')) {
      (function waterCursor() {
        var REFR = parseInt(html.getAttribute('data-water-refr'), 10) || 52;
        var TINT = html.hasAttribute('data-water-tint')
          ? (parseInt(html.getAttribute('data-water-tint'), 10) || 0) : 12;
        var mode = 'water';
        try {
          var savedCur = localStorage.getItem('sky-cursor');
          if (savedCur === 'system' || savedCur === 'water') mode = savedCur;
        } catch (e) { /* storage unavailable */ }

        /* --- SDF + bake: displacement / highlight / mask maps --- */
        function ellipseSDF(x, y, cx, cy, a, b) {
          var dx = (x - cx) / a, dy = (y - cy) / b;
          return (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(a, b);
        }
        function circleSDF(x, y, cx, cy, r) {
          var dx = x - cx, dy = y - cy;
          return Math.sqrt(dx * dx + dy * dy) - r;
        }
        var DISP_FS = 48; // displacement encode full-scale (px at scale=48)
        function bake(W, H, RES, sdf, domeRim, headX, headY, magK, edgeK) {
          var c = document.createElement('canvas');
          c.width = W * RES; c.height = H * RES;
          var ctx = c.getContext('2d');
          var disp = ctx.createImageData(W * RES, H * RES);
          var spec = ctx.createImageData(W * RES, H * RES);   // dark-bg highlights
          var specL = ctx.createImageData(W * RES, H * RES);  // light-bg variant
          var mask = ctx.createImageData(W * RES, H * RES);
          var e = 0.75;
          var Lx = -0.46, Ly = -0.64, Lz = 0.86;
          var Ln = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
          Lx /= Ln; Ly /= Ln; Lz /= Ln;
          for (var py = 0; py < H * RES; py++) for (var px = 0; px < W * RES; px++) {
            var x = px / RES, y = py / RES, i = (py * (W * RES) + px) * 4;
            var d = sdf(x, y);
            var a = Math.max(0, Math.min(1, (0.6 - d) / 1.2));
            mask.data[i] = 255; mask.data[i + 1] = 255; mask.data[i + 2] = 255;
            mask.data[i + 3] = Math.round(a * 255);
            var ox = 0, oy = 0, sR = 0, sG = 0, sB = 0, sA = 0;
            if (d < 1.5) {
              var gx = (sdf(x + e, y) - sdf(x - e, y)) / (2 * e);
              var gy = (sdf(x, y + e) - sdf(x, y - e)) / (2 * e);
              var gn = Math.max(Math.sqrt(gx * gx + gy * gy), 1e-4);
              gx /= gn; gy /= gn;
              var inside = Math.max(0, -d);
              var t = Math.max(0, Math.min(1, inside / domeRim));
              var Hh = Math.sin(t * Math.PI / 2), slope = Math.cos(t * Math.PI / 2);
              ox = (x - headX) * (-magK * Hh) + gx * (edgeK * slope * Hh);
              oy = (y - headY) * (-magK * Hh) + gy * (edgeK * slope * Hh);
              var nx = -gx * slope * 1.85, ny = -gy * slope * 1.85, nz = 1;
              var nn = Math.sqrt(nx * nx + ny * ny + nz * nz);
              nx /= nn; ny /= nn; nz /= nn;
              var dotNL = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
              var rz = 2 * dotNL * nz - Lz;
              var specV = Math.pow(Math.max(0, rz), 42) * 1.5 + Math.pow(Math.max(0, rz), 6) * 0.22;
              var fres = Math.pow(1 - Math.max(0, Math.min(1, nz)), 1.7);
              var rim = fres * 1.35, sheen = 0.08 * Hh;
              sR = Math.min(1, specV + rim * 0.72 + sheen);
              sG = Math.min(1, specV + rim * 0.86 + sheen);
              sB = Math.min(1, specV + rim * 1.0 + sheen);
              sA = Math.min(1, specV * 1.2 + rim * 0.85 + sheen);
              /* light-bg: dark refractive rim + contact shadow + white spec */
              var dsh = Math.max(0, gy) * slope * Hh;
              var aW = Math.min(1, specV * 1.15);
              var aD = Math.min(1, fres * 0.62 + dsh * 0.34);
              var aT = Math.min(1, aW + aD);
              var wF = (aW + aD) > 0 ? aW / (aW + aD) : 0;
              specL.data[i] = Math.round((wF + (1 - wF) * 0.16) * 255);
              specL.data[i + 1] = Math.round((wF + (1 - wF) * 0.21) * 255);
              specL.data[i + 2] = Math.round((wF + (1 - wF) * 0.28) * 255);
              specL.data[i + 3] = Math.round(aT * a * 255);
            }
            disp.data[i] = Math.max(0, Math.min(255, Math.round(128 + ox * 255 / DISP_FS)));
            disp.data[i + 1] = Math.max(0, Math.min(255, Math.round(128 + oy * 255 / DISP_FS)));
            disp.data[i + 2] = 128; disp.data[i + 3] = 255;
            spec.data[i] = Math.round(sR * 255);
            spec.data[i + 1] = Math.round(sG * 255);
            spec.data[i + 2] = Math.round(sB * 255);
            spec.data[i + 3] = Math.round(Math.max(0, Math.min(1, sA)) * a * 255);
          }
          function toURL(im) {
            var cc = document.createElement('canvas');
            cc.width = W * RES; cc.height = H * RES;
            cc.getContext('2d').putImageData(im, 0, 0);
            return cc.toDataURL();
          }
          return { disp: toURL(disp), spec: toURL(spec), specLight: toURL(specL), mask: toURL(mask) };
        }

        /* --- SVG filters: head lens (RGB dispersion) / rivulet / bead --- */
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
        defs.setAttribute('aria-hidden', 'true');
        defs.style.position = 'absolute';
        function dispChain(idp, mapExtra) {
          return '<filter id="' + idp + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
            '<feImage id="' + idp + 'Map" result="map" x="0" y="0"' + (mapExtra || '') + '/>' +
            '<feDisplacementMap id="' + idp + 'R" in="SourceGraphic" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G" result="dr"/>' +
            '<feColorMatrix in="dr" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr"/>' +
            '<feDisplacementMap id="' + idp + 'G" in="SourceGraphic" in2="map" scale="53" xChannelSelector="R" yChannelSelector="G" result="dg"/>' +
            '<feColorMatrix in="dg" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg"/>' +
            '<feDisplacementMap id="' + idp + 'B" in="SourceGraphic" in2="map" scale="58" xChannelSelector="R" yChannelSelector="G" result="db"/>' +
            '<feColorMatrix in="db" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb"/>' +
            '<feComposite in="cr" in2="cg" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg"/>' +
            '<feComposite in="rg" in2="cb" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rgb"/>' +
            '<feGaussianBlur in="rgb" stdDeviation="0.2" result="soft"/>' +
            '<feColorMatrix in="soft" type="saturate" values="1.22" result="sat"/>' +
            '<feComponentTransfer in="sat">' +
            '<feFuncR id="' + idp + 'FR" type="linear" slope="1.12"/>' +
            '<feFuncG id="' + idp + 'FG" type="linear" slope="1.12"/>' +
            '<feFuncB id="' + idp + 'FB" type="linear" slope="1.12"/>' +
            '</feComponentTransfer></filter>';
        }
        defs.innerHTML =
          dispChain('glassWaterHead') +
          dispChain('glassWaterBead', ' width="30" height="30"') +
          '<filter id="glassWaterTrail" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="n"/>' +
          '<feDisplacementMap id="glassWaterTrailDisp" in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
          '<feGaussianBlur in="d" stdDeviation="0.25" result="db"/>' +
          '<feColorMatrix in="db" type="saturate" values="1.15" result="sat"/>' +
          '<feComponentTransfer in="sat">' +
          '<feFuncR id="glassWaterTrailFR" type="linear" slope="1.10"/>' +
          '<feFuncG id="glassWaterTrailFG" type="linear" slope="1.10"/>' +
          '<feFuncB id="glassWaterTrailFB" type="linear" slope="1.10"/>' +
          '</feComponentTransfer></filter>';
        document.body.appendChild(defs);
        function setScale(v) {
          document.getElementById('glassWaterHeadR').setAttribute('scale', v);
          document.getElementById('glassWaterHeadG').setAttribute('scale', Math.round(v * 1.10));
          document.getElementById('glassWaterHeadB').setAttribute('scale', Math.round(v * 1.21));
          var dv = Math.round(v * 0.62);
          document.getElementById('glassWaterBeadR').setAttribute('scale', dv);
          document.getElementById('glassWaterBeadG').setAttribute('scale', Math.round(dv * 1.10));
          document.getElementById('glassWaterBeadB').setAttribute('scale', Math.round(dv * 1.21));
          document.getElementById('glassWaterTrailDisp').setAttribute('scale', Math.round(v * 0.5));
        }
        setScale(REFR);

        /* --- bake head states (6 equal-area stretch ellipses) + bead --- */
        var R0 = 16, PADE = 3;
        var ASPECTS = [1.12, 1.25, 1.42, 1.62, 1.85, 2.10];
        var STATES = [];
        for (var si = 0; si < ASPECTS.length; si++) {
          (function (s) {
            var a = R0 * Math.sqrt(s), b = R0 / Math.sqrt(s);
            var W = Math.ceil(2 * (a + PADE)), H = Math.ceil(2 * (b + PADE));
            STATES.push({
              asp: s, a: a, b: b, W: W, H: H,
              maps: bake(W, H, 2, function (x, y) { return ellipseSDF(x, y, W / 2, H / 2, a, b); },
                b * 0.92, W / 2, H / 2, 0.72, 2.8)
            });
          })(ASPECTS[si]);
        }
        var DSZ = 30;
        var BEAD = bake(DSZ, DSZ, 2, function (x, y) { return circleSDF(x, y, DSZ / 2, DSZ / 2, DSZ / 2 - 2); },
          DSZ / 2 - 2, DSZ / 2, DSZ / 2, 0.58, 3.4);
        document.getElementById('glassWaterBeadMap').setAttribute('href', BEAD.disp);

        /* --- elements --- */
        var head = document.createElement('div');
        head.className = 'glass-water-head';
        head.setAttribute('aria-hidden', 'true');
        head.style.backdropFilter = 'url(#glassWaterHead)';
        head.style.webkitBackdropFilter = 'url(#glassWaterHead)';
        var trailEl = document.createElement('div');
        trailEl.className = 'glass-water-trail';
        trailEl.setAttribute('aria-hidden', 'true');
        trailEl.style.backdropFilter = 'url(#glassWaterTrail)';
        trailEl.style.webkitBackdropFilter = 'url(#glassWaterTrail)';
        var fx = document.createElement('canvas');
        fx.className = 'glass-water-fx';
        fx.setAttribute('aria-hidden', 'true');
        document.body.appendChild(trailEl);
        document.body.appendChild(fx);
        document.body.appendChild(head);
        var fctx = fx.getContext('2d');
        var FXDPR = Math.min(window.devicePixelRatio || 1, 2);
        function sizeFx() {
          fx.width = Math.floor(window.innerWidth * FXDPR);
          fx.height = Math.floor(window.innerHeight * FXDPR);
        }
        sizeFx();
        window.addEventListener('resize', sizeFx);

        function isLight() { return html.getAttribute('data-theme') === 'light'; }
        var headMap = document.getElementById('glassWaterHeadMap');
        var curState = -1;
        function setState(i, force) {
          if (i === curState && !force) return;
          curState = i;
          var st = STATES[i];
          head.style.width = st.W + 'px'; head.style.height = st.H + 'px';
          head.style.backgroundImage = 'url(' + (isLight() ? st.maps.specLight : st.maps.spec) + ')';
          head.style.webkitMaskImage = 'url(' + st.maps.mask + ')';
          head.style.maskImage = 'url(' + st.maps.mask + ')';
          head.style.backgroundColor = 'rgba(140,200,228,' + (TINT * 0.011) + ')';
          headMap.setAttribute('href', st.maps.disp);
          headMap.setAttribute('width', st.W); headMap.setAttribute('height', st.H);
        }
        setState(0);
        new MutationObserver(function () {
          setState(curState, true);
          var b2 = isLight() ? '1.0' : '1.12', t2 = isLight() ? '1.0' : '1.10';
          ['FR', 'FG', 'FB'].forEach(function (sfx) {
            document.getElementById('glassWaterHead' + sfx).setAttribute('slope', b2);
            document.getElementById('glassWaterBead' + sfx).setAttribute('slope', b2);
            document.getElementById('glassWaterTrail' + sfx).setAttribute('slope', t2);
          });
          for (var j = 0; j < drops.length; j++) {
            drops[j].el.style.backgroundImage = 'url(' + (isLight() ? BEAD.specLight : BEAD.spec) + ')';
          }
        }).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

        /* --- physics state --- */
        var tx = -300, ty = -300, x = -300, y = -300, vx = 0, vy = 0;
        var active = false, pointing = false;
        var STIFF = 0.22, DAMP = 0.72;
        var theta = 0, vol = 1.0, wob = 0, wobV = 0;
        var stillSince = 0, lastNow = 0, prevSpeed = 0, lastSat = 0;
        var expl = null;
        var pts = [], cumArc = 0, lastDep = null, strokePh = Math.random() * 6.28, lastDepT = 0;
        var LIFE = 920, NECK_T = 0.26, LAM = 27;
        var DEPOSIT_V = 4, GAP_PX = 3;
        var drops = [], POOL = [];

        document.addEventListener('pointermove', function (e) {
          tx = e.clientX; ty = e.clientY;
          if (mode !== 'water') return;
          if (!active) {
            active = true; x = tx; y = ty;
            html.classList.add('glass-liquid');
            head.style.opacity = '1';
          }
          var t = e.target;
          pointing = !!(t && t.closest && t.closest('a, button, input, select, textarea, [role="button"]'));
        }, { passive: true });
        document.addEventListener('pointerleave', function () { head.style.opacity = '0'; });
        document.addEventListener('pointerenter', function () {
          if (active && mode === 'water') head.style.opacity = '1';
        });
        document.addEventListener('mousedown', function (e) {
          if (mode === 'water' && e.detail > 1) e.preventDefault(); // dblclick must not select text
        });
        document.addEventListener('dblclick', function () {
          if (mode !== 'water' || !active) return;
          if (expl && lastNow - expl.t0 < 1300) return;
          burst(lastNow || performance.now());
        });

        function angDiff(a, b) {
          var d = a - b;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          return d;
        }

        /* --- rivulet deposit (interpolated so fast moves stay continuous) --- */
        function deposit(now, sp, st, sV) {
          var bx = x - Math.cos(theta) * st.a * sV * 0.7;
          var by = y - Math.sin(theta) * st.a * sV * 0.7;
          var w0 = Math.min(9.5, 2.6 + R0 * sV * 0.16 + Math.min(sp, 34) * 0.075);
          if (lastDep && now - lastDepT <= 120) {
            var dgap = Math.sqrt(Math.pow(bx - lastDep.x, 2) + Math.pow(by - lastDep.y, 2));
            if (dgap < GAP_PX) return;
            var steps = Math.min(30, Math.floor(dgap / 4));
            for (var k = 1; k <= steps; k++) {
              var f = k / (steps + 1);
              cumArc += dgap / (steps + 1);
              pts.push({ x: lastDep.x + (bx - lastDep.x) * f, y: lastDep.y + (by - lastDep.y) * f, t: now, w0: w0, arc: cumArc, ph: strokePh, retr: 1 });
            }
            cumArc += dgap / (steps + 1);
          } else {
            strokePh = Math.random() * 6.28;
            cumArc += GAP_PX;
          }
          pts.push({ x: bx, y: by, t: now, w0: w0, arc: cumArc, ph: strokePh, retr: 1 });
          lastDep = { x: bx, y: by }; lastDepT = now;
          vol = Math.max(0.55, vol - 0.0035);
        }
        function trailWidth(p, now) {
          var age = (now - p.t) / LIFE;
          if (age >= 1) return 0;
          var env = age < NECK_T ? 1 : Math.pow(1 - (age - NECK_T) / (1 - NECK_T), 1.15);
          var w = p.w0 * env * p.retr;
          if (age > NECK_T) { // Plateau–Rayleigh necking: beads form, necks break first
            var nd = Math.min(1, (age - NECK_T) / 0.30) * 0.96;
            w *= (1 - nd * Math.max(0, Math.sin(p.arc / LAM * 6.2832 + p.ph)));
          }
          return w;
        }
        function renderTrail(now) {
          while (pts.length && now - pts[0].t >= LIFE) pts.shift();
          fctx.clearRect(0, 0, fx.width, fx.height);
          if (!pts.length) { trailEl.style.display = 'none'; return; }
          var segs = [], cur = null;
          for (var i = 0; i < pts.length; i++) {
            var p = pts[i], w = trailWidth(p, now);
            var brk = cur && (Math.sqrt(Math.pow(p.x - cur.pts[cur.pts.length - 1].x, 2) + Math.pow(p.y - cur.pts[cur.pts.length - 1].y, 2)) > 24);
            if (w > 0.6 && !brk) {
              if (!cur) { cur = { pts: [], ws: [] }; segs.push(cur); }
              // wavy organic edges — real water boundaries are never smooth math
              var wv = w * (1 + 0.15 * Math.sin(p.arc * 0.34 + p.ph * 2.1) + 0.08 * Math.sin(p.arc * 0.91));
              cur.pts.push(p); cur.ws.push(Math.max(wv, 0.4));
            } else cur = null;
          }
          segs = segs.filter(function (s) { return s.pts.length >= 2; });
          if (!segs.length) { trailEl.style.display = 'none'; return; }
          var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          segs.forEach(function (s) {
            s.pts.forEach(function (p, k) {
              var w = s.ws[k] + 3;
              if (p.x - w < x0) x0 = p.x - w; if (p.x + w > x1) x1 = p.x + w;
              if (p.y - w < y0) y0 = p.y - w; if (p.y + w > y1) y1 = p.y + w;
            });
          });
          x0 = Math.floor(x0); y0 = Math.floor(y0);
          trailEl.style.display = 'block';
          trailEl.style.left = x0 + 'px'; trailEl.style.top = y0 + 'px';
          trailEl.style.width = Math.ceil(x1 - x0) + 'px';
          trailEl.style.height = Math.ceil(y1 - y0) + 'px';
          var path = '', tintA = TINT * 0.012, light = isLight();
          segs.forEach(function (s) {
            var n = s.pts.length, L = [], R = [];
            for (var k = 0; k < n; k++) {
              var p = s.pts[k];
              var p0 = s.pts[Math.max(0, k - 1)], p1 = s.pts[Math.min(n - 1, k + 1)];
              var tx2 = p1.x - p0.x, ty2 = p1.y - p0.y;
              var tn = Math.max(Math.sqrt(tx2 * tx2 + ty2 * ty2), 1e-4);
              var nx = -ty2 / tn, ny = tx2 / tn, w = s.ws[k];
              L.push([p.x + nx * w, p.y + ny * w]); R.push([p.x - nx * w, p.y - ny * w]);
            }
            var sp2 = 'M' + (L[0][0] - x0).toFixed(1) + ' ' + (L[0][1] - y0).toFixed(1);
            for (var k = 1; k < n; k++) sp2 += 'L' + (L[k][0] - x0).toFixed(1) + ' ' + (L[k][1] - y0).toFixed(1);
            for (var k = n - 1; k >= 0; k--) sp2 += 'L' + (R[k][0] - x0).toFixed(1) + ' ' + (R[k][1] - y0).toFixed(1);
            path += sp2 + 'Z';
            /* fx layer: tint fill, refraction edges, flow highlight, glints */
            var P = new Path2D();
            P.moveTo(L[0][0] * FXDPR, L[0][1] * FXDPR);
            for (var k = 1; k < n; k++) P.lineTo(L[k][0] * FXDPR, L[k][1] * FXDPR);
            for (var k = n - 1; k >= 0; k--) P.lineTo(R[k][0] * FXDPR, R[k][1] * FXDPR);
            P.closePath();
            var ageMid = (now - s.pts[Math.floor(n / 2)].t) / LIFE, fade = 1 - ageMid * 0.8;
            if (tintA > 0.003) { fctx.fillStyle = 'rgba(135,198,226,' + (tintA * fade) + ')'; fctx.fill(P); }
            fctx.lineWidth = 1.1 * FXDPR;
            fctx.strokeStyle = light ? 'rgba(30,52,72,' + (0.30 * fade) + ')' : 'rgba(185,225,252,' + (0.22 * fade) + ')';
            fctx.stroke(P);
            fctx.lineCap = 'round'; fctx.lineJoin = 'round';
            fctx.beginPath();
            for (var k = 0; k < n; k++) {
              var p = s.pts[k], w = s.ws[k];
              var p0 = s.pts[Math.max(0, k - 1)], p1 = s.pts[Math.min(n - 1, k + 1)];
              var tx2 = p1.x - p0.x, ty2 = p1.y - p0.y;
              var tn = Math.max(Math.sqrt(tx2 * tx2 + ty2 * ty2), 1e-4);
              var nx = -ty2 / tn, ny = tx2 / tn;
              if (nx * (-0.5) + ny * (-0.7) < 0) { nx = -nx; ny = -ny; }
              var hx = (p.x + nx * w * 0.38) * FXDPR, hy = (p.y + ny * w * 0.38) * FXDPR;
              if (k === 0) fctx.moveTo(hx, hy); else fctx.lineTo(hx, hy);
            }
            var wAvg = 0;
            for (var k = 0; k < n; k++) wAvg += s.ws[k];
            wAvg /= n;
            fctx.lineWidth = Math.max(1, wAvg * 0.34) * FXDPR;
            fctx.strokeStyle = 'rgba(255,255,255,' + (0.50 * fade) + ')';
            fctx.stroke();
            for (var k = 0; k < n; k += 4) {
              var p = s.pts[k];
              var r1 = Math.sin(p.arc * 12.9898 + p.ph * 78.233) * 43758.5453;
              r1 -= Math.floor(r1);
              if (r1 < 0.34) {
                fctx.fillStyle = 'rgba(255,255,255,' + (0.55 * fade) + ')';
                fctx.fillRect((p.x + (r1 - 0.5) * s.ws[k]) * FXDPR, (p.y + (r1 * 2 - 1) * s.ws[k] * 0.5) * FXDPR, 1.5 * FXDPR, 1.5 * FXDPR);
              }
            }
          });
          trailEl.style.clipPath = 'path("' + path + '")';
        }
        function drawHeadGlint(sp, st, sV) {
          if (!active) return;
          var a = Math.min(0.42, sp * 0.028);
          if (a < 0.05) return;
          var ca = Math.cos(theta), sa = Math.sin(theta);
          var ox = -0.30 * st.b * sV, oy = -0.46 * st.b * sV;
          fctx.beginPath();
          fctx.moveTo((x - ca * st.a * sV * 0.45 + ox) * FXDPR, (y - sa * st.a * sV * 0.45 + oy) * FXDPR);
          fctx.lineTo((x + ca * st.a * sV * 0.30 + ox) * FXDPR, (y + sa * st.a * sV * 0.30 + oy) * FXDPR);
          fctx.lineWidth = 1.7 * FXDPR; fctx.lineCap = 'round';
          fctx.strokeStyle = 'rgba(255,255,255,' + a + ')';
          fctx.stroke();
        }

        /* --- satellites (fast-move shed / splash debris, re-absorbable) --- */
        function spawnSatAt(now, px, py, velx, vely, fv, life) {
          var el = POOL.pop();
          if (!el) {
            el = document.createElement('div');
            el.className = 'glass-water-bead';
            el.setAttribute('aria-hidden', 'true');
            el.style.backdropFilter = 'url(#glassWaterBead)';
            el.style.webkitBackdropFilter = 'url(#glassWaterBead)';
            el.style.webkitMaskImage = 'url(' + BEAD.mask + ')';
            el.style.maskImage = 'url(' + BEAD.mask + ')';
            document.body.appendChild(el);
          }
          el.style.backgroundImage = 'url(' + (isLight() ? BEAD.specLight : BEAD.spec) + ')';
          el.style.display = 'block';
          drops.push({ el: el, x: px, y: py, vx: velx, vy: vely, fv: fv, t: now, life: life, abs: false });
        }
        function burst(now) {
          expl = { t0: now };
          vol = Math.max(0.22, vol - Math.min(vol * 0.72, 0.75));
          wobV += 0.30;
          var nL = 7 + Math.floor(Math.random() * 3);
          for (var i = 0; i < nL; i++) {
            var ang = (i / nL) * 6.2832 + (Math.random() - 0.5) * 0.5;
            var len = 45 + Math.random() * 75;
            var w0 = 2.4 + Math.random() * 2.2;
            strokePh = Math.random() * 6.28;
            var curv = (Math.random() - 0.5) * 0.045;
            var steps = Math.ceil(len / 3.5);
            for (var k = 1; k <= steps; k++) {
              var s = k / steps * len;
              cumArc += 3.5;
              pts.push({
                x: x + Math.cos(ang) * s - Math.sin(ang) * curv * s * s,
                y: y + Math.sin(ang) * s + Math.cos(ang) * curv * s * s,
                t: now, w0: w0 * (1 - (k / steps) * 0.5), arc: cumArc, ph: strokePh, retr: 1, ex: 1
              });
            }
          }
          lastDep = null;
          for (var i = 0; i < 10; i++) {
            var ang2 = Math.random() * 6.2832, spd = 4 + Math.random() * 5;
            spawnSatAt(now, x + Math.cos(ang2) * 8, y + Math.sin(ang2) * 8,
              Math.cos(ang2) * spd, Math.sin(ang2) * spd,
              0.02 + Math.random() * 0.035, 1100 + Math.random() * 500);
          }
        }

        /* --- main loop --- */
        function step(now) {
          var dt = Math.min(now - lastNow, 50) || 16.7;
          lastNow = now;
          if (mode !== 'water') { requestAnimationFrame(step); return; }
          vx = (vx + (tx - x) * STIFF) * DAMP;
          vy = (vy + (ty - y) * STIFF) * DAMP;
          x += vx; y += vy;
          var sp = Math.sqrt(vx * vx + vy * vy);
          if (sp < 2) { if (!stillSince) stillSince = now; } else stillSince = 0;
          if (prevSpeed > 6 && sp <= 2) wobV += 0.10;
          prevSpeed = sp;
          if (sp > 1.2) theta += angDiff(Math.atan2(vy, vx), theta) * 0.25;
          var eN = Math.max(0, Math.min(1, sp / 22));
          var desired = 1.12 + (2.10 - 1.12) * eN;
          var bi = 0, bd = 1e9;
          for (var i = 0; i < STATES.length; i++) {
            var dd = Math.abs(STATES[i].asp - desired);
            if (dd < bd) { bd = dd; bi = i; }
          }
          setState(bi);
          var st = STATES[bi];
          var resid = Math.sqrt(desired / st.asp);
          wobV += (-0.16 * wob - 0.11 * wobV) * (dt / 16.7);
          wob += wobV * (dt / 16.7);
          var breathe = (stillSince && now - stillSince > 500) ? 0.012 * Math.sin(now * 0.0021) : 0;
          var sV = Math.sqrt(vol) * (pointing ? 0.85 : 1);
          head.style.transform =
            'translate(' + (x - st.W / 2) + 'px,' + (y - st.H / 2) + 'px)' +
            ' rotate(' + theta + 'rad)' +
            ' scale(' + (sV * resid * (1 + wob + breathe)) + ',' + (sV / resid * (1 - wob * 0.6 + breathe * 0.4)) + ')';

          if (active && sp > DEPOSIT_V) deposit(now, sp, st, sV);
          else lastDep = null;
          /* stopping retracts nearby trail — disabled mid-splash or the
           * tongues get eaten in place instead of visibly flying out */
          if (stillSince && now - stillSince > 140 && !expl) {
            for (var j = pts.length - 1; j >= 0; j--) {
              var p = pts[j];
              if (Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < 62) {
                p.retr -= 0.085 * (dt / 16.7);
                if (p.retr <= 0) { pts.splice(j, 1); vol = Math.min(1.25, vol + 0.004); }
              }
            }
          }
          if (expl) {
            var ph = now - expl.t0;
            if (ph > 450) {
              var kk = Math.min(0.060, 0.016 + (ph - 450) * 0.00008) * (dt / 16.7);
              var alive = 0;
              for (var j = pts.length - 1; j >= 0; j--) {
                var p = pts[j];
                if (!p.ex) continue;
                alive++;
                p.x += (x - p.x) * kk; p.y += (y - p.y) * kk;
                p.t = Math.max(p.t, now - LIFE * 0.55);
                if (Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < Math.max(st.a * sV * 0.85, 7)) {
                  pts.splice(j, 1); vol = Math.min(1.25, vol + 0.010); wobV += 0.008;
                }
              }
              for (var j = 0; j < drops.length; j++) drops[j].abs = true;
              if (!alive && !drops.length && ph > 900) expl = null;
            }
            if (ph > 3200) expl = null;
          }
          renderTrail(now);
          drawHeadGlint(sp, st, sV);

          if (sp > 20 && now - lastSat > 70) {
            lastSat = now;
            var ang = theta + Math.PI + (Math.random() - 0.5) * 1.2;
            spawnSatAt(now, x + Math.cos(ang) * st.a * sV, y + Math.sin(ang) * st.a * sV,
              Math.cos(ang) * 1.5 + vx * 0.1, Math.sin(ang) * 1.5 + vy * 0.1,
              0.018 + Math.random() * 0.025, 380 + Math.random() * 300);
          }
          for (var j = drops.length - 1; j >= 0; j--) {
            var dr = drops[j];
            if (dr.abs) dr.t = Math.max(dr.t, now - dr.life * 0.85);
            var age = (now - dr.t) / dr.life;
            if (age >= 1) { dr.el.style.display = 'none'; POOL.push(dr.el); drops.splice(j, 1); continue; }
            if (dr.abs) {
              var adx = x - dr.x, ady = y - dr.y;
              var adist = Math.max(Math.sqrt(adx * adx + ady * ady), 1);
              dr.vx = (dr.vx + adx / adist * 0.30 * (dt / 16.7)) * 0.92;
              dr.vy = (dr.vy + ady / adist * 0.30 * (dt / 16.7)) * 0.92;
              if (adist < st.a * sV * 0.9) {
                vol = Math.min(1.25, vol + dr.fv * 0.85); wobV += 0.05;
                dr.el.style.display = 'none'; POOL.push(dr.el); drops.splice(j, 1); continue;
              }
            } else { dr.vx *= 0.86; dr.vy *= 0.86; }
            dr.x += dr.vx * (dt / 16.7); dr.y += dr.vy * (dt / 16.7);
            var rpx = R0 * Math.sqrt(dr.fv) * 2.2, shrink = dr.abs ? 1 : 1 - age * age;
            dr.el.style.transform = 'translate(' + (dr.x - DSZ / 2) + 'px,' + (dr.y - DSZ / 2) + 'px) scale(' + Math.max(rpx * 2 / DSZ * shrink, 0.04) + ')';
            dr.el.style.opacity = String(dr.abs ? 1 : 1 - age);
          }
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);

        /* --- water/system runtime switch --- */
        function applyMode(m, persist) {
          mode = m;
          if (persist) {
            try { localStorage.setItem('sky-cursor', m); } catch (e) { /* ignore */ }
          }
          if (m === 'system') {
            html.classList.remove('glass-liquid');
            head.style.opacity = '0';
            trailEl.style.display = 'none';
            fctx.clearRect(0, 0, fx.width, fx.height);
            for (var j = drops.length - 1; j >= 0; j--) {
              drops[j].el.style.display = 'none'; POOL.push(drops[j].el);
            }
            drops.length = 0; pts.length = 0; expl = null;
          } else if (active) {
            html.classList.add('glass-liquid');
            head.style.opacity = '1';
          }
          var btns = document.querySelectorAll('.glass-cursor-toggle');
          for (var i = 0; i < btns.length; i++) {
            btns[i].textContent = m === 'water' ? '系统光标' : '水珠光标';
            btns[i].setAttribute('aria-pressed', m === 'water' ? 'true' : 'false');
          }
        }
        applyMode(mode, false);
        var cbtns = document.querySelectorAll('.glass-cursor-toggle');
        for (var ci = 0; ci < cbtns.length; ci++) {
          cbtns[ci].addEventListener('click', function () {
            applyMode(mode === 'water' ? 'system' : 'water', true);
          });
        }
      })();
    }

    /* ---------- parallax (decorative layers only, never text) ---------- */
    var pxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (pxEls.length) {
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.scrollY || 0;
          pxEls.forEach(function (el) {
            var f = parseFloat(el.getAttribute('data-parallax')) || 0.08;
            var dy = Math.max(-40, Math.min(40, -y * f));
            el.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
          });
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  });
})();
