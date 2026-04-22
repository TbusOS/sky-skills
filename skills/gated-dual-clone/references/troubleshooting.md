# Troubleshooting · 故障排查

> Ten common issues, each with symptom, diagnosis, and fix.
>
> 10 条常见故障,每条有症状、诊断、修法。

> **Tip**: before diagnosing, run `gated-dual-clone-audit`. Most problems
> have a specific gate ID that points straight to the fix.
>
> **小贴士**:动手前先跑一次 `gated-dual-clone-audit`。多数问题都有具体
> 的闸门 ID 直接指向修法。

---

## 1 · Satellite working tree is stale · satellite 没同步

**Symptom**: build result doesn't match the code you just committed in
gateway.

**Diagnosis**:
```bash
cd $SATELLITE_DIR && git log --oneline -5
cd $GATEWAY_DIR && git log --oneline -5
```
If tips differ, satellite hasn't been synced.

**Fix**:
```bash
scripts/sync-satellite.sh --satellite-dir=$SATELLITE_DIR --mode=reset-hard
```

**Prevent**: make `sync-satellite.sh --mode=reset-hard` the first line of
your build script.

---

## 2 · Accidental commit on upstream branch in gateway · 在 gateway 的上游分支上误 commit

**Symptom**: `git status` on gateway shows you're on `main` (or your
`--upstream-branch`) with a local commit ahead of origin.

**Diagnosis**:
```bash
cd $GATEWAY_DIR
git symbolic-ref --short HEAD     # which branch
git log origin/$UPSTREAM_BRANCH..HEAD --oneline   # what's ahead
```

**Fix** (if nothing pushed yet):
```bash
# Move the commits to your push-branch first
git branch -f $PUSH_BRANCH HEAD
# Reset upstream-branch back to origin
git reset --hard origin/$UPSTREAM_BRANCH
git checkout $PUSH_BRANCH
```

**Prevent**: always `git checkout $PUSH_BRANCH` before the first `git
add`. The pre-push hook will catch the push, but it won't catch the
local commit.

---

## 3 · LFS objects are not hardlinked · LFS 对象没 hardlink

**Symptom**: satellite disk usage is close to 2× gateway, especially if
the project uses `git-lfs` or has large binary submodules.

**Diagnosis**:
```bash
du -sh $GATEWAY_DIR/.git/lfs   $SATELLITE_DIR/.git/lfs   2>/dev/null
du -sh $GATEWAY_DIR $SATELLITE_DIR
```

**Cause**: git only hardlinks `.git/objects` between clones. LFS payloads
live in `.git/lfs/` and are NOT hardlinked. This is inherent to git-lfs —
not a bug.

**Mitigation options**:
1. Accept the 2× cost (simplest)
2. Use `git-lfs`'s `--shared` clone variant (fragile, not recommended)
3. Move LFS storage to a shared path via `git config lfs.storage` on both
   sides (pointing at the same directory) — advanced

---

## 4 · Submodule drift between gateway and satellite · submodule 不同步

**Symptom**: gateway has updated submodule pointers but satellite still
shows old SHA.

**Fix**:
```bash
cd $SATELLITE_DIR
git submodule update --init --recursive
```

If it's still off, fully resync:
```bash
cd $SATELLITE_DIR
git submodule deinit --all -f
git submodule update --init --recursive
```

---

## 5 · Gateway clone interrupted · gateway clone 中断

**Symptom**: `bootstrap.sh` died mid-clone (network hiccup, disk full),
gateway dir exists but is incomplete.

**Diagnosis**:
```bash
cd $GATEWAY_DIR && git fsck
```

**Fix**:
```bash
cd $GATEWAY_DIR && git fetch --all     # resume
# or if fsck showed corruption:
cd .. && rm -rf $GATEWAY_DIR && rerun bootstrap.sh
```

Do not re-run `bootstrap.sh` without either cleaning or passing `--force`
— it refuses non-empty existing dirs by design.

---

## 6 · Pre-push hook was bypassed with `--no-verify` · hook 被 --no-verify 绕过

**Symptom**: someone successfully pushed to the protected branch even
though the hook is installed.

**Diagnosis**: check git reflog on gateway:
```bash
cd $GATEWAY_DIR
git reflog --date=iso | grep -i push
```

**Cause**: client-side hooks can always be bypassed with `--no-verify`.
This is a git feature, not a bug.

**Real fix**: configure server-side protected branches on the hosting
platform (GitLab / GitHub / Gerrit). Client-side hook is a finger-slip
preventer only. See `guardrails.md`.

**Audit coverage**: Tier 4 (planned, LLM critic) will flag recent
`--no-verify` use by scanning `.git/logs`.

---

## 7 · Disk running out · 盘不够

**Symptom**: `df` shows filesystem over 90% full.

**Diagnosis**:
```bash
du -sh $GATEWAY_DIR $SATELLITE_DIR
du -sh $SATELLITE_DIR/out $SATELLITE_DIR/build 2>/dev/null   # build artefacts
```

**Fix options**:
1. Clean satellite build artefacts: `cd $SATELLITE_DIR && make clean` (or
   whatever your clean target is).
2. Drop satellite and re-clone after clean: `rm -rf $SATELLITE_DIR && run
   bootstrap.sh --skip-gateway` with same flags.
3. Move to a bigger filesystem: backup satellite (if it has WIP) →
   rebootstrap elsewhere.
4. Consider worktree fallback (see `patterns.md`) — single `.git` saves
   ~1× of the .git overhead.

---

## 8 · Wrong git identity (author email drifted) · git 身份错了

**Symptom**: a recent commit has `author: Generic User <user@laptop>`
instead of your project identity.

**Diagnosis**:
```bash
cd $GATEWAY_DIR
git config --local user.email     # empty = falling back to global
git config --local user.name
git log -1 --format="%ae %an"     # last commit author
```

**Fix future commits**:
```bash
git config --local user.email alice@example.com
git config --local user.name alice
```

**Fix the bad commit** (only if not yet pushed):
```bash
git commit --amend --reset-author --no-edit
# or for multiple commits, use interactive rebase
git rebase -i --root --exec 'git commit --amend --reset-author --no-edit'
```

**Prevent**: `bootstrap.sh` sets these locally. If you see drift, check
for scripts / aliases that reset them.

---

## 9 · Moving gateway or satellite to a new machine · 换机器迁移

**Moving gateway · 迁 gateway**:
1. `tar czf gateway.tar.gz $GATEWAY_DIR` (include `.git/`)
2. Transfer + extract to new machine.
3. **Re-install hooks** — hooks don't travel with `.git/` (they're in
   `.git/hooks/` but not tracked):
   ```bash
   bash scripts/install-hooks.sh --repo=$NEW_GATEWAY_DIR --protect='^main$'
   ```
4. Re-bootstrap satellite on new machine from new gateway path.

**Moving satellite · 迁 satellite**: don't. Just re-clone from gateway at
the new location:
```bash
scripts/bootstrap.sh --skip-gateway \
  --gateway-dir=$GATEWAY_DIR --satellite-dir=$NEW_SATELLITE_DIR \
  --push-branch=$PUSH_BRANCH \
  --user-email=... --user-name=...
```

---

## 10 · Pre-push hook got deleted or corrupted · hook 没了

**Symptom**: audit S5 FAIL (`pre-push hook present`), or pushes to the
protected branch succeed silently.

**Fix**:
```bash
bash scripts/install-hooks.sh --repo=$GATEWAY_DIR --protect='^<upstream-branch>$'
```

The skill is idempotent: re-installing replaces the hook (and saves a
`.bak-<timestamp>` of what was there).

**Prevent**: run `gated-dual-clone-audit` as a `pre-push` hook or weekly
cron. It catches hook disappearance at S5.

---

## General escalation · 实在不行怎么办

If nothing above matches:

1. **Run the audit** in JSON mode and attach output:
   ```bash
   gated-dual-clone-audit --json --gateway-dir=... --satellite-dir=... > audit.json
   ```
2. Check the skill's `references/gate-catalog.md` for detailed remediation
   per gate.
3. File an issue at https://github.com/TbusOS/sky-skills/issues with the
   audit JSON attached.

---

## See also · 参考

- `decision-checklist.md` — maybe the pattern's a bad fit for your case
- `guardrails.md` — what the gates can and can't protect against
- `patterns.md` — fallback patterns (worktree, hosting differences)
- `../../gated-dual-clone-audit/references/gate-catalog.md` — detail per
  audit gate
