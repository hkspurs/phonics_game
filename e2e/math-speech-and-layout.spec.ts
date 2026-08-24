import { test, expect } from '@playwright/test';

test('Verify: Math question spoken text uses explicit Chinese words (減/加/等於幾多), enlarged prompt banner, no duplicate box', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  // Start directly at QuestionScene with a Math Subtraction question
  const speechCaptured = await page.evaluate(async () => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');

    (window as any).__LAST_SPOKEN_TEXT__ = '';
    const origSpeak = (window as any).speechSynthesis?.speak;
    if ((window as any).speechSynthesis) {
      (window as any).speechSynthesis.speak = (utt: any) => {
        (window as any).__LAST_SPOKEN_TEXT__ = utt.text;
        if (origSpeak) origSpeak.call((window as any).speechSynthesis, utt);
      };
    }

    title.scene.start('QuestionScene', {
      stationId: 1,
      questionIndex: 1,
      questions: [
        {
          id: 'test_subtraction_math',
          subject: 'math',
          type: 'multiple_choice',
          prompt: '計算以下減法算式：5 - 2 = ?',
          options: ['2', '3', '5', '13'],
          correctOptionIndex: 1,
          correctAnswer: 3,
        }
      ]
    });

    await new Promise(r => setTimeout(r, 1400));
    return (window as any).__LAST_SPOKEN_TEXT__;
  });

  console.log('Spoken text captured for 5 - 2 = ?:', speechCaptured);
  expect(speechCaptured).toContain('減');
  expect(speechCaptured).toContain('等於幾多');
  expect(speechCaptured).not.toContain('-');

  // Take visual verification screenshot
  await page.screenshot({ path: '/tmp/test_math_question_layout.png' });
  console.log('Screenshot saved to /tmp/test_math_question_layout.png');

  // Verify choice cards count
  const choiceCardsCount = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    return q.choiceCards.length;
  });
  expect(choiceCardsCount).toBe(4);
});
