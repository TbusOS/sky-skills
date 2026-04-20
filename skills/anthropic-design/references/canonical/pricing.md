# Canonical · anthropic-design pricing

> What makes this a good anthropic-design pricing page. Read this **before**
> generating a new anthropic pricing page — don't just copy-paste the HTML.

This file is half-reference, half-critic-rubric. Generator reads it to know the
patterns; future critic reads it to know the acceptance criteria.

---

## The 7 decisions that make this work

### 1. Hero is **restraint**, not a sales pitch

One headline of 4 words, one subtitle of 2 sentences, one trust strip.
No gradient. No 3D product shot. No "limited time offer" banner.

- Headline: noun phrase, period after each line. **No verbs** in the headline
  itself. Verbs live in the CTA.
- Subtitle: first sentence defines the product in one breath; second sentence
  gives the pricing thesis (what's free, what's paid, why).
- Trust strip is a line of plain text in Poppins, not bullets: `all plans
  include X · Y · Z`. No icons. No boxes.

**Why:** anthropic's pricing voice is *confident without being loud*. The
customer arrived with intent; don't re-sell.

### 2. Three tiers, not five

Free · Pro · Team. Always in that order (cheapest first, left to right).
**The middle tier is always the featured one** (orange border + shadow +
flag). That's where the buying decision actually lands.

Avoid:
- Four tiers (analysis paralysis, inevitable "where does Team end and
  Enterprise begin")
- Sliders (nobody knows the right answer for themselves)
- "Contact us" as a tier with no price — put the price for Team; true
  enterprise is a separate page.

### 3. Each tier card shares the same skeleton

Name → Price → Tagline (1 Lora-serif italic sentence) → CTA button → features
list. Every card is the same height; differences are in the content, not the
layout. **Free ghost-button, Pro filled orange, Team ghost**. The filled
button is the only filled button in the whole pricing page.

### 4. Feature list uses a single positive glyph + grey "missing" hatch

- Green check (`#788c5d`, sage-ish green from our palette) for *included*.
- Grey short dash (`#b0aea5`) for *not included*, muted opacity 0.65.

**Never** use a red X — it reads as "rejected", which is wrong for "this
feature lives in a different tier." The missing-hatch pattern reads as
"this lives elsewhere," which is correct.

### 5. Below tiers: a full-bleed comparison table

Every feature listed again, this time cross-tier. Grouped by category
(Writing / Sync & devices / Publishing / Teams / Support). Group headers
are Poppins, 12px, letter-spaced, uppercase — matching the numbered section
markers we use elsewhere. Group rows sit in a lighter cream background to
break the vertical rhythm.

**Why duplicate feature info?** Because some buyers decide from tier cards;
others want to diff features across tiers. Serve both.

### 6. One pull quote, not a testimonial grid

A grid of 6 tiny customer quotes feels like a Series A pitch deck. One
genuine quote, Lora-serif italic, 24px, with a single orange dot and the
writer's name + short credential, is more credible.

The quote **must make a point** (the Skypad one argues *against* other note
apps). A quote like "I love Skypad, it's great" adds nothing.

### 7. FAQ answers are full sentences, not yes/no

Each answer is 2–4 sentences that explain the *why* behind the policy. Show
your work. The Skypad page includes:
- The "what happens if I cancel" answer (retention policy, export
  availability).
- The "what does e2e encryption mean" answer (technical + audit reference).
- The "is there AI-assist" answer (NO, and we're proud of it — a
  differentiation statement).
- The "can my team try it" answer (logistics: pilot program, email).
- The "discount for students/low income" answer (friction-free eligibility).

Every FAQ either *reduces buyer friction* or *states a value we stand by*.
No FAQ exists purely because "people ask."

---

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Poppins | 56–72px | 600 |
| h2 section | Poppins | 36–44px | 600 |
| Tier card name | Poppins | 22px | 600 |
| Price number | Poppins | 56px | 700, `letter-spacing:-0.03em` |
| Price unit | Poppins | 16px | 400 |
| Tier tagline | Lora italic | 15.5px | 400 |
| Pull quote | Lora italic | 24px | 400 |
| FAQ answer | Lora | 15.5px | 400, `line-height:1.65` |
| Comparison table body | Lora | 14.5px | 400 |
| Comparison table group header | Poppins upper | 12px | 600, `letter-spacing:0.1em` |
| Trust strip | Poppins | 14px | 400 |

Lora is for **reading** (taglines, quote, FAQ answer, table body). Poppins is
for **hierarchy** (headings, labels, stats). The moment you use Lora for a
button or a label, the page feels wrong.

---

## Colour rules

- Orange `#d97757` only on: featured-tier border, featured-tier CTA, the orange
  flag on featured tier, accent text in comparison-table "Pro" header, one
  pull-quote dot.
- Everything else stays in the cream / dark-warm-brown neutral scale.
- **Do not** colour non-featured tier cards.

## Don't

- Don't add animations on tier cards (apple does this; anthropic doesn't).
- Don't add a "save 20% yearly" toggle that flips prices — if yearly is
  cheaper, just show the yearly price and say "billed yearly" under it
  (which is what Skypad Pro does).
- Don't put logos of customers above the tiers. Move logos to landing; on
  pricing, a single pull quote is enough.
- Don't hedge the free tier ("for evaluation only"). If you're offering Free,
  let it be a real product.

## When not to use this canonical as template

- Usage-based pricing (e.g., API pricing by tokens) — needs a fundamentally
  different layout (calculator, not tier cards). Don't try to squeeze it in.
- Open-source projects with no paid tier — use the docs-home canonical
  instead; pricing isn't the right page type.
- Marketplaces with variable seller-set prices — different structure again.

## Status
- **Version**: v1 · 2026-04-20
- **Passes**: all three design-review gates (0 error, 2 brand-intentional warn)
- **Read by**: planner (sprint contract pricing pages), critic (acceptance
  rubric), generator (structural + copy pattern)
