#!/usr/bin/env node
/*
 * cross-link-pack.mjs — pull sibling .html files referenced by an HTML
 * doc set into the same pack dir, so the dir is `cp -r`-portable.
 *
 * Why: md-pack handles .md → mirror.html, but a doc set's main HTMLs may
 * also link to other .html files in adjacent repo dirs (e.g. a sibling
 * "task15 原理" page).  Those references are silently broken once the
 * pack dir is copied elsewhere.  This script folds those targets in.
 *
 * Usage:
 *   node cross-link-pack.mjs \
 *     --pack-root <dir>            # the dir that will be distributed
 *     --base      <docs-root>      # flat-name anchor (e.g. docs/); falls back to repo root
 *     --out       <dir>            # subdir to drop pulled .html into (default: <pack-root>/_md)
 *     [--dry-run]
 *     <html...>                    # input HTMLs to scan + rewrite
 *
 * Example:
 *   node cross-link-pack.mjs \
 *     --pack-root docs/avb-decision \
 *     --out       docs/avb-decision/_md \
 *     docs/avb-decision/*.html
 *
 * Behavior:
 *   1. Scan every <a href="*.html"> in <html...>.
 *   2. Resolve to absolute path.  Skip:
 *        - external (http(s):)
 *        - already inside pack-root (those will travel with the cp)
 *        - non-existent (orphan link — warn)
 *   3. Targets outside pack-root:
 *        - Copy file to <out>/<flat>.html where flat name = relative path
 *          from pack-root's parent, with `/`→`__`.
 *        - Rewrite the input HTML's href to `<out-rel>/<flat>.html`.
 *
 * Caveats:
 *   - Pulled .html files are copied as-is; their own internal links
 *     (relative paths to images / CSS / other docs in their original
 *     location) are NOT rewritten.  Broken sub-links are reported as
 *     warnings.
 *   - Run AFTER md-pack so .md links are already collapsed to .html
 *     mirrors inside the pack — this script then handles the .html
 *     leftovers.
 */

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opts = { packRoot: null, base: null, out: null, dryRun: false, inputs: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') usage(0);
  else if (a === '--pack-root') opts.packRoot = argv[++i];
  else if (a === '--base')      opts.base = argv[++i];
  else if (a === '--out')       opts.out = argv[++i];
  else if (a === '--dry-run')   opts.dryRun = true;
  else if (a.startsWith('--')) { console.error(`unknown flag: ${a}`); usage(2); }
  else opts.inputs.push(a);
}
if (!opts.packRoot || !opts.inputs.length) usage(2);

function usage(code) {
  console.log(`cross-link-pack — fold sibling .html refs into a pack dir
Usage:
  node cross-link-pack.mjs --pack-root <dir> [--base <docs-root>] [--out <dir>] [--dry-run] <html...>`);
  process.exit(code);
}

const packRoot = path.resolve(opts.packRoot);
const outDir   = path.resolve(opts.out || path.join(packRoot, '_md'));
const inputs   = opts.inputs.map(p => path.resolve(p));
// flat-name anchor: --base if given; else parent-of-pack-root (legacy);
// fallback to repo root via git if a target lives above that.
const flatBase = opts.base ? path.resolve(opts.base) : path.dirname(packRoot);

for (const f of inputs) {
  if (!fs.existsSync(f)) { console.error(`error: not found: ${f}`); process.exit(2); }
}
if (!fs.existsSync(packRoot)) { console.error(`error: pack-root not found: ${packRoot}`); process.exit(2); }

const HREF_RE = /(<a\b[^>]*\bhref=")([^"]+)(")/g;
const SKIP_RE = /^(https?:|mailto:|javascript:|#|\/)/i;

function stripSuffix(href) {
  const m = href.match(/^([^?#]*)([?#].*)?$/);
  return { pathPart: m[1] || '', suffix: m[2] || '' };
}
function decodeHrefPath(p) { try { return decodeURI(p); } catch { return p; } }
function encodeHrefPath(p) {
  return p.split(path.sep).map(encodeURIComponent).join('/');
}
function isInside(child, parent) {
  const r = path.relative(parent, child);
  return r && !r.startsWith('..') && !path.isAbsolute(r);
}

function flatName(absHtmlPath) {
  let rel = path.relative(flatBase, absHtmlPath);
  if (rel.startsWith('..')) {
    // target lives above --base — warn once and fall back to basename.
    rel = path.basename(absHtmlPath);
  }
  return rel.split(path.sep).join('__');
}

// ---------- pass 1: collect external-.html targets ----------
const targetMap = new Map();  // absSrc → { flatName, dst }
const orphanLinks = [];

for (const f of inputs) {
  const txt = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  let m;
  HREF_RE.lastIndex = 0;
  while ((m = HREF_RE.exec(txt))) {
    const raw = m[2];
    if (SKIP_RE.test(raw)) continue;
    const { pathPart } = stripSuffix(raw);
    if (!/\.html?$/i.test(pathPart)) continue;
    const absTarget = path.resolve(dir, decodeHrefPath(pathPart));

    // inside pack-root → already portable, skip
    if (isInside(absTarget, packRoot) || absTarget === packRoot) continue;

    if (!fs.existsSync(absTarget)) {
      orphanLinks.push({ file: f, href: raw, target: absTarget });
      continue;
    }
    if (!targetMap.has(absTarget)) {
      const flat = flatName(absTarget);
      targetMap.set(absTarget, { flatName: flat, dst: path.join(outDir, flat) });
    }
  }
}

console.log(`cross-link-pack: ${targetMap.size} external .html target(s) found across ${inputs.length} input HTML(s).`);
console.log(`                 pack-root: ${packRoot}`);
console.log(`                 out:       ${outDir}`);
if (orphanLinks.length) {
  console.warn(`                 ${orphanLinks.length} orphan link(s) (target file missing):`);
  for (const o of orphanLinks) {
    console.warn(`                   ${path.relative(process.cwd(), o.file)}  ${o.href}`);
  }
}

if (!targetMap.size) {
  console.log('cross-link-pack: nothing to pull — done.');
  process.exit(0);
}

// ---------- pass 2: copy external .html files into outDir ----------
if (!opts.dryRun && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const [absSrc, info] of targetMap) {
  if (opts.dryRun) {
    console.log(`  [dry-run] would copy ${path.relative(process.cwd(), absSrc)} → ${path.relative(process.cwd(), info.dst)}`);
  } else {
    fs.copyFileSync(absSrc, info.dst);
    copied++;
    // Quick scan for relative refs in the pulled HTML that may now break.
    const sub = fs.readFileSync(info.dst, 'utf8');
    const innerRefs = [...sub.matchAll(/\b(?:href|src)="([^"]+)"/g)]
      .map(x => x[1])
      .filter(r => !SKIP_RE.test(r) && !/^data:/.test(r));
    let brokenInner = 0;
    for (const r of innerRefs) {
      const { pathPart } = stripSuffix(r);
      if (!pathPart) continue;
      const t = path.resolve(path.dirname(absSrc), decodeHrefPath(pathPart));
      // relative-to-source must still resolve after copy?  Pulled file sits
      // in outDir, so we'd need t to also be in outDir or under packRoot
      // for it to remain reachable after `cp -r packRoot /elsewhere`.
      if (!isInside(t, packRoot) && t !== packRoot) brokenInner++;
    }
    if (brokenInner) {
      console.warn(`  warn: ${info.flatName} has ${brokenInner} relative ref(s) escaping pack-root — may break after cp.`);
    }
  }
}
console.log(`cross-link-pack: ${opts.dryRun ? 'planned' : 'copied'} ${opts.dryRun ? targetMap.size : copied} file(s) into ${path.relative(process.cwd(), outDir)}/`);

// ---------- pass 3: rewrite input HTMLs ----------
let rewrittenLinks = 0;
for (const f of inputs) {
  const orig = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  let n = 0;
  const next = orig.replace(HREF_RE, (full, pre, href, post) => {
    if (SKIP_RE.test(href)) return full;
    const { pathPart, suffix } = stripSuffix(href);
    if (!/\.html?$/i.test(pathPart)) return full;
    const absTarget = path.resolve(dir, decodeHrefPath(pathPart));
    if (!targetMap.has(absTarget)) return full;
    const relToOut = path.relative(dir, outDir);
    const newHref = encodeHrefPath(path.join(relToOut, targetMap.get(absTarget).flatName));
    n++;
    return `${pre}${newHref}${suffix}${post}`;
  });
  if (n > 0) {
    if (!opts.dryRun) fs.writeFileSync(f, next);
    console.log(`  ${opts.dryRun ? '[dry-run] would rewrite' : 'rewrote'} ${n} link(s) in ${path.relative(process.cwd(), f)}`);
    rewrittenLinks += n;
  }
}
console.log(`cross-link-pack: ${rewrittenLinks} input-html link(s) ${opts.dryRun ? 'would be ' : ''}rewritten.`);
