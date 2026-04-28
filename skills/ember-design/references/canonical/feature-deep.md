# canonical · feature-deep page · ember-design

> **Binding companion** to `feature-deep.html`. Read this before writing a new
> feature-deep page in the ember-design voice. The HTML without this .md is
> half the lesson.

## What a "feature-deep" page is for

An ember-voice feature-deep page argues for one feature like an editorial
journal essay — the `aesop.com/skin/care/in-two-acts/protective` shape, not
a SaaS spec sheet. The reader should finish **convinced the feature was
worth designing**, like reading a small monograph on a single object.
Where anthropic earns trust through editorial Lora prose + pull-quote, and
apple earns trust through restraint + black-band closing, **ember earns
trust through warmth** — Fraunces serif + gold hairlines + chocolate-band
closing make the technical argument feel like it was made by people, in a
room with plants and late afternoon light.

**When this canonical is the right template**:

- One product feature on a heritage / craft / literary brand deserves a
  long-form page (not a paragraph on the landing, not a row in pricing).
- The argument is **why this feature exists** + **how it actually works**,
  written in the voice of a craftsman who cares about provenance.
- You can name 3–8 honest specifics (counts, latencies, key bindings,
  format details) and at least one real limitation.

**When to pick something else**:

- Skill / product overview → use `landing.html` (feature-deep is one
  feature, not all of them).
- API reference for the feature → use `docs-home.html` (feature-deep
  is prose-heavy, not table-heavy).
- Fast-moving consumer feature launch → pick apple-design feature-deep
  (its black-band closing carries a launch-spectacle register that
  ember's chocolate band cannot match without feeling theatrical).

## The 7 decisions that make this work

### 1. Hero · gold hairline + mono eyebrow + Fraunces 80–96px h1 · italic on ONE accent word

The hero opens with ember's signature opening cadence: a centered 48×1px
gold hairline strip, then an IBM Plex Mono uppercase eyebrow
(`Feature · 02 · Keyboard-first`), then a Fraunces stacked headline
(`Your hands. / Never leave. / The *keyboard.*`) with italic on **one
accent word at the end**. Subtitle is Inter 19–21px `--ember-text` (not
secondary — ember body stays full-strength on cream).

Where apple uses zero italic and anthropic puts italic on a subtitle
phrase, **ember earns italic on the hero h1 itself** — the accent word
is the editorial signature. The mono eyebrow + gold hairline pair is
ember's other signature, repeated on every section so the page reads
like a small printed journal.

→ **Rule**: ONE italic accent word in the hero h1. Eyebrow + 1px gold
hairline strip above it is non-negotiable — skip them and the page
loses the journal cadence ember canonicals depend on.

### 2. Stat trio · gold-hairline-divided columns · Fraunces roman numerals (NOT italic)

Three large numbers (`6 chords · 3.2ms median · 0 required clicks`)
sit on a hairline-divided 3-column row, **roman Fraunces** weight 400
at 72px with `letter-spacing:-0.025em`. Labels below are Inter 14.5px /
1.5 in `--ember-text`. Vertical 1px gold-tan hairlines divide columns;
first column has no left border.

**Italic budget warning**: ember.css landing has `.giant-num` as italic
numerals (a deliberate signature for the landing page-type). On
**feature-deep, stat numerals stay roman** — italic is reserved for hero
accent + premise pull-quote + verdict pull-quote (3 earned moments).
Adding italic to 3 stat numerals would burn the §J ceiling immediately.

→ **Rule**: stat numerals roman. Hairline columns only, no card chrome.
Numbers are facts; ember's editorial register is carried by the gold
hairline + mono eyebrow rhythm above the trio, not by italic numerals.

### 3. Premise · cream-subtle band + Fraunces italic 32–36px pull-quote · earned italic moment #2

The premise sits on a cream-subtle (`#f5e5c8`) section — ember's tinted
break colour, mirroring landing.html's stat-strip section. Inside:
a mono eyebrow + Fraunces 48px h2 + 2 paragraphs of Inter 17px / 1.6
body in `--ember-text` + a Fraunces italic **32–36px** pull-quote with
gold-vertical-rule left border (mirroring landing.html's `.ember-quote`
pattern), with cite below in Inter 14.5px secondary, prefixed by an
18px gold hairline.

Where apple replaces the pull-quote with a roman SF Pro Display
"moment" sentence (italic forbidden), **ember earns italic on the
pull-quote** — Fraunces italic at 32–36px is the page's premise
moment, and the gold hairline cite is ember's quiet attribution
treatment.

→ **Rule**: italic pull-quote on cream-subtle band. Cite is one short
line, prefixed by 18×1.5px gold hairline rule, no second decoration.
This is italic moment #2 of the §J 3-budget.

### 4. Six chord-cards in a 3×2 grid · cream cards with gold kicker

Each `.chord-card` is white (`#ffffff`) with 1px `rgba(73, 45, 34, 0.12)`
border and **12px radius** (ember's `--radius-md`, never apple's 24px or
sage's 4px). Slots inside:
- `.chord-card__kicker`: gold (`var(--ember-gold)`) IBM Plex Mono 11.5px
  uppercase, `letter-spacing: 0.14em` (e.g. `FIND · CMD-K`)
- `.chord-card__chord`: row of `<kbd>` elements (IBM Plex Mono 13px in
  cream `#fbeedd` pill with `1px rgba(73,45,34,0.18)` border)
- `.chord-card__title`: Fraunces **roman** 22px weight 500,
  `letter-spacing: -0.005em`
- `.chord-card__body`: Inter 15.5px / 1.6 in `--ember-text`, **no italic**
  — body italic would tip the page past the 3-italic ceiling

Six cards, 3×2 grid (matching the apple/anthropic pattern). Ember's
discriminator from apple's 24px radius is the warmer 12px radius +
gold-not-blue kicker + cream-not-light-gray kbd pill. Reading the page
side-by-side with apple, the difference is "warm journal" vs "cool
product page" — same skeleton, opposite chroma temperature.

→ **Rule**: 12px chord-card radius. NO italic in any card slot. Gold
kicker + Fraunces roman title — the gold-on-cream contrast is what
makes the cards feel like field-guide entries, not SaaS feature tiles.

### 5. Palette split · 2fr 3fr layout · warm-cream product-window mock

A `.palette-split` grid with `grid-template-columns: 2fr 3fr` and gap.
Left column has Fraunces 36px h2 (no italic — italic budget already at
2/3) + 4-item bulleted list (gold hairline bullets, Inter 16px / 1.6
body). Right column is a **warm-cream product-window mock** — rounded
rectangle (10px radius), three traffic-light dots in **gold / tan /
cocoa** (apple's red/yellow/green replaced with ember's warm trio:
`#c49464` / `#dfc5a4` / `#8a7564`), filename in title bar (IBM Plex
Mono 11.5px), four result rows below with the third highlighted in
gold tint (`rgba(196, 148, 100, 0.14)`).

Where apple uses neutral system traffic-lights and a blue selection,
**ember replaces every cool-bias detail with warm** — gold/tan/cocoa
dots, gold selection, IBM Plex Mono filename in `--ember-text`. The
mock should read as "a small Aesop catalogue of one product" rather
than "an apple.com product window."

→ **Rule**: warm chrome (gold/tan/cocoa traffic-lights), gold selection
tint (not blue), `--ember-text` for filename + result-row text. Cursor
caret animates `opacity: 1 → 0 → 1` at 1.2s in gold (`var(--ember-gold)`).

### 6. Honest callout · gold 3px left + cream-subtle bg · no italic

A `.callout` block on a cream-subtle (`#f5e5c8`) inset, with a 3px solid
gold left border, `padding-left: var(--space-6)`. Inside: gold uppercase
mono kicker + Fraunces **roman** 24px title + Inter 17px / 1.65 body
(3 sentences naming three real limits). **No italic** — italic budget
is fully spent on hero accent + premise pull-quote + verdict pull-quote.

Where anthropic puts italic on `<em>the fastest hand wins</em>` inside
the callout body and apple forbids italic outright, **ember sits in the
middle** — italic forbidden in the callout to preserve the §J 3-budget,
but the gold hairline + cream-subtle inset gives the section the same
"editorial moment" warmth ember readers expect.

→ **Rule**: 3px gold left border, cream-subtle bg, mono kicker, Fraunces
roman title. No italic anywhere in the callout body. The honesty
register is carried by what the words say (3 specific limits), not by
typographic emphasis.

### 7. Closing band · chocolate (`#312520`) with Fraunces italic 40px pull-quote · earned italic moment #3 · ember signature reserved move

The page closes with ember's signature deep-chocolate band (`#312520`
background, `#ffffff` text) — used **once** per page, established on
landing.html and comparison.html. Inside: a centered 48×1px gold accent
strip, then mono eyebrow (light gold tint `#d9b892`) + Fraunces italic
**40px** pull-quote in white + Inter 14.5px cite below in `#d9b892`
letter-spaced, prefixed by a 20×1.5px gold hairline.

This is italic moment #3 — the §J ceiling. Adding italic anywhere else
on the page tips into italic-overuse. The chocolate band is also where
ember's craft-warmth comes through most strongly: white-on-chocolate
with gold accent reads like the inside cover of a small monograph,
not a CTA.

→ **Rule**: chocolate band, Fraunces italic 40px pull-quote, gold
hairline + cite. **No CTA inside the band** — closing CTA section
follows on cream below. Used once per page; a second chocolate band
would break the rhythm.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero eyebrow | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.18em` | 400, `#8a7564` |
| Hero h1 | Fraunces | clamp(56px, 7vw, 88px) | 400 roman + 1 italic accent word |
| Hero subtitle | Inter | 19–21px / 1.55 | 400, `--ember-text` |
| Stat number | Fraunces | 72px | 400 **roman** (NOT italic), `letter-spacing: -0.025em` |
| Stat label | Inter | 14.5px / 1.5 | 400, `--ember-text` |
| Section h2 | Fraunces | 44–52px | 400 roman (no italic accents — budget reserved) |
| Premise pull-quote | Fraunces | 32–36px / 1.35 | 400 italic, `--ember-text` |
| Premise cite | Inter | 14.5px letter-spaced | 500, `--ember-text-secondary` |
| Chord-card kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, gold |
| Chord-card chord `<kbd>` | IBM Plex Mono | 13px | 500, cream pill |
| Chord-card title | Fraunces | 22px | 500 roman, `letter-spacing: -0.005em` |
| Chord-card body | Inter | 15.5px / 1.6 | 400, `--ember-text` |
| Palette-list bullets | Inter | 16px / 1.6 | 400 |
| Callout kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, gold |
| Callout title | Fraunces | 24px | 500 roman |
| Callout body | Inter | 17px / 1.65 | 400 |
| Detail-row label | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, gold |
| Detail-row body | Inter | 16px / 1.6 | 400 |
| Detail-row code | IBM Plex Mono | 13.5px | 400, cream pill bg |
| Verdict quote (chocolate band) | Fraunces | 40px / 1.35 | 400 italic, white |
| Verdict cite | Inter | 14.5px letter-spaced | 500, `#d9b892` |

Two font families for body — Fraunces for titles + premise quote +
verdict, Inter for running text. IBM Plex Mono only inside eyebrows /
kickers / kbd / code. **No** Lora, no Poppins, no SF Pro, no Instrument
Serif.

## Colour rules

- **Gold `#c49464`** (= `var(--ember-gold)`) is the only chromatic accent.
  Used on: hero hairline strip, mono eyebrow text, chord-card kicker,
  chord-card kbd border, palette-list bullets, palette-mock cursor +
  selection, callout left border + kicker, detail-row label, verdict
  hairline + cite. **Never** as section background.
- **Chocolate `#312520`** (= `var(--ember-text)`) reserved for the
  verdict band background, used **once**. **Never** elsewhere as bg.
- **Cream-subtle `#f5e5c8`** for `--subtle` sections (premise, callout)
  and `#fbeedd` for kbd / palette-mock chrome bar tints.
- White `#ffffff` is the primary canvas + the chord-card / palette-mock bg.

**Never**: green checkmarks, red Xs, apple blue (forbidden), sage green
(forbidden), anthropic orange (forbidden — even though similar warm
hue, it's a different brand), italic on stat numerals (would burn §J
budget), gradient on any section other than the optional palette-mock
chrome.

## Italic budget (§J · strict 3-of-page limit)

Total italic on the entire page = **3**:
1. Hero h1 accent word (e.g. `*keyboard.*`)
2. Premise pull-quote (whole blockquote in Fraunces italic 32–36px)
3. Verdict pull-quote on chocolate band (whole blockquote in Fraunces
   italic 40px)

**Forbidden italic places** (would push past §J ceiling):
- Section h2 accents — roman only
- Chord-card title or body — roman only
- Stat numerals — roman only
- Callout title or body — roman only
- Detail-row labels or body — roman only
- SVG `<text>` elements — roman only (use Fraunces or IBM Plex Mono
  with `font-style="normal"` always)

A 4th italic anywhere = §J italic-overuse warning + drift away from
ember's earned-italic discipline.

## Don't

- Don't use italic anywhere besides the three earned moments. Stat
  numerals on landing.html are italic by deliberate choice; on
  feature-deep they MUST be roman to preserve budget.
- Don't add emoji (✓ / ✗ / ⭐) anywhere. Gold hairlines, mono kickers,
  and chocolate verdict band are the entire annotation vocabulary.
- Don't add a competing chromatic accent (apple blue, sage green,
  anthropic orange, indigo) for any feature.
- Don't render the palette mock with apple's red/yellow/green
  traffic-lights. Ember's mock uses gold/tan/cocoa — same dot
  pattern, ember-warm chroma.
- Don't render the chord cards with apple's 24px radius or sage's 4px
  radius. Ember cards are 12px radius — `--radius-md`.
- Don't add a second chocolate band. The closing band is reserved for
  the verdict; using it for premise + closing breaks the once-per-page
  rhythm.
- Don't put a CTA inside the chocolate verdict band — it would
  retroactively recolour every honest word above as marketing.
- Don't skip the gold hairline + mono eyebrow on any section. That
  cadence is one of ember's two signature moves; one silent section
  breaks brand-presence.

## When NOT to use this canonical as a template

- **Three or more features competing for the page** — feature-deep is
  for one feature. Multi-feature → `landing.html`.
- **Reference docs for the feature's API / config** — `docs-home.html`.
- **Fast-moving consumer feature launch** — ember's slow editorial
  rhythm reads as underpowered for launch spectacle. Apple's black
  band carries that register; ember's chocolate doesn't.
- **A feature without honest limits** — if you can't name three real
  cases where the feature isn't the right tool, the page reads as
  marketing regardless of typography.

## Extensibility: porting this template

### To another ember-voice feature-deep

Copy `feature-deep.html`, keep the structure, swap:
- Nav brand, page title, hero eyebrow (`Feature · NN · ...`) + 3-line
  Fraunces h1 with **one** italic accent word
- Stat trio: 3 numbers + labels relevant to the new feature (numerals
  ROMAN — italic budget reserved)
- Premise: mono eyebrow + Fraunces roman h2 + 2 paragraphs body +
  Fraunces italic 32–36px pull-quote + cite with gold hairline
- Six chord-cards: kicker + key/chord row + roman title + 2-sentence
  body — all roman
- Palette split: warm-chrome product-window mock + bulleted list
- Honest callout: gold 3px left border, mono kicker, roman title, body
  with no italic
- Detail rows: 4 label-value pairs with mono code in cream pill
- Closing chocolate band: Fraunces italic 40px pull-quote + cite

### Relationship to anthropic + apple feature-deep canonicals

Three feature-deep canonicals share the **information architecture**
(hero → stat trio → premise → 6 cards → palette split → honest callout
→ detail rows → close) but differ in **every visual surface**:

| Surface | anthropic | apple | ember |
|---|---|---|---|
| Hero kicker | filled orange `.anth-badge` pill | plain blue text link colour | gold 1px hairline + mono eyebrow |
| Hero h1 | Poppins 56–64px, italic accent in subtitle | SF Pro Display 80–96px stacked, no italic anywhere | Fraunces 80–88px stacked, ONE italic accent word in h1 |
| Stat trio | bordered card | hairline columns, no card | hairline columns, no card · roman numerals |
| Premise | cream-subtle band + Lora-italic pull-quote with orange-dot cite | light-gray band + roman SF Pro Display "moment" sentence, NO quote | cream-subtle band + Fraunces italic 32–36px pull-quote + gold hairline cite |
| Card radius | `--radius-lg` ~16px | 24px (apple signature) | 12px (`--radius-md`, ember signature) |
| Card kicker | uppercase orange | uppercase blue | uppercase mono gold |
| Card body italic | one `<em>` per card allowed | no italic anywhere | no italic (budget reserved) |
| Palette mock | dark `#141413` panel + orange highlight | light product-window + apple system traffic-lights + blue highlight | warm-cream product-window + gold/tan/cocoa traffic-lights + gold highlight |
| Honest callout | cream-subtle bg + 3px orange left + italic accent | light-gray bg + 3px blue left + no italic | cream-subtle bg + 3px gold left + no italic |
| Closing | cream section with quiet orange CTA | black band + 44px roman SF Pro Display sentence + filled white CTA | chocolate band + 40px Fraunces italic pull-quote + cite, NO CTA inside (cream CTA section follows) |
| Italic count | 3–4 | 0 | 3 (hero accent + premise quote + verdict quote) |

Same skeleton, same honesty contract — three voices.

## Verified

Rendered at 1440 × ~5500px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 94.85 / 100** (94 / 95 / 94 / 96, weights 25/25/20/30) |

**Multi-critic fixes applied before shipping** (2026-04-28):

1. **Container width single source of truth** — composition critic flagged the technical-details section using `ember-container--wide` then overriding it inline with `max-width:920px` (the `--wide` modifier was doing nothing). Cleaned up to plain `ember-container` + inline 920px cap so the class signals intent without contradiction.

These were the only actionable info-level fixes — the page passed all three pre-critic gates and 4 specialists scored 94/95/94/96 with the lowest dimension still well above the §J 90-floor. Other info-level notes (single SVG illustration vs adding a second focus-mode mock; "deep-dive" in title; `#312520` chocolate darker than `#492d22` brand-strip nominal; `padding-top:0` stat-trio dock) are deliberate canonical conventions (consistent with apple/feature-deep), self-diff documented, or accepted page-type-specific discipline.

Italic count is exactly **3 / 3 §J ceiling**: hero accent word (`*keyboard.*`), premise pull-quote (Fraunces italic 34px), verdict pull-quote (Fraunces italic 40px on chocolate band). Stat numerals are roman (vs landing's italic numerals signature) — that's the page-type discipline distinguishing feature-deep from landing.

SVG internal fills (`#c49464`, `#312520`, `#fbeedd`, `#f5e5c8`, `#8a7564`, `#dfc5a4`, `#d9b892`) keep raw hex because SVG element attributes cannot reference CSS custom properties; values match `var(--ember-gold)`, `var(--ember-text)`, and documented warm-trio derivatives (the gold/tan/cocoa traffic-light replacement of apple's red/yellow/green system colours, accepted in self-diff trade-off #3).
