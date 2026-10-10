// SVG 里文字的对比度 —— axe 的 color-contrast 不查 SVG <text>,这里补上。
//
// 为什么要有:2026-10-10 五份路线图 axe 清到 0 之后,SVG 字另量又有 3/3/5/11 处不到 AA。
// axe 跳过 SVG 文字,于是讲解图里的灰字、浅色标签从来没人量过,而这个仓的页面一大半信息在图里。
//
// 底色从截图里取,不读形状的 fill:
//   字下面常常不是一个纯色形状 —— 渐变、图片、半透明叠层、pointer-events:none 的形状、
//   图外面 HTML 卡片的底色。读属性要把这些一一模拟,漏一种就量错一种,而且错得不报错。
//   截图是浏览器真画出来的东西:把 SVG 里的字设成透明拍一张,拍到的就是字底下的像素。
//
// 只看笔画底下的像素,不看整个包围盒:
//   包围盒按字号算高度,比字形高。字放在刚好装得下的小圆角块里时,盒子上下沿落在块外面,
//   第一版就这样把 eclat 一个深底白字的「2.0×」量成 1.03(盒子里中位数其实是 6.24)。
//   所以再拍两张:字全涂黑一张、全涂白一张,两张差得多的像素就是笔画。
//   不拿「字原色和透明」比 —— 字色和底色一样时两张没区别,最看不清的字反而找不到笔画。
//
// 字的颜色读 computedStyle(和 axe 一样量设计意图,不量抗锯齿后的像素),
// 再乘上它和祖先的 opacity、fill-opacity,逐像素合成到底色上算对比度。
//
// 判法:笔画像素各算一个对比度,从低往高排,取第 PERCENTILE 分位 ——
// 「至少 (1 - PERCENTILE) 的笔画,对比度不低于这个数」。不取最小值:穿过字的细线
// 会落在几个笔画像素底下;也不取中位数:字横跨两种底色,一部分落在看不清的底上也该报。
//
// 门槛跟 WCAG AA 一样:4.5:1;大字 3:1。大字按渲染出来的字号算(SVG 按 viewBox 缩放,
// 写的 font-size 不是读者看到的大小):≥ 24px,或粗体 ≥ 18.66px。
//
// 不量的都计数,调用方打出来,「0 处」和「什么都没量」才分得开:
//   gradient  字的填充是渐变 / 图案,没有单一颜色
//   hidden    display:none、visibility:hidden、自己或祖先 opacity 为 0(另一种语言的半边在这里)
//   clipped   落在 SVG 或祖先滚动框的可见范围外,或比视口还高
//   covered   挪到视口中间还被别的元素盖着(固定顶栏挪开了还盖着 = 真叠在一起,归重叠检查管)
//   unpainted 涂黑涂白两张一样,字没画出来(被 clip-path / mask 整个裁掉)
//
// 已知的近似:祖先 <g opacity> 同时挡住字和字底下的形状时,真实结果是「组合好再整体变淡」,
// 这里是「字先变淡再叠到已经变淡的底色上」。差别随形状和页面底色的差别变大。

import { PNG } from 'pngjs';

// 2026-10-10 在全仓页面上量出来的,理由见 SKILL.md「SVG 文字对比度」一节。
export const PERCENTILE = 0.2;

const STYLE_ID = 'svgc-probe';
// 换颜色不许走过渡:页面常写的「减少动态效果」规则 * { transition-duration: 0.01ms !important }
// 没写 transition-property,默认是 all —— 每一次改颜色都成了一段 0.01ms 的过渡,
// 改完立刻截图拍到的还是旧颜色。2026-10-10 anthropic faq 上「涂白」那张和「涂黑」一模一样,
// 17 段字全被当成没画出来。子元素继承的 fill 也会过渡,所以连后代一起关。
const NO_TRANSITION = '[data-svgc], [data-svgc] * { transition: none !important; }';
const PROBE = {
  hide: NO_TRANSITION + '[data-svgc] { fill: transparent !important; } [data-svgc]:not([data-svgc-halo]) { stroke: transparent !important; }',
  black: NO_TRANSITION + '[data-svgc] { fill: #000 !important; fill-opacity: 1 !important; opacity: 1 !important; stroke: transparent !important; }',
  white: NO_TRANSITION + '[data-svgc] { fill: #fff !important; fill-opacity: 1 !important; opacity: 1 !important; stroke: transparent !important; }',
};

const lum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratioOf = (a, b) => { const x = lum(...a), y = lum(...b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

// 收集页面上每一段 SVG 文字:颜色、透明度、字号、在文档里的位置。
// 只收「自己直接带文字」的元素 —— <text>58<tspan>/ 58</tspan></text> 是两段,颜色各算各的。
function collect() {
  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const skipped = { gradient: 0, hidden: 0, clipped: 0 };
  const items = [];
  const outer = [...document.querySelectorAll('svg')].filter((s) => !s.parentElement || !s.parentElement.closest('svg'));
  for (const svg of outer) {
    const fig = svg.closest('figure');
    const cap = fig && fig.querySelector('figcaption');
    const label = svg.getAttribute('aria-label') || (cap && cap.textContent.trim())
      || (svg.closest('[id]') && '#' + svg.closest('[id]').id) || 'svg';
    for (const t of svg.querySelectorAll('text, tspan, textPath')) {
      const own = [...t.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!own) continue;
      if (!t.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) { skipped.hidden++; continue; }
      const cs = getComputedStyle(t);
      const fg = parse(cs.fill);
      if (!fg || /url\(/.test(cs.fill)) { skipped.gradient++; continue; }
      let alpha = fg[3] * parseFloat(cs.fillOpacity || '1');
      for (let el = t; el; el = el.parentElement) alpha *= parseFloat(getComputedStyle(el).opacity || '1');
      if (alpha < 0.01) { skipped.hidden++; continue; }
      const r = t.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { skipped.clipped++; continue; }
      const m = t.getScreenCTM();
      const px = parseFloat(cs.fontSize) * (m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1);
      t.setAttribute('data-svgc', items.length);
      // 描边先画、字再画(paint-order: stroke)的是字的衬底,算底色的一部分,拍底色时留着
      if (/^stroke/.test(cs.paintOrder) && cs.stroke !== 'none') t.setAttribute('data-svgc-halo', '');
      items.push({
        text: own.replace(/\s+/g, ' ').slice(0, 40),
        fg: fg.slice(0, 3), alpha,
        px, bold: parseInt(cs.fontWeight, 10) >= 700,
        top: r.top + scrollY,
        where: label.replace(/\s+/g, ' ').slice(0, 40),
      });
    }
  }
  return { items, skipped };
}

// 当前滚动位置下,这些字哪些整段在视口的留白区里、没被挡住;给出可见矩形(视口坐标)。
function locate({ ids, free }) {
  const out = [];
  for (const id of ids) {
    const t = document.querySelector(`[data-svgc="${id}"]`);
    if (!t) continue;
    let svg = t.closest('svg');
    while (svg.parentElement && svg.parentElement.closest('svg')) svg = svg.parentElement.closest('svg');
    const r = t.getBoundingClientRect();
    // 可见范围:SVG 自己的框,再和每一层 overflow 不是 visible 的祖先框取交集
    let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let el = svg; el && el !== document.documentElement; el = el.parentElement) {
      const s = getComputedStyle(el);
      if (el !== svg && s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const c = el.getBoundingClientRect();
      L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); B = Math.min(B, c.bottom);
    }
    if (R - L < 1 || B - T < 1) { out.push({ id, gone: true }); continue; }
    if (T < free.top || B > free.bottom || L < 0 || R > innerWidth) continue;
    // 挡住了吗:中心和上沿两角,最上层都得是这张图里的东西
    const pts = [[(L + R) / 2, (T + B) / 2], [L + 1, T + 1], [R - 1, T + 1]];
    const clear = pts.every(([x, y]) => { const e = document.elementFromPoint(x, y); return e && svg.contains(e); });
    out.push({ id, clear, l: L, t: T, r: R, b: B });
  }
  return out;
}

// 在矩形里找笔画像素(涂黑和涂白差得多的),取它们在「字透明」那张里的颜色当底色。
function measure(shots, it, box, percentile, scale) {
  const { hide, black, white } = shots;
  const W = hide.width, H = hide.height;
  const x0 = Math.max(0, Math.floor(box.l * scale)), x1 = Math.min(W, Math.ceil(box.r * scale));
  const y0 = Math.max(0, Math.floor(box.t * scale)), y1 = Math.min(H, Math.ceil(box.b * scale));
  const px = [];
  let maxCov = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      const cov = (Math.abs(black.data[i] - white.data[i]) + Math.abs(black.data[i + 1] - white.data[i + 1])
        + Math.abs(black.data[i + 2] - white.data[i + 2])) / 765;
      if (cov > 0) px.push({ cov, i });
      if (cov > maxCov) maxCov = cov;
    }
  }
  if (maxCov < 0.02) return null;
  const rows = [];
  for (const { cov, i } of px) {
    if (cov < maxCov * 0.5) continue;          // 只要笔画中间,抗锯齿的边缘不要
    const bg = [hide.data[i], hide.data[i + 1], hide.data[i + 2]];
    const a = it.alpha;
    const fg = [0, 1, 2].map((k) => it.fg[k] * a + bg[k] * (1 - a));
    rows.push({ ratio: ratioOf(fg, bg), bg });
  }
  rows.sort((p, q) => p.ratio - q.ratio);
  const at = rows[Math.min(rows.length - 1, Math.floor(rows.length * percentile))];
  return { ratio: at.ratio, bg: at.bg, min: rows[0].ratio, median: rows[rows.length >> 1].ratio, n: rows.length };
}

// 换完样式等两帧再拍:新样式真正画上屏要等下一帧,别的属性上要是还有过渡也能走完。
async function shoot(page, mode) {
  await page.evaluate(async ({ id, css }) => {
    document.getElementById(id).textContent = css;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, { id: STYLE_ID, css: PROBE[mode] });
  return PNG.sync.read(await page.screenshot({ caret: 'hide' }));
}

// 量一页。调用前页面应该已经滚过一遍(滚动浮现的内容出来了)、主题和语言都设好了。
// 返回 { measured, skipped, findings, rows }。findings 每条:text / where / fg / bg / ratio / need / px;
// rows 只在 all:true 时填,是每一段量到的字(调阈值用)。
export async function svgTextContrast(page, { percentile = PERCENTILE, all = false } = {}) {
  const vp = page.viewportSize() || { width: 1280, height: 900 };
  await page.evaluate(() => {
    for (const a of document.getAnimations()) { try { a.pause(); } catch { /* 已结束的动画 */ } }
    for (const s of document.querySelectorAll('svg')) { try { s.pauseAnimations(); } catch { /* 不是 SVG 根 */ } }
  });
  const { items, skipped } = await page.evaluate(collect);
  Object.assign(skipped, { covered: 0, unpainted: 0 });
  let measured = 0;
  const findings = [];
  const rows = [];
  if (!items.length) return { measured, skipped, findings, rows };

  await page.evaluate((id) => { const s = document.createElement('style'); s.id = id; document.head.appendChild(s); }, STYLE_ID);
  // 顶上留 15% 给固定顶栏:每次把还没量的第一段字挪到这条线下面。
  // 页面在最顶上时没有「上面」可挪,这条线退到 0;吸底条之类靠下面「挡住了吗」那一步认出来
  const TOP = Math.round(vp.height * 0.15);
  const todo = new Set(items.keys());
  const tried = new Set();
  const order = [...items.keys()].sort((p, q) => items[p].top - items[q].top);
  let cursor = 0;
  while (todo.size) {
    while (!todo.has(order[cursor])) cursor++;
    const first = order[cursor];
    const sy = await page.evaluate((y) => { window.scrollTo({ top: y, behavior: 'instant' }); return scrollY; },
      Math.max(0, items[first].top - TOP - 4));
    await page.waitForTimeout(120);
    const shots = { hide: await shoot(page, 'hide'), black: await shoot(page, 'black'), white: await shoot(page, 'white') };
    const free = { top: sy === 0 ? 0 : TOP, bottom: vp.height };
    const near = [...todo].filter((i) => items[i].top > sy - 200 && items[i].top < sy + vp.height + 200);
    if (!near.includes(first)) near.push(first);
    const where = await page.evaluate(locate, { ids: near, free });
    for (const w of where) {
      if (w.gone) { skipped.clipped++; todo.delete(w.id); continue; }
      if (!w.clear) {
        // 挪到留白下沿了还被挡住:不是顶栏的问题,记下来不量
        if (w.id === first || tried.has(w.id)) { skipped.covered++; todo.delete(w.id); } else tried.add(w.id);
        continue;
      }
      todo.delete(w.id);
      const it = items[w.id];
      const m = measure(shots, it, w, percentile, shots.hide.width / vp.width);
      if (!m) { skipped.unpainted++; continue; }
      measured++;
      const need = it.px >= 24 || (it.bold && it.px >= 18.66) ? 3 : 4.5;
      const row = {
        text: it.text, where: it.where,
        fg: hex(it.fg) + (it.alpha < 0.999 ? `@${it.alpha.toFixed(2)}` : ''),
        bg: hex(m.bg), ratio: +m.ratio.toFixed(2), min: +m.min.toFixed(2), median: +m.median.toFixed(2),
        need, px: +it.px.toFixed(1),
      };
      if (all) rows.push(row);
      if (m.ratio < need) findings.push(row);
    }
    // 第一段字这一轮没量成(比留白区还高、页面滚不到那里):放弃,免得死循环
    if (todo.has(first) && !tried.has(first)) { skipped.clipped++; todo.delete(first); }
  }
  await page.evaluate((id) => {
    document.getElementById(id).remove();
    for (const e of document.querySelectorAll('[data-svgc]')) { e.removeAttribute('data-svgc'); e.removeAttribute('data-svgc-halo'); }
  }, STYLE_ID);
  return { measured, skipped, findings, rows };
}
