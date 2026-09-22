import { expect, type Page } from '@playwright/test';

export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export async function clickCanvasWorld(page: Page, worldX: number, worldY: number): Promise<void> {
  const canvas = page.locator('#game-container canvas');
  await expect(canvas).toBeVisible();
  const point = await canvas.evaluate((element, coordinates) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + (coordinates as { x: number; y: number }).x * rect.width / 1280,
      y: rect.top + (coordinates as { x: number; y: number }).y * rect.height / 720,
    };
  }, { x: worldX, y: worldY });
  await page.mouse.click(point.x, point.y);
}

export async function waitForCanvasScene(page: Page, sceneKey: string, timeout = 10000): Promise<void> {
  await expect.poll(() => page.evaluate((key) => {
    const game = (window as any).__PHASER_GAME__;
    return Boolean(game?.scene?.isActive?.(key));
  }, sceneKey), { timeout }).toBe(true);
}

export async function skipRunner(page: Page): Promise<void> {
  await waitForCanvasScene(page, 'RunnerScene');
  await clickCanvasWorld(page, 1170, 47);
  await expect.poll(() => page.evaluate(() => Boolean(
    (window as any).__PHASER_GAME__?.scene?.getScene('RunnerScene')?.skipConfirmationModal
  ))).toBe(true);
  await clickCanvasWorld(page, 750, 425);
}

export async function continueRunnerCelebration(page: Page): Promise<void> {
  await waitForCanvasScene(page, 'RunnerScene');
  const coordinates = await page.evaluate(() => {
    const button = (window as any).__PHASER_GAME__?.scene?.getScene('RunnerScene')?.celebrationContinueButton;
    return button ? { x: button.x, y: button.y } : null;
  });
  expect(coordinates).not.toBeNull();
  await clickCanvasWorld(page, coordinates!.x, coordinates!.y);
}
