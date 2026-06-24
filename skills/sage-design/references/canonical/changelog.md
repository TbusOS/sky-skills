# Canonical · sage-design changelog

> What makes this a good sage-design changelog page. Read this **before**
> generating a new sage-design changelog — don't just copy-paste the HTML.
> A changelog is the page where a product proves it keeps its word: the
> reader wants "what is newest", "can I rely on the cadence", and "what
> exactly changed" — in that order, in plain words, on one quiet rail.

Half-reference, half-critic-rubric. Generator reads for patterns; critic
reads for acceptance criteria; planner reads for sprint contract.

---

## The 7 decisions that make this work

### 1. One hairline rail IS the time axis

`.feed::before` draws a single 1px vertical line (`background:
var(--sage-divider)` = `#e5e8da`) at `left: 8px`, running the full feed.
Releases are white cards (`border: 1px solid var(--sage-divider)`,
`border-radius: 4px`) hung off it at `margin-left: 44px`. Month labels
(`.feed-month .m-lbl`, JetBrains Mono 11.5px 600 uppercase) connect to
the rail with a 22px horizontal tick in `#c9d6a8`.

**Why**: a changelog is read top-to-bottom, newest first. The sage
hairline grammar makes the time axis literal — the divider IS the
timeline. A two-column zigzag doubles eye travel for zero information.

### 2. Release weight encoded on the rail, not in colour

Minor releases get a 9px filled dot in `var(--sage-ink)` (`.release::before`);
patches get a 7px hollow dot — white fill, `1.5px solid
var(--sage-text-secondary)` (`.release--patch::before`). Same encoding in
the cadence SVG: tall ink stems (`#393C54`, stroke 1.4) for minors, short
grey stems (`#6d6f82`) with hollow 5.5px circles for patches.

**Why**: filled-vs-hollow survives black-and-white print and says
"features vs fixes" without spending any accent colour.

### 3. Exactly one green-edged card: the latest release

`.release--latest` is the page's ONLY green-bordered card: `border: 1.5px
solid var(--sage-sage)` (`#97B077`), sage dot on the rail, plus a
`.chg-chip--latest` chip (`#f0f3e2` bg, sage border). The cadence SVG
echoes it once: v3.6 gets the only sage stem (stroke 1.8) and a
sage-edged label flag.

**Why**: "what is newest" is the one question every changelog visitor
brings. The green-single-focus budget answers it; green on every card or
chip would spend the budget eight times over.

### 4. Change types as a tint / ink / hairline chip triad

`.chg-chip` is JetBrains Mono 10.5px 600 uppercase, `letter-spacing:
0.12em`, 3px radius, in a fixed `92px 1fr` grid column:
- `--added`: pale-sage tint `#d4e1b8` + ink text.
- `--fixed`: ink fill `var(--sage-ink)` + white text.
- `--changed`: white + 1px `var(--sage-divider)` + secondary grey.

**Why**: green/red/orange chips are off-palette and read as another
skill's page. The triad stays distinguishable in greyscale and keeps
sage's quiet grammar — hierarchy from fill weight, not hue.

### 5. Cadence before feed: the trust section comes first

Section 01 (cream band `#f0f3e2`) opens with a release-train SVG
(viewBox `0 0 1120 248`: months JAN–JUN on a 1px axis, stems per
release) and a `.giant-stats` strip — Instrument Serif 76px numbers over
Inter 14.5px labels: **8** releases since January, **21** days median
gap, **0** breaking changes since v3.0, **3** people who write every
entry by hand.

**Why**: eight entries answer "what changed" but not "can I rely on the
cadence". The train plus the 21-day median answers the trust question in
one screen, before ~2400px of feed.

### 6. Versioning drawn as a register diagram, not semver prose

Section 03 uses the 2-col `.craft-grid` with an SVG of `3 · 6 · 1` as
three bitfield boxes. Only the MINOR field is highlighted: `#f0f3e2`
fill, `1.5px` `#97B077` stroke, 4px sage top bar — "features ship here,
every ~3 weeks, nothing breaks". MAJOR and PATCH stay white + hairline.

**Why**: semver in prose is a wall of conditionals; the bitfield shows
which digit moves and what it promises at a glance, reusing an existing
sage diagram grammar.

### 7. Entries written like lab notes, sealed by one earned italic

`.chg-text` is Inter 15.5px / 1.6 stating concrete behaviour ("Opening
it takes 12 ms on a five-year-old laptop", "A4 now gets its own
geometry"). The hero microcopy is mono uppercase: "RELEASES ONLY · NO
MARKETING · UNSUBSCRIBE ANY TIME". The page's only italic block is the
dark pull-quote band (`background: var(--sage-ink)`, Instrument Serif
italic 38px) — "the sentence is part of the change" — cite in `#97B077`
with a 20px sage hairline prefix.

**Why**: a changelog in marketing voice destroys the very trust it
exists to build. Plain claims are falsifiable; the single italic quote
states the editorial policy instead of decorating it.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Sect marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 88px | 400 | normal (italic on "and why.") |
| h2 section | Instrument Serif | 44px (`--sm`) | 400 | normal (italic on one accent) |
| Hero lead | Inter | 21px | 400 | normal, `line-height:1.55` |
| Month label | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| Version badge | JetBrains Mono | 12.5px | 600, ink bg, white text | normal |
| Release date | JetBrains Mono | 11.5px | 400, `letter-spacing:0.08em` | normal |
| Release title | Instrument Serif | 27px | 400 | normal |
| Change chip | JetBrains Mono upper | 10.5px | 600, `letter-spacing:0.12em` | normal |
| Change text | Inter | 15.5px | 400 | normal, `line-height:1.6` |
| Giant stat | Instrument Serif | 76px | 400 | normal |
| Pull quote | Instrument Serif | 38px | 400 | italic (earned) |
| Figcaption | Inter | 13.5px | 400 | normal |
| kbd (feeds) | JetBrains Mono | 13px | 600 | normal |

Instrument Serif display only; Inter body; JetBrains Mono for markers,
badges, dates, chips. No Fraunces / Lora / Poppins / SF Pro.

---

## Colour rules

- Sage `#97B077` only on the latest-release narrative: `.release--latest`
  border + rail dot, the SVG's v3.6 stem/flag, the v3.3 figure's "after"
  page edge, the pull-quote cite hairline.
- Deep indigo `#393C54` on: minor-release rail dots, version badges,
  `--fixed` chip fill, SVG minor stems, dark pull-quote band, headings.
- Cream bands alternate: page bg `#f8faec`, section 01 `#f0f3e2`,
  section 03 `#fafbf0`; fig-cards inside releases sit on `#fafbf0`.
- Pale sage `#d4e1b8` only on `--added` chips (and the nav band tint).

## Don't

- Don't colour-code change chips green/red/blue — the tint/ink/hairline
  triad is the sage encoding; saturated chips read as another skill.
- Don't put a sage border on more than one release card — the green
  budget is one card (the latest), full stop.
- Don't write entries in marketing voice ("exciting", "supercharged",
  "we're thrilled") — every line states what changed, measurably.
- Don't open with the feed — the cadence section (train + stats) must
  answer the trust question before the entry list starts.
- Don't zigzag the timeline into two columns — one rail, one direction.
- Don't italicize release titles or month labels — italic is spent once,
  on the pull quote.

## When not to use this canonical

- Release notes for a fast consumer app shipping daily — the 21-day
  rhythm framing and library quiet undersell velocity; use anthropic or
  apple voice.
- A changelog that is mostly screenshots of UI — sage carries schematic
  SVG figures, not photography; use apple instead.
- API-only changelogs organised by endpoint rather than by release —
  the rail assumes release-train time; a reference-table layout fits
  better.

## Status
- **Version**: v1 · 2026-06-13
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot
  review.
