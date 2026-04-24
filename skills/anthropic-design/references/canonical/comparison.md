# canonical · comparison page · anthropic-design

> **Binding companion** to `comparison.html`. Read this before writing a new
> comparison page in the anthropic-design voice. The HTML without this .md is
> half the lesson.

## What a "comparison page" is for

A comparison page helps a reader pick between two things (or three, rarely
more). It's not a fight card. Anthropic-voice comparisons earn trust by
**admitting the trade-offs** rather than hiding them — the reader should
finish the page feeling they now understand *both* options well enough to
decide, not feeling they've been sold.

**When this canonical is the right template**:

- Two architectures / two products / two methods with genuinely different
  first principles (not "our product vs. a knockoff").
- The reader is actively choosing; you're helping them, not persuading them.
- You're willing to concede scenarios where the other side wins.

**When to pick something else**:

- Pure marketing pages → use `landing.html` instead.
- Long-form reasoning about *why* one approach exists → use `feature-deep.html`.
- A matrix of 10+ things or a pricing tier grid → use `pricing.html` (its
  table is more compact).

## The five design decisions in this canonical

### 1. Hero leads with "two truths", not "X is better"

The headline is deliberately neutral — "Two notebooks, two truths, pick the
one that fits." The anthropic voice earns authority by **refusing to play
propaganda**. If the hero declared a winner, everything after would be read
as marketing; the table becomes harder to trust.

→ **Rule**: comparison heroes must signal honesty in the first line.

### 2. Divergence SVG shows the structural difference, not a feature list

The hero illustration has three nodes (idea origin → local path → cloud
path) with real labels ("your disk" / "vendor server" / "E2E encrypted
sync" / "account-gated"). No icons, no marketing glyphs. The reader should
**see** what differs at the architecture level before reading a single
pro/con.

→ **Rule**: use abstract SVG (diagram, not iconography) · stroke 1.8–2.5px
· fonts 10.5–14px so Playwright measures ≥ 9px rendered.

### 3. Two-pillar spine over one-sided framing

The "pillars" section gives each approach **equal weight, equal card size,
equal list length**. Both columns start with an honest claim, then 4
bullets of real advantages. If one column has 8 bullets and the other has
2, the page reads as biased no matter what the bullets say.

→ **Rule**: pillars are symmetric in length and weight · differ only in the
accent colour (orange for our side, neutral `#6b6a5f` for the other).

### 4. Table uses an orange left-border on wins, not emoji or checkmarks

The comparison table highlights Skypad's wins with a thin orange left-border
(`.cell-win::before`), not a green ✓ / red ✗ grid. Reasons:

- Emoji checkmarks screen-read badly and look like every other SaaS page.
- A thin chromatic bar is quiet — readers see which cells are "ours" without
  the page feeling like a scoreboard.
- 6 of 9 wins is a lot; filling those cells with green would overpower the
  rest.

→ **Rule**: visual annotations in tables use colour-bar treatment · max one
accent colour · never emoji.

### 5. "When to pick which" is three scenarios, not a decision tree

Three scenario cards (Pick Skypad / Pick other / Either works). Each has
one concrete situation — not an abstract rule. The "Either works" card is
especially important: it **gives the reader permission to not care** for
the use cases where it doesn't matter.

→ **Rule**: include a neutral "either works" scenario to prove the author
isn't pathologically pushing one side.

## Typography & colour rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero h1 | Poppins | 48–60px desktop (per anthropic.css `.anth-hero h1`) | 600 |
| Pillar title | Poppins | 28px | 600 |
| Table headers | Poppins | 13.5px / 11.5px (dimension col) | 600 / 700 |
| Table body | Lora | 15px line-height 1.55 | 400 |
| Verdict blockquote | Lora italic | 22px line-height 1.55 | 400 |
| Scenario tag | Poppins all-caps 10.5px letter-spacing 0.14em | — | 700 |

**Colour rules**:

- Our side (Skypad · local-first): `var(--anth-orange)` accent — 4-pt
  pillar top-border, list bullet-dash, win-cell left-bar, kicker colour.
- Other side (cloud-native): neutral `#6b6a5f` — never a competing chromatic
  colour (no blue, no red). Neutrality of the other column is how honesty
  reads visually.
- Scenario tags: orange-tint · neutral-tint · sage-tint (the "either works"
  option). Three distinct tints, low saturation, from the anthropic palette.

## Don'ts

- **No** green checkmarks / red Xs. The orange `::before` bar is the whole
  "we win this row" vocabulary. Replacing it with emoji makes the page look
  like a generic SaaS listicle.
- **No** "the other side admits defeat" cells — the honest table has three
  rows where the other side is neutral or winning. Don't rewrite those as
  concessions.
- **No** competing chromatic colour for the other column. Using a second
  hero colour (e.g. purple for cloud-native) cues the reader to read the
  page as a fight. Honest comparison keeps one accent; the other side is
  neutral.
- **No** "upgrade now" CTA on the comparison page. The footer CTA is a
  soft "ready to try?" — pushy CTAs on a comparison page retroactively
  recolour all the honest words before them as sales copy.
- **No** more than 10 table rows. Past that, readers skim and the nuance is
  lost. If you need more dimensions, split into two tables with a
  paragraph between explaining what each table tests.

## Extensibility: porting this template

### To another anthropic-voice comparison

Copy `comparison.html`, keep the structure, swap:
- Nav brand, page title, hero copy
- Pillar kicker / title / claim / 4 bullets per side
- Table 9 rows (keep orange `cell-win` on rows your side wins, blank on
  rows you concede)
- 3 scenario cards
- Verdict blockquote

### To other design skills

Same information architecture; swap the style-specific treatments:
- **apple-design**: replace orange `cell-win` bar with Apple-blue · replace
  Lora with SF-family · pillars become borderless flat cards with dividers
- **sage-design**: pillars become two-column editorial columns · table
  becomes a quiet list · sage green accent
- **ember-design**: heavier headings · warm-yellow panels · CMYK-overlay
  illustration style

For each port, honour the "pillars symmetric, one accent, no emoji" rules —
they're style-agnostic and load the honesty of the comparison.

## Verified

Rendered at 1440×4446px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. new §1.22 zh-halfwidth-punct check) |
| `visual-audit.mjs` | OK (1 brand-intentional suppressed) |
| `screenshot.mjs` | 1440 × 4446 png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 91 / 100** (94 / 94 / 88 / 88) |

**Multi-critic fixes applied before shipping** (2026-04-24):

1. **Token discipline** — CSS hardcoded `#6b6a5f` (3 places) replaced with
   `var(--anth-text-secondary)`; scenario tag colours `#4a4a42` / `#4e6343`
   tokenised to page-scoped `--cmp-cloud-dark` / `--cmp-sage-dark`.
2. **Chinese typography hygiene** — 15 half-width commas, 2 semicolons, 1
   colon inside `<span class="lang-zh">` bodies replaced with full-width
   `，；：` to match Noto Sans / Serif SC metrics.
3. **Same bug class was then codified** — `known-bugs.md §1.22` + new
   `verify.py` check `zh-halfwidth-punct` · machine now catches this class
   automatically across all canonicals and public HTML.

SVG internal `fill="#6b6a5f"` attributes kept as raw hex: SVG attribute
values cannot reference CSS custom properties, and the hex literally
equals the `--anth-text-secondary` token. Noted for any downstream port
of this template.
