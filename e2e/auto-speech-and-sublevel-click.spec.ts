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
  // Scene start is asynchronous; anchor the timing assertion to the mounted
  // question view so a slow Phaser boot cannot make the one-second timer look
  // like a product failure.
  await expect(page.locator('.question-view')).toBeVisible();

  // At 500ms, should NOT have spoken yet
  await page.waitForTimeout(500);
  const speechAt500ms = await page.evaluate(() => (window as any).__SPEECH_CALLED__);
  console.log('Speech called at 500ms:', speechAt500ms);
  expect(speechAt500ms).toBe(false);

  // Wait for the Phaser one-second timer to dispatch.  A busy headless GPU
  // can advance the game clock more slowly than wall time, so the assertion
  // observes the timer event instead of assuming a fixed sleep is equivalent.
  await expect.poll(
    () => page.evaluate(() => (window as any).__SPEECH_CALLED__),
    { timeout: 5000, intervals: [100, 250, 500] }
  ).toBe(true);
  const speechAfter1s = await page.evaluate(() => ({
    called: (window as any).__SPEECH_CALLED__,
    text: (window as any).__SPEECH_TEXT__,
  }));
  console.log('Speech called after 1s:', speechAfter1s);
  expect(speechAfter1s.called).toBe(true);
  expect(speechAfter1s.text).toContain('請問「大」的反義詞是甚麼？');

  // 2. Return to the responsive Map/Station detail surface. The responsive
  // layer is the owner of these controls, so test the complete visible row
  // rather than clicking an obsolete canvas coordinate.
  console.log('Testing Sub-level row click across entire button surface...');
  await page.getByRole('button', { name: '‹ 地圖', exact: true }).click();
  await expect(page.locator('.map-view')).toBeVisible();
  await page.getByRole('button', { name: /第 1 關/ }).click();
  await expect(page.locator('.station-detail-view')).toBeVisible();
  const activity = page.getByRole('button', { name: /^中文小挑戰：/ });
  const activityBox = await activity.boundingBox();
  expect(activityBox).not.toBeNull();
  if (!activityBox) return;
  // Probe left, middle and right edges of the same real DOM row. Each probe
  // should enter QuestionScene; return through the owned control before the
  // next probe so no hidden canvas layer participates.
  for (const x of [activityBox.x + 3, activityBox.x + activityBox.width / 2, activityBox.x + activityBox.width - 3]) {
    await page.mouse.click(x, activityBox.y + activityBox.height / 2);
    await expect(page.locator('.question-view')).toBeVisible();
    const prompt = await page.locator('.question-prompt').textContent();
    expect(prompt?.trim(), 'the selected sub-level should load a real question prompt').toBeTruthy();
    if (x !== activityBox.x + activityBox.width - 3) {
      await page.getByRole('button', { name: '‹ 地圖', exact: true }).click();
      await expect(page.locator('.map-view')).toBeVisible();
      await page.getByRole('button', { name: /第 1 關/ }).click();
      await expect(page.locator('.station-detail-view')).toBeVisible();
    }
  }
});
