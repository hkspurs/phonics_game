import { test, expect, type Page, type TestInfo } from '@playwright/test';

const VIEWPORTS = [
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '667x375', width: 667, height: 375 },
  { name: '844x390', width: 844, height: 390 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 },
] as const;

async function attachScreen(page: Page, testInfo: TestInfo, viewport: string, screen: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${viewport} ${screen} horizontal overflow`).toBeLessThanOrEqual(1);
  await testInfo.attach(`${viewport}-${screen}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

async function startScene(page: Page, key: string, data?: Record<string, unknown>): Promise<void> {
  await page.evaluate(({ sceneKey, sceneData }) => {
    const game = (window as any).__PHASER_GAME__;
    game.scene.getScenes(true)[0].scene.start(sceneKey, sceneData);
  }, { sceneKey: key, sceneData: data });
  await page.waitForFunction((sceneKey) => (window as any).__PHASER_GAME__.scene.isActive(sceneKey), key);
}

for (const viewport of VIEWPORTS) {
  test(`release screens remain inspectable at ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('.home-view')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#orientation-warning'), `${viewport.name} responsive Home stays unobscured`).toBeHidden();
    expect(
      await page.evaluate(() => document.fonts.check('16px "Noto Sans TC"', '繁體中文學習')),
      `${viewport.name} should resolve the QA Traditional Chinese font`,
    ).toBe(true);
    await attachScreen(page, testInfo, viewport.name, 'home');

    await page.getByRole('button', { name: /開始冒險|繼續冒險/ }).click();
    await expect(page.locator('.map-view')).toBeVisible();
    await expect(page.locator('#orientation-warning')).toBeHidden();
    await attachScreen(page, testInfo, viewport.name, 'map');
    await page.locator('.station-choice').first().click();
    await expect(page.locator('.station-detail-view')).toBeVisible();
    await attachScreen(page, testInfo, viewport.name, 'station-detail');
    await page.locator('.station-activity').first().click();
    await expect(page.locator('.question-view')).toBeVisible();
    await attachScreen(page, testInfo, viewport.name, 'question');

    await startScene(page, 'TitleScene');
    await expect(page.locator('.home-view')).toBeVisible();
    await page.getByRole('button', { name: '學習報告', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '學習報告' })).toBeVisible();
    await attachScreen(page, testInfo, viewport.name, 'report');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: '設定', exact: true }).click();
    await expect(page.locator('.settings-view')).toBeVisible();
    await attachScreen(page, testInfo, viewport.name, 'settings');
    await startScene(page, 'TitleScene');
    await page.getByRole('button', { name: '我的獎章', exact: true }).click();
    await expect(page.locator('.trophy-view')).toBeVisible();
    await attachScreen(page, testInfo, viewport.name, 'trophy');

    await startScene(page, 'ShopScene');
    await expect.poll(() => page.evaluate(() => (window as any).__PHASER_GAME__.scene.isActive('ShopScene'))).toBe(true);
    await attachScreen(page, testInfo, viewport.name, 'shop');

    await startScene(page, 'ResultScene', {
      stationId: 1,
      totalQuestions: 3,
      sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: 1 },
      runnerCoins: 0,
    });
    await expect(page.locator('.result-view')).toBeVisible();
    await expect(page.locator('#orientation-warning')).toBeHidden();
    await attachScreen(page, testInfo, viewport.name, 'result');
  });
}
