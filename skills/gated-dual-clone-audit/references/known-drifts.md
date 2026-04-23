# Known drifts · 野外捕到的 drift 清单

> Drift = the topology was fine when bootstrapped, then something changed
> in a way that erodes the safety gates. This file catalogs drift patterns
> caught in the wild — each one should ideally have a matching machine
> check in `scripts/audit-*.sh`. When a drift is reported that no gate
> catches, it's a learning-loop signal: add a new gate.
>
> drift = 拓扑搭起来时是对的,后来有东西变了,把安全闸削弱了。野外每抓到
> 一条 drift,理想情况是配一条机器 check 把它固化。没被任一 gate 抓到
> 的 drift 就是 learning-loop 的信号 · 该加新 gate。

---

## How to read this file · 怎么读

Each drift entry has a stable ID (`D1` / `D2` / ...) plus:

- **Symptom** — what a user sees when it happens
- **Cause** — why it happens (the mechanism, not just "the tool is wrong")
- **Coverage** — which audit gate catches it now (or **NEW** if un-caught)
- **Fix applied** — what changed in the skill / tools as a response
- **Source** — how the drift was discovered (user report / audit JSON /
  critic / design review)
- **Reference** — issue number, commit hash, cross-link to gate

---

## How to add a drift · 怎么加一条

1. Open a GitHub issue at https://github.com/TbusOS/sky-skills/issues
   with symptom / audit JSON / cause diagnosis.
2. Run `learning-loop.mjs` to get paste-ready proposals:

   ```bash
   # compose a verdict file from the issue
   cat > shots/verdict-drift-<short-slug>.md <<EOF
   # Drift verdict: <short title>
   target: gated-dual-clone-audit
   source: human-eye (or audit-critic / audit-*.sh JSON)
   date: 2026-MM-DD

   ## observation
   <what happened, concrete numbers>

   ## why_audit_missed_it (if applicable)
   <which gates ran, why they passed>

   ## generalised_defense
   <what rule / check / guardrail would prevent this class of drift>
   EOF

   node skills/design-review/scripts/learning-loop.mjs \
     --verdict=shots/verdict-drift-<slug>.md \
     --target=skills/gated-dual-clone-audit/SKILL.md \
     --out=shots/learn-drift-<slug>.md

   # invoke Task() with the generated prompt in Claude Code
   ```

3. Human reviews learner output, pastes into:
   - This file (`known-drifts.md`) — new row D(n+1)
   - `scripts/audit-*.sh` — new gate if machine-checkable
   - `../gated-dual-clone/references/guardrails.md` or `troubleshooting.md`
     — if teaching is the right defence
4. Commit with `closes #<issue>` in the message.

The principle: **same drift never caught twice**.

---

## Drift catalogue · 清单

### D1 · bootstrap Gate C false negative on up-to-date branches

- **Symptom** · `bootstrap.sh` Step 7 Gate C printed `✗ Gate C FAIL · gateway
  hook did not reject push to 'main'` even though the hook was installed and
  functional. Second bootstrap run on a fresh local test with an empty bare
  upstream repo.
- **Cause** · Gate C used `git push origin <upstream> --dry-run 2>&1 | grep
  REJECTED` to verify the hook. When local tip matches remote tip (as it
  does right after `bootstrap` — push-branch was just created from
  upstream-branch), git short-circuits with `Everything up-to-date` and
  **does not invoke the pre-push hook**. The grep finds no rejection
  string and Gate C wrongly reports FAIL.
- **Coverage** · not audit's fault — this was a bootstrap-side bug. But
  the audit's B2 check had the same structure originally and would have
  had the same false negative on a clean topology.
- **Fix applied** · both `bootstrap.sh` Gate C and `audit-behavioural.sh`
  B2 now invoke the hook directly with synthetic stdin:
  `printf 'refs/heads/X 1111 refs/heads/X 0000\n' | bash <hook-path> ...`
  This tests the hook's logic regardless of push eligibility.
- **Source** · discovered during end-to-end test in
  `/tmp/gdc-audit-test/` · 2026-04-22.
- **Reference** · commit `f6892ca` (audit v0 ship · also pulled the fix
  into bootstrap.sh in the same change).

---

## Template for next drift · 下一条的模板

```markdown
### Dn · <short title>

- **Symptom** · <what the user sees · concrete numbers>
- **Cause** · <mechanism · not "tool is bad">
- **Coverage** · <S1 / C2 / B3 / NEW — un-caught>
- **Fix applied** · <what changed in code · cite file:line if possible>
- **Source** · <user report / audit JSON / critic / review · date>
- **Reference** · <issue #, commit hash, gate-catalog section>
```

---

## See also · 参考

- `gate-catalog.md` — the gates currently in `audit-*.sh`
- `troubleshooting.md` — "audit reports X, what do I do"
- `../../design-review/scripts/learning-loop.mjs` — the codification harness
- https://github.com/TbusOS/sky-skills/issues — where drifts get reported
