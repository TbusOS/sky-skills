/* 小样用的毛笔原型(一次性,验证完就丢)。
 * 一笔 = 中心线 + 粗细曲线 + 含墨量。湿的部分是填色形状,干的部分是一束笔毛断成的线段(飞白),
 * 整笔外面套一层遮罩,遮罩沿笔路展开,露出下面整笔;落定后晕边层慢慢显出来。
 * 浏览器和 node 都能用:浏览器里是 window.BrushProto,node 里 require。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BrushProto = factory();
})(this, function () {
  'use strict';

  function rng(seed) {                       // mulberry32:同一个 seed 永远出同一串数
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function noise1d(r, knots) {               // 0..1 上的平滑随机曲线,值在 -1..1
    var v = [];
    for (var i = 0; i <= knots; i++) v.push(r() * 2 - 1);
    return function (t) {
      var x = Math.max(0, Math.min(0.999999, t)) * knots, i = Math.floor(x), f = x - i;
      var s = f * f * (3 - 2 * f);
      return v[i] * (1 - s) + v[i + 1] * s;
    };
  }

  // Catmull-Rom 过所有点,按约 step px 取样;返回 [{x, y, s}],s 是从起点算的长度
  function resample(pts, step) {
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

  // 提按曲线:t(0..1)→ 宽度系数
  var PRESS = {
    zhong: function (t) {                   // 中锋:起笔按下、行笔略提、收笔回锋收细
      if (t < 0.08) return 0.45 + 0.55 * Math.sin(t / 0.08 * Math.PI / 2);
      if (t > 0.82) return 0.15 + 0.6 * Math.cos((t - 0.82) / 0.18 * Math.PI / 2);
      return 0.75;
    },
    leaf: function (t) { return 0.08 + 0.92 * Math.pow(Math.sin(t * Math.PI), 1.4); },   // 兰叶:细-粗-细
    dot: function (t) { return 0.55 + 0.45 * Math.sin(t * Math.PI); }                     // 点
  };

  function f1(n) { return Math.round(n * 10) / 10; }

  function create(opts) {
    var r = rng(opts.seed || 1), prefix = opts.id || 'b', n = 0;
    var art = [], defs = [], css = [];

    function stroke(pts, o) {
      var k = n++, width = o.width || 12, press = PRESS[o.press || 'zhong'];
      var load0 = o.load == null ? 0.95 : o.load, wet = o.wet == null ? 0.5 : o.wet;
      var start = o.start || 0, dur = o.dur || 1, tone = o.tone || 'nong';
      var P = resample(pts, 2), L = P[P.length - 1].s;
      var wob = noise1d(r, 6), edgeL = noise1d(r, 18), edgeR = noise1d(r, 18), loadN = noise1d(r, 5);
      var load = function (t) { return load0 - (load0 - 0.12) * Math.pow(t, 1.3) + 0.06 * loadN(t); };
      var W = function (t) { return width * press(t) * (1 + 0.08 * wob(t)); };
      var DRY = 0.42;                           // 含墨量低于它的地方改用笔毛画(飞白)
      var tDry = 1;
      for (var q = 0; q < P.length; q++) { if (load(P[q].s / L) < DRY) { tDry = P[q].s / L; break; } }

      function normal(i) {
        var a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        return [-dy / len, dx / len];
      }
      // 湿的部分:从起点画到 tDry 稍后一点,两边按宽度偏出去,边缘加一点抖
      var left = [], right = [], tWetEnd = Math.min(1, tDry + 0.04);
      for (var i = 0; i < P.length; i++) {
        var t = P[i].s / L;
        if (t > tWetEnd) break;
        var nrm = normal(i), w = W(t) / 2;
        left.push([P[i].x + nrm[0] * (w + 0.7 * edgeL(t)), P[i].y + nrm[1] * (w + 0.7 * edgeL(t))]);
        right.push([P[i].x - nrm[0] * (w + 0.7 * edgeR(t)), P[i].y - nrm[1] * (w + 0.7 * edgeR(t))]);
      }
      var body = '';
      if (left.length > 1) {
        var ring = left.concat(right.reverse());
        body = 'M' + ring.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z';
      }
      // 干的部分:一束笔毛,每根在含墨不够的地方断开
      var N = Math.max(6, Math.min(24, Math.round(width / 2))), bristles = '';
      if (tDry < 1) {
        for (var b = 0; b < N; b++) {
          var u = (b + 0.5) / N - 0.5 + (r() - 0.5) * 0.04, bias = (r() - 0.5) * 0.25, bn = noise1d(r, 12);
          var seg = [], on = false;
          for (var j = 0; j < P.length; j++) {
            var tj = P[j].s / L;
            if (tj < tDry - 0.06) continue;
            var inkHere = load(tj) + bias + 0.22 * bn(tj) + 0.3 * (1 - Math.abs(u) * 2) * 0.5;
            var nm = normal(j), wj = W(tj);
            var x = P[j].x + nm[0] * u * wj, y = P[j].y + nm[1] * u * wj;
            if (inkHere > 0.33) { seg.push((on ? 'L' : 'M') + f1(x) + ' ' + f1(y)); on = true; }
            else on = false;
          }
          bristles += seg.join('');
        }
      }
      var center = 'M' + P.map(function (p) { return f1(p.x) + ' ' + f1(p.y); }).join('L');
      var mid = prefix + '-m' + k, wMax = width + 10;
      defs.push('<mask id="' + mid + '" maskUnits="userSpaceOnUse"><path class="bp-reveal" d="' + center +
        '" pathLength="1" stroke="#fff" stroke-width="' + wMax + '" fill="none" stroke-linecap="round"' +
        ' style="animation-delay:' + start + 's;animation-duration:' + dur + 's"/></mask>');
      var bw = f1(Math.max(0.8, width / N * 1.3));
      // 晕边放在遮罩外面:它比笔宽,放进遮罩会被切出硬边;它自己等这一笔画完才开始显
      if (body) art.push('<path class="bp-halo bp-' + tone + '" d="' + body + '" style="--wet:' + wet + ';animation-delay:' + f1(start + dur) + 's"/>');
      art.push('<g class="bp-stroke bp-' + tone + '" mask="url(#' + mid + ')">' +
        (body ? '<path class="bp-body" d="' + body + '"/>' : '') +
        (bristles ? '<path class="bp-dry" d="' + bristles + '" stroke-width="' + bw + '"/>' : '') +
        '</g>');
      return { length: L, tDry: tDry, bristles: N };
    }

    // 大片淡墨:几层半透明、边缘打毛的形状
    function wash(pts, o) {
      var layers = o.layers || 3, start = o.start || 0, dur = o.dur || 1.2;
      for (var l = 0; l < layers; l++) {
        var jit = pts.map(function (p) { return [p[0] + (r() - 0.5) * 10, p[1] + (r() - 0.5) * 8]; });
        var d = 'M' + jit.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z';
        art.push('<path class="bp-wash bp-' + (o.tone || 'dan') + '" d="' + d + '" style="animation-delay:' +
          f1(start + l * dur / layers) + 's;animation-duration:' + f1(dur) + 's"/>');
      }
    }

    // 印章:方印,朱文,边缘用滤镜蚀出残缺
    function seal(x, y, size, text, o) {
      var start = (o && o.start) || 0;
      art.push('<g class="bp-seal" style="animation-delay:' + start + 's" transform="translate(' + x + ' ' + y + ')">' +
        '<rect x="0" y="0" width="' + size + '" height="' + size + '" rx="3" fill="none" stroke-width="' + f1(size / 14) + '"/>' +
        '<text x="' + f1(size / 2) + '" y="' + f1(size * 0.68) + '" font-size="' + f1(size * 0.42) + '" text-anchor="middle">' + text + '</text></g>');
    }

    return {
      stroke: stroke, wash: wash, seal: seal,
      svg: function (w, h) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
          '<defs>' + FILTERS + defs.join('') + '</defs>' +
          '<rect class="bp-paper" width="' + w + '" height="' + h + '"/>' +
          '<rect width="' + w + '" height="' + h + '" filter="url(#bp-fiber)" opacity="0.5"/>' +
          '<g class="bp-ink" filter="url(#bp-rough)">' + art.join('') + '</g></svg>';
      }
    };
  }

  var FILTERS =
    '<filter id="bp-rough" x="-5%" y="-5%" width="110%" height="110%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>' +
    '<filter id="bp-halo" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" result="d"/><feGaussianBlur in="d" stdDeviation="2.4"/></filter>' +
    '<filter id="bp-fiber"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="2" seed="9"/>' +
    '<feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.38  0 0 0 0.16 0"/></filter>';

  var CSS =
    ':root{--paper:#f2ead8;--jiao:#1a1714;--nong:#2e2a26;--zhong:#4f4943;--dan:#8a837a;--qing:#c3bcb0;--zhu:#b8322a}' +
    '.bp-paper{fill:var(--paper)}.bp-ink{mix-blend-mode:multiply}' +
    '.bp-jiao{--c:var(--jiao)}.bp-nong{--c:var(--nong)}.bp-zhong{--c:var(--zhong)}.bp-dan{--c:var(--dan)}.bp-qing{--c:var(--qing)}' +
    '.bp-body{fill:var(--c)}.bp-dry{fill:none;stroke:var(--c);stroke-linecap:round}' +
    '.bp-halo{fill:var(--c);filter:url(#bp-halo);opacity:0;animation:bp-bleed 1.2s ease-out forwards}' +
    '@keyframes bp-bleed{to{opacity:calc(0.35*var(--wet))}}' +
    '.bp-reveal{stroke-dasharray:1 2;stroke-dashoffset:1;animation:bp-draw linear forwards}' +
    '@keyframes bp-draw{to{stroke-dashoffset:0}}' +
    '.bp-wash{fill:var(--c);opacity:0;animation:bp-wash ease-out forwards;filter:url(#bp-halo)}' +
    '@keyframes bp-wash{to{opacity:0.22}}' +
    '.bp-seal{opacity:0;animation:bp-stamp .35s ease-out forwards}.bp-seal rect{stroke:var(--zhu)}' +
    '.bp-seal text{fill:var(--zhu);font-family:"Songti SC","Noto Serif SC",serif;font-weight:700}' +
    '@keyframes bp-stamp{from{opacity:0;transform-box:fill-box}to{opacity:.92}}' +
    '@media (prefers-reduced-motion:reduce){.bp-reveal{animation:none;stroke-dashoffset:0}' +
    '.bp-halo{animation:none;opacity:calc(0.35*var(--wet))}.bp-wash{animation:none;opacity:.22}.bp-seal{animation:none;opacity:.92}}';

  return { create: create, rng: rng, resample: resample, PRESS: PRESS, CSS: CSS };
});
