# design gate hook

Runs the cheap half of the design gate on every HTML write, and names the files
that never got the expensive half.

## Why

The full chain costs 17-25 seconds a page, because three of its five checks
drive a browser. Nobody pays that on every edit, so in practice nobody runs it
until just before publishing — which is when a structural problem is most
annoying to find, and when an accessibility problem is most likely to ship.

`verify.py` is the one check that needs no browser. It takes **0.05 seconds**,
so it can run on every write and still be invisible.

## What each half does

**`post-edit.sh`** · PostToolUse

Fires on any write. Exits immediately unless the path ends in `.html` *and*
belongs to a project that has said it cares — see below. Then it:

- runs `verify.py` and, on failure, sends the findings back as feedback
- records the file's content hash in `.design-gate/pending.tsv`

**`stop.sh`** · Stop

At the end of a turn, reports HTML files whose current hash has no matching
entry in `.design-gate/passed.tsv` — pages that changed after their last clean
run, or never had one.

**`bin/design-review`** writes that receipt when all five checks pass. A run with
`--no-interact` or `--no-axe` writes nothing, because a receipt for a partial
run is a lie. Editing a file changes its hash, which invalidates its receipt
without anyone having to remember to.

## Which pages are in scope

Two questions, and the first version answered them with one lookup:

| question | answer |
|---|---|
| which project owns this page? | the nearest `DESIGN.md` above it |
| where does the checker live? | this hook's own path |

The first version walked up from the edited file looking for
`skills/design-review/scripts/verify.py`. That is the *checker's* address, so
the only repo it ever matched was sky-skills — the one repo whose author edits
the checker daily and is the least likely to forget to run it. Every downstream
project that installed the hook got silence. The medicine reached only the
person who wrote the prescription.

`DESIGN.md` is the marker because it is already the file a project uses to
declare its design decisions, and `design-md.mjs` already looks for it the same
way. One file, one entry point, read by both the hook and the checker.

A project writing in one language should say so:

```markdown
---
skill: anthropic
monolingual: true
---
```

Without that line the bilingual rule (§G) applies, and §G exists because *this*
repo publishes a bilingual site. A project that never agreed to it would see
every page fail on every write — and a check nobody can satisfy is a check
nobody reads. `monolingual:` is not a waiver: a waiver says "we saw this finding
and chose to live with it", this says "that rule is not about us".

sky-skills itself has no `DESIGN.md`, so it is still recognised the old way, by
the checker sitting in it.

## It blocks once, then clears

A Stop hook that keeps refusing until some condition is met will refuse forever
the moment that condition is not reachable, and the transcript becomes eight
rounds of the hook and the model repeating themselves until the harness
force-overrides. So this one blocks a single time, clears the pending list, and
stays quiet. The point is to make the omission visible, not to enforce it.

## Install

```bash
hooks/design-gate/install.sh --dry-run   # see what it would change
hooks/design-gate/install.sh             # write it into ~/.claude/settings.json
hooks/design-gate/install.sh uninstall   # take it out again
```

It backs up `settings.json` first, replaces any entry from an earlier checkout
rather than stacking a second one, and verifies both entries landed before
reporting success. Restart Claude Code afterwards.

Turn it off for one session with `DESIGN_GATE_HOOK=off`.

## Self-test

```bash
hooks/design-gate/selftest.sh    # 21 assertions
```

Covers both directions: that a rejected page exits 2 with the findings and that
a clean page is silent; that a non-HTML file, a directory that claims nothing, a
malformed payload and `DESIGN_GATE_HOOK=off` all stay out of the way; that a
downstream project with a `DESIGN.md` *is* checked and keeps its own state; that
`monolingual: true` turns off the bilingual rule; that the Stop hook blocks once
and then does not; that `stop_hook_active` is respected; and that a receipt
clears the debt while editing the file invalidates it again.

## State

`.design-gate/` at the root of the project being edited (its git top level, so
the hook and `bin/design-review` write to the same place). Two tab-separated
files of `<hash> <path>`. Delete the directory to reset; nothing else depends
on it.

sky-skills gitignores it. **A downstream project has to add it to its own
`.gitignore`** — otherwise every HTML edit leaves the working tree dirty, and
anything that refuses to run on a dirty tree (`autoupdate/bin/do-update.sh`, for
one) starts skipping silently.

## Cost

PostToolUse fires on *every* tool call and the hook is installed without a
matcher on purpose — a matcher that silently stops matching after a schema
change leaves no trace at all, which is worse than a hook that runs and says
nothing. The price is real: a full bash + python3 round trip measures 19 ms, and
a few hundred tool calls a session adds up. So the not-mine path is now a shell
`case` on the raw payload — no `.html` in it, no interpreter, 0.05 ms. A payload
that ends in `.html` always contains the string, so nothing is missed.
