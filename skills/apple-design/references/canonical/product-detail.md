# canonical · product-detail page · apple-design

> **Binding companion** to `product-detail.html`. Read this AFTER
> `anthropic/product-detail.md` — that file states the 8 design decisions
> and evidence-first contract this page-type stands on. THIS file
> records only the **apple voice deviations** from that template.

## What this canonical inherits from `anthropic/product-detail`

The 8 information-architecture decisions are unchanged:

1. Hero = product-family eyebrow + product-name h1 + tagline (0.62em) + 2 CTAs
2. At-a-glance bar = 4 hairline-divided cells (Released / Platforms / Tier / Trial)
3. Use-case grid = 3 cards with hand-drawn product mocks
4. Spec table = 8-row label-body grid on alt section, the page's evidence core
5. Honest-limits callout = 3 sentences naming real limits + concrete alternatives
6. Sibling-compare = 3 cards, current product visually anchored center
7. Pricing snippet = 1 sentence + link to `pricing.html`, NO matrix
8. Closing CTA = 2 buttons (download + docs)

If the evidence-first / honest-limits / sibling-compare contract isn't
clear, read `../../../anthropic-design/references/canonical/product-detail.md`
first.

## What changes for apple voice

### 1. Italic count = **0** (apple §J strict)

ZERO `<em>` on the page. Hero subtitle has no italic accent (anthropic's
"actually learned it" pattern is removed). Honest-limits callout uses no
italic on "*not the right tool for*" — apple replaces italic emphasis
with **size + tracking** in the h3 phrasing. Use-case bodies + namedrops
all roman.

Forbidden italic places (apple-strict):
- Hero subtitle
- Honest-limits h3 + body
- Use-case body
- Use-case namedrop
- Sibling cards (any field)
- Closing band sentence
- SVG `<text>` (any element)

A 1st italic anywhere = §J overuse warning + drift away from apple's
no-italic discipline. Apple register reaches "earned moment" through
SF Pro Display size scale, not italic shape.

### 2. Typography stack swap

| Element | anthropic | apple |
|---|---|---|
| Display headings + kickers + stats | Poppins 600 -0.02em | **SF Pro Display** 600-700 -0.02 to -0.035em |
| Body & subtitles | Lora 400 (serif) | **SF Pro Text** 400 (sans) |
| Mono kickers / kbd / code | JetBrains Mono | **SF Mono** |

This is the "warm editorial serif/sans pairing" → "all-sans Apple system
typography" swap. Same 2-font split, same role assignment, but apple's
SF family carries restraint where anthropic's Lora serif carries warmth.

### 3. Hero kicker: filled orange badge → **plain blue text label**

anthropic uses `.anth-badge` filled-orange pill ("Skypad Studio · part
of the Skypad lineup"). Apple uses `<p>` SF Pro Display 15px weight 500
in `var(--apple-link)` blue, NO pill chrome (matches apple feature-deep
hero kicker rule). Filled-pill kickers feel anthropic; quiet blue text
labels are apple's wayfinding signature.

### 4. Hero size: 48-56px → **64-80px** stacked

apple h1 is `clamp(56px, 7.5vw, 80px)` 700 weight SF Pro Display with
`letter-spacing: -0.035em` (tighter than anthropic's -0.02em). Larger
size carries more presence on white bg vs cream. Two stacked lines via
`<br>`, NO italic accent (apple discipline).

### 5. Card radius: 16px → **24px** (apple signature)

All cards (use-case cards · sibling-compare cards) use literal
`border-radius: 24px` — apple's signature card radius (not 12px from
`--radius-md` token, not 18px from `--radius-lg`). The 24px radius is
itself part of the apple brand vocabulary, established in feature-deep
canonical.

→ **Rule**: literal `border-radius: 24px` on `.pd-use__card` and
`.pd-sibling__card`. Tag pills (if any) and small inputs stay at smaller
radii but never below 12px.

### 6. At-a-glance bar: cream-subtle band → **white with light-gray hairlines**

Hairline-divided 4-col strip stays. Apple swaps:
- bg: `--anth-bg` cream → `--apple-bg` white
- divider: `--anth-light-gray` → `--apple-divider` `#D2D2D7`
- value font: Poppins → SF Pro Display
- label font: Poppins → SF Pro Display 11.5px upper letterspaced

NO band wrapper (anthropic uses cream as canvas, hairlines mark cells;
apple does the same on white).

### 7. Honest-limits callout: cream-subtle inner box → **light-gray inner box + 3px blue left**

anthropic uses cream-subtle (`#f0ede3`) inset with 3px solid orange
left border. Apple uses light-gray (`--apple-bg-alt` `#F5F5F7`) with
3px solid blue (`--apple-link` `#0071E3`) left border. Same shape,
different chroma. NO italic on body (anthropic allows ONE earned
italic; apple §J forbids).

### 8. Sibling-compare current = 2px blue border (was 2px orange)

Current product card visually anchored by `2px solid var(--apple-link)`
border + "You are here" pill (white text on `--apple-link` filled bg ·
SF Pro Display 11px upper letterspaced). Same anchor pattern as
anthropic, blue chroma instead of orange.

### 9. Closing: cream-subtle calm cream → **BLACK BAND** (apple signature reserved move)

This is the biggest visual departure. anthropic ends product-detail on
cream-subtle with quiet orange CTAs. Apple's signature closing is the
**black band** (`--apple-bg-dark` `#000000`), used **once** per page,
established on feature-deep / landing / pricing canonicals.

Inside the black band:
- SF Pro Display 44px weight 500 sentence centered, white text
- SF Pro Text 14px cite below in `rgba(255,255,255,0.5)` (no italic)
- Single filled white CTA (`background: #ffffff; color: #000000;`) +
  one ghost CTA (white border + white text + transparent bg)

The black band is apple's reserved closing-argument signature. A
product-detail without the black band would read as "apple page minus
its signature move"; a second black band on the page would dilute the
once-per-page rule.

→ **Rule**: black band closing, ONE filled white CTA, ONE ghost CTA,
NO italic on closing sentence, cite is plain `font-style: normal`,
SF Pro Display 44px headline.

### 10. Use-case SVGs — apple light product-window vocabulary

Each use-case card SVG uses apple's product-window aesthetic:
- Light bg (`--apple-bg-alt` `#F5F5F7`) outer canvas
- White inner panel with 12px radius (NOT 24px — that's card radius;
  inner mock chrome is 12px)
- 1px `--apple-divider` border on inner panel
- For mock-window cards (e.g. with title bar): 3 traffic-light dots in
  red/yellow/green (`#ff5f57` / `#febc2e` / `#28c840`) — apple system
  vocab (NOT ember warm trio · NOT sage monochromatic)
- Blue accent (`#0071e3`) for highlights / cursors / selection rings
- NO orange topbar (anthropic visual signal · apple uses traffic-lights
  or filename in title bar instead)

### 11. zh font stack mapping (§H compliance)

| Latin | Latin font | zh fallback |
|---|---|---|
| Hero h1 / kickers / display headings | SF Pro Display | **PingFang SC** primary (apple convention — apple zh sites use PingFang first, NOT Noto Sans SC) |
| Body & subtitles | SF Pro Text | **PingFang SC** + sans fallback |
| Mono / kbd / code | SF Mono | SF Mono (mono is mono) |

Apple §H exception: apple zh pages use **PingFang SC** as primary, not
Noto Sans SC — apple.com.cn uses PingFang. No Noto Serif SC anywhere
(apple has no editorial serif).

NO italic in zh (already not allowed in EN per apple §J).

## Typography rules (strict · apple product-detail specifics)

| Element | Font | Size | Weight |
|---|---|---|---|
| Family eyebrow (blue text) | SF Pro Display | 15px | 500, `var(--apple-link)` |
| Hero h1 | SF Pro Display | clamp(56px, 7.5vw, 80px), `letter-spacing:-0.035em` | 700, two stacked lines |
| Hero h1 tagline | SF Pro Display | 0.62em (~38-50px), `letter-spacing:-0.022em` | 500, `--apple-text` |
| Hero subtitle | SF Pro Text | 21px / 1.5 | 400, `--apple-text-secondary`, NO italic |
| At-a-glance label | SF Pro Display upper | 11.5px / `letter-spacing:0.14em` | 700, `--apple-text-secondary` |
| At-a-glance value | SF Pro Display | 19px | 600, `--apple-text` |
| Use-case title | SF Pro Display | 21px | 600, `letter-spacing:-0.015em` |
| Use-case body | SF Pro Text | 15.5px / 1.55 | 400, ROMAN |
| Use-case namedrop | SF Pro Text | 13.5px / 1.5 | 400, `--apple-text-secondary`, ROMAN (no italic) |
| Spec label (blue) | SF Pro Display upper | 11.5px / `letter-spacing:0.14em` | 700, `--apple-link` |
| Spec body | SF Pro Text | 16px / 1.6 | 400 |
| Spec body code | SF Mono | 14px | 400, `--apple-bg-alt` pill |
| Callout kicker (blue) | SF Pro Display upper | 11.5px / `letter-spacing:0.14em` | 700, `--apple-link` |
| Callout h3 | SF Pro Display | 26px | 600, `letter-spacing:-0.015em` |
| Callout body | SF Pro Text | 17px / 1.65 | 400, NO italic |
| Sibling eyebrow (blue) | SF Pro Display upper | 11.5px / `letter-spacing:0.14em` | 700, `--apple-link` |
| Sibling name | SF Pro Display | 24px | 700, `letter-spacing:-0.015em` |
| Sibling tagline | SF Pro Text | 15px / 1.5 | 400 |
| Sibling row | SF Pro Text | 14px / 1.55 | 400 |
| Pricing snippet | SF Pro Text | 17px / 1.6 | 400 |
| Closing band sentence | SF Pro Display | 44px / 1.2, `letter-spacing:-0.025em` | 500, white |
| Closing band cite | SF Pro Text | 14px | 400, `rgba(255,255,255,0.5)`, no italic |

## Colour rules (apple product-detail specifics)

Apple blue `#0071E3` (= `var(--apple-link)`) on:
- Hero family eyebrow text
- Hero filled `.apple-button` (white text on blue)
- Spec-row label text
- Use-case-card SVG accent (one per card)
- Honest-limits callout left border + kicker
- Sibling-compare middle card 2px border (current-product anchor)
- Sibling "You are here" pill bg
- All `.apple-link` arrows + underlines

Black `#000000` (= `--apple-bg-dark`) on:
- Closing band background, used ONCE per page
- Closing filled CTA text (white-on-black inverse pattern)

Light gray `#F5F5F7` (= `--apple-bg-alt`) on:
- Spec table band
- Honest-limits inner box bg
- Use-case SVG outer canvas
- `<kbd>` / `<code>` pill backgrounds

Apple system traffic-light hexes (allowed inside SVG product-window mocks
ONLY, NEVER as page accents): `#ff5f57` / `#febc2e` / `#28c840`.

**Forbidden colours** (§K cross-skill smell):
- anthropic orange `#d97757`, `#c46a4a`
- ember gold `#c49464`, `#b07f4f`
- sage green `#97B077`, `#d4e1b8`
- indigo/purple `#eeecff`, `#3a3d7c`
- gradient on any section, drop-shadow on any element except mock SVGs

## Don't

- Don't use italic anywhere. Apple §J = 0. No `<em>`, no
  `font-style: italic` (CSS), no SVG italic `<text>`.
- Don't render the family eyebrow as a filled pill (anthropic signal).
  Apple kicker is plain blue text.
- Don't render the use-case SVGs with anthropic's "white panel + orange
  topbar" pattern — apple uses traffic-light dots OR filename in title
  bar OR clean panel without topbar.
- Don't put the closing on cream / cream-subtle / light-gray. Apple
  signature is the black band; missing it = missing apple voice.
- Don't add a 2nd black band. The closing band is reserved.
- Don't render the cards at 12px or 16px radius. Apple cards = 24px.
- Don't write h1 in ALL CAPS or with a colon. Sentence-case product
  name + tagline.
- Don't use red/yellow/green emoji. Use the SVG traffic-light dot
  trio inside product-window mocks only.
- Don't write the closing CTA as a quiet orange-style anchor. Apple
  closes with high-contrast filled white-on-black or transparent +
  white border ghost.

## When NOT to use this canonical as a template

- **Skill / company overview** (multiple products) → `landing.html`.
- **One-feature deep argument** → `feature-deep.html`.
- **Pricing matrix** → `pricing.html`.
- **2-4 product side-by-side comparison** → `comparison.html`.
- **Apple-event-style launch announcement** — apple has a "release page"
  register (full-bleed video, motion design). This canonical is for
  daily product-detail, not launch spectacle.

## Extensibility: porting this template

apple/product-detail is the **2nd** of 4 horizontal product-detail ports
(anthropic 锚 → apple → ember → sage). The 4-skill extensibility table
lives in `anthropic-design/references/canonical/product-detail.md` —
this file records only the apple-specific deltas.

## Verified

Rendered at 1440 × ~5000px. Targets all four gates pass:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count is exactly **0 / 0 §J ceiling** — no `<em>` anywhere on
the page in EN or zh. All emphasis carried by SF Pro Display size + weight.

**Ship significance**: apple/product-detail is **Wave 2 第 6 张**
(canonical 25 → 26). Horizontal port of anthropic/product-detail.md ·
matrix 第三台阶 product-detail 行 1/4 → 2/4。
