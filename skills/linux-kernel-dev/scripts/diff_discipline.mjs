#!/usr/bin/env node
/**
 * diff_discipline.mjs — "can you justify every changed line?" gate.
 *
 * Why this exists (change-discipline.md had the rules but no check)
 *   Two failure modes cost more review time than actual bugs, and neither is
 *   visible when you read the patch hunk by hunk -- both only show up when you
 *   look at the diff as a whole:
 *
 *     1. Over-reach. The task named one function; the diff also renamed a
 *        variable, reordered includes, and re-indented a block "while I was in
 *        there". Every such line is a line someone must review and a line that
 *        owns a git blame entry forever.
 *     2. Speculative generality. The change ships a knob nobody asked for --
 *        a module_param, a new Kconfig symbol, a wrapper with one caller --
 *        priced as if configurability were free. It is not: every option is a
 *        state someone has to reason about for the life of the driver.
 *
 *   Reading the diff top to bottom does not catch these, because each hunk
 *   looks locally reasonable. The reliable test is the aggregate one: which
 *   files were touched at all, and does anything new exist without a caller.
 *
 * Findings
 *   out-of-scope    file changed that no --scope pattern covers        -> FAIL
 *                     the mechanised form of "don't touch what you weren't
 *                     asked to touch". Needs --scope; without it, skipped.
 *   reformat-only   hunk whose added and removed lines are identical
 *                   once whitespace is stripped -- pure re-indent or
 *                   reordering, no semantic change                     -> WARN
 *                     these bury the real change in review noise.
 *   spread          more files / top-level dirs touched than the
 *                   thresholds -- the runaway-refactor signal          -> WARN
 *                     not wrong by itself; it means "stop and confirm the
 *                     scope is still what was agreed", not "revert".
 *   speculative-knob  diff adds module_param* / MODULE_PARM_DESC, or a
 *                   new `config` symbol in a Kconfig                   -> WARN
 *   lone-wrapper    newly added static function with exactly one call
 *                   site in the tree                                   -> WARN
 *                     needs --tree. Without a tree this is reported as
 *                     undetermined rather than guessed.
 *
 *   A warn is not an accusation. Each has a legitimate form: a driver really
 *   may need one module_param, a rename really may have been requested. The
 *   gate's job is to make the decision explicit, not to make it for you.
 *
 * Usage
 *   diff_discipline.mjs --diff <patch|-> [--scope <glob,glob>] [--tree <t>]
 *                       [--max-files N] [--max-dirs N] [--json] [--quiet]
 *   diff_discipline.mjs --git <range> [--repo <path>] [...]
 *   diff_discipline.mjs --selftest
 *
 *   --scope takes shell-style globs against repo-relative paths, e.g.
 *     --scope 'drivers/i2c/**,include/linux/i2c.h'
 *   A pattern ending in / is treated as a prefix (drivers/i2c/ == drivers/i2c/**).
 *
 * Exit: 0 clean | 1 findings | 3 gate-error (bad args / unreadable input)
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

function die(msg) { console.error(msg); process.exit(3) }

function parseArgs(argv) {
  const a = {
    diff: '', git: '', repo: '.', scope: '', tree: '',
    maxFiles: 8, maxDirs: 3, json: false, quiet: false, selftest: false,
  }
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--diff':      a.diff = argv[++i]; break
      case '--git':       a.git = argv[++i]; break
      case '--repo':      a.repo = argv[++i]; break
      case '--scope':     a.scope = argv[++i]; break
      case '--tree':      a.tree = argv[++i]; break
      case '--max-files': a.maxFiles = Number(argv[++i]); break
      case '--max-dirs':  a.maxDirs = Number(argv[++i]); break
      case '--json':      a.json = true; break
      case '--quiet':     a.quiet = true; break
      case '--selftest':  a.selftest = true; break
      case '-h': case '--help':
        console.log('usage: diff_discipline.mjs --diff <patch|-> [--scope <globs>] [--tree <t>] [--max-files N] [--max-dirs N] [--json]')
        console.log('       diff_discipline.mjs --git <range> [--repo <path>]')
        console.log('       diff_discipline.mjs --selftest')
        process.exit(0)
      default:
        if (argv[i].startsWith('-')) die(`unknown option: ${argv[i]}`)
    }
  }
  return a
}

/* ------------------------------------------------------------------ parsing */

function parseDiff(text) {
  const files = []
  let cur = null, hunk = null
  for (const line of text.split('\n')) {
    const git = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
    if (git) { cur = newFile(git[2]); files.push(cur); hunk = null; continue }
    if (line.startsWith('--- ')) {
      if (!cur) { cur = newFile('(unknown)'); files.push(cur); hunk = null }
      continue
    }
    if (line.startsWith('+++ ')) {
      const p = line.slice(4).trim().split('\t')[0]
      if (cur && p !== '/dev/null') cur.path = p.replace(/^b\//, '')
      continue
    }
    const at = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (at) {
      if (!cur) { cur = newFile('(unknown)'); files.push(cur) }
      hunk = { newStart: Number(at[1]), added: [], removed: [] }
      cur.hunks.push(hunk)
      continue
    }
    if (!hunk) continue
    if (line.startsWith('+')) { hunk.added.push(line.slice(1)); cur.added.push(line.slice(1)) }
    else if (line.startsWith('-')) hunk.removed.push(line.slice(1))
  }
  return files.filter(f => f.hunks.length)
}

function newFile(path) { return { path, hunks: [], added: [] } }

/* -------------------------------------------------------------------- globs */

function globToRe(g) {
  let s = g.trim()
  if (!s) return null
  if (s.endsWith('/')) s += '**'
  s = s.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  // ** is parked on a sentinel first, or the single-* pass would rewrite
  // half of it and leave `[^/]*[^/]*` behind. NUL cannot occur in a path.
  // Written as an escape, never as a raw byte -- a raw NUL makes git treat
  // this source file as binary (no diffs, no merges).
  s = s.replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*').replace(/\?/g, '.')
  return new RegExp('^' + s + '$')
}

/* ------------------------------------------------------------------- checks */

function isReformatOnly(hunk) {
  const norm = s => s.replace(/\s+/g, '')
  const a = hunk.added.map(norm).filter(Boolean).sort()
  const r = hunk.removed.map(norm).filter(Boolean).sort()
  if (!a.length || a.length !== r.length) return false
  return a.every((v, i) => v === r[i])
}

// module_param(x, ...) and its MODULE_PARM_DESC(x, ...) are one knob, not two.
const KNOB_RE = /\b(?:module_param(?:_named|_array|_cb|_string)?|MODULE_PARM_DESC)\s*\(\s*([A-Za-z_]\w*)/
const KCONFIG_RE = /^\s*(menu)?config\s+[A-Z0-9_]+\s*$/

function addedFunctionNames(file) {
  if (!/\.c$/.test(file.path)) return []
  const names = []
  for (const l of file.added) {
    // a definition line, not a prototype: `static [inline] <type> name(` with no trailing ;
    const m = l.match(/^\s*static\s+(?:inline\s+)?[A-Za-z_][\w\s*]*?\b([a-z_]\w*)\s*\(/)
    if (m && !/;\s*$/.test(l) && !/^\s*static\s+(const\s+)?struct\b/.test(l)) names.push(m[1])
  }
  return [...new Set(names)]
}

function isDefinitionOf(line, name) {
  return new RegExp(`static\\s+(?:inline\\s+)?[A-Za-z_][\\w\\s*]*?\\b${name}\\s*\\(`).test(line)
}

function countCallSites(name, tree) {
  // word-boundary hits across C sources, minus the definition line itself.
  // An ops-table assignment (.probe = foo_probe) counts as a use, which is correct.
  let out = ''
  try {
    out = execFileSync('grep', ['-rnw', '--include=*.c', '--include=*.h', '-e', name, tree],
      { maxBuffer: 64 * 1024 * 1024 }).toString()
  } catch (e) {
    if (e.status === 1) return 0          // grep: no match
    throw e
  }
  const lines = out.split('\n').filter(Boolean)
  return lines.length - lines.filter(l => isDefinitionOf(l, name)).length
}

function analyse(files, opt) {
  const findings = []
  const notes = []

  const scopes = opt.scope ? opt.scope.split(',').map(globToRe).filter(Boolean) : null
  if (scopes) {
    for (const f of files) {
      if (!scopes.some(re => re.test(f.path)))
        findings.push({ kind: 'out-of-scope', sev: 'error', path: f.path, line: f.hunks[0].newStart,
          detail: 'no --scope pattern covers this file' })
    }
  } else {
    notes.push('no --scope given: out-of-scope check skipped (the diff was not compared against a stated task)')
  }

  for (const f of files) {
    for (const h of f.hunks) {
      if (isReformatOnly(h))
        findings.push({ kind: 'reformat-only', sev: 'warn', path: f.path, line: h.newStart,
          detail: `${h.added.length} line(s) differ only in whitespace` })
    }
    const seenKnobs = new Set()
    for (const l of f.added) {
      const knob = l.match(KNOB_RE)
      if (knob) {
        if (seenKnobs.has(knob[1])) continue
        seenKnobs.add(knob[1])
        findings.push({ kind: 'speculative-knob', sev: 'warn', path: f.path, line: 0,
          detail: `adds module parameter "${knob[1]}" -- who sets it, and what breaks if it is wrong?` })
      } else if (/(^|\/)Kconfig/.test(f.path) && KCONFIG_RE.test(l)) {
        findings.push({ kind: 'speculative-knob', sev: 'warn', path: f.path, line: 0,
          detail: `adds a Kconfig symbol: ${l.trim()}` })
      }
    }
  }

  const fileCount = files.length
  const dirs = new Set(files.map(f => f.path.split('/').slice(0, 2).join('/')))
  if (fileCount > opt.maxFiles || dirs.size > opt.maxDirs)
    findings.push({ kind: 'spread', sev: 'warn', path: '(diff)', line: 0,
      detail: `${fileCount} files across ${dirs.size} areas (thresholds ${opt.maxFiles}/${opt.maxDirs})` })

  const added = files.flatMap(f => addedFunctionNames(f).map(n => ({ n, f })))
  if (added.length) {
    if (!opt.tree) {
      notes.push(`lone-wrapper undetermined: ${added.length} new static function(s) added, but call sites need --tree to count`)
    } else {
      // The tree alone is not enough: for a patch that has not been applied yet,
      // neither the new function nor its new callers are in it. Count both --
      // call sites already in the tree, plus ones the diff itself introduces.
      const allAdded = files.flatMap(f => f.added)
      for (const { n, f } of added) {
        let inTree
        try { inTree = countCallSites(n, opt.tree) } catch { notes.push(`lone-wrapper undetermined for ${n}: grep failed`); continue }
        const inDiff = allAdded.filter(l => new RegExp(`\\b${n}\\b`).test(l) && !isDefinitionOf(l, n)).length
        const callers = inTree + inDiff
        if (callers > 1) continue
        const detail = callers === 0
          ? `new static ${n}() has no call site in tree or diff -- dead code, unless its caller is in another patch of the series`
          : `new static ${n}() has exactly 1 call site -- inline it unless a second caller is imminent`
        findings.push({ kind: 'lone-wrapper', sev: 'warn', path: f.path, line: 0, detail })
      }
    }
  }

  return { findings, notes, fileCount, dirs: dirs.size }
}

/* ------------------------------------------------------------------- report */

function report(r, opt) {
  if (opt.json) { console.log(JSON.stringify({ status: r.findings.some(f => f.sev === 'error') ? 'fail' : r.findings.length ? 'warn' : 'clean', ...r }, null, 2)); return }
  if (opt.quiet && !r.findings.length) return
  console.log(`\n=== diff discipline: ${r.fileCount} file(s), ${r.dirs} area(s), ${r.findings.length} finding(s)`)
  for (const f of r.findings) {
    const where = f.line ? `${f.path}:${f.line}` : f.path
    console.log(`  ${f.sev.toUpperCase()}  ${f.kind}  ${where}`)
    console.log(`      ${f.detail}`)
  }
  for (const n of r.notes) console.log(`  note: ${n}`)
  if (r.findings.length) {
    console.log('\n  The test is per line: can you point at the request that made this line')
    console.log('  necessary? "while I was in there" is not such a reason -- revert it.')
  }
}

/* ----------------------------------------------------------------- selftest */

const CLEAN_DIFF = `diff --git a/drivers/i2c/busses/i2c-foo.c b/drivers/i2c/busses/i2c-foo.c
--- a/drivers/i2c/busses/i2c-foo.c
+++ b/drivers/i2c/busses/i2c-foo.c
@@ -40,6 +40,8 @@ static int foo_xfer(struct i2c_adapter *adap)
 	int ret;

 	ret = foo_start(adap);
+	if (ret)
+		return ret;

 	return foo_stop(adap);
 }
`

const OUT_OF_SCOPE_DIFF = CLEAN_DIFF + `diff --git a/drivers/spi/spi-bar.c b/drivers/spi/spi-bar.c
--- a/drivers/spi/spi-bar.c
+++ b/drivers/spi/spi-bar.c
@@ -10,3 +10,3 @@
-	int n_words;
+	int nwords;
`

const REFORMAT_DIFF = `diff --git a/drivers/i2c/busses/i2c-foo.c b/drivers/i2c/busses/i2c-foo.c
--- a/drivers/i2c/busses/i2c-foo.c
+++ b/drivers/i2c/busses/i2c-foo.c
@@ -12,4 +12,4 @@
-	if (x)
-		do_thing();
+	if (x)
+			do_thing();
`

const KNOB_DIFF = `diff --git a/drivers/i2c/busses/i2c-foo.c b/drivers/i2c/busses/i2c-foo.c
--- a/drivers/i2c/busses/i2c-foo.c
+++ b/drivers/i2c/busses/i2c-foo.c
@@ -8,0 +9,3 @@
+static int retries = 3;
+module_param(retries, int, 0644);
+MODULE_PARM_DESC(retries, "number of retries");
diff --git a/drivers/i2c/busses/Kconfig b/drivers/i2c/busses/Kconfig
--- a/drivers/i2c/busses/Kconfig
+++ b/drivers/i2c/busses/Kconfig
@@ -30,0 +31,3 @@
+config I2C_FOO_TURBO
+	bool "Turbo mode"
`

const WRAPPER_DIFF = `diff --git a/drivers/i2c/busses/i2c-foo.c b/drivers/i2c/busses/i2c-foo.c
--- a/drivers/i2c/busses/i2c-foo.c
+++ b/drivers/i2c/busses/i2c-foo.c
@@ -40,0 +41,5 @@
+static int foo_wrap_send(struct i2c_client *c, u8 v)
+{
+	return i2c_smbus_write_byte(c, v);
+}
`

const WRAPPER_USED_TWICE_DIFF = WRAPPER_DIFF + `@@ -60,0 +66,3 @@
+	ret = foo_wrap_send(client, CMD_START);
+	if (ret)
+		return foo_wrap_send(client, CMD_ABORT);
`

function spreadDiff() {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const p = `drivers/area${i}/f${i}.c`
    d += `diff --git a/${p} b/${p}\n--- a/${p}\n+++ b/${p}\n@@ -1,1 +1,2 @@\n+	int added${i};\n`
  }
  return d
}

function selftest() {
  const base = { scope: '', tree: '', maxFiles: 8, maxDirs: 3, json: false, quiet: false }
  const kinds = r => r.findings.map(f => f.kind)
  const cases = [
    ['clean in-scope diff fires nothing',
      () => analyse(parseDiff(CLEAN_DIFF), { ...base, scope: 'drivers/i2c/**' }),
      r => r.findings.length === 0],
    ['out-of-scope file is caught',
      () => analyse(parseDiff(OUT_OF_SCOPE_DIFF), { ...base, scope: 'drivers/i2c/**' }),
      r => kinds(r).includes('out-of-scope')],
    ['out-of-scope is NOT reported when the scope covers it',
      () => analyse(parseDiff(OUT_OF_SCOPE_DIFF), { ...base, scope: 'drivers/**' }),
      r => !kinds(r).includes('out-of-scope')],
    ['whitespace-only rewrite is caught',
      () => analyse(parseDiff(REFORMAT_DIFF), { ...base, scope: 'drivers/**' }),
      r => kinds(r).includes('reformat-only')],
    ['real code change is NOT called a reformat',
      () => analyse(parseDiff(CLEAN_DIFF), { ...base, scope: 'drivers/**' }),
      r => !kinds(r).includes('reformat-only')],
    ['module_param and new Kconfig symbol are caught',
      () => analyse(parseDiff(KNOB_DIFF), { ...base, scope: 'drivers/**' }),
      r => r.findings.filter(f => f.kind === 'speculative-knob').length === 2],
    ['wide diff trips the spread threshold',
      () => analyse(parseDiff(spreadDiff()), { ...base, scope: 'drivers/**' }),
      r => kinds(r).includes('spread')],
    ['narrow diff does not trip it',
      () => analyse(parseDiff(CLEAN_DIFF), { ...base, scope: 'drivers/**' }),
      r => !kinds(r).includes('spread')],
    ['new static function without --tree is undetermined, not guessed',
      () => analyse(parseDiff(WRAPPER_DIFF), { ...base, scope: 'drivers/**' }),
      r => !kinds(r).includes('lone-wrapper') && r.notes.some(n => n.includes('lone-wrapper undetermined'))],
    // HERE holds no .c files, so tree call sites are 0 -- the count then comes
    // from the diff alone, which is the not-yet-applied-patch case.
    ['with --tree, a wrapper the diff never calls is caught',
      () => analyse(parseDiff(WRAPPER_DIFF), { ...base, scope: 'drivers/**', tree: HERE }),
      r => r.findings.some(f => f.kind === 'lone-wrapper' && /no call site/.test(f.detail))],
    ['with --tree, a wrapper the diff calls twice is NOT caught',
      () => analyse(parseDiff(WRAPPER_USED_TWICE_DIFF), { ...base, scope: 'drivers/**', tree: HERE }),
      r => !kinds(r).includes('lone-wrapper')],
    ['missing --scope is reported as skipped, not as clean',
      () => analyse(parseDiff(OUT_OF_SCOPE_DIFF), { ...base }),
      r => r.notes.some(n => n.includes('out-of-scope check skipped'))],
  ]
  let bad = 0
  console.log('selftest: each check must fire on its planted defect and stay quiet otherwise\n')
  for (const [label, run, ok] of cases) {
    let pass = false
    try { pass = ok(run()) } catch (e) { pass = false; label.concat(` (threw: ${e.message})`) }
    if (!pass) bad++
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}`)
  }
  console.log(bad === 0 ? '\nselftest: all checks behaved' : `\nselftest: ${bad} check(s) misbehaved`)
  process.exit(bad === 0 ? 0 : 1)
}

/* --------------------------------------------------------------------- main */

const opt = parseArgs(process.argv.slice(2))
if (opt.selftest) selftest()

let text = ''
if (opt.git) {
  try { text = execFileSync('git', ['-C', opt.repo, 'diff', opt.git], { maxBuffer: 64 * 1024 * 1024 }).toString() }
  catch (e) { die(`git diff ${opt.git} failed: ${e.message}`) }
} else if (opt.diff === '-') {
  text = readFileSync(0, 'utf8')
} else if (opt.diff) {
  try { text = readFileSync(opt.diff, 'utf8') } catch { die(`cannot read diff: ${opt.diff}`) }
} else {
  die('need --diff <patch|-> or --git <range> (or --selftest); -h for usage')
}

const files = parseDiff(text)
if (!files.length) die('no file hunks found in the input -- is this a unified diff?')

const result = analyse(files, opt)
report(result, opt)
process.exit(result.findings.some(f => f.sev === 'error') ? 1 : result.findings.length ? 1 : 0)
