// 电影 · 动漫 · 短剧 — storyboards, a widescreen push-in, a character, a vertical cover.
const L = (zh, en) => ({ zh, en });

export default [
  {
    id: 'storyboard', cat: 'film', w: 1000, h: 620, seed: 211, motion: true, wide: true,
    title: L('分镜六格', 'A six-panel storyboard'),
    desc: L('一格一个镜头,从远景推到特写:远山 → 江上孤舟 → 船头人 → 斗笠下的眼 → 惊起的鹤 → 一方印收尾。格与格之间留白就是剪辑点。', 'One shot per panel, from wide to close: far hills → a lone boat → the figure at the bow → the eye under the hat → a startled crane → a seal to close. The gaps between panels are the cuts.'),
    draw(B, P) {
      const cells = [[40, 60], [355, 60], [670, 60], [40, 330], [355, 330], [670, 330]], w = 290, h = 220;
      const shots = [L('远景', 'wide'), L('全景', 'full'), L('中景', 'medium'), L('特写', 'close-up'), L('空镜', 'cutaway'), L('收', 'end')];
      cells.forEach(([x, y], i) => B.at(0.2 + i * 1.8, 1.6, () => {
        B.raw(`<rect class="card" x="${x}" y="${y}" width="${w}" height="${h}"/>`, { kind: 'tag' });
        [[[x, y], [x + w, y]], [[x + w, y], [x + w, y + h]], [[x + w, y + h], [x, y + h]], [[x, y + h], [x, y]]].forEach(sd => B.stroke(sd, { tone: 'zhong', width: 2.6, press: 'si', dry: false, wet: 0.1 }));
        if (i === 0) P.farHills(B, x + 10, y + 170, w - 20, { rows: 2, height: 50, step: 18 });
        if (i === 1) { P.water(B, x + 30, y + 160, w - 60, { lines: 3 }); P.boat(B, x + 150, y + 150, 70); }
        if (i === 2) P.boat(B, x + 130, y + 190, 200, { line: false });
        if (i === 3) { B.stroke([[x + 40, y + 70], [x + 145, y + 40], [x + 250, y + 70]], { tone: 'jiao', width: 26, press: 'zhong', dry: false }); B.stroke([[x + 100, y + 130], [x + 145, y + 118], [x + 190, y + 130]], { tone: 'jiao', width: 6, press: 'leaf', dry: false }); B.dot(x + 145, y + 128, 16, { tone: 'jiao', angle: 90 }); }
        if (i === 4) P.crane(B, x + 140, y + 140, 150);
        if (i === 5) B.text(x + w / 2, y + 130, '', { size: 44, anchor: 'middle', font: 'brush', ink: 'jiao', lang: L('终', 'The End') });
        B.text(x + 10, y + h + 22, '', { size: 14, ink: 'zhong', lang: L(`${i + 1} · ${shots[i].zh}`, `${i + 1} · ${shots[i].en}`) });
      }));
      B.seal(860, 420, 44, '剧终', { at: 11.4 });
    },
  },
  {
    id: 'cinema-pushin', cat: 'film', w: 1200, h: 520, seed: 223, motion: true, wide: true,
    title: L('宽银幕推镜', 'A widescreen push-in'),
    desc: L('2.39:1 画幅,上下黑边;画面先画完,然后镜头 6 秒慢慢推近亭中人;字幕从同一个时钟出,推到底才出第二句。', 'A 2.39:1 frame with black bars; the scene is painted first, then the camera pushes in on the figure in the pavilion over 6 s; subtitles run on the same clock, the second line only when the push ends.'),
    draw(B, P) {
      B.animate('from{transform:scale(1)}to{transform:scale(1.55)}', 5.4, 6, () => {
        B.at(0.2, 2.4, () => { P.farHills(B, 0, 330, 1200, { rows: 2, height: 80, step: 24 }); P.mountain(B, [[560, 440], [700, 300], [780, 260], [880, 330], [1000, 440]], { tone: 'dan', ridge: 'nong', cun: 6 }); }, { order: 'wash-first' });
        B.at(2.8, 2.2, () => { P.pavilion(B, 760, 400, 120); P.scholar(B, 760, 392, 50); P.pine(B, 870, 440, 150); P.water(B, 150, 420, 400, { lines: 3 }); });
      }, { origin: '760px 360px', ease: 'ease-in-out', layer: 'all' });
      B.raw('<rect class="term" x="0" y="0" width="1200" height="12"/><rect class="term" x="0" y="508" width="1200" height="12"/>', { kind: 'tag', layer: 'labels' });
      B.window(5.4, 11, () => B.text(600, 480, '', { size: 22, anchor: 'middle', font: 'song', ink: 'jiao', lang: L('他在亭中,等一个不会来的人。', 'He waits in the pavilion for someone who will not come.') }));
      B.window(11.4, null, () => B.text(600, 480, '', { size: 22, anchor: 'middle', font: 'song', ink: 'jiao', lang: L('山也在等。', 'So do the hills.') }));
      B.seal(1120, 30, 40, '镜', { at: 11.6 });
    },
  },
  {
    id: 'anime-character', cat: 'film', w: 1000, h: 600, seed: 227, motion: true, wide: true,
    title: L('水墨动漫角色设定', 'An ink-wash anime character sheet'),
    desc: L('角色设定一页:正面、侧面、背影三个剪影,都用同样几笔(斗笠、披风、剑);色卡只有焦墨、淡墨和一处朱砂腰带 —— 颜色少,换场景也认得出是她。', 'A character sheet: front, side and back as silhouettes made of the same few strokes (hat, cloak, sword); the swatches are burnt ink, pale ink and one cinnabar sash — few colours, so she is recognisable in any scene.'),
    draw(B, P) {
      [[170, 1], [400, -1], [630, 1]].forEach(([x, f], i) => B.at(0.2 + i * 1.8, 1.6, () => {
        P.swordsman(B, x, 470, 300, { facing: f });
        B.stroke([[x - 30, 290], [x + 30, 296]], { tone: 'zhusha', width: 10, press: 'ce', dry: false });
        B.text(x, 530, '', { size: 18, anchor: 'middle', ink: 'zhong', lang: [L('正面', 'front'), L('侧面', 'side'), L('背影', 'back')][i] });
      }));
      B.at(5.8, 1.6, () => {
        B.text(800, 120, '', { size: 46, font: 'brush', ink: 'jiao', lang: L('寒江客', 'River Wanderer') });
        [['jiao', L('斗笠 · 披风', 'hat · cloak')], ['dan', L('衣袂', 'sleeves')], ['zhusha', L('腰带', 'sash')]].forEach(([t, lab], i) => {
          B.stroke([[800, 200 + i * 60], [870, 200 + i * 60]], { tone: t, width: 26, press: 'ce', dry: false });
          B.text(890, 207 + i * 60, '', { size: 16, ink: 'zhong', lang: lab });
        });
      });
      B.seal(900, 480, 44, '设定', { at: 7.6 });
    },
  },
  {
    id: 'drama-cover', cat: 'film', w: 540, h: 960, seed: 229, motion: true,
    title: L('9:16 短剧封面(带安全区)', 'A 9:16 short-drama cover with safe areas'),
    desc: L('竖屏封面:上 12% 放平台的标题栏、下 18% 放按钮和字幕,主体都在中间;片名用志莽行书竖写;雨一直下。(安全区虚线只在这张示意图里画,真封面不画。)', 'A vertical cover: the top 12% is the platform\'s title bar, the bottom 18% its buttons and captions, so the subject stays in the middle; the title is vertical Zhi Mang Xing; the rain keeps falling. (The safe-area guides are drawn only in this example.)'),
    draw(B, P) {
      B.at(0.2, 2, () => { B.wash([[0, 700], [0, 560], [540, 580], [540, 700]], { tone: 'qing', layers: 2 }); [[380, 560, 40], [400, 500, 30]].forEach(([x, y, w]) => B.stroke([[x - w, y], [x, y - 16], [x + w, y]], { tone: 'dan', width: 5, press: 'zhong', dry: false })); }, { order: 'wash-first' });
      B.at(2.4, 1.8, () => { P.swordsman(B, 220, 760, 420, { facing: -1 }); B.stroke([[180, 470], [250, 480]], { tone: 'zhusha', width: 14, press: 'ce', dry: false }); });
      B.at(4.4, 1.2, () => B.text(450, 200, '', { size: 72, font: 'xing', ink: 'jiao', vertical: true, lang: L('雨中剑', 'Sword in Rain') }));
      B.seal(410, 640, 44, '首集', { at: 5.8 });
      B.raw('<path class="hair" stroke-dasharray="6 6" d="M0 115H540M0 787H540"/>', { kind: 'tag', layer: 'labels' });
      B.text(10, 105, '', { size: 13, ink: 'zhong', lang: L('上 12%:标题栏', 'top 12%: title bar') });
      B.text(10, 806, '', { size: 13, ink: 'zhong', lang: L('下 18%:按钮、字幕', 'bottom 18%: buttons, captions') });
      P.fall(B, { kind: 'rain', n: 70, x1: 640, y1: 960, period: 1.7 });
    },
  },
];
