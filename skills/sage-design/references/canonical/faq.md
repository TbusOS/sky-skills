# Canonical · sage-design faq

> What makes this a good sage-design FAQ page. Read this **before**
> generating a new sage-design FAQ — don't just copy-paste the HTML.
> The page treats 17 questions as a small reference work: numbered groups
> with sticky heads, a native accordion with zero JS state, one honest
> diagram answering half the security section, and a deep-indigo closing
> band that promises a human reply.

---

## The 7 decisions that make this work

### 1. Anchor chips under the hero — a table of contents in section numbers

Hero is `.sage-hero` (centered, like every sage hero; section 01's head
shares the centered axis),
88px Instrument Serif headline, italic on one word ("answered
_plainly._"). Below it, `.anchor-row` holds three `.anchor-link` pills —
JetBrains Mono 11.5px uppercase, 1px `--sage-divider` border,
`border-radius: 999px`, white bg — linking to `#plans` / `#sync` /
`#security`, each labelled with its real section number (`02 ·`,
`03 ·`, `05 ·`). Hover: sage `#97B077` border, `#f0f3e2` bg.

**Why**: the numbered markers are the sage signature; a TOC built from
the same numbers turns a long FAQ into a journal with chapters instead
of a wall of links.

### 2. Sticky two-column question groups (0.85fr / 1.6fr)

Each group (`02 · Plans & billing`, `03 · Sync & devices`,
`05 · Security & privacy`) is a `.faq-group` grid,
`grid-template-columns: 0.85fr 1.6fr`. The left `.faq-group-head`
(`position: sticky; top: 104px`) carries the `.sect-marker`, a 44px
`.section-title`, and a `.group-blurb` (Inter 16px, max-width 380px).

**Why**: at 17 questions this page is ~4x a pricing-page FAQ; the
sticky numbered head keeps "which group am I in" visible through the
whole scroll, reusing the landing craft-grid composition.

### 3. Native `<details>/<summary>` accordion, no JS, no animation

`.faq-item` rows are separated by 1px `--sage-divider` borders. The
`.faq-sum` summary is a three-column grid (`auto 1fr auto`): mono
`.faq-num` (`01`–`06`, restarting per group), `.faq-q` in Instrument
Serif 24px **roman**, and a `.faq-toggle` whose `+`/`−` glyph is pure
CSS (`details[open] .faq-toggle::before`). `:focus-visible` gets a 2px
`--sage-sage-dark` outline.

**Why**: details/summary gives keyboard and screen-reader access for
free. Sage avoids motion on principle — an answer that opens instantly,
with no easing curve, is the quiet-craft voice.

### 4. First question of every group pre-opened

The first `<details>` in each group carries the `open` attribute
(three open answers on load: free plan, offline, server visibility).

**Why**: an all-collapsed FAQ renders as a bare list of links — the
hollow-page failure the proportion rules warn about. One open answer
per group anchors every screen with body text.

### 5. The sync-path diagram gets its own numbered section, not a footnote

Section `04 · What leaves your device` holds a `.figure-frame`
(`#f0f3e2` bg, 1px divider, `border-radius: 6px`) with a 1140×268
viewBox SVG: four numbered cards (plain `.md` file → encrypted on
device → Skypad server → other devices). Only step 2 — encryption —
gets the sage-green border (`stroke="#97B077"`, width 1.5); the others
stay `#e5e8da`. The ciphertext chip on the wire is `#393C54`, a bottom
rule splits "SERVER CAN SEE" from "SERVER CANNOT SEE", and the
figcaption reads "Fig. 1 —" in Inter 13.5px.

**Why**: inside the 640px answer column this SVG would render at scale
0.56 — 11px source text unreadable, below the 0.82 floor; full-width it
renders at ≈0.95. One picture answers five security questions, so it
earns section billing, not footnote placement.

### 6. The stat strip is about support, not the product

Section `01 · How we answer` on `#f0f3e2`: `.giant-stats`, a 4-column
grid split by 1px left hairlines — `.giant-num` Instrument Serif 72px
roman (`17` / `4h` / `0` / `2`) over Inter 14.5px labels.

**Why**: on an FAQ page the visitor's real question is "will anyone
actually answer me" — so the numbers promise support behaviour, not
product scale. Reused landing stats would be decoration.

### 7. Deep-indigo support band closes the page

`.support-band`: `background: var(--sage-ink)` (`#393C54`), white 52px
`.section-title--lg` ("Ask a _human._"), then two `.support-card`s
bordered `rgba(248, 250, 236, 0.22)` at `border-radius: 4px`. The
`.support-meta` kickers are JetBrains Mono 11.5px uppercase in sage
green `#97B077` — the only sage accent inside the dark band. CTA: cream
pill (`#f8faec` bg, indigo text); secondary link: pale sage `#d4e1b8`.

**Why**: sage's dark mode is deep indigo, never black. The dark band
gives the long cream page a definite floor; the email/community split
keeps the two-humans promise from section 01.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Sect marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 88px | 400 | normal (italic on one accent word) |
| Hero lead | Inter | 21px | 400 | normal, `line-height:1.55` |
| Section h2 | Instrument Serif | 44px (52px `--lg`) | 400 | normal (italic on one accent word) |
| Anchor chip | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.14em` | normal |
| Giant stat number | Instrument Serif | 72px | 400, `letter-spacing:-0.028em` | normal |
| Stat label | Inter | 14.5px | 400 | normal |
| Group blurb | Inter | 16px | 400 | normal, `line-height:1.65`, max-width 380px |
| FAQ number | JetBrains Mono | 11.5px | 600, `letter-spacing:0.14em` | normal |
| FAQ question | Instrument Serif | 24px | 400, `letter-spacing:-0.01em` | normal |
| FAQ answer | Inter | 15.5px | 400 | normal, `line-height:1.7`, max-width 640px |
| Inline code in answers | JetBrains Mono | 13px | 400 | on `#f0f3e2` chip, 3px radius |
| Figcaption | Inter | 13.5px | 400 | normal, secondary colour |
| Support card h3 | Instrument Serif | 26px | 400 | normal |

Instrument Serif is the only display font; Inter the only body font;
JetBrains Mono for markers, numbers, toggles, code. Italic appears only
inside hero and section titles, one word each (§J); questions stay roman.

---

## Colour rules

- Sage green `#97B077` on: anchor-chip hover border, the diagram's main
  path (arrows + lock icon) and the single focused card border, and the
  `.support-meta` kickers inside the dark band. Focus outlines use
  `--sage-sage-dark` `#7a9561`.
- Deep indigo `#393C54` (`--sage-ink`) on: all display headings, the
  diagram's step circles and ciphertext chip, and the full
  `.support-band` background.
- Cream bands alternate: hero and sections 02/04 on page bg `#f8faec`;
  sections 01 and 05 on `#f0f3e2`; section 03 on `#fafbf0` (a near-invisible step off the page bg —
  read it as a pause, not a band) — adjacent
  question groups never share a background.
- White `#ffffff` only on working surfaces: anchor chips and the SVG
  canvas inside the `#f0f3e2` figure frame.

## Don't

- Don't rebuild the accordion in JS or animate open/close height —
  native `<details>` means no state and no easing; sage avoids motion.
- Don't ship every item collapsed — three pre-opened answers are what
  keep the page from rendering as a hollow list of links.
- Don't embed the 1140-wide diagram inside the 640px answer column —
  at scale 0.56 its 11px SVG text fails the readability floor (0.82).
- Don't reuse landing product stats in the stat strip — FAQ numbers must
  promise support behaviour (reply time, humans), not product scale.
- Don't italicize `.faq-q` headings — questions are roman 24px; italic
  stays on one accent word per title (§J).
- Don't make the closing band black or sage green — sage's dark surface
  is deep indigo `#393C54` only.

## When not to use this canonical

- Six questions or fewer — the sticky two-column group head is
  overhead; use the single-column FAQ block from the pricing canonical.
- A help-center with search and hundreds of articles — this is a
  curated 17-question page, not a docs system; use a docs-home layout.
- High-energy consumer products or photography-led brands — sage reads
  slow / academic / library; use apple or anthropic.

## Status
- **Version**: v1 · 2026-06-13
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot
  review
