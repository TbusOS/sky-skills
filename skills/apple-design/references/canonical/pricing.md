# Canonical · apple-design pricing

> What makes this a good apple-design pricing page. Read this **before**
> generating a new apple-design pricing page — don't just copy-paste the HTML.

This file is half-reference, half-critic-rubric. Generator reads it to know
the patterns; critic reads it to know the acceptance criteria; planner reads
it to know the sprint contract.

---

## The 7 decisions that make this work

### 1. One blue kicker above the headline — everything else is monochrome

Apple brand comes from **contrast + restraint**, not saturation. The page
uses almost no color: white, pale gray (`#f5f5f7`), and dark text (`#1d1d1f`).
The single exception is a small `#0071E3` blue kicker above h1 (e.g.
"Pricing · Skypad 5") and the same blue on inline links.

**Why**: apple.com does exactly this — 95% neutral, 5% signature blue.
Overusing blue feels like a startup trying to imitate apple, not like apple.

The brand-presence check still needs visible blue in top 1440×500 — the
kicker alone is enough to pass.

### 2. h1 is huge — 80-96px — letter-spacing negative

The hero headline uses `font-size: 80px; letter-spacing: -0.025em` with a
`<br>` to split into two short lines. Never a single long line; never
wrapping naturally.

On `apple-container--hero` (1280px), 96px reads comfortably. Smaller
containers force smaller h1 — if you're in `apple-container` (980px),
drop to 64-72px.

### 3. Three tiers, pill buttons, subtle blue outline on featured

Free · Pro · Team. Featured tier (Pro) gets a 2px `#0071E3` border;
non-featured get 1px `var(--apple-line)`. No drop shadow on featured.
No orange. No gold flag. Just a blue outline + a blue "Most writers" flag.

Each tier price uses SF Pro 64px 700 with `letter-spacing:-0.03em`. Price
unit sits baseline-aligned, small, 15px.

**The CTA is a text link (`.apple-link`), not a filled button**. Apple uses
filled buttons ONLY for true conversion (Buy, Add to Bag). Pricing page CTAs
are "Download ›" / "Start 14-day trial ›" as text links.

### 4. Comparison table: white card on pale-gray band

Below tiers: a full-width table in a white card (`border-radius: 20px`) on
a `#f5f5f7` section background. Groups separated by monochrome uppercase row
headers (Apple uses this exact pattern on its tech-specs tables).

- Check mark = `✓` (no SVG).
- Missing = em-dash `—`.
- No colored highlighting — Pro column only differs by the blue tier label
  in the header row.

### 5. Dark quote band (black on black)

A pure-black full-width section (`background: #000000`) containing one
customer quote in SF Pro Display 36-44px, white text, with a muted cite
below. Apple uses this pattern on product pages to punctuate rhythm.

The quote **must be against another product category**, not for Skypad.
"Skypad is the only tool I stayed in" works because the other half is
"every note app tried to sell me AI."

### 6. FAQ is quiet — no accordion, no chevrons

Simply `<p class="faq-q">` (SF Pro 19px 600) + `<p class="faq-a">`
(SF Pro 15.5px, `line-height: 1.6`, color `--apple-text-secondary`).

No collapse/expand. No accordion. Apple's FAQ pages are just vertical
text with a thin hairline between items. If an FAQ is worth answering,
it's worth showing by default.

### 7. Final CTA mirrors the hero — same big headline, two text links

The closing section ("Start writing today.") uses the same 56-64px hero
typography. Two text-link CTAs side by side. No duplicate of the hero
imagery. **Fine-print line below** — system requirements + refund policy —
in 12-13px `--apple-text-secondary`.

---

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500, `color:#0071E3` |
| h1 hero | SF Pro Display | 80-96px | 700, `letter-spacing:-0.035em` |
| h2 section | SF Pro Display | 44-56px | 700, `letter-spacing:-0.03em` |
| Tier card name | SF Pro Display | 24px | 600, `letter-spacing:-0.015em` |
| Price number | SF Pro Display | 64px | 700, `letter-spacing:-0.03em` |
| Tier tagline | SF Pro Text | 15px | 400, `line-height:1.55` |
| Pull quote | SF Pro Display | 36-44px | 500, `letter-spacing:-0.02em` |
| FAQ question | SF Pro Display | 19px | 600 |
| FAQ answer | SF Pro Text | 15.5px | 400, `line-height:1.6` |
| Comparison table group header | SF Pro Text upper | 11px | 600, `letter-spacing:0.1em` |

No Lora. No Fraunces. No italic on headings (§J applies). SF Pro text for
body, SF Pro Display for headings. One font family — that's the apple move.

---

## Colour rules

- Blue `#0071E3` only on: hero kicker (optional), featured-tier border +
  flag, inline `.apple-link` text, "Most writers" flag.
- Dark text `#1d1d1f` is primary; secondary text `#6e6e73`.
- Section alternation: white (`#ffffff`) ↔ pale gray (`#f5f5f7`) ↔ black
  (`#000000` for the quote band only).
- **Never** use blue for section backgrounds. Never use any other accent
  color. Don't introduce green, orange, red — even for "danger" states.

## Don't

- Don't add gradient fills. Apple's chart doesn't have them.
- Don't add a "save 20% yearly" toggle. If yearly is cheaper, just show
  yearly + "billed yearly" footnote.
- Don't add hover animations to tier cards (apple.com pricing is static).
- Don't add testimonial grids — one black pull-quote section is enough.
- Don't include icons in the tier features list (apple uses `✓` / `—`,
  not green checkmarks).
- Don't put the blue CTA in the nav as a filled button — `.apple-button`
  is reserved for conversion (Buy, Add to Bag). Use `.apple-link` in nav.

## When not to use this canonical as template

- **Free-forever products** where there's no "paid upgrade" motion — the
  3-tier structure forces a narrative that doesn't exist. Use landing +
  a single "Get it" CTA instead.
- **Usage-based pricing** (API by tokens, compute by hours) — needs a
  calculator, not tier cards.
- **Enterprise-only pricing** with "contact us" and custom quotes — drop
  this entirely, use a contact page.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates (0 error, brand-intentional
  suppressed)
- **Read by**: planner (sprint contract apple pricing), critic (acceptance
  rubric), generator (structural + copy pattern)
