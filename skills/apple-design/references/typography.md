# Apple Typography

## 核心规则

1. **全程无衬线**。不使用任何衬线字体。
2. **Display 用于 24px 及以上**；**Text 用于 24px 以下**。两者均在系统 SF 栈命中，`-apple-system` 自动切换。
3. **Tracking（字距）**：标题取负值（-0.015 ~ -0.005em），正文保持 `normal`；Hero 约 -0.015em，Section 约 -0.01em。
4. **Max-width**：段落 ≤ 680px 以保持舒适阅读。
5. **代码**：`SF Mono` 或 `ui-monospace`，`var(--apple-bg-alt)` (#F5F5F7) 底。
6. **下划线链接**：`text-underline-offset: 0.2em; text-decoration-thickness: 1px;`。
7. **链接箭头**：`.apple-link` 默认在链接末尾追加 ` ›`（U+203A）；若不需要，改用 `.apple-link .apple-link--no-arrow`。

## 字号层级表

详见 `design-tokens.md`。

## 实践示例

```html
<h1>Designed for Apple Intelligence</h1>
<p class="apple-lead">A new era of personal AI, private by design.</p>
<p>Built on groundbreaking generative models...</p>
<a class="apple-link">Learn more</a>
```

## 反例

❌ Inter / Roboto / system-ui 直接做标题字（失去 SF Display 的几何特征）
❌ 任何斜体正文（Apple 官网极少用 italic body）
❌ 大于 -0.02em 的负 tracking（视觉会挤压）
❌ 在正文里混用衬线字体
