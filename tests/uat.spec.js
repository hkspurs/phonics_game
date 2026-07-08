import { test, expect } from '@playwright/test';

test('UAT Flow: App should load, show mascot, and allow navigating to Daily Challenge', async ({ page }) => {
  // Go to the app
  await page.goto('/');

  // Verify Home Dashboard loaded properly
  await expect(page.getByText(/Ready to Learn/i)).toBeVisible();
  
  // Verify the new SVG MascotRabbit is present
  await expect(page.locator('#mascot-rabbit')).toBeVisible();

  // Find the Start Mission button
  const startButton = page.getByRole('button', { name: /Start Today's Mission/i });
  await expect(startButton).toBeVisible();

  // Navigate to Daily Challenge (Force click because the button has an infinite CSS animation)
  await startButton.click({ force: true });

  // Verify Daily Challenge screen loaded
  await expect(page.getByText(/Listen and Choose/i).or(page.getByText(/Final Challenge/i))).toBeVisible();
  
  // Verify ReplayHelper SVG cat is present
  await expect(page.locator('#helper-cat')).toBeVisible();

  // Expect URL to be /challenge
  await expect(page).toHaveURL(/.*challenge/);

  // Dismiss overlay if present
  const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  if (await letsGoBtn.isVisible()) {
    await letsGoBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  // Check that there are choice buttons available
  const choices = page.getByTestId('choice-button');
  expect(await choices.count()).toBeGreaterThan(0);
});
