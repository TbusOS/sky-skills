# Sky Skills

[English](README.md)

精选 **Claude Code Skills** 合集 —— 可复用的领域专家提示模块，让 Claude Code 成为特定工作流的专业助手。

## 在线 Demo

九个设计类 skill 各自配备了一份单页 flagship demo，位于 [`demos/`](./demos/) 目录 —— 同一份内容，九种美学呈现：

- [**apple-design demo**](./demos/apple-design/index.html) —— apple.com 的冷感克制
- [**anthropic-design demo**](./demos/anthropic-design/index.html) —— anthropic.com 的暖编辑感
- [**ember-design demo**](./demos/ember-design/index.html) —— 手作 · 暖棕 · 文学式的咖啡色系（米白 + 巧克力 + 金）
- [**sage-design demo**](./demos/sage-design/index.html) —— 安静 · 北欧极简（米黄 + 抹茶绿 + 深靛蓝）
- [**glass-design demo**](./demos/glass-design/index.html) —— Apple 液态玻璃 / aurora 玻璃拟态（深藏青 + cyan + 毛玻璃面板，dark/light 双主题）
- [**atelier-design demo**](./demos/atelier-design/index.html) —— 暖玻璃**产品界面**（桃 / 玫红壁纸 + 一整块磨砂外壳 + 渐变圆球）；唯一画应用界面的一个，而且是真能点的
- [**eclat-design demo**](./demos/eclat-design/index.html) —— 产品发布会 keynote，哑光电影舞台（近黑 #040406 + 骨白 #f6f3ec + 单一冷蓝高光）
- [**lectern-design demo**](./demos/lectern-design/index.html) —— 会议室汇报 deck（纸白 #f5f6f8 + 深蓝墨 #16203a，KPI 卡 + 决议表）
- [**primer-design demo**](./demos/primer-design/index.html) —— 小白图解读本（纸白 + 紫 #7a5cd6 + 马克笔黄）；厚描边插画 + 比喻卡 + 术语翻译气泡，把「Agent Skill 是什么」讲给完全没听过的人
- [**anthropic 图表画廊**](./demos/anthropic-design/diagrams.html) —— 69 幅手工 SVG 图（寄存器、SoC 框图、时序波形、调度时间线、互连与地址空间映射、物理数据通路、多地址空间对照、剖面、爆炸视图、引脚图、对数刻度尺、四张带方向的流动线动图……）
- [**硬件数据通路专题页**](./demos/anthropic-design/hardware.html) —— 三张图讲清「像素在物理上怎么走到屏幕」：没有 GPU 的连接、加了 GPU 之后数据去了哪、以及有独立显存时字节到底怎么跨过 PCIe
- [**一块屏，从接上去到亮起来**](./demos/anthropic-design/bringup.html) —— 四张图：模组里面有十二层、FPC 三十根线怎么接、供电必须按什么顺序上来，以及屏一直不亮时在哪一块敲哪条命令
- [**一颗芯片是怎么装出来的**](./demos/anthropic-design/packaging.html) —— 跨三个数量级的放大链、把工序画成同一个零件的六次、以及一张回答「什么还拆得下来」的爆炸视图
- [**一个比特是怎么存住的**](./demos/anthropic-design/one-bit.html) —— 用符号之前先把它打开的阶梯、只让颜色动的三联图、把十个数量级放进一根轴的对数尺
- [**apple 图表画廊**](./demos/apple-design/diagrams.html) —— 同类图型的 apple.com 干净几何风版本，共 31 幅
- [**ember 图表画廊**](./demos/ember-design/diagrams.html) —— 同类图型的暖棕 + 金单焦点版本，共 8 幅
- [**sage 图表画廊**](./demos/sage-design/diagrams.html) —— 同类图型的抹茶绿 + 靛蓝墨版本，共 8 幅
- [**glass 图表画廊**](./demos/glass-design/diagrams.html) —— 同类图型的暗玻璃版本，共 25 幅（aurora 光场上的毛玻璃面板，SVG 墨色主题免疫）
- [**eclat lookbook**](./demos/eclat-design/diagrams.html) —— 8 幅电影感发布会构图（聚光产品、产品线、参数揭示、那一刻、定价、开箱、跑分、细节）
- [**lectern board pack**](./demos/lectern-design/diagrams.html) —— 8 个会议室面板：折线 / 条形 / 环形 / 构成 / 分群留存图，加路线图时间线、KPI 块和决议表
- [**primer 图解集**](./demos/primer-design/diagrams.html) —— 25 幅厚描边插画，来自三个读本与 demo（书的索引、外卖跑一趟、封好的信封……），每幅只回答一个问题
- [**primer 技术图解集**](./demos/primer-design/tech/index.html) —— 九页硬件 / 内核图解，一页答一个问题：寄存器、一次 SPI 传输、一颗 SoC、两块芯片之间的两套门牌号、分层协议里那条不存在的横线、同一块内存的两个门牌号、IP core 内部、一个字从 `write()` 到串口引脚、对半砍

本地预览：在仓库根目录执行 `python3 -m http.server 8000`，然后打开上面的 URL。

## 可用 Skills

| Skill | 语言 | 说明 |
|-------|------|------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux 内核与驱动开发 —— 编码规范、模块/驱动/字符设备模板、Kconfig、Makefile、设备树绑定、调试工具、并发模型、内核 API 速查 |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | 微信公众号视频制作全流水线 —— edge-tts 配音、Playwright 逐帧录制、ffmpeg 字幕烧录、微信兼容 inline-style 文章模板 |
| [doc-to-markdown](skills/doc-to-markdown/) | EN/ZH | 文档转 Markdown —— 批量 PDF/DOCX 转换为格式清晰的 Markdown，自动提取图片、表格转换、EMF/WMF 处理、中文支持 |
| [md-to-pdf](skills/md-to-pdf/) | EN/ZH | Markdown 转 PDF —— 基于 PyMuPDF Story HTML 渲染，完整中文支持、自动书签、页码 |
| [tech-pdf-reader](skills/tech-pdf-reader/) | ZH | **技术 PDF 阅读** —— datasheet、原理图、协议文档，答案常在时序图和引脚表里而不在文字层。按关键词定位章节、把整页渲染出来让图真的看得见、渲染失败时兜底抠内嵌图。核心纪律是把**「工具不行」**和**「文件坏了」**分开 —— 二者现象相同（都是空白），处理方式完全相反。`scripts/pdf_probe.py` 逐页报文字层 / 内嵌图数 / 有无 `/Contents`，遍历对象图区分「引用断了还能修」和「内容真的不在文件里」，再读 `Page N of M` 页脚揪出截断副本。技术参数错一位就是硬件问题，所以读不到就写读不到，绝不按「应该是这样」补全 |
| [datasheet-reading](skills/datasheet-reading/) | EN/ZH | **在工程 PDF 里查事实** —— 寄存器某一位的定义、时序最小值、引脚从哪路供电、某个元件到底贴没贴（NC）、这份文档有没有提到 X。先定位到页，再读表或读图，答案连着页号 + 表号一起给，方便复查。硬规则：**「我没提取出来」永远不写成「文档里没有」** |
| [apple-design](skills/apple-design/) | EN/ZH | 以 **apple.com** 网页美学渲染 HTML/CSS —— SF Pro 字体、白/浅灰/黑交替段落、克制的文字链、巨字号统计、产品摄影主导、手工 SVG 流程图。**diagram-craft v3 (2026-06) 新增：** 内核级 SVG 制图规范（先定尺寸、tint 填充、每图 ≥2 个色相）+ 模板库扩到 30 件 —— 见[图表画廊](demos/apple-design/diagrams.html) |
| [anthropic-design](skills/anthropic-design/) | EN/ZH | 以 **anthropic.com** 网页美学渲染 HTML/CSS —— 暖米白 + 橙色强调、Poppins 标题 + Lora 衬线正文、实心胶囊按钮、编辑式卡片、抽象 SVG 插画、低饱和图表。**v2 (2026-04) 新增：** 给 canonical 没覆盖的版式 / 控件 / 动效 / 文案各加一层 scenario recipes（dashboard / form / table / tab / accordion / modal / sidebar / changelog / video / empty-state · input / select / check / switch / toast / dialog / banner / tooltip / skeleton · hero / stagger / hover / route），加一份 `references/ux-writing.md`（CTA / empty / error / placeholder / 禁用词清单），所有 recipe class 已落到 `assets/anthropic.css`。配 `bin/design-review --audit <dir-or-url>` 批量审存量页面。**v3 (2026-05) 新增：** `scripts/` 下 4 件套 md 渲染管线 —— `md-mirror`（1 个 `.md` → 1 个 anthropic 风格 `.html`，内联 CSS）/ `md-rewrite-links`（原地 `.md`→`.html` href 替换）/ `md-pack`（把链到的 `.md` 折叠到扁平 `_md/` 子目录 + 重写 href + basename 救援源文档 `../` typo）/ `cross-link-pack`（跨目录 sibling `.html` 也折叠进同款 `_md/`）。在文档目录跑 pack + cross-link-pack 一次，`cp -r` 到任何地方所有链接全活。**diagram-craft v3 (2026-06) 新增：** 内核级 SVG 制图规范 + 模板库扩到 58 件（register-bitfield / soc-block / hw-timing-waveform / sched-timeline / interconnect-map / protocol-stack / address-map……）—— 见 [69 图画廊](demos/anthropic-design/diagrams.html) |
| [ember-design](skills/ember-design/) | EN/ZH | 以 **手作编辑** 美学渲染 HTML/CSS —— 暖米 (#fff2df) + 深巧克力 (#312520) + 棕色 CTA (#492d22) + 金色 (#c49464)，Fraunces 展示衬线 + Inter 正文。适合咖啡工坊 / 精品酒店 / 文学期刊 / 独立品牌。**diagram-craft (2026-06) 新增：** 暖棕灰阶结构 + 金单焦点制图规范 + 8 件 SVG 图示模板 —— 见 [8 图画廊](demos/ember-design/diagrams.html) |
| [sage-design](skills/sage-design/) | EN/ZH | 以 **安静 · 北欧极简** 美学渲染 HTML/CSS —— 米黄 (#f8faec) + 抹茶绿 (#97B077) + 深靛蓝 (#393C54)，Instrument Serif + Inter + JetBrains Mono。适合阅读 app / 植物工作室 / 现代期刊 / 安静的科技品牌。**diagram-craft (2026-06) 新增：** 绿单焦点 + 靛蓝墨制图规范 + 8 件 SVG 图示模板 —— 见 [8 图画廊](demos/sage-design/diagrams.html) |
| [glass-design](skills/glass-design/) | EN/ZH | 以 **Apple 液态玻璃 / aurora 玻璃拟态** 美学渲染 HTML/CSS —— 深藏青画布 (#0B1020) + aurora 光晕 + 三层毛玻璃面板（真 `backdrop-filter` + 1px 渐变折射环）+ 唯一前景彩色 cyan (#22D3EE)，Space Grotesk + Inter + JetBrains Mono。**dark/light 双主题**（`data-theme`，渲染 / 可达性 / 截图检查双主题各跑一遍）+ **可冻结动画引擎**（`glass.js`：滚动浮现 / count-up / 3D tilt / SVG 路径绘制 / 视差，`prefers-reduced-motion` 下全部塌缩为静态 markup，截图确定性）。为图表 / 图示 / 数据类内容的高冲击力展示而生 —— 见 [图示画廊 canonical](skills/glass-design/references/canonical/diagram-gallery.html) 与 24 件 SVG 图示模板 |
| [eclat-design](skills/eclat-design/) | ZH | 以**产品发布会 keynote** 美学渲染 HTML/CSS —— 近黑哑光画布 (#040406) + 骨白字 (#f6f3ec) + 满屏巨字标题 + 聚光与地面反射 + 单一冷蓝 flare (#bcd2ff) + 产品 hero + 满屏「那一刻」叙事。暗调电影感，克制如熄了灯的发布厅。**不要**用它做玻璃拟态（那是 `glass-design`）、会议室 deck（`lectern-design`）或浅白消费极简官网（`apple-design`）—— 见 [8 图 lookbook](demos/eclat-design/diagrams.html) |
| [lectern-design](skills/lectern-design/) | ZH | 以**会议室汇报 deck** 美学渲染 HTML/CSS —— 纸白画布 (#f5f6f8) + 衬线标题 + 深蓝墨 (#16203a) + 低饱和深蓝图表 (#1d3a6e) + 结构化议程 / 章节 + KPI 卡 + 决议·行动项表 + 状态药丸。对内、商务、数据前置，可信而不喧哗，像一份尊重读者时间的董事会评审 —— 见 [8 面板 board pack](demos/lectern-design/diagrams.html) |
| [atelier-design](skills/atelier-design/) | EN/ZH | 渲染**产品应用界面，而不是页面** —— 桃色玫红 mesh 壁纸上浮着**一整块**磨砂应用外壳（#E8AE86 / #E39BA8 停位压在 #E9C3A8 底色上，外壳 0.32 → 侧栏合成 0.46 → 数据卡 0.80 → 表格 0.94，`blur(42px) saturate(1.45)`），渐变圆球图标（珊瑚 #F5854F → 玫红 #DD4F92），灰轨道上的圆头柱状图，每屏恰好一张近黑锚点卡。全局 Plus Jakarta Sans。**JavaScript 是交付物的一半**：侧栏能路由、标签能切换、手风琴能折叠、结果行能展开、表格能排序、开关能翻、KPI 会滚动 —— 全部属性驱动（`data-route` / `data-tab` / `data-sort` / `data-count-to` …），且全部可冻结以保证截图确定性。双主题（亮色为准，暗色是暖咖啡色的 warm-night）。随附 **6 个范本屏** —— [控制台](skills/atelier-design/references/canonical/dashboard.html) / [预订](skills/atelier-design/references/canonical/booking.html) / [记录](skills/atelier-design/references/canonical/detail.html) / [设置](skills/atelier-design/references/canonical/settings.html) / [登录](skills/atelier-design/references/canonical/signin.html) / [图控制台](skills/atelier-design/references/canonical/console.html)，另有 [13 图图集](demos/atelier-design/diagrams.html)，其中最后四张是**界面内图示** —— 可点的服务拓扑、带状态的流水线、权限归属图、编排画布（`references/diagram-craft.md` §7）。**不要**用它做落地页（它根本没有 hero 档——应用没有 hero）、深色 aurora 玻璃（`glass-design`）、或任何要打印的东西（`backdrop-filter` 不进打印管线） |
| [primer-design](skills/primer-design/) | EN/ZH | 小白图解读本 —— 厚描边插画 + 比喻卡 + 术语翻译气泡，把任何主题讲到零基础也能看懂 |
| [design-review](skills/design-review/) | EN/ZH | **9 个设计 skill 的独立评审员** —— 四道机械检查（`verify.py` 静态 + `visual-audit.mjs` Playwright 渲染 + `axe-audit.mjs` 可达性（axe-core，color-contrast 阻断；2026-08-27 起全仓两主题实测 0 违规，见 known-bugs §6.6）+ `screenshot.mjs` 截图），外加可选 `pixel-gate.mjs` 像素回归（阈值实测校准）与 `critic.mjs` LLM 口味评审 + 仓库内已知 bug 清单。另带 `multi-critic.mjs`（4 个固定权重的专项评审员）、learning loop（critic 抓到的问题经 `design-learner` agent 固化成新的机械检查规则）、`bin/design-review` 命令行（默认跑检查链，另有 `--plan` / `--audit` / `--distill` 模式）。参考 Anthropic 的 [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)：generator 和 evaluator 分离，reviewer 不继承 generator 的立场。完整 [9 组件 harness 路线图](docs/HARNESS-ROADMAP.html)（用九种声音里的五种各渲一版） |
| [gated-dual-clone](skills/gated-dual-clone/) | EN/ZH | **双仓库 git 工作流搭建器(2 仓默认 · 可选 3 仓加 reproducibility 关卡)。** 适用于上游分支受保护(必须走 MR / PR)、编译重会污染工作树的项目。一条命令创建 `gateway` 仓库(push 源) + `satellite` 仓库(只读编译树)——编译树在物理上够不到远程。搭完自动跑三道安全检查:协议墙、显式 push-URL 禁用、pre-push hook。加 `--clean-verify-dir` 启用第 3 仓(冷盘冷启动)+ stamp-match pre-push 关卡,没经从零全量编认证的 commit 推不出。完整[设计稿](docs/design-mr-gated-dual-repo.md) + [anthropic demo](demos/gated-dual-clone/index.html) |
| [gated-dual-clone-audit](skills/gated-dual-clone-audit/) | EN/ZH | **独立评估器**,和 `gated-dual-clone` 配对。不 import 任何 generator 代码,只读成品拓扑 · 重验安全检查。四层:structural(文件系统 / hook / hardlink, 8 项) → configuration(git-config, 8 项) → behavioural(安全 `--dry-run` + 直接调 hook, 3 项) → taste(LLM critic subagent · 不阻塞 exit code)。传 `--clean-verify-dir` 自动加 4 gate(S9-S11 + C9 + B4)覆盖 3 仓拓扑。可按需跑、作 `pre-push` hook 跑、作 cron drift 检查跑。`--json` 喂给 `learning-loop` 固化野外 drift。和 `design-review` 一样的 generator / evaluator 分离原则 |
| [doc-review-loop](skills/doc-review-loop/) | ZH | **给认真的决策书做的双 agent 评审循环。** `writer` agent 拿代码 / 实测证据出稿，`reviewer` agent 扮演没接触过项目的严苛 PM，每个论断都质疑，问题分 A (阻塞) / B (必改) / C (建议改) 三档。主对话把 reviewer 问题清单喂回 writer 出 v2，最多 3 轮。每轮 diff + reviewer 问题留在 `<doc>.review.log`。触发：发版评审决策、跨团队统一口径、复杂改动论证、改 vs 不改类问题。**不要触发** 简单 README、单页 memo、个人笔记 —— 杀鸡用牛刀 |
| [design-planner](skills/design-planner/) | ZH | **brief→sprint contract 计划器**，服务 9 个设计 skill —— 在写任何 HTML 之前把一句模糊需求展开成 page-type + 受众 + section 计划 + 硬指标（图密度 / 双语 / 品牌），包装 `bin/design-review --plan`。没有 canonical 的 page-type 借最近的结构并标注 LOW-CONFIDENCE |
| [design-evolve](skills/design-evolve/) | EN | **自进化循环（harness 组件 09）** —— 让 harness 自己提出更好的生成器规则 / 模板 / 手法，只保留分数确实更高的那些。每轮：诊断最弱的评审轴 → 提一个改动 → 重新生成 → 用**冻结的**评审器打分 → 严格高于锁定基线、且没有任何留出的 canonical 退步，才保留，否则 `git revert`。评审器保持冻结，生成器就没法靠挪动标尺取胜 |
| [skills-sync](skills/skills-sync/) | ZH | **手动检查并更新 skills 仓。** 检测远端是否领先、列出更新了什么（commit 标题），用户确认后才跑 `git pull --ff-only` 并给新到的 skill 补 symlink。不擅自更新；本地有改动或分支已分叉时中止 pull 并如实报告 |

## 什么是 Claude Code Skills？

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) 是 Markdown 文件（SKILL.md），为 Claude Code 提供领域专业知识、编码规范、代码模板和工作流指引。安装后，它们会根据触发条件自动激活，无需手动调用。

例如，当你开始编辑内核模块代码时，`linux-kernel-dev` skill 会自动加载内核编码规范、驱动模板和 API 参考。

## 安装方法

> **两种安装作用域。** 装到某个项目的 `.claude/skills/` 只在那个仓库生效；装到 `~/.claude/skills/` 在本机所有仓库生效。下面命令都用用户级 `~/.claude/skills/`，要装到项目级把目的地换掉即可。完整双语安装指南见 [docs/INSTALL.html](docs/INSTALL.html)。
>
> **注意——仓库里有两种 skill。** 只有四个是光杆 `SKILL.md`：`skills-sync` / `design-planner` / `design-evolve` / `wechat-video-publisher`。**其余十八个在 `SKILL.md` 之外还带 `scripts/` / `references/` / `templates/`，必须按整目录安装**——只 copy 单 `SKILL.md` 会让 skill 起来但脚本跑不动。看着小的也在此列（`md-to-pdf` / `doc-to-markdown` / `tech-pdf-reader` 各带一个脚本），最大的 `linux-kernel-dev` 有 233 个文件。另外 `design-review` learning loop 用的 `design-learner` agent 不在 skill 目录里：要单独把 `.claude/agents/design-learner.md` 复制到你的 `~/.claude/agents/`。
>
> **装完之后退出 Claude Code 重进**——skill 清单是启动时扫描一次冻结的。

### 方法一：clone + 复制（推荐）

```bash
git clone https://github.com/TbusOS/sky-skills.git

# 单文件 skill
cp sky-skills/skills/skills-sync/SKILL.md \
  ~/.claude/skills/skills-sync.md

# 多文件 skill —— 整目录复制
cp -r sky-skills/skills/linux-kernel-dev       ~/.claude/skills/
cp -r sky-skills/skills/gated-dual-clone       ~/.claude/skills/
cp -r sky-skills/skills/gated-dual-clone-audit ~/.claude/skills/
cp -r sky-skills/skills/design-review          ~/.claude/skills/
```

### 方法二：符号链接（`git pull` 上游 = 本地自动同步）

```bash
git clone https://github.com/TbusOS/sky-skills.git
cd sky-skills

# 单文件 skill
ln -s "$(pwd)/skills/skills-sync/SKILL.md" \
  ~/.claude/skills/skills-sync.md

# 多文件 skill —— 整目录 symlink
ln -s "$(pwd)/skills/linux-kernel-dev"       ~/.claude/skills/linux-kernel-dev
ln -s "$(pwd)/skills/gated-dual-clone"       ~/.claude/skills/gated-dual-clone
ln -s "$(pwd)/skills/gated-dual-clone-audit" ~/.claude/skills/gated-dual-clone-audit
ln -s "$(pwd)/skills/design-review"          ~/.claude/skills/design-review
```

### 方法三：Claude Code CLI（如果你的版本支持）

部分 Claude Code 版本带 `claude install` 子命令，可自动处理两种形态：

```bash
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev
claude install github:TbusOS/sky-skills/skills/design-review
```

如果你的版本没有这个子命令，用方法一或方法二。

### 三种方法怎么选

| 方法 | 好处 | 不足 |
|---|---|---|
| 一 · 复制 | 不依赖工具 · 可携带 | 上游更新要重新 copy |
| 二 · symlink | `git pull` 上游 = 本地跟新 | 依赖 clone 路径不动 |
| 三 · CLI | 最少打字 · 自动识别形态 | 依赖你的 CLI 版本有 `claude install` |

## 部分 skill 详解

下面详解 5 个 skill，其余的以各自 `SKILL.md` 为准：
[md-to-pdf](skills/md-to-pdf/SKILL.md) ·
[tech-pdf-reader](skills/tech-pdf-reader/SKILL.md) ·
[ember-design](skills/ember-design/SKILL.md) ·
[sage-design](skills/sage-design/SKILL.md) ·
[glass-design](skills/glass-design/SKILL.md) ·
[design-review](skills/design-review/SKILL.md) ·
[gated-dual-clone](skills/gated-dual-clone/SKILL.md) ·
[gated-dual-clone-audit](skills/gated-dual-clone-audit/SKILL.md) ·
[doc-review-loop](skills/doc-review-loop/SKILL.md) ·
[design-planner](skills/design-planner/SKILL.md)

### linux-kernel-dev

全面的 Linux 内核开发助手，覆盖：

- **编码规范** —— Tab 缩进、K&R 花括号风格、命名规范、checkpatch.pl 合规检查
- **代码模板** —— 内核模块、平台驱动、字符设备、Makefile、Kconfig
- **设备树** —— YAML binding schema、DTS 节点示例
- **内存管理** —— kmalloc/kzalloc、devm_* 托管 API、GFP 标志
- **并发同步** —— mutex、spinlock、RCU、completion、wait queue
- **调试工具** —— printk/dev_*、ftrace、kprobe、perf、crash/kdump
- **内核 API 速查** —— 内存、I/O、中断、定时、工作队列
- **上游提交流程** —— commit message 格式、git format-patch、get_maintainer.pl

**自动触发条件：** 编辑内核模块、设备驱动、内核子系统、Kconfig、Makefile、设备树文件，或使用内核 API 的 C 代码时。

### wechat-video-publisher

从交互式 HTML 动画到配音视频教程和微信公众号文章的端到端流水线：

- **配音生成** —— edge-tts 微软晓晓女声，自动生成时间轴数据
- **逐帧录制** —— 基于 Playwright 的精确 30fps 逐帧截图（非屏幕录制，零丢帧）
- **字幕烧录** —— 从文稿自动生成 SRT + ffmpeg libass 渲染
- **微信文章** —— 全 inline-style HTML 模板（微信会删除 `<style>` 标签和 CSS class）
- **自动截图** —— 每个步骤自动截取高清配图

**自动触发条件：** 为 HTML 动画制作配音视频、添加字幕、编写微信公众号兼容文章时。

### doc-to-markdown

将 PDF 和 DOCX 文件转换为格式清晰的 Markdown，自动提取并整理图片：

- **PDF 转换** —— 文本提取+标题检测、嵌入图片提取、扫描版 PDF 自动导出 2x 高清页面图片
- **DOCX 转换** —— 保留标题/列表/代码样式、提取 PNG/JPEG 图片、通过 LibreOffice 或 PIL 处理 EMF/WMF 图表
- **表格提取** —— PDF 表格（PyMuPDF find_tables）、DOCX 表格均转为 Markdown 格式
- **图片管理** —— 按文档分子目录存放，按章节命名（`sec{章节号}_{序号}_{描述}.png`），自动过滤微小装饰图
- **批量处理** —— 支持单文件或整个目录批量转换
- **后处理指引** —— 提供审查、重命名、整理提取图片的工作流

**自动触发条件：** 转换文档为 Markdown、提取 PDF/DOCX 内容、批量转换文件夹，或涉及"convert to markdown"/"转成markdown"/"文档转换"的请求。

### apple-design

以 apple.com 的视觉语言渲染任何 HTML/CSS：

- **设计 token** —— 完整 CSS 自定义属性色板、SF Pro 字号层级、4px 间距网格、12/18px 圆角、柔和阴影、`cubic-bezier(0.25, 1, 0.5, 1)` 缓动
- **版式** —— 白/浅灰/黑交替段落、居中 hero、5 列产品 lineup、3 栏文档、newsroom 卡片网格、事件页
- **组件** —— 27 个 `.apple-*` 开箱即用：毛玻璃 sticky nav、5 栏页脚、仅 Buy 用的填色按钮、表单控件、颜色/容量选项卡、分段控件、标签页、轮播、视频（带 ASL badge）、徽章、pull quote、details 折叠、info/warning/success/danger 四种 admonition、面包屑、全屏搜索
- **模板** —— 9 个可直接打开的 HTML（landing / article / docs / slide-deck / stat-callout / nav-footer / form / product-configurator / specs-page）
- **图表** —— 14 个手工 SVG 模板（flow / architecture / hierarchy / timeline / sequence / register-bitfield / soc-block / hw-timing-waveform / sched-timeline / build-pipeline / function-flowchart / algorithm-ringbuffer / deployment / state-machine），苹果风圆角矩形 + 细灰描边 —— 全部可在[图表画廊](demos/apple-design/diagrams.html)预览
- **交付** —— 纯 `apple.css`（零构建），配套 Tailwind preset

**自动触发条件：** 用户说"apple 风格"/"apple style"/"苹果官网风格"/"like apple.com"，或要求做落地页 / 幻灯片 / 文档 / 图表 / 选配器贴合苹果官网。
**不触发于：** iOS/macOS 原生应用界面（用 Apple HIG 专属 skill），或泛泛的"做个好看页面"。

### anthropic-design

以 anthropic.com 的视觉语言渲染任何 HTML/CSS：

- **设计 token** —— 暖米白 `#faf9f5` 底、`#141413` 文字、`#d97757` 橙主强调、`#6a9bcc` 蓝、`#788c5d` 绿、`#e8e6dc` 浅灰分隔
- **排版** —— Poppins 标题 + **Lora 衬线正文**（与 Apple 无衬线正文是最大差异），JetBrains Mono 代码
- **版式** —— 编辑式卡片网格、长文 720px 单栏、研究论文含内联低饱和图表、产品总览、三档 pricing 卡、企业页（logo 墙）
- **组件** —— 27 个 `.anth-*` 含：实心橙胶囊按钮、Lora 斜体 + 橙色左边 + 客户 logo 的 pull quote、低饱和柱/折/散/地图 调色板、带 `01 / 21` 计数器的引用轮播、pricing 卡（推荐款橙细边）、grayscale hover 还原的 logo 墙
- **模板** —— 9 个 HTML（landing / article / docs / slide-deck / pricing / data-report / enterprise / product-overview / nav-footer）
- **图表** —— 15 个 SVG 模板（橙/蓝/绿节点分类、菱形决策 gate），含内核级图型（register-bitfield / soc-block / hw-timing-waveform / sched-timeline / state-machine / deployment）—— 全部可在 [24 图画廊](demos/anthropic-design/diagrams.html)预览
- **交付** —— 纯 `anthropic.css` + `fonts.css`（Google Fonts 导入 Poppins/Lora/JetBrains Mono），配套 Tailwind preset

**自动触发条件：** 用户说"anthropic 风格"/"anthropic style"/"claude 官网风格"/"Anthropic 品牌"，或要求做编辑式长文、研究文章、pricing 卡片、带温度的填色按钮风格。
**不触发于：** 泛泛的"好看页面"（用 `frontend-design`）或 Apple 美学（用 `apple-design`）。

## 贡献指南

欢迎贡献新的 skill！步骤：

1. 在 `skills/` 目录下创建以 skill 名称命名的子目录
2. 添加 `SKILL.md` 文件，包含规范的 frontmatter：

```markdown
---
name: your-skill-name
description: "简要描述。TRIGGER when: ... DO NOT TRIGGER when: ..."
---

# Skill 标题

Skill 内容：规范、模板、参考资料...
```

3. 更新 `README.md` 和 `README_zh.md` 中的 skill 列表
4. 提交 Pull Request

### Skill 编写建议

- 在 description frontmatter 中写明 **触发条件**
- 提供可以直接使用的 **代码模板**
- 添加 **API 参考** 和速查表
- 内容要 **可执行** —— 写 Claude 能遵循的指引，而不是纯文档
- 建议 **200–600 行**，便于 skill 加载

## 许可证

MIT
