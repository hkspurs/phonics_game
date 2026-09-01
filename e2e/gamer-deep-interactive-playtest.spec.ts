import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Gamer Deep Interactive Playtest & Zero-Trust Visual QA', () => {
  const artifactDir = path.resolve(process.cwd(), 'playtest-artifacts/gamer-interactive-qa');

  test.beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });

  test('full interactive gamer playthrough from shop purchase to runner sprint', async ({ page }) => {
    // 1. Initialize Profile with enough currency to test purchase flows
    await page.goto('/');
    await page.evaluate(() => {
      const initialProfile = {
        name: 'ZeroTrustGamer',
        stars: 45,
        diamonds: 150,
        gems: 150,
        coins: 800,
        level: 5,
        equippedSkin: 'heroine',
        ownedSkins: ['adventurer', 'heroine'],
        ownedWardrobe: ['star_glasses', 'cat_ears'],
        equippedWardrobe: {
          hat: 'cat_ears',
          accessory: 'star_glasses',
        },
        equippedPet: 'dino',
        ownedPets: ['dino', 'cat'],
        unlockedStations: 3,
        stationStars: { 1: 3, 2: 2, 3: 0 },
        unlockedSublevels: { 'st_central': ['c1', 'm1', 'e1'] },
        stats: {
          chineseCorrect: 15,
          mathCorrect: 12,
          englishCorrect: 18,
        },
        volume: 0.8,
        bgmVolume: 0.5,
        sfxVolume: 0.8,
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(initialProfile));
    });

    await page.reload();
    await page.waitForTimeout(1600);

    // Capture 01: Title Screen with Heroine skin, Cat Ears, and Dino pet
    await page.screenshot({ path: path.join(artifactDir, '01_title_screen_custom_avatar.png') });

    // 2. Enter Shop Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('TitleScene');
        game.scene.start('ShopScene');
      }
    });
    await page.waitForTimeout(1400);

    // Switch to Wardrobe Tab (夢幻衣櫥)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.switchTab === 'function') {
          shop.switchTab('wardrobe');
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '02_shop_wardrobe_catalog.png') });

    // Select HK School Shirt (香港校服襯衫) by the visible catalog index.
    const selectionState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      if (!shop) throw new Error('ShopScene is not available');
      shop.switchWardrobeCategory('top');
      const items = shop.getVisibleWardrobeItems();
      const index = items.findIndex((item: any) => item.id === 'hk_school_shirt');
      if (index < 0) throw new Error('HK School Shirt is not in the top catalog');
      shop.selectWardrobeItem(index);
      return {
        itemId: items[index].id,
        action: shop.actionButton?.getText?.(),
        previewMode: shop.previewController?.lastRenderResult?.mode,
        previewTexture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(selectionState.itemId).toBe('hk_school_shirt');
    expect(selectionState.action).toContain('立即購買');
    // Current School Uniform wearing art is authored for Adventurer only;
    // Heroine keeps her own body while the compositor supplies the top.
    expect(selectionState.previewMode).toBe('composite');
    expect(selectionState.previewTexture).toBe('female_stand');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, '03_shop_tryon_school_shirt.png') });

    // Trigger the real purchase confirmation path used by the live action button.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      if (!shop) throw new Error('ShopScene is not available');
      shop.handleActionClick();
    });
    await page.waitForTimeout(800);
    const confirmationState = await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      const modal = shop?.purchaseModal;
      return {
        title: modal?.getTitle?.(),
        content: modal?.getContentContainer?.().list?.map((child: any) => child?.text ?? child?.getText?.() ?? ''),
      };
    });
    expect(confirmationState.title).toBe('🛒 確認購買');
    expect(confirmationState.content).toContain('✅ 確認購買');
    await page.screenshot({ path: path.join(artifactDir, '04_shop_purchase_modal.png') });

    // Confirm Purchase and Equip through the actual modal CTA.
    await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      const modal = shop?.purchaseModal;
      const confirmButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 確認購買'
      );
      if (!confirmButton) throw new Error('Purchase confirmation CTA is not available');
      confirmButton.emit('pointerup');
    });
    await page.waitForTimeout(700);

    const successState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      const modal = shop?.purchaseModal;
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return {
        title: modal?.getTitle?.(),
        content: modal?.getContentContainer?.().list?.map((child: any) => child?.text ?? child?.getText?.() ?? ''),
        owned: profile.ownedWardrobe,
        equipped: profile.equippedWardrobe,
        previewMode: shop?.previewController?.lastRenderResult?.mode,
        previewTexture: shop?.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(successState.title).toBe('✨ 購買成功！');
    expect(successState.content?.[0]).toContain('✅ 已購買並穿上！');
    expect(successState.content?.[0]).not.toContain('立即穿上');
    expect(successState.content).toContain('✅ 繼續探索');
    expect(successState.owned).toContain('hk_school_shirt');
    expect(successState.equipped?.top).toBe('hk_school_shirt');
    expect(successState.previewMode).toBe('composite');
    expect(successState.previewTexture).toBe('female_stand');
    await page.screenshot({ path: path.join(artifactDir, '04b_shop_purchase_success_modal.png') });

    // Close success feedback, reload, and verify the same outfit is restored.
    await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      const modal = shop?.purchaseModal;
      const continueButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 繼續探索'
      );
      if (!continueButton) throw new Error('Purchase success CTA is not available');
      continueButton.emit('pointerup');
    });
    await page.waitForTimeout(250);
    await page.reload();
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) throw new Error('Phaser game is not available after reload');
      game.scene.stop('TitleScene');
      game.scene.start('ShopScene');
    });
    await page.waitForTimeout(1200);
    const persistedState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchTab('wardrobe');
      shop.switchWardrobeCategory('top');
      const items = shop.getVisibleWardrobeItems();
      const index = items.findIndex((item: any) => item.id === 'hk_school_shirt');
      shop.selectWardrobeItem(index);
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return {
        owned: profile.ownedWardrobe,
        equipped: profile.equippedWardrobe,
        action: shop.actionButton?.getText?.(),
        previewMode: shop.previewController?.lastRenderResult?.mode,
        previewTexture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(persistedState.owned).toContain('hk_school_shirt');
    expect(persistedState.equipped?.top).toBe('hk_school_shirt');
    expect(persistedState.action).toContain('脫下衣物');
    expect(persistedState.previewMode).toBe('composite');
    expect(persistedState.previewTexture).toBe('female_stand');

    // Open OOTD Polaroid Photo Booth
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.openOOTDModal === 'function') {
          shop.openOOTDModal();
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '05_shop_ootd_polaroid_modal.png') });

    // Close Modal and Enter Map Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('ShopScene');
        game.scene.start('MapScene');
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '06_map_scene_unlocked_nodes.png') });
    const mapResourceOrder = await page.evaluate(() => {
      const map = (window as any).__PHASER_GAME__?.scene.getScene('MapScene') as any;
      return (map?.headerContainer?.list ?? [])
        .map((child: any) => child?.text)
        .filter((text: unknown): text is string => typeof text === 'string' && /^(🪙 金幣:|💎 寶石:|⭐ 星星:)/.test(text))
        .map((text: string) => text.slice(0, text.indexOf(':') + 1));
    });
    expect(mapResourceOrder).toEqual(['🪙 金幣:', '💎 寶石:', '⭐ 星星:']);

    // 3. Enter Question Scene and Answer Correctly
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('MapScene');
        game.scene.start('QuestionScene', {
          stationId: 'st_central',
          sublevelId: 'c1',
          mode: 'choice',
        });
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '07_question_scene_ready.png') });
    const questionAvatarState = await page.evaluate(() => {
      const question = (window as any).__PHASER_GAME__?.scene.getScene('QuestionScene') as any;
      const badge = question?.avatarBadge;
      const container = badge?.container;
      return {
        texture: badge?.avatarSprite?.texture?.key,
        size: badge?.size,
        right: (container?.x ?? 0) + (badge?.size ?? 0) / 2,
      };
    });
    expect(questionAvatarState.texture).toBe('female_stand');
    expect(questionAvatarState.size).toBe(88);
    expect(questionAvatarState.right).toBeLessThanOrEqual(1264);

    // The logical badge must stay visible after Scale.FIT on mobile landscape;
    // restore the desktop viewport before continuing the playthrough.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(350);
    const mobileQuestionAvatarState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const question = game?.scene.getScene('QuestionScene') as any;
      const badge = question?.avatarBadge;
      const container = badge?.container;
      const canvas = document.querySelector('canvas');
      const rect = canvas?.getBoundingClientRect();
      return {
        size: badge?.size,
        top: (container?.y ?? 0) - (badge?.size ?? 0) / 2,
        right: (container?.x ?? 0) + (badge?.size ?? 0) / 2,
        canvasInsideViewport: Boolean(
          rect
          && rect.left >= -1
          && rect.top >= -1
          && rect.right <= window.innerWidth + 1
          && rect.bottom <= window.innerHeight + 1
        ),
      };
    });
    expect(mobileQuestionAvatarState.size).toBe(88);
    expect(mobileQuestionAvatarState.top).toBeGreaterThanOrEqual(4);
    expect(mobileQuestionAvatarState.right).toBeLessThanOrEqual(1264);
    expect(mobileQuestionAvatarState.canvasInsideViewport).toBe(true);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(350);

    // Simulate clicking correct option
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const q = game.scene.getScene('QuestionScene');
        if (q && typeof q.handleChoiceSelect === 'function') {
          q.handleChoiceSelect(0);
        }
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, '08_question_answer_correct_feedback.png') });

    // 4. Enter Runner Scene (Minigame Sprint)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('QuestionScene');
        game.scene.start('RunnerScene', {
          stationId: 'st_central',
          targetScore: 100,
        });
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '09_runner_track_sprint.png') });
    const runnerAvatarState = await page.evaluate(() => {
      const runner = (window as any).__PHASER_GAME__?.scene.getScene('RunnerScene') as any;
      // The live Runner correctly idles without input; force one real movement
      // step so the assertion covers the authored run pose gateway as well.
      runner.isRightDown = true;
      runner.stepTimer = 130;
      runner.update(0, 16);
      runner.isRightDown = false;
      return {
        texture: runner?.playerSprite?.texture?.key,
        dedicated: runner?.runnerUsesDedicatedOutfitSprite,
        renderY: runner?.playerSprite?.y,
        expectedRenderY: runner?.runnerUsesDedicatedOutfitSprite
          ? (runner?.playerBaselineY ?? 540) + 36
            - (460 - 256) * (runner?.runnerBaseScale ?? 0)
          : runner?.playerY,
        stationNumber: runner?.getStationNumericId?.(),
        skyColor: runner?.skyBackground?.fillColor,
        starCounter: runner?.starCounterText?.text,
        stationCue: runner?.hudContainer?.list?.find((child: any) =>
          child?.type === 'Text' && String(child.text).includes('衝刺獎勵')
        )?.text,
      };
    });
    expect(['female_walk1', 'female_walk2']).toContain(runnerAvatarState.texture);
    expect(runnerAvatarState.dedicated).toBe(false);
    expect(runnerAvatarState.renderY).toBeCloseTo(runnerAvatarState.expectedRenderY, 2);
    expect(runnerAvatarState.stationNumber).toBe(1);
    expect(runnerAvatarState.skyColor).toBe(0x2193b0);
    expect(runnerAvatarState.starCounter).toBe('⭐ 5/30');
    expect(runnerAvatarState.stationCue).toContain('🏡 小木屋');

    // Trigger Airborne Jump & Coin Collection
    const jumpBaselineState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      if (!runner) throw new Error('RunnerScene is not available');
      const beforeWorldY = runner.playerY;
      const beforeRenderY = runner.playerSprite?.y;
      runner.handleJumpInput();
      runner.update(0, 16);
      const scale = runner.runnerBaseScale || 0;
      const afterWorldY = runner.playerY;
      const afterRenderY = runner.playerSprite?.y;
      const dedicated = runner.runnerUsesDedicatedOutfitSprite;
      return {
        dedicated,
        renderDelta: beforeRenderY - afterRenderY,
        worldDelta: beforeWorldY - afterWorldY,
        footBaseline: dedicated ? afterRenderY + (460 - 256) * scale : afterRenderY,
        expectedFootBaseline: dedicated ? afterWorldY + 36 : afterWorldY,
      };
    });
    expect(jumpBaselineState.dedicated).toBe(false);
    expect(jumpBaselineState.renderDelta).toBeCloseTo(jumpBaselineState.worldDelta, 2);
    expect(jumpBaselineState.footBaseline).toBeCloseTo(jumpBaselineState.expectedFootBaseline, 2);
    await page.waitForTimeout(260);
    await page.screenshot({ path: path.join(artifactDir, '10_runner_jump_and_coin_collect.png') });

    // Exercise the live chest reward card and explicit next-question handoff.
    await page.evaluate(() => {
      const runner = (window as any).__PHASER_GAME__?.scene.getScene('RunnerScene') as any;
      if (!runner) throw new Error('RunnerScene is not available');
      runner.onReachChest();
    });
    await page.waitForTimeout(250);
    const chestRewardState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      return {
        celebrating: runner?.isCelebrating,
        rewardText: runner?.celebrationRewardText?.text,
        continueText: runner?.celebrationContinueButton?.getText?.(),
        texture: runner?.playerSprite?.texture?.key,
      };
    });
    expect(chestRewardState.celebrating).toBe(true);
    expect(chestRewardState.rewardText).toContain('+5');
    expect(chestRewardState.rewardText).toContain('+1');
    expect(chestRewardState.continueText).toBe('下一題');
    expect(chestRewardState.texture).toBe('female_cheer1');
    await page.screenshot({ path: path.join(artifactDir, '11_runner_chest_reward.png') });

    // The reward handoff must remain visible on a mobile landscape canvas too.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(350);
    const mobileChestRewardState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      const banner = runner?.celebrationBanner;
      const button = runner?.celebrationContinueButton;
      const canvas = document.querySelector('canvas')?.getBoundingClientRect();
      const bannerBounds = banner?.getBounds?.();
      const buttonBounds = button?.getBounds?.();
      const logicalWidth = Number(game?.config?.width || 1280);
      const logicalHeight = Number(game?.config?.height || 720);
      return {
        banner: bannerBounds
          ? { left: bannerBounds.left, right: bannerBounds.right, top: bannerBounds.top, bottom: bannerBounds.bottom }
          : null,
        button: buttonBounds
          ? { left: buttonBounds.left, right: buttonBounds.right, top: buttonBounds.top, bottom: buttonBounds.bottom }
          : null,
        logicalWidth,
        logicalHeight,
        canvasInsideViewport: Boolean(
          canvas
          && canvas.left >= -1
          && canvas.top >= -1
          && canvas.right <= window.innerWidth + 1
          && canvas.bottom <= window.innerHeight + 1
        ),
      };
    });
    expect(mobileChestRewardState.canvasInsideViewport).toBe(true);
    expect(mobileChestRewardState.banner).not.toBeNull();
    expect(mobileChestRewardState.button).not.toBeNull();
    expect(mobileChestRewardState.banner!.left).toBeGreaterThanOrEqual(0);
    expect(mobileChestRewardState.banner!.right).toBeLessThanOrEqual(mobileChestRewardState.logicalWidth);
    expect(mobileChestRewardState.banner!.top).toBeGreaterThanOrEqual(0);
    expect(mobileChestRewardState.banner!.bottom).toBeLessThanOrEqual(mobileChestRewardState.logicalHeight);
    expect(mobileChestRewardState.button!.left).toBeGreaterThanOrEqual(mobileChestRewardState.banner!.left);
    expect(mobileChestRewardState.button!.right).toBeLessThanOrEqual(mobileChestRewardState.banner!.right);
    await page.screenshot({ path: path.join(artifactDir, '11b_runner_chest_reward_mobile.png') });

    await page.evaluate(() => {
      const runner = (window as any).__PHASER_GAME__?.scene.getScene('RunnerScene') as any;
      runner.continueCelebration();
    });
    await page.waitForTimeout(650);
    const handoffState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return { questionActive: game?.scene.isActive('QuestionScene') };
    });
    expect(handoffState.questionActive).toBe(true);

    // Verify the fallback path too: if the child does not tap, the calm
    // 1600ms timer still advances to the next question.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game.scene.start('RunnerScene', {
        stationId: 'st_central',
        stationName: '中環冒險島',
        targetScore: 100,
      });
    });
    await page.waitForFunction(
      () => (window as any).__PHASER_GAME__?.scene.isActive('RunnerScene'),
      null,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      const runner = (window as any).__PHASER_GAME__?.scene.getScene('RunnerScene') as any;
      runner.onReachChest();
    });
    await page.waitForFunction(
      () => (window as any).__PHASER_GAME__?.scene.isActive('QuestionScene'),
      null,
      { timeout: 5000 }
    );
    expect(await page.evaluate(() => (window as any).__PHASER_GAME__?.scene.isActive('QuestionScene'))).toBe(true);

    expect(fs.existsSync(path.join(artifactDir, '01_title_screen_custom_avatar.png'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDir, '09_runner_track_sprint.png'))).toBe(true);
  });

  test('does not double-charge when the purchase confirmation is tapped twice', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify({
        coins: 0,
        gems: 30,
        ownedWardrobe: [],
        equippedWardrobe: {},
      }));
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      shop?.switchTab?.('wardrobe');
    });
    await page.waitForTimeout(300);

    const selection = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchWardrobeCategory?.('dress');
      const index = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
      return { action: shop.actionButton?.getText?.() };
    });
    expect(selection.action).toContain('立即購買');

    const confirmation = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      shop.handleActionClick();
      const modal = shop.purchaseModal;
      const confirmButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 確認購買'
      );
      if (!confirmButton) throw new Error('Purchase confirmation CTA is not available');
      confirmButton.emit('pointerup');
      confirmButton.emit('pointerup');
      return {
        beforeGems: profile.gems,
        modalClosed: shop.purchaseModal === null,
        pending: shop.wardrobePurchasePending,
        pendingAction: shop.actionButton?.getText?.(),
        pendingActionEnabled: shop.actionButton?.isEnabled?.(),
      };
    });
    expect(confirmation.beforeGems).toBe(30);
    expect(confirmation.modalClosed).toBe(true);
    expect(confirmation.pending).toBe(true);
    expect(confirmation.pendingAction).toBe('⏳ 購買中…');
    expect(confirmation.pendingActionEnabled).toBe(false);

    await expect.poll(
      () => page.evaluate(() => {
        const raw = localStorage.getItem('p1_adventure_save_v1');
        const profile = raw ? JSON.parse(raw) : {};
        return profile.equippedWardrobe?.dress === 'scholar_robe';
      }),
      { timeout: 5000 }
    ).toBe(true);

    const state = await page.evaluate(() => {
      const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene') as any;
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      const successModal = shop?.purchaseModal;
      return {
        gems: profile.gems,
        ownedCount: (profile.ownedWardrobe || []).filter((id: string) => id === 'scholar_robe').length,
        equippedDress: profile.equippedWardrobe?.dress,
        successTitle: successModal?.getTitle?.(),
        successContent: successModal?.getContentContainer?.().list?.map(
          (child: any) => child?.text ?? child?.getText?.() ?? ''
        ),
        pending: shop?.wardrobePurchasePending,
      };
    });
    expect(state.gems).toBe(0);
    expect(state.ownedCount).toBe(1);
    expect(state.equippedDress).toBe('scholar_robe');
    expect(state.successTitle).toBe('✨ 購買成功！');
    expect(state.successContent?.[0]).toContain('✅ 已購買並穿上！');
    expect(state.successContent).toContain('✅ 繼續探索');
    expect(state.pending).toBe(false);
  });

  test('awards the chest summary once when the chest handler is re-entered', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify({
        coins: 0,
        gems: 0,
        ownedWardrobe: [],
        equippedWardrobe: {},
      }));
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('RunnerScene', {
        stationId: 'st_central',
        stationName: '中環冒險島',
        targetScore: 100,
      });
    });
    await page.waitForFunction(
      () => (window as any).__PHASER_GAME__?.scene.isActive('RunnerScene'),
      null,
      { timeout: 5000 }
    );

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      runner.onReachChest();
      runner.onReachChest();
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return {
        celebrating: runner.isCelebrating,
        sessionCoins: runner.sessionStats?.collectedCoins,
        sessionGems: runner.sessionStats?.collectedGems,
        coins: profile.coins,
        gems: profile.gems,
        rewardText: runner.celebrationRewardText?.text,
        continueText: runner.celebrationContinueButton?.getText?.(),
      };
    });

    expect(state.celebrating).toBe(true);
    expect(state.sessionCoins).toBe(5);
    expect(state.sessionGems).toBe(1);
    expect(state.coins).toBe(5);
    expect(state.gems).toBe(1);
    expect(state.rewardText).toContain('+5');
    expect(state.rewardText).toContain('+1');
    expect(state.continueText).toBe('下一題');
  });
});
