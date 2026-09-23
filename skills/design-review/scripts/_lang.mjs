// 把双语页切到一种语言，并且核对真的切过去了。
//
// 三道检查要用：截图（screenshot.mjs）、像素比对（pixel-gate.mjs）、渲染审查
// （visual-audit.mjs）。前两道原来各抄了一份，第三道要加时抽成这个模块 ——
// 三份拷贝改一份漏两份，漏掉的那份不会有任何迹象（_reveal-scroll.mjs 同一个理由）。
//
// 为什么要「核对」：切换没生效时不报任何错。截出来的图、审出来的结果都是另一种语言的，
// 看上去完全正常。所以切完数一遍两边各有多少元素还有盒子，由调用方决定怎么报。
//
// 切换做四件事，少一件都会在某类页面上切不干净：
//   1. 浏览器 locale（在 newContext 时给，见 localeFor）—— 自己读 navigator.language
//      选语言的页面，首帧就选对。
//   2. html[data-lang] —— 把 data-lang 写死在 markup 里的页面（atelier）也盖过去。
//   3. html[lang] —— 页面自己的切换按钮都会同时改它（atelier.js、HARNESS-ROADMAP）。
//      不改的话汉字的回落字体按 lang="en" 挑，跟读者点按钮之后看到的不是同一种渲染。
//   4. 等字体 —— 中文子集按 unicode-range 懒加载，切过去之前根本没请求过。先强制排一次版
//      让请求发出去，再等 document.fonts.ready；只等固定毫秒数，慢的时候就拍到回落字体。
//
// 数的是 .lang-en / .lang-zh，也数 SVG 里的 .lang-en-text / .lang-zh-text ——
// 后者靠页面自己的 JS 改行内 display，只改属性切不动它，正是最容易「切了一半」的那种。

export const LANGS = ['en', 'zh'];

export function localeFor(lang) {
  return lang === 'zh' ? 'zh-CN' : 'en-US';
}

export async function langState(page) {
  return page.evaluate(() => {
    const q = (sel) => [...document.querySelectorAll(sel)];
    const boxed = (els) => els.filter((e) => e.getClientRects().length > 0).length;
    const en = q('.lang-en, .lang-en-text');
    const zh = q('.lang-zh, .lang-zh-text');
    return {
      attr: document.documentElement.getAttribute('data-lang'),
      en: en.length,
      zh: zh.length,
      enShown: boxed(en),
      zhShown: boxed(zh),
    };
  });
}

export async function switchLang(page, lang) {
  await page.evaluate((l) => {
    const root = document.documentElement;
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    void document.body.offsetHeight; // 排一次版，懒加载的字体请求才会发出去
  }, lang);
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(200);
  return langState(page);
}

// 结论四种：
//   ok          要的那边有、另一边没了
//   no-markup   页面根本没有双语标记 —— 单语页，本来就只有这一种语言，不算失败
//   not-applied 要的那边一个都没显示出来 —— 拿到的是另一种语言
//   half        两边都在显示 —— 页面缺了 html[data-lang] 的隐藏规则。
//               第一版只查了「要的那边在不在」，放过了它；两个条件缺一不可。
export function judgeLang(st, lang) {
  const want = lang === 'zh' ? st.zhShown : st.enShown;
  const other = lang === 'zh' ? st.enShown : st.zhShown;
  const total = lang === 'zh' ? st.zh : st.en;
  const otherSide = lang === 'zh' ? 'en' : 'zh';
  let verdict = 'ok';
  if (st.en + st.zh === 0) verdict = 'no-markup';
  else if (want === 0) verdict = 'not-applied';
  else if (other > 0) verdict = 'half';
  return { verdict, want, other, total, otherSide, attr: st.attr };
}
