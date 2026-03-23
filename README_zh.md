# Sky Skills

[English](README.md)

精选 **Claude Code Skills** 合集 —— 可复用的领域专家提示模块，让 Claude Code 成为特定工作流的专业助手。

## 可用 Skills

| Skill | 语言 | 说明 |
|-------|------|------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux 内核与驱动开发 —— 编码规范、模块/驱动/字符设备模板、Kconfig、Makefile、设备树绑定、调试工具、并发模型、内核 API 速查 |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | 微信公众号视频制作全流水线 —— edge-tts 配音、Playwright 逐帧录制、ffmpeg 字幕烧录、微信兼容 inline-style 文章模板 |
| [doc-to-markdown](skills/doc-to-markdown/) | EN/ZH | 文档转 Markdown —— 批量 PDF/DOCX 转换为格式清晰的 Markdown，自动提取图片、表格转换、EMF/WMF 处理、中文支持 |

## 什么是 Claude Code Skills？

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) 是 Markdown 文件（SKILL.md），为 Claude Code 提供领域专业知识、编码规范、代码模板和工作流指引。安装后，它们会根据触发条件自动激活，无需手动调用。

例如，当你开始编辑内核模块代码时，`linux-kernel-dev` skill 会自动加载内核编码规范、驱动模板和 API 参考。

## 安装方法

### 方法一：通过 Claude Code CLI 安装（推荐）

```bash
# 安装指定 skill
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev
claude install github:TbusOS/sky-skills/skills/wechat-video-publisher
claude install github:TbusOS/sky-skills/skills/doc-to-markdown
```

### 方法二：复制到项目中

```bash
git clone https://github.com/TbusOS/sky-skills.git

# 复制需要的 skill
cp sky-skills/skills/linux-kernel-dev/SKILL.md your-project/.claude/skills/linux-kernel-dev.md
```

### 方法三：符号链接

```bash
git clone https://github.com/TbusOS/sky-skills.git

# 符号链接，自动获取更新
ln -s "$(pwd)/sky-skills/skills/linux-kernel-dev/SKILL.md" \
  your-project/.claude/skills/linux-kernel-dev.md
```

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
