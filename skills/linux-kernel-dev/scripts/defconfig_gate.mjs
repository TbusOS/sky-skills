#!/usr/bin/env node
/**
 * defconfig_gate.mjs — "written into defconfig" != "in effect" gate.
 *
 * Why this exists (bsp_discipline.md §1 had the rule but no check)
 *   A line in a defconfig can be silently discarded by Kconfig: the symbol may
 *   not exist on this arch, its `depends on` may be unsatisfied, or it may have
 *   been dropped upstream. The defconfig still *reads* as if the option is on.
 *   Reviewers see `CONFIG_VMAP_STACK=y` and believe the hardening is enabled.
 *
 *   Reading `savedefconfig` output does not surface this: savedefconfig
 *   reorders and minimises, so a real 3-line problem drowns in a few hundred
 *   lines of ordering noise. The reliable test compares per symbol, ignoring
 *   order: declared value vs the value the .config actually ended up with.
 *
 * Verdicts
 *   honored      declared X=v, .config has X=v                      -> fine
 *   changed      declared X=v, .config has X=v2                     -> FAIL
 *   dropped      declared X=v, .config has no value for X           -> FAIL
 *                  · undefined-symbol : no `config X` / `menuconfig X` in tree
 *                    (bsp_discipline.md §1 case A -- the real bug)
 *                  · unreachable      : symbol exists, deps/arch unsatisfied
 *   contradicted declared `# X is not set`, .config has X=v         -> FAIL
 *   missing-space `#CONFIG_X is not set` -- no space after `#`, so Kconfig sees
 *                a bare comment and the symbol is NOT forced off    -> WARN
 *                (`# CONFIG_X is not set` WITH the space is the real form)
 *   commented-out `#CONFIG_X=v` -- an assignment parked behind a `#`. That is
 *                the ordinary way to disable a line, not a defect -> counted,
 *                never reported
 *
 *   A symbol present in .config but absent from the defconfig is NOT reported:
 *   that is the normal savedefconfig minimisation (bsp_discipline.md §1 case B).
 *
 * Usage
 *   defconfig_gate.mjs --defconfig <path> --config <path/to/.config>
 *                      [--tree <kernel-tree>] [--strict] [--quiet]
 *   defconfig_gate.mjs --selftest
 *
 *   --config should be the .config the real build produced. Comparing against
 *   the build's own output is stronger evidence than re-deriving one here, and
 *   it keeps this gate free of any cross-compile environment.
 *   --tree enables the undefined-symbol vs unreachable split.
 *   --strict makes pseudo-comments fail too.
 *
 * Exit: 0 clean | 1 findings | 3 gate-error (bad args / unreadable input)
 *
 * Portable: no hardcoded paths, no product names, tree bound via flag or
 * KERNELDEV_TREE / KDIR, same as checkpatch_gate.sh.
 */

import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, basename } from 'node:path'
import { tmpdir } from 'node:os'

const SET = /^(CONFIG_[A-Za-z0-9_]+)=(.*)$/
const NOT_SET = /^# (CONFIG_[A-Za-z0-9_]+) is not set$/
// `# CONFIG_X is not set` (WITH the space) is the form Kconfig honours. Written
// without the space it is a bare comment -- almost always someone meaning to
// force the symbol off and silently not doing so.
const PSEUDO_NOTSET = /^#(CONFIG_[A-Za-z0-9_]+) is not set$/
// `#CONFIG_X=v` is just an assignment commented out, which is the ordinary way
// to park a line. Not a defect -- do not report it.
const COMMENTED_OUT = /^#(CONFIG_[A-Za-z0-9_]+)=/

function die(msg) { console.error(msg); process.exit(3) }

function parseArgs(argv) {
  const a = { defconfig: '', config: '', tree: '', strict: false, quiet: false, selftest: false }
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--defconfig': a.defconfig = argv[++i]; break
      case '--config':    a.config = argv[++i]; break
      case '--tree':      a.tree = argv[++i]; break
      case '--strict':    a.strict = true; break
      case '--quiet':     a.quiet = true; break
      case '--selftest':  a.selftest = true; break
      case '-h': case '--help':
        console.log('usage: defconfig_gate.mjs --defconfig <p> --config <.config> [--tree <t>] [--strict] [--quiet]')
        process.exit(0)
      default: die(`unknown arg: ${argv[i]}`)
    }
  }
  return a
}

/** Values Kconfig actually settled on, from a .config. */
function readConfig(path) {
  const values = new Map()
  const off = new Set()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    let m = SET.exec(line)
    if (m) { values.set(m[1], m[2]); continue }
    m = NOT_SET.exec(line)
    if (m) off.add(m[1])
  }
  return { values, off }
}

/**
 * Every symbol the tree defines. The pattern must cover BOTH `config` and
 * `menuconfig` -- they are equivalent, and matching only `config` would report
 * every menuconfig symbol as undefined (bsp_discipline.md §1 spells this out).
 */
function collectDefinedSymbols(tree) {
  const defined = new Set()
  const decl = /^[ \t]*(?:menuconfig|config)[ \t]+([A-Za-z0-9_]+)[ \t]*$/
  const skip = new Set(['.git', 'out', 'build'])
  const walk = (dir) => {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = join(dir, e.name)
      if (e.isDirectory()) { if (!skip.has(e.name)) walk(p) ; continue }
      if (!e.name.startsWith('Kconfig')) continue
      let text
      try { text = readFileSync(p, 'utf8') } catch { continue }
      for (const line of text.split('\n')) {
        const m = decl.exec(line)
        if (m) defined.add('CONFIG_' + m[1])
      }
    }
  }
  walk(tree)
  return defined
}

function audit(defconfigPath, configPath, tree) {
  const { values, off } = readConfig(configPath)
  const defined = tree ? collectDefinedSymbols(tree) : null
  const out = { honored: 0, notSetHonored: 0, commentedOut: 0, findings: [], pseudo: [] }

  const lines = readFileSync(defconfigPath, 'utf8').split('\n')
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    let m = SET.exec(line)
    if (m) {
      const [, sym, want] = m
      if (values.has(sym)) {
        if (values.get(sym) === want) out.honored++
        else out.findings.push({ kind: 'changed', sym, want, got: values.get(sym) })
      } else if (off.has(sym)) {
        out.findings.push({ kind: 'dropped', sym, want, got: '# is not set', why: 'forced-off' })
      } else {
        const why = defined ? (defined.has(sym) ? 'unreachable' : 'undefined-symbol') : 'unknown'
        out.findings.push({ kind: 'dropped', sym, want, got: '(absent)', why })
      }
      continue
    }
    m = NOT_SET.exec(line)
    if (m) {
      const sym = m[1]
      if (values.has(sym)) out.findings.push({ kind: 'contradicted', sym, want: 'not set', got: values.get(sym) })
      else out.notSetHonored++
      continue
    }
    if (COMMENTED_OUT.test(line)) { out.commentedOut++; continue }
    m = PSEUDO_NOTSET.exec(line)
    if (m) out.pseudo.push(line.trim())
  }
  return out
}

const WHY_TEXT = {
  'undefined-symbol': 'no `config`/`menuconfig` declaration in the tree -- dead line',
  'unreachable': 'symbol exists but deps/arch unsatisfied on this build',
  'forced-off': 'Kconfig settled on "is not set"',
  'unknown': 'pass --tree to tell dead-line from unsatisfied-dependency',
}

function report(r, a) {
  const label = basename(a.defconfig)
  if (!a.quiet) {
    console.log(`\n=== ${label}`)
    console.log(`    honored            : ${r.honored}`)
    console.log(`    "is not set" kept  : ${r.notSetHonored}`)
    console.log(`    NOT in effect      : ${r.findings.length}`)
    console.log(`    missing-space      : ${r.pseudo.length}`)
    console.log(`    commented-out (ok) : ${r.commentedOut}`)
  }
  for (const f of r.findings) {
    const why = f.why ? `  [${f.why}: ${WHY_TEXT[f.why]}]` : ''
    console.log(`  ${f.kind.toUpperCase()}  ${f.sym}`)
    console.log(`      defconfig declares : ${f.want}`)
    console.log(`      .config ended with : ${f.got}${why}`)
  }
  if (r.pseudo.length && !a.quiet) {
    console.log(`  MISSING-SPACE (Kconfig reads these as bare comments, so they do nothing):`)
    for (const p of r.pseudo) console.log(`      ${p}`)
    console.log(`      the form Kconfig honours is:  # CONFIG_X is not set`)
  }
}

/* ---------------------------------------------------------------- selftest */
/**
 * Self-degradation check, in the spirit of regression_test.mjs: plant one of
 * each defect and assert the gate catches it. A gate nobody has seen fail is
 * a gate nobody should trust.
 */
function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'defconfig-gate-'))
  const kdir = join(dir, 'tree')
  mkdirSync(kdir, { recursive: true })
  writeFileSync(join(kdir, 'Kconfig'), [
    'config REACHABLE_SYM',
    '\tbool "reachable"',
    '',
    'menuconfig MENU_SYM',
    '\tbool "declared via menuconfig"',
    '',
    'config UNREACHABLE_SYM',
    '\tbool "needs something this build lacks"',
    '\tdepends on NOT_THERE',
    '',
  ].join('\n'))

  const defconfig = join(dir, 'foo_defconfig')
  writeFileSync(defconfig, [
    'CONFIG_REACHABLE_SYM=y',        // honored
    'CONFIG_MENU_SYM=y',             // honored -- must not be called undefined
    'CONFIG_UNREACHABLE_SYM=y',      // dropped / unreachable
    'CONFIG_GHOST_SYM=y',            // dropped / undefined-symbol
    'CONFIG_VALUE_SYM=0x1000',       // changed
    '# CONFIG_OFF_SYM is not set',   // contradicted
    '#CONFIG_PSEUDO_SYM is not set', // missing-space -- flagged
    '#CONFIG_PARKED_SYM=y',          // commented-out assignment -- NOT a defect
    '',
  ].join('\n'))

  const dotconfig = join(dir, '.config')
  writeFileSync(dotconfig, [
    'CONFIG_REACHABLE_SYM=y',
    'CONFIG_MENU_SYM=y',
    'CONFIG_VALUE_SYM=0x2000',
    'CONFIG_OFF_SYM=y',
    '',
  ].join('\n'))

  const r = audit(defconfig, dotconfig, kdir)
  const got = {}
  for (const f of r.findings) got[f.sym] = f.why ? `${f.kind}/${f.why}` : f.kind

  const expect = {
    CONFIG_UNREACHABLE_SYM: 'dropped/unreachable',
    CONFIG_GHOST_SYM: 'dropped/undefined-symbol',
    CONFIG_VALUE_SYM: 'changed',
    CONFIG_OFF_SYM: 'contradicted',
  }
  let bad = 0
  for (const [sym, want] of Object.entries(expect)) {
    const ok = got[sym] === want
    if (!ok) bad++
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${sym}: expected ${want}, got ${got[sym] ?? '(not flagged)'}`)
  }
  const honoredOk = r.honored === 2
  if (!honoredOk) bad++
  console.log(`  ${honoredOk ? 'PASS' : 'FAIL'}  honored count: expected 2 (incl. the menuconfig symbol), got ${r.honored}`)
  const pseudoOk = r.pseudo.length === 1
  if (!pseudoOk) bad++
  console.log(`  ${pseudoOk ? 'PASS' : 'FAIL'}  missing-space count: expected 1, got ${r.pseudo.length}`)
  const comOk = r.commentedOut === 1
  if (!comOk) bad++
  console.log(`  ${comOk ? 'PASS' : 'FAIL'}  commented-out not flagged as a defect: expected 1, got ${r.commentedOut}`)

  rmSync(dir, { recursive: true, force: true })
  console.log(bad === 0 ? '\nselftest: all checks caught their planted defect' : `\nselftest: ${bad} check(s) did not fire`)
  return bad === 0 ? 0 : 1
}

/* -------------------------------------------------------------------- main */
const a = parseArgs(process.argv.slice(2))

if (a.selftest) process.exit(selftest())

if (!a.defconfig || !a.config) die('usage: defconfig_gate.mjs --defconfig <p> --config <.config> [--tree <t>] [--strict]')
for (const p of [a.defconfig, a.config]) {
  try { statSync(p) } catch { die(`no such file: ${p}`) }
}
if (!a.tree) a.tree = process.env.KERNELDEV_TREE || process.env.KDIR || ''
if (a.tree) { try { statSync(join(a.tree, 'Kconfig')) } catch { die(`--tree does not look like a kernel tree (no Kconfig): ${a.tree}`) } }

const res = audit(a.defconfig, a.config, a.tree)
report(res, a)

const fail = res.findings.length > 0 || (a.strict && res.pseudo.length > 0)
if (!a.quiet) {
  console.log(fail
    ? `\nRESULT: FAIL -- ${res.findings.length} declared option(s) not in effect`
    : `\nRESULT: clean -- every declared option is in effect`)
  if (!a.tree) console.log('(bind a tree with --tree to separate dead lines from unsatisfied dependencies)')
}
process.exit(fail ? 1 : 0)
