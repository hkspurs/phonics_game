import { expect, test } from '@playwright/test';

test.describe('Chinese Space shooter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/phonics');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('opens from the phonics home and exposes the game status', async ({ page }) => {
    await page.getByRole('button', { name: /Start space mission/i }).click();
    await expect(page).toHaveURL(/#\/chinese-space$/);
    await expect(page.getByTestId('chinese-space-canvas')).toBeVisible();
    await expect(page.getByTestId('chinese-space-status')).toContainText('中文字太空保衛戰');
  });

  test('shows the rotate-device prompt in portrait mode', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 480, height: 900 } });
    const page = await context.newPage();
    await page.goto('/#/chinese-space');
    await expect(page.locator('.chinese-space-shell__rotate')).toBeVisible();
    await context.close();
  });

  test('supports keyboard navigation into a chapter tutorial', async ({ page }) => {
    await page.goto('/#/chinese-space');
    await expect(page.getByTestId('chinese-space-status')).toContainText('home');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('chinese-space-status')).toContainText('chapterSelect');
    await page.keyboard.press('1');
    await expect(page.getByTestId('chinese-space-status')).toContainText('tutorial');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('chinese-space-status')).toContainText('audio');
  });
});
