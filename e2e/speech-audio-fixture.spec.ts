import { test, expect } from '@playwright/test';
import { installSpeechFixture, latestSpeech } from './helpers/speech-fixture';

test('missing Cantonese voice reports a truthful text fallback without Mandarin substitution', async ({ page }) => {
  await installSpeechFixture(page, [{ name: 'QA Mandarin', lang: 'zh-CN', default: true }]);
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.locator('.settings-view')).toBeVisible();
  await page.getByRole('button', { name: '廣東話 (zh-HK)', exact: true }).click();
  await expect(page.locator('.support-status')).toContainText('呢部裝置暫時未有廣東話朗讀，可以先睇文字。');
  const spoken = await latestSpeech(page);
  expect(spoken?.voiceName ?? null).not.toBe('QA Mandarin');
});
