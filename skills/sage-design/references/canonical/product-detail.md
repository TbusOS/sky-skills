# Canonical · sage-design product-detail

> What makes this a good sage-design product-detail page. Read this **before**
> generating one. This page documents a single product — Skypad Studio — as a
> calm library plate, not a sales sheet: almanac voice, numbered sections, every
> claim checkable. It completes sage's standard-10 set (landing · pricing ·
> feature-deep · docs-home · comparison · blog-post · changelog · faq · team ·
> **product-detail**).

---

## What a "product-detail" page is for

A product-detail page documents ONE named product — here Skypad Studio — for a
reader who arrived from a product menu, an email, or a docs link and wants the
plain facts: what it is, what it's for, what's inside, and how to get it. Sage
frames this as a reference entry, not a campaign. The voice states numbers in
almanac register (80ms cold start, 18ms backlinks, 90-day history) and names
real limits in the same plain tone it names features. Every checkable fact on
the page can be verified against `pricing.html`, `faq.html`, or an afternoon of
testing — that verifiability *is* the sage promise.

---

## The 8 decisions that make this work

### 1. Hero — product name + tag-line in one h1, single italic accent (00)

`.hero-headline` is Instrument Serif **96px** roman `#393C54`; the tag-line
lives **inside** the same `<h1>` as `.hero-tagline` (44px roman, `margin-top:
var(--space-3)`), and the page's one earned hero italic is the `<em>` on
`keyboard-first`. The product name stays the primary noun — a landing-style
aphorism h1 ("A quieter place to think") would bury the thing the page
documents. One h1, two sizes, one italic — no second heading level, §J satisfied.

### 2. At-a-glance — 4-cell almanac stat strip (01)

`.glance-strip` is `repeat(4, 1fr)` with a top hairline (`--sage-divider`) and
left hairlines between cells. Each cell: JetBrains Mono 11.5px uppercase label,
then `.glance-num` in Instrument Serif **72px roman** (`80 ms` / `.md` / `3` /
`E2E`), then an Inter 14.5px sub-line. Roman numerals at stat scale reuse the
landing's giant-stat grammar, so the strip reads as an almanac entry rather than
a ported quick-facts bar. No marketing words live here — only dates, formats,
counts, platform names.

### 3. Studio window — one three-pane mock as a single library plate (02)

`.product-frame` (`#f0f3e2` band, 6px radius) holds one `1160×560` SVG of the
whole editor: vault left, prose centre, backlinks right. Each pane carries a
JetBrains Mono eyebrow — `01 · VAULT`, `02 · EDITOR`, `03 · BACKLINKS` — the
same mono-eyebrow grammar the landing mock uses. One calm plate beats three
cropped screenshots: sage shows the entire product at rest in a single figure,
captioned (`computed in 18 ms`) and folding both side panes with `⌘ E`.

### 4. Use cases — 3 white tiles, schematic SVG on top (03)

`.use-grid3` is `repeat(3, 1fr)`; each `.use-tile` is white, 4px radius, sage
hairline, with a `240×150` schematic SVG on `#fafbf0` above an Instrument Serif
24px h3 and Inter 15.5px body. The three jobs are Long-form drafts / Research
notes / Daily log — each SVG is a hand-built schematic (draft page with sage
cursor, citation + backlink graph, dated log rows), never a stock icon or
gradient blob. Three tiles, not five: more turns a use-case argument into a
feature wall (§I).

### 5. Spec table — 6 model-card rows on the cream band, mono code pills (04)

The section sits on `--sage-bg-subtle`. `.spec-rows` is a hairline-divided list
(NOT a shadowed card): each `.spec-row` is `220px 1fr` with a JetBrains Mono
11.5px uppercase label left and Inter 16px prose right. Paths and numbers render
as `.spec-body code` — JetBrains Mono 13.5px, white pill, sage hairline,
3px radius. Six rows (Storage format · Search latency · Shortcuts · Versions
kept · Import & export · Encryption), each one claim a tester could check in an
afternoon. Six is the floor; fewer reads as undocumented.

### 6. Honest limits — roman callout, ink left rule, no italic (05)

`.limits-box` is white with a **3px `--sage-ink` left border**, 4px radius. Three
`.limit-item` rows, each `44px 1fr`: a JetBrains Mono index (`01`/`02`/`03`) and
plain Inter 16px prose with a bold lead clause. This is the page's most
trust-bearing copy (no co-editing · no database views or web clipper · mobile is
read-mostly), and it carries **zero italic** — italic would aestheticize the one
section that must stay flatly honest. The mono indices keep sage's numbering
grammar; the prose stays roman.

### 7. The lineup — 3 cards, middle raised, ink "You are here" flag (06)

`.lineup-grid` is `1fr 1.15fr 1fr` — the current product (Studio) is centred and
physically wider, marked `.lineup-card--current` (`--sage-ink` border + 1px ink
box-shadow) with a `.lineup-flag` ("You are here") in white-on-ink. Decoration
should never do the grid's job (§I): raising the middle column is the sanctioned
symmetric-hero move, and the ink flag is the library call-number gesture sage's
pricing.html already uses for its featured tier. Reader (Free) and Sync (with
Pro) flank it; each card's mini-list is Best for / Platform / Price.

### 8. Pricing one-liner, then ink pull-quote, then quiet close (07 · 08 · 09)

Pricing is **one sentence** ("$9 a month, 14-day trial … Team at $29 a seat")
plus a `pricing.html` link — no embedded matrix. The earned-italic moment is the
`.pull-quote-dark` band (08): full-width `--sage-ink`, Instrument Serif **38px
italic** quote, cite in Inter 14.5px sage green `#97B077` with a short sage
hairline. The closing (09) is plain — Instrument Serif h2, two CTAs (Download /
Read the docs), no third hero-scale headline. The page's whole italic budget is
two: the hero accent and this one quote.

---

## FACT-PARITY — the page's load-bearing discipline

Every checkable fact follows **sage's own `pricing.html`**, not the older
anthropic/apple/ember product-detail trio. The siblings still carry a stale
`$8 / $16 / 30-day` fact sheet and price Sync as a separate add-on; this page
must read `$9 Pro / $29 seat / 14-day trial`, `90-day Pro history`, `Sync
included with Pro`, and `Epub` among the exports — because the hero, the lineup,
and the pricing line all link **straight to `pricing.html`**, and a reader who
clicks through must never catch the site contradicting itself one page apart.

Intra-site consistency is a **grep obligation over every fact**, not just the
headline price. Round-1 critic caught three facts ported verbatim from the
sibling trio that contradicted `pricing.html` (the trial length, the history
window, and Sync pricing). The lesson, recorded so it isn't caught twice: when
porting a product-detail to a new skill, grep the destination skill's own
`pricing.html` / `faq.html` for every price, trial, retention, and bundled-
feature claim and reconcile *before* writing — never inherit the source skill's
numbers. (Known upstream debt: `pricing.html` says 90-day Pro history while
`faq.html` says 12 months; resolve at the source, not on this page.)

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Section marker | JetBrains Mono upper | 11.5px, `letter-spacing:0.18em` | 600 | normal |
| Hero headline | Instrument Serif | 96px, `letter-spacing:-0.022em` | 400 | roman (one `<em>`) |
| Hero tag-line | Instrument Serif | 44px | 400 | roman |
| Hero lead | Inter | 21px / 1.55 | 400 | normal |
| Section title | Instrument Serif | 60 / 52 / 44px | 400 | roman (`em` reserved) |
| Glance label | JetBrains Mono upper | 11.5px, `0.18em` | 600 | normal |
| Glance number | Instrument Serif | 72px, `letter-spacing:-0.028em` | 400 | roman |
| Glance sub | Inter | 14.5px / 1.5 | 400 | normal |
| Use-tile h3 | Instrument Serif | 24px | 400 | roman |
| Use-tile body | Inter | 15.5px / 1.65 | 400 | normal |
| Spec label | JetBrains Mono upper | 11.5px, `0.18em` | 600 | normal |
| Spec body | Inter | 16px / 1.65 | 400 | normal |
| Spec / limit code | JetBrains Mono | 13.5px | 400 | white pill |
| Limit index | JetBrains Mono | 11.5px, `0.14em` | 600 | normal |
| Limit body | Inter | 16px / 1.65 | 400 | roman, NO italic |
| Lineup name | Instrument Serif | 28px | 400 | roman |
| Lineup flag | JetBrains Mono upper | 11px, `0.14em` | 600 | white-on-ink |
| Pull quote | Instrument Serif | 38px / 1.35 | 400 | **italic (earned)** |
| Pull-quote cite | Inter | 14.5px | 400 | sage green `#97B077` |

Instrument Serif is the only display; Inter is the only body; JetBrains Mono is
mono + every eyebrow / label / index. §H zh: Instrument Serif → Noto Serif SC,
Inter → Noto Sans SC, all zh display dropped to roman (`font-style:normal`).

---

## Colour rules

- **Sage green `#97B077`** — spent sparingly, the few accent slots only: the
  editor cursor + `##` glyph and graph hub node inside the window SVG, the use-
  tile cursor/heading rules, the pull-quote cite text + hairline, one nav dot.
  Never a fill, never a button bg, never a section band.
- **Deep indigo `--sage-ink` `#393C54`** — display headings, the spec/limit
  code text, the limits-box left rule, the lineup current-card border + flag,
  and the full-width pull-quote band (sage's "dark mode" colour, not pure black).
- **Cream / rice-paper bands** — page bg from `sage.css`; `--sage-bg-subtle`
  under the spec table (04); `#fafbf0` under the lineup (06); `#f0f3e2` for the
  window-mock frame. Cells, tiles, and the limits box are white with sage
  hairlines (`--sage-divider`). 4px / 6px radii only — no rounded-square chrome.

---

## Don't

- **Don't port the sibling trio's price/feature facts** without grepping the
  destination skill's own `pricing.html` / `faq.html` first. The `$8/$16/30-day`
  + Sync-as-add-on sheet is stale here; this page links to `pricing.html` and
  must match it on every checkable fact.
- **Don't italicize the limits callout (05).** It is the most trust-bearing
  copy on the page; roman keeps it honest, italic aestheticizes it.
- **Don't give each spec its own screenshot.** One window mock (02) is the whole
  product plate; the spec table (04) is a hairline list, not six tiles.
- **Don't spend sage green beyond the few accent slots.** No sage fills, sage
  buttons, or sage section bands — green is the cursor / hairline / cite accent,
  nothing larger.
- **Don't add a 5th use-case tile or embed a pricing matrix.** Three tiles (§I);
  pricing is one sentence + one link.
- **Don't use a white nav, Fraunces/Poppins/SF-Pro, or any non-sage palette
  colour** (ember gold, anthropic orange, apple blue) — that is cross-skill
  smell (§K).

## When not to use this canonical

- Skill / company overview with multiple products → `landing.html`.
- Argument for one feature inside the product → `feature-deep.html`.
- Full side-by-side of 2-4 products, or a pricing matrix → `comparison.html`
  / `pricing.html` (this page carries a 3-card lineup + a one-line price only).

## Status

- **Version**: v1 · 2026-06-13
- **Passes**: `verify.py` + `visual-audit` (0 error · 0 warn) + screenshot
  review + design-critic ship.
