import { test, expect } from '@playwright/test';

test('Live Verify: Sentence scramble speaks prompt instruction first on GitHub Pages', async ({ page }) => {
  const targetUrl = process.env.LIVE_URL || 'http://localhost:4173/';
  await page.goto(targetUrl);
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
          id: 'test_live_scramble',
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

  console.log('Live Spoken Text for Sentence Scramble:', initialSpokenText);
  expect(initialSpokenText).toContain('重組句子');
  expect(initialSpokenText).toContain('請把字詞排列成通順的句子');
  expect(initialSpokenText).not.toContain('姐姐吃餅乾');
});
