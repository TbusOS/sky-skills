// 让「滚动到才显示」的元素先显示出来，再去测量 / 截图 / 跑 axe。
//
// 为什么需要：九个 skill 里有四个用了 reveal-on-scroll —— 元素起手是
// opacity:0，IntersectionObserver 等它进视口才加 .is-visible。不滚动的话，
// **首屏以下的每个这种元素都停在 opacity 0**，于是：
//   · 截图出来一块一块空白，读起来像「这一节漏配图」而不是「截图截坏了」
//   · visual-audit 量到的是不可见元素的几何，对比度、重叠全是假的
//   · axe 对着 opacity:0 的元素判可访问性，也是假的
// 三种坏法都不报错。
//
// 只有 screenshot.mjs 有这一段，另外三道没有 —— 2026-09-16 补齐，
// 顺手抽成一个模块。四份逐字节相同的拷贝正是这个仓自己记过的坑：
// 改一份漏三份，而漏掉的那三份不会有任何迹象。
//
// 步长取半个视口高，不取整数像素：这样页面上每一条横带都会在某一次停留时
// **整条落在视口里**，而不是横跨两次停留 —— 阈值非 0 的 observer 要的就是这个。
// 停留是必须的，observer 是回调，不在 scrollTo 那一刻执行。
// 步数上限是给「越滚越长」的页面兜的，没有它这个循环不会结束。

export async function revealByScrolling(page, viewportHeight, { dwell = 40, maxSteps = 400 } = {}) {
  return page.evaluate(async ({ step, dwell, maxSteps }) => {
    let y = 0;
    for (let i = 0; i < maxSteps && y < document.body.scrollHeight; i += 1) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, dwell));
      y += step;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  }, { step: Math.max(200, Math.round(viewportHeight / 2)), dwell, maxSteps });
}

// 滚完还剩多少「自称 reveal 却仍然不可见」的元素。
// 滚动只解决文档里写过的那一种做法；项目自己搞的另一套可能不吃这一招，
// 而这类检查坏掉的样子是「看着没问题，其实不对」，所以要报出来。
export async function stillHidden(page) {
  return page.evaluate(() => {
    const sel = '[class*="reveal"],[class*="fade-in"],[data-reveal]';
    return [...document.querySelectorAll(sel)]
      .filter((e) => {
        const s = getComputedStyle(e);
        return +s.opacity === 0 && s.visibility !== 'hidden' && s.display !== 'none';
      })
      .map((e) => e.tagName.toLowerCase() + '.' + (e.className || '').toString().split(' ')[0])
      .slice(0, 5);
  });
}
