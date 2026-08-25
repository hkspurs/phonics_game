import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { DataManager } from '../services/DataManager';

describe('ShopScene 4 Tabs & Wardrobe Live Fitting Room', () => {
  let scene: ShopScene;
  let mock: any;
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
    const dm = DataManager.getInstance();
    dm.getProfile().coins = 1000;
    dm.getProfile().gems = 100;

    mock = createMockSceneForMeta('ShopScene');
    scene = new ShopScene();
    Object.assign(scene, mock);
  });

  it('switches between Skins, Wardrobe, Pets, and Gadgets tabs', () => {
    scene.create();
    expect(scene.currentTab).toBe('skins');

    // Switch to Wardrobe
    scene.switchTab('wardrobe');
    expect(scene.currentTab).toBe('wardrobe');

    // Switch to Pets
    scene.switchTab('pets');
    expect(scene.currentTab).toBe('pets');

    // Switch to Gadgets
    scene.switchTab('gadgets');
    expect(scene.currentTab).toBe('gadgets');
  });

  it('switches wardrobe sub-categories (Dresses, Tops, Bottoms, Accessories)', () => {
    scene.create();
    scene.switchTab('wardrobe');

    scene.switchWardrobeCategory('top');
    expect(scene.currentWardrobeCategory).toBe('top');

    scene.switchWardrobeCategory('bottom');
    expect(scene.currentWardrobeCategory).toBe('bottom');

    scene.switchWardrobeCategory('accessory');
    expect(scene.currentWardrobeCategory).toBe('accessory');
  });

  it('allows purchasing, equipping, and unequipping clothing items in Wardrobe tab', () => {
    const dm = DataManager.getInstance();
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');

    // 1. Buy Princess Dress (idx 0)
    scene.selectWardrobeItem(0);
    expect(scene.actionButton?.getText()).toContain('立即購買');

    scene.handleActionClick();
    expect(dm.isWardrobeOwned('princess_dress')).toBe(true);
    expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');

    // 2. Action button should now update to unequip
    scene.updatePreviewDisplay();
    expect(scene.actionButton?.getText()).toContain('脫下衣物');

    // 3. Click to unequip
    scene.handleActionClick();
    expect(dm.getEquippedWardrobe().dress).toBeUndefined();
  });

  it('switches preview poses (Stand, Walk, Cheer)', () => {
    scene.create();
    expect(scene.currentPose).toBe('stand');

    scene.switchPose('walk');
    expect(scene.currentPose).toBe('walk');

    scene.switchPose('cheer');
    expect(scene.currentPose).toBe('cheer');
  });

  it('opens and closes OOTD Photo Booth modal', () => {
    scene.create();
    scene.showOOTDPhotoModal();
    expect(scene['ootdModal']).not.toBeNull();

    scene.closeOOTDPhotoModal();
    expect(scene['ootdModal']).toBeNull();
  });
});
