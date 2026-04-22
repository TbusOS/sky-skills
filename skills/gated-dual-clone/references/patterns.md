# Patterns · 变体和替代方案

> The basic `bootstrap.sh` + daily loop is in `SKILL.md` and
> `daily-workflow.md`. This document covers the variants — when to use
> which, and how each differs from the default.

---

## Basic · 1 gateway + 1 satellite (default)

**Picture · 图**:

```
upstream  ◄──push/fetch──►  gateway  ◄──fetch──  satellite
```

**When · 什么时候用**: single developer or small team, one build tree is
enough. This is the default `bootstrap.sh` flow. See `SKILL.md`.

---

## Extended · 1 gateway + N satellites

**Picture · 图**:

```
upstream ◄─► gateway ◄─ satellite-verify  (for `make verify`)
                    ◄─ satellite-debug   (for debug builds, WIP sanitizers)
                    ◄─ satellite-test    (for CI-like local reruns)
```

**When · 什么时候用**: want multiple independent build trees from one
gateway. Each satellite has its own working tree; gateway's `.git/objects`
is hardlinked to all satellites (same filesystem).

**How · 怎么做**: first build the gateway normally, then use
`--skip-gateway` for each additional satellite:

```bash
# gateway already exists at ~/projects/foo-work — don't rebuild it
scripts/bootstrap.sh --skip-gateway \
  --gateway-dir=~/projects/foo-work \
  --satellite-dir=~/projects/foo-debug \
  --push-branch=feature/alice-auth \
  --user-email=alice@example.com \
  --user-name=alice
```

`--skip-gateway` skips steps 2–4 (clone, configure gateway, install hook)
and goes straight to satellite setup. The hook stays installed once on the
gateway.

**Disk cost · 盘占用**: each additional satellite is 1× working tree +
hardlinked `.git/objects` (near-zero) + full LFS / binary submodule (not
hardlinked).

---

## Worktree fallback · 盘紧 + 接受弱隔离

**When · 什么时候用**:
- Disk is tight (< 2× source size free)
- Single developer, single machine
- You can trust yourself **not** to push from the build tree

**Trade-off · 代价**: `git worktree` shares `.git` — that means it shares
`origin`. The build worktree has push permission to upstream. The physical
isolation this skill's main pattern gives you is gone. Client-side hooks
are your only line of defence.

**How · 怎么做**:

```bash
git clone --bare <upstream-url> repo.git
cd repo.git
git fetch origin "<upstream-branch>:<upstream-branch>"
git worktree add ../repo-work   <push-branch>
git worktree add ../repo-verify <push-branch>
# install pre-push hook on the bare repo's hooks dir
bash scripts/install-hooks.sh --repo=./ --protect='^<upstream-branch>$'
```

**Why not default · 为什么不作默认**: the whole point of this skill is
physical isolation. Worktree trades that for disk. If disk is your binding
constraint, worktree wins; otherwise this skill's dual-clone is safer.

---

## Hosting platform differences · 托管平台差异

The skill itself is host-neutral. `--remote` takes any git URL. The
protected-branch regex and MR/PR terminology vary:

| Platform | Term | How to protect upstream | Test a protected push |
|---|---|---|---|
| **GitLab** | Merge Request (MR) | Settings → Repository → Protected branches | `git push origin <protected>` → "You are not allowed to push" |
| **GitHub** | Pull Request (PR) | Settings → Branches → Branch protection rules | `git push origin <protected>` → "protected branch hook declined" |
| **Gerrit** | Change | ACL project config, refs/heads/* | Direct push is not the flow — use `git push origin HEAD:refs/for/<branch>` for review |

**Gerrit caveat · Gerrit 特例**: Gerrit's whole workflow is push-for-review,
so the "push-to-branch-is-protected" shape doesn't apply. You push to
`refs/for/<branch>` which creates a Change. This skill's `pre-push` hook
still catches mis-targeted pushes to `refs/heads/<upstream-branch>`. Full
Gerrit support (commit-msg hook for Change-Id) is not in v0 — see
`troubleshooting.md` for the workaround.

---

## Branch strategy variants · 分支策略

### Short-lived feature branches · 短命功能分支

- One feature = one branch, merged and deleted.
- Simpler review, cleaner history.
- `--push-branch` changes for each feature; re-run `bootstrap.sh` or just
  `git checkout -b` in gateway + re-sync satellite.

### Long-running personal integration branch · 长命个人集成分支

- e.g. `user/alice-m1` lives for months, accumulates many commits.
- Convenient when you're carrying a long series of WIP commits that aren't
  ready to merge individually.
- Harder to review in one go; usually goes through periodic rebase onto
  upstream or periodic squash-merges.

Both work with this skill unchanged — `--push-branch` is just a name. The
hook protects the upstream branch regardless of what personal branch you
use as MR/PR source.

---

## When NOT to use this skill · 不该用的时候

From `decision-checklist.md`:

- ≤ 2 of 4 decision questions are "yes" → this skill's ceremony outweighs
  the safety benefit.
- Project has no build step (pure docs, scripts, configuration repos).
- You're the only person who ever touches the repo on any machine, and
  your push-authority on upstream is `main` anyway.

Don't reach for this skill just because it exists. The dual-clone pattern
pays its overhead in specific conditions; outside those, a single repo +
good `.gitignore` wins.

**不要因为这个 skill 存在就用它**。双 clone 模式有固定开销,只在特定场景
下才回本。场景不对时,单仓库 + 好的 `.gitignore` 胜过它。

---

## See also · 参考

- `SKILL.md` — the default flow and safety model
- `decision-checklist.md` — 4-question self-test
- `comparison.md` — dual-clone vs worktree vs single-repo side-by-side
- `guardrails.md` — why this pattern holds (and where it doesn't)
