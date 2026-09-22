import { test, expect } from '@playwright/test';
import { selectReadyWardrobeItem } from './helpers/wardrobe';

test('deferred wardrobe failure never charges and retry restores one safe purchase', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    localStorage.setItem('p1_adventure_save_v1', JSON.stringify({
      coins: 0,
      gems: 30,
      ownedWardrobe: [],
      equippedWardrobe: {},
    }));
  });
  let allowRequest = false;
  await page.route('**/assets/character/outfits/scholar_gown/idle.png', async route => {
    if (allowRequest) return route.continue();
    await new Promise(resolve => setTimeout(resolve, 800));
    await route.abort('failed');
  });
  await page.goto('/?test=true');
  await expect(page.locator('.home-view')).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => setTimeout(() => (window as any).__PHASER_GAME__?.scene.start('ShopScene'), 0));
  await expect.poll(() => page.evaluate(() => Boolean(
    (window as any).__PHASER_GAME__?.scene.isActive('ShopScene')
  )), { timeout: 10000 }).toBe(true);

  const before = await page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    shop.switchTab('wardrobe');
    shop.handleActionClick();
    return JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}').gems;
  });
  expect(before).toBe(30);
  await expect.poll(() => page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return { state: shop?.assetLoadState?.wardrobe, action: shop?.actionButton?.getText?.() };
  }), { timeout: 15000 }).toEqual({ state: 'error', action: '↻ 重新載入服裝圖片' });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}').gems)).toBe(30);

  allowRequest = true;
  await page.evaluate(() => (window as any).__PHASER_GAME__?.scene.getScene('ShopScene')?.handleActionClick());
  await selectReadyWardrobeItem(page, 'dress', 'scholar_robe');
  await page.evaluate(() => (window as any).__PHASER_GAME__?.scene.getScene('ShopScene')?.handleActionClick());
  await expect.poll(() => page.evaluate(() =>
    (window as any).__PHASER_GAME__?.scene.getScene('ShopScene')?.purchaseModal?.getTitle?.()
  ), { timeout: 5000 }).toBe('🛒 確認購買');
  await page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    const confirm = shop.purchaseModal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買',
    );
    confirm?.triggerClick();
    confirm?.triggerClick();
  });
  await expect.poll(() => page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
    return {
      gems: profile.gems,
      ownedCount: (profile.ownedWardrobe ?? []).filter((id: string) => id === 'scholar_robe').length,
      ledgerCount: (profile.rewardLedger ?? []).filter((entry: { sourceType: string; sourceId: string }) =>
        entry.sourceType === 'shop_purchase' && entry.sourceId === 'wardrobe_scholar_robe'
      ).length,
    };
  }), { timeout: 10000 }).toEqual({ gems: 0, ownedCount: 1, ledgerCount: 1 });
});

test('rapid wardrobe and pet tab changes keep both asset groups independent', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/?test=true');
  await expect(page.locator('.home-view')).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => setTimeout(() => (window as any).__PHASER_GAME__?.scene.start('ShopScene'), 0));
  await expect.poll(() => page.evaluate(() => Boolean(
    (window as any).__PHASER_GAME__?.scene.isActive('ShopScene')
  )), { timeout: 10000 }).toBe(true);
  await page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    shop.switchTab('wardrobe');
    shop.switchTab('pets');
    shop.switchTab('wardrobe');
  });
  await expect.poll(() => page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return { tab: shop?.currentTab, wardrobe: shop?.assetLoadState?.wardrobe, pets: shop?.assetLoadState?.pets };
  }), { timeout: 15000 }).toEqual({ tab: 'wardrobe', wardrobe: 'complete', pets: 'complete' });

  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    game.scene.stop('ShopScene');
    game.scene.start('TitleScene');
    game.scene.start('ShopScene');
  });
  await expect.poll(() => page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return Boolean(shop?.scene?.isActive?.() && shop?.runtimeAssetLoader);
  }), { timeout: 10000 }).toBe(true);
  await page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    shop.switchTab('wardrobe');
  });
  await expect.poll(() => page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return { tab: shop?.currentTab, wardrobe: shop?.assetLoadState?.wardrobe };
  }), { timeout: 10000 }).toEqual({ tab: 'wardrobe', wardrobe: 'complete' });
});
