---
description: "Distill a candidate canonical from ≥5 successful same-type pages (harness component 08 · library-grower). Wraps bin/design-review --distill. Accepts --skill / --page (required) + optional --corpus / --out. Below the 5-sample threshold it reports 'insufficient samples' and stops — it never pads the corpus to force a run."
argument-hint: "--skill=<anthropic|apple|ember|sage|glass> --page=<pricing|landing|docs-home|new-type> [--corpus=<dir>] [--out=<dir>]"
---

# /design-distill — grow the canonical library from real successes

You are executing **harness component 08 · library-grower**. The other
components judge single pages; this one looks *across* pages: once 5+
real outputs of the same skill × page-type have passed all 4 gates
(critic ≥ 88), it extracts the patterns they share — sections, heading
sequences, fonts, colors, classes — and proposes a **candidate
canonical** for that page-type. That is how the canonical library grows
beyond its hand-written seeds.

It is a long-term tool with a hard data threshold. With fewer than 5
samples there is no consensus to extract, so it refuses to run instead
of producing a low-confidence draft.

## Required arguments (parse from `$ARGUMENTS`)

- `--skill=<name>`  **required** — anthropic | apple | ember | sage
- `--page=<type>`   **required** — pricing | landing | docs-home | a new type
- `--corpus=<dir>`  optional — directory holding the successful pages;
  defaults to `corpus/<skill>/<page>/` under the sky-skills root
- `--out=<dir>`     optional — where the candidate is written;
  defaults to `./grower-<skill>-<page>-<timestamp>/` (in the current directory)

If either required flag is missing, print:

```
/design-distill — missing --skill or --page
usage: /design-distill --skill=<name> --page=<type> [--corpus=<dir>] [--out=<dir>]
```

and stop. Do not proceed.

## Steps you must follow (do not skip, do not reorder)

### Step 1 · Run the wrapper

The CLI is called by its installed path (`~/.claude/skills/design-review/dr-cli`),
so this runs from any directory. Pass the flags through unchanged:

```bash
~/.claude/skills/design-review/dr-cli --distill --skill=<skill> --page=<page> \
  [--corpus=<dir>] [--out=<dir>]
```

The wrapper counts `.html` files in the corpus before invoking
`skills/design-review/scripts/library-grower.mjs`.

### Step 2 · If it reports "insufficient samples" (exit 1)

This is the **expected** outcome until enough real pages have shipped.
Relay the exact count to the user, e.g.:

```
样本不足:corpus 目录里只有 N 张 .html,蒸馏需要 ≥5 张
(每张都要过完四闸、critic ≥ 88)。先攒页,攒够再来。
```

Then **stop**. Do not:

- call `library-grower.mjs` directly to bypass the wrapper's check;
- copy demo / canonical / fixture HTML into the corpus to pad the count
  — the corpus must be real generation outputs that passed the gates;
- lower `MIN_SAMPLES` anywhere.

### Step 3 · On success, report the output location

`library-grower.mjs` prints the output directory on stderr. Its
contents:

- `candidate.md`      — extracted consensus: sections, heading patterns,
  fonts, colors, common classes, plus provenance of every source page
- `provenance.json`   — machine-readable source list + per-page feature
  counts

Tell the user where the files are and how many sources fed the
consensus.

### Step 4 · Human-review handoff (mandatory — drafts never ship)

The candidate is a **draft**. Walk the user through the review steps
(they are also embedded at the bottom of `candidate.md`):

1. Read the consensus patterns — they are the new canonical's skeleton.
2. Pick ONE source page (the cleanest) as the HTML starting point.
3. Hand-write the 7-decisions `canonical.md` — consensus says WHAT is
   consistent, only a human can explain WHY.
4. Strip content-consensus: if every page says the same product name or
   price, that is copy-paste content, not structure.
5. Run `~/.claude/skills/design-review/dr-cli --critic` on the edited candidate; it must
   score ≥ 90 (the canonical bar, stricter than the 88 the sources met).
6. Only then submit it as `~/.claude/skills/<skill>-design/references/canonical/`
   via a normal PR for human merge.

Do not perform steps 1-6 yourself unless the user explicitly asks; your
job ends at handing over the draft and the checklist.

## What you must not do

- Do not write anything into `skills/*/references/canonical/` from this
  command — the grower proposes, a human merges.
- Do not run the 4 review gates here; that is plain `~/.claude/skills/design-review/dr-cli`.
- Do not treat exit 1 + "insufficient samples" as a failure to debug —
  it is the threshold working as designed. Report it and stop.
