# Anthropic Typography

## 核心规则

1. **标题 Poppins 无衬线**（几何感强），**正文 Lora 衬线 serif**。这是与 Apple 最核心的区别。
2. Body 默认 18px / line-height 1.65 —— Lora 需要更宽行距才舒适。
3. **段落 max-width ≤ 680px**；长文容器用 `.anth-container--narrow` (720px)。
4. **链接**：`.anth-link` 默认带 ` →`（U+2192）；不需要时加 `.anth-link--no-arrow`。
5. **引用**：Lora italic + 3px 橙色左边（见 components.md）。
6. **代码**：JetBrains Mono + `var(--anth-bg-subtle)` 底。
7. 斜体正文合理 —— 与 Apple 相反，Anthropic Lora italic 在引用、强调处积极使用。

## 字号层级

见 `design-tokens.md`。简表：

| Role | Font | size / line-height / weight |
|---|---|---|
| Hero h1 | Poppins | 56 / 1.1 / 600 |
| Section h2 | Poppins | 40 / 1.15 / 600 |
| Subhead h3 | Poppins | 24 / 1.3 / 500 |
| Body p | Lora | 18 / 1.65 / 400 |
| Caption | Lora | 13 / 1.4 / 400 |
| Stat number | Poppins | 64 / 1 / 700 |

## 实践示例

```html
<h1>AI research & products</h1>
<p>We build reliable, interpretable, and steerable AI systems...</p>
<a class="anth-link">Read the paper</a>

<!-- 行内强调（Lora italic 自然） -->
<p>Constitutional AI is an approach for training a <em>helpful, harmless, and honest</em> assistant.</p>

<!-- 不带箭头的链接（导航 / footer） -->
<a class="anth-link anth-link--no-arrow">Privacy</a>
```

## 字号缩放（响应式）

`anthropic.css` 媒体查询：
- ≤768px：h1 → 36，h2 → 28
- 769–1024px：h1 → 48
- ≥1025px：h1 → 56（默认）

## 反例

- 正文用 Poppins 或其他无衬线字体（失去编辑感）
- 标题用衬线字体
- 超过 720px 宽的正文（Lora 在宽列里视觉松散）
- 全程 italic（italic 仅用于引用、强调）
- 正文行高 < 1.5（Lora 字面较窄，需要呼吸）
- 链接尾部用 `›` 或裸文字（Anthropic 链接箭头是 `→`）
