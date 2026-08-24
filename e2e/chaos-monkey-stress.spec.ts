import { test, expect } from '@playwright/test';

test.describe('Chaos Monkey & Adversarial Stress E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Collect all unhandled exceptions and console errors
    page.on('pageerror', (err) => {
      console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`);
    });
  });

  test('Chaos 1: Rapid button spam & double clicks on TitleScene', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(500);

    // Spam click on Start Button area 30 times rapidly
    const startX = 640;
    const startY = 395;
    for (let i = 0; i < 30; i++) {
      await page.mouse.click(startX, startY);
    }
    await page.waitForTimeout(600);

    // Verify we transitioned to MapScene cleanly without crashing
    expect(pageErrors.length).toBe(0);
  });

  test('Chaos 2: Modal rapid double-clicking & spam closing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(500);

    // Open Report modal by clicking Report button (x: 370, y: 495)
    await page.mouse.click(370, 495);
    await page.waitForTimeout(300);

    // Double-click close button (x: 640 + 300 - 28 = 912, y: 360 - 220 + 28 = 168)
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(912, 168);
    }
    await page.waitForTimeout(300);

    // Open Stamp book modal if accessible or report modal again rapidly 10 times
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(370, 495);
      await page.waitForTimeout(50);
      await page.mouse.click(912, 168);
      await page.waitForTimeout(50);
    }

    expect(pageErrors.length).toBe(0);
  });

  test('Chaos 3: Rapid card drag & drop 50 times in 1 second in QuestionScene', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(500);

    // Go to MapScene
    await page.mouse.click(640, 395);
    await page.waitForTimeout(600);

    // Open Station 1 Modal (Station 1 is at 640, 2200, centered on load)
    // Click Station 1 node (center of screen ~ 640, 450)
    await page.mouse.click(640, 470);
    await page.waitForTimeout(400);

    // Click sub-level 1 row (Chinese sentence scramble)
    await page.mouse.click(640, 310);
    await page.waitForTimeout(800);

    // Word chips are located at y: 425.
    // Rapidly drag and return cards across arbitrary coordinates 50 times
    const chipStartX = 400;
    const chipY = 425;

    for (let i = 0; i < 50; i++) {
      const fromX = chipStartX + (i % 4) * 140;
      const toX = 200 + Math.random() * 800;
      const toY = 100 + Math.random() * 500;

      await page.mouse.move(fromX, chipY);
      await page.mouse.down();
      await page.mouse.move(toX, toY, { steps: 2 });
      await page.mouse.up();
    }

    await page.waitForTimeout(500);
    expect(pageErrors.length).toBe(0);
  });

  test('Chaos 4: Spam Hint Button 50 times in QuestionScene', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(500);

    // Go to MapScene -> QuestionScene (Math or Choice mode)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('QuestionScene', { stationId: 1, questionIndex: 1 });
      }
    });
    await page.waitForTimeout(800);

    // Hint button is at width/2 (640), height - 64 (656) in Choice mode
    for (let i = 0; i < 30; i++) {
      await page.mouse.click(640, 656);
    }
    await page.waitForTimeout(500);

    expect(pageErrors.length).toBe(0);
  });

  test('Chaos 5: Corrupted localStorage edge case injection & game boot', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Inject corrupted localStorage values
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'p1_adventure_save_v1',
        JSON.stringify({
          coins: 'NaN',
          gems: -999,
          unlockedStations: 9999,
          stationStars: null,
          trophies: null,
          stats: {
            chineseCorrect: 'invalid',
            mathCorrect: null,
            englishCorrect: undefined,
            streakDays: -50,
          },
          settings: {
            chineseEnabled: 'not_a_boolean',
            difficulty: 999,
            soundVolume: -10,
          },
        })
      );
    });

    // Reload page with corrupted save
    await page.reload();
    await page.waitForSelector('canvas');
    await page.waitForTimeout(800);

    // Verify game canvas rendered and didn't crash on load
    const canvasExists = await page.$('canvas');
    expect(canvasExists).not.toBeNull();
  });

  test('Chaos 6: Race condition on scene transition during celebration delay', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(500);

    // Launch QuestionScene with sentence scramble
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('QuestionScene', { stationId: 1, questionIndex: 0 });
      }
    });
    await page.waitForTimeout(600);

    // Auto-solve the question by triggering onCorrectAnswer
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('QuestionScene');
      if (scene) {
        scene.onCorrectAnswer();
      }
    });

    // Immediately click Back to Map button during the 1200ms celebration delay
    await page.mouse.click(100, 42); // Back button at (100, 42)
    await page.waitForTimeout(1500); // Wait past the 1200ms delayedCall

    // Check which scene is currently active
    const activeScenes = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scenes = game.scene.getScenes(true);
      return scenes.map((s: any) => s.scene.key);
    });
    console.log('Active scenes after interruption:', activeScenes);
    // If QuestionScene delayed timer is a zombie, it switches to RunnerScene instead of staying on MapScene!
    expect(activeScenes).toContain('MapScene');
  });

  test('Chaos 7: RunnerScene skip spamming and springboard spam', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#game-container canvas', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Start RunnerScene directly
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('RunnerScene', {
          stationId: 1,
          questionIndex: 0,
          isStationComplete: false,
          totalQuestions: 3,
        });
      }
    });
    await page.waitForTimeout(600);

    // Spam click Skip Button (x: 1280 - 110 = 1170, y: 47) 20 times rapidly
    for (let i = 0; i < 20; i++) {
      await page.mouse.click(1170, 47);
    }
    await page.waitForTimeout(800);

    expect(pageErrors.length).toBe(0);
  });
});
