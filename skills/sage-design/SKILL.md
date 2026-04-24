---
name: sage-design
description: "Render HTML/CSS in a quiet, modern, Nordic-minimal aesthetic — sage green (#97B077), warm rice-paper cream (#f8faec), deep indigo (#393C54), Instrument Serif display + Inter body + JetBrains Mono. Evokes Muji / Kinfolk-Nordic / botanical studios / modern journals / quiet tech brands / reading apps. TRIGGER when the user says 'sage 风格' / 'sage style' / '抹茶' / '北欧极简' / '安静' / 'quiet editorial' / 'Nordic minimal' / 'matcha / botanical / library', or asks for a landing / journal / reading interface with restraint and negative space. DO NOT TRIGGER for warm-brown handcraft (use ember-design), high-tech white minimalism (use apple-design), or cream-with-orange (use anthropic-design)."
last-verified: 2026-04-19
---

# Sage Design — Quiet Nordic Minimalism

让 Claude 把任何 HTML 渲染成"安静 · 留白 · 现代植物感"的视觉语言：米黄底、深靛蓝标题、sage 绿强调、Instrument Serif 衬线 headline、Inter 无衬线正文。灵感来自 Muji、Kinfolk、北欧 / 日系生活方式杂志、植物学图鉴、安静的独立品牌。

## 使用方式

1. `<link rel="stylesheet" href="assets/fonts.css">` 然后 `<link rel="stylesheet" href="assets/sage.css">`
2. 用 `sage-*` 前缀 class
3. 模板见 `templates/`

## 调色板（严格遵守）

| Token | Hex | Use |
|---|---|---|
| `--sage-bg` | `#f8faec` | page / section background (rice-paper cream) |
| `--sage-sage` | `#97B077` | accent / CTA fill / illustration primary |
| `--sage-ink` | `#393C54` | display headings, strong text, dark sections |
| `--sage-text` | `#2a2c40` | body text |
| `--sage-text-secondary` | `#6d6f82` | muted / captions |
| `--sage-divider` | `#e5e8da` | hairline rules |
| `--sage-card` | `#ffffff` | elevated cards |
| `--sage-sage-dark` | `#7a9561` | sage hover |

**Typography:** Instrument Serif (display, 500/400-italic) + Inter (body, 400/500/600) + JetBrains Mono (code, 400).

## 触发关键词

`sage 风格` / `sage style` / `抹茶` / `北欧极简` / `quiet editorial` / `Nordic minimal` / `botanical` / `matcha` / `library feel` / `Muji style` / `reading app` / `journal / magazine with restraint` / `modern green brand`

## 不要用于

- 暖棕 / 手工 / Aesop（用 `ember-design`）
- 苹果风极简（用 `apple-design`）
- 橙色胶囊按钮（用 `anthropic-design`）
- dark mode / 霓虹 / 彩虹
- 情绪化插画 / 儿童 UI

## 阅读顺序

1. `references/design-tokens.md` — 色板 + 字体 + 间距
2. `references/dos-and-donts.md` — 反例 + **发布前 checklist**
3. `assets/sage.css` — CSS 变量与组件
4. `templates/` — 着陆页骨架（mirrors ember-design structure, sage palette）

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

```bash
bin/design-review --plan --skill=sage --page=<pricing|landing|docs-home> > /tmp/contract.md
# 读 skills/sage-design/references/canonical/<page>.html + .md
```

### 生成**后**写 self-diff note(交付前 MUST)

生成器在写完 HTML、跑 4 闸之前,必须在 `</body>` 前 embed 一个
`design-review:self-diff v1` HTML 注释块,列出 5-7 条本次生成的关键
设计决策 + 2-3 条 known trade-offs。contract 见
`skills/design-review/references/cross-skill-rules.md §M`,示范参考
`skills/anthropic-design/references/canonical/comparison.html` 末尾。

没有 self-diff = canonical 不被 `verify.py` 承认。critic 也无法做实
质评审(没有作者意图的靶子)。HARNESS-ROADMAP Phase 03 的硬规则。

### 生成**后**跑四闸

```bash
bin/design-review --critic <path/to/your.html>
```

四闸:`verify.py` · `visual-audit.mjs`(加 §J italic / §K brand + smell)·
`screenshot.mjs` · `critic.mjs`(LLM taste 0-100 分)。

任一 error = 失败。critic 得分 < 75 必修。canonical 自回归 ≥ 90。

规则:`skills/design-review/references/cross-skill-rules.md` A-L +
`known-bugs.md`。canonical:`skills/sage-design/references/canonical/`。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator。

### sage 专属要点

sage 绿 `#97B077` 在白底上对比度只有 2.4(fail AA), 所以
primary CTA 用 `--sage-ink` (#393C54), sage 绿只做 accent + 大面积填充 + 白字。
风格规则详见 `references/dos-and-donts.md`。

## 设计签名（不能漏掉的"sage 味"）

- hairline 分隔：`1px solid var(--sage-divider)`
- 编号 section 标记：`01 · 02 · 03`（JetBrains Mono, `--sage-text-secondary`）
- 大号 **Instrument Serif** italic headline（尤其 hero 和 pull-quote）
- sage 填色 pill 按钮 + 纯白文字（contrast ≥ 4.5）
- 暗部用 `--sage-ink`（深靛蓝），不是纯黑
- 图表 / 图示调色板只用这三色 + 中性灰：`#97B077 / #393C54 / #f8faec / #e5e8da`
- 大量负空间（section padding ≥ 96px vertical）

## 为什么"sage"而不是"green"

英文 sage 既是颜色也是"贤者 / 从容"，双关贴合这个调色板的气质：不是活力的 Kermit 绿，也不是科技绿，而是一种经过思考的、安静的、植物性的绿。和深靛蓝搭配时，像夜晚庭园里的一棵小树——这是这个 skill 想要 Claude 渲染出的东西。
