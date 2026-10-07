// render_check.cjs —— check_page.py 的 P4:无头 Chromium 打开页面,报 JS 错误和网络请求。
// 用法:NODE_PATH=<含 playwright 的 node_modules> node render_check.cjs <index.html>
// 输出一行 JSON:{errors, requests, widgets, expected, sources, expectedSources}
'use strict';
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const file = path.resolve(process.argv[2]);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', (d) => { errors.push('弹窗(说明有脚本被执行了): ' + d.message()); d.dismiss(); });
  page.on('request', (r) => {
    const u = r.url();
    if (!/^(file|data|about|blob):/.test(u)) requests.push(u);
  });
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const d = window.PAGE_DATA || { widgets: [], sources: [] };
    return {
      widgets: document.querySelectorAll('[data-widget-ready]').length,
      expected: d.widgets.length,
      sources: document.querySelectorAll('#sources li').length,
      expectedSources: d.sources.length,
    };
  });
  console.log(JSON.stringify(Object.assign({ errors, requests }, info)));
  await browser.close();
})().catch((e) => {
  console.log(JSON.stringify({ fatal: String(e && e.message || e) }));
  process.exit(3);
});
