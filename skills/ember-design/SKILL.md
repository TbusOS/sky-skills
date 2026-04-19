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

## 发布前检查（MUST — 可执行）

生成完整 HTML 后，必须：

```bash
# 1) 结构验证
python3 skills/ember-design/scripts/verify.py <path/to/your.html>

# 2) 视觉验证（Playwright）
node skills/ember-design/scripts/screenshot.mjs <path/to/your.html> shot.png
```

verify.py 会扫占位符、容器 BEM、未定义 class、SVG 平衡等。**exit 非 0 = 没完成。** screenshot 需要肉眼看过再宣布 done。
