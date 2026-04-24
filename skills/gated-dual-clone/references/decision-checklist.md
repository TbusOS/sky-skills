# Decision checklist · 决策清单

> Four yes/no questions. **≥ 3 "yes" → use this skill.** Otherwise fall back
> to a single repo or `git worktree`.
>
> 4 道是非题,≥ 3 个 yes 用本 skill,否则单仓库或 `git worktree` 更合适。

---

## Q1 · Is the upstream integration branch protected?

**EN** — MR / PR required to land on it; direct push rejected by the hosting
platform (GitLab "Protected branches", GitHub "Branch protection rules",
Gerrit equivalent). Check the hosting UI or try a dry-run push.

**ZH** — 上游集成分支(`main` / `release` 等)是否必须走 MR / PR?直接 push
会被托管平台拒?在 GitLab "Protected branches" / GitHub "Branch protection
rules" 里能看到。或者跑一条 `git push --dry-run` 测试。

### Verify · 怎么查

```bash
# Probe: attempt a dry-run push to the integration branch
git push origin <upstream-branch> --dry-run
# If the platform rejects with "protected" / "reviewer required" → yes
```

### If no · 回答"否"怎么办

You don't need a hook layer. Single repo + normal push flow is fine.
→ See `patterns.md` "single-repo fallback" (not in v0).

---

## Q2 · Is the build slow or heavy?

**EN** — Does your build take **> 10 minutes** on a clean checkout, **or**
produce **> 500 MB** of artefacts in the working tree? Android SDK / Yocto /
large C++ / ML training typically hit both. Light webapp / library builds
typically hit neither.

**ZH** — 干净 checkout 起一次完整 build 要 > 10 分钟吗?或者产物会超过
500 MB 吗?Android SDK / Yocto / 大型 C++ / ML 训练一般两个都超。轻量 web
/ 库项目一般两个都不超。

### Verify · 怎么查

```bash
# From a typical CI log, find the last full build duration
# Or from a local checkout:
time make -j$(nproc)        # wall time
du -sh out/ build/ target/  # artefact sizes
```

### If no · 回答"否"怎么办

Sparse / quick builds don't justify a second working tree. Single repo with
a clean `.gitignore` handles this.

---

## Q3 · Disk for two working trees — including LFS?

**EN** — The `.git/objects` directory hardlinks between gateway and
satellite (same filesystem) — that part is free. But **git-lfs payloads**
and **large binary submodules** don't hardlink — they really cost 2× on
disk. Budget for it.

**ZH** — `.git/objects` 在 gateway / satellite 之间会 hardlink(同一文件
系统),这部分不占额外盘。**但 git-lfs 对象和大型二进制 submodule 不会
hardlink**,真的是 2× 占盘。预算时算进去。

### Verify · 怎么查

```bash
# How big is the full working tree?
du -sh <existing-clone-dir>

# How much is LFS content?
cd <existing-clone-dir> && du -sh .git/lfs/ 2>/dev/null

# How much disk is free on the target filesystem?
df -h $(dirname <target-gateway-dir>)
```

Rule of thumb: you need **1.1× working-tree size** (the `.git/objects`
hardlink savings cover most of `.git/`).

### If no · 回答"否"怎么办

See `patterns.md` "worktree fallback" (v1) — `git worktree` shares `.git`
(single copy), trades physical isolation for disk savings.

---

## Q4 · Want physical isolation between edit and build trees?

**EN** — Do you want build artefacts to **never pollute `git status`** in
the tree you edit in? Do you want a stray `git push` from the build
environment to be **physically unable to reach the remote**, not just
hook-advised against?

**ZH** — 你希望编译产物**永远不污染 `git status`**(你改代码的那棵树里)
吗?你希望编译环境里的误跑 `git push` 是**物理够不到远程**,而不是被 hook
"劝阻"吗?

### If no · 回答"否"怎么办

Either answer is fine:
- Don't care about status pollution → single repo + `.gitignore` is enough.
- Care about status but trust yourself not to push → `git worktree`.

This skill is for when you want both: status isolation AND physical
push isolation.

---

## Verdict · 结论

Count yes answers:

| Yes count | Recommendation |
|---|---|
| 4 / 4 | Use this skill · 用本 skill |
| 3 / 4 | Use this skill · 用本 skill |
| 2 / 4 | `git worktree` is probably a better fit · 倾向用 `git worktree` |
| 1 / 4 | Single repo · 单仓库 |
| 0 / 4 | You don't have this problem · 你没这个问题 |

### If you decided yes · 决定用了

→ Jump to `SKILL.md` "Minimal bootstrap" for the one-line command.

### If you decided no · 决定不用

→ See `patterns.md` (v1 — planned) for the fallback pattern that fits
  your project size.

---

## Bonus · A 5th question (only relevant after the first 4 cleared)

**Do you need a reproducibility gate?** — add `--clean-verify-dir=<path>`
on top of the 2-clone bootstrap if yes, stick with 2-clone if no.

### Q5 · Have you been burned by "works on dev clone, fails on cold clone / CI"?

**EN** — Does a meaningful fraction of your rollbacks / push reverts come
from bugs that **pass your iteration clone's build** but fail on a cold
tree (CI / different filesystem / HDD vs SSD)? Common causes: stale build
artefacts satisfying a missing include, generated files that weren't
checked into git, OS filesystem cache masking a read ordering bug.

**ZH** — 你的回滚/撤 push 里,有没有相当比例是这类 bug:**在迭代 clone
上编过了**,但到了冷启动的 CI / 不同文件系统 / HDD 就挂?常见根因:旧的
编译产物满足了缺失的 include、该进 git 的生成文件没进、OS 缓存掩盖了
文件读顺序 bug。

### If yes · 回答"是"

Add `--clean-verify-dir=/mnt/hdd/<name>-clean-verify` to `bootstrap.sh`.
Gets you:
- A 3rd clone on a different disk (HDD typically, or a separate machine).
- `clean-verify-run.sh`-driven gate: sync → `git clean -fdx` → full build.
- Gateway's pre-push hook refuses to push anything clean-verify hasn't
  stamped.
- `gated-dual-clone-audit` runs 4 extra gates to re-verify the topology.

Cost: the 3rd clone's disk space + a full build's worth of time before
each push + the discipline to actually run `clean-verify-run.sh`.

### If no · 回答"否"

Don't add the 3rd clone. It's cost with no benefit when your
reproducibility discipline is already tight (everything the build needs is
tracked in git, `.gitignore` is accurate, CI and dev use the same
filesystem type).

Revisit if you start seeing push-then-rollback cycles — the 5th question
is revisitable, not a one-shot decision.
