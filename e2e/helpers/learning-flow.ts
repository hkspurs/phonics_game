import { expect, type Page } from '@playwright/test';

export function exactTextPattern(value: string): RegExp {
  const special = new Set(['\\', '.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']']);
  const escaped = [...value].map((character) => special.has(character) ? `\\${character}` : character).join('');
  return new RegExp(`^${escaped}$`);
}

export async function openFirstStation(page: Page): Promise<void> {
  await page.getByRole('button', { name: '開始冒險', exact: true }).click();
  await expect(page.locator('.map-view')).toBeVisible();
  await page.getByRole('button', { name: /第 1 關/ }).click();
  await expect(page.locator('.station-detail-view')).toBeVisible();
  await page.getByRole('button', { name: '開始這一關', exact: true }).click();
  await expect(page.locator('.question-view')).toBeVisible();
}

export async function currentQuestion(page: Page): Promise<{
  type: string;
  correctTokens: string[];
  correctOption?: string;
}> {
  await expect.poll(() => page.evaluate(() => Boolean(
    (window as any).__PHASER_GAME__?.scene?.getScene('QuestionScene')?.currentQuestion
  ))).toBe(true);
  return page.evaluate(() => {
    const question = (window as any).__PHASER_GAME__?.scene?.getScene('QuestionScene')?.currentQuestion;
    const options = question?.options ?? [];
    const correctOption = typeof question?.correctOptionIndex === 'number'
      ? options[question.correctOptionIndex]
      : question?.correctAnswer;
    return {
      type: question?.type ?? '',
      correctTokens: [...(question?.correctTokens ?? [])],
      correctOption: correctOption == null ? undefined : String(correctOption),
    };
  });
}

export async function answerCurrentQuestion(page: Page): Promise<void> {
  const question = await currentQuestion(page);
  if (question.type === 'sentence_scramble') {
    for (const token of question.correctTokens) {
      await page.locator('button.bank-token').filter({ hasText: exactTextPattern(token) }).first().click();
    }
  } else {
    await page.getByRole('button', { name: question.correctOption, exact: true }).click();
  }
  await expect(page.getByRole('button', { name: '繼續前進', exact: true })).toBeVisible();
}
