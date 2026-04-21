# Canonical · ember-design docs-home

> Entry point for someone landing at the ember-design skill's documentation.
> Same intent as anthropic docs-home, rendered in ember voice.

---

## The 6 decisions that make this work

### 1. Hero: centered, gold hairline + mono eyebrow + 80px Fraunces roman

Centered `.ember-hero` with:
- Top: `.accent-strip accent-strip--center` (48×1 gold hairline).
- `.ember-badge`: "Skill · ember-design" (inline block).
- h1: `.hero-headline` — Fraunces 80px roman, with ONE italic accent
  (e.g. "Render with _warmth._").
- Subtitle: Inter 19px, max-width ~660px, `line-height: 1.6`.

§J: headline roman, italic only on accent.

### 2. "What the skill ships" — 6 ref-cards on warm-cream band

`.ember-section` with `background: #fbeedd`. 3×2 `.ref-grid` of ref-cards:
- White bg, 1px `rgba(73,45,34,0.12)`, `border-radius: var(--radius-md)`.
- Mono small-caps kicker with number ("01 · TOKENS", "02 · TYPE", …).
- Fraunces 24px weight 500 **roman** card name.
- Inter body (15px, 1.6 line-height).
- `.ember-link` at bottom.

### 3. Canonical library — 3 preview cards with cream-gradient SVG

Each `.canon-card`:
- White bg, `border-radius: var(--radius-md)`.
- 160px preview area with `linear-gradient(135deg, #fff2df, #fbeedd)`.
- Schematic SVG inside (pricing: tier sketch with gold accent on featured;
  landing: hero sketch showing Fraunces display lines).
- Fraunces 19px weight 500 **roman** title.
- Inter 13.5px meta.
- Hover: border changes to `#c49464` (gold).

### 4. Quick start — 2-col on cream band, chocolate pre block

`.quickstart` with `background: #fbeedd`. Left: Fraunces 26px roman h3 +
Inter body. Right: `<pre>` with `background: #312520` (chocolate) and
cream text `#fff2df`, gold-accent syntax coloring.

Use IBM Plex Mono for code (ember's mono font).

### 5. In-the-harness section with hairline framing

Centered section with:
- Gold hairline + mono eyebrow ("In the harness").
- Fraunces 52px roman h2 with italic accent on "_discriminator._"
- Inter 17-18px body.
- Two CTAs: `.ember-button` (Read roadmap) + `.ember-link` (Install).

### 6. Footer: 5-column standard ember footer

Same shape as pricing/landing footer. Cross-links to other skill docs-
home in "Other skills" column.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow | IBM Plex Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| Ember badge | Inter | 12px | 600, upper | normal |
| h1 hero | Fraunces | 72-80px | 400 | normal (italic on accent) |
| Subtitle | Inter | 19px | 400 | normal, `line-height:1.6` |
| Section h2 | Fraunces | 48-52px | 400 | normal |
| Ref-card kicker | IBM Plex Mono upper | 11px | 600 | normal |
| Ref-card name | Fraunces | 24px | 500 | normal |
| Ref-card body | Inter | 15px | 400 | normal, `line-height:1.6` |
| Canon-card title | Fraunces | 19px | 500 | normal |
| Quickstart h3 | Fraunces | 26px | 500 | normal |
| Quickstart code | IBM Plex Mono | 13px | 400 | normal |

No italic on h1/h2/h3 (§J). IBM Plex Mono is ember's mono; don't use
JetBrains Mono or SF Mono (cross-skill smell).

---

## Don't

- Don't italicize every heading (§J).
- Don't use Instrument Serif / Poppins / Lora / SF Pro (cross-skill smell).
- Don't use sage green or apple blue.
- Don't skip the centered gold hairline above section titles.
- Don't use JetBrains Mono for code blocks — IBM Plex Mono is ember's mono.

## When not to use this canonical

- For a skill with very few reference files (2-3) — 3×2 ref grid looks
  sparse with 3 cards; use a single-column list instead.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
