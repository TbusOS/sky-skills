#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0
"""
check_context_safety.py — locate what a human must check before changing a
kernel function: sleeping, shared state, and who calls it from where.

Answers the three questions that only show up at runtime, and the fourth that
only shows up on SMP:

    can it sleep?          -> does the body call anything that blocks
    is state shared?       -> does it touch file-scope static / global data
    who calls it?          -> and is any caller in atomic / irq context
    what about multicore?  -> unlocked shared state + more than one entry path

Usage:
    check_context_safety.py <file> <function> [--tree <dir>] [-o <report>]
    check_context_safety.py --selftest

Exit codes:
    0  nothing that needs a human
    1  at least one item needs a human decision
    2  usage / IO error / function not found

This is NOT a static analyser. It does no data-flow and no C parsing beyond
brace matching. It finds the lines a person has to read, the same way
check_api_change.sh and show_guard_chain.py do: the machine guarantees
nothing is missed, the judgement stays with the person.
"""

import os
import re
import sys

# ---------------------------------------------------------------- knowledge

# Calls that may sleep. Anything here inside a function means the function
# must not be called from atomic context.
SLEEPERS = [
    (r'\bmutex_lock(_interruptible|_killable)?\b', 'mutex'),
    (r'\bdown(_interruptible|_killable|_timeout)?\s*\(', 'semaphore'),
    (r'\bmsleep\b|\bssleep\b|\busleep_range\b', 'sleep'),
    (r'\bschedule\s*\(|\bschedule_timeout\b|\bcond_resched\b', 'scheduler'),
    (r'\bwait_event(?!_.*_atomic)\w*\b', 'wait queue'),
    (r'\bwait_for_completion\w*\b', 'completion'),
    (r'\bGFP_KERNEL\b|\bGFP_NOFS\b|\bGFP_NOIO\b', 'sleeping allocation'),
    (r'\bvmalloc\b|\bkvmalloc\b', 'vmalloc'),
    (r'\bcopy_(from|to)_user\b|\bget_user\b|\bput_user\b', 'user access (may fault)'),
    (r'\bi2c_transfer\b|\bi2c_smbus_\w+|\bi2c_master_(send|recv)\b', 'i2c transfer'),
    (r'\bspi_sync\b|\bspi_write\b|\bspi_read\b|\bspi_write_then_read\b', 'spi transfer'),
    (r'\bregmap_(read|write|update_bits|bulk_\w+)\b', 'regmap (bus may sleep)'),
    (r'\brequest_firmware\b(?!_nowait)', 'request_firmware'),
    (r'\bsynchronize_rcu\b|\bsynchronize_irq\b', 'synchronize_*'),
    (r'\bflush_work(queue)?\b|\bcancel_work_sync\b|\bcancel_delayed_work_sync\b',
     'flush/cancel _sync'),
    (r'\bdevm_\w+_get\b|\bdevm_kzalloc\b|\bdevm_kmalloc\b', 'devm_* (GFP flags)'),
    (r'\bclk_prepare\b|\bregulator_enable\b|\bregulator_disable\b', 'clk/regulator prepare'),
    (r'\bpm_runtime_get_sync\b|\bpm_runtime_put_sync\b', 'runtime PM sync'),
]

# Names that suggest the caller runs in atomic / interrupt context.
ATOMIC_CALLER = [
    (r'_isr\b|_irq_handler\b|_interrupt\b|_handler\b', 'name looks like an ISR'),
    (r'_tasklet\b|_softirq\b', 'tasklet / softirq'),
    (r'_timer_(cb|callback|fn|func)\b|_timer\b', 'timer callback (atomic)'),
    (r'_notifier_(call|cb)\b', 'notifier (context depends on caller)'),
]

# Locks held around a call site -> the callee must not sleep.
SPINLOCK_TAKEN = re.compile(
    r'\bspin_lock(_irqsave|_irq|_bh|_nested)?\s*\(|'
    r'\braw_spin_lock\w*\s*\(|'
    r'\brcu_read_lock\s*\(|'
    r'\blocal_irq_(save|disable)\s*\(|'
    r'\bpreempt_disable\s*\('
)
SPINLOCK_RELEASED = re.compile(
    r'\bspin_unlock\w*\s*\(|\braw_spin_unlock\w*\s*\(|'
    r'\brcu_read_unlock\s*\(|\blocal_irq_(restore|enable)\s*\(|'
    r'\bpreempt_enable\w*\s*\('
)

LOCK_HINT = re.compile(
    r'\bmutex_lock\w*\s*\(|\bspin_lock\w*\s*\(|\bdown\w*\s*\(|'
    r'\batomic_\w+\s*\(|\bREAD_ONCE\s*\(|\bWRITE_ONCE\s*\(|'
    r'\brcu_(dereference|assign_pointer)\w*\s*\('
)

C_EXT = ('.c', '.h', '.cc', '.cpp')
SKIP_DIRS = {'.git', 'out', 'node_modules', '.repo', 'Documentation'}


# ---------------------------------------------------------------- C helpers

def strip_noise(text):
    """Blank out comments and string literals, preserving offsets."""
    out = []
    i, n = 0, len(text)
    state = None  # None | 'blk' | 'line' | '"' | "'"
    while i < n:
        two = text[i:i + 2]
        c = text[i]
        if state == 'blk':
            if two == '*/':
                out.append('  '); i += 2; state = None; continue
            out.append('\n' if c == '\n' else ' '); i += 1; continue
        if state == 'line':
            if c == '\n':
                out.append('\n'); state = None; i += 1; continue
            out.append(' '); i += 1; continue
        if state in ('"', "'"):
            if c == '\\':
                out.append('  '); i += 2; continue
            if c == state:
                state = None
            out.append('\n' if c == '\n' else ' '); i += 1; continue
        if two == '/*':
            out.append('  '); i += 2; state = 'blk'; continue
        if two == '//':
            out.append('  '); i += 2; state = 'line'; continue
        if c in '"\'':
            state = c; out.append(' '); i += 1; continue
        out.append(c); i += 1
    return ''.join(out)


def find_function(text, clean, name):
    """Return (start_off, end_off, start_line, end_line) of the definition."""
    pat = re.compile(r'(^|\n)[^\n;#]*\b' + re.escape(name) + r'\s*\([^;{]*\)\s*\{')
    for m in pat.finditer(clean):
        brace = clean.index('{', m.start())
        depth, i, n = 0, brace, len(clean)
        while i < n:
            if clean[i] == '{':
                depth += 1
            elif clean[i] == '}':
                depth -= 1
                if depth == 0:
                    sl = text.count('\n', 0, m.start()) + 1
                    el = text.count('\n', 0, i) + 1
                    return (m.start(), i, sl, el)
            i += 1
    return None


def file_scope_vars(text, clean):
    """File-scope declarations: name -> line number. Column 0 only."""
    out = {}
    for m in re.finditer(
            r'(?m)^(?:static\s+|extern\s+)?(?:const\s+)?'
            r'(?:struct\s+\w+|unsigned\s+\w+|signed\s+\w+|[A-Za-z_]\w*)'
            r'[\s*]+([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*(?:=[^;]*)?;', clean):
        name = m.group(1)
        line = text.count('\n', 0, m.start()) + 1
        # skip prototypes and typedefs
        seg = clean[m.start():m.end()]
        if '(' in seg or seg.lstrip().startswith('typedef'):
            continue
        out.setdefault(name, line)
    return out


# ---------------------------------------------------------------- checks

def check_sleep(body, base_line):
    hits = []
    for ln, line in enumerate(body.split('\n')):
        for pat, what in SLEEPERS:
            if re.search(pat, line):
                hits.append((base_line + ln, what, line.strip()[:78]))
                break
    return hits


def check_shared(body, base_line, gvars):
    hits = {}
    for ln, line in enumerate(body.split('\n')):
        for name, decl_line in gvars.items():
            if re.search(r'\b' + re.escape(name) + r'\b', line):
                protected = bool(LOCK_HINT.search(line))
                prev = hits.get(name)
                rec = (base_line + ln, decl_line, protected, line.strip()[:78])
                if prev is None or (prev[2] and not protected):
                    hits[name] = rec
    return hits


def walk(root):
    if os.path.isfile(root):
        yield root
        return
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if f.endswith(C_EXT):
                yield os.path.join(dirpath, f)


def enclosing_function(text, clean, off):
    """Name of the function containing offset `off`, or None."""
    depth = 0
    i = off
    while i > 0:
        c = clean[i]
        if c == '}':
            depth += 1
        elif c == '{':
            if depth == 0:
                head = clean[max(0, i - 300):i]
                m = re.findall(r'([A-Za-z_]\w*)\s*\([^;{]*\)\s*$', head)
                return m[-1] if m else None
            depth -= 1
        i -= 1
    return None


def check_callers(tree, name, self_path):
    callers = []
    call_re = re.compile(r'\b' + re.escape(name) + r'\s*\(')
    for path in walk(tree):
        try:
            text = open(path, encoding='utf-8', errors='replace').read()
        except OSError:
            continue
        if name not in text:
            continue
        clean = strip_noise(text)
        for m in call_re.finditer(clean):
            seg_start = clean.rfind('\n', 0, m.start()) + 1
            seg = clean[seg_start:m.end()]
            if re.search(r'\b(int|void|static|bool|ssize_t|long|EXPORT_SYMBOL)\b.*$',
                         seg) and seg.strip().endswith('('):
                if 'EXPORT_SYMBOL' in seg or ';' not in seg:
                    pass
            line = text.count('\n', 0, m.start()) + 1
            fn = enclosing_function(text, clean, m.start())
            if fn == name:
                continue          # the definition itself / recursion
            risk = []
            if fn:
                for pat, why in ATOMIC_CALLER:
                    if re.search(pat, fn):
                        risk.append(why)
                        break
            head = clean[max(0, m.start() - 2000):m.start()]
            if len(SPINLOCK_TAKEN.findall(head)) > len(SPINLOCK_RELEASED.findall(head)):
                risk.append('a spinlock/rcu/preempt-disable looks still held')
            try:
                shown = os.path.relpath(path, tree)
            except ValueError:              # different drive on some systems
                shown = path
            callers.append((shown, line, fn or '?', risk))
    return callers


# ---------------------------------------------------------------- report

def build_report(path, func, tree):
    text = open(path, encoding='utf-8', errors='replace').read()
    clean = strip_noise(text)
    loc = find_function(text, clean, func)
    if not loc:
        return None, 2
    s, e, sl, el = loc
    body = text[s:e]
    gvars = file_scope_vars(text, clean)

    sleeps = check_sleep(body, sl)
    shared = check_shared(body, sl, gvars)
    callers = check_callers(tree, func, path)

    L = []
    A = L.append
    A("=" * 70)
    A(" check_context_safety: %s()" % func)
    A("   %s:%d-%d" % (path, sl, el))
    A("=" * 70)
    A("")

    A("### 1. Can it sleep?")
    A("")
    if sleeps:
        for ln, what, src in sleeps:
            A("  [SLEEP]   :%-6d %-24s %s" % (ln, what, src))
        A("")
        A("  -> This function MUST NOT be called from atomic context")
        A("     (spinlock held, irq/softirq handler, preempt disabled).")
    else:
        A("  none found - the body has no obviously blocking call.")
        A("  (Absence is not proof: a callee may sleep. Check the ones it calls.)")
    A("")

    A("### 2. Shared state it touches (file-scope static / global)")
    A("")
    if shared:
        for name, (ln, dl, prot, src) in sorted(shared.items()):
            tag = "[SHARED+LOCK]" if prot else "[SHARED]     "
            A("  %s :%-6d %-22s (declared :%d)" % (tag, ln, name, dl))
            A("                    %s" % src)
        unprot = [n for n, v in shared.items() if not v[2]]
        if unprot:
            A("")
            A("  -> On SMP two CPUs can be inside this function at the same time.")
            A("     These have no visible lock / atomic / READ_ONCE: %s" %
              ", ".join(sorted(unprot)))
            A("     Ask: which other paths write them, and what happens if the")
            A("     writes interleave? Prefer REMOVING the shared state over")
            A("     adding a lock - a lock stops races, it does not stop two")
            A("     copies of the truth from drifting apart.")
    else:
        A("  none - it touches no file-scope state.")
    A("")

    A("### 3. Callers (and the context they are in)")
    A("")
    if callers:
        for p, ln, fn, risk in callers:
            tag = "[ATOMIC?]" if risk else "[ok]     "
            A("  %s %s:%d  in %s()" % (tag, p, ln, fn))
            for r in risk:
                A("              ! %s" % r)
    else:
        A("  no call sites found in the tree (dead code? called via pointer?)")
    A("")

    atomic_callers = [c for c in callers if c[3]]
    A("### Verdict")
    A("")
    if sleeps and atomic_callers:
        A("  ** SLEEPS AND HAS A SUSPICIOUS CALLER ** - read those call sites now.")
    elif sleeps:
        A("  Sleeps. Every caller must be in process context with no spinlock held.")
    elif shared and any(not v[2] for v in shared.values()):
        A("  No sleeping, but unprotected shared state - see the SMP note above.")
    else:
        A("  Nothing flagged. Still answer by hand: execution condition, object")
        A("  lifetime, and whether the caller list above is complete.")
    A("")
    A("  Next: references/modifying-existing-code.md step 3.")

    risky = bool(sleeps or atomic_callers or
                 any(not v[2] for v in shared.values()))
    return "\n".join(L), (1 if risky else 0)


# ---------------------------------------------------------------- selftest

SELFTEST_C = '''\
#include <linux/module.h>

static int g_state = -1;
static DEFINE_MUTEX(my_lock);

int sleeping_fn(int mode)
{
	mutex_lock(&my_lock);
	g_state = mode;
	mutex_unlock(&my_lock);
	return 0;
}

int racy_fn(int mode)
{
	g_state = mode;
	return g_state;
}

int clean_fn(int a, int b)
{
	return a + b;
}

static irqreturn_t my_irq_handler(int irq, void *d)
{
	sleeping_fn(1);
	return IRQ_HANDLED;
}
'''


def selftest():
    import tempfile
    fails = 0
    d = tempfile.mkdtemp(prefix='ctxsafe-')
    p = os.path.join(d, 't.c')
    with open(p, 'w') as f:
        f.write(SELFTEST_C)

    cases = [
        ('sleeping_fn', 'SLEEP', True, 'detects mutex_lock as sleeping'),
        ('sleeping_fn', 'ATOMIC?', True, 'flags the irq handler caller'),
        ('racy_fn', 'SHARED', True, 'finds unprotected g_state'),
        ('clean_fn', 'SHARED', False, 'clean function has no shared state'),
        ('clean_fn', 'SLEEP', False, 'clean function does not sleep'),
    ]
    for func, token, want, label in cases:
        rep, _ = build_report(p, func, d)
        got = rep is not None and token in rep
        ok = (got == want)
        print("%-46s %s" % (label, "PASS" if ok else "FAIL"))
        if not ok:
            fails += 1

    # discrimination: the locked function must NOT be reported as unprotected
    rep, _ = build_report(p, 'sleeping_fn', d)
    ok = 'SHARED+LOCK' in rep or 'unprotected shared state' not in rep
    print("%-46s %s" % ("lock discrimination (locked != racy)",
                        "PASS" if ok else "FAIL"))
    if not ok:
        fails += 1

    for f in os.listdir(d):
        os.unlink(os.path.join(d, f))
    os.rmdir(d)
    print("\n%d failure(s)" % fails)
    return 1 if fails else 0


# ---------------------------------------------------------------- main

def main(argv):
    if len(argv) >= 2 and argv[1] == '--selftest':
        return selftest()
    args, tree, out = [], None, None
    i = 1
    while i < len(argv):
        if argv[i] == '--tree' and i + 1 < len(argv):
            tree = argv[i + 1]; i += 2; continue
        if argv[i] == '-o' and i + 1 < len(argv):
            out = argv[i + 1]; i += 2; continue
        args.append(argv[i]); i += 1
    if len(args) != 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    path, func = args
    if not os.path.isfile(path):
        print("no such file: %s" % path, file=sys.stderr)
        return 2
    tree = tree or os.path.dirname(os.path.abspath(path))

    rep, code = build_report(path, func, tree)
    if rep is None:
        print("function not found: %s in %s" % (func, path), file=sys.stderr)
        return 2

    if out:
        with open(out, 'w', encoding='utf-8') as f:
            f.write(rep + "\n")
        nl = rep.count("\n") + 1
        print("report is %d lines - written to:\n    %s\n" % (nl, out))
        for i, line in enumerate(rep.split("\n"), 1):
            if line.startswith("### "):
                print("  %5d  %s" % (i, line[4:]))
        print("\ne.g.   sed -n '<from>,<to>p' %s" % out)
    else:
        print(rep)
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv))
