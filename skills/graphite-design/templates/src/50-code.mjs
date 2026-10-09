// Code in plain words: the code on one side, what it does on the other, and the
// current line highlighted in step with the picture. The picture is a metaphor,
// so each figure says which parts are illustration.
export default [
  {
    id: 'code-for-loop', cat: 'code', w: 760, h: 400, seed: 41, motion: true,
    title: { zh: 'for 循环 = 一个一个看过去', en: 'A for loop = look at each one in turn' },
    desc: { zh: '小机器人从左到右看每个箱子,有苹果就把计数加一。左边高亮的那一行,就是它此刻在做的事。', en: 'The robot checks each box from left to right and adds one when it finds an apple. The highlighted line is what it is doing right now.' },
    draw(S, P) {
      const apples = [1, 0, 1, 1, 0], bx = i => 420 + i * 66, floor = 318, t0 = 3.6, per = 1.5;
      const cursor = [[0, 0, 0]];
      apples.forEach((a, i) => {
        const t = t0 + i * per;
        cursor.push([t, 1], [t + 0.55, 2]);
        if (a) cursor.push([t + 0.95, 3]);
      });
      cursor.push([t0 + apples.length * per, 4], [t0 + apples.length * per + 0.6, 4, 0]);
      S.at(0, 1.6, () => P.code(S, 24, 40, 'let count = 0\nfor (const box of boxes) {\n  if (box.hasApple)\n    count++\n}', { w: 330, cursor, title: 'count.js' }));
      // the robot stands behind the row (drawn first, so the boxes cover its legs). It is
      // drawn at the last box; the track walks it there from the first.
      const last = bx(apples.length - 1) + 28, keys = [];
      apples.forEach((a, i) => { const t = t0 + i * per, dx = bx(i) + 28 - last; keys.push([t - (i ? 0.45 : 0), dx, 0], [t + per - 0.45, dx, 0]); });
      S.at(2.6, 1, () => S.track(keys, () => P.robot(S, last, floor - 14, 0.5, { pose: 'point' })));
      S.at(1.2, 2, () => {
        S.line(380, floor, 740, floor, { w: 't' });
        apples.forEach((a, i) => {
          if (a) {
            S.circle(bx(i) + 28, floor - 52, 11, { fill: 'red', w: 't', gap: 3 });
            S.path([[bx(i) + 28, floor - 63], [bx(i) + 31, floor - 70]], { w: 't', double: false });
            S.ellipse(bx(i) + 37, floor - 68, 6, 3, { fill: 'green', style: 'wash', washCls: 'half', w: 'h', double: false });
          }
          S.rect(bx(i), floor - 46, 56, 46, { fill: 'wood', style: 'wash' });
          S.line(bx(i), floor - 34, bx(i) + 56, floor - 34, { w: 'h', double: false });
        });
      });
      let n = 0;
      S.window(0, t0 + 0.95, () => P.say(S, 560, 84, 'count = 0', { anchor: 'middle', size: 30, font: 'mono' }), { layer: 'labels' });
      apples.forEach((a, i) => {
        if (!a) return;
        n++;
        const t = t0 + i * per + 0.95, next = apples.findIndex((b, j) => j > i && b);
        S.window(t, next < 0 ? null : t0 + next * per + 0.95, () => P.say(S, 560, 84, 'count = ' + n, { anchor: 'middle', size: 30, font: 'mono', ink: 'orange' }), { layer: 'labels' });
      });
      S.at(t0 + apples.length * per + 0.2, 0.8, () => P.say(S, 560, 368, { zh: '五个箱子都看过了:3 个苹果。', en: 'All five boxes checked: 3 apples.' }, { anchor: 'middle', size: 18 }));
      S.at(1.6, 0.6, () => P.say(S, 189, 262, { zh: '机器人和箱子是比喻', en: 'robot and boxes: a metaphor' }, { anchor: 'middle', size: 14, ink: '2' }));
    },
  },
  {
    id: 'code-recursion', cat: 'code', w: 760, h: 420, seed: 43, motion: true,
    title: { zh: '递归 = 一摞盘子,先摞上去再一个个拿下来', en: 'Recursion = a stack of plates, piled up then taken off' },
    desc: { zh: 'fact(4) 要等 fact(3),fact(3) 要等 fact(2)……一直摞到 fact(1) 直接给出 1,再从上往下一层层算回去。', en: 'fact(4) waits for fact(3), which waits for fact(2)… down to fact(1), which answers 1 at once; then each layer finishes on the way back.' },
    draw(S, P) {
      const t0 = 2.6, push = 0.9, pop = 1.1;
      const cursor = [[0, 0, 0], [t0, 2], [t0 + 3 * push, 1], [t0 + 3 * push + 0.6, 2], [t0 + 3 * push + 4 * pop, 2, 0]];
      S.at(0, 1.4, () => P.code(S, 24, 50, 'function fact(n) {\n  if (n === 1) return 1\n  return n * fact(n - 1)\n}', { w: 340, cursor, title: 'fact.js' }));
      S.at(0.8, 1, () => {
        S.line(396, 380, 640, 380, { w: 'b' });
        P.say(S, 518, 404, { zh: '调用栈(从下往上摞)', en: 'call stack (piles upward)' }, { anchor: 'middle', size: 15, ink: '2' });
      });
      const vals = { 4: 24, 3: 6, 2: 2, 1: 1 };
      [4, 3, 2, 1].forEach((n, k) => {
        const y = 330 - k * 62, tIn = t0 + k * push, tRet = t0 + 3 * push + (3 - k) * pop + 0.6;
        const tOut = n === 4 ? null : tRet + 0.7;
        S.window(tIn, tOut, () => {
          P.node(S, 404, y, 220, 50, `fact(${n})`, { pen: n === 1 ? 'green' : 'sky', font: 'mono', size: 19, r: 22 });
        });
        S.window(tRet, tOut, () => {
          const txt = n === 1 ? '= 1' : `= ${n} × ${vals[n - 1]} = ${vals[n]}`;
          P.say(S, 634, y + 31, txt, { size: 16, font: 'mono', ink: 'green' });
        }, { layer: 'labels' });
      });
      S.window(t0 + 4 * push + 3 * pop + 1.2, null, () => P.say(S, 194, 270, '4! = 24', { anchor: 'middle', size: 34, font: 'mono', ink: 'orange' }), { layer: 'labels' });
      S.window(t0, t0 + 3 * push + 0.6, () => P.say(S, 194, 270, { zh: '往上摞:还算不出来', en: 'piling up: cannot answer yet' }, { anchor: 'middle', size: 18, ink: '2' }), { layer: 'labels' });
      S.window(t0 + 3 * push + 0.6, t0 + 4 * push + 3 * pop + 1.2, () => P.say(S, 194, 270, { zh: '往下拿:一层层算回来', en: 'unwinding: each layer answers' }, { anchor: 'middle', size: 18, ink: 'green' }), { layer: 'labels' });
    },
  },
  {
    id: 'code-hashmap', cat: 'code', w: 760, h: 420, seed: 47, motion: true,
    title: { zh: '哈希表 = 衣帽间的号码牌', en: 'A hash map = a coat check' },
    desc: { zh: '名字进机器,出来一个号码,衣服就挂在那个格子里。下次报同一个名字,算出同一个号码,不用一格格翻。', en: 'A name goes into the machine, a number comes out, the coat goes on that hook. Same name next time, same number: no searching.' },
    draw(S, P) {
      let mach;
      S.at(0, 1.2, () => {
        S.poly([[40, 70], [150, 70], [168, 92], [150, 114], [40, 114]], { fill: 'yellow', gap: 4 });
        S.circle(56, 92, 5, { w: 't' });
        P.say(S, 108, 99, '"alice"', { anchor: 'middle', size: 17, font: 'mono' });
      });
      S.at(1, 1.4, () => {
        mach = P.node(S, 250, 52, 190, 84, 'hash( )', { pen: 'grey', font: 'mono', size: 22 });
        P.gear(S, 420, 60, 0.42, { pen: 'orange' });
        S.arrow([[176, 92], [242, 92]], { w: 't', head: 9 });
      });
      S.at(2.2, 2, () => {
        for (let i = 0; i < 8; i++) {
          const x = 70 + i * 82;
          S.rect(x, 250, 66, 120, { r: 6, fill: i === 3 ? 'orange' : 'paper', style: 'wash' });
          S.circle(x + 54, 312, 3, { w: 'h', double: false });
          P.say(S, x + 33, 280, String(i), { anchor: 'middle', size: 20, font: 'mono', ink: '2' });
        }
        P.say(S, 380, 400, { zh: '八个格子,编号 0 到 7', en: 'eight hooks, numbered 0 to 7' }, { anchor: 'middle', size: 15, ink: '2' });
      });
      // first visit: the name goes in, 3 comes out, drops into hook 3
      const t0 = 4.6;
      S.track([[t0, -240, 0, 0], [t0 + 0.01, -240, 0, 1], [t0 + 0.9, -40, 0, 1], [t0 + 1.0, -40, 0, 0]], () => S.raw('<circle cx="345" cy="92" r="9" class="tok tmp p-yellow"/>', { kind: 'tag' }));
      S.window(t0 + 1.1, t0 + 3.2, () => P.say(S, 470, 140, '→ 3', { size: 26, font: 'mono', ink: 'orange' }), { layer: 'labels' });
      S.track([[t0 + 1.4, 0, -170, 0], [t0 + 1.41, 0, -170, 1], [t0 + 2.6, 0, 0, 1]], () => {
        S.raw('<path d="M356 352 l-14 0 l-8 -30 l12 -14 l20 0 l12 14 l-8 30 z" class="ln w-t p-blue tok"/>', { kind: 'tag' });
      });
      S.window(t0 + 2.8, null, () => P.say(S, 380, 216, { zh: '第一次:算出 3,衣服挂进 3 号', en: 'first time: 3, the coat goes on hook 3' }, { anchor: 'middle', size: 17 }), { layer: 'labels' });
      // second visit: same name, same number, straight to hook 3
      const t1 = t0 + 4;
      S.window(t1, null, () => P.say(S, 470, 140, '→ 3', { size: 26, font: 'mono', ink: 'orange' }), { layer: 'labels' });
      S.window(t1 + 0.8, null, () => S.ring(349, 312, 46, 72, {}), {});
      S.window(t1 + 1.2, null, () => P.say(S, 590, 180, { zh: '再报 "alice":还是 3,直接去拿', en: 'ask for "alice": 3 again, go straight there' }, { anchor: 'middle', size: 16, ink: 'green' }), { layer: 'labels' });
      void mach;
    },
  },
];
