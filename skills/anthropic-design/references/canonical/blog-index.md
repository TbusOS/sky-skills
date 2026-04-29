# canonical · blog-index page · anthropic-design

> **Binding companion** to `blog-index.html`. Read this before writing a new
> blog-index page in the anthropic-design voice. The HTML without this .md is
> half the lesson.

## What a "blog-index" page is for

A blog-index is the **front page of a journal** — the place a reader lands when
they want to browse what's been written, not read one specific piece. It must
answer three things in the first viewport:

1. **What is this journal about?** (a sentence, not a tagline)
2. **What's the most recent / most important piece?** (one featured)
3. **Where do I find the rest?** (a browsable list, in time order)

Anthropic-voice blog indexes earn trust through **editorial restraint** — Lora
serif body text, generous gutters, no thumbnails-as-marketing-banners, no
"read time: 4 min · 3.2k views · 89 ❤" social-engagement metadata cluttering
each card. The cadence reads like a quiet print quarterly, not a content
feed.

**When this canonical is the right template**:

- A long-running journal / changelog-prose / engineering blog / essay
  collection where pieces are ≥600 words and worth reading whole.
- The author wants the reader to **browse by interest**, not by recency
  alone — so tag filtering matters.
- The voice is editorial-first; thumbnails are abstract / illustrative,
  not lifestyle photography.

**When to pick something else**:

- Pure changelog / release notes (chronological, terse) → use
  `changelog.html` (Wave 2 #5).
- Marketing landing with one CTA above all → use `landing.html`.
- Per-post page → use `feature-deep.html` (single-piece argument).
- Magazine front cover with hero photo + 3 columns of magazine ads →
  pick a different aesthetic; anthropic doesn't carry that register.

## The 7 decisions that make this work

### 1. Top eyebrow + hero is a journal masthead, not a marketing slab

The page opens with a small mono kicker — `Journal · 2024–2026 · 47 pieces`
— in JetBrains Mono 11.5px, `letter-spacing:0.14em`, color
`--anth-text-secondary`. Below it, a Poppins **48–56px** h1 (a touch
smaller than landing's 56–64px, because blog-index defers to its
articles): `Notes from the / quiet desk.` — two stacked lines with `<br>`,
one italic accent word in the subtitle line below (Lora 19px).

No CTA in the hero. No "subscribe" button above the fold. The masthead is
**descriptive**, not transactional. Reader arrived to read, not to convert.

→ **Rule**: blog-index hero = mono-kicker + 2-line h1 + Lora subtitle.
ZERO buttons in the hero. Subscribe lives in the footer.

### 2. Featured post is one — full-width hero card, not a "5 most popular" carousel

Immediately below the hero: ONE featured post on a hairlined cream-subtle
band. Two-column grid (`5fr 7fr` desktop), left = abstract SVG illustration
(500×400 frame, anthropic 5-color palette, NOT a stock photo), right =
post metadata block:

- Mono kicker `02 · FEATURED ESSAY · 12 min` (orange)
- Poppins **34–40px** h2 (post title), 600 weight, 2 lines max
- Lora **17px / 1.65** lede (~3 sentences, 200–280 chars)
- Author byline `By <name> · 2026-04-22` Poppins 13px in
  `--anth-text-secondary`
- One `.anth-link` "Read the essay →"

This is the editor's pick. It is **not** the most-recent post by default —
the editor decides what deserves the slot. If you want most-recent only,
this section is wrong; reach for changelog.

→ **Rule**: ONE featured post per blog-index. Two-column 5fr 7fr grid.
SVG illustration on left, never a photo or screenshot. The featured slot
is editorial, not algorithmic.

### 3. Tag rail is a horizontal hairline strip, not a sidebar

Below the featured post, before the post grid, a single horizontal row
of clickable tags: `All · Engineering · Essays · Notes · Changelog ·
Reading list`. Each tag is a small pill with cream-subtle bg, mono 12.5px
text, hairline border. The active tag has orange background + white text
(filled `--anth-orange` pill, contrast ≥ AA against white text per
known-bugs.md `.anth-button` rule).

The rail is **horizontal not sidebar** for two reasons:
- Anthropic blog-index is **single-column-of-attention** — a sidebar
  splits the reader's gaze and turns the page into an inbox.
- Mobile-friendly: the rail wraps; a sidebar collapses into a hamburger
  drawer that nobody opens.

→ **Rule**: horizontal tag rail · 5–7 tags max · only ONE pill is the
filled-orange "active" state at any time · `flex-wrap: wrap` for ≤768px.

### 4. Post grid is a 2-col list of cards, not a 3-col Pinterest

The main post list is a `.post-grid` with
`grid-template-columns: repeat(2, 1fr)`. Two columns, **not three**.
Three columns at 1440 makes each card narrow (~360px) and forces titles
to wrap into 3-line stacks; two columns at 540px each gives titles
breathing room and lets the Lora lede be readable as prose, not as
caption.

Each `.post-card` has the structure:

```
[abstract SVG thumb · 480×280 · cream-subtle bg · 5-palette only]
[mono kicker: "TAG · DATE · READ-TIME"]
[Poppins 22px h3 title · 2 lines max · ellipsis]
[Lora 15.5px lede · 2 sentences · ~140 chars]
[.anth-link "Continue →"]
```

NO author thumbnail circle. NO heart icon / view count / comment count.
NO "trending" badge. The card is a **content trailer**, not a social tile.

→ **Rule**: 2-col grid (1-col on ≤768px). 6 posts per page (3 rows of 2).
Card height equal across the row via `align-items: stretch`. NO social
metadata.

### 5. Two italic moments only — hero subtitle and editor's note pull-quote

§J italic budget for blog-index = **2** (one less than feature-deep's 3,
because blog-index is a list page and italic on every card title or
every lede would turn the grid into a wedding invitation):

1. **Hero subtitle** — ONE `<em>` accent word ("the *quiet* desk")
2. **Editor's note** — a Lora italic 22–24px `.anth-quote` blockquote
   between the post grid and pagination, written by the editor
   (~2 sentences) framing the current quarter. Orange-dot cite.

**Forbidden italic places** (would push past §J ceiling):
- Card title (Poppins, no italic anyway)
- Card lede (Lora, but ROMAN — italic on 6 ledes = wedding invitation)
- Tag pill text (mono, no italic)
- Author byline (Poppins, no italic)
- Pagination labels (Poppins, no italic)

→ **Rule**: 2 earned italic moments per page. Hero accent + editor's note.
Anything else = §J overuse warning.

### 6. Pagination is "older / newer" plain links, not numbered SaaS pagination

The bottom of the post grid carries a single hairline-divided row:

```
←  Older posts                                               Newer posts  →
```

JetBrains Mono 13.5px, color `--anth-text-secondary`, hairline above and
below, `var(--space-7)` vertical padding. **No** "1 · 2 · 3 · ... · 12"
numbered pagination. **No** "showing 1–6 of 47" SaaS counter.

Two reasons:
- Numbered pagination implies the reader is supposed to skim through
  pages 1–12 to find a piece. Anthropic's editorial argument is "use
  the tag rail or the search field if you're hunting." Pagination is
  for *casual browsing chronologically*, which is a binary
  forward/back action.
- Plain "older / newer" mirrors paper newsletters and small literary
  journals — the cadence the page is borrowing.

→ **Rule**: prev/next plain links. No numbered pagination, no jump-to-page,
no "results per page" dropdown.

### 7. Footer subscribe is a single email field + the journal's RSS link, not a marketing modal

The footer carries a quiet subscribe block on cream-subtle bg:

- Poppins 24px h3 "Get notes by email"
- Lora 16px / 1.65 single-paragraph copy explaining cadence ("one
  letter per essay; we don't send between") and a link to the RSS feed
  (`<a href="/rss.xml">RSS feed</a>`)
- One inline form: `<input type="email" placeholder="you@example.com">`
  + filled-orange `.anth-button` "Subscribe"
- One sentence below the form: "No tracking, no list rentals."
  (`--anth-text-secondary`, Poppins 13px)

NO modal popup on scroll. NO interstitial overlay. NO "Wait — before you
go!" exit-intent dialog. The subscribe block is a section, not a hijack.

→ **Rule**: subscribe is a single inline section in the footer. RSS is
linked in plain text right next to it. No modals, no overlays, no
notification permission requests, no toast on first scroll.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Masthead kicker | JetBrains Mono | 11.5px upper, `letter-spacing:0.14em` | 500, `--anth-text-secondary` |
| Hero h1 | Poppins | 48–56px, `letter-spacing:-0.02em` | 600 |
| Hero subtitle | Lora | 19px / 1.6 | 400, ONE `<em>` allowed |
| Featured kicker | JetBrains Mono | 11.5px upper, `letter-spacing:0.14em` | 700, orange |
| Featured h2 | Poppins | 34–40px | 600, `letter-spacing:-0.02em` |
| Featured lede | Lora | 17px / 1.65 | 400, NO italic |
| Featured byline | Poppins | 13px | 500, `--anth-text-secondary` |
| Tag pill | JetBrains Mono | 12.5px | 500 (active 700 white-on-orange) |
| Post-card kicker | JetBrains Mono | 11px upper, `letter-spacing:0.14em` | 700, orange |
| Post-card title | Poppins | 22px / 1.3 | 600, max 2 lines |
| Post-card lede | Lora | 15.5px / 1.6 | 400 (ROMAN, no italic) |
| Editor's note | Lora | 22–24px / 1.55 | 400 italic |
| Editor's note cite | Poppins | 13px | 500, orange-dot prefix |
| Pagination link | JetBrains Mono | 13.5px | 500, `--anth-text-secondary` |
| Footer h3 | Poppins | 24px | 600 |
| Footer body | Lora | 16px / 1.65 | 400 |

§H zh mapping: Lora body → Noto Serif SC; Poppins display → Noto Sans
SC; `.editor-note blockquote` italic → roman in zh (italic on Chinese
characters reads as broken).

## Colour rules

Orange `#d97757` only on:
- Masthead featured kicker text
- Featured post `.anth-link` arrow
- Active tag pill (filled orange + white text + 600 weight)
- Post-card kicker text
- Editor's note blockquote orange-dot cite
- Footer subscribe `.anth-button` filled CTA
- One SVG accent inside the featured-post illustration (optional)

Everything else is cream `#faf9f5` + cream-subtle `#f0ede3` + warm dark
brown `#141413` + secondary `#6b6a5f` + light-gray `#e8e6dc`.

**Forbidden colours** (§K cross-skill smell):
- apple blue `#0071E3`, `#2997FF`
- ember gold `#c49464`
- sage green `#97B077`, `#d4e1b8`, `#9ab388`
- indigo/purple `#eeecff`, `#3a3d7c`

## Italic discipline (§J · strict 2-of-page limit)

Total italic on the entire page = **2**:
1. Hero subtitle ONE `<em>` accent word
2. Editor's note blockquote (whole body in Lora italic 22–24px)

A 3rd italic anywhere = §J italic-overuse warning + drift away from
anthropic's earned-italic discipline.

## Don't

- Don't render any thumbnail as a photo / screenshot — anthropic
  blog-index thumbs are abstract SVG illustrations, 5-color palette only.
- Don't add view counts / heart icons / comment counts / "trending" badges
  to post cards. Social metadata cheapens the editorial register.
- Don't put a CTA in the hero. The page is a journal entrance, not a
  funnel.
- Don't render numbered pagination (`1 · 2 · 3 · 4`) — older/newer plain
  links only.
- Don't put a sidebar (tags + archive + author + recent) — single-column
  attention is the signature.
- Don't carousel the featured post slot. ONE featured, manually picked.
- Don't put a search bar in the masthead — if search is needed, it lives
  in a separate `/search` page linked from the footer.
- Don't write h1 in ALL CAPS or with a colon (`Journal: Notes…`).
  Sentence-case noun-phrase with a period at the end.
- Don't add lifestyle photography of "person typing on laptop with
  coffee." That entire genre is forbidden in the anthropic palette.

## When NOT to use this canonical as a template

- **Pure changelog / release notes** — terse, version-numbered, no editor's
  pick. Use `changelog.html` (Wave 2 #5).
- **Single-essay landing** — one piece deserving its own page. Use
  `feature-deep.html`.
- **News aggregator with 50+ items per page** — the 6-card grid breaks
  past 8–10. For high-volume feeds, the right template is a denser list
  (no thumbnails, two-line entries) which we don't currently have.
- **Author-centric page** ("everything by Jane") — that's a per-author
  index, not a blog-index. Future Wave 3 page-type.

## Extensibility: porting this template

### To another anthropic-voice blog-index

Copy `blog-index.html`, keep the structure, swap:

- Nav brand, page title, masthead kicker (`Journal · YYYY-YYYY · N pieces`)
- Hero h1 (2-line stacked) + subtitle with ONE italic accent
- Featured post: kicker / h2 title / lede / byline / SVG illustration
- Tag rail labels (5–7 tags, ONE active pill)
- 6 post cards: SVG thumb / kicker / title / lede / byline
- Editor's note blockquote (1 paragraph, italic) + cite
- Pagination prev/next labels
- Footer subscribe copy + RSS link

### To other 3 design skills (apple / ember / sage)

Same information architecture; swap the style-specific treatments. This
.md is the reference for the next 3 horizontal ports — record each port's
deviation in its own `.md` rather than rewriting the structure.

| Surface | anthropic | apple | ember | sage |
|---|---|---|---|---|
| Masthead kicker | mono `Journal · 2024–2026 · 47 pieces` orange-secondary | text-only blue label "Stories" | gold-hairline + Fraunces small caps `THE ARCHIVE` | numbered marker `01 · THE JOURNAL` |
| Hero h1 | Poppins 48–56px stacked, ONE italic accent in subtitle | SF Pro Display 64–80px stacked, NO italic | Fraunces 64–72px stacked, ONE italic accent in h1 | Instrument Serif 80–96px stacked, ONE italic accent in h1 |
| Featured post chrome | white card, hairline border, orange kicker | hairline-only frame, blue kicker | warm-cream card, gold hairline border, mono eyebrow | white card with sage hairline + numbered marker |
| Tag rail | horizontal pills, orange active | hairline pills, blue active | rounded warm pills, gold active | minimal squared pills, sage active |
| Card radius | `--radius-md` ~16px | 24px (apple signature) | 12px (ember signature) | 4px (sage signature, smallest) |
| Card thumb palette | abstract SVG, 5-color anthropic | abstract SVG, apple system grays + blue | abstract SVG, warm cream/gold/cocoa | abstract SVG, monochromatic sage |
| Italic count (§J) | 2 (hero + editor's note) | 0 | 2 (hero accent + editor's note) | 2 (hero accent + editor's note) |
| Pagination | mono prev/next, hairline rule | text-only prev/next, no rule | mono prev/next, gold hairline | numbered prev/next, sage hairline |
| Subscribe block bg | cream-subtle | light gray | warm-cream | cream-subtle |

Same skeleton, same editorial restraint contract — four voices.

## Verified

Rendered at 1440 × ~4800px. Targets all four gates pass:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count is exactly **2 / 2 §J ceiling**: hero accent word, editor's
note blockquote. All post-card ledes ROMAN, all titles ROMAN.

**Ship significance**: anthropic/blog-index is **Wave 2 第 1 张** (canonical
20 → 21). New page-type · no precedent · this .md is the reference for
the next 3 horizontal ports (apple/ember/sage blog-index) where the
"port surfaces" table above is the cheatsheet.
