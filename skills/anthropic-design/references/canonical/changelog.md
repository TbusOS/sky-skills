# Canonical · anthropic-design changelog

> What makes this a good anthropic-design changelog page. Read this **before**
> generating a new anthropic-design changelog page.

---

## The 7 decisions that make this work

### 1. The hero sells one conversion: the subscription

Kicker badge "Changelog" + a three-line stacked noun-phrase headline
(`Every release.` / `What changed, and why.` / `In plain words.`) + ONE
filled orange `.anth-button` ("Subscribe to updates") with the RSS link
demoted to an `.anth-link`. A changelog has exactly one call to action —
"keep me posted" — so it gets exactly one filled button above the fold.
The small print under the buttons ("No breaking changes since v2.0")
is the trust marker, not a second CTA.

### 2. One synoptic cadence timeline before any entry

A full-width (`anth-container--wide`) SVG timeline on a white dot-grid
panel: feature releases as solid orange dots **above** the axis, patch
releases as smaller solid gold dots **below**, planned items as hollow
circles, plus a dashed orange "today" marker.

The question a changelog answers before a single entry is read is
"do these people actually ship". Seven solid dots across four months
answer it in one glance. Above/below the axis doubles as the type
legend — the eye separates features from patches without reading.
The honest emptiness of Jul–Nov (two hollow dots) is deliberate:
planned, not promised.

### 3. Left meta rail + hairline separators — no dot rail

Each entry is `grid-template-columns: 132px 1fr` (layout-patterns §L8):
version pill + date in the left column, content on the right,
`border-top: 1px solid var(--anth-light-gray)` between entries. Months
are small uppercase h2 chapter marks (13px Poppins 600, secondary
colour).

The date column scanned top-to-bottom IS the vertical time axis.
A decorated left rail (vertical line + dots) adds chrome that competes
with the entries — anthropic separates with hairlines instead.

### 4. Version pills encode release type, mirroring the timeline

Feature releases get a solid orange pill (white text, like
`.anth-button`); patches get a gold-tint pill (`#f0e4d8` + `#7a4b20`
text). Same orange/gold split as the timeline dots — one colour grammar
across diagram and list, learned once.

### 5. Change-type chips = the diagram colour grammar applied to HTML

`Added / Changed / Fixed / Security / Removed` map to
green / blue / gold / orange / ink. Each chip is a 16-20% tint pill
(diagram-craft §1 container-tint column) + a **solid** 6px hue dot +
an 11px uppercase label. Five solid-fill chips per screen would blow
the 4-14% saturation budget; tint + solid dot keeps the chips in the
same family as the SVG figures.

**Label colours are deliberately one step darker** than diagram-craft's
"label 深色" column: `#4d5e34` (green) / `#3a5f87` (blue) / `#7a4b20`
(gold) / `#a4452a` (orange) / `#565449` (ink). The stock label colours
land at ≈4.3:1 on the 2026-06-11 deeper tints — under WCAG AA for 11px
text. Don't "correct" these back to the diagram table.

### 6. Two figures, placed by hierarchy, not symmetry

Only the headline release (v2.4.0 mobile) gets a product mock —
phone + laptop, each with its own `key ·` chip, an orange sync line
labelled "ciphertext only". One mid-list release (v2.2.0 attachments)
gets a 3-node encryption flow with a focus card and numbered badges —
it breaks the ~1800px text run before the text-desert threshold.
Patch entries get no figure. A screenshot per release would flatten
hierarchy and double page weight for notes nobody illustrates.

In-entry figures span both grid columns (`grid-column: 1 / -1`) and
carry inline `max-width + margin: 0 auto` — they are deliberately
entry-width (660px), not hero-width.

### 7. Entries are written notes with numbers, not commit logs

Every line states what changed and gives the measurement: "3 KB instead
of 18 KB", "0.4 s instead of 40 s", "report to release in 41 hours".
The lede (only on feature releases) is one or two sentences of Lora in
secondary colour. The stat strip echoes the landing's zero-stats
("0 breaking changes", "0 AI features added") — the product's
non-compromises restated as release discipline. The "How we ship"
section closes with three numbered rules so the cadence reads as
policy, not luck.

History is bounded: 7 entries across 4 months, then an archive link.
The changelog's job is cadence and recency; the full history is an
archive page, not this one.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Poppins | 56px | 600, `letter-spacing:-0.02em` |
| Hero subtitle | Lora | 19px | 400, `line-height:1.6` |
| Month heading (h2) | Poppins upper | 13px | 600, `letter-spacing:0.14em`, secondary |
| Version pill | Poppins | 12.5px | 600 |
| Date | Poppins | 14px | 500, secondary |
| Entry title (h3) | Poppins | 24px | 600, `letter-spacing:-0.01em` |
| Entry lede | Lora | 17px | 400, secondary, `line-height:1.65` |
| Change item body | Lora | 16px | 400, `line-height:1.65` |
| Type chip | Poppins upper | 11px | 600, `letter-spacing:0.08em` |
| Stat number | Poppins | 44px | 700, `letter-spacing:-0.02em` |
| Stat label | Poppins | 13px | 400 |
| Ship-rule title (h3) | Poppins | 19px | 600 |
| CTA button | Poppins | 15px | 600 |

---

## Colour rules

Orange `#d97757` only on: nav CTA, hero + footer subscribe buttons,
feature-release version pills, timeline feature dots + today marker,
sync line / SYNCED pill in the mock, flow-diagram focus card border +
numbered badges, ship-rule number circles. Patches are gold `#c9913f`,
never orange — orange marks features, the focus colour stays scarce.

Chip hues follow diagram-craft §1: green = added, blue = changed,
gold = fixed, orange = security, ink = removed. Tint backgrounds from
the container-tint column; dots solid main colour; labels one step
darker than the table (see decision 5).

## Don't

- Don't draw a left timeline rail with a vertical line and dots — L8:
  hairline top borders + the date column are the time axis.
- Don't fill chips with solid hues — five saturated pills per screen
  is a parrot, not a changelog.
- Don't give every release a screenshot — one mock for the headline
  release, one diagram mid-list, nothing for patches.
- Don't write "improvements and bug fixes" — every line carries the
  number it improved.
- Don't use emoji in entries (🎉/🚀) — the type chip already says
  what kind of change it is.
- Don't put the full release history on this page — bound it and link
  the archive.

## When not to use this canonical

- Launch announcement for a single big release — that's a blog post /
  feature-deep page with room for argument, not a list entry.
- API-versioning reference with migration tables — that's docs
  (docs-home canonical), where the reader needs lookup, not cadence.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py + visual-audit (0 error 0 warn with
  `--ignore-intentional`) + screenshot eyeball pass
