# Known-Bug Catalogue

> 这是 design-review skill 的**事实清单** —— 每一行都是过去真实踩过的坑，
> 说清楚 **Reader sees → Why → Defense** 三件事。任何一个 bug 被重犯，
> 就是防御不够,要同时修脚本 + 修对应 skill 的 `dos-and-donts.md`。

使用方式：`design-review` 的 evaluator（脚本 + 将来的 critic subagent）
按这张表核对。读者发现一个本表之外的新问题 → 追加一行 +
回补到 visual-audit.mjs 或 verify.py。

---

## 1. 跨 skill 通用

### 1.1 `[hero]` / `[SVG]` / `[icon]` 占位符留在 HTML 里
- **Reader sees**：页面渲染出 `[placeholder]` 字样，上线即暴露。
- **Why**：LLM 草稿阶段用 `[...]` 占位，写完忘了替换为真 SVG。
- **Defense**：`verify.py` 的 `PLACEHOLDER_PATTERN` 扫所有 `[hero.*|svg|img|photo|abstract.*|workspace.*|*.icon|placeholder|todo|tbd|fixme]`。
- **Rule in skill**：每个 skill 的 `dos-and-donts.md` 都有 "把 `[hero]` 留在产物里 → 上线即暴露"。

### 1.2 BEM modifier-only（容器不居中）
- **Reader sees**：整个容器贴左，页面版心崩了。
- **Why**：CSS 里 `.ember-container { margin: 0 auto }` 是 base class 的规则，modifier `.ember-container--narrow` 只覆盖 max-width。作者只写了 `class="ember-container--narrow"`，base 的 `margin:0 auto` 不生效。
- **Defense**：`verify.py` 的规则 6 正则扫 `{prefix}-container--(narrow|wide|hero)` 必须与 `{prefix}-container` 同时出现。
- **Rule in skill**：所有 4 个 skill 的 `dos-and-donts.md`。
- **Applies to**：anthropic / apple / ember / sage（apple 的 base class 是"窄"的那一个，narrow 规则反过来）。

### 1.3 Hero 框图渲染宽度 < 900px → 字挤到不可读
- **Reader sees**：hero 里那张大 SVG 框图缩得很小，labels 在实际像素下 < 9px，完全认不出。
- **Why**：
  - figure 被关在默认 container（`apple-container` 980px / `anth-container` 960px）里；
  - figure padding 太大（`var(--space-7)`）吞掉 SVG 宽度；
  - figure 处在多列 grid 里未跨列，只占单列宽度。
- **Defense**：`visual-audit.mjs` 的 "hero diagram sizing audit"：`figure[grid-column: 1 / -1] > svg` 实测 rect.width < 900px 就 warn。
- **Fix playbook**：
  - 换用 `--hero` / `--wide` 版 container；
  - figure padding 改 `var(--space-5) var(--space-6)`；
  - figure `grid-column: 1 / -1`。

### 1.4 SVG `<text font-size="8">` 在 1440 视口实际 < 9px
- **Reader sees**：框图里的标签糊成一片。
- **Why**：作者在 viewBox 里写 `font-size="8"`，但 viewBox → 渲染宽度的 scale 通常 < 1.2，8 × 1.0 就 < 9px 了。
- **Defense**：`visual-audit.mjs` 的 "diagram-tiny-text" 检查：`effective_px = font_size * (rect.width / viewBox.width)`，< 9 就 warn。
- **Rule**：SVG 所有 `<text>` 源码 `font-size ≥ 9.5`（历史上被改过 8 → 9.5 的位置：Apple/Anthropic SoC + multi-repo diagram）。

### 1.5 多列网格里一张卡孤儿在 hero 卡旁边
- **Reader sees**：右半行大 hero 框图，左半行一张小卡片，中间撕裂感。
- **Why**：作者把一张普通 feature card 放进了一个"全行 hero figure"的 grid 里，没跨列也没配对。
- **Defense**：`visual-audit.mjs` 的 "orphan-figure" 检查：grid 里 N-1 张是 full-row hero，剩 1 张不是且宽度 < 70% 父容器 → warn。
- **Fix**：要么给孤儿 `grid-column: 1 / -1` + 给 SVG `max-width:640px; margin:0 auto` 居中，要么补一张配对卡。

### 1.6 Lineup 卡 = 小线条图标居中（看起来像 wireframe）
- **Reader sees**：skill grid 里每张卡都是 72×72 的细线图标在一个浅灰方块中心 —— 像占位符，不像成品。
- **Why**：偷懒用 Feather/Heroicons 图标当插画，aspect-ratio:1 的卡片大部分是空白。
- **Defense**：目前是文档级规则（未落到脚本，因为"是否像 wireframe"缺少客观判据 —— 这正是将来 design-critic subagent 的用武之地）。
- **Rule**：每个 skill 的 `dos-and-donts.md` 都有 "Lineup 卡片只放一个 72×72 细线图标居中 → 像 wireframe"。
- **正面教材**：每张都是满版 illustration，各有独特视觉语言（芯片 tile / 录制界面 / PDF→MD / palette 预览 …）。

### 1.7 CTA/按钮 contrast < 4.5（WCAG AA fail）
- **Reader sees**：按钮上的文字在品牌色底上发虚，失读障碍/夜间阅读看不清。
- **Why**：品牌色往往是中饱和中明度，配中性色文字差 0.5–1.0 就过不了 AA。
- **Defense**：`visual-audit.mjs` 的 "contrast audit"：扫所有按钮/徽章选择器，ratio < 3 报 error，3–4.5 报 warn。

---

## 2. anthropic-design

### 2.1 cream 在橙 CTA 上 = 2.96（fail AA）
- **Reader sees**：橙底按钮上的 `"Try Claude"` 文字在暖奶白色下变得发灰。
- **Why**：`color: var(--anth-bg)` (`#faf9f5`) 在 `.anth-button` 的橙 (`#d97757`) 背景上 = 2.96。
- **Defense**：改为 `color: #ffffff; font-weight: 600;`（3.12，warn-level，品牌 intentional）;
  visual-audit 的 contrast 检查会在 ratio < 3 时 fail。

---

## 3. apple-design

### 3.1 Hero 框图被压缩因 `.apple-container` (980px) 包 span-2 figures
- **Reader sees**：SoC / multi-repo 两张大框图文字 < 9px，认不出。
- **Why**：apple 的 base container 是 **窄的** (980px for reading)，hero 得用 `apple-container--hero` (1280px) 或 `--wide` (1280px)。历史上作者把 hero 还是套在默认 container 里。
- **Defense**：
  - `verify.py` 的 hero container 规则：base `apple-container` 被标为 narrow，`--hero`/`--wide` 才被接受;
  - 模板里 hero 段已固定用 `.apple-container apple-container--hero`;
  - visual-audit 的 diagram-narrow + diagram-tiny-text 兜底。

---

## 4. ember-design

### 4.1 `.ember-nav a` 吃掉 `.ember-button` 的 color → "Get skills" 按钮不可见
- **Reader sees**：导航里的橙色 CTA 文字变成暗棕，几乎和底色一样。
- **Why**：CSS 里 `.ember-nav a { color: var(--ember-text) }` 选择器特异性 ≥ `.ember-button { color: #fff }`，前者后定义或同特异性下胜出。
- **Defense**：在 `ember.css` 里追加 `.ember-nav a.ember-button { color: #ffffff }` 单独规则;
  visual-audit 的 contrast audit 在 rendered 时兜底。
- **Rule**：ember-design `dos-and-donts.md` 专条 —— "nav 里的 button 不加更高特异性 → `.ember-nav a { color: ... }` 会吃掉 `.ember-button` 的 color"。

---

## 5. sage-design

### 5.1 `#97B077` sage 绿在白底上 = 2.4（fail AA）
- **Reader sees**：白底上的 sage 绿按钮/链接文字太淡，看不清。
- **Why**：sage 是装饰性颜色，不是 primary ink。当 CTA 底色 = 白 / 文字 = sage 绿时 contrast = 2.4。
- **Defense**：
  - 规则：primary CTA 用 `--sage-ink` (#393C54, 对 cream 底 11.3 ✓) 作为文字色或按钮底色；
  - sage 绿只做 accent / illustration / 大面积填充 + 白字（`#ffffff` on `#97B077` = 4.1，warn 但可用）;
  - 在 `design-tokens.md` 文档化。

---

## 新 bug 类的处置流程（每次必做）

1. design-critic 或人发现一个本表之外的问题。
2. 决定：**这是偶发还是一个 bug 类?**
   - 偶发 → 只修这一页。
   - bug 类 → 走步骤 3。
3. 追加一行到本文件，写清 Reader sees / Why / Defense。
4. 如果能在 render 时检测 → 加一个 check 到 `scripts/visual-audit.mjs`。
5. 如果能在静态扫时检测 → 加一个 check 到 `scripts/verify.py`。
6. 如果是 style-specific → 也更新对应 skill 的 `references/dos-and-donts.md`。
7. 至少给一个 fixture demo 或测试证据说明"改完以后这条 bug 跑脚本能被捉到"。
