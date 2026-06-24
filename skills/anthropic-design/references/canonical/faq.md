# Canonical · anthropic-design faq

> What makes this a good anthropic-design FAQ page. Read this **before**
> generating a new anthropic-design FAQ page.

---

## The 7 decisions that make this work

### 1. No top banner — the hero is wayfinding, not marketing

The landing canonical opens with a `.anth-banner` announcing shipping news.
This page deliberately drops it. A visitor on an FAQ page has a problem;
the first screen's only job is to route them to the answer. The hero is:
orange kicker (`Support · FAQ`) + a two-line noun-phrase h1 + one subtitle
sentence that names the three topics and promises a human within 48 hours.

### 2. Hero jump chips — one click from anxiety to answer group

Three pill links (`.faq-jump`) under the subtitle, each naming a group and
showing its question count (`Pricing & billing · 5`). A visitor arrives
with exactly one anxiety — money, data, or trust — and the chips collapse
"scan 14 rows" into "click your group." The count is a promise that the
scan inside the group is short.

### 3. Stat strip with checkable support numbers, not trust badges

Four stats: `14` questions answered below, `0` chatbots between you and a
human, `48h` first-reply SLA on Pro, `100%` of audit reports published.
Every number is either verifiable on this page (14) or a commitment the
reader can hold against us (48h, 100%). A support page earns trust with
checkable numbers; logo walls argue nothing. The strip also breaks the
otherwise text-only page early (diagram-density contract).

### 4. Native `<details>/<summary>` accordion — a11y from the platform

Each question is a `<details class="faq-item">` with a `<summary
class="faq-q">`. Keyboard toggling (Enter/Space), focus order and
screen-reader expanded/collapsed state all come from the platform and
survive JS failure. The only cost is no animated open/close height —
acceptable for a restraint-first skill. `summary` gets a custom
`:focus-visible` orange outline; the default marker is replaced with an
orange `▸` chevron that rotates 90° when open.

The **first question of group 1 is pre-opened** (`<details open>`): one
open item teaches the interaction and shows answer depth without doubling
page height.

### 5. Three groups ordered money → data → trust

`Pricing & billing` (5) / `Notes, sync & devices` (4) / `Security &
privacy` (5). Each group is its own `.anth-section` (alternating cream /
cream-subtle bands), headed by an orange kicker + 28px h2 + one-sentence
lead. Group order follows question frequency: most visitors come about
billing, the fewest — but highest-stakes — come about security, which is
why security gets the diagram (below) rather than the top slot.

### 6. One real diagram, placed where prose is least trusted

A 3-hop e2e sync flow SVG (920×284, `anth-container` breakout from the
720px question column) heads the security group: device (orange focus
card, "key derived from your passphrase") → server (blue, "ciphertext
only · zero keys stored") → other device (green, "decrypts locally").
Solid numbered badges, colored arrows, dot-grid paper texture, protocol
pill (`XChaCha20-Poly1305 · audited every 6 months`), real figcaption.

"End-to-end encrypted" is the claim readers least trust as prose. Three
numbered hops showing where the key lives argue it better than 60 words —
and two answers in the group then point at the picture instead of
re-explaining it.

### 7. Answers are concrete and consistent with the pricing canonical

Every number in the answers is canon, not improvised: Pro $9/month billed
yearly, $3 student price, Team $29/seat with a 30-day 5-seat pilot,
90-day version history (trims to 7 on cancel), 5 Pro devices, 48h/24h
reply SLAs, audits every 6 months at `/security`. An FAQ that dodges
concrete numbers is useless; an FAQ that contradicts the pricing page is
worse. When prices change, this page must be updated in the same commit.

The voice stays anthropic: plain sentences, no apology, no exclamation
marks, and the occasional honest edge ("including the awkward ones",
"people who need the discount shouldn't have to prove it twice").

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Poppins | 56px | 600, `letter-spacing:-0.02em` |
| Hero subtitle | Lora | 19px | 400, `line-height:1.6` |
| Hero kicker (`.faq-kicker`) | Poppins upper | 11.5px | 700, `letter-spacing:0.14em`, orange |
| Jump chip (`.faq-jump`) | Poppins | 13px | 500 |
| Stat number | Poppins | 44px | 700, `letter-spacing:-0.02em` |
| Stat label | Poppins | 13px | 400 |
| Group h2 | Poppins | 28px | 600, `letter-spacing:-0.01em` |
| Group lead | Lora | 16px | 400, `line-height:1.6` |
| Question (`.faq-q`) | Poppins | 17px | 600, roman — never italic |
| Answer (`.faq-a`) | Lora | 15.5px | 400, `line-height:1.65`, `max-width:640px` |
| Figcaption | Lora | 13.5px | 400 |
| CTA button | Poppins | 15px | 600 |

Chinese (`data-lang="zh"`): Noto Sans SC for headings / questions /
kickers / stats; Noto Serif SC for answers, leads and figcaption. All zh
copy uses full-width punctuation (,。?:「」).

---

## Colour rules

Orange `#d97757` only on: hero kicker, group kickers, accordion chevrons +
`:focus-visible` outline, the diagram's focus card / badge / arrow, nav
CTA and the "Email support" button. Exactly **2 filled orange buttons**
(nav `Start writing` + support band `Email support`). Diagram carries
3 semantic hues — orange (your device, focus), blue `#6a9bcc` (server),
green `#788c5d` (receiving device) — as solid badges, 4px color bars and
colored arrows on white/tint cards; the protocol pill is a blue 16% tint.
Everything else is cream + warm dark brown.

## Don't

- Don't make `.faq-q` italic — questions are display headings, and
  italic-overuse counts them (§J).
- Don't replace `<details>/<summary>` with div+JS accordions — you lose
  free keyboard/AT behaviour and gain only an animation.
- Don't collapse everything: keep exactly one item pre-opened.
- Don't write answers that dodge numbers ("contact sales for pricing") —
  the page's entire value is concrete prices, SLAs and file paths.
- Don't invent facts that contradict the pricing canonical — same product,
  same numbers, same commit when they change.
- Don't add a search box for 14 questions — groups + chips already get
  the reader there in one click; search implies a haystack this page
  shouldn't be.
- Don't run three text-only groups back to back — the security diagram
  (or an equivalent real figure) keeps the page inside the
  diagram-density contract.

## When not to use this canonical

- Dozens of questions across many products — use docs-home canonical with
  a search-first layout instead; accordion groups stop scaling around 20+.
- Questions that need long tutorial-style answers with code blocks — use
  feature-deep canonical; accordions punish long content.
- A pricing page that needs a short FAQ section — borrow the flat
  `.faq-item` list from the pricing canonical, not this page's full
  group + chips structure.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py + visual-audit (0 error 0 warn with
  `--ignore-intentional`) + screenshot eyeball
