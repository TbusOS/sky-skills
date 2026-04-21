# Canonical · sage-design pricing

> What makes this a good sage-design pricing page. Read this **before**
> generating a new sage-design pricing page — don't just copy-paste the HTML.

Half-reference, half-critic-rubric. Generator reads for patterns; critic
reads for acceptance criteria; planner reads for sprint contract.

---

## The 7 decisions that make this work

### 1. Numbered section markers — the sage signature (00 · 01 · 02 …)

Every section starts with a `.sect-marker`: JetBrains Mono uppercase,
11.5px, `letter-spacing: 0.18em`, with a number prefix (`01 · Pricing`,
`02 · Compare`, `03 · Quote`, `04 · FAQ`, `05 · Start`).

**Why**: sage is Nordic-minimal + botanical / library rhythm. Numbered
sections read as "table of contents for a quiet journal" — this is the
voice. Skip the eyebrows → page loses its identity.

### 2. Nav carries sage-green identity (pale sage rgba band)

`.sage-nav` has `background: rgba(212, 225, 184, 0.88)` (pale sage at
88% opacity with `backdrop-filter: blur(16px)`). Border-bottom `#c9d6a8`
(sage-toned hairline).

**Why**: sage-design's brand IS sage green. If nav is warm cream or pure
white, the top of the page reads as ember or apple — brand identity fails.
visual-audit's no-brand-presence check catches this (threshold 1.5%
coverage of sage accent in top 1440×500).

### 3. Hero headline is Instrument Serif **roman** 96px, italic on one accent

`font-family: 'Instrument Serif', serif; font-weight: 400; font-style: normal;
font-size: 96px; letter-spacing: -0.025em`. Italic reserved for ONE accent
word (e.g. "Honest _pricing._"). All other headings roman.

§J compliant: blanket italic reads as wedding-invitation; reserved italic
is editorial.

### 4. Three tiers, ink-colored CTA button, no gold

Tier names: Instrument Serif 40px weight 400 **roman**. Featured tier (Pro)
has 1px `--sage-ink` (deep indigo #393C54) border and 1px box-shadow
downward in same ink — a "solid but quiet" signal.

Featured "Most writers" flag: JetBrains Mono uppercase 10.5px on
`--sage-ink` (dark indigo) background with white text. Very Nordic;
looks like a library call number.

CTA on featured: `.sage-button` (deep indigo bg, white text). Non-featured:
outline ghost button (white bg, indigo text, indigo border).

### 5. Green check, indigo body, no orange/gold

- Included: `✓` in sage green (`#97B077`).
- Missing: em-dash in secondary text (`#6d6f82`) at 0.45 opacity.

**Sage is green-accent**: never use gold, orange, red, blue. The palette
is strictly cream + sage + deep indigo.

### 6. Comparison table: numbered groups, mono headers

Below tiers: section with `background: #f0f3e2`. Table in white card with
`border-radius: 4px` (sage uses small, architectural radii — not 20px
rounded-square like apple). Group headers in JetBrains Mono 10.5px
uppercase, letter-spacing 0.16em.

Pro column label in the header is `<em>Pro</em>` (italic accent on the
tier name, since it's the featured — italic earned).

### 7. Dark quote band on deep indigo (not black)

`.quote-dark` or inline `background: var(--sage-ink)` = `#393C54`. One
Instrument Serif italic quote, 38px, line-height 1.35, white text,
max-width 860px.

**Italic earns its place** (pull-quote).

Cite below: Inter 14px sage green `#97B077` with short sage hairline prefix.

### 8. FAQ headings roman, 24px, with tight letter-spacing

`.faq-q`: Instrument Serif 24px weight 400 **roman**, `letter-spacing:
-0.01em`, line-height 1.25. `.faq-a`: Inter 15.5px 400, `line-height: 1.7`.

---

## Typography rules (strict)

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Section marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 88-104px | 400 | normal (italic on one accent word) |
| h2 section | Instrument Serif | 48-60px | 400 | normal (italic on one accent word) |
| Tier card name | Instrument Serif | 36-40px | 400 | normal |
| Price number | Instrument Serif | 64px | 400 | normal, `letter-spacing:-0.02em` |
| Tier tagline | Instrument Serif | 17px | 400 | italic (earned) |
| Pull quote | Instrument Serif | 34-40px | 400 | italic (earned) |
| FAQ question | Instrument Serif | 22-24px | 400 | normal |
| FAQ answer | Inter | 15.5px | 400 | normal, `line-height:1.7` |
| Comparison table group | JetBrains Mono upper | 10.5px | 600, `letter-spacing:0.16em` | normal |

Instrument Serif is the only display font; Inter is the only body font;
JetBrains Mono is for eyebrows + code. **No Fraunces, no Lora, no SF Pro,
no Poppins** (cross-skill smell).

---

## Colour rules

- Sage green `#97B077` on: check glyphs, pull-quote cite accent line,
  featured-row sage highlight, subtle accents.
- Deep indigo `#393C54` (`--sage-ink`) on: featured-tier border + shadow,
  featured flag bg, dark quote band bg, all display headings.
- Rice-paper cream `#f8faec` as page bg; `#eef2de` or `#f0f3e2` for
  alternating sections.
- **Never** use gold (ember), orange (anthropic), blue (apple). The
  cross-skill-smell check catches these.

## Don't

- Don't italicize every heading (§J — visual-audit catches).
- Don't use Fraunces, Lora, Poppins (cross-skill smell).
- Don't replace numbered section markers with generic "SECTION" uppercase
  — the 00 · 01 · 02 numbering IS the sage signature.
- Don't use pure white for tier cards (use `#ffffff` but keep section bg
  in cream for contrast).
- Don't use rounded-square card radii (20px) — sage uses small 4px radii.
- Don't skip the sage-tint nav band — brand-presence check fails.
- Don't add gold hairlines — that's ember's signature, not sage's.

## When not to use this canonical as template

- High-energy consumer app (fitness, gaming, social) — sage voice reads
  as "slow / academic / library," which is wrong. Use anthropic or apple.
- Enterprise B2B with complex plan structures — sage's 3-tier quiet style
  undersells feature-rich paid tiers. Use apple or custom layout.
- Brand strictly tied to photography — sage is Muji-adjacent, illustration
  + hairlines; if the brand needs real photography, use apple instead.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates (0 error after §J fix + nav
  sage-green tint)
- **Read by**: planner (sprint contract sage pricing), critic (acceptance
  rubric), generator (structural + copy pattern)
