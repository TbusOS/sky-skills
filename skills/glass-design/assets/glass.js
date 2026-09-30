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

    /* ---------- liquid cursor v3 — the pointer IS water ----------
     * The head drop refracts the real page behind it through a
     * backdrop-filter displacement map. Everything that makes it read as
     * water is baked per shape from a spherical-cap height field and Snell's
     * law (n = 1.333): the magnification, the compressed rim, the Fresnel
     * rim reflection, a small highlight, and the caustic + shadow the drop
     * throws onto the page under the screen glass. The caustic multiplies
     * the page, so it shows on bright content and vanishes on black — as it
     * does on a real window.
     *
     * The head element is NEVER rotated. Chromium places a backdrop-filter
     * displacement map in the wrong spot once the element carries rotate()
     * (measured 2026-09-29: translate / scale refract in place; rotate puts
     * the refraction beside the drop and leaves the drop itself flat). The
     * direction is baked instead — a round state plus 5 speed levels × 24
     * directions, baked in idle time; until a direction is ready the nearest
     * baked state stands in.
     *
     * Moving drops do what a drop sliding on glass does (Le Grand, Daerr &
     * Limat 2005): the front stays round; faster, the rear turns into a
     * corner with straight sides, then a cusp; faster still the cusp pulls
     * out a thin tail that pinches off pearls at a steady spacing. Slower
     * than that a moving drop leaves nothing behind. The motion is
     * overdamped — speed follows the pull, so the drop never overshoots and
     * swings back. Very slow drags stick, lean, then slip (contact-line
     * pinning). Pearls and splash droplets stay where they are and evaporate,
     * small ones first; the drop swallows any it touches. Double-click
     * splashes it the way a drop hitting glass does (see the splash sections
     * below). All motion is integrated per unit of real time, so a 120 Hz
     * display behaves like a 60 Hz one.
     * Never installed under freeze; opt out with <html data-no-liquid>;
     * runtime water/system switch via .glass-cursor-toggle (localStorage
     * sky-cursor). Regression checks: scripts/check_water_refraction.mjs,
     * scripts/check_water_splash.mjs, scripts/check_water_drag.mjs. */
    if (!html.hasAttribute('data-no-liquid') &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        typeof CSS !== 'undefined' && CSS.supports &&
        CSS.supports('backdrop-filter', 'url(#x)')) {
      (function waterCursor() {
        // data-water-refr: refraction strength. 48 = physical (Snell, n 1.333)
        var REFR = parseInt(html.getAttribute('data-water-refr'), 10) || 48;
        // data-water-tint: faint sea-blue body colour. Water is clear, so low
        var TINT = html.hasAttribute('data-water-tint')
          ? (parseInt(html.getAttribute('data-water-tint'), 10) || 0) : 4;
        var mode = 'water';
        try {
          var savedCur = localStorage.getItem('sky-cursor');
          if (savedCur === 'system' || savedCur === 'water') mode = savedCur;
        } catch (e) { /* storage unavailable */ }

        /* --- optics --- */
        var ETA = 1 / 1.333;            // air → water
        // The page sits GAP px under the screen glass the drop rests on.
        // Centre magnification ≈ 1 / (1 − (1 − ETA)·(h0 + GAP)/Rc):
        // GAP 0 → about 1.2×, GAP 8 → about 1.4× (read back from the baked
        // map: 1.38–1.44× at radius 4–14px).
        var GAP = 8;
        var DISP_FS = 48;               // displacement code 0..255 spans ±24px at scale 48
        // Light multiplier (caustic > 1, shadow < 1) rides in the map's B
        // channel: M = M_MIN + M_SPAN·code/255, so code 64 is exactly 1.
        var M_MIN = 0.36, M_SPAN = 2.55, M_ONE = 64;
        // Only part of the light is the direct key light; sky and room fill
        // the rest from every side, which is why a real drop's shadow is soft.
        var DIRECT = 0.4;
        var DEG = Math.PI / 180;
        function norm3(x, y, z) { var n = Math.sqrt(x * x + y * y + z * z); return [x / n, y / n, z / n]; }
        var LK = norm3(-0.46, -0.64, 0.86);   // key light, upper-left
        var LF = norm3(0.52, 0.40, 0.75);     // weaker fill, lower-right
        // Snell: unit ray (ix,iy,iz) through unit normal n facing the ray.
        function refract(ix, iy, iz, nx, ny, nz) {
          var cosi = -(ix * nx + iy * ny + iz * nz);
          var k = 1 - ETA * ETA * (1 - cosi * cosi);
          if (k < 0) return null;
          var f = ETA * cosi - Math.sqrt(k);
          return [ETA * ix + f * nx, ETA * iy + f * ny, ETA * iz + f * nz];
        }
        function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
        function smooth(e0, e1, v) { var t = clamp01((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); }

        /* --- drop footprint: signed distance in px (negative inside) ---
         * In the drop's own frame, u along the motion and v across it. The
         * front is a half-ellipse (af along the motion, b across); the rear is
         * round at rest and, for a fast drop, the hull of that circle and a
         * point behind it: two straight edges meeting in a corner of half-angle
         * phi (90 = no corner). A sliding drop grows exactly this: the front
         * curvature stays put while the rear turns into a corner, then a cusp
         * (Le Grand, Daerr & Limat 2005). ex 0..1: how fast — the front stands
         * steeper and the rear flatter (advancing vs receding contact angle). */
        function dropShape(af, b, phiDeg, dir, ex) {
          var c = Math.cos(dir), s = Math.sin(dir), ph = phiDeg * DEG;
          var sp = Math.sin(ph), cp = Math.cos(ph), psiT = Math.PI / 2 + ph, tip = b / sp;
          return {
            rho: Math.min(af, b),                 // largest inside distance
            sdf: function (dx, dy) {
              var u = dx * c + dy * s, v = Math.abs(-dx * s + dy * c);
              if (u >= 0) {
                var q = Math.sqrt((u / af) * (u / af) + (v / b) * (v / b));
                return (q - 1) * Math.min(af, b);
              }
              if (Math.atan2(v, u) <= psiT) return Math.sqrt(u * u + v * v) - b;
              return -u * sp + v * cp - b;        // a straight edge running into the corner
            },
            theta: function (dx, dy) {            // contact angle, degrees
              var u = dx * c + dy * s;
              var un = u >= 0 ? Math.min(1, u / af) : Math.max(-1, u / tip);
              return 72 + ex * (un >= 0 ? 14 * un : 30 * un);
            }
          };
        }
        // Surface of a spherical cap over the footprint, at (dx,dy).
        function surface(shape, dx, dy) {
          var d = shape.sdf(dx, dy);
          if (d >= 0) return null;
          var e = 0.5;
          var gx = (shape.sdf(dx + e, dy) - shape.sdf(dx - e, dy)) / (2 * e);
          var gy = (shape.sdf(dx, dy + e) - shape.sdf(dx, dy - e)) / (2 * e);
          var gn = Math.max(Math.sqrt(gx * gx + gy * gy), 1e-4);
          gx /= gn; gy /= gn;
          var th = shape.theta(dx, dy) * DEG, R = shape.rho;
          var Rc = R / Math.sin(th), r = Math.max(0, R + d);   // r: distance from the crown
          var q = Math.sqrt(Math.max(1e-6, Rc * Rc - r * r));
          var h = Math.max(0, q - Rc * Math.cos(th));
          var hp = r / q;                                        // dh/d(inside distance)
          var n = norm3(hp * gx, hp * gy, 1);
          return { d: d, h: h, nx: n[0], ny: n[1], nz: n[2] };
        }

        /* --- bake one drop state into four small images ---
         *   disp   R,G = where to sample the page (Snell) · B = light multiplier
         *   spec / specLight = what the water surface adds on dark / light pages
         *   mask   = the drop + the patch of page its caustic and shadow touch */
        // premultiplied "over" of colour (r,g,b) at alpha a onto accumulator c
        function over(c, r, g, b, a) {
          c[0] = r * a + c[0] * (1 - a); c[1] = g * a + c[1] * (1 - a);
          c[2] = b * a + c[2] * (1 - a); c[3] = a + c[3] * (1 - a);
        }
        var SPLAT_SS = 2;
        // shadowOverlay: bake the shadow into the surface images as a plain
        // dark layer (used by the small beads, whose filter has no lighting step).
        // shape.surf(dx,dy), when given, replaces the spherical cap (the splash
        // frames bring their own height field).
        function bake(S, RES, shape, shadowOverlay) {
          var N = S * RES, c0 = S / 2;
          var surf = shape.surf || function (dx, dy) { return surface(shape, dx, dy); };
          var cv0 = document.createElement('canvas');
          cv0.width = N; cv0.height = N;
          var ctx = cv0.getContext('2d');
          var disp = ctx.createImageData(N, N), spec = ctx.createImageData(N, N);
          var specL = ctx.createImageData(N, N), mask = ctx.createImageData(N, N);
          // 1) caustic + shadow: every light ray through the drop lands
          //    somewhere else than it would have without the drop. Splat both,
          //    take the difference — excess is caustic, deficit is shadow.
          var dE = new Float32Array(N * N);
          function splat(px, py, w) {
            var fx = px * RES - 0.5, fy = py * RES - 0.5;
            var ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
            for (var oy = 0; oy < 2; oy++) for (var ox = 0; ox < 2; ox++) {
              var X = ix + ox, Y = iy + oy;
              if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
              dE[Y * N + X] += w * (ox ? ax : 1 - ax) * (oy ? ay : 1 - ay);
            }
          }
          var Dx = -LK[0], Dy = -LK[1], Dz = -LK[2];          // light travel direction
          var straight = GAP / -Dz, M = SPLAT_SS * RES, wRay = 1 / (SPLAT_SS * SPLAT_SS);
          for (var sy = 0; sy < S * M; sy++) for (var sx = 0; sx < S * M; sx++) {
            var qx = (sx + 0.5) / M - c0, qy = (sy + 0.5) / M - c0;
            var su = surf(qx, qy);
            if (!su) continue;
            var T = refract(Dx, Dy, Dz, su.nx, su.ny, su.nz);
            var cosi = -(Dx * su.nx + Dy * su.ny + Dz * su.nz);
            var Ft = 1 - (0.02 + 0.98 * Math.pow(1 - Math.max(0, cosi), 5));  // transmitted
            splat(qx + Dx * straight + c0, qy + Dy * straight + c0, -wRay);
            if (T) {
              var tt = (GAP + su.h) / -T[2];
              splat(qx + T[0] * tt + c0, qy + T[1] * tt + c0, wRay * Ft);
            }
          }
          var dB = new Float32Array(N * N);                   // 3×3 blur: rays are sparse
          for (var y0 = 0; y0 < N; y0++) for (var x0 = 0; x0 < N; x0++) {
            var acc = 0, cnt = 0;
            for (var j = -1; j <= 1; j++) for (var i2 = -1; i2 <= 1; i2++) {
              var X2 = x0 + i2, Y2 = y0 + j;
              if (X2 < 0 || Y2 < 0 || X2 >= N || Y2 >= N) continue;
              acc += dE[Y2 * N + X2]; cnt++;
            }
            dB[y0 * N + x0] = acc / cnt;
          }
          // 2) per output sample: refraction offset, surface shading, mask
          var tintA = TINT * 0.011;
          for (var py = 0; py < N; py++) for (var px = 0; px < N; px++) {
            var x = (px + 0.5) / RES - c0, y = (py + 0.5) / RES - c0, k4 = (py * N + px) * 4;
            var su2 = surf(x, y);
            var d = su2 ? su2.d : shape.sdf(x, y);
            var cov = clamp01((0.6 - d) / 1.2);
            var offx = 0, offy = 0;
            var sA = 0, sR = 0, sG = 0, sB = 0, lA = 0, lR = 0, lG = 0, lB = 0;
            if (su2) {
              var T2 = refract(0, 0, -1, su2.nx, su2.ny, su2.nz);
              if (T2) {
                var t2 = (GAP + su2.h) / -T2[2];
                offx = T2[0] * t2; offy = T2[1] * t2;
              }
              var F = 0.02 + 0.98 * Math.pow(1 - su2.nz, 5);            // Schlick, view straight down
              var rk = 2 * su2.nz * (su2.nx * LK[0] + su2.ny * LK[1] + su2.nz * LK[2]) - LK[2];
              var rf = 2 * su2.nz * (su2.nx * LF[0] + su2.ny * LF[1] + su2.nz * LF[2]) - LF[2];
              var hl = Math.min(1, Math.pow(Math.max(0, rk), 60) * 1.6 + Math.pow(Math.max(0, rk), 8) * 0.08 +
                                   Math.pow(Math.max(0, rf), 40) * 0.35);
              // premultiplied "over": tint, then environment reflection, then highlight.
              // The body colour follows the water's thickness (a thin film is
              // clear), and only reflection beyond a flat water surface's 2%
              // counts: the dry glass around reflects about as much, so a flat
              // wet patch does not stand out from it.
              var tk = clamp01(0.15 + su2.h / 4), Fx = Math.max(0, F - 0.02);
              var cd = [0, 0, 0, 0], cl = [0, 0, 0, 0];
              over(cd, 0.55, 0.78, 0.89, tintA * tk);
              over(cd, 0.80, 0.87, 0.96, Math.min(1, Fx * 0.7));      // bright sky over a dark page
              over(cd, 1, 1, 1, hl);
              over(cl, 0.55, 0.78, 0.89, tintA * 0.6 * tk);
              over(cl, 0.24, 0.28, 0.34, Math.min(1, Fx * 0.85));     // room reflection over a white page
              over(cl, 1, 1, 1, hl);
              sA = cd[3]; if (sA > 0) { sR = cd[0] / sA; sG = cd[1] / sA; sB = cd[2] / sA; }
              lA = cl[3]; if (lA > 0) { lR = cl[0] / lA; lG = cl[1] / lA; lB = cl[2] / lA; }
            }
            var Mv = Math.max(M_MIN, Math.min(M_MIN + M_SPAN, 1 + DIRECT * dB[py * N + px]));
            if (shadowOverlay && Mv < 1) {                      // darken under everything else
              var shA = (1 - Mv) * 0.9;
              sR = (sR * sA) / Math.max(1e-4, sA + shA * (1 - sA)); sG = (sG * sA) / Math.max(1e-4, sA + shA * (1 - sA));
              sB = (sB * sA) / Math.max(1e-4, sA + shA * (1 - sA)); sA = sA + shA * (1 - sA);
              lR = (lR * lA) / Math.max(1e-4, lA + shA * (1 - lA)); lG = (lG * lA) / Math.max(1e-4, lA + shA * (1 - lA));
              lB = (lB * lA) / Math.max(1e-4, lA + shA * (1 - lA)); lA = lA + shA * (1 - lA);
              cov = Math.max(cov, 1);                           // the shadow lies outside the drop too
            }
            disp.data[k4] = Math.max(0, Math.min(255, Math.round(128 + offx * 255 / DISP_FS)));
            disp.data[k4 + 1] = Math.max(0, Math.min(255, Math.round(128 + offy * 255 / DISP_FS)));
            disp.data[k4 + 2] = Math.abs(Mv - 1) < 0.004 ? M_ONE
              : Math.max(0, Math.min(255, Math.round((Mv - M_MIN) / M_SPAN * 255)));
            disp.data[k4 + 3] = 255;
            spec.data[k4] = Math.round(sR * 255); spec.data[k4 + 1] = Math.round(sG * 255);
            spec.data[k4 + 2] = Math.round(sB * 255); spec.data[k4 + 3] = Math.round(sA * cov * 255);
            specL.data[k4] = Math.round(lR * 255); specL.data[k4 + 1] = Math.round(lG * 255);
            specL.data[k4 + 2] = Math.round(lB * 255); specL.data[k4 + 3] = Math.round(lA * cov * 255);
            var mA = Math.max(cov, smooth(0.008, 0.05, Math.abs(Mv - 1)));
            mask.data[k4] = 255; mask.data[k4 + 1] = 255; mask.data[k4 + 2] = 255;
            mask.data[k4 + 3] = Math.round(mA * 255);
          }
          function toURL(im) { ctx.putImageData(im, 0, 0); return cv0.toDataURL(); }
          return { disp: toURL(disp), spec: toURL(spec), specLight: toURL(specL), mask: toURL(mask) };
        }

        /* --- SVG filters: head and bead (light, then Snell) --- */
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
        defs.setAttribute('aria-hidden', 'true');
        defs.style.position = 'absolute';
        // Four primitives: read the map, light the page (caustic / shadow land
        // on it), then look at that page through the drop. No per-channel
        // dispersion: water's index differs by ~2% across the visible range,
        // which at these offsets (≤ 8px) splits the channels by < 0.3px —
        // invisible, and it cost 7 more primitives per drop.
        // Beads skip the lighting step (lit = false): their shadow is a pixel
        // or two, and lighting them is the part that costs frames (measured:
        // 14 lit beads 145 frames / 3s vs 173 without beads, software rendering).
        function dispChain(idp, mapExtra, lit) {
          return '<filter id="' + idp + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
            '<feImage id="' + idp + 'Map" result="map" x="0" y="0"' + (mapExtra || '') + '/>' +
            (lit
              ? '<feColorMatrix in="map" values="0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 0 1" result="lm"/>' +
                '<feComposite in="SourceGraphic" in2="lm" operator="arithmetic" k1="' + M_SPAN + '" k2="' + M_MIN + '" k3="0" k4="0" result="lit"/>'
              : '') +
            '<feDisplacementMap id="' + idp + 'D" in="' + (lit ? 'lit' : 'SourceGraphic') + '" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G"/>' +
            '</filter>';
        }
        var DSZ = 38, BR = 12;          // bead lens (big leftover droplets): bake box (room for the shadow) and radius
        defs.innerHTML =
          dispChain('glassWaterHead', '', true) +
          dispChain('glassWaterBead', ' width="' + DSZ + '" height="' + DSZ + '"', false);
        document.body.appendChild(defs);
        function setScale(v) {
          document.getElementById('glassWaterHeadD').setAttribute('scale', v);
          document.getElementById('glassWaterBeadD').setAttribute('scale', v);
        }
        setScale(REFR);

        /* --- drop states: round + 5 speed levels × 24 directions ---
         * Speeds in px per 16.7ms, smoothed. Width shrinks and length grows
         * with speed while the footprint area (volume, at constant height)
         * stays the same.
         *   v   from this speed up
         *   f   front half-length / half-width
         *   phi rear corner half-angle. The corner appears at V_CORNER and then
         *       follows sin(phi) = V_CORNER / speed: the contact line can only
         *       recede so fast, so it slants to keep its normal speed there
         *       (Le Grand et al. 2005); past ~45° it turns into a cusp. Each
         *       level's phi is that law at a speed inside the level. */
        var R0 = 16, NDIR = 24, V_CORNER = 8;
        var LEVELS = [
          { v: 1.5, f: 1.10, phi: 90 },   // oval
          { v: 5, f: 1.18, phi: 84 },     // rounded corner: the rear starts to flatten
          { v: 8, f: 1.22, phi: 62 },     // corner, sin(62°) = 8 / 9
          { v: 10.5, f: 1.26, phi: 45 },  // cusp onset, 8 / 11.3
          { v: 13, f: 1.30, phi: 32 }     // cusp, 8 / 15: from here the tail pinches off pearls
        ];
        function makeState(li, k) {
          var L = li < 0 ? { f: 1, phi: 90 } : LEVELS[li], ph = L.phi * DEG;
          var b = R0 * Math.sqrt(Math.PI / (Math.PI * L.f / 2 + ph + Math.cos(ph) / Math.sin(ph)));
          var af = L.f * b, tip = b / Math.sin(ph);
          var dir = k < 0 ? 0 : k * 2 * Math.PI / NDIR;
          var S = 2 * Math.ceil(Math.max(af, tip) + 10);
          var shape = dropShape(af, b, L.phi, dir, li < 0 ? 0 : (li + 1) / LEVELS.length);
          return { a: Math.max(af, tip), b: b, tip: tip, S: S, maps: bake(S, 2, shape) };
        }
        var ROUND = makeState(-1, -1);
        var STATES = new Array(LEVELS.length * NDIR);
        var bakeQueue = [];
        for (var qa = 0; qa < LEVELS.length; qa++) for (var qk = 0; qk < NDIR; qk++) bakeQueue.push(qa * NDIR + qk);
        function bakeSome() {
          var t0 = performance.now();
          // the splash frames first: a double-click has no stand-in to fall back on
          while (spQueue.length && performance.now() - t0 < 8) bakeSplashKey(spQueue.shift());
          while (bakeQueue.length && performance.now() - t0 < 8) {
            var key = bakeQueue.shift();
            if (!STATES[key]) STATES[key] = makeState(Math.floor(key / NDIR), key % NDIR);
          }
          if (bakeQueue.length || spQueue.length) scheduleBake();
        }
        function scheduleBake() {
          if (window.requestIdleCallback) window.requestIdleCallback(bakeSome, { timeout: 400 });
          else setTimeout(bakeSome, 30);
        }
        scheduleBake();
        function stateFor(ai, k) {
          if (ai < 0) return ROUND;
          var key = ai * NDIR + k;
          if (STATES[key]) return STATES[key];
          var qi = bakeQueue.indexOf(key);                  // needed now: bake it next
          if (qi > 0) { bakeQueue.splice(qi, 1); bakeQueue.unshift(key); }
          for (var j = ai - 1; j >= 0; j--) if (STATES[j * NDIR + k]) return STATES[j * NDIR + k];
          return ROUND;
        }
        var BEAD = makeBead();
        function makeBead() {
          return bake(DSZ, 2, dropShape(BR, BR, 90, 0, 0), true);
        }
        document.getElementById('glassWaterBeadMap').setAttribute('href', BEAD.disp);

        /* --- double-click splash: the sheet and its rim, baked like the drop ---
         * A drop hitting glass, seen from above and slowed about 25× (the real
         * event is over in ~15ms, too fast to see). Three stages:
         *   spread  the drop flattens into a thin sheet whose rim races out
         *           and slows down (radius grows as √t at first), SP_T;
         *   halt    the rim stops; only the finger tips keep going, SP_HOLD;
         *   recede  the rim pulls back at a steady speed and gathers into a
         *           drop again, SP_REC; the drop then overshoots and rings.
         * The sheet is radially symmetric: what is left of the drop in the
         * middle, a thin film, and a thick rim at its edge. Keyframes are baked
         * once in idle time and scaled between frames so the rim moves smoothly;
         * the fingers and the droplets are drawn separately (startSplash). */
        var H0 = R0 * Math.tan(36 * DEG);            // resting cap height (contact angle 72°)
        var SP_T = 120, SP_HOLD = 70, SP_REC = 240;  // ms
        var SP_RMAX = 2.6 * R0;                       // rim radius at the halt: spread 3.8× the drop's diameter as a sphere
        // p-norm union: smooth where both parts are wet, exact where one is dry
        function unite(a, b) { return Math.sqrt(Math.sqrt(a * a * a * a + b * b * b * b)); }
        function capH(r, R, H) {                      // spherical cap: footprint R, height H
          if (r >= R || H <= 0) return 0;
          var Rc = (R * R + H * H) / (2 * H);
          return Math.sqrt(Rc * Rc - r * r) - (Rc - H);
        }
        // ph 0 spread, 1 halt, 2 recede; p runs 0..1 through each
        //   rr rim radius · b rim half-width · f film thickness
        //   br, bh what is left of the drop in the middle · m blend into the resting cap
        function splashPar(ph, p) {
          if (ph === 0) return { rr: R0 + (SP_RMAX - R0) * Math.sqrt(p * (2 - p)), b: (0.8 + 1.4 * p) * smooth(0, 0.1, p),
            f: 0.3 + 0.9 * (1 - p) * (1 - p), br: R0 * (1 - 0.5 * p), bh: H0 * Math.pow(1 - p, 2.2), m: 0 };
          if (ph === 1) return { rr: SP_RMAX, b: 2.2 + 0.4 * p, f: 0.3, br: 0.5 * R0, bh: 0, m: 0 };
          var rr = SP_RMAX + (0.55 * R0 - SP_RMAX) * p;      // steady retraction
          return { rr: rr, b: 2.6 + 3.4 * p, f: 0.3 - 0.15 * p, br: rr, bh: 0.5 * H0 * smooth(0.4, 1, p), m: smooth(0.45, 1, p) };
        }
        function splashShape(P) {
          var rEdge = Math.max(P.rr + P.b, P.m > 0 ? R0 : 0), DR = 0.05;
          var n = Math.ceil(rEdge / DR) + 3, tab = new Float32Array(n);
          for (var i = 0; i < n; i++) {
            var r = i * DR, h = 0;
            if (r < rEdge) {
              var film = P.f * (1 - smooth(P.rr - 2.5, P.rr + 0.4 * P.b, r));   // thins to a wedge at the edge
              h = unite(film, capH(Math.abs(r - P.rr), P.b, 0.7 * P.b));       // rim: contact angle 70°
              h = unite(h, capH(r, P.br, P.bh));
              if (P.m > 0) h += (capH(r, R0, H0) - h) * P.m;
            }
            tab[i] = Math.max(0, h);
          }
          return {
            rho: rEdge,
            sdf: function (dx, dy) { return Math.sqrt(dx * dx + dy * dy) - rEdge; },
            surf: function (dx, dy) {
              var r = Math.sqrt(dx * dx + dy * dy);
              if (r >= rEdge) return null;
              var u = r / DR, i0 = Math.floor(u), a = u - i0;
              var h = tab[i0] * (1 - a) + tab[i0 + 1] * a;
              if (h < 0.02) return null;
              var i1 = Math.min(n - 2, Math.max(1, Math.round(u)));
              var hp = (tab[i1 + 1] - tab[i1 - 1]) / (2 * DR);        // dh/dr
              var nn = r > 1e-3 ? norm3(-hp * dx / r, -hp * dy / r, 1) : [0, 0, 1];
              return { d: r - rEdge, h: h, nx: nn[0], ny: nn[1], nz: nn[2] };
            }
          };
        }
        // tau: one timeline for all keyframes — spread 0..1, halt 1..1.5, recede 1.5..2.5
        var SP_KEYS = [[0, 0.03], [0, 0.08], [0, 0.15], [0, 0.24], [0, 0.35], [0, 0.48], [0, 0.62], [0, 0.78],
          [0, 0.9], [0, 1], [1, 1], [2, 0.1], [2, 0.22], [2, 0.34], [2, 0.46], [2, 0.58], [2, 0.68], [2, 0.76],
          [2, 0.84], [2, 0.9], [2, 0.95]].map(function (k) {
            return { tau: k[0] === 0 ? k[1] : (k[0] === 1 ? 1.3 : 1.5 + k[1]), par: splashPar(k[0], k[1]), st: null };
          });
        var spQueue = SP_KEYS.slice();
        function bakeSplashKey(K) {
          if (K.st) return;
          var sh = splashShape(K.par), S = 2 * Math.ceil(sh.rho + 12);
          K.st = { a: R0, b: R0, S: S, maps: bake(S, 2, sh) };
        }

        /* --- elements --- */
        var head = document.createElement('div');
        head.className = 'glass-water-head';
        head.setAttribute('aria-hidden', 'true');
        head.style.backdropFilter = 'url(#glassWaterHead)';
        head.style.webkitBackdropFilter = 'url(#glassWaterHead)';
        var fx = document.createElement('canvas');
        fx.className = 'glass-water-fx';
        fx.setAttribute('aria-hidden', 'true');
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
        var cur = null;
        function setState(st, force) {
          if (st === cur && !force) return;
          cur = st;
          head.style.width = st.S + 'px'; head.style.height = st.S + 'px';
          head.style.backgroundImage = 'url(' + (isLight() ? st.maps.specLight : st.maps.spec) + ')';
          head.style.webkitMaskImage = 'url(' + st.maps.mask + ')';
          head.style.maskImage = 'url(' + st.maps.mask + ')';
          headMap.setAttribute('href', st.maps.disp);
          headMap.setAttribute('width', st.S); headMap.setAttribute('height', st.S);
        }
        setState(ROUND);
        new MutationObserver(function () {
          setState(cur, true);
          for (var j = 0; j < wet.length; j++) {
            if (wet[j].el) wet[j].el.style.backgroundImage = 'url(' + (isLight() ? BEAD.specLight : BEAD.spec) + ')';
          }
        }).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

        /* --- physics state --- */
        var tx = -300, ty = -300, x = -300, y = -300, vx = 0, vy = 0;
        var active = false, pointing = false, lastMoveT = 0;
        // Overdamped: a sliding drop's speed follows the pull (it rises
        // linearly with the driving force, Le Grand et al. 2005), there is no
        // inertia to carry it past the pointer and back. TAU: how quickly it
        // closes the gap (ms). Speed at 1000 px/s lags the pointer by ~30px.
        var TAU = 30;
        // Contact-line pinning: a resting drop holds on until pulled PIN_BREAK
        // px away, leaning toward the pull. After PIN_HOLD ms without pointer
        // motion it lets go, so a resting drop always ends on the pointer.
        var PIN_BREAK = 3.2, PIN_HOLD = 220;
        var pinned = false, lean = 0, leanDir = 0;
        var theta = 0, vol = 1.0, wob = 0, wobV = 0, spS = 0;
        var stillSince = 0, lastNow = 0;
        var splash = null;              // the running double-click splash
        // droplets left on the glass (splash, pearls); past MAX_WET the oldest dry off early
        var wet = [], MAX_WET_LENS = 10, MAX_WET = 320;
        var POOL = [];
        var tail = { arc: 0, end: null, a: 0, r: 0, lam: 1 };   // pearling tail
        var slowFrames = 0;

        document.addEventListener('pointermove', function (e) {
          tx = e.clientX; ty = e.clientY; lastMoveT = performance.now();
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
          if (mode !== 'water' || !active || splash) return;
          startSplash(lastNow || performance.now());
        });

        function angDiff(a, b) {
          var d = a - b;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          return d;
        }
        function dirIndex(a) {
          var t = a / (2 * Math.PI / NDIR);
          return ((Math.round(t) % NDIR) + NDIR) % NDIR;
        }

        /* --- bead lens: a pooled element for the bigger leftover droplets --- */
        function getBead() {
          var el = POOL.pop();
          if (!el) {
            el = document.createElement('div');
            el.className = 'glass-water-bead';
            el.setAttribute('aria-hidden', 'true');
            el.style.width = DSZ + 'px'; el.style.height = DSZ + 'px';
            el.style.backdropFilter = 'url(#glassWaterBead)';
            el.style.webkitBackdropFilter = 'url(#glassWaterBead)';
            el.style.webkitMaskImage = 'url(' + BEAD.mask + ')';
            el.style.maskImage = 'url(' + BEAD.mask + ')';
            document.body.appendChild(el);
          }
          el.style.backgroundImage = 'url(' + (isLight() ? BEAD.specLight : BEAD.spec) + ')';
          el.style.opacity = '1';
          el.style.display = 'block';
          return el;
        }
        /* --- double-click splash: fingers and droplets ---
         * The count and places of the fingers are set at first contact and
         * stay put while the sheet spreads; near the halt only the finger tips
         * keep moving (Thoroddsen & Sakakibara 1998, water on glass). Spacing
         * follows the rim's Plateau–Rayleigh wavelength, about 9× the rim's
         * half-width. Each finger ends one of three ways:
         *   fly     a long one throws its tip off; the droplet flies straight
         *           out (seen from above, nothing slows it in the air) and
         *           stops dead where it lands;
         *   strand  the receding rim leaves the tip behind; the thread between
         *           them pinches once it is one Plateau–Rayleigh wavelength
         *           long, ~9× its radius (receding break-up);
         *   back    most are pulled back in with the rim — on glass the
         *           fingers leave no full ring of drops.
         * Droplets that got away stay where they are — nothing pulls them back
         * — and evaporate, small ones first (radius² shrinks linearly in time).
         * The drop swallows any it touches as it moves over them. The drop keeps
         * the rest of its water, so it comes back only a little smaller. */
        function wetFv(r) { return Math.pow(r / R0, 3); }          // volume, as a share of a resting drop
        function addWet(now, px, py, r, velx, vely, tFly) {
          var lens = 0;
          for (var j = 0; j < wet.length; j++) if (wet[j].el) lens++;
          var w = {
            x: px, y: py, r0: r, r: r, vx: velx, vy: vely, tLand: now + tFly,
            life: Math.min(5200, 1300 + 2600 * (r / 2.2) * (r / 2.2)),   // evaporation time grows as r²
            // A bead lens is baked at 12px; shrunk below ~3px its baked shadow
            // lands on the droplet itself (a real one this small throws its
            // shadow 5px away, faint), so small ones are painted instead.
            el: r >= 3.2 && lens < MAX_WET_LENS ? getBead() : null
          };
          wet.push(w);
          if (wet.length > MAX_WET) {                               // too many on screen: the oldest dries off now
            var o = wet[wet.length - 1 - MAX_WET];
            if (now >= o.tLand) o.life = Math.min(o.life, now - o.tLand + 150);
          }
          if (splash) splash.lost += wetFv(r);
          return w;
        }
        function dropWet(j) {
          if (wet[j].el) { wet[j].el.style.display = 'none'; POOL.push(wet[j].el); }
          wet.splice(j, 1);
        }
        function startSplash(now) {
          for (var i = 0; i < SP_KEYS.length; i++) bakeSplashKey(SP_KEYS[i]);   // no-op once idle baking got there
          var sV = Math.sqrt(vol) * (pointing ? 0.85 : 1);
          var lam = 9.02 * 2.2;                                   // Plateau–Rayleigh on the rim at the halt
          var nF = Math.max(8, Math.round(2 * Math.PI * SP_RMAX / lam) + Math.floor(Math.random() * 3) - 1);
          var fingers = [];
          for (var i = 0; i < nF; i++) {
            var L = 4 + 16 * Math.pow(Math.random(), 1.4), rnd = Math.random();
            var fate = L > 9 && rnd < 0.55 ? 'fly' : (L > 7 && rnd > 0.75 ? 'strand' : 'back');
            fingers.push({
              a: (i + (Math.random() - 0.5) * 0.7) * 2 * Math.PI / nF,
              L: L * sV, w: (1.1 + 0.7 * Math.random()) * sV,
              born: 0.1 + 0.12 * Math.random(),
              fate: fate, pe: 0.45 + 0.75 * Math.random(),         // fly: when the tip lets go (tau)
              len: 0, cut: -1, stub: 0, tipR: 0, lastR: 0
            });
          }
          splash = { t0: now, x: x, y: y, sV: sV, vol0: vol, fingers: fingers, lost: 0, rr: R0 * sV, rOut: R0 * sV, key: null };
          // the earliest ejecta are the smallest and fastest
          var nS = 2 + Math.floor(Math.random() * 3);
          splash.spray = [];
          for (var i = 0; i < nS; i++) splash.spray.push({ t: 10 + 25 * Math.random(), a: Math.random() * 2 * Math.PI });
          vx = 0; vy = 0; pinned = false; wob = 0; wobV = 0; tail.end = null;
          stillSince = 0;                 // at rest again only once it has gathered (the refill waits for that)
        }
        function tauAt(t) {
          if (t < SP_T) return t / SP_T;
          if (t < SP_T + SP_HOLD) return 1 + 0.5 * (t - SP_T) / SP_HOLD;
          return 1.5 + Math.min(1, (t - SP_T - SP_HOLD) / SP_REC);
        }
        function parAt(tau) {
          return tau < 1 ? splashPar(0, tau) : (tau < 1.5 ? splashPar(1, (tau - 1) * 2) : splashPar(2, tau - 1.5));
        }
        function fingerGrow(f, tau) { return f.L * Math.pow(smooth(f.born, 1.45, Math.min(tau, 1.5)), 0.85); }
        // one frame of the splash; returns false once the drop has gathered again
        function stepSplash(now) {
          var S = splash, t = now - S.t0, tau = tauAt(t);
          if (tau >= 2.5) return false;
          var P = parAt(tau), best = null;
          for (var i = 0; i < SP_KEYS.length; i++) {
            var K = SP_KEYS[i];
            if (K.st && (!best || Math.abs(K.tau - tau) < Math.abs(best.tau - tau))) best = K;
          }
          // keyframe → this instant: match the rim; once the shape has become
          // the resting cap there is no rim to match, and the scale goes to 1
          var ks = (P.rr / best.par.rr) * (1 - P.m) + P.m;
          S.key = best; S.rr = P.rr * S.sV; S.rOut = (P.rr + P.b) * S.sV; S.b = P.b * S.sV;
          setState(best.st);
          head.style.transform = 'translate(' + (S.x - best.st.S / 2) + 'px,' + (S.y - best.st.S / 2) + 'px)' +
            ' scale(' + (S.sV * ks).toFixed(4) + ')';
          x = S.x; y = S.y;
          for (var i = 0; i < S.spray.length; i++) {
            var q = S.spray[i];
            if (q.done || t < q.t) continue;
            q.done = true;
            var sp0 = 0.5 + 0.3 * Math.random();                    // px/ms
            addWet(now, S.x + Math.cos(q.a) * S.rOut, S.y + Math.sin(q.a) * S.rOut, (0.8 + 0.5 * Math.random()) * S.sV,
              Math.cos(q.a) * sp0, Math.sin(q.a) * sp0, 150 + 150 * Math.random());
          }
          for (var i = 0; i < S.fingers.length; i++) {
            var f = S.fingers[i], rb = 1.5 * f.w;
            if (f.cut >= 0) {                                       // tip gone: the stub pulls back into the rim
              f.len = f.stub * (1 - smooth(0, 90, now - f.cut));
              continue;
            }
            if (tau < 1.5) {
              f.len = fingerGrow(f, tau);
              f.tipR = S.rOut + f.len;
              if (f.fate === 'fly' && tau >= f.pe && f.len > rb * 2) {
                var v = Math.max(0.05, (f.tipR - f.lastR) / Math.max(1, now - (f.lastT || now - 16)));
                var ang = f.a + (Math.random() - 0.5) * 0.1, spd = v * (1 + 0.3 * Math.random());
                addWet(now, S.x + Math.cos(f.a) * f.tipR, S.y + Math.sin(f.a) * f.tipR, rb * (0.95 + 0.15 * Math.random()),
                  Math.cos(ang) * spd, Math.sin(ang) * spd, 280 + 320 * Math.random());
                f.cut = now; f.stub = Math.max(0, f.len - rb);
              }
            } else if (f.fate === 'strand') {                       // the tip stays; the thread stretches
              var lig = f.tipR - rb - S.rOut;
              f.len = f.tipR - S.rOut;
              if (lig > 9.02 * 0.8 * f.w) {                           // one Plateau–Rayleigh wavelength long: it pinches
                addWet(now, S.x + Math.cos(f.a) * f.tipR, S.y + Math.sin(f.a) * f.tipR, rb * 1.05, 0, 0, 0);
                if (lig > 14 * S.sV) {                               // a long thread leaves a satellite
                  var mr = S.rOut + lig * 0.5;
                  addWet(now, S.x + Math.cos(f.a) * mr, S.y + Math.sin(f.a) * mr, 0.6 * f.w, 0, 0, 0);
                }
                f.cut = now; f.stub = lig * 0.5;
              }
            } else {                                                // pulled back with the rim
              var held = f.held || (f.held = fingerGrow(f, 1.5));
              f.len = held * (1 - smooth(1.5, 1.95, tau));
              f.tipR = S.rOut + f.len;
            }
            f.lastR = f.tipR; f.lastT = now;
          }
          return true;
        }
        function endSplash() {
          var S = splash;
          // the water that flew off is gone from the drop
          vol = Math.max(0.3, Math.pow(Math.max(0.05, Math.pow(S.vol0, 1.5) - S.lost), 2 / 3));
          x = S.x; y = S.y; vx = 0; vy = 0;
          wob = 0; wobV = -0.045;         // still rushing inward: it overshoots, then rings
          splash = null;
          setState(ROUND);
        }
        // Painted parts: fingers, the pearling tail, and droplets too small to
        // need a lens. The edge bends light away (dark on a light page, a pale
        // line on a dark one); a droplet focuses light into a bright spot on the
        // side away from the lamp; a small glint faces the lamp.
        function paintWater(P, cx, cy, r, light, tintA) {
          if (tintA > 0.003) { fctx.fillStyle = 'rgba(135,198,226,' + tintA + ')'; fctx.fill(P); }
          fctx.lineWidth = Math.max(0.6, Math.min(1, r * 0.4)) * FXDPR;
          fctx.strokeStyle = light ? 'rgba(24,40,58,0.34)' : 'rgba(196,224,248,0.24)';
          fctx.stroke(P);
          if (light) {
            fctx.fillStyle = 'rgba(255,255,255,0.5)';
            fctx.beginPath(); fctx.arc((cx + 0.3 * r) * FXDPR, (cy + 0.36 * r) * FXDPR, Math.max(0.35, 0.34 * r) * FXDPR, 0, 6.2832); fctx.fill();
          }
          fctx.fillStyle = 'rgba(255,255,255,' + (light ? 0.95 : 0.85) + ')';
          fctx.beginPath(); fctx.arc((cx - 0.36 * r) * FXDPR, (cy - 0.42 * r) * FXDPR, Math.max(0.35, 0.24 * r) * FXDPR, 0, 6.2832); fctx.fill();
        }
        // A thread of water from (bx,by) along (c,s): starts at r0, reaches L
        // further, half-width w, widening by `widen` where it joins its source,
        // ending in a bulb of radius rb.
        function ligament(bx, by, c, s, r0, L, w, rb, widen) {
          var nx = -s, ny = c, lft = [], rgt = [], n = 10;
          for (var k = 0; k <= n; k++) {
            var u = k / n, d = u * (L - rb), hw = w * (1 + widen * (1 - u) * (1 - u));
            var px = bx + c * (r0 + d), py = by + s * (r0 + d);
            lft.push([px + nx * hw, py + ny * hw]); rgt.push([px - nx * hw, py - ny * hw]);
          }
          var ex = bx + c * (r0 + L - rb), ey = by + s * (r0 + L - rb);
          var P = new Path2D();
          P.moveTo(rgt[0][0] * FXDPR, rgt[0][1] * FXDPR);
          for (var k = 1; k <= n; k++) P.lineTo(rgt[k][0] * FXDPR, rgt[k][1] * FXDPR);
          var aR = Math.atan2(rgt[n][1] - ey, rgt[n][0] - ex), aL = Math.atan2(lft[n][1] - ey, lft[n][0] - ex);
          P.arc(ex * FXDPR, ey * FXDPR, rb * FXDPR, aR, aL, false);   // round the outer end
          for (var k = n; k >= 0; k--) P.lineTo(lft[k][0] * FXDPR, lft[k][1] * FXDPR);
          P.closePath();
          return { P: P, x: ex, y: ey };
        }
        // all painted droplets in a handful of draw calls (there can be hundreds)
        function paintDroplets(light, tintA) {
          var body = new Path2D(), dot = new Path2D(), thin = new Path2D(), thick = new Path2D(), glint = new Path2D(), spot = new Path2D(), n = 0;
          for (var j = 0; j < wet.length; j++) {
            var w = wet[j], r = w.r;
            if (w.el || r < 0.3) continue;
            var X = w.x * FXDPR, Y = w.y * FXDPR, R = r * FXDPR;
            if (r < 1.3) {                                          // too small to show an inside: a speck with a glint
              dot.moveTo(X + R, Y); dot.arc(X, Y, R, 0, 6.2832);
              glint.moveTo(X - 0.3 * R + 0.35 * FXDPR, Y - 0.35 * R); glint.arc(X - 0.3 * R, Y - 0.35 * R, 0.35 * FXDPR, 0, 6.2832);
              n++; continue;
            }
            body.moveTo(X + R, Y); body.arc(X, Y, R, 0, 6.2832);
            (r < 2 ? thin : thick).moveTo(X + R, Y); (r < 2 ? thin : thick).arc(X, Y, R, 0, 6.2832);
            var gr = Math.max(0.35, 0.24 * r) * FXDPR, gx = X - 0.36 * R, gy = Y - 0.42 * R;
            glint.moveTo(gx + gr, gy); glint.arc(gx, gy, gr, 0, 6.2832);
            var sr = Math.max(0.35, 0.34 * r) * FXDPR, sx = X + 0.3 * R, sy = Y + 0.36 * R;
            spot.moveTo(sx + sr, sy); spot.arc(sx, sy, sr, 0, 6.2832);
            n++;
          }
          if (!n) return;
          if (tintA > 0.003) { fctx.fillStyle = 'rgba(135,198,226,' + tintA + ')'; fctx.fill(body); }
          fctx.fillStyle = light ? 'rgba(24,40,58,0.26)' : 'rgba(196,224,248,0.22)'; fctx.fill(dot);
          fctx.strokeStyle = light ? 'rgba(24,40,58,0.34)' : 'rgba(196,224,248,0.24)';
          fctx.lineWidth = 0.7 * FXDPR; fctx.stroke(thin);
          fctx.lineWidth = 1 * FXDPR; fctx.stroke(thick);
          if (light) { fctx.fillStyle = 'rgba(255,255,255,0.5)'; fctx.fill(spot); }
          fctx.fillStyle = 'rgba(255,255,255,' + (light ? 0.95 : 0.85) + ')'; fctx.fill(glint);
        }
        function renderFx(now) {
          fctx.clearRect(0, 0, fx.width, fx.height);
          var light = isLight(), tintA = TINT * 0.02;
          if (splash && splash.fingers) {
            var S = splash;
            fctx.save();
            fctx.beginPath();
            fctx.rect(0, 0, fx.width, fx.height);
            fctx.arc(S.x * FXDPR, S.y * FXDPR, Math.max(0, S.rOut - 0.6) * FXDPR, 0, 6.2832, true);
            fctx.clip('evenodd');                                   // the rim itself is the refracting keyframe
            for (var i = 0; i < S.fingers.length; i++) {
              var f = S.fingers[i];
              if (f.len < 0.5) continue;
              var r0 = S.rOut - Math.max(1, S.b), L = S.rOut + f.len - r0;
              var rb = f.cut >= 0 ? f.w * 0.9 : Math.min(1.5 * f.w, L * 0.5);  // after the tip left, a plain stub
              var g = ligament(S.x, S.y, Math.cos(f.a), Math.sin(f.a), r0, L, f.w, rb, 1.1);
              paintWater(g.P, g.x, g.y, rb, light, tintA);
            }
            fctx.restore();
          }
          if (tail.a > 0 && tail.end) {                             // the thread behind a pearling drop
            var c = -Math.cos(theta), s = -Math.sin(theta), rb = Math.max(tail.a * 1.2, tail.r * Math.cbrt(tail.arc / tail.lam));
            var g2 = ligament(tail.x0, tail.y0, c, s, 0, tail.len, tail.a, Math.min(rb, tail.len * 0.5), 0.8);
            paintWater(g2.P, g2.x, g2.y, rb, light, tintA);
          }
          paintDroplets(light, tintA);
        }
        function updateWet(now, dt, headR) {
          for (var j = wet.length - 1; j >= 0; j--) {
            var w = wet[j], sc;
            if (now < w.tLand) {                                    // in the air: a sphere, its footprint smaller
              w.x += w.vx * dt; w.y += w.vy * dt; sc = 0.86; w.r = w.r0 * sc;
            } else {
              var ta = now - w.tLand, ev = ta / w.life;
              if (ev >= 1) { dropWet(j); continue; }
              // lands: flattens onto the glass, rings once, then sits and evaporates
              sc = ta < 140 ? 1 - 0.14 * Math.cos(ta / 140 * 3 * Math.PI) * (1 - ta / 140) : 1;
              w.r = w.r0 * Math.sqrt(1 - ev) * sc;
              if (headR > 0) {                                        // the drop reaches it: coalescence
                var dx = w.x - x, dy = w.y - y;
                if (dx * dx + dy * dy < Math.pow(headR + w.r * 0.6, 2)) {
                  var V = Math.pow(vol, 1.5), fv = wetFv(w.r);
                  x += dx * fv / (V + fv); y += dy * fv / (V + fv);
                  vol = Math.min(1.25, Math.pow(V + fv, 2 / 3));   // merges within a frame at this size: no ringing
                  dropWet(j); continue;
                }
              }
            }
            if (w.el) w.el.style.transform = 'translate(' + (w.x - DSZ / 2) + 'px,' + (w.y - DSZ / 2) + 'px) scale(' +
              Math.max(0.02, w.r / BR).toFixed(4) + ')';
          }
        }

        /* --- pearling ---
         * Past the cusp the rear pulls out a thin tail whose end pinches off
         * pearls along the drop's axis. Measured off the top-view photograph at
         * the onset (Le Grand et al. 2005, fig. 4e): a pearl is ~1/23 of the
         * drop's width across and pearls sit ~6.4 diameters apart. Pearls grow
         * with speed (ibid.); faster, the pinch-off also leaves a smaller
         * satellite (the cascade of their fig. 6). Pearls stay where they fall;
         * each takes its water from the drop. */
        var V_PEARL = LEVELS[LEVELS.length - 1].v;
        function pearling(now, st, sV) {
          if (spS < V_PEARL || pinned || vol < 0.5) { tail.a = 0; tail.end = null; return; }
          var rP = (0.8 + 1.7 * clamp01((spS - V_PEARL) / 18)) * sV, lam = 12.8 * rP, a = 0.45 * rP;
          var c = Math.cos(theta), s = Math.sin(theta), tipD = st.tip * sV;
          tail.a = a; tail.lam = lam; tail.r = rP; tail.len = Math.max(0.5 * lam, 0.35 * st.b * sV);
          tail.x0 = x - c * (tipD - 0.8); tail.y0 = y - s * (tipD - 0.8);
          var ex = x - c * (tipD + tail.len), ey = y - s * (tipD + tail.len);
          if (!tail.end) { tail.end = { x: ex, y: ey }; tail.arc = 0; return; }
          var dx = ex - tail.end.x, dy = ey - tail.end.y, d = Math.sqrt(dx * dx + dy * dy), done = 0;
          while (tail.arc + d - done >= lam) {                    // one pearl per wavelength travelled
            done += lam - tail.arc; tail.arc = 0;
            var f = done / Math.max(d, 1e-6), px = tail.end.x + dx * f, py = tail.end.y + dy * f;
            var fv = wetFv(rP);
            vol = Math.pow(Math.max(0.05, Math.pow(vol, 1.5) - fv), 2 / 3);
            addWet(now, px, py, rP, 0, 0, 0);
            if (Math.random() < Math.min(0.6, (spS - V_PEARL) / 20)) {
              var bf = Math.max(0, f - 0.5 * lam / Math.max(d, 1e-6));
              addWet(now, tail.end.x + dx * bf + c * 0.5 * lam, tail.end.y + dy * bf + s * 0.5 * lam, 0.45 * rP, 0, 0, 0);
            }
          }
          tail.arc += d - done;
          tail.end = { x: ex, y: ey };
        }

        /* --- main loop --- */
        function step(now) {
          var dt = Math.min(now - lastNow, 50) || 16.7;
          lastNow = now;
          if (mode !== 'water') { requestAnimationFrame(step); return; }
          var k = dt / 16.7;                               // 1 at 60 Hz, 0.5 at 120 Hz
          if (active) {
            // 22ms ≈ 45fps. Only count frames where the cursor is doing work.
            if (dt > 22) { slowFrames++; } else if (slowFrames > 0) { slowFrames--; }
            if (slowFrames > 90) {                         // degrade: no bead lenses, then fewer droplets
              slowFrames = 0;
              if (MAX_WET_LENS) MAX_WET_LENS = 0;
              else MAX_WET = Math.max(60, Math.floor(MAX_WET / 2));
            }
          }
          if (splash && !stepSplash(now)) endSplash();
          var sp = 0, st = cur, sV = Math.sqrt(vol) * (pointing ? 0.85 : 1);
          if (!splash) {
            var dxT = tx - x, dyT = ty - y, distT = Math.sqrt(dxT * dxT + dyT * dyT);
            if (pinned && (distT > PIN_BREAK || now - lastMoveT > PIN_HOLD)) pinned = false;
            if (pinned) {
              vx = 0; vy = 0; lean = distT / PIN_BREAK; leanDir = Math.atan2(dyT, dxT);
            } else {
              var al = 1 - Math.exp(-dt / TAU);
              vx = dxT * al / k; vy = dyT * al / k;         // px per 16.7ms
              x += dxT * al; y += dyT * al;
              lean = 0;
            }
            sp = Math.sqrt(vx * vx + vy * vy);
            // the shape follows the speed within a couple of frames (a mm drop
            // relaxes in ~10ms; its ringing, ~80Hz, is too fast to show)
            spS += (sp - spS) * (1 - Math.exp(-dt / 25));
            if (!pinned && sp < 0.35 && distT < 1.2 && now - lastMoveT < PIN_HOLD) pinned = true;
            if (sp < 2) { if (!stillSince) stillSince = now; } else stillSince = 0;
            if (sp > 1.2) theta += angDiff(Math.atan2(vy, vx), theta) * (1 - Math.pow(0.75, k));
            // speed level; a pinned drop leans toward the pull
            var ai = -1;
            for (var i = 0; i < LEVELS.length; i++) if (spS >= LEVELS[i].v) ai = i;
            var dirA = theta;
            if (pinned && lean > 0.35) { ai = Math.max(ai, 0); dirA = leanDir; }
            st = stateFor(ai, dirIndex(dirA));
            setState(st);
            wobV += (-0.16 * wob - 0.11 * wobV) * k;       // only the splash's recoil rings (it runs slowed down)
            wob += wobV * k;
            // translate + uniform scale only — see the header: no rotate() here
            head.style.transform =
              'translate(' + (x - st.S / 2) + 'px,' + (y - st.S / 2) + 'px)' +
              ' scale(' + (sV * (1 + wob)).toFixed(4) + ')';
            if (active) pearling(now, st, sV);
            // The one rule that is not physics: a drop at rest slowly returns to
            // its own size, so the cursor never ends up shrunk or swollen after
            // pearls and splashes. Nothing on the glass is pulled back for it.
            if (stillSince && now - stillSince > 400) vol += (1 - vol) * (1 - Math.exp(-dt / 1800));
          } else { tail.a = 0; tail.end = null; }
          updateWet(now, dt, splash ? 0 : R0 * sV * (1 + wob));
          renderFx(now);
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
            fctx.clearRect(0, 0, fx.width, fx.height);
            for (var j = wet.length - 1; j >= 0; j--) dropWet(j);
            tail.a = 0; tail.end = null;
            if (splash) { splash = null; setState(ROUND); }
          } else if (active) {
            html.classList.add('glass-liquid');
            head.style.opacity = '1';
          }
          var btns = document.querySelectorAll('.glass-cursor-toggle');
          for (var i = 0; i < btns.length; i++) {
            // Both languages, switched by the page's html[data-lang] rule like
            // every other label. It used to write the Chinese words only, so the
            // English view of a page with this button showed 系统光标.
            btns[i].innerHTML = m === 'water'
              ? '<span class="lang-en">System cursor</span><span class="lang-zh">系统光标</span>'
              : '<span class="lang-en">Water cursor</span><span class="lang-zh">水珠光标</span>';
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
