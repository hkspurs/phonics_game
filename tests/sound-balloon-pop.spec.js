import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const soundsData = JSON.parse(
  readFileSync(path.join(__dirname, '../data/sounds.json'), 'utf8')
);

test.describe('Sound Balloon Pop Game UAT & Integration Tests', () => {
  let latestTargetLabel = '';
  const mp3Requests = [];
  const correctChimes = [];
  const ignoredLabels = new Set();

  test.beforeEach(async ({ page }) => {
    latestTargetLabel = '';
    mp3Requests.length = 0;
    correctChimes.length = 0;
    ignoredLabels.clear();

    // Intercept audio requests to fulfill them and track what got requested
    await page.route('**/*.mp3', route => {
      const url = route.request().url();
      mp3Requests.push(url);

      if (url.includes('correct_chime.mp3')) {
        correctChimes.push(url);
      }

      const matchedSound = soundsData.sounds.find(s => url.endsWith(s.audio_url));
      if (matchedSound) {
        const label = matchedSound.label.trim();
        if (ignoredLabels.has(label)) {
          // Do not delete on first request, keep ignoring it for all retries in this round
        } else {
          latestTargetLabel = matchedSound.label;
        }
      }
      route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: Buffer.alloc(0),
      });
    });
  });

  test('Game flow: navigation, ticket deduction, gameplay, incorrect/correct feedback, combo reset, and victory screen', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Load the home dashboard
    await page.goto('/');

    // Mock Zustand store state in localStorage to have exactly 2 tickets, unlocked sounds
    await page.evaluate(() => {
      localStorage.setItem('phonics-game-storage', JSON.stringify({
        state: {
          tickets: 2,
          stars: 45,
          gems: 12,
          unlockedSounds: ['AB', 'AC'],
          currentNode: 'AB_01',
          gameComplete: false
        },
        version: 2
      }));
    });

    // Reload the page to hydrate the state
    await page.reload();

    // Verify Home Dashboard loaded
    await expect(page.getByText(/Ready to Learn/i)).toBeVisible();

    // Navigate to /braingames via the Brain Games button
    const brainGamesBtn = page.locator('button', { hasText: /Brain Games/i });
    await expect(brainGamesBtn).toBeVisible();
    await brainGamesBtn.click({ force: true });

    // 2. Verifies that the new Balloon Pop game button is present on the /braingames screen
    await expect(page).toHaveURL(/.*braingames/);
    const balloonPopHeading = page.locator('h2', { hasText: 'Balloon Pop' });
    await expect(balloonPopHeading).toBeVisible();
    const balloonPopCard = balloonPopHeading.locator('..');
    
    const playBtn = balloonPopCard.locator('button', { hasText: /Play/i });
    await expect(playBtn).toBeVisible();

    // 3. Clicks the Balloon Pop game button, and verifies that exactly 1 ticket is deducted
    // (and checking that the React 18 StrictMode double-mount does not result in double ticket deduction)
    await playBtn.click({ force: true });
    
    // Wait for the game screen to load
    await expect(page).toHaveURL(/.*games\/soundballoonpop/);

    // Verify that exactly 1 ticket is deducted (should remain 1, not 0)
    const storeState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('phonics-game-storage'))?.state;
    });
    console.log(`Remaining tickets in Zustand store: ${storeState.tickets}`);
    expect(storeState.tickets).toBe(1);

    // 4. Verifies that the game screen loads correctly, plays target audio, and starts spawning balloons
    await expect(page.getByText(/Pop the matching balloon/i)).toBeVisible();
    
    // Check that we captured the initial target sound audio request
    await expect.poll(() => latestTargetLabel).not.toBe('');
    console.log(`Initial target sound label: ${latestTargetLabel}`);

    // Wait for at least one balloon to spawn
    const balloonLocator = page.locator('.balloon-item');
    await expect(balloonLocator.first()).toBeVisible({ timeout: 10000 });

    // Helper function to find and click a balloon based on correctness
    async function clickBalloon(shouldBeCorrect) {
      const count = await balloonLocator.count();
      const labels = [];
      for (let i = 0; i < count; i++) {
        const balloon = balloonLocator.nth(i);
        const className = await balloon.getAttribute('class');
        if (className.includes('popping') || className.includes('shaking')) {
          continue;
        }
        const textContent = await balloon.locator('text').textContent();
        const trimmed = textContent.trim();
        labels.push(trimmed);
        const isCorrect = trimmed === latestTargetLabel.trim();
        if (isCorrect === shouldBeCorrect) {
          if (!shouldBeCorrect) {
            ignoredLabels.add(trimmed);
          } else {
            ignoredLabels.clear();
          }
          await balloon.click({ force: true });
          return { clicked: true, balloon, label: trimmed };
        }
      }
      return { clicked: false };
    }

    // 5. Simulates clicking correct and incorrect balloons, verifying feedback/audio/score/combo
    // Let's get 3 correct clicks first to build a combo of 3
    let correctCount = 0;
    while (correctCount < 3) {
      const res = await clickBalloon(true);
      if (res.clicked) {
        correctCount++;
        // Wait for score indicator to update
        await expect(page.locator('text=Score:')).toContainText(`Score: ${correctCount} / 10`);
        // Wait a short time to clear transition and spawn new balloons
        await page.waitForTimeout(1000);
      } else {
        // Wait for more balloons to spawn
        await page.waitForTimeout(500);
      }
    }

    // Verify combo indicator is visible now (combo = 3 > 2)
    const comboIndicator = page.locator('text=Combo!');
    await expect(comboIndicator).toBeVisible();
    await expect(comboIndicator).toContainText('3 Combo!');

    // Let's click an incorrect balloon to test error feedback and combo reset
    let incorrectClicked = false;
    while (!incorrectClicked) {
      const res = await clickBalloon(false);
      if (res.clicked) {
        incorrectClicked = true;
        // Verify balloon gets shaking animation class
        await expect(page.locator('.balloon-item.shaking')).toBeVisible();
        // Verify combo resets (combo indicator should disappear)
        await expect(comboIndicator).not.toBeVisible();
        // Verify score remains 3
        await expect(page.locator('text=Score: 3 / 10')).toBeVisible();
        await page.waitForTimeout(1000);
      } else {
        await page.waitForTimeout(500);
      }
    }

    // 6. Simulates winning the game by popping 10 correct balloons
    // We already have 3 correct pops, we need 7 more.
    while (correctCount < 10) {
      const res = await clickBalloon(true);
      if (res.clicked) {
        correctCount++;
        await expect(page.locator('text=Score:')).toContainText(`Score: ${correctCount} / 10`);
        await page.waitForTimeout(1000);
      } else {
        await page.waitForTimeout(500);
      }
    }

    // Verify that the confetti (canvas) and victory elements appear
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText(/🎉 You Win! 🎉/i)).toBeVisible();
    await expect(page.locator('text=🏆')).toBeVisible();

    // Verify redirect back to /braingames
    await expect(page).toHaveURL(/.*braingames/, { timeout: 6000 });
  });
});
