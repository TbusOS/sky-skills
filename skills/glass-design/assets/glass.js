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
     * stretch direction is baked instead — a round state plus 5 stretch
     * levels × 24 directions, baked in idle time; until a direction is
     * ready the nearest baked state stands in.
     *
     * Moving drops are teardrops (round steep front, longer flatter tail).
     * Very slow drags stick, lean, then slip (contact-line pinning). Fast
     * moves lay a rivulet that necks per Plateau–Rayleigh and breaks into
     * small refracting beads that evaporate < 1s. Stopping pulls nearby trail
     * water back in. Double-click bursts the drop. All motion is integrated
     * per unit of real time, so a 120 Hz display behaves like a 60 Hz one.
     * Never installed under freeze; opt out with <html data-no-liquid>;
     * runtime water/system switch via .glass-cursor-toggle (localStorage
     * sky-cursor). Regression check: scripts/check_water_refraction.mjs. */
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
         * In the drop's own frame, u along the motion and v across it: the
         * advancing front is round, the tail longer and a little narrower.
         * asym 0 is an ellipse (at rest, a circle). The front stands steeper
         * than the tail (advancing vs receding contact angle). */
        function dropShape(a, b, asym, phi) {
          var c = Math.cos(phi), s = Math.sin(phi), ex = asym / 0.28;
          return {
            rho: Math.min(a * (1 - asym), b),     // largest inside distance
            sdf: function (dx, dy) {
              var u = dx * c + dy * s, v = -dx * s + dy * c;
              var au = u >= 0 ? a * (1 - asym) : a * (1 + asym);
              var bv = u >= 0 ? b : b * (1 - 0.35 * asym * Math.min(1, -u / au));
              var q = Math.sqrt((u / au) * (u / au) + (v / bv) * (v / bv));
              return (q - 1) * Math.min(au, bv);
            },
            theta: function (dx, dy) {            // contact angle, degrees
              var u = Math.max(-1, Math.min(1, (dx * c + dy * s) / a));
              return 72 + ex * (u >= 0 ? 14 * u : 16 * u);
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
        function bake(S, RES, shape, shadowOverlay) {
          var N = S * RES, c0 = S / 2;
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
            var su = surface(shape, qx, qy);
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
            var su2 = surface(shape, x, y);
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
              // premultiplied "over": tint, then environment reflection, then highlight
              var cd = [0, 0, 0, 0], cl = [0, 0, 0, 0];
              over(cd, 0.55, 0.78, 0.89, tintA);
              over(cd, 0.80, 0.87, 0.96, Math.min(1, F * 0.7));       // bright sky over a dark page
              over(cd, 1, 1, 1, hl);
              over(cl, 0.55, 0.78, 0.89, tintA * 0.6);
              over(cl, 0.24, 0.28, 0.34, Math.min(1, F * 0.85));      // room reflection over a white page
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

        /* --- SVG filters: head / bead (light, then Snell, slight dispersion) / rivulet --- */
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
        defs.setAttribute('aria-hidden', 'true');
        defs.style.position = 'absolute';
        // Four primitives: read the map, light the page (caustic / shadow land
        // on it), then look at that page through the drop. No per-channel
        // dispersion: water's index differs by ~2% across the visible range,
        // which at these offsets (≤ 8px) splits the channels by < 0.3px —
        // invisible, and it cost 7 more primitives per drop.
        // Small beads skip the lighting step (lit = false): their shadow is a
        // pixel or two, and with up to 10 of them on screen it is the part of
        // the effect that costs frames (measured: 14 lit beads 145 frames / 3s
        // vs 173 without beads, software rendering).
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
        var DSZ = 38, BR = 12;          // satellite / trail bead: bake box (room for the shadow) and radius
        defs.innerHTML =
          dispChain('glassWaterHead', '', true) +
          dispChain('glassWaterBead', ' width="' + DSZ + '" height="' + DSZ + '"', false) +
          '<filter id="glassWaterTrail" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="1" seed="11" result="n"/>' +
          '<feDisplacementMap id="glassWaterTrailDisp" in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>' +
          '</filter>';
        document.body.appendChild(defs);
        function setScale(v) {
          document.getElementById('glassWaterHeadD').setAttribute('scale', v);
          document.getElementById('glassWaterBeadD').setAttribute('scale', v);
          document.getElementById('glassWaterTrailDisp').setAttribute('scale', Math.round(v * 0.5));
        }
        setScale(REFR);

        /* --- drop states: round + 5 stretch levels × 24 directions --- */
        var R0 = 16, NDIR = 24, ASYM_MAX = 0.28;
        var ASPECTS = [1.15, 1.35, 1.6, 1.85, 2.1];
        function makeState(s, k) {
          var a = R0 * Math.sqrt(s), b = R0 / Math.sqrt(s);
          var asym = ASYM_MAX * (s - 1) / (ASPECTS[ASPECTS.length - 1] - 1);
          var phi = k < 0 ? 0 : k * 2 * Math.PI / NDIR;
          var S = 2 * Math.ceil(Math.max(a * (1 + asym), b) + 10);
          var shape = dropShape(a, b, asym, phi);
          return { a: a, b: b, S: S, maps: bake(S, 2, shape) };
        }
        var ROUND = makeState(1, -1);
        var STATES = new Array(ASPECTS.length * NDIR);
        var bakeQueue = [];
        for (var qa = 0; qa < ASPECTS.length; qa++) for (var qk = 0; qk < NDIR; qk++) bakeQueue.push(qa * NDIR + qk);
        function bakeSome() {
          var t0 = performance.now();
          while (bakeQueue.length && performance.now() - t0 < 8) {
            var key = bakeQueue.shift();
            if (!STATES[key]) STATES[key] = makeState(ASPECTS[Math.floor(key / NDIR)], key % NDIR);
          }
          if (bakeQueue.length) scheduleBake();
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
          return bake(DSZ, 2, dropShape(BR, BR, 0, 0), true);
        }
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
          for (var j = 0; j < drops.length; j++) {
            drops[j].el.style.backgroundImage = 'url(' + (isLight() ? BEAD.specLight : BEAD.spec) + ')';
          }
        }).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

        /* --- physics state --- */
        var tx = -300, ty = -300, x = -300, y = -300, vx = 0, vy = 0;
        var active = false, pointing = false, lastMoveT = 0;
        // Spring tuned at 60 Hz, applied per 16.7ms of real time (k below).
        var STIFF = 0.22, DAMP = 0.72;
        // Contact-line pinning: a resting drop holds on until pulled PIN_BREAK
        // px away, leaning toward the pull. After PIN_HOLD ms without pointer
        // motion it lets go, so a resting drop always ends on the pointer.
        var PIN_BREAK = 3.2, PIN_HOLD = 220;
        var pinned = false, lean = 0, leanDir = 0;
        var theta = 0, vol = 1.0, wob = 0, wobV = 0;
        var stillSince = 0, lastNow = 0, prevSpeed = 0, lastSat = 0;
        var expl = null;
        var pts = [], cumArc = 0, lastDep = null, strokePh = Math.random() * 6.28, lastDepT = 0;
        var LIFE = 920, NECK_T = 0.26, LAM = 27;
        var DEPOSIT_V = 4, GAP_PX = 3;
        var drops = [], POOL = [];
        var promoted = {}, MAX_TRAIL_BEADS = 10;
        var trailGeom = { x: -1, y: -1, w: -1, h: -1 };
        // The rivulet's continuous refraction layer is OPT-IN
        // (<html data-water-trail-refr>). Measured on the real glass page
        // (software rendering): animating clip-path on a turbulence
        // backdrop-filter element re-runs the whole filter chain every frame —
        // 27fps with it, 60fps without. By default the rivulet refracts where
        // it matters: once it breaks into beads, each bead is a small real lens.
        var trailRefr = html.hasAttribute('data-water-trail-refr');
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
        function dirIndex(a) {
          var t = a / (2 * Math.PI / NDIR);
          return ((Math.round(t) % NDIR) + NDIR) % NDIR;
        }

        /* --- rivulet deposit (interpolated so fast moves stay continuous) --- */
        function deposit(now, sp, st, sV, k) {
          var bx = x - Math.cos(theta) * st.a * sV * 0.7;
          var by = y - Math.sin(theta) * st.a * sV * 0.7;
          var w0 = Math.min(9.5, 2.6 + R0 * sV * 0.16 + Math.min(sp, 34) * 0.075);
          if (lastDep && now - lastDepT <= 120) {
            var dgap = Math.sqrt(Math.pow(bx - lastDep.x, 2) + Math.pow(by - lastDep.y, 2));
            if (dgap < GAP_PX) return;
            var steps = Math.min(30, Math.floor(dgap / 4));
            for (var s = 1; s <= steps; s++) {
              var f = s / (steps + 1);
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
          vol = Math.max(0.55, vol - 0.0035 * k);
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
        // Once the necks have broken, each bead the rivulet leaves behind
        // becomes a small real lens (a pooled bead element), so the trail
        // refracts without the full-trail filter.
        function promoteBeads(now) {
          var alive = 0;
          for (var j = 0; j < drops.length; j++) if (drops[j].trail) alive++;
          for (var i = 0; i < pts.length && alive < MAX_TRAIL_BEADS; i++) {
            var p = pts[i], age = (now - p.t) / LIFE;
            if (p.ex || age < NECK_T + 0.12 || age > 0.8) continue;
            var u = p.arc / LAM + p.ph / 6.2832;             // bead centre where sin(...) = −1
            var c = Math.round(u - 0.75) + 0.75;
            if (Math.abs(u - c) * LAM > 2.2) continue;
            var key = p.ph.toFixed(3) + ':' + Math.round(c * 4);
            if (promoted[key]) continue;
            var w = trailWidth(p, now);
            if (w < 1.3) continue;
            promoted[key] = 1; alive++;
            var fv = Math.pow(w * 1.05 / (R0 * 2.2), 2);
            spawnSatAt(now, p.x, p.y, 0, 0, fv, LIFE * (1 - age) + 240, true);
          }
        }
        function renderTrail(now) {
          while (pts.length && now - pts[0].t >= LIFE) pts.shift();
          if (!pts.length) promoted = {};
          fctx.clearRect(0, 0, fx.width, fx.height);
          if (!pts.length) { trailEl.style.display = 'none'; return; }
          var segs = [], cs = null;
          for (var i = 0; i < pts.length; i++) {
            var p = pts[i], w = trailWidth(p, now);
            var brk = cs && (Math.sqrt(Math.pow(p.x - cs.pts[cs.pts.length - 1].x, 2) + Math.pow(p.y - cs.pts[cs.pts.length - 1].y, 2)) > 24);
            if (w > 0.6 && !brk) {
              if (!cs) { cs = { pts: [], ws: [] }; segs.push(cs); }
              // wavy organic edges — real water boundaries are never smooth math
              var wv = w * (1 + 0.15 * Math.sin(p.arc * 0.34 + p.ph * 2.1) + 0.08 * Math.sin(p.arc * 0.91));
              cs.pts.push(p); cs.ws.push(Math.max(wv, 0.4));
            } else cs = null;
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
          // Quantize the refraction element's geometry to a 128px grid:
          // per-frame left/top/width/height changes force the browser to
          // re-capture the backdrop and re-run feTurbulence every frame.
          // Snapped geometry only changes when the trail crosses a grid line;
          // the clip-path keeps animating at 60Hz.
          var Q = 128;
          x0 = Math.floor(x0 / Q) * Q; y0 = Math.floor(y0 / Q) * Q;
          var qw = Math.ceil((x1 - x0) / Q) * Q, qh = Math.ceil((y1 - y0) / Q) * Q;
          trailEl.style.display = trailRefr ? 'block' : 'none';
          if (trailGeom.x !== x0 || trailGeom.y !== y0 || trailGeom.w !== qw || trailGeom.h !== qh) {
            trailGeom = { x: x0, y: y0, w: qw, h: qh };
            trailEl.style.left = x0 + 'px'; trailEl.style.top = y0 + 'px';
            trailEl.style.width = qw + 'px';
            trailEl.style.height = qh + 'px';
          }
          var path = '', tintA = TINT * 0.016, light = isLight();
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
            if (trailRefr) {
              var sp2 = 'M' + (L[0][0] - x0).toFixed(1) + ' ' + (L[0][1] - y0).toFixed(1);
              for (var k = 1; k < n; k++) sp2 += 'L' + (L[k][0] - x0).toFixed(1) + ' ' + (L[k][1] - y0).toFixed(1);
              for (var k = n - 1; k >= 0; k--) sp2 += 'L' + (R[k][0] - x0).toFixed(1) + ' ' + (R[k][1] - y0).toFixed(1);
              path += sp2 + 'Z';
            }
            /* fx layer: faint body, refraction edge, a thin highlight on the
             * light-facing edge (no painted centre line — water has none) */
            var P = new Path2D();
            P.moveTo(L[0][0] * FXDPR, L[0][1] * FXDPR);
            for (var k = 1; k < n; k++) P.lineTo(L[k][0] * FXDPR, L[k][1] * FXDPR);
            for (var k = n - 1; k >= 0; k--) P.lineTo(R[k][0] * FXDPR, R[k][1] * FXDPR);
            P.closePath();
            var ageMid = (now - s.pts[Math.floor(n / 2)].t) / LIFE;
            // after the break the beads carry the look; the ribbon steps back
            var fade = (1 - ageMid * 0.8) * (ageMid > NECK_T + 0.12 ? 0.45 : 1);
            if (tintA > 0.003) { fctx.fillStyle = 'rgba(135,198,226,' + (tintA * fade) + ')'; fctx.fill(P); }
            fctx.lineWidth = 1.0 * FXDPR;
            fctx.strokeStyle = light ? 'rgba(30,52,72,' + (0.30 * fade) + ')' : 'rgba(200,230,255,' + (0.20 * fade) + ')';
            fctx.stroke(P);
            fctx.lineCap = 'round'; fctx.lineJoin = 'round';
            fctx.beginPath();
            for (var k = 0; k < n; k++) {
              var p = s.pts[k], w = s.ws[k];
              var p0 = s.pts[Math.max(0, k - 1)], p1 = s.pts[Math.min(n - 1, k + 1)];
              var tx2 = p1.x - p0.x, ty2 = p1.y - p0.y;
              var tn = Math.max(Math.sqrt(tx2 * tx2 + ty2 * ty2), 1e-4);
              var nx = -ty2 / tn, ny = tx2 / tn;
              if (nx * LK[0] + ny * LK[1] < 0) { nx = -nx; ny = -ny; }
              var hx = (p.x + nx * w * 0.62) * FXDPR, hy = (p.y + ny * w * 0.62) * FXDPR;
              if (k === 0) fctx.moveTo(hx, hy); else fctx.lineTo(hx, hy);
            }
            var wAvg = 0;
            for (var k = 0; k < n; k++) wAvg += s.ws[k];
            wAvg /= n;
            fctx.lineWidth = Math.max(0.8, wAvg * 0.18) * FXDPR;
            fctx.strokeStyle = 'rgba(255,255,255,' + (0.28 * fade) + ')';
            fctx.stroke();
            for (var k = 0; k < n; k += 6) {
              var p = s.pts[k];
              var r1 = Math.sin(p.arc * 12.9898 + p.ph * 78.233) * 43758.5453;
              r1 -= Math.floor(r1);
              if (r1 < 0.25) {
                fctx.fillStyle = 'rgba(255,255,255,' + (0.45 * fade) + ')';
                fctx.fillRect((p.x + (r1 - 0.5) * s.ws[k]) * FXDPR, (p.y + (r1 * 2 - 1) * s.ws[k] * 0.5) * FXDPR, 1.4 * FXDPR, 1.4 * FXDPR);
              }
            }
          });
          if (trailRefr) trailEl.style.clipPath = 'path("' + path + '")';
        }

        /* --- satellites + trail beads (small real lenses, re-absorbable) --- */
        function spawnSatAt(now, px, py, velx, vely, fv, life, trail) {
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
          el.style.display = 'block';
          drops.push({ el: el, x: px, y: py, vx: velx, vy: vely, fv: fv, t: now, life: life, abs: false, trail: !!trail });
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
            for (var s = 1; s <= steps; s++) {
              var sl = s / steps * len;
              cumArc += 3.5;
              pts.push({
                x: x + Math.cos(ang) * sl - Math.sin(ang) * curv * sl * sl,
                y: y + Math.sin(ang) * sl + Math.cos(ang) * curv * sl * sl,
                t: now, w0: w0 * (1 - (s / steps) * 0.5), arc: cumArc, ph: strokePh, retr: 1, ex: 1
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
          var k = dt / 16.7;                               // 1 at 60 Hz, 0.5 at 120 Hz
          if (active) {
            // 22ms ≈ 45fps. Only count frames where the cursor is doing work.
            if (dt > 22) { slowFrames++; } else if (slowFrames > 0) { slowFrames--; }
            if (slowFrames > 90) {                         // degrade: trail filter first, then trail beads
              slowFrames = 0;
              if (trailRefr) { trailRefr = false; trailEl.style.display = 'none'; }
              else MAX_TRAIL_BEADS = Math.max(0, MAX_TRAIL_BEADS - 7);
            }
          }
          var dxT = tx - x, dyT = ty - y, distT = Math.sqrt(dxT * dxT + dyT * dyT);
          if (pinned && (distT > PIN_BREAK || now - lastMoveT > PIN_HOLD)) pinned = false;
          if (pinned) {
            vx = 0; vy = 0; lean = distT / PIN_BREAK; leanDir = Math.atan2(dyT, dxT);
          } else {
            var damp = Math.pow(DAMP, k);
            vx = (vx + dxT * STIFF * k) * damp;
            vy = (vy + dyT * STIFF * k) * damp;
            x += vx * k; y += vy * k;
            lean = 0;
          }
          var sp = Math.sqrt(vx * vx + vy * vy);
          if (!pinned && sp < 0.35 && distT < 1.2 && now - lastMoveT < PIN_HOLD) pinned = true;
          if (sp < 2) { if (!stillSince) stillSince = now; } else stillSince = 0;
          if (prevSpeed > 6 && sp <= 2) wobV += 0.10;
          prevSpeed = sp;
          if (sp > 1.2) theta += angDiff(Math.atan2(vy, vx), theta) * (1 - Math.pow(0.75, k));
          // stretch level from speed; a pinned drop leans toward the pull
          var desired = 1 + 1.1 * Math.max(0, Math.min(1, sp / 22));
          var ai = -1, bd = Math.abs(desired - 1);
          for (var i = 0; i < ASPECTS.length; i++) {
            var dd = Math.abs(ASPECTS[i] - desired);
            if (dd < bd) { bd = dd; ai = i; }
          }
          var dirA = theta;
          if (pinned && lean > 0.35) { ai = Math.max(ai, 0); dirA = leanDir; }
          var st = stateFor(ai, dirIndex(dirA));
          setState(st);
          wobV += (-0.16 * wob - 0.11 * wobV) * k;
          wob += wobV * k;
          var breathe = (stillSince && now - stillSince > 500) ? 0.012 * Math.sin(now * 0.0021) : 0;
          var sV = Math.sqrt(vol) * (pointing ? 0.85 : 1);
          // translate + uniform scale only — see the header: no rotate() here
          head.style.transform =
            'translate(' + (x - st.S / 2) + 'px,' + (y - st.S / 2) + 'px)' +
            ' scale(' + (sV * (1 + wob + breathe)).toFixed(4) + ')';

          if (active && sp > DEPOSIT_V) deposit(now, sp, st, sV, k);
          else lastDep = null;
          /* stopping retracts nearby trail — disabled mid-splash or the
           * tongues get eaten in place instead of visibly flying out */
          var retracting = stillSince && now - stillSince > 140 && !expl;
          if (retracting) {
            for (var j = pts.length - 1; j >= 0; j--) {
              var p = pts[j];
              if (Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < 62) {
                p.retr -= 0.085 * k;
                if (p.retr <= 0) { pts.splice(j, 1); vol = Math.min(1.25, vol + 0.004); }
              }
            }
          }
          if (expl) {
            var ph = now - expl.t0;
            if (ph > 450) {
              var kk = Math.min(0.060, 0.016 + (ph - 450) * 0.00008) * k;
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
          promoteBeads(now);

          if (sp > 20 && now - lastSat > 70) {
            lastSat = now;
            var ang = theta + Math.PI + (Math.random() - 0.5) * 1.2;
            spawnSatAt(now, x + Math.cos(ang) * st.a * sV, y + Math.sin(ang) * st.a * sV,
              Math.cos(ang) * 1.5 + vx * 0.1, Math.sin(ang) * 1.5 + vy * 0.1,
              0.018 + Math.random() * 0.025, 380 + Math.random() * 300);
          }
          var d86 = Math.pow(0.86, k), d92 = Math.pow(0.92, k);
          for (var j = drops.length - 1; j >= 0; j--) {
            var dr = drops[j];
            if (retracting && !dr.abs && Math.sqrt(Math.pow(dr.x - x, 2) + Math.pow(dr.y - y, 2)) < 62) dr.abs = true;
            if (dr.abs) dr.t = Math.max(dr.t, now - dr.life * 0.85);
            var age = (now - dr.t) / dr.life;
            if (age >= 1) { dr.el.style.display = 'none'; POOL.push(dr.el); drops.splice(j, 1); continue; }
            if (dr.abs) {
              var adx = x - dr.x, ady = y - dr.y;
              var adist = Math.max(Math.sqrt(adx * adx + ady * ady), 1);
              dr.vx = (dr.vx + adx / adist * 0.30 * k) * d92;
              dr.vy = (dr.vy + ady / adist * 0.30 * k) * d92;
              if (adist < st.a * sV * 0.9) {
                vol = Math.min(1.25, vol + dr.fv * 0.85); wobV += 0.05;
                dr.el.style.display = 'none'; POOL.push(dr.el); drops.splice(j, 1); continue;
              }
            } else { dr.vx *= d86; dr.vy *= d86; }
            dr.x += dr.vx * k; dr.y += dr.vy * k;
            var rpx = R0 * Math.sqrt(dr.fv) * 2.2, shrink = dr.abs ? 1 : 1 - age * age;
            // bead lens radius BR in its bake → rendered radius ≈ 0.87·rpx
            dr.el.style.transform = 'translate(' + (dr.x - DSZ / 2) + 'px,' + (dr.y - DSZ / 2) + 'px) scale(' + Math.max(rpx * 0.87 / BR * shrink, 0.04).toFixed(4) + ')';
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
            drops.length = 0; pts.length = 0; expl = null; promoted = {};
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
