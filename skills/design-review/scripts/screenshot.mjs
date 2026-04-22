// Screenshot an HTML file with Playwright so you can visually verify a demo.
// Usage:
//   node skills/design-review/scripts/screenshot.mjs <url-or-path> [out.png]
// Requires: `npm i playwright` (once) then `npx playwright install chromium`.
// If given a file path, the script serves the repo root at :8787 and fetches it.
//
// NOTE: unified from 4 byte-identical copies (one per design skill).

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const [, , target = '', outRaw] = process.argv;
if (!target) {
  console.error('usage: node screenshot.mjs <url-or-path> [out.png]');
  process.exit(2);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

let url = target;
let server;
if (/^file:\/\//.test(target)) {
  // Explicit file:// URL — pass through to Playwright directly.
  url = target;
} else if (/^\//.test(target)) {
  // Absolute local path — use file:// directly so any CWD can call us
  // (matches the way visual-audit.mjs handles absolute paths).
  url = `file://${target}`;
} else if (!/^https?:\/\//.test(target)) {
  // Relative path — serve repo root at :8787 and fetch via HTTP.
  const root = process.cwd();
  server = createServer(async (req, res) => {
    try {
      const p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      const s = await stat(p);
      if (s.isDirectory()) throw new Error('no index');
      res.writeHead(200, { 'Content-Type': mime[extname(p)] ?? 'application/octet-stream' });
      res.end(await readFile(p));
    } catch {
      res.writeHead(404).end('not found');
    }
  }).listen(8787);
  url = `http://localhost:8787/${target.replace(/^\/+/, '')}`;
}

const out = outRaw || `shot-${Date.now()}.png`;
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then((c) => c.newPage());
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
if (server) server.close();
console.log(`✓ saved ${out}  ←  ${url}`);
