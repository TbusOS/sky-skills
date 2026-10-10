/* inkwash-design · brush.js — ink and brush on rice paper, drawn as SVG, one stroke
 * at a time.
 *
 * One stroke = a centre line + a pressure curve (how hard the brush is pressed
 * along the way) + how much ink is left in the brush. The wet part is a filled
 * shape (the centre line pushed out to both sides by the pressure); where the ink
 * runs low the brush splits into a bundle of hairs and the paper shows between
 * them (飞白, dry-brush) — the hairs at the edge run dry first, so the white
 * streaks open up INSIDE the stroke and the outline survives. Under the stroke, a
 * softer, blurred copy spreads out after the stroke lands (晕, the bleed).
 *
 * How a stroke appears on time: every timed stroke sits under a mask; the mask is
 * a line wider than the brush that unrolls along the centre line. Dry-brush hairs
 * are already dashes, so the usual trick of animating the dash pattern cannot be
 * used on them (graphite hit the same wall with dashed lines) — the mask can.
 * P0 spike 3: on a GPU, 800 strokes stay at a 17.5 ms frame interval (p95); in
 * software rendering it is the masks that cost. Keep a figure ≤ 800 strokes.
 *
 * Everything returns SVG markup as strings, so the same code runs in the browser
 * and in Node (scripts/build.mjs), and everything is seeded: the same seed gives
 * the same drawing byte for byte — a figure rebuilt next month must not change,
 * and an exported video must give the same frame for the same second.
 *
 *   var B = Brush.create({ seed: 3, id: 'f-pine' });
 *   B.at(0, 2.4, function () {             // seconds: this group draws from 0 to 2.4 s
 *     B.stroke([[40, 200], [160, 190], [300, 210]], { tone: 'nong', width: 14 });
 *     B.wash([[0, 300], [120, 220], [260, 300]], { tone: 'dan' });
 *   });
 *   B.seal(520, 40, 36, '墨', { at: 2.4 });
 *   B.art() / B.labels() / B.defs() / B.css() / B.duration
 *
 * Colours are never written into the markup. Every element gets a class
 * (.k-nong ink tone, .k-huaqing pigment …) and ink.css maps it to a CSS variable,
 * which is how the same drawing works on rice paper and on indigo paper with gold
 * lines (SVG presentation attributes do not accept var()).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Brush = factory();
})(this, function () {
  'use strict';

  var TONES = ['jiao', 'nong', 'zhong', 'dan', 'qing'];                       // 焦 浓 重 淡 清
  var PIGMENTS = ['huaqing', 'zheshi', 'tenghuang', 'yanzhi', 'shiqing', 'shilv', 'zhusha', 'zhubiao', 'baifen'];

  function rng(seed) {                       // mulberry32: same seed, same numbers
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f1(n) { return String(Math.round(n * 10) / 10); }
  function f2(n) { return String(Math.round(n * 100) / 100); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function bbox(p) { var a = [Infinity, Infinity, -Infinity, -Infinity]; p.forEach(function (q) { a[0] = Math.min(a[0], q[0]); a[1] = Math.min(a[1], q[1]); a[2] = Math.max(a[2], q[0]); a[3] = Math.max(a[3], q[1]); }); return a; }
  function polyLen(p) { var s = 0; for (var i = 1; i < p.length; i++) s += dist(p[i - 1], p[i]); return s; }

  function noise1d(r, knots) {               // a smooth random curve on 0..1, values -1..1
    var v = [];
    for (var i = 0; i <= knots; i++) v.push(r() * 2 - 1);
    return function (t) {
      var x = Math.max(0, Math.min(0.999999, t)) * knots, i = Math.floor(x), f = x - i;
      var s = f * f * (3 - 2 * f);
      return v[i] * (1 - s) + v[i + 1] * s;
    };
  }

  // Catmull-Rom through all points, sampled about every `step` px: [{x, y, s}], s = length so far
  function resample(pts, step) {
    if (pts.length === 1) pts = [pts[0], [pts[0][0] + 0.5, pts[0][1] + 0.5]];
    var dense = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < 24; k++) {
        var t = k / 24, t2 = t * t, t3 = t2 * t;
        dense.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    dense.push(pts[pts.length - 1]);
    var out = [{ x: dense[0][0], y: dense[0][1], s: 0 }], acc = 0, last = dense[0];
    for (var j = 1; j < dense.length; j++) {
      var d = Math.hypot(dense[j][0] - last[0], dense[j][1] - last[1]);
      acc += d; last = dense[j];
      if (acc - out[out.length - 1].s >= step || j === dense.length - 1) out.push({ x: dense[j][0], y: dense[j][1], s: acc });
    }
    return out;
  }

  // Pressure curves: position along the stroke (0..1) -> width factor
  var PRESS = {
    // 中锋 centre tip: pressed straight down (the slanted head is cut separately),
    // lifted a little while moving, tapering to a clean point at the exit
    zhong: function (t) {
      if (t < 0.06) return 0.72 + 0.28 * (t / 0.06);
      if (t > 0.8) return 0.04 + 0.71 * Math.cos((t - 0.8) / 0.2 * Math.PI / 2);
      return 0.75 + 0.25 * Math.max(0, 1 - (t - 0.06) / 0.2);
    },
    // 侧锋 side tip: broad and flat, ends blunt (rocks, texture strokes)
    ce: function (t) { return t < 0.1 ? 0.6 + 4 * t : t > 0.85 ? 1 - 3.2 * (t - 0.85) : 1; },
    // 游丝 a hair-thin line of even weight (diagram lines, rain, thread)
    si: function (t) { return t < 0.05 ? 0.5 + 10 * t : t > 0.92 ? 1 - 6 * (t - 0.92) : 1; },
    // 兰叶 orchid leaf: thin - thick - thin
    leaf: function (t) { return 0.08 + 0.92 * Math.pow(Math.sin(t * Math.PI), 1.4); },
    // 点 dot: entered thin, pressed to the widest, lifted round
    dot: function (t) { return t < 0.6 ? 0.25 + 0.75 * Math.sin(t / 0.6 * Math.PI / 2) : 0.2 + 0.8 * Math.cos((t - 0.6) / 0.4 * Math.PI / 2); }
  };

  function create(opts) {
    opts = opts || {};
    var r = rng((opts.seed || 1) * 7919 + 13);
    var uid = opts.id || 'ink', n = 0, kf = 0;
    var taste = opts.taste || {};
    // taste (inkwash taste-profile.js apply().brush): each 0.5 / 1 = house style
    var DEPTH = taste.depth == null ? 0.5 : taste.depth;    // how dark the ink lies
    var WET = taste.wet == null ? 0.5 : taste.wet;          // how far it bleeds
    var DRYK = taste.dry == null ? 0.5 : taste.dry;         // how soon the brush runs dry
    var WEIGHT = taste.weight == null ? 1 : taste.weight;   // brush width
    var PACE = taste.pace || 1;                              // > 1 slower
    function tm(x) { return x * PACE; }
    var art = [], labels = [], defs = [], css = [];
    var scene = null, end = 0;

    function put(layer, kind, len, tpl, extra) {
      var item = { kind: kind, len: len, tpl: tpl, d: null, t: null };
      for (var k in extra || {}) item[k] = extra[k];
      layer.push(item);
      if (scene) scene.items.push(item);
      return item;
    }
    function tone(o, fallback) {
      var t = o.tone || fallback;
      if (TONES.indexOf(t) < 0 && PIGMENTS.indexOf(t) < 0 && t !== 'paper' && t !== 'gold') throw new Error('unknown ink tone or pigment: ' + t);
      return t;
    }

    var B = {};
    B.rnd = function (a, b) { return a + (b - a) * r(); };

    // ── strokes ──────────────────────────────────────────────────────────
    // o: tone, width (px at the widest), press ('zhong' | 'ce' | 'si' | 'leaf' | 'dot'),
    //    load (ink at the start, 0..1), wet (bleed, 0..1), dry (false: no dry-brush),
    //    cls (extra classes), opacity
    B.stroke = function (pts, o) {
      o = o || {};
      var k = n++, width = (o.width || 12) * WEIGHT, press = PRESS[o.press || 'zhong'];
      if (!press) throw new Error('unknown press ' + o.press);
      var load0 = o.load == null ? 0.95 : o.load, wet = (o.wet == null ? 0.5 : o.wet) * (0.4 + 1.2 * WET), tn = tone(o, 'nong');
      var P = resample(pts, o.press === 'dot' ? 1 : 2), L = P[P.length - 1].s || 1;
      var wob = noise1d(r, 6), edgeL = noise1d(r, 18), edgeR = noise1d(r, 18), loadN = noise1d(r, 5);
      var load = function (t) { return load0 - (load0 - 0.12) * Math.pow(t, 1.3) + 0.06 * loadN(t); };
      var W = function (t) { return width * press(t) * (1 + 0.08 * wob(t)); };
      var DRY = 0.3 + 0.24 * DRYK;               // below this much ink the hairs take over
      var tDry = 1;
      if (o.dry !== false && L > 60) for (var q = 0; q < P.length; q++) { if (load(P[q].s / L) < DRY) { tDry = P[q].s / L; break; } }

      function normal(i) {
        var a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        return [-dy / len, dx / len];
      }
      // wet part all the way to the tail; in the dry part it narrows (an ink core stays,
      // the hairs at the edge give the white streaks). Slanted head: for the first few px
      // the left edge steps back and the right edge forward (the mark of a hidden tip).
      var left = [], right = [], HEAD = Math.min(0.08, 14 / L), dryLen = Math.max(0.05, 1 - tDry);
      var wetK = function (t) { return t < tDry ? 1 : Math.max(0.08, 1 - 1.1 * (t - tDry) / dryLen); };
      for (var i = 0; i < P.length; i++) {
        var t = P[i].s / L, nrm = normal(i), w = W(t) / 2 * wetK(t), tan = [nrm[1], -nrm[0]];
        var cut = o.press === 'si' || o.press === 'dot' || o.press === 'leaf' ? 0 : t < HEAD ? (1 - t / HEAD) * W(t) * 0.45 : 0;
        left.push([P[i].x + nrm[0] * (w + 0.7 * edgeL(t)) - tan[0] * cut, P[i].y + nrm[1] * (w + 0.7 * edgeL(t)) - tan[1] * cut]);
        right.push([P[i].x - nrm[0] * (w + 0.7 * edgeR(t)) + tan[0] * cut, P[i].y - nrm[1] * (w + 0.7 * edgeR(t)) + tan[1] * cut]);
      }
      var ring = left.concat(right.reverse());
      var body = 'M' + ring.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z';
      // dry part: a bundle of hairs, each broken where it runs out of ink
      var N = Math.max(8, Math.min(32, Math.round(width / 1.4))), bristles = '';
      if (tDry < 1) {
        for (var b = 0; b < N; b++) {
          var u = (b + 0.5) / N - 0.5 + (r() - 0.5) * 0.03, bias = (r() - 0.5) * 0.2, bn = noise1d(r, 22);
          var seg = [], on = false;
          for (var j = 0; j < P.length; j++) {
            var tj = P[j].s / L;
            if (tj < tDry - 0.02) continue;
            // centre hairs hold more ink than edge hairs: the edge breaks first
            var inkHere = load(tj) + bias + 0.25 * bn(tj) + 0.32 * (1 - Math.abs(u) * 2);
            var nm = normal(j), wj = W(tj), x = P[j].x + nm[0] * u * wj, y = P[j].y + nm[1] * u * wj;
            if (inkHere > DRY + 0.04) { seg.push((on ? 'L' : 'M') + f1(x) + ' ' + f1(y)); on = true; } else on = false;
          }
          bristles += seg.join('');
        }
      }
      // ink density inside the stroke: full where the brush lands, thinner as the ink runs out
      // (a stroke that comes back near its start — a circle — gets no gradient: start and
      // end would sit side by side and the light end would cut across the dark start)
      var gid = uid + '-g' + k, a1 = Math.max(0.35, Math.min(1, 0.45 + 0.6 * load(1)));
      var bb = bbox(P.map(function (p) { return [p.x, p.y]; })), chord = Math.hypot(P[P.length - 1].x - P[0].x, P[P.length - 1].y - P[0].y);
      var looped = chord < 0.35 * Math.max(bb[2] - bb[0], bb[3] - bb[1]) && L > 40;
      if (!looped) defs.push('<linearGradient id="' + gid + '" class="k-' + tn + '" gradientUnits="userSpaceOnUse" x1="' + f1(P[0].x) + '" y1="' + f1(P[0].y) +
        '" x2="' + f1(P[P.length - 1].x) + '" y2="' + f1(P[P.length - 1].y) + '"><stop offset="0" stop-color="currentColor"/>' +
        '<stop offset="0.6" stop-color="currentColor" stop-opacity="' + f2((1 + a1) / 2) + '"/><stop offset="1" stop-color="currentColor" stop-opacity="' + f2(a1) + '"/></linearGradient>');
      var bw = f1(Math.max(0.9, width / N * 1.25));
      var cls = 'k-' + tn + (o.cls ? ' ' + o.cls : ''), op = o.opacity != null ? ' opacity="' + o.opacity + '"' : '';
      var inner = '<path class="ib" fill="' + (looped ? 'currentColor' : 'url(#' + gid + ')') + '" d="' + body + '"/>' + (bristles ? '<path class="id" d="' + bristles + '" stroke-width="' + bw + '"/>' : '');
      var center = 'M' + P.map(function (p) { return f1(p.x) + ' ' + f1(p.y); }).join('L');
      var it = put(art, 'stroke', L, null, { k: k, cls: cls, op: op, inner: inner, body: body, wet: wet, center: center, wMax: width + 10, box: bbox(P.map(function (p) { return [p.x, p.y]; })) });
      it.render = renderStroke;
      return { length: L, dryAt: tDry, hairs: N };
    };

    function renderStroke(i) {
      // a very wet stroke bleeds further: a second, wider filter (ink-bleed)
      var halo = i.wet > 0.02 ? '<path class="ih' + (i.wet > 0.9 ? ' ih-wet' : '') + ' ' + i.cls + '" d="' + i.body + '" style="--w:' + f2(Math.min(1.4, i.wet)) +
        (i.d != null ? ';--d:' + f2(i.d + i.t) + 's;--t:' + f2(0.6 + 0.9 * Math.min(1, i.wet)) + 's" data-a="ab"' : '"') + '/>' : '';
      if (i.d == null) return halo + '<g class="is ' + i.cls + '"' + i.op + '>' + i.inner + '</g>';
      // An explicit mask region: the stroke's own box plus the brush. Left to the default
      // (-10%..120% of the viewport) the region was resolved wrongly when several figures
      // share a page and strokes vanished (2026-10-11); a small region is also cheaper.
      var mid = uid + '-m' + i.k, pad = i.wMax / 2 + 4, bx = i.box;
      defs.push('<mask id="' + mid + '" maskUnits="userSpaceOnUse" x="' + f1(bx[0] - pad) + '" y="' + f1(bx[1] - pad) + '" width="' + f1(bx[2] - bx[0] + 2 * pad) + '" height="' + f1(bx[3] - bx[1] + 2 * pad) + '"><path d="' + i.center + '" pathLength="1" stroke="#fff" stroke-width="' +
        f1(i.wMax) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" data-a="ad" style="--d:' + f2(i.d) + 's;--t:' + f2(i.t) + 's"/></mask>');
      return halo + '<g class="is ' + i.cls + '" mask="url(#' + mid + ')"' + i.op + '>' + i.inner + '</g>';
    }

    // A dot (点): a teardrop pressed in the direction o.angle (deg) — round where the
    // brush presses, pointed where it entered. Drawn as its own shape: a stroke this
    // short has no room for the pressure curve and comes out square.
    B.dot = function (x, y, size, o) {
      o = o || {};
      var k = n++, a = (o.angle == null ? 35 : o.angle) * Math.PI / 180, tn = tone(o, 'jiao'), rr = size * WEIGHT / 2, edge = noise1d(r, 10), ring = [];
      for (var i = 0; i < 28; i++) {
        var t = i / 28 * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
        // longer toward the entry side (c < 0), round on the press side
        var along = c < 0 ? c * (1.35 - 0.15 * Math.abs(sn)) : c * 0.95, side = sn * (c < 0 ? 0.8 + 0.2 * (1 + c) : 1);
        var m = 1 + 0.07 * edge(i / 28);
        ring.push([x + (along * Math.cos(a) - side * Math.sin(a)) * rr * m, y + (along * Math.sin(a) + side * Math.cos(a)) * rr * m]);
      }
      var body = 'M' + ring.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z';
      var center = 'M' + f1(x - Math.cos(a) * rr * 1.4) + ' ' + f1(y - Math.sin(a) * rr * 1.4) + 'L' + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr);
      var wet = (o.wet == null ? 0.6 : o.wet) * (0.4 + 1.2 * WET), cls = 'k-' + tn + (o.cls ? ' ' + o.cls : '');
      var it = put(art, 'stroke', rr * 2.4, null, { k: k, cls: cls, op: '', inner: '<path class="ib dt" d="' + body + '"/>', body: body, wet: wet, center: center, wMax: rr * 2.6 + 6, box: bbox(ring) });
      it.render = renderStroke;
      return B;
    };

    // ── washes ───────────────────────────────────────────────────────────
    // A broad pale area (far mountains, mist, water, a pigment wash): a few
    // see-through layers with ragged edges. o.dir 'down' (default: dark top fading
    // down — a mountain), 'up', 'flat'; o.ridge: a pale line along the top edge.
    B.wash = function (pts, o) {
      o = o || {};
      var tn = tone(o, 'dan'), layers = o.layers || 3, gid = uid + '-w' + (n++);
      var ys = pts.map(function (p) { return p[1]; }), top = Math.min.apply(null, ys), bot = Math.max.apply(null, ys);
      var dir = o.dir || 'down', s0 = dir === 'up' ? 0 : 1, s1 = dir === 'flat' ? 0.85 : dir === 'up' ? 1 : 0;
      var dk = 0.5 + DEPTH;                       // taste: deeper or lighter ink
      defs.push('<linearGradient id="' + gid + '" class="k-' + tn + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + f1(top) + '" x2="0" y2="' + f1(bot) + '">' +
        '<stop offset="0" stop-color="currentColor" stop-opacity="' + f2(Math.min(1, s0 * dk)) + '"/><stop offset="0.55" stop-color="currentColor" stop-opacity="' + f2(Math.min(1, 0.45 * dk + (dir === 'flat' ? 0.3 : 0))) + '"/>' +
        '<stop offset="1" stop-color="currentColor" stop-opacity="' + f2(Math.min(1, s1 * dk)) + '"/></linearGradient>');
      var shapes = '';
      for (var l = 0; l < layers; l++) {
        var jit = pts.map(function (p) { return [p[0] + (r() - 0.5) * (o.jitter || 10), p[1] + (r() - 0.5) * (o.jitter || 10) * 0.8]; });
        shapes += '<path class="iw k-' + tn + '" fill="url(#' + gid + ')" d="M' + jit.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z"' +
          (o.opacity != null ? ' style="--wo:' + o.opacity + '"' : '') + '%A/>';
      }
      put(art, 'wash', polyLen(pts), shapes);
      if (o.ridge) {
        var ridge = pts.filter(function (p) { return p[1] < bot - 2; });
        if (ridge.length > 1) B.stroke(ridge, { width: o.ridgeWidth || 5, press: 'leaf', load: 0.7, tone: o.ridge === true ? tn : o.ridge, wet: 0.8, dry: false });
      }
      return B;
    };

    // 泼墨 splash: an irregular blot of ink that spreads (launch reveals, storm clouds)
    B.splash = function (cx, cy, rad, o) {
      o = o || {};
      var pts = [], m = 22, nz = noise1d(r, 8);
      for (var i = 0; i < m; i++) { var a = i / m * Math.PI * 2, rr = rad * (0.72 + 0.38 * nz(i / m) + (r() - 0.5) * 0.12); pts.push([cx + Math.cos(a) * rr * (o.sx || 1), cy + Math.sin(a) * rr * (o.sy || 1)]); }
      return B.wash(pts, { tone: o.tone || 'nong', layers: o.layers || 4, dir: 'flat', jitter: rad * 0.12, opacity: o.opacity });
    };

    // ── seal and words ───────────────────────────────────────────────────
    // Seal (印): square or round, 朱文 (red characters) or 白文 (red ground, characters left
    // in paper colour); its edge is eaten away by the ink-erode filter. The full stop of
    // a picture. o.kind 'zhu' | 'bai', o.round, o.at (seconds; default: when the
    // current group ends), o.font
    B.seal = function (x, y, size, text, o) {
      o = o || {};
      var bai = o.kind === 'bai', chars = String(text), cols = chars.length > 2 ? 2 : 1, rows = Math.ceil(chars.length / cols);
      var shape = o.round ? '<circle cx="' + f1(size / 2) + '" cy="' + f1(size / 2) + '" r="' + f1(size / 2 - size / 18) + '" stroke-width="' + f1(size / 9) + '"/>'
        : '<rect x="0" y="0" width="' + size + '" height="' + size + '" rx="2" stroke-width="' + f1(size / 9) + '"/>';
      var fs = size * (chars.length === 1 ? 0.62 : 0.4), txt = '';
      for (var c = 0; c < chars.length; c++) {
        // seal text reads top-to-bottom, right column first
        var col = cols - 1 - Math.floor(c / rows), row = c % rows;
        var cx = size * (cols === 1 ? 0.5 : 0.27 + 0.46 * col), cy = size * (rows === 1 ? 0.5 : 0.3 + 0.42 * row) + fs * 0.36;
        txt += '<text x="' + f1(cx) + '" y="' + f1(cy) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + esc(chars[c]) + '</text>';
      }
      var it = put(labels, 'seal', 30, '<g class="sl' + (bai ? ' sl-bai' : '') + '" transform="translate(' + f1(x) + ' ' + f1(y) + ')"%A>' +
        '<g filter="url(#ink-erode)">' + shape + txt + '</g></g>');
      if (o.at != null) { it.fixed = tm(o.at); }
      return B;
    };

    // Words. o.font: 'brush' (马善政楷书, titles) | 'xing' (志莽行书, big launch words) |
    // 'long' (龙藏体, poems, subtitles) | 'kai' (霞鹜文楷, labels) | 'song' (body) | 'mono';
    // o.size, o.anchor, o.vertical (top to bottom), o.lang {zh, en}, o.ink (tone of the words),
    // o.weight. Words in a picture are always code, never bitmap (R-F34).
    B.text = function (x, y, str, o) {
      o = o || {};
      var size = o.size || 18, attrs = ' x="' + f1(x) + '" y="' + f1(y) + '" font-size="' + size + '"';
      if (o.anchor) attrs += ' text-anchor="' + o.anchor + '"';
      if (o.weight) attrs += ' font-weight="' + o.weight + '"';
      if (o.spacing) attrs += ' letter-spacing="' + o.spacing + '"';
      var c = 'tx f-' + (o.font || 'kai') + ' t-' + (o.ink || 'nong') + (o.vertical ? ' vt' : '') + (o.cls ? ' ' + o.cls : '');
      var inner = o.lang ? '<tspan class="lang-zh">' + esc(o.lang.zh) + '</tspan><tspan class="lang-en">' + esc(o.lang.en) + '</tspan>' : esc(str);
      var len = String(o.lang ? o.lang.zh : str).length * size * 1.1;
      put(labels, 'text', len, '<text' + attrs + ' class="' + c + '"%A>' + inner + '</text>', { vertical: !!o.vertical });
      return B;
    };

    // ── timeline ─────────────────────────────────────────────────────────
    // Everything drawn inside fn appears between start and start + dur seconds.
    // One brush: strokes and words one after another, each taking time in proportion
    // to its length (a short dot still gets 0.12 s); washes come after the lines
    // (outline first, then colour — o.inkShare, default 2/3 of the time when there
    // are washes); a seal lands when the group ends. Bleeds start as each stroke lands.
    B.at = function (start, dur, fn, o) {
      o = o || {}; start = tm(start); dur = tm(dur);
      if (scene) throw new Error('B.at() inside B.at()');
      scene = { items: [] };
      fn();
      var items = scene.items; scene = null;
      var lines = items.filter(function (i) { return i.kind === 'stroke' || i.kind === 'text'; });
      var washes = items.filter(function (i) { return i.kind === 'wash'; });
      var seals = items.filter(function (i) { return i.kind === 'seal'; });
      var lineDur = washes.length ? dur * (o.inkShare || 2 / 3) : dur;
      if (o.order === 'wash-first' && washes.length) {          // landscapes: lay the wash, then draw over it
        lay(washes, start, dur - lineDur, true); lay(lines, start + dur - lineDur, lineDur);
      } else { lay(lines, start, lineDur); lay(washes, start + lineDur, dur - lineDur, true); }
      seals.forEach(function (s) { s.d = s.fixed != null ? s.fixed : start + dur; s.t = 0.4; end = Math.max(end, s.d + s.t); });
      end = Math.max(end, start + dur);
      lines.forEach(function (i) { if (i.kind === 'stroke') end = Math.max(end, i.d + i.t + 0.6 + 0.9 * Math.min(1, i.wet)); });
      return B;
    };
    function lay(list, t0, total, overlap) {
      if (!list.length) return;
      var sum = list.reduce(function (s, i) { return s + Math.max(Math.sqrt(i.len), 1); }, 0), t = t0;
      list.forEach(function (i) {
        var len = total * Math.max(Math.sqrt(i.len), 1) / sum;
        i.d = t; i.t = Math.max(len * (overlap ? 1.8 : 1), i.kind === 'text' ? 0.35 : 0.12);
        t += len;
      });
    }

    // Raw markup in this library's class vocabulary. '%A' marks where timing goes.
    // o.kind 'tag' = static (never timed); o.layer 'labels' puts it above the ink.
    B.raw = function (markup, o) {
      o = o || {};
      var Lr = o.layer === 'labels' ? labels : art;
      if (o.kind === 'tag') { Lr.push({ kind: 'tag', tpl: markup }); return B; }
      put(Lr, o.kind || 'wash', o.len || 60, markup.indexOf('%A') >= 0 ? markup : markup.replace(/\/>$/, '%A/>'));
      return B;
    };
    // A group around whatever fn draws, in both layers (a node's box is ink, its label is words).
    B.group = function (open, fn, layer) {
      var Ls = layer === 'labels' ? [labels] : layer === 'art' ? [art] : [art, labels];
      Ls.forEach(function (Lg) { Lg.push({ kind: 'tag', tpl: open }); });
      fn();
      Ls.forEach(function (Lg) { Lg.push({ kind: 'tag', tpl: '</g>' }); });
      return B;
    };
    B.def = function (markup) { defs.push(markup); return B; };
    B.id = function (name) { return uid + '-' + name; };
    B.keyframes = function (body) { var name = uid + '-k' + (kf++); css.push('@keyframes ' + name + '{' + body + '}'); return name; };

    // Motion helpers: the same contract as graphite's sketch.js. Draw things at their
    // FINAL place; earlier keys are offsets from there, so with animation off the
    // finished picture is what shows.
    B.track = function (keys, fn, o) {
      o = o || {};
      var t0 = tm(keys[0][0]), t1 = tm(keys[keys.length - 1][0]), span = Math.max(t1 - t0, 0.01);
      var body = keys.map(function (k) {
        return (Math.round((tm(k[0]) - t0) / span * 10000) / 100) + '%{transform:translate(' + f1(k[1]) + 'px,' + f1(k[2]) + 'px)' + (k[3] != null ? ';opacity:' + k[3] : '') + '}';
      }).join('');
      var name = B.keyframes(body);
      B.group('<g class="mv" style="animation:' + name + ' ' + f2(span) + 's ' + (o.ease || 'linear') + ' ' + f2(t0) + 's ' + (o.repeat || 1) + ' both">', fn, o.layer);
      if (o.repeat !== 'infinite') end = Math.max(end, t1);
      return B;
    };
    B.follow = function (keys, fn, o) {
      var last = keys[keys.length - 1], x = last[1], y = last[2];
      return B.track(keys.map(function (k) { return [k[0], k[1] - x, k[2] - y, k[3]]; }), function () { fn(x, y); }, o);
    };
    // Any keyframes on a group. o.repeat 'infinite' for ambient motion (mist, water):
    // design rule — ambient cycles are ≥ 6 s; rain, snow and petals may be quicker.
    B.animate = function (body, start, dur, fn, o) {
      o = o || {}; start = tm(start); dur = tm(dur);
      var name = B.keyframes(body);
      var origin = o.origin ? ';transform-origin:' + o.origin + ';transform-box:' + (o.box || 'view-box') : '';
      B.group('<g class="mv' + (o.repeat === 'infinite' ? ' amb' : '') + '" style="animation:' + name + ' ' + f2(dur) + 's ' + (o.ease || 'ease-in-out') + ' ' + f2(start) + 's ' + (o.repeat || 1) + ' ' + (o.fill || 'both') + origin + '">', fn, o.layer);
      if (o.repeat !== 'infinite') end = Math.max(end, start + dur * (o.repeat || 1));
      return B;
    };
    // Visible only from t0 to t1. Gone-by-the-end states get "tmp" (hidden with animation off).
    B.window = function (t0, t1, fn, o) {
      o = o || {};
      t0 = tm(t0); t1 = t1 == null ? null : tm(t1);
      var total = Math.max(t1 == null ? t0 + 0.01 : t1, 0.01), p0 = Math.round(t0 / total * 10000) / 100;
      var body = t1 == null ? '0%{opacity:0}' + p0 + '%{opacity:1}100%{opacity:1}' : '0%{opacity:0}' + p0 + '%{opacity:1}100%{opacity:0}';
      var name = B.keyframes(body);
      B.group('<g class="mv' + (t1 != null ? ' tmp' : '') + '" style="animation:' + name + ' ' + f2(total) + 's step-end 0s 1 both">', fn, o.layer);
      end = Math.max(end, t1 == null ? t0 : t1);
      return B;
    };

    // ── output ───────────────────────────────────────────────────────────
    function render(list) {
      return list.map(function (i) {
        if (i.kind === 'tag') return i.tpl;
        if (i.render) return i.render(i);
        var a = '';
        if (i.d != null) {
          var cl = i.kind === 'text' ? (i.vertical ? 'awv' : 'aw') : i.kind === 'seal' ? 'as' : 'af';
          a = ' data-a="' + cl + '" style="--d:' + f2(i.d) + 's;--t:' + f2(i.t) + 's"';
        }
        return i.tpl.split('%A').join(a);
      }).join('');
    }
    var cache = null;
    function out() { if (!cache) cache = { art: render(art), labels: render(labels) }; return cache; }
    B.art = function () { return out().art; };
    B.labels = function () { return out().labels; };
    B.defs = function () { out(); return defs.join(''); };
    B.css = function () { return css.join(''); };
    B.count = function () { return art.filter(function (i) { return i.kind === 'stroke'; }).length; };
    Object.defineProperty(B, 'duration', { get: function () { return Math.round(end * 100) / 100; } });
    return B;
  }

  // ── page-level filters (define once per page; standalone SVGs carry their own) ──
  //  ink-rough  the ink group's edge: a little paper drag on every stroke
  //  ink-halo   the bleed under a stroke and the edge of a wash
  //  ink-bleed  a wider bleed for very wet strokes (wet > 0.9)
  //  ink-fiber  rice-paper fibres over the paper
  //  ink-erode  bites out of a seal's edge
  // P0 spike 3: dropping ink-rough doubled software-rendering speed but the edges
  // looked like vector art and dry-brush became stiff dashes — it stays.
  function filters() {
    return '<filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>' +
      '<filter id="ink-halo" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" result="d"/><feGaussianBlur in="d" stdDeviation="2.4"/></filter>' +
 '<filter id="ink-bleed" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="16" result="d"/><feGaussianBlur in="d" stdDeviation="5.5"/></filter>' +
      '<filter id="ink-fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="2" seed="9" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.38  0 0 0 0.16 0"/></filter>' +
      '<filter id="ink-erode" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="12" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.1" result="holes"/>' +
      '<feComposite in="SourceGraphic" in2="holes" operator="in"/></filter>';
  }

  return { create: create, filters: filters, rng: rng, resample: resample, PRESS: PRESS, TONES: TONES, PIGMENTS: PIGMENTS, version: '1.0' };
});
