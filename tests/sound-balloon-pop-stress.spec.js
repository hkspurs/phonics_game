import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Sound Balloon Pop Stress and Edge Case Tests', () => {
  
  test('1. Loads home dashboard, navigates to /braingames, and starts the game', async ({ page }) => {
    // Setup state with 5 tickets and daily challenge completed to unlock Brain Games button
    await page.addInitScript(() => {
      window.localStorage.setItem('phonics-game-storage', JSON.stringify({
        state: { tickets: 5, hasCompletedDaily: true }
      }));
    });

    await page.goto('/');
    
    // Verify Home Dashboard loaded
    await expect(page.getByText(/Ready to Learn/i)).toBeVisible();

    // Click the Brain Games button
    const brainGamesBtn = page.locator('button:has-text("Brain Games")');
    await expect(brainGamesBtn).toBeVisible();
    await brainGamesBtn.click({ force: true });

    // Verify routing to /braingames
    await expect(page).toHaveURL(/.*braingames/);

    // Locate the Play button specifically inside the Balloon Pop card using CSS sibling combinator
    const playButton = page.locator('h2:has-text("Balloon Pop") ~ button');
    await expect(playButton).toBeVisible();
    await playButton.click({ force: true });

    // Verify navigating to the game screen
    await expect(page).toHaveURL(/.*soundballoonpop/);
  });

  test('2. Stress test: Rapidly click incorrect balloons', async ({ page }) => {
    // Capture console and uncaught errors to verify stability
    const pageErrors = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('phonics-game-storage', JSON.stringify({
        state: { tickets: 5, hasCompletedDaily: true }
      }));
    });

    // Go directly to the game to start immediately
    await page.goto('#/games/soundballoonpop');

    // Wait for the speaker button to be visible
    const speakerButton = page.locator('button:has(svg.lucide-volume-2), button:has(svg)');
    await expect(speakerButton.first()).toBeVisible({ timeout: 5000 });

    // Verify score is initially 0
    const scoreElement = page.locator('div:has-text("Score:")').last();
    await expect(scoreElement).toBeVisible();
    await expect(scoreElement).toContainText('Score: 0 / 10');

    // Wait for balloons to appear and find an incorrect one dynamically by clicking
    let foundIncorrect = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      const balloons = page.locator('.balloon-item');
      const count = await balloons.count();
      if (count === 0) {
        await page.waitForTimeout(1000);
        continue;
      }

      // Read current score text
      const initialScoreText = await scoreElement.textContent();

      // Click the first balloon
      const balloon = balloons.first();
      await balloon.click({ force: true });
      await page.waitForTimeout(600); // Wait for state updates

      // Check if score changed
      const currentScoreText = await scoreElement.textContent();
      if (initialScoreText === currentScoreText) {
        console.log(`Confirmed balloon is incorrect (Score stayed at "${currentScoreText}"). Rapidly clicking...`);
        // Click rapidly 30 times to stress test
        for (let k = 0; k < 30; k++) {
          await balloon.click({ force: true }).catch(() => {});
        }
        foundIncorrect = true;
        break;
      } else {
        console.log(`Clicked balloon was correct (Score changed from "${initialScoreText}" to "${currentScoreText}"). Waiting for next round...`);
        await page.waitForTimeout(1500); // Wait for new balloons to spawn
      }
    }

    expect(foundIncorrect).toBe(true);

    // Verify no runtime crashes occurred
    expect(pageErrors).toHaveLength(0);
  });

  test('3. Exit button X: Confirm dialog, route back, and verify ticket consumption', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('phonics-game-storage', JSON.stringify({
        state: { tickets: 5, hasCompletedDaily: true }
      }));
    });

    // Go directly to the game
    await page.goto('#/games/soundballoonpop');

    // Wait for the exit button (X)
    const exitButton = page.locator('button:has(svg.lucide-x)');
    await expect(exitButton).toBeVisible();

    // Setup dialog listener to accept the exit confirmation
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain("Quit game? You will lose your ticket!");
      await dialog.accept();
    });

    // Click the exit button
    await exitButton.click({ force: true });

    // Verify navigation back to /braingames
    await expect(page).toHaveURL(/.*braingames/);

    // Verify ticket count is 4 (1 ticket consumed on game load, none refunded on exit)
    const ticketIndicator = page.locator('span:has-text("Tickets")');
    await expect(ticketIndicator).toContainText('4 Tickets');
  });

  test('4. 0 tickets handling: start button disabled and redirect on direct navigation', async ({ page }) => {
    // Inject 0 tickets
    await page.addInitScript(() => {
      window.localStorage.setItem('phonics-game-storage', JSON.stringify({
        state: { tickets: 0, hasCompletedDaily: true }
      }));
    });

    // Navigate to /braingames
    await page.goto('#/braingames');

    // Find play button inside Balloon Pop card
    const playButton = page.locator('h2:has-text("Balloon Pop") ~ button');
    
    // Verify button is disabled and text shows "Need Tickets"
    await expect(playButton).toBeDisabled();
    await expect(playButton).toHaveText('Need Tickets');

    // Attempt direct navigation to the game screen
    await page.goto('#/games/soundballoonpop');

    // Verify it redirects back to /braingames
    await expect(page).toHaveURL(/.*braingames/);
  });
});
