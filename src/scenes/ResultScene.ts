import Phaser from 'phaser';
import { CanvasButton } from '../ui/CanvasButton';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    if (this.add?.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x2b2d42);
    }

    if (this.add?.text) {
      const title = this.add.text(width / 2, 120, '🎉 結算成績表 (Result Scene)', {
        fontSize: '32px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') {
        title.setOrigin(0.5);
      }
    }

    new CanvasButton(this, {
      x: 100,
      y: 60,
      width: 140,
      height: 48,
      text: '◀ 返回主頁',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });
  }
}
