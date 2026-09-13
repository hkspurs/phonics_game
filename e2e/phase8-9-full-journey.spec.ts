import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type QuestionSnapshot = {
  type: string;
  correctTokens: string[];
  correctOption?: string | number;
};

function exactTextPattern(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

async function readQuestion(page: Page): Promise<QuestionSnapshot> {
  await expect.poll(() => page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const question = game?.scene?.getScene('QuestionScene')?.currentQuestion;
    const prompt = document.querySelector('.question-prompt')?.textContent;
    return Boolean(question && prompt && prompt === (question.prompt || '請完成以下小挑戰。'));
  })).toBe(true);
  return page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const scene = game?.scene?.getScene('QuestionScene');
    const question = scene?.currentQuestion;
    const options = question?.options ?? [];
    const correctOption = typeof question?.correctOptionIndex === 'number'
      ? options[question.correctOptionIndex]
      : question?.correctAnswer;
    return {
      type: question?.type ?? '',
      correctTokens: question?.correctTokens ?? [],
      correctOption,
    };
  });
}

async function answerVisibleQuestion(page: Page): Promise<void> {
  const snapshot = await readQuestion(page);
  if (snapshot.type === 'sentence_scramble') {
    await expect.poll(async () => {
      const bank = await page.locator('button.bank-token').allTextContents();
      const counts = new Map<string, number>();
      const needed = new Map<string, number>();
      bank.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
      snapshot.correctTokens.forEach((token) => needed.set(token, (needed.get(token) ?? 0) + 1));
      return [...needed].every(([token, count]) => (counts.get(token) ?? 0) >= count);
    }).toBe(true);
    for (const token of snapshot.correctTokens) {
      await page.locator('button.bank-token').filter({ hasText: exactTextPattern(token) }).first().click();
    }
  } else {
    await page.getByRole('button', { name: String(snapshot.correctOption), exact: true }).click();
  }
  await expect(page.locator('button.question-continue')).toBeVisible();
}

async function exerciseRecoveryPath(page: Page): Promise<void> {
  const snapshot = await readQuestion(page);
  if (snapshot.type === 'sentence_scramble') {
    const expectedFirst = snapshot.correctTokens[0];
    const wrong = page.locator('button.bank-token').filter({ hasNotText: expectedFirst }).first();
    await wrong.click();
    while (await page.locator('button.bank-token').count() > 0) {
      await page.locator('button.bank-token').first().click();
    }
  } else {
    const choices = page.locator('button.answer-choice');
    const wrong = choices.filter({ hasNotText: String(snapshot.correctOption) }).first();
    await wrong.click();
  }
  const feedback = page.locator('.question-feedback');
  await expect(feedback).not.toHaveText('');
  const wrongFeedback = await feedback.textContent();
  await page.getByRole('button', { name: '提示', exact: true }).click();
  await expect(feedback).not.toHaveText(wrongFeedback ?? '');
  if (snapshot.type === 'sentence_scramble') {
    await page.getByRole('button', { name: '重新來過', exact: true }).click();
  }
  await answerVisibleQuestion(page);
}

async function clickCanvasWorld(page: Page, worldX: number, worldY: number): Promise<void> {
  const point = await page.locator('#game-container canvas').evaluate((canvas, point) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + (point as { x: number; y: number }).x * rect.width / 1280,
      y: rect.top + (point as { x: number; y: number }).y * rect.height / 720,
    };
  }, { x: worldX, y: worldY });
  await page.mouse.click(point.x, point.y);
}

async function skipRunnerThroughVisibleControls(page: Page): Promise<void> {
  await expect(page.locator('#game-container canvas')).toBeVisible();
  // RunnerScene's visible Skip button is at world (1170, 47). The confirmation
  // dialog's red action is at world (750, 425). Both are real canvas controls.
  await clickCanvasWorld(page, 1170, 47);
  await clickCanvasWorld(page, 750, 425);
}

test('completes a learning station through semantic screens and returns home', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();

  await page.getByRole('button', { name: '開始冒險' }).click();
  await expect(page.locator('.map-view')).toBeVisible();
  await page.getByRole('button', { name: /第 1 關/ }).click();
  await expect(page.locator('.station-detail-view')).toBeVisible();
  await page.getByRole('button', { name: '開始這一關' }).click();

  for (let index = 0; index < 3; index += 1) {
    await expect(page.locator('.question-view')).toBeVisible();
    if (index === 0) await exerciseRecoveryPath(page);
    else await answerVisibleQuestion(page);
    await page.waitForTimeout(600);
    await expect(page.locator('.question-view')).toBeVisible();
    await page.getByRole('button', { name: '繼續前進' }).click();
    await skipRunnerThroughVisibleControls(page);
  }

  await expect(page.locator('.result-view')).toBeVisible();
  const beforeReturn = await page.evaluate(() => localStorage.getItem('p1_adventure_save_v1'));
  expect(beforeReturn, 'completed station must persist a readable save').toBeTruthy();
  const parsedBeforeReturn = JSON.parse(beforeReturn as string) as { completedStations?: number[]; rewardLedger?: { transactionId: string }[] };
  expect(parsedBeforeReturn.completedStations ?? []).toContain(1);
  const transactionIds = (parsedBeforeReturn.rewardLedger ?? []).map((entry) => entry.transactionId);
  expect(new Set(transactionIds).size).toBe(transactionIds.length);
  const mapReturn = page.getByRole('button', { name: '返回地圖', exact: true }).last();
  await mapReturn.scrollIntoViewIfNeeded();
  await mapReturn.click();
  await expect(page.locator('.map-view')).toBeVisible();
  await page.getByRole('button', { name: '‹ 首頁' }).click();
  await expect(page.locator('.home-view')).toBeVisible();
  await page.getByRole('button', { name: '換新造型' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.__PHASER_GAME__?.scene?.isActive('ShopScene')))).toBe(true);
  await expect(page.locator('.screen-view')).toHaveCount(0);
  await clickCanvasWorld(page, 100, 38);
  await expect(page.locator('.home-view')).toBeVisible();
  const afterReturn = await page.evaluate(() => localStorage.getItem('p1_adventure_save_v1'));
  expect(afterReturn).toBe(beforeReturn);
});

test('reveals the DOM Continue action when a sentence hint places the final token', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('.home-view')).toBeVisible();

  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    game.scene.getScene('TitleScene').scene.start('QuestionScene', {
      stationId: 1,
      stationName: '測試小站',
      questionIndex: 0,
      questions: [{
        id: 'phase89_hint_sentence',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '請把字詞排列成通順的句子。',
        correctTokens: ['小鳥', '在', '飛'],
        shuffledTokens: ['飛', '小鳥', '在'],
      }],
    });
  });

  await expect(page.locator('.question-view')).toBeVisible();
  for (const token of ['小鳥', '在']) {
    await page.locator('button.bank-token').filter({ hasText: exactTextPattern(token) }).click();
  }
  const hint = page.getByRole('button', { name: '提示', exact: true });
  await hint.click();
  await expect(page.getByRole('button', { name: '繼續前進', exact: true })).toBeVisible();
  await expect(hint).toBeHidden();
  await expect(page.locator('.question-feedback')).toHaveClass(/is-correct/);
  await expect(page.locator('.question-feedback')).not.toHaveText('');
});
