import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { CanvasButton } from './CanvasButton';
import { CanvasCard } from './CanvasCard';
import { SlotBox } from './SlotBox';
import { CanvasModal } from './CanvasModal';
import { StarRating } from './StarRating';
import { SoundManager } from '../services/SoundManager';

// Helper to create a comprehensive mock Phaser Scene for unit tests
function attachEventEmitter(obj: any): any {
  const listeners: Record<string, Function[]> = {};
  obj.on = vi.fn(function (ev: string, fn: Function) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return obj;
  });
  obj.once = vi.fn(function (ev: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      obj.off(ev, wrapper);
      fn(...args);
    };
    (listeners[ev] = listeners[ev] || []).push(wrapper);
    return obj;
  });
  obj.off = vi.fn(function (ev: string, fn?: Function) {
    if (!fn) delete listeners[ev];
    else if (listeners[ev]) listeners[ev] = listeners[ev].filter((f: any) => f !== fn);
    return obj;
  });
  obj.removeListener = obj.off;
  obj.emit = vi.fn(function (ev: string, ...args: any[]) {
    (listeners[ev] || []).slice().forEach((fn: any) => fn(...args));
    return true;
  });
  obj.removeFromDisplayList = vi.fn().mockReturnThis();
  obj.addedToScene = vi.fn().mockReturnThis();
  return obj;
}

export function createMockScene(): any {
  const sceneListeners: Record<string, Function[]> = {};
  const scene: any = {
    sys: {
      game: {
        config: { width: 1280, height: 720 },
      },
      queueDepthSort: () => {},
      updateList: { add: () => {}, remove: () => {} },
      input: {
        enable: vi.fn(),
        disable: vi.fn(),
      },
    },
    add: {
      existing: (obj: any) => obj,
      container: (x: number, y: number) => {
        const c = new (Phaser.GameObjects.Container as any)(scene, x, y);
        return c;
      },
      graphics: () => {
        const g: any = {
          x: 0,
          y: 0,
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(g);
      },
      text: (x: number, y: number, text: string, style?: any) => {
        const t: any = {
          x,
          y,
          text,
          style: style || {},
          originX: 0,
          originY: 0,
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            t.originX = ox;
            t.originY = oy;
            return t;
          }),
          setText: vi.fn(function (val: string) {
            t.text = val;
            return t;
          }),
          setColor: vi.fn(function (val: string) {
            if (t.style) t.style.color = val;
            return t;
          }),
          setFontSize: vi.fn().mockReturnThis(),
          setFontFamily: vi.fn().mockReturnThis(),
          setShadow: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(t);
      },
      rectangle: (x: number, y: number, width: number, height: number, fillColor = 0, fillAlpha = 1) => {
        const r: any = {
          x,
          y,
          width,
          height,
          fillColor,
          fillAlpha,
          originX: 0.5,
          originY: 0.5,
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            r.originX = ox;
            r.originY = oy;
            return r;
          }),
          scrollFactorX: 1,
          scrollFactorY: 1,
          setScrollFactor: vi.fn(function (sx = 1, sy?: number) {
            r.scrollFactorX = sx;
            r.scrollFactorY = sy !== undefined ? sy : sx;
            return r;
          }),
          setInteractive: vi.fn().mockReturnThis(),
          disableInteractive: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(r);
      },
      image: (x: number, y: number, key: string) => {
        const img: any = {
          x,
          y,
          texture: { key },
          originX: 0.5,
          originY: 0.5,
          scaleX: 1,
          scaleY: 1,
          displayWidth: 32,
          displayHeight: 32,
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn(function (s: number) {
            img.scaleX = s;
            img.scaleY = s;
            return img;
          }),
          setDisplaySize: vi.fn(function (w: number, h: number) {
            img.displayWidth = w;
            img.displayHeight = h;
            return img;
          }),
          setTexture: vi.fn(function (k: string) {
            img.texture = { key: k };
            return img;
          }),
          setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(img);
      },
    },
    tweens: {
      add: vi.fn((config: any) => {
        if (config.onComplete) {
          // Immediately trigger onComplete in synchronous tests if needed
        }
        return { stop: vi.fn(), remove: vi.fn() };
      }),
      killTweensOf: vi.fn(),
    },
    textures: {
      exists: vi.fn((_key?: string) => false),
      get: vi.fn((_key?: string) => ({ get: () => ({}) })),
    },
    input: {
      setDraggable: vi.fn(),
    },
    sound: {
      play: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((_delay: number, callback: Function) => {
        callback();
        return { remove: vi.fn() };
      }),
    },
    events: {
      on: vi.fn((ev: string, fn: Function) => {
        (sceneListeners[ev] = sceneListeners[ev] || []).push(fn);
      }),
      emit: vi.fn((ev: string, ...args: any[]) => {
        (sceneListeners[ev] || []).forEach((fn: any) => fn(...args));
      }),
    },
  };
  return scene;
}

describe('Canvas UI Components Suite', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    SoundManager.init(mockScene);
    vi.spyOn(SoundManager, 'play').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. CanvasButton Tests
  // =========================================================================
  describe('CanvasButton', () => {
    it('creates button with default dimensions and properties', () => {
      const button = new CanvasButton(mockScene, {
        x: 100,
        y: 200,
        text: '開始遊戲',
      });

      expect(button.x).toBe(100);
      expect(button.y).toBe(200);
      expect(button.getText()).toBe('開始遊戲');
      expect(button.getButtonWidth()).toBe(200);
      expect(button.getButtonHeight()).toBe(60);
      expect(button.isEnabled()).toBe(true);
    });

    it('creates button with custom styling, color and soundKey', () => {
      const onClick = vi.fn();
      const button = new CanvasButton(mockScene, {
        x: 50,
        y: 80,
        width: 250,
        height: 70,
        text: '進入關卡',
        color: 'green',
        fontSize: '28px',
        soundKey: 'coin',
        onClick,
      });

      expect(button.getButtonWidth()).toBe(250);
      expect(button.getButtonHeight()).toBe(70);
      expect(button.getColor()).toBe('green');
    });

    it('triggers click handler and audio on pointer down/up', () => {
      const onClick = vi.fn();
      const button = new CanvasButton(mockScene, {
        text: '點擊我',
        soundKey: 'click',
        onClick,
      });

      // Simulate pointerdown
      button.emit('pointerdown');
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(mockScene.tweens.add).toHaveBeenCalled();

      // Simulate pointerup
      button.emit('pointerup');
      expect(onClick).toHaveBeenCalledWith(button);
    });

    it('handles hover and out tweens correctly', () => {
      const button = new CanvasButton(mockScene, {
        text: '懸停測試',
      });

      button.emit('pointerover');
      expect(mockScene.tweens.add).toHaveBeenCalled();

      button.emit('pointerout');
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('disables interactions and updates visual alpha when setEnabled(false)', () => {
      const onClick = vi.fn();
      const button = new CanvasButton(mockScene, {
        text: '已鎖定',
        onClick,
      });

      button.setEnabled(false);
      expect(button.isEnabled()).toBe(false);
      expect(button.alpha).toBeLessThan(1.0);

      // Interactions should be ignored when disabled
      button.emit('pointerdown');
      expect(SoundManager.play).not.toHaveBeenCalled();

      button.emit('pointerup');
      expect(onClick).not.toHaveBeenCalled();

      // Re-enable
      button.setEnabled(true);
      expect(button.isEnabled()).toBe(true);
      expect(button.alpha).toBe(1.0);
    });

    it('updates label text and re-centers', () => {
      const button = new CanvasButton(mockScene, {
        text: '舊文字',
      });

      expect(button.getText()).toBe('舊文字');
      button.setText('新文字');
      expect(button.getText()).toBe('新文字');
    });

    it('cleans up tweens and resources on destroy', () => {
      const button = new CanvasButton(mockScene, {
        text: '銷毀測試',
      });

      button.destroy();
      expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(button);
    });
  });

  // =========================================================================
  // 2. CanvasCard Tests
  // =========================================================================
  describe('CanvasCard', () => {
    it('initializes with text, value and default home coordinates', () => {
      const card = new CanvasCard(mockScene, {
        x: 300,
        y: 400,
        text: '蘋果',
        value: 'apple',
      });

      expect(card.x).toBe(300);
      expect(card.y).toBe(400);
      expect(card.getText()).toBe('蘋果');
      expect(card.getValue()).toBe('apple');
      expect(card.getHomePosition()).toEqual({ x: 300, y: 400 });
      expect(card.getState()).toBe('normal');
    });

    it('defaults value to text if value is not explicitly provided', () => {
      const card = new CanvasCard(mockScene, {
        text: '小貓',
      });

      expect(card.getText()).toBe('小貓');
      expect(card.getValue()).toBe('小貓');
    });

    it('supports visual state transitions (normal, selected, placed, disabled, correct, wrong)', () => {
      const card = new CanvasCard(mockScene, {
        text: '測試卡片',
      });

      card.setState('selected');
      expect(card.getState()).toBe('selected');

      card.setState('placed');
      expect(card.getState()).toBe('placed');

      card.setState('disabled');
      expect(card.getState()).toBe('disabled');
      expect(card.alpha).toBeLessThan(1.0);

      card.setState('correct');
      expect(card.getState()).toBe('correct');

      card.setState('wrong');
      expect(card.getState()).toBe('wrong');

      card.setState('normal');
      expect(card.getState()).toBe('normal');
      expect(card.alpha).toBe(1.0);
    });

    it('handles tap callback when tappable', () => {
      const onTap = vi.fn();
      const card = new CanvasCard(mockScene, {
        text: '點選卡片',
        tappable: true,
        onTap,
      });

      card.emit('pointerup');
      expect(onTap).toHaveBeenCalledWith(card);
    });

    it('enables Phaser drag when draggable is true', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const card = new CanvasCard(mockScene, {
        text: '拖曳卡片',
        draggable: true,
        onDragStart,
        onDragEnd,
      });

      expect(mockScene.input.setDraggable).toHaveBeenCalledWith(card);

      // Drag event triggers
      const mockPointer = { x: 350, y: 420 } as any;
      card.emit('dragstart', mockPointer);
      expect(onDragStart).toHaveBeenCalledWith(card, mockPointer);

      card.emit('dragend', mockPointer);
      expect(onDragEnd).toHaveBeenCalledWith(card, mockPointer);
    });

    it('tracks home position and executes snapBack tween', () => {
      const card = new CanvasCard(mockScene, {
        x: 100,
        y: 100,
        text: '彈回卡片',
      });

      card.setHomePosition(200, 300);
      expect(card.getHomePosition()).toEqual({ x: 200, y: 300 });

      card.snapBack();
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('executes wobble animation for wrong feedback and pulse for hints', () => {
      const card = new CanvasCard(mockScene, {
        text: '動態卡片',
      });

      card.wobble();
      expect(mockScene.tweens.add).toHaveBeenCalled();

      card.pulse();
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. SlotBox Tests
  // =========================================================================
  describe('SlotBox', () => {
    it('initializes with index, expectedValue, and dimensions', () => {
      const slot = new SlotBox(mockScene, {
        x: 200,
        y: 300,
        width: 150,
        height: 70,
        index: 0,
        expectedValue: '姐姐',
      });

      expect(slot.x).toBe(200);
      expect(slot.y).toBe(300);
      expect(slot.getIndex()).toBe(0);
      expect(slot.getExpectedValue()).toBe('姐姐');
      expect(slot.hasCard()).toBe(false);
      expect(slot.getPlacedCard()).toBeNull();
    });

    it('places, holds, and removes card references cleanly', () => {
      const slot = new SlotBox(mockScene, {
        x: 200,
        y: 300,
        expectedValue: '吃',
      });

      const card = new CanvasCard(mockScene, {
        text: '吃',
        value: '吃',
      });

      // Place card
      const placed = slot.setPlacedCard(card);
      expect(placed).toBe(true);
      expect(slot.hasCard()).toBe(true);
      expect(slot.getPlacedCard()).toBe(card);
      expect(card.getCurrentSlot()).toBe(slot);
      expect(slot.isCorrect()).toBe(true);

      // Remove card
      const removed = slot.removePlacedCard();
      expect(removed).toBe(card);
      expect(slot.hasCard()).toBe(false);
      expect(slot.getPlacedCard()).toBeNull();
      expect(card.getCurrentSlot()).toBeNull();
    });

    it('validates incorrect answer when placed card does not match expectedValue', () => {
      const slot = new SlotBox(mockScene, {
        expectedValue: '餅乾',
      });

      const card = new CanvasCard(mockScene, {
        text: '水',
        value: '水',
      });

      slot.setPlacedCard(card);
      expect(slot.isCorrect()).toBe(false);
    });

    it('updates highlight and error visual states', () => {
      const slot = new SlotBox(mockScene, {});

      slot.setHighlighted(true);
      expect(slot.isHighlighted()).toBe(true);

      slot.setHighlighted(false);
      expect(slot.isHighlighted()).toBe(false);

      slot.setError(true);
      expect(slot.hasError()).toBe(true);

      slot.setError(false);
      expect(slot.hasError()).toBe(false);
    });

    it('calculates world/local center position for dropping', () => {
      const slot = new SlotBox(mockScene, {
        x: 350,
        y: 450,
        width: 140,
        height: 60,
      });

      const center = slot.getCenterPosition();
      expect(center.x).toBe(350);
      expect(center.y).toBe(450);
    });
  });

  // =========================================================================
  // 4. CanvasModal Tests
  // =========================================================================
  describe('CanvasModal', () => {
    it('creates modal with backdrop, header title, content container, and close button', () => {
      const onClose = vi.fn();
      const modal = new CanvasModal(mockScene, {
        title: '關卡資訊',
        width: 600,
        height: 450,
        onClose,
      });

      expect(modal.getTitle()).toBe('關卡資訊');
      expect(modal.isOpen()).toBe(true);
      expect(modal.getContentContainer()).toBeDefined();
    });

    it('allows adding child GameObjects to content container', () => {
      const modal = new CanvasModal(mockScene, {
        title: '背包',
      });

      const testText = mockScene.add.text(0, 0, '金幣：100');
      modal.addContent(testText);

      expect(modal.getContentContainer().list).toContain(testText);
    });

    it('animates show and hide transitions', () => {
      const modal = new CanvasModal(mockScene, {
        title: '設定',
      });

      modal.show(true);
      expect(mockScene.tweens.add).toHaveBeenCalled();

      const onHideComplete = vi.fn();
      modal.hide(true, onHideComplete);
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('invokes onClose callback when close button is clicked', () => {
      const onClose = vi.fn();
      const modal = new CanvasModal(mockScene, {
        title: '商店確認',
        onClose,
      });

      modal.close();
      expect(onClose).toHaveBeenCalledWith(modal);
      expect(modal.isOpen()).toBe(false);
    });

    it('updates title text dynamically', () => {
      const modal = new CanvasModal(mockScene, {
        title: '舊標題',
      });

      expect(modal.getTitle()).toBe('舊標題');
      modal.setTitle('新標題');
      expect(modal.getTitle()).toBe('新標題');
    });
  });

  // =========================================================================
  // 5. StarRating Tests
  // =========================================================================
  describe('StarRating', () => {
    it('creates star rating container with default 3 stars', () => {
      const rating = new StarRating(mockScene, {
        x: 400,
        y: 200,
        maxStars: 3,
        initialStars: 0,
      });

      expect(rating.x).toBe(400);
      expect(rating.y).toBe(200);
      expect(rating.getMaxStars()).toBe(3);
      expect(rating.getRating()).toBe(0);
    });

    it('updates rating immediately without animation when animate is false', () => {
      const rating = new StarRating(mockScene, {
        maxStars: 3,
        initialStars: 1,
      });

      expect(rating.getRating()).toBe(1);

      rating.setRating(3, false);
      expect(rating.getRating()).toBe(3);
    });

    it('clamps rating values to [0, maxStars]', () => {
      const rating = new StarRating(mockScene, {
        maxStars: 3,
      });

      rating.setRating(5, false);
      expect(rating.getRating()).toBe(3);

      rating.setRating(-2, false);
      expect(rating.getRating()).toBe(0);
    });

    it('animates star pops sequentially when animate is true', () => {
      const rating = new StarRating(mockScene, {
        maxStars: 3,
      });

      const onComplete = vi.fn();
      rating.setRating(2, true, onComplete);

      expect(rating.getRating()).toBe(2);
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('resets rating back to 0', () => {
      const rating = new StarRating(mockScene, {
        initialStars: 3,
      });

      expect(rating.getRating()).toBe(3);
      rating.reset();
      expect(rating.getRating()).toBe(0);
    });
  });

  describe('UI Layering & ScrollFactor Regressions', () => {
    it('maintains background at index 0 when CanvasButton.setColor is called', () => {
      const btn = new CanvasButton(mockScene, {
        text: '測試按鈕',
        color: 'grey',
      });

      // Background should be at index 0, text on top
      expect(btn.list[0]).toBe((btn as any).bgGraphics);
      expect(btn.list[btn.list.length - 1]).toBe((btn as any).labelText);

      // Call setColor
      btn.setColor('yellow');
      expect(btn.list[0]).toBe((btn as any).bgGraphics);
      expect(btn.list.indexOf((btn as any).labelText)).toBeGreaterThan(0);
      expect(btn.getText()).toBe('測試按鈕');
    });

    it('maintains background at index 0 when CanvasCard.setState is called', () => {
      const card = new CanvasCard(mockScene, {
        text: '蘋果',
        color: 'blue',
      });

      expect(card.list[0]).toBe((card as any).bgGraphics);
      expect(card.list[card.list.length - 1]).toBe((card as any).labelText);

      card.setState('selected');
      expect(card.list[0]).toBe((card as any).bgGraphics);
      expect(card.list.indexOf((card as any).labelText)).toBeGreaterThan(0);
      expect(card.getText()).toBe('蘋果');
    });

    it('CanvasModal propagates scrollFactor to children and added content', () => {
      const modal = new CanvasModal(mockScene, {
        title: '關卡資訊',
      });

      modal.setScrollFactor(0);
      expect((modal as any).backdropRect.scrollFactorX).toBe(0);
      expect((modal as any).backdropRect.scrollFactorY).toBe(0);
      expect((modal as any).closeBtn.scrollFactorX).toBe(0);
      expect((modal as any).closeBtn.scrollFactorY).toBe(0);

      const testBtn = new CanvasButton(mockScene, { text: '開始' });
      modal.addContent(testBtn);
      expect(testBtn.scrollFactorX).toBe(0);
      expect(testBtn.scrollFactorY).toBe(0);
    });
  });
});
