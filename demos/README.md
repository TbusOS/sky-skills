# Demos

Same story, two aesthetics. Each demo is a single flagship HTML page showcasing the respective design skill on realistic, self-referential content (this repository itself).

| Demo | Renders | Preview |
|---|---|---|
| [`apple-design/`](./apple-design/index.html) | `skills/apple-design/` | SF Pro, white/pale-gray alternating sections, 巨字号统计, product lineup, dark section, text-link CTAs |
| [`anthropic-design/`](./anthropic-design/index.html) | `skills/anthropic-design/` | Warm cream, Poppins + Lora serif, orange filled pills, editorial cards, pull quote, inline low-saturation bar chart, 3-tier pricing |

## Local preview

```bash
# from repo root
python3 -m http.server 8000
# then open:
#   http://localhost:8000/demos/apple-design/index.html
#   http://localhost:8000/demos/anthropic-design/index.html
```

Both demos reference CSS via relative paths:

```
demos/<skill>/index.html
         │
         └─ ../../skills/<skill>/assets/{fonts.css,<skill>.css}
```

So opening them as files over HTTP (not `file://`) is enough — no build step.

## What each demo exercises

**Apple demo** exercises: `.apple-banner`, `.apple-nav`, `.apple-hero`, `.apple-section` × 4 (alternating white / alt / white / dark), `.apple-stat` × 3 column, `.apple-card` product grid × 6, `.apple-code` install block, `.apple-admonition--info`, `.apple-quote` + `.apple-quote-cite`, `.apple-footer-grid` × 5 columns.

**Anthropic demo** exercises: `.anth-nav` with orange CTA, `.anth-banner` with inline badge, `.anth-hero` + serif lead, 3 × `.anth-card` capability grid, `.anth-quote` italic with orange left rule + customer-logo cite, inline SVG low-saturation bar chart (`#6a9bcc` / `#d97757`), 3 × `.anth-card` pricing with `border: 2px solid var(--anth-orange)` on the highlighted tier, `.anth-code` + `.anth-admonition`, 6-column `.anth-footer-grid` with `.anth-social`.

## Cross-link

Each demo has a "See the other version" link near the footer so a reader can toggle between the two aesthetics on the same content and compare directly.
