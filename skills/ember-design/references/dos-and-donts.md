# Ember Do / Don't

> 这个文档既是美学指引，也是 **"这些坑我们已经踩过了"** 的防御清单。
> 每条 Don't 旁边都有一句"Why"——如果不懂 Why，就不要删掉它。

## ✅ Do

- 暖米白 `#fff2df` 底 + 深巧克力 `#312520` 文字
- 标题用 Fraunces 衬线（SOFT=50, opsz=144 软化）
- 正文用 Inter，17px / 1.6 舒适阅读
- CTA 用实心棕 `#492d22` 胶囊 + **纯白字（不是 cream）**
- 金色 `#c49464` 作点缀（链接下划线 / 引号 / 卡片边）
- pull-quote 左侧大号引号 + Fraunces italic
- 卡片用纯白 `#ffffff`（与米底拉开对比）
- 分隔用 `.ember-divider--ornament`（· · · 金色三点）提编辑感
- 用 `var(--ember-*)` token，不写死 hex

## ❌ Don't — 每条都带 Why

| Don't | Why（过去踩过的坑） |
|---|---|
| 冷蓝 / 冷灰 | 破坏暖调 |
| 霓虹 / 彩虹 / 紫色渐变 | 不匹配手工感 |
| 标题用无衬线 | 失去手工感，那是 apple-design 的领地 |
| 正文用衬线 | 长文阅读疲劳，Inter 是正文 |
| 直角矩形无圆角 | ember 偏柔和圆角 |
| `transition: all` | 性能差 + 视觉跳动。只 transition 具体属性 |
| Dark mode | ember 只活在暖亮环境 |
| 把 `[hero]` / `[SVG]` / `[placeholder]` 留在产物里 | 上线即暴露空白格子。verify.py 会扫 |
| `class="ember-container--narrow"` 只写 modifier 不带 base | base 提供 `margin: 0 auto`，modifier 只覆盖 max-width。单独写 modifier → 容器贴左。**必须** `class="ember-container ember-container--narrow"` |
| `.ember-button` 的 color 给 `var(--ember-bg)` 即 cream | cream 在深棕上对比度 ~1.2，几乎看不见。**必须** `color: #ffffff` |
| 在 nav 里的按钮没有更高特异性选择器 | `.ember-nav a { color: var(--ember-text); }` 会覆盖 `.ember-button` 的 color。**必须** 额外写 `.ember-nav a.ember-button { color:#ffffff; }` |
| hero 框图 figure 用 `padding: var(--space-7)` | 吞掉 SVG 宽度。用 `var(--space-5) var(--space-6)` |
| hero 框图 里 font-size="8" 这种小字 | 渲染下来 <9px 看不清。最小 font-size 给 10 |
| 多列网格里一张卡孤单独占一行左半边 | 视觉断裂。要么 `grid-column: 1 / -1` 居中 SVG，要么配对另一张 1 列卡 |
| lineup 卡只塞一个细线小图标居中 | 像 wireframe。做满版 illustration tile |

## 📋 发布前 checklist（MUST — 三道闸都要 exit 0）

```bash
# 1) 结构验证（placeholder / BEM / 未定义 class / SVG 平衡）
python3 skills/ember-design/scripts/verify.py <path/to/your.html>

# 2) 视觉渲染验证（Playwright + WCAG 对比度 + 框图尺寸 + 孤儿卡）
node skills/ember-design/scripts/visual-audit.mjs <path/to/your.html>

# 3) 全页截图，肉眼审核
node skills/ember-design/scripts/screenshot.mjs <path/to/your.html> shot.png
```

任何一条 exit 非 0 → **任务没完成**。

## 📐 Lineup card 质量底线

每张卡 `aspect-ratio: 1`，满版 illustration，一眼能看出这个 skill 是干什么的。禁止"小图标 + 大片空白"。

## 📊 Hero diagram 质量底线

1. 在 1440 视口渲染宽度 ≥ 900px
2. 最小字体 ≥ 10（viewBox 坐标系），渲染 ≥ 9px
3. 用 stage labels（`01 · 02 · 03`）引导视线
4. 只用本 skill 的调色板
5. 加至少一个肌理细节（hairline 网格 / 阴影 / 装饰点）让它不像 ppt
