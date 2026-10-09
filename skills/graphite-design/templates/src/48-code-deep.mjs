// Code in plain words, the serious ones: real data structures, not metaphors.
// Both figures run their algorithm here at load time (the LRU cache over a list of
// requests, fib(5) as a depth-first walk), and every caption, count and position
// comes from that run — the picture cannot disagree with the code.

// ── LRU cache: capacity 3, a fixed list of requests ──────────────────────
const LRU = { cap: 3, ops: [['put', 'A'], ['put', 'B'], ['put', 'C'], ['get', 'A'], ['put', 'D'], ['get', 'B'], ['get', 'C'], ['put', 'E']] };
// list[0] = head side (most recently used); the last one is the next to go
function runLru(cap, ops) {
  let list = [];
  const evicted = new Set(), steps = [];
  for (const [op, k] of ops) {
    const before = list.slice();
    if (op === 'get') {
      if (list.includes(k)) { list = [k].concat(list.filter(x => x !== k)); steps.push({ op, k, kind: 'hit', before, after: list.slice() }); }
      else steps.push({ op, k, kind: 'miss', wasEvicted: evicted.has(k), before, after: list.slice() });
    } else {
      let out = null;
      if (list.length === cap) { out = list[list.length - 1]; list = list.slice(0, -1); evicted.add(out); }
      list = [k].concat(list);
      steps.push({ op, k, kind: out ? 'put-evict' : 'put', out, before, after: list.slice() });
    }
  }
  return steps;
}
LRU.steps = runLru(LRU.cap, LRU.ops);
LRU.hits = LRU.steps.filter(s => s.kind === 'hit').length;
LRU.misses = LRU.steps.filter(s => s.kind === 'miss').length;
LRU.evictions = LRU.steps.filter(s => s.kind === 'put-evict').length;
LRU.firstEvict = LRU.steps.find(s => s.kind === 'put-evict');

// ── fib(5): the call tree in call order ───────────────────────────────────
const FIB_N = 5;
function fibTree(n) {
  const nodes = [];
  let leaf = 0;
  (function walk(n, depth, parent, side) {
    const node = { n, depth, parent, side, kids: [] };
    nodes.push(node);
    if (n <= 1) { node.val = n; node.x = leaf++; }
    else {
      const a = walk(n - 1, depth + 1, node, 'L'), b = walk(n - 2, depth + 1, node, 'R');
      node.kids = [a, b]; node.val = a.val + b.val; node.x = (a.x + b.x) / 2;
    }
    return node;
  })(n, 0, null, null);
  return { nodes, leaves: leaf };
}
const FIB = fibTree(FIB_N);
FIB.calls = FIB.nodes.length;
FIB.depth = Math.max(...FIB.nodes.map(d => d.depth)) + 1;
FIB.count = {}; FIB.nodes.forEach(d => { FIB.count[d.n] = (FIB.count[d.n] || 0) + 1; });
FIB.distinct = Object.keys(FIB.count).length;
FIB.root = FIB.nodes[0].val;

const PEN = { A: 'blue', B: 'green', C: 'violet', D: 'yellow', E: 'pink' };

export default [
  {
    id: 'code-lru', cat: 'code', w: 830, h: 470, seed: 61, motion: true,
    title: { zh: 'LRU 缓存 · 哈希表找得快,双向链表记先后', en: 'An LRU cache · the map finds it, the linked list keeps the order' },
    desc: {
      zh: `容量 ${LRU.cap},跑 ${LRU.ops.length} 次请求。map 一步跳到节点;用过的节点挪到链表最前,满了就从最后面淘汰。这一轮:命中 ${LRU.hits} 次、未命中 ${LRU.misses} 次、淘汰 ${LRU.evictions} 个。`,
      en: `Capacity ${LRU.cap}, ${LRU.ops.length} requests. The map jumps straight to a node; a used node moves to the front, and when full the one at the back goes. This run: ${LRU.hits} hits, ${LRU.misses} miss${LRU.misses === 1 ? '' : 'es'}, ${LRU.evictions} evicted.`,
    },
    draw(S, P) {
      const src = 'get(k) {\n  const n = map.get(k)\n  if (!n) return MISS\n  list.moveToHead(n)\n  return n.val\n}\nput(k, v) {\n  if (map.size === CAP) {\n    const old = list.popTail()\n    map.delete(old.key)\n  }\n  const n = list.addHead(k, v)\n  map.set(k, n)\n}';
      // geometry
      const NY = 262, NW = 72, NH = 56, slotX = [446, 552, 658], HEAD = { x: 356, w: 60 }, TAIL = { x: 760, w: 56 };
      const MAP = { x: 356, y: 96, w: 170, h: 64 }, mapOut = [MAP.x + MAP.w / 2, MAP.y + MAP.h + 6];
      const chipX = i => 356 + i * 58, CHIP_Y = 24;
      // time per kind of step (s) and the start of each step
      const DUR = { put: 1.7, 'put-evict': 2.5, hit: 1.9, miss: 1.5 };
      const T0 = 3.2, starts = [];
      let t = T0;
      LRU.steps.forEach(s => { starts.push(t); t += DUR[s.kind]; });
      const tEnd = t;

      // ── static parts: request strip, map box, sentinels ──
      S.at(0.6, 1.6, () => {
        LRU.ops.forEach(([op, k], i) => P.node(S, chipX(i), CHIP_Y, 54, 30, `${op} ${k}`, { pen: 'paper', style: 'wash', font: 'mono', size: 13, r: 7 }));
        P.node(S, MAP.x, MAP.y, MAP.w, MAP.h, '', { pen: 'yellow', style: 'wash', r: 10 });
        P.say(S, MAP.x + 12, MAP.y + 22, { zh: 'map(哈希表)', en: 'map (hash table)' }, { size: 14, ink: '2' });
        P.node(S, HEAD.x, NY + 8, HEAD.w, NH - 16, 'head', { pen: 'grey', style: 'wash', font: 'mono', size: 14, r: 8 });
        P.node(S, TAIL.x, NY + 8, TAIL.w, NH - 16, 'tail', { pen: 'grey', style: 'wash', font: 'mono', size: 14, r: 8 });
        slotX.forEach(x => S.rect(x, NY, NW, NH, { r: 10, cls: 'dash', w: 'h', double: false }));
        P.say(S, HEAD.x, NY - 18, { zh: '双向链表', en: 'doubly linked list' }, { size: 15, ink: '2' });
        P.say(S, slotX[0] + NW / 2, NY + NH + 30, { zh: '← 最近用过', en: '← most recent' }, { anchor: 'middle', size: 14, ink: '2' });
        P.say(S, slotX[2] + NW / 2, NY + NH + 30, { zh: '最久没用 →', en: 'least recent →' }, { anchor: 'middle', size: 14, ink: '2' });
      });
      S.at(0, 1.4, () => P.code(S, 24, 30, src, { w: 300, size: 14, lh: 25, title: 'lru.js', cursor: cursorKeys() }));
      S.at(1.6, 0.6, () => P.say(S, 24, 458, { zh: '示意:put 已有的键(改值、挪到最前)这里省略', en: 'sketch: put on an existing key (update, move to front) left out' }, { size: 13, ink: '2' }));

      // ── links between whatever is in the list (redrawn when the length changes) ──
      function links(n) {
        const boxes = [[HEAD.x, HEAD.w]].concat(slotX.slice(0, n).map(x => [x, NW])).concat([[TAIL.x, TAIL.w]]);
        for (let i = 0; i + 1 < boxes.length; i++) {
          const x0 = boxes[i][0] + boxes[i][1] + 4, x1 = boxes[i + 1][0] - 4, y = NY + NH / 2;
          S.arrow([[x0, y - 7], [x1, y - 7]], { w: 'h', head: 6, double: false });
          S.arrow([[x1, y + 7], [x0, y + 7]], { w: 'h', head: 6, double: false });
        }
      }
      const lenAt = [{ t: 0, n: 0 }];
      LRU.steps.forEach((s, i) => { if (s.after.length !== s.before.length) lenAt.push({ t: starts[i] + (s.kind === 'put-evict' ? 1.9 : 1.1), n: s.after.length }); });
      lenAt.forEach((l, i) => S.window(l.t, i + 1 < lenAt.length ? lenAt[i + 1].t : null, () => links(l.n)));

      // ── map contents (keys only: a hash map has no order, so sorted) ──
      const mapAt = [{ t: 0, keys: [] }];
      LRU.steps.forEach((s, i) => {
        const T = starts[i];
        if (s.kind === 'put-evict') mapAt.push({ t: T + 1.0, keys: s.before.filter(k => k !== s.out) });
        if (s.kind === 'put' || s.kind === 'put-evict') mapAt.push({ t: T + (s.kind === 'put' ? 1.1 : 1.9), keys: s.after.slice() });
      });
      mapAt.forEach((m, i) => S.window(m.t, i + 1 < mapAt.length ? mapAt[i + 1].t : null, () => {
        if (m.keys.length) P.say(S, MAP.x + MAP.w / 2, MAP.y + 50, m.keys.slice().sort().join('  '), { anchor: 'middle', size: 18, font: 'mono' });
      }, { layer: 'labels' }));

      // ── nodes: one group per key, keyframes in absolute slot positions ──
      const kf = {}, life = {};
      const cur = k => kf[k][kf[k].length - 1];
      function go(k, t0, t1, x, y, op) { const c = cur(k); kf[k].push([t0, c[1], c[2], c[3]], [t1, x, y, op == null ? c[3] : op]); }
      LRU.steps.forEach((s, i) => {
        const T = starts[i];
        if (s.kind === 'hit') {
          const from = s.before.indexOf(s.k);
          go(s.k, T + 0.8, T + 1.0, slotX[from], NY - 66);
          go(s.k, T + 1.05, T + 1.35, slotX[0], NY - 66);
          go(s.k, T + 1.4, T + 1.6, slotX[0], NY);
          s.before.slice(0, from).forEach((k, j) => go(k, T + 0.95, T + 1.35, slotX[j + 1], NY));
        }
        if (s.kind === 'put' || s.kind === 'put-evict') {
          let tShift = T + 0.6;
          if (s.kind === 'put-evict') { go(s.out, T + 0.6, T + 1.0, slotX[LRU.cap - 1], NY + 22, 0); life[s.out].end = T + 1.05; tShift = T + 1.4; }
          s.after.slice(1).forEach((k, j) => go(k, tShift, tShift + 0.4, slotX[j + 1], NY));
          kf[s.k] = [[tShift + 0.2, slotX[0], NY - 66, 0], [tShift + 0.25, slotX[0], NY - 66, 1], [tShift + 0.6, slotX[0], NY, 1]];
          life[s.k] = { start: tShift + 0.2, end: null };
        }
      });
      Object.keys(kf).forEach(k => {
        const last = cur(k), keys = kf[k].map(q => [q[0], q[1] - last[1], q[2] - last[2], q[3]]);
        // an evicted node is drawn where it left the list; S.window marks it "tmp" so
        // a still figure (animations off) does not show it sitting on another node
        const node = () => S.track(keys, () => P.node(S, last[1], last[2], NW, NH, k, { pen: PEN[k], font: 'mono', size: 24, r: 10 }));
        if (life[k].end) S.window(life[k].start, life[k].end, node); else node();
      });

      // ── per step: current request, map arrow, caption, result under the chip ──
      LRU.steps.forEach((s, i) => {
        const T = starts[i], next = i + 1 < starts.length ? starts[i + 1] : tEnd;
        S.window(T, next, () => S.raw(`<rect x="${chipX(i) - 3}" y="${CHIP_Y - 3}" width="60" height="36" rx="9" class="hl"/>`, { kind: 'tag' }));
        const arrowTo = (slot, ta, tb) => S.window(ta, tb, () => S.at(ta, 0.3, () => {
          const end = [slotX[slot] + NW / 2, NY - 10];
          S.arrow([mapOut, [(mapOut[0] + end[0]) / 2 + 14, (mapOut[1] + end[1]) / 2], end], { w: 't', pen: 'orange', head: 9 });
        }));
        if (s.kind === 'hit') arrowTo(s.before.indexOf(s.k), T + 0.3, T + 0.85);
        if (s.kind === 'put') arrowTo(0, T + 1.1, next);
        if (s.kind === 'put-evict') arrowTo(0, T + 1.9, next);
        if (s.kind === 'miss') S.window(T + 0.3, next, () => P.say(S, MAP.x + MAP.w + 14, MAP.y + 40, { zh: `没有 ${s.k} → MISS`, en: `no ${s.k} → MISS` }, { size: 17, ink: 'red' }), { layer: 'labels' });
        const cap = {
          put: { zh: `put ${s.k}:还有空位,${s.k} 放到最前面`, en: `put ${s.k}: room left, ${s.k} goes to the front` },
          'put-evict': { zh: `put ${s.k}:满了,先淘汰最后面的 ${s.out},再把 ${s.k} 放最前`, en: `put ${s.k}: full — drop ${s.out} at the back, ${s.k} goes in front` },
          hit: { zh: `get ${s.k}:命中,map 一步找到,挪到最前面`, en: `get ${s.k}: hit — found via the map, moved to the front` },
          miss: { zh: `get ${s.k}:未命中${s.wasEvicted ? `(${s.k} 刚才被淘汰了)` : ''}`, en: `get ${s.k}: miss${s.wasEvicted ? ` (${s.k} was evicted)` : ''}` },
        }[s.kind];
        S.window(T, next, () => P.say(S, 590, 404, cap, { anchor: 'middle', size: 17 }), { layer: 'labels' });
        const res = {
          put: [{ zh: '放入', en: 'in' }, '2'], 'put-evict': [{ zh: `淘汰 ${s.out}`, en: `out ${s.out}` }, 'red'],
          hit: [{ zh: '命中', en: 'hit' }, 'green'], miss: [{ zh: '未命中', en: 'miss' }, 'red'],
        }[s.kind];
        S.window(next - 0.2, null, () => P.say(S, chipX(i) + 27, CHIP_Y + 50, res[0], { anchor: 'middle', size: 13, ink: res[1] }), { layer: 'labels' });
      });
      S.window(tEnd, null, () => P.say(S, 590, 404, { zh: `${LRU.ops.length} 次请求:命中 ${LRU.hits} · 未命中 ${LRU.misses} · 淘汰 ${LRU.evictions}`, en: `${LRU.ops.length} requests: ${LRU.hits} hits · ${LRU.misses} miss · ${LRU.evictions} evicted` }, { anchor: 'middle', size: 18, ink: 'orange' }), { layer: 'labels' });
      S.window(tEnd + 0.4, null, () => P.say(S, 590, 436, { zh: '两样东西各管一件事:map 管「在不在、在哪」,链表管「谁最久没用」', en: 'map: is it here, and where · list: who is oldest' }, { anchor: 'middle', size: 15, ink: '2' }), { layer: 'labels' });

      // code highlight, in step with the picture (line numbers of `src`)
      function cursorKeys() {
        const c = [[0, 0, 0]];
        LRU.steps.forEach((s, i) => {
          const T = starts[i];
          if (s.kind === 'hit') c.push([T, 0], [T + 0.3, 1], [T + 0.8, 3], [T + 1.5, 4]);
          if (s.kind === 'miss') c.push([T, 0], [T + 0.3, 1], [T + 0.7, 2]);
          if (s.kind === 'put') c.push([T, 6], [T + 0.3, 7], [T + 0.6, 11], [T + 1.1, 12]);
          if (s.kind === 'put-evict') c.push([T, 6], [T + 0.3, 7], [T + 0.6, 8], [T + 1.0, 9], [T + 1.4, 11], [T + 1.9, 12]);
        });
        c.push([tEnd, 12, 0]);
        return c;
      }
    },
  },
  {
    id: 'code-callstack', cat: 'code', w: 820, h: 520, seed: 63, motion: true,
    title: { zh: `调用栈就是调用树上的一条路 · fib(${FIB_N})`, en: `The call stack is one path in the call tree · fib(${FIB_N})` },
    desc: {
      zh: `右边每个圈是一次 fib(n) 调用,按调用顺序长出来;左边的栈只装着「从根走到当前这一次」的那条路(橙色)。fib(${FIB_N}) 一共调用 ${FIB.calls} 次,栈最深 ${FIB.depth} 层;fib(2) 被算了 ${FIB.count[2]} 遍。`,
      en: `Each circle on the right is one call of fib(n), growing in call order; the stack on the left holds only the path from the root to the current call (orange). fib(${FIB_N}) makes ${FIB.calls} calls, ${FIB.depth} deep at most; fib(2) is worked out ${FIB.count[2]} times.`,
    },
    draw(S, P) {
      const src = 'function fib(n) {\n  if (n <= 1) return n\n  return fib(n - 1) + fib(n - 2)\n}';
      const CALL = 0.5, RET = 0.4, T0 = 2.4;
      // timeline: a depth-first walk, one call or one return at a time
      let t = T0;
      (function walk(d) {
        d.tCall = t; t += CALL;
        d.kids.forEach(walk);
        d.tRet = t; t += RET;
      })(FIB.nodes[0]);
      const tEnd = t;
      // tree layout from leaf order
      const X0 = 384, X1 = 790, R = 17;
      const nx = d => X0 + d.x * (X1 - X0) / (FIB.leaves - 1), ny = d => 92 + d.depth * 88;
      // stack column
      const SX = 54, SW = 240, SH = 40, sy = depth => 430 - depth * 46;

      S.at(0, 1.4, () => P.code(S, 24, 30, src, { w: 300, size: 14, lh: 28, title: 'fib.js', cursor: cursorKeys() }));
      S.at(1, 1.2, () => {
        S.line(SX - 14, 476, SX + SW + 14, 476, { w: 'b' });
        P.say(S, SX + SW / 2, 500, { zh: '调用栈(从下往上摞)', en: 'call stack (piles upward)' }, { anchor: 'middle', size: 15, ink: '2' });
        P.say(S, 590, 30, { zh: '调用树:每个圈是一次 fib(n),圈里是 n', en: 'call tree: each circle is one fib(n); the number is n' }, { anchor: 'middle', size: 15, ink: '2' });
        P.say(S, 24, 218, { zh: '栈里的帧 = 树上橙色那条路', en: 'frames on the stack = the orange path' }, { size: 16, ink: 'orange' });
      });

      FIB.nodes.forEach(d => {
        const x = nx(d), y = ny(d), base = d.n <= 1;
        // node and the edge from its parent appear when the call is made
        S.at(d.tCall, 0.35, () => {
          if (d.parent) S.line(nx(d.parent), ny(d.parent) + R + 2, x, y - R - 2, { w: 't' });
          P.node(S, x - R, y - R, 2 * R, 2 * R, String(d.n), { pen: base ? 'green' : 'sky', font: 'mono', size: 16, r: R, gap: 3.4 });
        });
        // on the stack: orange ring on the node, orange over the edge from its parent
        S.window(d.tCall, d.tRet + RET, () => {
          S.raw(`<circle cx="${x}" cy="${y}" r="${R + 5}" class="ln rg" fill="none"/>`, { kind: 'tag' });
          if (d.parent) S.raw(`<line x1="${nx(d.parent)}" y1="${ny(d.parent) + R + 2}" x2="${x}" y2="${y - R - 2}" class="ln w-b p-orange"/>`, { kind: 'tag' });
        });
        // the value it returns, kept on the tree once known
        const vx = d.kids.length ? (d.side === 'L' ? x - R - 13 : x + R + 13) : x;
        const vy = d.kids.length ? y + 5 : y + R + 19;
        const anchor = d.kids.length ? (d.side === 'L' ? 'end' : 'start') : 'middle';
        S.window(d.tRet, null, () => P.say(S, vx, vy, '=' + d.val, { anchor, size: 14, font: 'mono', ink: 'green' }), { layer: 'labels' });
        // its frame on the stack: pushed at the call, shows the answer, popped
        const keep = !d.parent;
        S.window(d.tCall, keep ? null : d.tRet + RET, () => P.node(S, SX, sy(d.depth), SW, SH, `fib(${d.n})`, { pen: base ? 'green' : 'sky', style: 'wash', font: 'mono', size: 17, r: 10 }));
        S.window(d.tRet, keep ? null : d.tRet + RET, () => P.say(S, SX + SW - 12, sy(d.depth) + 26, `= ${d.val}`, { anchor: 'end', size: 16, font: 'mono', ink: 'green' }), { layer: 'labels' });
      });

      // the repeats: same n, worked out again
      const rep = Object.keys(FIB.count).map(Number).filter(n => n >= 2 && FIB.count[n] > 1).sort((a, b) => a - b);
      S.window(tEnd + 0.2, null, () => {
        FIB.nodes.filter(d => d.n === 2).forEach(d => S.ring(nx(d), ny(d), R + 7, R + 7, {}));
      });
      const repZh = rep.map(n => `fib(${n}) 算了 ${FIB.count[n]} 遍`).join(','), repEn = rep.map(n => `fib(${n}) ${FIB.count[n]}×`).join(', ');
      // the end notes sit where the stack was: by then only fib(${FIB_N})'s frame is left
      S.window(tEnd + 0.2, null, () => P.say(S, 24, 262, { zh: `一共 ${FIB.calls} 次调用,栈最深 ${FIB.depth} 层`, en: `${FIB.calls} calls, at most ${FIB.depth} deep` }, { size: 16, ink: 'blue' }), { layer: 'labels' });
      S.window(tEnd + 0.6, null, () => {
        P.say(S, 24, 306, { zh: repZh, en: repEn }, { size: 15, ink: 'orange' });
        P.say(S, 24, 332, { zh: '→ 记下算过的结果(记忆化),', en: '→ remember each answer (memoise):' }, { size: 15, ink: 'orange' });
        P.say(S, 24, 358, { zh: `只需算 ${FIB.distinct} 个不同的 n`, en: `only ${FIB.distinct} different n to work out` }, { size: 15, ink: 'orange' });
      }, { layer: 'labels' });

      // code highlight: line 1 when a call starts (the n <= 1 check), line 2 while it
      // waits on its two calls; back to line 2 in the parent after each return
      function cursorKeys() {
        const c = [[0, 0, 0], [T0 - 0.4, 0]];
        FIB.nodes.slice().sort((a, b) => a.tCall - b.tCall).forEach(d => {
          c.push([d.tCall, 1]);
          if (d.kids.length) c.push([d.tCall + 0.25, 2]);
        });
        FIB.nodes.forEach(d => { if (d.parent) c.push([d.tRet + RET - 0.1, 2]); });   // the frame pops, the caller carries on
        c.sort((a, b) => a[0] - b[0]);
        c.push([tEnd, 2, 0]);
        return c;
      }
    },
  },
];
