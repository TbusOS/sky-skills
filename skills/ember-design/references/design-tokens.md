# Ember Design Tokens

所有 token 以 CSS 自定义属性形式在 `assets/ember.css` 的 `:root` 下声明。

## 颜色

| Token | Hex | 用途 |
|---|---|---|
| `--ember-bg` | `#fff2df` | 主暖米底（用户指定的核心色） |
| `--ember-bg-subtle` | `#f5e5c8` | 次级段落 / 代码块底 / 卡片底 |
| `--ember-text` | `#312520` | 主文字 —— 深巧克力，用户指定 |
| `--ember-text-secondary` | `#6b5a4f` | 次级文字（暖灰） |
| `--ember-brown` | `#492d22` | 主强调色 / CTA 按钮，用户指定 |
| `--ember-brown-hover` | `#5c3a2b` | 按钮 hover |
| `--ember-gold` | `#c49464` | 次强调（金色点缀） |
| `--ember-divider` | `#e6d9bf` | 分隔线 / 细边 |
| `--ember-card` | `#ffffff` | 卡片白底（与米色背景拉开对比） |
| `--ember-danger` | `#8b3a2f` | danger admonition（深砖红） |

## 字体

```css
--font-heading: "Fraunces", Georgia, "Times New Roman", serif;
--font-body:    "Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
--font-mono:    "IBM Plex Mono", ui-monospace, Menlo, monospace;
```

Fraunces 是变轴衬线（variable axis），带温度与手工感 —— 区别于 Anthropic 的 Poppins 几何无衬线、Apple 的 SF 系统字。正文用 Inter 保持清晰。

## 字号层级

| 角色 | size / line-height / weight / letter-spacing |
|---|---|
| Hero headline | 60px / 1.08 / 600 (Fraunces) / -0.01em |
| Section headline | 40px / 1.15 / 600 (Fraunces) / -0.005em |
| Subhead | 24px / 1.3 / 500 (Fraunces) |
| Body | 17px / 1.6 / 400 (Inter) |
| Lead body | 19px / 1.55 / 400 (Inter) |
| Caption | 13px / 1.45 / 400 (Inter) |
| Stat number | 72px / 1 / 600 (Fraunces) / -0.02em |

## 间距（与其他 skill 对齐的 4px grid）

```
--space-1: 4px   --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 24px  --space-6: 32px   --space-7: 48px   --space-8: 64px
--space-9: 80px  --space-10: 120px
```

## 圆角

```
--radius-sm: 6px    # 输入
--radius-md: 12px   # 卡片
--radius-lg: 20px   # 大模块
--radius-pill: 9999px
```

## 阴影

```
--shadow-card: 0 4px 20px rgba(73, 45, 34, 0.08);
--shadow-pop:  0 12px 40px rgba(73, 45, 34, 0.12);
```

阴影用棕色 alpha —— 比 Apple 的黑色阴影更暖。

## 缓动

```
--ease-ember: cubic-bezier(0.32, 0.72, 0, 1);
--duration-sm: 240ms;
--duration-md: 400ms;
--duration-lg: 700ms;
```

## 断点

```
mobile:   ≤768px
tablet:   769–1024px
desktop:  ≥1025px
```

容器 max-width：720（长文正文）/ 960（标准）/ 1200（宽）。
