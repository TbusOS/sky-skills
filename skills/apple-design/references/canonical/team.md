# Canonical · apple-design team

> What makes this a good apple-design team page. Read this **before**
> generating a new apple-design team / about page.

---

## The 7 decisions that make this work

### 1. Hero states the org design, not a slogan — 96px h1

`<p style="color:#0071E3">Skypad · The people behind the page</p>` above a
96px SF Pro Display 700 h1: "Eight people. On purpose." Two sentences max
of subtitle (24px), and the subtitle must contain a concrete fact ("the
person who answers your support email also wrote the code it's about").

**Why a number, not a value-word**: "Passionate about craft" is what every
team page says. A countable claim ("eight people, seven cities") is
checkable against the grid right below — the page proves its own hero.

### 2. Geometric grayscale SVG portraits — never photos, never initials

Each member card has a 200×150 SVG portrait: white head circle on a
`#f5f5f7` tile, hair / glasses / headset / bun drawn as solid geometric
shapes in the gray ramp (`#1d1d1f / #6e6e73 / #86868b / #aeaeb2`), two
ink-dot eyes. Same "schematic, not photographic" rule as the landing
canonical's use-tiles.

Blue budget: at most **2 portraits** in the whole grid carry one small
blue accent each (here: Mara's round glasses, Daniel's pocket pen — the
two founders). That accent is the only founder marker besides role text.

**Why**: photo placeholders are forbidden (verify.py), stock photos are
AI slop, and initial-circles carry zero personality. Hand-drawn
silhouettes are the only option that is both real and on-palette.

### 3. Member cards are anti-hollow: 4 text layers under the portrait

Name (22px 600) · role (15px 500 secondary) · city (13px secondary) ·
one-sentence bio (15px, 1.5 line-height). The bio must be a **specific
anecdote** ("tested on a 2014 ThinkPad he refuses to retire"), not a
trait list ("passionate, detail-oriented"). 8 members in an equal 4×2
grid — equal width is the message on a team page that claims flatness.

### 4. Stat strip encodes absence — same voice as landing's "0 trackers"

Four 72px stats: 8 people · 7 cities · **0** offices / standups / growth
team · **100%** of support answered by the person who wrote the code.
Two of the four numbers describe what's missing. The landing canonical
established "0 ads · trackers · notifications" as Skypad's voice; the
team page repeats the move so both pages read as one company.

### 5. The process gets a real flow diagram with a kill-question

"How a feature ships" is a 4-step flow SVG (diagram-craft §12 function-
flowchart genre): soft-shadow white step cards, blue happy path with
numbered badges, **one** `#eaf3fe` decision diamond asking "Still
quiet?", dashed gray fail-loop back to Build labeled "no · rework or
cut". English labels inside the SVG (like the landing's editor mock);
the bilingual `<figcaption>` carries the zh reading.

**Why a diamond, not a list**: the decision IS the team's identity — a
mechanical taste gate, not a vibe. Prose would bury it; the diamond makes
it the visual center of the diagram.

### 6. Black pull-quote is spoken from inside the team

44px italic quote on pure `#000000`, but unlike the landing (customer
testimonial), the speaker is a founder defining the team's success
metric: "The best compliment we get is silence." A team page quoting a
customer ducks its own subject. This is still the page's only italic
moment (§J).

### 7. Hiring CTA is honest about pace — pale-gray band

64px h2 "Help us stay small.", copy names the actual open roles ("a
desktop engineer (Rust) and a support writer"), filled `.apple-button` +
text-link alternate. Fine print states working conditions (async by
default, overlap hours, onboarding in writing) — the same slot the
landing uses for system requirements.

---

## Typography rules

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero kicker (blue) | SF Pro Display | 15px | 500 `color:#0071E3` |
| h1 hero | SF Pro Display | 96px | 700 `letter-spacing:-0.035em` |
| Subtitle | SF Pro Display | 24px | 400 `letter-spacing:-0.01em` |
| Stat number | SF Pro Display | 72px | 700 `letter-spacing:-0.035em` |
| Stat label | SF Pro Text | 15px | 400 |
| Section h2 | SF Pro Display | 48-56px | 700 `letter-spacing:-0.03em` |
| Member name h3 | SF Pro Display | 22px | 600 `letter-spacing:-0.015em` |
| Member role | SF Pro Display | 15px | 500 secondary |
| Member city | SF Pro Display | 13px | 400 secondary |
| Member bio | SF Pro Text | 15px | 400 `line-height:1.5` |
| Value-card title | SF Pro Display | 26px | 600 `letter-spacing:-0.02em` |
| Figcaption | SF Pro Text | 14px | 400 secondary, centered |
| Pull-quote | SF Pro Display | 44px | 500 `letter-spacing:-0.025em` italic |
| Hiring h2 | SF Pro Display | 64px | 700 `letter-spacing:-0.035em` |

One font family (SF Pro). No italic on headings; italic reserved for the
black-band quote (§J).

---

## Colour rules

Blue `#0071E3` only on: hero kicker, nav/inline links, filled
`.apple-button`, value-card icon strokes, the flow diagram's happy path
(lines + badges + diamond border), and ≤2 small portrait accents. All
other portrait/diagram shapes stay on the gray ramp. Section alternation:
white ↔ `#f5f5f7` ↔ black (quote band only).

## Don't

- Don't use photos or photo placeholders for members — geometric SVG
  portraits only (verify.py placeholder check + visual fidelity).
- Don't give founders bigger cards. Equal 4×2 grid; flag founders with
  role text + one small portrait accent. A size hierarchy contradicts a
  "no managers of managers" claim in the same viewport.
- Don't write trait-list bios ("passionate about quality"). Every bio is
  one checkable anecdote.
- Don't put more than 2 blue accents in the portrait grid, or more than
  one narrative focus of blue in the flow diagram (diagram-craft §0).
- Don't quote a customer in the pull-quote — that's the landing page's
  job. Team page quotes a team member about the team.
- Don't list open roles as a generic "We're hiring!" — name the actual
  roles and the working conditions.
- Don't use Fraunces, Instrument Serif, Lora, Poppins, orange, gold or
  sage-green anywhere (cross-skill smell §K).

## When not to use this canonical

- Company page for a large org (50+ people) — per-member geometric
  portraits don't scale; switch to team-cluster cards + leadership row.
- Team page whose main job is investor/press credibility — needs logos,
  bios with track records, headshot conventions; apple's playful
  geometric portraits undercut that register.
- Solo-maker about page — one person needs a narrative essay layout
  (anthropic blog voice), not a member grid.

## Status
- **Version**: v1 · 2026-06-11
- **Passes**: verify.py + visual-audit (0 error · 0 warn,
  1 brand-intentional suppressed) + screenshot eyeball
