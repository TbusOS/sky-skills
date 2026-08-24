# Apple Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

## ✅ Do

- 白 / 浅灰 / 黑三段交替叙事
- 产品摄影居中 + 大量留白
- 巨字号统计（120px）
- 文字链 + 下划线 + `›` 结尾
- SF Pro 全家族（Display / Text / Mono）
- 章节间 80–120px padding
- 毛玻璃 nav（`backdrop-filter: blur(20px)` + `--apple-bg-nav`）
- 圆角 12px 卡片
- 无衬线正文，Text 用于 <24px 场景
- 使用 `var(--duration-sm)` 等 token，不写死毫秒
- 按钮按压反馈：`.apple-button:active` 即时 `scale(0.97)`（apple.css 已内置）；手势组件的 spring 手感规则见 `motion.md` 第二层
- `.apple-link::after` 的 `›` 如不需要用 `.apple-link--no-arrow` 取消
- **Hero 段**用 `.apple-container--hero`（1280px），让 SoC / code-arch / multi-repo 这类信息密集框图有足够空间

## ❌ Don't — 每条都带 Why

| Don't | Why（过去踩过的坑） |
|---|---|
| 紫色 / 彩虹渐变 | AI slop 标志 |
| 饼图 / 3D 柱图 / 霓虹光效 | 非 Apple 语言 |
| Inter / Roboto 作标题字 | 破坏 SF Pro 统一感 |
| 反弹 / 弹簧 / rotation **入场** | 入场 / 浮现 / hover 只用 `cubic-bezier(0.25, 1, 0.5, 1)`。弹簧只属于手势驱动组件（拖拽轮播 / 滑块 / sheet），且默认临界阻尼无过冲——边界见 `motion.md` 两层体系 |
| JS 驱动动画（rAF / spring）不查 `prefers-reduced-motion` | apple.css 的全局 0.01ms 兜底只管 CSS；JS 动画不受管，减动效用户照样满屏动。JS 动画入口先 `matchMedia` 自查 |
| 面板右进下出 / popover 从自身中心缩放 | 空间一致性：从哪来回哪去；菜单 `transform-origin` 锚定触发元素，不然按钮和内容的空间关系断裂 |
| `transition: all` | 性能差 + 视觉跳动。显式列属性 |
| 硬编码 `#FFFFFF` | 用 `var(--apple-bg)` 才能跟主题变 |
| 把 `[hero image]` / `[icon]` / `[photo]` 留在产物里 | 上线即暴露空白格子。必须放**真 inline SVG** |
| 只写 `.apple-container--hero` 不带 base | base 提供 `margin: 0 auto`；只写 modifier → 容器贴屏幕左边。**必须** `class="apple-container apple-container--hero"` |
| 窄容器（`.apple-container` 980px）包信息密集的 hero 框图 | 框图被压缩到 ~920px，内部 8–10px 字体渲染后 <9px 看不清。用 `.apple-container--hero` 1280px |
| hero 框图 figure `padding: var(--space-7)` | 再吃掉 96px 宽度，SVG 进一步变小。用 `var(--space-5) var(--space-6)` |
| SVG 里 `font-size="8"` 用在信息标签 | 实际渲染 <9px 是失读线。最小给 10，意图小字给 9.5 |
| 多列网格里一张非 hero 卡片夹在一堆 `grid-column: 1 / -1` 中间 | 独占左半边很难看。要么跟它 span 2，要么 SVG `max-width + margin: 0 auto` 居中 |
| Lineup 卡片塞一个 72×72 细线图标居中 | 像 wireframe。每张都做满版 illustration，传达 skill 内容 |
| CTA 文字色在深底上对比度 < 4.5 | 可读性 fail。深底用 `#ffffff`，别用 `var(--apple-bg)` 那样的 off-white |
| 在 nav 里的 button 不加更高特异性 | `.apple-nav a { color: var(--apple-text); opacity: 0.8 }` 会吃掉 `.apple-button` 的 white color，渲染成深字 + 0.8 透明在 blue 上对比度 ~3.58:1 fail AA（2026-04-28 apple/feature-deep canonical 实测踩过）。**必须** `.apple-nav a.apple-button { color:#ffffff; opacity:1 }`。apple.css 已含此规则（2026-04-28 升级），page 内不必重复 |
| `.apple-link` 文本里手打字面 `›` | `.apple-link::after` 已追加 ` ›`，再写一个渲染成双 chevron（2026-06-13 faq/team/landing 共 31 处实抓）。不要箭头用 `.apple-link--no-arrow`。**known-bugs 1.42** |
| 双语页 italic 引用块不给 zh 关斜体 | PingFang SC 没有真 italic，display 字号下浏览器对 CJK 做合成斜体，zh 引用读起来廉价难读（2026-06-13 faq + landing 实抓）。zh 字体覆盖必须带 `font-style: normal`，且选择器别 gate 在 `data-lang` 上（如 `blockquote .lang-zh`）。**known-bugs 1.38** |
| canonical 的 .md / self-diff 写"打算做的"而不是"渲染出来的" | .md 是下一个 critic 的评分标准，声明和渲染不符 = 教错（2026-06-13 changelog 实抓）。完稿后逐句对照截图核对版式声明；改 HTML 必须同 commit 改 .md。**known-bugs 1.37** |
| 文本容器写死 `height` / `position:absolute` 摆文字 / 负 margin 拉文字 | 文字重叠三大来源(2026-07-06 用户反馈跨美学反复出现)。固定高换 `min-height`;绝对定位只给角标且测过双语两种长度;负 margin 改父容器 gap。重叠 ≥40% 且 ≥80px² 现在是 **error** 直接 block。**known-bugs 1.25 两档升级** |
| 整页所有区块套同一个窄容器(或自定义 max-width < 640) | 1440 屏左右大片死空白,内容挤成一条(2026-07-06 用户反馈「左右留白太多,中间的字都挤在了一起」)。窄列只给纯 prose,表格/figure/grid 用 `.apple-container--wide` 或 hero 档;同页混用容器档位是正常的。`narrow-content-column` 兜底。**known-bugs 1.44** |
| 单个 `<p>` 写 15 行以上 / 连续 4+ 长段落中间无结构分隔 | 文字墙(2026-07-06 用户反馈「太多文字没有分段落…阅读不美观」)。单段 ≤5 行;≥3 并列要点改列表;成组论述装进 `.apple-admonition`(info / success / danger)色框分组;概念关系直接上图。`prose-wall` 兜底。**known-bugs 1.45** |
| 为了和上文列宽对齐,把密图(≥20 label)压进窄列或 grid 单元格 | 对齐让位于可读性——图看不清等于没画(2026-07-06 用户反馈原话「没必要一定要和上面对齐」)。密图 breakout 到 `.apple-container--wide` 独立区块,grid 里独占全行(`grid-column: 1 / -1`)或拆图。**known-bugs 1.29 / 1.44** |

---

## 📋 发布前 checklist（**MUST** — 四道机械检查都要 exit 0）

```bash
bin/design-review --skill=apple <path/to/your.html>          # 结构 + 渲染 + 可达性 + 截图
bin/design-review --skill=apple --pixel <path/to/your.html>  # 再加像素回归（需已有基线）
```

第三道是 **axe-core**，color-contrast 是阻断项。截图必须人眼看过。
任何一道 exit 非 0 → **任务没完成**。visual-audit 会报：
- `[error]` contrast < 3 — 修文字或背景
- `[warn]` contrast 3–4.5 — brand-intentional 除外
- `[warn]` hero diagram rendered at only X px — 容器太窄
- `[warn]` hero diagram smallest text renders at Xpx — SVG font-size 太小
- `[warn]` orphan figure — grid 里孤单非 hero 卡，span 2 或配对

## 📐 Lineup card 质量底线

每张卡 `aspect-ratio: 1`，满版 illustration，一眼能看出这个 skill 是干什么的。参考 demo 里 6 张（dark chip tile / REC 蓝 / PDF↔MD 双纸 / PDF 叠层 / palette 四宫格 / 暖色几何）。

## 📊 Hero diagram 质量底线

1. 在 1440 视口渲染宽度 ≥ 900px（用 `.apple-container--hero` + `grid-column: 1 / -1`）
2. 最小 SVG 字体 ≥ 10 (viewBox 坐标)，渲染 ≥ 9px
3. 有 stage labels（`01 · INPUT · 02 · MATCHER · 03 · DECISION`）引导视线
4. 用 soft shadow（blur 4–8, dy 5–12, alpha 0.10–0.14）而非粗描边
5. 至少一个细节 texture（subtle gradient / radial glow / 柔影层次）让它不像 ppt——**不含 dotted grid**，那是 anthropic 的方言（diagram-craft §0/§11，2026-07-22 motion lab critic 实抓）
