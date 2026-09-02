import { describe, it, expect, vi } from 'vitest';
import {
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  COLORS,
  getIconTextureKey,
  drawVectorIcon,
  registerAllVectorIcons,
  CurrencyPill,
  StatusBadge,
  FeedbackPanel,
} from '../ui/theme';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 1 Core Visual Foundation & Design Tokens', () => {
  describe('1. Design System Tokens', () => {
    it('defines standard spacing scale (4, 8, 12, 16, 24, 32, 48, 64)', () => {
      expect(SPACING.xxs).toBe(4);
      expect(SPACING.xs).toBe(8);
      expect(SPACING.sm).toBe(12);
      expect(SPACING.md).toBe(16);
      expect(SPACING.lg).toBe(24);
      expect(SPACING.xl).toBe(32);
      expect(SPACING.xxl).toBe(48);
      expect(SPACING.xxxl).toBe(64);
    });

    it('defines standard corner radius tokens (10 to 26px)', () => {
      expect(RADIUS.sm).toBe(10);
      expect(RADIUS.md).toBe(14);
      expect(RADIUS.lg).toBe(18);
      expect(RADIUS.xl).toBe(22);
      expect(RADIUS.xxl).toBe(26);
    });

    it('defines typography hierarchy with minRendered >= 16px', () => {
      expect(parseInt(TYPOGRAPHY.display.fontSize)).toBe(48);
      expect(parseInt(TYPOGRAPHY.screenTitle.fontSize)).toBe(34);
      expect(parseInt(TYPOGRAPHY.prompt.fontSize)).toBe(30);
      expect(parseInt(TYPOGRAPHY.primaryAnswer.fontSize)).toBe(32);
      expect(parseInt(TYPOGRAPHY.sectionHeading.fontSize)).toBe(24);
      expect(parseInt(TYPOGRAPHY.body.fontSize)).toBe(22);
      expect(parseInt(TYPOGRAPHY.button.fontSize)).toBe(22);
      expect(parseInt(TYPOGRAPHY.metadata.fontSize)).toBe(18);
      expect(parseInt(TYPOGRAPHY.minRendered.fontSize)).toBe(16);
    });

    it('defines core semantic color tokens for surface, text, action, state, subject, currency', () => {
      expect(COLORS.surface.pageHex).toBe('#0f172a');
      expect(COLORS.text.primary).toBe('#ffffff');
      expect(COLORS.action.primaryHex).toBe('#3b82f6');
      expect(COLORS.state.successHex).toBe('#22c55e');
      expect(COLORS.state.errorHex).toBe('#ef4444');
      expect(COLORS.subject.chineseHex).toBe('#f97316');
      expect(COLORS.subject.mathematicsHex).toBe('#3b82f6');
      expect(COLORS.subject.englishHex).toBe('#10b981');
      expect(COLORS.currency.coinHex).toBe('#fbbf24');
      expect(COLORS.currency.gemHex).toBe('#38bdf8');
      expect(COLORS.currency.starHex).toBe('#facc15');
    });
  });

  describe('2. Unified Vector Icon System', () => {
    it('formats vector icon texture keys consistently', () => {
      expect(getIconTextureKey('coin', 24)).toBe('vec_icon_coin_24');
      expect(getIconTextureKey('gem', 32)).toBe('vec_icon_gem_32');
      expect(getIconTextureKey('star', 48)).toBe('vec_icon_star_48');
      expect(getIconTextureKey('chinese', 32)).toBe('vec_icon_chinese_32');
      expect(getIconTextureKey('math', 32)).toBe('vec_icon_math_32');
      expect(getIconTextureKey('english', 32)).toBe('vec_icon_english_32');
    });

    it('draws vector icons without error across all types', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        quadraticCurveTo: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      } as any;

      const icons = [
        'coin',
        'gem',
        'star',
        'chinese',
        'math',
        'english',
        'check',
        'cross',
        'lock',
        'trophy',
        'home',
        'map',
        'report',
        'settings',
        'retry',
        'next',
        'sound_on',
        'sound_off',
        'hint',
        'back',
        'close',
        'speaker',
      ] as const;

      for (const icon of icons) {
        expect(() => drawVectorIcon(mockCtx, icon, 32)).not.toThrow();
      }
    });

    it('registers all vector icons in scene texture manager', () => {
      const createdTextures: Record<string, any> = {};
      const mockScene = {
        textures: {
          exists: (k: string) => !!createdTextures[k],
          createCanvas: (key: string, _w: number, _h: number) => {
            const canvasObj = {
              getContext: () => ({
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                closePath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                arc: vi.fn(),
                ellipse: vi.fn(),
                fill: vi.fn(),
                stroke: vi.fn(),
                fillRect: vi.fn(),
                strokeRect: vi.fn(),
                fillText: vi.fn(),
                quadraticCurveTo: vi.fn(),
                createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
                createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
              }),
              refresh: vi.fn(),
            };
            createdTextures[key] = canvasObj;
            return canvasObj;
          },
        },
      } as any;

      registerAllVectorIcons(mockScene);
      expect(mockScene.textures.exists('vec_icon_coin_24')).toBe(true);
      expect(mockScene.textures.exists('vec_icon_gem_32')).toBe(true);
      expect(mockScene.textures.exists('vec_icon_star_48')).toBe(true);
      expect(mockScene.textures.exists('vec_icon_chinese_32')).toBe(true);
    });
  });

  describe('3. CurrencyPill Component', () => {
    it('creates CurrencyPill with formatted balance and updates on setAmount', () => {
      const mockScene = createMockSceneForMeta('TitleScene');
      const pill = new CurrencyPill(mockScene, {
        x: 200,
        y: 40,
        type: 'coins',
        amount: 661,
      });

      expect(pill.getAmount()).toBe(661);

      pill.setAmount(12500);
      expect(pill.getAmount()).toBe(12500);
    });
  });

  describe('4. StatusBadge Component', () => {
    it('creates StatusBadge and supports switching badge states', () => {
      const mockScene = createMockSceneForMeta('ShopScene');
      const badge = new StatusBadge(mockScene, {
        x: 100,
        y: 100,
        type: 'available',
      });

      badge.setType('equipped', '✅ 使用中');
      badge.setType('locked', '🔒 未解鎖');
      badge.setType('completed', '⭐ 已通關');
    });
  });

  describe('5. FeedbackPanel Component', () => {
    it('creates FeedbackPanel for success, error, and hints with instructional concepts', () => {
      const mockScene = createMockSceneForMeta('QuestionScene');
      const panel = new FeedbackPanel(mockScene, {
        x: 640,
        y: 500,
        type: 'success',
        title: '答啱啦！做得好！',
        message: '句子開頭要用大寫字母，句尾要加句號。',
        conceptHighlight: '首字母大寫',
      });

      expect(panel).toBeDefined();
    });
  });
});
