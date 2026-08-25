import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';

describe('Wardrobe & Modular Dress-up System', () => {
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

  it('retrieves wardrobe items by category', () => {
    const dm = DataManager.getInstance();
    const all = dm.getWardrobeItems();
    expect(all.length).toBeGreaterThan(10);

    const dresses = dm.getWardrobeItems('dress');
    expect(dresses.every((i) => i.category === 'dress')).toBe(true);

    const accessories = dm.getWardrobeItems('accessory');
    expect(accessories.some((i) => i.id === 'angel_wings')).toBe(true);
    expect(accessories.some((i) => i.id === 'star_glasses')).toBe(true);
  });

  it('buys clothing items with coins and gem fallback', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().coins = 300;
    dm.getProfile().gems = 50;

    // Buy princess dress (250 coins)
    const success1 = dm.buyWardrobeItem('princess_dress', 'coins');
    expect(success1).toBe(true);
    expect(dm.getProfile().coins).toBe(50);
    expect(dm.isWardrobeOwned('princess_dress')).toBe(true);

    // Cannot buy again
    expect(dm.buyWardrobeItem('princess_dress', 'coins')).toBe(false);

    // Buy angel wings with gems (15 gems)
    const success2 = dm.buyWardrobeItem('angel_wings', 'gems');
    expect(success2).toBe(true);
    expect(dm.getProfile().gems).toBe(35);
    expect(dm.isWardrobeOwned('angel_wings')).toBe(true);
  });

  it('equips and unequips individual wardrobe slots', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().coins = 1000;
    dm.buyWardrobeItem('princess_dress', 'coins');
    dm.buyWardrobeItem('angel_wings', 'coins');
    dm.buyWardrobeItem('cat_ears', 'coins');

    // Equip dress
    dm.equipWardrobeItem('dress', 'princess_dress');
    expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');

    // Equip accessory and wings
    dm.equipWardrobeItem('hat', 'cat_ears');
    dm.equipWardrobeItem('wings', 'angel_wings');

    const eq = dm.getEquippedWardrobe();
    expect(eq.dress).toBe('princess_dress');
    expect(eq.hat).toBe('cat_ears');
    expect(eq.wings).toBe('angel_wings');

    // Unequip hat
    dm.unequipWardrobeItem('hat');
    expect(dm.getEquippedWardrobe().hat).toBeUndefined();
    expect(dm.getEquippedWardrobe().wings).toBe('angel_wings');

    // Clear all
    dm.clearAllWardrobe();
    expect(dm.getEquippedWardrobe().dress).toBeUndefined();
    expect(dm.getEquippedWardrobe().wings).toBeUndefined();
  });
});
