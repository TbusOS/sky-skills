# Gate catalog · 闸门清单

> All checks the auditor runs, by tier. Each gate has an ID (Sn / Cn / Bn),
> a pass condition, a common failure mode, and a suggested fix. Use this
> document to diagnose audit output.
>
> 审计器跑的所有检查。每条闸门有 ID、通过条件、常见失败、建议修法。

---

## Tier 1 · Structural

> **What · 查什么**: filesystem layout, hook presence, `.git/objects`
> hardlinking. No git state is read beyond `rev-parse` validity.

### S1 · gateway exists

- **Pass** · directory at `--gateway-dir` exists.
- **Fail** · path missing. Common cause: wrong `--gateway-dir` or the
  directory was moved/renamed.
- **Fix** · check the path; if the whole topology is gone, re-run
  `gated-dual-clone/scripts/bootstrap.sh`.

### S2 · gateway is a git repo

- **Pass** · `gateway/.git/` exists and `git rev-parse --git-dir` succeeds.
- **Fail** · `.git/` missing, or corrupted.
- **Fix** · if `.git/` was deleted, rebootstrap; if corrupted, `git fsck`.

### S3 · satellite exists

Same shape as S1 for satellite.

### S4 · satellite is a git repo

Same shape as S2 for satellite.

### S5 · pre-push hook present

- **Pass** · `gateway/.git/hooks/pre-push` file exists.
- **Fail** · hook file missing. Common cause: someone ran `rm
  .git/hooks/pre-push`, or git was re-initialised.
- **Fix** · re-run `gated-dual-clone/scripts/install-hooks.sh --repo=$GATEWAY_DIR`.

### S6 · pre-push hook executable

- **Pass** · execute bit set (`chmod +x`).
- **Fail** · file is not executable. Git silently skips non-executable
  hooks, so the hook is effectively off.
- **Fix** · `chmod +x gateway/.git/hooks/pre-push`.

### S7 · pre-push hook has a protect regex

- **Pass** · hook body contains both `protected=` and `refs/heads`.
- **Warn** · hook file is present but doesn't look like the gated-dual-clone
  template. Tier 3 still verifies behavioural correctness; this is a rough
  content check.
- **Fix** · re-run `install-hooks.sh` to restore the canonical hook body.

### S8 · .git/objects hardlinked

- **Pass** · a sampled loose object has the same inode in gateway and
  satellite.
- **Warn** · inodes differ, or the sample exists only on one side, or the
  repo is fully packed so no loose objects are available.
- **Fail mode caveat** · this is a spot-check; true `.git/objects`
  hardlinking can't be fully audited without walking every object.
- **Fix** · if satellite is materially larger than expected on disk, you
  likely cloned across a filesystem boundary (hardlinks can't span fs).
  Move satellite onto the same fs as gateway, or accept the disk cost.

### S9–S11 · clean-verify structural (3-clone only)

Activated by `--clean-verify-dir=<path>`. Skipped in 2-clone mode.

- **S9 · clean-verify exists** · pass if the dir exists · fail otherwise.
- **S10 · clean-verify is a git repo** · pass if `.git` is valid.
- **S11 · clean-verify stamp on gateway** ·
  pass if `gateway/.git/last-clean-verify` is present and parseable;
  warn if absent or malformed (user hasn't run `clean-verify-run.sh`
  against current HEAD yet · not an error by itself, but the next push
  will be blocked until the stamp catches up).

---

## Tier 2 · Configuration

> **What · 查什么**: `git config` values on both sides. Assumes Tier 1
> passed (git repos exist and are valid).

### C1 · satellite origin URL points at gateway

- **Pass** · satellite's `remote.origin.url` resolves to the gateway's
  absolute path (with `/.git` stripped).
- **Fail** · origin is unset, or points to upstream URL directly (someone
  re-added the upstream remote), or to a different path.
- **Fix** · from satellite: `git remote set-url origin <gateway-path>`.

### C2 · satellite push URL = DISABLED

- **Pass** · satellite's `remote.origin.pushurl` is the literal string
  `DISABLED`.
- **Fail** · pushurl is unset (would fall back to origin URL, so pushing
  would write to gateway — which is undesirable), or set to something else.
- **Fix** · from satellite: `git remote set-url --push origin DISABLED`.

### C3 · gateway origin URL set

- **Pass** · gateway's `remote.origin.url` is non-empty.
- **Fail** · empty or unset — gateway has no upstream configured.
- **Fix** · from gateway: `git remote set-url origin <upstream-url>`.

### C4–C7 · user.email / user.name (gateway + satellite)

- **Pass** · both `user.email` and `user.name` are set **locally** on the
  repo.
- **Warn** · unset locally — git falls back to global config. This isn't
  broken but it's fragile (global config may not match project policy).
- **Fix** · `git config user.email ...` / `git config user.name ...` in
  each repo.

### C8 · satellite on a named branch

- **Pass** · satellite's HEAD is a named branch (and matches
  `--push-branch` if given).
- **Warn** · detached HEAD, or mismatch between satellite's branch and the
  `--push-branch` you passed.
- **Fix** · `cd satellite && git checkout <push-branch>`.

### C9a–c · clean-verify config (3-clone only)

Activated by `--clean-verify-dir=<path>`.

- **C9a · clean-verify origin at gateway** · pass if `remote.origin.url`
  resolves to the gateway path (same convention as C1 for satellite).
  **Fail** if it points elsewhere (including the real upstream remote) —
  clean-verify is a reproducibility gate, so it must fetch from the
  same local source-of-truth that gateway pushes from. Fix:
  `git remote set-url origin <gateway-path>`.
- **C9b · clean-verify origin push = DISABLED** · pass if pushurl is
  the literal `DISABLED`. Fail otherwise. Fix:
  `git remote set-url --push origin DISABLED`.
- **C9c · clean-verify upstream push = DISABLED** · only runs if the
  clean-verify repo has an `upstream` remote (optional diagnostic
  remote pointing at the real URL). If present, its pushurl must also
  be `DISABLED` — clean-verify must never push to any remote. Fix:
  `git remote set-url --push upstream DISABLED`.

---

## Tier 3 · Behavioural

> **What · 查什么**: actually run the three safety gates end-to-end using
> `--dry-run` variants so no state changes. Assumes Tiers 1 and 2 passed.

### B1 · satellite push rejected

- **Pass** · `cd satellite && git push` produces an error containing
  "DISABLED", "does not accept", or "unable".
- **Fail** · command succeeded (or errored for a different reason). Gate A
  (protocol wall) is not actually holding.
- **Fix** · verify C1 + C2 — if those pass but B1 still fails, file an
  issue against the skill.

### B2 · gateway pre-push hook rejects protected branch

- **Pass** · `cd gateway && git push origin <protected-branch> --dry-run`
  produces an error containing "REJECTED", "protected", "hook declined",
  or "pre-push".
- **Warn** · audit couldn't determine the protected branch (hook regex
  unparseable and `--upstream-branch` not given).
- **Fail** · hook did not reject. Either the hook is broken, or
  `--no-verify` sneaked into the test path.
- **Fix** · re-run `install-hooks.sh` and check hook body manually.

### B3 · satellite fetch from gateway works

- **Pass** · `cd satellite && git fetch origin <push-branch>` succeeds.
- **Warn** · no `--push-branch` given and satellite has no current branch
  to check against.
- **Fail** · fetch errored. Gateway may have been moved/renamed; satellite's
  origin is now broken.
- **Fix** · update satellite origin: `cd satellite && git remote set-url
  origin <new-gateway-path>`.

### B4 · clean-verify push is rejected (3-clone only)

Activated by `--clean-verify-dir=<path>`.

- **Pass** · `cd clean-verify && git push --dry-run origin HEAD` is
  rejected with "DISABLED" / "does not accept" / "unable" / "not allowed".
- **Fail** · push was not rejected. The DISABLED escape hatch on
  clean-verify is not holding.
- **Fix** · verify C9b — if config is right but B4 still fails, file an
  issue against the skill.

---

## Tier 4 · Taste (planned)

Not yet implemented. Will be an LLM critic subagent answering:

- Is `$PUSH_BRANCH` still based on `$UPSTREAM_BRANCH`, or has it diverged
  past the point of an easy rebase?
- Has the project shrunk enough that a single repo would be cleaner?
- Are `--no-verify` bypasses showing up in `.git/logs`?

See the `--critic` flag on the wrapper for the placeholder.

---

## Interpreting exit codes · 退出码

| Code | Meaning | What to do |
|---|---|---|
| 0 | all gates pass | ship / resume |
| 1 | at least one WARN | look at the warning; may be benign |
| 2 | at least one FAIL | the topology's integrity is compromised; fix before proceeding |
| 3 | bad CLI | check flag spelling; see `--help` |

### --strict mode

Treats WARN as FAIL. Use it in git hooks and CI where ambiguous states
should block the action, not just notify.

## JSON format · JSON 输出

`--json` produces a single document:

```json
{
  "skill": "gated-dual-clone-audit",
  "overall": "pass" | "warn" | "fail",
  "strict": true | false,
  "tiers": [
    {
      "tier": "structural",
      "overall": "pass" | "warn" | "fail",
      "pass_count": N, "warn_count": N, "fail_count": N,
      "gates": [
        {"id": "S1", "name": "...", "status": "PASS", "details": "..."},
        ...
      ]
    },
    { "tier": "config", ... },
    { "tier": "behavioural", ... }
  ]
}
```

This shape is intended for piping into `sky-skills/skills/design-review/
scripts/learning-loop.mjs` when a drift pattern is caught in the wild —
the loop proposes a new gate for the catalog here.
