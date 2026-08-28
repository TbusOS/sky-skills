# Sky Skills

[中文版](README_zh.md)

A curated collection of **Claude Code Skills** — reusable, domain-specific prompt modules that turn Claude Code into an expert assistant for specialized workflows.

## Live Demos

Nine design skills ship with single-page flagship demos under [`demos/`](./demos/) — same content, nine aesthetics:

- [**apple-design demo**](./demos/apple-design/index.html) — sky-skills in apple.com's crisp voice
- [**anthropic-design demo**](./demos/anthropic-design/index.html) — sky-skills in anthropic.com's warm editorial voice
- [**ember-design demo**](./demos/ember-design/index.html) — handcraft editorial warmth (cream + chocolate + gold)
- [**sage-design demo**](./demos/sage-design/index.html) — quiet Nordic minimalism (cream + sage green + deep indigo)
- [**glass-design demo**](./demos/glass-design/index.html) — Apple liquid-glass / aurora glassmorphism (deep navy + cyan + frosted panels, dark/light dual theme)
- [**atelier-design demo**](./demos/atelier-design/index.html) — warm-glass **product UI** (peach/rose wallpaper + one frosted app shell + gradient orbs); the only skill that draws an application, and it actually clicks
- [**eclat-design demo**](./demos/eclat-design/index.html) — product-launch keynote on a matte cinematic stage (near-black #040406 + bone #f6f3ec + one cool-blue flare)
- [**lectern-design demo**](./demos/lectern-design/index.html) — boardroom review deck (paper #f5f6f8 + navy ink #16203a, KPI cards and a decisions table)
- [**primer-design demo**](./demos/primer-design/index.html) — ELI5 picture explainer (paper white + violet #7a5cd6 + marker yellow); thick-outline illustrations, analogy cards and jargon→plain-words chips explain what an Agent Skill is to a reader who has never heard of one
- [**anthropic diagram gallery**](./demos/anthropic-design/diagrams.html) — 23 hand-crafted SVG diagrams (registers, SoC blocks, waveforms, schedulers …)
- [**apple diagram gallery**](./demos/apple-design/diagrams.html) — 14 of the same diagram types in apple.com's clean geometric style
- [**ember diagram gallery**](./demos/ember-design/diagrams.html) — 8 of the same diagram types in warm browns with a single gold focus
- [**sage diagram gallery**](./demos/sage-design/diagrams.html) — 8 of the same diagram types in sage green + indigo ink
- [**glass diagram gallery**](./demos/glass-design/diagrams.html) — 14 of the same diagram types as frosted panels on the aurora field (theme-proof SVG ink)
- [**eclat lookbook**](./demos/eclat-design/diagrams.html) — 8 cinematic keynote compositions (spotlit product, lineup, spec reveal, the moment, pricing, in-the-box, benchmarks, detail)
- [**lectern board pack**](./demos/lectern-design/diagrams.html) — 8 boardroom panels: line / bar / donut / composition / cohort charts, a roadmap timeline, a KPI block and a decisions table
- [**primer picture gallery**](./demos/primer-design/diagrams.html) — 25 thick-outline illustrations from the three primers plus the demo (a book's index, one takeout trip, a sealed envelope …), each answering exactly one question
- [**primer technical set**](./demos/primer-design/tech/index.html) — nine hardware / kernel explainers, one question each: a register, one SPI transfer, an SoC, two chips whose house numbers never merge, why layered protocols have no sideways wire, why one chunk of RAM ends up with two house numbers, an IP core's insides, a character's path from `write()` to a UART pin, and halving

To preview locally: `python3 -m http.server 8000` from the repo root, then open the URLs.

## Available Skills

| Skill | Language | Description |
|-------|----------|-------------|
| [linux-kernel-dev](skills/linux-kernel-dev/) | EN | Linux kernel & driver development — coding standards, module/driver/chardev templates, Kconfig, Makefile, device tree bindings, debugging tools, concurrency patterns, kernel API reference |
| [wechat-video-publisher](skills/wechat-video-publisher/) | ZH | WeChat article & video production pipeline — edge-tts narration, Playwright frame-by-frame recording, ffmpeg subtitle burning, WeChat-compatible inline-style HTML article templates |
| [doc-to-markdown](skills/doc-to-markdown/) | EN/ZH | Document-to-Markdown converter — batch PDF/DOCX to clean Markdown with extracted images, table conversion, EMF/WMF handling, CJK support |
| [md-to-pdf](skills/md-to-pdf/) | EN/ZH | Markdown-to-PDF converter with full Chinese support, bookmarks, and page numbers via PyMuPDF Story HTML rendering |
| [tech-pdf-reader](skills/tech-pdf-reader/) | ZH | **Reading technical PDFs** — datasheets, schematics, protocol specs, where the answer sits in a timing diagram or a pin table rather than in the text layer. Locate the section by keyword, render the page so the figure is actually visible, extract embedded images when rendering fails. Its core discipline is separating **"the tool failed"** from **"the file is damaged"** — identical symptoms, opposite fixes. `scripts/pdf_probe.py` reports text layer / embedded-image count / `/Contents` per page, walks the object graph to tell a recoverable broken reference from content that is simply gone, and reads the `Page N of M` footer to catch truncated copies. A hardware parameter off by one digit is a hardware problem, so an unreadable page is reported as unreadable — never filled in from plausibility |
| [datasheet-reading](skills/datasheet-reading/) | EN/ZH | **Fact lookup in engineering PDFs** — a register's bit definition, a timing minimum, a pin's power source, whether a part is fitted (NC), or whether the document mentions X at all. Locate the page, read the table or figure, and quote it with page + table number so the answer can be re-checked. Its hard rule is that "I could not extract it" is never reported as "the document does not say it" |
| [apple-design](skills/apple-design/) | EN/ZH | Render HTML/CSS in **apple.com** visual aesthetic — white/pale-gray alternating sections, SF Pro typography, minimal text links (no filled buttons), large stat callouts, product-photography-driven layout, hand-drawn SVG diagrams. **Adds diagram-craft v3 (2026-06):** kernel-grade SVG diagram rules (size-first workflow, tinted fills, ≥2 hues per diagram) + the template library grown to 15 — see the [diagram gallery](demos/apple-design/diagrams.html) |
| [anthropic-design](skills/anthropic-design/) | EN/ZH | Render HTML/CSS in **anthropic.com** visual aesthetic — warm cream bg (#faf9f5), Poppins + Lora serif body, orange accent (#d97757) filled pill buttons, editorial card grids, abstract SVG illustrations, low-saturation data viz. **Adds in v2 (2026-04):** scenario recipes for non-canonical layouts (dashboard / form / table / tab / accordion / modal / sidebar / changelog / video / empty-state) + components (input / select / check / switch / toast / dialog / banner / tooltip / skeleton) + motion (hero / stagger / hover / route) + a `references/ux-writing.md` codifying CTA / empty-state / error / placeholder copy plus a banned-word list, all backed by `assets/anthropic.css`. Pair with `bin/design-review --audit <dir-or-url>` to batch-check existing pages. **Adds in v3 (2026-05):** four-piece md rendering pipeline under `scripts/` — `md-mirror` (1 `.md` → 1 anthropic-styled `.html` with inline CSS), `md-rewrite-links` (in-place `.md`→`.html` href swap), `md-pack` (fold linked `.md` into a flat `_md/` subdir + retarget hrefs + basename rescue for source typos), `cross-link-pack` (fold cross-directory sibling `.html` into the same `_md/`). Run pack + cross-link-pack on a doc dir and `cp -r` it anywhere — all links survive. **Adds diagram-craft v3 (2026-06):** kernel-grade SVG diagram rules + the template library grown to 17 (register-bitfield / soc-block / hw-timing-waveform / sched-timeline / interconnect-map / protocol-stack / address-map …) — see the [27-diagram gallery](demos/anthropic-design/diagrams.html) |
| [ember-design](skills/ember-design/) | EN/ZH | Render HTML/CSS in a **handcraft-editorial** aesthetic — cream (#fff2df) + chocolate (#312520) + brown CTA (#492d22) + gold accent (#c49464), Fraunces display serif + Inter body. For artisan brands, boutique hotels, literary journals. **Adds diagram-craft (2026-06):** warm-brown structure + single-gold-focus diagram rules + 8 SVG diagram templates — see the [8-figure gallery](demos/ember-design/diagrams.html) |
| [sage-design](skills/sage-design/) | EN/ZH | Render HTML/CSS in a **quiet Nordic-minimal** aesthetic — rice-paper cream (#f8faec) + sage green accent (#97B077) + deep indigo ink (#393C54), Instrument Serif display + Inter body + JetBrains Mono. For reading apps, botanical studios, modern journals, quiet tech brands. **Adds diagram-craft (2026-06):** green-focus + indigo-ink diagram rules + 8 SVG diagram templates — see the [8-figure gallery](demos/sage-design/diagrams.html) |
| [glass-design](skills/glass-design/) | EN/ZH | Render HTML/CSS in an **Apple liquid-glass / aurora glassmorphism** aesthetic — deep-navy canvas (#0B1020) + aurora light blobs + three tiers of frosted panels (real `backdrop-filter`, 1px gradient refraction rings) + one solid foreground accent (cyan #22D3EE), Space Grotesk display + Inter body + JetBrains Mono. **Dark/light dual theme** (`data-theme`, gates audit both) and a **freezable motion engine** (`glass.js`: scroll-reveal / count-up / 3D tilt / SVG path-draw / parallax — all collapse to the static markup under `prefers-reduced-motion`, so screenshots stay deterministic). Built for showing diagrams, charts and data with maximum visual impact — see the [diagram gallery canonical](skills/glass-design/references/canonical/diagram-gallery.html) and 17 SVG diagram templates |
| [eclat-design](skills/eclat-design/) | ZH | Render HTML/CSS as a **product-launch keynote** — near-black matte canvas (#040406), bone type (#f6f3ec), full-bleed display headlines, spotlight + floor reflection, a single cool-blue flare (#bcd2ff), product hero and a full-screen "the moment" beat. Cinematic and dark, restrained like a launch hall with the lights down. **Don't** use it for glassmorphism (that's `glass-design`), boardroom decks (`lectern-design`) or bright consumer-minimal marketing (`apple-design`) — see the [8-composition lookbook](demos/eclat-design/diagrams.html) |
| [lectern-design](skills/lectern-design/) | ZH | Render HTML/CSS as a **boardroom review deck** — paper-white canvas (#f5f6f8), serif headings, deep navy ink (#16203a), low-saturation navy charts (#1d3a6e), structured agenda / sections, KPI cards, a decisions-and-actions table and status pills. Internal, business-facing, data-first: credible without shouting, like a board review that respects the reader's time — see the [8-panel board pack](demos/lectern-design/diagrams.html) |
| [atelier-design](skills/atelier-design/) | EN/ZH | Render HTML/CSS as **product UI, not a page** — a warm peach-and-rose mesh wallpaper with ONE frosted application shell floating on it (#E8AE86 / #E39BA8 stops on a #E9C3A8 ground, `--atl-shell-bg` 0.32 → rail 0.46 composited → data card 0.80 → table 0.94, `blur(42px) saturate(1.45)`), gradient orb icons (coral #F5854F → rose #DD4F92), round-cap bars over neutral tracks, and exactly one near-black anchor card per screen. Plus Jakarta Sans throughout. **Its JavaScript is half the deliverable**: rails route, tabs switch, accordions fold, result rows expand, tables sort, switches flip, KPIs count up — all attribute-driven (`data-route` / `data-tab` / `data-sort` / `data-count-to` …), all freezable for deterministic screenshots. Dual theme (light canonical, warm-espresso dark). Ships **6 canonical screens** — [dashboard](skills/atelier-design/references/canonical/dashboard.html) / [booking](skills/atelier-design/references/canonical/booking.html) / [detail](skills/atelier-design/references/canonical/detail.html) / [settings](skills/atelier-design/references/canonical/settings.html) / [signin](skills/atelier-design/references/canonical/signin.html) / [console](skills/atelier-design/references/canonical/console.html), plus a [13-figure gallery](demos/atelier-design/diagrams.html) whose last four are **in-app diagrams** — a clickable topology, a pipeline carrying state, a permission graph and a flow canvas (`references/diagram-craft.md` §7). **Don't** use it for landing pages (there is no hero tier — an application has no hero), dark aurora glass (`glass-design`), or anything that gets printed (`backdrop-filter` does not enter the print pipeline) |
| [primer-design](skills/primer-design/) | EN/ZH | ELI5 picture explainers — thick-outline illustrations, analogy cards, jargon→plain-words chips; makes any topic legible to a complete beginner |
| [design-review](skills/design-review/) | EN/ZH | **Independent evaluator** for the 9 design skills — gate-chain validation (`verify.py` structural + `visual-audit.mjs` Playwright-rendered + **`axe-audit.mjs` accessibility conformance (axe-core; color-contrast blocking, and as of 2026-08-27 the whole corpus measures clean in both themes — see known-bugs §6.6)** + `screenshot.mjs` + opt-in **`pixel-gate.mjs` visual regression (pixelmatch, thresholds probe-calibrated)** + `critic.mjs` LLM taste review) plus a repo-internal known-bug catalogue. Also ships `multi-critic.mjs` (4 specialist reviewers with fixed weights), a learning loop that turns critic catches into new gate rules via the `design-learner` agent, and the `bin/design-review` CLI (the default gate run, plus `--plan` / `--audit` / `--distill` modes). Inspired by Anthropic's [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps): generator and evaluator are separate skills so the reviewer doesn't inherit the generator's assumptions. See the full [9-component harness roadmap](docs/HARNESS-ROADMAP.html) (rendered in five of the nine voices) |
| [gated-dual-clone](skills/gated-dual-clone/) | EN/ZH | **Dual-repo git workflow bootstrapper (2-clone default · optional 3-clone with a reproducibility gate).** For projects where the upstream branch is protected (MR / PR only) and builds are heavy / pollute the tree. One command creates a `gateway` repo (push source) and a `satellite` repo (fetch-only build tree) — the build tree is physically unable to reach the remote. Three safety gates verified post-setup: protocol wall, explicit push-URL disable, pre-push hook. Add `--clean-verify-dir` for a 3rd clone on cold disk + a stamp-match pre-push gate that refuses to push anything a from-scratch full build hasn't OK'd. Full [design spec](docs/design-mr-gated-dual-repo.md) + [anthropic demo](demos/gated-dual-clone/index.html) |
| [gated-dual-clone-audit](skills/gated-dual-clone-audit/) | EN/ZH | **Independent evaluator** paired with `gated-dual-clone`. Imports nothing from the generator — only reads the output topology and re-verifies the safety gates. Four tiers: structural (filesystem / hook / hardlink, 8 gates) → configuration (git config, 8 gates) → behavioural (safe `--dry-run` + direct hook invocation, 3 gates) → taste (LLM critic subagent, advisory). Pass `--clean-verify-dir` to auto-add 4 more gates (S9-S11 + C9 + B4) for 3-clone topologies. Run on demand, as a `pre-push` hook, or as a cron drift check. `--json` output feeds `learning-loop` for drift codification. Same generator / evaluator split as `design-review` |
| [doc-review-loop](skills/doc-review-loop/) | ZH | **Two-agent review loop for serious decision documents.** A `writer` agent drafts the doc with code/data evidence; a `reviewer` agent then plays a strict no-context PM, challenges every claim, and returns issues bucketed A (blocker) / B (must-fix) / C (nice-to-have). The main thread feeds reviewer findings back to writer for v2, repeats up to 3 rounds. Each round's diff and reviewer questions are logged to `<doc>.review.log`. Trigger: ship-gate decisions, cross-team alignment docs, complex change justifications, "change vs. don't" rationales. **Don't trigger** for short READMEs, single-page memos, or personal notes — overhead doesn't pay off |
| [design-planner](skills/design-planner/) | ZH | **Brief→sprint-contract planner** for the 9 design skills — expands a vague one-line brief into page-type + audience + section plan + hard quotas (diagram density / bilingual / brand) before any HTML is written, wrapping `bin/design-review --plan`. Unknown page-types borrow the nearest canonical structure and are stamped LOW-CONFIDENCE |
| [design-evolve](skills/design-evolve/) | EN | **Self-improvement loop (harness component 09)** — the harness proposing better generator rules, templates and techniques, then keeping only the ones that measurably score higher. Each round: diagnose the weakest critic axis → propose one change → regenerate → score with the **frozen** evaluator → keep only if it strictly beats the locked baseline *and* no held-out canonical regressed, else `git revert`. The evaluator stays frozen so the generator cannot win by moving the target |
| [skills-sync](skills/skills-sync/) | ZH | **Manual check-and-update for skills repos.** Detects whether the remote is ahead, lists what changed (commit subjects), and — only after you confirm — runs `git pull --ff-only` and adds symlinks for any newly arrived skills. Never updates on its own; local modifications or a diverged branch abort the pull and are reported as-is |

## What Are Claude Code Skills?

[Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) are Markdown files (SKILL.md) that provide Claude Code with domain expertise, coding conventions, templates, and workflow instructions. When installed, they are automatically activated based on trigger conditions — no manual invocation needed.

For example, when you start editing a kernel module, the `linux-kernel-dev` skill automatically kicks in with kernel coding standards, driver templates, and API references.

## Installation

> **Two install scopes.** Copying into a project's `.claude/skills/` makes a skill available in that repository only; copying into `~/.claude/skills/` makes it available in every repository on your machine. The commands below use the user-level `~/.claude/skills/` — swap the destination for project-level installs. Full bilingual walkthrough: [docs/INSTALL.html](docs/INSTALL.html).
>
> **Heads up — two kinds of skills in this repo.** Only four are a lone `SKILL.md`: `skills-sync`, `design-planner`, `design-evolve`, `wechat-video-publisher`. **The other eighteen bundle `scripts/` / `references/` / `templates/` alongside `SKILL.md` and must be installed as the whole directory** — a single-file copy leaves the skill unable to run its scripts. That includes the small-looking ones (`md-to-pdf`, `doc-to-markdown` and `tech-pdf-reader` each carry one script) and the largest one (`linux-kernel-dev` is 233 files). Note the `design-learner` agent used by `design-review`'s learning loop is not part of the skill directory: copy `.claude/agents/design-learner.md` into your `~/.claude/agents/` separately.
>
> **After installation, restart your Claude Code session** so the skill registry picks up the new entries.

### Method 1: Clone + copy (recommended)

```bash
git clone https://github.com/TbusOS/sky-skills.git

# Single-file skill
cp sky-skills/skills/skills-sync/SKILL.md \
  ~/.claude/skills/skills-sync.md

# Multi-file skill — copy the whole directory
cp -r sky-skills/skills/linux-kernel-dev       ~/.claude/skills/
cp -r sky-skills/skills/gated-dual-clone       ~/.claude/skills/
cp -r sky-skills/skills/gated-dual-clone-audit ~/.claude/skills/
cp -r sky-skills/skills/design-review          ~/.claude/skills/
```

### Method 2: Symlink (auto-updates with `git pull`)

```bash
git clone https://github.com/TbusOS/sky-skills.git
cd sky-skills

# Single-file skill
ln -s "$(pwd)/skills/skills-sync/SKILL.md" \
  ~/.claude/skills/skills-sync.md

# Multi-file skill — symlink the whole directory
ln -s "$(pwd)/skills/linux-kernel-dev"       ~/.claude/skills/linux-kernel-dev
ln -s "$(pwd)/skills/gated-dual-clone"       ~/.claude/skills/gated-dual-clone
ln -s "$(pwd)/skills/gated-dual-clone-audit" ~/.claude/skills/gated-dual-clone-audit
ln -s "$(pwd)/skills/design-review"          ~/.claude/skills/design-review
```

### Method 3: Claude Code CLI (if your version supports it)

Some Claude Code versions ship a `claude install` subcommand that handles both shapes:

```bash
claude install github:TbusOS/sky-skills/skills/linux-kernel-dev
claude install github:TbusOS/sky-skills/skills/design-review
```

If the subcommand is not available in your version, use Method 1 or 2.

### Which method to pick

| Method | Pros | Cons |
|---|---|---|
| 1 · Copy | No tool dependency · portable | Upstream updates need re-copy |
| 2 · Symlink | `git pull` upstream = your skills update too | Relies on the clone staying put on disk |
| 3 · CLI | Least typing · handles shape automatically | Depends on `claude install` being available in your CLI version |

## Selected skill details

Five skills are detailed below. For the rest, each skill's own `SKILL.md` is the reference:
[md-to-pdf](skills/md-to-pdf/SKILL.md) ·
[tech-pdf-reader](skills/tech-pdf-reader/SKILL.md) ·
[ember-design](skills/ember-design/SKILL.md) ·
[sage-design](skills/sage-design/SKILL.md) ·
[design-review](skills/design-review/SKILL.md) ·
[gated-dual-clone](skills/gated-dual-clone/SKILL.md) ·
[gated-dual-clone-audit](skills/gated-dual-clone-audit/SKILL.md) ·
[doc-review-loop](skills/doc-review-loop/SKILL.md) ·
[design-planner](skills/design-planner/SKILL.md)

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
- **Diagrams** — 14 hand-crafted SVG templates (flow / architecture / hierarchy / timeline / sequence / register-bitfield / soc-block / hw-timing-waveform / sched-timeline / build-pipeline / function-flowchart / algorithm-ringbuffer / deployment / state-machine) matching Apple's clean geometric style — browse them all in the [diagram gallery](demos/apple-design/diagrams.html)
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
- **Diagrams** — 17 SVG templates with orange/blue/green category coloring and diamond decision gates, including kernel-grade types (register-bitfield / soc-block / hw-timing-waveform / sched-timeline / protocol-stack / address-map) plus a `glyphs.svg` component sheet — browse them all in the [27-diagram gallery](demos/anthropic-design/diagrams.html)
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
