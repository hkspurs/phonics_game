import { test, expect } from '@playwright/test';
import { answerCurrentQuestion } from './helpers/learning-flow';

test('legacy dynamic mistake opens a truthfully labelled replacement without altering saved rewards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible({ timeout: 15000 });
  const before = await page.evaluate(() => {
    const key = 'p1_adventure_save_v1';
    const profile = JSON.parse(localStorage.getItem(key) || '{}');
    profile.questionAttempts = [{
      questionId: 'legacy_dynamic_math', stationId: 1, subject: 'math',
      knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 0,
      isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: 1,
    }];
    profile.mistakeReviewQueue = ['legacy_dynamic_math'];
    localStorage.setItem(key, JSON.stringify(profile));
    return {
      coins: profile.coins,
      gems: profile.gems,
      ledger: profile.rewardLedger,
      inventory: profile.inventory,
      equippedWardrobe: profile.equippedWardrobe,
    };
  });
  await page.reload();
  await expect(page.locator('.home-view')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: '學習報告', exact: true }).click();
  await page.getByRole('button', { name: /溫習錯題/ }).click();
  await expect(page.locator('.question-view')).toBeVisible();
  await expect(page.locator('.question-view')).toContainText('相同類型練習');
  await answerCurrentQuestion(page);
  const after = await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
    return {
      protectedState: { coins: profile.coins, gems: profile.gems, ledger: profile.rewardLedger, inventory: profile.inventory, equippedWardrobe: profile.equippedWardrobe },
      queue: profile.mistakeReviewQueue,
      retainedOriginalMistake: profile.questionAttempts.some((attempt: { questionId: string; isCorrect: boolean }) => attempt.questionId === 'legacy_dynamic_math' && !attempt.isCorrect),
    };
  });
  expect(after.protectedState).toEqual(before);
  expect(after.queue).not.toContain('legacy_dynamic_math');
  expect(after.retainedOriginalMistake).toBe(true);
});
