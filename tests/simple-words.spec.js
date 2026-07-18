import { expect, test } from '@playwright/test';

test('Simple Word is reachable and accepts a three-letter spelling', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999999;
  });
  await page.goto('/#/phonics');

  await page.getByRole('button', { name: 'Simple Word' }).click();
  await expect(page).toHaveURL(/simple-words/);
  await expect(page.getByText('1 / 16')).toBeVisible();

  for (const letter of 'BUS') {
    await page.getByRole('button', { name: letter, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Submit / 確定' }).click();
  await expect(page.getByText('2 / 16')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Play word' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
