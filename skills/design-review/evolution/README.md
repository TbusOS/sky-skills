# evolution/ — state for the self-evolution loop (component 09)

This directory holds the persistent state for `design-evolve` (the harness's
self-improvement loop). The loop, its guardrails, and the round protocol live in
`skills/design-evolve/SKILL.md`; the scripts that read/write this state live in
`skills/design-review/scripts/`.

## Files

| File | What it is | Tracked? |
|---|---|---|
| `ledger.tsv` | Append-only experiment log — one row per proposed change: `base → new` score, `keep`/`revert`, which axis, what changed. Karpathy autoresearch's `results.tsv`. Read it with `bin/design-review --ledger --frontier`. | ✅ committed — it's the history the loop reasons over |
| `rules.json` | Rule registry with EvolveR success scores `s=(catches+1)/(fires+2)`. A rule earns its place by catching real regressions; one that nags without catching sinks and becomes a prune candidate. `bin/design-review --rules --report`. | ✅ committed — accumulated knowledge |
| `regression-baseline.<skill>.json` | Snapshot of every canonical's error/warning counts, used by the held-out anti-overfit gate. | ❌ gitignored — per-environment (Playwright version), regenerated via `--regress --baseline --skill=X` |

## The one rule that makes this safe

The loop mutates **generator rules/templates**, never the **evaluator**. It must
not edit `verify.py`, `visual-audit.mjs`, or the critic rubric in a round — if
the optimizer could change the test, it would "improve" by loosening it. A wild
new idea is allowed to be tried; it survives only if the frozen evaluator scores
it strictly higher *and* no existing canonical regresses. Selection, not
authorship, decides — so the system may discover techniques better than the
hand-written ones, without being able to cheat its way there.
