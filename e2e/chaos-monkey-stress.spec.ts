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
    await expect(page.getByRole('button', { name: '開始冒險', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '開始冒險', exact: true }).click();
    await expect(page.locator('.map-view')).toBeVisible();

    // Mount a deterministic sentence question and use the visible responsive
    // token controls. The old fixed canvas coordinates depended on a letterbox
    // size and could miss the actual card after the DOM question view mounted.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('QuestionScene', {
        stationId: 1,
        questionIndex: 0,
        questions: [{
          id: 'chaos_drag_sentence',
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '重組句子：請把字詞排列成通順的句子。',
          correctTokens: ['姐姐', '吃', '餅乾', '。'],
          shuffledTokens: ['吃', '。', '姐姐', '餅乾'],
        }],
      });
    });
    await expect.poll(() => page.evaluate(() => (window as any).__PHASER_GAME__?.scene.isActive?.('QuestionScene'))).toBe(true);
    await expect(page.locator('.question-view')).toBeVisible();
    const token = page.locator('button.bank-token').first();
    await expect(token).toBeVisible();
    // Read the rendered DOM rectangle in-page. Playwright's browser-level
    // boundingBox can transiently return null while ScreenHost replaces a
    // token node, even though the element is already painted.
    let tokenBox: { x: number; y: number; width: number; height: number } | null = null;
    await expect.poll(async () => {
      tokenBox = await page.evaluate(() => {
        const rect = document.querySelector('button.bank-token')?.getBoundingClientRect();
        return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
      });
      return tokenBox !== null;
    }, { timeout: 5000, intervals: [50, 100, 250] }).toBe(true);
    expect(tokenBox).not.toBeNull();
    if (!tokenBox) return;
    const chipX = tokenBox.x + tokenBox.width / 2;
    const chipY = tokenBox.y + tokenBox.height / 2;

    for (let i = 0; i < 50; i++) {
      const toX = tokenBox.x + tokenBox.width + 80 + (i % 5) * 20;
      const toY = tokenBox.y - 40 - (i % 4) * 12;

      await page.mouse.move(chipX, chipY);
      await page.mouse.down();
      await page.mouse.move(toX, toY);
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
    await expect(page.getByRole('button', { name: '開始冒險', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '開始冒險', exact: true }).click();
    await expect(page.locator('.map-view')).toBeVisible();

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
    await expect(page.getByRole('button', { name: '開始冒險', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '開始冒險', exact: true }).click();
    await expect(page.locator('.map-view')).toBeVisible();

    // Launch QuestionScene with sentence scramble
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('QuestionScene', { stationId: 1, questionIndex: 0 });
      }
    });
    await expect.poll(() => page.evaluate(() => (window as any).__PHASER_GAME__?.scene.isActive?.('QuestionScene'))).toBe(true);
    await expect(page.locator('.question-view')).toBeVisible();

    // Auto-solve the question by triggering onCorrectAnswer
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('QuestionScene');
      if (scene) {
        scene.onCorrectAnswer();
      }
    });

    // Immediately use the visible QuestionView back control during the
    // celebration state. It is the supported input owner when mounted.
    await expect(page.getByRole('button', { name: '‹ 地圖', exact: true })).toBeVisible();
    // The celebration transition can replace the DOM node in the same frame;
    // dispatch the click on the visible owner immediately after it appears.
    await page.locator('button.question-back').dispatchEvent('click');
    await expect.poll(
      () => page.evaluate(() => (window as any).__PHASER_GAME__?.scene.isActive?.('MapScene')),
      { timeout: 10000, intervals: [100, 250, 500] }
    ).toBe(true);
    await expect(page.locator('.map-view')).toBeVisible();

    // Check which scene is currently active
    const activeScenes = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scenes = game.scene.getScenes(true);
      return scenes.map((s: any) => s.scene.key);
    });
    console.log('Active scenes after interruption:', activeScenes);
    // If QuestionScene's delayed timer were a zombie, it would replace the map
    // after the user already navigated away. The map must remain active.
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
