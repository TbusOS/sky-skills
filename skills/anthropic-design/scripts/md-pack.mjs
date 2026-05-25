#!/usr/bin/env node
/*
 * md-pack.mjs — collect every .md referenced by a set of anthropic-styled
 * HTML files into one self-contained sibling directory, rendered as
 * .html mirrors, with link graph rewritten so the whole thing can be
 * `cp -r`'d anywhere.
 *
 * Why: when a doc set links out to many .md files scattered across
 * different repo subdirs, distributing it means dragging the whole tree.
 * md-pack folds the link targets inward — one dir = one shippable unit.
 *
 * Usage:
 *   node md-pack.mjs \
 *     --base <docs-root>             # used to compute flat names
 *     --out  <mirror-dir>            # where .html mirrors land
 *     [--dry-run]                    # show plan only, write nothing
 *     <file1.html> [<file2.html> ...]
 *
 * Example:
 *   node md-pack.mjs \
 *     --base /repo/docs \
 *     --out  /repo/docs/avb-decision/_md \
 *     /repo/docs/avb-decision/*.html
 *
 * What it does:
 *   1. Scan every <a href="*.md"> in the supplied HTML files.
 *   2. Resolve each href to an absolute .md path.
 *   3. Flat name = relpath(src, --base).replace(/[\/\\]/g, '__'), with .md→.html.
 *   4. Render each .md → <out>/<flat>.html via md-mirror's renderMarkdown().
 *      During render, every <a href> inside the mirror is retargeted:
 *        - If target is another .md in the pack → flat sibling in same dir.
 *        - If target is one of the input HTMLs → relative to <out>.
 *        - If target is an external file (img/pdf/etc.) → recomputed
 *          relative path, with a warning if it escapes the pack root.
 *   5. Rewrite the input HTMLs so href="X.md" → href="<out-rel>/<flat>.html".
 *
 * Idempotent: re-running with the same args overwrites mirrors in place
 * and re-rewrites the input HTMLs (their .md → already-.html hrefs after
 * one run are not re-touched, since the rewrite only fires on .md hrefs).
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { renderMarkdown } from './md-mirror.mjs';

// ---------- CLI parsing ----------
const argv = process.argv.slice(2);
const opts = { base: null, out: null, dryRun: false, inputs: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') { usage(0); }
  else if (a === '--base')      opts.base = argv[++i];
  else if (a === '--out')       opts.out  = argv[++i];
  else if (a === '--dry-run')   opts.dryRun = true;
  else if (a.startsWith('--'))  { console.error(`unknown flag: ${a}`); usage(2); }
  else                          opts.inputs.push(a);
}
if (!opts.base || !opts.out || !opts.inputs.length) usage(2);

function usage(code) {
  console.log(`md-pack — fold .md links of a doc set into a self-contained mirror dir.
Usage:
  node md-pack.mjs --base <docs-root> --out <mirror-dir> [--dry-run] <html...>`);
  process.exit(code);
}

const baseDir = path.resolve(opts.base);
const outDir  = path.resolve(opts.out);
const inputs  = opts.inputs.map(p => path.resolve(p));
for (const f of inputs) {
  if (!fs.existsSync(f)) { console.error(`error: not found: ${f}`); process.exit(2); }
}
if (!fs.existsSync(baseDir)) { console.error(`error: --base dir not found: ${baseDir}`); process.exit(2); }

// ---------- helpers ----------
const HREF_RE = /(<a\b[^>]*\bhref=")([^"]+)(")/g;
const SKIP_RE = /^(https?:|mailto:|javascript:|#|\/)/i;

function stripSuffix(href) {
  const m = href.match(/^([^?#]*)([?#].*)?$/);
  return { pathPart: m[1] || '', suffix: m[2] || '' };
}

function decodeHrefPath(p) {
  try { return decodeURI(p); } catch { return p; }
}

function flatName(absMdPath) {
  let rel = path.relative(baseDir, absMdPath);
  if (rel.startsWith('..')) {
    // path is outside --base; fall back to abs with leading slash stripped
    rel = absMdPath.replace(/^[/\\]+/, '');
  }
  return rel.split(path.sep).join('__').replace(/\.md$/i, '.html');
}

// ---------- pass 1: collect .md targets from input HTMLs ----------
const mdSet = new Map();      // absMd → { flatName, mirrorPath }
function collectFromHtml(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  let m;
  HREF_RE.lastIndex = 0;
  while ((m = HREF_RE.exec(txt))) {
    const raw = m[2];
    if (SKIP_RE.test(raw)) continue;
    const { pathPart } = stripSuffix(raw);
    if (!/\.md$/i.test(pathPart)) continue;
    const absMd = path.resolve(dir, decodeHrefPath(pathPart));
    if (!fs.existsSync(absMd)) {
      console.warn(`warn: ${path.relative(process.cwd(), file)} links to missing ${raw}`);
      continue;
    }
    if (!mdSet.has(absMd)) {
      const flat = flatName(absMd);
      mdSet.set(absMd, { flatName: flat, mirrorPath: path.join(outDir, flat) });
    }
  }
}
inputs.forEach(collectFromHtml);

// ---------- pass 2: also collect .md targets from inside source .md files
//                    (recursive — to catch links between mirrors). ----------
function collectFromMd(absMd) {
  const txt = fs.readFileSync(absMd, 'utf8');
  const dir = path.dirname(absMd);
  // crude: scan for [text](url) and bare hrefs
  const linkRe = /\[[^\]]*\]\(([^)\s]+)/g;
  let m;
  while ((m = linkRe.exec(txt))) {
    const raw = m[1];
    if (SKIP_RE.test(raw)) continue;
    const { pathPart } = stripSuffix(raw);
    if (!/\.md$/i.test(pathPart)) continue;
    const target = path.resolve(dir, decodeHrefPath(pathPart));
    if (!fs.existsSync(target)) continue;
    if (!mdSet.has(target)) {
      const flat = flatName(target);
      mdSet.set(target, { flatName: flat, mirrorPath: path.join(outDir, flat) });
      collectFromMd(target);  // recurse
    }
  }
}
[...mdSet.keys()].forEach(collectFromMd);

console.log(`md-pack: ${mdSet.size} .md target(s) found across ${inputs.length} input HTML(s).`);
console.log(`         base: ${baseDir}`);
console.log(`         out:  ${outDir}`);

// ---------- pass 3: build rewriteHref hook for renderMarkdown ----------
// Inputs HTMLs are at known absolute paths; mirrors will be in outDir.
// When rendering source .md X to outDir/<flatX>.html, an href in X
// resolves relative to dirname(X).  We retarget it from the mirror's
// position instead.
// Build a basename → [absPath, ...] index over all known targets (mdSet keys
// + inputs) so we can salvage broken hrefs in source .md (typos that resolve
// to a non-existent path but obviously meant one of our pack targets).
const knownTargets = [...mdSet.keys(), ...inputs];
const basenameIndex = new Map();
for (const t of knownTargets) {
  const k = path.basename(t);
  if (!basenameIndex.has(k)) basenameIndex.set(k, []);
  basenameIndex.get(k).push(t);
}

function suffixMatches(a, b, segs = 2) {
  const sa = a.split(path.sep).slice(-segs).join(path.sep);
  const sb = b.split(path.sep).slice(-segs).join(path.sep);
  return sa === sb;
}

function makeRewriter(srcMd) {
  const srcDir = path.dirname(srcMd);
  return function rewriter(href) {
    if (SKIP_RE.test(href)) return href;
    const { pathPart, suffix } = stripSuffix(href);
    if (!pathPart) return href;
    let absTarget = path.resolve(srcDir, decodeHrefPath(pathPart));

    // Fallback: target doesn't exist on disk → try basename+suffix match
    // against our known pack targets.  Rescues source .md links that have
    // an off-by-one ../ typo but obviously mean one of our pack files.
    if (!fs.existsSync(absTarget)) {
      const candidates = basenameIndex.get(path.basename(absTarget)) || [];
      const match = candidates.find(c => suffixMatches(c, absTarget, 3))
                 || (candidates.length === 1 ? candidates[0] : null);
      if (match) {
        console.warn(`info: ${path.relative(process.cwd(), srcMd)} broken href ${href} → remapped to ${path.relative(process.cwd(), match)}`);
        absTarget = match;
      }
    }

    // Case A: target is one of our .md sources → flat sibling in outDir
    if (mdSet.has(absTarget)) {
      return encodeHrefPath(mdSet.get(absTarget).flatName) + suffix;
    }

    // Case B: target is one of the input HTMLs → up out of outDir
    if (inputs.includes(absTarget)) {
      const rel = path.relative(outDir, absTarget);
      return encodeHrefPath(rel) + suffix;
    }

    // Case C: external file (image, pdf, other .html) — recompute relative path
    const rel = path.relative(outDir, absTarget);
    if (rel.startsWith('..' + path.sep + '..' + path.sep + '..' + path.sep)) {
      // escapes far up — warn (could break when packed dir is moved)
      console.warn(`warn: ${path.relative(process.cwd(), srcMd)} links outside pack root: ${href} → ${rel}`);
    }
    return encodeHrefPath(rel) + suffix;
  };
}

function encodeHrefPath(p) {
  // path.relative uses OS separator; href must be forward-slash.
  return p.split(path.sep).map(encodeURIComponent).join('/');
}

// ---------- pass 4: render all mirrors ----------
if (!opts.dryRun && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let written = 0;
for (const [absMd, info] of mdSet) {
  const html = renderMarkdown({
    srcPath: absMd,
    sourceLabel: path.relative(baseDir, absMd),
    rewriteHref: makeRewriter(absMd),
  });
  if (opts.dryRun) {
    console.log(`  [dry-run] would write ${info.mirrorPath} (${(html.length / 1024).toFixed(1)} KB)`);
  } else {
    fs.writeFileSync(info.mirrorPath, html);
    written++;
  }
}
console.log(`md-pack: ${opts.dryRun ? 'planned' : 'wrote'} ${opts.dryRun ? mdSet.size : written} mirror(s) under ${path.relative(process.cwd(), outDir)}/`);

// ---------- pass 5: rewrite input HTMLs to point into outDir ----------
let rewrittenLinks = 0;
for (const f of inputs) {
  const orig = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  let n = 0;
  const next = orig.replace(HREF_RE, (full, pre, href, post) => {
    if (SKIP_RE.test(href)) return full;
    const { pathPart, suffix } = stripSuffix(href);
    if (!/\.md$/i.test(pathPart)) return full;
    const absMd = path.resolve(dir, decodeHrefPath(pathPart));
    const entry = mdSet.get(absMd);
    if (!entry) return full;  // .md not in our pack (shouldn't happen)
    const relToOut = path.relative(dir, outDir);
    const relHref = encodeHrefPath(path.join(relToOut, entry.flatName));
    n++;
    return `${pre}${relHref}${suffix}${post}`;
  });
  if (n > 0) {
    if (!opts.dryRun) fs.writeFileSync(f, next);
    console.log(`  ${opts.dryRun ? '[dry-run] would rewrite' : 'rewrote'} ${n} link(s) in ${path.relative(process.cwd(), f)}`);
    rewrittenLinks += n;
  }
}
console.log(`md-pack: ${rewrittenLinks} input-html link(s) ${opts.dryRun ? 'would be ' : ''}rewritten.`);
