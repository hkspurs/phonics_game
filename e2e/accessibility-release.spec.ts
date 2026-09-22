import { test, expect } from '@playwright/test';

test('semantic flow supports keyboard focus, escape and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  const start = page.getByRole('button', { name: /開始冒險|繼續冒險/ });
  await expect(start).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '學習報告', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const report = page.getByRole('dialog', { name: '學習報告' });
  await expect(report).toBeVisible();
  await expect(report.getByRole('button', { name: '關閉報告', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '學習報告', exact: true })).toBeFocused();

  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.map-view')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.station-detail-view')).toBeVisible();
});

test('forced colors and reduced motion retain visible named controls', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();
  const controls = page.locator('.home-view button:visible');
  expect(await controls.count()).toBeGreaterThanOrEqual(5);
  for (let index = 0; index < await controls.count(); index += 1) {
    await expect(controls.nth(index)).toHaveAccessibleName(/.+/);
  }
  await expect.poll(() => page.locator('.rotate-icon').evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
});
