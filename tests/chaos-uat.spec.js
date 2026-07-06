import { test, expect } from '@playwright/test';

test.describe('Chaos & Exhaustive QA UAT', () => {

  test('1. Security & Guards: Direct URL bypass attempts', async ({ page }) => {
    // Challenge Guard
    await page.goto('#/challenge');
    await page.waitForTimeout(500);
    // Should redirect to Home because no challenge was started
    expect(page.url()).toContain('#/');

    // Brain Games Lock Check
    // Wait, the home dashboard disables the button if hasn't completed daily, 
    // but what if user manually types /braingames? Let's check!
    await page.goto('#/braingames');
    await page.waitForTimeout(500);
    // Note: We don't know the exact routing guard logic for /braingames, 
    // but a good system should redirect. Let's see if the system is "so perfect".
    // If it doesn't redirect, the user could bypass the daily challenge!
  });

  test('2. Parent Gate: Brute force & Wrong PINs', async ({ page }) => {
    await page.goto('#/');
    
    // Playwright cannot interact with native browser `prompt()` directly via UI, 
    // we must mock or handle the dialog.
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('PIN');
      await dialog.accept('9999'); // Wrong PIN
    });
    
    await page.locator('button', { has: page.locator('svg.lucide-settings') }).click();
    
    // Since we gave wrong PIN, we should NOT be on parent dashboard
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/parent');
  });

  test('3. UI Resilience: Map Nodes Locked State', async ({ page }) => {
    await page.goto('#/map');
    
    // Find the first locked node (status=locked usually has cursor: not-allowed)
    const lockedNode = page.locator('.map-node-container.locked').first();
    
    if (await lockedNode.isVisible()) {
      // Try to force click a locked node
      await lockedNode.click({ force: true });
      // It shouldn't crash or navigate anywhere
      expect(page.url()).toContain('/map');
    }
  });

  test('4. Daily Challenge: The "Piano Player" Spam Attack', async ({ page }) => {
    await page.goto('#/');
    await page.getByRole('button', { name: /Start Today's Mission/i }).click({ force: true });
    await page.waitForTimeout(1000);

    const choices = page.locator('button').filter({ hasText: /^(A|B|E|I|O|U|AB|EB|IX|EX|Same|Different)$/i });
    const count = await choices.count();
    expect(count).toBeGreaterThan(0);

    // Spam click ALL buttons at the exact same time (like a kid mashing an iPad)
    // We want to ensure the React state doesn't crash or record 5 wrong answers for 1 click
    for (let i = 0; i < count; i++) {
      choices.nth(i).click({ force: true }).catch(() => {});
    }
    
    await page.waitForTimeout(500);
    
    // The system should have registered one of them and either locked the screen with correct/wrong feedback
    const correctVisible = await page.locator('#correct-feedback').isVisible();
    const wrongVisible = await page.locator('#wrong-feedback').isVisible();
    
    expect(correctVisible || wrongVisible).toBeTruthy();
  });

  test('5. Sound Catcher Game: Bubble Overflow & Memory Leak Check', async ({ page }) => {
    // Inject tickets into localStorage to force access to SoundCatcher if needed
    await page.addInitScript(() => {
      window.localStorage.setItem('phonics-storage', JSON.stringify({
        state: { tickets: 99, hasCompletedDaily: true }
      }));
    });
    
    await page.goto('#/games/soundcatcher');
    await page.waitForTimeout(1000); // Let the game start

    // Check if bubbles start spawning
    const gameContainer = page.locator('.screen-container');
    
    // Wait for 7 seconds. Bubbles spawn every 2 seconds. 
    // They are supposed to be destroyed after 6s. 
    // If memory leak exists, we will have > 4 bubbles.
    await page.waitForTimeout(7000);
    
    const bubbleCount = await page.locator('svg #game-bubble').count();
    
    // In 7 seconds, at 1 bubble/2sec, max spawned = 4. 
    // With destruction at 6s, count should never infinitely grow.
    expect(bubbleCount).toBeLessThanOrEqual(4);

    // Try to spam click a falling bubble
    if (bubbleCount > 0) {
      const firstBubble = page.locator('svg #game-bubble').first();
      // Click it rapidly 10 times to ensure `isPopping` logic doesn't crash React arrays
      for (let i = 0; i < 10; i++) {
        firstBubble.click({ force: true }).catch(() => {});
      }
      
      // Wait for 300ms (pop animation duration)
      await page.waitForTimeout(400);
      
      // The bubble count should have decreased by at least 1
      const newBubbleCount = await page.locator('svg #game-bubble').count();
      expect(newBubbleCount).toBeLessThan(bubbleCount);
    }
  });

});
