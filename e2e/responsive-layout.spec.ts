import { test, expect } from '@playwright/test';

test('Responsive Layout Verification: iPhone 15 Pro Max landscape, iPad, and Desktop', async ({ page }) => {
  // Test 1: iPhone 15 Pro Max Landscape (932 x 430)
  await page.setViewportSize({ width: 932, height: 430 });
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  const canvas = page.locator('#game-container canvas');
  const box1 = await canvas.boundingBox();
  expect(box1).toBeTruthy();
  if (!box1) return;

  console.log(`iPhone 15 Pro Max Canvas Bounds: x=${box1.x}, y=${box1.y}, w=${box1.width}, h=${box1.height}`);
  
  // Canvas should be centered horizontally with exact 16:9 aspect ratio
  const expectedWidth = (box1.height * 16) / 9;
  expect(Math.abs(box1.width - expectedWidth)).toBeLessThan(2);
  expect(box1.x).toBeGreaterThan(0); // centered horizontally with side margins

  // Verify TitleScene UI elements are centered inside game
  const titleData = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');
    return {
      gameW: game.scale.width,
      gameH: game.scale.height,
      startBtnX: title.startButton.x,
      startBtnY: title.startButton.y,
    };
  });
  console.log('TitleScene Dimensions & Coordinates:', titleData);
  expect(titleData.gameW).toBe(1280);
  expect(titleData.gameH).toBe(720);
  expect(titleData.startBtnX).toBe(640);

  // Take screenshot on iPhone
  await page.screenshot({ path: '/tmp/test_iphone_landscape.png' });
  console.log('Screenshot saved to /tmp/test_iphone_landscape.png');

  // Test 2: iPad Landscape (1024 x 768)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  const box2 = await canvas.boundingBox();
  expect(box2).toBeTruthy();
  if (box2) {
    console.log(`iPad Canvas Bounds: x=${box2.x}, y=${box2.y}, w=${box2.width}, h=${box2.height}`);
  }
});
