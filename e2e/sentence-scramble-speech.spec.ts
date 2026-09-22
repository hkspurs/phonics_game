import { test, expect } from '@playwright/test';
import { clearSpeech, installSpeechFixture, latestSpeech } from './helpers/speech-fixture';

test('Verify Sentence Scramble Speech: Reads prompt instruction before answering, and reads answer sentence after solving', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await installSpeechFixture(page);
  await page.goto('http://localhost:4173/');
  await expect(page.locator('.home-view')).toBeVisible();

  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const title = game.scene.getScene('TitleScene');

    title.scene.start('QuestionScene', {
      stationId: 1,
      questionIndex: 0,
      questions: [
        {
          id: 'test_zh_scramble_speech',
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '重組句子：請把字詞排列成通順的句子。',
          speakText: '姐姐吃餅乾。',
          correctTokens: ['姐姐', '吃', '餅乾', '。'],
          shuffledTokens: ['吃', '。', '姐姐', '餅乾'],
        }
      ]
    });
  });

  await page.waitForFunction(() => (window as any).__SPEECH_UTTERANCES__.length > 0, undefined, { timeout: 10000 });
  const initialSpokenText = await latestSpeech(page);

  console.log('1. Initial auto-read spoken text for sentence scramble:', initialSpokenText);
  expect(initialSpokenText?.text).toContain('重組句子');
  expect(initialSpokenText?.text).toContain('請把字詞排列成通順的句子');
  expect(initialSpokenText?.text).not.toContain('姐姐吃餅乾');

  // 2. Click Speaker button
  console.log('2. Clicking speaker button...');
  await clearSpeech(page);
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    q.speakCurrentQuestion();
  });
  const speakerText = await latestSpeech(page);
  console.log('Spoken text from speaker button:', speakerText);
  expect(speakerText?.text).toContain('重組句子');
  expect(speakerText?.text).not.toContain('姐姐吃餅乾');

  // 3. Solve sentence correctly
  console.log('3. Solving question...');
  await clearSpeech(page);
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    // Tap cards in correct order
    const tokens = ['姐姐', '吃', '餅乾', '。'];
    tokens.forEach(t => {
      const card = q.cardChips.find((c: any) => c.getText() === t);
      q.handleCardTap(card);
    });
  });

  await page.waitForTimeout(500);
  const correctSpeech = await latestSpeech(page);
  console.log('Spoken text upon correct answer celebration:', correctSpeech);
  expect(correctSpeech?.text).toContain('姐姐吃餅乾');
});
