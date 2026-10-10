// 数学 · 算法 — every number in the picture and in the caption comes from the code below.
const L = (zh, en) => ({ zh, en });

// 刘徽割圆术: unit circle, side of the inscribed n-gon; doubling: s2n = sqrt(2 - sqrt(4 - s^2))
const LIUHUI = (() => { const out = []; let n = 6, s = 1; for (let i = 0; i < 6; i++) { out.push({ n, pi: n * s / 2 }); s = Math.sqrt(2 - Math.sqrt(4 - s * s)); n *= 2; } return out; })();
const fx = (v, d) => v.toFixed(d);

// 赵爽弦图 with a = 3, b = 4
const A = 3, Bv = 4, C = Math.hypot(A, Bv), TRI = A * Bv / 2, INNER = (Bv - A) ** 2;

// gradient descent on f(x) = 0.35 (x - 1.2)^2 + 0.25 sin(2.4 x) + 1
const f = x => 0.35 * (x - 1.2) ** 2 + 0.25 * Math.sin(2.4 * x) + 1;
const df = x => 0.7 * (x - 1.2) + 0.6 * Math.cos(2.4 * x);
const GD = (() => { const s = []; let x = -2.6; for (let i = 0; i < 40; i++) { s.push(x); const g = df(x); if (Math.abs(g) < 0.02) break; x -= 0.45 * g; } return s; })();

// bubble sort, every state after a swap
const BUBBLE = (() => { const a = [5, 2, 8, 1, 6, 3], st = [a.slice()], sw = []; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - 1 - i; j++) if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; st.push(a.slice()); sw.push(j); } return { st, sw }; })();

export default [
  {
    id: 'liuhui-pi', cat: 'math', w: 1000, h: 600, seed: 59, motion: true, wide: true,
    title: L('刘徽割圆术:边数翻倍逼近 π', 'Liu Hui: doubling the sides to close in on π'),
    desc: L(`圆里先画正六边形,半周长是 ${fx(LIUHUI[0].pi, 0)};每次把边数翻一倍:12 边 ${fx(LIUHUI[1].pi, 4)},24 边 ${fx(LIUHUI[2].pi, 4)},……,${LIUHUI[5].n} 边 ${fx(LIUHUI[5].pi, 5)}。数由同一段代码算出(边长 s₂ₙ = √(2 − √(4 − sₙ²)))。`, `Start with a hexagon inside the circle: half its perimeter is ${fx(LIUHUI[0].pi, 0)}. Double the sides each time: 12 sides ${fx(LIUHUI[1].pi, 4)}, 24 sides ${fx(LIUHUI[2].pi, 4)} … ${LIUHUI[5].n} sides ${fx(LIUHUI[5].pi, 5)}, computed by the same code.`),
    draw(B, P) {
      const cx = 300, cy = 300, r = 230;
      B.at(0.2, 1.4, () => P.enso(B, cx, cy, r, { width: 10, tone: 'dan', from: -1.57, sweep: 6.28 }));
      const tones = ['qing', 'dan', 'zhong', 'nong', 'jiao', 'jiao'];
      LIUHUI.slice(0, 5).forEach((s, i) => {
        const t0 = 1.8 + i * 1.6, pts = [];
        for (let k = 0; k <= s.n; k++) { const a = -Math.PI / 2 + k / s.n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
        // polygons drawn as one stroke per side group (≤ 12 strokes each, to stay light)
        const per = Math.max(1, s.n / 12);
        B.at(t0, 1.2, () => { for (let k = 0; k < s.n; k += per) B.stroke(pts.slice(k, k + per + 1), { tone: tones[i], width: 2.6, press: 'si', dry: false, wet: 0.1 }); });
        B.window(t0, i < 4 ? t0 + 1.6 : null, () => {
          B.text(640, 210, `${s.n}`, { size: 64, font: 'brush', ink: 'jiao' });
          B.text(760, 210, '', { size: 22, ink: 'zhong', lang: L('边', 'sides') });
          B.text(640, 290, `π ≈ ${fx(s.pi, 5)}`, { size: 34, font: 'mono', ink: 'jiao' });
        });
      });
      B.at(10, 1.4, () => {
        B.text(640, 370, '', { size: 18, ink: 'zhong', lang: L(`再翻一次:${LIUHUI[5].n} 边 π ≈ ${fx(LIUHUI[5].pi, 5)}`, `once more: ${LIUHUI[5].n} sides, π ≈ ${fx(LIUHUI[5].pi, 5)}`) });
        B.text(640, 410, '', { size: 18, ink: 'zhong', lang: L(`真值 3.14159…,差 ${fx(Math.PI - LIUHUI[5].pi, 5)}`, `true value 3.14159…, off by ${fx(Math.PI - LIUHUI[5].pi, 5)}`) });
      });
      B.text(640, 520, '', { size: 16, ink: 'zhong', lang: L('「割之弥细,所失弥少」——刘徽《九章算术注》', '"The finer the cut, the less is lost" — Liu Hui, 263 CE') });
      B.seal(900, 80, 50, '徽术', { at: 11.6, kind: 'bai' });
    },
  },
  {
    id: 'zhaoshuang', cat: 'math', w: 1000, h: 560, seed: 61, motion: true, wide: true,
    title: L('赵爽弦图:勾股定理', "Zhao Shuang's figure: the Pythagorean theorem"),
    desc: L(`勾 ${A}、股 ${Bv}。四个直角三角形围成边长为弦的大正方形,中间空出边长 ${Bv - A} 的小正方形:弦² = 4 × ${TRI} + ${INNER} = ${4 * TRI + INNER},弦 = ${C}。`, `Legs ${A} and ${Bv}. Four right triangles make a big square on the hypotenuse with a small ${Bv - A}×${Bv - A} hole: c² = 4 × ${TRI} + ${INNER} = ${4 * TRI + INNER}, so c = ${C}.`),
    draw(B, P) {
      const u = 64, ox = 140, oy = 60, s = C * u;   // big square side = c
      const P0 = [ox, oy], P1 = [ox + s, oy], P2 = [ox + s, oy + s], P3 = [ox, oy + s];
      // each triangle has its hypotenuse on one side of the big square and its right angle
      // inside: R = P + b·(cos α · along + sin α · inward), cos α = b/c, sin α = a/c.
      // The four right-angle corners are the inner square, side b − a.
      const Ps = [P0, P1, P2, P3];
      const R = Ps.map((p, i) => { const q = Ps[(i + 1) % 4], d = [(q[0] - p[0]) / s, (q[1] - p[1]) / s], nrm = [-d[1], d[0]], L2 = Bv * u;
        return [p[0] + L2 * (Bv / C * d[0] + A / C * nrm[0]), p[1] + L2 * (Bv / C * d[1] + A / C * nrm[1])]; });
      const Q = R;
      const tris = Ps.map((p, i) => [p, Ps[(i + 1) % 4], R[i]]);
      const fills = ['zheshi', 'huaqing', 'zheshi', 'huaqing'];
      B.at(0.2, 1.6, () => [[P0, P1], [P1, P2], [P2, P3], [P3, P0]].forEach(([a, b]) => B.stroke([a, b], { tone: 'nong', width: 4, press: 'si', dry: false })));
      tris.forEach((t, i) => B.at(2 + i * 0.9, 0.8, () => {
        B.wash(t, { tone: fills[i], layers: 2, dir: 'flat', jitter: 3, opacity: 0.9 });
        B.stroke([t[0], t[2]], { tone: 'jiao', width: 3, press: 'si', dry: false });
        B.stroke([t[2], t[1]], { tone: 'jiao', width: 3, press: 'si', dry: false });
      }));
      B.at(5.8, 0.8, () => B.wash(Q, { tone: 'tenghuang', layers: 2, dir: 'flat', jitter: 2, opacity: 1.3 }));
      B.at(6.8, 2.4, () => {
        B.text(600, 150, '', { size: 22, ink: 'jiao', lang: L(`勾 ${A},股 ${Bv}`, `legs ${A} and ${Bv}`) });
        B.text(600, 210, `${C}² = 4 × ${TRI} + ${INNER}`, { size: 30, font: 'mono', ink: 'jiao' });
        B.text(600, 260, '', { size: 18, ink: 'zhong', lang: L(`四个三角形各 ${TRI},中间小方 ${INNER}`, `four triangles of ${TRI}, a hole of ${INNER}`) });
        B.text(600, 320, `${C}² = ${4 * TRI + INNER}`, { size: 30, font: 'mono', ink: 'zhusha' });
        B.text(600, 400, '', { size: 16, ink: 'zhong', lang: L('赵爽注《周髀算经》,约公元 3 世纪', 'Zhao Shuang, notes on the Zhoubi Suanjing, c. 3rd century') });
      });
      B.seal(880, 450, 46, '勾股', { at: 9.4 });
    },
  },
  {
    id: 'gradient-valley', cat: 'math', w: 1000, h: 560, seed: 67, motion: true, wide: true,
    title: L('梯度下降:墨滴滚进山谷', 'Gradient descent: an ink drop rolls into the valley'),
    desc: L(`从 x = ${fx(GD[0], 1)} 出发,每步往坡度的反方向走 0.45 倍坡度;第 ${GD.length - 1} 步坡度小于 0.02,停在 x = ${fx(GD[GD.length - 1], 2)},f = ${fx(f(GD[GD.length - 1]), 3)}。曲线和每一步都由同一个函数算出。`, `Start at x = ${fx(GD[0], 1)}; each step moves 0.45 × the slope downhill. After ${GD.length - 1} steps the slope is under 0.02: x = ${fx(GD[GD.length - 1], 2)}, f = ${fx(f(GD[GD.length - 1]), 3)}. The curve and every step come from the same function.`),
    draw(B, P) {
      const X = x => 110 + (x + 2.8) * 128, Y = y => 520 - (y - 0.6) * 75;   // y up: base minus value
      const curve = []; for (let x = -2.8; x <= 3.8; x += 0.1) curve.push([X(x), Y(f(x))]);
      B.at(0.2, 2, () => {
        P.farHills(B, 60, 300, 880, { rows: 1, height: 60, tone: 'qing' });
        B.wash([[X(-2.8), 540], ...curve, [X(3.8), 540]], { tone: 'dan', layers: 3, dir: 'up', opacity: 0.8 });
        B.stroke(curve, { tone: 'nong', width: 5, press: 'zhong', dry: false, wet: 0.3 });
      }, { order: 'wash-first' });
      const keys = GD.map((x, i) => [2.6 + i * 0.5, X(x), Y(f(x)) - 12]);
      GD.forEach((x, i) => { if (i) B.at(2.6 + i * 0.5, 0.2, () => B.dot(X(x), Y(f(x)) + 6, 5, { tone: 'zhusha', angle: 90 })); });
      B.follow(keys, (x, y) => B.dot(x, y, 22, { tone: 'jiao', angle: 90 }));
      const tEnd = 2.6 + (GD.length - 1) * 0.5;
      B.at(tEnd + 0.3, 1, () => {
        B.text(X(GD[GD.length - 1]), Y(f(GD[GD.length - 1])) + 50, '', { size: 18, anchor: 'middle', ink: 'jiao', lang: L(`第 ${GD.length - 1} 步停下`, `stops after ${GD.length - 1} steps`) });
        B.text(80, 60, 'x ← x − 0.45 · f′(x)', { size: 26, font: 'mono', ink: 'jiao' });
      });
      B.seal(900, 70, 44, '下山', { at: tEnd + 1.4 });
    },
  },
  {
    id: 'bubble-bamboo', cat: 'math', w: 1000, h: 560, seed: 71, motion: true, wide: true,
    title: L('冒泡排序:竹节长短换位', 'Bubble sort: bamboo stalks trade places'),
    desc: L(`六根竹子的节数 ${BUBBLE.st[0].join('、')}。相邻两根比一比,左边高就换;一共换了 ${BUBBLE.sw.length} 次,排成 ${BUBBLE.st[BUBBLE.st.length - 1].join('、')}。每一帧都是真跑排序记下的状态。`, `Six stalks of ${BUBBLE.st[0].join(', ')} joints. Compare neighbours, swap if the left one is taller: ${BUBBLE.sw.length} swaps in all, ending ${BUBBLE.st[BUBBLE.st.length - 1].join(', ')}. Every frame is a state recorded from a real run.`),
    draw(B, P) {
      const step = 1.1, seg = 40, x0 = 200, gap = 120, base = 470;
      const stalks = (arr, hl) => arr.forEach((v, i) => {
        const x = x0 + i * gap, lit = hl != null && (i === hl || i === hl + 1);
        B.stroke([[x, base], [x, base - v * seg]], { tone: lit ? 'shilv' : 'nong', width: 16, press: 'ce', dry: false, wet: 0.2 });
        for (let k = 1; k < v; k++) B.raw(`<path class="k-jiao" d="M${x - 11} ${base - k * seg}h22" stroke="currentColor" stroke-width="3"/>`, { kind: 'tag' });
        B.text(x, base + 34, String(v), { size: 20, anchor: 'middle', font: 'mono', ink: lit ? 'shilv' : 'jiao' });
      });
      BUBBLE.st.forEach((arr, i) => {
        const t0 = 0.6 + i * step, t1 = i < BUBBLE.st.length - 1 ? t0 + step : null;
        B.window(t0, t1, () => {
          stalks(arr, i ? BUBBLE.sw[i - 1] : null);
          B.text(80, 80, '', { size: 18, ink: 'zhong', lang: L(`第 ${i} 次交换`, `swap ${i}`) });
        });
      });
      B.seal(880, 80, 44, '有序', { at: 0.6 + BUBBLE.st.length * step });
    },
  },
];
