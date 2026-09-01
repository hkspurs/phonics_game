import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { DataManager } from '../services/DataManager';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { getWardrobeLayout } from '../ui/wardrobeLayout';

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

  it('keeps an active try-on outfit while browsing another wardrobe category', () => {
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');

    scene.switchWardrobeCategory('accessory');
    scene.selectWardrobeItem(0);

    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
  });

  it('keeps the character preview aligned with the active try-on when switching skin tab', () => {
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);

    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
    scene.switchTab('skins');

    expect((scene as any).previewController?.getWardrobe?.().dress).toBe('scholar_robe');
  });

  it('keeps the active try-on aligned when an empty wardrobe filter is selected', () => {
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);

    scene.switchWardrobeFilter('owned');

    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
    expect((scene as any).previewController?.getWardrobe?.().dress).toBe('scholar_robe');
  });

  it('labels selected non-equipped shop cards without relying on color alone', () => {
    const markerTexts = () => mock.add.text.mock.calls.map((call: any[]) => call[2]);

    scene.create();
    scene.selectSkin(1);
    expect(scene.skinCardTextObjects[1]?.marker?.text).toBe('👀 預覽中');
    expect((scene.skinCardTextObjects[1]?.marker as any)?.visible).toBe(true);

    scene.switchTab('pets');
    mock.add.text.mockClear();
    scene.selectPet(1);
    expect(markerTexts()).toContain('👀 預覽中');

    scene.switchTab('gadgets');
    mock.add.text.mockClear();
    scene.selectGadget(1);
    expect(markerTexts()).toContain('👀 預覽中');
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

  it('does not queue a second live wardrobe purchase while confirmation is pending', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();

    confirmButton.emit('pointerup');
    scene.handleActionClick();
    confirmButton.emit('pointerup');

    expect(mock.time.delayedCall).toHaveBeenCalledTimes(1);
    expect((scene as any).purchaseModal).toBeNull();
    delayedPurchase?.();
    expect(DataManager.getInstance().isWardrobeOwned('scholar_robe')).toBe(true);
  });

  it('shows a disabled processing state while a live wardrobe purchase is pending', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();
    confirmButton.emit('pointerup');

    expect(scene.actionButton?.getText()).toBe('⏳ 購買中…');
    expect(scene.actionButton?.isEnabled()).toBe(false);

    delayedPurchase?.();
    expect(scene.actionButton?.getText()).toBe('❌ 脫下衣物');
    expect(scene.actionButton?.isEnabled()).toBe(true);
  });

  it('keeps the confirmed item selected while its purchase callback is pending', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();
    confirmButton.emit('pointerup');

    scene.selectWardrobeItem(0);

    expect((scene as any).selectedWardrobeIndex).toBe(1);
    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
    delayedPurchase?.();
  });

  it('locks Wardrobe navigation while its purchase callback is pending', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();
    confirmButton.emit('pointerup');

    scene.switchWardrobeCategory('accessory');
    scene.switchWardrobeFilter('owned');
    scene.switchTab('pets');

    expect(scene.currentTab).toBe('wardrobe');
    expect(scene.currentWardrobeCategory).toBe('dress');
    expect(scene.currentWardrobeFilter).toBe('dress');
    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');

    delayedPurchase?.();
  });

  it('does not restart Wardrobe across a breakpoint while purchase is pending', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    try {
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(1);
      scene.handleActionClick();

      const modal = (scene as any).purchaseModal;
      const confirmButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 確認購買'
      );
      expect(confirmButton).toBeDefined();
      confirmButton.emit('pointerup');

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
      (scene as any).handleScaleResize();

      expect(mock.scene.restart).not.toHaveBeenCalled();
      delayedPurchase?.();
      expect(DataManager.getInstance().isWardrobeOwned('scholar_robe')).toBe(true);
      expect(DataManager.getInstance().getEquippedWardrobe().dress).toBe('scholar_robe');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('keeps header navigation from cancelling a confirmed purchase callback', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();
    confirmButton.emit('pointerup');

    scene.homeButton?.emit('pointerup');
    scene.mapButton?.emit('pointerup');

    expect(mock.scene.start).not.toHaveBeenCalled();
    delayedPurchase?.();
    expect(DataManager.getInstance().isWardrobeOwned('scholar_robe')).toBe(true);
    expect(DataManager.getInstance().getEquippedWardrobe().dress).toBe('scholar_robe');
  });

  it('keeps the OOTD modal closed while a confirmed purchase callback is pending', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail') || key.includes('/idle.png'));

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1);
    scene.handleActionClick();

    const modal = (scene as any).purchaseModal;
    const confirmButton = modal?.getContentContainer?.().list?.find(
      (child: any) => child?.getText?.() === '✅ 確認購買'
    );
    expect(confirmButton).toBeDefined();
    confirmButton.emit('pointerup');

    scene.showOOTDPhotoModal();

    expect((scene as any).ootdModal).toBeNull();
    delayedPurchase?.();
    expect(DataManager.getInstance().isWardrobeOwned('scholar_robe')).toBe(true);
  });

  it('keeps the compact Wardrobe page while a purchase callback is pending', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
    (scene as any).sys.settings.active = true;

    let delayedPurchase: (() => void) | undefined;
    mock.time.delayedCall = vi.fn((_delay: number, callback: () => void) => {
      delayedPurchase = callback;
      return { remove: vi.fn() };
    });

    try {
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('accessory');
      scene.selectWardrobeItem(0);
      scene.handleActionClick();

      const modal = (scene as any).purchaseModal;
      const confirmButton = modal?.getContentContainer?.().list?.find(
        (child: any) => child?.getText?.() === '✅ 確認購買'
      );
      expect(confirmButton).toBeDefined();
      confirmButton.emit('pointerup');

      const nextPage = (scene as any).tabGameObjects.find(
        (object: any) => typeof object?.getText === 'function' && object.getText() === '›'
      );
      expect(nextPage?.isEnabled?.()).toBe(true);
      nextPage.triggerClick();

      expect((scene as any).wardrobePage).toBe(0);
      expect((scene as any).selectedWardrobeIndex).toBe(0);
      delayedPurchase?.();
      expect(DataManager.getInstance().isWardrobeOwned('angel_wings')).toBe(true);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('switches preview poses (Stand, Walk, Cheer)', () => {
    scene.create();
    expect(scene.currentPose).toBe('stand');

    scene.switchPose('walk');
    expect(scene.currentPose).toBe('walk');

    scene.switchPose('cheer');
    expect(scene.currentPose).toBe('cheer');
  });

  it('suppresses the preview loop timer and infinite tween in reduced motion', () => {
    (scene as any).prefersReducedMotion = true;

    scene.create();

    expect((scene as any).walkAnimTimer).toBeNull();
    const configs = mock.tweens.add.mock.calls.map(([config]: any[]) => config);
    expect(configs.some((config: any) => config.repeat === -1)).toBe(false);
  });

  it('suppresses non-essential selected-card feedback in reduced motion', () => {
    (scene as any).prefersReducedMotion = true;

    scene.create();
    scene.switchTab('wardrobe');
    mock.tweens.add.mockClear();

    (scene as any).playWardrobeSelectionFeedback();

    expect(mock.tweens.add).not.toHaveBeenCalled();
  });

  it('suppresses purchase celebration particles in reduced motion', () => {
    (scene as any).prefersReducedMotion = true;
    mock.add.text.mockClear();
    mock.tweens.add.mockClear();

    (scene as any).createPurchaseCelebration(400);

    expect(mock.add.text).not.toHaveBeenCalled();
    expect(mock.tweens.add).not.toHaveBeenCalled();
  });

  it('keeps reduced-motion sync toast static and schedules cleanup', () => {
    (scene as any).prefersReducedMotion = true;
    mock.tweens.add.mockClear();
    mock.time.delayedCall.mockClear();

    scene.showGlobalSyncToast('✨ 已套用至全遊戲！');

    expect(mock.tweens.add).not.toHaveBeenCalled();
    expect(mock.time.delayedCall).toHaveBeenCalledWith(1600, expect.any(Function));
  });

  it('uses one readable compact catalogue column', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });

    try {
      scene.create();
      scene.switchTab('wardrobe');

      const xPositions = new Set((scene as any).wardrobeItemButtons.map((button: any) => button.x));
      expect(xPositions.size).toBe(1);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('uses compact top-tab geometry on a wide but short landscape viewport', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 590 });

    try {
      scene.create();

      const lastTab = scene.tabButtons.at(-1);
      const compactLayout = getWardrobeLayout(1280, 720, true);
      const lastTabRight = (lastTab?.x ?? 0) + (lastTab?.getButtonWidth?.() ?? 0) / 2;

      expect(lastTab?.getButtonWidth()).toBeLessThan(145);
      expect(lastTabRight).toBeLessThanOrEqual(compactLayout.items.x + compactLayout.items.width);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('limits compact category catalogues to three cards per page', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });

    try {
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('accessory');

      expect(scene.wardrobeItemButtons).toHaveLength(3);
      const nextPage = (scene as any).tabGameObjects.find(
        (object: any) => typeof object?.getText === 'function' && object.getText() === '›'
      );
      expect(nextPage?.isEnabled?.()).toBe(true);
      nextPage.triggerClick();
      expect((scene as any).wardrobePage).toBe(1);
      expect(scene.wardrobeItemButtons).toHaveLength(3);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('keeps compact wardrobe controls and preview copy touch/readable', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });

    try {
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(0);

      const controls = [
        ...scene.tabButtons,
        ...scene.wardrobeFilterButtons,
        ...scene.subCategoryButtons,
        ...scene.poseButtons,
        scene.ootdButton,
      ].filter(Boolean) as any[];
      expect(controls.every(button => button.getButtonHeight() >= 44)).toBe(true);
      const controlFontSizes = controls.map(button => {
        const label = button.list?.find((child: any) => typeof child?.text === 'string');
        return Number.parseInt(String(label?.style?.fontSize), 10);
      });
      expect(controlFontSizes.every(size => size >= 16)).toBe(true);

      const previewText = [
        scene.previewNameText,
        scene.previewDescText,
        scene.previewSpeedText,
        scene.previewJumpText,
        scene.previewSpecialText,
      ].filter(Boolean) as any[];
      expect(previewText.every(text => Number.parseInt(String(text.style?.fontSize), 10) >= 14)).toBe(true);
      expect(scene.previewNameText?.text).not.toContain('(');
      expect(scene.previewSpeedText?.text).toContain('🪙');
      expect(scene.previewJumpText?.text).toBe('');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('keeps desktop pose and OOTD controls at the child touch target minimum', () => {
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(0);

    const controls = [
      ...scene.wardrobeFilterButtons,
      ...scene.subCategoryButtons,
      ...scene.poseButtons,
      scene.ootdButton,
    ].filter(Boolean) as any[];
    expect(controls).toHaveLength(10);
    expect(controls.every(button => button.getButtonHeight() >= 44)).toBe(true);
  });

  it('preserves the selected skin when the responsive scene is rebuilt', () => {
    scene.create({ currentTab: 'skins', selectedSkinIndex: 1 });

    expect(scene.selectedSkinIndex).toBe(1);
  });

  it('preserves an active wardrobe try-on when the responsive scene is rebuilt', () => {
    (scene as any).create({
      currentTab: 'wardrobe',
      currentWardrobeCategory: 'dress',
      currentWardrobeFilter: 'all',
      selectedWardrobeIndex: 1,
      previewWardrobe: { dress: 'scholar_robe' },
    });

    expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
  });

  it('preserves the active compact wardrobe page when the scene is rebuilt', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });

    try {
      (scene as any).create({
        currentTab: 'wardrobe',
        currentWardrobeCategory: 'accessory',
        currentWardrobeFilter: 'accessory',
        selectedWardrobeIndex: 4,
        wardrobePage: 1,
      });

      expect((scene as any).wardrobePage).toBe(1);
      expect((scene as any).wardrobePageStart).toBe(3);
      expect(scene.wardrobeItemButtons).toHaveLength(3);
      expect(scene.selectedWardrobeIndex).toBe(4);

      mock.scene.restart.mockClear();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
      (scene as any).handleScaleResize();

      expect(mock.scene.restart).toHaveBeenCalledWith(expect.objectContaining({ wardrobePage: 1 }));
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('keeps Star Hoodie unavailable while its wearing artwork is a placeholder', () => {
    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('top');
    scene.selectWardrobeItem(3);

    expect(scene.actionButton?.getText()).toContain('美術準備中');
    expect(scene.actionButton?.isEnabled()).toBe(false);
  });

  it('does not present a saved placeholder outfit as an equipped action', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().ownedWardrobe = ['hoodie_star'];
    dm.getEquippedWardrobe().top = 'hoodie_star';

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('top');
    const index = (scene as any).getVisibleWardrobeItems().findIndex(
      (item: any) => item.id === 'hoodie_star'
    );
    scene.selectWardrobeItem(index);

    expect(scene.actionButton?.getText()).toContain('美術準備中');
    expect(scene.actionButton?.isEnabled()).toBe(false);
    scene.handleActionClick();
    expect(dm.getEquippedWardrobe().top).toBe('hoodie_star');
  });

  it('keeps large catalog thumbnails inside their wardrobe cards', () => {
    mock.textures.exists = vi.fn(() => true);

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('top');

    const thumbnails = mock.add.image.mock.results
      .map((result: any) => result.value)
      .filter((image: any) => String(image.texture?.key).includes('thumbnail'));

    expect(thumbnails.length).toBeGreaterThan(0);
    expect(thumbnails.every((image: any) => image.displayWidth <= 72 && image.displayHeight <= 72)).toBe(true);
  });

  it('keeps the desktop all-catalog cards readable without secondary copy overlap', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
    mock.textures.exists = vi.fn(() => true);

    try {
      scene.create();
      scene.switchTab('wardrobe');
      mock.add.image.mockClear();
      scene.switchWardrobeFilter('all');

      const thumbnails = mock.add.image.mock.results
        .map((result: any) => result.value)
        .filter((image: any) => String(image.texture?.key).includes('thumbnail'));
      expect(thumbnails.length).toBeGreaterThan(0);
      expect(thumbnails.every((image: any) => image.displayWidth <= 42 && image.displayHeight <= 42)).toBe(true);
      expect(mock.add.text.mock.calls.some((args: any[]) => args[2] === 'Princess Dress')).toBe(false);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('does not offer a live purchase when dedicated thumbnail or wearing art is missing', () => {
    (scene as any).sys.settings.active = true;
    mock.textures.exists = vi.fn((key: string) => key.includes('thumbnail'));

    scene.create();
    scene.switchTab('wardrobe');
    scene.switchWardrobeCategory('dress');
    scene.selectWardrobeItem(1); // Scholar Gown metadata is ready, idle art is not loaded.

    expect(scene.actionButton?.getText()).toContain('美術準備中');
    expect(scene.actionButton?.isEnabled()).toBe(false);
  });

  it('uses the approved 120–160ms selected-card feedback', () => {
    scene.create();
    scene.switchTab('wardrobe');
    mock.tweens.add.mockClear();

    (scene as any).playWardrobeSelectionFeedback();

    const feedbackTween = mock.tweens.add.mock.calls.at(-1)?.[0];
    expect(feedbackTween.duration).toBeGreaterThanOrEqual(120);
    expect(feedbackTween.duration).toBeLessThanOrEqual(160);
  });

  it('keeps the compact sync toast below the mobile wardrobe header', () => {
    const previousWidth = window.innerWidth;
    const previousHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 932 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 430 });

    try {
      mock.add.container.mockClear();
      scene.showGlobalSyncToast('✨ 已套用至全遊戲！');

      const toast = mock.add.container.mock.results.at(-1)?.value;
      expect(toast?.y).toBe(117);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight });
    }
  });

  it('opens and closes OOTD Photo Booth modal', () => {
    scene.create();
    scene.showOOTDPhotoModal();
    expect(scene['ootdModal']).not.toBeNull();

    scene.closeOOTDPhotoModal();
    expect(scene['ootdModal']).toBeNull();
  });

  it('keeps OOTD composite back accessories behind the foreground outfit pass', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().ownedWardrobe = ['sailor_top', 'star_backpack'];
    dm.equipWardrobeItem('top', 'sailor_top');
    dm.equipWardrobeItem('accessory', 'star_backpack');
    scene.create();

    const back = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories').mockImplementation(() => {});
    const outfit = vi.spyOn(CharacterOutfitCompositor, 'renderOutfit').mockImplementation(() => {});
    try {
      scene.showOOTDPhotoModal();

      expect(back).toHaveBeenCalled();
      expect(outfit.mock.calls.at(-1)?.[2]).toEqual(expect.objectContaining({ includeBackAccessories: false }));
    } finally {
      back.mockRestore();
      outfit.mockRestore();
    }
  });

  it('matches full-sprite OOTD accessories to the wearing sprite scale', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().ownedWardrobe = ['scholar_robe', 'star_backpack'];
    dm.equipWardrobeItem('dress', 'scholar_robe');
    dm.equipWardrobeItem('accessory', 'star_backpack');
    mock.textures.exists = vi.fn((key: string) => key.includes('character/outfits/scholar_gown/idle.png'));
    scene.create();

    const back = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories').mockImplementation(() => {});
    const front = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewFrontAccessories').mockImplementation(() => {});
    try {
      scene.showOOTDPhotoModal();

      expect(back.mock.calls.at(-1)?.[2]?.scale).toBeCloseTo(0.42 / 0.23);
      expect(front.mock.calls.at(-1)?.[2]?.scale).toBeCloseTo(0.42 / 0.23);
    } finally {
      back.mockRestore();
      front.mockRestore();
    }
  });

  it('keeps an incompatible skin in OOTD instead of replacing it with dedicated outfit art', () => {
    const dm = DataManager.getInstance();
    dm.unlockSkin('heroine');
    dm.equipSkin('heroine');
    dm.getProfile().ownedWardrobe = ['scholar_robe'];
    dm.equipWardrobeItem('dress', 'scholar_robe');
    mock.textures.exists = vi.fn((key: string) =>
      key === 'female_stand' || key.includes('assets/character/outfits/scholar_gown/idle.png')
    );
    scene.create();
    (scene.add.image as any).mockClear();

    scene.showOOTDPhotoModal();

    const renderedKeys = (scene.add.image as any).mock.calls.map((call: any[]) => call[2]);
    expect(renderedKeys).toContain('female_stand');
    expect(renderedKeys).not.toContain('assets/character/outfits/scholar_gown/idle.png');

    scene.closeOOTDPhotoModal();
  });

  it('omits a missing full-sprite outfit from the OOTD fallback compositor', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().ownedWardrobe = ['scholar_robe'];
    dm.equipWardrobeItem('dress', 'scholar_robe');
    mock.textures.exists = vi.fn(() => false);
    scene.create();

    const outfit = vi.spyOn(CharacterOutfitCompositor, 'renderOutfit').mockImplementation(() => {});
    try {
      scene.showOOTDPhotoModal();

      expect(outfit.mock.calls.at(-1)?.[1]).not.toHaveProperty('dress');
    } finally {
      outfit.mockRestore();
    }
  });
});
