# Anthropic Design 示例 Prompt

## 基础

```
用 anthropic-design 风格做一个研究论文风格的长文页面，
Lora serif 正文，橙色 pull-quote，低饱和图表。
引用 skills/anthropic-design/assets/{fonts.css,anthropic.css}。
```

## 产品落地页

```
用 anthropic-design 做 SaaS 产品首页：hero + 橙色 Try 按钮 + 3 个能力卡 +
客户引用 + pricing teaser 三列。参考 product-overview.html 模板。
```

## 长文 / 博客

```
把这份 Markdown 文章用 anthropic-design 的 article.html 模板渲染成 HTML：
720px 单栏 Lora serif，顶部 badge + 日期 + 阅读时长，
中间嵌入一个低饱和柱状图，底部 pull quote。
```

## 开发者文档

```
用 anthropic-design 的 docs.html 三栏布局渲染这份 API 文档。
代码块 JetBrains Mono + 米白底，默认 info admonition 是蓝色标题。
```

## 演示页

```
用 anthropic-design 的 slide-deck.html 模板做 10 页产品汇报：
Cover / Problem / Insight / Solution / 大数字统计 / 用户引用 / Roadmap / Ask。
暖米白底，橙色点缀。
```

## 定价

```
用 anthropic-design 的 pricing.html 模板做三档套餐页：
Free / Pro / Max。Pro 加橙边 + "Most popular" badge。
下方带完整比较 anth-table。
```

## 数据报告

```
用 anthropic-design 的 data-report.html 模板做一份季度分析：
- hero 含 badge + 日期 + 作者
- 4 节每节一张低饱和图（柱/折/散/地图）
- 结论段
- 客户 logo 墙
- "Download PDF" anth-link 结尾
```

## 企业页 / Contact sales

```
用 anthropic-design 的 enterprise.html 模板做企业客户页：
logo 墙 + 3 列价值主张 + 合规徽章（SOC 2 / ISO / HIPAA / GDPR 用 anth-badge）+
联系表单（全套 anth-input/select/textarea + 橙胶囊 submit）。
```

## 架构图 / 流程图

```
用 anthropic-design/templates/diagrams/flow.svg 画一个
"用户输入 → 意图识别 → （是否安全）→ 生成 / 拒绝" 流程图。
节点按类别填色：input 橙 / process 蓝 / output 绿 / 决策菱形橙。
```

```
用 anthropic-design/templates/diagrams/hierarchy.svg 画一个
orchestrator + 4 subagents 多代理系统图。
中心橙色 "Lead"，放射 4 个蓝/绿 subagents。
```

```
用 anthropic-design/templates/diagrams/architecture.svg 画三层 SaaS 架构：
Interface Layer（橙，含 Chat / API / SDK）/
Agent Layer（蓝，含 Orchestrator / Tools / Memory）/
Infrastructure（绿，含 Models / Storage / Queue）。
```

```
用 anthropic-design/templates/diagrams/timeline.svg 画项目 6 里程碑：
研究 → 原型 → Alpha → Beta → GA → 迭代。已完成节点 `--anth-orange`，
未开始节点 `--anth-mid-gray`。
```

## 色板套用

```
按 anthropic-design 的色板（#faf9f5 底 + #d97757 橙 + Poppins / Lora）
重写这段 HTML，不要改结构。
```

## 渐进集成

```
把 anthropic-design/assets/anthropic.tailwind.js 的 preset merge 到
我的 tailwind.config.js。不要动现有业务类。
```

## 不要这样做

- ❌ "用 anthropic-design 做 Apple 风格页面" — 两套美学互斥，用 apple-design。
- ❌ "用 anthropic-design 输出高饱和彩虹图表" — 违反低饱和调色。
- ❌ "用 anthropic-design 做 iOS 原生界面" — 网页美学不适用。
