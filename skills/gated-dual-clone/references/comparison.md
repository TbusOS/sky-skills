# Comparison · dual-clone · worktree · single-repo

> Three legitimate patterns for the same general problem area. Pick the
> column that fits your constraints — don't force the pattern to fit you.
>
> 三种合法模式对应同一类问题。按约束挑列,不要硬套模式。

---

## At-a-glance · 速查表

| Dimension · 维度 | **Dual-clone (this skill)** | `git worktree` | Single repo |
|---|---|---|---|
| Disk (`.git`) | 2× tree; `.git/objects` **hardlinked** | 1× `.git` + N× tree | 1× total |
| Disk (LFS / binary submodule) | **2×** (hardlink NA) | 1× | 1× |
| Physical push isolation | **Yes** (satellite origin = local) | No — shared `origin` | No |
| Build pollutes `git status` | Isolated | Isolated | Polluted |
| Client-hook bypass risk | Low (protocol barrier) | Full | Full |
| Multi-user / shared-machine safety | Safe | Risky | Risky |
| Cross-machine migration | Medium (re-install hook) | Low | Low |
| Setup complexity | Highest | Medium | Lowest |
| Learning curve | Moderate (new mental model) | Low (subtree of git) | Zero |
| Failure mode when something goes wrong | Diagnosable per-gate (audit) | Hard to audit | Hard to audit |
| Works with protected upstream + MR flow | **Yes** (primary design goal) | Yes (but see isolation) | Yes |

---

## When each wins · 何时哪种最合适

### Dual-clone (this skill) wins when · 双 clone 胜出

- Upstream branch is protected (MR / PR flow mandatory).
- Build is heavy (> 10 min) AND pollutes working tree (> 500 MB).
- You want physical isolation, not just hook-advised protection.
- Multiple developers share the machine, or paranoia about mis-push is
  justified by project-level risk.
- You have disk to spare — 2× working tree is OK.

**Classic fit**: Android SDK, Yocto, large-C++ project with protected
`main` / `release`, where a wrong push is a reroll and the build takes
an hour.

### `git worktree` wins when · worktree 胜出

- Disk is tight (< 2× source size free).
- Single developer, single machine, trusted.
- Build isolation from edit-tree matters, but push isolation doesn't
  (you can be trusted not to push from the wrong tree).
- Switching branches for testing is frequent (worktree handles this
  elegantly; dual-clone requires more ceremony).

**Classic fit**: library maintainer with big source tree + many parallel
feature branches + solo work.

### Single repo wins when · 单仓库胜出

- Project is small (build < 2 min, artefacts < 100 MB).
- You're the only person who uses the repo on the machine.
- Upstream's push rules allow direct `main` push (e.g. personal tooling
  repos, OSS projects where you ARE the maintainer).
- You don't want to think about git topology at all.

**Classic fit**: personal scripts, small utility libraries, docs repos.

---

## When each loses · 何时各自拉胯

### Dual-clone loses · 双 clone 不适合

- Project has no build phase (pure docs / config / scripts).
- Very small teams where the ceremony > the safety benefit.
- Disk is severely constrained — LFS-heavy repos can double your disk
  usage without the hardlink savings that would normally compensate.
- Cross-filesystem layouts break the hardlink optimisation (satellite on
  a different mount than gateway).

### `git worktree` loses · worktree 不适合

- Multi-developer shared machine. All worktrees share the one `origin`;
  one careless user can push from any of them.
- Protected-branch enforcement required. Worktree offers hook-only
  protection, same as single repo.
- You want auditable drift detection. `gated-dual-clone-audit` exists for
  dual-clone; worktree has nothing equivalent.

### Single repo loses · 单仓库不适合

- Big build that pollutes `git status` every time you compile.
- Protected upstream + heavy MR/PR flow without a separate build tree
  (you'll spend a lot of time saying "let me just commit these changes
  so I can build cleanly").
- Multiple parallel feature branches you need to build in parallel.

---

## Hybrid · 能混用吗

Yes, but deliberately:

- **Dual-clone gateway + N satellites** — see `patterns.md`. One gateway,
  multiple worktree-like satellites, all with physical push isolation.
  Best of both worlds if you have the disk.
- **`git worktree` inside satellite** — build tree has worktrees for
  different test configs, all pointing at the same satellite `.git`.
  Overkill for most cases but valid.
- **Single repo + `pre-push` hook** — cheaper than dual-clone, catches
  finger-slips, accepts "client-side hook is advisory" as the only defence.
  The worst of all three if you actually need the safety, best if you
  don't.

---

## Migration paths · 迁移路径

### From single-repo to dual-clone

1. Rename current repo to `<old>` (keeps your work).
2. Run `bootstrap.sh` to create new gateway + satellite.
3. Cherry-pick / rebase work from `<old>` onto gateway's push-branch.
4. Delete `<old>` once gateway has everything.

### From worktree to dual-clone

1. Identify which worktree was "the edit one" — that becomes gateway.
2. `git clone <bare>.git` gateway at a new path (don't just rename the
   worktree — `.git` references get confused).
3. Use `--skip-gateway` bootstrap to create satellite.
4. Remove old worktrees.

### From dual-clone back to single-repo

If you decide the overhead isn't worth it:
1. Keep gateway (or satellite — your choice) as the one surviving repo.
2. Delete the other.
3. Remove `.git/hooks/pre-push` if it's bothering you.
4. Done.

---

## Which pattern matches this project? · 这个项目用哪种

Run the 4-question decision checklist → see `decision-checklist.md`.
- ≥ 3 yes → dual-clone
- 2 yes → `git worktree`
- ≤ 1 yes → single repo

No shame in the simplest choice that works.

---

## See also · 参考

- `decision-checklist.md` — the 4 questions
- `patterns.md` — variants within dual-clone
- `guardrails.md` — what dual-clone specifically protects
