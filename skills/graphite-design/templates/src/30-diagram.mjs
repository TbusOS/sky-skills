// Block and architecture diagrams. Hand-drawn boxes and wires; one pencil per kind
// of thing (blue = where users are, orange = the part this figure is about,
// green = storage, grey = infrastructure). Labels are { zh, en }.
export default [
  {
    id: 'diagram-layers', cat: 'diagram', w: 760, h: 440, seed: 21, motion: true,
    title: { zh: '分层架构 · 一个请求往下走', en: 'Layers · one request going down' },
    desc: { zh: '四层自上而下画出来,然后一个请求沿着层往下走、带着结果回来。分层图最该讲的是「谁调谁」。', en: 'Four layers drawn top down, then one request walks down and comes back with the answer. A layer diagram is about who calls whom.' },
    draw(S, P) {
      const L = [
        { y: 24, pen: 'blue', zh: '界面层', en: 'Interface', szh: '网页 · App', sen: 'web · app' },
        { y: 130, pen: 'orange', zh: '接口层', en: 'API', szh: '鉴权 · 限流', sen: 'auth · rate limit' },
        { y: 236, pen: 'yellow', zh: '业务层', en: 'Services', szh: '下单 · 支付 · 通知', sen: 'orders · payments · mail' },
        { y: 342, pen: 'green', zh: '数据层', en: 'Data', szh: '数据库 · 缓存', sen: 'database · cache' },
      ];
      const boxes = [];
      L.forEach((l, i) => S.at(i * 0.9, 1.2, () => {
        boxes.push(P.node(S, 150, l.y, 460, 70, { zh: l.zh, en: l.en }, { pen: l.pen, sub: { zh: l.szh, en: l.sen }, size: 21 }));
      }));
      S.at(3.8, 1, () => {
        for (let i = 0; i < 3; i++) P.link(S, boxes[i], boxes[i + 1], { dx0: -150, dx1: -150, gap: 5 });
        for (let i = 3; i > 0; i--) P.link(S, boxes[i], boxes[i - 1], { dx0: 150, dx1: 150, pen: 'green', gap: 5 });
        P.say(S, 92, 230, { zh: '请求', en: 'request' }, { anchor: 'middle', size: 16, ink: '2' });
        P.say(S, 668, 230, { zh: '结果', en: 'answer' }, { anchor: 'middle', size: 16, ink: 'green' });
        S.arrow([[92, 240], [92, 300]], { w: 't', head: 8 });
        S.arrow([[668, 300], [668, 240]], { w: 't', head: 8, pen: 'green' });
      });
      const down = [[230, 4], [230, 117], [230, 223], [230, 329], [230, 380]];
      const up = [[530, 380], [530, 329], [530, 223], [530, 117], [530, 4]];
      P.token(S, down, 5, 2.4, { pen: 'orange', repeat: 'infinite', shape: 'doc' });
      P.token(S, up, 6.2, 2.4, { pen: 'green', repeat: 'infinite', shape: 'doc' });
    },
  },
  {
    id: 'diagram-web', cat: 'diagram', w: 760, h: 420, seed: 23, motion: true,
    title: { zh: '一个网站的样子 · 流量从哪来到哪去', en: 'A web service · where the traffic goes' },
    desc: { zh: '用户 → 负载均衡 → 三台服务器 → 缓存和数据库。连线上的虚线一直在走,表示这条路一直有流量。', en: 'Users → load balancer → three servers → cache and database. The moving dashes mean the path always carries traffic.' },
    draw(S, P) {
      let lb, svs = [], cache, db;
      S.at(0, 1.4, () => {
        P.person(S, 70, 250, 0.62, { pose: 'stand', shirt: 'blue', hair: 'bob' });
        P.phone(S, 118, 162, 0.5);
        P.say(S, 84, 290, { zh: '用户', en: 'users' }, { anchor: 'middle', size: 16, ink: '2' });
      });
      S.at(1.2, 1, () => { lb = P.node(S, 180, 150, 120, 70, { zh: '负载均衡', en: 'load\nbalancer' }, { pen: 'grey', size: 17 }); });
      S.at(2.1, 1.6, () => {
        [40, 160, 280].forEach((y, i) => {
          svs.push({ x: 370, y: y, w: 140, h: 64 });
          P.server(S, 400, y + 64, 0.42, { n: 2, lights: ['green', 'green'] });
          P.say(S, 470, y + 38, { zh: '服务器 ' + (i + 1), en: 'server ' + (i + 1) }, { anchor: 'middle', size: 16 });
        });
      });
      S.at(3.6, 1.6, () => {
        cache = P.node(S, 590, 60, 130, 64, { zh: '缓存', en: 'cache' }, { pen: 'orange', sub: 'Redis', subFont: 'mono', size: 18 });
        P.cylinder(S, 655, 250, 120, 70, '', { pen: 'green' });
        P.say(S, 655, 360, { zh: '数据库', en: 'database' }, { anchor: 'middle', size: 18 });
        db = { x: 595, y: 240, w: 120, h: 100 };
      });
      S.at(5, 1.4, () => {
        S.arrow([[140, 200], [174, 190]], { w: 't', head: 8 });
        svs.forEach(s => P.link(S, lb, s, { side: 'h' }));
        svs.forEach((s, i) => P.link(S, s, i < 1 ? cache : i === 1 ? cache : db, { side: 'h', pen: i === 2 ? 'green' : undefined }));
        P.link(S, svs[1], db, { side: 'h', pen: 'green' });
      });
      // traffic: dashes that keep moving along the main path (static path, CSS animation)
      S.raw('<path d="M140 205 C 220 205, 260 192, 300 192 S 350 200, 362 200" class="ln w-t p-orange flow" fill="none"/>', { kind: 'tag' });
    },
  },
  {
    id: 'diagram-soc', cat: 'diagram', w: 760, h: 480, seed: 25,
    title: { zh: '芯片里有什么 · SoC 框图', en: 'Inside a chip · an SoC block diagram' },
    desc: { zh: 'CPU、GPU、NPU 挂在同一条总线上,一起抢内存。手绘不改结构,只是让这种图没那么吓人。', en: 'CPU, GPU and NPU share one bus and compete for memory. Drawing it by hand keeps the structure and loses the intimidation.' },
    draw(S, P) {
      S.rect(30, 24, 700, 392, { r: 22, w: 'b' });
      P.say(S, 54, 56, { zh: 'SoC 芯片', en: 'SoC' }, { size: 18, ink: '2' });
      const cpu = P.node(S, 60, 80, 190, 120, { zh: 'CPU 大核 ×4\n小核 ×4', en: 'CPU 4 big\n4 little' }, { pen: 'orange', size: 18 });
      const gpu = P.node(S, 285, 80, 190, 120, { zh: 'GPU\n图形', en: 'GPU\ngraphics' }, { pen: 'blue', size: 18 });
      const npu = P.node(S, 510, 80, 190, 120, { zh: 'NPU\n神经网络', en: 'NPU\nneural nets' }, { pen: 'violet', size: 18 });
      S.rect(60, 236, 640, 34, { r: 12, fill: 'grey', style: 'wash' });
      P.say(S, 380, 259, { zh: '片上总线', en: 'on-chip bus' }, { anchor: 'middle', size: 16 });
      [cpu, gpu, npu].forEach(b => { S.line(b.x + b.w / 2 - 14, b.y + b.h + 4, b.x + b.w / 2 - 14, 232, { w: 't' }); S.line(b.x + b.w / 2 + 14, b.y + b.h + 4, b.x + b.w / 2 + 14, 232, { w: 't' }); });
      const mc = P.node(S, 60, 304, 230, 84, { zh: '内存控制器', en: 'memory controller' }, { pen: 'green', size: 17 });
      const io = P.node(S, 330, 304, 370, 84, { zh: 'USB · 显示 · 摄像头 · 网络', en: 'USB · display · camera · network' }, { pen: 'yellow', size: 16 });
      S.line(175, 274, 175, 300, { w: 't' }); S.line(515, 274, 515, 300, { w: 't' });
      S.line(160, 392, 160, 432, { w: 't' }); S.line(190, 392, 190, 432, { w: 't' });
      P.node(S, 60, 436, 230, 36, { zh: 'DRAM 内存(片外)', en: 'DRAM (off chip)' }, { pen: 'grey', style: 'wash', size: 15, r: 8 });
    },
  },
  {
    id: 'diagram-pipeline', cat: 'diagram', w: 760, h: 260, seed: 27, motion: true,
    title: { zh: '流水线 · 一关一关过', en: 'Pipeline · one gate at a time' },
    desc: { zh: '提交 → 编译 → 测试 → 审查 → 上线。打勾一个一个出现;卡在哪一关,那一格就画红叉。', en: 'Commit → build → test → review → ship. Ticks appear one by one; where it stops, that box gets a red cross.' },
    draw(S, P) {
      const st = [{ zh: '提交', en: 'commit' }, { zh: '编译', en: 'build' }, { zh: '测试', en: 'test' }, { zh: '审查', en: 'review' }, { zh: '上线', en: 'ship' }];
      const boxes = [];
      st.forEach((t, i) => S.at(i * 0.55, 0.8, () => {
        boxes.push(P.node(S, 22 + i * 148, 90, 116, 74, t, { pen: i === 4 ? 'green' : 'paper', style: i === 4 ? 'zig' : 'wash', size: 20 }));
        if (i) P.link(S, boxes[i - 1], boxes[i], { side: 'h', gap: 5, head: 8 });
      }));
      st.forEach((t, i) => S.window(3.4 + i * 0.7, null, () => {
        const b = boxes[i], cx = b.x + b.w - 14, cy = b.y + 6;
        S.circle(cx, cy, 14, { fill: 'green', style: 'wash', washCls: 'half', w: 't' });
        S.path([[cx - 7, cy], [cx - 2, cy + 6], [cx + 8, cy - 7]], { w: 't', pen: 'green', smooth: false });
      }));
      S.at(7.2, 0.8, () => P.say(S, 380, 218, { zh: '五关都过,才能上线。', en: 'All five green, then it ships.' }, { anchor: 'middle', size: 19, ink: 'green' }));
    },
  },
];
