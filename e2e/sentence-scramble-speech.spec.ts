import { test, expect } from '@playwright/test';

test('Verify Sentence Scramble Speech: Reads prompt instruction before answering, and reads answer sentence after solving', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  const initialSpokenText = await page.evaluate(async () => {
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

    await new Promise(r => setTimeout(r, 2000));
    return (window as any).__LAST_SPOKEN_TEXT__;
  });

  console.log('1. Initial auto-read spoken text for sentence scramble:', initialSpokenText);
  expect(initialSpokenText).toContain('重組句子');
  expect(initialSpokenText).toContain('請把字詞排列成通順的句子');
  expect(initialSpokenText).not.toContain('姐姐吃餅乾');

  // 2. Click Speaker button
  console.log('2. Clicking speaker button...');
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    (window as any).__LAST_SPOKEN_TEXT__ = '';
    q.speakCurrentQuestion();
  });
  const speakerText = await page.evaluate(() => (window as any).__LAST_SPOKEN_TEXT__);
  console.log('Spoken text from speaker button:', speakerText);
  expect(speakerText).toContain('重組句子');
  expect(speakerText).not.toContain('姐姐吃餅乾');

  // 3. Solve sentence correctly
  console.log('3. Solving question...');
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    (window as any).__LAST_SPOKEN_TEXT__ = '';
    
    // Tap cards in correct order
    const tokens = ['姐姐', '吃', '餅乾', '。'];
    tokens.forEach(t => {
      const card = q.cardChips.find((c: any) => c.getText() === t);
      q.handleCardTap(card);
    });
  });

  await page.waitForTimeout(500);
  const correctSpeech = await page.evaluate(() => (window as any).__LAST_SPOKEN_TEXT__);
  console.log('Spoken text upon correct answer celebration:', correctSpeech);
  expect(correctSpeech).toContain('姐姐吃餅乾');
});
