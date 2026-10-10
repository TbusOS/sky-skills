// 数据图 — ink bars for columns, a ridge line for a line chart; every number computed here.
const L = (zh, en) => ({ zh, en });
// a year of rainfall (mm) at one station — sample data; the chart and caption both read it
const MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const RAIN = [42, 58, 96, 132, 168, 236, 212, 188, 120, 74, 50, 36];
const TEMP = [4, 6, 11, 17, 22, 26, 29, 28, 24, 18, 12, 6];
const MAXR = Math.max(...RAIN), PEAK = RAIN.indexOf(MAXR), TOTAL = RAIN.reduce((a, b) => a + b, 0);

export default [
  {
    id: 'rain-chart', cat: 'chart', w: 1000, h: 560, seed: 97, motion: true, wide: true,
    title: L('墨条柱状图 + 山脊线折线', 'Ink bars and a ridge line'),
    desc: L(`一年十二个月的雨量(示例数据):墨条越长墨越浓,最多的 ${MONTHS[PEAK]}月 ${MAXR} 毫米用焦墨并盖印;全年合计 ${TOTAL} 毫米。气温画成一道山脊线,线下淡墨像远山。`, `Twelve months of rainfall (sample data): longer bars, darker ink; the wettest month, ${PEAK + 1}, at ${MAXR} mm is burnt ink with a seal; ${TOTAL} mm in the year. Temperature is a ridge line with a pale wash beneath, like a far hill.`),
    draw(B, P) {
      const x0 = 110, bw = 62, base = 470, sy = v => base - v * 1.5, ty = t => 300 - t * 7;
      const tone = v => (v === MAXR ? 'jiao' : v > 150 ? 'nong' : v > 90 ? 'zhong' : 'dan');
      B.at(0.2, 0.8, () => {
        B.stroke([[90, base], [880, base]], { tone: 'dan', width: 2.4, press: 'si', dry: false });
        [0, 100, 200].forEach(v => B.text(84, sy(v) + 5, String(v), { size: 13, anchor: 'end', font: 'mono', ink: 'zhong' }));
      });
      B.at(1.0, 3.6, () => RAIN.forEach((v, i) => B.stroke([[x0 + i * bw, base - 2], [x0 + i * bw, sy(v)]], { tone: tone(v), width: 30, press: 'ce', load: 0.95, wet: 0.3, dry: false })));
      B.at(4.8, 0.8, () => MONTHS.forEach((m, i) => B.text(x0 + i * bw, base + 28, '', { size: 15, anchor: 'middle', ink: 'zhong', lang: L(m + '月', String(i + 1)) })));
      const ridge = TEMP.map((t, i) => [x0 + i * bw, ty(t)]);
      B.at(5.8, 2, () => {
        B.wash([[x0 - 20, 320], ...ridge, [x0 + 11 * bw + 20, 320]], { tone: 'huaqing', layers: 2, dir: 'down', opacity: 0.7 });
        B.stroke(ridge, { tone: 'huaqing', width: 5, press: 'zhong', dry: false, wet: 0.3 });
      });
      B.at(7.9, 0.8, () => {
        B.text(x0 + PEAK * bw, sy(MAXR) - 14, `${MAXR}`, { size: 18, anchor: 'middle', font: 'mono', ink: 'jiao' });
        B.text(760, 110, '', { size: 16, ink: 'huaqing', lang: L(`气温 最高 ${Math.max(...TEMP)}°`, `temperature, max ${Math.max(...TEMP)}°`) });
        B.text(760, 140, '', { size: 16, ink: 'zhong', lang: L(`雨量 全年 ${TOTAL} 毫米`, `rain, ${TOTAL} mm a year`) });
      });
      B.seal(x0 + PEAK * bw - 20, sy(MAXR) - 76, 40, '最多', { at: 8.8 });
    },
  },
];
