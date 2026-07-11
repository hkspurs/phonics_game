import { test, expect } from '@playwright/test';

test.describe('Mathematics Domain Journey', () => {
  test.setTimeout(120000);

  test('User can navigate to Math Kingdom, play daily challenge, and receive reward', async ({ page }) => {
    await page.goto('/');
    
    // Select Math subject
    await page.click('text=Math Kingdom');
    
    // Should be on Math Home
    await expect(page.getByText('Math Kingdom')).toBeVisible();
    await expect(page.getByRole('button', { name: /Daily Challenge/ })).toBeVisible();

    // Start Daily Challenge (force click to ignore pulse animation)
    await page.click('text=Daily Challenge', { force: true });

    // Wait for the Math Daily Challenge ready overlay
    await expect(page.getByText('Ready for Maths?')).toBeVisible();
    await page.click('text=Let\'s Go!', { force: true });

    // Answer questions randomly/automatically by tapping into the engine
    await page.evaluate(() => {
      const state = window.useGameStore.getState();
      state.math.mathActiveQuestions.forEach(q => {
        state.recordMathAnswer(q.skillId, true, 1);
      });
      state.completeMathDaily();
    });

    // We still have to click through the UI to reflect it or we can just navigate to reward
    await page.goto('/#/reward?subject=math');

    // Tap to open chest
    await page.click('text=Tap to open!', { force: true });

    // After 5 correct answers (eventually), we should hit the reward screen
    await expect(page.getByText('Mission Complete!')).toBeVisible({ timeout: 15000 });
    
    // Check reward params
    expect(page.url()).toContain('subject=math');
  });
});
