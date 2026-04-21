# Canonical · ember-design landing

> What makes this a good ember-design landing page. Read this **before**
> generating a new ember-design landing page.

---

## The 7 decisions that make this work

### 1. Hero copy has a handcraft story, not a feature list

Hero subtitle reads like a journal entry — "Made by three people, in rooms
with plants and late afternoon light." The voice is intimate, specific,
slightly shy. Not "world-class Markdown editor" — that's SaaS voice.

**ember's landing sells a philosophy** (handcraft + restraint), not a
feature set.

### 2. Hero headline is Fraunces **roman** 80-96px with one italic accent

Same §J discipline as pricing: "A notebook, _bound by hand._" — most of
the text is roman, the 3-word accent at the end is italic.

Subtitle in Inter 21px, line-height 1.55-1.6, max-width ~660px. First
sentence defines the product; second and third sentences are the
handcraft-story.

### 3. Gold hairline + IBM Plex Mono kicker above every section

Centered 48×1 gold hairline → IBM Plex Mono uppercase "What we chose" /
"By the numbers" / "Uses" eyebrow → section h2 roman Fraunces.

This signature rhythm unifies the page — skip it on any section and
section transitions feel sloppy.

### 4. Product screen mock in a cream gradient frame

Hero product-screen lives in a `.product-frame` with
`background: linear-gradient(135deg, #fff2df 0%, #fbeedd 100%)` and
`box-shadow: 0 20px 50px -20px rgba(73, 45, 34, 0.2)`. The SVG inside
is an editor showing journal entries with Georgia serif text (mimicking
a notebook), mono eyebrows ("JOURNAL", "LINKED FROM"), and a gold accent
line under italic notes.

### 5. Giant-stat strip uses Fraunces italic **numerals**, small labels

Stats: Fraunces 72-76px italic 400. Labels: Inter 14.5px roman.

**This is where italic earns its place** — Fraunces italic numerals are
gorgeous, and they signal the ember editorial aesthetic. Compare to sage
(Instrument Serif roman numerals) and apple (SF Pro 700 sans numerals).

Vertical hairline dividers between stats (1px `rgba(73,45,34,0.12)`).

### 6. Dark chocolate pull-quote band (`.ember-section--dark` or `#312520`)

Full-width, 32-40px Fraunces italic quote, white, with a gold hairline
prefix in the cite. One quote only, not a carousel.

### 7. 2×2 uses grid with small SVG + text, gold code accent

Four `.use-tile` cards, each 2-col (120px SVG + text). SVG uses rounded
rectangles / circles in chocolate + gold against a `#fbeedd` cream bg.
Inline `<code>` in prose uses IBM Plex Mono with gold accent color.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow | IBM Plex Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Fraunces | 80-96px | 400 | normal (italic on accent word) |
| Subtitle | Inter | 19-21px | 400 | normal, `line-height:1.6` |
| Stat number | Fraunces | 72-76px | 400 | italic (earned — numerals) |
| Stat label | Inter | 14.5px | 400 | normal |
| Feat title | Fraunces | 26-28px | 500 | normal |
| Feat body | Inter | 15-16px | 400 | normal, `line-height:1.65` |
| Use tile h3 | Fraunces | 22px | 500 | normal |
| Pull quote | Fraunces | 32-40px | 400 | italic (earned) |

Italic only on: stat numerals, pull-quote, tier tagline, one hero accent
word. No blanket italic on h1/h2/h3 (§J).

---

## Colour rules

Gold `#c49464` on: hairlines, eyebrows color accents, stats dividers,
inline `<code>` text, SVG accent strokes. Chocolate `#492d22` on: main
CTA buttons, dark quote band bg. Cream `#fff2df` page bg; `#fbeedd`
alt section bg.

## Don't

- Don't italicize every heading (§J / visual-audit).
- Don't use Instrument Serif / Poppins / Lora / SF Pro (cross-skill smell).
- Don't use sage green or apple blue.
- Don't add gradient hero backgrounds in primary-color hues — the
  cream-to-warm gradient is the only one.
- Don't skip the gold hairline / mono eyebrow — it's the signature rhythm.
- Don't use photo mocks — ember uses stylized SVG.

## When not to use this canonical

- High-tech product (API, developer tools) — ember voice too aspirational.
  Use anthropic or sage.
- Fast-moving consumer product — ember rhythm is slow; use apple.
- Enterprise B2B — ember reads as "boutique," which undermines scale.
  Use apple.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
