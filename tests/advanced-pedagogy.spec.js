import { test, expect } from '@playwright/test';

test.describe('Advanced Pedagogy, Persistence & Edge Cases', () => {

  test('Priority 1: Session Persistence & Data Preservation on Reload', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/phonics_game/');
    
    // Check initial state from localStorage
    let stateStr = await page.evaluate(() => window.localStorage.getItem('phonics-game-storage'));
    let state = JSON.parse(stateStr || '{}');
    let initialStars = state?.state?.stars || 0;
    
    // Start the Daily Mission
    const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click({ force: true });
    
    const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
    if (await letsGoBtn.isVisible()) {
      await letsGoBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Attempt to answer a question to update learningStats
    const choiceButtons = page.getByTestId('choice-button');
    const count = await choiceButtons.count();
    
    // Try to get at least one answer to trigger state change
    for (let i = 0; i < count; i++) {
      const btn = choiceButtons.nth(i);
      await expect(btn).toBeEnabled({ timeout: 5000 }).catch(() => {});
      if (await btn.isDisabled()) continue;

      await btn.click({ force: true });
      await page.waitForTimeout(300);

      const wrongFeedback = page.locator('#wrong-feedback-text');
      const correctFeedback = page.locator('#correct-feedback-text');

      if (await wrongFeedback.isVisible()) {
        await page.waitForTimeout(1000);
      } else if (await correctFeedback.isVisible()) {
        await page.waitForTimeout(1500);
        break; // Got one right!
      }
    }

    // SIMULATE CRASH / RELOAD
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify user is back to dashboard without infinite loading or broken state
    await expect(page.locator('button', { hasText: /Start Today's Mission/i })).toBeVisible();

    // Verify localStorage survived the reload
    stateStr = await page.evaluate(() => window.localStorage.getItem('phonics-game-storage'));
    state = JSON.parse(stateStr || '{}');
    
    expect(state.state).toBeDefined();
    expect(state.state.stars).toBeGreaterThanOrEqual(initialStars); // Stars shouldn't decrease
    expect(typeof state.state.learningStats).toBe('object'); // Learning stats should persist
  });


  test('Priority 2: The "Midnight Survivor" (Time-Bound Logic Interruption)', async ({ page }) => {
    // Start session at 11:59:50 PM
    await page.clock.install({ time: new Date('2026-07-06T23:59:50') });
    await page.goto('http://localhost:5173/phonics_game/');
    
    // Start game
    const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
    await startBtn.click({ force: true });
    
    const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
    if (await letsGoBtn.isVisible()) {
      await letsGoBtn.click({ force: true });
    }

    // Mid-game, advance the clock to cross midnight (e.g. 15 seconds)
    if (page.clock.fastForward) {
      await page.clock.fastForward(15000);
    } else {
      await page.evaluate(() => {
        const OriginalDate = window.Date;
        class MockDate extends OriginalDate {
          constructor(...args) {
            if (args.length === 0) return new OriginalDate(new OriginalDate().getTime() + 15000);
            super(...args);
          }
        }
        window.Date = MockDate;
      });
    }
    
    // The user should NOT be kicked out of their session or interrupted
    await expect(page).toHaveURL(/.*challenge/);
    
    // UI should remain fully functional and interactive
    const choiceButtons = page.getByTestId('choice-button');
    expect(await choiceButtons.count()).toBeGreaterThan(0);
  });


  test('Priority 3: The "Flaky Connection" Scaffolding Test', async ({ page }) => {
    // Intercept and ABORT all audio asset requests to simulate network dropping
    // right when scaffolding/hint media is requested
    await page.route('**/*.mp3', route => {
      route.abort('failed');
    });

    await page.goto('http://localhost:5173/phonics_game/');
    
    // Start the game
    const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
    await startBtn.click({ force: true });
    
    const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
    if (await letsGoBtn.isVisible()) {
      await letsGoBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Even though network failed, the UI should not be stuck
    const choiceButtons = page.getByTestId('choice-button');
    expect(await choiceButtons.count()).toBeGreaterThan(0);

    // Pick the first choice. Since audio failed, the system must use .catch() and .finally()
    // gracefully without breaking the React component loop.
    const btn = choiceButtons.nth(0);
    await expect(btn).toBeEnabled({ timeout: 5000 });
    await btn.click({ force: true });
    await page.waitForTimeout(300);

    // Verify that the visual fallback (mascot speech bubble) STILL APPEARS
    // even though the audio engine failed!
    const wrongFeedback = page.locator('#wrong-feedback-text');
    const correctFeedback = page.locator('#correct-feedback-text');

    const reacted = (await wrongFeedback.isVisible()) || (await correctFeedback.isVisible());
    
    // If it didn't react, it means the app crashed due to the unhandled network error
    expect(reacted).toBe(true);
  });
});
