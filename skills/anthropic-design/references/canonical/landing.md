# Canonical · anthropic-design landing

> What makes this a good anthropic-design landing page. Read this **before**
> generating a new anthropic-design landing page.

---

## The 7 decisions that make this work

### 1. Top banner before the hero

A `.anth-banner` with an orange "New" badge + a one-sentence announcement
+ a `.anth-link` call-through. Used for product launches / shipping news.

This is the first thing the reader sees and says "this product is alive
and shipping." Not every landing needs it — but anthropic.com uses this
pattern and we mirror it.

### 2. Hero headline is a noun phrase, three stacked lines

`A quiet notebook.` / `For people who` / `want to think.` — stacked using
explicit `<br>`. Poppins 56-64px, weight 600, `letter-spacing:-0.02em`.

Subtitle: Lora 20px, 1.6 line-height, max-width 680px. First sentence
defines the product in one breath. Second + third sentences state the
3 distinguishing decisions (local, no AI, e2e).

### 3. Hero illustration is a realistic product screen, not abstract shapes

One full-width SVG: an editor window with file tree on left + a Markdown
note on right. File tree shows a real-looking vault ("reading",
"meditations.md"). Content shows a real Marcus Aurelius quote + personal
note response. A tiny orange "SYNCED · ENCRYPTED · 5 devices" badge in the
bottom-right corner.

**Why realistic**: abstract 3D shapes signal "SaaS-generic." A real
editor screenshot-as-SVG signals "confident product, here's what using
it feels like." The copy in the mock must be real prose, not lorem.

### 4. Giant-stat strip on cream-subtle band

Four stats in a single row, 44px bold numbers, small label underneath.
anthropic uses these for trust-markers (writers, notes, zeros, open
source %). The border-radius around the strip is `--radius-md`, not
pill.

**Stat-strip is a sub-pattern** (not to be confused with the "hollow card"
hook from visual-audit §10b — stat cards with big numbers are exempt).

### 5. Three feature cards — kicker + title + body + link

Each feat-card:
- A 56×56 `--radius-md` icon container with `#f0ede3` cream bg.
- A small orange all-caps kicker (`.feat-card__kicker`).
- A 24px Poppins 600 title.
- A 16px Lora body (2-3 sentences).
- A `.anth-link` "read more" at the bottom.

Each card answers ONE non-compromise: local-first / no-AI / e2e-encrypted.
The three are the product's identity.

### 6. Day-of-use grid: 2fr 3fr columns — shortcuts list + product screen mock

A two-column layout: left column has h3 "Three keyboard shortcuts" +
`<ul>` of three `<kbd>` rows with explanations; right column is a second
SVG mock showing the app in writing mode (hiding everything else). With
a blinking cursor animation (SVG animate, opacity 1→0 every 1.1s).

Anthropic landing's role is to make the product feel _usable_ — not just
described. This grid does it.

### 7. Three testimonials, not six — each argues something specific

Each test-card has an italic Lora quote + an cite with orange dot. The
three quotes argue three different things (no redundancy):
- "I stayed in it" (retention)
- "no notifications to deal with" (focus)
- "files are Markdown, no re-migration" (local-first)

Avoid a 6-card grid — makes it feel like a pitch deck.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Banner | Poppins | 14px | 400-500 |
| h1 hero | Poppins | 56-64px | 600, `letter-spacing:-0.02em` |
| Subtitle | Lora | 20px | 400, `line-height:1.6` |
| Stat number | Poppins | 44px | 600, `letter-spacing:-0.02em` |
| Stat label | Poppins | 13px | 400 |
| Feat-card title | Poppins | 24px | 600 |
| Feat-card kicker | Poppins upper | 11.5px | 700, `letter-spacing:0.14em`, orange |
| Feat-card body | Lora | 16px | 400, `line-height:1.65` |
| Test-card quote | Lora | 17px | 400, italic |
| CTA button | Poppins | 14px | 600 |

---

## Colour rules

Orange `#d97757` only on: banner "New" badge, feat-card kickers,
test-card cite dots, SYNCED tag in hero SVG, `.anth-button` filled CTAs.
Everything else is cream + warm dark brown.

## Don't

- Don't use more than 2 filled orange buttons on the page (pricing preview
  CTA + final CTA, maybe nav start).
- Don't add animated gradient backgrounds.
- Don't stack the hero into a single long line — the 3-line noun-phrase
  structure is the signature.
- Don't use photo mocks — SVG-as-screenshot is the signature.
- Don't add lead-capture forms above the fold.

## When not to use this canonical

- Pure docs site with no marketing — use docs-home canonical.
- Product that requires hands-on demo more than descriptive copy — use
  apple-design landing which leans heavier on product-screen showcase.

## Status
- **Version**: v1 · 2026-04-21
- **Passes**: all three design-review gates
