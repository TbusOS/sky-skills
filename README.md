# Sky Skills

[中文版](README_zh.md)

A curated collection of **Claude Code Skills** — reusable, domain-specific prompt modules that turn Claude Code into an expert assistant for specialized workflows.

## Available Skills

| Skill | Language | Description |
|-------|----------|-------------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux kernel & driver development — coding standards, module/driver/chardev templates, Kconfig, Makefile, device tree bindings, debugging tools, concurrency patterns, kernel API reference |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | WeChat article & video production pipeline — edge-tts narration, Playwright frame-by-frame recording, ffmpeg subtitle burning, WeChat-compatible inline-style HTML article templates |

## What Are Claude Code Skills?

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) are Markdown files (SKILL.md) that provide Claude Code with domain expertise, coding conventions, templates, and workflow instructions. When installed, they are automatically activated based on trigger conditions — no manual invocation needed.

For example, when you start editing a kernel module, the `linux-kernel-dev` skill automatically kicks in with kernel coding standards, driver templates, and API references.

## Installation

### Method 1: Install via Claude Code CLI (Recommended)

```bash
# Install a specific skill
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev
claude install github:TbusOS/sky-skills/skills/wechat-video-publisher
```

### Method 2: Copy into Your Project

```bash
git clone https://github.com/TbusOS/sky-skills.git

# Copy the skill you need
cp sky-skills/skills/linux-kernel-dev/SKILL.md your-project/.claude/skills/linux-kernel-dev.md
```

### Method 3: Symlink

```bash
git clone https://github.com/TbusOS/sky-skills.git

# Symlink for automatic updates
ln -s "$(pwd)/sky-skills/skills/linux-kernel-dev/SKILL.md" \
  your-project/.claude/skills/linux-kernel-dev.md
```

## Skill Details

### linux-kernel-dev

A comprehensive Linux kernel development assistant that covers:

- **Coding style** — tabs, K&R braces, naming conventions, checkpatch.pl compliance
- **Templates** — kernel module, platform driver, character device, Makefile, Kconfig
- **Device tree** — YAML binding schema, DTS node examples
- **Memory management** — kmalloc/kzalloc, devm_* managed APIs, GFP flags
- **Concurrency** — mutex, spinlock, RCU, completion, wait queues
- **Debugging** — printk/dev_*, ftrace, kprobe, perf, crash/kdump
- **Kernel API reference** — memory, I/O, interrupts, timing, workqueues
- **Upstream workflow** — commit message format, git format-patch, get_maintainer.pl

**Auto-triggers when:** working on kernel modules, device drivers, kernel subsystems, Kconfig, Makefile, device tree files, or C code using kernel APIs.

### wechat-video-publisher

An end-to-end pipeline for creating narrated video tutorials and WeChat articles from interactive HTML animations:

- **Narration** — edge-tts with Microsoft Xiaoxiao voice, automatic timing generation
- **Frame-by-frame recording** — Playwright-based precise 30fps capture (not screen recording)
- **Subtitle burning** — SRT generation from scripts + ffmpeg libass rendering
- **WeChat articles** — full inline-style HTML templates (WeChat strips `<style>` tags and CSS classes)
- **Screenshots** — automated per-step screenshots for article illustrations

**Auto-triggers when:** creating narrated videos from HTML animations, adding subtitles, or writing WeChat-compatible articles.

## Contributing

Contributions are welcome! To add a new skill:

1. Create a directory under `skills/` with your skill name
2. Add a `SKILL.md` file with proper frontmatter:

```markdown
---
name: your-skill-name
description: "Brief description. TRIGGER when: ... DO NOT TRIGGER when: ..."
---

# Your Skill Title

Skill content with guidelines, templates, and references...
```

3. Update the skill table in both `README.md` and `README_zh.md`
4. Submit a pull request

### Skill Writing Guidelines

- Include clear **trigger conditions** in the description frontmatter
- Provide **code templates** that can be directly used
- Add **API references** and quick-lookup tables
- Keep content **actionable** — guidelines Claude can follow, not just documentation
- Target **200–600 lines** for optimal skill loading

## License

MIT
