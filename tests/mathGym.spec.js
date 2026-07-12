import { test, expect } from '@playwright/test';

test.describe('Math Training Gym UAT', () => {

  test('User can open Math Training Gym from Math Home', async ({ page }) => {
    // Navigate to Gateway and go to Math Kingdom
    await page.goto('/#/');
    await page.getByText('Math Kingdom').click();

    // Click Training Gym
    await expect(page.getByText('Training Gym')).toBeVisible();
    await page.getByText('Training Gym').click();

    // Verify we are in the Gym
    await expect(page.getByText('Math Gym')).toBeVisible();
    
    // There should be a question rendered (e.g. choice buttons or items)
    const buttons = page.locator('button');
    await expect(buttons).not.toHaveCount(0);
    
    // Check for the mascot
    await expect(page.locator('svg').first()).toBeVisible();
  });

});
