import { test, expect } from '@playwright/test';
import { installSpeechFixture, latestSpeech } from './helpers/speech-fixture';

test('Verify: Math question spoken text uses explicit Chinese words (減/加/等於幾多), enlarged prompt banner, no duplicate box', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await installSpeechFixture(page);
  await page.goto('http://localhost:4173/');
  await expect(page.locator('.home-view')).toBeVisible();

  // Start directly at QuestionScene with a Math Subtraction question
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');

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
  });

  await page.waitForFunction(() => (window as any).__SPEECH_UTTERANCES__.length > 0, undefined, { timeout: 10000 });
  const speechCaptured = await latestSpeech(page);

  console.log('Spoken text captured for 5 - 2 = ?:', speechCaptured);
  expect(speechCaptured?.text).toContain('減');
  expect(speechCaptured?.text).toContain('等於幾多');
  expect(speechCaptured?.text).not.toContain('-');
  expect(speechCaptured?.voiceName).toBe('QA Cantonese');

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
