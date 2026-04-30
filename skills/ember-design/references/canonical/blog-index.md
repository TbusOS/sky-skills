# canonical · blog-index page · ember-design

> **Binding companion** to `blog-index.html`. Read this AFTER
> `anthropic/blog-index.md` — that file states the 7 design decisions and
> editorial-restraint contract that this page-type stands on. THIS file
> records only the **ember voice deviations** from that template.

## What this canonical inherits from `anthropic/blog-index`

The 7 information-architecture decisions are unchanged:

1. Masthead = descriptive eyebrow + 2-line h1 + subtitle, **zero CTAs in
   hero**
2. ONE editor-picked featured post on a top band, two-col grid with
   abstract SVG illustration on left, post metadata on right
3. Tag rail = horizontal pill row, ONE active state, NO sidebar
4. Post grid = 2-col list of 6 cards (NOT 3-col Pinterest), each card
   = thumb + kicker + title + lede + Continue link, NO social metadata
5. (ember-specific § below) — italic budget = **3** (vs anthropic 2,
   vs apple 0)
6. Pagination = older/newer plain links, NO numbered SaaS pagination
7. Footer subscribe = single inline section, NO modals/overlays

If the editorial-restraint contract isn't clear, read
`../../../anthropic-design/references/canonical/blog-index.md` first.

## What changes for ember voice

### 1. Italic count = **3** (ember §J standard)

Three earned italic moments per page:
1. **Hero subtitle accent word** — one `<em>` (e.g. `the *quiet* desk`).
   Same earned-italic place as anthropic.
2. **Featured post lede italic phrase** — one short italic phrase inside
   the lede (e.g. `we'd been *wrong* about what the product was for`).
   Earned because the featured post carries the page's editorial weight.
3. **Editor's note pull-quote** — Fraunces italic 28–32px blockquote on
   cream-subtle band, with gold-hairline cite. Same shape as anthropic
   but Fraunces instead of Lora.

Forbidden italic places (would burn §J ceiling):
- Post-card title or lede — roman only (italic on 6 cards = wedding invitation)
- Tag pill text — roman only
- Pagination labels — roman only
- Featured h2 title — roman only (italic reserved for the lede phrase
  and hero accent)
- SVG `<text>` — roman only

### 2. Typography stack swap

| Element | anthropic | ember |
|---|---|---|
| Display headings | Poppins 600 -0.02em | **Fraunces** 500 -0.01em (warm serif w/ variable axis) |
| Body & subtitles | Lora 400 (serif) | **Inter** 400 (sans, paired with Fraunces) |
| Mono kickers / pagination / kbd | JetBrains Mono | **IBM Plex Mono** |

This is the "warm journal" → "cool tech-blog" inversion: anthropic uses
Lora-serif body + Poppins-sans display; ember uses Fraunces-serif display
+ Inter-sans body. Same 2-font split, different role assignment.

### 3. Hero size: 48–56px → **64–72px** stacked

ember h1 is `clamp(48px, 6vw, 72px)` 500 weight Fraunces with
`letter-spacing: -0.01em`. Lighter weight than apple's 700 and smaller
than apple's 80px max — Fraunces at 500 already carries warmth, so
bigger sizes would over-emphasise. ONE italic accent word inside the
h1 (NOT just the subtitle — ember earns italic on the headline itself,
ember signature).

### 4. Featured post chrome: cream-subtle band → **warm-cream + gold hairline**

anthropic uses cream-subtle (`#f0ede3`) band with hairline borders
top+bottom. Ember uses cream `var(--ember-bg)` (`#fff2df`) base with a
**1px gold (`var(--ember-gold)`) hairline strip** above and below the
featured-band — the same gold-hairline-strip pattern ember uses on
feature-deep / comparison hero. The featured-art SVG sits on a white
card with `1px var(--ember-divider)` border + 12px radius (ember
`--radius-md`).

### 5. Tag rail: filled-orange active → **filled-gold active**

Inactive pills are warm-cream `#fbeedd` with `1px
var(--ember-divider)` border. Active pill is filled
`var(--ember-gold)` `#c49464` with white text 700 weight (gold has
sufficient contrast on white at the active state — verified ≥ AA
through visual-audit).

### 6. Post-card radius: ~16px → **12px** (ember signature)

Cross-skill ladder: sage 4 / **ember 12** / anthropic 16 / apple 24.
12px is `--radius-md` — ember's default card radius across feat-cards /
chord-cards / palette-mocks. Smaller than apple's 24px gives the cards a
"field-guide entry" feel rather than apple's "product-page tile."

### 7. Card thumbnail palette: anthropic 5-color warm → **ember warm trio**

Constrained palette: `#fff2df` (bg), `#f5e5c8` (subtle), `#fbeedd`
(kbd-pill cream), `#e6d9bf` (divider), `#c49464` (gold accent),
`#dfc5a4` (tan), `#8a7564` (cocoa-tan), `#492d22` (brown), `#312520`
(chocolate text). NO orange (anthropic), NO apple blue, NO sage green.
The bookshelf SVG that anthropic painted with orange/sage/blue spines
becomes a warm gold/tan/cocoa palette here — same shape, ember chroma.

### 8. Pagination: anthropic mono + double-rule → **ember mono + gold hairline**

ember pagination has a single **gold hairline** (`1px solid
var(--ember-gold)`) above and below the prev/next row, with IBM Plex
Mono labels. The gold hairline mirrors ember's masthead-eyebrow
treatment, tying pagination back to the page's opening cadence.

### 9. Subscribe block bg: cream-subtle → **warm-cream + chocolate text**

`var(--ember-bg)` `#fff2df` for the section background (NOT
cream-subtle — keeps the warm warmth full-strength). `var(--ember-text)`
`#312520` chocolate for the h3 + body. The `.ember-button` filled
brown CTA is white text on `#492d22` brown background.

### 10. NO chocolate band on this page-type

ember/feature-deep, ember/landing, ember/comparison all close with
`#312520` chocolate band as ember's signature reserved move. **blog-index
does NOT use it** — same reasoning as apple/blog-index avoiding the
black band: blog-index is editorial / browseable, not a closing
argument page. A chocolate band on a journal entrance would feel like a
product launch. The page closes on warm-cream subscribe section with a
gold hairline above instead.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Masthead eyebrow | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.18em` | 500, `var(--ember-text-secondary)` |
| Hero h1 | Fraunces | clamp(48px, 6vw, 72px) | 500, `letter-spacing: -0.01em`, ONE italic accent word |
| Hero subtitle | Inter | 19px / 1.55 | 400, `var(--ember-text)`, ONE `<em>` allowed |
| Featured kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700, gold |
| Featured h2 | Fraunces | clamp(32px, 3.2vw, 40px) | 500 roman, `letter-spacing: -0.01em` |
| Featured lede | Inter | 17px / 1.65 | 400, `var(--ember-text)`, ONE `<em>` short phrase allowed |
| Featured byline | IBM Plex Mono | 12px | 500, `var(--ember-text-secondary)`, letter-spaced |
| Tag pill | IBM Plex Mono | 12px | 500 (active 700 white-on-gold) |
| Post-card kicker | IBM Plex Mono | 11px upper, `letter-spacing: 0.14em` | 700, gold |
| Post-card title | Fraunces | 22px | 500 roman, `letter-spacing: -0.005em`, max 2 lines |
| Post-card lede | Inter | 15.5px / 1.6 | 400 ROMAN, no italic |
| Editor's note quote | Fraunces | 28–32px / 1.4 | 400 italic, `var(--ember-text)` |
| Editor's note cite | Inter | 13.5px letter-spaced | 500, `var(--ember-text-secondary)`, prefixed by 18×1.5px gold hairline |
| Pagination link | IBM Plex Mono | 13px | 500, `var(--ember-text-secondary)` |
| Footer h3 | Fraunces | 28px | 500, `var(--ember-text)` |
| Footer body | Inter | 16px / 1.65 | 400, `var(--ember-text)` |

§H zh stack: Inter body → Noto Sans SC; Fraunces display → Noto Serif
SC; editor's note italic blockquote → roman in zh (italic on Chinese
characters reads as broken).

## Colour rules

- **Gold `#c49464`** (= `var(--ember-gold)`): only chromatic accent.
  Used on masthead eyebrow gold hairline strip, featured kicker, active
  tag pill bg, post-card kicker, editor-note cite hairline, pagination
  hairline, footer subscribe `.ember-button` filled CTA. NEVER as
  section background.
- **Cream `#fff2df`** (= `var(--ember-bg)`): page canvas + featured-band
  bg + footer-subscribe bg.
- **Cream-subtle `#f5e5c8`** (= `var(--ember-bg-subtle)`): editor's
  note section bg, inactive tag pill bg.
- **White `#ffffff`** (= `var(--ember-card)`): featured-art frame,
  post-card thumb bg.
- **Chocolate `#312520`** (= `var(--ember-text)`): all body text + h1 /
  h2 / h3 / footer h3.
- **Brown `#492d22`** (= `var(--ember-brown)`): `.ember-button` filled
  CTA bg only.
- **Hairlines `#e6d9bf`** (= `var(--ember-divider)`): post-card thumb
  border, footer email input border.

**Forbidden**: orange (anthropic), apple blue, sage green, indigo, italic
on post-card title/lede/kicker/byline, gradient on any section, shadow
on any element except the featured-art frame's `--shadow-card`.

## Italic discipline (§J · strict 3-of-page limit)

Total italic on the page = **3**:
1. Hero h1 ONE italic accent word
2. Featured post lede ONE `<em>` short phrase
3. Editor's note Fraunces italic blockquote (whole body)

A 4th italic anywhere = §J overuse warning + drift toward
landing-style italic-stat-numerals (which is signature on landing only,
forbidden on blog-index per anthropic's "list page = no italic
proliferation" rule).

## Don't (ember-specific, in addition to anthropic don'ts)

- Don't use Lora, Poppins, SF Pro, Instrument Serif anywhere — they
  belong to other skills.
- Don't add italic on post-card titles or ledes — italic on 6 cards =
  wedding-invitation register.
- Don't use anthropic orange (`#d97757`) or apple blue (`#0071E3`)
  anywhere — even in SVG.
- Don't add a chocolate band (`#312520` bg) on this page-type — that's
  reserved for feature-deep / landing / comparison closing.
- Don't render post-card thumb at 16px or 24px or 4px radius — ember
  card radius is **12px** (`--radius-md`).
- Don't skip the gold hairline strip above the featured-band — that's
  ember's masthead→featured cadence signature.

## When NOT to use this canonical as a template

- **Pure changelog** → use `changelog.html` (Wave 2 #5 future).
- **Single essay** → use `feature-deep.html`.
- **Brand-launch / press-release feed** — use ember/landing or a custom
  launch page that earns the chocolate band closing.
- **High-volume news aggregator (50+ items)** — the 6-card grid breaks
  past 8–10. Different template needed.

## Extensibility

This is the second horizontal port of anthropic/blog-index (after
apple). The remaining port (sage) follows the same pattern — see
anthropic blog-index.md's "Extensibility · porting this template" table
for the 4-skill deltas.

## Verified

Targets all four gates pass at 1440 × ~4500px:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count = **3 / 3** (§J ceiling): hero h1 accent word, featured
lede italic phrase, editor's note Fraunces italic blockquote. All
post-card titles + ledes + kickers ROMAN.

**Ship significance**: ember/blog-index is **Wave 2 #3** (canonical 22 →
23). Second horizontal port — verifies the deviation playbook also
works for skills with intermediate italic budgets (anthropic 2 / apple 0
/ ember 3 / sage 3).
