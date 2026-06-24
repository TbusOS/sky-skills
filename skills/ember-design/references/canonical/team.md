# Canonical · ember-design team

> What makes this a good ember-design team page. Read this **before**
> generating a new ember-design team page — don't just copy-paste the HTML.

---

## The 7 decisions that make this work

### 1. Two-tier member grid: the three, then the six

One `.member-grid` (`repeat(3, 1fr)`, gap `var(--space-6)`) used twice,
separated by `.member-group-label` rows (48px gold hairline + mono
eyebrow "The three — full-time" / "Friends of the house"). Lead cards
(`.member-card--lead`) get `var(--space-7)` padding, a 112px avatar and
a 26px name; the six get `var(--space-6)`, 88px and 22px.

An equal 9-card grid would contradict the page's own claim ("Three of
us sign every release") and hide real weight differences — §I calls
that a layout smell. The hierarchy is carried structurally, not in a
footnote.

### 2. Geometric SVG portraits, one gold detail each

Every avatar is a hand-drawn `<svg viewBox="0 0 120 120">` with
`role="img"` and a descriptive `aria-label`: cream `#fbeedd` square,
shoulders/hair in warm browns (`#492d22`, `#6b5a4f`, `#8a7564`,
`#312520`), white face circle — and exactly **one** `#c49464` accent
per person (Mara's earring, Tomas's collar pin, Rei's hairpin, Camille's
gold glasses, Lena's scarf).

Photos are forbidden by ember's don'ts; initial-letter discs read as an
unfinished fallback. Geometric portraits keep every stroke inside the
palette, give each person a recognizable silhouette (bob, bun, flat
cap), and survive grayscale print.

### 3. Roles are city · craft, set in mono

`.member-loc` is IBM Plex Mono 11px uppercase, `letter-spacing:0.14em`,
warm gray `#8a7564`: "Berlin · Design & type", "Kyoto · Editor core".
No job titles ("Senior Staff Engineer"), no departments — the label
names a place and a craft, which is the workshop voice. The same class
labels the open seat ("Open seat · 2026"), so hiring speaks the same
typographic register as the people.

### 4. "The day travels west" — a timeline, not a map

The how-we-work figure is one `viewBox="0 0 960 300"` SVG: `#fbeedd`
group container with `#e6d9bf` border, mono label `ONE DAY · THREE
CITIES`, hairline hour grid every 6h, three city lanes with `#f5e5c8`
tint working blocks (09:00–17:00 local mapped to UTC), and a **single
gold path** (`#c49464`, stroke 1.8, arrow marker) stepping down through
the lanes with numbered gold badges at the 07:00 and 13:00 handoffs.

"How a distributed team works" is time-evolution content — the
diagram-density contract maps it to a timeline. A world map with pins
shows where people sit but not how the day passes hands. The one gold
path is ember's single-narrative grammar; everything else recedes into
warm ink.

### 5. Stats requantified for this page: 9 / 3 / 0 / 1

`.giant-stats` is a 4-column grid with 1px `rgba(73,45,34,0.12)`
hairline dividers; `.giant-num` is Fraunces **roman** 76px (same as the
landing strip — note the changelog's stat numerals are italic; this
page deliberately matches landing instead). The numbers are
team-specific: 9 people, 3 cities, 0 managers · investors · open
offices, 1 hire planned at most.

Same component, new facts — reusing the landing's product stats here
would re-advertise instead of quantifying the team page's own claims
(who, where, how managed, how fast it grows).

### 6. Bios are one checkable sentence

Every `.member-bio` is one Inter 15px sentence stating something a
reader could verify: "Wrote the sync engine twice", "Runs the six-month
audit and publishes every finding — fixed or not", "under a second — on
a ten-year-old laptop". No adjectives about passion, no LinkedIn
summary. The bios extend the landing's accountability voice to people.

### 7. Hiring is one named seat, not a jobs board

The join section says "About one person a year, sometimes none" and
shows exactly one `.seat-card` (white, 620px max-width, left-aligned
inside a centered section) with concrete conditions: Berlin or
EU-remote, four days a week, paid trial week. CTA is a mailto button +
one `.ember-link`.

A "see all open roles" board link is SaaS voice and would contradict
the `0 managers / 1 hire` stat two screens earlier. One named seat
keeps the page honest and checkable.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow | IBM Plex Mono upper | 11.5px | 400, `letter-spacing:0.18em` | normal |
| h1 hero | Fraunces | 84px | 400 | normal (one `<em>` accent) |
| h2 section | Fraunces | 56px (48px `--md`) | 400 | normal (one `<em>` accent) |
| Lead paragraph | Inter (`.ember-lead`) | 19-21px | 400 | normal, `line-height:1.55` |
| Member name (lead) | Fraunces | 26px | 500 | normal |
| Member name (friend) | Fraunces | 22px | 500 | normal |
| Role label / seat meta | IBM Plex Mono upper | 11px | 400, `letter-spacing:0.14em` | normal |
| Member bio | Inter | 15px | 400 | normal, `line-height:1.6` |
| Stat number | Fraunces | 76px | 400 | normal (roman, like landing) |
| Stat label | Inter | 14.5px | 400 | normal |
| House-rule title | Fraunces | 26px | 500 | normal |
| House-rule body | Inter | 16px | 400 | normal, `line-height:1.65` |
| Pull quote | Fraunces | 38px | 400 | italic (earned) |
| Cite | Inter | 15px | 400 | normal, `#d9b892` on dark |
| Figcaption | Inter | 13.5px | 400 | normal, `#8a7564` |
| Seat card h3 | Fraunces | 24px | 500 | normal |

Italic only on: the pull quote, one hero accent word ("the notebook."),
one accent word per section h2. Member names, feat titles and bios stay
roman — nine italic names in a grid would be §J wallpaper.

---

## Colour rules

Gold `#c49464` on: section hairlines (1px × 48px), one detail per
avatar, the handoff path + numbered badges + arrow marker in the
timeline, house-rule icon strokes (1.8) on `rgba(196,148,100,0.14)`
discs, the 20px tick before the cite. Lighter gold `#d9b892` for the
cite text on dark. Chocolate `#312520` on: primary text, dark
pull-quote band, hero `<em>`, avatar ink; `#492d22` in avatar hair and
the `rgba(73,45,34,0.12)` card borders. Warm gray `#8a7564` on:
eyebrows, role labels, figcaption, lane sublabels and all mechanism
text inside the SVG. Cream `#fff2df` page bg; `#fbeedd` on alt bands
(stats, house rules), avatar squares and the SVG group container;
`#f5e5c8` for working-block tints; `#e6d9bf` hairlines.

## Don't

- Don't use photos or photo placeholders — geometric SVG portraits in
  palette ink, or nothing. Stock-photo grids are the team-page cliché.
- Don't flatten everyone into one equal grid — the 3 + 6 tiers carry
  the worldview; equal cards say "we're interchangeable headcount".
- Don't give an avatar more than one gold detail — gold is spent once
  per portrait, same discipline as everywhere else in ember.
- Don't draw a world map with location pins — distributed work is time
  content; the timeline with one gold handoff path answers "how".
- Don't link to a jobs board or list multiple openings — one named
  seat with concrete conditions, or no hiring section at all.
- Don't write bios in praise voice ("passionate about…") — one roman
  sentence per person with a fact a reader could check.

## When not to use this canonical

- Teams past ~15 people — per-person portraits, one-sentence bios and
  the 3-lane timeline stop scaling; use apple's compact directory.
- Corporate leadership pages that need real photographs and formal
  titles — geometric avatars read as workshop-playful; use apple or
  anthropic.
- Single-founder or narrative about pages — the member grid assumes a
  cast; a prose-first editorial layout fits better than this structure.

## Status
- **Version**: v1 · 2026-06-13
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot review
