# Canonical · apple-design docs-home

> Entry point for someone landing at a skill's documentation. Same intent
> as anthropic docs-home, rendered in apple voice.

---

## The 6 decisions that make this work

### 1. Hero centered, 80px SF Pro — blue kicker + giant headline

Hero has a small `#0071E3` "Skill · apple-design" kicker, then an 80px
SF Pro Display 700 h1 ("Write once. / Render like apple.com."),
`letter-spacing:-0.035em`. Subtitle 22px SF Pro, max-width 720px, centered.

**Centered layout** (same as apple landing hero) — signals "opening
statement" rather than "content page."

### 2. Pale-gray references band with 6 cards (3×2 grid)

`.apple-section` with `background:#f5f5f7`. Six `.ref-card`s:
- White card bg, 1px `var(--apple-line)`, `border-radius: 16px`.
- Blue `#0071E3` kicker (e.g. "01", "02", …).
- 22px SF Pro 600 card name (`letter-spacing:-0.015em`).
- SF Pro body (15px, 1.55 line-height, secondary color).
- `.apple-link` with "›" arrow at bottom.

The section header above the grid has a 13px blue all-caps "REFERENCES"
kicker, 52px 700 h2 "What the skill ships."

### 3. Canonical library preview — 3 cards with schematic SVGs

Each `.canon-card`:
- 16px border-radius white card.
- 160px preview area with gradient cream bg and a schematic SVG (for
  pricing: tier cards sketch; for landing: hero + product mock sketch).
- 18px SF Pro 600 title.
- 13.5px secondary meta line.
- Hover: border changes from `var(--apple-line)` to `#0071E3`.

### 4. Quick start — 2-column, dark-bg pre block

`.quickstart` 2-col grid on `#f5f5f7` card background. Left: h3 + body
explaining the flow. Right: `<pre>` with `background: #000000`, cream
text, blue syntax highlighting for commands.

The `<pre>` uses `border-radius: 10px` (apple's signature code-block
rounding).

### 5. In-the-harness — centered, generous whitespace

`.apple-section` centered with 56px 700 h2 and 19px body. Includes one
blue kicker above h2 ("IN THE HARNESS"). Two CTAs: filled `.apple-button`
(Read roadmap) + text `.apple-link` (Install the harness).

### 6. Footer: 5 columns × 4 rows of links

Uses `.apple-footer-grid` with 5 columns: Product / For teams / Writers /
Company / Legal — same shape as the pricing/landing footer. Cross-links
to other skill docs-home pages in "Other skills" column.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker | SF Pro Display | 15px | 500 `color:#0071E3` |
| h1 hero | SF Pro Display | 80px | 700 `letter-spacing:-0.035em` |
| Subtitle | SF Pro Display | 22px | 400 |
| Section kicker (blue upper) | SF Pro Text upper | 13px | 600 |
| Section h2 | SF Pro Display | 52px | 700 `letter-spacing:-0.03em` |
| Ref-card name | SF Pro Display | 22px | 600 |
| Ref-card body | SF Pro Text | 15px | 400 |
| Canon-card title | SF Pro Display | 18px | 600 |
| Quickstart h3 | SF Pro Display | 24px | 600 |
| Quickstart code | JetBrains Mono | 13px | 400 |

SF Pro everywhere; JetBrains Mono only in code blocks. No Fraunces,
Instrument Serif, Lora, Poppins.

---

## Don't

- Don't use orange, gold, sage green (cross-skill smell).
- Don't add `.apple-button` filled in nav — text `.apple-link` only.
- Don't put the same "Read file →" 6 times with variations — each
  ref-card says the same CTA in the same style (consistency is apple).
- Don't italicize heading text (§J).

## When not to use this canonical

- When the skill has < 5 reference files — a smaller skill should
  drop one of the 6 ref-cards; don't force empty ones.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
