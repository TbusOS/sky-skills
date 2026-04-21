---
name: ember-design
description: "Render HTML/CSS in a handcraft-editorial aesthetic — warm cream background (#fff2df), deep chocolate text (#312520), rich brown CTAs (#492d22), gold accent (#c49464), Fraunces display serif + Inter body + IBM Plex Mono. Evokes artisan brands (Aesop / Kinfolk / boutique hotels / literary journals / small-batch coffee). TRIGGER when the user says 'ember 风格' / 'ember style' / '暖棕 / 咖啡 / 手工 / 编辑风格' / 'Aesop style' / 'warm editorial', or asks for a landing page with craft / artisan / heritage / literary warmth. DO NOT TRIGGER for high-tech minimalism (use apple-design) or cream-with-orange (use anthropic-design)."
last-verified: 2026-04-19
---

# Ember Design — Handcraft Editorial

让 Claude 把任何 HTML 渲染成"匠心 · 暖色 · 编辑"的视觉语言：深米底、Fraunces 展示衬线、深巧克力文字、棕色填色按钮、一抹金作点缀。灵感来自 Aesop、Kinfolk、小众精品酒店与文学期刊。

## 使用方式

1. `<link rel="stylesheet" href="assets/fonts.css">` 然后 `<link rel="stylesheet" href="assets/ember.css">`。
2. 用 `ember-*` 前缀 class。
3. 模板见 `templates/`。

## 触发关键词

`ember 风格` / `ember style` / `暖棕` / `咖啡色系` / `手工感` / `编辑式` / `Aesop` / `Kinfolk` / `artisan` / `craft` / `heritage` / `boutique` / `literary journal`

## 不要用于

- 高科技冷极简（用 `apple-design`）
- 米底 + 橙色（用 `anthropic-design`）
- 霓虹 / 彩虹 / 赛博朋克
- 深色 / dark mode（ember 只活在明亮暖色下）

## 阅读顺序

1. `references/design-tokens.md` — 色板 + 字体 + 间距
2. `references/dos-and-donts.md` — 反例 + **发布前 checklist**
3. `assets/ember.css` — CSS 变量与组件
4. `templates/landing-page.html` — 着陆页骨架

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

```bash
bin/design-review --plan --skill=ember --page=<pricing|landing|docs-home> > /tmp/contract.md
# 读 skills/ember-design/references/canonical/<page>.html + .md
```

### 生成**后**跑四闸

```bash
bin/design-review --critic <path/to/your.html>
```

四闸:`verify.py` · `visual-audit.mjs`(加 §J italic / §K brand + smell)·
`screenshot.mjs` · `critic.mjs`(LLM taste 0-100 分)。

任一 error = 失败。critic 得分 < 75 必修。canonical 自回归 ≥ 90。

规则:`skills/design-review/references/cross-skill-rules.md` A-L +
`known-bugs.md`。canonical:`skills/ember-design/references/canonical/`。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator。

### ember 专属要点

历史坑:`.ember-button` 曾被 `.ember-nav a` 吃掉 color(选择器特异性),
在 nav 里的 button 必须写 `.ember-nav a.ember-button { color:#ffffff }` 单独规则。
风格规则详见 `references/dos-and-donts.md`。
