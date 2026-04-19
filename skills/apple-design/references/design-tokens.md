# Apple Design Tokens

所有 token 均以 CSS 自定义属性形式在 `assets/apple.css` 的 `:root` 下声明。本文件是人类可读的索引。

## 颜色

| Token | Hex | 用途 |
|---|---|---|
| `--apple-bg` | `#FFFFFF` | 主背景 |
| `--apple-bg-alt` | `#F5F5F7` | 交替段落 / 页脚 / 代码块底 |
| `--apple-bg-dark` | `#000000` | 黑色章节（Pro 系列风） |
| `--apple-text` | `#1D1D1D` | 主文字 |
| `--apple-text-secondary` | `#6E6E73` | 次级文字 |
| `--apple-text-on-dark` | `#F5F5F7` | 黑底主文字 |
| `--apple-link` | `#0071E3` | 文字链 / Buy CTA |
| `--apple-link-hover` | `#0077ED` | 链接 hover |
| `--apple-divider` | `#D2D2D7` | 细分隔线 |
| `--apple-system-green` | `#34C759` | toggle 开启 |
| `--apple-system-orange` | `#FF9500` | warning admonition |
| `--apple-system-red` | `#FF3B30` | danger admonition |

## 字体栈

```css
--font-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-text:    "SF Pro Text",    -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-mono:    "SF Mono", ui-monospace, Menlo, Monaco, "Cascadia Mono", monospace;
```

## 字号层级

| Role | size / line-height / weight / letter-spacing |
|---|---|
| Hero headline | 64px / 1.05 / 700 / -0.015em |
| Section headline | 48px / 1.08 / 600 / -0.01em |
| Subhead | 28px / 1.14 / 500 / -0.005em |
| Lead body | 21px / 1.38 / 400 / normal |
| Body | 17px / 1.47 / 400 / normal |
| Caption | 12px / 1.33 / 400 / normal |
| Stat number | 120px / 1 / 600 / -0.02em |

## 间距（4px grid）

```
--space-1: 4px   --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 24px  --space-6: 32px   --space-7: 48px   --space-8: 64px
--space-9: 80px  --space-10: 120px
```

## 圆角

```
--radius-sm: 6px     # 输入 / 标签
--radius-md: 12px    # 卡片 / 图片
--radius-lg: 18px    # 大模块
--radius-pill: 9999px
```

## 阴影

```
--shadow-product: 0 20px 60px -20px rgba(0,0,0,0.15);
--shadow-card:    0 2px 8px rgba(0,0,0,0.04);
--shadow-nav:     0 0 0 1px rgba(0,0,0,0.04);
```

## 缓动 / 时长

```
--ease-apple:     cubic-bezier(0.42, 0, 0.58, 1);
--ease-apple-out: cubic-bezier(0.25, 1, 0.5, 1);
--duration-sm: 240ms;
--duration-md: 400ms;
--duration-lg: 700ms;
```

## 断点

```
mobile:   ≤734px
tablet:   735–1068px
desktop:  1069–1440px
large:    ≥1441px
```

容器 max-width：980（常规）/ 1068（wide）/ 1280（hero）。
