# corpus/ — successful-page collection for library-grower (component 08)

Layout: `corpus/<skill>/<page-type>/*.html`. Each file is a page that **passed
all four design-review gates with a critic score ≥ 88**. `/design-loop` deposits
a page here on a successful ship:

    node skills/design-review/scripts/library-grower.mjs --deposit \
      --skill=<s> --page=<type> <shipped-page.html>

When a `<skill>/<page>` directory holds ≥ 5 pages, `library-grower` can distill a
candidate canonical from them:

    bin/design-review --distill --skill=<s> --page=<type>

The candidate is a DRAFT for human review — the grower proposes, it never ships
into the canonical library by itself. This corpus is intentionally empty until
real ≥88 pages accumulate; do not pad it with demos/fixtures.
