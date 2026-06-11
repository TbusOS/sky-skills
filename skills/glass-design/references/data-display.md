# Glass Data Display — 统计与图表

## 1. 大数字 stat

```html
<span class="glass-stat-number" data-count-to="12847">12,847</span>
<span class="glass-stat-label">events per second</span>
```

- **终值写在 markup**(千分位照常写);`data-count-to` 是纯数值,前后缀用
  `data-count-prefix` / `data-count-suffix`。JS 从 0 动画到终值后**恢复原文本**。
- 检查:`glass-countup-mismatch` 对比 markup 数值与 attr。
- 64–96px Space Grotesk 700 tabular-nums;delta 徽标用
  `.glass-stat-delta--up/--down`(mono 13px)。
- KPI 行 = 4 × `.glass-card` 等宽(peer 语义合法);卡内大数字 ≥36px 自动豁免 hollow-card 检查。

## 2. 图表(手画 SVG,不引库)

| 图型 | 配方 |
|---|---|
| 折线 / 面积 | 线 `#22D3EE` 2px;面积填充 `cyan→transparent` 线性渐变(alpha 0.18→0),**这是唯一允许的渐变填充**(它是"光落在数据上",不是装饰);网格线 `.glass-svg-grid` |
| 柱状 | 主序列 cyan、次序列 indigo `#4F46E5`;柱宽 ≤40px,圆角 4 |
| 环形 gauge | 描边式圆弧(底环 `--glass-line` + 进度弧 cyan),**禁 3D 饼图** |
| 表格 | `.glass-table`:mono 表头 uppercase,行 hover `rgba(34,211,238,0.06)`,不加竖线 |

- 坐标轴文字 `.glass-svg-ink-3` mono 11px;数据标签 `.glass-svg-ink-2`。
- 每图单一主 hue(cyan),对比序列才加 indigo;红绿只给涨跌语义。
- 图表 SVG 标 `role="img"` + `aria-label`,外包 `<figure>` + `<figcaption>`(takeaway)。
- path-draw(`data-draw`)给折线图最出效果;每页 ≤2 张图开 draw。

## 3. dashboard 节奏

KPI 行(count-up)→ 主图 Tier 1 面板(2/3 宽,折线/面积)+ 副图(gauge/柱)→
事件表(mono)→ 细 footer。整页 `<body class="glass-page--calm">`:数据页光要让位于数。
