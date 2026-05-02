# canonical · product-detail page · anthropic-design

> **Binding companion** to `product-detail.html`. Read this before writing a new
> product-detail page in the anthropic-design voice. The HTML without this .md
> is half the lesson.

## What a "product-detail" page is for

A product-detail page sells **ONE product / SKU / model** in a lineup. It's
the page a reader lands on when they click "Studio" from a product menu and
want to answer four questions in order:

1. **What is this product?** (one sentence + a single eyebrow line)
2. **What's it for?** (3-5 use cases, concrete)
3. **What's inside?** (technical specs · model card style · numbers)
4. **How do I get it / how does it stack up?** (pricing snippet + sibling
   compare row + a docs CTA)

Anthropic-voice product-detail pages earn trust through **specifics + honest
limits** — release dates, context windows, latency numbers, supported
platforms, then ONE callout naming what the product isn't good at. The voice
lands between feature-deep (argues WHY a feature exists) and landing (sells
the whole skill); product-detail is the **what / who / how-to-get** of one
named SKU.

**When this canonical is the right template**:

- A named, shippable product / model / SKU with its own URL slug (Skypad
  Studio · Skypad Reader · Skypad Sync; or Claude 3.5 Sonnet · Claude 3.5
  Haiku, etc.) and at least 2 sibling products to compare against.
- The reader is **deciding between siblings or evaluating fit** — they
  arrived from a product menu, an email, or a docs link, not from a
  marketing campaign.
- You can name 6-10 honest specifics (release date, version, platform,
  context window or capacity, latency, pricing tier, regional availability,
  data policy) and at least one real limit.

**When to pick something else**:

- Skill / company overview, multiple products → `landing.html`.
- Argument for ONE feature within a product → `feature-deep.html`.
- Detailed comparison of 2-4 products side by side → `comparison.html`.
  product-detail can include a 3-col sibling-compare row but NOT a full
  comparison matrix; if a full matrix is needed, link to a comparison page.
- Pricing matrix → `pricing.html`. product-detail mentions pricing in one
  sentence + a link.
- API reference / model card with code samples → `docs-home.html`.

## The 8 decisions that make this work

### 1. Hero — product family eyebrow + product name h1 + tagline + 2 CTAs

The hero opens with a **product family eyebrow** (mono-style, small):
`Skypad Studio · part of the Skypad lineup`. Below it, a Poppins **48-56px**
h1 stating the product name + a one-line value claim:
`Skypad Studio` (large) / `the desktop notebook for keyboard-first writing.`
(slightly smaller, second line). Two stacked lines via `<br>` — the
second line is roughly 60% the size of the first so the product name is
unambiguous as the primary noun.

Subtitle Lora 18-19px, 1.6 line-height, max-width 640px — the "for whom"
sentence with ONE italic accent word.

Two buttons: primary filled `Try Studio` (orange) + ghost `View specs ↓`
(scrolls to the spec table).

→ **Rule**: hero h1 = product family eyebrow + product-name + tagline;
two CTAs (try + see specs); ONE italic accent in subtitle.

### 2. At-a-glance bar — 4 quick specs as a hairline-divided horizontal row

Immediately under the hero, a hairline-divided 4-col strip with the most
load-bearing factual data:

| Cell | Example |
|---|---|
| Released | `2025-Q4 · v1.4` |
| Platforms | `macOS · Windows · Linux` |
| Tier from | `$8 / month` |
| Trial | `30 days, full features` |

Cell layout: `grid-template-columns: repeat(4, 1fr)` with `1px var(--anth-light-gray)` between cells. Each cell has:
- Poppins 11.5px uppercase 0.14em letter-spaced label (e.g. `Released`)
- Poppins 18-20px weight 600 value (`2025-Q4 · v1.4`)

This bar is the page's **trust anchor** — the reader who scrolls 200px
already knows release date, platform, price entry point, and trial. No
"Sign up to learn more" gate.

→ **Rule**: 4 cells, factual data only. NO marketing copy in this strip.
"Award-winning" / "loved by 10,000 teams" forbidden.

### 3. Use-case grid — 3 or 4 anth-cards each with concrete scenario

A `.use-case-grid` of `repeat(3, 1fr)` (or `2x2` for 4 cards). Each card has:
- Hand-drawn inline SVG illustration (200×140 frame, anthropic 5-color
  palette · NOT a stock icon)
- Poppins **18px** weight 600 use-case title (e.g. `Daily writing`)
- Lora 15.5px / 1.6 body (1-2 sentences naming a real workflow)
- A single dot-divider with one specific name-drop (e.g.
  `Used by writers at the Atlantic and arXiv-hosted researchers.`)

Three or four cards. NEVER 5+ — that turns a use-case argument into a
feature wall.

→ **Rule**: each card = SVG + title + 2 sentences + ONE concrete reference.
NO emoji, NO check-marks, NO "for everyone" generic copy.

### 4. Spec table — model-card style technical detail · the page's evidentiary core

A `.spec-table` with `grid-template-columns: 240px 1fr` rows. Each row has:
- Left: Poppins 11.5px uppercase 0.14em letter-spaced **orange** label
  (e.g. `LATENCY`)
- Right: Lora 16px / 1.6 prose with `<code>` for paths/numbers/identifiers

Sample rows for Skypad Studio:
- `LATENCY` — `< 12ms keystroke-to-render median, p99 21ms (M2 Air, 100k char buffer)`
- `STORAGE` — `Plain Markdown files in `~/Documents/Skypad/`. Up to 50,000 entries tested.`
- `KEYBOARD LAYOUTS` — `QWERTY, Dvorak, Colemak, AZERTY, Workman + custom physical-key tables`
- `EXPORT FORMATS` — `Markdown · plain text · PDF · JSON · plain HTML (no inlined CSS)`
- `OFFLINE` — `Fully functional. No network calls except optional sync (off by default).`
- `DATA POLICY` — `Local-first. No telemetry. Cloud sync end-to-end encrypted.`
- `AUTOMATION` — `CLI hooks via `~/.skypad/hooks.toml`. Pre-save / post-save / on-tag.`
- `ACCESSIBILITY` — `VoiceOver / NVDA / Orca tested, dyslexic font option, all reachable by keyboard.`

8 rows is comfortable. 6 minimum (any less reads as undocumented). 12 max
(any more dilutes signal).

→ **Rule**: every value contains a number, file path, format name, or
specific platform — NO "fast", "easy", "powerful". Each row is one factual
claim a tester could verify in 5 minutes.

### 5. Honest-limits callout — "what Studio isn't good at"

A `.callout` block with 3px solid anthropic-orange left border on
`.anth-section--subtle` cream-subtle bg. Padding `var(--space-6) var(--space-7)`.
Inside:
- `.callout__kicker` Poppins 11.5px uppercase 0.14em letter-spaced **orange**
  (`Honest limits`)
- Lora 17px / 1.65 body, 3 sentences naming three real cases where Studio
  isn't the right tool (e.g. `Real-time collab is not native — for live
  multi-cursor, use a Notion or Google Docs alternative. Database-style
  views are intentionally absent — Studio is a notebook, not Airtable.
  Mobile editing is read-only — Skypad Reader handles capture on phones.`)
- ONE earned `<em>` allowed (e.g. `*not the right tool*`)

This callout is **load-bearing**: a product-detail page without honest
limits reads as marketing-loud, not editorial. Anthropic voice never
says "perfect for everyone."

→ **Rule**: name three real limits, point each one at a concrete
alternative. Italic budget = ONE earned word per callout.

### 6. Sibling-compare row — 3-col "lineup at a glance"

A `.sibling-compare` row of `repeat(3, 1fr)` cards (white bg · 1px
light-gray border · 16px radius · padding `var(--space-5)`). Each card has:
- Poppins 11.5px uppercase 0.14em letter-spaced eyebrow (e.g. `Skypad Reader`)
- Poppins 22px weight 600 product name + tagline on second line
- 3-row spec mini-list: `Best for · Platform · Price`
- One `.anth-link` "Read about it →"

The current product (Skypad Studio in the demo) is the **middle card**
with a 2px orange border (visual anchor). Left + right are siblings.

→ **Rule**: 3 cards exactly. Current product visually anchored center.
NO matrix · 4+ products → use comparison.html.

### 7. Pricing snippet — single sentence + link to pricing.html

ONE sentence in Lora 17px / 1.6: `Studio is included on the Pro tier
($8/mo, 30-day trial) and the Team tier ($16/seat/mo).` Followed by a
single `.anth-link` `See full pricing →`.

This is the full pricing surface on a product-detail. The reader who
needs the matrix follows the link to `pricing.html`. The reader who
needs the price-to-evaluate already has it from the at-a-glance bar.

→ **Rule**: ONE sentence + ONE link. NO embedded pricing matrix on
product-detail.

### 8. Closing CTA — quiet "get started" section

Final section: `.anth-section--subtle` cream-subtle bg with:
- Poppins 32-36px weight 600 h2 (`Get started with Studio.`)
- Lora 17px / 1.65 single sentence
- Two buttons: primary filled `Download Studio` + ghost `Read the docs →`

NO black band (apple's signature), NO chocolate band (ember), NO deep-ink
band (sage) — anthropic carries closing on cream-subtle. The orange filled
download CTA is the third + final filled-orange of the page (hero · sibling
center anchor · closing); per Don't, no fourth filled orange.

→ **Rule**: closing CTA on cream-subtle. Two buttons (download + docs).
No third hero-style headline on the closing — keep h2 size restrained.

## Typography rules (strict)

| Element | Font | Size | Weight |
|---|---|---|---|
| Family eyebrow | Poppins upper | 11.5px, `letter-spacing:0.14em` | 700, `--anth-orange` |
| Hero h1 | Poppins | 48-56px, `letter-spacing:-0.02em` | 600, two stacked lines |
| Hero subtitle | Lora | 18-19px / 1.6 | 400, ONE `<em>` |
| At-a-glance label | Poppins upper | 11.5px / `letter-spacing:0.14em` | 700, `--anth-text-secondary` |
| At-a-glance value | Poppins | 18-20px | 600, `--anth-text` |
| Use-case title | Poppins | 18px | 600 |
| Use-case body | Lora | 15.5px / 1.6 | 400, ROMAN |
| Spec label | Poppins upper | 11.5px / `letter-spacing:0.14em` | 700, `--anth-orange` |
| Spec body | Lora | 16px / 1.6 | 400 |
| Spec body code | JetBrains Mono | 13.5px | 400, cream-subtle pill |
| Callout kicker | Poppins upper | 11.5px / `letter-spacing:0.14em` | 700, `--anth-orange` |
| Callout body | Lora | 17px / 1.65 | 400, ONE `<em>` |
| Sibling eyebrow | Poppins upper | 11.5px / `letter-spacing:0.14em` | 700 |
| Sibling name | Poppins | 22px | 600 |
| Sibling spec | Lora | 14px / 1.5 | 400 |
| Pricing snippet | Lora | 17px / 1.6 | 400 |
| Closing h2 | Poppins | 32-36px | 600, `letter-spacing:-0.02em` |

§H zh mapping: Lora body → Noto Serif SC; Poppins display → Noto Sans SC;
no italic on zh display headings (italic on Chinese characters reads as
broken — drop to roman in zh).

## Colour rules

Orange `#d97757` only on:
- Hero `.anth-badge` family eyebrow
- Hero filled `.anth-button` (`Try Studio`)
- Spec label text
- Use-case-card SVG accent (one per card)
- Callout left border + kicker
- Sibling-compare middle card 2px border (current-product anchor)
- Closing filled `.anth-button` (`Download Studio`)

Total filled-orange CTAs on page = **3** (hero + sibling-anchor border +
closing). Sibling-anchor is a 2px BORDER not a filled bg — the orange is
drawn from a smaller surface area than a filled button.

Cream `#faf9f5` for canvas. Cream-subtle `#f0ede3` for premise / callout /
closing bands. Warm dark brown `--anth-text` for body. Light-gray
`#e8e6dc` for table dividers + at-a-glance hairlines.

**Forbidden colours** (§K cross-skill smell):
- apple blue `#0071E3`, `#2997FF`
- ember gold `#c49464`
- sage green `#97B077`, `#d4e1b8`, `#9ab388`
- indigo/purple `#eeecff`, `#3a3d7c`

## Italic discipline (§J · 3-of-page limit)

Total italic on page = **3**:
1. Hero subtitle ONE `<em>` accent word
2. Honest-limits callout body ONE `<em>`
3. ONE optional `<em>` on a use-case body line where it earns emphasis
   (skip if no use-case body needs it — page can ship at italic count = 2)

**Forbidden italic places**:
- Spec label or spec body — roman only (italic on `#d97757` upper letters
  is unreadable)
- At-a-glance values — roman only
- Sibling-compare card — roman only
- Pricing snippet — roman only
- Closing h2 / closing button — roman only
- Use-case title — roman only

A 4th italic anywhere = §J italic-overuse warning + drift toward
wedding-invitation register.

## Don't

- Don't add a 5th use-case card. Three or four is the §I discipline; 5+
  reads as a feature wall.
- Don't render the at-a-glance values with marketing copy ("Award-winning",
  "Loved by teams"). Numbers + dates + platform names only.
- Don't embed a full pricing matrix on product-detail. ONE sentence +
  link to `pricing.html`.
- Don't render the use-case SVGs as gradient blobs or stock icons.
  Hand-drawn anthropic 5-color illustrations only.
- Don't put a 4th filled-orange CTA on the page. Three is the page max.
- Don't skip the honest-limits callout. A product-detail without limits
  reads as marketing.
- Don't put the spec table inside a card with shadow. Spec table is a
  hairline-divided list, not a tile — chrome distracts from the data.
- Don't write h1 in ALL CAPS or with a colon. Sentence-case product name
  + tagline.
- Don't add a "testimonial wall" with quote cards from customers. Anthropic
  product-detail uses concrete name-drops inside use-case bodies, not
  testimonial pull-quotes.

## When NOT to use this canonical as a template

- **Skill / company overview** (multiple products) → `landing.html`.
- **One-feature deep argument** → `feature-deep.html`.
- **Pricing matrix** → `pricing.html`.
- **2-4 product side-by-side comparison** → `comparison.html`.
- **API reference + code samples** → `docs-home.html`.

## Extensibility: porting this template

product-detail is a **new page-type** (Wave 2 #5 · 2026-05-02). This
canonical is the anchor; the next 3 ports (apple / ember / sage) follow
the same information architecture and swap the visual surfaces.

| Surface | anthropic | apple | ember | sage |
|---|---|---|---|---|
| Family eyebrow | filled `.anth-badge` orange (`Skypad Studio · part of the Skypad lineup`) | text-only blue label | gold-hairline + Fraunces small caps | numbered marker `01 · STUDIO` |
| Hero h1 | Poppins 48-56px stacked, ONE italic accent in subtitle | SF Pro Display 64-80px stacked, NO italic | Fraunces 56-64px stacked, ONE italic accent in h1 | Instrument Serif 80-96px stacked, ONE italic accent in h1 |
| At-a-glance row | hairline-divided 4-col on cream | hairline-only thin row, no card | hairline-divided + warm-cream | numbered-marker labels `01 · 02 · 03 · 04` |
| Use-case grid | 3-col anth-card with SVG | 3-col hairline-card with SF Pro mock | 3-col 12px-radius warm cards with gold accent | 3-col 4px-radius white plates with sage hairline |
| Spec table | 240px-label · Lora body · code in cream-subtle pill | 280px-label · SF Pro Text · monospace code | gold-hairline labels · IBM Plex Mono code | sage-hairline rows · numbered-marker section above table |
| Sibling compare | 3 cards, current = 2px orange border | 3 cards, current = filled blue header | 3 cards, current = gold border + warm-cream bg | 3 cards, current = sage hairline + numbered marker on current |
| Closing band | cream-subtle, NO band chrome | black band (apple signature) | chocolate band (ember signature) | deep-ink band (sage signature) |
| Italic count | 3 (hero + callout + 1 use-case) | 0 | 3 (hero + callout + 1 use-case) | 3 (hero + callout + 1 use-case) |
| Filled-orange / equiv CTAs | 3 (hero / sibling anchor / closing) | 3 (hero / sibling anchor / closing) | 3 (hero / sibling anchor / closing) | 3 (hero / sibling anchor / closing) |

Same skeleton, same evidence-first contract — four voices.

## Verified

Rendered at 1440 × ~5000px. Targets all four gates:

| Gate | Result |
|---|---|
| `verify.py` | OK (incl. §M self-diff + §1.22 zh-halfwidth-punct) |
| `visual-audit.mjs` | OK (`--ignore-intentional`) |
| `screenshot.mjs` | png saved |
| `--multi-critic` (composition / copy / illustration / brand) | target weighted ≥ 90 / 100 |

Italic count is **2-3 / 3 §J ceiling**: hero subtitle accent word,
honest-limits callout `<em>`, and optionally ONE use-case body `<em>`.
All spec labels, at-a-glance values, sibling cards, pricing snippet
ROMAN.

**Ship significance**: anthropic/product-detail is **Wave 2 第 5 张**
(canonical 24 → 25). New page-type · no precedent · this .md is the
reference for the next 3 horizontal ports (apple / ember / sage) where
the "port surfaces" table above is the cheatsheet. **matrix 第三台阶
起步**。
