// sprint-contract.mjs — generate a "sprint contract" for a new page before
// the generator writes a single line. The contract tells the generator:
//   (a) which canonical to read first
//   (b) what structural MUST / MUST NOT this page-type carries
//   (c) which mechanical gates it must pass on return
//
// Output is one markdown document printed to stdout. Pipe into generator
// prompt, or save to a file and reference.
//
// Usage:
//   node skills/design-review/scripts/sprint-contract.mjs \
//     --skill=<anthropic|apple|ember|sage> \
//     --page=<pricing|landing|docs-home|feature-deep>
//
// Exit: 0 OK, 2 bad CLI, 1 missing canonical.

import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const VALID_SKILLS = ['anthropic', 'apple', 'ember', 'sage'];
const VALID_PAGES = ['pricing', 'landing', 'docs-home', 'feature-deep'];

// Per-skill brand presence requirements (mirror of visual-audit's
// SKILL_SIGNATURES but in contract form — what the generator must ensure
// is visible in the top 1440×500 region).
const BRAND = {
  anthropic: {
    accent: '#d97757',
    name: 'anthropic orange',
    minCoverage: '0.4%',
    howTo: 'orange `.anth-badge`, orange `.anth-button` CTA in nav or banner, or orange kicker text above h1',
    forbiddenFonts: ['Fraunces', 'Instrument Serif'],
    forbiddenColors: ['#0071E3 (apple)', '#97B077 (sage)', '#c49464 (ember)'],
  },
  apple: {
    accent: '#0071E3',
    name: 'apple blue',
    minCoverage: '0.02%',
    howTo: 'blue kicker above h1, blue `.apple-link` in nav with ›, or a filled `.apple-button` on hero CTA',
    forbiddenFonts: ['Fraunces', 'Instrument Serif', 'Poppins', 'Lora'],
    forbiddenColors: ['#d97757 (anthropic)', '#c49464 (ember)', '#97B077 (sage)'],
  },
  ember: {
    accent: '#c49464',
    name: 'ember gold',
    minCoverage: '0.01%',
    howTo: 'centered gold `.accent-strip` hairline above every section, gold SVG accent strokes, gold eyebrow text accent',
    forbiddenFonts: ['Instrument Serif', 'Poppins', 'Lora'],
    forbiddenColors: ['#d97757 (anthropic)', '#0071E3 (apple)', '#97B077 (sage)'],
  },
  sage: {
    accent: '#97B077 / #d4e1b8',
    name: 'sage green',
    minCoverage: '1.5%',
    howTo: '`.sage-nav` with `background: rgba(212,225,184,0.88)` + `border-bottom:#c9d6a8` — the nav band itself carries most of the sage-green coverage',
    forbiddenFonts: ['Fraunces', 'Poppins', 'Lora'],
    forbiddenColors: ['#d97757 (anthropic)', '#0071E3 (apple)', '#c49464 (ember)'],
  },
};

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (a.startsWith('--skill=')) out.skill = a.split('=')[1];
    else if (a.startsWith('--page=')) out.page = a.split('=')[1];
    else if (a === '-h' || a === '--help') out.help = true;
  }
  return out;
}

const HELP = `
sprint-contract.mjs — generate a contract for a new page

Usage:
  node skills/design-review/scripts/sprint-contract.mjs \\
    --skill=<anthropic|apple|ember|sage> \\
    --page=<pricing|landing|docs-home|feature-deep>

Output: markdown to stdout. Pipe into generator prompt or save.

Example:
  node skills/design-review/scripts/sprint-contract.mjs \\
    --skill=sage --page=landing > /tmp/contract.md
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }
  if (!VALID_SKILLS.includes(args.skill)) {
    console.error(`--skill must be one of: ${VALID_SKILLS.join(', ')}`);
    return 2;
  }
  if (!VALID_PAGES.includes(args.page)) {
    console.error(`--page must be one of: ${VALID_PAGES.join(', ')}`);
    return 2;
  }

  const skill = args.skill;
  const page = args.page;
  const canonicalHtml = `skills/${skill}-design/references/canonical/${page}.html`;
  const canonicalMd = `skills/${skill}-design/references/canonical/${page}.md`;

  // Confirm canonical exists (non-fatal if md missing; fatal if html missing).
  try { await stat(resolve(REPO_ROOT, canonicalHtml)); }
  catch { console.error(`canonical HTML not found: ${canonicalHtml}`); return 1; }
  let mdBody = '';
  try { mdBody = await readFile(resolve(REPO_ROOT, canonicalMd), 'utf-8'); }
  catch { mdBody = '(canonical.md not yet written for this page-type.)'; }

  const brand = BRAND[skill];
  const isPublic = true; // docs/ and canonical/ paths are always public per §G.

  const contract = renderContract({
    skill, page, canonicalHtml, canonicalMd, brand, mdBody, isPublic,
  });
  console.log(contract);
  return 0;
}

function renderContract({ skill, page, canonicalHtml, canonicalMd, brand, mdBody, isPublic }) {
  return `# Sprint contract · ${skill}-design · ${page}

> This contract tells you what MUST be true of the page you're about to
> generate. Read the canonical first. Then write. Then run the three gates.
> If you skip any step, the page will fail review and have to be redone —
> which is more work than following the contract.

## 0. Files you MUST read before touching HTML

1. \`${canonicalHtml}\` — the reference implementation. This is the gold
   standard of a "${skill}-design ${page}" page.
2. \`${canonicalMd}\` — 6-8 design decisions behind the canonical (below).
3. \`skills/design-review/references/cross-skill-rules.md\` — A-K rules
   that apply to all skills.
4. \`skills/${skill}-design/references/dos-and-donts.md\` — skill-specific.

Do not skim. The canonical exists so you don't re-invent the voice.

## 1. Structural MUST

These are extracted from the canonical.md "7 decisions" section. Follow
the structure, adapt the content:

${mdBody.split('\n').filter(l => l.startsWith('### ')).slice(0, 8).map(l => '- ' + l.replace(/^###\s*\d+\.\s*/, '')).join('\n')}

## 2. Brand-presence MUST (mechanical)

The ${skill}-design signature color "${brand.name}" (${brand.accent}) must
be **visibly present** in the top 1440×500 region of your rendered page
(≥ ${brand.minCoverage} pixel coverage after antialiasing).

**How to achieve it**: ${brand.howTo}.

visual-audit.mjs will compute coverage via pngjs and \`warn\` if below
threshold. The ${skill}-design page must pass this check.

## 3. Italic discipline (§J) MUST

Italic on display headings is forbidden as a default. Allowed:
- pull-quote \`<blockquote>\` (italic EARNED here)
- tier-card tagline (small 15-17px, italic EARNED as accent role)
- ONE \`<em>\` accent word per hero h1 or section h2

visual-audit.mjs counts display headings (h1/h2/h3 + .feat-title /
.tier-card__name / .section-title / .hero-headline / .ref-card__name /
.canon-card__title / .use-tile h3 / .faq-q / .tier-card__price-num) and
\`warn\` if more than 40% have \`font-style: italic\`.

## 4. Cross-skill smell (§K) MUST NOT

Do not use ANY of these in your ${skill}-design page:

- **Foreign fonts**: ${brand.forbiddenFonts.map(f => `\`${f}\``).join(', ')}
- **Foreign signature colors**: ${brand.forbiddenColors.map(c => `\`${c}\``).join(', ')}

visual-audit.mjs scans computed styles of all visible elements and
\`warn\` once per offending signature.

## 5. Bilingual (§G) MUST${isPublic ? ' (public-facing page)' : ''}

Any HTML under \`docs/\` or \`skills/<style>/references/canonical/\` is
public. Must support zh/en toggle:

- \`<html data-lang="en">\` initial.
- \`<style>\` block with \`html[data-lang="en"] .lang-zh { display:none }\`
  and \`html[data-lang="zh"] .lang-en { display:none }\`.
- \`.lang-toggle\` button in nav.
- Every user-facing text wrapped:
  \`<span class="lang-en">Hello</span><span class="lang-zh">你好</span>\`.
- \`<script>\` at end of body handling toggle + localStorage.

Use the existing canonical's toggle JS verbatim — no need to reinvent.

Chinese font stack (§H): use Noto Serif SC / Noto Sans SC. Apple skill is
the exception (PingFang SC native, Noto as fallback).

## 6. Typography MUST

Exactly match the type scale defined in \`${canonicalMd}\` "Typography
rules" table. If you need a size not in the table, round to the nearest
allowed size. Weights and font-styles are binding.

## 7. Color MUST

Use ONLY the palette defined in \`skills/${skill}-design/references/
design-tokens.md\` via CSS vars (\`var(--${skill}-*)\` or direct hex from
the palette). Never invent colors.

## 8. Before returning "done"

Run all three gates from repo root (the \`bin/design-review\` wrapper
does this):

\`\`\`bash
bin/design-review <path-to-your-new-page.html>
\`\`\`

If any gate produces an \`error\`, FIX before returning. If it produces
a \`warn\`, fix when possible — warnings are real signals.

The gates are:
1. \`verify.py\` — structural (placeholders, DOCTYPE, BEM, SVG balance,
   class usage, bilingual, container rules).
2. \`visual-audit.mjs\` — rendered (contrast, hero size, SVG tiny text,
   overlap, h1 count, heading skip, a11y, hollow card, svg-same-colour,
   italic-overuse, cross-skill-smell, brand-presence).
3. \`design-critic\` — LLM taste judge (Phase B; compares your page to
   the canonical and flags taste mismatches).

## 9. After returning: self-regression

Your new page, once accepted into the canonical library, must pass the
critic with ≥ 88 score. If the canonical-level bar is lowered to
accommodate a weaker page, the bar degrades for everyone. Hold yourself
to the level of \`${canonicalHtml}\`.

---

## Reference: canonical.md body

\`\`\`
${mdBody.trim()}
\`\`\`

---

Contract generated by \`sprint-contract.mjs\`. Generator reads this
before writing; critic reads this to know acceptance criteria.
`;
}

main().then((code) => process.exit(code));
