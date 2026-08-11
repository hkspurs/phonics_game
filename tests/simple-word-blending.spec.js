import path from 'node:path';
import { test, expect } from '@playwright/test';

const shortAudio = path.join(
  process.cwd(),
  'public/assets/kenney/interface-sounds/Audio/click_001.ogg',
);

async function installShortAudio(page) {
  await page.route('**/assets/simple-words/**/*.mp3', (route) => route.fulfill({
    path: shortAudio,
    contentType: 'audio/mpeg',
  }));
}

async function resetBrowserState(page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function openLearnAndTest(page) {
  await page.goto('/#/phonics');
  await page.getByRole('button', { name: /Learn to Blend/ }).click();
  await expect(page).toHaveURL(/#\/simple-words\?mode=learn/);
  await expect(page.getByRole('heading', { name: 'Learn to Blend' })).toBeVisible();

  for (let index = 0; index < 16; index += 1) {
    const nextLabel = index === 15 ? 'Start test' : 'Next word';
    const next = page.getByRole('button', { name: nextLabel });
    await expect(next).toBeEnabled({ timeout: 10000 });
    await next.click();
  }

  await expect(page.getByRole('heading', { name: 'Test Your Blending' })).toBeVisible();
}

async function enterAnswer(page, word) {
  for (const letter of word) {
    await page.getByRole('button', { name: letter, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Submit / 確定' }).click();
}

test.describe('Simple Word continuous blending UAT', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserState(page);
    await installShortAudio(page);
  });

  test('teaches, tests 16 unique words, requests dedicated blend audio, and awards diamonds', async ({ page }) => {
    test.setTimeout(120000);
    const audioRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/assets/simple-words/')) audioRequests.push(request.url());
    });

    await openLearnAndTest(page);

    const seenWords = new Set();
    for (let index = 0; index < 16; index += 1) {
      const testWord = page.getByTestId('test-word');
      const word = await testWord.getAttribute('data-word');
      expect(word).toHaveLength(3);
      expect(seenWords.has(word)).toBe(false);
      seenWords.add(word);

      await enterAnswer(page, word);
      if (index < 15) {
        await expect(page.getByText(`${index + 2} / 16`)).toBeVisible();
      }
    }

    expect(seenWords.size).toBe(16);
    await expect(page.getByRole('heading', { name: 'Learn & Test Complete!' })).toBeVisible();
    await expect(page.getByText('Earned: +18 💎')).toBeVisible();
    expect(audioRequests.some((url) => url.includes('/blends/'))).toBe(true);
    expect(audioRequests.some((url) => url.includes('/generated/'))).toBe(true);
  });

  test('keeps the same word after an incorrect test answer without negative scoring', async ({ page }) => {
    test.setTimeout(60000);
    await openLearnAndTest(page);

    const testWord = page.getByTestId('test-word');
    const firstWord = await testWord.getAttribute('data-word');
    await enterAnswer(page, 'QWX');

    await expect(page.getByText('差少少，再聽一次 🌟')).toBeVisible();
    await expect(page.getByText(/Wrong/i)).not.toBeVisible();
    await expect(page.getByText(/-1/)).not.toBeVisible();
    await expect(testWord).toHaveAttribute('data-word', firstWord);
  });

  test('keeps a market purchase after closing and reopening the browser page', async ({ page }) => {
    await page.goto('/#/shop');
    const item = page.getByRole('heading', { name: 'Cool Glasses' }).locator('..');
    await item.getByRole('button', { name: /Buy/ }).click();
    await item.getByRole('button', { name: 'Equip' }).click();
    await expect(item.getByRole('button', { name: /Equipped/ })).toBeVisible();

    await page.reload();
    const reloadedItem = page.getByRole('heading', { name: 'Cool Glasses' }).locator('..');
    await expect(reloadedItem.getByRole('button', { name: /Equipped/ })).toBeVisible();
  });
});
