import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] || 'http://localhost:5173';
const outputDir = process.argv[3] || 'public/qa-screenshots';
const viewports = [
  ['desktop', { width: 1920, height: 1080 }],
  ['tablet', { width: 768, height: 1024 }],
  ['mobile', { width: 375, height: 667 }],
];
const routes = [
  ['gateway', '/'],
  ['phonics', '/phonics'],
  ['blending', '/blending'],
  ['learn-blending', '/simple-words?mode=learn&adventure=1&sessionSize=5'],
  ['math', '/math'],
  ['brain-games', '/braingames'],
  ['shop', '/shop'],
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const [viewportName, viewport] of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
  page.on('pageerror', (error) => pageErrors.push(error.message));

  for (const [routeName, route] of routes) {
    const url = `${baseUrl.replace(/\/$/, '')}/#${route}`;
    const filename = `${viewportName}-${routeName}.png`;
    const record = { viewport: viewportName, route, screenshot: path.join(outputDir, filename), url, pass: false, consoleErrors: [], pageErrors: [] };
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(routeName === 'blending' || routeName === 'learn-blending' ? 1400 : 500);
      await page.screenshot({ path: record.screenshot, fullPage: true });
      record.heading = await page.locator('h1').first().textContent().catch(() => null);
      record.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      record.pass = true;
    } catch (error) {
      record.error = error.message;
    }
    record.consoleErrors = [...consoleErrors];
    record.pageErrors = [...pageErrors];
    results.push(record);
  }
  await context.close();
}

await browser.close();
const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.filter((result) => result.pass).length,
  failed: results.filter((result) => !result.pass).length,
  results,
};
await fs.writeFile(path.join(outputDir, 'test-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed > 0) process.exitCode = 1;
