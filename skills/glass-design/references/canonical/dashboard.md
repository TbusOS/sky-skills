# glass-design · dashboard canonical

What makes this a good glass-design dashboard (Prism's production console).
Read BEFORE generating any glass dashboard; the HTML twin is the reference
implementation.

## 7 decisions that make this work

### 1. Calm light: two blobs, cores off-canvas
The page declares `glass-page--calm` (blob opacity ×0.55) and ships only two
blobs — cyan top-right, indigo bottom-left — with their cores pushed outside
the viewport corners. **Why**: a console is read for numbers, not spectacle.
Light must yield to data, and R1 geometry forbids any blob core under the
KPI/panel grid, which on a dashboard covers nearly the whole page.

### 2. Chrome shorter than the data
A 40px h1 (not the 76px launch size), a mono timestamp with a LIVE badge,
and a decorative segmented range control — all in one compact row. **Why**:
a dashboard is a tool you return to hourly. The first row of KPIs must
arrive before the first scroll; a launch-page hero would push data below
the fold.

### 3. Markup is the terminal state
The four KPI finals (`2.42M`, `38ms`, `99.99%`, `3`) are written in the
markup; `data-count-to` mirrors them and JS animates 0 → N then restores
the original text. **Why**: the freeze contract makes static markup the
canonical render — gates, no-JS readers and deterministic screenshots all
see true values.

### 4. Delta color is judgment, glyph is direction
`--glass-stat-delta--up` (green) marks good news even when the number falls
(▼ 2.1ms latency); `--down` (red) is reserved for the one KPI that needs
eyes (active alerts +2). **Why**: on an ops console color answers "is this
fine?" before the reader parses the arrow; red is rationed to genuine
trouble.

### 5. One draw, zero tilt
`data-draw` lives on the throughput chart only; gauge, bars and table are
fully static, and nothing tilts. **Why**: motion is punctuation. One draw
marks the Tier 1 figure; tilt is launch-page language, not ops language.

### 6. Cyan is data, indigo is context
Every chart has exactly one data hue (cyan). Indigo `#4F46E5` does
reference duty only: yesterday's dashed baseline, the deploy marker, the
48ms SLO ceiling. **Why**: when reference geometry shares the data's hue,
the eye can't find "now" — and a second brand color would dilute the
one-accent discipline.

### 7. Red rows are verdicts, not decoration
Two `err 503` rows in the event tail are inked `--glass-down` (text only,
no background fill); the bar chart's one breach value (`51`) pops outside
its bar in the same red while in-range values sit inside the bars in
`--glass-button-ink`. **Why**: failure must be findable in one saccade
without turning the tail into a christmas tree.

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Eyebrow | JetBrains Mono | 12px | 600 upper ls .16em `--glass-accent-ink` |
| Console h1 | Space Grotesk | 40px | 700 ls -0.015em |
| Timestamp / meta | JetBrains Mono | 12px | 400 `--glass-ink-3` |
| Segmented control | JetBrains Mono | 11px | 600 upper |
| KPI number | Space Grotesk | 64px | 700 tabular-nums |
| KPI label | Inter | 14px | 400 `--glass-ink-2` |
| KPI delta | JetBrains Mono | 13px | 600 `--glass-up`/`--glass-down` |
| Panel h2 | Space Grotesk | 20px | 600 |
| Panel meta | JetBrains Mono | 11px | 400 upper ls .1em `--glass-ink-3` |
| Table header | JetBrains Mono | 12px | 600 upper (glass-table default) |
| Table cells | JetBrains Mono | 13px | 400 (page override — event tails are code) |
| Chart/axis labels | JetBrains Mono | ≥11px source | — |

## Colour rules

- Foreground accent: solid `#22D3EE` only (nav CTA, LIVE badge, active
  range chip, chart line + end dot, gauge arc, bars, footer status dot).
  Accent as text goes through `--glass-accent-ink` (the chart's NOW and
  2.42M labels use `class="glass-svg-accent-ink"`).
- The chart's area fill is the ONE permitted gradient
  (cyan→transparent, "light falling on data").
- Indigo `#4F46E5` = reference geometry only; indigo TEXT labels route through `.glass-svg-ref-ink` (dark #818CF8 / light #4F46E5) (baseline, deploy marker,
  SLO ceiling). Never a second data series color unless the chart truly
  compares two series.
- Red/green only via `--glass-up` / `--glass-down` tokens, only as
  verdicts (deltas, err rows, breach value). They theme-swap; literals
  would fail the light run.
- Values printed on cyan bars use `--glass-button-ink` — the same
  "dark ink on cyan" recipe as buttons.
- SVG ink/nodes/lines go through `.glass-svg-*` classes or
  `style="fill:var(--glass-*)"`; only cyan and indigo stay literal.

## Don't

- No third blob, and no blob behind the panel grid — calm pages dim the
  aurora and a console is one big text panel.
- No 72-96px stat numerals in a 4-up row: 64px is the ceiling that fits
  `99.99%` at 1440 (KPI cards drop to 24px padding for the same reason).
- No tilt anywhere; no draw on gauge or bars — one draw per dashboard.
- No value labels floating where reference lines run: in-range values sit
  inside their bars; only the breach value earns the outside-red position.
- No 3D pies — the gauge is a stroked arc on a `--glass-line` track.
- No five-column footer — a console footer is one line.
- No italic, ever (Space Grotesk has no italic cut).
- No half-width ，；： inside lang-zh spans (verify hard-fails it).

## When not to use this canonical

- Marketing or launch page for a data product → glass landing canonical
  (hero light field, 76px display, tilt on the mock).
- Long-form analysis with prose between charts → glass data-report
  (narrow prose column; this page has no reading column at all).
- Print/export of a status report → any light skill; backdrop-filter and
  the aurora don't survive the print pipeline.
- Accessibility-first internal tooling where blur is a liability →
  apple/sage with solid surfaces.

## Status

Version: v1 · 2026-06-11
Passes: verify + visual-audit (dark & light, 0 error 0 warn) + screenshot;
zh variant visually checked. Critic pass pending first full loop.
