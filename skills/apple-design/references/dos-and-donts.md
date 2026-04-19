# Apple Do / Don't

## ✅ Do

- 白 / 浅灰 / 黑三段交替叙事
- 产品摄影居中 + 大量留白
- 巨字号统计（120px）
- 文字链 + 下划线 + `›` 结尾
- SF Pro 全家族（Display / Text / Mono）
- 章节间 80–120px padding
- 毛玻璃 nav（`backdrop-filter: blur(20px)` + `--apple-bg-nav`）
- 圆角 12px 卡片
- 无衬线正文，Text 用于 <24px 场景
- 使用 `var(--duration-sm)` 等 token，不写死毫秒
- `.apple-link::after` 的 `›` 如不需要用 `.apple-link--no-arrow` 取消

## ❌ Don't

- 紫色 / 彩虹渐变（AI slop 标志）
- 饼图 / 3D 柱图 / 霓虹光效
- 大量彩色实心按钮堆叠（Apple 只在 Buy/Add to Bag 用）
- Inter / Roboto 作标题字
- 全页同一色无节奏
- 反弹 / 弹簧 / rotation 入场
- 斜切蒙版 / 不规则裁剪
- 紧贴屏幕边缘的内容（min padding 24px）
- 任何衬线字体
- `transition: all`（显式列属性）
- 硬编码 `#FFFFFF`（用 `var(--apple-bg)`）、硬编码 `240ms`（用 `var(--duration-sm)`）
- 数字分页（用 "View All ›"）
