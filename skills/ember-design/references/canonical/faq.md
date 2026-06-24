# Canonical · ember-design faq

> What makes this a good ember-design FAQ page. Read this **before**
> generating a new ember-design FAQ page — the trick is keeping ember's
> handcraft voice on a utility page without slowing the reader down.

---

## The 8 decisions that make this work

### 1. The hairline rhythm survives the utility page

Every section — hero included — opens with the same three-beat stack:
gold accent strip (`.accent-strip`, 2px × 60px, `#c49464`), IBM Plex Mono
eyebrow (11.5px, `letter-spacing:0.18em`, uppercase, `#8a7564`), Fraunces
roman title. Section titles run 40px (`.section-title`) — quieter than
landing's 48-56px, because this is a support page, not a pitch.

A FAQ that strips the decoration "because it's just support" stops
reading as ember. The rhythm costs the visitor nothing — it is 2px tall.

### 2. Hero states who answers, with one italic accent

`.hero-headline` is Fraunces 80px, weight 400, roman, `line-height:1.06`.
The single `<em>` ("Answered *by hand.*") is the page's one hero italic,
colored `#312520`. The lead names real terms: three people, no bot,
48-hour reply — the same accountability promise the landing makes.

### 3. Jump chips put a mono count on each anxiety

Three pill links (`.faq-jump`: Inter 14px 500, white bg, hairline border
`rgba(73,45,34,0.16)`, hover border goes gold) sit under the lead, each
ending in an IBM Plex Mono 12px gold count — Pricing & billing **5**,
Notes, sync & devices **4**, Security & privacy **5**. One click from
worry to answer group, and the counts promise the page is finite.

### 4. Stat strip measures support honesty in italic numerals

On the `#fbeedd` band: Fraunces italic 72px numerals (`.faq-stat-num`) —
**14** questions, **0** bots, **48h** first reply, **100%** audit reports
published — separated by 1px `rgba(73,45,34,0.12)` hairlines. Stat
numerals are one of ember's few earned italic slots; the numbers chosen
are claims a skeptical reader can check, not vanity counts.

### 5. Native `<details>/<summary>`, gold Fraunces +/− mark

Each question is a white `.faq-item` card (border `rgba(73,45,34,0.12)`,
darkening to `0.22` when open). The summary (`.faq-q`) is Fraunces 19px
weight 500 **roman**; the toggle mark (`.faq-q__mark`) is Fraunces 22px
weight 300 in gold, swapping + / − via `when-closed`/`when-open` spans.
The first pricing item ships `open` so the pattern explains itself.

Keyboard toggling, focus order (`:focus-visible` outline in
`var(--ember-brown)`) and screen-reader state come free from the
platform and survive JS failure. Restraint tolerates the missing
open/close animation.

### 6. Two figures — one per distrusted claim, picture before prose

The two claims words can't prove each get the diagram genre they argue
best in, placed at the top of their group, before any answer:

- Group 2: a paper window mock (viewBox 920×312) — the same three `.md`
  files listed in Skypad's sidebar and in a plain file manager, joined
  by one double-headed gold arrow. "No database in between" is shown,
  not said.
- Group 3: a three-card journey (viewBox 920×320) — Mac → Frankfurt
  server → iPhone, gold-numbered steps, ciphertext-only annotations,
  and a `#f5e5c8` protocol pill (`XCHACHA20-POLY1305 · AUDITED EVERY
  6 MONTHS`).

The pricing group gets no figure — three prices need no picture.

### 7. Gold buys exactly one narrative per diagram

In figure 1, gold goes to the highlighted file row (`#f5e5c8` fill, 1.5px
`#c49464` stroke, on both windows) and the arrow joining them. In figure
2, gold goes to the step markers, the two arrows, and the focus border on
card 1. Everything else is warm-brown value steps (`#492d22`, `#6b5a4f`,
`#8a7564`) on cream — no second saturated hue, no red/green security
color-coding.

### 8. The dark band carries a voice, not a form

The `#312520` chocolate band holds one Fraunces italic 34px pull-quote
(a named user, a sync conflict answered overnight) with an Inter cite in
`#d9b892` behind a 20px gold dash. The "Ask a person." CTA section comes
**after**, on cream, with the standard `.ember-button` + `.ember-link`
pair. One dark band = one italic quote; buttons would spend the page's
most dramatic surface on a form instead of a voice.

---

## Typography rules

| Element | Font | Size | Weight | Style |
|---|---|---|---|---|
| Eyebrow | IBM Plex Mono upper | 11.5px | 400, `letter-spacing:0.18em` | normal |
| h1 hero | Fraunces | 80px | 400 | normal (italic on one `<em>`) |
| Hero lead | Inter (`.ember-lead`) | 19px | 400 | normal, `line-height:1.6` |
| Section h2 | Fraunces | 40px (48px on closing CTA) | 400 | normal |
| Group lead | Inter | 17px | 400 | normal, `line-height:1.6` |
| Jump chip | Inter | 14px | 500 | normal |
| Jump count | IBM Plex Mono | 12px | 600 | normal, gold |
| Stat number | Fraunces | 72px | 400 | italic (earned — numerals) |
| Stat label | Inter | 14.5px | 400 | normal, `line-height:1.45` |
| FAQ question | Fraunces | 19px | 500 | normal, `letter-spacing:-0.005em` |
| +/− mark | Fraunces | 22px | 300 | normal, gold |
| FAQ answer | Inter | 15.5px | 400 | normal, `line-height:1.65`, max-width 620px |
| Figcaption | Inter | 13.5px | 400 | normal, centered |
| Pull quote | Fraunces | 34px | 400 | italic (earned) |
| Cite | Inter | 15px | 400 | normal, `#d9b892` on dark |

Italic budget is three: stat numerals, the dark-band quote, one hero
accent word. Fourteen questions in Fraunces **roman** — italicizing them
would be §J wallpaper. Chinese mode forces `font-style:normal` everywhere
(Noto Serif SC / Noto Sans SC; CJK has no true italic).

---

## Colour rules

Gold `#c49464` on: accent strips, jump-chip counts and hover borders,
the +/− accordion marks, the single gold narrative inside each figure
(highlighted file row + connector arrow; journey arrows + step circles +
card-1 focus border), and the cite dash. Chocolate: `#312520` for the
dark quote band and the hero `<em>`; `#492d22` (`var(--ember-text)`) for
body ink, hairline-border alphas `rgba(73,45,34,…)`, and SVG shadow
color. Warm gray `#8a7564` on: eyebrows and all mono mechanism text
inside the SVGs. Cream `#fff2df` page bg; `#fbeedd` alt bands (stat
strip, group 2) and both SVG group containers; `#f5e5c8` tint for the
focused file rows and the protocol pill.

## Don't

- Don't replace `<details>/<summary>` with a JS accordion for a height
  animation — the trade is built-in keyboard and screen-reader behaviour
  for a transition nobody asked for.
- Don't italicize the questions — 14 italic Fraunces headings in a
  column is blanket italic (§J); the questions stay roman 19px.
- Don't give every group a figure — only the two claims prose can't
  prove get one; an illustrated pricing group flattens the hierarchy.
- Don't color-code the security diagram red/green for "can't see / can
  see" — category lives in warm ink values; gold is the only hue.
- Don't add a search box or chat-bot widget — the page's stat strip
  says "0 bots between you and us"; at 14 questions, jump chips are
  the index.
- Don't let answers dodge with "contact us for details" — every answer
  hard-codes real numbers ($9, $3 student, 5 devices, 48h/24h, 6-month
  audits). The cost: any pricing change must land here in the same
  commit as pricing.html, or the FAQ starts lying.

## When not to use this canonical

- Support libraries past ~20 questions or with version-specific docs —
  hand-answered accordion groups with mono counts don't scale; that's a
  searchable docs layout, use anthropic.
- Developer/API FAQs needing code blocks, error tables, or migration
  notes inside answers — ember's warm editorial register undersells
  precision; use anthropic or sage.
- Enterprise-procurement or compliance FAQs where pure-white minimalism
  is expected — cream reads as lifestyle brand there; use apple.

## Status
- **Version**: v1 · 2026-06-13
- **Passes**: verify.py + visual-audit (0 error 0 warn) + screenshot review
