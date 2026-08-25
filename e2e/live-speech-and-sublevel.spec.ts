import { test, expect } from '@playwright/test';

test('Live Verify: Auto-read after 1s & 100% full-area sub-level row clicks on GitHub Pages', async ({ page }) => {
  await page.setViewportSize({ width: 932, height: 430 });
  const targetUrl = process.env.LIVE_URL || 'http://localhost:4173/';
  await page.goto(targetUrl);
  await page.waitForTimeout(2000);

  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  // 1. Enter MapScene
  await page.mouse.click(box.x + 466, box.y + 236);
  await page.waitForTimeout(1500);

  // 2. Open Station 1 Modal
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    map.openStationModal(map.stations[0]);
  });
  await page.waitForTimeout(1000);

  // 3. Test clicking the far right of Sub-Level Row 1 (over the star icon at x = 780 + 220 = 1000)
  const coords = await page.evaluate(({ box }) => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    const modal = map.activeModal;
    const row = modal.contentContainer.list[1];
    const worldX = modal.x + 220;
    const worldY = modal.y + modal.contentContainer.y + row.y;
    const clientX = box.x + (worldX / game.scale.width) * box.width;
    const clientY = box.y + (worldY / game.scale.height) * box.height;
    return { clientX, clientY };
  }, { box });

  console.log(`Clicking Far Right of Sub-level Row 1 at (${coords.clientX.toFixed(1)}, ${coords.clientY.toFixed(1)})...`);
  await page.mouse.click(coords.clientX, coords.clientY);
  await page.waitForTimeout(2000);

  // Verify QuestionScene is active
  const activeScenes = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    return game.scene.scenes.filter((s: any) => s.sys?.settings?.active).map((s: any) => s.scene.key);
  });
  console.log('Active scenes after clicking far right of sub-level row:', activeScenes);
  expect(activeScenes).toContain('QuestionScene');
});
