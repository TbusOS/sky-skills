# Canonical · apple-design changelog

> What makes this a good apple-design changelog page. Read this **before**
> generating a new apple-design changelog page.

---

## The 7 decisions that make this work

### 1. Hero states the editorial policy, not the product pitch

Blue kicker "Skypad · Release notes" above an 80px SF Pro Display 700 h1
("Every release, on the record."). The subtitle is not marketing — it
states the changelog's editorial rule: "If a change can't be explained
in one sentence, it doesn't ship."

**Why 80px, not landing's 96px**: a changelog is a utility page the
reader returns to; it deserves apple's opening-statement framing but one
step below the launch page, so landing keeps the loudest voice in the
site hierarchy.

### 2. Subscribe CTA lives in the hero, as a working form

`.sub-row`: an `.apple-input` email field + filled `.apple-button`
"Subscribe", max-width 460px, centered, with one line of fine print
("One email per release. Unsubscribe anytime. RSS"). The same form is
mirrored in the final CTA band — first-screen visitors and
read-to-the-end visitors both get it without scrolling back.

**Why a form, not a link**: "订阅更新" is the page's one conversion; a
text link postpones it to another page, a one-field form finishes it here.

### 3. Release-cadence timeline SVG before any entry

A 1180×232 timeline in `apple-container--hero`: seven shipped versions
as dots positioned **proportionally to their real dates**, a dashed
blue "today" marker, the axis turning dashed into the future, and
outlined v5.3 in Q3. Dot size + fill encode release weight (large ink =
milestone, ink = feature, small gray = patch, outline = upcoming).

**Why first**: individual entries prove activity; only the cadence view
answers "is this product steadily maintained?". Equal spacing would lie
about the rhythm — date-proportional x-positions are the whole point.

### 4. Giant stats quantify the cadence — 64px, 4 across

27 releases since v4.0 · 14-day median gap · 0 features moved out of
Free · 9.4K subscribers. Same `giant-stats` pattern as landing but 64px
(landing uses 72px) — supporting cast, not the hero.

The "0 features ever moved out of Free" stat carries the product's
non-compromise voice into the changelog.

### 5. One continuous left rail — the time axis is the layout

Each `.log-entry` is a grid: 168px meta column (version pill + date) |
content column with `border-left: 1px solid #d2d2d7` and an absolutely
positioned `.log-dot` sitting on the line. Month headings (h3, 32px
700) break the stream into groups. Dot color repeats the timeline
encoding: blue = latest, ink = feature, gray = patch.

**Why a rail, not cards**: disconnected release cards read as a blog
index; one hairline running the full page gives the eye a spine and
makes the stream read as a single product moving forward.

### 6. Change-type chips spend the blue budget on "Added" only

`.log-chip` is an 11px 600 uppercase pill in a fixed 76px column, so
chips align vertically and the list scans as a table:
- **Added** — solid `#0071E3`, white text (4.7:1, clears AA without an
  intentional-warn exemption; the `#eaf3fe` tint version measured ~4.2:1)
- **Changed** — `#f5f5f7`, ink `#1d1d1f`
- **Fixed** — `#f5f5f7`, secondary `#6e6e73`

**Why not green/blue/orange semantic chips** (keepachangelog style):
multi-hue is anthropic's language and a cross-skill smell. Apple's
grammar is grayscale + one blue narrative — "what's new" is the one
thing a changelog reader scans for, so Added owns the blue, and the
Changed/Fixed ladder survives black-and-white printing on weight alone.

### 7. Figures only where a release earned one

Exactly two entries carry an inline figure:
- **v5.2** — a 760×392 graph-view window mock (traffic lights, edges,
  one blue selected node with its label callout, status bar with real
  counts). Window-mock genre: the release shipped a visible surface.
- **v5.0** — a 760×196 four-card sync data path (soft-shadow white
  cards, the "Encrypt on device" focus card carrying the only blue
  border). Flow genre: the release shipped architecture.

Patch entries ("Two stubborn bugs.") get no figure — figure = release
significance, and the two figures land ~1 visual per 1.5 screens,
inside the text-desert budget. The black pull-quote band after the
stream (40px italic, the one earned italic on the page) restates the
editorial policy and resets rhythm before the closing CTA.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500 `color:#0071E3` |
| h1 hero | SF Pro Display | 80px | 700 `letter-spacing:-0.035em` |
| Subtitle | SF Pro Display | 22px | 400 `letter-spacing:-0.01em` |
| Section h2 | SF Pro Display | 48-56px | 700 `letter-spacing:-0.03em` |
| Stat number | SF Pro Display | 64px | 700 `letter-spacing:-0.035em` |
| Month heading (h3) | SF Pro Display | 32px | 700 `letter-spacing:-0.025em` |
| Entry title (h4) | SF Pro Display | 24px | 600 `letter-spacing:-0.02em` |
| Version pill | SF Pro Display | 14px | 600, `#f5f5f7` pill (latest: blue/white) |
| Entry date | SF Pro Display | 13px | 400 `--apple-text-secondary` |
| Change line | SF Pro Display | 15px | 400 `line-height:1.5` |
| Type chip | SF Pro Text | 11px | 600 uppercase `letter-spacing:0.06em` |
| Pull-quote | SF Pro Display | 40px | 500 italic `letter-spacing:-0.025em` |

One font family (SF Pro). No italic anywhere except the black-band
pull-quote (§J).

---

## Colour rules

Blue `#0071E3` only on: hero kicker, Subscribe buttons, Added chips,
latest-release pill + rail dot, the timeline "today" marker, the
selected node in the graph mock, the focus card in the sync diagram.
Rail and axis `#d2d2d7`; patch dots `#aeaeb2`; chips' gray base
`#f5f5f7`. Section alternation: white → `#f5f5f7` (stats) → white
(stream) → black (quote) → `#f5f5f7` (CTA).

Inside each SVG the blue stays a single narrative: today-marker
(timeline), selected note + its edges (graph mock), encrypt focus card
(sync path). Everything else is the grayscale ladder.

## Don't

- Don't give every change type its own hue (green Added / orange Fixed
  is keepachangelog's look and a cross-skill smell here).
- Don't render releases as free-floating cards — the rail is the page.
- Don't space timeline dots equally when dates are unequal; the
  proportional axis is what makes the cadence claim honest.
- Don't attach a figure to every entry — patches don't earn one, and
  figure-per-entry flattens the release hierarchy.
- Don't write a literal `›` inside `.apple-link` text — the CSS
  `::after` already appends it; you'll render "RSS › ›".
- Don't bury the subscribe action below the fold only — hero + final
  band, both.

## When not to use this canonical

- Product with 1-2 releases a year — a timeline with two dots is
  embarrassing; write a blog post per release instead (blog-index).
- API/SDK changelog where readers diff machine-readable versions — a
  docs-style table with anchors per version beats the editorial stream.
- Marketing "what's new" page selling one major release — that's
  feature-deep, not a changelog.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: all three design-review gates (verify · visual-audit
  --ignore-intentional · screenshot eyeball, en + zh)
