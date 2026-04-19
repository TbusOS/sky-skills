# Apple Design 示例 Prompt

## 基础调用

```
用 apple-design 做一个"个人简介"落地页，包含 hero、项目 lineup、3 个巨字号统计、
联系方式页脚。引用 skills/apple-design/assets/apple.css。
```

## 文章排版

```
把这段 Markdown 文章用 apple-design 的 article.html 模板渲染成单页 HTML：
- 680px 单栏
- 顶部 category badge
- 日期用 apple-caption
- 代码块用 apple-code 类
```

## 开发者文档

```
用 apple-design 的 docs.html 三栏布局渲染这份 API 文档。左栏放目录，
右栏放 TOC，代码块 SF Mono。
```

## 演示页 / 公众号图文

```
用 apple-design 的 slide-deck.html 模板做一个 10 页季度汇报：
封面 / 目标 / 现状（3 个统计）/ 方案 / 时间线 / 风险 / Q&A。
```

## 商品配置器

```
模仿 apple-design 的 product-configurator.html，做一个"订阅套餐选购"页：
左侧套餐大图，右侧颜色主题、档位选项、周期分段，底部 sticky 购买栏。
```

## 规格对比

```
用 apple-design 的 specs-page.html 风格把这份产品对比信息做成页面：
并排段落优先，必要时用 apple-table 降级。
```

## 表单

```
用 apple-design 的 form.html 模板做一个"联系销售"表单，
含公司规模 select、主要兴趣 segmented、订阅 checkbox、提交按钮用 apple-button。
```

## 流程图 / 架构图

```
用 apple-design/templates/diagrams/flow.svg 为模板，画一个"用户注册 → 邮箱验证 →
（是否通过）→ 入驻 / 失败"四节点流程图。节点保持 Apple 圆角矩形 + 细灰描边。
```

```
用 apple-design/templates/diagrams/architecture.svg 为模板，画一个三层架构：
前端层（React/Next）→ 服务层（API/Auth/Cache）→ 数据层（Postgres/Redis）。
```

```
用 apple-design/templates/diagrams/hierarchy.svg 为模板，画 SwiftUI view tree：
ContentView → NavigationStack → List → ListRow → DetailView。
```

```
用 apple-design/templates/diagrams/timeline.svg 为模板，画项目 6 阶段时间线：
调研 → 设计 → 开发 → 测试 → 上线 → 维护。
```

## 仅套色板

```
按 apple-design 的色板（白 + F5F5F7 + 0071E3 链接 + 1D1D1F 文字）重写这段 HTML，
不要动结构，只改样式。
```

## 渐进集成

```
我已有项目用 Tailwind。把 apple-design/assets/apple.tailwind.js 的 preset
merge 到我的 tailwind.config.js。不要动现有业务 class。
```

## 不要这样做

- ❌ "用 apple-design 做一个紫色渐变的赛博朋克页面" — 违背品牌。
- ❌ "用 apple-design 做 iOS 原生应用界面" — 用 Apple HIG skill。
- ❌ "用 apple-design 输出 Material 3 风格" — 与 Apple 克制美学冲突。
