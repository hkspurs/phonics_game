import { test, expect } from '@playwright/test';
import { exactTextPattern } from './helpers/learning-flow';

test.describe('Sentence Scramble Card Tap & Button Repeated Hover UAT', () => {
  test('Card stays placed when tapped and does not fly back down', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Start directly at QuestionScene with Station 1, Question 0
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      title.scene.start('QuestionScene', {
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'test_zh_scramble',
            subject: 'chinese',
            type: 'sentence_scramble',
            prompt: '重組句子：請把字詞排列成通順的句子。',
            correctTokens: ['姐姐', '吃', '餅乾', '。'],
            shuffledTokens: ['吃', '。', '姐姐', '餅乾'],
          }
        ]
      });
    });
    await expect(page.locator('.question-view')).toBeVisible();

    // Verify QuestionScene is active
    let activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    const firstToken = page.locator('button.bank-token').filter({ hasText: exactTextPattern('吃') }).first();
    const secondToken = page.locator('button.bank-token').filter({ hasText: exactTextPattern('。') }).first();
    await expect(firstToken).toBeVisible();
    await expect(secondToken).toBeVisible();

    // The semantic responsive layer is the production interaction path. Tap
    // two tokens, verify they stay in the answer slots, then remove one via
    // its accessible placed-token control.
    await firstToken.click();
    await secondToken.click();
    await expect(page.locator('button.placed-token')).toHaveCount(2);
    await expect(page.locator('button.placed-token').nth(0)).toHaveText('吃');
    await expect(page.locator('button.placed-token').nth(1)).toHaveText('。');

    await page.locator('button.placed-token').nth(0).click();
    await expect(page.locator('button.placed-token')).toHaveCount(1);
    await expect(page.locator('button.placed-token').first()).toHaveText('。');
    await expect(page.locator('button.bank-token').filter({ hasText: exactTextPattern('吃') })).toHaveCount(1);

    const cardState = await page.evaluate(() => {
      const q = (window as any).__PHASER_GAME__?.scene.getScene('QuestionScene');
      return {
        active: Boolean(q),
        filledSlots: q?.slotBoxes?.filter((slot: any) => slot.hasCard()).length ?? 0,
      };
    });
    expect(cardState.active).toBe(true);
    expect(cardState.filledSlots).toBe(1);
  });

  test('Buttons respond to multiple repeated mouse hovers and clicks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Hover in, hover out, hover in 5 times on "開始遊戲" (640, 360)
    for (let i = 1; i <= 5; i++) {
      // Hover in
      await page.mouse.move(box.x + 640, box.y + 360);
      await page.waitForTimeout(100);

      // Hover out
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.waitForTimeout(100);
    }

    // The migrated home presentation owns the semantic action. Keep the
    // canvas hover pass above as a regression for the fallback renderer, then
    // activate the visible responsive button for the real browser journey.
    await page.mouse.move(box.x + 640, box.y + 360);
    await page.waitForTimeout(100);
    const responsiveStart = page.getByRole('button', { name: /開始冒險|繼續冒險/ });
    if (await responsiveStart.count()) {
      await responsiveStart.click();
    } else {
      await page.mouse.click(box.x + 640, box.y + 360);
    }
    await page.waitForTimeout(1200);

    // Verify MapScene is entered
    const activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('MapScene');
  });
});
