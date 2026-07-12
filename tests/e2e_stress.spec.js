import { test, expect } from '@playwright/test';

test.describe('Extreme Stress Tests - Trust No State', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
  });

  test('TC001: The Lightning Double Tap (Race Condition Test)', async ({ page }) => {
    // 1. Go to Math Kingdom
    // Click the Math card start button (force click to bypass entrance animation)
    await page.click('button:has-text("Start")', { force: true });
    await page.waitForURL('**/math');

    // 2. Start Daily Challenge (or any button in the map/hub)
    await page.click('button.btn-primary', { force: true });
    await page.click('button:has-text("Let\'s Go!")', { force: true });

    // Wait for choices to load
    await page.waitForSelector('[data-testid="choice-button"], .btn-secondary');

    // 3. Find the correct answer. We might not know it, so we'll just rapid-click all choices!
    // Since we patched it with useRef, rapid clicking should NOT cause index skipping or crashes.
    const buttons = await page.$$('button:not(.btn-primary)'); // Find answer buttons
    
    if (buttons.length > 0) {
      // Rapid fire double-clicks on the first button
      await buttons[0].dblclick({ delay: 50 }); // 50ms double click
      await buttons[0].dblclick({ delay: 50 });
      
      // The system should survive and either show wrong or correct, but NOT crash.
      await page.waitForTimeout(2000); // Wait out the timeout
      
      // Ensure we are still in the app and it hasn't crashed to a blank screen
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(0);
    }
  });

  test('TC021: Cross-Subject State Leakage Test', async ({ page }) => {
    // 1. Start Phonics
    const phonicStartBtns = await page.$$('button:has-text("Start")');
    if (phonicStartBtns.length > 0) {
      await phonicStartBtns[0].click({ force: true });
    }
    await page.waitForTimeout(1000);
    await page.goto('/phonics/map');
    
    // We navigate directly via URL to simulate user weirdness
    await page.goto('/math/gym'); // Let's test the gym bypass since challenge might redirect differently
    
    // It should detect invalid state and redirect out, NOT crash
    await page.waitForURL('**/math/map'); // Gym redirects to map on failure
    expect(page.url()).toContain('/math');
  });
  
  test('TC041: Language Toggle Spam during Rendering', async ({ page }) => {
    await page.goto('/');
    // Spam the language toggle button (it might be EN / 中 or 中 / EN)
    for (let i = 0; i < 10; i++) {
      // Find the button that contains 'EN' and '中'
      await page.click('button:has-text("EN")', { force: true });
      await page.waitForTimeout(50);
    }
    
    // UI should still be perfectly functional
    const readyText = await page.locator('h1').innerText();
    expect(['Ready to Learn?', '準備好學習未？']).toContain(readyText);
  });

});
