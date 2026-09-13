import { test, expect } from '@playwright/test';

test('support destinations expose readable dialogs, focus order and safe reset', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();

  await page.getByRole('button', { name: '學習報告', exact: true }).click();
  const report = page.getByRole('dialog', { name: '學習報告' });
  await expect(report).toBeVisible();
  await expect(report.getByRole('heading', { name: '學習報告' })).toBeVisible();
  await expect(report).toContainText('未有練習紀錄');
  await page.keyboard.press('Escape');
  await expect(page.locator('.home-view')).toBeVisible();

  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.locator('.settings-view')).toBeVisible();
  const mathToggle = page.getByRole('button', { name: /數學：/ }).first();
  await mathToggle.click();
  await expect(page.getByRole('button', { name: '數學：關', exact: true })).toBeFocused();
  await expect(page.locator('.support-status')).toHaveText('數學已關閉。');
  await page.getByRole('button', { name: '數學：關', exact: true }).click();
  await expect(page.getByRole('button', { name: '數學：開', exact: true })).toBeFocused();
  const beforeReset = await page.evaluate(() => localStorage.getItem('p1_adventure_save_v1'));
  await page.getByRole('button', { name: '重設所有遊戲進度', exact: true }).click();
  const resetDialog = page.getByRole('dialog', { name: '確定重設所有進度？' });
  await expect(resetDialog).toBeVisible();
  await expect(resetDialog).toContainText('無法復原');
  await page.getByRole('button', { name: '保留我的進度', exact: true }).click();
  await expect(page.locator('.settings-view')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('p1_adventure_save_v1'))).toBe(beforeReset);
  await page.getByRole('button', { name: '‹ 返回主頁', exact: true }).click();

  await page.getByRole('button', { name: '我的獎章', exact: true }).click();
  await expect(page.locator('.trophy-view')).toBeVisible();
  const tabs = page.getByRole('tab');
  expect(await tabs.count()).toBeGreaterThanOrEqual(5);
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.trophy-card').first()).toBeVisible();
});
