import { test, expect } from '@playwright/test';

test('Live Verify: Choice Quiz and Sentence Scramble on Live GitHub Pages', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('https://hkspurs.github.io/phonics_game/?_t=' + Date.now());
  await page.waitForTimeout(3000);

  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  // 1. Hover repeated test on TitleScene
  for (let i = 1; i <= 3; i++) {
    await page.mouse.move(box.x + 640, box.y + 360);
    await page.waitForTimeout(80);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.waitForTimeout(80);
  }
  await page.mouse.move(box.x + 640, box.y + 360);
  await page.mouse.click(box.x + 640, box.y + 360);
  await page.waitForTimeout(1500);

  // 2. Open Sentence Scramble directly to test card tap & stay
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    map.scene.start('QuestionScene', {
      stationId: 1,
      questions: [
        {
          id: 'test_scramble_1',
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '重組句子：請把字詞排列成通順的句子。',
          correctTokens: ['爸爸', '看', '報紙', '。'],
          shuffledTokens: ['。', '報紙', '爸爸', '看'],
        }
      ]
    });
  });
  await page.waitForTimeout(1500);

  // Get word chips
  const cardData = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    return q.cardChips.map((c: any) => ({
      text: c.getText(),
      x: c.x,
      y: c.y,
    }));
  });
  console.log('Sentence Scramble Word Chips:', cardData);
  expect(cardData.length).toBe(4);

  // Tap Word Chip 0
  console.log(`Tapping chip 0 "${cardData[0].text}" at (${cardData[0].x}, ${cardData[0].y})...`);
  await page.mouse.click(box.x + cardData[0].x, box.y + cardData[0].y);
  await page.waitForTimeout(600);

  // Verify chip 0 entered slot 0 and STAYS in slot 0
  const chip0Status = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    const c = q.cardChips[0];
    return {
      text: c.getText(),
      slotIndex: c.getCurrentSlot() ? c.getCurrentSlot().getIndex() : null,
      hasCardInSlot0: q.slotBoxes[0].hasCard(),
    };
  });
  console.log('Chip 0 status after tap:', chip0Status);
  expect(chip0Status.slotIndex).toBe(0);
  expect(chip0Status.hasCardInSlot0).toBe(true);

  // Tap Word Chip 1
  console.log(`Tapping chip 1 "${cardData[1].text}" at (${cardData[1].x}, ${cardData[1].y})...`);
  await page.mouse.click(box.x + cardData[1].x, box.y + cardData[1].y);
  await page.waitForTimeout(600);

  const chip1Status = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    const c = q.cardChips[1];
    return {
      text: c.getText(),
      slotIndex: c.getCurrentSlot() ? c.getCurrentSlot().getIndex() : null,
      hasCardInSlot1: q.slotBoxes[1].hasCard(),
    };
  });
  console.log('Chip 1 status after tap:', chip1Status);
  expect(chip1Status.slotIndex).toBe(1);
  expect(chip1Status.hasCardInSlot1).toBe(true);

  // Remove Chip 0 from Slot 0 by tapping it in slot
  const slot0Pos = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    const s = q.slotBoxes[0];
    return { x: s.x, y: s.y };
  });
  await page.mouse.click(box.x + slot0Pos.x, box.y + slot0Pos.y);
  await page.waitForTimeout(600);

  const removedStatus = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    const c = q.cardChips[0];
    return {
      slot: c.getCurrentSlot(),
      hasCardInSlot0: q.slotBoxes[0].hasCard(),
    };
  });
  console.log('Chip 0 removed status:', removedStatus);
  expect(removedStatus.slot).toBeNull();
  expect(removedStatus.hasCardInSlot0).toBe(false);
});
