import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Comprehensive UAT & QA Visual/UX Inspection Suite', () => {
  const screenshotDir = path.join(process.cwd(), 'uat-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('UAT-01: TitleScene layout, typography, buttons, and Report Modal', async ({ page }) => {
    // Set iPhone 14/15 Pro Landscape viewport (844 x 390 -> rendered as 1280x720 base)
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Capture TitleScene
    await page.screenshot({ path: path.join(screenshotDir, '01_TitleScene_Landscape.png') });

    // Click Report Card button
    const box = await canvas.boundingBox();
    if (box) {
      // Click 成績表 button
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.74);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(screenshotDir, '01_ReportCard_Modal.png') });

      // Close modal by clicking outside or close button
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.32);
      await page.waitForTimeout(500);
    }
  });

  test('UAT-02: Portrait Mode Mandatory Rotation Warning Overlay', async ({ page }) => {
    // Set iPhone 14/15 Pro Portrait viewport
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/');

    const warning = page.locator('#orientation-warning');
    await expect(warning).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotDir, '02_Portrait_Orientation_Warning.png') });
  });

  test('UAT-03: MapScene 10-Station Roadmap and Station Modal', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 }); // iPad Landscape
    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(2000);

    // Switch to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) title.scene.start('MapScene');
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03_MapScene_Roadmap.png') });

    // Open Station 1 Modal
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const map = game.scene.getScene('MapScene');
        if (map && (map as any).openStationModal) {
          (map as any).openStationModal(1);
        }
      }
    });

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, '03_Station1_Modal.png') });
  });

  test('UAT-04: QuestionScene Chinese Sentence Scramble with large chips', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 }); // iPhone Landscape
    await page.goto('/');

    await page.waitForTimeout(2000);

    // Start QuestionScene Station 1 (Chinese)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) {
          title.scene.start('QuestionScene', {
            stationId: 1,
            questionIndex: 0,
            questions: [
              {
                id: 'uat_c1',
                subject: 'chinese',
                type: 'sentence_scramble',
                prompt: '請點選字塊，組合成通順的句子：',
                speakText: '姐姐吃餅乾。',
                correctTokens: ['姐姐', '吃', '餅乾', '。'],
                shuffledTokens: ['餅乾', '姐姐', '。', '吃'],
              },
            ],
          });
        }
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '04_QuestionScene_Chinese_Sentence.png') });
  });

  test('UAT-05: QuestionScene Math Calculation with large equation prompt and choices', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    // Start QuestionScene Station 1 (Math)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) {
          title.scene.start('QuestionScene', {
            stationId: 1,
            questionIndex: 1,
            questions: [
              {
                id: 'uat_m1',
                subject: 'math',
                type: 'multiple_choice',
                prompt: '算一算，選出正確的得數：',
                speakText: '7 加 8 等於多少？',
                options: ['13', '14', '15', '16'],
                correctOptionIndex: 2,
              },
            ],
          });
        }
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '05_QuestionScene_Math_Equation.png') });
  });

  test('UAT-06: QuestionScene English Vocab & CVC Phonics', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    // Start QuestionScene Station 1 (English)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) {
          title.scene.start('QuestionScene', {
            stationId: 1,
            questionIndex: 2,
            questions: [
              {
                id: 'uat_e1',
                subject: 'english',
                type: 'sentence_scramble',
                prompt: 'Arrange the word cards to form a sentence:',
                speakText: 'The cat is on the mat .',
                correctTokens: ['The', 'cat', 'is', 'on', 'the', 'mat', '.'],
                shuffledTokens: ['is', 'The', 'on', 'cat', '.', 'the', 'mat'],
              },
            ],
          });
        }
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '06_QuestionScene_English_Sentence.png') });
  });

  test('UAT-07: RunnerScene 2D Platformer action and parallax world', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) {
          title.scene.start('RunnerScene', {
            stationId: 1,
            questionIndex: 0,
            isStationComplete: false,
            totalQuestions: 3,
            sessionStats: { hintsUsed: 0, mistakes: 0, collectedCoins: 5, collectedGems: 1 },
          });
        }
      }
    });

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '07_RunnerScene_Platformer.png') });
  });

  test('UAT-08: ResultScene 3-Star Settlement and Trophy Celebration', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) {
          title.scene.start('ResultScene', {
            stationId: 1,
            sessionStats: { hintsUsed: 0, mistakes: 0, collectedCoins: 12, collectedGems: 3 },
          });
        }
      }
    });

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '08_ResultScene_Settlement.png') });
  });

  test('UAT-09: ShopScene 5-Skin Showcase and live preview', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) title.scene.start('ShopScene');
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '09_ShopScene_Skin_Showcase.png') });
  });

  test('UAT-10: TrophyScene Hall of Fame Categories & Progress', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) title.scene.start('TrophyScene');
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '10_TrophyScene_Hall_Of_Fame.png') });
  });

  test('UAT-11: SettingsScene Subject Switches, Difficulty Slider & Reset', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const title = game.scene.getScene('TitleScene');
        if (title) title.scene.start('SettingsScene');
      }
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotDir, '11_SettingsScene_Preferences.png') });
  });
});
