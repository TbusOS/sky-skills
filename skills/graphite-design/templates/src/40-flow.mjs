// Flowcharts. The moving token walks the flow so the reader sees where "now" is.
export default [
  {
    id: 'flow-cache', cat: 'flow', w: 760, h: 420, seed: 31, motion: true,
    title: { zh: '流程图 · 缓存命中和没命中', en: 'Flowchart · cache hit and miss' },
    desc: { zh: '同一个请求走两次:第一次缓存里没有,绕远路去数据库;第二次直接命中。小圆点走的快慢就是要讲的事。时间是示意。', en: 'The same request twice: first a miss, the long way through the database; then a hit. How fast the dot moves is the point. Times are illustrative.' },
    draw(S, P) {
      let start, dec, db, put, hit, end;
      S.at(0, 0.8, () => { start = P.node(S, 30, 30, 150, 58, { zh: '收到请求', en: 'request in' }, { pen: 'blue', r: 29, size: 18 }); });
      S.at(0.8, 1, () => {
        P.decision(S, 105, 178, 180, 104, '', { pen: 'yellow' });
        P.say(S, 105, 184, { zh: '缓存里有吗?', en: 'in the cache?' }, { anchor: 'middle', size: 17 });
        dec = { x: 15, y: 126, w: 180, h: 104 };
        S.arrow([[105, 96], [105, 122]], { w: 't', head: 8 });
      });
      S.at(1.8, 1.4, () => {
        hit = P.node(S, 290, 150, 170, 58, { zh: '直接读缓存', en: 'read the cache' }, { pen: 'green', size: 17 });
        S.arrow([[198, 178], [282, 178]], { w: 't', head: 8, pen: 'green' });
        P.say(S, 240, 168, { zh: '有', en: 'yes' }, { anchor: 'middle', size: 16, ink: 'green' });
        db = P.node(S, 30, 300, 150, 58, { zh: '查数据库', en: 'query the DB' }, { pen: 'orange', size: 17 });
        S.arrow([[105, 234], [105, 292]], { w: 't', head: 8 });
        P.say(S, 128, 268, { zh: '没有', en: 'no' }, { size: 16, ink: 'orange' });
      });
      S.at(3.2, 1.2, () => {
        put = P.node(S, 260, 300, 160, 58, { zh: '写进缓存', en: 'save to cache' }, { pen: 'orange', style: 'wash', size: 17 });
        S.arrow([[186, 329], [252, 329]], { w: 't', head: 8 });
        end = P.node(S, 560, 150, 170, 58, { zh: '返回给用户', en: 'reply' }, { pen: 'blue', r: 29, size: 18 });
        S.arrow([[466, 179], [552, 179]], { w: 't', head: 8, pen: 'green' });
        S.arrow([[426, 329], [645, 329], [645, 216]], { w: 't', head: 8, smooth: false });
      });
      // token: first pass misses (slow, long way), second pass hits (fast)
      const miss = [[105, 59], [105, 178], [105, 329], [340, 329], [645, 329], [645, 179]];
      const hitp = [[105, 59], [105, 178], [375, 178], [645, 179]];
      const t0 = 4.6;
      S.track([[t0, 0, 0, 0], [t0 + 0.01, 0, 0, 1], [t0 + 0.6, 0, 119], [t0 + 1.8, 0, 270], [t0 + 3.0, 235, 270], [t0 + 4.2, 540, 270], [t0 + 4.8, 540, 120, 1], [t0 + 5.2, 540, 120, 0]], () => {
        S.raw('<circle cx="105" cy="59" r="8" class="tok tmp p-orange"/>', { kind: 'tag' });
      });
      S.track([[t0 + 5.4, 0, 0, 0], [t0 + 5.41, 0, 0, 1], [t0 + 5.8, 0, 119], [t0 + 6.3, 270, 119], [t0 + 6.8, 540, 120, 1], [t0 + 7.3, 540, 120, 0]], () => {
        S.raw('<circle cx="105" cy="59" r="8" class="tok tmp p-green"/>', { kind: 'tag' });
      });
      S.window(t0 + 4.8, null, () => P.say(S, 560, 385, { zh: '没命中:约 20 ms(示意)', en: 'miss: ~20 ms (illustrative)' }, { size: 16, ink: 'orange' }), { layer: 'labels' });
      S.window(t0 + 6.8, null, () => P.say(S, 560, 108, { zh: '命中:约 1 ms(示意)', en: 'hit: ~1 ms (illustrative)' }, { size: 16, ink: 'green' }), { layer: 'labels' });
      void miss; void hitp; void start; void dec; void db; void put; void hit; void end;
    },
  },
  {
    id: 'flow-loop', cat: 'flow', w: 760, h: 440, seed: 33, motion: true,
    title: { zh: '循环图 · 改一点,试一下,留下好的', en: 'A loop · change, try, keep what helps' },
    desc: { zh: '五步围成一圈,高亮的圈在转,中间记着第几轮。适合讲任何「反复试」的过程:训练、调参、A/B 测试。', en: 'Five steps in a ring, a highlight going round, the round number in the middle. Fits any try-again process: training, tuning, A/B tests.' },
    draw(S, P) {
      const cx = 380, cy = 220, R = 160;
      const st = [
        { zh: '改一点', en: 'change', pen: 'orange' }, { zh: '跑一次', en: 'run', pen: 'yellow' },
        { zh: '量分数', en: 'measure', pen: 'blue' }, { zh: '变好了?', en: 'better?', pen: 'violet' }, { zh: '记下来', en: 'log it', pen: 'green' },
      ];
      const pos = st.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / st.length; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
      // a dashed guide ring: dashes cannot be drawn on stroke by stroke (the draw-on
      // uses the dash pattern itself), so it fades in instead
      S.animate('from{opacity:0}to{opacity:1}', 0, 1.2, () => {
        const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
        S.path(pts, { w: 't', cls: 'dash' });
      });
      st.forEach((s, i) => S.at(1 + i * 0.5, 0.8, () => P.node(S, pos[i][0] - 64, pos[i][1] - 28, 128, 56, { zh: s.zh, en: s.en }, { pen: s.pen, r: 26, size: 19 })));
      S.at(3.6, 1, () => {
        for (let i = 0; i < st.length; i++) {
          const a0 = -Math.PI / 2 + (i + 0.32) * 2 * Math.PI / st.length, a1 = -Math.PI / 2 + (i + 0.68) * 2 * Math.PI / st.length;
          const pts = []; for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; pts.push([cx + (R + 0) * Math.cos(a), cy + (R + 0) * Math.sin(a)]); }
          S.arrow(pts, { w: 't', head: 9 });
        }
        P.say(S, 600, 300, { zh: '保留', en: 'keep' }, { size: 16, ink: 'green' });
        P.say(S, 600, 322, { zh: '或者退回', en: 'or undo' }, { size: 16, ink: '2' });
      });
      // a ring travels from step to step, 0.9 s per step, three rounds
      const keys = [], per = 0.9, t0 = 4.8;
      for (let r = 0; r < 3; r++) for (let i = 0; i < st.length; i++) {
        const t = t0 + (r * st.length + i) * per;
        keys.push([t, pos[i][0] - pos[0][0], pos[i][1] - pos[0][1]]);
        keys.push([t + per * 0.75, pos[i][0] - pos[0][0], pos[i][1] - pos[0][1]]);
      }
      keys.push([t0 + 3 * st.length * per, 0, 0]);
      S.track(keys, () => S.raw(`<ellipse cx="${pos[0][0]}" cy="${pos[0][1]}" rx="76" ry="38" class="ln rg tmp" fill="none"/>`, { kind: 'tag' }));
      for (let r = 0; r < 3; r++) S.window(t0 + r * st.length * per, r < 2 ? t0 + (r + 1) * st.length * per : null, () => {
        P.say(S, cx, cy - 4, { zh: `第 ${r + 1} 轮`, en: `round ${r + 1}` }, { anchor: 'middle', size: 30 });
        P.say(S, cx, cy + 26, { zh: r === 1 ? '没变好,退回' : '变好了,保留', en: r === 1 ? 'worse: undo' : 'better: keep' }, { anchor: 'middle', size: 16, ink: r === 1 ? 'red' : 'green' });
      }, { layer: 'labels' });
    },
  },
];
