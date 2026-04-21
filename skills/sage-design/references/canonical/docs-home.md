# Canonical · sage-design docs-home

> Entry point for someone landing at the sage-design skill's documentation.
> Same intent as anthropic docs-home, rendered in sage voice.

---

## The 6 decisions that make this work

### 1. Hero: left-aligned (not centered), 88px Instrument Serif

Unlike apple/anthropic (centered), sage docs-home hero is LEFT-ALIGNED
with a `.sect-marker` at top:
- `.sect-marker`: "00 · Skill · sage-design" in JetBrains Mono uppercase,
  11.5px, letter-spaced.
- h1: `.hero-headline` — Instrument Serif 88px roman with ONE italic
  accent (e.g. "Render _quietly._").
- Subtitle: Inter 21px, max-width 700px, `line-height: 1.55`.

**Why left-aligned**: sage is academic / library / journal rhythm.
Centered hero feels promotional; left-aligned feels like a reference
document.

### 2. Sage-tinted nav band (brand-presence)

Same as landing/pricing: `.sage-nav` bg `rgba(212, 225, 184, 0.88)`. This
is non-negotiable on any sage public page — visual-audit's brand-presence
check fails otherwise.

### 3. References section (01) — 6 cards on sage-cream band

`.sage-section` with `background: #f0f3e2`. Section starts with
`.sect-marker` ("01 · References") + Instrument Serif 56px roman h2 with
italic accent on "_ships._".

Ref-cards:
- White bg, 1px `var(--sage-divider)`, `border-radius: 4px` (sage uses
  small architectural radii, not 16/20/24 like apple/ember).
- Mono kicker with number ("01 · TOKENS", "02 · TYPE", …) in sage green.
- Instrument Serif 26px **roman** name.
- Inter 15.5px body.
- `.sage-link` at bottom.

### 4. Canonical library (02) — 3 preview cards

Each card:
- White bg, 1px sage-divider, `border-radius: 4px`.
- 160px preview area with sage `#f0f3e2` bg.
- Schematic SVG: pricing shows tier cards with dark-indigo accent on
  featured; landing shows left-aligned serif hero + product sketch.
- Instrument Serif 22px **roman** title.
- Inter 13.5px meta.
- Hover: border changes to `#97B077` sage green.

### 5. Quick start (03) — 2-col, deep-indigo pre block

Left: Instrument Serif 30px roman h3 + Inter body + `.sage-link`. Right:
`<pre>` with `background: var(--sage-ink)` (deep indigo `#393C54`), cream
text `#f0f3e2`, sage-green syntax highlighting.

Mono is JetBrains Mono (sage's mono).

### 6. In-the-harness (04) — centered

Centered section with `.sect-marker` ("04 · In the harness") + Instrument
Serif 56px roman h2 with italic accent on "_discriminator._" + Inter body.
Two CTAs: `.sage-button` (sage green bg) + `.sage-link`.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Sect marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 80-88px | 400 | normal (italic on accent) |
| Subtitle | Inter | 21px | 400 | normal, `line-height:1.55` |
| Section h2 | Instrument Serif | 52-56px | 400 | normal (italic on accent) |
| Ref-card kicker | JetBrains Mono upper | 11px | 600 sage green | normal |
| Ref-card name | Instrument Serif | 26px | 400 | normal |
| Ref-card body | Inter | 15.5px | 400 | normal |
| Canon-card title | Instrument Serif | 22px | 400 | normal |
| Quickstart h3 | Instrument Serif | 30px | 400 | normal |
| Quickstart code | JetBrains Mono | 13px | 400 | normal |

No italic on h1/h2/h3 (§J). Instrument Serif is only display; Inter body;
JetBrains Mono for code + sect-markers.

---

## Colour rules

Sage `#97B077` on: ref-card kickers, canon-card hover border, button bg
(on final CTA), cite hairlines. Pale sage `#d4e1b8` on nav band. Deep
indigo `#393C54` on: pre block bg, all display headings, button bg (on
primary CTA).

## Don't

- Don't use gold (ember), orange (anthropic), blue (apple).
- Don't use Fraunces / Poppins / Lora / SF Pro.
- Don't center-align the hero — left-aligned is the sage signature.
- Don't skip numbered section markers.
- Don't use IBM Plex Mono (ember's mono).
- Don't skip the sage nav tint.

## When not to use this canonical

- For skills whose vibe is "fast / product-forward / consumer" — sage
  voice is always "slow / reference / academic." Use a different style.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
