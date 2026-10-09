/* graphite-design · sketch.js
 *
 * Hand-drawn SVG in graphite pencil: wobbly lines that overshoot their corners,
 * coloured-pencil fills laid down as back-and-forth zigzags, and a timeline that
 * draws everything in story order (ink first, colour after, like a person would).
 *
 * Every primitive returns SVG markup as a string, so the same code runs in the
 * browser and in Node (templates/build_figures.mjs). Everything is seeded: the
 * same seed gives the same drawing, byte for byte. That matters twice — a figure
 * rebuilt next month must not change, and a video exported frame by frame must
 * give the same frame for the same time.
 *
 *   var S = Sketch.create({ seed: 7, id: 'robot' });
 *   S.at(0, 1.6, function () {            // seconds: this group draws from 0 s to 1.6 s
 *     S.rect(40, 40, 200, 120, { fill: 'blue' });
 *     S.text(140, 110, '缓存', { size: 22, anchor: 'middle' });
 *   });
 *   S.art()    -> '<path …/>…'   strokes and fills (put under the pencil filter)
 *   S.labels() -> '<text …/>…'   handwriting (kept out of the filter so it stays sharp)
 *   S.css()    -> '@keyframes …' the figure's own motion keyframes
 *   S.duration -> seconds until the last stroke is down
 *
 * Colours are never written into the markup: every element gets a class
 * (.ln line, .p-blue pencil …) and the stylesheet (graphite.css, or the
 * standalone SVG's own <style>) maps classes to CSS variables. That is how one
 * drawing works on cream paper and on night paper — SVG presentation attributes
 * do not accept var(), and a hard-coded #333 stroke disappears in dark mode.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sketch = factory();
})(this, function () {
  'use strict';

  var PENCILS = ['blue', 'orange', 'green', 'red', 'yellow', 'wood', 'pink', 'grey', 'violet', 'sky'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function f(n) { return String(Math.round(n * 10) / 10); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function polyLen(p) { var s = 0; for (var i = 1; i < p.length; i++) s += dist(p[i - 1], p[i]); return s; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Catmull-Rom through points -> cubic Bézier path data (open curve).
  // Each handle is capped at half its own segment: where a 4 px corner meets a
  // 460 px edge, the uncapped handle is 77 px long and the line swings far past
  // the corner (2026-10-10, every rounded box overshot by ~30 px).
  function spline(p, closed) {
    if (p.length < 2) return '';
    var n = p.length, d = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
    function at(i) { return closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]; }
    function handle(a, b, seg) {
      var hx = (b[0] - a[0]) / 6, hy = (b[1] - a[1]) / 6, L = Math.hypot(hx, hy), cap = seg * 0.5;
      return L > cap && L > 0 ? [hx * cap / L, hy * cap / L] : [hx, hy];
    }
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), seg = dist(p1, p2);
      var h1 = handle(p0, p2, seg), h2 = handle(p1, p3, seg);
      d += 'C' + f(p1[0] + h1[0]) + ' ' + f(p1[1] + h1[1]) + ' ' +
        f(p2[0] - h2[0]) + ' ' + f(p2[1] - h2[1]) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d;
  }

  // Extra points along long edges, so a long side wobbles a little like a hand-drawn one.
  function densify(p, maxSeg, closed) {
    var out = [], n = p.length, last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var a = p[i], b = p[(i + 1) % n], k = Math.floor(dist(a, b) / maxSeg);
      out.push(a);
      for (var j = 1; j <= k; j++) out.push([lerp(a[0], b[0], j / (k + 1)), lerp(a[1], b[1], j / (k + 1))]);
    }
    if (!closed) out.push(p[n - 1]);
    return out;
  }

  // Points of common outlines (no jitter yet).
  function ellipsePts(cx, cy, rx, ry, n, a0) {
    var out = []; n = n || Math.max(10, Math.round((rx + ry) / 7)); a0 = a0 || 0;
    for (var i = 0; i < n; i++) { var a = a0 + i / n * Math.PI * 2; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return out;
  }
  function roundRectPts(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    var out = [], k = 4;
    function arc(cx, cy, a0) { for (var i = 0; i <= k; i++) { var a = a0 + i / k * Math.PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return out;
  }

  // Lines of a hatch inside a polygon: scanlines at `angle` every `gap` px, clipped.
  // vary (optional): a random source; rows then sit 0.7–1.3 gaps apart instead of on a ruler
  function scanlines(poly, angle, gap, vary) {
    var c = Math.cos(-angle), s = Math.sin(-angle);
    var rot = poly.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
    var ys = rot.map(function (p) { return p[1]; });
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), rows = [];
    for (var y = y0 + gap * 0.5; y < y1; y += gap * (vary ? 0.7 + vary() * 0.6 : 1)) {
      var xs = [];
      for (var i = 0; i < rot.length; i++) {
        var a = rot[i], b = rot[(i + 1) % rot.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (m, n) { return m - n; });
      var segs = [];
      for (var j = 0; j + 1 < xs.length; j += 2) segs.push([xs[j], xs[j + 1]]);
      rows.push({ y: y, segs: segs });
    }
    var ci = Math.cos(angle), si = Math.sin(angle);
    function back(x, y) { return [x * ci - y * si, x * si + y * ci]; }
    return { rows: rows, back: back };
  }

  function create(opts) {
    opts = opts || {};
    var R = mulberry32((opts.seed || 1) * 9973 + 17);
    var taste = opts.taste || {};   // a reader's learned preferences (scripts/taste.mjs suggest)
    var rough = (opts.rough == null ? 1 : opts.rough) * (taste.rough == null ? 1 : taste.rough);
    var GAP = taste.hatchGap || 3.7;
    var PACE = taste.pace || 1;      // > 1 slower, < 1 faster; every time below goes through tm()
    function tm(x) { return x * PACE; }
    var uid = opts.id || 'g';
    var art = [], labels = [], css = [], kfN = 0;
    var scene = null, end = 0;

    function rnd(a, b) { return a + (b - a) * R(); }
    function jit(v) { return (R() - 0.5) * 2 * v * rough; }

    // One wobbly stroke between two points, with a little overshoot past both ends.
    function wobble(a, b, over) {
      var len = dist(a, b) || 1, ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
      over = over == null ? Math.min(4, len * 0.04) : over;
      var o1 = rnd(0, over), o2 = rnd(0, over);
      var p0 = [a[0] - ux * o1 + jit(0.8), a[1] - uy * o1 + jit(0.8)];
      var p3 = [b[0] + ux * o2 + jit(0.8), b[1] + uy * o2 + jit(0.8)];
      var bow = jit(Math.min(len * 0.012, 2.4)), nx = -uy, ny = ux;
      var p1 = [lerp(p0[0], p3[0], 0.3) + nx * bow + jit(0.6), lerp(p0[1], p3[1], 0.3) + ny * bow + jit(0.6)];
      var p2 = [lerp(p0[0], p3[0], 0.7) + nx * bow * 0.7 + jit(0.6), lerp(p0[1], p3[1], 0.7) + ny * bow * 0.7 + jit(0.6)];
      return 'M' + f(p0[0]) + ' ' + f(p0[1]) + 'C' + f(p1[0]) + ' ' + f(p1[1]) + ' ' + f(p2[0]) + ' ' + f(p2[1]) + ' ' + f(p3[0]) + ' ' + f(p3[1]);
    }

    function jitterPts(pts, amt) { return pts.map(function (p) { return [p[0] + jit(amt), p[1] + jit(amt)]; }); }

    // Record an element. Outside S.at() it is static; inside, the scene gives it a time slot.
    // untimed: never gets a time slot, even inside S.at (dashed lines: the draw-on
    // animation works by rewriting the dash pattern, so a dashed line cannot use it)
    function put(layer, kind, len, tpl, untimed) {
      var item = { kind: kind, len: len, tpl: tpl, d: null, t: null };
      layer.push(item);
      if (scene && !untimed) scene.items.push(item);
      return item;
    }

    function cls(o, base) {
      var c = base;
      if (o.w) c += ' w-' + o.w;
      if (o.pen) c += ' p-' + o.pen;
      if (o.cls) c += ' ' + o.cls;
      return c;
    }

    // A pencil line: a main pass plus a thinner, shorter second pass that makes
    // the ends look tapered. Both live in one item so they draw together.
    function stroke(d1, d2, len, o) {
      var c = cls(o, 'ln');
      var tpl = '<path d="' + d1 + '" class="' + c + '"%A/>' + (d2 && o.double !== false ? '<path d="' + d2 + '" class="' + c + ' l2"%A/>' : '');
      return put(art, 'ink', len, tpl, /\bdash\b/.test(o.cls || ''));
    }

    var S = {};
    S.rnd = rnd;
    S.pencils = PENCILS;

    // ── timeline ──────────────────────────────────────────────────────────
    // Everything drawn inside fn appears between `start` and `start + dur`
    // seconds: lines and handwriting in the first two thirds (in the order
    // they were drawn, each taking time in proportion to its length — one pen,
    // constant speed), colour in the last third. Same 2:1 split as the
    // srt-whiteboard-animation renderer, because it reads as "sketch, then colour in".
    S.at = function (start, dur, fn, o) {
      o = o || {}; start = tm(start); dur = tm(dur);
      if (scene) throw new Error('S.at() inside S.at()');
      scene = { items: [] };
      fn();
      var items = scene.items; scene = null;
      var ink = items.filter(function (i) { return i.kind === 'ink' || i.kind === 'text'; });
      var col = items.filter(function (i) { return i.kind === 'color'; });
      var inkDur = col.length ? dur * (o.inkShare || 2 / 3) : dur;
      function lay(list, t0, total) {
        var sum = list.reduce(function (s, i) { return s + Math.max(i.len, 1); }, 0), t = t0;
        // handwriting gets at least 0.3 s even when short, or a label just pops in
        list.forEach(function (i) { var len = total * Math.max(i.len, 1) / sum; i.d = t; i.t = Math.max(len, i.kind === 'text' ? 0.3 : 0.04); t += len; });
      }
      lay(ink, start, inkDur);
      lay(col, start + inkDur, dur - inkDur);
      // washes (soft base colour) fade in with the colour item that follows them
      items.forEach(function (i, k) {
        if (i.kind !== 'wash') return;
        var nxt = items.slice(k + 1).filter(function (x) { return x.kind === 'color'; })[0];
        i.d = nxt ? nxt.d : start + inkDur; i.t = Math.min(0.5, dur / 3);
      });
      end = Math.max(end, start + dur);
      return S;
    };

    // ── primitives ────────────────────────────────────────────────────────
    S.line = function (x1, y1, x2, y2, o) {
      o = o || {};
      var a = [x1, y1], b = [x2, y2];
      return stroke(wobble(a, b, o.over), wobble([lerp(x1, x2, 0.06), lerp(y1, y2, 0.06)], [lerp(x1, x2, 0.92), lerp(y1, y2, 0.92)], 0), dist(a, b), o);
    };

    // Open polyline through points; o.smooth (default true) runs a spline through them.
    S.path = function (pts, o) {
      o = o || {};
      if (o.smooth === false) {
        var d = '', d2 = '';
        for (var i = 1; i < pts.length; i++) { d += wobble(pts[i - 1], pts[i], o.over); d2 += wobble(pts[i - 1], pts[i], 0); }
        return stroke(d, d2, polyLen(pts), o);
      }
      pts = densify(pts, 40, false);
      var amt = o.jitter == null ? 1.2 : o.jitter, n = pts.length;
      // second pass starts a little after the first point and stops a little before the last
      var trim = pts.slice(0);
      trim[0] = [lerp(pts[0][0], pts[1][0], 0.15), lerp(pts[0][1], pts[1][1], 0.15)];
      trim[n - 1] = [lerp(pts[n - 1][0], pts[n - 2][0], 0.15), lerp(pts[n - 1][1], pts[n - 2][1], 0.15)];
      return stroke(spline(jitterPts(pts, amt)), spline(jitterPts(trim, amt * 0.9)), polyLen(pts), o);
    };

    // Closed outline with sharp corners: each edge its own stroke, overshooting the corners.
    S.poly = function (pts, o) {
      o = o || {};
      var d = '', d2 = '';
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        d += wobble(a, b, o.over); if (R() < 0.7) d2 += wobble(a, b, 0);
      }
      if (o.fill) S.fill(pts, o.fill, o);
      return stroke(d, d2, polyLen(pts.concat([pts[0]])), o);
    };

    // Closed smooth outline (ellipse, rounded box, blob): one loop that runs a
    // little past where it started, the way a hand closes a circle.
    S.loop = function (pts, o) {
      o = o || {};
      var fillPts = pts;
      pts = densify(pts, 34, true);
      var amt = o.jitter == null ? 1.3 : o.jitter, n = pts.length;
      var j = jitterPts(pts, amt), k = Math.max(1, Math.round(n * (o.closeOver == null ? 0.12 : o.closeOver)));
      var run = j.concat(j.slice(0, k)).map(function (p, i) { return i >= n ? [p[0] + jit(2.2), p[1] + jit(2.2)] : p; });
      // second pass: about 85 % of the loop, starting somewhere else
      var j2 = jitterPts(pts, amt * 0.8), s0 = Math.floor(rnd(0, n)), run2 = [];
      for (var i = 0; i <= Math.floor(n * 0.85); i++) run2.push(j2[(s0 + i) % n]);
      if (o.fill) S.fill(fillPts, o.fill, o);
      return stroke(spline(run), o.double === false ? '' : spline(run2), polyLen(pts) * 1.1, o);
    };

    S.rect = function (x, y, w, h, o) {
      o = o || {};
      if (o.r) return S.loop(roundRectPts(x, y, w, h, o.r), o);
      return S.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], o);
    };
    S.ellipse = function (cx, cy, rx, ry, o) { return S.loop(ellipsePts(cx, cy, rx, ry, null, rnd(0, 6.28)), o || {}); };
    S.circle = function (cx, cy, r, o) { return S.ellipse(cx, cy, r, r, o); };

    // Irregular round shape: bushes, clouds, hair, puddles.
    S.blob = function (cx, cy, rx, ry, o) {
      o = o || {};
      var n = o.n || 14, bump = o.bump == null ? 0.12 : o.bump, a0 = rnd(0, 6.28);
      var pts = [];
      for (var i = 0; i < n; i++) {
        var a = a0 + i / n * Math.PI * 2, k = 1 + (R() - 0.5) * 2 * bump;
        pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
      }
      return S.loop(pts, o);
    };

    // ── coloured pencil ───────────────────────────────────────────────────
    // A soft wash under a zigzag of strokes, like colouring in with the side of
    // a pencil: the strokes stop short of the outline here and there, never fill
    // it flat. `pen` is one of PENCILS. o.gap spacing, o.angle in degrees,
    // o.style 'zig' (default) | 'hatch' (separate strokes) | 'cross' (two directions)
    // | 'wash' (only the soft base).
    S.fill = function (pts, pen, o) {
      o = o || {};
      if (typeof pen === 'object') { o = pen; pen = o.pen; }
      var style = o.style || 'zig', gap = o.gap ? o.gap * GAP / 3.7 : GAP, ang = (o.angle == null ? -38 : o.angle) * Math.PI / 180;
      if (o.wash !== false) {
        var wd = 'M' + pts.map(function (p) { return f(p[0] + jit(1.5)) + ' ' + f(p[1] + jit(1.5)); }).join('L') + 'Z';
        put(art, 'wash', 0, '<path d="' + wd + '" class="ws p-' + pen + (o.washCls ? ' ' + o.washCls : '') + '"%A/>');
      }
      if (style === 'wash') return S;
      var passes = style === 'cross' ? [ang, ang + Math.PI / 2.3] : [ang];
      passes.forEach(function (a) {
        var sc = scanlines(pts, a + jit(0.05), gap, R), d = '', len = 0, prev = null, flip = false;
        sc.rows.forEach(function (row) {
          row.segs.forEach(function (sg, si) {
            var w = sg[1] - sg[0];
            if (w < 2) { prev = null; return; }
            var inset = Math.min(w * 0.25, 4);
            var x0 = sg[0] + rnd(0.5, inset), x1 = sg[1] - rnd(0.5, inset);
            var A = sc.back(x0, row.y + jit(1.5)), B = sc.back(x1, row.y + jit(1.5));
            if (flip) { var tmp = A; A = B; B = tmp; }
            if (style === 'zig' && prev && si === 0 && dist(prev, A) < gap * 3.2) d += 'L' + f(A[0]) + ' ' + f(A[1]);
            else d += 'M' + f(A[0]) + ' ' + f(A[1]);
            d += 'L' + f(B[0]) + ' ' + f(B[1]);
            len += dist(A, B) + (prev ? dist(prev, A) : 0);
            prev = B;
          });
          flip = style === 'zig' ? !flip : false;
          if (style !== 'zig') prev = null;
        });
        if (d) put(art, 'color', len, '<path d="' + d + '" class="hz p-' + pen + (o.hzCls ? ' ' + o.hzCls : '') + '"%A/>');
      });
      return S;
    };

    // Graphite shading (shadows under things): light hatch in the line colour.
    S.shade = function (pts, o) {
      o = o || {};
      var sc = scanlines(pts, (o.angle == null ? 50 : o.angle) * Math.PI / 180, o.gap || 4), d = '', len = 0;
      sc.rows.forEach(function (row) {
        row.segs.forEach(function (sg) {
          if (sg[1] - sg[0] < 2) return;
          var A = sc.back(sg[0] + rnd(0, 2), row.y + jit(0.5)), B = sc.back(sg[1] - rnd(0, 2), row.y + jit(0.5));
          d += 'M' + f(A[0]) + ' ' + f(A[1]) + 'L' + f(B[0]) + ' ' + f(B[1]); len += dist(A, B);
        });
      });
      if (d) put(art, o.kind || 'color', len, '<path d="' + d + '" class="sh"%A/>');
      return S;
    };

    // ── marks ─────────────────────────────────────────────────────────────
    S.arrow = function (pts, o) {
      o = o || {};
      var item = S.path(pts, o), n = pts.length, a = pts[n - 2], b = pts[n - 1];
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = o.head || 11, spread = 0.5;
      var h1 = [b[0] - L * Math.cos(ang - spread), b[1] - L * Math.sin(ang - spread)];
      var h2 = [b[0] - L * Math.cos(ang + spread), b[1] - L * Math.sin(ang + spread)];
      var d = wobble(h1, b, 0) + wobble(b, h2, 0).replace(/^M[^C]*/, 'M' + f(b[0]) + ' ' + f(b[1]));
      put(art, 'ink', L * 2, '<path d="' + d + '" class="' + cls(o, 'ln') + '"%A/>');
      return item;
    };

    // A loose ring around something, the way you circle a word on paper.
    S.ring = function (cx, cy, rx, ry, o) {
      o = o || {};
      var pts = [], a0 = rnd(-2.6, -2.0), turns = o.turns || 1.18, n = 30;
      for (var i = 0; i <= n * turns; i++) {
        var a = a0 + i / n * Math.PI * 2, k = 1 + i / (n * turns) * 0.07;
        pts.push([cx + rx * k * Math.cos(a) + jit(1), cy + ry * k * Math.sin(a) + jit(1)]);
      }
      return put(art, 'ink', polyLen(pts), '<path d="' + spline(pts) + '" class="' + cls(o, 'ln rg') + '"%A/>');
    };

    S.underline = function (x1, x2, y, o) {
      o = o || {};
      return S.path([[x1, y + jit(1)], [lerp(x1, x2, 0.5), y + jit(1.5)], [x2, y + jit(1)]], Object.assign({ cls: 'ul' }, o));
    };

    // A dot is a filled circle: the draw-on animation moves only the stroke, so the
    // fill would show from second 0 (2026-10-10: robot eyes floating in an empty panel
    // before the robot was drawn). It fades in at its turn instead.
    S.dot = function (cx, cy, r, o) {
      o = o || {};
      var item = put(art, 'ink', r * 4, '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" class="' + cls(o, 'dt') + '"%A/>');
      item.fade = true;
      return item;
    };

    S.star = function (cx, cy, r, o) {
      var pts = [];
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; pts.push([cx + k * Math.cos(a), cy + k * Math.sin(a)]); }
      return S.poly(pts, Object.assign({ over: 0.5, w: 't' }, o || {}));
    };

    // Short strokes radiating from a point: "busy", "surprised", "light".
    S.burst = function (cx, cy, r0, r1, a0, a1, n, o) {
      for (var i = 0; i < n; i++) {
        var a = (a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI / 180;
        S.line(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a), cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), Object.assign({ w: 't', double: false }, o || {}));
      }
      return S;
    };

    // ── handwriting ───────────────────────────────────────────────────────
    // Labels are SVG <text> in the hand font, kept out of the pencil filter so
    // they stay legible. When timed, a label is written left to right.
    S.text = function (x, y, str, o) {
      o = o || {};
      var size = o.size || 18;
      var attrs = ' x="' + f(x) + '" y="' + f(y) + '" font-size="' + size + '"';
      if (o.anchor) attrs += ' text-anchor="' + o.anchor + '"';
      if (o.weight) attrs += ' font-weight="' + o.weight + '"';
      if (o.rotate) attrs += ' transform="rotate(' + o.rotate + ' ' + f(x) + ' ' + f(y) + ')"';
      var c = 'tx' + (o.font ? ' f-' + o.font : '') + (o.ink ? ' i-' + o.ink : '') + (o.cls ? ' ' + o.cls : '');
      var inner = o.lang ? '' : esc(str);
      if (o.lang) inner = '<tspan class="lang-zh">' + esc(o.lang.zh) + '</tspan><tspan class="lang-en">' + esc(o.lang.en) + '</tspan>';
      var len = String(o.lang ? o.lang.zh : str).length * size * 0.9;
      return put(labels, 'text', len, '<text' + attrs + ' class="' + c + '"%A>' + inner + '</text>');
    };

    // Raw markup (already in the library's class vocabulary), optionally timed.
    // o.kind 'tag' = static markup, never timed (tokens, panels drawn by the page's own CSS)
    S.raw = function (markup, o) {
      o = o || {};
      var L = o.layer === 'labels' ? labels : art;
      if (o.kind === 'tag') { L.push({ kind: 'tag', tpl: markup }); return S; }
      return put(L, o.kind || 'ink', o.len || 60, markup.indexOf('%A') >= 0 ? markup : markup.replace(/\/>$/, '%A/>'));
    };

    // Groups: S.group('<g transform=…>', fn) wraps whatever fn draws — in BOTH
    // layers by default, because a node's box goes to the art layer and its label to
    // the labels layer; wrapping only one let labels escape a timed group (2026-10-10:
    // a popped stack frame's text stayed on screen after its box had gone).
    S.group = function (open, fn, layer) {
      var Ls = layer === 'labels' ? [labels] : layer === 'art' ? [art] : [art, labels];
      Ls.forEach(function (L) { L.push({ kind: 'tag', tpl: open }); });
      fn();
      Ls.forEach(function (L) { L.push({ kind: 'tag', tpl: '</g>' }); });
      return S;
    };

    // ── motion ────────────────────────────────────────────────────────────
    // Named keyframes, scoped to this figure so several figures on one page
    // never share a name. Returns the name to use in an animation.
    S.keyframes = function (body) {
      var name = uid + '-k' + (kfN++);
      css.push('@keyframes ' + name + '{' + body + '}');
      return name;
    };

    // Move what fn draws along a list of points (translate, relative to the
    // first point), from `start` for `dur` seconds. o.repeat: 'infinite' or a count.
    S.move = function (pts, start, dur, fn, o) {
      o = o || {}; start = tm(start); dur = tm(dur);
      var total = polyLen(pts) || 1, acc = 0, steps = [];
      for (var i = 0; i < pts.length; i++) {
        if (i) acc += dist(pts[i - 1], pts[i]);
        steps.push((acc / total * 100).toFixed(2) + '%{transform:translate(' + f(pts[i][0] - pts[0][0]) + 'px,' + f(pts[i][1] - pts[0][1]) + 'px)}');
      }
      var name = S.keyframes(steps.join(''));
      var anim = name + ' ' + f(dur) + 's ' + (o.ease || 'linear') + ' ' + f(start) + 's ' + (o.repeat || 1) + ' ' + (o.fill || 'both');
      S.group('<g class="mv" style="animation:' + anim + '">', fn, o.layer);
      end = Math.max(end, o.repeat === 'infinite' ? start + dur : start + dur * (o.repeat || 1));
      return S;
    };

    // Any CSS animation on a group: S.animate('opacity:0} to {opacity:1', 2, 0.6, fn)
    // body is the inside of @keyframes ("from{…}to{…}" or "0%{…}50%{…}").
    S.animate = function (body, start, dur, fn, o) {
      o = o || {}; start = tm(start); dur = tm(dur);
      var name = S.keyframes(body);
      var anim = name + ' ' + f(dur) + 's ' + (o.ease || 'ease-in-out') + ' ' + f(start) + 's ' + (o.repeat || 1) + ' ' + (o.fill || 'both');
      var origin = o.origin ? ';transform-origin:' + o.origin + ';transform-box:' + (o.box || 'view-box') : '';
      S.group('<g class="mv" style="animation:' + anim + origin + '">', fn, o.layer);
      if (o.repeat !== 'infinite') end = Math.max(end, start + dur * (o.repeat || 1));
      return S;
    };

    // Timed key positions: keys = [[t, dx, dy], …] in seconds, offsets relative to
    // where fn draws. Between keys it moves in a straight line; two keys at the same
    // place make it wait. Draw things at their FINAL position and give earlier keys
    // as offsets from there: with animations off, the final state is what shows.
    S.track = function (keys, fn, o) {
      o = o || {};
      var t0 = tm(keys[0][0]), t1 = tm(keys[keys.length - 1][0]), span = Math.max(t1 - t0, 0.01);
      var body = keys.map(function (k) {
        return (Math.round((tm(k[0]) - t0) / span * 10000) / 100) + '%{transform:translate(' + f(k[1]) + 'px,' + f(k[2]) + 'px)' + (k[3] != null ? ';opacity:' + k[3] : '') + '}';
      }).join('');
      var name = S.keyframes(body);
      S.group('<g class="mv" style="animation:' + name + ' ' + f(span) + 's ' + (o.ease || 'linear') + ' ' + f(t0) + 's ' + (o.repeat || 1) + ' both">', fn, o.layer);
      if (o.repeat !== 'infinite') end = Math.max(end, t1);
      return S;
    };

    // Visible only from t0 to t1 (seconds). Things that are gone by the end get the
    // class "tmp", which the stylesheet hides when animations are off — otherwise a
    // counter's ten values would all show on top of each other.
    S.window = function (t0, t1, fn, o) {
      o = o || {};
      t0 = tm(t0); t1 = t1 == null ? null : tm(t1);
      // step-end: each keyframe's value holds until the next keyframe, then jumps
      var total = Math.max(t1 == null ? t0 + 0.01 : t1, 0.01), p0 = Math.round(t0 / total * 10000) / 100, body;
      if (t1 == null) body = '0%{opacity:0}' + p0 + '%{opacity:1}100%{opacity:1}';
      else body = '0%{opacity:0}' + p0 + '%{opacity:1}100%{opacity:0}';
      var name = S.keyframes(body);
      S.group('<g class="mv' + (t1 != null ? ' tmp' : '') + '" style="animation:' + name + ' ' + f(total) + 's step-end 0s 1 both">', fn, o.layer);
      end = Math.max(end, t1 == null ? t0 : t1);
      return S;
    };

    // ── output ────────────────────────────────────────────────────────────
    function render(list) {
      return list.map(function (i) {
        if (i.kind === 'tag') return i.tpl;
        var a = '';
        if (i.d != null) {
          var cl = i.kind === 'text' ? 'aw' : i.kind === 'wash' || i.fade ? 'af' : 'ad';
          // pathLength="1" lets one keyframe (dashoffset 1 -> 0) draw any path, whatever its real length
          a = (cl === 'ad' ? ' pathLength="1"' : '') + ' data-a="' + cl + '" style="--d:' + (Math.round(i.d * 100) / 100) + 's;--t:' + (Math.round(i.t * 100) / 100) + 's"';
        }
        return i.tpl.split('%A').join(a);
      }).join('');
    }
    S.art = function () { return render(art); };
    S.labels = function () { return render(labels); };
    S.css = function () { return css.join(''); };
    Object.defineProperty(S, 'duration', { get: function () { return Math.round(end * 100) / 100; } });
    return S;
  }

  // ── the pencil filter ─────────────────────────────────────────────────
  // Two things happen to every stroke: a slow warp bends it a little (a hand is
  // not a plotter), and a fine grain knocks holes in it (graphite on paper tooth).
  // Put labels outside this filter so they stay sharp. Define it once per page.
  // t.grain 0..1 (0.5 = house style), t.warp in px (2.6).
  function filters(t) {
    t = t || {};
    var g = t.grain == null ? 0.5 : t.grain, w = t.warp == null ? 2.6 : t.warp;
    var slope = (0.6 + g * 2.2).toFixed(2), off = (1.1 + g * 1.04).toFixed(2);
    return '<filter id="g-pencil" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="warp" scale="' + w + '" xChannelSelector="R" yChannelSelector="G" result="w"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="11" result="grain"/>' +
      '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -' + slope + ' ' + off + '" result="mask"/>' +
      '<feComposite in="w" in2="mask" operator="in"/>' +
      '</filter>' +
      '<filter id="g-tooth" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 0.45 0 0 0 0 0.38 0 0 0 0 0.3 0 0 0 0.07 0"/>' +
      '</filter>';
  }

  // CSS variable overrides for the taste values that live in the stylesheet.
  function cssVars(t) {
    t = t || {}; var out = [];
    if (t.lineWeight != null) out.push('--g-lw:' + t.lineWeight);
    if (t.hatchOpacity != null) out.push('--g-hz-o:' + t.hatchOpacity);
    if (t.washOpacity != null) out.push('--g-wash-o:' + t.washOpacity);
    return out.length ? ':root{' + out.join(';') + '}' : '';
  }

  return {
    create: create, filters: filters, cssVars: cssVars, spline: spline, ellipsePts: ellipsePts,
    roundRectPts: roundRectPts, PENCILS: PENCILS, version: '1.0'
  };
});
