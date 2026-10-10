// 技术框图 · 流程 — reading first: every line connects, one colour per meaning.
const L = (zh, en) => ({ zh, en });

// points around a circle, for a dot riding a loop on the clock
function ring(cx, cy, r, a0, a1, n) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }

export default [
  {
    id: 'layered-arch', cat: 'diagram', w: 1000, h: 600, seed: 31, motion: true, wide: true,
    title: L('分层架构:远淡近浓', 'Layers: far is pale, near is dark'),
    desc: L('底层基础设施画成淡墨远山,越往上墨越浓;正在讲的那一层用焦墨粗笔,加一方朱印。层次靠墨色深浅,不靠颜色。(远山是比喻)', 'Infrastructure at the bottom is a pale far ridge; each layer up is darker; the layer being explained gets burnt ink, a heavy brush and a red seal. Depth carries the hierarchy, not colour. (The far ridge is a metaphor.)'),
    draw(B, P) {
      B.at(0.2, 1.6, () => P.farHills(B, 40, 560, 920, { rows: 2, height: 70, step: 22, tone: 'qing' }), { order: 'wash-first' });
      const rows = [
        { y: 440, tone: 'dan', weight: 'light', fill: 'qing', items: [L('磁盘', 'disk'), L('网络', 'network'), L('CPU', 'CPU')], name: L('基础设施', 'infrastructure') },
        { y: 300, tone: 'zhong', weight: 'light', fill: 'qing', items: [L('数据库', 'database'), L('消息队列', 'queue'), L('缓存', 'cache')], name: L('平台', 'platform') },
        { y: 160, tone: 'nong', weight: 'heavy', fill: 'huaqing', items: [L('下单', 'checkout'), L('推荐', 'recommend'), L('搜索', 'search')], name: L('应用(正在讲)', 'app (this one)') },
      ];
      rows.forEach((r, i) => {
        B.at(1.8 + i * 1.9, 1.7, () => {
          r.items.forEach((it, k) => P.box(B, 250 + k * 230, r.y, 180, 76, { label: it, tone: r.tone, weight: r.weight, fill: r.fill, fillOpacity: i === 2 ? 0.45 : 0.6, size: 21, ink: i === 0 ? 'zhong' : 'jiao' }));
          B.text(70, r.y + 46, '', { size: 20, font: 'kai', ink: i === 2 ? 'jiao' : 'zhong', lang: r.name });
        });
      });
      B.at(7.6, 1.4, () => {
        [340, 570, 800].forEach((x, k) => {
          P.arrow(B, [[x, 438], [x, 384]], { tone: 'dan', width: 2.6, head: 9 });
          P.arrow(B, [[x, 298], [x, 244]], { tone: k === 0 ? 'nong' : 'zhong', width: 2.6, head: 9 });
        });
      });
      B.seal(908, 172, 40, '此层', { at: 9.2 });
      B.text(500, 116, '', { size: 16, anchor: 'middle', ink: 'zhong', lang: L('越近越浓:读者的眼睛先落在最深的墨上', 'Darker means nearer: the eye lands on the deepest ink first') });
    },
  },
  {
    id: 'data-flow', cat: 'diagram', w: 1000, h: 520, seed: 37, motion: true, wide: true,
    title: L('数据流:水沿渠流', 'Data flow: water in a channel'),
    desc: L('请求像水,沿渠走;分叉处是判断,命中缓存走上渠,没命中走下渠查库,两路在出口汇合。花青只代表「数据」一件事。(水渠是比喻)', 'A request flows like water along a channel; the fork is a decision — a cache hit takes the upper channel, a miss the lower one to the database; both meet at the outlet. Indigo means one thing only: data. (The channel is a metaphor.)'),
    draw(B, P) {
      const boxes = {};
      B.at(0.2, 2.2, () => {
        boxes.in = P.box(B, 40, 210, 150, 80, { label: L('请求', 'request'), weight: 'heavy', fill: 'huaqing', fillOpacity: 0.35 });
        boxes.chk = P.box(B, 270, 210, 150, 80, { label: L('校验', 'validate') });
        boxes.hit = P.box(B, 560, 80, 170, 80, { label: L('读缓存', 'read cache') });
        boxes.db = P.box(B, 560, 340, 170, 80, { label: L('查数据库', 'query DB'), tone: 'zhong' });
        boxes.out = P.box(B, 820, 210, 140, 80, { label: L('返回', 'reply'), weight: 'heavy' });
      });
      // channels: two banks in pale ink, water as an indigo wash, then slow-moving dashes
      const chans = [
        [[190, 250], [270, 250]],
        [[420, 240], [490, 200], [560, 128]],
        [[420, 262], [490, 300], [560, 372]],
        [[730, 120], [790, 180], [820, 236]],
        [[730, 380], [790, 320], [820, 266]],
      ];
      B.at(2.6, 2.4, () => {
        chans.forEach(c => {
          B.stroke(c.map(p => [p[0], p[1] - 9]), { tone: 'dan', width: 2.6, press: 'si', dry: false, wet: 0.2 });
          B.stroke(c.map(p => [p[0], p[1] + 9]), { tone: 'dan', width: 2.6, press: 'si', dry: false, wet: 0.2 });
          B.wash([...c.map(p => [p[0], p[1] - 7]), ...c.slice().reverse().map(p => [p[0], p[1] + 7])], { tone: 'huaqing', layers: 2, dir: 'flat', jitter: 2, opacity: 0.9 });
        });
      });
      B.at(5.2, 0.6, () => {
        chans.forEach(c => B.raw(`<path class="flow" d="M${c.map(p => p.join(' ')).join('L')}"/>`, { kind: 'wash', len: 30 }));
      });
      // one drop rides the hit path, one the miss path, on the same clock
      const ride = (path, t0, dur) => { const k = []; const n = path.length - 1; path.forEach((p, i) => k.push([t0 + dur * i / n, p[0], p[1]])); return k; };
      B.follow(ride([[115, 250], [270, 250], [420, 240], [560, 128], [730, 120], [820, 236], [905, 325]], 6, 3), (x, y) => B.dot(x, y, 14, { tone: 'huaqing', wet: 0.3 }));
      B.follow(ride([[115, 250], [270, 250], [420, 262], [560, 372], [730, 380], [820, 266], [930, 325]], 9.2, 3.6), (x, y) => B.dot(x, y, 14, { tone: 'nong', wet: 0.3 }));
      B.at(12.9, 1, () => {
        B.text(645, 190, '', { size: 15, anchor: 'middle', ink: 'huaqing', lang: L('命中:快', 'hit: fast') });
        B.text(645, 450, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: L('未命中:慢一些', 'miss: slower') });
      });
      B.seal(900, 420, 40, '流', { at: 13.9, kind: 'bai' });
    },
  },
  {
    id: 'login-flow', cat: 'diagram', w: 1000, h: 560, seed: 41, motion: true, wide: true,
    title: L('带判断的流程:登录', 'A flow with a decision: sign-in'),
    desc: L('判断用藤黄淡彩的菱形,是 / 否两条出口都写字;错三次锁定,用胭脂只标这一处。每个框四笔画成,线不出飞白,免得箭头断开。', 'The decision is a gamboge-washed diamond with both exits labelled; three failures lock the account, and rouge marks only that. Each box is four brush strokes; lines carry no dry brush so arrows never break.'),
    draw(B, P) {
      let a, b, d, ok, lock;
      B.at(0.2, 1.4, () => { a = P.box(B, 60, 230, 150, 76, { label: L('打开登录页', 'open sign-in') }); });
      B.at(1.7, 1.2, () => { P.arrow(B, [[210, 268], [280, 268]]); b = P.box(B, 280, 230, 150, 76, { label: L('输入密码', 'enter password') }); });
      B.at(3.0, 1.4, () => { P.arrow(B, [[430, 268], [500, 268]]); d = P.decision(B, 590, 268, 180, 120, { label: L('密码对?', 'correct?') }); });
      B.at(4.6, 1.4, () => {
        P.arrow(B, [[680, 268], [760, 268]], { label: L('是', 'yes'), dy: -12 });
        ok = P.box(B, 760, 230, 170, 76, { label: L('进入首页', 'home'), weight: 'heavy', fill: 'shilv', fillOpacity: 0.5 });
      });
      B.at(6.2, 1.8, () => {
        P.arrow(B, [[590, 328], [590, 420], [355, 420], [355, 306]], { label: L('否:再试一次', 'no: try again'), dy: 26 });
        P.arrow(B, [[590, 208], [590, 120], [700, 120]], { tone: 'yanzhi', label: L('错 3 次', '3 failures'), dy: -12, ink: 'yanzhi' });
        lock = P.box(B, 700, 82, 170, 76, { label: L('锁定 15 分钟', 'locked 15 min'), tone: 'yanzhi', fill: 'yanzhi', fillOpacity: 0.25, ink: 'yanzhi' });
      });
      B.seal(890, 460, 44, '通过', { at: 8.4 });
      void a; void b; void ok; void lock;
    },
  },
  {
    id: 'event-loop', cat: 'diagram', w: 900, h: 600, seed: 43, motion: true,
    title: L('循环:事件循环一圈', 'A loop: one turn of an event loop'),
    desc: L('一笔圆相画出循环,四站按顺序点亮:取任务、执行、处理微任务、渲染;一滴墨沿着圆走,6 秒一圈,一直转。', 'One brush circle (enso) is the loop; four stations light up in order — take a task, run it, drain microtasks, render — and an ink drop rides the circle, 6 s a turn, forever.'),
    draw(B, P) {
      const cx = 450, cy = 300, r = 190;
      B.at(0.2, 1.8, () => P.enso(B, cx, cy, r, { width: 22, from: -1.9, sweep: 6.0 }));
      const st = [[-Math.PI / 2, L('取一个任务', 'take a task')], [0, L('执行到底', 'run it')], [Math.PI / 2, L('清空微任务', 'drain microtasks')], [Math.PI, L('渲染一帧', 'render a frame')]];
      st.forEach(([a, lab], i) => {
        B.at(2.2 + i * 0.9, 0.8, () => {
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          B.dot(x, y, 26, { tone: i === 1 ? 'zhusha' : 'jiao', angle: a * 57.3 + 90 });
          const tx = cx + Math.cos(a) * (r + 74), ty = cy + Math.sin(a) * (r + 56) + 6;
          B.text(tx, ty, '', { size: 20, anchor: 'middle', ink: 'jiao', lang: lab });
        });
      });
      B.text(cx, cy - 8, '', { size: 30, anchor: 'middle', font: 'brush', ink: 'jiao', lang: L('事件循环', 'event loop') });
      B.text(cx, cy + 28, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: L('一圈 6 秒(示意)', '6 s a turn (illustrative)') });
      const keys = ring(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, 48).map((p, i) => [6 + 6 * i / 48, p[0], p[1]]);
      B.follow(keys, (x, y) => B.raw(`<circle class="k-huaqing" cx="${x}" cy="${y}" r="9" fill="currentColor" opacity="0.85"/>`, { kind: 'tag', layer: 'labels' }), { repeat: 'infinite' });
      B.seal(780, 520, 40, '圆', { at: 5.8, round: true });
    },
  },
];
