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

    /* ---------- liquid cursor — the pointer is a water droplet ----------
     * Realism comes from motion physics, not just shading:
     *   spring lag      — the drop chases the pointer with inertia
     *   velocity stretch— it elongates along its direction of travel
     *   stop wobble     — a damped jiggle when it catches up and halts
     *   shed trail      — fast moves leave micro-droplets that evaporate
     * Never installed under freeze (screenshots stay deterministic);
     * opt out per page with <html data-no-liquid>. */
    if (!html.hasAttribute('data-no-liquid') &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var drop = document.createElement('div');
      drop.className = 'glass-drop';
      drop.setAttribute('aria-hidden', 'true');
      drop.style.opacity = '0';
      document.body.appendChild(drop);

      var cursorCss = document.createElement('style');
      cursorCss.textContent = 'html.glass-liquid, html.glass-liquid body, html.glass-liquid a, html.glass-liquid button, html.glass-liquid [role="button"] { cursor: none !important; }';
      document.head.appendChild(cursorCss);

      var tx = -200, ty = -200;     // pointer target
      var x = -200, y = -200;       // drop position (spring)
      var vx = 0, vy = 0;           // drop velocity
      var wobble = 0;               // damped jiggle energy, fed by arrival speed
      var wobblePhase = 0;
      var lastTrail = 0;
      var trailCount = 0;
      var active = false;

      document.addEventListener('pointermove', function (e) {
        tx = e.clientX;
        ty = e.clientY;
        if (!active) {
          active = true;
          x = tx; y = ty;
          html.classList.add('glass-liquid');
          drop.style.opacity = '1';
        }
        var t = e.target;
        if (t && t.closest && t.closest('a, button, input, select, textarea, [role="button"]')) {
          drop.classList.add('is-pointing');
        } else {
          drop.classList.remove('is-pointing');
        }
      }, { passive: true });
      document.addEventListener('pointerleave', function () {
        drop.style.opacity = '0';
      });
      document.addEventListener('pointerenter', function () {
        if (active) drop.style.opacity = '1';
      });

      var STIFF = 0.16, DAMP = 0.70;
      (function liquidFrame(now) {
        // critically-underdamped spring: lag + slight overshoot = liquid chase
        vx = (vx + (tx - x) * STIFF) * DAMP;
        vy = (vy + (ty - y) * STIFF) * DAMP;
        x += vx;
        y += vy;
        var speed = Math.sqrt(vx * vx + vy * vy);

        // stretch along the velocity vector; cap so it never reads as a smear
        var stretch = Math.min(speed * 0.022, 0.42);
        var angle = Math.atan2(vy, vx);

        // wobble: store energy while moving, release as a damped jiggle at rest
        if (speed > 2.5) {
          wobble = Math.min(wobble + speed * 0.004, 0.18);
        } else if (wobble > 0.003) {
          wobblePhase += 0.42;
          stretch += Math.sin(wobblePhase) * wobble;
          angle = wobblePhase * 0.7;   // jiggle axis precesses — looks organic
          wobble *= 0.92;
        }

        drop.style.transform =
          'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)' +
          ' rotate(' + (angle * 57.2958).toFixed(1) + 'deg)' +
          ' scale(' + (1 + stretch).toFixed(3) + ',' + (1 - stretch * 0.55).toFixed(3) + ')' +
          ' rotate(' + (-angle * 57.2958).toFixed(1) + 'deg)';

        // shed micro-droplets when moving fast (water leaves a trail)
        if (speed > 9 && now - lastTrail > 50 && trailCount < 7) {
          lastTrail = now;
          trailCount++;
          var bead = document.createElement('div');
          bead.className = 'glass-drop-trail';
          var size = 6 + Math.min(speed, 26) * 0.45;
          bead.style.width = size + 'px';
          bead.style.height = size + 'px';
          // drop the bead slightly behind the motion, off-axis a touch
          bead.style.left = (x - vx * 1.6 + (vy * 0.18)) + 'px';
          bead.style.top = (y - vy * 1.6 - (vx * 0.18)) + 'px';
          bead.style.marginLeft = (-size / 2) + 'px';
          bead.style.marginTop = (-size / 2) + 'px';
          document.body.appendChild(bead);
          bead.addEventListener('animationend', function () {
            bead.remove();
            trailCount--;
          });
        }
        requestAnimationFrame(liquidFrame);
      })(0);
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
