# canonical · comparison page · apple-design

> **Binding companion** to `comparison.html`. Read this before writing a new
> comparison page in the apple-design voice. The HTML without this .md is
> half the lesson.

## What a "comparison page" is for

Apple-voice comparison pages are the mirror of apple.com's own Mac-vs-Mac /
iPhone-vs-iPhone pages: they help a reader pick, but the page earns trust
by **refusing to be a propaganda sheet**. The reader finishes feeling
they understand both options — not that they've been sold.

**When this canonical is the right template**:

- Two architectures / two products with genuinely different first
  principles (not "our product vs. a knockoff").
- The reader is actively choosing; we're helping them, not persuading them.
- We're willing to concede scenarios where the other side wins.

**When to pick something else**:

- Pure marketing pages → use `landing.html`.
- Dense feature-by-feature specs (10+ dimensions, many numeric) → use
  `pricing.html`'s comparison table pattern on a product spec page.
- Single-product deep-dive → use `feature-deep.html` (not yet present in
  apple canonicals).

## The 5 decisions that make this work

### 1. 80-96px stacked hero headline, centered, blue kicker

The hero opens with a centered `15px color:#0071E3` kicker ("Compare ·
Skypad vs cloud-native"), then a 4-line 80-96px headline stacked with
`<br>`: *"Two notebooks. / Two truths. / Pick the one / that fits."*
Subhead in 23px `--apple-text-secondary`.

→ **Rule**: the comparison hero must be centered and **must not declare
a winner** in the headline. Apple quiet + neutral framing = instant
"this page is helping me decide, not selling to me."

### 2. Device mock as illustration, not abstract diagram

The hero illustration is two laptop-window schematics facing each other
with an idea origin between. The left window shows plain Markdown text;
the right shows `[block: paragraph · synced]` entries on vendor servers.
No icons. No abstract diagrams. Apple's illustration vocabulary IS
product mocks — the architectural reality lands through visual language
apple readers already know.

→ **Rule**: use product-mock SVG (rounded window chrome, traffic-light
buttons, SF Mono filenames in the footer row). Fonts 10-14px, stroke
weight 1-2px, shadow filter applied to the card.

### 3. Two-column pillar spine divided by a 1px hairline, no cards

The pillar section uses `grid-template-columns: 1fr 1px 1fr` — two text
columns separated by a vertical hairline rule. No borders, no shadows,
no container cards. Apple's signature move is negative space and type
hierarchy, not card stacks. The hairline quietly says "these are peers"
without the defensive container language.

→ **Rule**: pillar columns are symmetric in length and bullet count.
Orange for our side (via the blue kicker link colour), neutral secondary
text for the other side. **No** competing chromatic accent on the cloud
column.

### 4. Comparison table: blue bullet for wins, em-dash for other-side wins

The 9-row comparison table uses a blue filled bullet (●, `color:#0071E3`)
inline at the start of each Skypad win cell and a neutral em-dash (—,
`color:#6e6e73`) at the start of each Notion/Evernote win cell. No green
checkmarks, no red Xs, no coloured cell backgrounds. Apple.com comparison
tables use exactly this pattern — minimal shape marks, one accent colour
used sparingly.

→ **Rule**: annotation in tables is shape-only (● / —), never emoji or
coloured backgrounds. The 14px `display:inline-block` width on `.cmp-mark`
gives monospace alignment without switching the body font.

### 5. Black band pull-quote as verdict, no attribution line above

The closing verdict is a single 40px pull-quote centered on a pure black
section (`--apple-bg-dark: #000000`) with `--apple-text-on-dark: #F5F5F7`
text. No byline above, small cite below in `#a1a1a6` letter-spaced. Apple
pricing canonical §5 defines the black band as the reserved closing
move — used once, for one high-stakes line.

→ **Rule**: the dark band is the comparison page's only section with a
non-white/non-alt background. One quote. One cite. Nothing else.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500, `color:#0071E3` |
| h1 hero | SF Pro Display | 80-96px | 700, `letter-spacing:-0.035em` |
| Hero subhead | SF Pro Text | 23px / 1.4 | 400 |
| Pillar kicker | SF Pro Display | 15px | 500 |
| Pillar title | SF Pro Display | 40px | 600, `letter-spacing:-0.025em` |
| Pillar claim | SF Pro Text | 19px / 1.55 | 400 |
| Pillar bullets | SF Pro Text | 15.5px / 1.55 | 400 |
| Table header | SF Pro Display | 15px | 600 |
| Table body | SF Pro Text | 15.5px / 1.55 | 400 |
| Table dimension col | SF Pro Display | 13px upper | 600 `letter-spacing:0.1em` |
| Scenario tag | SF Pro Display | 11px upper | 600 `letter-spacing:0.12em` |
| Scenario title | SF Pro Display | 36px | 600, `letter-spacing:-0.022em` |
| Scenario body | SF Pro Text | 19px / 1.55 | 400 |
| Verdict quote | SF Pro Display | 40px / 1.2 | 500, `letter-spacing:-0.022em` |
| Verdict cite | SF Pro Display | 14px letter-spaced | 500, `color:#a1a1a6` |

One font family — SF Pro Display for type that wants Display's
`-0.02 to -0.035em` tracking, SF Pro Text for everything else. No Lora,
no Fraunces, no italic anywhere (§J applies strictly on apple).

## Colour rules

- Blue `#0071E3` only on: hero kicker, pillar kicker (local-first side
  only), table win bullets, scenario tag (local-first tag only),
  `.apple-link` and `.apple-button`.
- Dark text `#1D1D1F` is primary; secondary text `#6E6E73`.
- Section alternation: white (`#ffffff`) ↔ pale gray (`#f5f5f7`, via
  `.apple-section--alt`) ↔ black (`#000000`, via `.verdict` band only).
- **Never** use blue for section backgrounds. Never use any other accent
  colour. Don't introduce green checkmarks, orange tints, or red Xs —
  even for "loss" cells.

## Don't

- Don't add emoji (✓ / ✗ / ⭐ / 🚀) anywhere. The blue bullet and em-dash
  are the whole annotation vocabulary.
- Don't put pillar content inside bordered cards. Apple comparison uses
  type + hairlines, never card chrome.
- Don't add a second accent colour to distinguish the cloud side. The
  cloud side is neutral (secondary text colour); that's how honesty reads
  visually in apple's vocabulary.
- Don't add hover animations or scroll-triggered reveals to the
  comparison table. Apple.com pricing is static.
- Don't run a gradient behind the verdict. Black on black on black.
- Don't turn the SVG mock into a photorealistic product render. The
  schematic level (rounded rect + traffic lights + filename) is correct
  — realism would make the architectural honesty feel like marketing.

## When not to use this canonical as template

- **Feature-count comparison** where one side wins 20+ dimensions and
  other wins 0–1 — this canonical requires both sides to have **genuine**
  wins. A lopsided comparison reads as propaganda regardless of format.
- **Pricing/tier comparison** — use `pricing.html` with its 3-tier card
  layout instead. Comparison pages are for architecture/approach
  comparisons, not subscription tiers of the same product.
- **Three-way or more comparisons** — the two-pillar spine and the `1fr
  1px 1fr` grid don't extend cleanly to three or more columns. For
  three-way comparisons, the table pattern works but the pillar spine
  needs a redesign (probably three stacked pull-out sections, not
  side-by-side columns).

## Extensibility: porting this template

### To another apple-voice comparison

Copy `comparison.html`, keep the structure, swap:
- Nav brand, page title, hero kicker + headline
- SVG mock: two product-window schematics for the two things being
  compared
- Pillar kicker / title / claim / 4 bullets per side
- Table 9 rows (blue bullet for your-side wins, em-dash for their-side
  wins, blank in the middle column when you concede)
- 3 scenario cards
- Verdict blockquote

### Relationship to anthropic-design comparison

The anthropic and apple comparison canonicals share the **information
architecture** (hero → divergence illustration → 2-column spine →
comparison table → 3 scenarios → verdict → CTA) but differ in **every
visual surface**:

| Surface | anthropic | apple |
|---|---|---|
| Hero | 4-line stacked, Poppins + Lora subhead | 4-line stacked, SF Pro Display + SF Pro Text subhead |
| Accent | orange `#d97757` | blue `#0071E3` |
| Illustration | abstract arrow-flow diagram | two product-window mocks |
| Pillars | bordered cards with top-border color | text columns split by vertical hairline |
| Table wins | orange left-border bar on cell | blue ● prefix + em-dash for loss |
| Scenarios | 3-col grid, tag-pill colours | stacked full-width, hairline rules |
| Verdict | Lora italic pull-quote card | black band, 40px SF Pro Display |

Same page, same skeleton, same honesty contract — two voices.

## Verified

Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 93 / 100** after fix round (94 / 94 / 88 / 94 post-fix) |

**Multi-critic fixes applied before shipping** (2026-04-24):

1. **Token discipline** — 5 inline styles referenced `var(--font-body)`
   (apple.css defines `--font-text`, not `--font-body`). All 5 → `var(--font-text)`.
2. **Hero scale** — h1 was inheriting apple.css default 64px; added inline
   `font-size:clamp(56px, 7.5vw, 96px); letter-spacing:-0.035em` to hit
   canonical 80-96px per Typography table.
3. **zh full-width punctuation** — 1 pair of half-width parens
   `(表格、数据库、嵌入)` → `（表格、数据库、嵌入）`; 1 half-width `?`
   → `？`. Consistent with §1.22 / §H.
4. **SVG text readability** — 2 SF Mono footer rows (`~/Notes/idea.md` and
   `record 882091`) bumped from `font-size="10"` to `11` for safer
   scale-down cushion on narrow viewports.

Brand critic score lifted from 83 → 94 after fixes.

Apple §H exception: PingFang SC leads the zh font stack (Apple's native
SF companion), not Noto Sans/Serif SC. Noto fallback kept for non-Apple
devices. Documented in `skills/design-review/references/cross-skill-rules.md §H`.
