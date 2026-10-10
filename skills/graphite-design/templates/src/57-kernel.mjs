// Two kernel figures. Every function name, file and line below was checked in a
// mainline tree at v7.0-9887-ga43fac2b5813 (git describe); the CFS numbers come from
// running the pick-the-leftmost loop here, with the real nice-to-weight table values.
const KVER = 'v7.0-9887-ga43fac2b5813';

// ── CFS: run the scheduler loop once at load ──────────────────────────────
// weights: kernel/sched/core.c sched_prio_to_weight[] (nice -3 = 1991, 0 = 1024, 3 = 526)
// vruntime grows by delta × NICE_0_LOAD / weight: kernel/sched/fair.c calc_delta_fair()
const CFS = {
  slice: 3,   // ms of real CPU time per turn — fixed here for the picture; the kernel computes slices
  turns: 14,
  tasks: [
    { id: 'A', nice: 0, w: 1024, pen: 'blue', ink: 'blue' },
    { id: 'B', nice: 3, w: 526, pen: 'green', ink: 'green' },
    { id: 'C', nice: -3, w: 1991, pen: 'violet', ink: 'violet' },
  ],
};
(function simulate() {
  const vr = CFS.tasks.map(() => 0), runs = [];
  for (let k = 0; k < CFS.turns; k++) {
    let p = 0;
    vr.forEach((v, i) => { if (v < vr[p] - 1e-9) p = i; });          // leftmost = smallest vruntime (ties: first)
    const v0 = vr[p], v1 = v0 + CFS.slice * 1024 / CFS.tasks[p].w;
    runs.push({ k, task: p, v0, v1 });
    vr[p] = v1;
  }
  CFS.runs = runs;
  CFS.final = vr.slice();
  CFS.maxVr = Math.max(...vr);
  const W = CFS.tasks.reduce((s, t) => s + t.w, 0);
  CFS.tasks.forEach((t, i) => {
    t.n = runs.filter(r => r.task === i).length;
    t.share = Math.round(t.n / CFS.turns * 100);
    t.wshare = Math.round(t.w / W * 100);
    t.step = Math.round(CFS.slice * 1024 / t.w * 100) / 100;
  });
})();
const byShare = CFS.tasks.slice().sort((a, b) => b.w - a.w);
const shareZh = byShare.map(t => `${t.id} ${t.n} 次(${t.share}%,按权重该分 ${t.wshare}%)`).join(',');
const shareEn = byShare.map(t => `${t.id} ${t.n} turns (${t.share}%; its weight share is ${t.wshare}%)`).join(', ');

// ── read(2) on an ext4 file: the call chain (file:line = where each function is defined) ──
const RP = {
  read: { name: 'read(fd, buf, n)', sub: [{ zh: '你的程序', en: 'your program' }] },
  sys: { name: 'SYSCALL_DEFINE3(read)', sub: ['read_write.c:724'] },
  ksys: { name: 'ksys_read', sub: ['read_write.c:706'] },
  vfs: { name: 'vfs_read', sub: ['read_write.c:554'] },
  nsr: { name: 'new_sync_read', sub: ['read_write.c:483'] },
  ext4: { name: 'ext4_file_read_iter', sub: ['ext4/file.c:130'] },
  gen: { name: 'generic_file_read_iter', sub: ['filemap.c:2956'] },
  fmr: { name: 'filemap_read', sub: ['filemap.c:2768'] },
  fgp: { name: 'filemap_get_pages', sub: ['filemap.c:2667'] },
  copy: { name: 'copy_folio_to_iter', sub: ['uio.h:201'] },
  ra: { name: 'page_cache_sync_ra', sub: ['→ … → read_pages', 'readahead.c:557'] },
  e4ra: { name: 'ext4_readahead', sub: ['→ ext4_mpage_readpages', 'ext4/readpage.c:415'] },
  bio: { name: 'submit_bio', sub: ['blk-core.c:916'] },
};

// A function box: name in mono, then small grey lines (file:line, or what it calls next).
function fnBox(S, P, x, y, w, h, f, pen) {
  const b = P.node(S, x, y, w, h, '', { pen, style: 'wash', r: 10 });
  const n = 1 + f.sub.length, lh = 16, y0 = y + h / 2 - (n - 1) * lh / 2 + 5;
  P.say(S, x + w / 2, y0, f.name, { anchor: 'middle', size: 14, font: 'mono' });
  f.sub.forEach((t, i) => P.say(S, x + w / 2, y0 + (i + 1) * lh, t, { anchor: 'middle', size: 13, font: typeof t === 'string' ? 'mono' : undefined, ink: '2' }));
  return b;
}
const mid = b => [b.x + b.w / 2, b.y + b.h / 2];

// One-shot token along pts (time per hop from distance, `speed` px/s, at least `minHop` s).
// Hidden before, after, and when animations are off (class tmp). Returns the time it arrives.
function travel(S, pts, t0, speed, o) {
  o = o || {};
  const last = pts[pts.length - 1], keys = [[t0 - 0.02, pts[0][0], pts[0][1], 0], [t0, pts[0][0], pts[0][1], 1]];
  let t = t0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    t += Math.max(o.minHop || 0.16, d / speed);
    keys.push([t, pts[i][0], pts[i][1], 1]);
    if (o.waits && o.waits[i]) { t += o.waits[i]; keys.push([t, pts[i][0], pts[i][1], 1]); }
  }
  keys.push([t + 0.02, last[0], last[1], 0]);
  S.follow(keys, (x, y) => {
    if (o.shape === 'doc') S.raw(`<rect x="${x - 7}" y="${y - 9}" width="14" height="18" rx="2" class="ln w-t tok tmp p-${o.pen || 'orange'}"/>`, { kind: 'tag' });
    else S.raw(`<circle cx="${x}" cy="${y}" r="8" class="tok tmp p-${o.pen || 'orange'}"/>`, { kind: 'tag' });
  });
  return t;
}

export default [
  {
    id: 'math-cfs', cat: 'math', w: 800, h: 620, seed: 61, motion: true,
    title: { zh: 'CFS 调度器 · 谁的 vruntime 最小谁先跑', en: 'The CFS scheduler · smallest vruntime runs next' },
    desc: {
      zh: `三个任务排在一条 vruntime 数轴上,最左边(vruntime 最小)的那个上 CPU。跑的时候 vruntime 按 1024 / 权重 的倍数涨:权重大的涨得慢,很快又排回最左边。模拟 ${CFS.turns} 轮(每轮固定 ${CFS.slice} ms,示意):${shareZh}。这是 2.6.24–6.5 的 CFS 选法;6.6 起改用 EEVDF 选任务,6.8 起树改按虚拟截止时间排序,vruntime 按权重增长这条沿用至今(${KVER} 的 fair.c:1398)。`,
      en: `Three tasks sit on a vruntime number line; the leftmost (smallest vruntime) gets the CPU. While it runs, its vruntime grows by 1024 / weight per ms: heavy tasks grow slowly and are soon leftmost again. ${CFS.turns} simulated turns (a fixed ${CFS.slice} ms each, for illustration): ${shareEn}. This is how CFS picked from 2.6.24 to 6.5; since 6.6 EEVDF does the picking and since 6.8 the tree is sorted by virtual deadline, while vruntime still grows by weight (fair.c:1398 at ${KVER}).`,
    },
    draw(S, P) {
      const X0 = 96, X1 = 760, LY = 350, CY = 198, H = [30, 62, 94];
      const k = (X1 - X0) / Math.ceil(CFS.maxVr), px = v => X0 + v * k;
      const T0 = 3.4, per = 0.95, GY = 444, gw = (X1 - X0) / CFS.turns;

      // formula and the three tasks
      S.at(0, 1.4, () => {
        P.say(S, 40, 44, 'vruntime += Δt × 1024 / weight', { size: 22, font: 'mono' });
        P.say(S, 40, 70, { zh: 'Δt 实际跑了多久 · 1024 是 nice 0 的权重 · weight 是这个任务的权重', en: 'Δt real time run · 1024 is the weight of nice 0 · weight is this task\'s weight' }, { size: 14, ink: '2' });
        P.say(S, 760, 44, 'kernel/sched/fair.c', { anchor: 'end', size: 13, font: 'mono', ink: '2' });
      });
      S.at(1, 1.4, () => CFS.tasks.forEach((t, i) => {
        const x = 40 + i * 245;
        S.circle(x + 10, 98, 9, { fill: t.pen, style: 'zig', gap: 3, w: 't' });
        P.say(S, x + 28, 104, { zh: `${t.id} · nice ${t.nice} · 权重 ${t.w}`, en: `${t.id} · nice ${t.nice} · weight ${t.w}` }, { size: 15 });
        P.say(S, x + 28, 124, { zh: `每跑 ${CFS.slice} ms,vruntime +${t.step}`, en: `per ${CFS.slice} ms run: vruntime +${t.step}` }, { size: 13, ink: t.ink });
      }));
      // the CPU lane, the vruntime line, the Gantt frame
      S.at(1.8, 1.6, () => {
        S.rect(X0 - 14, CY - 26, X1 - X0 + 28, 52, { r: 14, fill: 'grey', style: 'wash' });
        P.say(S, X0 - 8, CY - 34, { zh: 'CPU 上:正在跑的任务(这时它不在树里)', en: 'on the CPU: the running task (it is out of the tree meanwhile)' }, { size: 14, ink: '2' });
        S.line(X0 - 10, LY, X1 + 16, LY, { w: 'b' });
        for (let v = 0; v <= Math.ceil(CFS.maxVr); v += 3) {
          S.line(px(v), LY - 5, px(v), LY + 5, { w: 't', double: false });
          P.say(S, px(v), LY + 24, String(v), { anchor: 'middle', size: 13, font: 'mono', ink: '2' });
        }
        P.say(S, X0 - 10, LY + 48, { zh: 'vruntime(ms)· 越往左越该跑', en: 'vruntime (ms) · further left = due sooner' }, { size: 14, ink: '2' });
        P.say(S, X0 - 10, GY - 10, { zh: `CPU 实际时间:每格 ${CFS.slice} ms(示意,真内核按权重算时间片)`, en: `real CPU time: ${CFS.slice} ms per cell (illustration; the kernel computes slices)` }, { size: 14, ink: '2' });
        S.rect(X0, GY, X1 - X0, 32, { r: 4, w: 't' });
      });

      // tokens: each task is a pin on the line, drawn where it ends; S.track walks it there
      CFS.tasks.forEach((t, i) => {
        const fx = px(CFS.final[i]), fy = LY - H[i], lift = CY - fy;
        const keys = [[0, px(0) - fx, 0]];
        CFS.runs.forEach(r => {
          if (r.task !== i) return;
          const tt = T0 + r.k * per, a = px(r.v0) - fx, b = px(r.v1) - fx;
          keys.push([tt, a, 0], [tt + 0.18, a, lift], [tt + 0.7, b, lift], [tt + 0.86, b, 0]);
        });
        S.window(2.6, null, () => S.track(keys, () => {
          S.line(fx, fy + 12, fx, LY - 2, { w: 'h', double: false });
          S.circle(fx, fy, 13, { fill: t.pen, style: 'zig', gap: 3, w: 't' });
          P.say(S, fx, fy + 5, t.id, { anchor: 'middle', size: 15, font: 'mono' });
        }));
      });
      // each turn: ring the leftmost pin, then colour one Gantt cell
      CFS.runs.forEach(r => {
        const t = T0 + r.k * per, task = CFS.tasks[r.task];
        S.window(t - 0.3, t + 0.12, () => S.ring(px(r.v0), LY - H[r.task], 22, 22, {}));
        S.at(t + 0.18, 0.52, () => {
          S.rect(X0 + r.k * gw + 2, GY + 3, gw - 4, 26, { r: 3, fill: task.pen, style: 'zig', gap: 3, w: 'h', double: false });
          P.say(S, X0 + r.k * gw + gw / 2, GY + 21, task.id, { anchor: 'middle', size: 13, font: 'mono' });
        });
      });
      S.window(T0 - 0.3, T0 + per * 3, () => P.say(S, X1 - 6, CY + 6, { zh: '圈出来的是最左边那个 → 它上 CPU', en: 'the ringed one is leftmost → it gets the CPU' }, { anchor: 'end', size: 15, ink: 'orange' }), { layer: 'labels' });

      // the tree the kernel keeps (static sketch) and the result
      S.at(2.2, 1.6, () => {
        const N = [[178, 506], [132, 540], [224, 540], [106, 574], [156, 574]];
        [[0, 1], [0, 2], [1, 3], [1, 4]].forEach(([a, b]) => S.line(N[a][0], N[a][1] + 10, N[b][0], N[b][1] - 10, { w: 't', double: false }));
        N.forEach((n, i) => S.circle(n[0], n[1], 11, { fill: i === 3 ? 'orange' : (i === 1 || i === 4 ? 'red' : 'grey'), style: i === 3 ? 'zig' : 'wash', gap: 3, w: 't' }));
        S.arrow([[48, 594], [92, 578]], { w: 't', head: 8, pen: 'orange' });
        P.say(S, 40, 610, { zh: '最左节点另外记着', en: 'leftmost cached' }, { size: 13, ink: 'orange' });
        P.say(S, 260, 516, { zh: '内核里这条数轴是一棵红黑树:', en: 'In the kernel this line is a red-black tree:' }, { size: 14 });
        P.say(S, 260, 538, { zh: '按 vruntime 从小到大排,最左节点', en: 'sorted by vruntime; the leftmost node is' }, { size: 14 });
        P.say(S, 260, 560, { zh: '单独缓存(rb_leftmost),取它不用往下找。', en: 'cached (rb_leftmost): no search to pick.' }, { size: 14 });
      });
      const tEnd = T0 + CFS.turns * per;
      S.window(tEnd, null, () => {
        P.say(S, 590, 516, { zh: `${CFS.turns} 轮:实际 · 按权重`, en: `${CFS.turns} turns: got · weight share` }, { size: 14, ink: '2' });
        byShare.forEach((t, j) => P.say(S, 590, 540 + j * 22, `${t.id}  ${String(t.share).padStart(2)}% · ${String(t.wshare).padStart(2)}%`, { size: 15, font: 'mono', ink: t.ink }));
      }, { layer: 'labels' });
      S.at(tEnd + 0.2, 0.8, () => P.say(S, 260, 604, { zh: '2.6.24–6.5 的选法;6.6 起由 EEVDF 选,vruntime 照旧按权重涨', en: 'the pick of 2.6.24–6.5; EEVDF picks since 6.6, vruntime still grows by weight' }, { size: 13, ink: '2' }));
    },
  },
  {
    id: 'diagram-read-path', cat: 'diagram', w: 800, h: 680, seed: 63, motion: true,
    title: { zh: '调用关系 · 程序读一个 ext4 文件', en: 'Who calls whom · reading an ext4 file' },
    desc: {
      zh: `read() 从系统调用一路往下:VFS → ext4 → 页缓存。页缓存里有,直接拷给程序,不碰磁盘;没有,页缓存回头调 ext4 的 readahead 去读盘,读完放进页缓存再拷。框里是函数名和定义它的文件:行号(核对的内核树 ${KVER});圆点的快慢是示意,没有实测。`,
      en: `read() goes down from the system call: VFS → ext4 → page cache. If the page cache has the data, it is copied to the program and the disk is not touched; if not, the page cache calls back into ext4's readahead to read the disk, keeps the data, then copies it. Boxes show the function and the file:line that defines it (checked at ${KVER}); the dots' speed is an illustration, not a measurement.`,
    },
    draw(S, P) {
      const c = [128, 352, 576], W = 210, G = 116;      // three columns; G = the left gutter the miss path runs down
      const band = [
        { y: 12, h: 78, zh: '用户程序', en: 'user program' },
        { y: 92, h: 82, zh: '系统调用', en: 'syscall' },
        { y: 176, h: 82, zh: 'VFS', en: 'VFS' },
        { y: 260, h: 92, zh: 'ext4', en: 'ext4' },
        { y: 354, h: 176, zh: '页缓存', en: 'page cache' },
        { y: 532, h: 88, zh: '块层', en: 'block layer' },
      ];
      const cy = i => band[i].y + band[i].h / 2;
      const row1 = band[4].y + 40, row2 = band[4].y + band[4].h - 44;   // the page cache band holds two rows
      const B = {}, box = (k, col, ymid, h, pen) => { B[k] = fnBox(S, P, c[col], ymid - h / 2, W, h, RP[k], pen); return B[k]; };
      S.at(0, 1.2, () => band.forEach((b, i) => {
        if (i) S.line(14, b.y - 1, 786, b.y - 1, { w: 'h', double: false });
        P.say(S, 16, b.y + 24, { zh: b.zh, en: b.en }, { size: 14, ink: '2' });
      }));
      S.at(1, 0.8, () => box('read', 0, cy(0), 48, 'blue'));
      S.at(1.6, 1.1, () => {
        box('sys', 0, cy(1), 48, 'grey'); box('ksys', 1, cy(1), 48, 'grey');
        P.link(S, B.read, B.sys, { side: 'v', gap: 4, head: 8 });
        P.link(S, B.sys, B.ksys, { side: 'h', gap: 4, head: 8 });
      });
      S.at(2.5, 1.1, () => {
        box('vfs', 1, cy(2), 48, 'yellow'); box('nsr', 2, cy(2), 48, 'yellow');
        P.link(S, B.ksys, B.vfs, { side: 'v', gap: 4, head: 8 });
        P.link(S, B.vfs, B.nsr, { side: 'h', gap: 4, head: 8 });
      });
      S.at(3.4, 1, () => {
        box('ext4', 2, cy(3), 48, 'wood');
        const p = P.link(S, B.nsr, B.ext4, { side: 'v', gap: 4, head: 8 });
        P.say(S, p[0][0] - 8, band[3].y - 5, 'f_op->read_iter', { anchor: 'end', size: 13, font: 'mono', ink: '2' });
      });
      S.at(4.2, 1.6, () => {
        box('gen', 2, row1, 48, 'orange'); box('fmr', 1, row1, 48, 'orange');
        box('fgp', 1, row2, 48, 'yellow'); box('copy', 2, row2, 48, 'orange');
        P.link(S, B.ext4, B.gen, { side: 'v', gap: 4, head: 8 });
        P.link(S, B.gen, B.fmr, { side: 'h', gap: 4, head: 8 });
        const a = P.link(S, B.fmr, B.fgp, { side: 'v', gap: 4, head: 8 });
        P.say(S, a[0][0] - 10, (a[0][1] + a[1][1]) / 2 + 5, { zh: '① 先查页缓存', en: '① look in the cache' }, { anchor: 'end', size: 13, ink: '2' });
        S.arrow([[B.fmr.x + W - 24, B.fmr.y + B.fmr.h + 4], [B.copy.x + 26, B.copy.y - 5]], { w: 't', head: 8 });
        P.say(S, B.copy.x + 50, (B.fmr.y + B.fmr.h + B.copy.y) / 2 + 5, { zh: '② 拷给程序', en: '② copy out' }, { size: 13, ink: '2' });
      });
      // the miss path: up into ext4 (the page cache calls the filesystem back), then down the gutter to the block layer
      S.at(6, 1.8, () => {
        box('ra', 0, row1, 62, 'orange'); box('e4ra', 0, cy(3) - 7, 62, 'wood'); box('bio', 0, cy(5), 48, 'green');
        const s0 = [B.fgp.x - 6, B.fgp.y + 18], s1 = [B.ra.x + W - 34, B.ra.y + B.ra.h + 6];
        S.arrow([s0, s1], { w: 't', head: 8, pen: 'orange' });
        P.say(S, (s0[0] + s1[0]) / 2 - 14, (s0[1] + s1[1]) / 2 + 26, { zh: '没有 → 读盘', en: 'not there → disk' }, { anchor: 'end', size: 13, ink: 'orange' });
        S.arrow([[B.ra.x + W / 2, B.ra.y - 4], [B.e4ra.x + W / 2, B.e4ra.y + B.e4ra.h + 4]], { w: 't', head: 8, pen: 'orange' });
        P.say(S, B.ra.x + W / 2 + 10, band[4].y - 8, 'aops->readahead', { size: 13, font: 'mono', ink: '2' });
        S.arrow([[B.e4ra.x - 4, cy(3) - 7], [G, cy(3) - 7], [G, cy(5)], [B.bio.x - 6, cy(5)]], { w: 't', head: 8, pen: 'orange', smooth: false });
      });
      const dx = c[1] + 70, dTop = band[5].y + 24;
      S.at(7.6, 1, () => {
        P.cylinder(S, dx, dTop, 90, 38, '', { pen: 'green' });
        P.say(S, dx + 62, dTop + 46, { zh: '磁盘', en: 'disk' }, { size: 15 });
        S.arrow([[B.bio.x + W + 6, cy(5)], [dx - 52, cy(5)]], { w: 't', head: 8, pen: 'green' });
        S.window(7.6, null, () => S.arrow([[dx, dTop - 16], [dx, B.fgp.y + B.fgp.h + 6]], { w: 't', head: 8, pen: 'green', cls: 'dash' }));
        P.say(S, dx + 62, dTop + 4, { zh: '读完放进页缓存 ↑', en: 'data goes up to the cache ↑' }, { size: 13, ink: 'green' });
      });

      // two reads: a cache hit, then a miss (speeds are an illustration)
      const down = ['read', 'sys', 'ksys', 'vfs', 'nsr', 'ext4', 'gen', 'fmr', 'fgp'].map(n => mid(B[n]));
      const back = ['copy', 'gen', 'ext4', 'nsr', 'vfs', 'ksys', 'sys', 'read'].map(n => mid(B[n]));
      const NY = 648, t0 = 9;
      const h1 = travel(S, down, t0, 520, { pen: 'orange', shape: 'doc' });
      const h2 = travel(S, [mid(B.fgp), mid(B.fmr), mid(B.copy)].concat(back.slice(1)), h1 + 0.3, 700, { pen: 'green', shape: 'doc' });
      S.window(t0, h2 + 0.6, () => P.say(S, 400, NY, { zh: '第一次:页缓存里有 → 直接拷给程序,不碰磁盘', en: 'first read: in the cache → copied straight out, no disk' }, { anchor: 'middle', size: 16, ink: 'green' }), { layer: 'labels' });
      const t1 = h2 + 0.8;
      const m1 = travel(S, down, t1, 520, { pen: 'orange', shape: 'doc' });
      const disk = [dx, dTop + 20];
      const gut = [mid(B.fgp), mid(B.ra), mid(B.e4ra), [G, cy(3) - 7], [G, cy(5)], mid(B.bio), disk];
      const m2 = travel(S, gut, m1, 260, { pen: 'orange', shape: 'doc', waits: { 6: 1.4 } });
      const m3 = travel(S, [disk, mid(B.fgp), mid(B.fmr), mid(B.copy)].concat(back.slice(1)), m2 + 0.1, 520, { pen: 'green', shape: 'doc' });
      S.window(t1, m2 - 1.4, () => P.say(S, 400, NY, { zh: '第二次:页缓存里没有 → 页缓存回头调 ext4,往下读盘', en: 'second read: not cached → the cache calls ext4, down to the disk' }, { anchor: 'middle', size: 16, ink: 'orange' }), { layer: 'labels' });
      S.window(m2 - 1.4, m2 + 0.1, () => P.say(S, 400, NY, { zh: '等磁盘……(最慢的一段)', en: 'waiting for the disk… (the slow part)' }, { anchor: 'middle', size: 16, ink: 'orange' }), { layer: 'labels' });
      S.window(m2 + 0.1, m3 + 0.4, () => P.say(S, 400, NY, { zh: '数据进了页缓存,再拷给程序;下次读就走第一条路', en: 'data is cached, then copied; the next read takes the short path' }, { anchor: 'middle', size: 16, ink: 'green' }), { layer: 'labels' });
      S.window(m3 + 0.4, null, () => {
        P.say(S, 400, NY - 6, { zh: '命中:到页缓存就回头 · 未命中:回头调 ext4,一路到块层和磁盘', en: 'hit: turn back at the page cache · miss: back into ext4, down to the disk' }, { anchor: 'middle', size: 15 });
        P.say(S, 400, NY + 18, { zh: `函数和行号核对自内核树 ${KVER}`, en: `functions and lines checked at ${KVER}` }, { anchor: 'middle', size: 13, ink: '2' });
      }, { layer: 'labels' });
    },
  },
];
