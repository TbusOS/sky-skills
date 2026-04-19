# Anthropic Data Display

参考 Anthropic Economic Index 报告与 research 博客图表。整体追求**低饱和、克制、可读性优先**。

## 数据可视化色板

```css
--chart-primary:   #6a9bcc   /* 柔蓝，默认主系列 */
--chart-secondary: #788c5d   /* 橄榄绿 */
--chart-tertiary:  #d97757   /* 橙，仅重点系列，不主用 */
--chart-grid:      #e8e6dc
--chart-axis:      #b0aea5
```

橙色 `#d97757` 是品牌主色但**不**是图表默认色 —— 默认走柔蓝 `#6a9bcc`，仅在需要单点强调时用橙。

## 图表类型规则

### 柱图

- 柱宽占网格 60%，圆角 4px，间距 20%
- 默认 `--chart-primary` 实色
- 强调柱（仅 1-2 根）用 `--chart-tertiary`

```html
<svg viewBox="0 0 600 360" role="img" aria-label="Sales by region">
  <rect x="40"  y="120" width="60" height="200" rx="4" fill="#6a9bcc"/>
  <rect x="160" y="60"  width="60" height="260" rx="4" fill="#6a9bcc"/>
  <rect x="280" y="160" width="60" height="160" rx="4" fill="#6a9bcc"/>
  <rect x="400" y="100" width="60" height="220" rx="4" fill="#d97757"/>
  <line x1="20" y1="320" x2="580" y2="320" stroke="#b0aea5" stroke-width="0.5"/>
</svg>
```

### 折线图

- 2px 粗线，端点 5px 圆点
- 区域填充仅在强调单一系列时使用：`fill="rgba(106,155,204,0.1)"`
- 多系列时：blue / green / orange 顺序

### 散点图

- 圆点 8px 直径，透明度 0.7
- 数值密集时建议 log 轴
- 标签字号 12px Poppins

### 地图（choropleth）

- 底色 `#e8e6dc`
- 数值梯度 5 级：`#f0ede3` → `#d8d8c8` → `#b0c8d8` → `#8aade0` → `#6a9bcc`
- **不**使用 `#b0aea5` 作梯度色（与 axis 色冲突）
- 边界线 0.5px `#b0aea5`

### 轴线 / 网格

- 轴线：0.5px `#b0aea5` 实线
- 网格线：0.5px `#e8e6dc` `stroke-dasharray="2 4"` dashed
- 不画图表外框

### 字体

| 元素 | 字号 | 字重 |
|---|---|---|
| 数值 / 数据标签 | 12px Poppins | 400 |
| 轴标题 | 13px Poppins | 500 |
| 图例 | 14px Poppins | 400 |

### 图例

- 位置：图表顶部水平
- swatch 12 × 12px，圆角 2px
- swatch 与文字间距 8px

```html
<div style="display:flex; gap:var(--space-5); font-family:var(--font-heading); font-size:14px;">
  <span style="display:inline-flex; align-items:center; gap:8px;">
    <span style="width:12px; height:12px; background:#6a9bcc; border-radius:2px;"></span>2024
  </span>
  <span style="display:inline-flex; align-items:center; gap:8px;">
    <span style="width:12px; height:12px; background:#788c5d; border-radius:2px;"></span>2025
  </span>
</div>
```

## 巨字号统计（较少使用）

Anthropic 仅在年度报告 / Economic Index 摘要等极少场景使用。Stat 数字用 `.anth-stat-number`（64px Poppins 700），下方 `.anth-stat-label` 14px secondary。详见 `design-tokens.md` 与 `components.md` §11 周边。

```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-7); text-align:center;">
  <div class="anth-stat">
    <span class="anth-stat-number">36%</span>
    <span class="anth-stat-label">of tasks measurably automated by Claude</span>
  </div>
  <div class="anth-stat">
    <span class="anth-stat-number">21</span>
    <span class="anth-stat-label">enterprise customers in case studies</span>
  </div>
  <div class="anth-stat">
    <span class="anth-stat-number">500K</span>
    <span class="anth-stat-label">context window tokens</span>
  </div>
</div>
```

## 反例

- 高饱和三原色（纯红 / 纯黄）柱图
- 3D 饼图 / 立体效果
- 网格线超过 0.5px 或加粗
- 柱图所有柱子全用橙色（橙是强调色，过度使用稀释品牌）
- 渐变填充
- 图例放在图表底部（顶部更易扫描）
