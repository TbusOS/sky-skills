// Cast and props: the reusable characters and objects from assets/props.js,
// each shown once so a reader can see what is available before copying it.
export default [
  {
    id: 'cast-robot', cat: 'cast', w: 760, h: 300, seed: 3, motion: true,
    title: { zh: '小机器人 · 六种姿势', en: 'Little robot · six poses' },
    desc: { zh: '站、挥手、打字、思考、指向、欢呼。代表「替你干活的程序」,比画一个电脑图标好认。', en: 'Stand, wave, type, think, point, cheer. Stands for "the program doing the work" — easier to read than a computer icon.' },
    draw(S, P) {
      const poses = ['stand', 'wave', 'type', 'think', 'point', 'cheer'];
      poses.forEach((pose, i) => S.at(i * 0.9, 1.1, () => P.robot(S, 72 + i * 122, 270, 0.95, { pose })));
    },
  },
  {
    id: 'cast-people', cat: 'cast', w: 720, h: 300, seed: 5, motion: true,
    title: { zh: '人物 · 姿势和衣服可换', en: 'People · poses and clothes' },
    desc: { zh: '圆脑袋、几笔头发、弯弯的眼睛。衣服颜色只用一支彩铅,让人物在场景里好找。', en: 'Round head, a few strokes of hair, smiling eyes. One pencil for the clothes so the person is easy to find in a scene.' },
    draw(S, P) {
      const cast = [
        { pose: 'stand', shirt: 'blue', hair: 'short' }, { pose: 'wave', shirt: 'orange', hair: 'bob', pants: 'blue' },
        { pose: 'think', shirt: 'green', hair: 'pony', eyes: 'open' }, { pose: 'point', shirt: 'red', hair: 'short', pants: 'wood' },
        { pose: 'cheer', shirt: 'yellow', hair: 'bob', mouth: 'o' }, { pose: 'walk', shirt: 'violet', hair: 'short', pants: 'grey' },
      ];
      cast.forEach((o, i) => S.at(i * 0.9, 1.1, () => P.person(S, 66 + i * 117, 280, 1.15, o)));
    },
  },
  {
    id: 'cast-props', cat: 'cast', w: 760, h: 380, seed: 11,
    title: { zh: '常用物件 · 十六件', en: 'Everyday objects · sixteen' },
    desc: { zh: '屏幕、灯泡、服务器、文件、齿轮……每件只用一两支彩铅。拼场景时从这里挑。', en: 'Screen, bulb, server, file, gear… one or two pencils each. Pick from here when you build a scene.' },
    draw(S, P) {
      const row1 = 150, row2 = 330;
      P.monitor(S, 70, row1, 0.62, { screen: 'orange' });
      P.laptop(S, 190, row1 - 6, 0.62, { screen: 'sky' });
      P.phone(S, 285, row1 - 50, 0.85);
      P.plant(S, 360, row1, 1);
      P.lamp(S, 440, row1, 1.25, { on: true });
      P.mug(S, 520, row1, 1.25);
      P.books(S, 610, row1, 0.72);
      P.bulb(S, 705, row1 - 62, 0.85);
      P.server(S, 66, row2, 0.6, { n: 3, lights: ['green', 'green', 'red'] });
      P.gear(S, 165, row2 - 45, 0.95, { pen: 'grey' });
      P.doc(S, 225, row2 - 92, 0.95);
      P.magnifier(S, 335, row2 - 60, 0.8);
      P.clock(S, 430, row2 - 45, 0.95, { hour: 10, min: 10 });
      P.envelope(S, 520, row2 - 40, 0.9);
      P.cloud(S, 618, row2 - 52, 0.7);
      P.cat(S, 710, row2 - 6, 0.7);
    },
  },
];
