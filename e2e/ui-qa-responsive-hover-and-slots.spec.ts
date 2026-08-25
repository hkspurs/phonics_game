import { test, expect } from '@playwright/test';

test.describe('UI QA: Responsive Multi-Viewport Mouse Hover & Word Slot Placement Suite', () => {
  const viewports = [
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
    { name: 'MacBook (1440x900)', width: 1440, height: 900 },
    { name: 'iPad Pro (1024x768)', width: 1024, height: 768 },
    { name: 'iPhone 15 Pro Max (932x430)', width: 932, height: 430 },
    { name: 'iPhone SE (667x375)', width: 667, height: 375 },
    { name: 'Android Galaxy (915x412)', width: 915, height: 412 },
  ];

  for (const vp of viewports) {
    test(`TitleScene Start Button hover triggers scale animation at center, left, right across ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForTimeout(1500);

      const canvas = page.locator('#game-container canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
      const box = await canvas.boundingBox();
      expect(box).toBeTruthy();
      if (!box) return;

      const scaleX = box.width / 1280;
      const scaleY = box.height / 720;

      // Start Button is centered at (640, 395) with dimensions 320x74
      const btnCenterX = box.x + 640 * scaleX;
      const btnCenterY = box.y + 395 * scaleY;
      const btnLeftX = box.x + (640 - 100) * scaleX;
      const btnRightX = box.x + (640 + 100) * scaleX;

      // 1. Initial State: Button scale should be 1.0
      let startBtnScale = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const title = game.scene.getScene('TitleScene');
        return title.startButton ? { scaleX: title.startButton.scaleX, scaleY: title.startButton.scaleY } : null;
      });
      expect(startBtnScale?.scaleX).toBeCloseTo(1.0, 1);

      // 2. Hover on exact visual center
      await page.mouse.move(btnCenterX, btnCenterY);
      await page.waitForTimeout(200);

      startBtnScale = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const title = game.scene.getScene('TitleScene');
        return title.startButton ? { scaleX: title.startButton.scaleX, scaleY: title.startButton.scaleY } : null;
      });
      expect(startBtnScale?.scaleX).toBeGreaterThan(1.01); // Center triggers hover!

      // 3. Hover out to blank area
      await page.mouse.move(box.x + 50 * scaleX, box.y + 50 * scaleY);
      await page.waitForTimeout(200);

      // 4. Hover on left visual edge
      await page.mouse.move(btnLeftX, btnCenterY);
      await page.waitForTimeout(200);

      let leftHoverScale = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const title = game.scene.getScene('TitleScene');
        return title.startButton ? { scaleX: title.startButton.scaleX } : null;
      });
      expect(leftHoverScale?.scaleX).toBeGreaterThan(1.01); // Left edge triggers hover!

      // 5. Hover out then hover on right visual edge
      await page.mouse.move(box.x + 50 * scaleX, box.y + 50 * scaleY);
      await page.waitForTimeout(200);
      await page.mouse.move(btnRightX, btnCenterY);
      await page.waitForTimeout(200);

      let rightHoverScale = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const title = game.scene.getScene('TitleScene');
        return title.startButton ? { scaleX: title.startButton.scaleX } : null;
      });
      expect(rightHoverScale?.scaleX).toBeGreaterThan(1.01); // Right edge triggers hover!

      // 6. Click Start Button to enter MapScene
      await page.mouse.click(btnCenterX, btnCenterY);
      await page.waitForTimeout(1000);

      const activeScene = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
      });
      expect(activeScene).toContain('MapScene');
    });
  }

  test('Shop purchasing Heroine (30💎) and QuestionScene sentence scramble card placement', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(1500);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // 1. Enter ShopScene directly and buy Heroine (30 gems)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      title.scene.start('ShopScene');
    });

    await page.waitForTimeout(1000);

    // Click Heroine (index 1) and click actionButton
    const buyResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      shop.selectSkin(1); // Select Heroine

      const dm = (window as any).DataManager?.getInstance ? (window as any).DataManager.getInstance() : null;
      if (dm) {
        dm.addGems(50);
      }

      // Click Action Button
      shop.handleActionClick();

      const profile = dm ? dm.getProfile() : null;

      return {
        ownedSkins: profile?.ownedSkins || [],
        equippedSkin: profile?.equippedSkin,
        remainingGems: profile?.gems,
      };
    });

    console.log('Shop Heroine Purchase Result:', buyResult);
    expect(buyResult.ownedSkins).toContain('heroine');
    expect(buyResult.equippedSkin).toBe('heroine');
    expect(buyResult.remainingGems).toBeGreaterThanOrEqual(20);

    // 2. Start QuestionScene Sentence Scramble
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      shop.scene.start('QuestionScene', {
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'test_scramble_verify',
            subject: 'chinese',
            type: 'sentence_scramble',
            prompt: '重組句子：小鳥在天空中飛翔。',
            speakText: '小鳥在天空中飛翔。',
            correctTokens: ['小鳥', '在', '天空', '飛翔', '。'],
            shuffledTokens: ['天空', '。', '小鳥', '飛翔', '在'],
          }
        ]
      });
    });
    await page.waitForTimeout(1200);

    // Get cards in the word bank
    const cardPositions = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.cardChips.map((c: any) => ({
        text: c.getText(),
        x: c.x,
        y: c.y,
      }));
    });

    expect(cardPositions).toHaveLength(5);

    // Tap all 5 chips in bank sequence
    for (let i = 0; i < 5; i++) {
      const card = cardPositions[i];
      await page.mouse.click(box.x + card.x, box.y + card.y);
      await page.waitForTimeout(300);
    }

    // Verify all 5 slots are filled with 0 physical coordinate offset
    const slotSnapVerification = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.slotBoxes.map((s: any) => {
        const card = s.getPlacedCard();
        return {
          hasCard: s.hasCard(),
          slotX: s.x,
          slotY: s.y,
          cardX: card ? card.x : null,
          cardY: card ? card.y : null,
          diffX: card ? Math.abs(card.x - s.x) : null,
          diffY: card ? Math.abs(card.y - s.y) : null,
        };
      });
    });

    console.log('Slot Snap Verification:', slotSnapVerification);
    expect(slotSnapVerification.every((s: any) => s.hasCard)).toBe(true);
    expect(slotSnapVerification.every((s: any) => s.diffX === 0)).toBe(true);
    expect(slotSnapVerification.every((s: any) => s.diffY === 0)).toBe(true);
  });
});
