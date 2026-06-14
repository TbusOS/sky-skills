---
description: "Run the full design iteration loop (harness component 06): planner → generator → three machine gates → critic, up to --max-rounds (default 5). Verdict ≥ 88 ships; anything less feeds the critic's issues into the next round; rounds exhausted escalates to a human with the score trajectory. Accepts a brief + --skill (required), optional --page / --max-rounds."
argument-hint: "<brief…> --skill=<anthropic|apple|ember|sage|glass> [--page=<type>] [--max-rounds=<n>]"
---

# /design-loop — orchestrated planner → generator → review → critic rounds

You are executing **harness component 06 · /design-loop**. Models default
to "ship the first-pass output" — without orchestration, iteration ends
after 1–2 rounds. This command forces the planner → generator → review →
critic cycle for up to N rounds, or escalates to a human.

## Arguments (parse from `$ARGUMENTS`)

- **brief** — everything that is not a flag. **Required.**
- `--skill=<name>` **required** — anthropic | apple | ember | sage
- `--page=<type>` optional — pricing | landing | docs-home | …; if
  omitted, infer it from the brief per design-planner step ①
  (ask the user at most once if it cannot be inferred).
- `--max-rounds=<n>` optional — default **5**.

If the brief or `--skill` is missing, print:

```
/design-loop — missing brief or --skill
usage: /design-loop <brief…> --skill=<name> [--page=<type>] [--max-rounds=<n>]
```

and stop. Paths below are relative to the sky-skills repo root that
holds this command file; use absolute paths if the CWD differs.

## Three-layer constraints (frame every round with these)

1. **Aesthetics are immutable** — the skill's visual language (fonts,
   palette, brand-accent placement) is defined by
   `skills/<skill>-design/references/`. Never negotiated inside the loop.
2. **Quality is machine-gated** — diagram density, bilingual, contrast,
   a11y are enforced by `verify.py` + `visual-audit.mjs` + critic. The
   loop's job is to satisfy them, never to reinterpret them.
3. **Structure is free** — section count, order, and form follow the
   content. Contract §1 structure is a strong default for known
   page-types and only a reference for LOW-CONFIDENCE ones.
   **Templates are a starting point, not a spec.**

## Round 1 setup (steps ① and ② run once)

### ① Pull the sprint contract + initialize the loop driver

```bash
bin/design-review --plan --skill=<skill> --page=<page> > /tmp/contract-<slug>.md
bin/design-review --loop --init --skill=<skill> --page=<page> \
  --file=<out.html> --brief="<brief>" --max-rounds=<n>
```

The first line gives the generator the full contract to read. The second
sets up `design-loop.mjs` — it creates `<out.html>.loop.log`, captures the
contract's machine summary + the ship bar, and starts the round counter. From
here the driver owns the bookkeeping (round count, ≥88 ship gate,
escalate-at-max, the log, deposit-on-ship); you own generation + critics.

If stderr marks the contract **LOW-CONFIDENCE** (no canonical for this
page-type; structure borrowed from the nearest one), relay that label
as-is into the plan and every later round — do not upgrade it, do not
hide it, do not treat borrowed structure entries as binding.

### ② Expand the brief into a section plan

Follow `skills/design-planner/SKILL.md`: infer page-type + audience,
then write the section plan (one structure line + one content line +
one visual line per section) plus the hard numbers from the contract
(diagram density, brand presence, bilingual, fonts/palette). Where plan
and contract conflict: aesthetics/quality layers follow the contract,
structure layer follows the plan.

## Every round (steps ③–⑥)

### ③ Generate or modify the HTML

Round 1: generate from plan + contract using the `<skill>-design` skill
(read contract §0's listed files first). Rounds 2+: apply the carried
issue list from step ⑥ — smallest-scope fixes, no wholesale rewrites of
sections the critic did not flag.

### ④ Run the three machine gates

```bash
bin/design-review <file.html>
```

Any **error** → fix and re-run within the same round until errors are
clear. Fix priority follows cross-skill-rules §E.2 (known-bugs §E.2
lesson): (a) ask if the element has design intent → (b) prefer moving /
re-laying-out / shortening → (c) delete only when truly redundant.
Deleting content is the last resort, never the first.

### ⑤ Critic (independent subagent — never yourself)

Default: dispatch the solo `design-critic` subagent via Task in a fresh
context, target = the HTML path. Escalate to **multi-critic** (the 4
specialists composition / copy / illustration / brand via
`bin/design-review --multi-critic`, weights 25/25/20/30) when either:

- this is the **final round** (round = max-rounds), or
- the previous solo verdict was **borderline** (85–91): specialists
  disagree where a generalist averages, and that disagreement is signal.

### ⑥ Verdict gate — hand the result to the driver

Do not decide ship/continue/escalate yourself; record the round and obey the
driver's `DECISION:` line (it owns the ≥88 bar, the counter, and escalate-at-max):

```bash
bin/design-review --loop --record --file=<out.html> --round=<N> \
  --gates=<pass|fail> [--score=<n>] [--critic=solo|multi] [--issues="i1; i2; …"]
```

- `--gates=fail` (errors still open) → `DECISION: fix` — resolve gate errors in
  THIS round, re-run, record again; no critic until gates are green.
- `--gates=pass --score=<n>`:
  - `DECISION: ship` (≥ 88) → the driver deposits the page into
    `corpus/<skill>/<page>/` (feeds component 08) and prints the trajectory.
  - `DECISION: revise` (< 88, rounds left) → carry the `--issues` verbatim into
    round N+1 step ③, smallest-scope edits only.
  - `DECISION: escalate` (< 88 at max-rounds) → stop; see below.

`--record` appends the round block to `<out.html>.loop.log` for you; inspect the
trajectory any time with `bin/design-review --loop --status --file=<out.html>`.

## Rounds exhausted (no verdict ≥ 88 after max-rounds)

**Stop.** Escalate to the human with:

1. the score trajectory (one line per round: `R1 82 → R2 85 → …`),
2. the unresolved issues, grouped by how many rounds each survived,
3. your best hypothesis for why the loop plateaued (brief ambiguity?
   contract/structure mismatch? a constraint the gates and critic pull
   in opposite directions?).

Explicitly forbidden at this point: lowering the 88 bar, re-running with
gates skipped, "one more round" beyond max-rounds, or silently shipping
the best-scoring draft as if it had passed.

## What you must not do

- Do not skip step ① — generating without a contract is the exact
  failure mode this component exists to stop. No contract, no round 1.
- Do not invoke any critic while machine-gate **errors** are open.
  Critic attention is spent on taste, not on lint the gates already
  catch. Warnings are allowed through; errors are not.
- Do not act as the critic yourself or paraphrase-and-score inline. The
  verdict must come from an independent subagent in a fresh context
  (`design-critic`, or the 4 specialists). Self-review produces uniform
  praise — that is the model weakness component 05 documents.
- Do not delete content to pass a gate. Overlap, density, and contrast
  failures follow the §E.2 priority: intent → relayout → delete-last.
- Do not modify the contract, the canonicals, or any gate threshold
  mid-loop — that is design-review / design-learner territory.
- Do not exceed `--max-rounds`, and do not loop on an unchanged file:
  if a round produces no diff, that is a plateau — escalate early.
