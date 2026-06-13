---
name: design-evolve
description: Use when the design harness should improve ITSELF — proposing better generator rules, templates, or techniques and keeping only the ones that measurably score higher. The evolutionary/self-improvement loop (harness component 09). TRIGGER on requests like "make the design skills better over time", "let the system evolve its own rules", "auto-tune the generators", or after a batch of pages reveals a recurring weakness in one skill. Runs a Darwin-style ratchet: diagnose the weakest critic axis → propose one change → regenerate → score with the FROZEN evaluator → keep iff it strictly beats the locked baseline and no held-out canonical regressed, else git-revert. Inspired by Karpathy's autoresearch (hill-climb on one editable asset against a frozen metric) and the Darwin / EvolveR self-improving-agent line. Pairs with design-review (the frozen evaluator) and learning-loop (which codifies one-off catches; design-evolve optimizes the rules themselves).
license: Complete terms in LICENSE
---

# design-evolve — the self-improvement loop

The other harness components make a single page good. **design-evolve makes the
generators themselves better over time** — it treats a generator skill's rules
and templates as the thing to optimize, and lets the system propose changes,
test them against the frozen evaluator, and keep only measurable winners.

This is the component that answers "is the system allowed to invent something
better than what we wrote by hand?" — yes, **but only if it measurably wins**.
The ratchet is exactly what makes open-ended creative mutation safe: a wild idea
is allowed to be tried, and survives only if the frozen evaluator scores it
higher and no existing page regresses. (EvolveR's result: self-distilled
principles beat a larger teacher model's hand-written ones — because selection,
not authorship, decides.)

## The one invariant: the evaluator is FROZEN

The loop may mutate generator **rules / templates / canonicals**. It must **never**
edit the evaluator in the same breath: not `verify.py`, not `visual-audit.mjs`,
not the critic rubric/weights, not the `known-bugs` thresholds. If the optimizer
can change the test, it will "improve" by loosening the test (reward hacking —
autoresearch bans editing `prepare.py` for exactly this reason). Evaluator
changes are a **separate, human-gated** path, never an automatic loop step.

Corollary: the generator must not score its own work. Scoring always runs the
unchanged design-review evaluator as an independent step.

## What you may mutate (the editable asset)

One per round, picked by diagnosis:
- a `skills/<skill>-design/references/dos-and-donts.md` rule,
- a `skills/<skill>-design/references/*.md` craft guideline,
- a `skills/<skill>-design/templates/...` template,
- a canonical page (only via the human-gated exploratory rewrite, below).

NOT the page output itself — that is what `/design-loop` does. Here the page is
just the **measurement instrument** for a rule change.

## The loop (one round)

Run from repo root. `S`=skill, `P`=page-type, `B`=a fixed test brief for `S`×`P`.

0. **Lock the baseline.** Generate `S`×`P` from `B` with the *current* rules,
   run the full evaluator, record the critic score as `base`. Snapshot the
   held-out set: `regression-gate.mjs --baseline --skill=S`. Both are now the
   bar to beat. Start a git branch `evolve/<skill>-<page>-<date>`.

1. **Diagnose the weakest axis.** From the multi-critic verdict take the
   lowest-scoring axis (composition / copy / illustration / brand). That axis,
   and the specific issues under it, decide what to change. Never mutate
   randomly — diagnosis-directed only.

2. **Propose ONE change** aimed at that axis. One change per round so the score
   delta is attributable. Priority order (most to least likely to move the
   needle): **effectiveness** (does the rule change what the generator actually
   produces?) → **structure** → **specificity** → **readability**. Register it:
   `evolve-rules.mjs --register --id=<id> --surface=dos|known-bug|visual-audit --text="…"`.
   A change that only adds words without changing output is rejected on sight
   (the size-ceiling guard — rules accrete toward over-constraint otherwise).

3. **Apply + regenerate.** Edit the one asset, commit it on the branch, then
   regenerate `S`×`P` from the same brief `B` with the new rules.

4. **Score with the frozen evaluator.** Run `bin/design-review <page>` (the 3
   machine gates MUST stay green — a change that breaks a gate is an instant
   revert) then the multi-critic. To beat critic noise, **average N≥3 renders**
   and require the gain to clear the margin, not a single lucky sample.

5. **Held-out regression check.** `regression-gate.mjs --check --skill=S`. If any
   existing canonical lost ground (more errors/warnings), the change overfit the
   target page — **revert regardless of the target's score.**

6. **Decide (the ratchet).** Keep iff `new − base ≥ MARGIN` **and** step 5 clean.
   - keep → advance the baseline to `new`; the branch now carries the new best.
   - else → `git revert` the change (not `reset --hard` — keep the failed attempt
     in history as a diagnostic), baseline stays.
   Append the row: `evolve-ledger.mjs --append --skill=S --page=P --axis=<axis>
   --change="…" --base=<base> --new=<new> --decision=keep|revert`.

7. **Update the rule's track record.** `evolve-rules.mjs --fire=<id>` always;
   add `--catch` when the change was kept (the rule earned its place). This is
   what lets the catalog self-prune: rules that fire without ever correlating
   with a real gain sink in score and become prune candidates.

8. **Repeat** from step 1 until `--max-rounds` (default 5) or a plateau.

## Escaping local optima (human-gated)

Pure hill-climbing gets stuck — and design taste has valleys (the best layout
may need a temporarily-worse intermediate). When the loop plateaus (two
consecutive rounds with no keep on the same `S`×`P`), do an **exploratory
rewrite**: a wholesale rewrite of the template/canonical rather than a tweak,
scored against the stashed champion and adopted only if it beats it. Because
this can move many things at once and touches a canonical, it is **proposed to
the human, not auto-applied** (Darwin Phase 2.5, gated).

## Guardrails (why this can't quietly go wrong)

- **Noise margin** — require `Δ ≥ 2` on the averaged score; a +1 is sampling
  noise, and the ratchet would otherwise lock in lucky renders.
- **Mechanical gates are the floor** — any green→red on `verify.py` /
  `visual-audit.mjs` is an automatic revert, no matter the critic score. The
  mechanical checks are far harder to game than the LLM critics; weight them.
- **Anti-gaming audit** — for each critic axis, name the laziest score-raising
  fake (e.g. "more decorative SVGs → higher craft", "more sections → higher
  composition") and confirm a mechanical counter-check exists (orphan-figure,
  text-desert, hollow-card…). If a proposed rule's gain comes from the lazy
  move, reject it.
- **The SPIN bound** — the system can never get better than the evaluator can
  discriminate. So when progress stalls, the higher-leverage move is improving
  the evaluator (human-gated), not torturing the generator.
- **Human-in-the-loop** stays load-bearing for two things only: editing the
  evaluator/rubric, and exploratory rewrites of a whole skill/canonical. Per-rule
  edits that pass all gates + the regression check + the margin may auto-keep.
- **Stop conditions** — `--max-rounds` reached; plateau with no human-approved
  rewrite; or a regression the loop can't resolve in one revert → escalate to a
  human with the ledger frontier and the score trajectory.

## Tools

- `bin/design-review --evolve` — prints this loop's entry checklist + current
  ledger frontier (orientation before a run).
- `evolve-ledger.mjs` — append-only experiment log; `--frontier` shows the
  running-best curve, keep-rate, and biggest gains (autoresearch's progress.png
  as text). Lives at `skills/design-review/evolution/ledger.tsv`.
- `evolve-rules.mjs` — rule registry + EvolveR success score `s=(catches+1)/(fires+2)`;
  `--report` flags prune candidates, `--lint` finds dead/duplicate rules.
- `regression-gate.mjs` — `--baseline` / `--check` the held-out canonicals
  (mechanical evaluator only — deterministic, so a regression is a real signal).
- The frozen evaluator it scores against: `bin/design-review` (verify.py +
  visual-audit.mjs) and `--multi-critic` (the 4 weighted specialist critics).

## When NOT to use

- A single page needs to be good now → use `/design-loop`, not this.
- Fewer than ~3 real critic verdicts exist for the `S`×`P` you want to optimize →
  there's nothing to diagnose yet; ship pages first.
- You want to change what "good" means (new gate, new rubric axis) → that's an
  evaluator change: do it by hand, then re-baseline. Never let the loop do it.
