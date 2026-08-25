import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager, PET_DEFINITIONS, GADGET_DEFINITIONS } from '../services/DataManager';

describe('DataManager Pets & Inventory System', () => {
  let dm: DataManager;
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
    dm = DataManager.getInstance();
  });

  it('initializes default profile with empty ownedPets and empty inventory', () => {
    const profile = dm.getProfile();
    expect(profile.ownedPets).toEqual([]);
    expect(profile.equippedPet).toBe('');
    expect(profile.inventory).toEqual({});
  });

  it('allows purchasing a pet with gems when balance is sufficient', () => {
    dm.addGems(50);
    const pet = PET_DEFINITIONS[0]; // Dino 30 gems
    const success = dm.buyPet(pet.id, 'gems');
    expect(success).toBe(true);

    const profile = dm.getProfile();
    expect(profile.ownedPets).toContain(pet.id);
    expect(profile.equippedPet).toBe(pet.id);
    expect(profile.gems).toBe(50 - pet.costGems);
  });

  it('allows purchasing a pet with coins', () => {
    dm.addCoins(1000);
    const pet = PET_DEFINITIONS[1]; // Mecha Cat 500 coins
    const success = dm.buyPet(pet.id, 'coins');
    expect(success).toBe(true);

    const profile = dm.getProfile();
    expect(profile.ownedPets).toContain(pet.id);
    expect(profile.equippedPet).toBe(pet.id);
    expect(profile.coins).toBe(1000 - pet.costCoins);
  });

  it('prevents purchasing pet when currency is insufficient', () => {
    const pet = PET_DEFINITIONS[2]; // Pixie Dragon
    const success = dm.buyPet(pet.id, 'gems');
    expect(success).toBe(false);
    expect(dm.getProfile().ownedPets).not.toContain(pet.id);
  });

  it('allows equipping and unequipping owned pets', () => {
    dm.addGems(200);
    dm.buyPet('dino');
    dm.buyPet('mecha_cat');

    expect(dm.getProfile().equippedPet).toBe('mecha_cat');

    dm.equipPet('dino');
    expect(dm.getProfile().equippedPet).toBe('dino');

    dm.equipPet('');
    expect(dm.getProfile().equippedPet).toBe('');
  });

  it('allows purchasing and consuming inventory gadgets', () => {
    dm.addCoins(200);
    const shield = GADGET_DEFINITIONS[0]; // Shield 50 coins

    const buySuccess = dm.buyGadget(shield.id, 2, 'coins');
    expect(buySuccess).toBe(true);
    expect(dm.getGadgetCount(shield.id)).toBe(2);
    expect(dm.getProfile().coins).toBe(200 - (shield.costCoins * 2));

    const consumeSuccess = dm.consumeGadget(shield.id);
    expect(consumeSuccess).toBe(true);
    expect(dm.getGadgetCount(shield.id)).toBe(1);

    dm.consumeGadget(shield.id);
    expect(dm.getGadgetCount(shield.id)).toBe(0);

    const consumeEmpty = dm.consumeGadget(shield.id);
    expect(consumeEmpty).toBe(false);
  });
});
