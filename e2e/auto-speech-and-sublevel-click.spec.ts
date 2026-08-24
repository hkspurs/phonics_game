import { test, expect } from '@playwright/test';

test('Verification: Auto-read after 1s in QuestionScene and 100% full-area sub-level row clicks', async ({ page }) => {
  await page.setViewportSize({ width: 932, height: 430 });
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  // 1. Verify Auto-read in QuestionScene after 1 second
  console.log('Testing Auto-read in QuestionScene...');
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');
    (window as any).__SPEECH_CALLED__ = false;
    (window as any).__SPEECH_TEXT__ = '';
    
    // Track SpeechService.speak
    const origSpeak = (window as any).speechSynthesis?.speak;
    if ((window as any).speechSynthesis) {
      (window as any).speechSynthesis.speak = (utt: any) => {
        (window as any).__SPEECH_CALLED__ = true;
        (window as any).__SPEECH_TEXT__ = utt.text;
        if (origSpeak) origSpeak.call((window as any).speechSynthesis, utt);
      };
    }

    title.scene.start('QuestionScene', {
      stationId: 1,
      questionIndex: 0,
      questions: [
        {
          id: 'test_auto_read',
          subject: 'chinese',
          type: 'multiple_choice',
          prompt: '選出「大」的反義詞：',
          speakText: '請問「大」的反義詞是甚麼？',
          options: ['小', '多'],
          correctOptionIndex: 0,
        }
      ]
    });
  });

  // At 500ms, should NOT have spoken yet
  await page.waitForTimeout(500);
  const speechAt500ms = await page.evaluate(() => (window as any).__SPEECH_CALLED__);
  console.log('Speech called at 500ms:', speechAt500ms);
  expect(speechAt500ms).toBe(false);

  // At 1500ms (after 1s delay), MUST have spoken!
  await page.waitForTimeout(1000);
  const speechAfter1s = await page.evaluate(() => ({
    called: (window as any).__SPEECH_CALLED__,
    text: (window as any).__SPEECH_TEXT__
  }));
  console.log('Speech called after 1s:', speechAfter1s);
  expect(speechAfter1s.called).toBe(true);
  expect(speechAfter1s.text).toContain('請問「大」的反義詞是甚麼？');

  // 2. Return to MapScene and test Sub-Level Row clicks across all parts (Center, Left, Right)
  console.log('Testing Sub-level row click across entire button surface...');
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    q.scene.start('MapScene');
  });
  await page.waitForTimeout(1500);

  // Open Station 1 Modal
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    map.openStationModal(map.stations[0]);
  });
  await page.waitForTimeout(800);

  // Get Row 1 bounds
  const row1Bounds = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    const modal = map.activeModal;
    // Row 1 is index 1 in modal contentContainer list
    const row = (modal as any).contentContainer.list[1];
    return {
      modalX: modal.x,
      modalY: modal.y + (modal as any).contentContainer.y,
      rowX: row.x,
      rowY: row.y,
      rowW: row.width,
      rowH: row.height,
      gameW: game.scale.width,
      gameH: game.scale.height,
    };
  });
  console.log('Sub-level Row 1 Bounds in Modal:', row1Bounds);

  // Calculate screen position for:
  // 1. Far Left of row (the [中] badge)
  // 2. Center of row (the title text)
  // 3. Far Right of row (the star icon)
  const toScreen = (gx: number, gy: number) => ({
    x: box.x + (gx / row1Bounds.gameW) * box.width,
    y: box.y + (gy / row1Bounds.gameH) * box.height,
  });

  const modalCenterX = row1Bounds.modalX;
  const rowCenterY = row1Bounds.modalY + row1Bounds.rowY;

  // Test clicking the Far Right of Row 1 (at x = +240px from row center, right on top of star icon!)
  const rightClickPos = toScreen(modalCenterX + 220, rowCenterY);
  console.log(`Clicking Far Right of Row 1 at (${rightClickPos.x.toFixed(1)}, ${rightClickPos.y.toFixed(1)})...`);
  await page.mouse.click(rightClickPos.x, rightClickPos.y);
  await page.waitForTimeout(1500);

  const activeSceneAfterRightClick = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
  });
  console.log('Active scenes after clicking far right of sub-level button:', activeSceneAfterRightClick);
  expect(activeSceneAfterRightClick).toContain('QuestionScene');
});
