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
- 每图单一主 hue(cyan),对比序列才加 indigo。
- **≥3 序列的官方阶梯(两色 × 透明度 × 线型,不引第三色相)**:

  | 序列 | 颜色 | 折线线型 | 柱状 |
  |---|---|---|---|
  | S1 | cyan `#22D3EE` 100% | 实线 | 实心 |
  | S2 | indigo `#4F46E5`(dark 线用 `#818CF8`)100% | 实线 | 实心 |
  | S3 | cyan 55%(`rgba(34,211,238,.55)`) | 虚线 `8 5` | 斜纹/浅 alpha |
  | S4 | indigo 55%(`rgba(129,140,248,.55)`) | 点线 `2 4` | 斜纹/浅 alpha |

  第 5 个序列 = 图太重:拆图或聚合,**禁止加第三色相**。色盲规矩:用了
  alpha 阶梯就必须叠线型通道,图例同时展示颜色 + 线型。
- 红绿语义分两条轴,**一张图只能用其中一条**:财务涨跌用 `--glass-up/--glass-down`
  (delta 徽标);工程状态用 `--glass-ok/--glass-warn/--glass-danger`
  (pass / 降级 / 错误路径,ok·danger 与 up·down 同色相、不同语义轴)。
  状态色必须带非颜色通道(danger 节点类自带虚线描边;warn/ok 配图标或标签)。
- 图表 SVG 标 `role="img"` + `aria-label`,外包 `<figure>` + `<figcaption>`(takeaway)。
- path-draw(`data-draw`)给折线图最出效果;每页 ≤2 张图开 draw。

## 3. dashboard 节奏

KPI 行(count-up)→ 主图 Tier 1 面板(2/3 宽,折线/面积)+ 副图(gauge/柱)→
事件表(mono)→ 细 footer。整页 `<body class="glass-page--calm">`:数据页光要让位于数。
