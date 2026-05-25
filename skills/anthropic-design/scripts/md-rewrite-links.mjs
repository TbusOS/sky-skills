#!/usr/bin/env node
/*
 * md-rewrite-links.mjs — in-place rewrite of <a href="*.md(?q)(#f)"> to
 * <a href="*.html(?q)(#f)"> inside one or more HTML files.  Skips absolute
 * http(s) hrefs; leaves anchor-only (#...), mailto:, javascript:, and
 * absolute (/...) hrefs alone.
 *
 * Usage:
 *   node md-rewrite-links.mjs <file.html> [<file2.html> ...]
 *
 * Reports per-file replacement count.  Modifies files in place — back up
 * before running if uncertain.
 *
 * Companion to md-mirror.mjs.  For the more powerful "pack into a self-
 * contained subdir" workflow, use md-pack.mjs instead.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (!args.length || args[0] === '-h' || args[0] === '--help') {
  console.log('md-rewrite-links — rewrite href="*.md" -> href="*.html" in HTML files');
  console.log('Usage: node md-rewrite-links.mjs <file.html> [...]');
  process.exit(args.length ? 0 : 2);
}

let totalRewrites = 0;
for (const f of args) {
  if (!fs.existsSync(f)) {
    console.error(`error: not found: ${f}`);
    process.exit(2);
  }
  const orig = fs.readFileSync(f, 'utf8');
  let n = 0;
  const next = orig.replace(
    /(<a\b[^>]*\bhref=")([^"]+)(")/g,
    (full, pre, href, post) => {
      if (/^https?:\/\//i.test(href)) return full;
      if (/^(mailto:|javascript:|#|\/)/i.test(href)) return full;
      const m = href.match(/^([^?#]+)\.md(\?[^#]*)?(#.*)?$/);
      if (!m) return full;
      n++;
      return `${pre}${m[1]}.html${m[2] || ''}${m[3] || ''}${post}`;
    }
  );
  if (n > 0) {
    fs.writeFileSync(f, next);
    console.log(`${path.basename(f)}  ${n} link(s) rewritten`);
    totalRewrites += n;
  } else {
    console.log(`${path.basename(f)}  no local .md links`);
  }
}
console.log(`total: ${totalRewrites} rewrite(s) across ${args.length} file(s)`);
