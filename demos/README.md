# Demos

Same story, nine aesthetics. Each demo is a single flagship HTML page showcasing the respective design skill on realistic, self-referential content (this repository itself). The five programming-doc aesthetics ship the same three hero diagrams — **code architecture**, **SoC block diagram**, and **multi-repo git collaboration flow** — so you can compare how each handles information-dense visuals. The other four tell the repo's story in their own idiom instead of repeating the code diagrams: **eclat** (keynote) as a product launch, **lectern** (boardroom) as a board review, **atelier** as a working application you can click, **primer** as a picture explainer for someone who has never heard of an Agent Skill.

| Demo | Renders | Character |
|---|---|---|
| [`apple-design/`](./apple-design/index.html) | `skills/apple-design/` | SF Pro, white/pale-gray alternating sections, hero-wide diagrams, full-bleed product tiles, text-link CTAs, dark section |
| [`anthropic-design/`](./anthropic-design/index.html) | `skills/anthropic-design/` | Warm cream, Poppins + Lora serif, orange filled pills, editorial cards, pull quote, bar chart, 3-tier pricing |
| [`atelier-design/`](./atelier-design/index.html) | `skills/atelier-design/` | Peach-and-rose mesh wallpaper under ONE frosted app shell, Plus Jakarta Sans, coral→rose gradient orbs, round-cap bars over neutral tracks, one near-black anchor card — and it actually clicks: rails route, tabs switch, tables sort, KPIs count up |
| [`eclat-design/`](./eclat-design/index.html) | `skills/eclat-design/` | Matte near-black keynote, SF Pro, cool spotlight + warm rim + one flare accent, spotlit-monolith hero, full-screen "0" moment — the repo as a product launch |
| [`ember-design/`](./ember-design/index.html) | `skills/ember-design/` | Deep cream + chocolate + gold, Fraunces display serif + Inter body, coffee-bean hero SVG, gold-quoted pull-quote, handcraft feel |
| [`glass-design/`](./glass-design/index.html) | `skills/glass-design/` | Apple liquid-glass: deep-navy canvas + aurora blobs + frosted panels + solid cyan accent, Space Grotesk + Inter, dark/light dual theme, freezable motion engine |
| [`lectern-design/`](./lectern-design/index.html) | `skills/lectern-design/` | Light paper, serif titles, low-saturation navy bar chart, KPI cards, status pills, a recommendation decisions table — the repo as a board review |
| [`primer-design/`](./primer-design/index.html) | `skills/primer-design/` | Paper white + violet + marker yellow, Fredoka display over Nunito body, thick-outline illustrations at 3.4px round-cap, analogy cards, jargon→plain-words chips and a closing recap — "what is an Agent Skill" for a complete beginner |
| [`sage-design/`](./sage-design/index.html) | `skills/sage-design/` | Rice-paper cream + sage green + deep indigo, Instrument Serif display + Inter body + JetBrains Mono section numbers, quiet Nordic minimalism |
| [`gated-dual-clone/`](./gated-dual-clone/index.html) | `skills/gated-dual-clone/` | Anthropic voice, single-purpose page explaining the 2/3-clone git topology and its safety gates |

Extra pages beyond the nine flagship `index.html`:

- [`anthropic-design/index-v2.html`](./anthropic-design/index-v2.html) — v2 scenario showcase (dashboard / form / table / modal and other non-canonical layouts)
- [`anthropic-design/diagrams.html`](./anthropic-design/diagrams.html) — 23-diagram gallery (registers, SoC blocks, waveforms, schedulers …)
- [`apple-design/diagrams.html`](./apple-design/diagrams.html) — 12-diagram gallery, same diagram types in Apple's clean geometric style
- [`apple-design/motion.html`](./apple-design/motion.html) — motion lab: 8 operable interaction demos (press feedback, interruptible springs, velocity handoff, momentum projection, rubber-band, velocity-decided sheet, one reduced-motion gate)
- [`glass-design/diagrams.html`](./glass-design/diagrams.html) — 14-diagram gallery as frosted panels on the aurora field (theme-proof SVG ink)
- [`eclat-design/diagrams.html`](./eclat-design/diagrams.html) — 8-composition lookbook: spotlit product, lineup, spec reveal, the moment, pricing, in-the-box, benchmarks, detail (cinematic, not code diagrams)
- [`lectern-design/diagrams.html`](./lectern-design/diagrams.html) — 9-visual board pack: line / bar / donut / 100%-stacked / cohort heatmap charts, KPI cards, a roadmap timeline and a RAG decisions table
- [`atelier-design/diagrams.html`](./atelier-design/diagrams.html) — 9-figure gallery of the application parts: gradient orbs, round-cap bars, meters, the anchor card, table and rail states
- [`primer-design/diagrams.html`](./primer-design/diagrams.html) — 25 thick-outline illustrations from the three primers plus the demo (a book's index, one takeout trip, a sealed envelope …), each answering exactly one question

## Local preview

```bash
# from repo root
python3 -m http.server 8000
# then open any of:
#   http://localhost:8000/demos/apple-design/index.html
#   http://localhost:8000/demos/anthropic-design/index.html
#   http://localhost:8000/demos/atelier-design/index.html
#   http://localhost:8000/demos/eclat-design/index.html
#   http://localhost:8000/demos/ember-design/index.html
#   http://localhost:8000/demos/glass-design/index.html
#   http://localhost:8000/demos/lectern-design/index.html
#   http://localhost:8000/demos/primer-design/index.html
#   http://localhost:8000/demos/sage-design/index.html
```

All demos reference CSS via relative paths:

```
demos/<skill>/index.html
         │
         └─ ../../skills/<skill>/assets/{fonts.css,<skill>.css}
```

So opening them over HTTP (not `file://`) is enough — no build step.

## Shared diagram set (programming-focused)

Each demo ships these hero-sized full-row diagrams, rendered in the respective palette:

1. **Code architecture** — 4-layer stack (Presentation / Application / Domain / Infrastructure) with named modules and 5 skill pills in the Domain layer
2. **SoC block diagram** — apple-silicon-feel layout with P-cluster, E-cluster, 10-core GPU, 16-core Neural Engine, memory controller + DRAM, and I/O strip
3. **Multi-repo collaboration flow** — three-remote git workflow (upstream / working / commit-mirror) with feature branches, working-tree status, CI pipeline, and push/PR/rebase arrows

On top of the shared three, each demo has aesthetic-specific small diagrams:
- **Apple:** skill activation pipeline, directory hierarchy, install timeline
- **Anthropic:** git workflow on a branch, orchestrator + sub-agents, release timeline
- **Ember:** lifecycle curve, skill folder tree, install timeline
- **Sage:** lifecycle flow, skill folder tree, install timeline

## Quality gates

Every demo passes four gates before commit. All gate scripts live in one place — `skills/design-review/scripts/` — and work on any of the demos:

```bash
# Gate 1 — structural (placeholder / BEM / undefined class / SVG balance)
python3 skills/design-review/scripts/verify.py demos/<skill>/index.html

# Gate 2 — visual (Playwright render + WCAG contrast + diagram sizing + orphan card)
node skills/design-review/scripts/visual-audit.mjs demos/<skill>/index.html

# Gate 3 — accessibility (axe-core; color-contrast blocking)
node skills/design-review/scripts/axe-audit.mjs --strict demos/<skill>/index.html

# Gate 4 — human-in-the-loop screenshot
node skills/design-review/scripts/screenshot.mjs demos/<skill>/index.html demo-shot.png

# Beyond the four — LLM taste review (assembles the critic prompt; run it through Claude)
node skills/design-review/scripts/critic.mjs demos/<skill>/index.html
```

## Cross-link

The flagship design demos link to each other near the footer so you can toggle between the aesthetics on the same content and compare directly. Two pages do not carry the cross-links: `gated-dual-clone/index.html`, which is a single-purpose page, and `atelier-design/index.html`, which is an outstanding gap rather than a decision — it links to nobody, and adding its row is a queued follow-up.
