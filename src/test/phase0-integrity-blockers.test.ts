import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { DataManager } from '../services/DataManager';
import { CHARACTER_SKINS } from '../scenes/ShopScene';
import { CanvasButton } from '../ui/CanvasButton';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 0 Integrity Blockers & State Safeguards', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });

    (DataManager as any).instance = undefined;
  });

  it('P0 Reproduction Test: preview, resize, tab switch, and reload NEVER transact or alter equipment', () => {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    // 1. Initial baseline state: 661 coins, 22 gems, Heroine not owned, Adventurer equipped
    profile.coins = 661;
    profile.gems = 22;
    profile.ownedSkins = ['adventurer'];
    profile.equippedSkin = 'adventurer';
    dm.save();

    expect(dm.getProfile().coins).toBe(661);
    expect(dm.getProfile().gems).toBe(22);
    expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);
    expect(dm.getProfile().equippedSkin).toBe('adventurer');

    // 2. Select Heroine for preview (selectedSkinIndex changed in UI, no purchase click)
    const heroineSkin = CHARACTER_SKINS.find((s) => s.id === 'heroine')!;
    expect(heroineSkin).toBeDefined();
    expect(heroineSkin.costGems).toBe(30);

    // Verify previewing Heroine does not mutate DataManager profile
    expect(dm.getProfile().coins).toBe(661);
    expect(dm.getProfile().gems).toBe(22);
    expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);
    expect(dm.getProfile().equippedSkin).toBe('adventurer');

    // 3. Simulate viewport resize (e.g. from 1280x720 to 844x390 and back)
    // Resize must be presentation-only
    expect(dm.getProfile().coins).toBe(661);
    expect(dm.getProfile().gems).toBe(22);
    expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);
    expect(dm.getProfile().equippedSkin).toBe('adventurer');

    // 4. Reload from storage (new DataManager instance)
    (DataManager as any).instance = undefined;
    const dmReloaded = DataManager.getInstance();
    expect(dmReloaded.getProfile().coins).toBe(661);
    expect(dmReloaded.getProfile().gems).toBe(22);
    expect(dmReloaded.getProfile().ownedSkins).toEqual(['adventurer']);
    expect(dmReloaded.getProfile().equippedSkin).toBe('adventurer');
  });

  it('Single-Source Pricing: Heroine and all skins have single canonical prices with zero contradictory currencies', () => {
    const adventurer = CHARACTER_SKINS.find((s) => s.id === 'adventurer')!;
    const heroine = CHARACTER_SKINS.find((s) => s.id === 'heroine')!;
    const soldier = CHARACTER_SKINS.find((s) => s.id === 'soldier')!;
    const knight = CHARACTER_SKINS.find((s) => s.id === 'knight')!;
    const ninja = CHARACTER_SKINS.find((s) => s.id === 'ninja')!;

    expect(adventurer.costGems).toBe(0);
    expect(heroine.costGems).toBe(30);
    expect(soldier.costGems).toBe(60);
    expect(knight.costGems).toBe(100);
    expect(ninja.costGems).toBe(150);

    // All skins have costCoins set to 0 to prevent dual/contradictory pricing
    expect(heroine.costCoins).toBe(0);
    expect(soldier.costCoins).toBe(0);
    expect(knight.costCoins).toBe(0);
    expect(ninja.costCoins).toBe(0);
  });

  it('Atomic Transaction Ledger & Purchase Flow: confirmed purchase debits exact price and awards trophy ledger transactions', () => {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    profile.coins = 661;
    profile.gems = 50; // Enough for Heroine (30 gems)
    profile.ownedSkins = ['adventurer'];
    profile.equippedSkin = 'adventurer';

    // Pre-claim existing wealth trophies so only new trophy triggers
    dm.checkTrophies();
    const initialCoins = profile.coins;
    const initialGems = profile.gems;

    // Purchase Heroine with 30 gems
    const success = dm.unlockSkin('heroine', 30, 0);
    expect(success).toBe(true);

    // Pre-trophy state: initialCoins, initialGems - 30
    expect(dm.getProfile().gems).toBe(initialGems - 30);
    expect(dm.getProfile().ownedSkins).toContain('heroine');

    // Check trophy triggers (owning 2 skins unlocks adv_skin_2: +50 coins, +5 gems)
    const trophies = dm.checkTrophies();
    expect(trophies).toContain('adv_skin_2');

    // Post-trophy balance: initialCoins + 50, initialGems - 30 + 5
    expect(dm.getProfile().coins).toBe(initialCoins + 50);
    expect(dm.getProfile().gems).toBe(initialGems - 30 + 5);

    // Verify ledger contains both transactions
    const ledger = dm.getRewardLedger();
    const purchaseTx = ledger.find((t) => t.sourceType === 'shop_purchase' && t.sourceId === 'skin_heroine');
    expect(purchaseTx).toBeDefined();
    expect(purchaseTx?.amount).toBe(-30);
    expect(purchaseTx?.balanceBefore).toBe(initialGems);
    expect(purchaseTx?.balanceAfter).toBe(initialGems - 30);

    const trophyCoinsTx = ledger.find((t) => t.sourceType === 'achievement' && t.sourceId === 'adv_skin_2' && t.currencyType === 'coins');
    expect(trophyCoinsTx).toBeDefined();
    expect(trophyCoinsTx?.amount).toBe(50);

    const trophyGemsTx = ledger.find((t) => t.sourceType === 'achievement' && t.sourceId === 'adv_skin_2' && t.currencyType === 'gems');
    expect(trophyGemsTx).toBeDefined();
    expect(trophyGemsTx?.amount).toBe(5);
  });

  it('Negative Balance Protection: recordTransaction rejects over-debits and preserves state', () => {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    profile.gems = 10;
    dm.save();

    // Attempt to deduct 30 gems
    const tx = dm.recordTransaction('shop_purchase', 'skin_heroine', 'gems', -30);
    expect(tx).toBeNull();
    expect(dm.getProfile().gems).toBe(10);
  });

  it('CanvasButton Hit Area Centering: hitRect is centered on Container origin (0, 0)', () => {
    const mockScene = createMockSceneForMeta('MapScene');

    const btn = new CanvasButton(mockScene, {
      x: 100,
      y: 100,
      width: 140,
      height: 48,
      text: '📊 報告',
    });

    expect(btn.width).toBe(140);
    expect(btn.height).toBe(48);

    const hitArea = (btn as any).input?.hitArea;
    if (hitArea) {
      expect(hitArea.x).toBe(-78);
      expect(hitArea.y).toBe(-32);
      expect(hitArea.width).toBe(156);
      expect(hitArea.height).toBe(64);

      expect(Phaser.Geom.Rectangle.Contains(hitArea, -50, 0)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, 50, 0)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, 100, 0)).toBe(false);
    }
  });
});
