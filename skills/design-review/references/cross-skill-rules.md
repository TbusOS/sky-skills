# Cross-Skill Rules

> 适用于 **所有 4 个 design skill**（anthropic / apple / ember / sage）的共通规则。
> 每个 skill 的 `dos-and-donts.md` 负责**风格独有**的规则（调色板、字体、签名动作）；
> 这份文件负责**跨风格的工艺底线**。evaluator 先读这份，再读对应 skill 的 dos-and-donts。

---

## A. 结构卫生（verify.py 强制）

1. **零占位符**：产物里不得出现 `[hero]` / `[SVG]` / `[icon]` / `[placeholder]` / `[todo]` / `[tbd]` / `[fixme]` / `[<name>.icon]`。
2. **DOCTYPE + viewport**：`<!doctype html>` + `<meta name="viewport" content="...">` 缺一不可。
3. **容器 BEM**：modifier class（`--narrow` / `--wide` / `--hero`）必须和 base class 同时出现。只写 modifier = 丢失 `margin:0 auto`。
4. **SVG 标签平衡**：`<svg>` 与 `</svg>` 数量一致。
5. **类名必须定义**：每个 `class="{prefix}-*"` 在对应的 `assets/{skill}.css` 都要有定义，不得有幽灵 class。

## B. 渲染工艺（visual-audit.mjs 强制）

1. **CTA/徽章 contrast ≥ 4.5**：按钮、徽章、nav 链接在实际背景上的 WCAG 对比度；< 3 判 error，3–4.5 判 warn。
2. **Hero 框图渲染宽度 ≥ 900px**（在 1440 视口下）：`figure[grid-column: 1 / -1] > svg` 实测 rect.width；不到就 warn。例外：作者明确用 `max-width + margin:0 auto` 居中限宽的 intentional 场景。
3. **SVG `<text>` 渲染像素 ≥ 9px**：`effective_px = font_size * (rect.width / viewBox.width)`。小于 9 就 warn。**写源码时 font-size ≥ 9.5 作为缓冲**。
4. **孤儿卡检测**：多列 grid 里 N-1 张是 `grid-column: 1 / -1` 的全行 hero 卡，剩 1 张不是且宽度 < 父容器 70% → warn。

## C. 视觉原创性（目前文档级，将来 design-critic 强制）

1. **Lineup / skill grid 卡片**：每张都必须
   - aspect-ratio: 1 或明确的比例
   - 满版背景 / 独立视觉语言（产品截图、illustration、palette 预览、数据面板 …）
   - **禁止** 72×72 细线图标居中在浅灰方块（像 wireframe）
   - 叠加文字 contrast ≥ 4.5
2. **Hero 框图**：
   - viewBox 宽度 / container 宽度 ≥ 0.85（不被 padding 吞掉）
   - 有明确的信息结构：stage labels（`01 · 02 · 03`）、对比色引导视线
   - 颜色用该 skill 的 token，不引入陌生色
   - 至少 1–2 个肌理细节（hairline 网格、柔和阴影、小装饰点），避免"ppt 感"

## D. 代码质量

1. 不写死 hex：能用 `var(--{skill}-*)` 就用 token。
2. 不用 `transition: all`：只 transition 具体属性（opacity / transform / color）。
3. 不要把衬线 display 字体用作正文（Instrument Serif / Lora 做 display + italic pull-quote，不做 body）。

## E. SVG 规则(visual-audit 强制)

1. **禁止"装饰性 transform"**:如果一段 SVG `<text>` 加了 `rotate()` 或其他 transform,它很可能是"在写源码时想塞个装饰"。99% 场景下**去掉它比加它更好** —— 因为渲染后它的 bounding box 会穿过原本看似安全的静态标签(known-bugs 1.8 就是这条)。写之前问自己:这文字**真的必要吗?** 必要的话,先渲染一次看它有没有压到别的元素再交付。
2. **同 SVG 内任意两个 `<text>` 的 rendered rect 不应相交 ≥ 4×4 px**。title + subtitle 垂直紧贴的 1-2px 叠加不算。
3. **文字颜色不要和它所在 shape 的填充色接近**:文字 `fill` 和承载它的最小不透明 rect/circle/path 的 `fill` RGB 欧氏距离 ≥ 40(simple heuristic,见 known-bugs 1.9)。半透明叠加层(fill-opacity < 0.5)不算背景 —— 真正的背景在它底下。
4. **SVG `<text>` 源码 `font-size` ≥ 11** 才能在 worst-case 0.84 scale 下仍 ≥ 9 渲染像素。

## F. HTML 语义 + a11y(visual-audit 强制)

1. **每页恰好一个 `<h1>`**(multiple-h1 error / no-h1 warn)。
2. **不跳 heading 层级**:h1 → h3 (跳 h2) warn;footer / aside / nav 内的 h5 列标题是行业惯例,不算跳级。
3. **`<img>` 必须有 `alt`**:装饰性用 `alt=""`,内容性用描述。
4. **可见的 `<a>` 必须有文本 / `aria-label` / `title`**:空链接屏幕阅读器读不出。

---

## 出坑以后

任何一次 evaluator 抓到的新 bug 类，都要走 `known-bugs.md` 末尾的"新 bug 类处置流程"。
这个 repo 的规则是：**同一个问题不该被抓两次**。
