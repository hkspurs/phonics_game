import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('MapScene and Station Modal Click UAT', () => {
  const screenshotDir = path.join(process.cwd(), 'uat-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Click Station 1, test all buttons inside Station Modal', async ({ page }) => {
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // 1. Navigate to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      if (title) title.scene.start('MapScene');
    });

    await page.waitForTimeout(1500);

    // 2. Open Station 1 Modal
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      if (map) {
        const s1 = map.stations[0];
        map.openStationModal(s1);
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02_Station1_Modal_Open.png') });

    // Inspect modal game objects and interactive hit areas
    const modalDebug = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      const modal = map.activeModal;
      if (!modal) return { error: 'No active modal' };

      const content = modal.getContentContainer();
      const closeBtn = modal.closeBtn;

      return {
        modalX: modal.x,
        modalY: modal.y,
        modalDepth: modal.depth,
        modalScrollFactor: modal.scrollFactorX,
        cameraScroll: {
          x: map.cameras.main.scrollX,
          y: map.cameras.main.scrollY,
        },
        contentCount: content ? content.list.length : 0,
        contentChildren: content ? content.list.map((c: any) => ({
          type: c.type,
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
          input: c.input !== null,
          hitArea: c.input ? {
            x: c.input.hitArea?.x,
            y: c.input.hitArea?.y,
            w: c.input.hitArea?.width,
            h: c.input.hitArea?.height,
          } : null,
        })) : [],
        closeBtn: closeBtn ? {
          x: closeBtn.x,
          y: closeBtn.y,
          input: closeBtn.input !== null,
          scrollFactor: closeBtn.scrollFactorX,
        } : null,
      };
    });

    console.log('Modal Debug:', JSON.stringify(modalDebug, null, 2));

    // Test clicking the Close Button (top-right of modal)
    const box = await canvas.boundingBox();
    if (box) {
      // Modal center is (640, 360). Modal width=680, height=520.
      // Close button is at (640 + 340 - 24, 360 - 260 + 24) = (956, 124)
      console.log('Testing close button click at (956, 124)...');
      await page.mouse.click(box.x + 956, box.y + 124);
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(screenshotDir, '03_After_Close_Click.png') });
    }

    const isClosed = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      return map.activeModal === null || !map.activeModal.visible;
    });
    console.log('Modal is closed after clicking close button:', isClosed);

    // Reopen modal and test clicking Row 1 (Chinese)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);

    // Row 1 is at modal center (640), content container y=30, row 1 y=-95 => 360 + 30 - 95 = 295
    console.log('Testing Row 1 [中] click at (640, 295)...');
    if (box) {
      await page.mouse.click(box.x + 640, box.y + 295);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '04_After_Row1_Click.png') });
    }

    const currentSceneAfterRow1 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const activeScenes = game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
      return activeScenes;
    });
    console.log('Active scenes after clicking Row 1:', currentSceneAfterRow1);

    expect(pageErrors).toEqual([]);
  });
});
