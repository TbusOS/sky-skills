# Sky Skills

[English](README.md)

精选 **Claude Code Skills** 合集 —— 可复用的领域专家提示模块，让 Claude Code 成为特定工作流的专业助手。

## 在线 Demo

四个设计类 skill 各自配备了一份单页 flagship demo，位于 [`demos/`](./demos/) 目录 —— 同一份内容，四种美学呈现：

- [**apple-design demo**](./demos/apple-design/index.html) —— apple.com 的冷感克制
- [**anthropic-design demo**](./demos/anthropic-design/index.html) —— anthropic.com 的暖编辑感
- [**ember-design demo**](./demos/ember-design/index.html) —— 手作 · 暖棕 · 文学式的咖啡色系（米白 + 巧克力 + 金）
- [**sage-design demo**](./demos/sage-design/index.html) —— 安静 · 北欧极简（米黄 + 抹茶绿 + 深靛蓝）

本地预览：在仓库根目录执行 `python3 -m http.server 8000`，然后打开上面两个 URL。

## 可用 Skills

| Skill | 语言 | 说明 |
|-------|------|------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux 内核与驱动开发 —— 编码规范、模块/驱动/字符设备模板、Kconfig、Makefile、设备树绑定、调试工具、并发模型、内核 API 速查 |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | 微信公众号视频制作全流水线 —— edge-tts 配音、Playwright 逐帧录制、ffmpeg 字幕烧录、微信兼容 inline-style 文章模板 |
| [doc-to-markdown](skills/doc-to-markdown/) | EN/ZH | 文档转 Markdown —— 批量 PDF/DOCX 转换为格式清晰的 Markdown，自动提取图片、表格转换、EMF/WMF 处理、中文支持 |
| [md-to-pdf](skills/md-to-pdf/) | EN/ZH | Markdown 转 PDF —— 基于 PyMuPDF Story HTML 渲染，完整中文支持、自动书签、页码 |
| [apple-design](skills/apple-design/) | EN/ZH | 以 **apple.com** 网页美学渲染 HTML/CSS —— SF Pro 字体、白/浅灰/黑交替段落、克制的文字链、巨字号统计、产品摄影主导、手工 SVG 流程图 |
| [anthropic-design](skills/anthropic-design/) | EN/ZH | 以 **anthropic.com** 网页美学渲染 HTML/CSS —— 暖米白 + 橙色强调、Poppins 标题 + Lora 衬线正文、实心胶囊按钮、编辑式卡片、抽象 SVG 插画、低饱和图表 |
| [ember-design](skills/ember-design/) | EN/ZH | 以 **手作编辑** 美学渲染 HTML/CSS —— 暖米 (#fff2df) + 深巧克力 (#312520) + 棕色 CTA (#492d22) + 金色 (#c49464)，Fraunces 展示衬线 + Inter 正文。适合咖啡工坊 / 精品酒店 / 文学期刊 / 独立品牌 |
| [sage-design](skills/sage-design/) | EN/ZH | 以 **安静 · 北欧极简** 美学渲染 HTML/CSS —— 米黄 (#f8faec) + 抹茶绿 (#97B077) + 深靛蓝 (#393C54)，Instrument Serif + Inter + JetBrains Mono。适合阅读 app / 植物工作室 / 现代期刊 / 安静的科技品牌 |
| [design-review](skills/design-review/) | EN/ZH | **4 个设计 skill 的独立评审员** —— 三道闸 (`verify.py` 静态 + `visual-audit.mjs` Playwright 渲染 + `screenshot.mjs` 截图) + 仓库内已知 bug 清单。参考 Anthropic 的 [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)：generator 和 evaluator 分离,reviewer 不继承 generator 的立场。完整 [8 组件 harness 路线图](docs/HARNESS-ROADMAP.html)(用 4 种设计声音各渲一版) |
| [gated-dual-clone](skills/gated-dual-clone/) | EN/ZH | **双仓库 git 工作流搭建器。** 适用于上游分支受保护(必须走 MR / PR)、编译重会污染工作树的项目。一条命令创建 `gateway` 仓库(push 源) + `satellite` 仓库(只读编译树)——编译树在物理上够不到远程。搭完自动跑三道安全闸:协议墙、显式 push-URL 禁用、pre-push hook。完整[设计稿](docs/design-mr-gated-dual-repo.md) + [anthropic demo](demos/gated-dual-clone/index.html) |
| [gated-dual-clone-audit](skills/gated-dual-clone-audit/) | EN/ZH | **独立评估器**,和 `gated-dual-clone` 配对。不 import 任何 generator 代码,只读成品拓扑 · 重验三道安全闸。三层:structural(文件系统 / hook / hardlink 抽检, 8 闸) → configuration(git-config 检查, 8 闸) → behavioural(安全 `--dry-run` 测试, 3 闸)。可按需跑、作 `pre-push` hook 跑、作 cron drift 检查跑。`--json` 输出可喂给 `learning-loop` 固化野外捕到的新 drift 模式。和 `design-review` 一样的 generator / evaluator 分离原则 |

## 什么是 Claude Code Skills？

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) 是 Markdown 文件（SKILL.md），为 Claude Code 提供领域专业知识、编码规范、代码模板和工作流指引。安装后，它们会根据触发条件自动激活，无需手动调用。

例如，当你开始编辑内核模块代码时，`linux-kernel-dev` skill 会自动加载内核编码规范、驱动模板和 API 参考。

## 安装方法

> **注意——仓库里有两种 skill。** 有的是单个 `SKILL.md` 文件（如 `linux-kernel-dev` / `md-to-pdf`），有的是 `SKILL.md` + `scripts/` + `references/` + 可选 `agents/` 的整目录（如 `design-review` / `gated-dual-clone` / `gated-dual-clone-audit`）。**多文件 skill 必须按整目录安装**——只 copy 单 `SKILL.md` 会让 skill 起来但脚本跑不动。下面三种方法各自覆盖两种形态。
>
> **装完之后退出 Claude Code 重进**——skill 清单是启动时扫描一次冻结的。

### 方法一：通过 Claude Code CLI 安装（推荐）

自动处理单文件和多文件两种形态。

```bash
# 单文件 skill
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev

# 多文件 skill（整目录）
claude install github:TbusOS/sky-skills/skills/design-review
claude install github:TbusOS/sky-skills/skills/gated-dual-clone
claude install github:TbusOS/sky-skills/skills/gated-dual-clone-audit
```

### 方法二：clone + 复制

```bash
git clone https://github.com/TbusOS/sky-skills.git

# 单文件 skill
cp sky-skills/skills/linux-kernel-dev/SKILL.md \
  ~/.claude/skills/linux-kernel-dev.md

# 多文件 skill —— 整目录复制
cp -r sky-skills/skills/gated-dual-clone       ~/.claude/skills/
cp -r sky-skills/skills/gated-dual-clone-audit ~/.claude/skills/
cp -r sky-skills/skills/design-review          ~/.claude/skills/
```

### 方法三：符号链接（`git pull` 上游 = 本地自动同步）

```bash
git clone https://github.com/TbusOS/sky-skills.git
cd sky-skills

# 单文件 skill
ln -s "$(pwd)/skills/linux-kernel-dev/SKILL.md" \
  ~/.claude/skills/linux-kernel-dev.md

# 多文件 skill —— 整目录 symlink
ln -s "$(pwd)/skills/gated-dual-clone"       ~/.claude/skills/gated-dual-clone
ln -s "$(pwd)/skills/gated-dual-clone-audit" ~/.claude/skills/gated-dual-clone-audit
ln -s "$(pwd)/skills/design-review"          ~/.claude/skills/design-review
```

### 三种方法怎么选

| 方法 | 好处 | 不足 |
|---|---|---|
| 一 · CLI | 最少打字 · 自动识别形态 | 需要 `claude` CLI |
| 二 · 复制 | 不依赖工具 · 可携带 | 上游更新要重新 copy |
| 三 · symlink | `git pull` 上游 = 本地跟新 | 依赖 clone 路径不动 |

## Skill 详细介绍

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
- **图表** —— 4 个手工 SVG 模板（flow / architecture / hierarchy / timeline），苹果风圆角矩形 + 细灰描边
- **交付** —— 纯 `apple.css`（零构建），配套 Tailwind preset

**自动触发条件：** 用户说"apple 风格"/"apple style"/"苹果官网风格"/"like apple.com"，或要求做落地页 / 幻灯片 / 文档 / 图表 / 选配器对齐苹果官网。
**不触发于：** iOS/macOS 原生应用界面（用 Apple HIG 专属 skill），或泛泛的"做个好看页面"。

### anthropic-design

以 anthropic.com 的视觉语言渲染任何 HTML/CSS：

- **设计 token** —— 暖米白 `#faf9f5` 底、`#141413` 文字、`#d97757` 橙主强调、`#6a9bcc` 蓝、`#788c5d` 绿、`#e8e6dc` 浅灰分隔
- **排版** —— Poppins 标题 + **Lora 衬线正文**（与 Apple 无衬线正文是最大差异），JetBrains Mono 代码
- **版式** —— 编辑式卡片网格、长文 720px 单栏、研究论文含内联低饱和图表、产品总览、三档 pricing 卡、企业页（logo 墙）
- **组件** —— 27 个 `.anth-*` 含：实心橙胶囊按钮、Lora 斜体 + 橙色左边 + 客户 logo 的 pull quote、低饱和柱/折/散/地图 调色板、带 `01 / 21` 计数器的引用轮播、pricing 卡（推荐款橙细边）、grayscale hover 还原的 logo 墙
- **模板** —— 9 个 HTML（landing / article / docs / slide-deck / pricing / data-report / enterprise / product-overview / nav-footer）
- **图表** —— 4 个 SVG（橙/蓝/绿节点分类、菱形决策 gate）
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
