// Maths and algorithms. Every number in these figures is computed here, not typed:
// the descent steps, the binary-search intervals and the sort swaps all come from
// running the actual algorithm, so the picture cannot disagree with the maths.
// binary search, run once at load so the description quotes real step counts
const BS = { arr: [3, 8, 11, 15, 19, 23, 26, 30, 34, 37, 41, 46, 52, 58, 63, 71], target: 37 };
function bsearch(arr, target) { const st = []; let lo = 0, hi = arr.length - 1; while (lo <= hi) { const mid = (lo + hi) >> 1; st.push({ lo, hi, mid }); if (arr[mid] === target) break; if (arr[mid] < target) lo = mid + 1; else hi = mid - 1; } return st; }
BS.steps = bsearch(BS.arr, BS.target).length;
BS.worst = Math.max(...BS.arr.map(v => bsearch(BS.arr, v).length));

export default [
  {
    id: 'math-gradient-descent', cat: 'math', w: 760, h: 440, seed: 51, motion: true,
    title: { zh: '梯度下降 = 蒙着眼往山下走', en: 'Gradient descent = walking downhill blindfolded' },
    desc: { zh: '每一步只看脚下有多陡,就往下坡走一步;越接近谷底越平,步子自然越小。公式里的每一项和图里同色。', en: 'Each step looks only at how steep the ground is and steps downhill; near the bottom it is flatter, so steps shrink. Each term of the formula has the colour of its part in the picture.' },
    draw(S, P) {
      // loss L(x) = a (x - m)^2, gradient 2a(x - m). On screen y grows downward, so the
      // curve is y = bottom - L(x): high loss sits high on the page, the minimum at the bottom.
      const m = 470, a = 0.0022, bottom = 330, X0 = 110, lr = 140;
      const L = x => a * (x - m) * (x - m), f = x => bottom - L(x);
      const curve = []; for (let x = 92; x <= 720; x += 12) curve.push([x, f(x)]);
      const base = bottom;
      S.at(0, 1.4, () => {
        S.line(50, base + 10, 730, base + 10, { w: 't' });
        S.path(curve, { w: 'b' });
        S.fill(curve.concat([[720, base + 10], [92, base + 10]]), 'green', { style: 'wash' });
      });
      S.at(1.2, 1.4, () => {
        S.text(232, 52, 'x', { size: 26, font: 'mono', ink: 'orange' });
        S.text(258, 52, '←', { size: 24, font: 'mono' });
        S.text(292, 52, 'x', { size: 26, font: 'mono', ink: 'orange' });
        S.text(318, 52, '−', { size: 24, font: 'mono' });
        S.text(344, 52, 'η', { size: 26, font: 'mono', ink: 'violet' });
        S.text(366, 52, '·', { size: 24, font: 'mono' });
        S.text(384, 52, "f′(x)", { size: 26, font: 'mono', ink: 'blue' });
        P.say(S, 236, 88, { zh: '位置', en: 'position' }, { size: 15, ink: 'orange' });
        P.say(S, 330, 88, { zh: '步长', en: 'step size' }, { size: 15, ink: 'violet' });
        P.say(S, 404, 88, { zh: '脚下有多陡', en: 'how steep' }, { size: 15, ink: 'blue' });
      });
      // run the algorithm: x_{k+1} = x_k - lr * f'(x_k) * (scale), f'(x) = 2a(x - m)
      const xs = [X0];
      for (let k = 0; k < 7; k++) { const x = xs[xs.length - 1]; xs.push(x - lr * 2 * a * (x - m)); }
      const t0 = 3, per = 1.1;
      xs.forEach((x, k) => {
        if (!k) return;
        const x0 = xs[k - 1];
        S.at(t0 + (k - 1) * per, per * 0.6, () => {
          // tangent at the old position (blue: the slope), then the step arrow (violet)
          const s = -2 * a * (x0 - m), dx = 34;    // screen slope dy/dx of y = bottom - L(x)
          S.line(x0 - dx, f(x0) - s * dx, x0 + dx, f(x0) + s * dx, { w: 't', pen: 'blue', double: false });
          S.arrow([[x0, f(x0) - 18], [x, f(x) - 18]], { w: 't', pen: 'violet', head: 7 });
        });
      });
      const ball = xs[xs.length - 1], keys = [[0, xs[0] - ball, f(xs[0]) - f(ball)]];
      xs.forEach((x, k) => { if (k) keys.push([t0 + (k - 1) * per + per * 0.25, keys[keys.length - 1][1], keys[keys.length - 1][2]], [t0 + (k - 1) * per + per * 0.75, x - ball, f(x) - f(ball)]); });
      S.at(2.2, 0.6, () => S.track(keys, () => S.circle(ball, f(ball) - 11, 11, { fill: 'orange', gap: 3 })));
      S.at(t0 + xs.length * per - 0.6, 0.8, () => P.say(S, m, base + 40, { zh: '谷底:导数为 0,不再移动', en: 'bottom: slope 0, no more steps' }, { anchor: 'middle', size: 17, ink: 'green' }));
    },
  },
  {
    id: 'math-binary-search', cat: 'math', w: 760, h: 360, seed: 53, motion: true,
    title: { zh: '二分查找 · 每次扔掉一半', en: 'Binary search · throw away half each time' },
    desc: { zh: `16 个排好序的数里找 37。看中间那个,比它大就扔掉左半,比它小就扔掉右半。这次 ${BS.steps} 步找到;这 16 个数里找哪一个,最多也只要 ${BS.worst} 步。`, en: `Find 37 among 16 sorted numbers. Look at the middle one; bigger, drop the left half; smaller, drop the right. Found in ${BS.steps} steps; no number in this list takes more than ${BS.worst}.` },
    draw(S, P) {
      const arr = BS.arr, target = BS.target;
      const cx = i => 40 + i * 43, cw = 38, top = 150;
      S.at(0, 1.6, () => arr.forEach((v, i) => P.node(S, cx(i), top, cw, 48, String(v), { pen: 'paper', style: 'wash', font: 'mono', size: 16, r: 6 })));
      S.at(0.8, 0.8, () => P.say(S, 40, 60, { zh: '找 37', en: 'find 37' }, { size: 26, ink: 'orange' }));
      // run it
      const steps = bsearch(arr, target);
      const t0 = 2.4, per = 1.8;
      steps.forEach((st, k) => {
        const t = t0 + k * per, last = k === steps.length - 1, until = last ? null : t + per;
        S.window(t, until, () => {
          S.raw(`<rect x="${cx(st.lo) - 6}" y="${top - 10}" width="${cx(st.hi) - cx(st.lo) + cw + 12}" height="68" rx="10" class="ln w-t p-blue" fill="none"/>`, { kind: 'tag' });
          S.ring(cx(st.mid) + cw / 2, top + 24, 28, 38, {});
        });
        S.window(t, until, () => {
          const v = arr[st.mid];
          const msg = v === target ? { zh: `第 ${k + 1} 步:中间是 ${v},找到了`, en: `step ${k + 1}: middle is ${v} — found` }
            : v < target ? { zh: `第 ${k + 1} 步:中间是 ${v},37 比它大 → 扔掉左半`, en: `step ${k + 1}: middle is ${v}, 37 is bigger → drop the left half` }
              : { zh: `第 ${k + 1} 步:中间是 ${v},37 比它小 → 扔掉右半`, en: `step ${k + 1}: middle is ${v}, 37 is smaller → drop the right half` };
          P.say(S, 380, 262, msg, { anchor: 'middle', size: 19, ink: v === target ? 'green' : undefined });
          P.say(S, 380, 296, { zh: `还剩 ${st.hi - st.lo + 1} 个`, en: `${st.hi - st.lo + 1} left` }, { anchor: 'middle', size: 16, ink: '2' });
        }, { layer: 'labels' });
        // greyed-out halves stay grey once dropped
        if (k) {
          const prev = steps[k - 1], gone = [];
          for (let i = prev.lo; i <= prev.hi; i++) if (i < st.lo || i > st.hi) gone.push(i);
          S.window(t, null, () => gone.forEach(i => S.raw(`<rect x="${cx(i)}" y="${top}" width="${cw}" height="48" rx="6" class="gone"/>`, { kind: 'tag', layer: 'labels' })), { layer: 'labels' });
        }
      });
      S.window(t0 + steps.length * per - per + 0.6, null, () => P.say(S, 380, 110, { zh: `${arr.length} 个数,${steps.length} 步`, en: `${arr.length} numbers, ${steps.length} steps` }, { anchor: 'middle', size: 18, ink: 'blue' }), { layer: 'labels' });
    },
  },
  {
    id: 'math-unit-circle', cat: 'math', w: 760, h: 360, seed: 55, motion: true,
    title: { zh: '正弦波是转圈画出来的', en: 'A sine wave is a circle, unrolled' },
    desc: { zh: '左边的点匀速转圈,它的高度一路画到右边,就是 sin 曲线。两边用同一个时钟,所以永远对得上。', en: 'The point goes round at a steady speed; its height, traced to the right, is the sine curve. Both sides run on one clock, so they always agree.' },
    draw(S, P) {
      const cx = 150, cy = 180, R = 100, x0 = 300, L = 420, T = 6;
      S.at(0, 1.4, () => {
        S.circle(cx, cy, R, { w: 't' });
        S.line(cx - R - 20, cy, cx + R + 20, cy, { w: 'h', double: false });
        S.line(cx, cy - R - 20, cx, cy + R + 20, { w: 'h', double: false });
        S.line(x0, cy, x0 + L + 10, cy, { w: 'h', double: false });
      });
      const wave = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; wave.push([x0 + i / 60 * L, cy - R * Math.sin(a)]); }
      S.at(1, 1.6, () => {
        S.path(wave, { w: 'b', pen: 'blue', jitter: 0.6 });
        P.say(S, x0 + L - 10, cy + 30, 'θ', { size: 20, font: 'mono', ink: '2' });
        P.say(S, x0 - 30, cy - R - 6, 'sin θ', { size: 18, font: 'mono', ink: 'blue' });
        P.say(S, cx, cy + R + 50, { zh: '半径 = 1', en: 'radius = 1' }, { anchor: 'middle', size: 16, ink: '2' });
      });
      const t0 = 2.8;
      // the radius turns (rotate about the centre); the tracer runs along the wave on the same clock
      S.animate('from{transform:rotate(0deg)}to{transform:rotate(-360deg)}', t0, T, () => {
        S.raw(`<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="ln w-t p-orange"/>`, { kind: 'tag' });
        S.raw(`<circle cx="${cx + R}" cy="${cy}" r="8" class="tok p-orange"/>`, { kind: 'tag' });
      }, { repeat: 'infinite', ease: 'linear', origin: `${cx}px ${cy}px` });
      // keys at equal steps of time, not of distance: S.move spaces its keyframes by path
      // length, so a tracer on a wave runs ahead on the steep parts and falls out of step
      // with the radius (2026-10-10). wave[i] sits at angle i/60 of a turn, so key i is at i/60 of T.
      const end = wave[wave.length - 1];
      S.track(wave.map((p, i) => [t0 + i / 60 * T, p[0] - end[0], p[1] - end[1]]), () => S.raw(`<circle cx="${end[0]}" cy="${end[1]}" r="8" class="tok p-blue"/>`, { kind: 'tag' }), { repeat: 'infinite' });
    },
  },
  {
    id: 'math-pythagoras', cat: 'math', w: 760, h: 440, seed: 57, motion: true,
    title: { zh: '勾股定理 · 数格子就能看出来', en: 'Pythagoras · count the squares' },
    desc: { zh: '直角边 3 和 4,各自画一个正方形:9 格加 16 格,正好等于斜边 5 上那个正方形的 25 格。', en: 'Legs 3 and 4, a square on each: 9 cells plus 16 cells is exactly the 25 cells of the square on the long side, 5.' },
    draw(S, P) {
      const u = 34, A = [250, 300], B = [250 + 4 * u, 300], C = [250, 300 - 3 * u];
      const sqA = [[C[0], C[1]], [A[0], A[1]], [A[0] - 3 * u, A[1]], [C[0] - 3 * u, C[1]]];       // on the leg of 3 (left)
      const sqB = [[A[0], A[1]], [B[0], B[1]], [B[0], B[1] + 4 * u], [A[0], A[1] + 4 * u]];       // on the leg of 4 (below)
      const dx = B[0] - C[0], dy = B[1] - C[1];
      const sqC = [[C[0], C[1]], [B[0], B[1]], [B[0] + dy, B[1] - dx], [C[0] + dy, C[1] - dx]];  // on the hypotenuse (outside)
      function grid(sq, n, pen) {
        S.fill(sq, pen, { gap: 5 });
        for (let i = 1; i < n; i++) {
          const p = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          const a1 = p(sq[0], sq[1], i / n), a2 = p(sq[3], sq[2], i / n), b1 = p(sq[0], sq[3], i / n), b2 = p(sq[1], sq[2], i / n);
          S.line(a1[0], a1[1], a2[0], a2[1], { w: 'h', double: false });
          S.line(b1[0], b1[1], b2[0], b2[1], { w: 'h', double: false });
        }
        S.poly(sq, { w: 't' });
      }
      S.at(0, 1.2, () => { S.poly([A, B, C], { w: 'b' }); S.rect(A[0], A[1] - 14, 14, 14, { w: 'h', double: false }); });
      S.at(1.2, 1.6, () => grid(sqA, 3, 'blue'));
      S.at(2.8, 1.8, () => grid(sqB, 4, 'orange'));
      S.at(4.6, 2.2, () => grid(sqC, 5, 'green'));
      S.at(6.8, 1.2, () => {
        P.say(S, 138, 256, '3² = 9', { anchor: 'end', size: 20, font: 'mono', ink: 'blue' });
        P.say(S, 398, 390, '4² = 16', { size: 20, font: 'mono', ink: 'orange' });
        P.say(S, 508, 118, '5² = 25', { size: 20, font: 'mono', ink: 'green' });
      });
      S.at(8, 1, () => {
        S.text(560, 330, '9', { size: 30, font: 'mono', ink: 'blue' });
        S.text(586, 330, '+', { size: 30, font: 'mono' });
        S.text(612, 330, '16', { size: 30, font: 'mono', ink: 'orange' });
        S.text(656, 330, '=', { size: 30, font: 'mono' });
        S.text(684, 330, '25', { size: 30, font: 'mono', ink: 'green' });
      });
    },
  },
  {
    id: 'math-bubble-sort', cat: 'math', w: 760, h: 380, seed: 59, motion: true,
    title: { zh: '冒泡排序 · 两两比较,大的往后换', en: 'Bubble sort · compare neighbours, swap the bigger back' },
    desc: { zh: '圈住的两根在比较;左边比右边高就交换。每一轮最高的那根「冒」到最后。交换顺序是真跑一遍排序算出来的。', en: 'The ringed pair is compared; if the left is taller they swap. Each pass bubbles the tallest to the end. The swaps come from running the sort.' },
    draw(S, P) {
      const vals = [5, 2, 7, 3, 6, 1, 4], n = vals.length, W = 70, X = i => 120 + i * (W + 12), base = 320, H = v => v * 32;
      // run bubble sort, record events
      const a = vals.map((v, i) => ({ v, id: i })), events = [];
      for (let p = 0; p < n - 1; p++) for (let i = 0; i < n - 1 - p; i++) {
        const swap = a[i].v > a[i + 1].v;
        events.push({ i, swap, ids: [a[i].id, a[i + 1].id] });
        if (swap) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }
      }
      const t0 = 2, per = 0.55, finalPos = {}; a.forEach((b, i) => { finalPos[b.id] = i; });
      // position of every bar over time, starting from where it begins
      const pos = vals.map((_, i) => i), keys = vals.map((_, id) => [[0, X(id) - X(finalPos[id]), 0]]);
      events.forEach((e, k) => {
        const t = t0 + k * per;
        if (!e.swap) return;
        const [l, r] = e.ids;
        [l, r].forEach(id => { const k0 = keys[id]; k0.push([t + per * 0.3, X(pos[id]) - X(finalPos[id]), 0]); });
        const pl = pos[l]; pos[l] = pos[r]; pos[r] = pl;
        [l, r].forEach(id => keys[id].push([t + per * 0.9, X(pos[id]) - X(finalPos[id]), 0]));
      });
      S.at(0, 0.6, () => S.line(100, base, 700, base, { w: 't' }));
      vals.forEach((v, id) => S.at(0.3 + id * 0.18, 0.5, () => S.track(keys[id].concat([[t0 + events.length * per, X(pos[id]) - X(finalPos[id]), 0]]), () => {
        P.node(S, X(finalPos[id]), base - H(v), W, H(v), String(v), { pen: 'blue', font: 'mono', size: 18, r: 6, opaque: false });
      })));
      // the comparison ring
      const ring = [[t0 - 0.01, 0, 0, 0]];
      events.forEach((e, k) => { const t = t0 + k * per, dx = X(e.i) - X(0); ring.push([t, dx, 0, 1], [t + per - 0.02, dx, 0, 1]); });
      ring.push([t0 + events.length * per, X(0) - X(0), 0, 0]);
      S.track(ring, () => S.raw(`<rect x="${X(0) - 8}" y="${base - 250}" width="${2 * W + 28}" height="262" rx="16" class="ln rg tmp" fill="none"/>`, { kind: 'tag' }));
      S.window(t0 + events.length * per + 0.2, null, () => P.say(S, 400, 360, { zh: `排好了:比较 ${events.length} 次,交换 ${events.filter(e => e.swap).length} 次`, en: `sorted: ${events.length} comparisons, ${events.filter(e => e.swap).length} swaps` }, { anchor: 'middle', size: 18, ink: 'green' }), { layer: 'labels' });
    },
  },
];
