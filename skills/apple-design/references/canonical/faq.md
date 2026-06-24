# Canonical · apple-design faq

> What makes this a good apple-design FAQ / support page. Read this
> **before** generating a new apple-design faq page.

---

## The 7 decisions that make this work

### 1. Hero is a centered statement, not a search bar — 80px h1

`<p style="color:#0071E3">Support · Skypad 5</p>` kicker above an 80px
SF Pro Display 700 h1 ("Questions, answered."), centered. Below the
subtitle, three pill-shaped **jump chips** anchor-link to the three
question groups.

**Why no search bar**: typical help centers open with a search field,
which promises an index this page doesn't have (it's 14 curated
questions, not a knowledge base). Chips communicate the actual scope
in one glance. 80px (not 96px) because faq is a content page one step
below the landing's opening statement.

### 2. Giant stats state support promises, not product stats

Same 72px `.giant-stats` strip as the landing, but the four numbers are
**measurable support promises**: 4h median first reply · 92% solved in
one reply · 0 chatbots · 30 days money-back. The strip sets
expectations the FAQ below then has to keep.

**Why**: it converts apple's giant-number trust pattern into a contract
with the reader, and it breaks up what would otherwise be a long text
page right after the hero (text-desert rhythm).

### 3. Three groups × 4-5 questions in one 860px column

`.faq-group` blocks with 48px 700 group h2 ("Pricing & billing." /
"Sync, security & your data." / "Editor & platforms.") + an 18px
one-line group sub. No sidebar, no two-column split.

**Why one column**: 14 questions don't justify permanent navigation
chrome; the hero chips handle jumping. 860px keeps answer line-length
readable (~75 chars) inside the 1280 hero container.

### 4. Native details/summary accordion — keyboard a11y for free

Each question is `<details class="faq-item"><summary class="faq-q">`
with a 28px circular `#f5f5f7` chevron holder (plus icon rotating 45°
on `[open]`). `summary:focus-visible` gets a 2px `#0071E3` outline.
The **first item of each group is `open` by default** so the page never
reads as a wall of identical collapsed rows.

**Why native**: keyboard + screen-reader behavior is built in, content
stays readable with JS disabled, and apple's restraint favors the
instant native toggle over a JS height animation.

### 5. The hardest trust question is answered with a diagram

"What does end-to-end encrypted mean?" gets a 960×312 grayscale flow
figure above the group: white device cards (soft shadow, no border) →
`#f5f5f7` cloud group containing a "Storage relay · no keys · no
plaintext" card → second device. The **single blue narrative** is the
encrypted path (1.8px arrows + three numbered badges) plus the
`#eaf3fe` "ciphertext only" focus chip. Key chips under devices stay
gray. Bilingual figcaption ties figure to answer.

**Why**: device → relay → device is structure, and structure reads
instantly as a picture; prose makes every reader rebuild the same
picture themselves. Blue budget per diagram-craft §0: ≤2 elements.

### 6. Platform answer is a line-art device lineup, not a list

The "Editor & platforms" group opens with a 960×232 line-art figure:
laptop, monitor, terminal square, two phones in `#aeaeb2` 1.5px
strokes, each with name (13.5px 600) + version line (11.5px gray).
One blue accent: the writing cursor on the laptop screen.

**Why line-art**: diagram-craft §8 — don't attempt photoreal device
mocks in a single SVG; schematic strokes read as deliberate. A
five-item version list would be the only prose-list of facts on the
page; the lineup keeps figure rhythm in the second half (text-desert).

### 7. Black quote band, then three equal support-channel cards

Between the FAQ and the closing CTA, a pure-`#000000` band with the
44px italic support principle ("The person who answers your email also
ships the code."). The closing `#f5f5f7` section holds three
equal-width `.channel-card`s (email / forum / security disclosure) in
landing's feat-card grammar: 48×48 `#f5f5f7` icon tile, blue 26px SVG
icon, 22px h3, `.apple-link`.

**Why equal width (not §I's hero + alternatives)**: the three channels
serve disjoint audiences — billing questions, workflow questions,
vulnerability reports. Ranking them would misroute users; §I permits
equal weight when weights are genuinely equal.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500 `color:#0071E3` |
| h1 hero | SF Pro Display | 80px | 700 `letter-spacing:-0.035em` |
| Subtitle | SF Pro Display | 22px | 400 `letter-spacing:-0.01em` |
| Topic chip | SF Pro Display | 14px | 500, pill border |
| Stat number | SF Pro Display | 72px | 700 `letter-spacing:-0.035em` |
| Stat label | SF Pro Text | 15px | 400 |
| Group h2 | SF Pro Display | 48px | 700 `letter-spacing:-0.03em` |
| Group sub | SF Pro Display | 18px | 400 `line-height:1.5` |
| FAQ question (summary) | SF Pro Display | 19px | 600 `letter-spacing:-0.01em` |
| FAQ answer | SF Pro Display | 16px | 400 `line-height:1.6` |
| Figcaption | SF Pro Display | 13.5px | 400 secondary |
| Pull-quote | SF Pro Display | 44px | 500 `letter-spacing:-0.025em` italic |
| Channel-card h3 | SF Pro Display | 22px | 600 `letter-spacing:-0.015em` |
| CTA h2 | SF Pro Display | 56px | 700 `letter-spacing:-0.03em` |

One font family (SF Pro). No italic on any heading or question;
italic only in the black pull-quote band (§J).

---

## Colour rules

Blue `#0071E3` only on: hero kicker, nav/inline `.apple-link`,
channel-card SVG icon strokes, summary focus-visible outline, and at
most two elements per diagram (encrypted path + ciphertext chip in
fig 1; cursor in fig 2). Section alternation: white hero → `#f5f5f7`
stats → white FAQ → black quote band → `#f5f5f7` CTA. Answers in
`--apple-text-secondary` (#6e6e73, AA on white); never `#86868b` for
HTML body text.

## Don't

- Don't open with a search bar you can't back with an index — chips
  scoped to the real groups are honest, a dead search box is not.
- Don't build a JS accordion when `<details>` does it — and don't strip
  the `summary` focus ring while restyling the marker.
- Don't collapse everything by default; an all-collapsed FAQ is a wall
  of identical rows with no visible answer typography.
- Don't let answers exceed ~4 lines; a question needing more belongs in
  a feature-deep or docs page, linked from a short answer.
- Don't answer "is my data safe" questions with prose only — the E2E
  diagram is the load-bearing trust element of this page.
- Don't italicize questions or group headers (§J); italic lives only in
  the black quote band.
- Don't spend blue on more than 2 elements per diagram (diagram-craft
  §0) — the key chips stay gray so "ciphertext only" keeps the focus.

## When not to use this canonical

- A real knowledge base with 50+ articles — that needs search + index
  architecture (docs-home canonical), not a curated 14-question page.
- A pricing page that wants a short FAQ section — use the inline
  `.faq-item` list from the pricing canonical; this page-level frame
  (hero + stats + groups + channels) is overkill for 5 questions.
- Legal/compliance Q&A (terms, DPA) — those need exact reproducible
  wording and anchors per clause, not a marketing-voiced accordion.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py + visual-audit (`--ignore-intentional`) + screenshot eyeball
