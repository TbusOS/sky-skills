# Canonical · anthropic-design team

> What makes this a good anthropic-design team (about) page. Read this
> **before** generating a new anthropic-design team page.

---

## The 7 decisions that make this work

### 1. The hero states verifiable counts, not a mission

`Nine people.` / `Three cities.` / `One quiet product.` — the landing
canonical's three-line noun-phrase stack, but every line is a number the
rest of the page can be checked against (member grid has nine cards, the
stat strip repeats 9 and 3, the timezone diagram shows the three cities).

**Why not a mission statement**: "We believe in calm software" reads as
recruiting copy and can't be verified. Counts make the page feel audited
rather than written. An orange `.team-kicker` ("The team") above the h1
doubles as the brand-presence anchor in the top 500px.

### 2. Geometric SVG avatars — never photos, never initials

Each member card carries a 72px circle-clipped SVG built from the 5-colour
imagery palette (orange / blue / green / mid-gray / cream-subtle): one
large form + one accent + one hairline curve, opacity 0.8–0.95, no
gradients. Nine distinct compositions, no two alike.

**Why**: imagery.md forbids realistic faces; photo placeholders rot into
grey boxes; initials-in-a-circle is the default avatar of every admin
template. Geometric marks stay on-palette and scale as vectors.

### 3. Member cards are anti-hollow by contract

Every card has five layers: avatar + name (Poppins 18px 600) + role
kicker (orange, 11px uppercase) + one-sentence bio (Lora 15.5px) + a
colour-coded city tag. The bio must claim something concrete and
product-tied ("writes the audit notes we publish every six months"),
not "loves coffee and hiking".

The 3×3 equal grid is correct here — members are peers, so §I's
"hierarchy beats equal weight" rule does not apply. No founder card is
enlarged.

### 4. City dots share hues with the timezone diagram

Berlin = blue, Toronto = green, Kyoto = gold — assigned once on the
member cards and reused as the lane colours of the timezone figure two
sections later. One colour vocabulary across the page; the reader who
scanned the grid already knows how to read the diagram.

### 5. The timezone lane diagram argues, it doesn't decorate

A sched-timeline-genre figure: three lanes (Kyoto / Berlin / Toronto),
local 09:00–17:00 blocks mapped onto one UTC axis, orange dashed bands
marking the only shared windows (1 h and 2 h). The figure proves the
page's central claim — async writing is forced by geometry — where a
world-map-with-pins would only say "we are remote". The figcaption
states the takeaway ("decisions are written, not spoken").

### 6. The shipping flow has exactly one branch — and that's the point

`Write the RFC → Async review → Build behind a flag → [touches sync?]
→ Ship + changelog`, with a single gold conditional branch through
"External crypto review". Main path orange with numbered badges, written
artifacts blue dots, code green, the release card is the one focus card
(orange tint + border). Four hues, one diamond, one legend. The branch is
the only structurally interesting fact in the process; a numbered text
list would flatten it away. Wide container (≥20 SVG labels per §8.1).

### 7. The hiring CTA is honest about cadence

"We hire about twice a year, when a job starts to hurt. New roles appear
in the changelog before anywhere else." — an evergreen "Join us! We're
growing!" banner would contradict the "Small on purpose" value card one
screen earlier. Two CTAs only: filled "See open roles" + ghost "Read the
handbook". With the nav button that keeps the page at two filled orange
buttons.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| h1 hero | Poppins | 56-64px | 600, `letter-spacing:-0.02em` |
| Hero kicker | Poppins upper | 11.5px | 700, `letter-spacing:0.14em`, orange |
| Subtitle | Lora | 20px | 400, `line-height:1.6` |
| Stat number | Poppins | 44px | 600, `letter-spacing:-0.02em` |
| Stat label | Poppins | 13px | 400 |
| Member name | Poppins | 18px | 600 |
| Member role kicker | Poppins upper | 11px | 700, `letter-spacing:0.12em`, orange |
| Member bio | Lora | 15.5px | 400, `line-height:1.6` |
| Member city tag | Poppins | 12.5px | 400, secondary |
| Value-card title | Poppins | 24px | 600 |
| Value-card body | Lora | 16px | 400, `line-height:1.65` |
| Pull-quote | Lora | 24px | 400, italic (the page's only italic) |
| SVG card label | Poppins | 12.5px | 600 |
| SVG sub-label / legend | Poppins | 11px | 400 |
| CTA button | Poppins | 14px | 600 |

---

## Colour rules

Orange `#d97757` only on: hero kicker, member role kickers, pull-quote
border + cite dot, diagram main path / badges / focus card / shared-hour
bands, and the two filled CTA buttons. City + diagram category hues:
blue `#6a9bcc` (Berlin, written artifacts), green `#788c5d` (Toronto,
code), gold `#c9913f` (Kyoto, security branch) — solid dots, 16-20%
tints for containers, per diagram-craft §1. Everything else cream +
warm dark brown.

## Don't

- Don't use photo or initials avatars — geometric SVG marks are the
  signature (and imagery.md forbids realistic faces).
- Don't enlarge a founder card in the member grid — members are peers;
  hierarchy here would read as an org chart, not a team.
- Don't write bios as personality trivia ("loves hiking") — every bio
  claims one concrete, product-tied responsibility.
- Don't replace the timezone diagram with a world map — the diagram
  carries the async argument; a map is decoration.
- Don't add an evergreen "We're growing!" hiring banner — it contradicts
  the "Small on purpose" value card.
- Don't exceed two filled orange buttons (nav + hiring CTA).

## When not to use this canonical

- Company with 30+ people — a 9-card grid doesn't scale; switch to
  grouped sections per function with smaller cards, and drop the
  one-bio-per-person promise.
- Hiring-first careers page — this is an about page with a hiring tail;
  a real careers page needs role listings as the hero, not a CTA band.
- Single-founder product — "the nine of us" structure collapses; use a
  letter-from-the-founder layout (feature-deep prose canonical is
  closer).

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py OK (SEO warns clear) · visual-audit 0 error 0 warn
  (2 brand-intentional suppressed) · screenshot eyeballed
