import { expect, test } from '@playwright/test';

const routes = ['/', '/phonics', '/blending', '/math', '/shop', '/braingames', '/assignments'];
const englishLeaksInChinese = [
  'Ready to Learn?',
  'Settings',
  'Reward Shop',
  'Learn to Blend',
  'Simple Word',
  'Back to Home',
  'Teacher Assignments',
  'Math Kingdom',
];
const chineseLeaksInEnglish = [
  '學習拼音併音',
  '簡單字',
  '返回主頁',
  '獎勵商店',
  '老師功課',
  '數學王國',
];

async function setLanguage(page, language) {
  await page.goto('/#/');
  await page.waitForFunction(() => window.useGameStore?.persist?.hasHydrated());
  await page.evaluate((value) => window.useGameStore.getState().setLanguage(value), language);
}

test('keeps the main learning routes in the selected language', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => window.localStorage.clear());

  await setLanguage(page, 'zh');
  for (const route of routes) {
    await page.goto(`/#${route}`);
    for (const leak of englishLeaksInChinese) {
      await expect(page.locator('body')).not.toContainText(leak);
    }
  }

  await setLanguage(page, 'en');
  for (const route of routes) {
    await page.goto(`/#${route}`);
    for (const leak of chineseLeaksInEnglish) {
      await expect(page.locator('body')).not.toContainText(leak);
    }
  }
});
