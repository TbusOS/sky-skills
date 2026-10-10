/* graphite-design · props.js — characters and objects drawn with sketch.js.
 *
 * Every prop is   Props.<name>(S, x, y, scale, options)
 * where (x, y) is the prop's anchor (usually where it stands on the floor, or its
 * centre) and the coordinates are worked out here instead of with an SVG
 * transform — scaling a <g> would also scale the pencil width and the gap between
 * coloured-pencil strokes, and a small robot would look drawn with a thinner pencil.
 *
 * These are starting points, not a fixed cast. Copy one and change it: a
 * different hat, another pose, a new object built from the same five primitives
 * (line, path, loop/ellipse, poly/rect, fill). Friendly and round beats accurate.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Props = factory();
})(this, function () {
  'use strict';

  // map local coordinates (u, v) around anchor (x, y) at scale s
  function M(x, y, s, flip) {
    var k = flip ? -1 : 1;
    function p(u, v) { return [x + u * s * k, y + v * s]; }
    p.s = s;
    p.pts = function (list) { return list.map(function (q) { return p(q[0], q[1]); }); };
    p.ell = function (u, v, ru, rv, rot, n) {
      var out = [], a0 = 0; n = n || Math.max(10, Math.round((ru + rv) * s / 7));
      var c = Math.cos(rot || 0), sn = Math.sin(rot || 0);
      for (var i = 0; i < n; i++) {
        var a = a0 + i / n * Math.PI * 2, ex = ru * Math.cos(a), ey = rv * Math.sin(a);
        out.push(p(u + ex * c - ey * sn, v + ex * sn + ey * c));
      }
      return out;
    };
    p.rr = function (u, v, w, h, r) {
      // built in local space, then mapped (so a flipped prop keeps its rounded corners)
      var k2 = 4, loc = []; r = Math.min(r, w / 2, h / 2);
      function arcL(cx, cy, a0) { for (var i = 0; i <= k2; i++) { var a = a0 + i / k2 * Math.PI / 2; loc.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }
      arcL(u + w - r, v + r, -Math.PI / 2); arcL(u + w - r, v + h - r, 0); arcL(u + r, v + h - r, Math.PI / 2); arcL(u + r, v + r, Math.PI);
      return p.pts(loc);
    };
    return p;
  }

  var P = {};
  function Sketch_roundRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    var out = [], k = 4;
    function arc(cx, cy, a0) { for (var i = 0; i <= k; i++) { var a = a0 + i / k * Math.PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return out;
  }

  // ── characters ──────────────────────────────────────────────────────────
  // Small round robot. Anchor: between the feet. ~100 × 175 at scale 1.
  // o.pose: 'stand' | 'wave' | 'type' | 'think' | 'point' | 'cheer'; o.glow: orange light on the front
  P.robot = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1, o.flip), pose = o.pose || 'stand';
    // legs and feet
    S.loop(p.rr(-22, -34, 14, 26, 5), { fill: 'grey', style: 'wash' });
    S.loop(p.rr(8, -34, 14, 26, 5), { fill: 'grey', style: 'wash' });
    S.loop(p.ell(-16, -4, 14, 6), { w: 't' });
    S.loop(p.ell(16, -4, 14, 6), { w: 't' });
    // arms behind/beside the body
    var lArm = [[-34, -100], [-48, -78], [-52, -56]], lHand = [-52, -52];
    var rArm = [[34, -100], [48, -78], [52, -56]], rHand = [52, -52];
    if (pose === 'wave' || pose === 'cheer') { rArm = [[34, -104], [54, -122], [60, -146]]; rHand = [60, -150]; }
    if (pose === 'cheer') { lArm = [[-34, -104], [-54, -122], [-60, -146]]; lHand = [-60, -150]; }
    if (pose === 'type') { lArm = [[-30, -98], [-40, -80], [-30, -66]]; lHand = [-26, -64]; rArm = [[30, -98], [44, -80], [36, -66]]; rHand = [32, -64]; }
    if (pose === 'point') { rArm = [[34, -100], [58, -104], [80, -108]]; rHand = [84, -108]; }
    if (pose === 'think') { rArm = [[34, -100], [40, -122], [20, -136]]; rHand = [16, -138]; }
    S.path(p.pts(lArm), { w: 'b' }); S.loop(p.ell(lHand[0], lHand[1], 7, 7), { w: 't', fill: 'grey', style: 'wash' });
    S.path(p.pts(rArm), { w: 'b' }); S.loop(p.ell(rHand[0], rHand[1], 7, 7), { w: 't', fill: 'grey', style: 'wash' });
    // body
    // light grey body: a wash, plus graphite shading down the right side only
    var body = p.rr(-36, -112, 72, 80, 20);
    S.loop(body, { fill: 'grey', style: 'wash' });
    S.shade(p.pts([[16, -108], [34, -100], [36, -46], [28, -34], [14, -34]]), { gap: 3.6 });
    S.loop(p.rr(-18, -96, 36, 26, 8), { w: 't' });
    S.dot.apply(null, p(-7, -83).concat([3.2, { pen: o.glow === false ? 'grey' : 'orange' }]));
    S.dot.apply(null, p(4, -83).concat([2.4, { pen: 'green' }]));
    // neck + head
    S.line.apply(null, p(8, -112).concat(p(8, -118), [{ w: 't' }]));
    S.line.apply(null, p(-8, -112).concat(p(-8, -118), [{ w: 't' }]));
    S.loop(p.ell(0, -148, 40, 30), { fill: 'grey', style: 'wash' });
    S.shade(p.pts([[22, -170], [36, -160], [38, -140], [30, -126], [20, -122]]), { gap: 3.6 });
    S.loop(p.rr(-26, -164, 52, 34, 13), { w: 't', fill: 'paper', style: 'wash', washCls: 'solid' });
    // face
    if (o.eyes === 'closed') {
      S.path(p.pts([[-15, -148], [-10, -151], [-5, -148]]), { w: 't' });
      S.path(p.pts([[5, -148], [10, -151], [15, -148]]), { w: 't' });
    } else {
      S.dot.apply(null, p(-10, -149).concat([3.6]));
      S.dot.apply(null, p(10, -149).concat([3.6]));
    }
    S.path(p.pts([[-6, -139], [0, -136], [6, -139]]), { w: 't' });
    S.loop(p.ell(-18, -138, 4, 2.5), { w: 'h', fill: 'pink', style: 'wash', washCls: 'half', double: false });
    S.loop(p.ell(18, -138, 4, 2.5), { w: 'h', fill: 'pink', style: 'wash', washCls: 'half', double: false });
    // ears and antenna
    S.loop(p.ell(-41, -146, 5, 8), { w: 't', fill: 'orange', style: 'wash', washCls: 'half' });
    S.loop(p.ell(41, -146, 5, 8), { w: 't', fill: 'orange', style: 'wash', washCls: 'half' });
    S.path(p.pts([[0, -176], [2, -186], [0, -196]]), { w: 't' });
    S.loop(p.ell(0, -201, 5.5, 5.5), { w: 't', fill: 'orange', style: 'zig', gap: 3 });
    return S;
  };

  // A person, drawn simply: round head, a few hair strokes, closed-smile eyes.
  // Anchor: between the feet. ~90 × 190 at scale 1.
  // o.pose (arms): 'stand' | 'wave' | 'cheer' | 'think' | 'point' | 'walk';
  // o.legs: 'stand' | 'walk' | 'sit' (sitting: place the anchor ~76·scale below the seat,
  // the thighs go forward to the right, the feet land at the anchor); o.shirt / o.pants: pencil names;
  // o.hair: 'short' | 'bob' | 'pony'; o.eyes: 'open' | 'happy' | 'closed'
  P.person = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1, o.flip), pose = o.pose || 'stand';
    var shirt = o.shirt || 'blue', pants = o.pants || 'grey';
    // legs
    var legs = o.legs || (pose === 'walk' ? 'walk' : 'stand');
    var lLeg = [[-10, -76], [-11, -40], [-12, -8]], rLeg = [[10, -76], [11, -40], [12, -8]];
    if (legs === 'walk') { lLeg = [[-8, -76], [-20, -42], [-30, -10]]; rLeg = [[8, -76], [14, -42], [22, -8]]; }
    if (legs === 'sit') { lLeg = [[-8, -78], [24, -76], [28, -10]]; rLeg = [[8, -80], [38, -78], [44, -10]]; }
    S.path(p.pts(lLeg), { w: 'b' }); S.path(p.pts(rLeg), { w: 'b' });
    var lf = lLeg[2], rf = rLeg[2];
    S.loop(p.ell(lf[0] - 4, lf[1] + 3, 10, 5), { w: 't', fill: 'line', style: 'wash', washCls: 'half' });
    S.loop(p.ell(rf[0] + 4, rf[1] + 3, 10, 5), { w: 't', fill: 'line', style: 'wash', washCls: 'half' });
    // shorts / skirt
    S.poly(p.pts([[-21, -102], [21, -102], [25, -74], [3, -74], [0, -86], [-3, -74], [-25, -74]]), { fill: pants });
    // arms
    var la = [[-20, -144], [-32, -120], [-34, -98]], ra = [[20, -144], [32, -120], [34, -98]];
    var lh = la[2], rh = ra[2];
    if (pose === 'wave') { ra = [[24, -144], [44, -160], [50, -184]]; rh = ra[2]; }
    if (pose === 'cheer') { ra = [[24, -144], [44, -160], [50, -184]]; la = [[-24, -144], [-44, -160], [-50, -184]]; rh = ra[2]; lh = la[2]; }
    if (pose === 'point') { ra = [[24, -142], [50, -146], [74, -150]]; rh = ra[2]; }
    if (pose === 'think') { ra = [[24, -142], [30, -158], [14, -166]]; rh = ra[2]; }
    S.path(p.pts(la), { w: 'b' }); S.path(p.pts(ra), { w: 'b' });
    S.loop(p.ell(lh[0], lh[1], 6, 6), { w: 't' }); S.loop(p.ell(rh[0], rh[1], 6, 6), { w: 't' });
    // shirt
    S.loop(p.pts([[-20, -148], [-8, -153], [8, -153], [20, -148], [26, -128], [23, -100], [-23, -100], [-26, -128]]), { fill: shirt, closeOver: 0.05 });
    // head
    var hy = -176;
    S.loop(p.ell(0, hy, 22, 23), { fill: 'skin', style: 'wash' });
    var hair = o.hair || 'short';
    if (hair === 'bob') S.loop(p.pts([[-24, hy + 8], [-26, hy - 10], [-16, hy - 24], [0, hy - 28], [16, hy - 24], [26, hy - 10], [24, hy + 8], [16, hy - 8], [4, hy - 14], [-10, hy - 10], [-18, hy - 2]]), { fill: 'hair', style: 'hatch', gap: 3, angle: 70, hzCls: 'fine' });
    else S.loop(p.pts([[-22, hy - 2], [-20, hy - 18], [-8, hy - 27], [8, hy - 26], [20, hy - 17], [23, hy - 4], [14, hy - 12], [2, hy - 15], [-10, hy - 12]]), { fill: 'hair', style: 'hatch', gap: 3, angle: 70, hzCls: 'fine' });
    if (hair === 'pony') { S.loop(p.ell(27, hy - 8, 8, 11, 0.4), { w: 't', fill: 'hair', style: 'hatch', gap: 3, angle: 60, hzCls: 'fine' }); S.loop(p.ell(21, hy - 13, 3, 3), { w: 't', fill: 'red', style: 'wash', washCls: 'half' }); }
    var eyes = o.eyes || 'happy';
    if (eyes === 'open') { S.dot.apply(null, p(-8, hy + 1).concat([2.6, { cls: 'fc' }])); S.dot.apply(null, p(8, hy + 1).concat([2.6, { cls: 'fc' }])); }
    else if (eyes === 'closed') { S.path(p.pts([[-12, hy + 2], [-8, hy + 4], [-4, hy + 2]]), { w: 't', cls: 'fc' }); S.path(p.pts([[4, hy + 2], [8, hy + 4], [12, hy + 2]]), { w: 't', cls: 'fc' }); }
    else { S.path(p.pts([[-12, hy + 3], [-8, hy - 1], [-4, hy + 3]]), { w: 't', cls: 'fc' }); S.path(p.pts([[4, hy + 3], [8, hy - 1], [12, hy + 3]]), { w: 't', cls: 'fc' }); }
    if (o.mouth === 'o') S.loop(p.ell(0, hy + 12, 3.5, 4), { w: 't', fill: 'red', style: 'wash', washCls: 'half' });
    else S.path(p.pts([[-6, hy + 10], [0, hy + 14], [6, hy + 10]]), { w: 't', cls: 'fc' });
    S.loop(p.ell(-14, hy + 9, 4, 2.4), { w: 'h', fill: 'pink', style: 'wash', washCls: 'half', double: false });
    S.loop(p.ell(14, hy + 9, 4, 2.4), { w: 'h', fill: 'pink', style: 'wash', washCls: 'half', double: false });
    return S;
  };

  // ── furniture and objects ───────────────────────────────────────────────
  // Desk. Anchor: floor, centre. o.w width (default 300), o.h desk height (110).
  P.desk = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), w = o.w || 300, h = o.h || 110;
    S.poly(p.pts([[-w / 2, -h], [w / 2, -h], [w / 2, -h + 14], [-w / 2, -h + 14]]), { fill: 'wood', gap: 4.5, angle: -8 });
    S.line.apply(null, p(-w / 2 + 14, -h + 14).concat(p(-w / 2 + 18, 0)));
    S.line.apply(null, p(w / 2 - 14, -h + 14).concat(p(w / 2 - 18, 0)));
    if (o.drawer !== false) { S.poly(p.pts([[w / 2 - 92, -h + 14], [w / 2 - 22, -h + 14], [w / 2 - 22, -h + 52], [w / 2 - 92, -h + 52]]), { w: 't', fill: 'wood', style: 'wash' }); S.line.apply(null, p(w / 2 - 66, -h + 33).concat(p(w / 2 - 48, -h + 33), [{ w: 't' }])); }
    return S;
  };

  // Monitor standing on a surface. Anchor: bottom of the stand. o.screen: pencil for the lit screen.
  // o.w (150) o.h (100). Returns the screen box in o.out = {x,y,w,h} so a page can draw on top.
  P.monitor = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), w = o.w || 150, h = o.h || 100;
    S.poly(p.pts([[-26, 0], [26, 0], [20, -8], [-20, -8]]), { w: 't' });
    S.line.apply(null, p(-6, -8).concat(p(-6, -22))); S.line.apply(null, p(6, -8).concat(p(6, -22)));
    S.loop(p.rr(-w / 2, -22 - h, w, h, 6), { fill: 'line', style: 'wash' });
    var sc = p.rr(-w / 2 + 8, -22 - h + 8, w - 16, h - 16, 3);
    S.loop(sc, { w: 't', fill: o.screen || 'orange', gap: 4, angle: -20 });
    if (o.out) { var a = p(-w / 2 + 8, -22 - h + 8); o.out.x = a[0]; o.out.y = a[1]; o.out.w = (w - 16) * p.s; o.out.h = (h - 16) * p.s; }
    return S;
  };

  P.keyboard = function (S, x, y, s, o) {
    var p = M(x, y, s || 1);
    S.poly(p.pts([[-50, 0], [50, 0], [44, -10], [-44, -10]]), { w: 't', fill: 'grey', style: 'wash' });
    for (var i = -36; i <= 36; i += 12) S.line.apply(null, p(i, -3).concat(p(i + 6, -3), [{ w: 'h', double: false }]));
    return S;
  };

  P.laptop = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.poly(p.pts([[-70, 0], [70, 0], [60, -10], [-60, -10]]), { w: 't', fill: 'grey', style: 'wash' });
    S.poly(p.pts([[-56, -10], [56, -10], [52, -86], [-52, -86]]), { fill: 'line', style: 'wash' });
    S.poly(p.pts([[-48, -16], [48, -16], [45, -80], [-45, -80]]), { w: 't', fill: o.screen || 'sky', gap: 4, angle: -20 });
    return S;
  };

  // Chair seen from the side/back. Anchor: floor, centre.
  P.chair = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1, o.flip);
    S.poly(p.pts([[-30, -56], [30, -56], [30, -46], [-30, -46]]), { fill: 'wood', style: 'wash' });
    S.line.apply(null, p(-26, -46).concat(p(-28, 0))); S.line.apply(null, p(24, -46).concat(p(26, 0)));
    S.loop(p.rr(-34, -126, 16, 72, 6), { fill: 'wood', gap: 4.5 });
    return S;
  };

  // Potted plant. Anchor: bottom of the pot.
  P.plant = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    var leaves = o.leaves || [[-0.9, 30], [-0.35, 36], [0.25, 34], [0.85, 30], [-1.3, 22], [1.3, 24]];
    leaves.forEach(function (L, i) {
      var a = L[0] - Math.PI / 2, len = L[1], cx = Math.cos(a) * len * 0.55, cy = -34 + Math.sin(a) * len * 0.55;
      S.loop(p.ell(cx, cy, len * 0.5, len * 0.2, a), { w: 't', fill: 'green', gap: 3.6, angle: (a * 180 / Math.PI) + 60, closeOver: 0.08 });
      S.line.apply(null, p(0, -34).concat(p(cx + Math.cos(a) * len * 0.35, cy + Math.sin(a) * len * 0.35), [{ w: 'h', double: false }]));
    });
    S.poly(p.pts([[-20, -36], [20, -36], [15, 0], [-15, 0]]), { fill: o.pot || 'orange', gap: 4.2 });
    S.line.apply(null, p(-21, -30).concat(p(21, -30), [{ w: 't' }]));
    return S;
  };

  // Table lamp. Anchor: base centre. o.on: light burst.
  P.lamp = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.loop(p.ell(0, -3, 18, 5), { w: 't', fill: 'wood', style: 'wash' });
    S.line.apply(null, p(0, -6).concat(p(0, -40)));
    S.poly(p.pts([[-16, -40], [16, -40], [10, -66], [-10, -66]]), { fill: o.on ? 'yellow' : 'paper', style: o.on ? 'zig' : 'wash', gap: 4 });
    if (o.on) S.burst.apply(null, p(0, -54).concat([28, 38, 200, 340, 5]));
    return S;
  };

  // Window with sky. Anchor: top-left. o.sky: 'night' | 'day' | 'dawn'; o.w o.h; o.curtains.
  P.window = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), w = o.w || 200, h = o.h || 150, sky = o.sky || 'day';
    var inner = p.pts([[8, 8], [w - 8, 8], [w - 8, h - 8], [8, h - 8]]);
    S.fill(inner, sky === 'night' ? 'blue' : sky === 'dawn' ? 'yellow' : 'sky', { gap: sky === 'night' ? 3.4 : 5, style: sky === 'night' ? 'cross' : 'zig' });
    if (sky === 'dawn') S.fill(p.pts([[8, h * 0.55], [w - 8, h * 0.62], [w - 8, h - 8], [8, h - 8]]), 'pink', { gap: 4.6, wash: false });
    if (sky === 'night') {
      S.loop(p.pts([[w * 0.3 + 14, 30], [w * 0.3 + 2, 40], [w * 0.3, 54], [w * 0.3 + 8, 66], [w * 0.3 + 22, 70], [w * 0.3 + 12, 58], [w * 0.3 + 10, 44]]), { w: 't', fill: 'yellow', style: 'wash', washCls: 'solid' });
      [[0.62, 0.22], [0.78, 0.4], [0.5, 0.55], [0.86, 0.2], [0.18, 0.7]].forEach(function (st) { S.star.apply(null, p(w * st[0], h * st[1]).concat([5])); });
    }
    if (sky === 'dawn' || sky === 'day') {
      S.loop(p.ell(w * 0.68, h * (sky === 'dawn' ? 0.66 : 0.32), 16, 16), { w: 't', fill: sky === 'dawn' ? 'orange' : 'yellow', gap: 3.5 });
    }
    S.poly(p.pts([[0, 0], [w, 0], [w, h], [0, h]]), { fill: 'wood', style: 'wash' });
    S.poly(p.pts([[8, 8], [w - 8, 8], [w - 8, h - 8], [8, h - 8]]), { w: 't' });
    S.line.apply(null, p(w / 2, 8).concat(p(w / 2, h - 8)));
    S.line.apply(null, p(-12, h + 2).concat(p(w + 12, h + 2), [{ w: 'b' }]));
    if (o.curtains !== false) {
      [[-18, 1], [w + 18, -1]].forEach(function (c) {
        var cx = c[0], d = c[1];
        S.loop(p.pts([[cx - 14 * d, -12], [cx + 22 * d, -12], [cx + 16 * d, h * 0.45], [cx + 24 * d, h + 20], [cx - 12 * d, h + 22], [cx - 8 * d, h * 0.45]]), { fill: o.curtain || 'paper', style: 'wash', washCls: 'solid', closeOver: 0.04 });
        S.path(p.pts([[cx + 2 * d, -6], [cx, h * 0.5], [cx + 4 * d, h + 16]]), { w: 'h', double: false });
      });
      S.line.apply(null, p(-36, -14).concat(p(w + 36, -14), [{ w: 't' }]));
    }
    return S;
  };

  // Bed seen from the front-side. Anchor: floor, left end. o.w length. o.sleeper: draw a sleeping head.
  P.bed = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), w = o.w || 300;
    S.loop(p.rr(0, -150, 22, 150, 6), { fill: 'wood', gap: 4.5 });
    S.poly(p.pts([[22, -64], [w, -64], [w, -30], [22, -30]]), { fill: 'wood', style: 'wash' });
    S.line.apply(null, p(30, -30).concat(p(30, 0))); S.line.apply(null, p(w - 8, -30).concat(p(w - 8, 0)));
    S.loop(p.pts([[28, -96], [40, -116], [92, -118], [104, -98], [96, -84], [36, -82]]), { fill: 'paper', style: 'wash', washCls: 'solid' });
    if (o.sleeper) {
      var hx = 70, hy = -104;
      S.loop(p.ell(hx, hy, 20, 19), { fill: 'skin', style: 'wash' });
      S.loop(p.pts([[hx - 22, hy + 2], [hx - 18, hy - 16], [hx, hy - 22], [hx + 16, hy - 16], [hx + 4, hy - 10], [hx - 8, hy - 6], [hx - 14, hy + 6]]), { fill: 'hair', style: 'hatch', gap: 3, angle: 60, hzCls: 'fine' });
      S.path(p.pts([[hx - 2, hy + 1], [hx + 3, hy + 4], [hx + 8, hy + 1]]), { w: 't', cls: 'fc' });
      S.loop(p.ell(hx + 10, hy + 9, 3.6, 2.2), { w: 'h', fill: 'pink', style: 'wash', washCls: 'half', double: false });
    }
    S.loop(p.pts([[60, -88], [w * 0.45, -104], [w * 0.8, -98], [w + 6, -86], [w + 10, -46], [w * 0.7, -38], [70, -40], [56, -60]]), { fill: o.blanket || 'paper', gap: 6, style: o.blanket ? 'zig' : 'wash', washCls: o.blanket ? '' : 'solid', closeOver: 0.05 });
    S.path(p.pts([[w * 0.42, -96], [w * 0.5, -70], [w * 0.47, -46]]), { w: 'h', double: false });
    S.path(p.pts([[w * 0.72, -92], [w * 0.76, -66], [w * 0.74, -44]]), { w: 'h', double: false });
    return S;
  };

  P.mug = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.loop(p.rr(-14, -32, 28, 32, 5), { fill: o.pen || 'red', gap: 4 });
    S.path(p.pts([[14, -24], [24, -22], [24, -10], [14, -8]]), { w: 't' });
    if (o.steam !== false) { S.path(p.pts([[-5, -38], [-9, -48], [-4, -58]]), { w: 'h', double: false }); S.path(p.pts([[5, -40], [1, -50], [6, -60]]), { w: 'h', double: false }); }
    return S;
  };

  P.books = function (S, x, y, s, o) {
    var p = M(x, y, s || 1), cols = (o && o.pens) || ['blue', 'orange', 'green'];
    cols.forEach(function (c, i) {
      var y0 = -i * 16, off = (i % 2 ? 6 : -4);
      S.poly(p.pts([[-40 + off, y0 - 16], [40 + off, y0 - 16], [40 + off, y0], [-40 + off, y0]]), { fill: c, gap: 4, w: 't' });
      S.line.apply(null, p(-32 + off, y0 - 8).concat(p(30 + off, y0 - 8), [{ w: 'h', double: false }]));
    });
    return S;
  };

  // Light bulb ("idea"). Anchor: centre of the glass.
  P.bulb = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.loop(p.pts([[0, -30], [20, -22], [26, -2], [16, 16], [10, 26], [-10, 26], [-16, 16], [-26, -2], [-20, -22]]), { fill: o.off ? 'paper' : 'yellow', gap: 4.4, closeOver: 0.06 });
    S.poly(p.pts([[-10, 26], [10, 26], [9, 40], [-9, 40]]), { w: 't', fill: 'grey', style: 'wash' });
    S.line.apply(null, p(-9, 32).concat(p(9, 32), [{ w: 'h' }]));
    S.path(p.pts([[-6, 18], [-4, 4], [0, 10], [4, 4], [6, 18]]), { w: 'h', double: false });
    if (!o.off) S.burst.apply(null, p(0, -2).concat([36, 50, 200, 340, 5, { pen: 'orange' }]));
    return S;
  };

  P.cloud = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.loop(p.pts([[-60, 10], [-66, -8], [-50, -24], [-30, -24], [-20, -42], [6, -46], [22, -32], [44, -36], [62, -20], [64, 2], [48, 14], [-44, 16]]), { fill: o.pen || 'sky', style: o.style || 'wash', gap: 5, closeOver: 0.06 });
    return S;
  };

  // Server rack: o.n units; o.lights pencil list per unit.
  P.server = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), n = o.n || 4, u = 30;
    S.poly(p.pts([[-46, -n * u - 12], [46, -n * u - 12], [46, 0], [-46, 0]]), { fill: 'grey', style: 'wash' });
    for (var i = 0; i < n; i++) {
      var y0 = -n * u - 6 + i * u;
      S.poly(p.pts([[-38, y0], [38, y0], [38, y0 + u - 6], [-38, y0 + u - 6]]), { w: 't' });
      S.dot.apply(null, p(-28, y0 + 12).concat([3, { pen: (o.lights && o.lights[i]) || 'green' }]));
      S.line.apply(null, p(-14, y0 + 12).concat(p(26, y0 + 12), [{ w: 'h', double: false }]));
    }
    return S;
  };

  P.gear = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), pts = [], teeth = o.teeth || 8, R1 = 30, R2 = 38;
    for (var i = 0; i < teeth * 4; i++) {
      var a = i / (teeth * 4) * Math.PI * 2, r = (i % 4 === 1 || i % 4 === 2) ? R2 : R1;
      pts.push(p(Math.cos(a) * r, Math.sin(a) * r));
    }
    S.poly(pts, { fill: o.pen || 'grey', gap: 4.6, over: 0.6 });
    S.loop(p.ell(0, 0, 11, 11), { w: 't', fill: 'paper', style: 'wash', washCls: 'solid' });
    return S;
  };

  // A page of paper with lines (a document / file). Anchor: top-left.
  P.doc = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), w = o.w || 70, h = o.h || 90;
    S.poly(p.pts([[0, 0], [w - 18, 0], [w, 18], [w, h], [0, h]]), { fill: o.pen || 'paper', style: o.pen ? 'zig' : 'wash', washCls: o.pen ? '' : 'solid', gap: 5 });
    S.path(p.pts([[w - 18, 0], [w - 18, 18], [w, 18]]), { w: 't', smooth: false });
    for (var i = 0; i < (o.lines || 4); i++) S.line.apply(null, p(10, 30 + i * 14).concat(p(w - 12 - (i === (o.lines || 4) - 1 ? 18 : 0), 30 + i * 14), [{ w: 'h', double: false }]));
    return S;
  };

  P.magnifier = function (S, x, y, s, o) {
    var p = M(x, y, s || 1);
    S.loop(p.ell(0, 0, 26, 26), { w: 'b', fill: 'sky', style: 'wash' });
    S.path(p.pts([[-12, -10], [-6, -16]]), { w: 't', double: false });
    S.poly(p.pts([[18, 16], [24, 12], [48, 38], [42, 44]]), { fill: 'wood', gap: 3.5 });
    return S;
  };

  P.clock = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1), hh = o.hour == null ? 10 : o.hour, mm = o.min == null ? 10 : o.min;
    S.loop(p.ell(0, 0, 32, 32), { fill: 'paper', style: 'wash', washCls: 'solid' });
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; S.line.apply(null, p(Math.cos(a) * 25, Math.sin(a) * 25).concat(p(Math.cos(a) * 29, Math.sin(a) * 29), [{ w: 'h', double: false }])); }
    var ah = (hh % 12 + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2, am = mm / 60 * Math.PI * 2 - Math.PI / 2;
    S.line.apply(null, p(0, 0).concat(p(Math.cos(ah) * 15, Math.sin(ah) * 15), [{ w: 'b' }]));
    S.line.apply(null, p(0, 0).concat(p(Math.cos(am) * 23, Math.sin(am) * 23), [{ w: 't', pen: 'orange' }]));
    return S;
  };

  P.sun = function (S, x, y, s, o) {
    var p = M(x, y, s || 1);
    S.loop(p.ell(0, 0, 24, 24), { fill: 'yellow', gap: 4 });
    S.burst.apply(null, p(0, 0).concat([32, 44, 0, 330, 12, { pen: 'orange' }]));
    return S;
  };

  P.moon = function (S, x, y, s, o) {
    var p = M(x, y, s || 1);
    S.loop(p.pts([[6, -26], [-12, -18], [-20, 0], [-12, 18], [8, 26], [22, 20], [6, 14], [-4, 0], [0, -14], [14, -24]]), { fill: 'yellow', gap: 3.6, closeOver: 0.05 });
    return S;
  };

  P.tree = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.poly(p.pts([[-7, 0], [7, 0], [5, -60], [-5, -60]]), { fill: 'wood', gap: 4 });
    S.blob.apply(null, p(0, -96).concat([44, 46, { fill: o.pen || 'green', gap: 5.5, bump: 0.14, n: 16 }]));
    return S;
  };

  // Hills / ground line across a width: y baseline, w width.
  P.ground = function (S, x, y, s, o) {
    o = o || {}; var w = o.w || 600, pts = [], n = Math.max(4, Math.round(w / 120));
    for (var i = 0; i <= n; i++) pts.push([x + i / n * w, y + Math.sin(i * 1.7 + (o.phase || 0)) * (o.amp == null ? 10 : o.amp)]);
    S.path(pts, { w: o.w2 || undefined });
    for (var k = 0; k < (o.tufts || 4); k++) {
      var tx = x + (k + 0.5) / (o.tufts || 4) * w, ty = y + Math.sin(((k + 0.5) / (o.tufts || 4) * n) * 1.7 + (o.phase || 0)) * (o.amp == null ? 10 : o.amp);
      S.path([[tx - 6, ty], [tx - 3, ty - 9]], { w: 'h', double: false }); S.path([[tx, ty], [tx + 1, ty - 12]], { w: 'h', double: false }); S.path([[tx + 5, ty], [tx + 8, ty - 8]], { w: 'h', double: false });
    }
    return S;
  };

  P.phone = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.loop(p.rr(-22, -44, 44, 88, 8), { fill: 'line', style: 'wash' });
    S.loop(p.rr(-17, -36, 34, 68, 3), { w: 't', fill: o.screen || 'sky', gap: 3.6 });
    return S;
  };

  P.envelope = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1);
    S.poly(p.pts([[-36, -24], [36, -24], [36, 24], [-36, 24]]), { fill: o.pen || 'paper', style: o.pen ? 'zig' : 'wash', washCls: o.pen ? '' : 'solid', gap: 5 });
    S.path(p.pts([[-36, -24], [0, 4], [36, -24]]), { w: 't', smooth: false });
    return S;
  };

  P.cat = function (S, x, y, s, o) {
    o = o || {}; var p = M(x, y, s || 1, o.flip);
    S.loop(p.pts([[-40, 0], [-44, -22], [-30, -40], [0, -44], [26, -36], [34, -16], [30, 0]]), { fill: o.pen || 'orange', gap: 5, closeOver: 0.05 });
    S.path(p.pts([[-40, -8], [-60, -14], [-66, -34], [-58, -46]]), { w: 'b' });
    S.loop(p.pts([[18, -40], [16, -62], [26, -54], [36, -62], [38, -40], [46, -26], [28, -14], [10, -22]]), { fill: o.pen || 'orange', gap: 4.5, closeOver: 0.05 });
    S.path(p.pts([[20, -36], [23, -34], [26, -36]]), { w: 'h' }); S.path(p.pts([[30, -36], [33, -34], [36, -36]]), { w: 'h' });
    S.line.apply(null, p(38, -28).concat(p(52, -30), [{ w: 'h', double: false }])); S.line.apply(null, p(38, -25).concat(p(52, -23), [{ w: 'h', double: false }]));
    return S;
  };

  // ── marks for diagrams ──────────────────────────────────────────────────
  // Text that may be one string or { zh, en } (shown by the page's language switch).
  // Multi-line: '\n' in either language; the shorter one gets blank lines.
  function lines(label) {
    if (label && typeof label === 'object') {
      var z = String(label.zh).split('\n'), e = String(label.en).split('\n'), n = Math.max(z.length, e.length), out = [];
      for (var i = 0; i < n; i++) out.push({ zh: z[i] || '', en: e[i] || '' });
      return out;
    }
    return String(label).split('\n');
  }
  function say(S, x, y, t, o) {
    if (typeof t === 'object') return S.text(x, y, '', Object.assign({}, o, { lang: t }));
    return S.text(x, y, t, o);
  }
  P.lines = lines;
  P.say = say;

  // A formula in the mono face, built from runs: 'text' or { t, ink, sub }.
  //   P.formula(S, 400, 44, ['x', { t: '0', sub: true }, ' = ', { t: 'λ', ink: 'violet' }])
  // Subscripts are smaller runs dropped below the baseline (the next run climbs back),
  // not the Unicode ₀₁₂ characters: the mono webfont has no glyphs for those, and a
  // fallback font in the middle of a formula looks pasted in.
  // o.size (18) o.ink colour for runs without their own o.anchor 'middle' | 'end'
  P.formula = function (S, x, y, runs, o) {
    o = o || {};
    var size = o.size || 18, sub = Math.round(size * 0.66), drop = Math.round(size * 0.3);
    var inner = '', down = false, n = 0;
    runs.forEach(function (p) {
      var q = typeof p === 'string' ? { t: p } : p, ink = q.ink || o.ink, at = '';
      if (q.sub) at = (down ? '' : ' dy="' + drop + '"') + ' font-size="' + sub + '"';
      else if (down) at = ' dy="' + (-drop) + '"';
      down = !!q.sub;
      inner += '<tspan class="tx f-mono' + (ink ? ' i-' + ink : '') + '"' + at + '>' + String(q.t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</tspan>';
      n += q.t.length * (q.sub ? 0.66 : 1);
    });
    var anchor = o.anchor ? ' text-anchor="' + o.anchor + '"' : '';
    S.raw('<text x="' + x + '" y="' + y + '" font-size="' + size + '"' + anchor + ' class="tx f-mono" xml:space="preserve"%A>' + inner + '</text>', { layer: 'labels', kind: 'text', len: n * size * 0.6 });
    return S;
  };

  // A box with a label: the hand-drawn node of every diagram. Returns the box
  // {x, y, w, h} so links can find its edges.
  // o.pen fill colour, o.r corner radius, o.size font size, o.sub small second line, o.font 'mono'.
  P.node = function (S, x, y, w, h, label, o) {
    o = o || {};
    // an opaque paper base first, so guide lines and wires behind the box do not show through
    if (o.opaque !== false) S.fill(Sketch_roundRect(x, y, w, h, o.r == null ? 12 : o.r), 'paper', { style: 'wash', washCls: 'solid' });
    S.rect(x, y, w, h, { r: o.r == null ? 12 : o.r, fill: o.pen, style: o.style || 'zig', gap: o.gap, w: o.w });
    var ls = lines(label), size = o.size || 19, lh = size * 1.25;
    var y0 = y + h / 2 - (ls.length - 1) * lh / 2 + size * 0.36 - (o.sub ? size * 0.45 : 0);
    ls.forEach(function (t, i) {
      if (t === '' || (typeof t === 'object' && !t.zh && !t.en)) return;   // an empty box writes no empty <text>
      say(S, x + w / 2, y0 + i * lh, t, { anchor: 'middle', size: size, weight: o.weight, font: o.font });
    });
    if (o.sub) say(S, x + w / 2, y0 + ls.length * lh - size * 0.1, o.sub, { anchor: 'middle', size: Math.round(size * 0.74), ink: '2', font: o.subFont });
    return { x: x, y: y, w: w, h: h };
  };

  // Arrow from box a to box b, edge to edge. o.side: 'auto' | 'v' | 'h'; o.bend px sideways.
  // Returns the points used, so a token can travel the same line.
  P.link = function (S, a, b, o) {
    o = o || {};
    var ac = [a.x + a.w / 2, a.y + a.h / 2], bc = [b.x + b.w / 2, b.y + b.h / 2];
    var dx = bc[0] - ac[0], dy = bc[1] - ac[1], vert = o.side === 'v' || (o.side !== 'h' && Math.abs(dy) * a.w > Math.abs(dx) * a.h);
    var gap = o.gap == null ? 7 : o.gap, p0, p1;
    if (vert) { p0 = [ac[0] + (o.dx0 || 0), dy > 0 ? a.y + a.h + gap : a.y - gap]; p1 = [bc[0] + (o.dx1 || 0), dy > 0 ? b.y - gap : b.y + b.h + gap]; }
    else { p0 = [dx > 0 ? a.x + a.w + gap : a.x - gap, ac[1] + (o.dy0 || 0)]; p1 = [dx > 0 ? b.x - gap : b.x + b.w + gap, bc[1] + (o.dy1 || 0)]; }
    var mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    var bend = o.bend || 0, m = [mid[0] - (p1[1] - p0[1]) / L * bend, mid[1] + (p1[0] - p0[0]) / L * bend];
    var pts = bend ? [p0, m, p1] : [p0, p1];
    S.arrow(pts, { w: o.w || 't', pen: o.pen, cls: o.cls, head: o.head || 10 });
    if (o.label) say(S, m[0] + (o.lx || 0), m[1] + (o.ly || -8), o.label, { anchor: 'middle', size: o.size || 15, ink: o.ink || '2' });
    return pts;
  };

  // A code card: dark in both themes (like a terminal), monospaced, simple colouring
  // (keywords yellow, numbers and strings green, comments dim). Returns the baseline
  // y of each line and the card box, so a highlight can sit behind any line.
  // o.size (15) o.lh line height (30) o.w width (320) o.title small caption on the card
  // o.cursor [[t, line], …] a highlight bar that moves between lines (see codeCursor)
  var KW = /\b(let|const|var|for|of|in|if|else|return|function|while|def|class|new|true|false|null)\b/;
  P.code = function (S, x, y, src, o) {
    o = o || {};
    var lines = String(src).split('\n'), size = o.size || 15, lh = o.lh || 30, w = o.w || 320;
    var h = lines.length * lh + 28 + (o.title ? 22 : 0);
    // the card stays out of the pencil filter: grain on a dark card reads as dirt
    S.raw('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" class="term"/>', { kind: 'tag', layer: 'labels' });
    var top = y + 14 + (o.title ? 22 : 0), ys = lines.map(function (_, i) { return top + i * lh + lh * 0.62; });
    var card = { ys: ys, box: { x: x, y: y, w: w, h: h }, lh: lh };
    if (o.title) S.text(x + 16, y + 24, o.title, { size: 13, font: 'mono', ink: 'term-dim' });
    if (o.cursor) P.codeCursor(S, card, o.cursor);        // before the text, so it sits behind it
    lines.forEach(function (line, i) {
      var by = ys[i];
      var parts = line.split(/(\/\/.*$|"[^"]*"|'[^']*'|\b\d+\b|\b[A-Za-z_]+\b)/).filter(function (t) { return t !== ''; });
      var inner = parts.map(function (t) {
        var c = /^\/\//.test(t) ? 'i-term-dim' : KW.test(t) && /^[A-Za-z_]+$/.test(t) ? 'i-term-warn' : /^\d+$|^["']/.test(t) ? 'i-term-ok' : 'i-term';
        return '<tspan class="tx f-mono ' + c + '">' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</tspan>';
      }).join('');
      S.raw('<text x="' + (x + 18) + '" y="' + by + '" font-size="' + size + '" class="tx f-mono i-term" xml:space="preserve"%A>' + inner + '</text>', { layer: 'labels', kind: 'text', len: line.length * size * 0.6 });
    });
    return card;
  };

  // Highlight bar behind code line `from` that moves to other lines at given times:
  // steps = [[t, lineIndex], …]. Hidden when animations are off (it marks "now").
  P.codeCursor = function (S, card, steps, o) {
    o = o || {};
    var y0 = card.ys[steps[0][1]], keys = [];
    steps.forEach(function (st, i) {
      var dy = card.ys[st[1]] - y0, prev = keys[keys.length - 1];
      if (i) keys.push([st[0] - 0.01, prev[1], prev[2], prev[3]]);   // hold the previous line (and opacity) until now
      keys.push([st[0], 0, dy, st[2] == null ? 1 : st[2]]);
    });
    S.track(keys, function () {
      S.raw('<rect x="' + (card.box.x + 6) + '" y="' + (y0 - card.lh * 0.66) + '" width="' + (card.box.w - 12) + '" height="' + card.lh + '" rx="6" class="hl tmp"/>', { kind: 'tag', layer: 'labels' });
    }, { layer: 'labels' });
  };

  // A small token (dot / packet) that travels pts from `start`, taking `dur`, repeating.
  P.token = function (S, pts, start, dur, o) {
    o = o || {};
    S.move(pts, start, dur, function () {
      if (o.shape === 'doc') S.raw('<rect x="' + (pts[0][0] - 7) + '" y="' + (pts[0][1] - 9) + '" width="14" height="18" rx="2" class="ln w-t tok p-' + (o.pen || 'orange') + '"/>', { kind: 'tag' });
      else S.raw('<circle cx="' + pts[0][0] + '" cy="' + pts[0][1] + '" r="' + (o.r || 6) + '" class="tok p-' + (o.pen || 'orange') + '"/>', { kind: 'tag' });
    }, { repeat: o.repeat || 'infinite', ease: o.ease || 'ease-in-out' });
    return S;
  };

  // Diamond decision node.
  P.decision = function (S, cx, cy, w, h, label, o) {
    o = o || {};
    S.poly([[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]], { fill: o.pen || 'yellow', gap: 6 });
    S.text(cx, cy + 6, label, { anchor: 'middle', size: o.size || 17 });
    return S;
  };

  // Cylinder (database / storage).
  P.cylinder = function (S, cx, y, w, h, label, o) {
    o = o || {}; var rx = w / 2, ry = Math.max(8, w * 0.14);
    var body = [];
    for (var i = 0; i <= 12; i++) { var a = Math.PI * i / 12; body.push([cx + rx * Math.cos(a), y + h + ry * Math.sin(a)]); }
    S.fill([[cx - rx, y]].concat([[cx + rx, y]]).concat(body).concat([[cx - rx, y + h]]), o.pen || 'blue', { gap: 6 });
    S.ellipse(cx, y, rx, ry, { fill: o.pen || 'blue', style: 'wash' });
    S.line(cx - rx, y, cx - rx, y + h); S.line(cx + rx, y, cx + rx, y + h);
    S.path(body.slice(0).reverse());
    if (label) S.text(cx, y + h / 2 + ry + 6, label, { anchor: 'middle', size: o.size || 18 });
    return S;
  };

  return P;
});
