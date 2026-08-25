import { test, expect } from '@playwright/test';

test('Live Verify iPhone Touch: All 5 button points (Center, 4 corners) click reliably on GitHub Pages', async ({ page }) => {
  await page.setViewportSize({ width: 932, height: 430 });
  const targetUrl = process.env.LIVE_URL || 'http://localhost:4173/';
  await page.goto(targetUrl);
  await page.waitForTimeout(3000);

  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  console.log(`Live Canvas Box: width=${box.width}, height=${box.height}`);

  const testBtn = async (name: string, dx: number, dy: number) => {
    const coords = await page.evaluate(({ dx, dy, box }) => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      const btn = title.startButton;
      (window as any).__CLICKED__ = false;
      btn.config.onClick = () => { (window as any).__CLICKED__ = true; };
      
      const clientX = box.x + ((btn.x + dx) / game.scale.width) * box.width;
      const clientY = box.y + ((btn.y + dy) / game.scale.height) * box.height;
      return { clientX, clientY };
    }, { dx, dy, box });

    await page.mouse.click(coords.clientX, coords.clientY);
    await page.waitForTimeout(100);
    const success = await page.evaluate(() => (window as any).__CLICKED__);
    console.log(`Live Test ${name} at (${coords.clientX.toFixed(1)}, ${coords.clientY.toFixed(1)}): ${success ? 'PASS' : 'FAIL'}`);
    expect(success).toBe(true);
  };

  await testBtn('Center', 0, 0);
  await testBtn('Top-Left Corner', -150, -30);
  await testBtn('Top-Right Corner', 150, -30);
  await testBtn('Bottom-Left Corner', -150, 30);
  await testBtn('Bottom-Right Corner', 150, 30);
});
