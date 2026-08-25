import { test, expect } from '@playwright/test';

test.describe('UI QA Tester 1: Visual, Typography, Slot Alignment & Multi-Viewport Auditor', () => {
  const VIEWPORTS = [
    { name: 'iPhone-15-Pro-Max', width: 932, height: 430 },
    { name: 'iPad-4-3', width: 1024, height: 768 },
    { name: 'Android-20-9', width: 800, height: 360 },
    { name: 'Desktop-16-9', width: 1280, height: 720 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Visual & Viewport Layout Audit on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:4173/');
      await page.waitForTimeout(1500);

      const canvas = page.locator('#game-container canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).toBeTruthy();
      if (!box) return;

      console.log(`[${vp.name}] Canvas Box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);

      // Verify canvas maintains 16:9 aspect ratio regardless of viewport DPI
      const canvasAspect = box.width / box.height;
      expect(Math.abs(canvasAspect - 16 / 9)).toBeLessThan(0.02);

      // Launch QuestionScene with Chinese Sentence Scramble
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const currentScene = game.scene.scenes.find((s: any) => s.scene.isActive());
        if (currentScene) {
          currentScene.scene.start('QuestionScene', {
            stationId: 1,
            stationName: '櫻花樹',
            questionIndex: 0,
            questions: [
              {
                id: 'audit_zh_scramble',
                subject: 'chinese',
                type: 'sentence_scramble',
                prompt: '重組句子：請把字詞排列成通順的句子。',
                speakText: '姐姐吃餅乾。',
                correctTokens: ['姐姐', '吃', '餅乾', '。'],
                shuffledTokens: ['餅乾', '姐姐', '。', '吃'],
              },
            ],
          });
        }
      });

      await page.waitForTimeout(1000);

      // Inspect QuestionScene slot and card alignment
      const sceneData = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        return {
          isActive: qScene.scene.isActive(),
          slotCount: qScene.slotBoxes.length,
          cardCount: qScene.cardChips.length,
          slots: qScene.slotBoxes.map((s: any) => ({
            x: s.x,
            y: s.y,
            w: s.slotWidth,
            h: s.slotHeight,
          })),
          cards: qScene.cardChips.map((c: any) => ({
            x: c.x,
            y: c.y,
            text: c.getText(),
            state: c.getState(),
          })),
          hasHeader: !!qScene.headerContainer,
          hasPrompt: !!qScene.promptContainer,
          hasControls: !!qScene.controlsContainer,
          hintBtnY: qScene.hintButton?.y,
          resetBtnY: qScene.resetButton?.y,
        };
      });

      expect(sceneData.isActive).toBe(true);
      expect(sceneData.slotCount).toBe(4);
      expect(sceneData.cardCount).toBe(4);
      expect(sceneData.hasHeader).toBe(true);
      expect(sceneData.hasPrompt).toBe(true);
      expect(sceneData.hasControls).toBe(true);

      // Verify slots are horizontally centered in 1280px game width
      const firstSlot = sceneData.slots[0];
      const lastSlot = sceneData.slots[3];
      const slotsCenter = (firstSlot.x + lastSlot.x) / 2;
      expect(Math.abs(slotsCenter - 640)).toBeLessThan(1.0);

      // Tap first card ('餅乾') into slot 0 and wait for placement tween
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        const card0 = qScene.cardChips[0];
        qScene.handleCardTap(card0);
      });

      await page.waitForTimeout(300);

      // Verify single placed card has diffX === 0, diffY === 0
      const singlePlacement = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        const slot0 = qScene.slotBoxes[0];
        const card0 = slot0.getPlacedCard();
        return {
          hasCard: slot0.hasCard(),
          cardX: card0?.x,
          cardY: card0?.y,
          slotX: slot0.x,
          slotY: slot0.y,
          diffX: (card0?.x ?? 0) - slot0.x,
          diffY: (card0?.y ?? 0) - slot0.y,
        };
      });

      expect(singlePlacement.hasCard).toBe(true);
      expect(singlePlacement.diffX).toBe(0);
      expect(singlePlacement.diffY).toBe(0);

      // Reset cards back to bank
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        qScene.handleReset();
      });

      await page.waitForTimeout(400);

      const postResetState = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        return {
          allEmpty: qScene.slotBoxes.every((s: any) => !s.hasCard()),
          cardsAtHome: qScene.cardChips.every((c: any) => {
            const home = c.getHomePosition();
            return c.x === home.x && c.y === home.y;
          }),
        };
      });

      expect(postResetState.allEmpty).toBe(true);
      expect(postResetState.cardsAtHome).toBe(true);
    });
  }
});
