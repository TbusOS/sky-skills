# Canonical · ember-design changelog

> What makes this a good ember-design changelog page. Read this **before**
> generating a new ember-design changelog page.

---

## The 7 decisions that make this work

### 1. Entries are letters, not release notes

Every entry has a Fraunces title in the product's own voice ("The graph,
quieter." / "The rebind.") and one intro sentence written by a person —
"Two sync bugs, both reported by the same careful reader in Osaka.
Thank you, M." Only then comes the grouped change list.

**ember's changelog sells the same philosophy as its landing** (handcraft +
accountability). A bullet-only dump is SaaS housekeeping; it would
contradict the hero promise "one letter per release" one scroll later.

### 2. A literal time axis: meta column + hairline rail

Each entry is a 3-column grid: `200px` right-aligned meta (mono date
`06 · 04 · 2026` + version pill) → `56px` rail → white entry card.
The rail is a 1px `#e6d9bf` hairline running the full log, with gold
dots at majors, smaller hollow warm-gray dots at patches, and
gold-ringed ticks at month labels.

Time order is the one non-negotiable reading of a changelog — the rail
keeps the axis visible at every scroll position, and right-aligned mono
dates give the page a ledger rhythm.

### 3. Change-type chips encode category by ink, not hue

Chips are IBM Plex Mono 10.5px uppercase on warm tints; all text is
chocolate `#492d22` (contrast-safe). The category lives in the leading
dot's ink:

| Type | Dot ink | Chip bg |
|---|---|---|
| Added | gold `#c49464` | `rgba(196,148,100,0.18)` |
| Changed | chocolate `#492d22` | `#f5e5c8` |
| Fixed | warm gray `#8a7564` | `rgba(73,45,34,0.06)` |

Green/blue/red chips are the standard changelog cliché — and they're
anthropic's multi-hue language. ember has one accent: gold goes to
"added" (the celebration), everything else recedes into warm ink.
Grayscale-print test still passes (three distinct ink values).

### 4. Release-cadence timeline SVG directly under the hero

Before any scrolling, one figure answers "how often do they ship, did
anything break": a `#fbeedd` group container with a mono label
(`RELEASES · JANUARY — JUNE 2026`), a hairline axis with month ticks,
white-filled warm-ink dots for majors, smaller dots and 10.5px labels
for patches — and **gold spent once**, on the latest release (gold dot +
stem + tint `LATEST` chip with gold border).

This is the diagram-density contract's "time evolution / versions →
timeline" row, executed in ember's gold-single-focus grammar.

### 5. One window mock per chapter, not per entry

Only the biggest release (v3.2 search) gets an in-card SVG mock — paper
feel like the landing hero: cream surround, white window with warm
shadow, gold/tan/gray traffic dots, mono titlebar, and gold underlines
on the matched search terms (the mock's single gold narrative).

A mock in all seven entries would flatten hierarchy into a gallery.
One illustration marks the chapter; the cadence figure already
celebrates the latest release.

### 6. Stat strip measures cadence honesty, not vanity

Fraunces italic numerals (72px — the ember stat signature): **7**
releases this year, **25** days median gap, **0** breaking changes,
**41** fixes that began as reader letters. No downloads, no stars —
a changelog's credibility is rhythm and breakage, and "0 breaking
changes" is the number a returning reader actually checks.

### 7. Version pills separate majors from patches

Majors: solid chocolate pill, white mono text. Patches
(`v3.3.1`, `v3.1.2`): ghost pill — transparent, warm-gray text, hairline
border — matching their smaller rail dots and shorter cards. The visual
weight of the version badge predicts the length of the entry before you
read it.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow / month label | IBM Plex Mono upper | 11.5px | 600, `letter-spacing:0.18em` | normal |
| h1 hero | Fraunces | 84px | 400 | normal (italic on accent word) |
| Subtitle | Inter | 21px | 400 | normal, `line-height:1.55` |
| Section h2 | Fraunces | 48-56px | 400 | normal |
| Entry title (h3) | Fraunces | 26px | 500 | normal |
| Entry intro / list | Inter | 15-16px | 400 | normal, `line-height:1.6-1.65` |
| Date | IBM Plex Mono | 11.5px | 400, `letter-spacing:0.12em` | normal |
| Version pill | IBM Plex Mono | 12px | 600 | normal |
| Chip | IBM Plex Mono upper | 10.5px | 600, `letter-spacing:0.1em` | normal |
| Stat number | Fraunces | 72px | 400 | italic (earned — numerals) |
| Stat label | Inter | 14.5px | 400 | normal |
| Pull quote | Fraunces | 36px | 400 | italic (earned) |

Italic only on: stat numerals, pull-quote, one hero accent word, one
section-h2 accent word. Entry titles stay roman — seven italic h3s in a
column would be wallpaper (§J).

---

## Colour rules

Gold `#c49464` on: hairlines, latest-release marker in the cadence
figure, "added" chip dots, rail dots for majors, month-tick rings,
search-match underlines in the mock, pipeline happy path. Chocolate
`#492d22` on: major version pills, CTA buttons, "changed" chip dots;
dark quote band uses ember text-ink `#312520` (family precedent from
landing).
Warm gray `#8a7564` on: dates, patch pills/dots,
"fixed" chip dots, all mechanism text inside SVGs. Cream `#fff2df` page
bg; `#fbeedd` alt bands and SVG group containers.

## Don't

- Don't use green/red/blue change-type chips — category is carried by
  warm ink, hue budget belongs to gold alone.
- Don't italicize entry titles — seven entries in a column means seven
  italic headings, which is §J blanket italic.
- Don't give every entry a screenshot/mock — one per chapter; hierarchy
  dies when everything is illustrated.
- Don't spend gold on more than one release in the cadence figure — gold
  marks "latest", older majors are warm ink, patches recede further.
- Don't float dates inside the cards — the meta column + rail IS the
  time axis; cards carry content only.
- Don't write entry intros in marketing voice ("We're thrilled to
  announce") — the letter voice is specific, modest, names its reporters.

## When not to use this canonical

- API/developer-tool changelogs with breaking-change migration tables —
  ember's letter voice undersells severity; use anthropic.
- High-frequency releases (daily/weekly trains, dozens per month) — the
  letter-per-release format and month rail assume a slow cadence; use
  apple's compact list.
- Status/incident pages — a changelog is a celebration ledger; incidents
  need a colder, denser layout.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot review
