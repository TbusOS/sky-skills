# canonical · comparison page · ember-design

> **Binding companion** to `comparison.html`. Read this before writing a new
> comparison page in the ember-design voice. The HTML without this .md is
> half the lesson.

## What a "comparison page" is for

Ember-voice comparison pages are written like a thoughtful editorial — the
kind a literary journal might run if it ever covered software. The reader
should finish with a sense of having been **respectfully informed**, not
swayed. Where anthropic earns honesty through neutrality and apple earns
it through restraint, **ember earns it through warmth** — admitting the
trade-offs feels like a friend explaining over coffee, not a brochure.

**When this canonical is the right template**:

- Two architectures / two products with genuinely different first
  principles, marketed to readers who care about provenance, longevity,
  craftsmanship.
- The reader is choosing a tool they expect to live with for years (a
  notebook, a kitchen knife, a font subscription) — not a quick utility.
- The product wins on philosophy as much as features; concession to the
  other side reads as confidence.

**When to pick something else**:

- Pure marketing pages → use `landing.html` instead.
- Three-tier pricing comparison → use `pricing.html` (its 3-card grid is
  the right shape for tiers; this template's 2-pillar spine doesn't
  three-extend cleanly).
- Fast consumer comparisons (TikTok-pace launches, flash-sale retail) →
  pick apple-design or anthropic-design; ember's slow rhythm reads as
  underpowered for fast-moving categories.

## The 6 decisions that make this work

### 1. Hero leads with "two truths", italic earned on one accent word

The headline is a stacked Fraunces 80–96px roman h1 (`Two notebooks. /
Two truths. / Pick the one / that fits.`) with **one italic word at the
end** (`*that fits.*`). Mirroring ember's landing canonical, italic is
the accent — earned once per section, not wallpaper. The eyebrow above
("Compare · Two ways to keep notes") is IBM Plex Mono uppercase, the
ember signature cadence.

→ **Rule**: comparison hero declares no winner in the headline. Italic
appears on **one** word maximum. The eyebrow + 1px gold hairline above
the headline is the page's opening cadence — skip it and the page reads
as a generic landing page.

### 2. Divergence illustration is editorial paper-spread, not technical diagram

The hero illustration is a two-page editorial spread on cream stock:
**left page** is a handwritten-Markdown notebook entry (Fraunces serif
body, `idea.md · 04 · 13 · 2026`); **right page** is a vendor-cloud
receipt (IBM Plex Mono, `record_id 882091 · synced 13:42 UTC`). A
gold hairline diagonal threads between them with the word `same idea`
in mono caps. Where anthropic shows arrow-flow architecture and apple
shows two product-window mocks, ember shows **two pages from the same
journal of choices** — the metaphor is books, not systems.

→ **Rule**: SVG uses Fraunces / Georgia for body text inside the spread,
IBM Plex Mono for metadata. Stroke 1.2–2px, fonts ≥ 11px (rendered ≥
9px). Cream-to-warm gradient frame; no contemporary UI chrome (no
traffic-light buttons, no terminal prompt). The illustration must feel
like something **printed**, not rendered.

### 3. Two-pillar spine with gold / brown dual top-border

Two pillars (`grid-template-columns: 1fr 1fr`) of equal width, equal
padding, equal bullet count (4 each). The local-first pillar gets a 4px
**gold** (`--ember-gold #c49464`) top-border; the cloud-native pillar
gets a 4px **darker brown-gray** (`#6b5a4f`, ember's secondary text
colour) top-border. Card body is `#ffffff`. Pillar kicker is mono
uppercase (gold for local-first, brown-gray for cloud-native). Pillar
title is Fraunces 28px **roman** (no italic — italic ceiling already
spent on hero).

→ **Rule**: pillars are symmetric. The chromatic distinction is gold (us)
vs neutral brown-gray (them), **never** a competing chromatic colour
(no green, no blue) — neutrality of the other column is how ember
honesty reads visually. Bullet markers are 10×2px gold hairlines, mirroring
anthropic's orange dashes.

### 4. Comparison table uses a thin gold left-bar on win cells

The 9-row comparison table marks Skypad's win cells with a thin
`var(--ember-gold)` left-border (`.cell-win::before`, 2px wide,
inset 16px top/bottom). No emoji checkmarks. No coloured cell
backgrounds. Header row uses `--ember-bg-subtle` (`#f5e5c8`) with
Fraunces 14px 600. Body uses Inter 15px / 1.6. Dimension column (left)
is Fraunces 14px 600 in secondary text colour, 24% width.

→ **Rule**: table marking is the gold bar — never emoji, never green/red.
6 of 9 wins is honest (3 cells where the other side is neutral or wins);
filling those cells with chromatic emoji would shout "scoreboard" and
delete the page's editorial tone. Table border-radius is `--radius-md`
(12px), the same as cards.

### 5. Three scenarios with mono-uppercase tags

A `grid-template-columns: repeat(3, 1fr)` row of three scenario cards
(Pick Skypad · Pick cloud · Either works). Each card has:
- A small mono-uppercase tag (gold tint, brown tint, divider-tan tint)
- Fraunces 22px **roman** title (no italic)
- Inter 15.5px / 1.6 body, 3 full lines minimum each (avoid hollow-card
  drift; bodies aim for 200+ chars to fill the card)

The "either works" tag uses `--ember-divider` tan (`#e6d9bf`) tint —
visually distinct from the two partisan tags but **still in palette**
(no sage green or any out-of-skill colour).

→ **Rule**: include the neutral "either works" scenario. It gives the
reader permission not to care, which paradoxically increases trust in
the partisan recommendations. Three is the right number; two reads as
"sales pitch", four+ overruns the visual rhythm.

### 6. Verdict is a dark-chocolate pull-quote band — italic earns its keep

The closing verdict reuses ember's signature dark-chocolate band
(`#312520` background, `#ffffff` text), exactly as `landing.html`
already uses for testimonials. **Fraunces italic 40px** pull-quote on
the dark band — this is the page's one earned italic moment in body
copy (the hero's italic accent word doesn't count toward the body-copy
quota). Cite below in Inter 15px `#d9b892` letter-spaced, with a 20×1.5px
gold hairline before the byline (matching landing.html cite pattern).

→ **Rule**: the dark band is the comparison page's only section with a
non-cream/non-subtle background. One quote, one cite, one thin gold
hairline. Don't add a CTA inside the dark band — it would retroactively
recolour the verdict as marketing.

### 7. Section rhythm: gold hairline + mono eyebrow + Fraunces h2 (with one italic accent)

Every section title uses the same three-part cadence used throughout
ember canonicals:
1. Centered 48×1px gold accent strip (`.accent-strip--center`)
2. IBM Plex Mono uppercase eyebrow (12px / `letter-spacing: 0.18em`)
3. Fraunces 48–56px roman h2, with **one italic accent word** allowed

Italic is concentrated in three places on the whole page: hero accent
word, one section h2 accent (`Two *truths.*`), and the verdict
blockquote. **Three is the ceiling** per §J. A fourth italic use
anywhere on this page would tip into italic-overuse.

→ **Rule**: the eyebrow + hairline + h2 sequence is non-negotiable for
ember canonicals. Skip it on any one section and brand-presence (§K)
weakens; the gold hairline cadence is one of two ember signatures
(the other being the dark-chocolate band).

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero eyebrow | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.18em` | 400 |
| Hero h1 | Fraunces (variable, opsz 144) | 80-96px / 1.05 | 400 roman + 1 italic accent word |
| Hero subhead | Inter | 21px / 1.55 | 400 |
| Pillar kicker | IBM Plex Mono | 11.5px upper, `letter-spacing: 0.14em` | 700 |
| Pillar title | Fraunces | 28px / 1.25 | 500 roman |
| Pillar claim | Inter | 17px / 1.6 | 400 |
| Pillar bullets | Inter | 15px / 1.55 | 400 |
| Section h2 | Fraunces | 48-56px / 1.1 | 400 roman + 0–1 italic accent |
| Table header | Fraunces | 14.5px | 600 (no upper — keeps editorial calm vs SaaS spec-sheet shout) |
| Table body | Inter | 15px / 1.6 | 400 |
| Table dimension col | Fraunces | 14.5px | 600, secondary text colour |
| Scenario tag | IBM Plex Mono | 10.5px upper, `letter-spacing: 0.14em` | 700 |
| Scenario title | Fraunces | 22px / 1.3 | 500 roman |
| Scenario body | Inter | 15.5px / 1.6 | 400 |
| Verdict quote | Fraunces | 40px / 1.35 | 400 italic |
| Verdict cite | Inter | 15px letter-spaced | 500, `#d9b892` |

Two font families for body — Fraunces for titles + verdict, Inter for
running text. IBM Plex Mono for eyebrows and metadata only. **No
Lora**, no Poppins, no SF Pro — they belong to the other skills.

## Colour rules

- **Gold `#c49464`** is the only chromatic accent. Used on: gold hairline
  strips, pillar local-first top-border, table win-bar, scenario "Pick
  Skypad" tag tint, hero italic accent word colour (kept at `#312520`,
  not gold — gold would over-claim).
- **Brown-gray `#6b5a4f`** (secondary text) on the cloud-native pillar
  top-border, kicker, and "Pick cloud" tag tint. Never a competing
  chromatic accent colour for the cloud side.
- **Divider tan `#e6d9bf`** tint on the "either works" scenario tag
  background — quiet, in-palette, distinct from the two partisans.
- Section alternation: cream `#fff2df` ↔ subtle cream `#f5e5c8` (via
  `.ember-section--subtle`) ↔ chocolate `#312520` (verdict band only,
  used **once**).

**Never**: green checkmarks, red Xs, blue accents (any blue is forbidden
on ember), competing chromatic accent for cloud column, gradient on a
section other than the hero illustration frame.

## Don't

- Don't add emoji (✓ / ✗ / ⭐ / 🚀 / 👍 / 😊) anywhere. Gold left-bar
  is the entire annotation vocabulary on the table; mono-uppercase
  tags are the only marker on scenario cards.
- Don't add a competing chromatic accent (blue, green, red, purple) for
  the cloud side. The cloud side is brown-gray neutral; that's how ember
  honesty reads visually.
- Don't render the SVG illustration with terminal chrome (traffic-light
  buttons, prompt cursors). Ember's illustration vocabulary is
  **printed paper**, not contemporary UI. A real product mock would
  force the page into apple-design's territory and break the journal
  voice.
- Don't put a CTA (`Download` / `Start`) inside the dark verdict band.
  The verdict is the editorial close; pushy buttons next to it
  retroactively read all the honest copy as marketing.
- Don't use italic anywhere besides the three earned moments
  (hero accent word, one section h2 accent word, verdict blockquote).
  A fourth italic = §J italic-overuse warning + drift away from "italic
  as accent."
- Don't run more than 9 table rows. Past that, the editorial pacing
  collapses into a spec sheet — and the gold-bar rhythm becomes too
  busy to read.
- Don't drop the IBM Plex Mono eyebrow + gold hairline rhythm on any
  section. That cadence is one of ember's two signature moves; one
  silent section breaks the brand-presence the page depends on.

## When NOT to use this canonical as a template

- **Three-way+ comparisons** — the 1:1 pillar spine and 9-row table
  don't extend cleanly. For three-way, use the pricing canonical's
  3-card grid pattern as a starting structure.
- **Spec-sheet style "20 features, our side wins 19"** — this canonical
  requires both sides to have **genuine** wins. A lopsided table reads
  as propaganda regardless of typography.
- **Fast-moving consumer products** (TikTok-pace launches, flash-sale
  retail, weekly drops) — ember's slow rhythm makes them feel
  underpowered. Pick apple for fast consumer, anthropic for developer
  tooling.
- **Dark-mode UI comparisons** — ember has no dark mode (per
  `dos-and-donts.md`); a dark-mode UI comparison would force ember
  into territory it can't authentically render.

## Extensibility: porting this template

### To another ember-voice comparison

Copy `comparison.html`, keep the structure, swap:
- Nav brand, page title, hero eyebrow + headline (italic on **one**
  word at the end)
- SVG: two paper-spread pages with labels appropriate to the new
  comparison; keep cream-gradient frame
- Pillar kicker / title / claim / 4 bullets per side (gold top-border
  for your side, brown-gray for theirs)
- Table 9 rows (gold `cell-win` on rows your side wins, blank on rows
  you concede; pick 3 rows where you don't win)
- 3 scenario cards (gold-tint / brown-tint / tan-tint tags)
- Verdict quote on chocolate band (Fraunces italic 40px, one cite)
- 1 hero italic accent word + 1 section h2 italic accent word — **stop**
  there

### Relationship to the anthropic + apple comparison canonicals

Three comparison canonicals share the same information architecture:
hero → divergence illustration → 2-column pillar spine → comparison
table → 3 scenarios → verdict → CTA. They differ in **every visual
surface**:

| Surface | anthropic | apple | ember |
|---|---|---|---|
| Hero | 4-line stacked Poppins + Lora subhead | 4-line stacked SF Pro Display + SF Pro Text subhead | 4-line stacked Fraunces + Inter subhead, mono eyebrow |
| Accent | orange `#d97757` | blue `#0071E3` | gold `#c49464` |
| Illustration | abstract arrow-flow diagram | two product-window mocks | two paper-spread pages |
| Pillars | bordered cards, top-border colour | text columns with vertical hairline, no cards | bordered cream cards, top-border colour |
| Table wins | orange left-bar | blue ● + em-dash | gold left-bar |
| Scenarios | 3-col grid, tag-pill colours | stacked full-width, hairline rules | 3-col grid, tag-pill colours |
| Verdict | Lora italic pull-quote card | black band, 40px SF Pro Display | chocolate band, 40px Fraunces italic |
| Italic | reserved (Lora-italic only on verdict + table dimension caps) | none (apple §J strict no-italic) | three earned moments only |

Same skeleton, same honesty contract — three voices.

## Verified

Rendered at 1440 × 6058px. Passes all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | **weighted 94.8 / 100** (95 / 95 / 94 / 95, weights 25/25/20/30) |

**Multi-critic fixes applied before shipping** (2026-04-27):

1. **Token discipline** — `.verdict-band` `background: #312520` → `var(--ember-text)` (same hex, but pulls from token instead of inline literal).
2. **SVG source-side font floor** — 9 small text nodes (seal `SAME`/`IDEA` at 9.5px, four corner status strips at 10px, three metadata captions at 10.5px) bumped to 11px source-side. Rendered values were all ≥ 9px so visual-audit §E.2 passed initially; the bump is defensive against future SVG shrink (mobile, sidebar embed) when a 9.5px source would render below the floor.
3. **zh italic position parity with EN** — hero accent moved from `两本<em>笔记本</em>` (italic on the noun) to `选<em>适合你的</em>那一本` (italic on the act of choosing) to mirror the EN hero's `Pick the one *that fits.*`. Section h2 zh `<em>缩小版</em>` removed entirely (zh stack neutralises italic anyway, and the sentence carries its own stress at sentence-end). zh italic visual stays roman (per §H Noto Serif SC `font-style:normal !important`), but the EN/zh emphasis-position parity is now correct for the rhetorical beat.
4. **zh "fortnight" tightening** — `两周之内的工作量，撑不出长期权衡。` → `两周内就用完的事，长期权衡撑不到那一天。`. Closer to the EN's "workload that won't outlive a fortnight" image, with ember warmth restored.

These were all info-level critic notes, not blockers — the page passed the four gates and scored ≥ 90 weighted before fixes. Fixes promote it from clean to careful.

SVG internal fills (`#c49464`, `#312520`, `#6b5a4f`, `#8a7564`, `#8a5a2c`) keep raw hex because SVG element attributes can't reference CSS custom properties; values match `var(--ember-gold)` / `var(--ember-text)` / page-scoped darker siblings of `--ember-text-secondary`. Documented for downstream ports.
