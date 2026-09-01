import { test, expect, Page } from '@playwright/test';

async function expectCanvasFitsViewport(page: Page): Promise<void> {
  const bounds = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });

  expect(bounds).not.toBeNull();
  expect(bounds!.left).toBeGreaterThanOrEqual(-1);
  expect(bounds!.top).toBeGreaterThanOrEqual(-1);
  expect(bounds!.right).toBeLessThanOrEqual(bounds!.viewportWidth + 1);
  expect(bounds!.bottom).toBeLessThanOrEqual(bounds!.viewportHeight + 1);
  expect(bounds!.scrollWidth).toBeLessThanOrEqual(bounds!.viewportWidth + 1);
  expect(bounds!.scrollHeight).toBeLessThanOrEqual(bounds!.viewportHeight + 1);
}

async function inspectLiveTextureAlpha(page: Page, textureKey: string): Promise<{
  width: number;
  height: number;
  cornerAlpha: number[];
  visibleSamples: number;
} | null> {
  return page.evaluate((key) => {
    const game = (window as any).__PHASER_GAME__;
    const texture = game?.textures?.get?.(key);
    const source = texture?.getSourceImage?.() ?? texture?.source?.[0]?.image;
    const width = Number(source?.naturalWidth || source?.width);
    const height = Number(source?.naturalHeight || source?.height);
    if (!source || !width || !height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const alphaAt = (x: number, y: number): number => pixels[(y * width + x) * 4 + 3];
    const step = Math.max(1, Math.floor(Math.max(width, height) / 64));
    let visibleSamples = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (alphaAt(x, y) > 8) visibleSamples += 1;
      }
    }

    return {
      width,
      height,
      cornerAlpha: [
        alphaAt(0, 0),
        alphaAt(width - 1, 0),
        alphaAt(0, height - 1),
        alphaAt(width - 1, height - 1),
      ],
      visibleSamples,
    };
  }, textureKey);
}

test.describe('Dream Wardrobe Hybrid Character Outfit & Shop UI Visual Audit', () => {
  test('renders Dream Wardrobe shop across Desktop, iPad, and iPhone viewports with clean preview', async ({ page }) => {
    // 1. Desktop 1920x1080 (the game canvas remains Scale.FIT at its logical size)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/?test=true');
    await page.waitForTimeout(2000);

    // Navigate to Shop
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game && game.scene) {
        game.scene.start('ShopScene');
      }
    });
    await page.waitForTimeout(1500);

    // Switch to 夢幻衣櫥 tab
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.switchTab === 'function') {
        shop.switchTab('wardrobe');
      }
    });
    await page.waitForTimeout(1000);
    await expectCanvasFitsViewport(page);

    // Capture the alternate dense-catalog path once; category pages remain the
    // primary child-readable browse view, but “全部” must not overflow either.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      shop?.switchWardrobeFilter?.('all');
    });
    await page.waitForTimeout(500);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/00_Dream_Wardrobe_All_Catalog_Desktop.png' });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/00b_Dream_Wardrobe_All_Catalog_Mobile.png' });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Select Scholar Gown (升小一榮譽學士袍)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.selectWardrobeItem === 'function') {
        shop.selectWardrobeItem(1); // scholar_robe
      }
    });
    await page.waitForTimeout(1000);

    // Take Desktop Screenshot
    await page.screenshot({ path: 'uat-report-screenshots/01_Dream_Wardrobe_Scholar_Gown_Desktop.png' });

    // 2. Laptop 1366x768: the same dedicated outfit must keep its baseline and
    // action area inside the fitted canvas before the compact breakpoint.
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(700);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/01c_Dream_Wardrobe_Scholar_Gown_1366x768.png' });

    // Exercise every authored full-body outfit in one rapid selection pass.
    // This is intentionally browser-level: the live texture cache must contain
    // the wearing art, not just metadata or a catalog thumbnail.
    const dedicatedOutfitStates = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      const expectedTextures: Record<string, { wearing: string; thumbnail: string }> = {
        princess_dress: {
          wearing: 'character/outfits/princess_dress/idle.png',
          thumbnail: 'outfits/princess_dress/thumbnail.png',
        },
        scholar_robe: {
          wearing: 'character/outfits/scholar_gown/idle.png',
          thumbnail: 'outfits/scholar_gown/thumbnail.png',
        },
        dino_onesie: {
          wearing: 'character/outfits/dino_onesie/idle.png',
          thumbnail: 'outfits/dino_onesie/thumbnail.png',
        },
        magic_robe: {
          wearing: 'character/outfits/magic_robe/idle.png',
          thumbnail: 'outfits/magic_robe/thumbnail.png',
        },
      };
      const items = shop?.getVisibleWardrobeItems?.() ?? [];
      return Object.entries(expectedTextures).map(([id, assets]) => {
        const index = items.findIndex((item: any) => item.id === id);
        if (index < 0) throw new Error(`${id} is not in the dress catalogue`);
        shop.selectWardrobeItem(index);
        return {
          id,
          mode: shop.previewController?.lastRenderResult?.mode,
          texture: shop.previewController?.lastRenderResult?.textureKey,
          expectedTexture: assets.wearing,
          thumbnail: assets.thumbnail,
        };
      });
    });
    for (const state of dedicatedOutfitStates) {
      expect(state.mode, `${state.id} preview mode`).toBe('fullSprite');
      expect(state.texture, `${state.id} wearing texture`).toContain(state.expectedTexture);
      expect(state.texture, `${state.id} must not use thumbnail`).not.toContain(state.thumbnail);
      const alpha = await inspectLiveTextureAlpha(page, state.texture);
      expect(alpha, `${state.id} wearing texture must be loaded`).not.toBeNull();
      expect(alpha!.width, `${state.id} wearing width`).toBeGreaterThanOrEqual(512);
      expect(alpha!.height, `${state.id} wearing height`).toBeGreaterThanOrEqual(512);
      expect(alpha!.cornerAlpha, `${state.id} wearing corners must be transparent`).toEqual([0, 0, 0, 0]);
      expect(alpha!.visibleSamples, `${state.id} wearing texture must contain character art`).toBeGreaterThan(10);
    }

    const scholarPoseStates = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchWardrobeCategory('dress');
      const scholarIndex = shop.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (scholarIndex < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(scholarIndex);

      return (['stand', 'walk', 'cheer'] as const).map(pose => {
        shop.switchPose(pose);
        const result = shop.previewController?.lastRenderResult;
        return {
          pose,
          controllerPose: shop.previewController?.currentPose,
          mode: result?.mode,
          texture: result?.textureKey,
          poseFallback: result?.poseFallback,
        };
      });
    });
    for (const state of scholarPoseStates) {
      expect(state.mode, `${state.pose} render mode`).toBe('fullSprite');
      expect(state.texture, `${state.pose} wearing texture`).toContain('character/outfits/scholar_gown/idle.png');
      expect(state.controllerPose, `${state.pose} controller pose`).toBe(
        state.pose === 'stand' ? 'idle' : state.pose === 'walk' ? 'run' : 'cheer'
      );
      expect(state.poseFallback, `${state.pose} fallback flag`).toBe(state.pose !== 'stand');
    }

    // A Scale.FIT breakpoint rebuild must keep the active try-on, not only the
    // selected card index or persisted equipment.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(900);
    const compactTryOnState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      const selected = shop?.getVisibleWardrobeItems?.()[shop?.selectedWardrobeIndex];
      return {
        selectedId: selected?.id,
        previewDress: shop?.getPreviewWardrobe?.()?.dress,
        mode: shop?.previewController?.lastRenderResult?.mode,
        texture: shop?.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(compactTryOnState.selectedId).toBe('scholar_robe');
    expect(compactTryOnState.previewDress).toBe('scholar_robe');
    expect(compactTryOnState.mode).toBe('fullSprite');
    expect(compactTryOnState.texture).toContain('character/outfits/scholar_gown/idle.png');
    await expectCanvasFitsViewport(page);

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(900);
    await expectCanvasFitsViewport(page);

    const fullSpriteAccessoryState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchWardrobeCategory('accessory');
      const backpackIndex = shop.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'star_backpack'
      );
      if (backpackIndex < 0) throw new Error('Star Backpack is not in the accessory catalogue');
      shop.selectWardrobeItem(backpackIndex);
      return {
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
        wardrobe: shop.getPreviewWardrobe?.(),
      };
    });
    expect(fullSpriteAccessoryState.mode).toBe('fullSprite');
    expect(fullSpriteAccessoryState.texture).toContain('character/outfits/scholar_gown/idle.png');
    expect(fullSpriteAccessoryState.wardrobe?.accessory).toBe('star_backpack');
    await page.screenshot({ path: 'uat-report-screenshots/02b_Dream_Wardrobe_FullSprite_Backpack.png' });

    // Switching away from Cheer must cancel the old completion callback; after
    // the cheer duration, the selected Stand pose must still be active.
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.getScene('ShopScene')?.switchPose?.('stand');
    });
    await page.waitForTimeout(900);
    const postCheerState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      return {
        scenePose: shop.currentPose,
        controllerPose: shop.previewController?.currentPose,
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(postCheerState.scenePose).toBe('stand');
    expect(postCheerState.controllerPose).toBe('idle');
    expect(postCheerState.mode).toBe('fullSprite');
    expect(postCheerState.texture).toContain('character/outfits/scholar_gown/idle.png');

    const placeholderState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchWardrobeCategory('top');
      const items = shop.getVisibleWardrobeItems?.() ?? [];
      const index = items.findIndex((item: any) => item.id === 'hoodie_star');
      if (index < 0) throw new Error('Star Hoodie is not in the top catalogue');
      shop.selectWardrobeItem(index);
      return {
        action: shop.actionButton?.getText?.(),
        enabled: shop.actionButton?.isEnabled?.(),
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(placeholderState.action).toContain('美術準備中');
    expect(placeholderState.enabled).toBe(false);
    expect(placeholderState.mode).not.toBe('fullSprite');
    expect(placeholderState.texture).not.toContain('star_hoodie');
    await page.screenshot({ path: 'uat-report-screenshots/09_Dream_Wardrobe_Star_Hoodie_Placeholder.png' });

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchWardrobeCategory('dress');
      const scholarIndex = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (scholarIndex < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(scholarIndex);
    });

    // PM recording viewport (1662x920): dedicated outfit must remain clear.
    await page.setViewportSize({ width: 1662, height: 920 });
    await page.waitForTimeout(1000);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/01b_Dream_Wardrobe_Recording_1662x920.png' });

    // Wide but short mobile-landscape: the logical canvas remains 1280x720,
    // so the scene must use the browser height when choosing compact tabs.
    await page.setViewportSize({ width: 1280, height: 590 });
    await page.waitForTimeout(1000);
    const wideShortTabState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      const lastTab = shop?.tabButtons?.at?.(-1);
      return {
        compact: shop?.previewIsCompact,
        width: lastTab?.getButtonWidth?.(),
        right: (lastTab?.x ?? 0) + (lastTab?.getButtonWidth?.() ?? 0) / 2,
      };
    });
    expect(wideShortTabState.compact).toBe(true);
    expect(wideShortTabState.width).toBeLessThan(145);
    expect(wideShortTabState.right).toBeLessThan(520);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/01d_Dream_Wardrobe_WideShort_Landscape.png' });

    await page.setViewportSize({ width: 1662, height: 920 });
    await page.waitForTimeout(1000);
    await expectCanvasFitsViewport(page);

    // Switch to Accessories & Select Star Backpack
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.switchWardrobeCategory === 'function') {
        shop.switchWardrobeCategory('accessory');
      }
    });
    await page.waitForTimeout(1000);

    // Take Accessories Screenshot
    await page.screenshot({ path: 'uat-report-screenshots/02_Dream_Wardrobe_Accessories_Desktop.png' });

    // Test iPad Viewport (1024x768)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await expectCanvasFitsViewport(page);
    await page.screenshot({ path: 'uat-report-screenshots/03_Dream_Wardrobe_iPad_Landscape.png' });

    // Test 20:9 iPhone landscape viewport (844x390)
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1000);
    await expectCanvasFitsViewport(page);
    const compactAccessoryCatalog = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      return {
        cardCount: shop?.wardrobeItemButtons?.length ?? 0,
        pagerLabel: shop?.tabGameObjects?.find(
          (object: any) => typeof object?.text === 'string' && object.text.includes('第 1 /')
        )?.text ?? '',
      };
    });
    expect(compactAccessoryCatalog.cardCount).toBe(3);
    expect(compactAccessoryCatalog.pagerLabel).toContain('第 1 / 2 頁');
    await page.screenshot({ path: 'uat-report-screenshots/04_Dream_Wardrobe_iPhone_Landscape.png' });
  });

  test('honors browser reduced-motion preference during Wardrobe preview feedback', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchWardrobeCategory?.('dress');
      const scholarIndex = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (scholarIndex < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(scholarIndex);
      shop.previewController?.playTryOn?.({ dress: 'scholar_robe' });
      shop.previewController?.playCheer?.();
      return {
        sceneReducedMotion: shop.prefersReducedMotion,
        controllerPose: shop.previewController?.currentPose,
        renderMode: shop.previewController?.lastRenderResult?.mode,
        idleTween: Boolean(shop.previewController?.idleTween),
        tryOnTween: Boolean(shop.previewController?.tryOnTween),
        cheerTween: Boolean(shop.previewController?.cheerTween),
        walkTimer: Boolean(shop.walkAnimTimer),
      };
    });

    expect(state.sceneReducedMotion).toBe(true);
    expect(state.controllerPose).toBe('idle');
    expect(state.renderMode).toBe('fullSprite');
    expect(state.idleTween).toBe(false);
    expect(state.tryOnTween).toBe(false);
    expect(state.cheerTween).toBe(false);
    expect(state.walkTimer).toBe(false);
    await expectCanvasFitsViewport(page);
  });

  test('keeps the active Wardrobe try-on when switching to the skin catalogue', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchTab?.('wardrobe');
      shop?.switchWardrobeCategory?.('dress');
      const index = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
      const before = shop.previewController?.getWardrobe?.();
      shop.switchTab('skins');
      return {
        beforeDress: before?.dress,
        afterDress: shop.previewController?.getWardrobe?.()?.dress,
        previewDress: shop.getPreviewWardrobe?.()?.dress,
      };
    });

    expect(state.beforeDress).toBe('scholar_robe');
    expect(state.afterDress).toBe('scholar_robe');
    expect(state.previewDress).toBe('scholar_robe');
    await expectCanvasFitsViewport(page);
  });

  test('keeps the active Wardrobe try-on when the owned filter is empty', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchTab?.('wardrobe');
      shop?.switchWardrobeCategory?.('dress');
      const index = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
      shop.switchWardrobeFilter?.('owned');
      return {
        previewDress: shop.getPreviewWardrobe?.()?.dress,
        controllerDress: shop.previewController?.getWardrobe?.()?.dress,
        visibleCount: shop.getVisibleWardrobeItems?.().length,
      };
    });

    expect(state.visibleCount).toBe(0);
    expect(state.previewDress).toBe('scholar_robe');
    expect(state.controllerDress).toBe('scholar_robe');
    await expectCanvasFitsViewport(page);
  });

  test('renders the selected bottom when paired with a full-body top outfit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchWardrobeCategory?.('top');
      const topIndex = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'hk_school_shirt'
      );
      if (topIndex < 0) throw new Error('School Shirt is not in the top catalogue');
      shop.selectWardrobeItem(topIndex);

      shop.switchWardrobeCategory?.('bottom');
      const bottomIndex = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'denim_shorts'
      );
      if (bottomIndex < 0) throw new Error('Denim Shorts are not in the bottom catalogue');
      shop.selectWardrobeItem(bottomIndex);

      return {
        wardrobe: shop.getPreviewWardrobe?.(),
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });

    expect(state.wardrobe?.top).toBe('hk_school_shirt');
    expect(state.wardrobe?.bottom).toBe('denim_shorts');
    expect(state.mode).toBe('composite');
    expect(state.texture).not.toContain('school_uniform/idle.png');
    await expectCanvasFitsViewport(page);
  });

  test('keeps dedicated wearing art through Runner pose changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const profile = {
        name: 'FullSpriteRunner',
        coins: 0,
        gems: 0,
        stars: 0,
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer'],
        ownedWardrobe: ['hk_school_shirt'],
        equippedWardrobe: { top: 'hk_school_shirt' },
        ownedPets: [],
        ownedPetsData: [],
        equippedPet: '',
        unlockedStations: 1,
        stationStars: {},
        stats: { chineseCorrect: 0, mathCorrect: 0, englishCorrect: 0 },
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(profile));
    });
    await page.reload();
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('TitleScene');
      game?.scene.start('RunnerScene', {
        stationId: 'st_central',
        targetScore: 100,
      });
    });
    await page.waitForTimeout(900);

    const states = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      if (!runner) throw new Error('RunnerScene is not available');

      const inspect = (pose: 'idle' | 'run' | 'jump' | 'cheer') => {
        runner.applyRunnerPose(pose);
        return {
          pose,
          texture: runner.playerSprite?.texture?.key,
          dedicated: runner.runnerUsesDedicatedOutfitSprite,
          renderY: runner.playerSprite?.y,
        };
      };

      return [
        inspect('idle'),
        inspect('run'),
        inspect('jump'),
        inspect('cheer'),
      ];
    });

    expect(states.every((state: any) => state.dedicated)).toBe(true);
    expect(states.find((state: any) => state.pose === 'idle')?.texture).toContain(
      'character/outfits/school_uniform/idle.png'
    );
    expect(states.find((state: any) => state.pose === 'run')?.texture).toContain(
      'character/outfits/school_uniform/run.png'
    );
    // No jump artwork is registered yet; the shared resolver must remain on
    // the authored run wearing source instead of falling to the base sprite.
    expect(states.find((state: any) => state.pose === 'jump')?.texture).toContain(
      'character/outfits/school_uniform/run.png'
    );
    expect(states.find((state: any) => state.pose === 'cheer')?.texture).toContain(
      'character/outfits/school_uniform/cheer.png'
    );
    expect(states.every((state: any) => state.texture && !state.texture.includes('player_'))).toBe(true);
    await expectCanvasFitsViewport(page);
  });

  test('persists dedicated wearing art through Shop, Runner, Question, and reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const profile = {
        name: 'DedicatedPersistence',
        coins: 0,
        gems: 0,
        stars: 0,
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer'],
        ownedWardrobe: ['scholar_robe'],
        equippedWardrobe: { dress: 'scholar_robe' },
        ownedPets: [],
        equippedPet: '',
        unlockedStations: 1,
        stationStars: {},
        stats: { chineseCorrect: 0, mathCorrect: 0, englishCorrect: 0 },
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(profile));
    });
    await page.reload();
    await page.waitForTimeout(1400);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('TitleScene');
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const shopState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchTab('wardrobe');
      shop.switchWardrobeCategory('dress');
      const index = shop.getVisibleWardrobeItems().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
      return {
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
        wardrobe: shop.getPreviewWardrobe?.(),
      };
    });
    expect(shopState.mode).toBe('fullSprite');
    expect(shopState.texture).toContain('character/outfits/scholar_gown/idle.png');
    expect(shopState.wardrobe?.dress).toBe('scholar_robe');

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('ShopScene');
      game?.scene.start('RunnerScene', { stationId: 'st_central', targetScore: 100 });
    });
    await page.waitForTimeout(900);
    const runnerState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      runner.applyRunnerPose('run');
      return {
        dedicated: runner.runnerUsesDedicatedOutfitSprite,
        texture: runner.playerSprite?.texture?.key,
      };
    });
    expect(runnerState.dedicated).toBe(true);
    expect(runnerState.texture).toContain('character/outfits/scholar_gown/idle.png');

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('RunnerScene');
      game?.scene.start('QuestionScene', {
        stationId: 'st_central',
        sublevelId: 'c1',
        mode: 'choice',
      });
    });
    await page.waitForTimeout(1000);
    const questionState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const question = game?.scene.getScene('QuestionScene') as any;
      return {
        active: game?.scene.isActive?.('QuestionScene'),
        texture: question?.avatarBadge?.avatarSprite?.texture?.key,
      };
    });
    expect(questionState.active).toBe(true);
    expect(questionState.texture).toContain('character/outfits/scholar_gown/idle.png');

    await page.reload();
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('TitleScene');
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);
    const reloadedState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchTab('wardrobe');
      shop.switchWardrobeCategory('dress');
      const index = shop.getVisibleWardrobeItems().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      shop.selectWardrobeItem(index);
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return {
        owned: profile.ownedWardrobe,
        equipped: profile.equippedWardrobe,
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
      };
    });
    expect(reloadedState.owned).toContain('scholar_robe');
    expect(reloadedState.equipped?.dress).toBe('scholar_robe');
    expect(reloadedState.mode).toBe('fullSprite');
    expect(reloadedState.texture).toContain('character/outfits/scholar_gown/idle.png');
    await expectCanvasFitsViewport(page);
  });

  test('keeps the wearing character inside the stage across landscape layout buckets', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchWardrobeCategory?.('dress');
      const index = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
    });

    const viewports = [
      { name: 'logical-720p', width: 1280, height: 720 },
      { name: 'recording-size', width: 1662, height: 920 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'ipad-landscape', width: 1024, height: 768 },
      { name: 'mobile-landscape', width: 844, height: 390 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(700);
      const geometry = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const shop = game?.scene.getScene('ShopScene') as any;
        const logicalWidth = Number(game?.config?.width) || 1280;
        const logicalHeight = Number(game?.config?.height) || 720;
        const layout = shop?.getResponsiveWardrobeLayout?.(logicalWidth, logicalHeight);
        const boundsOf = (object: any) => {
          const bounds = object?.getBounds?.();
          return bounds
            ? { x: bounds.x, y: bounds.y, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height }
            : null;
        };
        const sprite = shop?.previewController?.sprite;
        const fullBounds = boundsOf(sprite);
        const texture = game?.textures?.get?.(sprite?.texture?.key);
        const source = texture?.getSourceImage?.() ?? texture?.source?.[0]?.image;
        const sourceWidth = Number(source?.naturalWidth || source?.width);
        const sourceHeight = Number(source?.naturalHeight || source?.height);
        let characterVisual = null;
        if (source && sourceWidth > 0 && sourceHeight > 0 && fullBounds) {
          const canvas = document.createElement('canvas');
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(source, 0, 0, sourceWidth, sourceHeight);
            const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
            let minX = sourceWidth;
            let minY = sourceHeight;
            let maxX = -1;
            let maxY = -1;
            for (let y = 0; y < sourceHeight; y += 1) {
              for (let x = 0; x < sourceWidth; x += 1) {
                if (pixels[(y * sourceWidth + x) * 4 + 3] <= 8) continue;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
            if (maxX >= minX && maxY >= minY) {
              characterVisual = {
                x: fullBounds.x + (minX / sourceWidth) * fullBounds.width,
                y: fullBounds.y + (minY / sourceHeight) * fullBounds.height,
                right: fullBounds.x + ((maxX + 1) / sourceWidth) * fullBounds.width,
                bottom: fullBounds.y + ((maxY + 1) / sourceHeight) * fullBounds.height,
                width: ((maxX + 1 - minX) / sourceWidth) * fullBounds.width,
                height: ((maxY + 1 - minY) / sourceHeight) * fullBounds.height,
              };
            }
          }
        }
        return {
          compact: layout?.compact,
          preview: layout?.preview,
          stage: layout?.stage,
          details: layout?.details,
          action: layout?.action,
          character: fullBounds,
          characterVisual,
          poseButtons: (shop?.poseButtons ?? []).map(boundsOf),
          actionButton: boundsOf(shop?.actionButton),
          texture: shop?.previewController?.lastRenderResult?.textureKey,
          mode: shop?.previewController?.lastRenderResult?.mode,
        };
      });

      expect(geometry.mode, `${viewport.name} render mode`).toBe('fullSprite');
      expect(geometry.texture, `${viewport.name} wearing source`).toContain('character/outfits/scholar_gown/idle.png');
      expect(geometry.character, `${viewport.name} character bounds`).not.toBeNull();
      expect(geometry.stage, `${viewport.name} stage bounds`).not.toBeNull();
      expect(geometry.character!.width, `${viewport.name} character presence`).toBeGreaterThan(100);
      expect(geometry.characterVisual, `${viewport.name} visible character bounds`).not.toBeNull();
      expect(geometry.characterVisual!.width, `${viewport.name} visible character presence`).toBeGreaterThan(70);
      expect(
        geometry.characterVisual!.height / geometry.preview!.height,
        `${viewport.name} visible character should fill at least 55% of the preview area`
      ).toBeGreaterThanOrEqual(0.55);
      expect(geometry.characterVisual!.x).toBeGreaterThanOrEqual(geometry.stage!.x - 2);
      expect(geometry.characterVisual!.right).toBeLessThanOrEqual(geometry.stage!.x + geometry.stage!.width + 2);
      expect(geometry.characterVisual!.y).toBeGreaterThanOrEqual(geometry.stage!.y - 2);
      expect(geometry.characterVisual!.bottom).toBeLessThanOrEqual(geometry.stage!.y + geometry.stage!.height + 2);
      expect(geometry.characterVisual!.bottom).toBeLessThanOrEqual(geometry.details!.y + 2);
      expect(geometry.actionButton, `${viewport.name} action button bounds`).not.toBeNull();
      expect(geometry.actionButton!.x).toBeGreaterThanOrEqual(geometry.preview!.x - 2);
      expect(geometry.actionButton!.right).toBeLessThanOrEqual(geometry.preview!.x + geometry.preview!.width + 2);
      expect(geometry.poseButtons).toHaveLength(3);
      expect(geometry.poseButtons.every((bounds: any) => (
        bounds
        && bounds.x >= geometry.preview.x - 2
        && bounds.right <= geometry.preview.x + geometry.preview.width + 2
        && bounds.y >= geometry.preview.y - 2
        && bounds.bottom <= geometry.preview.y + geometry.preview.height + 2
      ))).toBe(true);
      await expectCanvasFitsViewport(page);
    }
  });

  test('falls back without promoting a thumbnail when live wearing art is missing', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop?.switchWardrobeCategory?.('dress');
      const index = shop?.getVisibleWardrobeItems?.().findIndex(
        (item: any) => item.id === 'scholar_robe'
      );
      if (index < 0) throw new Error('Scholar Gown is not in the dress catalogue');
      shop.selectWardrobeItem(index);
      const before = shop.previewController?.lastRenderResult;
      const wearingKey = before?.textureKey;
      const removed = Boolean(wearingKey && game?.textures?.remove?.(wearingKey));
      shop.selectWardrobeItem(index);
      const after = shop.previewController?.lastRenderResult;
      return {
        removed,
        wearingKey,
        thumbnailExists: game?.textures?.exists?.('assets/outfits/scholar_gown/thumbnail.png'),
        wearingExists: wearingKey ? game?.textures?.exists?.(wearingKey) : true,
        beforeMode: before?.mode,
        afterMode: after?.mode,
        afterTexture: after?.textureKey,
      };
    });

    expect(state.removed).toBe(true);
    expect(state.beforeMode).toBe('fullSprite');
    expect(state.thumbnailExists).toBe(true);
    expect(state.wearingExists).toBe(false);
    expect(state.afterMode).toBe('composite');
    expect(state.afterTexture).not.toContain('scholar_gown');
    expect(state.afterTexture).not.toContain('thumbnail');
    await expectCanvasFitsViewport(page);
  });

  test('keeps a saved placeholder outfit safe across avatar consumers', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify({
        name: 'MissingArtFallback',
        coins: 0,
        gems: 0,
        stars: 0,
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer'],
        ownedWardrobe: ['hoodie_star'],
        equippedWardrobe: { top: 'hoodie_star' },
        ownedPets: [],
        equippedPet: '',
        unlockedStations: 1,
        stationStars: {},
        stats: { chineseCorrect: 0, mathCorrect: 0, englishCorrect: 0 },
      }));
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/?test=true');
    await page.waitForTimeout(1800);

    const collectTextureKeys = (sceneName: string) => page.evaluate((name) => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene.getScene(name) as any;
      const keys = new Set<string>();
      const visit = (objects: any[]) => {
        for (const object of objects ?? []) {
          const textureKey = object?.texture?.key;
          if (typeof textureKey === 'string') keys.add(textureKey);
          if (Array.isArray(object?.list)) visit(object.list);
        }
      };
      visit(scene?.children?.list);
      return {
        active: Boolean(game?.scene.isActive?.(name)),
        keys: [...keys],
      };
    }, sceneName);

    const titleState = await collectTextureKeys('TitleScene');
    expect(titleState.active).toBe(true);
    expect(titleState.keys).toContain('adventurer_cheer1');
    expect(titleState.keys.some(key => key.includes('star_hoodie'))).toBe(false);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('TitleScene');
      game?.scene.start('ShopScene');
    });
    await page.waitForTimeout(800);
    const shopState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game?.scene.getScene('ShopScene') as any;
      shop.switchTab('wardrobe');
      shop.switchWardrobeCategory('top');
      const index = shop.getVisibleWardrobeItems().findIndex((item: any) => item.id === 'hoodie_star');
      if (index < 0) throw new Error('Star Hoodie is not in the top catalogue');
      shop.selectWardrobeItem(index);
      return {
        mode: shop.previewController?.lastRenderResult?.mode,
        texture: shop.previewController?.lastRenderResult?.textureKey,
        action: shop.actionButton?.getText?.(),
      };
    });
    expect(shopState.mode).not.toBe('fullSprite');
    expect(shopState.texture).not.toContain('star_hoodie');
    expect(shopState.texture).not.toContain('thumbnail');
    expect(shopState.action).toContain('美術準備中');

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('ShopScene');
      game?.scene.start('MapScene');
    });
    await page.waitForTimeout(700);
    const mapState = await collectTextureKeys('MapScene');
    expect(mapState.active).toBe(true);
    expect(mapState.keys.some(key => key.includes('star_hoodie'))).toBe(false);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('MapScene');
      game?.scene.start('QuestionScene', {
        stationId: 'st_central',
        sublevelId: 'c1',
        mode: 'choice',
      });
    });
    await page.waitForTimeout(900);
    const questionState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const question = game?.scene.getScene('QuestionScene') as any;
      return {
        active: game?.scene.isActive?.('QuestionScene'),
        texture: question?.avatarBadge?.avatarSprite?.texture?.key,
      };
    });
    expect(questionState.active).toBe(true);
    expect(questionState.texture).toBe('adventurer_stand');

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene.stop('QuestionScene');
      game?.scene.start('RunnerScene', { stationId: 'st_central', targetScore: 100 });
    });
    await page.waitForTimeout(900);
    const runnerState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game?.scene.getScene('RunnerScene') as any;
      runner.applyRunnerPose('idle');
      return {
        active: game?.scene.isActive?.('RunnerScene'),
        dedicated: runner.runnerUsesDedicatedOutfitSprite,
        texture: runner.playerSprite?.texture?.key,
      };
    });
    expect(runnerState.active).toBe(true);
    expect(runnerState.dedicated).toBe(false);
    expect(runnerState.texture).toBe('adventurer_stand');
    expect(pageErrors).toEqual([]);
    await expectCanvasFitsViewport(page);
  });
});
