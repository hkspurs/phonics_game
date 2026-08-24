import { test, expect } from '@playwright/test';

test('Verify Sentence Scramble: Wrong placement, tap card to return to bank, replace with correct card, auto-validation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  // Start directly at QuestionScene with Chinese Sentence Scramble: "姐姐 吃 餅乾 。"
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');
    title.scene.start('QuestionScene', {
      stationId: 1,
      questionIndex: 0,
      questions: [
        {
          id: 'test_zh_scramble_correction',
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '重組句子：請把字詞排列成通順的句子。',
          correctTokens: ['姐姐', '吃', '餅乾', '。'],
          shuffledTokens: ['吃', '。', '姐姐', '餅乾'],
        }
      ]
    });
  });
  await page.waitForTimeout(1500);

  // Helper to get card coordinates
  const getCards = async () => {
    return await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.cardChips.map((c: any, i: number) => ({
        index: i,
        text: c.getText(),
        x: c.x,
        y: c.y,
        slotIndex: c.getCurrentSlot() ? c.getCurrentSlot().getIndex() : null,
      }));
    });
  };

  const getSlots = async () => {
    return await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.slotBoxes.map((s: any, i: number) => ({
        index: i,
        hasCard: s.hasCard(),
        cardText: s.getPlacedCard() ? s.getPlacedCard().getText() : null,
        isError: s.isSlotError,
      }));
    });
  };

  const tapCardByText = async (text: string) => {
    const cards = await getCards();
    const target = cards.find(c => c.text === text);
    if (!target) throw new Error(`Card "${text}" not found`);
    console.log(`Tapping card "${text}" at (${target.x}, ${target.y}) [slot: ${target.slotIndex}]...`);
    
    // Tap card
    await page.evaluate((t) => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      const card = q.cardChips.find((c: any) => c.getText() === t);
      q.handleCardTap(card);
    }, text);
    await page.waitForTimeout(400);
  };

  // 1. Deliberately fill with WRONG order: ['吃', '。', '姐姐', '餅乾']
  console.log('--- Step 1: Placing WRONG order tokens ---');
  await tapCardByText('吃');      // Slot 0: 吃
  await tapCardByText('。');      // Slot 1: 。
  await tapCardByText('姐姐');    // Slot 2: 姐姐
  await tapCardByText('餅乾');    // Slot 3: 餅乾

  let slotsAfterWrong = await getSlots();
  console.log('Slots after wrong order filled:', slotsAfterWrong);
  expect(slotsAfterWrong.every(s => s.hasCard)).toBe(true);

  // Check that mistakes were recorded and wrong sound was played
  const mistakes = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    return q.sessionStats.mistakes;
  });
  console.log('Recorded mistakes on wrong submission:', mistakes);
  expect(mistakes).toBe(1);

  // 2. Correction: Tap on card "。" in Slot 1 and "吃" in Slot 0 to remove them back to bank
  console.log('--- Step 2: Removing wrong cards from slots ---');
  await tapCardByText('。'); // Return "。" to bank
  await tapCardByText('吃'); // Return "吃" to bank
  await tapCardByText('姐姐'); // Return "姐姐" to bank
  await tapCardByText('餅乾'); // Return "餅乾" to bank

  let slotsAfterClear = await getSlots();
  console.log('Slots after returning all cards to bank:', slotsAfterClear);
  expect(slotsAfterClear.every(s => !s.hasCard)).toBe(true);

  // 3. Place in CORRECT order: ['姐姐', '吃', '餅乾', '。']
  console.log('--- Step 3: Placing CORRECT order tokens ---');
  await tapCardByText('姐姐');
  await tapCardByText('吃');
  await tapCardByText('餅乾');
  await tapCardByText('。');

  await page.waitForTimeout(600);
  const isAnswered = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    return q.isAnswered;
  });
  console.log('Question correctly answered & celebrated:', isAnswered);
  expect(isAnswered).toBe(true);
});
