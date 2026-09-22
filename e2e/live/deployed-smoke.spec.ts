import { test, expect } from '@playwright/test';
import { answerCurrentQuestion, openFirstStation } from '../helpers/learning-flow';

type BuildInfo = {
  sourceSha?: unknown;
};

const expectedSourceSha = process.env.EXPECTED_SOURCE_SHA?.trim();

test('deployed build identity and core learning journey', async ({ page, request }, testInfo) => {
  if (!expectedSourceSha) {
    throw new Error('EXPECTED_SOURCE_SHA is required to verify the deployed build identity.');
  }

  const pageErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    if (response.status() >= 400 && ['document', 'script', 'stylesheet', 'image', 'font', 'xhr', 'fetch'].includes(resourceType)) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const timeoutMs = Number(process.env.LIVE_PROPAGATION_TIMEOUT_MS ?? 120000);
  const deadline = Date.now() + (Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 120000);
  let buildInfo: BuildInfo | undefined;
  let lastStatus = 0;
  let lastSha = '';

  while (Date.now() < deadline) {
    const response = await request.get('/build-info.json', { failOnStatusCode: false });
    lastStatus = response.status();
    if (response.ok()) {
      const candidate = await response.json() as BuildInfo;
      lastSha = typeof candidate.sourceSha === 'string' ? candidate.sourceSha : '';
      if (lastSha === expectedSourceSha) {
        buildInfo = candidate;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!buildInfo) {
    throw new Error(`Deployed build identity did not converge: expected ${expectedSourceSha}, last status ${lastStatus}, last sourceSha ${lastSha || '(missing)'}.`);
  }
  await testInfo.attach('build-info.json', {
    body: JSON.stringify(buildInfo, null, 2),
    contentType: 'application/json',
  });

  const documentResponse = await page.goto('/?_t=' + Date.now(), { waitUntil: 'domcontentloaded' });
  expect(documentResponse?.ok()).toBe(true);
  await expect(page.locator('.home-view')).toBeVisible();

  await openFirstStation(page);
  await expect(page.locator('.question-view')).toBeVisible();
  await answerCurrentQuestion(page);
  await page.getByRole('button', { name: '繼續前進', exact: true }).click();
  await expect(page.locator('.question-view')).toHaveCount(0);
  await expect(page.locator('#game-container canvas')).toBeVisible();

  const savedState = await page.evaluate(() => localStorage.getItem('p1_adventure_save_v1'));
  expect(savedState).toBeTruthy();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.home-view')).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
