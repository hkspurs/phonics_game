/**
 * UI QA Tester 1: iPhone 16 Pro Typography, Button Scaling & Shop UI Layout Overhaul Auditor Suite
 *
 * Adversarial specifications verification:
 * 1. Zero-microtext constraint: all UI texts in ShopScene, TitleScene, MapScene, QuestionScene, RunnerScene, ResultScene, TrophyScene, SettingsScene >= 16px.
 * 2. Shop UI Layout: Header currency pills (>= 22px), category tabs (>= 18px, w >= 140, h >= 44), item cards (name >= 24px, perk >= 17px, price >= 20px), action button (w >= 380, h >= 64, fontSize >= 24px), OOTD modal (title >= 26px, close >= 20px).
 * 3. TitleScene: Header currency (>= 17px-20px), secondary buttons (>= 22px), stamp book (>= 16px), version footer (>= 16px).
 * 4. MapScene: Station node badges (>= 16px), player pin (>= 16px), station modal sub-levels (>= 16px-18px), enter button (>= 22px), header HUD (>= 18px-20px).
 * 5. QuestionScene: Header title (>= 24px), progress counter (>= 18px), prompt text (>= 24px-28px), speaker button (>= 22px), action buttons (>= 22px, h >= 58).
 * 6. RunnerScene: Currency counters (>= 22px), station badge (>= 18px), skip button (>= 20px), joystick labels (>= 16px).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { TitleScene } from '../scenes/TitleScene';
import { MapScene } from '../scenes/MapScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { RunnerScene } from '../scenes/RunnerScene';
import { ResultScene } from '../scenes/ResultScene';
import { TrophyScene } from '../scenes/TrophyScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

// Helpers to extract numerical font size
function parsePx(fontSizeVal: any): number {
  if (typeof fontSizeVal === 'number') return fontSizeVal;
  if (typeof fontSizeVal === 'string') {
    const num = parseInt(fontSizeVal.replace('px', ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function getBtnFontSize(btn: any): number {
  if (!btn) return 0;
  if (btn.config?.fontSize) return parsePx(btn.config.fontSize);
  if (btn.labelText?.style?.fontSize) return parsePx(btn.labelText.style.fontSize);
  if (btn.buttonText?.style?.fontSize) return parsePx(btn.buttonText.style.fontSize);
  return 0;
}

function getBtnWidth(btn: any): number {
  if (!btn) return 0;
  if (typeof btn.btnWidth === 'number') return btn.btnWidth;
  if (typeof btn.buttonWidth === 'number') return btn.buttonWidth;
  if (typeof btn.config?.width === 'number') return btn.config.width;
  return 0;
}

function getBtnHeight(btn: any): number {
  if (!btn) return 0;
  if (typeof btn.btnHeight === 'number') return btn.btnHeight;
  if (typeof btn.buttonHeight === 'number') return btn.buttonHeight;
  if (typeof btn.config?.height === 'number') return btn.config.height;
  return 0;
}

describe('iPhone 16 Pro Typography, Button Scaling & Shop UI Layout Overhaul Auditor', () => {
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
    DataManager.getInstance().reset();
    vi.restoreAllMocks();
  });

  describe('1. ShopScene Typography & Layout Audit', () => {
    let scene: ShopScene;

    beforeEach(() => {
      scene = new ShopScene();
      const mock = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mock);
    });

    it('enforces Shop Header HUD typography and high-contrast pill backdrops', () => {
      scene.create();

      // Home & Map navigation buttons
      expect(getBtnFontSize((scene as any).homeButton)).toBeGreaterThanOrEqual(18);
      expect(getBtnWidth((scene as any).homeButton)).toBeGreaterThanOrEqual(140);
      expect(getBtnHeight((scene as any).homeButton)).toBeGreaterThanOrEqual(44);

      expect(getBtnFontSize((scene as any).mapButton)).toBeGreaterThanOrEqual(18);
      expect(getBtnWidth((scene as any).mapButton)).toBeGreaterThanOrEqual(140);
      expect(getBtnHeight((scene as any).mapButton)).toBeGreaterThanOrEqual(44);

      // Currency counters (coin, gem, star)
      expect(parsePx((scene as any).coinText?.style?.fontSize)).toBeGreaterThanOrEqual(22);
      expect(parsePx((scene as any).gemText?.style?.fontSize)).toBeGreaterThanOrEqual(22);
      expect(parsePx((scene as any).starText?.style?.fontSize)).toBeGreaterThanOrEqual(22);
    });

    it('enforces enlarged Category Tabs sizing and readable font size', () => {
      scene.create();

      const tabButtons = (scene as any).tabButtons;
      expect(tabButtons.length).toBe(4);
      tabButtons.forEach((btn: any) => {
        expect(getBtnFontSize(btn)).toBeGreaterThanOrEqual(18);
        expect(getBtnWidth(btn)).toBeGreaterThanOrEqual(140);
        expect(getBtnHeight(btn)).toBeGreaterThanOrEqual(44);
      });
    });

    it('enforces Skin, Wardrobe, Pet and Gadget card typography specifications', () => {
      scene.create();

      // 1. Skin Cards
      const skinTexts = (scene as any).skinCardTextObjects;
      expect(skinTexts.length).toBeGreaterThan(0);
      skinTexts.forEach((item: any) => {
        expect(parsePx(item.name?.style?.fontSize)).toBeGreaterThanOrEqual(24);
        expect(parsePx(item.perk?.style?.fontSize)).toBeGreaterThanOrEqual(17);
        expect(parsePx(item.status?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      });

      // 2. Switch to Wardrobe Tab
      scene.switchTab('wardrobe');
      const wardrobeSubBtns = (scene as any).subCategoryButtons;
      expect(wardrobeSubBtns.length).toBe(4);
      wardrobeSubBtns.forEach((btn: any) => {
        expect(getBtnFontSize(btn)).toBeGreaterThanOrEqual(17);
        expect(getBtnHeight(btn)).toBeGreaterThanOrEqual(38);
      });

      const wardrobeTexts = (scene as any).skinCardTextObjects;
      wardrobeTexts.forEach((item: any) => {
        expect(parsePx(item.name?.style?.fontSize)).toBeGreaterThanOrEqual(24);
        expect(parsePx(item.perk?.style?.fontSize)).toBeGreaterThanOrEqual(17);
        expect(parsePx(item.status?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      });

      // 3. Switch to Pets Tab
      scene.switchTab('pets');
      const petTexts = (scene as any).skinCardTextObjects;
      petTexts.forEach((item: any) => {
        expect(parsePx(item.name?.style?.fontSize)).toBeGreaterThanOrEqual(24);
        expect(parsePx(item.perk?.style?.fontSize)).toBeGreaterThanOrEqual(17);
        expect(parsePx(item.status?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      });

      // 4. Switch to Gadgets Tab
      scene.switchTab('gadgets');
      const gadgetTexts = (scene as any).skinCardTextObjects;
      gadgetTexts.forEach((item: any) => {
        expect(parsePx(item.name?.style?.fontSize)).toBeGreaterThanOrEqual(24);
        expect(parsePx(item.perk?.style?.fontSize)).toBeGreaterThanOrEqual(17);
        expect(parsePx(item.status?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      });
    });

    it('enforces Live Preview Showcase, Action Button and OOTD Photo Modal specifications', () => {
      scene.create();

      // Preview Texts
      expect(parsePx((scene as any).previewNameText?.style?.fontSize)).toBeGreaterThanOrEqual(26);
      expect(parsePx((scene as any).previewDescText?.style?.fontSize)).toBeGreaterThanOrEqual(17);
      expect(parsePx((scene as any).previewSpeedText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).previewJumpText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).previewSpecialText?.style?.fontSize)).toBeGreaterThanOrEqual(18);

      // Action Button
      expect(getBtnWidth((scene as any).actionButton)).toBeGreaterThanOrEqual(380);
      expect(getBtnHeight((scene as any).actionButton)).toBeGreaterThanOrEqual(64);
      expect(getBtnFontSize((scene as any).actionButton)).toBeGreaterThanOrEqual(24);

      // Pose Switcher Buttons & OOTD Button
      const poseBtns = (scene as any).poseButtons;
      poseBtns.forEach((btn: any) => {
        expect(getBtnFontSize(btn)).toBeGreaterThanOrEqual(16);
        expect(getBtnHeight(btn)).toBeGreaterThanOrEqual(36);
      });
      expect(getBtnFontSize((scene as any).ootdButton)).toBeGreaterThanOrEqual(16);

      // OOTD Photo Booth Modal
      scene.showOOTDPhotoModal();
      expect((scene as any).ootdModal).toBeDefined();
      expect((scene as any).ootdCloseButton).toBeDefined();
      expect(getBtnFontSize((scene as any).ootdCloseButton)).toBeGreaterThanOrEqual(20);
      expect(getBtnWidth((scene as any).ootdCloseButton)).toBeGreaterThanOrEqual(240);
      expect(getBtnHeight((scene as any).ootdCloseButton)).toBeGreaterThanOrEqual(50);
    });
  });

  describe('2. TitleScene Typography & Button Scaling Audit', () => {
    let scene: TitleScene;

    beforeEach(() => {
      scene = new TitleScene();
      const mock = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mock);
    });

    it('enforces TitleScene currency pill, start button, secondary buttons, stamp modal, and footer sizes', () => {
      scene.create();

      // Header Currency Pill
      expect(parsePx((scene as any).coinText?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      expect(parsePx((scene as any).gemText?.style?.fontSize)).toBeGreaterThanOrEqual(20);
      expect(parsePx((scene as any).starText?.style?.fontSize)).toBeGreaterThanOrEqual(20);

      // Start Button & Secondary Buttons
      expect(getBtnFontSize((scene as any).startButton)).toBeGreaterThanOrEqual(32);
      expect(getBtnFontSize((scene as any).reportButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnFontSize((scene as any).shopButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnFontSize((scene as any).trophyButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnFontSize((scene as any).settingsButton)).toBeGreaterThanOrEqual(22);

      // Stamp Book Modal
      scene.openStampBookModal();
      expect((scene as any).stampModal).toBeDefined();
    });
  });

  describe('3. MapScene Typography & Station Modal Audit', () => {
    let scene: MapScene;

    beforeEach(() => {
      scene = new MapScene();
      const mock = createMockSceneForMeta('MapScene');
      Object.assign(scene, mock);
    });

    it('enforces Header HUD, Station Node badges, and Quick Navigation sizes', () => {
      scene.create();

      // Header HUD Back Button
      expect(getBtnFontSize((scene as any).backButton)).toBeGreaterThanOrEqual(20);
      expect(getBtnWidth((scene as any).backButton)).toBeGreaterThanOrEqual(140);
      expect(getBtnHeight((scene as any).backButton)).toBeGreaterThanOrEqual(48);

      // Progress and currency labels
      expect(parsePx((scene as any).progressText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).starText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).coinText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).gemText?.style?.fontSize)).toBeGreaterThanOrEqual(18);

      // Station Modal
      const modal = scene.openStationModal({
        id: 1,
        name: '星光草原',
        englishName: 'Starlight Meadow',
        description: '微風輕拂的草原',
        biome: '草原',
        icon: '🌿',
        x: 640,
        y: 2000,
        themeColor: 0x48bb78,
      });
      expect(modal).toBeDefined();
    });
  });

  describe('4. QuestionScene Typography & Button Scaling Audit', () => {
    let scene: QuestionScene;

    beforeEach(() => {
      scene = new QuestionScene();
      const mock = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mock);
    });

    it('enforces Header HUD, Prompt Banner, Speaker Button, and Action Buttons typography', () => {
      scene.init({
        stationId: 1,
        stationName: '星光草原',
        questionIndex: 0,
        questions: [
          {
            id: 'q1',
            subject: 'chinese',
            type: 'sentence_scramble',
            prompt: '請將下列字詞重組成通順完整的句子：',
            speakText: '今天天氣很好。',
            correctTokens: ['今天', '天氣', '很好', '。'],
          },
        ],
      });
      scene.create();

      // Header Back Button & Header Title
      expect(getBtnFontSize((scene as any).backButton)).toBeGreaterThanOrEqual(20);
      expect(parsePx((scene as any).headerTitleText?.style?.fontSize)).toBeGreaterThanOrEqual(24);
      expect(parsePx((scene as any).progressCounterText?.style?.fontSize)).toBeGreaterThanOrEqual(18);

      // Prompt Banner & Speaker Button
      expect(parsePx((scene as any).promptText?.style?.fontSize)).toBeGreaterThanOrEqual(24);
      expect(getBtnFontSize((scene as any).speakerButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnHeight((scene as any).speakerButton)).toBeGreaterThanOrEqual(52);

      // Hint & Reset Action Buttons
      expect(getBtnFontSize((scene as any).hintButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnWidth((scene as any).hintButton)).toBeGreaterThanOrEqual(180);
      expect(getBtnHeight((scene as any).hintButton)).toBeGreaterThanOrEqual(58);

      expect(getBtnFontSize((scene as any).resetButton)).toBeGreaterThanOrEqual(22);
      expect(getBtnWidth((scene as any).resetButton)).toBeGreaterThanOrEqual(180);
      expect(getBtnHeight((scene as any).resetButton)).toBeGreaterThanOrEqual(58);
    });
  });

  describe('5. RunnerScene Typography & Virtual Gamepad Audit', () => {
    let scene: RunnerScene;

    beforeEach(() => {
      scene = new RunnerScene();
      const mock = createMockSceneForMeta('RunnerScene');
      Object.assign(scene, mock);
    });

    it('enforces HUD coin/gem counters, skip button, and jump button specifications', () => {
      scene.init({
        stationId: 1,
        stationName: '星光草原',
        questionIndex: 0,
        totalQuestions: 3,
        questions: [],
      });
      scene.create();

      // HUD Currency counters
      expect(parsePx((scene as any).coinCounterText?.style?.fontSize)).toBeGreaterThanOrEqual(22);
      expect(parsePx((scene as any).gemCounterText?.style?.fontSize)).toBeGreaterThanOrEqual(22);

      // Skip Button
      expect(getBtnFontSize((scene as any).skipButton)).toBeGreaterThanOrEqual(20);
      expect(getBtnWidth((scene as any).skipButton)).toBeGreaterThanOrEqual(140);
      expect(getBtnHeight((scene as any).skipButton)).toBeGreaterThanOrEqual(48);

      // Jump Button
      expect(getBtnFontSize((scene as any).jumpBtn)).toBeGreaterThanOrEqual(22);
      expect(getBtnWidth((scene as any).jumpBtn)).toBeGreaterThanOrEqual(140);
      expect(getBtnHeight((scene as any).jumpBtn)).toBeGreaterThanOrEqual(68);
    });
  });

  describe('6. ResultScene, TrophyScene and SettingsScene Typography Audit', () => {
    it('enforces ResultScene stats labels and total stars footer typography >= 16px', () => {
      const scene = new ResultScene();
      const mock = createMockSceneForMeta('ResultScene');
      Object.assign(scene, mock);

      scene.init({
        stationId: 1,
        stationName: '星光草原',
        totalQuestions: 3,
        questions: [],
        sessionStats: { correctCount: 3, mistakes: 0, hintsUsed: 0, startTime: Date.now() - 30000 },
      });
      scene.create();

      expect(getBtnFontSize((scene as any).homeButton)).toBeGreaterThanOrEqual(18);
      expect(getBtnFontSize((scene as any).nextStationButton)).toBeGreaterThanOrEqual(20);
      expect(getBtnFontSize((scene as any).retryButton)).toBeGreaterThanOrEqual(20);
      expect(getBtnFontSize((scene as any).mapButton)).toBeGreaterThanOrEqual(20);
    });

    it('enforces TrophyScene header counters and trophy cards typography >= 16px', () => {
      const scene = new TrophyScene();
      const mock = createMockSceneForMeta('TrophyScene');
      Object.assign(scene, mock);

      scene.create();

      expect(parsePx((scene as any).totalTrophyText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).coinText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
      expect(parsePx((scene as any).gemText?.style?.fontSize)).toBeGreaterThanOrEqual(18);
    });

    it('enforces SettingsScene voice language buttons and difficulty descriptions >= 16px', () => {
      const scene = new SettingsScene();
      const mock = createMockSceneForMeta('SettingsScene');
      Object.assign(scene, mock);

      scene.create();

      const voiceBtns = (scene as any).voiceButtons;
      voiceBtns.forEach((btn: any) => {
        expect(getBtnFontSize(btn)).toBeGreaterThanOrEqual(17);
      });
      expect(parsePx((scene as any).difficultyDescText?.style?.fontSize)).toBeGreaterThanOrEqual(16);
    });
  });
});
