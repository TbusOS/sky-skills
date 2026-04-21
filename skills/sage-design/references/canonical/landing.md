# Canonical · sage-design landing

> What makes this a good sage-design landing page. Read this **before**
> generating a new sage-design landing page.

---

## The 7 decisions that make this work

### 1. Numbered section markers throughout (00 · 01 · 02 … 06)

Every section starts with `.sect-marker`: `00 · Skypad for writers`,
`01 · By the numbers`, `02 · What we chose`, `03 · Craft`, `04 · Uses`,
`05 · Pricing`, `06 · Start`.

The numbering creates a library / journal rhythm. Skip it on any section
and the page loses its sage identity.

### 2. Pale-sage nav band (sage brand-presence check)

`.sage-nav` background `rgba(212, 225, 184, 0.88)` with 16px blur. Border-
bottom `#c9d6a8`. This carries the sage green into the top region so
visual-audit's brand-presence check passes (≥1.5% coverage of sage accent).

### 3. Hero is 104px Instrument Serif roman + one italic accent

`A quieter place` / `_to think._` — the first line roman, the second line's
"to think" is italic. Hero subtitle: Inter 22px, `line-height: 1.55`,
max-width 720px.

§J compliance: only one italic accent per heading.

### 4. Product screen mock uses mono eyebrows (01 · VAULT, 02 · BACKLINKS)

The editor SVG's sidebar has `01 · VAULT` / `02 · BACKLINKS` labels in
JetBrains Mono uppercase, letter-spaced. File list items in Inter. Selected
note title in Instrument Serif italic (rendered inside the SVG — this is
a PRODUCT representation, italic is the product's typography, not the
page's heading style).

### 5. Giant-stat strip: Instrument Serif roman numerals, left-aligned

Stats left-aligned with vertical 1px sage hairlines between each cell.
Numerals: Instrument Serif 72-80px **roman** 400. Labels: Inter 14-15px.

Contrast with ember (italic Fraunces numerals) — sage's roman numerals
read as "library reference" / "almanac entry."

### 6. Deep-indigo pull-quote band (`--sage-ink` = `#393C54`)

Full-width `background: var(--sage-ink)`. 36-40px Instrument Serif
italic quote (italic earned). Cite in Inter 14.5px sage green `#97B077`
with short sage hairline prefix.

Deep indigo instead of pure black — this is sage's "dark mode" color.
Stays on the palette.

### 7. Craft section: 2-column (story + kbd list) for keyboard shortcuts

A two-column `.craft-grid` with 1fr 1.2fr:
- Left: sect-marker + h2 + short narrative paragraph.
- Right: three `.kbd-row` elements (⌘ N / ⌘ K / ⌘ E) + a link to full
  reference.

Each `.kbd-row` is `auto 1fr` grid — mono kbd + Inter tag text, separated
by a sage hairline.

**This section establishes "the whole product in three shortcuts."** Sage
is about simplicity, and showing the entire product through 3 keys is
on-message.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Section marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 88-104px | 400 | normal (one italic accent) |
| Subtitle | Inter | 21-22px | 400 | normal, `line-height:1.55` |
| Stat number | Instrument Serif | 72-80px | 400 | normal |
| Stat label | Inter | 14.5px | 400 | normal |
| Feat title | Instrument Serif | 28-30px | 400 | normal |
| Feat body | Inter | 15.5-16px | 400 | normal, `line-height:1.65` |
| Use tile h3 | Instrument Serif | 22-24px | 400 | normal |
| Kbd-row kbd | JetBrains Mono | 13px | 600 | normal |
| Kbd-row tag | Inter | 15-15.5px | 400 | normal |
| Pull quote | Instrument Serif | 36-40px | 400 | italic (earned) |

Instrument Serif is the only display; Inter is the only body; JetBrains
Mono is mono + eyebrows.

---

## Colour rules

Sage `#97B077` on: nav border accent, hero SVG accent words, check glyphs,
cite hairlines. Pale sage `#d4e1b8` on: nav band, subtle accents. Deep
indigo `#393C54` on: pull-quote bg, featured flags, display headings.
Rice paper `#f8faec` page bg; `#eef2de` alt section bg.

## Don't

- Don't use gold (ember), orange (anthropic), blue (apple).
- Don't use Fraunces / Poppins / Lora / SF Pro (cross-skill smell).
- Don't italicize every heading (§J).
- Don't skip numbered section markers — 00/01/02 IS the signature.
- Don't use rounded-square card radii (use small 4px).
- Don't use a white or off-white nav — sage-tinted band is required for
  brand-presence check.

## When not to use this canonical

- Consumer-fun products (fitness, gaming, social) — sage reads academic.
- Products needing urgency / sales energy — sage is the "calm" style.
- Visual-heavy brands (photography, fashion) — sage is sparse and
  illustration-based.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
