# Canonical · anthropic-design feature-deep

> What makes this a good anthropic-design feature-deep page. Read this **before**
> generating a new anthropic-design feature-deep page.

---

## The 7 decisions that make this work

### 1. Hero stacks a noun-phrase headline across three lines

`Your hands` / `never leave` / `the keyboard.` — three stacked lines with
explicit `<br>`. Poppins 56-64px, weight 600, `letter-spacing:-0.02em`.
Orange filled `.anth-badge` kicker ("Feature · 02") above h1.

Subtitle: Lora 20px, 1.6 line-height, max-width 680px. Carries exactly
one italic accent word inside an otherwise roman sentence
("<em>muscle memory</em>"). §J.

Two buttons beneath: primary filled (`See the six chords`) + ghost
(`How the palette works`).

### 2. Stat trio celebrates the three numbers that define this feature

Three stats in a single bordered card on the cream bg: `6 chords`,
`3.2ms median`, `0 required clicks`. Poppins 48px weight 600 figures,
small-caps label below. No italic, no ornament — anthropic stats are
factual.

This strip is the "proof" moment — numbers the reader can trust and
repeat. `grid-template-columns:repeat(3,1fr)` with border + subtle
padding.

### 3. Premise section — editorial prose + one Lora pull-quote

A `.anth-section--subtle` band (cream-subtle bg) with 2 paragraphs of
Lora-body prose explaining **why** this feature exists (not what it
does). Then one `.anth-quote` blockquote (Lora italic 22-24px) with
orange-dot cite underneath.

**Why in an anthropic feature-deep**: the reader needs to be convinced
of the *premise* before the feature list. A feature-deep page that
jumps straight to "here are the chords" reads as a spec sheet, not an
argument.

### 4. Six chord-cards in a 3×2 grid — the core feature inventory

Each `.chord-card` has five slots:
- `.chord-card__kicker`: orange, 11px Poppins uppercase 0.16em tracking
  (e.g. `Find · cmd-K`)
- `.chord-card__chord`: horizontal row of `<kbd>` elements with
  `+` separators (e.g. `⌘ + K`)
- `.chord-card__title`: Poppins 21px weight 600 (e.g. "Open command palette")
- `.chord-card__body`: Lora 15.5px, 1.65 line-height, 2 sentences max
- Single `<em>` accent allowed inside body when it earns emphasis

Six cards, not eight — §I discipline says equal grids work when
content weights truly match, and six chord entries do.

### 5. Palette split — 2fr 3fr layout with dark SVG mock

A `.palette-split` grid where the left column (2fr) has h2 + 4-item
bullet list explaining what the palette indexes, and the right column
(3fr) is a black `palette-mock` SVG showing the palette actually open
with a blinking cursor animation.

The SVG mock is realistic: shows "meditat" typed in, 4 result rows
(one selected with `#d97757` orange highlight), a footer with
`3.2ms` stat + navigation hint. JetBrains Mono for filename, Poppins
for meta. **SVG-as-screenshot, not abstract icon** — anthropic signature.

### 6. Honest callout — "when a mouse is better"

A `.callout` box with a left orange hairline (3px solid border-left
anthropic-orange), cream-subtle bg, and one paragraph listing three
cases where we still reach for a mouse (drag to reorder, scrub long
note, resize split pane). Earned italic on "*the fastest hand wins*".

**Why this section matters**: anthropic voice is confident-quiet, not
marketing-loud. A feature-deep page that claims the feature is perfect
reads as deflection. Naming honest limits strengthens trust for
everything else on the page.

### 7. Technical details — 4 label-value rows with JetBrains Mono code

A list of `.detail-row` (grid-template-columns 180px 1fr) pairs:
- Palette latency · median 3.2ms with method context
- Keyboard layouts · QWERTY / Dvorak / Colemak / AZERTY + physical-key note
- Platform coverage · mac/win/linux + "chord table identical" claim
- Rebindable? · `~/.skypad/keys.toml` pointer + one honest "don't rebind ⌘K" tip

Labels are Poppins 11.5px uppercase orange (same as `.feat-card__kicker`
from landing). Body is Lora 16px with `<code>` elements for paths /
values. Each row ends with a hairline.

This section exists so engineers trust the page. Vague claims
("fast", "everywhere") get replaced with numbers + method. anthropic's
editorial voice allows detail without jargon.

---

## Typography rules

| Element | Font | Size | Weight / Style |
|---|---|---|---|
| `.anth-badge` hero | Poppins upper | 11.5px | 700, 0.14em track, white on orange |
| h1 hero | Poppins | 56-64px | 600, `-0.02em`, three stacked lines |
| Subtitle | Lora | 20px | 400, 1.6 lh, ONE `<em>` allowed |
| Stat number | Poppins | 48px | 600, `-0.02em` |
| Stat label | Poppins | 12.5px | 500 |
| h2 section | Poppins | 36-44px | 600, `-0.02em` |
| `.chord-card__chord kbd` | JetBrains Mono | 13.5px | 500, padded pill |
| `.chord-card__title` | Poppins | 21px | 600 |
| `.chord-card__body` | Lora | 15.5px | 400, 1.65 lh |
| `.palette-list li` | Lora | 16px | 400, 1.6 lh, orange bullet |
| `.callout__kicker` | Poppins upper | 11.5px | 700 orange |
| `.callout__body` | Lora | 16px | 400, 1.65 lh, one `<em>` allowed |
| `.detail-row__label` | Poppins upper | 11.5px | 700 orange |
| `.detail-row__body code` | JetBrains Mono | 14px | 400, cream bg pill |
| Pull-quote `.anth-quote` | Lora | 22-24px | 400 italic |

§H zh mapping: Lora body → Noto Serif SC; Poppins display → Noto Sans
SC; `.anth-quote` italic → roman in zh.

---

## Colour rules

Orange `#d97757` only on:
- Hero `.anth-badge` (filled white-on-orange)
- Chord-card kickers (text)
- Pull-quote cite dot
- Orange SVG highlights inside the palette mock (selected row bg tint,
  cursor, selected row "↵ open" hint)
- `.callout` left hairline + kicker
- `.detail-row__label` text
- `.anth-button` filled hero CTA + download CTA

Everything else is cream (`#faf9f5`), cream-subtle (`#f0ede3`), warm
dark brown (`--anth-text`), and a single dark near-black panel
(`#141413`) for the palette mock.

**Forbidden colours** (§K cross-skill smell):
- apple blue `#0071E3`, `#2997FF`
- ember gold `#c49464`
- sage green `#97B077`, `#d4e1b8`, `#9ab388`
- indigo/purple `#eeecff`, `#3a3d7c` (not in anthropic's 5-color palette)

If the hero needs a third coloured accent, use anthropic blue
(`#6a9bcc`) or olive green (`#788c5d`) from the official palette — do
**not** invent a 6th hue.

---

## Italic discipline (§J)

**Earned places**:
- Hero subtitle — ONE `<em>` accent word or short phrase
- Premise section pull-quote — one `.anth-quote` blockquote
- Callout body — ONE `<em>` inside the honest-caveat paragraph
- Chord-card body — ONE `<em>` per card MAX (not every card needs one)

**Forbidden**:
- Italic on any h1, h2, h3
- Italic on `.chord-card__title` or `.chord-card__kicker`
- Italic on `.detail-row__label` or `.detail-row__body`
- Italic on stat numbers or stat labels
- Blanket italic on list items
- `font-style="italic"` on SVG tspan for any element that isn't a
  pull-quote tagline

Feature-deep pages carry more italic risk than landing/docs-home
because chord-cards × 6 make the page dense. If italic creeps onto
the card title or kicker, the page flips to "wedding invitation"
register.

---

## Don't

- Don't skip the premise section — jumping from hero to chord list
  strips the editorial argument and reads like a spec sheet.
- Don't use more than 2 filled orange CTAs (hero + download) + 1 orange
  ghost button. No third filled orange on the page.
- Don't render the palette as an abstract icon — use the realistic
  black-panel SVG mock with real filenames and a cursor animation.
- Don't stack four or more equal-weight sections in a row without
  an `.anth-section--subtle` band breaking them up. The cream/
  subtle alternation is what gives anthropic pages their rhythm.
- Don't skip the "honest caveat" callout — a feature-deep without a
  named limit reads as marketing, not editorial.
- Don't write h1 in ALL CAPS. anthropic headlines are sentence case
  with a period at the end.

---

## When not to use this canonical

- **Skill overview page** (all features at a glance): use
  `landing.html` canonical — feature-deep is for one feature.
- **Reference docs for a feature API**: use `docs-home.html` pattern
  — feature-deep is prose-heavy and marketing-adjacent. Reference
  docs want tables + code blocks, not chord cards.
- **Pricing comparison** for a tier that happens to include this
  feature: use `pricing.html` canonical — the feature belongs on its
  own page that pricing links to.

---

## Status
- **Version**: v1 · 2026-04-22
- **Passes**: all three visual-audit gates; brand-presence OK; italic 0/1/0/1 across sections
