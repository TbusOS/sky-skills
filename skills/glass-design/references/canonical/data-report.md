# glass-design · data-report canonical

What makes this a good glass-design data report. Read BEFORE generating any
glass data-report; the HTML twin (Prism Infrastructure Report · Q2 2026) is
the reference implementation.

## 7 decisions that make this work

### 1. Two blobs, both cores off the text
A calm report gets cyan top-right and indigo lower-left under
`glass-page--calm` — not the landing's three-blob hero field. **Why**: a
report is read top to bottom, not toured. Both blob cores sit outside every
text column at every scroll position (the aurora layer is fixed), so R1
holds for prose laid directly on the canvas, and the calm modifier keeps
light subordinate to data.

### 2. Prose on canvas, artifacts in glass
Body text lives in `glass-container--narrow` (720px) directly on the navy
canvas; only charts, the timeline, the table and the callout cards get
glass. **Why**: glass tiers mark content artifacts. Wrapping every
paragraph in a panel flattens the material hierarchy — the reader should
feel the page harden into glass exactly where there is evidence to hold.

### 3. Report-scale type
56px h1, 40px section h2 — both inside typography.md's binding ranges,
both below the landing's 76/48. **Why**: an infrastructure report is
editorial, not launch-night. The voice drops; the numbers carry.

### 4. Rose is a tick, never an area
The 23-minute degraded window is a 3px rose underline on the timeline plus
one small bordered badge (`--glass-down`). **Why**: up/down hues are delta
semantics, not fills (data-display.md). Shading the whole window rose would
read as alarm decoration and trip the saturated-band gate.

### 5. Both quarters in the bar chart
Q1 (indigo) stands behind Q2 (cyan) for all six regions. **Why**: the
section's claim is "every region got faster" — showing both quarters makes
the comparison verifiable instead of asserted. Indigo is the sanctioned
second series; no third hue exists.

### 6. A table where the answer is words
Capacity planning is a `.glass-table`, not a chart. **Why**: the
load-bearing column is the H2 plan — actions and dates. A headroom chart
would decorate the numbers while burying the decisions.

### 7. One draw, on the headline chart
`data-draw` lives on the traffic area chart only; the timeline and bars are
static; count-up runs on the three executive stats. **Why**: motion budget.
The quarter's headline number earns the page's one flourish; the incident
section stays sober.

## Structure (MUST)

nav (same as landing, Reports current) → report head (eyebrow
`Q2 2026 · INFRASTRUCTURE REPORT` + h1 + hairline + lead + mono metadata
line) → executive summary Tier 1 panel (3 inline count-up stats + deltas +
one-paragraph note) → §01 traffic (narrow prose + full-width area chart,
draw) → §02 latency (two-col: prose 5fr + grouped bars 7fr) → §03 incident
(narrow prose + full-width horizontal timeline + two peer callout cards) →
§04 capacity (narrow prose + full-width `.glass-table` in a panel) →
methodology footnote (mono label + 13px ink-3) → single-line footer.
Visual density: a figure/stat/table at least every 1.5 screens.

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Eyebrow | JetBrains Mono | 12px | 600 upper ls .16em `--glass-accent-ink` |
| Report h1 | Space Grotesk | 56px | 700 |
| Lead | Inter | 20px | 400 `--glass-ink-2` |
| Metadata line | JetBrains Mono | 11.5px | 400 upper ls .12em `--glass-ink-3` |
| Section h2 | Space Grotesk | 40px | 600 |
| Stat number | Space Grotesk | 64px | 700 tabular-nums |
| Delta badge | JetBrains Mono | 13px | 600 `--glass-up/--glass-down` |
| Body prose | Inter | 16px | 400, max narrow container or 68ch |
| Card h3 | Space Grotesk | 22px | 600 |
| Table head | JetBrains Mono | 12px | 600 upper ls .08em |
| Table numerics | JetBrains Mono | 13px | 400 tabular-nums (`.num`) |
| SVG labels | per diagram-craft | ≥11px source | — |
| Methodology | Inter | 13px | 400 `--glass-ink-3` |

## Colour rules

- Foreground accent stays solid cyan: eyebrows, hairlines, chart line,
  Q2 bars, timeline focus dots (≤3 per figure). Accent-as-text goes through
  `--glass-accent-ink` (the peak label does).
- Indigo `#4F46E5` = second series only: Q1 bars, the June 9 marker.
- `--glass-down` rose appears exactly four times (the tick band and its "23 MIN DEGRADED" label count as one annotation group, plus the fault dot and the impact badge) — timeline tick band,
  fault dot, impact badge — always as delta semantics, never as fill.
  `--glass-up` green carries the improvement deltas.
- The area chart's cyan→transparent fill is the one permitted gradient.
- SVG ink is all `.glass-svg-*` classes or `var(--glass-*)` inline — the
  light theme must keep every chart readable (this page's twin passes the
  audit in both themes).

## Don't

- No third blob, no violet/pink — a report's light budget is even tighter
  than the landing's.
- No tilt anywhere: tilt belongs to hero product mocks, and a report has
  none.
- No rose/green area fills; no rose band taller than a tick.
- No bilingual text inside the SVGs — figcaptions carry the zh takeaway;
  duplicated SVG text doubles overlap risk.
- No `glass-container--narrow` as hero; the report head sits in the
  default 1040 container.
- No italic, no hardcoded ink hex, no third gray (three ink tokens only).
- Don't bury the incident: the degraded minutes get a visible badge and a
  numbered section, not a footnote — honest reports are the genre.

## When not to use this canonical

- Live operational view with auto-refreshing numbers → dashboard canonical
  (a report is a frozen, versioned artifact).
- Marketing case study with a CTA arc → landing.
- Print/PDF quarterly letter → a light skill (backdrop-filter won't print).
- Genuinely formal compliance/audit reporting → glass reads as product
  voice, not assurance voice (SKILL.md §3).

## Status

Version: v1 · 2026-06-11
Passes: verify (0 err, 0 warn) + visual-audit dark & light (0 err, 0 warn)
+ screenshot both themes, reviewed by eye. Critic pass pending first full
loop.
