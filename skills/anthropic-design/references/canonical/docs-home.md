# Canonical · anthropic-design docs-home

> A "docs-home" page is the entry point for someone landing at a skill /
> library's documentation. It must answer: what does this ship, where do
> I start, and what does "using it right" look like.

---

## The 6 decisions that make this work

### 1. Hero restates the skill in plain language (not a tagline)

Hero h1 like "Write once. / Render like anthropic.com." with a Poppins
56-64px 600 weight, two-line stacking.

Subtitle: Lora 17-19px, one paragraph explaining what the skill makes
Claude do + how to trigger it. **Not marketing copy** — this page is
read by people trying to USE the skill.

The page title also has a small `.anth-badge` "Skill · anthropic-design"
above h1 — clear context.

### 2. "What the skill ships" — 6 reference cards

A 3×2 grid of 6 `.ref-card`s, each representing one `references/*.md`
file. Each card:
- Small orange kicker: `01 · TOKENS` / `02 · TYPE` / `03 · LAYOUT` / …
- Card name (the `.md` filename, Poppins 20px 600).
- 1-sentence description of what the file covers.
- A `.anth-link` "Read file" linking to the actual .md.

**Why this matters**: a user landing here should grasp the skill's
structure in ~30 seconds. 6 cards, 1 sentence each, total ~200 words.

### 3. "Canonical library" — 3 preview cards

Three `.canon-card`s, each linking to a canonical HTML:
- `pricing.html` with a schematic SVG preview (tier grid sketch).
- `landing.html` with a schematic SVG preview (hero + product mock sketch).
- `More coming…` — greyed placeholder card (opacity 0.55) with a "+"
  icon, listing future page types.

Previews are small SVG sketches, not screenshots — keeps load fast and
the preview abstract enough to not mislead.

### 4. Quick start — 2-column hero-style code block

A `.quickstart` 2-col grid:
- Left: h3 + paragraph explaining "prefix your Claude request with <trigger>".
- Right: a dark-background `<pre>` showing 3 command examples:
  `# 1) Ask Claude / # 2) Verify / # 3) Render + audit`.

The `<pre>` uses a dark `#141413` background with cream text + orange
accent syntax highlighting. Inline `<span class="cmd">` for commands,
`<span class="str">` for strings, `<span class="com">` for comments.

### 5. "In the harness" — connects to bigger picture

A narrow centered section explaining: "This skill is one of 8 generators.
`design-review` is the discriminator. GAN-style split." Links to roadmap
and install pages.

**Why this section**: orients the user who lands here without context,
telling them "you're in a larger system, here's your map."

### 6. Footer references sibling skills

4-column footer with:
- This skill (SKILL.md, landing/pricing demos, canonical README)
- Other skills (cross-links to apple-design, ember-design, sage-design,
  design-review)
- Harness (roadmap, install, home, issues)
- Discussion (GitHub discussions, repo, contributing, license)

Lets readers of one skill's docs-home navigate to another's without
going back to the root.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Page hero h1 | Poppins | 56-64px | 600 `letter-spacing:-0.02em` |
| Subtitle | Lora | 17-19px | 400 `line-height:1.6` |
| Ref-card kicker | Poppins upper | 11.5px | 700 orange |
| Ref-card name | Poppins | 20-22px | 600 |
| Ref-card desc | Lora | 15px | 400 `line-height:1.6` |
| Canon-card title | Poppins | 17px | 600 |
| Quickstart h3 | Poppins | 22-24px | 600 |
| Quickstart code | JetBrains Mono | 13px | 400 |

---

## Don't

- Don't put marketing buzzwords in the hero ("industry-leading", "seamless"
  etc). This is a docs page, not a product landing.
- Don't use `.anth-badge` (orange) on every card — the brand moment is
  the subtle orange kicker text.
- Don't embed live iframes of canonical pages — link out, don't clutter.
- Don't auto-detect browser locale and hide EN for zh users — ALL docs-
  home pages keep bilingual toggle (§G).

## When not to use this canonical

- For the repository home page (the user faces `index.html`, not
  docs-home). index.html is the **marketing front door**; docs-home is
  the **developer entry point**.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
