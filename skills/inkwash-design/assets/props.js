/* inkwash-design · props.js — things painted often: plants, landscape pieces,
 * figures and animals, and the pieces of a diagram.
 *
 * Every prop draws into a brush (B = Brush.create(…)) at (x, y) with a size s, by
 * converting its own local coordinates (u, v) into page coordinates. Never wrap a
 * prop in an SVG `transform: scale()`: that would scale the brush width too, and a
 * small pine would be painted with a mop (same rule as graphite).
 *
 *   P.bamboo(B, 120, 400, 300)          P.box(B, 40, 40, 200, 90, { label: '缓存' })
 *   P.mountain(B, [[0,300],[180,120],[400,300]], { tone: 'dan' })
 * Props never call B.at(): the figure decides the timing, so a prop can be part of a
 * slow landscape or a quick diagram.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Props = factory();
})(this, function () {
  'use strict';

  // local (u, v) in a box of size s at (x, y) -> page point
  function L(x, y, s) { return function (u, v) { return [x + u * s, y + v * s]; }; }
  function pts(m, list) { return list.map(function (p) { return m(p[0], p[1]); }); }
  function jit(B, v) { return (B.rnd(0, 1) - 0.5) * 2 * v; }

  var P = {};

  // ── plants (四君子 + 松) ─────────────────────────────────────────────
  // bamboo: culm in segments (side tip, a gap at each node), node marks, leaf clusters
  P.bamboo = function (B, x, y, h, o) {
    o = o || {};
    var segs = o.segs || 5, w = o.width || h * 0.045, lean = o.lean || 0.04, tone = o.tone || 'nong', top = y - h;
    for (var i = 0; i < segs; i++) {
      var y0 = y - h * i / segs, y1 = y - h * (i + 1) / segs + 4, x0 = x + lean * (y - y0), x1 = x + lean * (y - y1);
      B.stroke([[x0, y0 - 2], [x0 + (x1 - x0) * 0.5, (y0 + y1) / 2], [x1, y1]], { tone: tone, width: w * (1 - i * 0.06), press: 'ce', load: 0.95 - i * 0.05, wet: 0.3, dry: false });
      B.stroke([[x1 - w * 0.6, y1 + 1], [x1 + w * 0.6, y1 - 1]], { tone: 'jiao', width: w * 0.35, press: 'si', dry: false, wet: 0.2 });
    }
    var leaves = o.leaves == null ? 3 : o.leaves;
    for (var c = 0; c < leaves; c++) {
      var ny = y - h * (0.45 + 0.5 * c / Math.max(1, leaves)), nx = x + lean * (y - ny), side = c % 2 ? 1 : -1, n = 3 + (c % 2);
      for (var k = 0; k < n; k++) {
        var a = (side > 0 ? -0.25 : Math.PI + 0.25) + (k - n / 2) * 0.35 + jit(B, 0.08), len = h * (0.16 + 0.05 * B.rnd(0, 1));
        B.stroke([[nx, ny], [nx + Math.cos(a) * len * 0.5, ny + Math.sin(a) * len * 0.5 + len * 0.08], [nx + Math.cos(a) * len, ny + Math.sin(a) * len + len * 0.22]],
          { tone: k === 1 ? 'jiao' : tone, width: w * 0.9, press: 'leaf', load: 0.9, wet: 0.4, dry: false });
      }
    }
    return { top: [x + lean * h, top] };
  };

  // orchid: long leaves crossing once (破凤眼), a few flowers in pale ink
  P.orchid = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s), tone = o.tone || 'nong';
    var leaves = [[[0, 0], [-0.3, -0.45], [-0.75, -0.62], [-1.05, -0.5]], [[0.02, 0], [0.15, -0.5], [0.05, -0.9], [-0.2, -1.05]],
      [[0.04, 0], [0.35, -0.35], [0.8, -0.5], [1.1, -0.38]], [[0, 0], [-0.1, -0.35], [-0.35, -0.7]], [[0.03, 0], [0.3, -0.2], [0.55, -0.22]]];
    leaves.forEach(function (lf, i) { B.stroke(pts(m, lf), { tone: i < 3 ? tone : 'zhong', width: s * 0.045, press: 'leaf', load: 0.9, wet: 0.35, dry: false }); });
    [[0.28, -0.62], [0.45, -0.7]].forEach(function (c) {
      for (var p = 0; p < 4; p++) { var a = -Math.PI / 2 + (p - 1.5) * 0.7; var c0 = m(c[0], c[1]); B.stroke([c0, [c0[0] + Math.cos(a) * s * 0.11, c0[1] + Math.sin(a) * s * 0.11]], { tone: o.flower || 'dan', width: s * 0.035, press: 'leaf', dry: false, wet: 0.5 }); }
      var cc = m(c[0], c[1]); B.dot(cc[0], cc[1] - s * 0.02, s * 0.018, { tone: 'jiao' });
    });
  };

  // plum: old dark branch (dry brush), young twigs, five-petal blossoms in rouge or ink circles
  P.plum = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s), petal = o.petal || 'yanzhi';
    B.stroke(pts(m, [[0, 0], [0.18, -0.25], [0.12, -0.5], [0.35, -0.72], [0.62, -0.8]]), { tone: 'jiao', width: s * 0.07, press: 'ce', load: 0.75, wet: 0.2 });
    B.stroke(pts(m, [[0.14, -0.38], [0.42, -0.42], [0.72, -0.36]]), { tone: 'nong', width: s * 0.035, press: 'zhong', load: 0.8, wet: 0.2 });
    B.stroke(pts(m, [[0.34, -0.7], [0.3, -0.92], [0.42, -1.05]]), { tone: 'nong', width: s * 0.025, press: 'zhong', load: 0.8, wet: 0.2 });
    var spots = o.flowers || [[0.62, -0.8], [0.72, -0.37], [0.42, -1.04], [0.5, -0.6], [0.25, -0.15], [0.55, -0.42]];
    spots.forEach(function (c, i) {
      var c0 = m(c[0], c[1]), r = s * (0.045 + 0.012 * (i % 2));
      for (var p = 0; p < 5; p++) { var a = p / 5 * Math.PI * 2 + i; B.dot(c0[0] + Math.cos(a) * r * 0.8, c0[1] + Math.sin(a) * r * 0.8, r * 0.9, { tone: petal, angle: a * 57.3, wet: 0.7 }); }
      B.dot(c0[0], c0[1], r * 0.28, { tone: 'tenghuang', wet: 0.2 });
    });
  };

  // chrysanthemum: petals drawn as short strokes around a centre, leaves in wet ink
  P.chrysanthemum = function (B, x, y, s, o) {
    o = o || {}; var cx = x, cy = y - s * 0.75, petal = o.petal || 'tenghuang';
    B.stroke([[x, y], [x + s * 0.05, y - s * 0.4], [cx, cy + s * 0.12]], { tone: 'nong', width: s * 0.03, press: 'zhong', dry: false, wet: 0.2 });
    [[-0.22, -0.3], [0.2, -0.42], [-0.12, -0.55]].forEach(function (l) { B.splash(x + l[0] * s, y + l[1] * s, s * 0.11, { tone: 'zhong', sx: 1.3, sy: 0.8 }); });
    for (var ring = 0; ring < 3; ring++) for (var p = 0; p < 12; p++) {
      var a = p / 12 * Math.PI * 2 + ring * 0.26, r0 = s * 0.04, r1 = s * (0.2 - ring * 0.05);
      B.stroke([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7]], { tone: ring === 2 ? 'zheshi' : petal, width: s * 0.03, press: 'leaf', dry: false, wet: 0.4 });
    }
  };

  // pine: crooked trunk in side tip, bark rings, fan-shaped needle clusters
  P.pine = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[0, 0], [0.06, -0.3], [-0.04, -0.6], [0.1, -0.95]]), { tone: 'nong', width: s * 0.09, press: 'ce', load: 0.7, wet: 0.2 });
    for (var b = 0; b < 4; b++) { var c = m(0.03 + jit(B, 0.03), -0.15 - b * 0.2); B.stroke([[c[0] - s * 0.03, c[1]], [c[0] + s * 0.03, c[1] + s * 0.01]], { tone: 'jiao', width: s * 0.015, press: 'si', dry: false }); }
    var clusters = o.clusters || [[0.1, -0.95], [-0.3, -0.7], [0.35, -0.62], [-0.2, -0.45]];
    clusters.forEach(function (c, i) {
      var c0 = m(c[0], c[1]);
      if (i) B.stroke([m(0.02, c[1] + 0.05), c0], { tone: 'nong', width: s * 0.03, press: 'zhong', dry: false, wet: 0.2 });
      for (var k = 0; k < 9; k++) { var a = Math.PI + k / 8 * Math.PI; B.stroke([c0, [c0[0] + Math.cos(a) * s * 0.12, c0[1] + Math.sin(a) * s * 0.07]], { tone: k % 3 ? 'nong' : 'jiao', width: s * 0.008, press: 'si', dry: false, wet: 0.1 }); }
      B.wash([[c0[0] - s * 0.13, c0[1]], [c0[0], c0[1] - s * 0.08], [c0[0] + s * 0.13, c0[1]]], { tone: o.wash || 'shilv', layers: 2, dir: 'up', opacity: 0.8 });
    });
  };

  // ── landscape ──────────────────────────────────────────────────────────
  // mountain: an outline (list of points, left foot to right foot) as a wash, with an
  // optional ridge line and texture strokes (皴) on the slopes
  P.mountain = function (B, outline, o) {
    o = o || {};
    B.wash(outline, { tone: o.tone || 'dan', layers: o.layers || 3, ridge: o.ridge == null ? true : o.ridge, ridgeWidth: o.ridgeWidth || 4, dir: o.dir || 'down', opacity: o.opacity });
    var cun = o.cun || 0;
    for (var i = 0; i < cun; i++) {
      // texture strokes hang from the upper slopes and stop well above the foot
      var ys = outline.map(function (pp) { return pp[1]; }), foot = Math.max.apply(null, ys), peak = Math.min.apply(null, ys);
      var k = 1 + Math.floor(B.rnd(0, outline.length - 2)), p = outline[k], q = outline[Math.min(outline.length - 1, k + 1)];
      var t = B.rnd(0.2, 0.8), x0 = p[0] + (q[0] - p[0]) * t, y0 = p[1] + (q[1] - p[1]) * t + B.rnd(6, 20);
      var y1 = Math.min(y0 + B.rnd(14, 34), foot - (foot - peak) * 0.25);
      if (y1 - y0 < 8) continue;
      B.stroke([[x0, y0], [x0 + B.rnd(-12, 12), y1]], { tone: o.cunTone || 'zhong', width: B.rnd(2, 4), press: 'ce', load: 0.55, wet: 0.2 });
    }
  };
  // far hills: n soft humps across a width, getting paler with each row back
  P.farHills = function (B, x, y, w, o) {
    o = o || {}; var rows = o.rows || 2, tones = ['dan', 'qing', 'qing'];
    for (var r = rows - 1; r >= 0; r--) {
      var yy = y - r * (o.step || 26), out = [[x, yy + 40]], n = 5 + r;
      for (var i = 0; i <= n; i++) out.push([x + w * i / n, yy - (o.height || 60) * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + r))) * (1 - r * 0.2)]);
      out.push([x + w, yy + 40]);
      B.wash(out, { tone: o.tone || tones[r], layers: 2, ridge: r === 0 ? (o.ridge || 'qing') : false, opacity: 1 - r * 0.25 });
    }
  };
  P.rock = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.5, 0], [-0.45, -0.4], [-0.1, -0.62], [0.3, -0.5], [0.52, -0.1], [0.5, 0]]), { tone: o.tone || 'nong', width: s * 0.07, press: 'ce', load: 0.7, wet: 0.3 });
    B.stroke(pts(m, [[-0.15, -0.55], [-0.05, -0.25], [0.1, -0.05]]), { tone: 'zhong', width: s * 0.04, press: 'ce', load: 0.5, wet: 0.2 });
    B.wash(pts(m, [[-0.48, 0], [-0.4, -0.38], [-0.1, -0.58], [0.28, -0.46], [0.48, 0]]), { tone: o.wash || 'dan', layers: 2, dir: 'up' });
    B.dot(m(-0.3, -0.36)[0], m(-0.3, -0.36)[1], s * 0.04, { tone: 'jiao' });
    B.dot(m(0.2, -0.42)[0], m(0.2, -0.42)[1], s * 0.035, { tone: 'jiao' });
  };
  // water: a few long thin ripple lines, broken, wider apart toward the viewer
  P.water = function (B, x, y, w, o) {
    o = o || {}; var n = o.lines || 4;
    for (var i = 0; i < n; i++) {
      var yy = y + i * (o.gap || 14) * (1 + i * 0.3), x0 = x + B.rnd(0, w * 0.2), x1 = x + w - B.rnd(0, w * 0.25), seg = [];
      for (var k = 0; k <= 6; k++) seg.push([x0 + (x1 - x0) * k / 6, yy + Math.sin(k * 1.3 + i) * 2.4]);
      B.stroke(seg, { tone: o.tone || 'dan', width: o.width || 2.2, press: 'si', load: 0.6, wet: 0.3 });
    }
  };
  P.cloud = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.5, 0], [-0.35, -0.18], [-0.1, -0.12], [0.02, -0.3], [0.28, -0.25], [0.35, -0.05], [0.5, 0]]), { tone: o.tone || 'dan', width: s * 0.025, press: 'si', load: 0.7, wet: 0.5, dry: false });
    B.stroke(pts(m, [[-0.3, 0.02], [0.1, 0.05], [0.4, 0.03]]), { tone: o.tone || 'dan', width: s * 0.02, press: 'si', load: 0.6, wet: 0.5, dry: false });
  };
  P.mist = function (B, x, y, w, h, o) {
    o = o || {};
    B.wash([[x, y + h], [x + w * 0.15, y + h * 0.2], [x + w * 0.5, y], [x + w * 0.85, y + h * 0.25], [x + w, y + h]], { tone: o.tone || 'qing', layers: 2, dir: 'flat', opacity: o.opacity || 0.6, jitter: 20 });
  };
  // a small boat with a fisherman in a straw cloak (江雪)
  P.boat = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.5, -0.06], [-0.2, 0.05], [0.25, 0.05], [0.52, -0.1]]), { tone: 'jiao', width: s * 0.07, press: 'ce', load: 0.9, wet: 0.3, dry: false });
    if (o.figure !== false) {
      B.stroke(pts(m, [[-0.08, -0.05], [-0.04, -0.28]]), { tone: 'nong', width: s * 0.12, press: 'ce', load: 0.9, wet: 0.3, dry: false });   // cloak
      B.stroke(pts(m, [[-0.17, -0.3], [-0.04, -0.4], [0.09, -0.3]]), { tone: 'jiao', width: s * 0.05, press: 'zhong', dry: false, wet: 0.2 }); // hat
      B.stroke(pts(m, [[0.0, -0.18], [0.45, -0.55], [0.8, -0.72]]), { tone: 'zhong', width: s * 0.012, press: 'si', dry: false, wet: 0 });     // rod
      if (o.line !== false) B.stroke(pts(m, [[0.8, -0.72], [0.82, -0.2], [0.84, 0.08]]), { tone: 'dan', width: s * 0.006, press: 'si', dry: false, wet: 0 });
    }
  };
  P.pavilion = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.5, -0.55], [-0.2, -0.7], [0, -0.82], [0.2, -0.7], [0.5, -0.55]]), { tone: 'nong', width: s * 0.06, press: 'zhong', load: 0.9, dry: false });
    B.stroke(pts(m, [[-0.35, -0.6], [-0.35, -0.05]]), { tone: 'nong', width: s * 0.025, press: 'si', dry: false });
    B.stroke(pts(m, [[0.35, -0.6], [0.35, -0.05]]), { tone: 'nong', width: s * 0.025, press: 'si', dry: false });
    B.stroke(pts(m, [[-0.45, 0], [0.45, 0]]), { tone: 'zhong', width: s * 0.03, press: 'ce', dry: false });
    B.stroke(pts(m, [[0, -0.82], [0, -0.95]]), { tone: 'jiao', width: s * 0.02, press: 'si', dry: false });
  };
  P.bridge = function (B, x, y, w, o) {
    o = o || {};
    B.stroke([[x, y], [x + w * 0.25, y - w * 0.12], [x + w * 0.5, y - w * 0.16], [x + w * 0.75, y - w * 0.12], [x + w, y]], { tone: 'nong', width: 6, press: 'zhong', dry: false });
    B.stroke([[x + w * 0.2, y], [x + w * 0.5, y - w * 0.11], [x + w * 0.8, y]], { tone: 'zhong', width: 3, press: 'si', dry: false });
  };
  // a round moon left in paper colour inside a pale wash ring (烘云托月)
  P.moon = function (B, x, y, r, o) {
    o = o || {}; var ring = [], n = 28;
    for (var i = 0; i <= n; i++) { var a = i / n * Math.PI * 2; ring.push([x + Math.cos(a) * r * 2.4, y + Math.sin(a) * r * 1.8]); }
    for (var j = n; j >= 0; j--) { var b = j / n * Math.PI * 2; ring.push([x + Math.cos(b) * r, y + Math.sin(b) * r]); }
    B.wash(ring, { tone: o.tone || 'qing', layers: 2, dir: 'flat', jitter: 6, opacity: o.opacity || 0.9 });
    if (o.outline) B.stroke((function () { var c = []; for (var k = 0; k <= 24; k++) { var t = k / 24 * Math.PI * 2; c.push([x + Math.cos(t) * r, y + Math.sin(t) * r]); } return c; })(), { tone: o.outline, width: 2, press: 'si', dry: false });
  };

  // ── figures and animals (silhouettes: one or two strokes each part) ──
  // swordsman: wide hat, cloak in one wet stroke, sword as a dry fast line. o.facing ±1
  P.swordsman = function (B, x, y, s, o) {
    o = o || {}; var f = o.facing || 1, m = function (u, v) { return [x + u * s * f, y + v * s]; };
    B.stroke(pts(m, [[-0.22, -0.86], [0, -0.95], [0.22, -0.86]]), { tone: 'jiao', width: s * 0.06, press: 'zhong', dry: false, wet: 0.2 });
    B.dot(m(0, -0.82)[0], m(0, -0.82)[1], s * 0.07, { tone: 'jiao', angle: 90 });
    B.stroke(pts(m, [[0, -0.75], [-0.08, -0.45], [-0.22, -0.05]]), { tone: 'jiao', width: s * 0.24, press: 'ce', load: 0.95, wet: 0.6 });
    B.stroke(pts(m, [[0.02, -0.72], [0.12, -0.4], [0.2, 0]]), { tone: 'nong', width: s * 0.12, press: 'ce', load: 0.8, wet: 0.4 });
    B.stroke(pts(m, [[0.06, -0.55], [0.45, -0.78], [0.85, -0.95]]), { tone: 'nong', width: s * 0.025, press: 'zhong', load: 0.45, wet: 0.1 });
  };
  P.scholar = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.dot(m(0, -0.85)[0], m(0, -0.85)[1], s * 0.06, { tone: 'jiao', angle: 90 });
    B.stroke(pts(m, [[0, -0.78], [-0.12, -0.4], [-0.2, 0]]), { tone: 'nong', width: s * 0.2, press: 'ce', load: 0.85, wet: 0.5, dry: false });
    B.stroke(pts(m, [[0.02, -0.74], [0.16, -0.4], [0.2, 0]]), { tone: 'zhong', width: s * 0.1, press: 'ce', load: 0.8, wet: 0.4, dry: false });
    B.stroke(pts(m, [[0.08, -0.6], [0.3, -0.5]]), { tone: 'nong', width: s * 0.04, press: 'zhong', dry: false });
  };
  // a taiji pose: o.pose 0..3 (起势, 单鞭, 云手, 收势) — head, body, arms, legs as strokes
  P.taiji = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s), pose = o.pose || 0;
    var arms = [[[[-0.2, -0.55], [-0.35, -0.5]], [[0.2, -0.55], [0.35, -0.5]]],
      [[[-0.15, -0.6], [-0.55, -0.62]], [[0.15, -0.6], [0.55, -0.66]]],
      [[[-0.1, -0.6], [-0.3, -0.8]], [[0.12, -0.55], [0.32, -0.45]]],
      [[[-0.15, -0.55], [-0.12, -0.35]], [[0.15, -0.55], [0.12, -0.35]]]][pose % 4];
    var legs = [[[-0.05, -0.3], [-0.18, 0]], [[0.05, -0.3], [0.18, 0]]];
    if (pose === 1) legs = [[[-0.05, -0.3], [-0.38, 0]], [[0.05, -0.3], [0.25, -0.02]]];
    B.dot(m(0, -0.85)[0], m(0, -0.85)[1], s * 0.065, { tone: 'jiao', angle: 90 });
    B.stroke(pts(m, [[0, -0.76], [0, -0.32]]), { tone: 'jiao', width: s * 0.13, press: 'ce', dry: false, wet: 0.4 });
    arms.forEach(function (a) { B.stroke(pts(m, a), { tone: 'nong', width: s * 0.05, press: 'zhong', dry: false, wet: 0.3 }); });
    legs.forEach(function (l) { B.stroke(pts(m, l), { tone: 'nong', width: s * 0.07, press: 'ce', dry: false, wet: 0.3 }); });
  };
  P.crane = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.4, -0.05], [-0.1, -0.12], [0.2, -0.05]]), { tone: 'qing', width: s * 0.16, press: 'leaf', dry: false, wet: 0.3 }); // body
    B.stroke(pts(m, [[0.18, -0.08], [0.32, -0.3], [0.42, -0.45]]), { tone: 'nong', width: s * 0.025, press: 'zhong', dry: false });          // neck
    B.dot(m(0.43, -0.47)[0], m(0.43, -0.47)[1], s * 0.03, { tone: 'zhusha', angle: 0 });                                                   // red crown
    B.stroke(pts(m, [[0.44, -0.46], [0.62, -0.42]]), { tone: 'jiao', width: s * 0.012, press: 'si', dry: false });                          // beak
    B.stroke(pts(m, [[-0.35, -0.12], [-0.05, -0.55], [0.3, -0.75]]), { tone: 'jiao', width: s * 0.09, press: 'leaf', load: 0.7, wet: 0.3 }); // wing
    B.stroke(pts(m, [[-0.05, -0.02], [-0.08, 0.35]]), { tone: 'nong', width: s * 0.012, press: 'si', dry: false });
    B.stroke(pts(m, [[0.02, -0.02], [0.04, 0.35]]), { tone: 'nong', width: s * 0.012, press: 'si', dry: false });
  };
  P.fish = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s), t = o.tone || 'nong';
    B.stroke(pts(m, [[-0.4, 0], [-0.1, -0.12], [0.25, -0.02], [0.42, 0.04]]), { tone: t, width: s * 0.22, press: 'leaf', dry: false, wet: 0.5 });
    B.stroke(pts(m, [[0.38, 0.03], [0.55, -0.12]]), { tone: t, width: s * 0.1, press: 'leaf', dry: false, wet: 0.4 });
    B.stroke(pts(m, [[0.38, 0.03], [0.55, 0.16]]), { tone: t, width: s * 0.1, press: 'leaf', dry: false, wet: 0.4 });
    B.dot(m(-0.28, -0.04)[0], m(-0.28, -0.04)[1], s * 0.03, { tone: 'jiao' });
  };
  P.horse = function (B, x, y, s, o) {
    o = o || {}; var m = L(x, y, s);
    B.stroke(pts(m, [[-0.45, -0.45], [-0.1, -0.5], [0.3, -0.45]]), { tone: 'jiao', width: s * 0.2, press: 'ce', load: 0.9, wet: 0.5 });       // body
    B.stroke(pts(m, [[0.28, -0.48], [0.42, -0.72], [0.58, -0.68]]), { tone: 'jiao', width: s * 0.1, press: 'zhong', dry: false, wet: 0.4 }); // neck + head
    B.stroke(pts(m, [[0.3, -0.62], [0.12, -0.75], [-0.05, -0.68]]), { tone: 'nong', width: s * 0.05, press: 'leaf', load: 0.5 });          // mane
    [[[-0.38, -0.4], [-0.5, -0.15], [-0.6, 0]], [[-0.25, -0.4], [-0.2, -0.15], [-0.28, 0]], [[0.2, -0.4], [0.34, -0.18], [0.45, -0.05]], [[0.28, -0.38], [0.2, -0.15], [0.15, 0]]]
      .forEach(function (l) { B.stroke(pts(m, l), { tone: 'nong', width: s * 0.04, press: 'zhong', load: 0.6, wet: 0.2 }); });
    B.stroke(pts(m, [[-0.45, -0.46], [-0.65, -0.35], [-0.72, -0.15]]), { tone: 'nong', width: s * 0.05, press: 'leaf', load: 0.5 });       // tail
  };

  // ── diagram pieces ─────────────────────────────────────────────────────
  // an ink block: four brush strokes (not a rectangle), a pale wash inside, a label.
  // o.label (string or {zh, en}), o.sub, o.tone, o.fill (pigment or tone for the wash),
  // o.size (label px), o.font, o.weight ('heavy' = thicker strokes for "the part being explained")
  P.box = function (B, x, y, w, h, o) {
    o = o || {};
    var t = o.tone || 'nong', bw = o.weight === 'heavy' ? 7 : o.weight === 'light' ? 2.6 : 4.2, j = function () { return B.rnd(-2, 2); };
    if (o.fill !== false) B.wash([[x + 4, y + 5], [x + w - 3, y + 3], [x + w - 4, y + h - 4], [x + 3, y + h - 3]], { tone: o.fill || 'qing', layers: 2, dir: 'flat', jitter: 4, opacity: o.fillOpacity || 0.7 });
    B.stroke([[x - 3, y + j()], [x + w * 0.5, y + j()], [x + w + 4, y + j()]], { tone: t, width: bw, press: 'si', load: 0.9, wet: 0.25, dry: false });
    B.stroke([[x + w + j(), y - 2], [x + w + j(), y + h + 3]], { tone: t, width: bw, press: 'si', load: 0.85, wet: 0.25, dry: false });
    B.stroke([[x + w + 3, y + h + j()], [x + w * 0.5, y + h + j()], [x - 4, y + h + j()]], { tone: t, width: bw, press: 'si', load: 0.8, wet: 0.25, dry: false });
    B.stroke([[x + j(), y + h + 2], [x + j(), y - 3]], { tone: t, width: bw, press: 'si', load: 0.85, wet: 0.25, dry: false });
    var lab = o.label, size = o.size || 20;
    if (lab != null) {
      var cy = y + h / 2 + size * 0.36 - (o.sub ? size * 0.5 : 0);
      B.text(x + w / 2, cy, typeof lab === 'string' ? lab : '', { size: size, anchor: 'middle', font: o.font || 'kai', ink: o.ink || 'jiao', lang: typeof lab === 'object' ? lab : null });
      if (o.sub) B.text(x + w / 2, cy + size * 1.15, typeof o.sub === 'string' ? o.sub : '', { size: Math.round(size * 0.7), anchor: 'middle', font: o.subFont || 'kai', ink: 'zhong', lang: typeof o.sub === 'object' ? o.sub : null });
    }
    return { x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2, l: [x, y + h / 2], r: [x + w, y + h / 2], t: [x + w / 2, y], b: [x + w / 2, y + h] };
  };
  // a brush arrow: one stroke along pts, then a two-stroke head at the end
  P.arrow = function (B, list, o) {
    o = o || {};
    var t = o.tone || 'nong', a = list[list.length - 2], b = list[list.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = o.head || 13;
    B.stroke(list, { tone: t, width: o.width || 4, press: o.press || 'zhong', load: o.load || 0.85, wet: 0.2, dry: o.dry === true });
    B.stroke([[b[0] - Math.cos(ang - 0.5) * hl, b[1] - Math.sin(ang - 0.5) * hl], b], { tone: t, width: (o.width || 4) * 0.85, press: 'si', dry: false, wet: 0.1 });
    B.stroke([[b[0] - Math.cos(ang + 0.5) * hl, b[1] - Math.sin(ang + 0.5) * hl], b], { tone: t, width: (o.width || 4) * 0.85, press: 'si', dry: false, wet: 0.1 });
    if (o.label) {
      var mid = list[Math.floor(list.length / 2)], prev = list[Math.max(0, Math.floor(list.length / 2) - 1)];
      var mx = list.length === 2 ? (a[0] + b[0]) / 2 : mid[0], my = list.length === 2 ? (a[1] + b[1]) / 2 : mid[1];
      B.text(mx + (o.dx || 0), my + (o.dy == null ? -10 : o.dy), typeof o.label === 'string' ? o.label : '', { size: o.size || 15, anchor: 'middle', ink: o.ink || 'zhong', lang: typeof o.label === 'object' ? o.label : null });
      void prev;
    }
  };
  // a decision: a diamond of four strokes with a gamboge wash
  P.decision = function (B, cx, cy, w, h, o) {
    o = o || {};
    var t = o.tone || 'nong', p = [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]];
    B.wash(p, { tone: o.fill || 'tenghuang', layers: 2, dir: 'flat', jitter: 4, opacity: 0.55 });
    for (var i = 0; i < 4; i++) B.stroke([p[i], p[(i + 1) % 4]], { tone: t, width: 4, press: 'si', load: 0.85, dry: false, wet: 0.2 });
    if (o.label) B.text(cx, cy + (o.size || 17) * 0.35, typeof o.label === 'string' ? o.label : '', { size: o.size || 17, anchor: 'middle', ink: 'jiao', lang: typeof o.label === 'object' ? o.label : null });
    return { t: p[0], r: p[1], b: p[2], l: p[3] };
  };
  // a code card: dark card (stays dark in both themes), monospace lines; o.hl = index of a lit line
  P.codeCard = function (B, x, y, w, lines, o) {
    o = o || {};
    var lh = o.lineHeight || 22, h = lines.length * lh + 26, size = o.size || 14;
    B.raw('<rect class="term" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>', { kind: 'tag', layer: 'labels' });
    lines.forEach(function (ln, i) {
      var parts = typeof ln === 'string' ? [[ln, 'term']] : ln;
      var cx = x + 16;
      parts.forEach(function (pp) {
        B.text(cx, y + 26 + i * lh, pp[0], { size: size, font: 'mono', ink: pp[1] || 'term' });
        cx += pp[0].length * size * 0.6;
      });
    });
    return { x: x, y: y, w: w, h: h };
  };
  // a brush circle (圆相): one stroke, open at the end
  P.enso = function (B, cx, cy, r, o) {
    o = o || {}; var c = [], a0 = o.from == null ? -2.2 : o.from, sweep = o.sweep || 5.9;
    for (var i = 0; i <= 28; i++) { var a = a0 + sweep * i / 28; c.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    B.stroke(c, { tone: o.tone || 'jiao', width: o.width || r * 0.16, press: 'zhong', load: 0.98, wet: 0.5 });
  };

  // ── weather (ambient, repeats forever; reduced motion leaves them where they start) ──
  // P.fall(B, { kind: 'snow' | 'rain' | 'petal', n, x0, x1, y0, y1, period }) — snow and
  // petals drift slowly (design rule: ambient motion is slow; rain may be quicker but
  // still slower than graphite's). Each particle starts at a different point of the
  // cycle (negative delay), so the first frame is already full.
  P.fall = function (B, o) {
    o = o || {};
    var kind = o.kind || 'snow', n = o.n || 40, x0 = o.x0 || 0, x1 = o.x1 == null ? 1000 : o.x1, y0 = o.y0 || 0, y1 = o.y1 == null ? 560 : o.y1;
    var H = y1 - y0 + 40, per = o.period || (kind === 'rain' ? 1.6 : kind === 'petal' ? 11 : 9);
    var body = kind === 'rain' ? 'from{transform:translate(0,-30px)}to{transform:translate(-' + Math.round(H * 0.3) + 'px,' + H + 'px)}'
      : kind === 'petal' ? '0%{transform:translate(0,-20px) rotate(0deg)}50%{transform:translate(40px,' + Math.round(H / 2) + 'px) rotate(200deg)}100%{transform:translate(-30px,' + H + 'px) rotate(380deg)}'
        : 'from{transform:translate(0,-20px)}to{transform:translate(-30px,' + H + 'px)}';
    var name = B.keyframes(body), out = '';
    for (var i = 0; i < n; i++) {
      var x = x0 + B.rnd(0, 1) * (x1 - x0), y = y0 + B.rnd(0, 1) * 30 - 20, d = -B.rnd(0, per), sz = B.rnd(0.6, 1.4);
      var shape = kind === 'rain' ? '<path class="rain" d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'l-5 16"/>'
        : kind === 'petal' ? '<ellipse class="k-' + (o.tone || 'yanzhi') + '" fill="currentColor" opacity="0.75" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (5 * sz).toFixed(1) + '" ry="' + (3 * sz).toFixed(1) + '"/>'
          : '<circle class="snow" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (2.4 * sz).toFixed(1) + '"/>';
      out += '<g class="mv amb" style="animation:' + name + ' ' + (per * B.rnd(0.85, 1.25)).toFixed(2) + 's linear ' + d.toFixed(2) + 's infinite;transform-box:fill-box;transform-origin:center">' + shape + '</g>';
    }
    B.raw(out, { kind: 'tag', layer: 'labels' });
  };

  return P;
});
