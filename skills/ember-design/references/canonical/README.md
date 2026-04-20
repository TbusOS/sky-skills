# ember-design · canonical library

> 10 canonical page-types rendered at their **best** in the ember-design
> voice. These are the reference pages that:
>
> - **Generator** reads before writing a new page of the same type
> - **Critic** reads to score "is this a good anthropic `<page-type>`?"
> - **Planner** reads to know what sections a sprint-contract of this
>   page-type should include

This library is the **biggest single lever** in the harness design (see the
[roadmap](../../../../docs/HARNESS-ROADMAP.html)). Model output without
reference regresses to "the most average web design." With a canonical,
quality is anchored at the style's own best.

## What lives here (target: 10 pages)

| Page type | File | Status |
|---|---|---|
| Pricing | `pricing.html` + `pricing.md` | ⏳ planned |
| Landing | `landing.html` + `landing.md` | ⏳ planned |
| Docs home | `docs-home.html` + `docs-home.md` | ⏳ planned |
| Blog index | `blog-index.html` + `blog-index.md` | — |
| Product detail | `product-detail.html` + `product-detail.md` | — |
| Team | `team.html` + `team.md` | — |
| Comparison | `comparison.html` + `comparison.md` | — |
| FAQ | `faq.html` + `faq.md` | — |
| Changelog | `changelog.html` + `changelog.md` | — |
| Feature deep | `feature-deep.html` + `feature-deep.md` | — |

Each page-type's `.md` sibling is **required reading** for any generator
about to produce that page-type. The `.md` states:
- What the 5–10 design decisions are, and *why*
- Typography rules (font × size × weight per element class)
- Colour rules (when to use gold accent; when not)
- Don'ts
- When this canonical **isn't the right template** (e.g. usage-based pricing)

## Do / don't

- **Do** fork this pattern when a new generator task matches a page-type.
- **Do** treat every `.md` as binding — the `.html` without the `.md` is
  half the lesson.
- **Don't** copy canonicals from another style (e.g., don't use
  `apple-design/canonical/pricing.html` as a template for an
  ember-pricing page). The whole point of per-style canonicals is to
  **preserve each style's identity**. Cross-copying flattens the voices.
- **Don't** ship a canonical without verifying it passes all three
  `bin/design-review` gates. Broken canonicals poison downstream output.

## Lifecycle

When a new page-type earns inclusion:

1. Write the `.html` (full page, real content, no placeholders).
2. Write the `.md` with the 7-ish design decisions and strict typography / colour rules.
3. `bin/design-review skills/ember-design/references/canonical/<name>.html` → 0 errors.
4. Take a full-resolution screenshot (committed as `<name>.png` next to the HTML).
5. Update this README's table.

When `library-grower` (期 8) lands, this process becomes semi-automatic:
5 successful real-page outputs of the same type → auto-distilled into a
candidate `.html` + `.md`, human-approved, merged.
