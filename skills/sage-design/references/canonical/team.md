# Canonical · sage-design team

> What makes this a good sage-design team page. Read this **before**
> generating a new sage-design team page — don't just copy-paste the HTML.
> The whole page argues one claim — "nine people who like it quiet" — and
> every layout choice (equal grid, head-count stats, dashed no-loop) is
> that claim restated in CSS.

---

## The 7 decisions that make this work

### 1. Hero: centered 96px serif + a mono fact line, no team photo

`.hero-headline`: Instrument Serif 96px roman, `line-height: 1.02`,
`letter-spacing: -0.022em`, italic on exactly ONE word
("…who like it _quiet._"). Below the Inter 22px lead sits a JetBrains
Mono 11.5px line: `BERLIN · TORONTO · KYOTO · BOOTSTRAPPED SINCE 2019`
(`letter-spacing: 0.12em`).

**Why**: `.sage-hero` centers the whole stack (headline, lead, mono fact
line on one axis) — the family pattern shared by landing, faq and
changelog. The mono fact line replaces the group-photo cliché with catalog
data — locations and founding year read like a library record.

### 2. Equal 3×3 member grid — no enlarged founder card

`.team-grid` is `repeat(3, 1fr)` with `gap: var(--space-6)`; all nine
`.member-card`s are identical (white bg, 1px `var(--sage-divider)`,
`border-radius: 4px`). Founders sit in the same cells as everyone else;
only the `.member-role` label ("Co-founder · Design") distinguishes them.

**Why**: the section h2 says "Everyone builds. Nobody manages." An
enlarged founder row would contradict the copy with layout. Here
equality IS the hierarchy.

### 3. Portraits are geometric SVGs sharing one armature, one sage accent each

Each `.member-avatar` (104×104px, `border-radius: 4px`) is an inline SVG,
`viewBox="0 0 120 120"`: tint ground `rect rx="10" fill="#f0f3e2"`,
shoulders path in `#c9d1b3` or `#393C54`, head `circle r="23"` white with
`stroke="#393C54" stroke-width="1.8"`. Each face gets **exactly one**
`#97B077` accessory — earring, collar triangle, hair bun, pendant, shirt
stripe, curl, cap, hairpin, scarf. (The accessory may carry one
darker-sage `#7a9561` detail — Tomás's cap brim — shading, not a second
accent.) Every SVG carries `role="img"` and a
descriptive `aria-label`.

**Why**: photos break sage's illustration-only identity; initials-in-circles
read as an empty state. A shared ink armature with a budgeted green accent
keeps nine faces individual but on one quiet system.

### 4. Roles and locations as mono catalog entries

`.member-role`: JetBrains Mono 10.5px, weight 600, uppercase,
`letter-spacing: 0.16em`, secondary color — ABOVE the Instrument Serif
26px roman `.member-name`. `.member-loc` closes the card: same mono
treatment plus a 6px sage `#97B077` dot drawn via `::before`.

**Why**: role-above-name mirrors the sect-marker-above-headline rhythm —
people are filed the way sections are. The sage dot is the card's only
color besides the portrait accent.

### 5. Stat strip owns head-count facts only: 9 / 3 / 0 / 1

On a `#f0f3e2` cream band: `.giant-stats`, 4 columns separated by
`border-left: 1px solid var(--sage-divider)`. `.giant-num` is Instrument
Serif 80px roman, `letter-spacing: -0.028em`. The numbers: 9 people,
3 founders still coding, 0 managers·investors·growth team, 1 product.

**Why**: user counts belong to the landing page. Head-count facts are the
only numbers a team page owns — and "0" and "1" turn restraint itself
into the statistic.

### 6. Decision-flow SVG with a diamond and a dashed "vault" return loop

The 03 section renders process as a 960×244 figure: four step cards plus
a "Still keen?" diamond (`fill="#f0f3e2" stroke="#97B077"`). The happy
path is `stroke="#97B077"` 1.8px with arrowheads; the "no" branch is a
**dashed** `#6d6f82` 1.2px loop (`stroke-dasharray="4 3"`) returning to
the vault, captioned "most do". Step badges are ink `#393C54` circles —
never green. Bilingual `figcaption` in Inter 13.5px.

**Why**: any 3+-step process gets a flow diagram, not prose. Routing
"no" back to the vault in a calm muted dash — not red — encodes the
team's core habit: rejection is a normal exit, not a failure state.

### 7. Hiring reuses the kbd-row syntax — location chips, hairline rows

`.craft-grid` (`1fr 1.2fr`): left a 44px `section-title--sm` + lead +
`.sage-button` mailto; right two `.kbd-row`s where the `<kbd>` chip
(JetBrains Mono 12px 600, white bg, 1px divider, `border-radius: 3px`)
holds the location — `BERLIN · REMOTE`, `ANYWHERE` — and the Inter 15.5px
tag holds the role. A `.sage-link` row closes it: "No opening that fits?
Write anyway."

**Why**: kbd-rows are an established sage signature; chip-plus-hairline
rhythm makes two openings feel deliberate. A two-row jobs table would
look abandoned.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Sect marker | JetBrains Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Instrument Serif | 96px | 400 | normal (italic on one word) |
| Hero lead | Inter | 22px | 400 | normal, `line-height:1.55` |
| Hero fact line | JetBrains Mono | 11.5px | 400, `letter-spacing:0.12em` | normal |
| Section h2 | Instrument Serif | 44–60px | 400 | normal (italic on accent) |
| Member role / location | JetBrains Mono upper | 10.5px | 600, `letter-spacing:0.14–0.16em` | normal |
| Member name | Instrument Serif | 26px | 400 | normal |
| Member bio | Inter | 14.5px | 400 | normal, `line-height:1.6` |
| Giant stat number | Instrument Serif | 80px | 400, `letter-spacing:-0.028em` | normal |
| Stat label | Inter | 14.5px | 400 | normal |
| Value card title | Instrument Serif | 28px | 400 | normal |
| Value card body | Inter | 16px | 400 | normal, `line-height:1.65` |
| Pull quote | Instrument Serif | 38px | 400 | italic (earned) |
| Quote cite | Inter | 15px | 400 | normal |
| kbd chip | JetBrains Mono | 12px | 600, `letter-spacing:0.08em` | normal |
| Figcaption | Inter | 13.5px | 400 | normal |

Chinese (§H): Instrument Serif → Noto Serif SC, Inter → Noto Sans SC,
with `font-style: normal !important` on zh headings — Chinese has no
italic tradition.

---

## Colour rules

- Sage green `#97B077`: one accent per portrait, member-location dots,
  happy-path arrows + decision diamond stroke, value-card icon strokes,
  quote cite + hairline on the dark band.
- Pale tint `#f0f3e2`: portrait grounds, stat-strip band, feat-icon
  tiles, diamond fill, the shipped step card. `#fafbf0` for the values
  band — two cream depths alternate the page rhythm.
- Deep indigo `#393C54` (`--sage-ink`): all display headings, portrait
  line work (head stroke, hair, eyes), flow-step badges, pull-quote
  band bg.
- Muted `#6d6f82`: the rejected-pitch dashed loop and SVG sublabels —
  the "no" path is calm, never red.

## Don't

- Don't use photos or initials for portraits — photos break the
  illustration-only identity; initials read as an empty-state pattern.
- Don't enlarge founder cards or add a founders-first row — the copy says
  "nobody manages"; an equal grid is that claim in layout.
- Don't give any portrait more than one sage accent — the single green
  budget per face is what keeps nine cards quiet instead of busy.
- Don't put vanity metrics (users, countries, funding) in the stat strip
  — head-count facts only; growth numbers belong to the landing.
- Don't color the rejected-pitch branch red or replace the flow SVG with
  prose — rejection drawn as a muted dashed loop IS the message.
- Don't italicize member names or headings wholesale (§J) — italic is
  spent on one hero word and the dark pull quote, nowhere else.

## When not to use this canonical

- Teams past ~15 people — the 3×3 equal grid stops scaling; grouped
  departments or a roster list fits better than four rows of cards.
- Brands built on real photography of people — sage is illustration-only;
  use apple-design instead.
- High-energy recruiting pages selling growth and velocity — sage reads
  "slow / academic / library," which would undercut the pitch.

## Status
- **Version**: v1 · 2026-06-13
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot
  review.
