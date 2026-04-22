# Guardrails · 安全闸原理 + 局限

> Read this before trusting the three gates with anything important.
>
> **重要**:信任这三道闸之前,先看懂它们各自能 / 不能做什么。

---

## The cardinal rule · 首要原则

> **Client-side git hooks are advisory, not enforcement.**
> `--no-verify` bypasses them. Any laptop with this repo cloned can push
> past the hook. **Real protection is server-side protected-branch rules**
> (GitLab "Protected branches", GitHub "Branch protection rules", Gerrit
> ACLs). This skill's hook is a second layer — catches finger-slips, not
> determined bypass.
>
> **客户端 git hook 是劝阻,不是强制边界**。`--no-verify` 可以绕过。任何
> clone 了这个仓库的笔记本都能推过 hook。**真正的保护是托管平台服务端
> 的 protected-branch 规则**。本 skill 的 hook 是第二层,接手滑,不防
> 恶意。

If you can't configure server-side branch protection (e.g. you don't have
admin rights on the hosting platform), this skill provides **defence in
depth** — not absolute protection. Plan accordingly.

---

## The three gates in detail · 三道闸的机制

### Gate A · Protocol wall (protocol-layer barrier)

**What holds it · 靠什么成立**: satellite's `remote.origin.url` is a
**local filesystem path** (or `file://` URL to the same). Git's push
transport for that URL family does not involve SSH, HTTPS, or any network
protocol. To reach upstream, you'd have to:

1. Change the origin URL (detectable — audit C1 catches it)
2. Manually add a new remote pointing at upstream (also detectable)

**What breaks it · 什么情况下破**:
- Someone runs `git remote set-url origin <upstream-url>` on satellite.
  Now satellite has network reach. Audit C1 catches this.
- Someone runs `git remote add upstream <upstream-url>` then `git push
  upstream`. Audit doesn't currently catch secondary remotes (TODO).

**How to verify** (`gated-dual-clone-audit` C1 + B1):
- C1 checks satellite origin URL resolves to gateway path
- B1 actually tries `git push` and greps for rejection

### Gate B · Explicit push-URL disable (git-config belt-and-braces)

**What holds it · 靠什么成立**: `git remote set-url --push origin DISABLED`
sets the push URL to the literal string `DISABLED`. Git tries to resolve it
as a URL, fails fast, and prints an error. Even if Gate A's origin URL
resolution changed, Gate B still bites because the push URL path is
separate from the fetch path.

**What breaks it · 什么情况下破**:
- Someone runs `git remote set-url --push origin <valid-url>` explicitly
  to override. Detected by audit C2.
- `git config --unset remote.origin.pushurl` — pushurl unset means push
  falls back to the fetch URL. If Gate A is still holding (origin = local
  path), push goes to gateway instead of upstream. Audit C2 catches
  unset pushurl.

**How to verify** (audit C2): exact string match on `pushurl == "DISABLED"`.

### Gate C · Pre-push hook (hook-layer reject)

**What holds it · 靠什么成立**: `gateway/.git/hooks/pre-push` script
inspects each ref being pushed. If the remote ref name matches the
protected-branch regex (e.g. `^(main|release)$`), the hook prints a
rejection message to stderr and exits 1. Git aborts the push.

**What breaks it · 什么情况下破**:
- `git push --no-verify` skips the hook entirely. No warning, no trace.
- The hook file is deleted, renamed, or loses its execute bit. Git
  silently skips non-existent or non-executable hooks (no warning).
- The hook body is replaced with one that always exits 0.

**How to verify** (audit S5 / S6 / S7 / B2):
- S5 · hook file present
- S6 · execute bit set
- S7 · hook body contains `protected=` line
- B2 · invoke hook directly with synthetic stdin, check rejection

**Why B2 uses direct invocation, not `git push --dry-run`**: when local
matches remote, `git push --dry-run` short-circuits with "Everything
up-to-date" and never invokes the hook. Direct invocation tests the
hook's logic regardless of push eligibility.

---

## What these gates do NOT protect against · 这些闸不防的事

1. **`--no-verify` pushes** — intentional bypass. The hook is client-side
   and skippable. Mitigation: server-side protected branch.
2. **Pushes from a *different* clone of the same repo** — the hook is
   installed per-repo-per-clone. A colleague cloning afresh without
   running `install-hooks.sh` has no hook.
3. **Bypasses from the satellite side via `git push <other-remote>`** —
   someone could add a secondary remote on satellite and push that way.
4. **Direct file manipulation of `.git/`** — anyone who can write into
   `.git/` can change anything. Filesystem permissions are the real
   boundary here.

---

## Optional hardening · 可选加固

### Pre-commit hook on satellite (default off)

**Rationale · 动机**: satellite is supposed to be a read-only build tree.
A `pre-commit` hook that always rejects commits makes that explicit. Not
installed by default because it's too restrictive — sometimes you want to
commit build-fixups locally for testing.

**Install · 装法**:

```bash
cat > $SATELLITE_DIR/.git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
echo "REJECTED: satellite is a build tree · commit in gateway instead" >&2
exit 1
HOOK
chmod +x $SATELLITE_DIR/.git/hooks/pre-commit
```

### Refuse creating a new remote on satellite

Git doesn't provide a hook for `git remote add`, so this can't be blocked
directly. Audit's C1 catches the drift the next time it runs.

### Use server-side `push-to-review` (Gerrit-style)

Configure the upstream to require all pushes to go through a review refs
namespace (`refs/for/*`). This defeats `--no-verify` because the server,
not the client, enforces.

---

## What to do when audit flags drift · 审计报了 drift 怎么办

Priority order (handle whichever hit first):

1. **Any Tier 1 FAIL** — the topology is structurally broken. Don't
   proceed with builds; fix immediately. Usually means re-run
   `bootstrap.sh --force` (if target dirs are empty) or
   `install-hooks.sh`.
2. **Tier 2 FAIL** — config drift. Reset the specific setting per
   gate-catalog.md's fix guidance.
3. **Tier 3 FAIL** — gates are not behaving. Often downstream of Tier
   1/2 issues; fix upstream first, rerun.
4. **Any WARN** — note it, decide if it's acceptable. Common warns
   include: user.email falling back to global (C4-C7), LFS not
   hardlinked (S8).

Audit should be green before every push to an important branch, or at
minimum weekly. The `--strict` flag converts WARN to FAIL for CI /
pre-push hook use.

---

## See also · 参考

- `decision-checklist.md` — whether this pattern fits your project
- `troubleshooting.md` — concrete fixes for common failures
- `../../gated-dual-clone-audit/SKILL.md` — the independent evaluator
- [Anthropic · harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
