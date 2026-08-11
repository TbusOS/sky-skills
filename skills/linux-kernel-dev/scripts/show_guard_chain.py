#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0
"""
show_guard_chain.py — print the guard chain that gates a given line.

A grep hit is a *line*. Its meaning lives in the *block*.
This tool answers "under what condition does this line run?" by walking
upward and printing every enclosing block header.

Usage:
    show_guard_chain.py <file>:<line> [--type auto|c|rc|kconfig|make|dts|sh]
    show_guard_chain.py <file> <line>
    show_guard_chain.py --grep <pattern> <path>...     # grep + guard chain for every hit
    show_guard_chain.py --selftest

Exit codes:
    0  every inspected line is unconditional (top level)
    1  at least one line is guarded -> a human must read the condition
    2  usage / IO error

Design note: this is deliberately NOT a full parser. It locates the lines a
human must read, same philosophy as check_api_change.sh — the machine makes
sure nothing is missed, the judgement stays with the person.
"""

import os
import re
import sys

# ---------------------------------------------------------------- file typing

EXT_MAP = {
    '.c': 'c', '.h': 'c', '.cc': 'c', '.cpp': 'c', '.hpp': 'c',
    '.rc': 'rc',
    '.dts': 'dts', '.dtsi': 'dts',
    '.mk': 'make',
    '.sh': 'sh', '.bash': 'sh',
}

NAME_MAP = {
    'Kconfig': 'kconfig',
    'Makefile': 'make',
    'GNUmakefile': 'make',
}


def detect_type(path):
    base = os.path.basename(path)
    if base in NAME_MAP:
        return NAME_MAP[base]
    if base.startswith('Kconfig'):
        return 'kconfig'
    if base.startswith('Makefile'):
        return 'make'
    ext = os.path.splitext(base)[1]
    if ext in EXT_MAP:
        return EXT_MAP[ext]
    return 'sh'          # generic indent/keyword fallback


# ---------------------------------------------------------------- C / C++

def _strip_c_noise(lines):
    """Blank out comments and string/char literals, preserving line structure."""
    out = []
    in_block_comment = False
    for line in lines:
        buf = []
        i = 0
        n = len(line)
        in_str = None
        while i < n:
            two = line[i:i + 2]
            if in_block_comment:
                if two == '*/':
                    in_block_comment = False
                    buf.append('  ')
                    i += 2
                    continue
                buf.append(' ')
                i += 1
                continue
            if in_str:
                if line[i] == '\\':
                    buf.append('  ')
                    i += 2
                    continue
                if line[i] == in_str:
                    in_str = None
                buf.append(' ')
                i += 1
                continue
            if two == '/*':
                in_block_comment = True
                buf.append('  ')
                i += 2
                continue
            if two == '//':
                buf.append(' ' * (n - i))
                break
            if line[i] in ('"', "'"):
                in_str = line[i]
                buf.append(' ')
                i += 1
                continue
            buf.append(line[i])
            i += 1
        out.append(''.join(buf))
    return out


C_COND_RE = re.compile(r'\b(if|else\s+if|else|for|while|switch|do)\b')
CPP_IF_RE = re.compile(r'^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b(.*)')


def guards_c(lines, target):
    """Return list of (lineno, kind, text) guarding `target` (1-based)."""
    clean = _strip_c_noise(lines)
    cpp_stack = []       # preprocessor arms
    brace_stack = []     # (lineno, header_text)
    guards = []

    for idx in range(target - 1):          # lines strictly before target
        lineno = idx + 1
        raw = lines[idx].rstrip('\n')
        m = CPP_IF_RE.match(raw)
        if m:
            kw = m.group(1)
            if kw in ('if', 'ifdef', 'ifndef'):
                cpp_stack.append((lineno, raw.strip()))
            elif kw in ('elif', 'else'):
                if cpp_stack:
                    cpp_stack[-1] = (lineno, raw.strip())
            elif kw == 'endif':
                if cpp_stack:
                    cpp_stack.pop()
            continue

        cl = clean[idx]
        for ch in cl:
            if ch == '{':
                header = _c_header_for(lines, clean, idx)
                brace_stack.append((header[0], header[1]))
            elif ch == '}':
                if brace_stack:
                    brace_stack.pop()

    for lineno, text in cpp_stack:
        guards.append((lineno, 'cpp', text))
    for lineno, text in brace_stack:
        kind = 'cond' if C_COND_RE.search(text) else 'scope'
        guards.append((lineno, kind, text))

    guards.sort(key=lambda g: g[0])
    return guards


def _c_header_for(lines, clean, idx):
    """Given the index of a line containing '{', find the statement it belongs to."""
    before = clean[idx].split('{')[0].strip()
    if before:
        return (idx + 1, lines[idx].strip().rstrip('{').strip() or lines[idx].strip())
    j = idx - 1
    while j >= 0 and not clean[j].strip():
        j -= 1
    if j < 0:
        return (idx + 1, lines[idx].strip())
    return (j + 1, lines[j].strip())


# ---------------------------------------------------------------- Android init .rc

RC_SECTION_RE = re.compile(r'^(on|service|import)\s+(.*)')


def guards_rc(lines, target):
    for idx in range(target - 2, -1, -1):
        raw = lines[idx].rstrip('\n')
        m = RC_SECTION_RE.match(raw)
        if m:
            kind = 'trigger' if m.group(1) == 'on' else 'section'
            return [(idx + 1, kind, raw.strip())]
    return []


# ---------------------------------------------------------------- Kconfig

KCONFIG_ENTRY_RE = re.compile(r'^(config|menuconfig|choice|menu|if|source)\b(.*)')


def guards_kconfig(lines, target):
    guards = []
    if_stack = []
    entry = None
    for idx in range(target - 1):
        raw = lines[idx].rstrip('\n')
        stripped = raw.strip()
        m = KCONFIG_ENTRY_RE.match(raw)
        if m:
            kw = m.group(1)
            if kw == 'if':
                if_stack.append((idx + 1, stripped))
            elif kw in ('config', 'menuconfig', 'choice', 'menu'):
                entry = (idx + 1, stripped)
            continue
        if stripped == 'endif' and if_stack:
            if_stack.pop()
            continue
        if stripped.startswith('depends on') and entry:
            guards.append((idx + 1, 'depends', stripped))
    for lineno, text in if_stack:
        guards.append((lineno, 'cond', text))
    if entry:
        guards.append((entry[0], 'scope', entry[1]))
    guards.sort(key=lambda g: g[0])
    return guards


# ---------------------------------------------------------------- Makefile

MAKE_COND_RE = re.compile(r'^\s*(ifeq|ifneq|ifdef|ifndef|else|endif)\b(.*)')
MAKE_TARGET_RE = re.compile(r'^([^\t#\s][^:=]*):(?!=)')


def guards_make(lines, target):
    cond_stack = []
    guards = []
    last_target = None
    for idx in range(target - 1):
        raw = lines[idx].rstrip('\n')
        m = MAKE_COND_RE.match(raw)
        if m:
            kw = m.group(1)
            if kw in ('ifeq', 'ifneq', 'ifdef', 'ifndef'):
                cond_stack.append((idx + 1, raw.strip()))
            elif kw == 'else':
                if cond_stack:
                    cond_stack[-1] = (idx + 1, raw.strip())
            elif kw == 'endif':
                if cond_stack:
                    cond_stack.pop()
            continue
        if MAKE_TARGET_RE.match(raw):
            last_target = (idx + 1, raw.strip())
    for lineno, text in cond_stack:
        guards.append((lineno, 'cond', text))
    if last_target and lines[target - 1].startswith('\t'):
        guards.append((last_target[0], 'scope', last_target[1]))
    guards.sort(key=lambda g: g[0])
    return guards


# ---------------------------------------------------------------- DTS

def guards_dts(lines, target):
    clean = _strip_c_noise(lines)
    stack = []
    for idx in range(target - 1):
        for ch in clean[idx]:
            if ch == '{':
                header = _c_header_for(lines, clean, idx)
                stack.append((header[0], header[1]))
            elif ch == '}':
                if stack:
                    stack.pop()
    return [(ln, 'node', tx) for ln, tx in stack]


# ---------------------------------------------------------------- shell / generic

SH_OPEN_RE = re.compile(r'^\s*(if|for|while|until|case)\b')
SH_CLOSE_RE = re.compile(r'^\s*(fi|done|esac)\b')
SH_FUNC_RE = re.compile(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{')


def guards_sh(lines, target):
    stack = []
    for idx in range(target - 1):
        raw = lines[idx].rstrip('\n')
        s = raw.strip()
        if not s or s.startswith('#'):
            continue
        if SH_FUNC_RE.match(raw):
            stack.append((idx + 1, 'scope', s))
            continue
        if SH_OPEN_RE.match(raw):
            stack.append((idx + 1, 'cond', s))
            continue
        if SH_CLOSE_RE.match(raw) or s == '}':
            if stack:
                stack.pop()
    return stack


DISPATCH = {
    'c': guards_c,
    'rc': guards_rc,
    'kconfig': guards_kconfig,
    'make': guards_make,
    'dts': guards_dts,
    'sh': guards_sh,
}

KIND_LABEL = {
    'cpp': 'BUILD-TIME',
    'cond': 'RUNTIME COND',
    'trigger': 'EVENT TRIGGER',
    'depends': 'DEPENDS',
    'scope': 'scope',
    'node': 'node',
    'section': 'section',
}

# guard kinds that actually gate execution (vs. merely giving scope)
GATING = {'cpp', 'cond', 'trigger', 'depends'}


# ---------------------------------------------------------------- reporting

def report(path, lineno, lines, ftype, quiet_scope=False):
    fn = DISPATCH.get(ftype, guards_sh)
    guards = fn(lines, lineno)
    gating = [g for g in guards if g[1] in GATING]

    target_text = lines[lineno - 1].rstrip('\n').strip()
    print("%s:%d" % (path, lineno))
    shown = [g for g in guards if not (quiet_scope and g[1] not in GATING)]
    for ln, kind, text in shown:
        print("   |- [%-13s] :%-6d %s" % (KIND_LABEL.get(kind, kind), ln, _clip(text)))
    print("   `- [%-13s] :%-6d %s" % ('TARGET', lineno, _clip(target_text)))
    if gating:
        print("   !! CONDITIONAL: runs only when the above hold. Read them before concluding.")
    else:
        print("   ok unconditional at top level.")
    print()
    return 1 if gating else 0


def _clip(s, n=96):
    s = s.replace('\t', ' ')
    return s if len(s) <= n else s[:n - 3] + '...'


def load(path):
    with open(path, 'r', errors='replace') as f:
        return f.readlines()


# ---------------------------------------------------------------- grep mode

SKIP_DIRS = {'.git', 'out', 'node_modules', '.repo'}


def walk_files(roots):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                yield os.path.join(dirpath, name)


TEXT_EXT = set(EXT_MAP) | {'', '.S', '.in', '.cfg', '.conf', '.te', '.py'}


def grep_mode(pattern, roots, forced_type):
    rx = re.compile(pattern)
    worst = 0
    hits = 0
    for path in walk_files(roots):
        base = os.path.basename(path)
        ext = os.path.splitext(base)[1]
        if base not in NAME_MAP and not base.startswith(('Kconfig', 'Makefile')) \
                and ext not in TEXT_EXT:
            continue
        try:
            lines = load(path)
        except (IOError, OSError):
            continue
        ftype = forced_type or detect_type(path)
        for i, line in enumerate(lines, 1):
            if rx.search(line):
                hits += 1
                worst = max(worst, report(path, i, lines, ftype, quiet_scope=True))
    if hits == 0:
        print("no hits for pattern: %s" % pattern, file=sys.stderr)
        print("  (grep 0 hits != 'it does not exist' — check the pattern covers "
              "every spelling before concluding)", file=sys.stderr)
    else:
        print("%d hit(s) inspected." % hits)
    return worst


# ---------------------------------------------------------------- selftest

SELFTESTS = [
    # (name, type, source, target_line, must_contain_kind)
    ("android-init property trigger", 'rc', """\
on boot
    write /sys/class/x/y 1

on property:sys.example.flag=*
 write /sys/example/node ${sys.example.flag}
""", 5, 'trigger'),

    ("C guarded by if", 'c', """\
void f(struct client *c)
{
	parse(c);
	if (c->flags & CLIENT_WAKE) {
		device_init_wakeup(&c->dev, true);
	}
}
""", 5, 'cond'),

    ("C guarded by #ifdef", 'c', """\
#ifdef CONFIG_EXAMPLE_FEATURE
	ret = feature_call(mode);
#endif
""", 2, 'cpp'),

    ("C unconditional", 'c', """\
int g(void)
{
	return 0;
}
""", 3, None),

    ("Kconfig depends on", 'kconfig', """\
config EXAMPLE_THING
	bool "example"
	depends on OTHER_THING
	default y
""", 4, 'depends'),

    ("Makefile ifeq", 'make', """\
ifeq ($(CONFIG_X),y)
obj-y += foo.o
endif
""", 2, 'cond'),

    ("shell if", 'sh', """\
if [ -n "$X" ]; then
    do_thing
fi
""", 2, 'cond'),
]


def selftest():
    failures = 0
    for name, ftype, src, line, want in SELFTESTS:
        lines = src.splitlines(keepends=True)
        guards = DISPATCH[ftype](lines, line)
        kinds = {g[1] for g in guards}
        gating = kinds & GATING
        if want is None:
            ok = not gating
        else:
            ok = want in kinds
        print("%-34s %s   (found: %s)" %
              (name, "PASS" if ok else "FAIL", ','.join(sorted(kinds)) or '-'))
        if not ok:
            failures += 1

    # Discrimination test — the real failure mode is not "did we find A guard"
    # but "did we attach the line to the RIGHT guard". Two lines in the same
    # file sit under different triggers; a tool that cannot tell them apart is
    # exactly as useless as reading the grep hit alone.
    lines = SELFTESTS[0][2].splitlines(keepends=True)
    g2 = DISPATCH['rc'](lines, 2)         # under "on boot"       -> one-shot
    g5 = DISPATCH['rc'](lines, 5)         # under "on property:"  -> re-fires
    ok = (len(g2) == 1 and g2[0][2].startswith('on boot') and
          len(g5) == 1 and g5[0][2].startswith('on property:'))
    print("%-34s %s   (l2=%r l5=%r)" %
          ("trigger discrimination",
           "PASS" if ok else "FAIL",
           g2[0][2] if g2 else None,
           g5[0][2] if g5 else None))
    if not ok:
        failures += 1

    print()
    print("%d failure(s)" % failures)
    return 1 if failures else 0


# ---------------------------------------------------------------- main

def usage():
    print(__doc__.strip(), file=sys.stderr)
    return 2


def main(argv):
    if len(argv) < 2:
        return usage()

    if argv[1] == '--selftest':
        return selftest()

    forced_type = None
    args = []
    i = 1
    while i < len(argv):
        if argv[i] == '--type' and i + 1 < len(argv):
            forced_type = argv[i + 1]
            i += 2
            continue
        args.append(argv[i])
        i += 1

    if args and args[0] == '--grep':
        if len(args) < 3:
            return usage()
        return grep_mode(args[1], args[2:], forced_type)

    if len(args) == 1 and ':' in args[0]:
        path, _, lno = args[0].rpartition(':')
    elif len(args) == 2:
        path, lno = args[0], args[1]
    else:
        return usage()

    try:
        lineno = int(lno)
    except ValueError:
        return usage()

    try:
        lines = load(path)
    except (IOError, OSError) as e:
        print("cannot read %s: %s" % (path, e), file=sys.stderr)
        return 2

    if lineno < 1 or lineno > len(lines):
        print("line %d out of range (file has %d lines)" % (lineno, len(lines)),
              file=sys.stderr)
        return 2

    ftype = forced_type or detect_type(path)
    return report(path, lineno, lines, ftype)


if __name__ == '__main__':
    sys.exit(main(sys.argv))
