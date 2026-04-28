# canonical · comparison page · sage-design

> **Binding companion** to `comparison.html`. Read this before writing a new
> comparison page in the sage-design voice. The HTML without this .md is
> half the lesson.

## What a "comparison page" is for

Sage-voice comparison pages read like a quiet library plate or a Muji
field-guide entry — neutral, lots of negative space, type and hairlines
doing the structural work. The reader finishes feeling **calmly informed**.
Where anthropic earns honesty through neutrality and ember earns it through
warmth, **sage earns it through restraint** — admitting trade-offs feels
like a cataloguer noting both species fairly, not a brand picking a
favourite.

**When this canonical is the right template**:

- Two architectures / two products / two methods with genuinely different
  first principles, marketed to readers who value calm, restraint, and
  reading time.
- The reader is choosing a tool they expect to live with as a daily
  habit (a notebook app, a reading tool, a journaling system, a quiet
  productivity suite) — not a fast purchase.
- The product wins on philosophy and information architecture as much as
  on features; sage's negative space lets the trade-offs breathe instead
  of crowding them onto one screen.

**When to pick something else**:

- Pure marketing pages → use `landing.html` instead.
- Three-tier pricing comparison → use `pricing.html`.
- Fast-moving consumer products (TikTok-pace launches, flash-sale retail) →
  pick apple-design or anthropic-design; sage's slow rhythm reads as
  underpowered for fast consumer.
- Comparisons that require strong emotional pull or warm-craft register →
  pick ember-design (sage's neutrality reads as cold for that brief).

## The 6 decisions that make this work

### 1. Hero leads with a quiet "two truths" headline · italic earned on one word

The hero opens with a numbered section marker (`01 · COMPARE`, JetBrains
Mono uppercase 11.5px / `letter-spacing: 0.18em`) above an Instrument
Serif **104px roman** stacked headline (`Two notebooks. / Two truths. /
Pick the one / *that fits.*`). One italic word at the end carries the
accent — the rest is roman. Subhead is Inter 21px in `--sage-text` on
`--sage-bg` cream.

→ **Rule**: comparison heroes must signal calm in the first viewport. No
declared winner in the headline. Italic on **one** word maximum. The
numbered section marker establishes the page's rhythm immediately —
every section after this gets one too.

### 2. Divergence illustration is a quiet field-guide diptych · hairline grid

The hero illustration is two facing **field-guide entries** on a
hairline-grid cream background. Left entry is labelled `01 · LOCAL-FIRST`
with JetBrains Mono key-value rows (`form: plain Markdown · habitat:
your disk · gain: portability`). Right entry is `02 · CLOUD-NATIVE` with
the same field structure, different values (`form: vendor blocks ·
habitat: server · gain: real-time collab`). A single horizontal hairline
threads between them with a small sage-green dot (`r="3"`) at the centre
labelled `same idea` in mono caps.

Where anthropic shows arrow-flow architecture, apple shows two
product-window mocks, and ember shows a paper-spread, **sage shows a
catalogue plate**. The metaphor is *"both species, fairly noted, by a
calm cataloguer."*

→ **Rule**: SVG uses `--sage-sage` / `--sage-ink` / `--sage-bg` /
`--sage-divider` only — no warm browns, no apple blues, no anthropic
oranges. Hairline grid texture (1px `#e5e8da`) at ~40px spacing fills
the background. Stroke 1–1.5px, fonts 11–14px (rendered ≥ 9px). One
small sage-green dot is the only filled accent.

### 3. Two-pillar spine · white cards with sage-vs-ink top-border

Two pillar cards (`grid-template-columns: 1fr 1fr`) of equal width,
equal padding, equal bullet count (4 each). Cards are pure white
`#ffffff` with 1px `--sage-divider` border and a 4px radius (sage's
square-ish radius scale — never rounded). The local-first pillar gets
a 4px **sage-green** (`#97B077`) top-border; the cloud-native pillar
gets a 4px **deep-ink** (`#393C54`) top-border. Pillar kicker is
JetBrains Mono uppercase (sage-green for local-first, ink for
cloud-native). Pillar title is Instrument Serif **roman** 28px (no
italic — italic ceiling spent on hero / verdict).

→ **Rule**: pillars are symmetric. The chromatic distinction is sage vs
ink, **never** a competing chromatic accent (no warm brown, no Apple
blue). Bullets are marked with 10×1.5px sage hairlines (sage-green for
local-first column, ink for cloud-native column). Both pillar lists
share the same vertical density.

### 4. Comparison table · hairline grid, sage left-bar on win cells

The 9-row comparison table uses **hairline cell rules** (`#e5e8da`)
rather than card borders. Header row sits on a `#f0f3e2` (lighter sage
tint) background with Instrument Serif 14.5px **roman** column titles
and JetBrains Mono uppercase 11.5px `letter-spacing: 0.14em` for the
`Dimension` column header. Body cells use Inter 15px / 1.6 in
`--sage-text`. The dimension column (left) uses Instrument Serif roman
14.5px in `--sage-text-secondary`, 22% width.

Win cells get a thin 2px `--sage-sage` left-border (`.cell-win::before`,
inset 16px top/bottom). No emoji. No coloured cell backgrounds. No row
striping — the page is calm, not zebra.

→ **Rule**: marker is the sage left-bar. Six-of-nine wins is a lot;
filling those with green emoji would shout. Sage prefers a quiet
chromatic bar; the eye finds the win cells without the page becoming a
scoreboard.

### 5. Three scenarios · stacked full-width with hairline rules between

Unlike anthropic's 3-column grid and ember's 3-card grid, **sage stacks
the three scenarios full-width** (one per row, separated by 1px
`--sage-divider` hairline rules) — the apple comparison's stacking
treatment is the closest cousin. Each scenario row has:
- Numbered section marker (`SC.1 · PICK SKYPAD`) in JetBrains Mono uppercase
- Instrument Serif **36px** roman title (left column, 1/3 width)
- Inter 17px / 1.6 body (right column, 2/3 width)
- A small chromatic dot at the start of the marker: sage-green for
  local-first, ink for cloud-native, `--sage-text-secondary` for the
  neutral "either works" middle.

Stacking instead of gridding gives each scenario more breathing space —
sage's discriminator from the other two scenario-row designs. A 3-card
grid would compress the bodies and break the page's slow rhythm.

→ **Rule**: stacked, hairline-divided. Include the neutral "either
works" middle scenario. The chromatic dot is the only colour signal —
no tag pills, no background tints. Sage = quietest scenario layout.

### 6. Verdict · deep-ink (#393C54) band with Instrument Serif italic 40px pull-quote

The closing verdict reuses sage's signature deep-ink reserved band
(`--sage-ink` background, white text). Inside: a numbered marker
(`05 · VERDICT`) in JetBrains Mono uppercase letterspaced light gray,
then an **Instrument Serif italic 40px** pull-quote in white, then a
small Inter 14.5px cite below in `#c9d1b3` (sage-tint pale) prefixed by
a 20×1.5px sage-green hairline.

This is the page's one earned italic moment in body copy. The hero's
italic accent word and the verdict pull-quote are the two italic
moments allowed; **a third italic anywhere on this page would tip into
italic-overuse** (§J). No CTA inside the band — sage's verdict is
purely editorial.

→ **Rule**: ink band, white type, sage hairline before cite, no button
inside. Used once.

### 7. Section rhythm · numbered marker + Instrument Serif h2 (with optional italic accent)

Every section title uses the same two-part cadence used throughout sage
canonicals:
1. JetBrains Mono uppercase `01 · COMPARE` style numbered marker
2. Instrument Serif 44–60px roman h2, with one italic accent word allowed
   *only on the hero h1 and the second h2* (italic ceiling 2 in body
   copy + 1 in verdict = 3 total).

Italic concentrated in three places: hero accent word
(`Pick the one *that fits.*`), one section h2 accent (`Two
*truths.*`), verdict pull-quote. **Three is the §J ceiling**.

→ **Rule**: numbered marker is non-negotiable for sage canonicals. Skip
it on any section and brand-presence (§K) weakens; the numbered cadence
is one of two sage signatures (the other being the deep-ink reserved
band).

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Section marker (`01 · COMPARE`) | JetBrains Mono | 11.5px upper, `letter-spacing: 0.18em` | 600, `--sage-text-secondary` |
| Hero h1 | Instrument Serif | 92–104px / 1.0 | 400 roman + 1 italic accent word |
| Hero subhead | Inter | 21px / 1.55 | 400 |
| Pillar kicker | JetBrains Mono | 11.5px upper, `letter-spacing: 0.14em` | 600 |
| Pillar title | Instrument Serif | 28px / 1.25 | 400 roman |
| Pillar claim | Inter | 17px / 1.65 | 400 |
| Pillar bullets | Inter | 15px / 1.55 | 400 |
| Section h2 | Instrument Serif | 52–60px / 1.08 | 400 roman + 0–1 italic accent |
| Table header | Instrument Serif | 14.5px | 500 (no upper — keeps editorial calm) |
| Table dimension col | JetBrains Mono | 11.5px upper, `letter-spacing: 0.14em` | 600, `--sage-text-secondary` |
| Table body | Inter | 15px / 1.6 | 400 |
| Scenario marker | JetBrains Mono | 11.5px upper, `letter-spacing: 0.16em` | 600 |
| Scenario title | Instrument Serif | 36px / 1.15 | 400 roman |
| Scenario body | Inter | 17px / 1.65 | 400 |
| Verdict marker | JetBrains Mono | 11.5px upper | 600, `#c9d1b3` |
| Verdict quote | Instrument Serif | 40px / 1.35 | 400 italic, white |
| Verdict cite | Inter | 14.5px letter-spaced | 500, `#c9d1b3` |

Two font families for body — Instrument Serif for titles + verdict,
Inter for running text. JetBrains Mono for markers and metadata only.
**No** Lora, Poppins, SF Pro, Fraunces — they belong to the other
skills.

## Colour rules

- **Sage green `#97B077`** is the chromatic accent for the local-first
  side. Used on: pillar local-first top-border, pillar local-first
  kicker, table win-bar, scenario "Pick Skypad" dot, verdict cite
  hairline. **Never** used as section background.
- **Deep ink `#393C54`** is the chromatic accent for the cloud-native
  side and the reserved band colour. Used on: pillar cloud-native
  top-border + kicker, scenario "Pick cloud" dot, verdict band
  background. **Never** used as text on cream (it's a bg/accent role
  for sections; for text use `--sage-text` `#2a2c40`, the slightly
  warmer sibling).
- **Sage tint `#c9d1b3`** for cite text on the dark verdict band, and
  **divider gray `#e5e8da`** for hairlines.
- Section alternation: cream `#f8faec` ↔ subtle cream `#f0f3e2` (sage
  tint) ↔ deep ink `#393C54` (verdict band, used **once**).

**Never**: green checkmarks, red Xs, blue accents (forbidden on sage),
warm browns (forbidden — that's ember), competing chromatic accent for
cloud column, gradient on any section.

## Don't

- Don't add emoji (✓ / ✗ / ⭐ / 🚀) anywhere. Sage left-bar on the
  table and chromatic dots on scenarios are the entire annotation
  vocabulary.
- Don't add a competing chromatic accent (warm brown, Apple blue,
  anthropic orange) for the cloud side. The cloud side is deep ink;
  that's how sage honesty reads visually.
- Don't render the SVG illustration with terminal chrome, traffic-light
  buttons, or photo-realistic product mocks. Sage's illustration
  vocabulary is **field-guide / catalogue plate** — minimal type +
  hairlines + at most one sage-green accent dot.
- Don't put a CTA (`Download` / `Start`) inside the deep-ink verdict
  band. The verdict is the editorial close; pushy buttons retroactively
  recolour the verdict as marketing.
- Don't use italic anywhere besides the three earned moments (hero
  accent, one section h2 accent, verdict pull-quote). A fourth italic =
  §J italic-overuse warning + drift away from sage's quietness.
- Don't use card borders thicker than 1px or radius greater than 4px.
  Sage cards are **square-ish**; the only border thicker than 1px is
  the 4px chromatic top-border on pillars.
- Don't drop the JetBrains Mono numbered marker on any section. That
  cadence is one of sage's two signature moves; one silent section
  breaks the brand-presence the page depends on.

## When NOT to use this canonical as a template

- **Three-way+ comparisons** — the 1:1 pillar spine and 9-row table
  don't extend cleanly. For three-way, use the pricing canonical's
  3-card grid pattern as a starting structure.
- **Spec-sheet style "20 features, our side wins 19"** — this canonical
  requires both sides to have **genuine** wins. A lopsided table reads
  as propaganda regardless of typography.
- **Fast-moving consumer products** — sage's slow rhythm makes them
  feel underpowered. Pick apple for fast consumer, anthropic for
  developer tooling, ember for warm-craft heritage products.
- **Comparisons demanding strong emotional pull** — sage's neutrality
  reads as detached. Pick ember-design for emotional warmth or
  anthropic-design for principled-engineering register instead.

## Extensibility: porting this template

### To another sage-voice comparison

Copy `comparison.html`, keep the structure, swap:
- Nav brand, page title, hero numbered marker + headline (italic on
  **one** word at the end)
- SVG: two field-guide entries on hairline grid, key-value rows
  appropriate to the new comparison
- Pillar kicker / title / claim / 4 bullets per side (sage top-border
  for your side, ink for theirs)
- Table 9 rows (sage `cell-win` on rows your side wins, blank on rows
  you concede; pick 3 rows where you don't win)
- 3 stacked scenarios (sage dot / ink dot / `--sage-text-secondary`
  dot)
- Verdict on deep-ink band (Instrument Serif italic 40px, sage hairline
  cite)
- 1 hero italic accent word + 1 section h2 italic accent word — **stop**
  there

### Relationship to the anthropic + apple + ember comparison canonicals

Four comparison canonicals share the same information architecture:
hero → divergence illustration → 2-column pillar spine → comparison
table → 3 scenarios → verdict → CTA. They differ in **every visual
surface**:

| Surface | anthropic | apple | ember | sage |
|---|---|---|---|---|
| Hero | 4-line stacked Poppins + Lora subhead | 4-line stacked SF Pro Display + SF Pro Text subhead | 4-line stacked Fraunces + Inter subhead, mono eyebrow | 4-line stacked Instrument Serif 104px + Inter subhead, mono numbered marker |
| Accent | orange `#d97757` | blue `#0071E3` | gold `#c49464` | sage green `#97B077` |
| Reserved band | none | black `#000000` | chocolate `#312520` | deep ink `#393C54` |
| Illustration | abstract arrow-flow | two product-window mocks | two paper-spread pages | two field-guide entries on hairline grid |
| Pillars | bordered cards, top-border colour | hairline-divided text columns, no cards | bordered cream cards, top-border colour | bordered white cards, top-border colour |
| Table wins | orange left-bar | blue ● + em-dash | gold left-bar | sage left-bar |
| Scenarios | 3-col grid, tag pills | stacked full-width, hairline rules | 3-col grid, tag pills | stacked full-width, hairline rules + chromatic dots |
| Verdict | Lora italic pull-quote card | black band, 40px SF Pro Display | chocolate band, 40px Fraunces italic | ink band, 40px Instrument Serif italic |
| Italic | reserved (Lora-italic on verdict only) | none (apple §J strict) | three earned moments | three earned moments |
| Section markers | none | none | gold hairline + mono eyebrow | numbered `01 · 02 · 03` mono |

Same skeleton, same honesty contract — four voices.

## Verified

Rendered at 1440 × ~6500px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 94.95 / 100** (95 / 96 / 92 / 96, weights 25/25/20/30) |

**Multi-critic fixes applied before shipping** (2026-04-28):

1. **SVG source-side font floor** — 2 SVG `<g>` blocks with the JetBrains Mono key/value rows bumped from `font-size="12"` to `font-size="13"`. Rendered values were already ≥ 9px so visual-audit §E passed initially; the bump is defensive against future SVG shrink (mobile, sidebar embed) when a 12px source could slip below the §E.5 11-source / 9-rendered floor.

These were the only actionable info-level fixes — the page passed the four gates and scored 94.95 weighted before fixes. The brand critic's `#7a9561` → `var(--sage-sage-dark)` suggestion was left as-is because all `#7a9561` occurrences are inside SVG `<text fill="...">` attributes, which **cannot** reference CSS custom properties (documented in self-diff trade-off #2). Other info-level notes (`#f0f3e2` cream-tint hex, `#c9d1b3` cite hex, `#eef0f3` cloud-card header band, scenario "roadmap" zh, footer SLAs/DPA bilingual parity) are deliberate page-scoped or established sage canonical conventions and stay unchanged.

SVG internal fills (`#97B077`, `#393C54`, `#2a2c40`, `#6d6f82`, `#7a9561`, `#c9d1b3`, `#e5e8da`, `#f0f3e2`, `#eef0f3`) keep raw hex because SVG element attributes cannot reference CSS custom properties; values match `var(--sage-sage)`, `var(--sage-ink)`, `var(--sage-text)`, `var(--sage-text-secondary)`, `var(--sage-sage-dark)`, and documented page-scoped tinted siblings.
