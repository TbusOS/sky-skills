# Sky Skills

[中文版](README_zh.md)

A curated collection of **Claude Code Skills** — reusable, domain-specific prompt modules that turn Claude Code into an expert assistant for specialized workflows.

## Available Skills

| Skill | Language | Description |
|-------|----------|-------------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux kernel & driver development — coding standards, module/driver/chardev templates, Kconfig, Makefile, device tree bindings, debugging tools, concurrency patterns, kernel API reference |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | WeChat article & video production pipeline — edge-tts narration, Playwright frame-by-frame recording, ffmpeg subtitle burning, WeChat-compatible inline-style HTML article templates |
| [doc-to-markdown](skills/doc-to-markdown/) | EN/ZH | Document-to-Markdown converter — batch PDF/DOCX to clean Markdown with extracted images, table conversion, EMF/WMF handling, CJK support |
| [md-to-pdf](skills/md-to-pdf/) | EN/ZH | Markdown-to-PDF converter with full Chinese support, bookmarks, and page numbers via PyMuPDF Story HTML rendering |
| [apple-design](skills/apple-design/) | EN/ZH | Render HTML/CSS in **apple.com** visual aesthetic — white/pale-gray alternating sections, SF Pro typography, minimal text links (no filled buttons), large stat callouts, product-photography-driven layout, hand-drawn SVG diagrams |
| [anthropic-design](skills/anthropic-design/) | EN/ZH | Render HTML/CSS in **anthropic.com** visual aesthetic — warm cream bg (#faf9f5), Poppins + Lora serif body, orange accent (#d97757) filled pill buttons, editorial card grids, abstract SVG illustrations, low-saturation data viz |

## What Are Claude Code Skills?

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) are Markdown files (SKILL.md) that provide Claude Code with domain expertise, coding conventions, templates, and workflow instructions. When installed, they are automatically activated based on trigger conditions — no manual invocation needed.

For example, when you start editing a kernel module, the `linux-kernel-dev` skill automatically kicks in with kernel coding standards, driver templates, and API references.

## Installation

### Method 1: Install via Claude Code CLI (Recommended)

```bash
# Install a specific skill
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev
claude install github:TbusOS/sky-skills/skills/wechat-video-publisher
claude install github:TbusOS/sky-skills/skills/doc-to-markdown
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

### doc-to-markdown

Convert PDF and DOCX files to clean, well-formatted Markdown with images extracted and organized:

- **PDF conversion** — text extraction with heading detection, embedded image extraction, scanned PDF fallback (full-page 2x PNG export)
- **DOCX conversion** — preserves heading/list/code styles, extracts PNG/JPEG images, handles EMF/WMF diagrams via LibreOffice or PIL
- **Table extraction** — PDF tables via PyMuPDF's find_tables, DOCX tables to markdown format
- **Image management** — organized into per-document subdirectories, named by section (`sec{NN}_{seq}_{desc}.png`), tiny decorative images auto-filtered
- **Batch processing** — convert single files or entire directories in one pass
- **Post-processing guidance** — workflow for reviewing, renaming, and curating extracted images

**Auto-triggers when:** converting documents to markdown, extracting content from PDFs/DOCX files, batch-converting a folder of documents, or any request involving "convert to markdown" / "转成markdown" / "文档转换".

### apple-design

Render any HTML/CSS in the visual language of apple.com:

- **Design tokens** — full CSS custom-property palette, SF Pro type scale, 4px spacing grid, 12/18px radii, subtle shadows, `cubic-bezier(0.25, 1, 0.5, 1)` easing
- **Layouts** — alternating white/pale-gray/black sections, centered hero, 5-col product lineup, 3-col docs, newsroom card grid, event page
- **Components** — 27 ready-to-use `.apple-*` classes: sticky blurred nav, 5-col footer, filled-only-for-buy buttons, inputs, option cards, segmented controls, tabs, carousel, video with ASL badge, badges, pull quotes, details, info/warning/success/danger admonitions, breadcrumbs, search overlay
- **Templates** — 9 drop-in HTML files (landing, article, docs, slide-deck, stat-callout, nav-footer, form, product-configurator, specs-page)
- **Diagrams** — 4 hand-crafted SVG templates (flow / architecture / hierarchy / timeline) matching Apple's clean geometric style
- **Delivery** — plain `.apple.css` (no build), plus Tailwind preset

**Auto-triggers when:** the user says "apple 风格" / "apple style" / "苹果官网风格" / "like apple.com", or asks for a landing page / slide / doc / diagram / configurator matching Apple's web look.
**Does not trigger for:** native iOS/macOS UI (use an Apple HIG skill instead) or generic "beautiful page" asks.

### anthropic-design

Render any HTML/CSS in the visual language of anthropic.com:

- **Design tokens** — warm cream `#faf9f5` bg, `#141413` text, `#d97757` orange, `#6a9bcc` blue, `#788c5d` green, `#e8e6dc` light gray divider
- **Typography** — Poppins headings + **Lora serif body** (distinct vs Apple's sans-serif body), JetBrains Mono code
- **Layouts** — editorial card grids, long-form 720px single column, research paper with inline charts, product overview, pricing cards, enterprise with logo wall
- **Components** — 27 `.anth-*` classes including filled-pill orange buttons, italic Lora pull quotes with customer logos, low-saturation data charts, customer quote carousel with counter, pricing card (highlight with orange border), logo wall with grayscale hover
- **Templates** — 9 drop-in HTML files (landing, article, docs, slide-deck, pricing, data-report, enterprise, product-overview, nav-footer)
- **Diagrams** — 4 SVG templates with orange/blue/green category coloring and diamond decision gates
- **Delivery** — plain `.anthropic.css` + `fonts.css` (imports Poppins/Lora/JetBrains Mono from Google Fonts), plus Tailwind preset

**Auto-triggers when:** the user says "anthropic 风格" / "anthropic style" / "claude 官网风格" / "Anthropic 品牌", or asks for editorial long-form, research articles, pricing cards, or a filled-button-with-warmth feel.
**Does not trigger for:** generic "beautiful page" asks (use `frontend-design`) or Apple aesthetic (use `apple-design`).

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
