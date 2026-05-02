# canonical · product-detail page · ember-design

> **Binding companion** to `product-detail.html`. Read this before writing a new
> product-detail page in the ember-design voice. The HTML without this .md is
> half the lesson.

## What a "product-detail" page is for

An ember-voice product-detail page sells **ONE product / SKU / model** in a
lineup the way a small heritage catalogue describes one object — Fraunces
serif name, gold hairline cadence, warm-cream evidence panel, chocolate
band closing. Where anthropic earns trust through editorial Lora prose and
apple through restraint + black-band closing, **ember earns trust through
warmth** — the page reads like a printed monograph for a tool, not a SaaS
SKU page.

The shape mirrors the cross-skill product-detail contract (4 questions in
order: what is this · what's it for · what's inside · how do I get it +
how does it stack up), but every visual surface is replaced with an
ember signature move:

- gold 1px hairline + IBM Plex Mono eyebrow on every section header
- 12px card radius (ember signature, vs apple 24 / anthropic 16 / sage 4)
- warm-cream product-window mock with **gold/tan/cocoa traffic-lights**
  (NOT apple's red/yellow/green)
- chocolate band closing the page (`#312520`) with Fraunces italic 40px
  pull-quote — italic moment #3 of §J 3-budget

**When this canonical is the right template**:

- A named, shippable product / model / SKU on a heritage / craft / literary
  brand (Skypad Studio · Skypad Reader · Skypad Sync) with at least 2
  sibling products to compare against.
- The brand carries an **editorial register** (Aesop / Frama / Rapha / Stripe
  Press) — fast-moving consumer-electronics product launches read better
  in apple-design's black band. Ember's chocolate band is too slow for
  spectacle.
- You can name 6–10 honest specifics + at least one real limit, AND the
  page benefits from Fraunces' editorial warmth (small-batch craft tone
  over data-density tone).

**When to pick something else**:

- Skill / company overview, multiple products → `landing.html` (ember).
- Argument for ONE feature → `feature-deep.html` (ember).
- Detailed comparison of 2-4 products → `comparison.html` (ember).
- Pricing matrix → `pricing.html` (ember).
- API reference + code samples → `docs-home.html` (ember).
- Fast launch-spectacle product page → `apple-design/product-detail`.

## The 8 decisions that make this work

### 1. Hero — gold hairline + mono eyebrow + Fraunces stacked h1 (ONE italic accent) + 2 CTAs

The hero opens with ember's signature opening cadence: a centered 48×1px
gold hairline strip (`.accent-strip`), then an IBM Plex Mono uppercase
eyebrow (`Skypad Studio · part of the Skypad lineup`), then a Fraunces
**56-72px** stacked headline (`Skypad Studio` large + `the desktop
notebook for keyboard-first writing.` second line ~62% size with **ONE
italic accent word**) — `keyboard-first` is the accent.

Subtitle Inter 19-21px / 1.6 in `--ember-text` (full-strength on cream,
not secondary), max-width 640px. Where apple keeps the hero italic-free
and anthropic puts italic on a subtitle phrase, **ember earns italic on
the hero h1 itself** — the accent word is the editorial signature.

Two buttons: primary filled `Try Studio · 30-day trial` (ember-brown
filled) + ghost `View specs ↓` (chocolate outline).

→ **Rule**: hero h1 = mono eyebrow + product-name + tagline-line; ONE
italic accent word on `pd-hero__h1-tag`. Eyebrow + 1px gold hairline
strip above it is non-negotiable.

### 2. At-a-glance bar — 4 cells gold-hairline-divided · warm-cream surround

Immediately under the hero, a 4-col strip with the most load-bearing
factual data. Cells separated by 1px gold-hairline (`rgba(196, 148, 100,
0.32)`) instead of anthropic's `--anth-light-gray`. Top + bottom rules
also gold-hairline. Cell layout:

| Cell | Example |
|---|---|
| Released | `2025-Q4 · v1.4` |
| Platforms | `macOS · Windows · Linux` |
| Tier from | `$8 / month` |
| Trial | `30 days, full features` |

- Label: IBM Plex Mono 11.5px upper, `letter-spacing: 0.14em`, gold
- Value: Fraunces 19px weight 500, `letter-spacing: -0.005em`, ember-text

This bar is the page's **trust anchor** — the reader who scrolls 200px
already knows release / platform / price entry / trial. Where apple uses
hairline gray and anthropic uses light-gray, **ember uses gold hairline
for the divider** to carry brand-presence above the fold.

→ **Rule**: 4 cells, factual data only. NO marketing copy. Mono labels
gold (signature), Fraunces values roman (italic budget reserved).

### 3. Use-case grid — 3 cards with **12px radius** + warm-cream SVG mocks · gold accent topbar

Three `.pd-use__card` with **white bg + 1px `rgba(73, 45, 34, 0.12)`
border + 12px radius** (ember signature `--radius-md`, never apple's 24px
or sage's 4px). Each card has:

- Hand-drawn inline SVG (240×144 frame, warm-cream `#f5e5c8` background,
  white inner panel, **gold** topbar accent — replaces anthropic's orange
  topbar). Internal text in IBM Plex Mono / Inter / Fraunces with raw
  hex (`#c49464`, `#312520`, `#fbeedd`) since SVG can't reference CSS
  vars.
- IBM Plex Mono 11.5px gold uppercase kicker (e.g. `Daily writing · 80ms`)
  — Replaces anthropic's Poppins-Display use-case title.
- Fraunces **roman** 19px weight 500 title (e.g. `Long-form prose`).
- Inter 15.5px / 1.6 body in `--ember-text`, **NO italic** (budget reserved
  for hero + premise + verdict).
- Hairline-top + Inter 13.5px secondary namedrop line (e.g. `Used daily by
  writers at the Atlantic and a handful of arXiv-hosted essayists.`).

3 cards, never 4+ — that turns a use-case argument into a feature wall.

→ **Rule**: 12px radius, gold kicker + Fraunces roman title, NO italic in
any card slot. Each SVG has a single 2px gold topbar accent for visual
rhythm across the trio.

### 4. Spec table — model-card style on cream-subtle band · gold mono labels · IBM Plex Mono code in cream pill

A `.pd-spec__rows` flex column on `--ember-bg-subtle` (`#f5e5c8`) band.
Each row `grid-template-columns: 240px 1fr` with 1px gold-hairline
divider (`rgba(196, 148, 100, 0.32)`). Each row:

- Left: IBM Plex Mono 11.5px upper `letter-spacing: 0.14em` **gold** label
  (e.g. `LATENCY`)
- Right: Inter 16px / 1.6 prose with `<code>` inline pills (cream
  `#fbeedd` bg + 1px `rgba(73, 45, 34, 0.18)` border + IBM Plex Mono 13.5px)

8 rows is comfortable. 6 minimum (less = undocumented). 12 max (more
dilutes signal). Same row content as anthropic — every value contains a
number, file path, format name, or specific platform.

→ **Rule**: gold mono labels (NOT orange · NOT blue · NOT sage-green).
Inter body. Code pills cream-on-cream-subtle to read as restrained
typewriter samples, not loud monospace. Italic forbidden in this section.

### 5. Honest-limits callout — 3px gold left + cream-subtle inset · NO italic

A `.pd-honest__inner` block on `var(--ember-bg-subtle)` cream-subtle bg,
3px solid **gold** (`var(--ember-gold)`) left border, padding `var(--space-6)
var(--space-7)`, border-radius `0 var(--radius-md) var(--radius-md) 0`
(matches feature-deep `.callout`). Inside:

- IBM Plex Mono 11.5px gold uppercase kicker (`Honest limits`)
- Fraunces 24px weight 500 roman h3 (e.g. `Three things Studio is *not*
  the right tool for.` — but italic is OFF here, the visual rhythm comes
  from the gold + Fraunces, not from emphasis)
- Inter 17px / 1.65 body in `--ember-text` naming three real cases. **NO
  italic** — budget reserved for hero + premise + verdict.

This callout is **load-bearing**: a product-detail page without honest
limits reads as marketing-loud. Where anthropic puts ONE earned `<em>` in
the body and apple forbids italic outright, **ember sits on the apple
side here** — italic is reserved for the 3 earned moments (hero accent +
premise pull-quote IF page includes one + verdict pull-quote on closing
band). The page can also choose to spend italic moment #2 on the verdict
band only and skip the premise quote (simpler product-detail variant).

→ **Rule**: 3px gold left, cream-subtle inset, mono kicker, Fraunces
roman h3, Inter body. No italic anywhere.

### 6. Sibling-compare row — 3 cards · current = 2px gold border + warm-cream bg · "You are here" gold pill

A `.pd-sibling__grid` row of `repeat(3, 1fr)` cards (white bg · 1px
`rgba(73, 45, 34, 0.12)` border · **12px radius** · padding `var(--space-6)`).
Each card has:

- IBM Plex Mono 11.5px upper `letter-spacing: 0.14em` eyebrow (e.g.
  `Skypad Reader`) — gold on current card, secondary text on siblings.
- Fraunces **roman** 22px weight 500 product name + Inter 15px tagline
  on second line.
- 3-row spec mini-list: `Best for · Platform · Price`, IBM Plex Mono mono
  labels + Inter values.
- One ember-style underlined link `Read about it →` (gold underline
  decoration, `--ember-brown` text, `→` glyph in gold).

The current product (Skypad Studio) is the **middle card** with **2px
gold border** + **warm-cream bg** (`#fbeedd` — pulls from the kbd-pill
warm tint vocabulary, NOT cream-subtle which is reserved for spec / honest
sections). Above the eyebrow on the current card, a small gold pill (`You
are here`) in IBM Plex Mono 10.5px uppercase, gold-filled with chocolate
text.

→ **Rule**: 3 cards exactly. Current product anchored center via gold
border + warm-cream bg + gold pill. NO matrix · 4+ products → use
comparison.html.

### 7. Pricing snippet — single sentence + gold-underlined link

ONE sentence in Inter 17px / 1.6: `Studio is included on the Pro tier
($8 / month, 30-day full-feature trial) and the Team tier ($16 / seat /
month).` Followed by a single ember-link `See full pricing →` (gold
underline + chocolate text + gold `→`).

This is the full pricing surface on a product-detail. Reader who needs
the matrix follows the link to `pricing.html`.

→ **Rule**: ONE sentence + ONE link. NO embedded pricing matrix. The
gold underline on the link is the only chromatic accent in this section.

### 8. Closing — chocolate band (ember signature · italic moment #3) + cream CTA section after

The page closes with TWO sections, in this order:

**8a · Chocolate verdict band** (`background: var(--ember-text)` =
`#312520`, white text, `padding: var(--space-10) 0`):

- Centered 48×1px gold accent strip
- IBM Plex Mono 11.5px gold uppercase eyebrow (`The verdict`) in
  `#d9b892` light-gold tint
- Fraunces **italic 40px** pull-quote in white (italic moment #3 — the
  §J ceiling)
- Inter 14.5px cite below in `#d9b892`, prefixed by 20×1.5px gold
  hairline rule

**NO CTA inside the chocolate band.** A CTA inside would retroactively
recolour every honest word above as marketing — apple's black band can
carry a CTA because apple's voice is product-pitch leaning; ember's
chocolate band must stay editorial.

**8b · Cream CTA section** (cream `--ember-bg`, NOT cream-subtle):

- Fraunces 32-36px weight 500 h2 roman (`Get started with Studio.`)
- Inter 17px / 1.65 single sentence
- Two buttons: filled ember-brown `Download Studio` + ghost `Read the
  docs →`

The chocolate band carries the editorial closing; the cream CTA section
carries the action. Together they replace anthropic's single
cream-subtle closing block.

→ **Rule**: TWO closing sections in order — chocolate band (italic verdict,
no CTA) + cream CTA section (filled + ghost button). Used once per page.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Family eyebrow | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, `--ember-gold` |
| Hero h1 | Fraunces | clamp(48px, 5vw, 64px) stacked | 600 roman + 1 italic accent in tag |
| Hero h1 tag (line 2) | Fraunces | 0.62em of h1 | 500 roman |
| Hero subtitle | Inter | 19-21px / 1.6 | 400, `--ember-text`, NO italic |
| At-a-glance label | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, `--ember-gold` |
| At-a-glance value | Fraunces | 19px | 500 roman, `--ember-text` |
| Use-case kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, `--ember-gold` |
| Use-case title | Fraunces | 19px | 500 roman, `--ember-text` |
| Use-case body | Inter | 15.5px / 1.6 | 400, `--ember-text`, NO italic |
| Use-case namedrop | Inter | 13.5px / 1.5 | 400, `--ember-text-secondary` |
| Spec label | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, `--ember-gold` |
| Spec body | Inter | 16px / 1.6 | 400 |
| Spec body code | IBM Plex Mono | 13.5px | 400, cream `#fbeedd` pill |
| Honest kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, `--ember-gold` |
| Honest h3 | Fraunces | 24px | 500 roman, `--ember-text`, NO italic |
| Honest body | Inter | 17px / 1.65 | 400, NO italic |
| Sibling eyebrow | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700 |
| Sibling name | Fraunces | 22px | 500 roman, `--ember-text` |
| Sibling tagline | Inter | 15px / 1.55 | 400, `--ember-text-secondary` |
| Sibling row label | IBM Plex Mono | 11px upper, `letter-spacing: 0.1em` | 700, `--ember-text-secondary` |
| Sibling row value | Inter | 14px / 1.55 | 400, `--ember-text` |
| Sibling current pill | IBM Plex Mono | 10.5px upper, `letter-spacing: 0.12em` | 700, `--ember-text` on `--ember-gold` bg |
| Pricing snippet | Inter | 17px / 1.6 | 400 |
| Verdict eyebrow | IBM Plex Mono | 11.5px upper | 700, `#d9b892` light gold |
| Verdict quote | Fraunces | 40px / 1.35 | 400 italic, white |
| Verdict cite | Inter | 14.5px letter-spaced | 500, `#d9b892` |
| Closing h2 | Fraunces | 32-36px | 500 roman |

§H zh mapping: Inter body → Noto Sans SC; Fraunces display → Noto Serif
SC; IBM Plex Mono kicker/eyebrow stays mono in zh (or maps to Noto Sans
SC with letter-spacing reduced); zh italic disabled (`em` → font-style:
normal).

## Colour rules

Gold `#c49464` (= `var(--ember-gold)`) is the only chromatic accent. Used on:
- Hero accent strip (centered above eyebrow)
- IBM Plex Mono eyebrow text (every section header)
- At-a-glance label text
- At-a-glance hairline dividers
- Use-case kicker text + SVG topbar accent
- Spec label text + spec row hairline dividers
- Honest-limits left border + kicker
- Sibling-compare current-card 2px border + current-pill bg
- Sibling-compare ember-link arrow + underline color
- Pricing snippet link underline
- Verdict band centered accent strip + cite hairline rule
- Verdict band cite text in `#d9b892` (light-gold tint)

Chocolate `#312520` (= `--ember-text`) reserved for the verdict band
background, used **once**. Cream `#fff2df` (= `--ember-bg`) primary
canvas. Cream-subtle `#f5e5c8` (= `--ember-bg-subtle`) for spec table
band + honest-limits inset. Warm-cream `#fbeedd` for code pills + sibling
current-card bg + use-case SVG accent panels.

**Forbidden colours** (§K cross-skill smell):
- apple blue `#0071E3`, `#2997FF`
- anthropic orange `#d97757`, `#c56544`
- sage green `#97B077`, `#d4e1b8`, `#9ab388`, sage `#637a4f`
- indigo/purple `#eeecff`, `#3a3d7c`

## Italic discipline (§J · 3-of-page strict ceiling)

Total italic on page = **3**:
1. Hero h1 tag accent word (e.g. `*keyboard-first*`)
2. Honest-limits h3 ONE `<em>` (e.g. `<em>not</em>`) — kept since this
   page omits the premise pull-quote that feature-deep uses
3. Verdict pull-quote on chocolate band (whole blockquote in Fraunces
   italic 40px)

**Forbidden italic places** (would push past §J ceiling):
- Hero subtitle — roman only (italic moment is on h1 tag, not subtitle)
- At-a-glance values — roman only
- Use-case title or body — roman only
- Use-case namedrop — roman only (kept in `--ember-text-secondary` for
  distinction)
- Spec label or body — roman only
- Sibling cards — roman only
- Pricing snippet — roman only
- Closing h2 / closing buttons — roman only
- SVG `<text>` — always `font-style="normal"` (set explicitly when in
  Fraunces, since italic Fraunces is the default-looking serif italic)

A 4th italic anywhere = §J italic-overuse warning + drift away from
ember's earned-italic discipline. The page-type discipline note: ember
feature-deep used italic on premise quote + hero accent + verdict;
ember product-detail moves the premise italic to honest-limits h3 (`*not*`)
because product-detail doesn't have a separate premise section.

## Don't

- Don't add a 4th use-case card. Three is the §I peer count for ember
  product-detail. 4+ reads as a feature wall.
- Don't render the at-a-glance values with marketing copy ("Award-winning",
  "Loved by teams"). Numbers + dates + platform names only.
- Don't embed a full pricing matrix on product-detail. ONE sentence +
  link to `pricing.html`.
- Don't render the use-case SVGs with apple's red/yellow/green
  traffic-lights. Ember's mocks use **gold/tan/cocoa** (warm trio).
- Don't render the chord-style cards with apple's 24px radius or sage's
  4px radius. Ember = **12px radius** = `--radius-md`.
- Don't put a CTA inside the chocolate verdict band — it would
  retroactively recolour every honest word above as marketing.
- Don't add a second chocolate band. The closing verdict is reserved;
  using it twice breaks the once-per-page rhythm.
- Don't skip the gold accent strip + mono eyebrow on any section header.
  That cadence is one of ember's two signature moves; one silent header
  breaks brand-presence.
- Don't use orange as accent (anthropic), blue (apple), or sage-green —
  gold is ember's only chromatic accent.
- Don't write h1 in ALL CAPS or with a colon. Sentence-case product name
  + tagline-line.
- Don't add a "testimonial wall" with quote cards. Ember product-detail
  uses the verdict band for its earned editorial closing — testimonial
  cards above the spec table would dilute the verdict's significance.

## When NOT to use this canonical as a template

- **Skill / company overview** (multiple products) → `landing.html` (ember).
- **One-feature deep argument** → `feature-deep.html` (ember).
- **Pricing matrix** → `pricing.html` (ember).
- **2-4 product side-by-side comparison** → `comparison.html` (ember).
- **API reference + code samples** → `docs-home.html` (ember).
- **Fast-moving consumer feature launch** → `apple-design/product-detail`.
  Ember's slow editorial rhythm + chocolate band reads as understated for
  launch spectacle. Apple's black band carries that register; ember's
  chocolate doesn't.

## Extensibility: porting this template

This is the **3rd port** of the product-detail page-type (anthropic anchor
2026-05-02 → apple ship 2026-05-02 → ember ship 2026-05-02 → sage next).
The same information architecture; ember swaps the visual surfaces:

| Surface | anthropic (anchor) | apple | ember (this) | sage |
|---|---|---|---|---|
| Family eyebrow | filled `.anth-badge` orange | plain blue text label | gold-hairline + IBM Plex Mono small caps | numbered marker `01 · STUDIO` |
| Hero h1 | Poppins 48-56px stacked, italic in subtitle | SF Pro Display 64-80px stacked, NO italic | Fraunces 56-64px stacked, ONE italic accent in h1 tag | Instrument Serif 80-96px stacked, ONE italic accent in h1 |
| At-a-glance row | hairline-divided 4-col, light-gray dividers | hairline-only thin row, no card | gold-hairline-divided 4-col | numbered-marker labels |
| Use-case grid | 3-col 16px-radius cards · orange topbar | 3-col 24px-radius cards · traffic-light mocks | 3-col **12px**-radius cards · **gold** topbar · warm-trio mocks | 3-col 4px-radius white plates · sage hairline |
| Spec table | 240px-label · Lora body · code in cream pill | 280px-label · SF Pro Text · monospace code | 240px-label · Inter body · IBM Plex Mono code in cream pill · gold mono labels | sage-hairline rows · numbered-marker section above |
| Honest callout | cream-subtle bg + 3px orange left + ONE em | light-gray bg + 3px blue left + NO italic | cream-subtle bg + 3px **gold** left + ONE em on h3 | sage hairline + numbered marker · NO italic |
| Sibling compare current | 2px orange border | filled blue header | 2px **gold** border + warm-cream bg + gold pill | sage hairline + numbered marker on current |
| Closing | cream-subtle, no band | black band (apple signature) | **chocolate band** (ember signature) + cream CTA after | deep-ink band (sage signature) |
| Italic count | 2-3 | 0 | 3 (hero accent + honest h3 em + verdict pull-quote) | 3 |
| Filled CTAs | 3 | 3 | 3 (hero / sibling-anchor border / closing) | 3 |

Same skeleton, same evidence-first contract — four voices. **matrix
product-detail 行 3/4** after this ship · sage next.

## Verified

Rendered at 1440 × ~5200px. Targets all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count is exactly **3 / 3 §J ceiling**: hero h1 tag accent
(`keyboard-first`), honest-limits h3 `<em>` (`not`), and verdict
pull-quote on chocolate band. All other text ROMAN.

**Ship significance**: ember/product-detail is **Wave 2 第 7 张**
(canonical 26 → 27). matrix 第三台阶 product-detail 行 from 2/4 to 3/4
· sage 收尾 (Wave 2 #8).

SVG internal hex (`#c49464` / `#312520` / `#fbeedd` / `#f5e5c8` /
`#dfc5a4` / `#8a7564` / `#e6d9bf`) keeps raw hex because SVG element
attributes can't reference CSS custom properties; values match
`var(--ember-gold)`, `var(--ember-text)`, `var(--ember-bg-subtle)`, and
documented warm-trio derivatives.
