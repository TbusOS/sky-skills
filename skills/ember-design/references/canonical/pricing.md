# Canonical · ember-design pricing

> What makes this a good ember-design pricing page. Read this **before**
> generating a new ember-design pricing page — don't just copy-paste the HTML.

Half-reference, half-critic-rubric. Generator reads for patterns; critic
reads for acceptance criteria; planner reads for sprint contract.

---

## The 7 decisions that make this work

### 1. Hero headline is Fraunces **roman**, with ONE italic accent word

Hero h1: `font-family:'Fraunces', serif; font-weight:400; font-style:normal;
font-size:80px`. Inside the headline, a single `<em>` marks the accent word
(e.g. "Honest _pricing._"). Everything else roman.

**This is the §J italic-discipline decision.** Italic on every heading
reads as wedding-invitation, not editorial. Reserve italic for:
- pull-quotes
- tier-card taglines (15-17px Fraunces italic — earned use)
- one accent word per hero/section-title

### 2. Gold hairline above section titles — the ember signature

Every section title is preceded by a centered 1px × 48px gold hairline
(`.accent-strip accent-strip--center`, color `#c49464`) and a uppercase
IBM Plex Mono eyebrow ("By the numbers" / "What we chose" / "Pricing").

**Why**: ember is handcraft-editorial (Kinfloor / Aesop / literary journals).
These publications use thin gold rules + serif numerals as their visual
signature. Don't skip the hairline — it's the brand.

### 3. Three tiers, chocolate-brown buttons, gold flag on featured

Tier card names: Fraunces 34px weight 500 **roman**. Featured tier (Pro)
has a 1px gold border (`#c49464`) and a gold "Most writers" flag with
italic Fraunces text inside the flag (the flag is small, italic is OK).

Tier taglines: Fraunces 17px italic (earned).

CTA on non-featured tiers: `.ember-link` text. CTA on featured: a filled
`.ember-button` (deep chocolate `#492d22` bg, cream text).

### 4. Feature list uses gold check, never red X

- Included: `✓` in gold (`#c49464`), stroke 2.4.
- Missing: `—` em-dash in muted brown (`#77654d`) at 0.55 opacity.

**Never** a red X. Red doesn't belong in the ember palette and "rejected"
is wrong semantic for "lives in another tier".

### 5. Comparison table on warm-cream band

Below tiers: section with `background: #fbeedd` (ember bg-subtle). Table
itself in a `#ffffff` card with 1px `rgba(73,45,34,0.13)` border, radius
`var(--radius-md)`.

Group headers: IBM Plex Mono uppercase, 10.5px, `letter-spacing: 0.16em`,
brown text on warm cream row. Very different from anthropic's sans header —
this is the ember "field-guide" aesthetic.

### 6. Dark chocolate pull-quote band

A `#312520` full-width section (`.ember-section--dark` OR inline style) with
one Fraunces italic quote at 40px, 1.35 line-height, white text, max-width
920px. Gold hairline in front of the cite.

**The italic earns its place here** — §J compliant.

### 7. FAQ in roman, questions sized tight

`.faq-q` is Fraunces 22px weight 500 **roman** with `letter-spacing:-0.005em`.
`.faq-a` is Inter 15.5px 400, `line-height: 1.7`.

Answers are 2-4 full sentences explaining the *why* behind the policy.
Same rule as anthropic: FAQ exists to reduce friction or state values,
never just because "people ask."

---

## Typography rules (strict)

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow | IBM Plex Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Fraunces | 72-80px | 400 | normal (roman) |
| h2 section | Fraunces | 48-56px | 400 | normal |
| Tier card name | Fraunces | 34px | 500 | normal |
| Tier flag | Fraunces | 13.5px | 500 | italic (accent earned) |
| Price number | Fraunces | 60px | 500 | normal, `letter-spacing:-0.02em` |
| Tier tagline | Fraunces | 17px | 400 | italic (accent earned) |
| Pull quote | Fraunces | 34-40px | 400 | italic (earned) |
| FAQ question | Fraunces | 22px | 500 | normal, `letter-spacing:-0.005em` |
| FAQ answer | Inter | 15.5px | 400 | normal, `line-height:1.7` |
| Comparison table group | IBM Plex Mono upper | 10.5px | 600, `letter-spacing:0.16em` | normal |

Italic is an **accent**, never a default — §J. Blanket italic on every
heading fails visual-audit's italic-overuse check.

---

## Colour rules

- Gold `#c49464` on: section hairlines, check glyphs, featured-tier border,
  flag bg, inline emphasis text (sparing).
- Deep chocolate `#492d22` on: main CTA button bg, dark quote band bg.
- Warm cream `#fff2df` is page bg; `#fbeedd` is the subtle alt section bg.
- Text is dark brown `#312520` primary; `#77654d` secondary.
- **Never** use ember with a pure-white background — cream is the whole
  point. **Never** pair ember with apple blue, anthropic orange, or sage
  green (cross-skill smell, visual-audit flags it).

## Don't

- Don't italicize every h1/h2/h3 (§J — visual-audit catches).
- Don't use Poppins, Lora, Instrument Serif, or SF Pro (cross-skill smell).
- Don't flatten the gold hairlines into thick bars — 1px is the ember voice.
- Don't use red X in feature list.
- Don't auto-rotate testimonials — ember is quiet, static.
- Don't add icons in the tier features list (gold check is the only glyph).
- Don't skip the IBM Plex Mono eyebrow — it's the signature that holds the
  page together.

## When not to use this canonical as template

- High-tech SaaS targeted at engineers — ember voice reads as "aspirational
  lifestyle brand" which is wrong for a developer tool. Use anthropic or
  sage instead.
- Usage-based pricing (calculator needed) — doesn't fit 3-tier structure.
- Products where pure-white minimalism is required (enterprise / financial)
  — use apple.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates (0 error after §J fix)
- **Read by**: planner (sprint contract ember pricing), critic (acceptance
  rubric), generator (structural + copy pattern)
