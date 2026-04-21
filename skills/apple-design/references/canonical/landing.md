# Canonical · apple-design landing

> What makes this a good apple-design landing page. Read this **before**
> generating a new apple-design landing page.

---

## The 7 decisions that make this work

### 1. Hero is centered, huge — 96px h1 — one blue kicker above

`<p style="color:#0071E3">New · <product> 5 for <platform></p>` sits
above a 96px SF Pro Display 700 h1 with `letter-spacing:-0.035em`. The
hero is text-centered (not left-aligned). Subtitle is 24px SF Pro,
max-width 720px, centered.

**Why centered, not left**: apple.com product pages use centered hero
for the "opening statement" framing. Left-aligned reads as content page.

### 2. Product screen mock is the whole hero — huge 1280×560 frame

Right below the headline, a `.product-screen` frame containing one
massive SVG editor window. The SVG has:
- Real window chrome (3 traffic lights, title bar with "filename.md ·
  Skypad")
- File tree sidebar with real folder names + one selected file
- Main content area showing real prose (a Marcus Aurelius quote + a
  personal reflection)
- A bottom status bar with "SAVED · 232 words · 4 minutes ·
  ENCRYPTED · 5 devices"

**Why this much detail**: apple's product pages sell through showing, not
telling. The SVG must look like an actual screenshot (real file list,
real note content, real status). Lorem or generic text kills it.

### 3. Giant 72px stat numbers — 4 across, huge type

Stat strip with 72px SF Pro 700 numbers (`letter-spacing:-0.035em`). Label
is 15px `--apple-text-secondary`.

The stats reinforce non-compromise: 18K+ writers · 12M notes · 0 trackers
· 100% open source. Same trust-marker pattern as anthropic but much
larger type — apple's pages thrive on giant numbers.

### 4. Three feature cards with filled cream icon container

Each `.feat-card`:
- White bg, 1px `var(--apple-line)` border, `border-radius: 24px` (apple's
  generous corner radius).
- A 48×48 `#f5f5f7` rounded-square icon holder containing a 26px SVG
  icon in `#0071E3`.
- `.feat-title`: SF Pro Display 26px 600 with `letter-spacing:-0.02em`.
- `.feat-body`: SF Pro Text 16px, 1.55 line-height, secondary color.
- `.apple-link` at bottom.

**No italic** anywhere in feat-cards (§J).

### 5. Black pull-quote band (pure `#000000`) — 44px quote, white

A full-width black section with one 44px 500 SF Pro Display italic quote,
max-width 980px. Cite in 15px rgba(255,255,255,0.6).

Apple uses black bands to punctuate rhythm on product pages. The quote
**must** contrast with the topic — if the product is "quiet note-taking,"
the quote should be about AI / noise / notifications.

### 6. 2×2 uses grid — each tile has 200×140 SVG illustration

A 2×2 grid of `.use-tile` cards, each with:
- A 200×140 SVG scene on the left (schematic representation of the use).
- Name + body on the right.

Four use-cases: Daily writing · Backlinks & graph · Sync on 5 devices ·
Publish one click. The SVGs are schematic (not photographic).

### 7. Final CTA mirrors pricing preview — pale-gray band

`.apple-section` with `background:#f5f5f7`, centered, 56px h2, filled
`.apple-button` "Download" + text-link alternate. Fine-print below: system
requirements line.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500 `color:#0071E3` |
| h1 hero | SF Pro Display | 80-96px | 700 `letter-spacing:-0.035em` |
| Subtitle | SF Pro Display | 22-24px | 400 `letter-spacing:-0.01em` |
| Stat number | SF Pro Display | 72px | 700 `letter-spacing:-0.035em` |
| Stat label | SF Pro Text | 15px | 400 |
| Feat title | SF Pro Display | 26px | 600 `letter-spacing:-0.02em` |
| Feat body | SF Pro Text | 16px | 400 `line-height:1.55` |
| Use-tile h3 | SF Pro Display | 22px | 600 `letter-spacing:-0.015em` |
| Pull-quote | SF Pro Display | 44px | 500 `letter-spacing:-0.025em` italic |

One font family (SF Pro) — apple's signature. No italic on headings;
italic reserved for pull-quote (§J).

---

## Colour rules

Blue `#0071E3` only on: hero kicker, inline links, filled `.apple-button`,
feat-card SVG icon strokes. Dark text `#1d1d1f` for all headings + body.
Section alternation: white ↔ `#f5f5f7` ↔ black (quote band only).

## Don't

- Don't use Fraunces, Instrument Serif, Lora, Poppins (cross-skill smell
  — visual-audit flags).
- Don't use orange, gold, sage-green anywhere (cross-skill smell).
- Don't put the main CTA inside the nav as a `.apple-button` — nav uses
  `.apple-link` text with blue color.
- Don't stack hero into 4+ lines — 2 lines max with `<br>`.
- Don't shrink the product-screen mock to <960px rendered width (visual-
  audit's diagram-narrow check will flag).
- Don't add scroll-triggered animations to feat-cards.

## When not to use this canonical

- Marketing landing for content-only product (blog, journal, academic
  paper) — use anthropic or sage landing.
- Landing with complex pricing story (usage-based, contact-us tiers) —
  separate pricing page handles it, landing stays short.
- B2B consultative product requiring long-form storytelling — apple's
  centered-minimalism reads as consumer product.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
