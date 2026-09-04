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
sits inside a repo that has `skills/design-review/scripts/verify.py`, so editing
HTML in an unrelated project stays silent. Then it:

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
hooks/design-gate/selftest.sh    # 15 assertions
```

Covers both directions: that a rejected page exits 2 with the findings and that
a clean page is silent; that a non-HTML file, a file outside a design repo, a
malformed payload and `DESIGN_GATE_HOOK=off` all stay out of the way; that the
Stop hook blocks once and then does not; that `stop_hook_active` is respected;
and that a receipt clears the debt while editing the file invalidates it again.

## State

`.design-gate/` in the repo being edited, gitignored. Two tab-separated files of
`<hash> <path>`. Delete the directory to reset; nothing else depends on it.
