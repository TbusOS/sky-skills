---
name: gated-dual-clone-audit
description: >
  Independent evaluator for gated-dual-clone topologies. Re-verifies the
  three safety gates on demand — structural (filesystem / hook / hardlink),
  configuration (git config inspection), behavioural (safe --dry-run tests).
  Ships with a human-readable summary + JSON verdict, run it as a git hook,
  a cron, or manually before a risky push. gated-dual-clone 拓扑的独立评估
  器,按需重验三道安全闸。
  TRIGGER: "audit dual clone", "verify gated dual clone", "check safety
  gates", "dual clone drift", "审计双仓库", "验证安全闸", "检查 gated
  dual clone".
  DO NOT TRIGGER: single-repo setups, pure git worktree layouts, general
  git-config auditing unrelated to gated-dual-clone.
last-verified: 2026-04-23
---

# Gated Dual-Clone · Audit (independent evaluator)

## Why this skill exists · 为什么独立出来

**EN** — Two rules carried over from Anthropic's [harness design for
long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
and the GAN paradigm:

1. **The agent doing the work praises its own work.** `gated-dual-clone`'s
   `bootstrap.sh` runs three gate checks as its final step, but once it
   exits it has no further interest in the topology. It will not notice that
   the pre-push hook file was deleted last week, or that `user.email`
   drifted back to the global default.
2. **An independent, skeptical evaluator is the real lever.** This skill
   imports **nothing** from `gated-dual-clone`. It only reads the output
   topology and checks that the safety gates still hold. Same independence
   rule `design-review` holds against the 4 design skills.

**ZH** — 两条原则来自 Anthropic harness-design 文章和 GAN 范式:(1) 做事
的 agent 称赞自己的作品;(2) 独立持怀疑的 evaluator 才是真正的杠杆。
本 skill **不依赖** `gated-dual-clone`,只读拓扑成品,验三道闸。

## What the audit checks · 审计覆盖

Three tiers run in order. Each tier short-circuits on failure (no point
checking `user.email` if `.git/` is missing):

### Tier 1 · Structural (filesystem, no git state read)

- S1 · gateway directory exists and is a directory
- S2 · gateway is a git repo (`.git/` present, `git rev-parse` succeeds)
- S3 · satellite directory exists
- S4 · satellite is a git repo
- S5 · pre-push hook file present at `gateway/.git/hooks/pre-push`
- S6 · pre-push hook has execute bit
- S7 · pre-push hook body contains the protected-branch regex placeholder
       (rough content check — substance verified in Tier 3)
- S8 · `.git/objects` hardlink spot-check — sample a loose object, verify
       inode match between gateway and satellite

### Tier 2 · Configuration (read git config only)

- C1 · satellite `remote.origin.url` points at gateway path
       (file:// or absolute local path)
- C2 · satellite `remote.origin.pushurl == DISABLED` (exact match)
- C3 · gateway `remote.origin.url` is present (non-empty)
- C4 · gateway `user.email` set locally (not falling back to global)
- C5 · gateway `user.name` set locally
- C6 · satellite `user.email` set locally
- C7 · satellite `user.name` set locally
- C8 · satellite current branch is the expected push branch (if
       `--push-branch` given)

### Tier 3 · Behavioural (safe calls only — no real push, no state change)

- B1 · `cd satellite && git push` is rejected
       (greps for "DISABLED" / "does not accept" / "unable")
- B2 · gateway's `pre-push` hook is invoked **directly with synthetic
       stdin** (format per `githooks(5)`: `local_ref local_sha remote_ref
       remote_sha`) and must reject a push to the protected branch
       (greps for "REJECTED" / "protected" / "hook declined").
       We do NOT use `git push --dry-run` here — when `local = remote`
       (a fresh bootstrap, or a push-branch just branched off upstream)
       git short-circuits with "Everything up-to-date" and never runs
       the hook, silently masking a broken hook as "fine".
- B3 · `cd satellite && git fetch origin <branch> --dry-run` succeeds
       (fetch path from gateway is reachable)

### Tier 4 · Taste (optional, via LLM subagent)

Runs an LLM subagent to answer questions the machine can't:
- Is `$PUSH_BRANCH` still based on `$UPSTREAM_BRANCH`, or has it diverged
  past easy rebase?
- Has the project shrunk to the point where a single repo would be cleaner?
- Are `--no-verify` bypasses showing up in `.git/logs`?

Two entry points for Tier 4:

1. **`/gdc-audit-critic` slash command** (recommended) — one shot:
   builds the prompt, dispatches the subagent in a fresh context, and
   reports the verdict. Accepts the same `--gateway-dir` / `--satellite-dir`
   / optional `--upstream-branch` / `--push-branch` arguments.

   ```
   /gdc-audit-critic --gateway-dir=<path> --satellite-dir=<path> \
                     --upstream-branch=<name> --push-branch=<name>
   ```

2. **Manual path** — `bin/gated-dual-clone-audit --critic` invokes
   `scripts/audit-critic.mjs` to produce a self-contained prompt file;
   the wrapper prints the file path and you invoke the subagent yourself
   in Claude Code via `Task(subagent_type="gated-dual-clone-audit-critic",
   prompt=<contents>)`. Useful when scripting / CI.

Tier 4 does not affect the wrapper's exit code; its verdict is advisory.

## Entry point · 入口

```bash
bin/gated-dual-clone-audit \
  --gateway-dir=<path> \
  --satellite-dir=<path> \
  [--upstream-branch=<name>] \
  [--push-branch=<name>] \
  [--strict] [--json] [--critic]
```

Exit code convention:

| Code | Meaning |
|---|---|
| 0 | all gates pass |
| 1 | at least one gate WARN (tier 1/2/3 soft issue) |
| 2 | at least one gate FAIL (tier 1/2/3 hard failure) |
| 3 | bad CLI |

Output: human-readable table by default · `--json` produces machine JSON
(suitable for feeding into `design-review`'s `learning-loop.mjs` when a
drift is caught in the wild).

## Use cases · 使用场景

### On demand before a risky push

```bash
bin/gated-dual-clone-audit \
  --gateway-dir=~/projects/foo-work \
  --satellite-dir=~/projects/foo-verify \
  --upstream-branch=release
```

### As a git hook (run before every push)

```bash
# in gateway/.git/hooks/pre-push, ADDED TO the hook that bootstrap.sh installed:
bin/gated-dual-clone-audit \
  --gateway-dir="$PWD" \
  --satellite-dir="$SATELLITE_DIR" \
  --strict
```

### As a scheduled cron check

```bash
# weekly drift check
0 9 * * 1 cd /path/to/sky-skills && \
  bin/gated-dual-clone-audit --json \
  --gateway-dir=/home/alice/foo-work \
  --satellite-dir=/home/alice/foo-verify \
  > /var/log/gdc-audit-$(date +\%Y\%m\%d).json
```

## Deliberate non-goals · 故意不做的事

- **Not a setup tool.** If the topology is missing, don't build it — use
  `gated-dual-clone/scripts/bootstrap.sh`. This skill assumes the topology
  exists and checks it.
- **Not a fixer.** Gate failures print diagnosis + suggested remediation;
  the user applies the fix.
- **No imports from `gated-dual-clone`.** Path conventions are shared
  (`--gateway-dir` / `--satellite-dir` flag names), nothing else.

## Files · 文件

- `bin/gated-dual-clone-audit` — wrapper, runs tiers + aggregates output
- `scripts/audit-structural.sh` — tier 1 (filesystem / hook / hardlink)
- `scripts/audit-config.sh` — tier 2 (git config)
- `scripts/audit-behavioural.sh` — tier 3 (safe `--dry-run` tests)
- `scripts/audit-critic.mjs` — tier 4 prompt builder for the LLM subagent
- `agents/gated-dual-clone-audit-critic.md` — Claude subagent definition
  used by `--critic`
- `references/gate-catalog.md` — per-gate reference · what each gate
  checks, common failure modes, fixes
- `references/known-drifts.md` — drift patterns caught in the wild ·
  entry point for `learning-loop` feedback · template for adding new
  entries
- `references/troubleshooting.md` — task-oriented "audit says X · what
  do I do"

## Reference · 参考

- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — "separate doing from judging"
- Design spec: [`docs/design-mr-gated-dual-repo.md`](../../docs/design-mr-gated-dual-repo.md) §11
- Peer generator: [`skills/gated-dual-clone/`](../gated-dual-clone/)
