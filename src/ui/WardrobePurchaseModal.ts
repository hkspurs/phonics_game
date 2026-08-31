import Phaser from 'phaser';
import { OutfitDefinition } from '../types/wardrobe';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from './CanvasButton';

export interface PurchaseModalConfig {
  width: number;
  height: number;
  item: OutfitDefinition;
  onEquip?: () => void;
  onClose?: () => void;
}

/**
 * WardrobePurchaseModal
 *
 * Child-friendly purchase celebration modal with confetti particles, sparkle glow,
 * and Cantonese voice praise.
 */
export class WardrobePurchaseModal {
  public static show(scene: Phaser.Scene, config: PurchaseModalConfig): Phaser.GameObjects.Container {
    const { width, height, item, onEquip, onClose } = config;

    const modal = scene.add.container
      ? scene.add.container(width / 2, height / 2)
      : new Phaser.GameObjects.Container(scene, width / 2, height / 2);

    if (modal.setDepth) modal.setDepth(200);

    // 1. Dark Backdrop with interactive click blocker
    if (scene.add?.graphics) {
      const dim = scene.add.graphics();
      dim.fillStyle(0x0a0c16, 0.75);
      dim.fillRect(-width / 2, -height / 2, width, height);
      if (typeof dim.setInteractive === 'function' && Phaser?.Geom?.Rectangle) {
        dim.setInteractive(
          new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
          Phaser.Geom.Rectangle.Contains
        );
      }
      modal.add(dim);

      // 2. Ornate Modal Card
      const card = scene.add.graphics();
      card.fillStyle(0x1e1b4b, 0.98);
      card.fillRoundedRect(-220, -180, 440, 360, 20);
      card.lineStyle(3, 0xf59e0b, 1.0);
      card.strokeRoundedRect(-220, -180, 440, 360, 20);

      // Inner Header Glow Pill
      card.fillStyle(0x312e81, 0.95);
      card.fillRoundedRect(-180, -165, 360, 52, 14);
      card.lineStyle(1.5, 0xfde047, 0.8);
      card.strokeRoundedRect(-180, -165, 360, 52, 14);

      modal.add(card);
    }

    // 3. Header Text & Title
    if (scene.add?.text) {
      const headerText = scene.add.text(0, -140, '✨ 購買成功！已加入衣櫥 ✨', {
        fontSize: '22px',
        color: '#fde047',
        fontStyle: 'bold',
        align: 'center',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
      });
      if (headerText.setOrigin) headerText.setOrigin(0.5);
      modal.add(headerText);

      // Item Icon & Name
      const iconText = scene.add.text(0, -75, item.icon, { fontSize: '48px' });
      if (iconText.setOrigin) iconText.setOrigin(0.5);
      modal.add(iconText);

      const nameText = scene.add.text(0, -25, item.nameZh, {
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
      });
      if (nameText.setOrigin) nameText.setOrigin(0.5);
      modal.add(nameText);

      // English Name
      const enText = scene.add.text(0, 5, item.nameEn, {
        fontSize: '17px',
        color: '#93c5fd',
        align: 'center',
      });
      if (enText.setOrigin) enText.setOrigin(0.5);
      modal.add(enText);

      // Perk / Description Badge
      const perkText = scene.add.text(0, 45, item.perkDescription, {
        fontSize: '18px',
        color: '#fef08a',
        align: 'center',
        fontStyle: 'bold',
      });
      if (perkText.setOrigin) perkText.setOrigin(0.5);
      modal.add(perkText);
    }

    // 4. Primary Action Button: "👗 立即穿戴"
    const equipBtn = new CanvasButton(scene, {
      x: width / 2 - 100,
      y: height / 2 + 115,
      width: 170,
      height: 52,
      text: '👗 立即換上',
      color: 'yellow',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        if (onEquip) onEquip();
        equipBtn.destroy();
        closeBtn.destroy();
        modal.destroy();
        if (onClose) onClose();
      },
    });
    if (typeof equipBtn.setDepth === 'function') equipBtn.setDepth(205);

    const closeBtn = new CanvasButton(scene, {
      x: width / 2 + 100,
      y: height / 2 + 115,
      width: 150,
      height: 52,
      text: '👍 太棒了',
      color: 'blue',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        equipBtn.destroy();
        closeBtn.destroy();
        modal.destroy();
        if (onClose) onClose();
      },
    });
    if (typeof closeBtn.setDepth === 'function') closeBtn.setDepth(205);

    // Audio Celebrations
    SoundManager.play('victory');
    try {
      const praises = ['哇！呢件衫好襯你呀！', '好靚呀！', '太型喇！', '好有學霸風采喎！'];
      const msg = praises[Math.floor(Math.random() * praises.length)];
      SpeechService.speak(msg, 'zh-HK');
    } catch {}

    return modal;
  }
}
