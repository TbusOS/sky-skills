// Maths, the deeper set: Fourier series, Lagrange interpolation, Lagrange multipliers.
// Same rule as 60-math.mjs: every number on screen is computed in this file — the
// circle radii, the overshoot at the corners, the polynomial's coefficients, the
// optimum on the road and the angles between the arrows.

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function r1(n) { return Math.round(n * 10) / 10; }

// A formula in the mono face, built from runs: 'text' or { t, ink, sub }. Subscripts are
// smaller runs dropped below the baseline (the next run climbs back), not the Unicode
// ₀₁₂ characters: the mono webfont has no glyphs for those, and a fallback font in the
// middle of a formula looks pasted in.
function formula(S, x, y, runs, o = {}) {
  const size = o.size || 18, sub = Math.round(size * 0.66), drop = Math.round(size * 0.3);
  let inner = '', down = false, n = 0;
  runs.forEach(p => {
    const q = typeof p === 'string' ? { t: p } : p, ink = q.ink || o.ink;
    let at = '';
    if (q.sub) at = (down ? '' : ` dy="${drop}"`) + ` font-size="${sub}"`;
    else if (down) at = ` dy="${-drop}"`;
    down = !!q.sub;
    inner += `<tspan class="tx f-mono${ink ? ' i-' + ink : ''}"${at}>${esc(q.t)}</tspan>`;
    n += q.t.length * (q.sub ? 0.66 : 1);
  });
  const anchor = o.anchor ? ` text-anchor="${o.anchor}"` : '';
  S.raw(`<text x="${x}" y="${y}" font-size="${size}"${anchor} class="tx f-mono" xml:space="preserve"%A>${inner}</text>`, { layer: 'labels', kind: 'text', len: n * size * 0.6 });
}
const sub = t => ({ t, sub: true });

// ── Fourier: a square wave from odd sines ───────────────────────────────────
const FR = (() => {
  const A = 70, K = [1, 3, 5, 7], PEN = ['blue', 'orange', 'green', 'violet'];
  const r = K.map(k => A * 4 / (Math.PI * k));              // circle k's radius = that sine's amplitude
  const part = (n, th) => { let s = 0; for (let j = 0; j < n; j++) s += r[j] * Math.sin(K[j] * th); return s; };
  // how high the sum overshoots at the jump: 4 terms here, and 400 terms to show it stays
  const peak = terms => { let m = 0; for (let i = 1; i < 40000; i++) { const th = i / 40000 * Math.PI; let s = 0; for (let k = 1; k <= 2 * terms - 1; k += 2) s += 4 / (Math.PI * k) * Math.sin(k * th); m = Math.max(m, s); } return m; };
  return { A, K, PEN, r, part, reach: r.reduce((a, b) => a + b, 0), g4: peak(4), g400: peak(400) };
})();

// ── Lagrange interpolation through four points ──────────────────────────────
const LI = (() => {
  const xs = [0, 1, 2.5, 4], ys = [1, 3, 2, 3.5], PEN = ['blue', 'orange', 'green', 'violet'];
  const ell = (i, x) => xs.reduce((p, xj, j) => (j === i ? p : p * (x - xj) / (xs[i] - xj)), 1);
  const L = x => ys.reduce((s, y, i) => s + y * ell(i, x), 0);
  // expand Σ y_i ℓ_i into ordinary coefficients a0 + a1 x + a2 x² + a3 x³
  const mul = (p, a, b) => { const o = new Array(p.length + 1).fill(0); p.forEach((c, k) => { o[k] += c * b; o[k + 1] += c * a; }); return o; }; // p·(a x + b)
  const coef = [0, 0, 0, 0];
  xs.forEach((xi, i) => {
    let p = [1];
    xs.forEach((xj, j) => { if (j !== i) p = mul(p, 1 / (xi - xj), -xj / (xi - xj)); });
    p.forEach((c, k) => { coef[k] += ys[i] * c; });
  });
  // put the four x back into the expanded polynomial: what is left is floating-point rounding
  const worst = Math.max(...xs.map((x, i) => Math.abs(coef.reduce((v, c, k) => v + c * x ** k, 0) - ys[i])));
  return { xs, ys, PEN, ell, L, coef, worst };
})();

// ── Lagrange multipliers: the highest point on a road ──────────────────────
const LM = (() => {
  const H = [520, 215], ax = 1.5, ay = 0.8;                  // hill top, and how wide / tall its contours are
  const q = (x, y) => ((x - H[0]) / ax) ** 2 + ((y - H[1]) / ay) ** 2;   // height f = -q
  const road = x => 400 - 0.26 * (x - 40) + 0.00036 * (x - 40) ** 2;   // g(x, y) = road(x) - y = 0
  const slope = x => -0.26 + 0.00072 * (x - 40);
  const gradF = (x, y) => [-2 * (x - H[0]) / ax ** 2, -2 * (y - H[1]) / ay ** 2];   // points uphill
  const gradG = x => [slope(x), -1];                          // the road's normal, on the hill's side
  // the optimum: scan the road, then refine by golden section
  let bx = 40; for (let x = 40; x <= 780; x += 1) if (q(x, road(x)) < q(bx, road(bx))) bx = x;
  let a = bx - 1, b = bx + 1; const gr = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) { const c = b - gr * (b - a), d = a + gr * (b - a); if (q(c, road(c)) < q(d, road(d))) b = d; else a = c; }
  const xo = (a + b) / 2;
  const angle = x => { const f = gradF(x, road(x)), g = gradG(x); return Math.acos((f[0] * g[0] + f[1] * g[1]) / Math.hypot(...f) / Math.hypot(...g)) * 180 / Math.PI; };
  const stops = [90, 230, 360, xo];
  return { H, ax, ay, q, road, slope, gradF, gradG, xo, angle, stops };
})();

export default [
  {
    id: 'math-fourier', cat: 'math', w: 800, h: 480, seed: 61, motion: true,
    title: { zh: '傅立叶级数 · 方波是一串转圈的正弦叠出来的', en: 'Fourier series · a square wave from circles turning on circles' },
    desc: {
      zh: `四个圆一个套一个地转:频率 1、3、5、7 倍,半径是 1、1/3、1/5、1/7。最外面那个点的高度画到右边,就是四个正弦波的和,已经很像方波。右下角的柱子就是傅立叶变换算出来的东西:每个频率占多少。4 项时边角冲到方波高度的 ${FR.g4.toFixed(3)} 倍;加到 400 项还是 ${FR.g400.toFixed(3)} 倍——跳变处这一截冲高不会消失(吉布斯现象)。`,
      en: `Four circles turn on each other at 1, 3, 5 and 7 times the speed, radii 1, 1/3, 1/5, 1/7. The height of the outermost point, traced to the right, is the sum of four sines — already close to a square wave. The bars are what a Fourier transform computes: how much of each frequency. With 4 terms the corner overshoots to ${FR.g4.toFixed(3)}× the wave's height; with 400 terms it is still ${FR.g400.toFixed(3)}× — the overshoot at a jump never goes away (Gibbs phenomenon).`,
    },
    draw(S, P) {
      const { A, K, PEN, r, part } = FR;
      const c0 = [175, 235], x0 = 370, L = 400, x1 = x0 + L, cy = c0[1], T = 8, N = 160;
      const stageT = [2.2, 3.9, 5.6, 7.3], t0 = 9.0;
      const X = th => x0 + th / (2 * Math.PI) * L;
      // axes and the target
      S.at(0, 1.2, () => {
        S.line(x0 - 10, cy, x1 + 16, cy, { w: 'h', double: false });
        S.line(x0, cy - 100, x0, cy + 100, { w: 'h', double: false });
        S.path([[x0, cy], [x0, cy - A], [x0 + L / 2, cy - A], [x0 + L / 2, cy + A], [x1, cy + A], [x1, cy]], { smooth: false, w: 't', cls: 'dash', over: 0 });
        P.say(S, x1 + 12, cy + 22, 't', { size: 16, font: 'mono', ink: '2' });
        P.say(S, x1, cy - A - 12, { zh: '虚线:要拼出的方波', en: 'dashed: the square wave we want' }, { anchor: 'end', size: 14, ink: '2' });
      });
      S.at(0.8, 1.4, () => {
        formula(S, 400, 44, ['f(t) = 4/π · ( ', { t: 'sin t', ink: 'blue' }, ' + ', { t: 'sin 3t/3', ink: 'orange' }, ' + ', { t: 'sin 5t/5', ink: 'green' }, ' + ', { t: 'sin 7t/7', ink: 'violet' }, ' + … )'], { anchor: 'middle', size: 18 });
        P.say(S, 400, 74, { zh: '方波 = 一串正弦波叠起来:频率 1、3、5、7 倍,频率越高越小', en: 'a square wave = sines stacked up: 1, 3, 5, 7 times the frequency, each smaller' }, { anchor: 'middle', size: 15, ink: '2' });
      });
      // the circles: each one turns relative to its parent, so circle k ends up at k·θ
      const chain = (j, cx) => {
        if (j === K.length) {
          S.window(t0, null, () => S.raw(`<circle cx="${r1(cx)}" cy="${cy}" r="6" class="tok p-red"/>`, { kind: 'tag' }));
          return;
        }
        const rel = K[j] - (j ? K[j - 1] : 0);
        S.animate(`from{transform:rotate(0deg)}to{transform:rotate(${-360 * rel}deg)}`, t0, T, () => {
          S.at(stageT[j], 1.2, () => {
            S.circle(cx, cy, r[j], { pen: PEN[j], w: j ? 't' : undefined });
            S.line(cx, cy, cx + r[j], cy, { pen: PEN[j], w: 't', double: false });
          });
          // a filled dot has no stroke to draw on, so it waits for its circle instead
          S.window(stageT[j] + 0.2, null, () => S.dot(cx, cy, 2.6));
          chain(j + 1, cx + r[j]);
        }, { repeat: 'infinite', ease: 'linear', origin: `${r1(cx)}px ${cy}px` });
      };
      chain(0, c0[0]);
      // partial sums, one at a time; each stays until the next one replaces it
      const stageMsg = [
        { zh: '1 项:只是一条正弦', en: '1 term: just a sine' },
        { zh: '2 项:肩膀开始变平', en: '2 terms: the shoulders flatten' },
        { zh: '3 项:边更陡了', en: '3 terms: steeper edges' },
        { zh: `4 项:已经很像方波;边角冲高 ${Math.round((FR.g4 - 1) * 100)}%`, en: `4 terms: nearly square; ${Math.round((FR.g4 - 1) * 100)}% overshoot at the corners` },
      ];
      const kx = k => 410 + (k - 1) * 46, base = 452, bh = 56;
      stageT.forEach((t, j) => {
        const next = j < 3 ? stageT[j + 1] : null, pts = [];
        for (let i = 0; i <= 200; i++) { const th = i / 200 * 2 * Math.PI; pts.push([X(th), cy - part(j + 1, th)]); }
        S.at(t, 1.3, () => {
          S.window(t, next, () => S.path(pts, { pen: PEN[j], w: j === 3 ? 'b' : undefined, jitter: 0.5 }));
          const h = bh / K[j];
          S.rect(kx(K[j]) - 12, base - h, 24, h, { fill: PEN[j], gap: 3.2, w: 't' });
        });
        S.window(t + 0.3, next, () => P.say(S, x0 + L / 2, cy + 120, stageMsg[j], { anchor: 'middle', size: 16, ink: j === 3 ? undefined : '2' }), { layer: 'labels' });
        S.window(t + 1.3, null, () => P.say(S, kx(K[j]), base - bh / K[j] - 7, j ? `1/${K[j]}` : '1', { anchor: 'middle', size: 13, font: 'mono', ink: PEN[j] }), { layer: 'labels' });
      });
      // the spectrum's axis: even frequencies are there, with nothing in them
      S.at(1.4, 1, () => {
        S.line(388, base, 772, base, { w: 't', double: false });
        for (let k = 1; k <= 8; k++) {
          if (k % 2 === 0) S.circle(kx(k), base, 4, { w: 't', double: false });
          P.say(S, kx(k), base + 20, k + '×', { anchor: 'middle', size: 13, font: 'mono', ink: '2' });
        }
        P.say(S, 40, 420, { zh: '傅立叶变换算的就是右边这张表:', en: 'A Fourier transform computes this table:' }, { size: 15 });
        P.say(S, 40, 444, { zh: '有哪些频率,各占多少(偶数倍是 0)', en: 'which frequencies, and how much (even ones: 0)' }, { size: 14, ink: '2' });
        S.arrow([[322, 432], [372, 432]], { w: 't', head: 8 });
      });
      // the outermost point's height, carried to the right on the same clock
      const tipY = th => cy - part(4, th), keysT = [], keysG = [];
      for (let i = 0; i <= N; i++) {
        const th = i / N * 2 * Math.PI, t = t0 + i / N * T;
        keysT.push([t, X(th) - x1, tipY(th) - cy]);
        keysG.push([t, 0, tipY(th) - cy]);
      }
      S.window(t0, null, () => {
        S.track(keysG, () => S.raw(`<line x1="330" y1="${cy}" x2="${x1 + 8}" y2="${cy}" class="ln w-h dash p-red"/>`, { kind: 'tag' }), { repeat: 'infinite' });
        S.track(keysT, () => S.raw(`<circle cx="${x1}" cy="${cy}" r="6" class="tok p-red"/>`, { kind: 'tag' }), { repeat: 'infinite' });
      });
      S.at(t0 + T - 0.8, 0.8, () => P.say(S, 772, 108, { zh: '红点转一圈 = 方波走完一个周期', en: 'one turn = one period of the wave' }, { anchor: 'end', size: 14, ink: 'red' }));
    },
  },
  {
    id: 'math-lagrange-interp', cat: 'math', w: 800, h: 480, seed: 63, motion: true,
    title: { zh: '拉格朗日插值 · 先造「开关」,再加权加起来', en: 'Lagrange interpolation · build switches, then add them up' },
    desc: {
      zh: `四个点,找一条穿过它们的曲线。先给每个点造一个「开关」曲线:在自己那点等于 1,在其余三点等于 0。再各自乘上那点的高度加起来——在任何一个点上,只有它自己的开关是 1,所以和正好是那点的高度。展开就是一个三次多项式 L(x) = ${LI.coef.map((c, k) => (k ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + Math.abs(c).toFixed(2) + (k ? 'x' + (k > 1 ? (k === 2 ? '²' : '³') : '') : '')).join('')},系数由代码展开算出;把四个点代回展开式,最大误差 ${LI.worst.toExponential(0)}(浮点舍入)。`,
      en: `Four points; find a curve through all of them. First build a "switch" curve for each point: 1 at its own point, 0 at the other three. Multiply each by its point's height and add. At any point only its own switch is on, so the sum is exactly that height. Expanded, it is the cubic L(x) = ${LI.coef.map((c, k) => (k ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + Math.abs(c).toFixed(2) + (k ? 'x' + (k > 1 ? (k === 2 ? '²' : '³') : '') : '')).join('')}; the coefficients are expanded in code; put back into it, the four points are off by at most ${LI.worst.toExponential(0)} (floating-point rounding).`,
    },
    draw(S, P) {
      const { xs, ys, PEN, ell, L, coef } = LI;
      const lo = -0.1, hi = 4.1, samples = [];
      for (let i = 0; i <= 120; i++) samples.push(lo + (hi - lo) * i / 120);
      // left panel: the switches ℓ_i (value 1 at y1, 0 at y0)
      const lx = x => 60 + (x - lo) / (hi - lo) * 300, ly0 = 300, ly = v => ly0 - v * 100;
      // right panel: y_i·ℓ_i and their sum; the y range comes from the curves themselves
      let vmin = 0, vmax = 0;
      samples.forEach(x => { vmax = Math.max(vmax, L(x)); xs.forEach((_, i) => { const v = ys[i] * ell(i, x); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }); });
      const rx = x => 460 + (x - lo) / (hi - lo) * 310, rTop = 150, rBot = 390, ry = v => rBot - (v - vmin) / (vmax - vmin) * (rBot - rTop);
      S.at(0, 1.2, () => {
        S.line(50, ly0, 372, ly0, { w: 't', double: false });
        S.line(50, ly(1), 372, ly(1), { w: 'h', double: false, cls: 'dash' });
        S.line(450, ry(0), 782, ry(0), { w: 't', double: false });
        xs.forEach((x, i) => {
          S.line(lx(x), ly(1.25), lx(x), ly0 + 54, { w: 'h', double: false, cls: 'dash' });
          S.line(rx(x), rTop - 6, rx(x), ry(0) + 6, { w: 'h', double: false, cls: 'dash' });
        });
        P.say(S, 44, ly(1) + 5, '1', { anchor: 'end', size: 14, font: 'mono', ink: '2' });
        P.say(S, 44, ly0 + 5, '0', { anchor: 'end', size: 14, font: 'mono', ink: '2' });
      });
      S.at(0.6, 1.2, () => {
        xs.forEach((x, i) => formula(S, lx(x), ly0 + 72, ['x', sub(String(i))], { anchor: 'middle', size: 15, ink: '2' }));
        P.say(S, 210, 128, { zh: '① 给每个点造一个开关', en: '① a switch for each point' }, { anchor: 'middle', size: 16 });
        P.say(S, 615, 128, { zh: '② 乘上那点的高度,再加起来', en: '② times the point\'s height, then add' }, { anchor: 'middle', size: 16 });
        xs.forEach((x, i) => {
          S.circle(rx(x), ry(ys[i]), 6.5, { fill: 'red', style: 'wash', washCls: 'half', w: 't' });
          // label beside each point, on the side the curves leave free
          const at = [[-10, 22, 'end'], [-8, -16, 'end'], [8, 30, 'start'], [-12, -10, 'end']][i];
          P.say(S, rx(x) + at[0], ry(ys[i]) + at[1], `(${x}, ${ys[i]})`, { size: 13, font: 'mono', anchor: at[2], ink: '2' });
        });
      });
      S.at(1.4, 1.6, () => {
        formula(S, 400, 44, ['L(x) = ', { t: 'y', ink: 'blue' }, { t: '0', sub: true, ink: 'blue' }, { t: 'ℓ', ink: 'blue' }, { t: '0', sub: true, ink: 'blue' }, ' + ', { t: 'y', ink: 'orange' }, { t: '1', sub: true, ink: 'orange' }, { t: 'ℓ', ink: 'orange' }, { t: '1', sub: true, ink: 'orange' }, ' + ', { t: 'y', ink: 'green' }, { t: '2', sub: true, ink: 'green' }, { t: 'ℓ', ink: 'green' }, { t: '2', sub: true, ink: 'green' }, ' + ', { t: 'y', ink: 'violet' }, { t: '3', sub: true, ink: 'violet' }, { t: 'ℓ', ink: 'violet' }, { t: '3', sub: true, ink: 'violet' }], { anchor: 'middle', size: 19 });
        formula(S, 400, 82, ['ℓ', sub('i'), '(x) = Π ', '(x − x', sub('j'), ') / (x', sub('i'), ' − x', sub('j'), ')   j ≠ i'], { anchor: 'middle', size: 16, ink: '2' });
      });
      const t0 = 3.2, per = 2.2;
      xs.forEach((xi, i) => {
        const t = t0 + i * per, next = i < 3 ? t0 + (i + 1) * per : t0 + 4 * per;
        S.at(t, 1.4, () => {
          S.path(samples.map(x => [lx(x), ly(ell(i, x))]), { pen: PEN[i], jitter: 0.5 });
          S.path(samples.map(x => [rx(x), ry(ys[i] * ell(i, x))]), { pen: PEN[i], w: 't', jitter: 0.5 });
        });
        S.window(t + 1.1, null, () => S.dot(lx(xi), ly(1), 5, { pen: PEN[i] }));
        S.at(t + 1.1, 0.6, () => {
          xs.forEach((xj, j) => { if (j !== i) S.circle(lx(xj), ly0, 5, { w: 'h', pen: PEN[i], double: false }); });
        });
        const peakX = samples.reduce((b, x) => (x >= xs[0] && x <= xs[3] && ell(i, x) > ell(i, b) ? x : b), xi);
        S.window(t + 1.1, null, () => formula(S, lx(peakX) + (i === 3 ? -14 : 12), ly(1) - 14, [{ t: 'ℓ', ink: PEN[i] }, { t: String(i), sub: true, ink: PEN[i] }], { size: 16, anchor: i === 3 ? 'end' : 'start' }), { layer: 'labels' });
        S.window(t + 0.4, next, () => P.say(S, 210, 414, { zh: `第 ${i + 1} 个开关:在自己那点是 1,另外三点是 0`, en: `switch ${i + 1}: 1 at its own point, 0 at the other three` }, { anchor: 'middle', size: 15, ink: PEN[i] }), { layer: 'labels' });
      });
      // the sum: one curve through all four points
      const ts = t0 + 4 * per;
      S.at(ts, 1.8, () => S.path(samples.map(x => [rx(x), ry(L(x))]), { w: 'b', jitter: 0.5 }));
      S.at(ts + 1.8, 1.2, () => xs.forEach((x, i) => S.ring(rx(x), ry(ys[i]), 13, 13, {})));
      S.window(ts + 2.6, null, () => {
        P.say(S, 210, 414, { zh: '在每个点上,只有它自己的开关是 1,', en: 'At each point only its own switch is on,' }, { anchor: 'middle', size: 15 });
        P.say(S, 210, 438, { zh: '所以加起来正好是那个点的高度', en: 'so the sum is exactly that point\'s height' }, { anchor: 'middle', size: 15 });
        formula(S, 615, 440, coef.map((c, k) => {
          const s = (k ? (c < 0 ? ' − ' : ' + ') : 'L(x) = ' + (c < 0 ? '−' : '')) + Math.abs(c).toFixed(2) + (k ? 'x' : '') + (k === 2 ? '²' : k === 3 ? '³' : '');
          return s;
        }), { anchor: 'middle', size: 15, ink: 'red' });
        P.say(S, 615, 464, { zh: '展开就是一个普通的三次多项式', en: 'expanded: an ordinary cubic' }, { anchor: 'middle', size: 13, ink: '2' });
      }, { layer: 'labels' });
    },
  },
  {
    id: 'math-lagrange-mult', cat: 'math', w: 800, h: 480, seed: 67, motion: true,
    title: { zh: '拉格朗日乘数 · 路上的最高点,是路和等高线相切的地方', en: 'Lagrange multipliers · the highest point on a road touches a contour' },
    desc: {
      zh: `你只能走在路上(约束 g = 0),想走到路上最高的地方(目标 f)。每停一次画三支箭头:橙色 ∇f 指向山上最陡的方向,蓝色 ∇g 垂直于路,绿色是 ∇f 顺着路的那一截——只要绿色不为 0,沿路还能往上走。四次停下时两支箭头的夹角依次是 ${LM.stops.map(x => Math.round(LM.angle(x)) + '°').join('、')};最后一点是代码在路上找到的最高点,夹角 0°,等高线正好和路相切:∇f = λ∇g。`,
      en: `You may only walk on the road (constraint g = 0) and want its highest point (objective f). At each stop three arrows: orange ∇f points straight uphill, blue ∇g is perpendicular to the road, green is the part of ∇f along the road — while green is not zero you can still climb by walking on. The angle between the two arrows at the four stops: ${LM.stops.map(x => Math.round(LM.angle(x)) + '°').join(', ')}. The last stop is the highest point the code finds on the road: 0°, the contour just touches the road, ∇f = λ∇g.`,
    },
    draw(S, P) {
      const { H, ax, ay, q, road, slope, gradF, gradG, xo, angle, stops } = LM;
      // big contours run off the page: clip them to the figure, and the walker's contour
      // also to the band between the title and the legend, so it never crosses the text
      S.raw('<defs><clipPath id="g-lm-all"><rect x="0" y="0" width="800" height="480"/></clipPath>' +
        '<clipPath id="g-lm-band"><rect x="0" y="150" width="800" height="296"/></clipPath></defs>', { kind: 'tag' });
      const clipped = (fn, id = 'g-lm-all') => S.group(`<g clip-path="url(#${id})">`, fn, 'art');
      // the hill: contour ellipses, inner ones higher
      S.at(0, 1.6, () => clipped(() => {
        [195, 155, 115, 75, 35].forEach((rho, k) => S.ellipse(H[0], H[1], rho * ax, rho * ay, { w: k === 4 ? 't' : 'h', double: false }));
        S.fill(Array.from({ length: 24 }, (_, i) => [H[0] + 35 * ax * Math.cos(i / 24 * 6.283), H[1] + 35 * ay * Math.sin(i / 24 * 6.283)]), 'green', { style: 'wash', washCls: 'half' });
      }));
      S.at(1.2, 0.6, () => {
        S.poly([[H[0] - 8, H[1] + 6], [H[0], H[1] - 8], [H[0] + 8, H[1] + 6]], { w: 't', fill: 'green', style: 'wash' });
        P.say(S, H[0], H[1] - 13, { zh: '山顶', en: 'top' }, { anchor: 'middle', size: 14, ink: '2' });
      });
      // the road: a wood band with a centre line
      const rp = []; for (let x = 30; x <= 790; x += 20) rp.push([x, road(x)]);
      const off = d => rp.map(([x, y]) => { const s = slope(x), n = Math.hypot(1, s); return [x - d * s / n, y + d / n]; });
      S.at(1.4, 1.4, () => {
        S.fill(off(-9).concat(off(9).reverse()), 'wood', { gap: 4.5 });
        S.path(off(-9), { w: 't' });
        S.path(off(9), { w: 't' });
        S.path(rp, { w: 'h', cls: 'dash', double: false });
        P.say(S, 780, road(780) + 38, { zh: '路:g(x, y) = 0', en: 'road: g(x, y) = 0' }, { anchor: 'end', size: 15, ink: '2' });
      });
      S.at(0.4, 1.2, () => {
        P.say(S, 30, 40, { zh: '只能走在路上,路上哪一点最高?', en: 'You may only walk on the road. Where is it highest?' }, { size: 20 });
        P.say(S, 30, 66, { zh: '等高线一圈套一圈,越往里越高', en: 'contours ring the hill; inner rings are higher' }, { size: 15, ink: '2' });
      });
      // legend
      S.at(2.4, 1, () => {
        S.arrow([[40, 462], [70, 462]], { pen: 'orange', head: 8 });
        P.say(S, 78, 467, { zh: '∇f:往山上最陡的方向', en: '∇f: straight uphill' }, { size: 14, ink: 'orange' });
        S.arrow([[300, 462], [330, 462]], { pen: 'blue', head: 8 });
        P.say(S, 338, 467, { zh: '∇g:垂直于路', en: '∇g: perpendicular to the road' }, { size: 14, ink: 'blue' });
        S.arrow([[548, 462], [578, 462]], { pen: 'green', head: 8 });
        P.say(S, 586, 467, { zh: '∇f 顺着路的那一截', en: 'the part of ∇f along the road' }, { size: 14, ink: 'green' });
      });
      // the walk: stop, show the arrows, walk on
      const kf = 80 / Math.hypot(...gradF(xo, road(xo))), kg = 62, t0 = 3.4, dwell = 2.6, travel = 1.1;
      const arrive = stops.map((_, i) => t0 + i * (dwell + travel));
      const keys = [], fin = [xo, road(xo)], off2 = x => [x - fin[0], road(x) - fin[1]];
      stops.forEach((x, i) => {
        keys.push([arrive[i], ...off2(x)]);
        if (i < stops.length - 1) {
          keys.push([arrive[i] + dwell, ...off2(x)]);
          for (let k = 1; k < 10; k++) { const xx = x + (stops[i + 1] - x) * k / 10; keys.push([arrive[i] + dwell + travel * k / 10, ...off2(xx)]); }
        }
      });
      S.window(arrive[0], null, () => S.track(keys, () => S.raw(`<circle cx="${r1(fin[0])}" cy="${r1(fin[1])}" r="7" class="tok p-red"/>`, { kind: 'tag' })));
      stops.forEach((x, i) => {
        const y = road(x), last = i === stops.length - 1, until = last ? null : arrive[i] + dwell;
        const f = gradF(x, y), g = gradG(x), s = slope(x), tn = Math.hypot(1, s), tx = [1 / tn, s / tn];
        const along = (f[0] * tx[0] + f[1] * tx[1]) * kf, rho = Math.sqrt(q(x, y));
        S.at(arrive[i], 0.9, () => S.window(arrive[i], until, () => {
          clipped(() => S.ellipse(H[0], H[1], rho * ax, rho * ay, { pen: 'orange', w: 't', cls: 'dash', double: false }), last ? 'g-lm-all' : 'g-lm-band');
          S.arrow([[x, y], [x + f[0] * kf, y + f[1] * kf]], { pen: 'orange', head: 10 });
          S.arrow([[x, y], [x + g[0] * kg, y + g[1] * kg]], { pen: 'blue', head: 10 });
          if (Math.abs(along) > 4) S.arrow([[x, y], [x + tx[0] * along, y + tx[1] * along]], { pen: 'green', w: 'b', head: 9 });
        }));
        S.window(arrive[i] + 0.5, until, () => P.say(S, x, y + 36, last ? { zh: '夹角 0°', en: 'angle 0°' } : { zh: `夹角 ${Math.round(angle(x))}°`, en: `angle ${Math.round(angle(x))}°` }, { anchor: 'middle', size: 15, ink: last ? 'green' : undefined }), { layer: 'labels' });
      });
      // the answer
      const tEnd = arrive[stops.length - 1];
      S.at(tEnd + 1.2, 1, () => S.ring(xo, road(xo), 22, 22, {}));
      S.window(tEnd + 1.6, null, () => {
        formula(S, 30, 116, [{ t: '∇f', ink: 'orange' }, ' = ', { t: 'λ', ink: 'violet' }, ' · ', { t: '∇g', ink: 'blue' }], { size: 24 });
        P.say(S, 30, 144, { zh: '相切:两支箭头在一条线上', en: 'tangent: the arrows line up' }, { size: 15, ink: 'green' });
        P.say(S, 30, 166, { zh: '顺着路的那一截 = 0', en: 'the part along the road = 0' }, { size: 15, ink: 'green' });
      }, { layer: 'labels' });
    },
  },
];
