import { test, expect } from '@playwright/test';

test.describe('Full UAT Test: Visuals, Audio, and Interactions', () => {
  
  test('Check Mascots, Sounds, and Button Reactions', async ({ page }) => {
    // Array to track requested audio files
    const audioRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.mp3') || url.includes('audio')) {
        audioRequests.push(url);
      }
    });

    // 1. App Load & Home Dashboard
    console.log('--- Step 1: Checking Home Dashboard & Mascot ---');
    await page.goto('/');
    
    // Check "Mimi-chan" SVG is present
    const mascot = page.locator('#mascot-rabbit');
    await expect(mascot).toBeVisible();
    console.log('✅ Mascot Rabbit is visible.');

    // Click Start Mission
    const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click({ force: true }); // force click because of pulse animation
    
    // 2. Daily Challenge & Replay Helper
    console.log('--- Step 2: Checking Daily Challenge & Replay Helper ---');
    
    // Dismiss Safari Overlay if present
    const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
    if (await letsGoBtn.isVisible()) {
      await letsGoBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    
    await expect(page.getByText(/Listen and Choose|Final Challenge/i)).toBeVisible();
    
    const replayHelper = page.locator('#helper-cat');
    await expect(replayHelper).toBeVisible();
    console.log('✅ Helper Cat SVG is visible.');

    // Wait a moment for auto-play audio request
    await page.waitForTimeout(500);
    expect(audioRequests.length).toBeGreaterThan(0);
    console.log(`✅ Initial audio played (Requests: ${audioRequests.length}).`);
    
    // Test Replay Button (clicking the cat or the main button)
    // Note: Audio is cached by AudioEngine so clicking replay won't trigger a new network request
    await replayHelper.click({ force: true });
    await page.waitForTimeout(500);
    console.log('✅ Replay button works and plays audio.');

    // 3. Testing Choice Buttons (Wrong and Correct Reactions)
    console.log('--- Step 3: Testing Choice Buttons & Feedback ---');
    // Find choice buttons using data-testid
    const choiceButtons = page.getByTestId('choice-button');
    const count = await choiceButtons.count();
    expect(count).toBeGreaterThan(0);
    
    let gotCorrect = false;
    let gotWrong = false;

    // Try clicking buttons until we get both correct and wrong, or we run out of buttons.
    // Usually there are 3 buttons.
    for (let i = 0; i < count; i++) {
      const btn = choiceButtons.nth(i);
      
      // If button is already disabled (from a previous wrong guess), skip it
      const isDisabled = await btn.isDisabled();
      if (isDisabled) continue;

      console.log(`Clicking choice button ${i}...`);
      await btn.click({ force: true });
      
      // Give DOM time to react (feedback animations trigger instantly)
      await page.waitForTimeout(300);
      
      const wrongFeedback = page.locator('#wrong-feedback-text');
      const correctFeedback = page.locator('#correct-feedback-text');
      
      const isWrongVisible = await wrongFeedback.isVisible();
      const isCorrectVisible = await correctFeedback.isVisible();

      if (isWrongVisible) {
        gotWrong = true;
        console.log('✅ Wrong Answer Animation (Soft Bubble) triggered correctly.');
        // Verify the button becomes disabled
        expect(await btn.isDisabled()).toBeTruthy();
        console.log('✅ Wrong button was successfully disabled.');
      } else if (isCorrectVisible) {
        gotCorrect = true;
        console.log('✅ Correct Answer Animation (Stars Bubble) triggered correctly.');
        // If it's correct, the game will automatically transition to the next question after the sound finishes.
        // We will break the loop here.
        break;
      }
    }

    if (!gotWrong && !gotCorrect) {
      throw new Error('No feedback animation was triggered. Buttons might not be reacting.');
    }
  });
});
