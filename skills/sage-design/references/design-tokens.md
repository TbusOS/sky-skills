# Sage Design Tokens

> Palette: **sage green + rice-paper cream + deep indigo**. Quiet, Nordic-minimal, editorial. No warmth, no orange, no purple. Restraint is the signature.

## Colors (严格)

| Token | Hex | Role |
|---|---|---|
| `--sage-bg` | `#f8faec` | page background (rice-paper cream) |
| `--sage-bg-subtle` | `#eef2de` | alt section / stat band |
| `--sage-sage` | `#97B077` | accent, CTA, illustration primary |
| `--sage-sage-dark` | `#7a9561` | sage hover / deeper accent |
| `--sage-ink` | `#393C54` | display headings, dark sections, ink illustrations |
| `--sage-text` | `#2a2c40` | body text (slightly lighter than ink) |
| `--sage-text-secondary` | `#6d6f82` | captions, meta |
| `--sage-divider` | `#e5e8da` | hairline rules, card borders |
| `--sage-card` | `#ffffff` | elevated card surface |

**Contrast rules (measured):**
- white on `--sage-ink` = 11.3 ✓ → primary CTA color
- white on `--sage-sage` = **2.4 FAIL** — don't put body/button text here
- white on `--sage-sage-dark` = 3.6 (warn) → only OK for large bold pill labels
- `--sage-text` on `--sage-bg` = 12.9 ✓
- `--sage-text-secondary` on `--sage-bg` = 6.1 ✓

**Rule:** primary buttons, badges, and long text use **ink** (indigo) on cream/white or white on ink. Sage green is a **decorative** accent — illustrations, progress bars, borders, small dots, hairline strokes. Never as the sole CTA color.

## Typography

- **Display:** Instrument Serif — `400` and `400-italic`. Relaxed letter spacing, airy. For headlines & pull quotes.
- **Body:** Inter — `400 / 500 / 600`. Never Arial, never Helvetica.
- **Mono:** JetBrains Mono — `400 / 500`. Section numbers (`01 · 02 · 03`), meta captions, code blocks.

**Scale** (see `sage.tailwind.js`):

- hero: 64px / 1.05 / weight 400 / tracking -0.01em
- section: 40px / 1.15 / weight 400
- subhead: 24px / 1.3 / weight 500
- lead: 19px / 1.55
- body: 17px / 1.65
- caption: 13px / 1.45
- stat: 76px / 1 / weight 400 / tracking -0.02em

## Spacing

4 px grid. Tokens `--space-1` (4px) → `--space-10` (120px). Sections vertical padding **≥ 96px** (`--space-9`). Negative space is part of the signature — resist packing sections.

## Radii

- `--radius-sm` 6px — small pills
- `--radius-md` 12px — cards
- `--radius-lg` 20px — hero cards
- `--radius-pill` 9999px — pill buttons

## Signature moves

- Hairline `1px solid var(--sage-divider)` rules between sections rather than loud shaded bands (use `--sage-bg-subtle` only when you need a genuine stat band)
- Section numbering: tiny JetBrains-Mono `01 · SECTION-NAME` label in `--sage-text-secondary`, letter-spacing 2px
- Pull quotes: Instrument Serif **italic**, 28–40 px, paired with a short sage-green vertical rule; no fat decorative quote glyph
- Illustrations / charts: palette is limited to `--sage-sage / --sage-ink / --sage-bg / --sage-divider` + their tints. Never introduce a 4th hue.
- Buttons: sage pill with white text (signature CTA) or ink-filled (secondary / most-prominent). No ghost buttons with sage fill on hover — stay hairline.

## Don't

- Don't use brown, orange, purple, warm yellow (that's `ember-design` / `anthropic-design` territory).
- Don't use `--sage-text` on `--sage-sage` — ratio is ~3.5, fails AA body; use white.
- Don't put sage-on-sage: the content inside a sage-colored block always sits on `--sage-bg` or white.
- Don't use heavy shadows. Shadow tokens are `rgba(57, 60, 84, 0.06)` — feather-light.
- Don't use Instrument Serif for body copy — it's a display face; body is Inter.
