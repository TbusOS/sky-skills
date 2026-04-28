# canonical · feature-deep page · apple-design

> **Binding companion** to `feature-deep.html`. Read this before writing a new
> feature-deep page in the apple-design voice. The HTML without this .md is
> half the lesson.

## What a "feature-deep" page is for

A feature-deep page argues for one feature in detail — the `apple.com/macbook-pro/touch-id`
shape, not the `apple.com/macbook-pro` overview. The reader should finish
**convinced the feature was worth designing**, not merely informed it
exists. Where anthropic-voice feature-deep earns trust through editorial
prose + Lora pull-quote, **apple-voice feature-deep earns trust through
restraint** — huge type, hairline rules, one black band closing, no
italic anywhere.

**When this canonical is the right template**:

- One product feature deserves a long-form page (not a paragraph in
  the landing, not a row in pricing).
- The argument is **why this feature exists** + **how it actually works**
  (not a feature-flag flip or a release-note bullet).
- You can name 3–8 honest specifics (counts, latencies, key bindings,
  format details) and at least one limitation.

**When to pick something else**:

- Skill / product overview → use `landing.html` (feature-deep is one
  feature, not all of them).
- API reference for the feature → use `docs-home.html` (feature-deep
  is prose-heavy, not table-heavy).
- Pricing comparison that mentions the feature → use `pricing.html`;
  the feature lives on its own page that pricing links to.

## The 7 decisions that make this work

### 1. Hero · blue kicker text + stacked SF Pro Display 80–96px h1 · no italic

The hero opens with a small blue link-coloured kicker
(`<p style="color:var(--apple-link); font-size:15px; font-weight:500;">Feature · 02 · Keyboard-first</p>`)
above an SF Pro Display 80–96px stacked headline (`Your hands. / Never leave. /
The keyboard.`) with `<br>`s and `letter-spacing:-0.035em`. Subtitle is
SF Pro Text **23px / 1.4** in `--apple-text-secondary`, **with no italic
accent** — emphasis lives in the size cascade and the deliberate period
ending each line.

The kicker is **plain blue text**, not a filled pill. apple.com kickers
are quiet wayfinders, not badges; a filled badge would tip the page
into anthropic register.

→ **Rule**: no `<em>` anywhere in the hero. Apple §J is strict — italic
is forbidden across the entire feature-deep page. Hierarchy is carried
by size (96 → 64 → 23) and by the period at end of each h1 line.

### 2. Stat trio · hairline-divided columns · no card chrome

Three large numbers (`6 chords · 3.2ms median · 0 required clicks`)
sit on a hairline-divided 3-column row, **not** in a bordered card.
Numbers are SF Pro Display 64–72px weight 700, `letter-spacing:-0.035em`.
Labels below are SF Pro Display 14px weight 500 in `--apple-text-secondary`.
Vertical hairlines (`border-left: 1px solid var(--apple-line)`) divide the
columns; the first column has no left border.

Apple stats use **negative space + type weight**, not card containers.
A bordered card around stats would read as anthropic; the hairline
treatment is apple.com's own (see `apple.com/iphone-15-pro/specs`).

→ **Rule**: no card border on the stat row. Hairline columns only.
Numbers are facts, not decorations — no italic, no ornament, no SF
Mono on numbers (Display only).

### 3. Premise · light-gray (`apple-section--alt`) section · centered "moment" sentence + 2 paragraphs · no pull-quote, no italic

The premise sits on a light-gray (`#F5F5F7`) section. Inside: a centered
SF Pro Display **36–44px** sentence (`Skypad's keyboard isn't a feature.
It's the way the app thinks.`) followed by 2 SF Pro Text paragraphs of
17–19px / 1.55 prose in `--apple-text-secondary`.

Crucially: **no `<blockquote>` and no italic.** anthropic feature-deep
puts a Lora-italic pull-quote here; apple replaces that "editorial
moment" with the centered SF Pro Display sentence — same emotional
weight, achieved via type scale + tight tracking instead of italic.

→ **Rule**: the premise's "moment" line is centered SF Pro Display 36–44px
weight 500 with `letter-spacing:-0.022em`, max-width ~920px. No
attribution, no decorative dot, no italic anywhere on this section.
The sentence period at the end is the entire visual rhetoric.

### 4. Six chord-cards in a 3×2 grid · apple card chrome (24px radius)

Each `.chord-card` is white with `1px var(--apple-line)` border and
**24px radius** (apple's signature card radius — never 4px or 12px),
`padding: var(--space-6)`. Slots inside:

- `.chord-card__kicker`: blue (`var(--apple-link)`) SF Pro Display 11.5px
  uppercase, `letter-spacing: 0.14em` (e.g. `FIND · CMD-K`)
- `.chord-card__chord`: row of `<kbd>` elements (SF Mono 13.5px in a
  `var(--apple-bg-alt)` pill with `1px var(--apple-line)` border)
- `.chord-card__title`: SF Pro Display 21px weight 600,
  `letter-spacing: -0.015em` (e.g. "Open command palette")
- `.chord-card__body`: SF Pro Text 15.5px / 1.55 in `--apple-text-secondary`,
  2 sentences max
- **No `<em>` anywhere in the card.** Where anthropic allows one italic
  accent per card, apple forbids it.

Six cards — same `repeat(3, 1fr)` 3×2 grid as anthropic. Apple's
discriminator is the 24px card radius and the absence of italic —
both are unmistakably apple.com vocabulary.

→ **Rule**: 24px radius on the cards. No italic in any chord-card slot.
SF Mono in `<kbd>` elements only — never elsewhere on the page.

### 5. Palette split · 2fr 3fr layout · apple product-window mock SVG

A `.palette-split` grid with `grid-template-columns: 2fr 3fr` and
`gap: var(--space-7)`. Left column has h2 + 4-item bulleted list (blue
hairline bullets, SF Pro Text 16px / 1.6 body). Right column is an
**apple-style product-window SVG mock** — rounded rectangle (12px
radius), three traffic-light buttons (red/yellow/green dots), filename
in title bar (SF Pro Text 11.5px secondary), four result rows below
with the third highlighted in pale blue (`rgba(0, 113, 227, 0.08)`)
and an SF Mono cursor caret.

Where anthropic uses a "black panel with orange highlight" (the palette
mock there is dark-themed), **apple uses a light product-window** —
same realism, opposite chroma. apple.com SVG illustrations are
overwhelmingly light; a black palette mock would feel like anthropic.

→ **Rule**: the palette mock is a light product-window with `1px
var(--apple-line)` border, traffic-light dots in chrome bar, real
filename in title bar, real prose in result rows, blue selection
highlight (not orange). Cursor caret animates `opacity: 1 → 0 → 1`
at 1.2s.

### 6. Honest callout · "when a mouse is better" · hairline blue left + light-gray section

A `.callout` block on a `apple-section--alt` light-gray section, with a
**3px solid blue left border** (`var(--apple-link)`), `padding-left:
var(--space-6)`, no background of its own. Inside: blue uppercase
kicker (SF Pro Display 11.5px / `letter-spacing: 0.14em` /
weight 700) + SF Pro Text 17px / 1.65 body (3 sentences naming three
real cases where you'd reach for a mouse). **No italic anywhere.**

apple's editorial register reaches "honest moment" through the calm
hairline rule + tight type scale, not through the italic pull-quote
shape anthropic uses. A feature-deep that claims the feature is
perfect reads as marketing; one that names three real limits earns
trust for everything else.

→ **Rule**: 3px solid blue left border, no card chrome, no italic
anywhere in the callout body. The kicker is blue uppercase, the body
is `--apple-text-secondary`. One paragraph, three sentences naming
three concrete limits.

### 7. Closing band · black (`apple-section--dark`) with SF Pro Display 44px sentence + filled blue CTA

The page closes with apple's signature black band (`#000000` background,
`#F5F5F7` text) — used **once** per page. Inside: SF Pro Display **44px**
weight 500 sentence centered (e.g. "The fastest hand wins. Try it for a
week."), then a small SF Pro Text 14px cite below in
`rgba(255,255,255,0.5)`, then a single filled `.apple-button` (white
background, black text — the inverse-on-dark CTA pattern from apple.com).

Where anthropic feature-deep ends in cream with detail rows + a quiet
CTA, apple feature-deep closes with a high-contrast black band — its
signature reserved closing move (already established on apple/landing.html
and apple/comparison.html). Used **once**: a second dark section would
break the rhythm.

→ **Rule**: black band, white type, **one** filled white-on-black
button. No italic on the closing sentence. No `<blockquote>` shape —
it's a single SF Pro Display 44px line, not a pull-quote with quotation
marks. The cite below uses `font-style: normal` (apple §J strict).

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500, `color: var(--apple-link)` |
| Hero h1 | SF Pro Display | clamp(56px, 7.5vw, 96px) | 700, `letter-spacing: -0.035em`, stacked with `<br>` |
| Hero subtitle | SF Pro Text | 23px / 1.4 | 400, `--apple-text-secondary` |
| Stat number | SF Pro Display | 64–72px | 700, `letter-spacing: -0.035em` |
| Stat label | SF Pro Display | 14px | 500, `--apple-text-secondary` |
| Premise "moment" | SF Pro Display | 36–44px | 500, `letter-spacing: -0.022em` |
| Premise body | SF Pro Text | 17–19px / 1.55 | 400, `--apple-text-secondary` |
| Section h2 | SF Pro Display | 40–48px | 600, `letter-spacing: -0.025em` |
| Chord-card kicker | SF Pro Display | 11.5px upper | 600, `letter-spacing: 0.14em`, blue |
| Chord-card chord `<kbd>` | SF Mono | 13.5px | 500, pill-padded |
| Chord-card title | SF Pro Display | 21px | 600, `letter-spacing: -0.015em` |
| Chord-card body | SF Pro Text | 15.5px / 1.55 | 400 |
| Palette-list bullets | SF Pro Text | 16px / 1.6 | 400 |
| Callout kicker | SF Pro Display | 11.5px upper | 700, `letter-spacing: 0.14em`, blue |
| Callout body | SF Pro Text | 17px / 1.65 | 400 |
| Detail-row label | SF Pro Display | 11.5px upper | 700, `letter-spacing: 0.14em`, blue |
| Detail-row body | SF Pro Text | 16px / 1.6 | 400 |
| Detail-row code | SF Mono | 14px | 400, `--apple-bg-alt` pill bg |
| Closing band sentence | SF Pro Display | 44px / 1.2 | 500, `letter-spacing: -0.025em` |
| Closing band cite | SF Pro Text | 14px | 400, `rgba(255,255,255,0.5)` |

Two font families — SF Pro Display for headlines / kickers / stats /
labels, SF Pro Text for body. SF Mono only inside `<kbd>` and `<code>`
elements. **No** Lora, **no** Fraunces, **no** Instrument Serif, **no**
Poppins — they belong to other skills.

## Colour rules

- **Apple blue `#0071E3`** (= `var(--apple-link)`) is the only chromatic
  accent. Used on: hero kicker text, chord-card kicker, palette-list
  bullets, palette-mock selection-row tint, callout left-border + kicker,
  detail-row label, hero CTA filled button. **Never** as section
  background.
- **Black `#000000`** is the reserved closing band colour, used once
  per page. **Never** elsewhere as bg.
- **Light gray `#F5F5F7`** (= `var(--apple-bg-alt)`) for `--alt`
  sections (premise, callout) and for `<kbd>` / `<code>` pill
  backgrounds. **No** other gray tints.
- White `#ffffff` is the primary canvas + the closing CTA button bg.

**Never**: green checkmarks, red Xs, orange (anthropic accent), gold
(ember accent), sage green (sage accent), italic anywhere, gradient
on any section, drop-shadow on any element except the palette mock.

## Don't

- Don't use italic. Apple §J is strict — no `<em>`, no `font-style:
  italic` anywhere on the page (including SVG `<text>`, including
  `<cite>`, including chord-card body, including callout body).
- Don't add emoji (✓ / ✗ / ⭐ / 🚀) anywhere. Hairline rules and blue
  kicker colour are the entire annotation vocabulary.
- Don't add a competing chromatic accent (anthropic orange, ember
  gold, sage green, indigo) for the cloud column or any feature.
- Don't put the palette mock in dark theme. Apple's product-window
  mocks are light; a dark palette would read as anthropic feature-deep
  trying to be apple.
- Don't render the chord cards with 4px or 12px radius. Apple cards
  are **24px radius** — the radius itself is part of the brand.
- Don't add a second black band. The closing band is reserved; using
  it for premise + closing breaks the rhythm.
- Don't put a `<blockquote>` anywhere on the page. apple's editorial
  register comes through size + tracking, not quote shape.
- Don't skip the premise section — jumping from hero to chord cards
  reduces the page to a spec sheet.
- Don't skip the honest callout — a feature-deep without a named limit
  reads as marketing.

## When NOT to use this canonical as a template

- **Three or more features competing for the page** — feature-deep is
  for one feature. For multi-feature, use `landing.html`.
- **Reference docs for the feature's API / config** — `docs-home.html`
  is the right shape (tables, code blocks, search). Feature-deep is
  prose-heavy.
- **Apple-style product-launch announcement** — apple has a "release
  page" register (Apple Event style) with full-bleed video and motion
  design. This canonical is for daily-product feature-deep, not launch
  spectacle.
- **A feature without honest limits** — if you can't name three real
  cases where the feature isn't the right tool, the page will read as
  marketing regardless of typography.

## Extensibility: porting this template

### To another apple-voice feature-deep

Copy `feature-deep.html`, keep the structure, swap:
- Nav brand, page title, hero kicker (`Feature · NN · ...`) + 3-line h1
- Stat trio: 3 numbers + labels relevant to the new feature
- Premise: centered SF Pro Display 36–44px "moment" sentence + 2 paragraphs
- Six chord-cards (or six similar items): kicker + key/chord row + title + 2-sentence body
- Palette split: left bullets + right product-window SVG mock relevant
  to the feature
- Honest callout: blue hairline left + 3 sentences naming 3 real limits
- Detail rows: 4 label-value pairs with SF Mono code
- Closing black band: 44px sentence + filled white CTA

### Relationship to anthropic feature-deep canonical

Two feature-deep canonicals share the **information architecture**
(hero → stat trio → premise → 6 cards → split section → honest callout
→ detail rows → close) but differ in **every visual surface**:

| Surface | anthropic | apple |
|---|---|---|
| Hero kicker | filled orange `.anth-badge` pill (white-on-orange) | plain blue text link colour |
| Hero h1 | Poppins 56–64px, italic accent in subtitle allowed | SF Pro Display 80–96px stacked with `<br>`, no italic anywhere |
| Stat trio | 3 numbers in a single bordered card | 3 numbers on hairline-divided columns, no card chrome |
| Premise | cream-subtle band + Lora-italic pull-quote with orange-dot cite | light-gray band + centered SF Pro Display 36–44px "moment" sentence, no quote |
| Card radius | `var(--radius-lg)` (~16px) | 24px (apple signature) |
| Card kicker | uppercase orange | uppercase blue |
| Card body italic | one `<em>` per card allowed | no italic anywhere |
| Palette mock | dark `#141413` panel with orange highlight | light product-window with traffic-lights + blue highlight |
| Honest callout | cream-subtle bg + 3px orange left, italic accent allowed | light-gray bg + 3px blue left, no italic |
| Detail-row labels | uppercase orange Poppins | uppercase blue SF Pro Display |
| Closing | cream section with quiet orange CTA | black band 44px sentence + filled white CTA |
| Italic count | 3–4 (subtitle accent + pull-quote + callout + maybe card) | **0** (apple §J strict) |

Same skeleton, same honesty contract — two voices.

## Verified

Rendered at 1440 × ~5400px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 93.90 / 100** (95 / 95 / 88 / 96, weights 25/25/20/30) |

**Multi-critic fixes applied before shipping** (2026-04-28):

1. **Nav-cascade fix** — visual-audit caught `.apple-nav a { color }` cascading over the nav `Download` button, dropping rendered colour to `rgb(29,29,31)` on `rgb(0,113,227)` (3.58:1, fail AA). Page-scoped `.apple-nav a.apple-button { color: #ffffff; opacity: 1; }` higher-specificity rule restores white-on-blue (matches the same fix already documented in `ember-design/references/dos-and-donts.md` and `sage-design/references/dos-and-donts.md`). Should be promoted to `apple.css` proper as a future drift entry.
2. **`<figure>` + `<figcaption>` semantics** — illustration critic flagged the palette mock living inside a plain `<div>` rather than a `<figure>` with `<figcaption>`. Refactored to `<figure class="palette-mock">…<figcaption>Command palette · ⌘K · median 3.2 ms on a 20,000-note vault.</figcaption></figure>`. Border/radius/shadow moved from figure to inner `svg` so the caption sits below the bordered box, not inside it.
3. **SVG chrome text 11.5px → 12px** — illustration critic noted the smallest SVG labels (`vault · meditations` window title, footer hint, `3.2 ms` telemetry) sat at the §E.5 11-source-floor lower bound. Bumped to 12px source-side defensively for narrower-container ports.

These were the actionable fixes — the page passed verify.py + visual-audit (after the nav-cascade fix) before multi-critic, and the multi-critic deductions were illustration-axis only (88, brought up to ~92 by the `<figure>` semantics + 12px floor). Other info-level notes (chord-grid 3×2 at §I upper bound, "deep-dive" in title as noun usage, single-illustration restraint) are deliberate canonical conventions and stay unchanged.

SVG internal fills (`#1d1d1f`, `#86868b`, `#0071e3`, `#d2d2d7`, `#e5e5e7`, `#f5f5f7`, `#ff5f57`, `#febc2e`, `#28c840`) keep raw hex because SVG element attributes cannot reference CSS custom properties; values match `var(--apple-text)` / `var(--apple-text-secondary)` / `var(--apple-link)` / `var(--apple-line)` and the apple system traffic-light trio (apple-canonical hexes, accepted in self-diff trade-off #2).
