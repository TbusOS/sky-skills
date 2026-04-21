// library-grower.mjs — distill successful generations into candidate canonicals.
//
// Long-term tool. Works AFTER you have 5+ real page outputs of the same
// skill × page-type that passed all 4 gates (critic ≥ 88). It scans those
// pages, extracts common structural / typographic / copy patterns, and
// proposes a candidate canonical.{html,md} for human review.
//
// This is **Phase E** of the design-review completion plan. It is built as
// a skeleton: the pattern-extraction logic is in place, but you need real
// data (20+ successful pages across skills/page-types) for it to produce
// meaningful candidates. Until then, it's an exploratory tool.
//
// Usage:
//   node skills/design-review/scripts/library-grower.mjs \
//     --skill=<skill> --page=<type> \
//     --corpus=<dir>  # directory holding 5+ successful same-type pages
//
//   node skills/design-review/scripts/library-grower.mjs --help

import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname, basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const MIN_SAMPLES = 5;

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (a.startsWith('--skill=')) out.skill = a.split('=')[1];
    else if (a.startsWith('--page=')) out.page = a.split('=')[1];
    else if (a.startsWith('--corpus=')) out.corpus = a.split('=')[1];
    else if (a.startsWith('--out=')) out.out = a.split('=')[1];
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

const HELP = `
library-grower.mjs — distill candidate canonical from ≥5 successful same-type pages

Usage:
  node skills/design-review/scripts/library-grower.mjs \\
    --skill=<anthropic|apple|ember|sage> \\
    --page=<pricing|landing|docs-home|new-type> \\
    --corpus=<dir>        # dir containing 5+ successful *.html of that page-type
    [--out=<dir>]         # where to write candidate (default: /tmp/grower-<ts>/)

The corpus dir is scanned for .html files. Only files that pass \`bin/design-
review --critic\` with score ≥ 88 are considered "successful." This script
reads each one, extracts features, identifies common-to-all patterns, and
proposes a candidate canonical.

Output:
  <out>/candidate.html     — synthesized canonical HTML (review required)
  <out>/candidate.md       — extracted design decisions + typography + rules
  <out>/provenance.json    — list of source pages + their common features
  <out>/diffs.md           — where each source differs from the consensus

Candidate must be human-reviewed + edited before being accepted into
the canonical library. library-grower produces drafts, never ships.
`;

// ------ Pattern extractors (run on each source HTML) ------

function extractSections(html) {
  // Count and list semantic sections: <section>, <nav>, <footer>, major <header>.
  const sections = [];
  const re = /<(section|nav|footer|aside|article)\b[^>]*?(?:class="([^"]*)")?[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    sections.push({ tag: m[1], classes: m[2] || '' });
  }
  return sections;
}

function extractHeadings(html) {
  const headings = [];
  const re = /<(h[1-6])\b[^>]*?(?:class="([^"]*)")?[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const level = parseInt(m[1].substring(1), 10);
    const classes = m[2] || '';
    const text = m[3].replace(/<[^>]+>/g, '').trim().slice(0, 80);
    headings.push({ level, classes, text });
  }
  return headings;
}

function extractFonts(html) {
  const fonts = new Set();
  const re = /font-family\s*:\s*([^;"]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const families = m[1].split(',');
    for (const f of families) {
      const clean = f.trim().replace(/['"]/g, '');
      if (clean.length > 0 && !/^(serif|sans-serif|monospace|inherit|var\()/i.test(clean)) {
        fonts.add(clean);
      }
    }
  }
  return [...fonts];
}

function extractColors(html) {
  const colors = new Set();
  const reHex = /#[0-9a-f]{3,8}\b/gi;
  const reRgb = /rgba?\([^)]+\)/gi;
  let m;
  while ((m = reHex.exec(html)) !== null) colors.add(m[0].toLowerCase());
  while ((m = reRgb.exec(html)) !== null) colors.add(m[0].toLowerCase().replace(/\s+/g, ''));
  return [...colors];
}

function extractClasses(html) {
  const classes = new Set();
  const re = /class="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) classes.add(c);
  }
  return [...classes];
}

// ------ Consensus finder ------

function findConsensus(samples, threshold = 0.8) {
  // For each feature (section tag+class, heading pattern, font, color,
  // class), count how many samples contain it. If >= threshold of samples
  // have it, it's "consensus".
  const consensus = {
    sections: consensusItems(samples.map((s) => s.sections.map((x) => x.tag + (x.classes ? '.' + x.classes.split(' ')[0] : '')).join('|'))),
    fonts: consensusItems(samples.map((s) => s.fonts), threshold),
    colors: consensusItems(samples.map((s) => s.colors), threshold),
    classes: consensusItems(samples.map((s) => s.classes), threshold),
    headingPattern: samples.map((s) => s.headings.map((h) => `h${h.level}`).join(' → ')),
  };
  return consensus;
}

function consensusItems(samples, threshold = 0.8) {
  // samples is array-of-arrays. Return items appearing in >= threshold of arrays.
  const counts = new Map();
  for (const s of samples) {
    const arr = Array.isArray(s) ? s : [s];
    const uniq = new Set(arr);
    for (const item of uniq) counts.set(item, (counts.get(item) || 0) + 1);
  }
  const cutoff = Math.ceil(samples.length * threshold);
  return [...counts.entries()]
    .filter(([, c]) => c >= cutoff)
    .sort((a, b) => b[1] - a[1])
    .map(([item, c]) => ({ item, count: c, pct: Math.round((c / samples.length) * 100) }));
}

// ------ Candidate rendering ------

function renderCandidateMd({ skill, page, sources, consensus }) {
  return `# Candidate canonical · ${skill}-design · ${page}

> **DRAFT — human review required before merge.**
> Generated by \`library-grower.mjs\` from ${sources.length} successful pages.

## Provenance

Sources (all passed all 4 design-review gates with critic ≥ 88):

${sources.map((s, i) => `${i + 1}. \`${s.path}\``).join('\n')}

## Consensus structure (appears in ≥ 80% of sources)

### Semantic sections (common selector sequences)
${consensus.sections.slice(0, 10).map((s) => `- \`${s.item}\` (${s.pct}% of sources)`).join('\n') || '_(no single section pattern ≥ 80% — sources diverge)_'}

### Heading patterns (h1→h2→h3 sequences observed)
${consensus.headingPattern.slice(0, 5).map((p, i) => `- sample ${i + 1}: ${p}`).join('\n')}

### Fonts (consistent across sources)
${consensus.fonts.slice(0, 10).map((f) => `- \`${f.item}\` (${f.pct}%)`).join('\n')}

### Colors (consistent across sources)
${consensus.colors.slice(0, 15).map((c) => `- \`${c.item}\` (${c.pct}%)`).join('\n')}

### Common classes
${consensus.classes.slice(0, 25).map((c) => `- \`${c.item}\` (${c.pct}%)`).join('\n')}

## What a human reviewer should do next

1. Read the 5-10 most common class patterns above; they're your new
   canonical's skeleton.
2. Pick ONE source to use as the HTML starting point (the cleanest one).
3. Write the 7-decisions canonical.md by hand — consensus output tells you
   WHAT is consistent, not WHY. Only a human can explain the why.
4. Trim consensus that came from copy-paste: if every page says
   "Skypad Pro $9/month", that's content, not structure; strip content
   before locking the canonical.
5. Run \`bin/design-review --critic\` on the candidate; critic should
   score ≥ 90 (canonical bar).

## Divergence (features not in ≥ 80% consensus)

See \`diffs.md\` in the same output directory.
`;
}

function renderProvenance({ skill, page, sources }) {
  return JSON.stringify({
    skill,
    page,
    sampleCount: sources.length,
    generated: new Date().toISOString(),
    sources: sources.map((s) => ({
      path: s.path,
      sectionsCount: s.sections.length,
      headingsCount: s.headings.length,
      fonts: s.fonts,
      colorsCount: s.colors.length,
      classesCount: s.classes.length,
    })),
  }, null, 2);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }
  if (!args.skill || !args.page || !args.corpus) {
    console.error('required: --skill / --page / --corpus');
    console.error(HELP);
    return 2;
  }

  // Scan corpus for HTML files.
  const corpusPath = resolve(REPO_ROOT, args.corpus);
  let files;
  try { files = await readdir(corpusPath); }
  catch (e) { console.error(`corpus not readable: ${args.corpus}`); return 1; }

  const htmlFiles = files.filter((f) => extname(f) === '.html');
  if (htmlFiles.length < MIN_SAMPLES) {
    console.error(`only ${htmlFiles.length} .html files in corpus; need at least ${MIN_SAMPLES}`);
    console.error('library-grower works best on 5+ real successful pages.');
    return 1;
  }

  // Extract features from each.
  const samples = [];
  for (const f of htmlFiles) {
    const path = join(corpusPath, f);
    const html = await readFile(path, 'utf-8');
    samples.push({
      path: args.corpus + '/' + f,
      sections: extractSections(html),
      headings: extractHeadings(html),
      fonts: extractFonts(html),
      colors: extractColors(html),
      classes: extractClasses(html),
    });
  }

  console.error(`scanned ${samples.length} pages from ${args.corpus}`);

  const consensus = findConsensus(samples, 0.8);
  const outDir = args.out || `/tmp/grower-${args.skill}-${args.page}-${Date.now()}`;
  await writeFile(resolve(outDir + '-candidate.md'), renderCandidateMd({
    skill: args.skill, page: args.page, sources: samples, consensus,
  }), 'utf-8').catch(async () => {
    // Create dir if needed
    const { mkdir } = await import('node:fs/promises');
    await mkdir(outDir, { recursive: true });
    await writeFile(resolve(outDir, 'candidate.md'), renderCandidateMd({
      skill: args.skill, page: args.page, sources: samples, consensus,
    }), 'utf-8');
    await writeFile(resolve(outDir, 'provenance.json'), renderProvenance({
      skill: args.skill, page: args.page, sources: samples,
    }), 'utf-8');
    console.error(`candidate written to ${outDir}/`);
    console.error('next: read candidate.md, pick a source to fork, hand-write the 7 decisions, submit PR');
  });

  return 0;
}

main().then((code) => process.exit(code));
