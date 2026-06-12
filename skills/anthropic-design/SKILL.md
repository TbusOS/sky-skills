---
name: anthropic-design
description: "Render HTML/CSS in anthropic.com visual aesthetic — warm cream background (#faf9f5), Poppins headings + Lora serif body, orange accent (#d97757) for CTAs and emphasis, rounded filled pill buttons, editorial card grids, abstract SVG illustrations, low-saturation data visualizations (soft blue/gray/teal), hand-drawn SVG architecture diagrams with orange/blue/green node categorization and diamond decision gates. TRIGGER when the user says 'anthropic 风格' / 'anthropic style' / 'claude 官网风格' / 'Anthropic 品牌', or asks for an editorial/long-form page, research article layout, pricing card grid, or a filled-button-with-warmth feel. DO NOT TRIGGER for generic 'beautiful web page' requests (use frontend-design) or Apple aesthetic (use apple-design)."
last-verified: 2026-04-19
---

# Anthropic Design — HTML 风格

让 Claude 以 anthropic.com / claude.com 视觉语言输出：暖米白底、Poppins + Lora 字体、橙色主强调、编辑式卡片网格、抽象 SVG 插画、低饱和图表、手工 SVG 架构图。

## 使用方式

1. 在 HTML 里引入 `<link rel="stylesheet" href="assets/fonts.css">` 与 `<link rel="stylesheet" href="assets/anthropic.css">`。fonts.css 默认只含拉丁字体（~80 KB）；中文走系统字体回退（PingFang/微软雅黑/Noto CJK），zh 覆盖的 font-family 链首仍写 "Noto Sans SC"/"Noto Serif SC"。仅当必须保证 CJK webfont 时再追加 `assets/fonts-cjk.css`（+200 KB，CDN 慢时拖慢首屏 2-5 秒）。
2. 写业务结构时套用 `anth-*` class 前缀。具体组件用法见 `references/components.md`。
3. 新开模板直接从 `templates/` 复制。

## 触发关键词

`anthropic 风格` / `anthropic style` / `claude 官网风格` / `Anthropic 品牌` / `warm cream + orange` / `编辑式长文` / `Poppins Lora`

## 不要用于

- 通用"好看页面"（用 `frontend-design`）
- Apple 美学（用 `apple-design`）
- 高饱和 / 霓虹 / 赛博朋克

## 阅读顺序

1. `references/design-tokens.md` — 所有 CSS 变量
2. `references/typography.md` — 字体层级（Lora serif 正文是核心差异）
3. `references/layout-patterns.md` — 六类版式骨架 + **容器选择表** + **L1-L10 scenario recipes**（dashboard / form / table / tab / accordion / modal / sidebar / changelog / video / empty-state）
4. `references/components.md` — 28 组件（含 §28 Inline SVG 插画模板）+ **C1-C11 scenario recipes**（input / select / check / switch / tab / accordion / toast / dialog / banner / tooltip / skeleton）
5. `references/diagram-craft.md` — **手工 SVG 图示工艺（画任何架构/流程/层级/时间线图前 MUST 读）**：色彩语义表（颜色做语义不做填充）、嵌套分组、节点卡、连线、编号徽章、布局公式、icon 语法、窗口 mock、图密度合约、反模式
6. `references/sequence-diagrams.md` — UML 时序图专文（actor / lifeline / step 编号 / 平文本约束）
7. `references/motion.md` — 动画缓动 + **M1-M10 scenario recipes**（hero / stagger / hover / modal / toast / loading / count-up / route）
8. `references/imagery.md` — 抽象 SVG 插画规则
9. `references/data-display.md` — 低饱和图表色板
10. `references/responsive.md` — 断点与 max-width
11. `references/ux-writing.md` — CTA / empty state / error / placeholder 文案模式 + 禁用词清单
12. `references/dos-and-donts.md` — 反例 + **发布前 7 项 checklist（MUST）**

## 图密度合约（写任何页面前 MUST — 不只画图时）

**尽可能用图表达**——这是默认要求，不需要用户提醒。下表任一形态出现就该配视觉化
（图型列是**默认起点不是强制规格**——结构按实际内容定制、可混搭可自创，硬约束只有
"该有图的地方有图" + 工艺质量闸）：

| 内容形态 | 必须配 | 内容形态 | 必须配 |
|---|---|---|---|
| ≥3 步流程 / 启动链 / 数据流 | 流程图或时序图 | 数字对比 / 统计 | stat callout 或图表 |
| 系统结构 / 分层 / 依赖 | 架构图 | 时间演进 / 版本 / 里程碑 | 时间线 |
| 产品 / UI 描述 | 窗口 mock | 连续纯文字 > 2 屏 | ≥ 1 个视觉元素 |
| 函数控制流 / 寄存器位域 | 函数流程图 / 位域图 | SoC 结构 / 信号时序 / 编译链 / 调度 | 对应内核图型(diagram-craft §15) |

节奏：每 1.5 屏（≈1300px @1440）≥ 1 个 SVG / figure / stat。机器闸 `text-desert` 在连续
2600px 无视觉元素时 warn（known-bugs 1.31）。动笔画图前再读 `references/diagram-craft.md`：
§8.1 先算尺寸选容器档（**密图必须 1200 wide，看不清 = 没画**）、§1 色彩（每图 ≥ 2 语义 hue，
小元素实心主色）。现成图直接抄 `templates/diagrams/`，案例库见 `demos/anthropic-design/diagrams.html`。

### 何时读 scenario recipes（重要）

写一个 page-type 之前先看 §3 / §4 / §5 / §9 末尾的 `## Scenario recipes`：

- canonical 只有 pricing / landing / docs-home / feature-deep / comparison 五类
- 上面之外的版式（dashboard / form / wiki / accordion / modal / toast / 数据表 / 文案规则）必须读对应 recipe
- generator **不要凭感觉**把 landing 的卡片样式套到 dashboard、把 cream 直链当主 CTA、用 `Click here` 当 CTA 文案
- recipe 里给的是量化合约（duration / padding / font-size / token），按表执行

## 发布前检查(MUST — 交给 design-review skill)

### 生成**前**读 canonical + 拿合约

任何 page-type(pricing / landing / docs-home / 其他)开写之前必须:

```bash
# 生成 sprint-contract(把 MUST/MUST NOT 交给生成器自己)
bin/design-review --plan --skill=anthropic --page=pricing > /tmp/contract.md
# 然后读 skills/anthropic-design/references/canonical/<page>.html + .md
```

**不读 canonical 就写 = 必然偏掉风格**。canonical.md 里的 7-8 条设计
决定 + typography 表就是评分标准。

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

四闸依次:
1. `verify.py` — 结构(placeholders / DOCTYPE / BEM / SVG / class / §G 双语)
2. `visual-audit.mjs` — 渲染(contrast / hero 宽 / SVG 字号 / hollow card /
   **brand-presence §K / italic-overuse §J / cross-skill-smell §K**)
3. `screenshot.mjs` — 全页 PNG 存 `shots/`
4. `critic.mjs` — LLM taste 评审(输出 JSON + 0-100 分,canonical 自跑 ≥ 90)

**任一 error 整个失败**。warn 要判断是否放行。critic 得分 < 75 必修。

规则与已知 bug 全在 `skills/design-review/references/cross-skill-rules.md`
(A-L)+ `known-bugs.md`。canonical 文件在
`skills/anthropic-design/references/canonical/`(pricing / landing /
docs-home 各一对 .html + .md)。

Evaluator 和 generator 分离是刻意的 —— 参考 Anthropic
[harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
里的 GAN 式 discriminator:reviewer 不继承 generator 的立场。

### anthropic 专属要点

- `.anth-button` 橙底必须 `color: #ffffff; font-weight: 600;`(cream 在橙上是 2.96, fail AA)
- Hero 段必须 `class="anth-container anth-container--wide"`(**base + modifier 都要**)
- 风格规则详见 `references/dos-and-donts.md`

### 审存量页（不是新生成的） — `--audit` 模式

四闸只跑刚生成的 HTML。要批量扫存量页面（已有 wiki / 老 memo / 客户给的 HTML），用：

```bash
# 扫整个目录（递归）
bin/design-review --audit --skill=anthropic --allow-monolingual <dir>/

# 单文件
bin/design-review --audit --skill=anthropic --allow-monolingual <file>.html

# verify-only，10x 快（适合先看哪些有结构错）
bin/design-review --audit --skill=anthropic --allow-monolingual --no-visual <dir>/

# 限文件数（试跑）
bin/design-review --audit --skill=anthropic --max=5 <dir>/
```

输出（默认 `<repo>/shots/`）：
- `audit-report-<ts>.md` — 汇总表 + Top failure modes 直方图 + 每页 errors/warnings 详情
- `audit-report-<ts>.json` — 同样数据的机器可读版本

退出码：所有文件都 pass → 0；任一文件 errors > 0 → 1；warnings 默认不算 fail，加 `--strict` 才算。

**审外部 HTML（没链 anthropic.css）**：先在 `<head>` 注入 `<link rel="stylesheet" href="<...>/anthropic.css">` 再扫，否则 audit 会报 "undefined class" / "no brand-presence" 等大量 false positive。

### 让 .md / sibling .html 跳转也变好看 — md-mirror / md-rewrite-links / md-pack / cross-link-pack

场景：anthropic 风格 HTML 文档常链到外部 .md（README / 实施步骤 / 原理详解），或链到 sibling 目录里的其他 .html。浏览器原生显示 raw markdown 难看，单独发文档目录时 sibling .html 链路又会 broken。`scripts/` 下四件套各管一段，按需用。

#### 1. `md-mirror.mjs` · 1→1 渲染原语

把 .md 渲成同款 anthropic.css 的自包含 .html（1200px 容器，深色代码块，橙色 callout blockquote，GFM 表格，banner 显示 git 相对源路径）。

```bash
node skills/anthropic-design/scripts/md-mirror.mjs <src.md>            # 旁边出 .html
node skills/anthropic-design/scripts/md-mirror.mjs <src.md> <dst.html> # 显式 dst
```

库模式：`import { renderMarkdown } from './md-mirror.mjs'` 让上层（md-pack）注入 rewriteHref hook。

#### 2. `md-rewrite-links.mjs` · href 后缀替换原语

把 HTML 里 `href="*.md(?q)(#f)"` 直接改成 `href="*.html(?q)(#f)"`（in-place，跳过 http(s) / 锚点 / 绝对路径）。简单场景：所有 .md 镜像就放在原位置时用它。

```bash
node skills/anthropic-design/scripts/md-rewrite-links.mjs <file.html> [...]
```

#### 3. `md-pack.mjs` · 把 .md 链接折叠到子目录（推荐用于发包）

发文档目录给同事 / 客户时，主 HTML 跳出去的 .md 散在各处，单发主目录就 broken。md-pack 一次性把所有被链接的 .md 渲染到 `<out>/<flat>.html`（扁平命名避免冲突），主 HTML 重写指向 `_md/...`，镜像之间相互跳转也修对。装到 `_md/` 后整个主目录 cp 哪都行。

```bash
node skills/anthropic-design/scripts/md-pack.mjs \
  --base docs \
  --out  docs/avb-decision/_md \
  docs/avb-decision/*.html
```

行为：
- 扫主 HTML 的 .md href → 解析到绝对路径
- 扁平名 = `relpath(src, --base).replace(/\//g, '__').replace(/\.md$/, '.html')`
- 调 `renderMarkdown` 把每个 .md 渲到 `<out>/<flat>.html`，链接重写按场景分类：
  - **Case A**：跳到另一个被打包的 .md → 同目录扁平兄弟
  - **Case B**：跳到主 HTML → 从 _md/ 出来 `../mainHtml.html`
  - **Case C**：跳到 pack 外的资源 → 重算相对路径 + 警告
  - **Fallback**：源 .md 写错路径（off-by-one ../）→ 按 basename 后缀匹配救回，发 info 提示
- 主 HTML 的 .md href 全部重写到 `_md/<flat>.html`
- 幂等，重跑可补漏（如果你后续在主 HTML 里加了新 .md 链接）

`--dry-run` 看计划不写文件。

#### 4. `cross-link-pack.mjs` · 把跨目录 sibling .html 也折叠进来

md-pack 处理 .md，cross-link-pack 处理 .html。当主 HTML 链到 secure-boot-guide 其他目录里的兄弟 .html（不是镜像），cp 走主目录后这些链就坏。cross-link-pack 把那些 .html 直接拷到 `_md/`（同款扁平命名），并 rewrite 主 HTML 的 href。

```bash
node skills/anthropic-design/scripts/cross-link-pack.mjs \
  --pack-root docs/avb-decision \
  --base      docs \
  --out       docs/avb-decision/_md \
  docs/avb-decision/*.html
```

注意：被 cp 进来的 sibling .html 内部如果还有相对引用（图片 / 子链接 / CSS），那些引用在新位置可能 broken；脚本会扫并 warn。脚本只管把 sibling .html 拽过来，不试图也把 sibling 的依赖一起拽——遵循 single-responsibility，避免无限递归打包。

#### 推荐工作流

```bash
# 1) 主 HTML 跳 .md 都收进来
node md-pack.mjs --base docs --out docs/<pack>/_md docs/<pack>/*.html

# 2) 主 HTML 跳跨目录 .html 也收进来
node cross-link-pack.mjs --pack-root docs/<pack> --base docs --out docs/<pack>/_md docs/<pack>/*.html

# 3) cp 走 docs/<pack>/ 给任何人，链全活
```

依赖：`marked@^15`（已在 sky-skills/node_modules）。脚本路径全部相对 `import.meta.url` 计算，整个 sky-skills 仓 cp 到任何地方都能用。
