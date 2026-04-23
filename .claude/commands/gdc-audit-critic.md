---
description: "Run the gated-dual-clone Tier 4 LLM taste review in one shot — builds the prompt, dispatches the critic subagent, and reports the verdict. Accepts --gateway-dir / --satellite-dir (required) + optional --upstream-branch / --push-branch."
argument-hint: "--gateway-dir=<path> --satellite-dir=<path> [--upstream-branch=<name>] [--push-branch=<name>]"
---

# /gdc-audit-critic — one-shot Tier 4 taste review

You are executing the **Tier 4 taste review** for a `gated-dual-clone`
topology. The three mechanical tiers (structural / configuration /
behavioural) are already covered by `bin/gated-dual-clone-audit`. Tier 4
answers questions the machine can't:

1. Has the push-branch diverged past easy rebase?
2. Has the project shrunk enough that a single repo would be cleaner?
3. Are `--no-verify` bypasses showing up in the gateway's `.git/logs`?

## Required arguments (parse from `$ARGUMENTS`)

- `--gateway-dir=<path>`   **required**
- `--satellite-dir=<path>` **required**
- `--upstream-branch=<name>` optional (enables Q1 divergence check)
- `--push-branch=<name>`     optional (enables Q1 + Q3 checks)

If either required flag is missing, print:

```
/gdc-audit-critic — missing --gateway-dir or --satellite-dir
usage: /gdc-audit-critic --gateway-dir=<path> --satellite-dir=<path>
                         [--upstream-branch=<name>] [--push-branch=<name>]
```

and stop. Do not proceed.

## Steps you must follow (do not skip, do not reorder)

### Step 1 · Build the prompt file

Run the prompt builder (paths are relative to the sky-skills repo root
that holds this command file — if the CWD differs, pass the absolute
path to `audit-critic.mjs`). Capture the output path it prints.

```bash
node <repo>/skills/gated-dual-clone-audit/scripts/audit-critic.mjs \
  --gateway-dir=<path> \
  --satellite-dir=<path> \
  [--upstream-branch=<name>] \
  [--push-branch=<name>]
```

If the script exits non-zero, print the stderr and stop. Do not invent a
fallback.

### Step 2 · Read the prompt file

Use the `Read` tool on the path the script just printed (it looks like
`shots/audit-critic-<timestamp>.md`). The file is self-contained — it
holds the agent spec, the repo paths, and the three drift questions.

### Step 3 · Dispatch the critic subagent

Invoke the subagent with `Task` in a fresh context:

- `subagent_type`: `gated-dual-clone-audit-critic`
- `description`: `Tier 4 drift review (3 questions)`
- `prompt`: the full contents of the prompt file from Step 2

Do **not** paraphrase the prompt. Do **not** add extra instructions. The
whole point of Tier 4 is a fresh-context evaluator — polluting the
prompt with your framing defeats the separation principle.

### Step 4 · Report the verdict

The subagent returns three sections (Q1 / Q2 / Q3), each with
**pass / watch / concern** and a short observation. Summarise for the
user as:

```
Q1 divergence  · <severity> · <one-line observation>
Q2 scale       · <severity> · <one-line observation>
Q3 bypass      · <severity> · <one-line observation>
→ overall: <worst severity across the 3>
```

Follow with the subagent's full response indented under a `---` line so
the user can audit the raw output.

If overall = **concern**, add a one-line next-step suggestion grounded in
the observation (e.g. "rebase push-branch onto upstream before it grows
further" / "consider collapsing to single-repo now · build pain no longer
offsets the isolation benefit" / "investigate `--no-verify` usage via
`git reflog` · a teammate may be bypassing the hook"). Do not invent
next steps beyond what the verdict justifies.

### Step 5 · Learning-loop handoff (only if the verdict surfaced a new drift pattern)

If the subagent's observation describes a drift pattern that is **not**
already listed in `skills/gated-dual-clone-audit/references/known-drifts.md`,
tell the user:

> New drift pattern surfaced. To codify it so the mechanical tiers catch
> it next time, run:
>
> ```
> node skills/design-review/scripts/learning-loop.mjs \
>   --verdict=<path/to/verdict.json> \
>   --target=gated-dual-clone-audit
> ```
>
> Then paste the resulting `design-learner` prompt into
> `Task(subagent_type="design-learner", ...)`.

Do not auto-trigger the learning-loop — it requires a human to review
the proposed `known-drifts.md` row before merging.

## What you must not do

- Do not run the full audit (Tiers 1-3) from this command — that's what
  `bin/gated-dual-clone-audit` is for. This command is Tier 4 only.
- Do not touch either repo's working tree. The subagent tools allow
  Read + Bash + Grep; it is expected to only observe.
- Do not lower a **concern** to **watch** in your summary to "soften" the
  verdict. Relay what the subagent said verbatim.
