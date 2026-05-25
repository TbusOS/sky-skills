#!/usr/bin/env node
/*
 * md-mirror.mjs — render a Markdown file into a self-contained HTML
 * styled with the anthropic-design system (Poppins + Lora + #d97757 + #faf9f5).
 *
 * Two modes:
 *
 *  CLI mode (1 → 1 render):
 *    node md-mirror.mjs <src.md>                # writes <src>.html next to it
 *    node md-mirror.mjs <src.md> <dst.html>     # explicit destination
 *
 *  Library mode (import from another script, e.g. md-pack.mjs):
 *    import { renderMarkdown } from './md-mirror.mjs';
 *    const html = renderMarkdown({ srcPath, sourceLabel, rewriteHref });
 *
 * Dependencies (already in sky-skills/node_modules):
 *   - marked (^15)
 *
 * In CLI mode, local <a href="*.md(?q)(#f)"> links are rewritten to *.html
 * (siblings of the original src .md).  Absolute http(s) hrefs are left
 * alone.  For the "collect into a subdir, flat naming" workflow, use the
 * sister script md-pack.mjs which calls renderMarkdown with a custom
 * rewriteHref to retarget every link.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { marked } from 'marked';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR  = path.resolve(SCRIPT_DIR, '..');
const ASSETS_DIR = path.join(SKILL_DIR, 'assets');

function loadAssets() {
  return {
    anthropicCss: fs.readFileSync(path.join(ASSETS_DIR, 'anthropic.css'), 'utf8'),
    fontsCss:     fs.readFileSync(path.join(ASSETS_DIR, 'fonts.css'), 'utf8'),
  };
}

const OVERRIDE_CSS = `
/* ---------- md-mirror overrides (markdown-rendered content) ---------- */
.md-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 48px 80px;
  font-family: var(--font-body);
  color: var(--anth-text);
  background: var(--anth-bg);
  font-size: 16.5px;
  line-height: 1.7;
}
.md-banner {
  background: var(--anth-bg-subtle);
  border-left: 3px solid var(--anth-orange);
  padding: 14px 18px;
  margin: 0 auto 32px;
  max-width: 1200px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--anth-text-secondary);
  line-height: 1.55;
}
.md-banner b { font-family: var(--font-mono); color: var(--anth-text); }
.md-banner code { background: transparent; color: var(--anth-orange); padding: 0; }

.md-content h1 { margin: 1.2em 0 .55em; }
.md-content h2 { margin: 1.6em 0 .55em; padding-top: .3em; border-top: 1px solid var(--anth-light-gray); }
.md-content h3 { margin: 1.4em 0 .45em; color: var(--anth-orange); }
.md-content h4 { margin: 1.2em 0 .4em; }
.md-content p, .md-content li { font-family: var(--font-body); }
.md-content ul, .md-content ol { padding-left: 1.6em; }
.md-content li { margin: .2em 0; }
.md-content a { color: var(--anth-orange); text-decoration: none; border-bottom: 1px solid rgba(217,119,87,.35); }
.md-content a:hover { border-bottom-color: var(--anth-orange); }

.md-content code {
  font-family: var(--font-mono);
  font-size: .88em;
  background: var(--anth-bg-subtle);
  color: var(--anth-text);
  padding: 1px 6px;
  border-radius: 4px;
}
.md-content pre {
  background: #2b2a26;
  color: #f0ede3;
  padding: 16px 18px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13.5px;
  line-height: 1.55;
  margin: 1em 0;
}
.md-content pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

.md-content blockquote {
  border-left: 3px solid var(--anth-orange);
  background: rgba(217,119,87,.06);
  padding: 14px 18px;
  margin: 1em 0;
  color: var(--anth-text);
}
.md-content blockquote > :first-child { margin-top: 0; }
.md-content blockquote > :last-child { margin-bottom: 0; }
.md-content blockquote p { font-family: var(--font-body); }

.md-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 14.5px;
  font-family: var(--font-body);
}
.md-content thead { background: var(--anth-bg-subtle); }
.md-content th, .md-content td {
  border: 1px solid var(--anth-light-gray);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
.md-content th {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--anth-text);
}

.md-content hr {
  border: 0;
  border-top: 1px solid var(--anth-light-gray);
  margin: 2.2em 0;
}
`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function defaultRewriteHref(href /* , srcPath */) {
  if (/^https?:\/\//i.test(href)) return href;
  if (/^(mailto:|javascript:|#|\/)/i.test(href)) return href;
  const m = href.match(/^([^?#]+)\.md(\?[^#]*)?(#.*)?$/);
  if (!m) return href;
  return `${m[1]}.html${m[2] || ''}${m[3] || ''}`;
}

function gitRelativeLabel(absPath) {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', {
      cwd: path.dirname(absPath), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return path.relative(repoRoot, absPath);
  } catch {
    return path.basename(absPath);
  }
}

/**
 * Render a Markdown file to a self-contained anthropic-styled HTML string.
 *
 * @param {object} opts
 * @param {string} opts.srcPath        Absolute path to .md source.
 * @param {string} [opts.sourceLabel]  Banner label (defaults to git-relative path).
 * @param {(href: string, srcPath: string) => string} [opts.rewriteHref]
 *        Per-href hook.  Default: rewrite local `*.md` to `*.html`, leave
 *        everything else.  md-pack passes a smarter hook that rebases
 *        relative paths to the mirror output dir.
 * @returns {string} HTML document
 */
export function renderMarkdown(opts) {
  const { srcPath, sourceLabel, rewriteHref } = opts;
  const absSrc = path.resolve(srcPath);
  const { anthropicCss, fontsCss } = loadAssets();
  const mdRaw = fs.readFileSync(absSrc, 'utf8');

  marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false });
  let body = marked.parse(mdRaw);

  const rewriter = rewriteHref || defaultRewriteHref;
  body = body.replace(
    /(<a\b[^>]*\bhref=")([^"]+)(")/g,
    (full, pre, href, post) => `${pre}${rewriter(href, absSrc)}${post}`
  );

  const title = (mdRaw.match(/^#\s+(.+)$/m) || [, path.basename(absSrc, '.md')])[1].trim();
  const banner = sourceLabel || gitRelativeLabel(absSrc);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${fontsCss}
${anthropicCss}
${OVERRIDE_CSS}
</style>
</head>
<body>
<div class="md-banner">
  <b>源文档</b>　<code>${escapeHtml(banner)}</code><br>
  <b>渲染</b>　sky-skills / anthropic-design / md-mirror
</div>
<main class="md-shell md-content">
${body}
</main>
</body>
</html>
`;
}

// ---------- CLI ----------
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const [, , srcArg, dstArg] = process.argv;
  if (!srcArg || srcArg === '-h' || srcArg === '--help') {
    console.log('md-mirror — render .md to anthropic-styled .html');
    console.log('Usage: node md-mirror.mjs <src.md> [dst.html]');
    process.exit(srcArg ? 0 : 2);
  }
  const src = path.resolve(srcArg);
  if (!fs.existsSync(src) || !src.toLowerCase().endsWith('.md')) {
    console.error(`error: not a .md file: ${src}`);
    process.exit(2);
  }
  const dst = dstArg
    ? path.resolve(dstArg)
    : src.replace(/\.md$/i, '.html');

  const html = renderMarkdown({ srcPath: src });
  fs.writeFileSync(dst, html);
  console.log(`md-mirror: ${path.relative(process.cwd(), src)} → ${path.relative(process.cwd(), dst)} (${(html.length / 1024).toFixed(1)} KB)`);
}
