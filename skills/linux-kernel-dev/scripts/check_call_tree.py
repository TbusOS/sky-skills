#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0
"""
check_call_tree.py — validate ASCII call-tree blocks the way a reader parses
them: by column.

A deep call chain (30+ frames of pure C identifiers) is the one place where an
ASCII tree beats an SVG flowchart — indentation carries depth for free and the
text can be pasted into grep. It is also the one place where a single wide
character silently destroys the whole picture, because every frame's depth is
read off its column.

What this checks, and why each one is a column problem:

    non-ascii-in-tree   one CJK glyph is two cells in some fonts and one in
                        others, so every line below it reads at the wrong depth
    ragged-indent       a frame indented off-step has no depth a reader can name
    dangling-return     a `<--` return arrow whose column matches no frame means
                        "returns to nowhere"
    line-too-wide       past the container width the tree wraps, and a wrapped
                        line reads as a new frame at column 0

Usage:
    check_call_tree.py <file> [<file>...] [--max-width N] [--max-lines N]
    check_call_tree.py --selftest

Exit codes:
    0  clean
    1  at least one finding
    2  usage / IO error

This is not a parser. It finds the lines a person has to look at; whether the
call chain itself is correct stays with the person (and with fact_gate.mjs).
"""

import argparse
import math
import re
import sys

FENCE = re.compile(r'^\s*(```|~~~)')
# A call frame is an arrow at the START of the stripped line followed by an
# identifier: `-> vfs_read`, or `| -> vfs_read`. Anchoring it here is what
# keeps SVG and HTML blocks out — `-->` closing a comment, and C like
# `file->f_op`, both carry `->` but never open a line.
CALL = re.compile(r'^\s*\|?\s*->\s*[A-Za-z_]')
RETURN = re.compile(r'<-{2,}')

DEFAULT_MAX_WIDTH = 100
DEFAULT_MAX_LINES = 60


def leading(s):
    return len(s) - len(s.lstrip(' '))


def looks_like_call_tree(lines):
    """A block is a call tree when at least three lines call something and they
    do not all sit at the same column. Shell transcripts and C snippets have
    `->` too, but they do not stair-step."""
    calls = [l for l in lines if CALL.match(l)]
    if len(calls) < 3:
        return False
    return len({leading(l) for l in calls}) >= 2


def find_blocks(text):
    """Yield (start_line_no, [lines]) for every fenced block that reads as a
    call tree. Unfenced files are treated as one block."""
    lines = text.split('\n')
    if not any(FENCE.match(l) for l in lines):
        if looks_like_call_tree(lines):
            yield 1, lines
        return
    inside = False
    start = 0
    buf = []
    for i, l in enumerate(lines, 1):
        if FENCE.match(l):
            if inside:
                if looks_like_call_tree(buf):
                    yield start, buf
                buf = []
            inside = not inside
            start = i + 1
            continue
        if inside:
            buf.append(l)


def indent_step(indents):
    """The step a reader would infer: the gcd of the gaps between the columns
    that are actually used. Returns 0 when there is nothing to infer."""
    uniq = sorted(set(indents))
    if len(uniq) < 2:
        return 0
    gaps = [b - a for a, b in zip(uniq, uniq[1:])]
    step = 0
    for g in gaps:
        step = math.gcd(step, g)
    return step


def check_block(start, lines, max_width, max_lines):
    out = []

    def add(kind, off, msg):
        out.append((kind, start + off, msg))

    # 1 · non-ASCII anywhere in the tree body
    for i, l in enumerate(lines):
        bad = [c for c in l if ord(c) > 127]
        if bad:
            add('non-ascii-in-tree', i,
                'contains %r — one wide glyph shifts every column below it; '
                'put the prose in the caption outside the block'
                % ''.join(sorted(set(bad))[:6]))

    call_lines = [(i, l) for i, l in enumerate(lines) if CALL.match(l)]
    indents = [leading(l) for _, l in call_lines]
    step = indent_step(indents)

    # 2 · every call frame sits on the inferred step
    if step:
        base = min(indents)
        if step < 2:
            add('ragged-indent', call_lines[0][0],
                'inferred indent step is %d column(s) — a reader cannot count '
                'depth below 2; use a fixed 2- or 3-space step' % step)
        else:
            for (i, l), ind in zip(call_lines, indents):
                if (ind - base) % step:
                    add('ragged-indent', i,
                        'indented %d, which is not %d + k*%d — this frame has '
                        'no depth a reader can name' % (ind, base, step))

    # 3 · return arrows must land on a column some frame actually uses
    frame_cols = set(indents)
    for i, l in enumerate(lines):
        if not RETURN.search(l):
            continue
        col = leading(l)
        if col not in frame_cols:
            add('dangling-return', i,
                'return arrow starts at column %d, where no frame sits '
                '(frames use %s) — the arrow returns to nowhere'
                % (col, ', '.join(str(c) for c in sorted(frame_cols)[:8])))

    # 4 · width: past the container the line wraps and reads as a new frame
    for i, l in enumerate(lines):
        if len(l) > max_width:
            add('line-too-wide', i,
                '%d columns (> %d) — wrap it and the tail reads as a fresh '
                'frame at column 0; shorten the annotation or drop it to the '
                'caption' % (len(l), max_width))

    # 5 · length
    if len(lines) > max_lines:
        add('tree-too-long', 0,
            '%d lines (> %d) — fold it into <details> and keep the first 15 '
            'plus the conclusion on screen' % (len(lines), max_lines))
    return out


def run(paths, max_width, max_lines):
    findings = 0
    for p in paths:
        try:
            text = open(p, encoding='utf-8').read()
        except OSError as e:
            print('check_call_tree: %s' % e, file=sys.stderr)
            return 2
        for start, lines in find_blocks(text):
            for kind, ln, msg in check_block(start, lines, max_width, max_lines):
                print('%s:%d: [%s] %s' % (p, ln, kind, msg))
                findings += 1
    if findings:
        print('\ncheck_call_tree: %d finding(s)' % findings)
        return 1
    print('check_call_tree: clean')
    return 0


GOOD = """```
sys_read
   -> ksys_read
      -> vfs_read
         -> file->f_op->read_iter: ext4_file_read_iter
            |
            | EXT4
            V
            -> generic_file_read_iter
               -> filemap_read
                  -> folio_wait_bit             (blocks here)
                  |<---------------------------- resumes at this depth
                  -> copy_folio_to_iter
```
"""

BAD_NONASCII = GOOD.replace('(blocks here)', '(阻塞点)')
BAD_RAGGED = GOOD.replace('      -> vfs_read', '     -> vfs_read')
BAD_RETURN = GOOD.replace('                  |<---', '             |<---')


def selftest():
    import tempfile, os
    cases = [
        ('good', GOOD, 0, None),
        ('non-ascii', BAD_NONASCII, 1, 'non-ascii-in-tree'),
        ('ragged', BAD_RAGGED, 1, 'ragged-indent'),
        ('dangling', BAD_RETURN, 1, 'dangling-return'),
    ]
    failures = 0
    for name, body, want_rc, want_kind in cases:
        with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False,
                                         encoding='utf-8') as f:
            f.write(body)
            path = f.name
        import io
        from contextlib import redirect_stdout
        buf = io.StringIO()
        with redirect_stdout(buf):
            rc = run([path], DEFAULT_MAX_WIDTH, DEFAULT_MAX_LINES)
        os.unlink(path)
        got = buf.getvalue()
        ok = (rc == want_rc) and (want_kind is None or want_kind in got)
        print('  %-10s rc=%d %s' % (name, rc, 'ok' if ok else 'FAIL'))
        if not ok:
            failures += 1
            print(got)
    print('check_call_tree selftest: %s' % ('ok' if not failures else 'FAIL'))
    return 0 if not failures else 1


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--max-width', type=int, default=DEFAULT_MAX_WIDTH)
    ap.add_argument('--max-lines', type=int, default=DEFAULT_MAX_LINES)
    ap.add_argument('--selftest', action='store_true')
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.paths:
        ap.print_usage(sys.stderr)
        return 2
    return run(a.paths, a.max_width, a.max_lines)


if __name__ == '__main__':
    sys.exit(main())
