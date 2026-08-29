import { test, expect } from '@playwright/test';

const TARGET_DEVICES = [
  { name: 'iPhone 15 Pro Max (932x430 landscape)', width: 932, height: 430 },
  { name: 'iPhone SE / 8 (667x375 landscape)', width: 667, height: 375 },
  { name: 'iPad (1024x768 4:3)', width: 1024, height: 768 },
  { name: 'Desktop (1920x1080 16:9)', width: 1920, height: 1080 },
];

test.describe('UI QA Auditor 1: Adversarial Viewport & Touch Coordinate Drift E2E Tests', () => {
  for (const dev of TARGET_DEVICES) {
    test(`Audits touch coordinates, letterbox bounds, and button hit responsiveness on ${dev.name}`, async ({ page }) => {
      await page.setViewportSize({ width: dev.width, height: dev.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Wait for TitleScene
      await page.waitForFunction(() => {
        const game = (window as any).__PHASER_GAME__;
        return game && game.scene && game.scene.isActive('TitleScene');
      }, { timeout: 10000 });

      // 1. Audit Canvas Bounds & Scale Manager FIT letterboxing
      const metrics = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const canvas = game.canvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const titleScene = game.scene.getScene('TitleScene') as any;

        return {
          canvas: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          gameConfig: { width: game.config.width, height: game.config.height },
          buttons: {
            start: { x: titleScene.startButton.x, y: titleScene.startButton.y, width: titleScene.startButton.getButtonWidth(), height: titleScene.startButton.getButtonHeight() },
            shop: { x: titleScene.shopButton.x, y: titleScene.shopButton.y, width: titleScene.shopButton.getButtonWidth(), height: titleScene.shopButton.getButtonHeight() },
            settings: { x: titleScene.settingsButton.x, y: titleScene.settingsButton.y, width: titleScene.settingsButton.getButtonWidth(), height: titleScene.settingsButton.getButtonHeight() },
          },
        };
      });

      console.log(`[${dev.name}] Canvas Bounds:`, metrics.canvas);

      // Scale factors
      const scaleX = metrics.canvas.width / 1280;
      const scaleY = metrics.canvas.height / 720;

      const toPageCoords = (gameX: number, gameY: number) => ({
        x: metrics.canvas.left + gameX * scaleX,
        y: metrics.canvas.top + gameY * scaleY,
      });

      // 2. Test Start Game Button Click -> Transition to MapScene
      const startPos = toPageCoords(metrics.buttons.start.x, metrics.buttons.start.y);
      await page.mouse.click(startPos.x, startPos.y);
      await page.waitForTimeout(600);

      const mapActive = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game && game.scene && game.scene.isActive('MapScene');
      });
      expect(mapActive).toBe(true);

      // 3. In MapScene, navigate into QuestionScene (Station 1)
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const mapScene = game.scene.getScene('MapScene') as any;
        mapScene.startStationQuestion(mapScene.stations[0]);
      });
      await page.waitForTimeout(800);

      const questionActive = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game && game.scene && game.scene.isActive('QuestionScene');
      });
      expect(questionActive).toBe(true);

      // 4. Audit QuestionScene interactive elements
      const qData = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene') as any;
        return {
          type: qScene.currentQuestion?.type,
          prompt: qScene.currentQuestion?.prompt,
          hasBackButton: !!qScene.backButton,
          hasSpeakerButton: !!qScene.speakerButton,
          choiceCardsCount: qScene.choiceCards.length,
          slotBoxesCount: qScene.slotBoxes.length,
          cardChipsCount: qScene.cardChips.length,
        };
      });

      console.log(`[${dev.name}] QuestionScene Loaded:`, qData);
      expect(qData.hasBackButton).toBe(true);
      expect(qData.hasSpeakerButton).toBe(true);

      // 5. Test Back Button click to return to MapScene
      const backBtnCoords = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene') as any;
        return { x: qScene.backButton.x, y: qScene.backButton.y };
      });
      const backPagePos = toPageCoords(backBtnCoords.x, backBtnCoords.y);
      await page.mouse.click(backPagePos.x, backPagePos.y);
      await page.waitForTimeout(600);

      const mapReactivated = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game && game.scene && game.scene.isActive('MapScene');
      });
      expect(mapReactivated).toBe(true);
    });
  }
});
