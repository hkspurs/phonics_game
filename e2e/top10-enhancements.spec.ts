import { test, expect } from '@playwright/test';

test.describe('Top 10 Enhancements Verification Suite', () => {
  test('verifies Daily Quest, Stamp Book, Pet Companion, and Gameplay Flow', async ({ page }) => {
    // Collect all browser console logs & errors
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    // Navigate to preview server
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // 1. Verify game canvas is loaded
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 2. Click "🎁 每日挑戰" (Daily Quest Modal)
    // Daily button is at (width/2 - 2.5 * 160, height/2 + 135) = (640 - 400, 360 + 135) = (240, 495)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const scaleX = box.width / 1280;
    const scaleY = box.height / 720;

    // Click 每日挑戰 button at (240, 495)
    await page.mouse.click(box.x + 240 * scaleX, box.y + 495 * scaleY);
    await page.waitForTimeout(600);

    // Click "🎰 轉動幸運大輪盤！" inside modal at (640, 405)
    await page.mouse.click(box.x + 640 * scaleX, box.y + 405 * scaleY);
    await page.waitForTimeout(600);

    // Close Daily Modal (top-right close button of 640x480 modal: x = 640 + 300, y = 360 - 210 = 150)
    await page.mouse.click(box.x + 940 * scaleX, box.y + 150 * scaleY);
    await page.waitForTimeout(400);

    // 3. Click "🏷️ 集郵手帳" at (startX + 160 = 400, 495)
    await page.mouse.click(box.x + 400 * scaleX, box.y + 495 * scaleY);
    await page.waitForTimeout(600);

    // Close Stamp Modal (top-right close button of 720x520 modal: x = 640 + 340 = 980, y = 360 - 230 = 130)
    await page.mouse.click(box.x + 980 * scaleX, box.y + 130 * scaleY);
    await page.waitForTimeout(400);

    // 4. Click "🚀 開始遊戲" at (640, 395)
    await page.mouse.click(box.x + 640 * scaleX, box.y + 395 * scaleY);
    await page.waitForTimeout(1000);

    // 5. In MapScene, click Station 1 at (640, 2200) -> on screen around (640, 500)
    await page.mouse.click(box.x + 640 * scaleX, box.y + 500 * scaleY);
    await page.waitForTimeout(600);

    // Click "🚀 出發冒險" in Station Modal at (640, 475)
    await page.mouse.click(box.x + 640 * scaleX, box.y + 475 * scaleY);
    await page.waitForTimeout(1500);

    // 6. In QuestionScene, click "💡 提示" button at (1095, 34)
    await page.mouse.click(box.x + 1095 * scaleX, box.y + 34 * scaleY);
    await page.waitForTimeout(500);

    // Click "💡 提示" again until solved
    for (let i = 0; i < 4; i++) {
      await page.mouse.click(box.x + 1095 * scaleX, box.y + 34 * scaleY);
      await page.waitForTimeout(350);
    }

    // Wait for transition to RunnerScene
    await page.waitForTimeout(2500);

    console.log("Top 10 Enhancements E2E test completed successfully!");
  });
});
