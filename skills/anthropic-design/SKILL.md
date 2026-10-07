---
name: anthropic-design
description: "anthropic 配色的讲解页 / 技术介绍页 / 编辑式长文 HTML。只有配色定死:暖米白底 #faf9f5、橙色主色 #d97757、低饱和蓝 #6a9bcc / 橄榄绿 #788c5d / 金 #c9913f 当语义色、墨色字 #141413;版式、字体、动画、组件写法由模型按内容自由发挥。配图例库(templates/diagrams/ 78 张现成 SVG + diagram-craft.md 画图手法 + 图集页,含调用链定位图与十种「判断与覆盖」图)和「让人看懂」的三种做法案例(首屏动画演示机制 · 证据模块 · 读者能点选的解释器,范例 demos/anthropic-design/explainer.html)。检查只查客观缺陷:design-review/scripts/check_objective.mjs(JS 报错 / 对比度 / 真实横向滚动 / 手机上图里的字 / 关掉动画也完整)。TRIGGER: 'anthropic 风格' / 'anthropic style' / 'claude 官网风格' / 'Anthropic 品牌' / 暖米白加橙 / 技术介绍页 / 原理讲解页 / 编辑式长文 / 报告页 / 架构图 / 流程图 / editorial long-form page. DO NOT TRIGGER: apple 风格(apple-design)、零基础图解(primer-design)、深色玻璃展示(glass-design)、只给自己看一次的数据页(explain-ladder 第 3 级)、高饱和霓虹。"
last-verified: 2026-10-07
---

# Anthropic 配色的讲解页

配色照 anthropic,其余自由。目标只有一个:读者看完能懂这件事。

**2026-10-07 改版(user 定)**:原来有 14 行写着「必须」—— 图密度配额、动笔前先跑 `dr-cli --plan`、
交付前嵌 self-diff、critic ≥ 75 才算过、canonical 当评分标准、一律用 `anth-*` 类名。
这些把页面往 10 个范例页的样子拉,版式千篇一律。

现在只定死配色,其余改成指引和案例。`references/` 和 `references/canonical/` 里写的「MUST」当经验看;
和本文件冲突时以本文件为准。

## 1. 定死的:配色

| 用途 | 颜色 |
|---|---|
| 页面底 · 次级段落底 · 卡片 · 分隔线 | `#faf9f5` · `#f0ede3` · `#ffffff` · `#e8e6dc` |
| 正文字 · 次要字 | `#141413` · `#5e5d55` |
| 主色 | 橙 `#d97757`:按钮底、重点、主路径 |
| 语义色 | 蓝 `#6a9bcc` · 橄榄绿 `#788c5d` · 金 `#c9913f` · 灰 `#b0aea5`(画图时各代表什么见 `references/diagram-craft.md` §1) |
| 危险 | `#a14238` |
| 深色框(终端 / 代码) | 底 `#1c1b18` · 标题条 `#2a2925` · 字 `#ece9df` |

文字用色要过 WCAG AA。下面的数是 2026-10-07 按 WCAG 相对亮度公式算的:

- **橙色当字色**:主色 `#d97757` 在米白底上只有 2.96,连大字的门槛 3:1 都不到,任何字号都不过 AA,只当色块、线条、按钮底。大字(≥ 24px 或粗体 ≥ 18.66px)用 `#c56544`(3.75);小字用深橙 `#a8502f`(5.17)。2026-10-07 订正:原句把两个橙色并列在「只能用在大字上」前面,读起来像主色也能当大字。
- **橙色按钮上的字**用墨色 `#141413`(5.90)。白字只有 3.12,只够大号粗体按钮。旧规则要求一律白字,按这组数改了。
- **语义色当字色**时跟墨色混一下:`color-mix(in srgb, <语义色> 62%, #141413)`;当色块、线条时用原色。
- **深色框里**把文字变量改成浅色,报错 / 警告 / 通过另配一组浅色 `#ec9488` / `#dcb062` / `#a9bf8f`。米白底用的那套深色版放进深底就太暗,范例页里有写好的这段 CSS。

`assets/anthropic.css`(带 `anth-*` 组件)和 `assets/fonts.css`(Poppins + Lora)可以用,不强制。字体自选;范例页用的是衬线标题 + 系统无衬线正文 + 等宽小标签。

## 2. 让人看懂的三种做法(案例,不是规则)

范例:`demos/anthropic-design/explainer.html` —— whetstone 介绍站首页换成 anthropic 配色,版式和动画原样保留。

| 做法 | 为什么管用 | 范例里看哪 |
|---|---|---|
| **首屏用动画演示机制** | 读者第一眼看到的是这个东西怎么动,不是一张抽象插画 | 首屏右侧:一条条经验被分进 L1–L4 四层,证不出来的被拒并计数 |
| **证据模块** | 页面越好看,内容越容易被当真;证据让读者能自己核对 | `#evidence`:命令输出终端、检查计数条、带规则编号的 REFUSED 票据、局限一节 |
| **读者能点选的解释器** | 自己点一下,比读三段文字快 | `#evidence` 的置信度表、`#layers` 点选岩层、`#flow` 流程步进 |

动画的分寸:

- 示意图要注明是示意:范例 `#why` 的曲线图下面写着 "illustration, not measured data"。
- 动画演示的是机制里的某一步。只是装饰的动效,能删就删。
- 打开「减少动态效果」时内容必须完整(检查 O5 查这个)。
- 讲关系的地方先给图,和全局「讲关系先给图」一致;图怎么画见下一节。

## 3. 图例库

先按内容选图型。下表是起点,结构按实际内容改,可以混搭,也可以自创:

| 内容 | 可以用 | 内容 | 可以用 |
|---|---|---|---|
| ≥3 步流程 / 启动链 / 数据流 | 流程图或时序图 | 数字对比 / 统计 | 大号数字或图表 |
| 系统结构 / 分层 / 依赖 | 架构图 | 时间演进 / 版本 / 里程碑 | 时间线 |
| 产品 / UI 描述 | 窗口示意 | 函数控制流 / 寄存器位域 | 函数流程图 / 位域图 |
| SoC 结构 / 信号时序 / 编译链 / 调度 | 对应内核图型(diagram-craft §15) | 排查一个故障 / 论证「改这里会影响那里」 | 调用链定位图(§15.50,每层挂 `file:line`、关键行贴原文) |
| 30 层以上、纯标识符的调用链 | ASCII 树(§18) | 几条路 × 几道关卡 | 通路 × 关卡(§15.51) |
| 几种问题 × 几道检查,谁抓得到 | 覆盖点阵(§15.52) | 一个读数为什么当场就旧 | 放在哪 × 什么时候(§15.53) |
| 同一条通配规则两种语义 | 路径分段对照(§15.54) | 目录树上两方判法不同 | 带判定列的目录树(§15.55) |
| 一批发现从哪来、分到哪去 | 条数流向(§15.56) | 同一类失败十几种情况各往哪倒 | 分组叶子树(§15.57) |
| 一串文本被一步步加工 | 文本工序序列(§15.58) | 流程每一步能在哪拦下 | 处理流程 + 拦截出口列(§15.59) |
| 几页讲同一个流程的不同一块 | 跨页共用底图 + 调暗点亮(§15.60) | | |

- `templates/diagrams/`:78 张现成 SVG,直接抄。图集 `demos/anthropic-design/diagrams.html` 按编号分节,硬件类另见 `hardware.html`。
- `references/diagram-craft.md`:画图手法(语义色、节点卡、连线、编号、先算尺寸再选容器);时序图看 `references/sequence-diagrams.md`。
- 调用链定位图不手画:`python3 ~/.claude/skills/design-review/scripts/gen_call_site_figure.py <源文本> --style=anthropic`,原文按行号从文件里读。
- 手机上的宽图包进 `<div class="anth-scroll" style="--pan-w:NNNpx">`,在图框里左右拖。`--pan-w` 是最小字刚好 9px 时图的宽度;不需要读字的图片类标 `data-allow-shrink`。不用 `anthropic.css` 时,范例页里有同样作用的三行 `.pan` CSS。

## 4. 检查:只查客观缺陷

```bash
node ~/.claude/skills/design-review/scripts/check_objective.mjs page.html [...]
node ~/.claude/skills/design-review/scripts/check_objective.mjs --self-test   # 10 条,7 条是故意做坏的
```

| 编号 | 查什么 | 怎么判 |
|---|---|---|
| O1 | JS 报错 | 加载并从头滚到尾,有 pageerror / console.error 就失败 |
| O2 | 文字对比度 | 滚到底、等浮现动画播完,再跑 axe-core 的 color-contrast |
| O3 | 横向滚动 | 1280 / 390 两个宽度下用鼠标真的横滚一次,页面动了才失败;布局超宽但被 `overflow-x:hidden` 挡住只算提醒 |
| O4 | 手机上图里的字 | 390 宽下 SVG 文字实际渲染 < 9px 就失败,`data-allow-shrink` 的不查 |
| O5 | 关掉动画也完整 | 「减少动态效果」下不滚动,标题和正文不能有看不见的 |

版式、字体、配色比例、组件写法一概不查。退出码:0 没有失败 · 1 有失败 · 2 用法错或起不来浏览器。

O3 为什么不用页面宽度判:2026-10-07 修 whetstone 首页时,`scrollWidth` 是 1540(窗口 1280),
可 `body` 上有 `overflow-x: hidden`,桌面上鼠标横滚 `scrollX` 一直是 0;去掉那条再滚是 260。
「布局超宽」和「用户滚得动」是两回事。手机触摸拖动本脚本模拟不了,真机才算数。

## 5. 可选:想要风格上的第二意见时

- `design-review` 的四道检查 + critic 评分、`dr-cli --audit` 批量扫存量页,都还能用,但不是交付门槛。
  critic 拿 canonical 当靶子,偏离范例的版式会被扣分,在本 skill 里这不算问题。
- `references/` 下的 tokens / typography / layout-patterns / components(28 组件 + C1–C11 场景配方)/
  motion(M1–M10)/ data-display / responsive / ux-writing / dos-and-donts、`references/canonical/` 10 个范例页、
  `templates/` 9 个页面模板:都当案例和经验看,挑合用的抄。

## 6. 审存量页:`--audit` 模式(可选)

四道检查只跑刚生成的 HTML。要批量扫存量页面（已有 wiki / 老 memo / 客户给的 HTML），用：

```bash
# 扫整个目录（递归）
~/.claude/skills/design-review/dr-cli --audit --skill=anthropic --allow-monolingual <dir>/

# 单文件
~/.claude/skills/design-review/dr-cli --audit --skill=anthropic --allow-monolingual <file>.html

# verify-only，10x 快（适合先看哪些有结构错）
~/.claude/skills/design-review/dr-cli --audit --skill=anthropic --allow-monolingual --no-visual <dir>/

# 限文件数（试跑）
~/.claude/skills/design-review/dr-cli --audit --skill=anthropic --max=5 <dir>/
```

输出（默认 `<repo>/shots/`）：
- `audit-report-<ts>.md` — 汇总表 + Top failure modes 直方图 + 每页 errors/warnings 详情
- `audit-report-<ts>.json` — 同样数据的机器可读版本

退出码：所有文件都 pass → 0；任一文件 errors > 0 → 1；warnings 默认不算 fail，加 `--strict` 才算。

**审外部 HTML（没链 anthropic.css）**：先在 `<head>` 注入 `<link rel="stylesheet" href="<...>/anthropic.css">` 再扫，否则 audit 会报 "undefined class" / "no brand-presence" 等大量 false positive。


## 7. .md 链接与打包工具

场景：anthropic 风格 HTML 文档常链到外部 .md（README / 实施步骤 / 原理详解），或链到 sibling 目录里的其他 .html。浏览器原生显示 raw markdown 难看，单独发文档目录时 sibling .html 链接又会 broken。`scripts/` 下四件套各管一段，按需用。

### 1. `md-mirror.mjs` · 1→1 渲染原语

把 .md 渲成同款 anthropic.css 的自包含 .html（1200px 容器，深色代码块，橙色 callout blockquote，GFM 表格，banner 显示 git 相对源路径）。

```bash
node skills/anthropic-design/scripts/md-mirror.mjs <src.md>            # 旁边出 .html
node skills/anthropic-design/scripts/md-mirror.mjs <src.md> <dst.html> # 显式 dst
```

库模式：`import { renderMarkdown } from './md-mirror.mjs'` 让上层（md-pack）注入 rewriteHref hook。

### 2. `md-rewrite-links.mjs` · href 后缀替换原语

把 HTML 里 `href="*.md(?q)(#f)"` 直接改成 `href="*.html(?q)(#f)"`（in-place，跳过 http(s) / 锚点 / 绝对路径）。简单场景：所有 .md 镜像就放在原位置时用它。

```bash
node skills/anthropic-design/scripts/md-rewrite-links.mjs <file.html> [...]
```

### 3. `md-pack.mjs` · 把 .md 链接折叠到子目录（推荐用于发包）

发文档目录给同事 / 客户时，主 HTML 跳出去的 .md 散在各处，单发主目录就 broken。md-pack 一次性把所有被链接的 .md 渲染到 `<out>/<flat>.html`（扁平命名避免冲突），主 HTML 重写指向 `_md/...`，镜像之间相互跳转也修对。装到 `_md/` 后整个主目录 cp 哪都行。

```bash
node skills/anthropic-design/scripts/md-pack.mjs \
  --base docs \
  --out  docs/handbook/_md \
  docs/handbook/*.html
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

### 4. `cross-link-pack.mjs` · 把跨目录 sibling .html 也折叠进来

md-pack 处理 .md，cross-link-pack 处理 .html。当主 HTML 链到同一文档集其他目录里的兄弟 .html（不是镜像），cp 走主目录后这些链就坏。cross-link-pack 把那些 .html 直接拷到 `_md/`（同款扁平命名），并 rewrite 主 HTML 的 href。

```bash
node skills/anthropic-design/scripts/cross-link-pack.mjs \
  --pack-root docs/handbook \
  --base      docs \
  --out       docs/handbook/_md \
  docs/handbook/*.html
```

注意：被 cp 进来的 sibling .html 内部如果还有相对引用（图片 / 子链接 / CSS），那些引用在新位置可能 broken；脚本会扫并 warn。脚本只管把 sibling .html 拽过来，不试图也把 sibling 的依赖一起拽——遵循 single-responsibility，避免无限递归打包。

### 推荐工作流

```bash
# 1) 主 HTML 跳 .md 都收进来
node md-pack.mjs --base docs --out docs/<pack>/_md docs/<pack>/*.html

# 2) 主 HTML 跳跨目录 .html 也收进来
node cross-link-pack.mjs --pack-root docs/<pack> --base docs --out docs/<pack>/_md docs/<pack>/*.html

# 3) cp 走 docs/<pack>/ 给任何人，链全活
```

依赖：`marked@^15`（已在 sky-skills/node_modules）。脚本路径全部相对 `import.meta.url` 计算，整个 sky-skills 仓 cp 到任何地方都能用。
