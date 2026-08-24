import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Comprehensive Full Playwright UAT Suite', () => {
  const uatDir = path.join(process.cwd(), 'uat-report-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(uatDir)) {
      fs.mkdirSync(uatDir, { recursive: true });
    }
  });

  test('UAT 1: Title Scene UI, Buttons & Modals', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    await page.screenshot({ path: path.join(uatDir, '01_TitleScene.png') });

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Click "開始遊戲"
    await page.mouse.click(box.x + 640, box.y + 360);
    await page.waitForTimeout(1500);

    const activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('MapScene');
    await page.screenshot({ path: path.join(uatDir, '02_MapScene_Loaded.png') });
  });

  test('UAT 2: MapScene Navigation, Station 1 Modal, and Sub-Level Clicks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Navigate to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      if (title) title.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Click Station 1 node on the map
    console.log('Clicking Station 1 node at (640, 450)...');
    await page.mouse.click(box.x + 640, box.y + 450);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(uatDir, '03_Station1_Modal_Opened_By_Node_Click.png') });

    // Verify modal is open
    const isModalOpen = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      return map && map.activeModal && map.activeModal.visible;
    });
    expect(isModalOpen).toBe(true);

    // Test 1: Click Sub-level 1 [中]
    console.log('Clicking Sub-level 1 [中] at (640, 295)...');
    await page.mouse.click(box.x + 640, box.y + 295);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '04_QuestionScene_Chinese_From_Row1.png') });

    let activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    // Return to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      if (q) q.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Reopen modal and Test 2: Click Sub-level 2 [數]
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);

    console.log('Clicking Sub-level 2 [數] at (640, 367)...');
    await page.mouse.click(box.x + 640, box.y + 367);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '05_QuestionScene_Math_From_Row2.png') });

    activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    // Return to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      if (q) q.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Reopen modal and Test 3: Click Sub-level 3 [英]
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);

    console.log('Clicking Sub-level 3 [英] at (640, 439)...');
    await page.mouse.click(box.x + 640, box.y + 439);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '06_QuestionScene_English_From_Row3.png') });

    activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    // Return to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      if (q) q.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Reopen modal and Test 4: Click Enter Button (⚔️ 進入關卡 (進入))
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);

    console.log('Clicking Enter button at (640, 565)...');
    await page.mouse.click(box.x + 640, box.y + 565);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '07_QuestionScene_From_EnterBtn.png') });

    activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    // Return to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      if (q) q.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Reopen modal and Test 5: Click Close Button (✕)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);

    console.log('Clicking Close button (✕) at (952, 128)...');
    await page.mouse.click(box.x + 952, box.y + 128);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(uatDir, '08_Modal_Closed_Successfully.png') });

    const isModalClosed = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      return map.activeModal === null;
    });
    expect(isModalClosed).toBe(true);

    // Test 6: Click "◀ 返回主頁" top-left button at (100, 42)
    console.log('Clicking "◀ 返回主頁" button at (100, 42)...');
    await page.mouse.click(box.x + 100, box.y + 42);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '09_Back_To_TitleScene.png') });

    activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('TitleScene');
  });

  test('UAT 3: Mobile Viewport 100% Click & Touch Responsiveness', async ({ page }) => {
    // iPhone 15 Pro Max landscape (932x430)
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Navigate to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      if (title) title.scene.start('MapScene');
    });
    await page.waitForTimeout(1200);

    // Open Station 1 Modal
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      map.openStationModal(map.stations[0]);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(uatDir, '10_iPhone_Station1_Modal.png') });

    // Click Enter Button in iPhone viewport
    console.log('Clicking Enter button on iPhone viewport...');
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.785);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(uatDir, '11_iPhone_QuestionScene_Started.png') });

    const activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');
  });
});
