import { test, expect } from '@playwright/test';
import { exactTextPattern } from './helpers/learning-flow';

test.describe('UI QA: Responsive Multi-Viewport Mouse Hover & Word Slot Placement Suite', () => {
  const viewports = [
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
    { name: 'MacBook (1440x900)', width: 1440, height: 900 },
    { name: 'iPad Pro (1024x768)', width: 1024, height: 768 },
    { name: 'iPhone 15 Pro Max (932x430)', width: 932, height: 430 },
    { name: 'iPhone SE (667x375)', width: 667, height: 375 },
    { name: 'Android Galaxy (915x412)', width: 915, height: 412 },
  ];

  for (const vp of viewports) {
    test(`TitleScene Start Button hover remains reliable at center, left, and right across ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const responsiveStart = page.getByRole('button', { name: /開始冒險|繼續冒險/ }).first();
      await expect(responsiveStart).toBeVisible({ timeout: 15000 });
      const box = await responsiveStart.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;

      const probe = async (xRatio: number): Promise<void> => {
        await page.mouse.move(box.x + box.width * xRatio, box.y + box.height / 2);
        await expect.poll(() => responsiveStart.evaluate((element) => element.matches(':hover'))).toBe(true);
      };
      await probe(0.5);
      await page.mouse.move(2, 2);
      await expect.poll(() => responsiveStart.evaluate((element) => element.matches(':hover'))).toBe(false);
      await probe(0.03);
      await page.mouse.move(2, 2);
      await expect.poll(() => responsiveStart.evaluate((element) => element.matches(':hover'))).toBe(false);
      await probe(0.97);

      await responsiveStart.click();
      await expect(page.locator('.map-view')).toBeVisible();
    });
  }

  test('Shop purchasing Heroine (30💎) and QuestionScene sentence scramble card placement', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.addInitScript(() => {
      const profile = {
        coins: 100,
        gems: 50,
        unlockedStations: 1,
        stationStars: {},
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer'],
        trophies: {},
        stats: {
          chineseCorrect: 0,
          mathCorrect: 0,
          englishCorrect: 0,
          streakDays: 1,
          lastPlayedDate: '2026-08-25',
        },
        settings: {
          chineseEnabled: true,
          mathEnabled: true,
          englishEnabled: true,
          voiceLanguage: 'zh-HK',
          difficulty: 1,
          soundVolume: 1.0,
        },
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(profile));
    });

    await page.goto('/');
    await page.waitForTimeout(1500);

    // 1. Enter ShopScene directly and buy Heroine (30 gems)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      title.scene.start('ShopScene');
    });

    await page.waitForTimeout(1000);

    // Select Heroine (index 1) and open the real confirmation flow.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      shop.selectSkin(1); // Select Heroine
      shop.handleActionClick();
    });

    await expect.poll(
      () => page.evaluate(() => (window as any).__PHASER_GAME__?.scene.getScene('ShopScene')?.purchaseModal?.getTitle?.()),
      { timeout: 5000 }
    ).toBe('🛒 確認解鎖角色');
    await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      const modal = shop?.purchaseModal;
      const confirmButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 確認購買'
      );
      if (!confirmButton) throw new Error('Skin purchase confirmation CTA is not available');
      confirmButton.triggerClick();
    });
    await expect.poll(
      () => page.evaluate(() => {
        const raw = localStorage.getItem('p1_adventure_save_v1');
        const profile = raw ? JSON.parse(raw) : {};
        return (profile.ownedSkins || []).includes('heroine') && profile.equippedSkin === 'heroine';
      }),
      { timeout: 5000 }
    ).toBe(true);
    const buyResult = await page.evaluate(() => {
      const rawAfter = localStorage.getItem('p1_adventure_save_v1');
      const profAfter = rawAfter ? JSON.parse(rawAfter) : {};
      return {
        ownedSkins: profAfter.ownedSkins || [],
        equippedSkin: profAfter.equippedSkin,
        remainingGems: profAfter.gems,
      };
    });

    console.log('Shop Heroine Purchase Result:', buyResult);
    expect(buyResult.ownedSkins).toContain('heroine');
    expect(buyResult.equippedSkin).toBe('heroine');
    expect(buyResult.remainingGems).toBeGreaterThanOrEqual(20);

    // 2. Start QuestionScene Sentence Scramble
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      shop.scene.start('QuestionScene', {
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'test_scramble_verify',
            subject: 'chinese',
            type: 'sentence_scramble',
            prompt: '重組句子：小鳥在天空中飛翔。',
            speakText: '小鳥在天空中飛翔。',
            correctTokens: ['小鳥', '在', '天空', '飛翔', '。'],
            shuffledTokens: ['天空', '。', '小鳥', '飛翔', '在'],
          }
        ]
      });
    });
    await page.waitForTimeout(1200);

    await expect(page.locator('.question-view')).toBeVisible();
    const shuffledTokens = ['天空', '。', '小鳥', '飛翔', '在'];
    for (const token of shuffledTokens) {
      await page.locator('button.bank-token').filter({ hasText: exactTextPattern(token) }).click();
    }
    await expect(page.locator('button.placed-token')).toHaveCount(5);

    // Verify all 5 logical slots are filled; the semantic cards are backed by
    // the same Phaser SlotBox/CardChip state used by the game renderer.
    const slotSnapVerification = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const q = game.scene.getScene('QuestionScene');
      return q.slotBoxes.map((s: any) => {
        const card = s.getPlacedCard();
        return {
          hasCard: s.hasCard(),
          slotX: s.x,
          slotY: s.y,
          cardX: card ? card.x : null,
          cardY: card ? card.y : null,
          diffX: card ? Math.abs(card.x - s.x) : null,
          diffY: card ? Math.abs(card.y - s.y) : null,
        };
      });
    });

    console.log('Slot Snap Verification:', slotSnapVerification);
    expect(slotSnapVerification.every((s: any) => s.hasCard)).toBe(true);
    expect(slotSnapVerification.every((s: any) => s.diffX <= 8)).toBe(true);
    expect(slotSnapVerification.every((s: any) => s.diffY === 0)).toBe(true);
  });
});
