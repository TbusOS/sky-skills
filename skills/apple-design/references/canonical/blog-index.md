# canonical · blog-index page · apple-design

> **Binding companion** to `blog-index.html`. Read this AFTER
> `anthropic/blog-index.md` — that file states the 7 design decisions and
> editorial-restraint contract that this page-type stands on. THIS file
> records only the **apple voice deviations** from that template.

## What this canonical inherits from `anthropic/blog-index`

The 7 information-architecture decisions are unchanged:

1. Masthead = descriptive kicker + 2-line h1 + subtitle, **zero CTAs in
   hero**
2. ONE editor-picked featured post on a top band, two-col grid with
   abstract SVG illustration on left, post metadata on right
3. Tag rail = horizontal pill row, ONE active state, NO sidebar
4. Post grid = 2-col list of 6 cards (NOT 3-col Pinterest), each card
   = thumb + kicker + title + lede + Continue link, NO social metadata
5. (apple-specific § below) — italic budget
6. Pagination = older/newer plain links, NO numbered SaaS pagination
7. Footer subscribe = single inline section, NO modals/overlays

If the editorial-restraint contract isn't clear, read
`../../../anthropic-design/references/canonical/blog-index.md` first.

## What changes for apple voice

### 1. Italic count = **0** (apple §J strict, vs anthropic's 2)

This is the load-bearing difference. anthropic blog-index uses italic
twice (hero subtitle accent word + editor's note pull-quote). **Apple
forbids italic anywhere** (matches `apple/feature-deep` and
`apple/landing` discipline). Adaptations:

- **Hero subtitle**: drop the `<em>` accent. Replace emphasis with
  size+tracking — e.g. anthropic's *quiet* desk → apple's "the **quiet
  desk** we built the product on." (no italic, period at end carries the
  cadence).
- **Editor's note section**: the anthropic Lora-italic 22–24px
  blockquote is replaced by a centered SF Pro Display **36–44px**
  "moment" sentence on a light-gray (`var(--apple-bg-alt)`) section —
  the same trick `apple/feature-deep` uses to stand in for anthropic's
  Lora pull-quote. No `<blockquote>` shape, no italic, no orange-dot
  cite — just the sentence, period, and a quiet `<p>` byline below.

→ **Rule**: zero italic. Replace anthropic's 2 italic moments with apple
size-tracking equivalents. `font-style: italic` is forbidden in CSS,
inline style, and SVG `<text>`.

### 2. Typography stack swap

| Element | anthropic | apple |
|---|---|---|
| Display headings | Poppins 600 -0.02em | **SF Pro Display** 700 -0.035em (heavier weight, tighter tracking) |
| Body & subtitles | Lora 400 (serif) | **SF Pro Text** 400 (sans, larger sizes) |
| Mono kickers / pagination / code | JetBrains Mono | **SF Mono** |

The Lora→SF Pro Text swap is the visible difference at first glance:
anthropic blog-index reads as "editorial journal printed in serif",
apple blog-index reads as "Apple Newsroom on a quiet day."

### 3. Hero size step up: 48–56px → **64–80px** stacked

Apple displays at heavier weight + tighter tracking + larger size.
anthropic h1 is `clamp(40px, 5vw, 56px)` 600. Apple h1 is
`clamp(48px, 6vw, 80px)` 700 with `letter-spacing: -0.035em`. Period at
the end of each line is the only ornament.

### 4. Featured post chrome: cream-subtle band → **light-gray hairline frame**

anthropic uses a cream-subtle band with hairline borders top+bottom and
the featured-art SVG on a white card. Apple uses a **white** featured
band (no alt-bg) with the SVG on a `1px var(--apple-line)` hairline
frame, no card bg, no rounded card. The hairline-only treatment is
apple.com's own (see `apple.com/iphone-15-pro/specs`) — bordered cards
read as anthropic.

→ **Rule**: featured-art SVG sits on a white surface with `1px solid
var(--apple-line)` hairline border + 12px radius (apple `--radius-md`).
NO cream-subtle bg.

### 5. Tag rail: filled-orange active → **filled-blue active**

anthropic's active tag pill is filled-orange `#d97757` with white text
(700 weight). Apple's active tag pill is filled-blue `var(--apple-link)`
`#0071E3` with white text (600 weight). Inactive pills are
`var(--apple-bg-alt)` light-gray with `1px var(--apple-line)` border.

→ **Rule**: blue is the only chromatic accent (matches feature-deep,
landing, comparison). NO orange anywhere.

### 6. Post-card radius: ~16px → **24px** (apple signature)

anthropic post-card thumb uses `var(--radius-md)` (~16px). Apple uses
**24px** — the apple-design signature card radius (matches
`feature-deep` chord cards and `landing` feat-cards). 4px (sage), 12px
(ember), 16px (anthropic), 24px (apple) is the cross-skill ladder.

### 7. Card thumbnail palette: anthropic 5-color warm → **apple system grays + blue**

anthropic post-card SVGs use warm orange/sage-green/blue-accent/cream
on light surfaces. Apple SVGs use **light system grays** (`#F5F5F7`,
`#D2D2D7`, `#E5E5E7`) plus apple-blue `#0071E3` for accent moments.
Where anthropic shows a color-coded bookshelf with orange/sage/blue
spines, apple shows a uniform light-gray bookshelf with one blue spine
as accent. Same illustration concept; recoloured for the voice.

→ **Rule**: SVG fills constrained to {`#FFFFFF`, `#F5F5F7`, `#E5E5E7`,
`#D2D2D7`, `#86868B`, `#1D1D1F`, `#0071E3`}. Plus the apple traffic-light
trio (`#FF5F57`, `#FEBC2E`, `#28C840`) ONLY inside product-window mocks.
NO orange, NO ember gold, NO sage green.

### 8. Pagination hairline: anthropic mono + double-rule → **apple display + bottom-rule only**

anthropic pagination has hairline borders both above and below the
prev/next row, with mono labels. Apple pagination has a single
top-hairline only (matches apple.com's `> See all` patterns), with
SF Pro Display labels (NOT mono) — apple uses mono only inside `<kbd>`
and `<code>` per `feature-deep.md` rule, not in pagination links.

### 9. Subscribe block bg: cream-subtle → **light-gray** (`var(--apple-bg-alt)`)

`var(--apple-bg-alt)` `#F5F5F7` is apple's only `--alt` section bg
across the entire skill. NO cream, NO warm tones.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Masthead kicker | SF Pro Display | 13px | 500, `--apple-text-secondary`, `letter-spacing:0.02em`, NO uppercase |
| Hero h1 | SF Pro Display | clamp(48px, 6vw, 80px) | 700, `letter-spacing:-0.035em`, stacked with `<br>`, period after each line |
| Hero subtitle | SF Pro Text | 21px / 1.4 | 400, `--apple-text-secondary`, NO italic |
| Featured kicker | SF Pro Display | 13px | 500, `var(--apple-link)` blue, normal case |
| Featured h2 | SF Pro Display | clamp(34px, 3.4vw, 44px) | 600, `letter-spacing:-0.025em` |
| Featured lede | SF Pro Text | 19px / 1.55 | 400, `--apple-text-secondary` |
| Featured byline | SF Pro Display | 13px | 500, `--apple-text-secondary` |
| Tag pill | SF Pro Display | 13px | 500 (active 600 white-on-blue), `letter-spacing:0` |
| Post-card kicker | SF Pro Display | 12px | 500, `var(--apple-link)` blue, normal case |
| Post-card title | SF Pro Display | 22px / 1.25 | 600, `letter-spacing:-0.02em`, max 2 lines |
| Post-card lede | SF Pro Text | 16px / 1.55 | 400, `--apple-text-secondary` |
| Editor's note moment | SF Pro Display | clamp(32px, 3.4vw, 44px) | 500, `letter-spacing:-0.022em`, centered, max-width 920px |
| Editor's note byline | SF Pro Display | 14px | 400, `--apple-text-secondary` |
| Pagination link | SF Pro Display | 14px | 500, `--apple-text-secondary` |
| Footer h3 | SF Pro Display | 28px | 600, `letter-spacing:-0.02em` |
| Footer body | SF Pro Text | 17px / 1.55 | 400, `--apple-text` |

§H zh stack: `PingFang SC` native + `Noto Sans SC` non-Apple fallback
(matches apple/landing.html). `font-style: italic` rule explicitly
deactivated in zh too — apple §J holds in both languages.

## Colour rules

- **Apple blue `#0071E3`** (= `var(--apple-link)`): only chromatic
  accent. Used on featured kicker, post-card kicker, active tag pill
  bg, footer subscribe `.apple-button` filled CTA. NEVER as a section
  background.
- **Light gray `#F5F5F7`** (= `var(--apple-bg-alt)`): editor's note
  section bg, footer subscribe section bg, inactive tag pill bg.
- **White `#FFFFFF`**: page canvas, featured-art frame, post-card
  thumb bg, footer email input bg.
- **Hairline `#D2D2D7`** (= `var(--apple-line)` / `var(--apple-divider)`):
  all borders, pagination top-rule.

**Forbidden**: orange (anthropic), gold (ember), sage green (sage),
indigo/purple, italic anywhere, gradient on any section, shadow on any
element except the featured-art frame's `--shadow-card`.

## Italic discipline (§J · strict 0)

Total italic on the page = **0**.

Forbidden places (would push past §J ceiling immediately):
- Hero subtitle: NO `<em>`. Emphasis via tracking + period.
- Editor's note: NO `<blockquote>`, NO `font-style: italic`.
- Post-card lede: NO italic. Roman SF Pro Text only.
- SVG `<text>`: NO `font-style="italic"` attribute.
- `<cite>` elements: explicit `font-style: normal` to defeat browser
  default.

A 1st italic anywhere = §J overuse warning + drift toward anthropic.

## Don't (apple-specific, in addition to anthropic don'ts)

- Don't use Lora, Poppins, Fraunces, Instrument Serif anywhere.
- Don't add italic emphasis (`<em>`, `font-style: italic`, `<i>`).
- Don't use cream-subtle (`#f0ede3`) bg — that's anthropic.
- Don't use orange anywhere — that's anthropic.
- Don't use `<blockquote>` shape on the editor's note — apple replaces
  with centered moment sentence.
- Don't render post-card thumb at 16px or 12px or 4px radius — apple
  card radius is 24px.
- Don't add a black band on this page-type. apple's black band
  (`apple-section--dark`) is reserved for `feature-deep` and
  `landing` closing — blog-index is editorial / browseable, not a
  closing argument page. A black footer subscribe would feel like a
  product launch.

## When NOT to use this canonical as a template

- **Pure changelog** → use `changelog.html` (Wave 2 #5 future).
- **Single essay** → use `feature-deep.html`.
- **Brand-launch / press-release feed** — apple has a dedicated
  Newsroom register (full-bleed photography + black-band closing) that
  this template doesn't carry. Use a custom newsroom layout or wait for
  a future canonical.
- **Heavy-photo lifestyle blog** — apple's editorial register is
  type-driven; if every post needs a photographic banner, this template
  fights the photography. Pick a different aesthetic.

## Extensibility

This is a horizontal port of anthropic/blog-index. The next 2 ports
(ember, sage) follow the same pattern — see anthropic blog-index.md's
"Extensibility · porting this template" table for the full 4-skill
deltas (already records ember signature gold hairline + chocolate-band
closing, and sage signature numbered markers + 4px card radius +
deep-ink band closing).

## Verified

Targets all four gates pass at 1440 × ~4500px:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count = **0 / 0** (§J strict). Post-card ledes ROMAN, hero
subtitle ROMAN, editor's note section uses SF Pro Display 36–44px
moment sentence (no blockquote, no italic).

**Ship significance**: apple/blog-index is **Wave 2 #2** (canonical 21
→ 22). First horizontal port of the blog-index page-type — the
apple-voice deviations recorded here form the "deviation playbook" for
the remaining 2 ports (ember, sage).
