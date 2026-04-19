# Demos

Same story, four aesthetics. Each demo is a single flagship HTML page showcasing the respective design skill on realistic, self-referential content (this repository itself). Every demo ships the same three programming-focused hero diagrams — **code architecture**, **SoC block diagram**, and **multi-repo git collaboration flow** — so you can compare how each aesthetic handles information-dense visuals.

| Demo | Renders | Character |
|---|---|---|
| [`apple-design/`](./apple-design/index.html) | `skills/apple-design/` | SF Pro, white/pale-gray alternating sections, hero-wide diagrams, full-bleed product tiles, text-link CTAs, dark section |
| [`anthropic-design/`](./anthropic-design/index.html) | `skills/anthropic-design/` | Warm cream, Poppins + Lora serif, orange filled pills, editorial cards, pull quote, bar chart, 3-tier pricing |
| [`ember-design/`](./ember-design/index.html) | `skills/ember-design/` | Deep cream + chocolate + gold, Fraunces display serif + Inter body, coffee-bean hero SVG, gold-quoted pull-quote, handcraft feel |
| [`sage-design/`](./sage-design/index.html) | `skills/sage-design/` | Rice-paper cream + sage green + deep indigo, Instrument Serif display + Inter body + JetBrains Mono section numbers, quiet Nordic minimalism |

## Local preview

```bash
# from repo root
python3 -m http.server 8000
# then open any of:
#   http://localhost:8000/demos/apple-design/index.html
#   http://localhost:8000/demos/anthropic-design/index.html
#   http://localhost:8000/demos/ember-design/index.html
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

Every demo is validated by three scripts before commit:

```bash
# Structural (placeholder / BEM / undefined class / SVG balance)
python3 skills/<skill>/scripts/verify.py demos/<skill>/index.html

# Visual (Playwright render + WCAG contrast + diagram sizing + orphan card)
node skills/<skill>/scripts/visual-audit.mjs demos/<skill>/index.html

# Human-in-the-loop screenshot
node skills/<skill>/scripts/screenshot.mjs demos/<skill>/index.html demo-shot.png
```

## Cross-link

Each demo links to the others near the footer so you can toggle between the four aesthetics on the same content and compare directly.
