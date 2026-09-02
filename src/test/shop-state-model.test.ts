import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';

describe('Enhancement 8: Shop Item State Model & Transaction Safety', () => {
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

  it('determines correct state for items (locked, available_not_owned, owned_not_equipped, equipped)', () => {
    const dm = DataManager.getInstance();

    // Default state: Adventurer is equipped
    expect(dm.getProfile().equippedSkin).toBe('adventurer');
    expect(dm.getProfile().ownedSkins).toContain('adventurer');

    // Heroine is unowned (available_not_owned)
    expect(dm.getProfile().ownedSkins).not.toContain('heroine');

    // Add gems and buy Heroine
    dm.recordTransaction('learning', 'bonus', 'gems', 50);
    const bought = dm.unlockSkin('heroine', 30, 0);
    expect(bought).toBe(true);

    // Heroine is now owned_not_equipped
    expect(dm.getProfile().ownedSkins).toContain('heroine');
    expect(dm.getProfile().equippedSkin).toBe('adventurer');

    // Equip Heroine -> becomes equipped
    dm.equipSkin('heroine');
    expect(dm.getProfile().equippedSkin).toBe('heroine');
  });

  it('deducts currency via ledger on shop purchase', () => {
    const dm = DataManager.getInstance();
    dm.recordTransaction('learning', 'bonus', 'gems', 100);

    const initialGems = dm.getProfile().gems;
    expect(initialGems).toBe(100);

    const bought = dm.unlockSkin('knight', 100, 0);
    expect(bought).toBe(true);
    expect(dm.getProfile().gems).toBe(0);
    expect(dm.getProfile().ownedSkins).toContain('knight');
  });
});
