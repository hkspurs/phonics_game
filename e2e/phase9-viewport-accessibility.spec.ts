import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE portrait', width: 375, height: 667 },
  { name: 'iPhone 15 portrait', width: 390, height: 844 },
  { name: 'iPhone 16 portrait', width: 430, height: 932 },
  { name: 'iPhone SE landscape', width: 667, height: 375 },
  { name: 'iPhone 15 landscape', width: 844, height: 390 },
  { name: 'iPad portrait', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'responsive surface must not require horizontal scrolling').toBeLessThanOrEqual(1);
}

test('home and map remain readable across the release viewport matrix', async ({ page }) => {
  test.setTimeout(120000);
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('.home-view')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const controls = page.locator('.home-view button');
    const count = await controls.count();
    expect(count, `${viewport.name} should expose home controls`).toBeGreaterThanOrEqual(5);
    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox();
      expect(box?.width, `${viewport.name} home control width`).toBeGreaterThanOrEqual(44);
      expect(box?.height, `${viewport.name} home control height`).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator('.home-view button').first()).toBeFocused();

    await page.getByRole('button', { name: /開始冒險|繼續冒險/ }).click();
    await expect(page.locator('.map-view')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const mapButton = page.locator('.station-choice').first();
    const mapBox = await mapButton.boundingBox();
    expect(mapBox?.height, `${viewport.name} station control height`).toBeGreaterThanOrEqual(48);
    await page.getByRole('button', { name: '‹ 首頁', exact: true }).click();
    await expect(page.locator('.home-view')).toBeVisible();
    expect(await page.locator('.screen-view').count(), `${viewport.name} must keep one active view`).toBe(1);
  }
});

test('portrait guidance is optional and rotation preserves the active screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();
  const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewportMeta).not.toContain('user-scalable=no');
  expect(viewportMeta).not.toContain('maximum-scale=1');
  const warning = page.locator('#orientation-warning');
  await expect(warning).toBeVisible();
  await expect.poll(() => warning.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.home-view')).toBeVisible();
  await expect(page.locator('#orientation-warning')).toBeHidden();
  await expectNoHorizontalOverflow(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.home-view')).toBeVisible();
  await expect.poll(() => page.locator('.rotate-icon').evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});
