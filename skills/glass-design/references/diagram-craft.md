# Glass Diagram Craft — 暗玻璃 SVG 图示工艺

> glass 的图示语言:**图和页面是同一块玻璃**。节点用面板同款材质,
> 线用同款 hairline,语义焦点用 cyan glow。图看起来像"嵌在玻璃里",
> 不是"贴在玻璃上"。

## 1. 材质映射(与页面 token 一一对应)

| 图内元素 | 写法 | 对应页面材质 |
|---|---|---|
| 节点容器 | `<rect class="glass-svg-node" rx="16">` | Tier 1/2 面板 |
| 强调节点 | `<rect class="glass-svg-node-strong" rx="16">`(cyan 描边) | 焦点面板 |
| 主文字 | `<text class="glass-svg-ink">` | `--glass-ink` |
| 次文字 / 数据 | `class="glass-svg-ink-2"` | `--glass-ink-2` |
| stage label(`01 · INGEST`) | mono 12px ls 2 `class="glass-svg-ink-3"` | eyebrow |
| 结构线 / 分隔 | `class="glass-svg-line"` | hairline |
| 点阵网格肌理 | `class="glass-svg-grid"` | 背景肌理 |
| 流向线 / 焦点 | `stroke="#22D3EE"` 或 `class="glass-svg-accent-stroke"` | accent |
| 流向节点 / 徽标点 | `fill="#22D3EE"` 实心圆 ≤6px | accent |

**双主题铁律**:墨色 / 节点 / 线一律走 `.glass-svg-*` 类 —— 写死白 fill 在 light
模式下隐形(2026-06-11 smoke 页实测)。**cyan 的"可写死"豁免只给形状**(流向线 stroke、
实心圆点、徽标块);**cyan 文字必须走 `.glass-svg-accent-ink`**(light 自动切 #0E7490,
写死的 cyan 文字在 light 下 1.7:1 —— gallery canonical critic 实抓,known-bugs 6.4,
visual-audit 的 `glass-cyan-svg-text` 闸在 light 跑时按 error 抓)。

## 2. 颜色合约

- 每图 cyan glow 元素 **≤3 个**(语义焦点:当前 stage、关键路径、热点)——
  多了焦点互相打架;0 个则 `diagram-monochrome` 闸抓(glass 在白名单内)。
- 图表第二序列用 Depth Indigo `#4F46E5`(柱状对比、双折线)。
- violet / pink **永不**进图。
- 涨跌语义:`--glass-up` / `--glass-down`,只给 delta 徽标,不做面积填充。
- 满宽彩色带禁(saturated-band 闸):色带不填面积,焦点用 ≤56px 实心元素。

## 3. 尺寸档位(写图前先数 label)

| label 数 | 容器 | 渲染宽 |
|---|---|---|
| ≤10 | prose 列 | ≥660px |
| ≤18 | `.glass-container` | ≥990px |
| ≥20 或 ≥4 列 | `.glass-container--wide` 整行 figure | ≥1230px(figure 进 Tier 1 面板时按面板内宽计,允许 −48px padding 折让) |

- SVG 源码 `font-size ≥ 11`(worst-case 0.84 scale 下仍 ≥9px 渲染)。
- viewBox 紧贴内容,边距 ≤24px(svg-letterbox 闸 <72% 宽向填充即警)。
- featured diagram 进 Tier 1 面板 + 可选 `data-draw`(path-draw 只给 featured,gallery 卡静态)。

## 4. 工艺细节

- 节点圆角 rx 10–16 按节点尺寸取(小节点 10、常规 14–16);state 节点可用药丸 rx,位域格免圆角(相邻 bit 单元语义)。描边 1px。
- 软阴影不进 SVG(面板已带);图内层次靠 fill alpha 差(node 0.06 vs node-strong 0.08)。
- 肌理:可加 `.glass-svg-grid` 点阵线或 12% alpha 的 radial glow `<ellipse>`,每图 ≤1 处。
- 每张 figure 必有 `<figcaption>`,写 takeaway 不写 "Figure 1"(known-bugs 1.18)。
- `aria-label` 描述内容(a11y + 闸定位用)。
- 同 SVG 内 text bbox 不相交(svg-text-overlap 闸);写完渲染一遍再交。

## 5. 图型模板

`templates/diagrams/` 首批:architecture / flow / sequence / state-machine /
timeline / bar-chart(暗玻璃版)。从模板起步改内容,不要从零画。
