import { ADVENTURE_STEPS } from './adventureEvents';

const DEFAULT_LABELS = {
  steps: ['Rabbit House', 'River Bridge', 'Carrot Castle'],
  adventure: 'Adventure',
  greatWork: 'Great work!',
  keepGoing: 'Keep going!',
};

export function createAdventureScene(Phaser, callbacks = {}) {
  const labels = callbacks.labels || DEFAULT_LABELS;
  return class AdventureScene extends Phaser.Scene {
    constructor() {
      super('AdventureScene');
      this.state = { step: 0, status: 'idle', word: '', labels };
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor('#dff7ef');
      this.add.rectangle(width / 2, height / 2, width, height, 0xdff7ef);
      this.path = this.add.graphics();
      this.rabbit = this.add.text(0, 0, '🐰', { fontSize: '48px' }).setOrigin(0.5);
      this.landmark = this.add.text(0, 0, ADVENTURE_STEPS[this.state.step].emoji, { fontSize: '34px' }).setOrigin(0.5);
      this.caption = this.add.text(width / 2, height - 28, this.captionText(), {
        color: '#164e63',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.resizeWorld();
      this.scale.on('resize', this.resizeWorld, this);
      this.input.on('pointerdown', () => callbacks.onContinue?.());
      callbacks.onReady?.(this);
    }

    resizeWorld() {
      if (!this.path || !this.rabbit || !this.landmark) return;
      const { width, height } = this.scale;
      const left = Math.min(72, width * 0.16);
      const right = Math.max(width - 72, width * 0.84);
      const y = height * 0.52;
      this.path.clear();
      this.path.lineStyle(7, 0x93c5fd, 1);
      this.path.beginPath();
      this.path.moveTo(left, y);
      this.path.lineTo(right, y);
      this.path.strokePath();
      this.landmark.setPosition(right, y - 36);
      this.placeRabbit(left, y);
    }

    placeRabbit(left, y) {
      const { width } = this.scale;
      const right = Math.max(width - 72, width * 0.84);
      const ratio = ADVENTURE_STEPS.length <= 1
        ? 0
        : this.state.step / (ADVENTURE_STEPS.length - 1);
      this.rabbit.setPosition(left + (right - left) * ratio, y - 36);
    }

    setAdventureState(nextState = {}) {
      this.state = { ...this.state, ...nextState };
      const { width, height } = this.scale;
      const left = Math.min(72, width * 0.16);
      const y = height * 0.52;
      this.placeRabbit(left, y);
      this.landmark.setText(ADVENTURE_STEPS[this.state.step]?.emoji || '🌱');
      this.caption.setText(this.captionText());
      if (this.state.status === 'correct') {
        this.tweens.add({ targets: this.rabbit, y: this.rabbit.y - 12, duration: 180, yoyo: true });
      }
    }

    captionText() {
      const labels = this.state.labels || callbacks.labels || DEFAULT_LABELS;
      return this.state.word
        ? `${this.state.status === 'correct' ? labels.greatWork : labels.keepGoing}  ${this.state.word}`
        : labels.steps[this.state.step] || labels.adventure;
    }

    shutdown() {
      this.scale.off('resize', this.resizeWorld, this);
    }
  };
}
