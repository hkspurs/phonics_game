import { expect, type Page } from '@playwright/test';

export async function waitForWardrobeAssets(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return shop?.assetLoadState?.wardrobe;
  }), { timeout: 15000 }).toBe('complete');
}

export async function selectReadyWardrobeItem(
  page: Page,
  category: string,
  itemId: string,
  expectedAction = '立即購買',
): Promise<void> {
  await waitForWardrobeAssets(page);
  await page.evaluate(({ category: selectedCategory, itemId: selectedItemId }) => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    shop?.switchWardrobeCategory?.(selectedCategory);
    const index = shop?.getVisibleWardrobeItems?.().findIndex(
      (item: { id: string }) => item.id === selectedItemId,
    );
    if (index == null || index < 0) throw new Error(`${selectedItemId} is not in the ${selectedCategory} catalogue`);
    shop.selectWardrobeItem(index);
  }, { category, itemId });
  await expect.poll(() => page.evaluate(({ selectedItemId, actionText }) => {
    const shop = (window as any).__PHASER_GAME__?.scene.getScene('ShopScene');
    return {
      item: shop?.getVisibleWardrobeItems?.()[shop?.selectedWardrobeIndex]?.id,
      enabled: shop?.actionButton?.isEnabled?.(),
      actionMatches: shop?.actionButton?.getText?.().includes(actionText),
    };
  }, { selectedItemId: itemId, actionText: expectedAction }), { timeout: 10000 })
    .toEqual({ item: itemId, enabled: true, actionMatches: true });
}
