# Anthropic Design Tokens

所有 token 均以 CSS 自定义属性形式在 `assets/anthropic.css` 的 `:root` 下声明。

## 颜色

| Token | Hex | 用途 |
|---|---|---|
| `--anth-bg` | `#faf9f5` | 主暖背景 |
| `--anth-bg-subtle` | `#f0ede3` | 次级段落底 / 代码块底 |
| `--anth-text` | `#141413` | 主文字 |
| `--anth-text-secondary` | `#6b6a5f` | 次级文字 |
| `--anth-orange` | `#d97757` | 主强调 / CTA |
| `--anth-orange-hover` | `#c56544` | 按钮 hover |
| `--anth-blue` | `#6a9bcc` | 次强调 / 分类 / 数据图 |
| `--anth-green` | `#788c5d` | 第三强调 / 分类 |
| `--anth-mid-gray` | `#b0aea5` | 辅色 |
| `--anth-light-gray` | `#e8e6dc` | 分隔 / 卡片底 |
| `--anth-danger` | `#a14238` | danger admonition |

## 字体栈

```css
--font-heading: "Poppins", "Helvetica Neue", Arial, sans-serif;
--font-body:    "Lora",    Georgia, "Times New Roman", serif;
--font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
```

**重要：body 用 Lora 衬线 —— 这是 Anthropic 与 Apple 最核心的视觉差异。**

## 字号层级

| Role | size / line-height / weight |
|---|---|
| Hero headline | 56px / 1.1 / 600 (Poppins) |
| Section headline | 40px / 1.15 / 600 (Poppins) |
| Subhead | 24px / 1.3 / 500 (Poppins) |
| Body | 18px / 1.65 / 400 (Lora) |
| Caption | 13px / 1.4 / 400 |
| Stat number | 64px / 1 / 700 (Poppins) |

## 间距（与 Apple 相同 4px grid）

```
--space-1: 4px   --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 24px  --space-6: 32px   --space-7: 48px   --space-8: 64px
--space-9: 80px  --space-10: 120px
```

## 圆角

```
--radius-sm: 6px
--radius-md: 16px
--radius-lg: 24px
--radius-pill: 9999px
```

## 阴影

```
--shadow-card: 0 2px 12px rgba(20,20,19,0.05);
--shadow-pop:  0 10px 40px rgba(20,20,19,0.08);
```

## 缓动 / 时长

```
--ease-anth: cubic-bezier(0.25, 1, 0.5, 1);
--duration-sm: 240ms;
--duration-md: 400ms;
--duration-lg: 700ms;
```

## 断点

```
mobile:  ≤768px
tablet:  769–1024px
desktop: ≥1025px
```

容器 max-width：720（长文）/ 960（常规）/ 1200（wide）。
