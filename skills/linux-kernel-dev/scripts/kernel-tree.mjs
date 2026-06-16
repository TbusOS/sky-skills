#!/usr/bin/env node
// kernel-tree.mjs — bind kernel source trees for the fact-gate / checkpatch gate
// (HARNESS-DESIGN §6.10). Trees live in per-machine config, NEVER in the repo.
//
//   node kernel-tree.mjs detect              scan likely locations + report versions
//   node kernel-tree.mjs add <path> [--default]   register a tree (reads its version)
//   node kernel-tree.mjs list                show registered trees
//   node kernel-tree.mjs clone <ver>         print the shallow-clone command (does not run)
//
// Config: ~/.config/linux-kernel-dev/trees.json   { trees:[{version,path}], default }

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const CFG = join(homedir(), '.config', 'linux-kernel-dev', 'trees.json');

function readCfg() {
  try { return JSON.parse(readFileSync(CFG, 'utf8')); } catch { return { trees: [], default: null }; }
}
function writeCfg(c) {
  mkdirSync(dirname(CFG), { recursive: true });
  writeFileSync(CFG, JSON.stringify(c, null, 2) + '\n');
}
function treeVersion(p) {
  try {
    const mk = readFileSync(join(p, 'Makefile'), 'utf8').slice(0, 400);
    const g = k => (mk.match(new RegExp(`^${k}\\s*=\\s*(\\S+)`, 'm')) || [])[1];
    const v = g('VERSION'), pl = g('PATCHLEVEL'), sub = g('SUBLEVEL');
    if (v && pl) return sub ? `${v}.${pl}.${sub}` : `${v}.${pl}`;
  } catch { /* ignore */ }
  return null;
}
function isTree(p) {
  return existsSync(join(p, 'Makefile')) && existsSync(join(p, 'scripts', 'checkpatch.pl')) && !!treeVersion(p);
}

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'detect') {
  const cands = [];
  try { cands.push(`/lib/modules/${execFileSync('uname', ['-r']).toString().trim()}/build`); } catch {}
  cands.push('/usr/src');
  // walk up from cwd
  let d = process.cwd();
  for (let i = 0; i < 40; i++) { cands.push(d); const u = dirname(d); if (u === d) break; d = u; }
  // children of /usr/src
  try { for (const e of readdirSync('/usr/src')) cands.push(join('/usr/src', e)); } catch {}
  const found = [...new Set(cands.map(c => resolve(c)))].filter(isTree);
  if (!found.length) { console.log('no kernel tree found in common locations / cwd ancestry.'); console.log('bind explicitly:  kernel-tree.mjs add /path/to/linux'); process.exit(0); }
  console.log('found kernel trees:');
  for (const f of found) console.log(`  ${treeVersion(f).padEnd(12)} ${f}`);
  process.exit(0);
}

if (cmd === 'add') {
  const p = rest.find(a => !a.startsWith('--'));
  const def = rest.includes('--default');
  if (!p) { console.error('usage: kernel-tree.mjs add <path> [--default]'); process.exit(2); }
  const abs = resolve(p);
  if (!isTree(abs)) { console.error(`not a kernel tree (need Makefile + scripts/checkpatch.pl): ${abs}`); process.exit(2); }
  const ver = treeVersion(abs);
  const c = readCfg();
  c.trees = (c.trees || []).filter(t => t.path !== abs);
  c.trees.push({ version: ver, path: abs });
  if (def || !c.default) c.default = ver;
  writeCfg(c);
  console.log(`registered ${ver}  ${abs}${(def || c.default === ver) ? '  (default)' : ''}`);
  console.log(`config: ${CFG}`);
  process.exit(0);
}

if (cmd === 'list') {
  const c = readCfg();
  if (!c.trees || !c.trees.length) { console.log('no trees registered. use: kernel-tree.mjs add <path>'); process.exit(0); }
  for (const t of c.trees) console.log(`  ${t.version === c.default ? '*' : ' '} ${t.version.padEnd(12)} ${t.path}`);
  console.log(`\n(* = default; config: ${CFG})`);
  process.exit(0);
}

if (cmd === 'clone') {
  const ver = rest[0] || '6.12';
  console.log('# shallow clone (~1.3 GB), then register:');
  console.log(`git clone --depth 1 -b v${ver} https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git linux-${ver}`);
  console.log(`node ${process.argv[1]} add ./linux-${ver}`);
  process.exit(0);
}

console.error('usage: kernel-tree.mjs {detect|add <path>|list|clone <ver>}');
process.exit(2);
