import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop 1920x1080 (16:9)', width: 1920, height: 1080 },
  { name: 'MacBook 1440x900 (16:10)', width: 1440, height: 900 },
  { name: 'iPad Pro 1024x768 (4:3)', width: 1024, height: 768 },
  { name: 'iPhone 15 Pro Max 932x430 (wide landscape)', width: 932, height: 430 },
  { name: 'iPhone SE 667x375 (compact landscape)', width: 667, height: 375 },
  { name: 'Galaxy S20 915x412 (tall aspect)', width: 915, height: 412 },
];

test.describe('Adversarial HitArea & Mouse Hover Coordinate Alignment Auditor Across 6 Viewports', () => {
  for (const vp of VIEWPORTS) {
    test(`Audits CanvasButton, Map Nodes, and Responsive Coordinate Alignment on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // 1. Wait for TitleScene to be active
      await page.waitForFunction(() => {
        const game = (window as any).__PHASER_GAME__;
        return game && game.scene && game.scene.isActive('TitleScene');
      }, { timeout: 10000 });

      // 2. Extract Canvas and StartButton geometric properties
      const auditData = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const titleScene = game.scene.getScene('TitleScene') as any;
        const startBtn = titleScene.startButton;
        const canvas = game.canvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        return {
          canvasBounds: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          gameSize: { width: game.config.width, height: game.config.height },
          startBtn: {
            x: startBtn.x,
            y: startBtn.y,
            width: startBtn.getButtonWidth(),
            height: startBtn.getButtonHeight(),
            scaleX: startBtn.scaleX,
            scaleY: startBtn.scaleY,
            hitArea: startBtn.input?.hitArea ? {
              x: startBtn.input.hitArea.x,
              y: startBtn.input.hitArea.y,
              width: startBtn.input.hitArea.width,
              height: startBtn.input.hitArea.height,
            } : null,
          },
        };
      });

      console.log(`[${vp.name}] Canvas Bounds:`, auditData.canvasBounds);
      console.log(`[${vp.name}] Start Button HitArea:`, auditData.startBtn.hitArea);

      // Hit area MUST be symmetric (-pad, -pad) without origin offset
      expect(auditData.startBtn.hitArea?.x).toBe(-8);
      expect(auditData.startBtn.hitArea?.y).toBe(-8);
      expect(auditData.startBtn.hitArea?.width).toBe(auditData.startBtn.width + 16);
      expect(auditData.startBtn.hitArea?.height).toBe(auditData.startBtn.height + 16);

      const scaleX = auditData.canvasBounds.width / 1280;
      const scaleY = auditData.canvasBounds.height / 720;

      const worldToPage = (wx: number, wy: number) => ({
        x: auditData.canvasBounds.left + wx * scaleX,
        y: auditData.canvasBounds.top + wy * scaleY,
      });

      const btnX = auditData.startBtn.x;
      const btnY = auditData.startBtn.y;
      const halfW = auditData.startBtn.width / 2;
      const halfH = auditData.startBtn.height / 2;

      const getBtnScale = async () => {
        return await page.evaluate(() => {
          const game = (window as any).__PHASER_GAME__;
          const titleScene = game.scene.getScene('TitleScene') as any;
          return {
            scaleX: titleScene.startButton.scaleX,
            scaleY: titleScene.startButton.scaleY,
          };
        });
      };

      // TEST 1: Center of button -> MUST TRIGGER HOVER (scale = 1.05)
      const centerPos = worldToPage(btnX, btnY);
      await page.mouse.move(centerPos.x, centerPos.y);
      await page.waitForTimeout(200);
      let scale = await getBtnScale();
      expect(scale.scaleX).toBeGreaterThan(1.02);

      // TEST 2: Top-Right corner inside button -> MUST TRIGGER HOVER (scale = 1.05)
      const topRightPos = worldToPage(btnX + halfW - 10, btnY - halfH + 10);
      await page.mouse.move(topRightPos.x, topRightPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBeGreaterThan(1.02);

      // TEST 3: Bottom-Right corner inside button -> MUST TRIGGER HOVER (scale = 1.05)
      const bottomRightPos = worldToPage(btnX + halfW - 10, btnY + halfH - 10);
      await page.mouse.move(bottomRightPos.x, bottomRightPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBeGreaterThan(1.02);

      // TEST 4: Top-Left corner inside button -> MUST TRIGGER HOVER (scale = 1.05)
      const topLeftPos = worldToPage(btnX - halfW + 10, btnY - halfH + 10);
      await page.mouse.move(topLeftPos.x, topLeftPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBeGreaterThan(1.02);

      // TEST 5: Bottom-Left corner inside button -> MUST TRIGGER HOVER (scale = 1.05)
      const bottomLeftPos = worldToPage(btnX - halfW + 10, btnY + halfH - 10);
      await page.mouse.move(bottomLeftPos.x, bottomLeftPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBeGreaterThan(1.02);

      // TEST 6: Far Left Outside (80px beyond left edge) -> MUST NOT TRIGGER HOVER (scale = 1.0)
      const phantomLeftPos = worldToPage(btnX - halfW - 80, btnY);
      await page.mouse.move(phantomLeftPos.x, phantomLeftPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBe(1.0);

      // TEST 7: Far Right Outside (80px beyond right edge) -> MUST NOT TRIGGER HOVER (scale = 1.0)
      const phantomRightPos = worldToPage(btnX + halfW + 80, btnY);
      await page.mouse.move(phantomRightPos.x, phantomRightPos.y);
      await page.waitForTimeout(200);
      scale = await getBtnScale();
      expect(scale.scaleX).toBe(1.0);

      // TEST 8: Real Mouse Click on StartButton transitions scene to MapScene
      await page.mouse.move(centerPos.x, centerPos.y);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.up();
      await page.waitForTimeout(600);

      const sceneKey = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game.scene.getScenes(true).map((s: any) => s.scene.key);
      });
      console.log(`[${vp.name}] Active Scenes after Start Button Click:`, sceneKey);
      expect(sceneKey).toContain('MapScene');
    });
  }
});
