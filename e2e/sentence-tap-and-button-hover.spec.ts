import { test, expect } from '@playwright/test';

test.describe('Sentence Scramble Card Tap & Button Repeated Hover UAT', () => {
  test('Card stays placed when tapped and does not fly back down', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Start directly at QuestionScene with Station 1, Question 0
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      title.scene.start('QuestionScene', {
        stationId: 1,
        questionIndex: 0,
      });
    });
    await page.waitForTimeout(1500);

    // Verify QuestionScene is active
    let activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('QuestionScene');

    // Get cards in the word bank
    const cardInfoBefore = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.cardChips.map((c: any) => ({
        text: c.getText(),
        x: c.x,
        y: c.y,
        slot: c.getCurrentSlot() ? c.getCurrentSlot().getIndex() : null,
      }));
    });
    console.log('Cards before tapping:', cardInfoBefore);
    expect(cardInfoBefore.length).toBeGreaterThan(0);

    // Tap Card 0 (first word chip in bank)
    const card1 = cardInfoBefore[0];
    console.log(`Tapping card 0 "${card1.text}" at (${card1.x}, ${card1.y})...`);
    await page.mouse.click(box.x + card1.x, box.y + card1.y);
    await page.waitForTimeout(600);

    // Check if Card 0 is placed in Slot 0 and STAYS there
    const cardInfoAfter1 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      const c = q.cardChips[0];
      const slot = c.getCurrentSlot();
      return {
        text: c.getText(),
        x: c.x,
        y: c.y,
        slotIndex: slot ? slot.getIndex() : null,
        hasCardInSlot0: q.slotBoxes[0].hasCard(),
      };
    });
    console.log('Card 0 after tap 1:', cardInfoAfter1);
    expect(cardInfoAfter1.slotIndex).toBe(0);
    expect(cardInfoAfter1.hasCardInSlot0).toBe(true);

    // Tap Card 1
    const card2 = cardInfoBefore[1];
    console.log(`Tapping card 1 "${card2.text}" at (${card2.x}, ${card2.y})...`);
    await page.mouse.click(box.x + card2.x, box.y + card2.y);
    await page.waitForTimeout(600);

    const cardInfoAfter2 = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      const c = q.cardChips[1];
      const slot = c.getCurrentSlot();
      return {
        text: c.getText(),
        x: c.x,
        y: c.y,
        slotIndex: slot ? slot.getIndex() : null,
        hasCardInSlot1: q.slotBoxes[1].hasCard(),
      };
    });
    console.log('Card 1 after tap 2:', cardInfoAfter2);
    expect(cardInfoAfter2.slotIndex).toBe(1);
    expect(cardInfoAfter2.hasCardInSlot1).toBe(true);

    // Tap Card 0 inside Slot 0 to remove it back to bank
    const slot0Pos = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      const s = q.slotBoxes[0];
      return { x: s.x, y: s.y };
    });
    console.log(`Tapping card in Slot 0 at (${slot0Pos.x}, ${slot0Pos.y}) to remove it...`);
    await page.mouse.click(box.x + slot0Pos.x, box.y + slot0Pos.y);
    await page.waitForTimeout(600);

    const card0Removed = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      const c = q.cardChips[0];
      return {
        slot: c.getCurrentSlot(),
        hasCardInSlot0: q.slotBoxes[0].hasCard(),
      };
    });
    console.log('Card 0 after removal tap:', card0Removed);
    expect(card0Removed.slot).toBeNull();
    expect(card0Removed.hasCardInSlot0).toBe(false);
  });

  test('Buttons respond to multiple repeated mouse hovers and clicks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    // Hover in, hover out, hover in 5 times on "開始遊戲" (640, 360)
    for (let i = 1; i <= 5; i++) {
      // Hover in
      await page.mouse.move(box.x + 640, box.y + 360);
      await page.waitForTimeout(100);

      // Hover out
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.waitForTimeout(100);
    }

    // Now click on 6th hover
    await page.mouse.move(box.x + 640, box.y + 360);
    await page.waitForTimeout(100);
    await page.mouse.click(box.x + 640, box.y + 360);
    await page.waitForTimeout(1200);

    // Verify MapScene is entered
    const activeScene = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
    });
    expect(activeScene).toContain('MapScene');
  });
});
