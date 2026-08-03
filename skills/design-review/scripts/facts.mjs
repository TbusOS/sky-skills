// facts.mjs — the repo's self-description gate.
//
// Every published page states counts about this repo: how many skills ship, how
// many of them are design voices, how many canonicals the library holds, how
// many known-bugs the catalogue carries. Those numbers live in prose, by hand,
// in a dozen places. The filesystem is the only thing that actually knows.
//
// Nothing checked the two against each other, so they drifted — repeatedly:
//   · roadmap said 27/40 canonicals while disk held 44   (coverage.mjs was born)
//   · pages said 44/44 "matrix complete" while disk held 50, because
//     coverage.mjs itself had never been told eclat and lectern exist
//   · pages said "5 design skills" for months after the 6th and 7th landed
//   · pages said 56 known-bugs while the catalogue held 61
//
// Each was found by a human reading closely. That is the wrong mechanism: prose
// counts are exactly the kind of fact a machine should own. This script derives
// every number from disk and fails if any page disagrees.
//
// Ordinals are left alone on purpose. "design-planner ships as the 13th skill"
// is a dated historical statement and stays true forever; only cardinal counts
// ("19 skills", "7 design skills") describe the present and must track it.
//
// Usage:
//   node facts.mjs            check every surface, print violations
//   node facts.mjs --list     print the derived ground truth and exit 0
//   node facts.mjs --json     machine-readable report
//
// Exit: 0 clean · 1 violations found · 2 bad CLI / repo shape.

import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

// Which family each skill belongs to. This is the one thing disk cannot tell us
// — "harness" vs "systems & content" is an editorial call, not a directory name.
// Keeping it here (rather than in prose) means a new skill fails the gate until
// somebody classifies it, which is the moment the pages need updating anyway.
const ROSTER = {
  'linux-kernel-dev': 'systems',
  'wechat-video-publisher': 'systems',
  'doc-to-markdown': 'systems',
  'md-to-pdf': 'systems',
  'tech-pdf-reader': 'systems',

  'anthropic-design': 'design',
  'apple-design': 'design',
  'ember-design': 'design',
  'sage-design': 'design',
  'glass-design': 'design',
  'eclat-design': 'design',
  'lectern-design': 'design',

  'design-review': 'harness',
  'design-planner': 'harness',
  'design-evolve': 'harness',
  'gated-dual-clone': 'harness',
  'gated-dual-clone-audit': 'harness',
  'doc-review-loop': 'harness',
  'skills-sync': 'harness',
};

// The documentation a reader consults to learn what this repo *is*. These gate:
// a wrong number here is a wrong answer to a direct question.
//
// Dated design specs are deliberately absent: docs/design-mr-gated-dual-repo.md
// saying "the 4 design skills" records when it was written, and rewriting it
// would falsify the record rather than correct it.
const CORE_SURFACES = [
  'index.html',
  'README.md',
  'README_zh.md',
  'docs/INSTALL.html',
  'docs/HARNESS-ROADMAP.html',
  'docs/HARNESS-ROADMAP.apple.html',
  'docs/HARNESS-ROADMAP.ember.html',
  'docs/HARNESS-ROADMAP.sage.html',
  'docs/HARNESS-ROADMAP.glass.html',
  'docs/KERNEL-HARNESS.html',
  'docs/KERNEL-CAPABILITIES.html',
  'docs/KERNEL-CODE-REVIEW.html',
  'docs/KERNEL-REPOS-SURVEY.html',
];

// The flagship demos retell the repo in each aesthetic. They make the same
// factual claims, but their numbers are woven through hero copy and narrative
// ("Thirteen skills. Nine generate. Two judge."), so correcting one is a
// rewrite, not a substitution. They are reported every run — never silently
// skipped — but do not fail the gate unless --strict is passed. Silence here
// would read as "the demos are current", which is the very illusion this
// script exists to break.
const SHOWCASE_SURFACES = [
  'demos/anthropic-design/index.html',
  'demos/apple-design/index.html',
  'demos/ember-design/index.html',
  'demos/sage-design/index.html',
  'demos/glass-design/index.html',
  'demos/eclat-design/index.html',
  'demos/lectern-design/index.html',
];

const EN_NUM = {
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
const ZH_NUM = {
  四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15,
  十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
};

const EN_WORDS = Object.keys(EN_NUM).join('|');
const ZH_WORDS = Object.keys(ZH_NUM).sort((a, b) => b.length - a.length).join('|');

function toNumber(raw) {
  const t = String(raw).trim();
  if (/^\d+$/.test(t)) return Number(t);
  const en = EN_NUM[t.toLowerCase()];
  if (en !== undefined) return en;
  const zh = ZH_NUM[t];
  return zh === undefined ? null : zh;
}

// A match is an ordinal — "the 13th skill", "第 13 个 skill" — when it names a
// position in history rather than a present-day total. Those must never be
// rewritten: the 13th skill was the 13th skill regardless of how many ship now.
function isOrdinal(line, index) {
  const before = line.slice(Math.max(0, index - 12), index);
  if (/第\s*$/.test(before)) return true;
  const after = line.slice(index);
  return /^(\d+)\s*(st|nd|rd|th)\b/i.test(after);
}

// Each check pairs a truth with the ways the pages actually phrase it.
//
// The patterns are deliberately narrow — anchored to a carrying phrase ("All N
// skills", "N skills total", "全部 N 个 skill") rather than the bare shape
// "N skills". A loose pattern is worse than no gate: the corpus is full of
// numbers that sit next to the word "skills" without being a total —
// "1 skills auto-updater" (a role), "× 4 skills" (a matrix factor),
// "3 known-bugs rows" (one commit's additions), "python3 skills/..." (a path).
// Flagging those trains people to skim past the gate, which is how a gate dies.
// Missing a novel phrasing only costs a catch; crying wolf costs the gate.
function buildChecks(truth) {
  const d = `(\\d+|${EN_WORDS})`;
  const z = `(\\d+|${ZH_WORDS})`;
  const notPath = '(?![\\/\\w-])';   // keeps "python3 skills/…" out
  return [
    {
      id: 'skills-total',
      truth: truth.skills.total,
      what: 'total skills shipped',
      patterns: [
        new RegExp(`\\ball\\s+${d}\\s+skills\\b${notPath}`, 'gi'),
        new RegExp(`\\b${d}\\s+skills\\s+total\\b`, 'gi'),
        new RegExp(`\\bof\\s+the\\s+${d}\\s+skills\\b`, 'gi'),
        // A total is stated, then the sentence ends or turns — "Nineteen skills.",
        // "nineteen skills, run …", "nineteen skills and a four-gate harness".
        // Requiring that turn is what separates it from "Five skills are detailed
        // below", where the number counts sections of this page, not the repo.
        new RegExp(`\\b(${EN_WORDS})\\s+skills\\b(?=\\s*[.,"<]|\\s+and\\b)`, 'gi'),
        new RegExp(`\\b(\\d+)\\s+skills[.·]`, 'g'),
        // Stat-block phrasings from the demos: "13 skills total", "14 skills in
        // one repository", "13 focused skills, each under one folder".
        new RegExp(`\\b${d}\\s+(?:focused\\s+)?skills\\s+(?:total\\b|in\\s+(?:one\\s+)?repo)`, 'gi'),
        new RegExp(`\\b${d}\\s+focused\\s+skills\\b`, 'gi'),
        new RegExp(`${z}\\s*个技能在`, 'g'),
        new RegExp(`${z}\\s*个专注的\\s*skill`, 'g'),
        new RegExp(`全部\\s*${z}\\s*个\\s*skill`, 'g'),
        new RegExp(`匹配到\\s*${z}\\s*个\\s*skill`, 'g'),
        new RegExp(`${z}\\s*个\\s*skill\\s*(?:。|一张表|分三族)`, 'g'),
        new RegExp(`${z}\\s*个技能(?=，按类型)`, 'g'),
      ],
    },
    {
      id: 'skills-design',
      truth: truth.skills.design,
      what: 'design skills',
      patterns: [
        new RegExp(`\\b${d}\\s+design\\s+skills?\\b`, 'gi'),
        new RegExp(`\\b${d}\\s+design\\s+(?:aesthetics|generators)\\b`, 'gi'),
        new RegExp(`${z}\\s*个设计(?:类)?\\s*skill`, 'g'),
        new RegExp(`${z}\\s*个\\s*design\\s*skill`, 'g'),
        new RegExp(`${z}\\s*个设计\\s*generator`, 'g'),
        // "七种声音" is the demos' name for the design voices. Note this does NOT
        // reach "4 种设计声音" in the roadmaps — that counts the four rendered
        // roadmap variants, and the 设计 between 种 and 声音 keeps them apart.
        new RegExp(`${z}\\s*种声音`, 'g'),
      ],
    },
    {
      id: 'skills-nondesign',
      truth: truth.skills.total - truth.skills.design,
      what: 'skills that are not design voices',
      patterns: [
        new RegExp(`(?:还有|另有)\\s*${z}\\s*个技能`, 'g'),
      ],
    },
    {
      id: 'canonical-total',
      truth: truth.canonical.total,
      what: 'canonical page-types on disk',
      patterns: [
        new RegExp(`\\b(\\d+)\\s*/\\s*\\d+\\s+canonical`, 'g'),
        new RegExp(`覆盖\\s*(\\d+)\\s*/\\s*\\d+\\s*canonical`, 'g'),
      ],
    },
    {
      id: 'kernel-eval-cases',
      truth: truth.kernel.cases,
      what: 'linux-kernel-dev eval cases on disk',
      patterns: [
        new RegExp(`\\b(\\d+)\\s+(?:eval\\s+)?cases\\b`, 'gi'),
        new RegExp(`(\\d+)\\s*个?用例`, 'g'),
      ],
    },
    {
      id: 'kernel-subsystems',
      truth: truth.kernel.subsys,
      what: 'linux-kernel-dev subsystem modules on disk',
      patterns: [
        new RegExp(`(\\d+)\\s*个?子系统`, 'g'),
        new RegExp(`\\b(\\d+)\\s+subsystems?\\b`, 'gi'),
      ],
    },
    {
      id: 'known-bugs',
      truth: truth.knownBugs.total,
      what: 'known-bug entries catalogued',
      patterns: [
        // "3 known-bugs rows" is what one round added, not what the book holds.
        new RegExp(`\\b(\\d+)\\s+known-bugs?\\b(?!\\s+rows)`, 'gi'),
        new RegExp(`已收录\\s*(\\d+)\\s*条`, 'g'),
      ],
    },
  ];
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function dirsIn(rel) {
  const entries = await readdir(resolve(REPO_ROOT, rel), { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

async function deriveTruth() {
  const skills = await dirsIn('skills');
  const design = skills.filter((s) => s.endsWith('-design'));

  let canonicalTotal = 0;
  const perSkill = {};
  for (const s of design) {
    const dir = resolve(REPO_ROOT, `skills/${s}/references/canonical`);
    let n = 0;
    if (await exists(dir)) {
      n = (await readdir(dir)).filter((f) => f.endsWith('.html')).length;
    }
    perSkill[s] = n;
    canonicalTotal += n;
  }

  const kbPath = resolve(REPO_ROOT, 'skills/design-review/references/known-bugs.md');
  const kbText = await readFile(kbPath, 'utf-8');
  const ids = [...kbText.matchAll(/^###\s+(\d+\.\d+[a-z]?)\s/gm)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);

  // linux-kernel-dev keeps its own counts, published on the four KERNEL-*.html
  // pages. They drifted the same way the design ones did — 136 on the page
  // against 137 on disk even before the last round added three more.
  const kdir = 'skills/linux-kernel-dev';
  const caseDir = resolve(REPO_ROOT, `${kdir}/tests/eval/cases`);
  const cases = (await exists(caseDir))
    ? (await readdir(caseDir)).filter((f) => f.endsWith('.json')).length : 0;
  const subsysDir = resolve(REPO_ROOT, `${kdir}/references/subsys`);
  const subsys = (await exists(subsysDir))
    ? (await readdir(subsysDir)).filter((f) => f.endsWith('.md')).length : 0;
  let kRules = 0;
  const rulesPath = resolve(REPO_ROOT, `${kdir}/evolution/rules.json`);
  if (await exists(rulesPath)) {
    try {
      const parsed = JSON.parse(await readFile(rulesPath, 'utf-8'));
      kRules = (parsed.rules || parsed).length || 0;
    } catch { kRules = 0; }
  }

  const families = { systems: 0, design: 0, harness: 0 };
  for (const s of skills) if (ROSTER[s]) families[ROSTER[s]] += 1;

  return {
    skills: { total: skills.length, design: design.length, list: skills, families },
    canonical: { total: canonicalTotal, perSkill },
    knownBugs: { total: ids.length, dupes: [...new Set(dupes)] },
    kernel: { cases, subsys, rules: kRules },
  };
}

// The roster must describe exactly what is on disk. An unclassified skill means
// the family counts printed on every page are already wrong, and a roster entry
// with no directory means a skill was removed without the pages noticing.
function auditRoster(truth) {
  const disk = new Set(truth.skills.list);
  const listed = new Set(Object.keys(ROSTER));
  const problems = [];
  for (const s of disk) {
    if (!listed.has(s)) {
      problems.push(`skills/${s}/ exists but is unclassified in facts.mjs ROSTER — ` +
        'add it, then update the family counts the pages print');
    }
  }
  for (const s of listed) {
    if (!disk.has(s)) {
      problems.push(`ROSTER lists "${s}" but skills/${s}/ is gone — drop it and re-check the pages`);
    }
  }
  if (truth.skills.families.design !== truth.skills.design) {
    problems.push(`ROSTER marks ${truth.skills.families.design} skills as design, ` +
      `but ${truth.skills.design} directories match skills/*-design/`);
  }
  return problems;
}

// coverage.mjs owns the canonical matrix. If a design skill is missing from its
// TARGET table the tracker under-counts and every page repeats the shortfall,
// so the two tables are checked against each other rather than trusted apart.
async function auditCoverageTarget(truth) {
  const src = await readFile(
    resolve(REPO_ROOT, 'skills/design-review/scripts/coverage.mjs'), 'utf-8');
  const block = src.match(/const TARGET = \{([\s\S]*?)\n\};/);
  if (!block) return ['cannot locate TARGET in coverage.mjs — facts.mjs needs updating'];
  const keys = [...block[1].matchAll(/^\s{2}([a-z][a-z0-9-]*):/gm)].map((m) => m[1]);
  const missing = Object.keys(truth.canonical.perSkill)
    .map((s) => s.replace(/-design$/, ''))
    .filter((s) => !keys.includes(s));
  return missing.length
    ? [`coverage.mjs TARGET is missing ${missing.join(', ')} — the tracker will ` +
       'report "matrix complete" while their canonicals go uncounted']
    : [];
}

// Some numbers legitimately sit next to these words without being a repo total:
// an aria-label counting the nodes drawn in a diagram, a sentence counting the
// sections of its own page. No pattern can tell those apart from the real claim,
// so the author says so in place:
//
//   <!-- facts-ignore: counts the nodes in this diagram, not the repo -->
//
// on the line, or the line above. A reason is required — an unexplained
// suppression is how a gate quietly stops meaning anything — and every active
// one is counted in the run's output so they stay visible.
const IGNORE_RE = /facts-ignore:\s*(\S.*?)\s*(?:-->|$)/;

// Looks at the RAW lines: the marker is an HTML comment, and the tag-stripping
// pass used for matching removes it entirely.
function suppression(rawLines, i) {
  for (const cand of [rawLines[i], rawLines[i - 1]]) {
    const m = cand === undefined ? null : cand.match(IGNORE_RE);
    if (m) return m[1];
  }
  return null;
}

async function scanSurfaces(checks, surfaces) {
  const violations = [];
  const suppressed = [];
  for (const rel of surfaces) {
    const abs = resolve(REPO_ROOT, rel);
    if (!(await exists(abs))) {
      violations.push({ file: rel, line: 0, id: 'surface-missing',
        claimed: null, truth: null,
        text: 'listed as a surface but not found on disk' });
      continue;
    }
    const raw = (await readFile(abs, 'utf-8')).split('\n');

    // Match against tag-stripped text, not raw HTML. A claim is regularly split
    // across elements — `<span>18</span><span>skills in one repo</span>` — and
    // on the raw line the markup sits between the number and the noun, so every
    // pattern misses it. Stat blocks go further and put the number on its own
    // line above its label, so a line whose entire text is a number is joined
    // with the next line before matching. Both shapes were carrying stale counts
    // that the first version of this gate reported as clean.
    const text = raw.map((l) => l.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' '));
    const lines = text.map((t, i) => (
      // A zero-padded number is a section marker (01 · 02 · 03), not a stat.
      // Joining those produced "02 Design aesthetics" → "2 design aesthetics".
      /^\s*\d+\s*$/.test(t) && !/^\s*0\d/.test(t) && text[i + 1] !== undefined
        ? `${t.trim()} ${text[i + 1]}` : t
    ));

    lines.forEach((line, i) => {
      for (const check of checks) {
        for (const re of check.patterns) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(line)) !== null) {
            if (isOrdinal(line, m.index)) continue;
            const claimed = toNumber(m[1]);
            if (claimed === null || claimed === check.truth) continue;
            const why = suppression(raw, i);
            const hit = {
              file: rel, line: i + 1, id: check.id,
              claimed, truth: check.truth, what: check.what,
              text: m[0].trim(),
            };
            if (why) suppressed.push({ ...hit, why });
            else violations.push(hit);
          }
        }
      }
    });
  }
  violations.suppressed = suppressed;
  return violations;
}

function printTruth(truth) {
  const f = truth.skills.families;
  console.log('ground truth, derived from disk:');
  console.log(`  skills            ${truth.skills.total}` +
    `  (systems ${f.systems} · design ${f.design} · harness ${f.harness})`);
  console.log(`  canonical         ${truth.canonical.total}`);
  for (const [s, n] of Object.entries(truth.canonical.perSkill)) {
    console.log(`      ${s.replace(/-design$/, '').padEnd(12)}${n}`);
  }
  console.log(`  known-bugs        ${truth.knownBugs.total}`);
  console.log(`  kernel eval cases ${truth.kernel.cases}` +
    `  (subsystems ${truth.kernel.subsys} · rules ${truth.kernel.rules})`);
  if (truth.knownBugs.dupes.length) {
    console.log(`      duplicate ids: ${truth.knownBugs.dupes.join(', ')}`);
  }
}

function report(label, violations) {
  const byFile = new Map();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file).push(v);
  }
  console.log(`${label} (${violations.length} across ${byFile.size} file(s)):`);
  for (const [file, vs] of byFile) {
    console.log(`  ${file}`);
    for (const v of vs) {
      console.log(`    :${String(v.line).padEnd(5)} ${v.id.padEnd(16)} ` +
        `says ${v.claimed}, disk says ${v.truth}   «${v.text}»`);
    }
  }
  console.log('');
}

async function main() {
  const argv = process.argv.slice(2);
  const wantJson = argv.includes('--json');
  const wantList = argv.includes('--list');
  const strict = argv.includes('--strict');

  const truth = await deriveTruth();
  const structural = [...auditRoster(truth), ...(await auditCoverageTarget(truth))];
  if (truth.knownBugs.dupes.length) {
    structural.push(`known-bugs.md reuses id ${truth.knownBugs.dupes.join(', ')} — ` +
      'ids are how rules cite bugs, so a duplicate makes one of them uncitable');
  }

  if (wantList && !wantJson) { printTruth(truth); return 0; }

  const checks = buildChecks(truth);
  const core = await scanSurfaces(checks, CORE_SURFACES);
  const showcase = await scanSurfaces(checks, SHOWCASE_SURFACES);

  if (wantJson) {
    console.log(JSON.stringify({ truth, structural, core, showcase }, null, 2));
    return structural.length + core.length + (strict ? showcase.length : 0) ? 1 : 0;
  }

  printTruth(truth);
  console.log('');

  if (structural.length) {
    console.log(`structural problems (${structural.length}):`);
    for (const p of structural) console.log(`  ✗ ${p}`);
    console.log('');
  }

  const muted = [...core.suppressed, ...showcase.suppressed];
  if (muted.length) {
    console.log(`suppressed by facts-ignore (${muted.length}):`);
    for (const s of muted) console.log(`  ${s.file}:${s.line}  «${s.text}» — ${s.why}`);
    console.log('');
  }

  if (core.length) report('stale counts · documentation', core);
  else console.log(`✓ documentation clean: ${CORE_SURFACES.length} surface(s) agree with disk\n`);

  if (showcase.length) {
    report(strict ? 'stale counts · showcase demos'
                  : 'stale counts · showcase demos (reported, not gating — pass --strict to enforce)',
           showcase);
  }

  const failing = structural.length + core.length + (strict ? showcase.length : 0);
  if (!failing) {
    console.log('✓ facts clean');
    return 0;
  }
  console.log(`✗ ${failing} problem(s) must be fixed` +
    (!strict && showcase.length ? `  ·  ${showcase.length} more in showcase demos` : ''));
  return 1;
}

main().then((c) => process.exit(c)).catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(2);
});
