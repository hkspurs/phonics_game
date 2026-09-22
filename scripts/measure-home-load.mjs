import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const outputPath = process.argv[2];
if (!outputPath) throw new Error('Usage: node scripts/measure-home-load.mjs <output.json>');

const baseURL = 'http://127.0.0.1:4173';
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: 'ignore',
  detached: true,
});

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Preview server did not become ready');
}

try {
  await waitForServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'],
  });
  const runs = [];
  for (let run = 1; run <= 5; run += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const requests = new Map();
    const failures = [];
    cdp.on('Network.requestWillBeSent', event => requests.set(event.requestId, {
      url: event.request.url,
      encodedBytes: 0,
    }));
    cdp.on('Network.loadingFinished', event => {
      const request = requests.get(event.requestId);
      if (request) request.encodedBytes = event.encodedDataLength;
    });
    cdp.on('Network.loadingFailed', event => failures.push(event.errorText));
    await page.addInitScript(() => {
      window.__QA_LONG_TASKS__ = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.__QA_LONG_TASKS__.push({ startTime: entry.startTime, duration: entry.duration });
        }
      }).observe({ type: 'longtask', buffered: true });
    });
    const startedAt = performance.now();
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.locator('.home-view').waitFor({ state: 'visible', timeout: 30000 });
    const startReadyMs = performance.now() - startedAt;
    await page.waitForTimeout(250);
    const longTasks = await page.evaluate(() => window.__QA_LONG_TASKS__ ?? []);
    const records = [...requests.values()];
    const optional = records.filter(record => /\/assets\/(?:outfits|character\/outfits|pets)\//.test(record.url));
    const scripts = records.filter(record => /\/assets\/index-[^/]+\.js(?:\?|$)/.test(record.url));
    runs.push({
      run,
      startReadyMs: Math.round(startReadyMs),
      requestCount: records.length,
      transferBytes: records.reduce((sum, record) => sum + record.encodedBytes, 0),
      optionalRequestCount: optional.length,
      optionalTransferBytes: optional.reduce((sum, record) => sum + record.encodedBytes, 0),
      compressedJsBytes: scripts.reduce((sum, record) => sum + record.encodedBytes, 0),
      longTaskCount: longTasks.length,
      longTaskTotalMs: Math.round(longTasks.reduce((sum, entry) => sum + entry.duration, 0)),
      failures,
    });
    await context.close();
  }
  await browser.close();
  const sorted = runs.map(item => item.startReadyMs).sort((a, b) => a - b);
  const result = {
    generatedAt: new Date().toISOString(),
    browser: 'Playwright Chromium 129',
    cpuThrottleRate: 4,
    cacheDisabled: true,
    runs,
    medianStartReadyMs: sorted[Math.floor(sorted.length / 2)],
  };
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  try { process.kill(-server.pid, 'SIGTERM'); } catch {}
}
