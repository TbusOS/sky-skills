# glass-design · landing canonical

What makes this a good glass-design landing page. Read BEFORE generating any
glass landing; the HTML twin is the reference implementation.

## 6 decisions that make this work

### 1. Light budget is front-loaded
Three blobs flank the hero (cyan top-left, violet right, pink far below the
fold) and nothing else glows. **Why**: light reads as expensive only when
scarce; a page glowing everywhere is exactly the AI-slop gradient page this
skill exists to refute. Pull-quote and CTA sit on plain navy so the hero
stays the brightest moment.

### 2. Hero copy on the canvas, product in the glass
The headline sits directly on the navy canvas; the console mock is the
page's Tier 1 `.glass-panel`. **Why**: glass is for content artifacts.
Wrapping the headline in a panel would demote the mock to "second glass"
and flatten the material hierarchy. R1 geometry holds — no blob core under
the copy column.

### 3. One tilt, one draw
`data-tilt` lives on the console mock only; `data-draw` on its chart line
and the pipeline diagram only. Cards get reveal + hover, nothing more.
**Why**: motion budget — one viewport, one signature move. When everything
dances, nothing does.

### 4. Brand = three solid cyan moves
Eyebrow kicker, nav CTA fill, 72px hairline. **Why**: aurora pixels blend
toward the canvas and never register at the brand matcher's tolerance;
solid elements give deterministic §K coverage and double as the page's
foreground color discipline (cyan and nothing else).

### 5. Markup is the terminal state
Stat strip numbers are written in full in the markup; `data-count-to`
mirrors them and JS animates 0 → N then restores the original text.
**Why**: the freeze contract makes the static markup the canonical render —
gates, no-JS readers, and screenshot determinism all see true numbers.

### 6. The diagram argues what the prose argues
In the 4-stage pipeline, only QUERY gets `.glass-svg-node-strong` (cyan
stroke). **Why**: the page's argument is the 38ms query path; one strong
node among four equals the prose's emphasis and stays inside the ≤3-glow
budget.

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Eyebrow | JetBrains Mono | 12px | 600 upper ls .16em `--glass-accent-ink` |
| Hero h1 | Space Grotesk | 76px | 700 ls -0.02em |
| Lead | Inter | 20px | 400 `--glass-ink-2` |
| h2 section | Space Grotesk | 48px | 600 |
| Stat number | Space Grotesk | 72px | 700 tabular-nums |
| Card h3 | Space Grotesk | 25px | 600 |
| Card body | Inter | 15px | 400 |
| Pull-quote | Space Grotesk | 40px | 500 roman (zero italic) |
| Mock/diagram labels | per diagram-craft | ≥11px source | — |

## Colour rules

- Foreground accent: solid `#22D3EE` only (eyebrow, buttons, hairline,
  chart line, glow nodes). Text-accent via `--glass-accent-ink`.
- Indigo `#4F46E5` is chart-second-series duty only (deploy marker).
- Violet/pink exist only as blobs. Sections alternate `--glass-bg` /
  `--glass-bg-2`; CTA panel is Tier 1 glass.
- The chart area fill is the ONE permitted gradient (cyan→transparent,
  "light falling on data"). No other gradient fills anywhere.

## Don't

- No blob behind the feature-card grid or quote band (light budget).
- No tilt on cards; no draw on decorative glyphs.
- No white text on the cyan button (`--glass-button-ink` is law).
- No italic anywhere — Space Grotesk has no italic cut; hierarchy is
  size/weight/spacing.
- No hardcoded zh font stack overrides — glass.css §H rules already map
  zh to Noto Sans SC.

## When not to use this canonical

- Long-form documentation site → sage / anthropic.
- Print/PDF deliverable → any light skill (backdrop-filter won't print).
- A "calm corporate trust" landing → apple (glass reads as launch-night,
  not annual-report).

## Status

Version: v1 · 2026-06-11
Passes: verify + visual-audit (dark & light) + screenshot, deterministic
double-shot. Critic pass pending first full loop.
