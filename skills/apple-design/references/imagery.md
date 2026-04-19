# Apple Imagery

## 产品摄影

- **背景**：纯白或透明 PNG
- **构图**：产品居中，环境仅用于生活方式叙事（如相机演示）
- **阴影**：`var(--shadow-product)` 仅用于浮于白背景之上的产品图
- **圆角**：产品本体不加圆角；容器图片可加 `var(--radius-md)`

## 人物 / 环境

- 必须高质量、纪实感；避免 stock 图片感
- 可全屏 hero，此时**不加**圆角
- 文字叠加时使用 `background: rgba(0,0,0,0.4)` 或底部线性渐变

## 等距（isometric）插画

用于 environment / privacy 页的信息可视化：
- 色板：铜色 `#B87333` / 绿 `var(--apple-system-green)` / 灰阶
- 线粗 1.5-2px
- 无阴影，靠色块深浅造层次
- 平行投影（30°/60°），不用透视

## Newsroom 卡片图

- 1:1 aspect-ratio
- 底部 40% 区域叠加 `linear-gradient(to top, rgba(0,0,0,0.6), transparent)` 以保证白字可读

## 禁止

❌ 彩虹渐变 / 紫色渐变（AI slop 标志）
❌ drop-shadow 过重（> 30px blur）
❌ 斜切裁剪 / 不规则蒙版
❌ 图片堆叠过密（Apple 偏爱单图大留白）
