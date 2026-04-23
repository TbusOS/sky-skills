# Troubleshooting · 审计报错怎么办

> Task-oriented: you ran `bin/gated-dual-clone-audit` and something didn't
> pass. This file maps common output to next actions. For per-gate reference
> (what each gate checks in detail), see `gate-catalog.md`.
>
> 任务导向文档:你刚跑了 `bin/gated-dual-clone-audit`,有闸没过,
> 下一步怎么做。每闸的详细语义见 `gate-catalog.md`。

> **Fastest path · 最快路径**: look for the gate ID in the output (S5 /
> C2 / B1 / ...), then jump to that section below.
>
> **最快路径**:在输出里找到 gate ID,跳到下面对应小节。

---

## Exit code map · 退出码速查

| Exit | Meaning · 含义 | First action · 先做啥 |
|---|---|---|
| 0 | all gates pass | nothing · 没事 |
| 1 | at least one WARN | check warn gate's details, decide if acceptable · 看 warn 闸的说明 |
| 2 | at least one FAIL | topology integrity broken · do not push to upstream · 拓扑破了 · 别 push |
| 3 | bad CLI | check flag spelling · 查 flag 拼写 |

`--strict` promotes WARN to FAIL (exit 1 → exit 2). Use in hooks / CI.

---

## Short-circuited after Tier 1 · Tier 1 后短路了

### Output includes "Tier 1 failed · short-circuit · skipping Tier 2 / 3"

The topology has a structural problem that makes Tiers 2 / 3 pointless.

**Common root causes**:

- `S1` / `S3` FAIL · the gateway or satellite directory doesn't exist
  - → someone moved / renamed / deleted a directory
  - → run `ls -la` on both paths; re-bootstrap if needed (`bootstrap.sh
    --force` for empty dirs, manual clean for non-empty)
- `S2` / `S4` FAIL · `.git/` missing or corrupted
  - → `cd <dir> && git fsck`; if corrupt, re-clone from gateway
  - → satellite is cheap to rebuild: `rm -rf` + `bootstrap.sh
    --skip-gateway`
- `S5` FAIL · pre-push hook missing
  - → hook got deleted. Re-run:
    `bash skills/gated-dual-clone/scripts/install-hooks.sh
     --repo=<gateway> --protect='^<upstream-branch>$'`

---

## Tier 1 WARN only · Tier 1 有黄灯

### `S7` WARN · "hook body doesn't look like the gated-dual-clone template"

The hook file exists and is executable but isn't the canonical hook. Maybe
someone edited it or replaced it with their own version.

**Decide**:
- Custom hook is intentional (project has its own rules)? → ignore S7,
  check Tier 3 B2 — if B2 PASS, your custom hook is doing the job.
- Unintentional? → re-install to restore canonical:
  `bash skills/gated-dual-clone/scripts/install-hooks.sh --repo=<gateway>
   --protect='^<upstream-branch>$'` (saves a `.bak-<ts>` of the current).

### `S8` WARN · ".git/objects hardlink lost"

Two scenarios:

1. **"sample X missing in satellite"** · satellite is behind gateway's
   object store. Run `scripts/sync-satellite.sh --mode=fetch`. If it's
   still missing after fetch, the packed representation may have changed
   — WARN is OK for packed repos.

2. **"gateway inode ≠ satellite inode"** · hardlink was lost. Usually
   means satellite was cloned across a filesystem boundary. Check `df
   <gateway-dir>` vs `df <satellite-dir>`. If they're on different
   mounts, satellite costs 2× object storage, not free — accept the cost
   or move satellite onto the same filesystem (`rm -rf` + re-bootstrap).

---

## Tier 2 failures · Tier 2 失败

### `C1` FAIL · "satellite origin doesn't point at gateway"

Someone re-pointed satellite at upstream directly, or at a wrong path.
Fix:

```bash
cd <satellite>
git remote set-url origin <gateway-absolute-path>
```

Then re-run audit — C1 should pass.

### `C2` FAIL · "satellite push URL not DISABLED"

Either pushurl is unset (falls back to origin URL) or set to something
else. Fix:

```bash
cd <satellite>
git remote set-url --push origin DISABLED
```

If `pushurl == "DISABLED"` but C2 still fails, check for trailing whitespace
or capitalisation in the value.

### `C3` FAIL · "gateway origin URL empty"

Gateway has no upstream. Someone ran `git remote remove origin`, or
gateway was initialised wrong.

```bash
cd <gateway>
git remote add origin <upstream-url>
# or if origin exists but URL is empty:
git remote set-url origin <upstream-url>
```

### `C4`–`C7` WARN · "user.email / user.name unset locally"

Not broken — git falls back to `~/.gitconfig` global. But the project
rules may not match global. Fix per repo:

```bash
cd <gateway>     # or <satellite>
git config user.email <project-email>
git config user.name <project-name>
```

### `C8` WARN · "satellite not on expected push-branch"

Satellite's current branch doesn't match what you passed as `--push-branch`.
Either you passed the wrong flag, or satellite was checked out to a
different branch (maybe for a bisect). Fix:

```bash
cd <satellite>
git checkout <push-branch>
```

---

## Tier 3 failures · Tier 3 失败

### `B1` FAIL · "satellite push was NOT rejected"

Gate A (protocol wall) is not holding. Usually downstream of C1 + C2 —
fix those first, rerun.

If C1 and C2 pass but B1 still fails, that's a real bug. Capture the
audit JSON and file an issue.

### `B2` FAIL · "hook did not reject synthetic push"

Gate C (pre-push hook) is not effective. Usually:
- Hook was replaced with a version that doesn't have the canonical
  rejection logic. S7 WARN should have flagged this.
- Regex doesn't match the branch being tested. Check the hook's
  `protected=...` line against the `--upstream-branch` you passed.

Fix: re-install:

```bash
bash skills/gated-dual-clone/scripts/install-hooks.sh \
  --repo=<gateway> --protect='^<upstream-branch>$'
```

### `B2` WARN · "cannot test · --upstream-branch not given"

Audit couldn't infer the protected branch. Pass it explicitly:

```bash
gated-dual-clone-audit --gateway-dir=... --satellite-dir=... \
  --upstream-branch=<your-upstream-branch>
```

### `B3` FAIL · "satellite fetch errored"

Fetch from gateway failed. Most likely the gateway was moved/renamed
and satellite's origin URL is now stale (even though Tier 2 C1 might
still pass — filesystem let the path resolve when we checked but the
actual `.git/` moved).

```bash
cd <satellite>
git remote set-url origin <current-gateway-absolute-path>
git fetch origin
```

---

## `--critic` (Tier 4) output · LLM 评审输出

Tier 4 writes a prompt file and tells you to invoke `Task()` in Claude
Code. The verdict doesn't affect the exit code — it's advisory.

If the critic returns `concern`, treat it like a `--strict` WARN: note
the drift, decide if the topology still serves the project. The three
critic questions (see `../agents/gated-dual-clone-audit-critic.md`):

1. **Q1 concern** · push-branch diverged past easy rebase → fix:
   `cd <gateway> && git rebase origin/<upstream-branch> <push-branch>`
   (resolve conflicts). If that's hard, it's a signal the topology has
   outlived its usefulness for this particular branch.
2. **Q2 concern** · project shrunk enough that single repo is cleaner →
   consider migrating. See `../gated-dual-clone/references/comparison.md`
   "From dual-clone back to single-repo".
3. **Q3 concern** · `--no-verify` bypass signals in `.git/logs` → talk
   to whoever did it. Either ban the habit, or configure server-side
   protected branches so client hooks aren't the only line.

---

## Reporting a drift audit can't catch · 审计漏抓

If audit says `pass` but you're seeing a problem, that's the most
valuable kind of feedback — the gates have a blind spot. Do:

1. Open a GitHub issue at
   https://github.com/TbusOS/sky-skills/issues
2. Attach `audit --json` output as evidence of what audit saw.
3. Describe what the problem actually is.
4. Follow the learning-loop flow in `known-drifts.md` to codify.

The goal is **same drift never caught twice**.

---

## See also · 参考

- `gate-catalog.md` — detailed semantics per gate
- `known-drifts.md` — patterns caught before; template for adding new ones
- `SKILL.md` — audit overview
- `../../gated-dual-clone/references/troubleshooting.md` — topology-setup
  troubleshooting (distinct from audit-output troubleshooting here)
