# Apple Data Display

## 巨字号统计（Apple 标志性做法）

用法：生活方式 / 环保 / 隐私页报告数据。最常见是三列并排。

```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-7); text-align:center;">
  <div class="apple-stat">
    <span class="apple-stat-number">75%</span>
    <span class="apple-stat-label">Reduction in emissions by 2030</span>
  </div>
  <div class="apple-stat">
    <span class="apple-stat-number">17B</span>
    <span class="apple-stat-label">Gallons of freshwater saved in 2025</span>
  </div>
  <div class="apple-stat">
    <span class="apple-stat-number">100%</span>
    <span class="apple-stat-label">Renewable electricity in operations</span>
  </div>
</div>
```

## 传统图表（避免）

Apple 营销页**几乎不使用**柱图 / 饼图 / 折线。如必须：
- 单色 `var(--apple-link)` 实色柱
- 细 0.5px 轴线，无网格
- 标签 `var(--font-text)` 12px

## 等距信息图

见 `imagery.md`。参考 environment 页的"生命周期 tab"与 Daisy 机器人插图。节点间关系用等距立方体叠置表达，而非连线图。

## 规格并排段落（替代 table）

规格页 Apple 用并排 section + h3，而非 table。见 `components.md` 第 7 节。
