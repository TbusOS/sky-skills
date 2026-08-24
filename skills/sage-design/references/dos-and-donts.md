# Sage Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

## ✅ Do

- 米黄底 `#f8faec` + 深靛蓝 `#393C54` 做主色对比
- sage 绿 `#97B077` 做 CTA 和图示强调
- headline 用 Instrument Serif（衬线 display）
- 正文用 Inter，17px / 1.65
- 章节用 JetBrains Mono 小号大写 `01 · SECTION` 做编号
- Hairline 分隔线 `1px solid var(--sage-divider)` 代替粗底色条
- pull-quote：Instrument Serif italic + 左侧 sage 竖线
- 按钮：sage 填色 + 纯白字，或 ink 填色 + 纯白字
- 卡片用纯白 `#ffffff` 拉开层级
- 大量负空间（section 上下 padding ≥ 96px）
- 用 `var(--sage-*)` token，不写死 hex

## ❌ Don't — 每条都带 Why

| Don't | Why（过去踩过的坑） |
|---|---|
| 用暖棕 / 橙 / 紫色 | 那是 ember / anthropic / 其它皮肤的地盘 |
| 深色背景上用 `--sage-text` | ratio 3.5 fail AA，看不清。深底上要用白 |
| `--sage-text` on `--sage-sage` | ratio 3.5 fail AA。sage 填色按钮上用 `#ffffff` |
| 在 nav 里的 button 不加更高特异性 | `.sage-nav a { color: ... }` 会吃掉 `.sage-button` 的 color。**必须** `.sage-nav a.sage-button { color:#ffffff }` 单独写 |
| dark mode / 霓虹 / 彩虹 | sage 只活在明亮米黄底下 |
| 把 `[hero]` / `[SVG]` / `[placeholder]` 留在产物里 | 上线即暴露。verify.py 会扫 |
| `class="sage-container--narrow"` 只写 modifier 不带 base | base class 提供 `margin: 0 auto`，modifier 只覆盖 max-width。单独写 modifier → 容器贴左。**必须** `class="sage-container sage-container--narrow"` |
| hero 框图（`grid-column: 1 / -1`）里塞太密的元素和 8px 字 | 渲染下来实际像素 <9px，看不清。visual-audit 会扫 |
| hero 框图 figure 用 `padding: var(--space-7)` | 吞掉 SVG 宽度，字体变小。用 `var(--space-5) var(--space-6)` |
| 多列网格里一张卡独占一行左半边，旁边是 hero 卡 | "孤儿卡"，视觉断裂。要么 `grid-column: 1 / -1` 并给 SVG `max-width + margin:0 auto` 居中，要么与另一张 1 列卡配对 |
| lineup 卡片只放一个 72×72 细线图标居中 | 看起来像 wireframe。每张卡都应该是一张满版 illustration（参考 demo 里的 6 张：芯片 / 录制 / PDF→MD / 文档叠层 / palette / 几何组合） |
| 外链/按钮颜色对比度 < 4.5 | 失读障碍/夜间阅读会看不清。visual-audit 会扫 |
| `transition: all` | 性能差 + 视觉跳动。只 transition 具体属性 |
| Instrument Serif 做正文 | 衬线长文阅读疲劳，Instrument Serif 只做 display + italic pull-quote |
| 局部覆盖全局 `<code>` 样式只改一半（只 color 或只 background） | 另一半从全局继承 → chip 对比度 1.2-2.1:1 不可读（2026-06-13 faq 实抓，high）。覆盖 code/kbd/blockquote 这类全局有样式的元素，color + background **必须成对**写。**known-bugs 1.36** |
| changelog / 图示里的数字、版本号不从页内数据重算 | versioning 图画了 v3.6.1，页面 feed 根本没发过这个版本（2026-06-13 实抓）。可导出的数字（中位数 / 计数 / 版本）发布前用页内内容重算。**known-bugs 1.35** |
| canonical 的 .md / self-diff 写"打算做的"而不是"渲染出来的" | .md 说 hero 左对齐，渲染是居中；self-diff 说连续 rail，渲染按月分段（2026-06-13 team/faq 实抓）。.md 是下一个 critic 的 rubric —— 完稿后逐句对照截图，改 HTML 同 commit 改 .md。**known-bugs 1.37** |
| 文本容器写死 `height` / `position:absolute` 摆文字 / 负 margin 拉文字 | 文字重叠三大来源(2026-07-06 用户反馈跨美学反复出现)。固定高换 `min-height`;绝对定位只给角标且测过双语两种长度;负 margin 改父容器 gap。重叠 ≥40% 且 ≥80px² 现在是 **error** 直接 block。**known-bugs 1.25 两档升级** |
| 整页所有区块套同一个窄容器(或自定义 max-width < 640) | 1440 屏左右大片死空白,内容挤成一条(2026-07-06 用户反馈「左右留白太多,中间的字都挤在了一起」)。窄列只给纯 prose,表格/figure/grid 用 `.sage-container--wide`;同页混用容器档位是正常的。`narrow-content-column` 兜底。**known-bugs 1.44** |
| 单个 `<p>` 写 15 行以上 / 连续 4+ 长段落中间无结构分隔 | 文字墙(2026-07-06 用户反馈「太多文字没有分段落…阅读不美观」)。单段 ≤5 行;≥3 并列要点改列表;成组论述装进 `.sage-admonition`(success / warning / danger)色框分组;概念关系直接上图。`prose-wall` 兜底。**known-bugs 1.45** |
| 为了和上文列宽对齐,把密图(≥20 label)压进窄列或 grid 单元格 | 对齐让位于可读性——图看不清等于没画(2026-07-06 用户反馈原话「没必要一定要和上面对齐」)。密图 breakout 到 `.sage-container--wide` 独立区块,grid 里独占全行(`grid-column: 1 / -1`)或拆图。**known-bugs 1.29 / 1.44** |

## 📋 发布前 checklist（MUST — 四道机械检查都要 exit 0）

生成完整 HTML 后，执行：

```bash
bin/design-review --skill=sage <path/to/your.html>          # 结构 + 渲染 + 可达性 + 截图
bin/design-review --skill=sage --pixel <path/to/your.html>  # 再加像素回归（需已有基线）
```

第三道是 **axe-core**，color-contrast 是阻断项。截图必须人眼看过。
**任何一道 exit 非 0 → 任务没完成**。visual-audit 会具体告诉你：
- `[error]` contrast ratio < 3 — 修文字或背景颜色
- `[warn]` contrast ratio 3–4.5 — 看能否优化
- `[warn]` hero diagram rendered at only X px — 容器太窄，换用 hero container / 减小 padding
- `[warn]` hero diagram smallest text renders at Xpx — SVG 里 font-size 太小
- `[warn]` orphan figure — 多列网格里孤儿，要么跨列要么配对

## 📐 Lineup card quality bar

做 lineup/skill grid 卡片时，每张都必须：
1. aspect-ratio: 1
2. 满版背景（不是"小图标居中 + 大片空白"）
3. 有明确的视觉语言：产品截图、illustration、palette 预览、数据面板……任何能一眼传达"这个 skill 是干什么的"
4. 文字叠加要保证对比度 ≥ 4.5

**反面教材**（已修）：早期 Apple demo 的 lineup 用 72×72 细线 icon 在浅灰方块中央，看起来是占位符。
**正面教材**：现在每张都是独立设计——`linux-kernel-dev` 是发光芯片 tile，`wechat-video-publisher` 是蓝底 REC+波形+字幕条，`doc-to-markdown` 是 PDF→MD 两张纸的呼应。

## 📊 Hero diagram quality bar

一张好的 hero 框图必须：
1. viewBox 宽度和 container 宽度比 ≥ 0.85（不被 padding 吞掉）
2. 最小字体 ≥ 10px（viewBox 坐标系），渲染后 ≥ 9px
3. 在 1440 视口下渲染宽度 ≥ 900px
4. 信息结构清晰：有 stage labels（`01 · 02 · 03`）、有对比色引导视线
5. 颜色只用 `--sage-sage / --sage-ink / --sage-bg / --sage-divider` + 其 tint
6. 最起码 1–2 个肌理细节（hairline 网格 / 小装饰点 / 柔和阴影）让它不看起来像 ppt

参考 anthropic-design 和 apple-design demo 里的 SoC / code-architecture / multi-repo 三张图。
