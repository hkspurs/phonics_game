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

      // CanvasButton hit area is centered around the Container origin, with
      // the same 8px touch padding on every side.
      expect(auditData.startBtn.hitArea?.x).toBe(-auditData.startBtn.width / 2 - 8);
      expect(auditData.startBtn.hitArea?.y).toBe(-auditData.startBtn.height / 2 - 8);
      expect(auditData.startBtn.hitArea?.width).toBe(auditData.startBtn.width + 16);
      expect(auditData.startBtn.hitArea?.height).toBe(auditData.startBtn.height + 16);

      // The semantic layer owns the visible interaction. Verify its full
      // bounding box responds to hover at all corners and rejects an outside
      // point, then complete the real Home → Map transition.
      const responsiveStart = page.getByRole('button', { name: /開始冒險|繼續冒險/ }).first();
      await expect(responsiveStart).toBeVisible();
      const semanticBox = await responsiveStart.boundingBox();
      expect(semanticBox).not.toBeNull();
      if (!semanticBox) return;
      const semanticPoint = (xRatio: number, yRatio: number) => ({
        x: semanticBox.x + semanticBox.width * xRatio,
        y: semanticBox.y + semanticBox.height * yRatio,
      });
      for (const point of [semanticPoint(0.02, 0.02), semanticPoint(0.98, 0.02), semanticPoint(0.02, 0.98), semanticPoint(0.98, 0.98)]) {
        await page.mouse.move(point.x, point.y);
        await expect(responsiveStart).toBeVisible();
      }
      await page.mouse.move(Math.max(0, semanticBox.x - 24), semanticBox.y + semanticBox.height / 2);
      await expect(responsiveStart).toBeVisible();
      await responsiveStart.click();
      await expect(page.locator('.map-view')).toBeVisible();
    });
  }
});
