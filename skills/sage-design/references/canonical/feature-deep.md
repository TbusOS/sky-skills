# canonical · feature-deep page · sage-design

> **Binding companion** to `feature-deep.html`. Read this before writing a new
> feature-deep page in the sage-design voice. The HTML without this .md is
> half the lesson.

## What a "feature-deep" page is for

A sage-voice feature-deep page argues for one feature like a quiet
botanical-catalogue plate or a Muji product page — the reader should
finish **calmly informed the feature was worth designing**, not sold.
Where anthropic earns trust through editorial Lora prose + pull-quote,
apple earns trust through restraint + black-band closing, and ember
earns trust through Fraunces warmth + chocolate-band closing,
**sage earns trust through stillness** — Instrument Serif + numbered
section markers + sage green + deep-ink reserved band make the
technical argument feel like a small library plate, calmly composed
in negative space.

**When this canonical is the right template**:

- One product feature on a quiet / Muji-like / Nordic-minimal /
  reading-app brand deserves a long-form page (not a paragraph on the
  landing, not a row in pricing).
- The argument is **why this feature exists** + **how it actually works**,
  written in the voice of a calm cataloguer.
- You can name 3–8 honest specifics (counts, latencies, key bindings,
  format details) and at least one real limitation.

**When to pick something else**:

- Skill / product overview → use `landing.html`.
- API reference for the feature → use `docs-home.html`.
- Fast-moving consumer feature launch → pick apple-design (its black
  band carries launch spectacle that sage's deep ink cannot match
  without theatrical drift).
- Emotionally warm-craft register → pick ember-design (sage's
  neutrality reads as cold for that brief).

## The 7 decisions that make this work

### 1. Hero · numbered marker + Instrument Serif 80–104px stacked h1 · italic on ONE accent word

The hero opens with sage's signature numbered section marker — JetBrains
Mono uppercase `01 · FEATURE 02 · KEYBOARD-FIRST` at 11.5px /
`letter-spacing: 0.18em` / weight 600 — above an Instrument Serif
**clamp(64px, 8vw, 104px)** stacked headline (`Your hands. / Never
leave. / The *keyboard.*`) with `<br>`s, `letter-spacing: -0.022em`,
and one italic accent word at the end. Subtitle is Inter 21px / 1.55 in
`--sage-text` (full-strength on cream).

Where apple uses a plain blue text kicker, anthropic a filled orange
badge, ember a gold hairline + mono eyebrow, **sage uses the numbered
marker** — the page's place in a larger sequence is named in the first
line. Every section after this gets one too (`02 · 03 · 04 ...`).

→ **Rule**: ONE italic accent word in the hero h1. Numbered marker is
non-negotiable — every section gets one, in sequence. Skip any and the
page loses sage's library cadence.

### 2. Stat trio · hairline-divided columns · Instrument Serif roman numerals

Three large numbers (`6 chords · 3.2ms median · 0 required clicks`)
sit on a hairline-divided 3-column row, **roman Instrument Serif**
weight 400 at clamp(56px, 6vw, 80px). Labels below are Inter 14.5px /
1.5 in `--sage-text`. Vertical 1px `--sage-divider` hairlines divide
columns; first column has no left border.

**Italic budget warning**: italic on stat numerals would burn the §J
3-budget instantly. On feature-deep, numerals stay roman — italic is
reserved for hero accent + premise pull-quote + verdict pull-quote.

→ **Rule**: stat numerals roman. Hairline columns only, no card chrome
(matches apple's hairline approach; anthropic uses a bordered card —
sage follows apple here, not anthropic). Numbers are facts; sage's
editorial register is carried by the numbered markers above the trio.

### 3. Premise · numbered marker + cream-subtle band + Instrument Serif italic 32–36px pull-quote · italic moment #2

The premise sits on `#f0f3e2` cream-subtle. Inside: numbered marker
(`02 · THE PREMISE`) + Instrument Serif **roman** 48–52px h2 (no
italic — budget reserved) + 2 paragraphs of Inter 17px / 1.65 body in
`--sage-text` + an Instrument Serif italic **32–36px** pull-quote with
2px sage-green left vertical rule + Inter 14.5px cite below in
`--sage-text-secondary`, prefixed by 18×1.5px sage hairline.

Where apple replaces the pull-quote with a roman SF Pro Display
"moment" sentence (italic forbidden), and ember uses Fraunces italic
with gold hairline, **sage uses Instrument Serif italic with sage-green
hairline** — same shape as ember (italic earned), opposite chroma.

→ **Rule**: italic pull-quote on cream-subtle band. Cite is one short
line, prefixed by 18×1.5px sage-green hairline rule, no second
decoration. Italic moment #2 of the §J 3-budget.

### 4. Six chord-cards in a 3×2 grid · sage 4px radius (smallest of 4 skill)

Each `.chord-card` is white (`#ffffff`) with `1px var(--sage-divider)`
border and **4px radius** — sage's signature minimal radius (apple
24px / ember 12px / anthropic 16px / sage 4px is the smallest by
design). Slots inside:
- `.chord-card__kicker`: sage-green (`var(--sage-sage-dark)`)
  JetBrains Mono 11.5px uppercase, `letter-spacing: 0.14em`
- `.chord-card__chord`: row of `<kbd>` elements (JetBrains Mono 13px in
  `#f0f3e2` cream-subtle pill with 1px sage-divider border, 4px radius)
- `.chord-card__title`: Instrument Serif **roman** 28px weight 400,
  `letter-spacing: -0.018em`
- `.chord-card__body`: Inter 15.5px / 1.6 in `--sage-text`, **no italic**

→ **Rule**: 4px chord-card radius. NO italic in any card slot.
Sage-green kicker + Instrument Serif roman title — the green-on-cream
contrast is what makes the cards feel like library plates, not SaaS
feature tiles.

### 5. Palette split · 2fr 3fr layout · sage product-window mock with sage-green selection

A `.palette-split` grid with `grid-template-columns: 2fr 3fr` and gap.
Left column: numbered marker (`04 · THE PALETTE`) + Instrument Serif
40px **roman** h2 + 4-item bulleted list (sage-green hairline bullets,
Inter 16px / 1.6 body). Right column: a **sage product-window mock** —
rounded rectangle (4px radius), three traffic-light dots in **sage
green / sage tint / sage-text-secondary** (apple's red/yellow/green
replaced with sage's monochromatic `#97B077` / `#c9d1b3` / `#6d6f82`
trio — tonal, not chromatic), filename in title bar (JetBrains Mono),
four result rows with the third highlighted in sage-green tint
(`rgba(151, 176, 119, 0.18)`).

Where ember uses warm gold/tan/cocoa traffic-lights and apple uses
system red/yellow/green, **sage uses a monochromatic sage-trio** —
still three dots, but tonal variation within the sage palette rather
than chromatic distinction. Reads as "calm catalogue plate."

→ **Rule**: monochromatic sage-trio dots, sage-green selection (not
blue, not gold), JetBrains Mono filename in `--sage-text`. Cursor caret
animates `opacity: 1 → 0 → 1` at 1.2s in sage-green.

### 6. Honest callout · numbered marker + sage 3px left + cream-subtle inset · no italic

A `.callout` block on cream-subtle (`#f0f3e2`) inset, with a 3px solid
sage-green left border, `padding: var(--space-6) var(--space-7)`.
Inside: sage-green numbered mono kicker + Instrument Serif **roman**
26px title + Inter 17px / 1.65 body (3 sentences naming three real
limits). **No italic** — italic budget fully reserved for hero +
premise + verdict.

→ **Rule**: 3px sage-green left border, cream-subtle bg, mono numbered
kicker, Instrument Serif roman title. No italic anywhere in the
callout body. The honesty register is carried by what the words say,
not by italic emphasis.

### 7. Closing band · deep-ink (#393C54) reserved + Instrument Serif italic 40px pull-quote · italic moment #3 · sage signature reserved move

The page closes with sage's signature deep-ink band (`#393C54`
background, `#ffffff` text) — used **once** per page, established on
landing.html and comparison.html. Inside: numbered marker (`07 · AN
HONEST CLOSING`) in light sage-tint `#c9d1b3` + Instrument Serif italic
**40px** pull-quote in white + Inter 14.5px cite below in `#c9d1b3`
letter-spaced, prefixed by 20×1.5px sage-green hairline.

This is italic moment #3 — the §J ceiling. The deep-ink band is also
where sage's library register comes through most strongly:
white-on-ink with sage-green accent reads like the inside cover of a
quiet monograph.

→ **Rule**: deep-ink band, Instrument Serif italic 40px pull-quote,
sage-green hairline + cite. **No CTA inside the band** — closing CTA
section follows on cream below. Used once per page; a second
deep-ink band would break the rhythm.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Section marker (`01 · ...`) | JetBrains Mono | 11.5px upper, `letter-spacing: 0.18em` | 600, `--sage-text-secondary` |
| Hero h1 | Instrument Serif | clamp(64px, 8vw, 104px) | 400 roman + 1 italic accent word |
| Hero subtitle | Inter | 21px / 1.55 | 400, `--sage-text` |
| Stat number | Instrument Serif | clamp(56px, 6vw, 80px) | 400 **roman** (NOT italic), `letter-spacing: -0.025em` |
| Stat label | Inter | 14.5px / 1.5 | 400, `--sage-text` |
| Section h2 | Instrument Serif | 48–60px | 400 roman (no italic accents — budget reserved) |
| Premise pull-quote | Instrument Serif | 32–36px / 1.35 | 400 italic, `--sage-ink` |
| Premise cite | Inter | 14.5px letter-spaced | 500, `--sage-text-secondary` |
| Chord-card kicker | JetBrains Mono | 11.5px upper, `letter-spacing: 0.14em` | 600, sage-green-dark |
| Chord-card chord `<kbd>` | JetBrains Mono | 13px | 500, cream-subtle pill |
| Chord-card title | Instrument Serif | 28px | 400 roman, `letter-spacing: -0.018em` |
| Chord-card body | Inter | 15.5px / 1.6 | 400, `--sage-text` |
| Palette-list bullets | Inter | 16px / 1.6 | 400 |
| Callout kicker | JetBrains Mono | 11.5px upper, `letter-spacing: 0.14em` | 600, sage-green-dark |
| Callout title | Instrument Serif | 26px | 400 roman |
| Callout body | Inter | 17px / 1.65 | 400 |
| Detail-row label | JetBrains Mono | 11.5px upper, `letter-spacing: 0.14em` | 600, sage-green-dark |
| Detail-row body | Inter | 16px / 1.6 | 400 |
| Detail-row code | JetBrains Mono | 13.5px | 400, cream-subtle pill |
| Verdict marker (deep-ink band) | JetBrains Mono | 11.5px upper | 600, `#c9d1b3` |
| Verdict quote (deep-ink band) | Instrument Serif | 40px / 1.35 | 400 italic, white |
| Verdict cite | Inter | 14.5px letter-spaced | 500, `#c9d1b3` |

Two font families for body — Instrument Serif for titles + premise quote
+ verdict, Inter for running text. JetBrains Mono only inside markers /
kickers / kbd / code. **No** Lora, no Poppins, no SF Pro, no Fraunces.

## Colour rules

- **Sage green `#97B077`** (= `var(--sage-sage)`) is the chromatic accent.
  Used on: chord-card kicker (sage-dark `#7a9561`), palette-list bullets,
  palette-mock cursor + selection, callout left border + kicker, detail-row
  label, verdict hairline + cite. **Never** as section background.
- **Deep ink `#393C54`** (= `var(--sage-ink)`) reserved for the verdict
  band background, used **once**. **Never** elsewhere as bg.
- **Cream-subtle `#f0f3e2`** for `--alt` sections (premise, callout,
  detail rows) and for kbd / palette-mock chrome bar / palette-search
  input tints.
- White `#ffffff` is the primary canvas + chord-card / palette-mock bg.

**Never**: green checkmarks, red Xs, apple blue, ember gold, anthropic
orange (all forbidden), italic on stat numerals (would burn §J budget),
gradient on any section.

## Italic budget (§J · strict 3-of-page limit)

Total italic on the entire page = **3**:
1. Hero h1 accent word (e.g. `*keyboard.*`)
2. Premise pull-quote (whole blockquote in Instrument Serif italic 32–36px)
3. Verdict pull-quote on deep-ink band (Instrument Serif italic 40px)

**Forbidden italic places** (would push past §J ceiling):
- Section h2 accents — roman only
- Chord-card title / body — roman only
- Stat numerals — roman only
- Callout title / body — roman only
- Detail-row labels / body — roman only
- SVG `<text>` — roman only

A 4th italic anywhere = §J italic-overuse warning + drift away from
sage's earned-italic discipline.

## Don't

- Don't use italic anywhere besides the three earned moments.
- Don't add emoji (✓ / ✗ / ⭐) anywhere. Hairlines, sage-green
  accents, numbered markers, and deep-ink verdict band are the entire
  annotation vocabulary.
- Don't add a competing chromatic accent (apple blue, ember gold,
  anthropic orange, indigo) for any feature.
- Don't render the palette mock with apple's red/yellow/green or
  ember's gold/tan/cocoa traffic-lights. Sage's mock uses a
  monochromatic sage-green/sage-tint/text-secondary trio — tonal, not
  chromatic.
- Don't render the chord cards with apple's 24px or ember's 12px or
  anthropic's 16px radius. Sage cards are **4px radius** — the
  smallest of all 4 skills, sage signature.
- Don't add a second deep-ink band. The closing band is reserved.
- Don't put a CTA inside the deep-ink verdict band — it would
  retroactively recolour every honest word above as marketing.
- Don't skip the numbered section marker on any section. That cadence
  is one of sage's two signature moves; one silent section breaks
  brand-presence.

## When NOT to use this canonical as a template

- **Three or more features competing for the page** → `landing.html`.
- **Reference docs for the feature's API / config** → `docs-home.html`.
- **Fast-moving consumer feature launch** — sage's slow editorial
  rhythm reads as underpowered for launch spectacle.
- **A feature without honest limits** — if you can't name three real
  cases where the feature isn't the right tool, the page reads as
  marketing regardless of typography.

## Extensibility: porting this template

### To another sage-voice feature-deep

Copy `feature-deep.html`, keep the structure, swap:
- Nav brand, page title, hero numbered marker + 3-line Instrument Serif
  h1 with **one** italic accent word
- Stat trio: 3 numbers + labels (numerals ROMAN — italic budget reserved)
- Premise: numbered marker + Instrument Serif roman h2 + 2 paragraphs
  body + Instrument Serif italic 32–36px pull-quote with 2px sage-green
  left rule + cite
- Six chord-cards: kicker + key/chord row + roman title + 2-sentence
  body — all roman, 4px radius
- Palette split: monochromatic sage-trio product-window mock + bulleted list
- Honest callout: sage-green 3px left, mono kicker, roman title, no italic
- Detail rows: 4 label-value pairs with mono code
- Closing deep-ink band: Instrument Serif italic 40px pull-quote + cite

### Relationship to anthropic + apple + ember feature-deep canonicals

Four feature-deep canonicals share the **information architecture** but
differ in **every visual surface**:

| Surface | anthropic | apple | ember | sage |
|---|---|---|---|---|
| Hero kicker | filled orange `.anth-badge` pill | plain blue text link colour | gold hairline + mono eyebrow | numbered mono marker (`01 · FEATURE 02 · ...`) |
| Hero h1 | Poppins 56–64px, italic accent in subtitle | SF Pro Display 80–96px stacked, no italic | Fraunces 80–88px stacked, ONE italic accent word in h1 | Instrument Serif 80–104px stacked, ONE italic accent word in h1 |
| Stat trio | bordered card | hairline columns, no card | hairline columns, no card · roman | hairline columns, no card · roman |
| Card radius | `--radius-lg` ~16px | 24px (apple signature) | 12px (ember signature) | 4px (sage signature, smallest) |
| Card kicker | uppercase orange | uppercase blue | uppercase mono gold | uppercase mono sage-green |
| Card body italic | one `<em>` per card | none | none | none |
| Palette mock | dark `#141413` + orange highlight | light + apple red/yellow/green + blue highlight | warm-cream + gold/tan/cocoa + gold highlight | white + monochromatic sage trio + sage highlight |
| Honest callout | cream-subtle bg + 3px orange left + italic accent | light-gray bg + 3px blue left + no italic | cream-subtle bg + 3px gold left + no italic | cream-subtle bg + 3px sage-green left + no italic |
| Closing | cream + quiet orange CTA | black band + 44px roman + filled white CTA | chocolate band + 40px Fraunces italic + cite, NO CTA | deep-ink band + 40px Instrument Serif italic + cite, NO CTA |
| Italic count | 3–4 | 0 | 3 (hero / premise / verdict) | 3 (hero / premise / verdict) |
| Section markers | none | none | gold hairline + mono eyebrow | numbered `01 · 02 · 03 ...` mono |

Same skeleton, same honesty contract — four voices.

## Verified

Rendered at 1440 × ~5500px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 94.95 / 100** (96 / 95 / 92 / 96, weights 25/25/20/30) |

**Multi-critic fixes applied before shipping** (2026-04-28):

1. **Hero marker double-numbering collision** — copy critic flagged `01 · Feature 02 · Keyboard-first` reads weirdly (section number 01 vs feature number 02 collide). Simplified to `01 · Keyboard-first` — drops the secondary `Feature 02` label since sage's section markers (`01 · 02 · 03 ...`) already handle numbering.
2. **zh footer `打造` → `制作`** — copy critic flagged `在 柏林 · 多伦多 · 京都 之间打造` as borderline marketing cliché (close cousin of `打造生态` buzzword). Changed to `制作` — closer to sage's calm-cataloguer register.

These were the only actionable info-level fixes — the page passed all three pre-critic gates and 4 specialists scored 96/95/92/96 with the lowest dimension still well above the §J 90-floor. Other info-level notes (3×2 chord-grid at §I edge — accepted because cards are peers; "deep-dive" in title — same as apple/ember canonicals; single SVG illustration — sage's deliberate restraint; `padding-top:0` stat-trio dock under hero — load-bearing rhythm choice) are deliberate canonical conventions, self-diff documented, or accepted page-type-specific discipline.

Italic count is exactly **3 / 3 §J ceiling**: hero accent word (`*keyboard.*`), premise pull-quote (Instrument Serif italic 34px), verdict pull-quote (Instrument Serif italic 40px on deep-ink band). Stat numerals roman.

SVG internal fills (`#97B077`, `#393C54`, `#c9d1b3`, `#6d6f82`, `#7a9561`, `#f0f3e2`, `#e5e8da`) keep raw hex because SVG element attributes cannot reference CSS custom properties; values match `var(--sage-sage)`, `var(--sage-ink)`, sage-pale tint, `var(--sage-text-secondary)`, `var(--sage-sage-dark)`, cream-subtle, `var(--sage-divider)`. The monochromatic sage-trio traffic-light dots are a deliberate sage replacement of apple's red/yellow/green and ember's gold/tan/cocoa, accepted in self-diff trade-off #3.

**Ship significance**: sage/feature-deep is **Wave 1 收官 (5/5)** · 矩阵第一台阶完工 **20/40** · 4 skill × 5 page-type 全 ship。
