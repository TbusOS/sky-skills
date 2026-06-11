# glass-design · diagram-gallery canonical

The flagship page of the skill: it exists to prove that engineering diagrams
can live ON the glass, in the page's own material, across both themes.
Read BEFORE generating any glass diagram-heavy page.

## 6 decisions that make this work

### 1. Featured first, atlas second
One full-width architecture panel, then a 2-col grid of six. **Why**: §I —
the platform architecture is the hero content that explains all the others;
a uniform grid of seven equal tiles hides it.

### 2. Two columns, not three
Gallery diagrams render ≈580px each. **Why**: at 3-col (≈380px) the 11px
source labels approach the 9px render floor and sequence/timeline genres
become postage stamps. Diagram legibility is the page's entire argument.

### 3. Same-material doctrine
Node fill = `--glass-panel-bg` (via `.glass-svg-node`), strokes = border
token, labels = `.glass-svg-ink*`. **Why**: a diagram pasted from another
style reads as a sticker on the glass; reusing the page tokens makes the
diagram feel embedded in it — and survives the light-theme audit untouched.

### 4. Genre spread is the proof
flow / sequence / state machine / timeline / wire format / build pipeline.
**Why**: an engineering audience needs evidence the language handles
low-level content (bit fields, state machines), not just marketing arrows.

### 5. Draw budget: featured only
`data-draw` on the architecture panel; the six atlas cards are static.
**Why**: seven simultaneous path-draws is a carnival; one is a statement.

### 6. The craft band teaches the system
Three numbered rules close the page (same material / cyan is a verb /
theme-proof ink). **Why**: this canonical doubles as the skill's diagram
showcase — stating the rules in-page turns it into a copyable system.

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Atlas kicker | JetBrains Mono | 11px | 600 upper ls .14em `--glass-ink-3` |
| Diagram node title | Inter (SVG) | 13–15px source | 600 `.glass-svg-ink` |
| Diagram annotation | Inter (SVG) | 11.5–12px source | 400 `.glass-svg-ink-2` |
| Diagram meta/caps row | JetBrains Mono (SVG) | 11–12px source | 400 `.glass-svg-ink-3` |
| Stage labels | JetBrains Mono | 12px ls 2 | `.glass-svg-ink-3` |
| Craft rule h3 | Space Grotesk | 17px | 600 |
| Everything else | per typography.md | — | — |

## Colour rules

- Cyan budget per diagram: ≤3 elements (flow lines+dots count as the flow,
  one `.glass-svg-node-strong` focus, one LIVE marker).
- `diagram-monochrome` applies to glass: zero hues = missing cyan focus.
- No violet/pink inside any diagram, ever. Indigo only as a chart second
  series (not used on this page).
- Gallery section sits on `--glass-bg-2` to separate it from the featured
  panel's section without adding light.

## Don't

- Don't render diagrams at 3-col widths; don't shrink fonts to fit (split
  the figure or upgrade the container instead).
- Don't hardcode white SVG ink — `.glass-svg-*` classes or the light theme
  erases your labels.
- Don't give every card `data-draw`; don't tilt diagram cards at all.
- Don't caption with "Figure N" — captions state the takeaway.
- SVG-internal labels and the genre kicker words stay English (engineering
  vocabulary); bilingualism is carried by the `<figcaption>` pair. Don't
  translate inside the SVG.
- Cyan TEXT inside SVGs goes through `.glass-svg-accent-ink`, never a literal
  fill — the light theme kills literal cyan text (known-bugs 6.4).

## When not to use this canonical

- A page with one or two diagrams embedded in prose → data-report canonical.
- Live data visualization → dashboard canonical (charts, not diagrams).
- A diagram set for print/PDF → light skills; glass doesn't print.

## Status

Version: v1 · 2026-06-11
Passes: verify + visual-audit (dark & light, 0 errors 0 warnings) +
screenshot. Critic pass pending first full loop.
