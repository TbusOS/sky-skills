# canonical · blog-index page · sage-design

> **Binding companion** to `blog-index.html`. Read this AFTER
> `anthropic/blog-index.md` — that file states the 7 design decisions and
> editorial-restraint contract this page-type stands on. THIS file
> records only the **sage voice deviations** from that template.

## What this canonical inherits from `anthropic/blog-index`

The 7 information-architecture decisions are unchanged:

1. Masthead = descriptive eyebrow + 2-line h1 + subtitle, **zero CTAs in
   hero**
2. ONE editor-picked featured post on a top band, two-col grid with
   abstract SVG illustration on left, post metadata on right
3. Tag rail = horizontal pill row, ONE active state, NO sidebar
4. Post grid = 2-col list of 6 cards (NOT 3-col Pinterest), each card
   = thumb + kicker + title + lede + Continue link, NO social metadata
5. (sage-specific § below) — italic budget = **3** (vs anthropic 2,
   vs apple 0, matches ember 3)
6. Pagination = older/newer plain links, NO numbered SaaS pagination
7. Footer subscribe = single inline section, NO modals/overlays

If the editorial-restraint contract isn't clear, read
`../../../anthropic-design/references/canonical/blog-index.md` first.

## What changes for sage voice

### 1. Italic count = **3** (sage §J standard, matches ember)

Three earned italic moments per page:
1. **Hero h1 accent word** — one italic word inside the stacked Instrument
   Serif h1 (e.g. `Notes from / the *quiet* shelf.`). NOT just the
   subtitle — sage earns italic on the headline itself, sage signature
   (matches ember; differs from anthropic which puts italic on subtitle).
2. **Featured post lede italic phrase** — one short italic phrase inside
   the lede (e.g. `the part we *got wrong*`). Earned because the featured
   post carries the page's editorial weight.
3. **Editor's note pull-quote** — Instrument Serif italic 28–32px
   blockquote on cream-subtle band, with sage-green hairline cite. Same
   shape as ember (Fraunces italic + gold hairline) — opposite chroma.

Forbidden italic places (would burn §J ceiling):
- Post-card title or lede — roman only (italic on 6 cards = wedding invitation)
- Tag pill text — roman only
- Pagination labels — roman only
- Featured h2 title — roman only (italic reserved for the lede phrase
  and hero accent)
- SVG `<text>` — roman only

### 2. Typography stack swap

| Element | anthropic | sage |
|---|---|---|
| Display headings | Poppins 600 -0.02em | **Instrument Serif** 400 -0.01em (variable serif w/ SOFT 50, opsz 144 axes) |
| Body & subtitles | Lora 400 (serif) | **Inter** 400 (sans, paired with Instrument Serif) |
| Mono kickers / pagination / kbd | JetBrains Mono | **JetBrains Mono** (same — sage shares mono with anthropic/apple) |

This is "warm journal" → "quiet library plate": anthropic Lora-serif body
+ Poppins-sans display; sage uses Instrument Serif-serif display + Inter-sans
body. Same 2-font split, different role assignment, weight-400 across
sage display headings (lighter than anthropic 600 — Instrument Serif
already carries gravitas at weight 400, heavier weights crash the calm
register).

### 3. Numbered section markers — sage signature, no other skill has this

Every section gets a JetBrains Mono numbered marker above the h2:

```
01 · THE JOURNAL          ← masthead kicker
02 · FEATURED LETTER      ← featured post kicker
03 · FILTER BY            ← tag rail kicker
04 · ALL PIECES           ← post grid kicker
05 · FROM THE EDITOR      ← editor's note kicker
06 · GET LETTERS          ← footer subscribe kicker
```

JetBrains Mono 11.5px uppercase, `letter-spacing: 0.18em`, weight 600,
color `--sage-text-secondary`. The number-prefix cadence is sage's two
signature moves (alongside Instrument Serif typography).

→ **Rule**: every section gets a numbered marker, in sequence. Skip any
and the page loses sage's library cadence.

### 4. Hero size: 48–56px → **80–96px** stacked

sage h1 is `clamp(64px, 8vw, 96px)` 400 weight Instrument Serif with
`letter-spacing: -0.022em` (tight). Larger and lighter than ember's
64–72px 500 — Instrument Serif at weight 400 needs the size to carry
presence on cream. Two `<br>`-stacked lines, ONE italic accent word
inside the h1 (sage signature, matches ember).

### 5. Card radius: 16px → **4px** (sage signature, smallest of 4 skills)

sage post-card radius = `--radius-sm` 6px ... actually sage's `feature-deep`
ships **4px** explicitly (not 6px). For blog-index post cards, use the same
4px discipline — no `--radius-sm` token, just literal `border-radius: 4px`
on `.post-card` and post-card thumb container. The radius ladder across
4 skills is the brand-signature progression:

| skill | card radius | source |
|---|---|---|
| sage | 4px (smallest) | feature-deep canonical |
| ember | 12px | feature-deep canonical |
| anthropic | 16px | `--anth-radius-md` |
| apple | 24px (largest) | feature-deep canonical |

→ **Rule**: post cards `border-radius: 4px` literal. Same for
post-card thumb container, tag pills, and search/subscribe inputs.

### 6. Featured post chrome: cream-subtle band → **white card on cream-bg + sage hairline**

anthropic uses `#f0ede3` cream-subtle band with hairline top+bottom.
Sage uses `var(--sage-bg)` (`#f8faec`) base (page bg) with the featured
post on a **white card** (`var(--sage-card)` `#ffffff`) bordered by
`1px var(--sage-divider)` (`#e5e8da`) hairline + 4px radius. NO band
chrome — the featured slot is **a single white plate floating on cream**,
matching sage's library-plate aesthetic.

A 1px sage-green hairline (`var(--sage-sage)` `#97B077`) accent runs
above the section h2, 32px wide, like a small sage bookmark above the
title. This is the same hairline accent as sage feature-deep verdict
band, scaled down.

### 7. Tag rail: filled-orange active → **filled-sage-ink active**

Reading the sage CSS rule for primary CTA: sage-green is decorative
(2.4:1 vs white), sage-ink (`#393C54`) is the load-bearing button color
(11.3:1 vs cream). Apply same logic to the tag rail "active" pill:

- **Inactive pill**: `var(--sage-bg-subtle)` (`#eef2de`) bg + 1px
  `var(--sage-divider)` border + `var(--sage-text)` text + 4px radius
- **Active pill**: `var(--sage-ink)` (`#393C54`) filled bg + white text
  + 600 weight + 4px radius

Sage-green never carries a "filled active state" — it would crash AA
contrast against white text. The deep-ink active pill matches the sage
button discipline established in `sage.css` C-section.

### 8. NO deep-ink band on this page-type (matches ember's no-chocolate-band)

sage's deep-ink band (`#393C54`) is a closing-argument signature, used
**once** on feature-deep / landing / pricing / docs-home / comparison
canonicals. blog-index is editorial / browseable, NOT a closing
argument — the page invites browsing, not concluding. Same logic as:

- anthropic blog-index avoids the cream-subtle hero-band that
  feature-deep uses
- apple blog-index avoids the black-band closing
- ember blog-index avoids the chocolate-band closing

→ **Rule**: footer subscribe sits on `var(--sage-bg-subtle)`
(`#eef2de`) cream-subtle, NOT on deep-ink. Closing band stays reserved
for argumentative page-types. A second deep-ink moment on blog-index
would dilute its closing-argument power on landing/feature-deep.

### 9. Post-card thumb palette = monochromatic sage trio

Each post-card SVG thumb (480×280, abstract illustration) uses
sage's monochromatic palette **only**:

| Hex | Token | Use in thumb |
|---|---|---|
| `#f8faec` | `var(--sage-bg)` | thumb canvas |
| `#eef2de` | `var(--sage-bg-subtle)` | secondary planes |
| `#e5e8da` | `var(--sage-divider)` | hairline strokes |
| `#c9d1b3` | sage-pale tint | tertiary fills |
| `#97B077` | `var(--sage-sage)` | sage-green primary accent (1 per thumb) |
| `#7a9561` | `var(--sage-sage-dark)` | sage-green secondary accent |
| `#6d6f82` | `var(--sage-text-secondary)` | mono text inside SVG |
| `#393C54` | `var(--sage-ink)` | dark plate / window chrome / strong text |
| `#2a2c40` | `var(--sage-text)` | strongest text inside SVG |

NO orange (`#d97757`), NO gold (`#c49464`), NO apple blue (`#0071E3`),
NO red/yellow/green traffic-lights. Six post-card thumbs share this
9-hex palette across all 6 illustrations — bookshelf, folder tree,
keyboard chord, line graph, changelog cards, mac-window mock with
**sage-monochromatic dots** (replacing apple's red/yellow/green and
ember's gold/tan/cocoa traffic-lights). The mac-window dots are
`#97B077` + `#c9d1b3` + `#6d6f82` — tonal trio within sage chroma,
matching sage feature-deep palette discipline.

### 10. Pagination chrome: gold hairline → sage hairline

ember uses gold hairline above the pagination row; sage uses
`1px var(--sage-divider)` (`#e5e8da`) hairline above and below the
prev/next row. Plain prev/next text in JetBrains Mono 13.5px
uppercase letterspaced + `--sage-text-secondary`. No numbered
pagination, matches anthropic discipline.

### 11. zh font stack mapping (§H compliance)

| Latin | Latin font | zh fallback |
|---|---|---|
| Body & subtitles | Inter | **Noto Sans SC** |
| Display headings | Instrument Serif | **Noto Serif SC** |
| Editor's note italic | Instrument Serif italic | **Noto Serif SC roman** (italic on Chinese characters reads as broken — drop to roman in zh) |
| Mono kickers / pagination / kbd | JetBrains Mono | **JetBrains Mono** (mono is mono — keep) |

Letter-spacing on uppercase mono kickers drops from `0.18em` to `0.04em`
in zh + sentence-case (zh characters can't be letter-spaced widely
without visual stretching, same rule as ember/feature-deep).

## Typography rules (strict · sage blog-index specifics)

| Element | Font | Size | Weight |
|---|---|---|---|
| Section marker (`01 · ...`) | JetBrains Mono | 11.5px upper, `letter-spacing:0.18em` | 600, `--sage-text-secondary` |
| Hero h1 | Instrument Serif | clamp(64px, 8vw, 96px), `letter-spacing:-0.022em` | 400 (NOT 600) + ONE italic accent word |
| Hero subtitle | Inter | 19px / 1.6 | 400, `--sage-text` |
| Featured kicker | JetBrains Mono | 11.5px upper, `letter-spacing:0.18em` | 600, `--sage-text-secondary` |
| Featured h2 | Instrument Serif | 36–44px | 400 roman (NO italic — reserved) |
| Featured lede | Inter | 17.5px / 1.65 | 400, ONE earned italic phrase |
| Featured byline | Inter | 13.5px letter-spaced | 500, `--sage-text-secondary` |
| Tag pill | JetBrains Mono | 12.5px | 500 inactive / 600 active white-on-ink |
| Post-card kicker | JetBrains Mono | 11px upper, `letter-spacing:0.14em` | 600, `--sage-sage-dark` |
| Post-card title | Instrument Serif | 22–24px / 1.3 | 400 roman, max 2 lines |
| Post-card lede | Inter | 15px / 1.6 | 400 (ROMAN, no italic) |
| Editor's note | Instrument Serif | 28–32px / 1.45 | 400 italic |
| Editor's note cite | Inter | 13.5px letter-spaced | 500, sage-hairline prefix |
| Pagination link | JetBrains Mono | 13.5px | 500, `--sage-text-secondary` |
| Footer h3 | Instrument Serif | 28px | 400 roman |
| Footer body | Inter | 16px / 1.65 | 400 |

## Colour rules (sage blog-index specifics)

Sage-green `#97B077` only on:
- Featured section's 32×1px hairline accent above h2 (one place)
- Editor's note 2px left vertical rule + cite hairline prefix
- Sage-pale tint (`#c9d1b3`) inside SVG thumbs as secondary accent
- Featured post `.sage-link` arrow tint
- One SVG accent inside the featured-post illustration

Sage-ink `#393C54` (load-bearing CTA color) on:
- Active tag pill bg
- Footer subscribe `.sage-button` filled CTA bg
- Strong text inside SVG thumbs

Cream-subtle `#eef2de` on:
- Footer subscribe block bg
- (NO featured-post band — featured sits on white card on `--sage-bg`)

Everything else is `--sage-bg` (`#f8faec`) page bg + `--sage-card`
(`#ffffff`) plate bg + `--sage-text` (`#2a2c40`) prose + secondary
(`#6d6f82`).

**Forbidden colours** (§K cross-skill smell):
- anthropic orange `#d97757`, `#c46a4a`
- apple blue `#0071E3`, `#2997FF`
- ember gold `#c49464`, `#b07f4f`
- indigo/purple `#eeecff`, `#3a3d7c`
- `green checkmark` / `red X` emoji or icons (sage uses sage-hairlines instead)

## Don't

- Don't render any thumbnail as a photo — sage blog-index thumbs are
  abstract SVG illustrations using the 9-hex monochromatic sage palette.
- Don't add view counts / heart icons / comment counts / "trending"
  badges to post cards. Social metadata cheapens the editorial register.
- Don't put a CTA in the hero. The page is a journal entrance, not a
  funnel.
- Don't render the post-card mac-window thumb with apple's
  red/yellow/green or ember's gold/tan/cocoa dots. Sage uses the
  monochromatic sage trio (`#97B077` / `#c9d1b3` / `#6d6f82`).
- Don't render the post-card radius at apple's 24px or ember's 12px or
  anthropic's 16px. Sage cards are **4px** — sage signature.
- Don't add a deep-ink band anywhere on blog-index. Closing-argument
  band stays reserved for feature-deep / landing / pricing.
- Don't skip the numbered section marker on any section. That cadence
  is one of sage's two signature moves.
- Don't use sage-green as a button bg or as the active-tag fill — it
  fails AA on white text. Active pill = sage-ink, not sage-green.
- Don't write h1 in ALL CAPS or with a colon. Sentence-case noun-phrase
  with a period at the end.
- Don't use a fourth italic place anywhere — the §J 3-budget is the
  ceiling.

## When NOT to use this canonical as a template

- **Pure changelog / release notes** — use `changelog.html` (Wave 2 #5).
- **Single-essay landing** — use `feature-deep.html`.
- **Author-centric page** — Wave 3 page-type, not yet shipped.
- **Brand wanting warm-ember register** — pick ember-design instead;
  sage's neutrality reads as cold for that brief.

## Extensibility: porting this template

Sage/blog-index is the **4th** of 4 horizontal blog-index ports
(anthropic → apple → ember → sage). Future page-types in Wave 2
(product-detail / team / faq / changelog) follow the same
1-anchor-3-ports rhythm.

| Surface | anthropic | apple | ember | sage |
|---|---|---|---|---|
| Masthead kicker | mono `Journal · 2024–2026 · 47 pieces` orange-secondary | text-only blue label "Stories" | gold-hairline + Fraunces small caps `THE ARCHIVE` | numbered marker `01 · THE JOURNAL` |
| Hero h1 | Poppins 48–56px stacked, ONE italic accent in subtitle | SF Pro Display 64–80px stacked, NO italic | Fraunces 64–72px stacked, ONE italic accent in h1 | Instrument Serif 80–96px stacked, ONE italic accent in h1 |
| Featured post chrome | cream-subtle band, hairline top+bottom, orange kicker | hairline-only frame, blue kicker | warm-cream band + gold hairline strip + 12px radius white card | white card on cream + sage-divider hairline + 4px radius + 32×1px sage-green accent |
| Tag rail active | filled orange + white text | filled blue + white text | filled gold + white text | filled sage-ink + white text |
| Card radius | 16px | 24px | 12px | **4px (sage signature, smallest)** |
| Card thumb palette | abstract SVG, 5-color anthropic warm | abstract SVG, apple system grays + blue | abstract SVG, warm cream/gold/cocoa | abstract SVG, monochromatic sage 9-hex |
| Italic count (§J) | 2 (hero + editor's note) | 0 | 3 (hero accent + featured lede + editor's note) | 3 (hero accent + featured lede + editor's note) |
| Pagination | mono prev/next, hairline rule | text-only prev/next, no rule | mono prev/next, gold hairline | mono prev/next, sage-divider hairline |
| Subscribe block bg | cream-subtle | light gray | warm-cream | cream-subtle |
| Closing band? | NO | NO black-band | NO chocolate-band | NO deep-ink band |
| Section marker | none | none | gold hairline + small caps | numbered `01 · 02 · 03 ...` (sage signature) |

Same skeleton, same editorial restraint contract — four voices.

## Verified

Rendered at 1440 × ~5000px. Targets all four gates pass:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count is exactly **3 / 3 §J ceiling**: hero h1 accent word
(`*quiet*` or similar), featured lede italic phrase (`*got wrong*`
or similar), editor's note Instrument Serif italic blockquote.

**Ship significance**: sage/blog-index is **Wave 2 第 4 张** (canonical
23 → 24). matrix blog-index 行收齐 4/4。Pattern: anthropic/apple/ember/sage
全部 ship 后，blog-index page-type 完成横移闭环。

§1.25 text-overlap + §1.26 svg-shape-over-text checks (added 2026-05-01)
must both pass — sage's monochromatic SVG thumbs need careful y-axis
spacing to avoid the kicker+body trap that landed in known-bugs §1.25.
