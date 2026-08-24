# P1 Adventure Top 10 Educational & Gameplay Enhancements Plan

> **Goal:** Implement the 10 high-impact gameplay, audio, narrative, and technical enhancements developed by the multidisciplinary team to maximize retention, motivation, and learning joy for Hong Kong Primary 1 children.

## Subsystems & Architecture:
1. **Audio & Juiciness Pipeline (`SoundManager.ts`, `CanvasCard.ts`)**:
   - Web Audio synthesizer for Do-Re-Mi progressive pitch-shifting correct answer chime.
   - Squash & stretch juice tween on cards with debounce protection.
   - ASMR magnetic card slot snapping.
2. **Companion Egg Hatching & Pet System (`DataManager.ts`, `RunnerScene.ts`, `TitleScene.ts`)**:
   - 3-6-9 fast hatching milestone system.
   - Floating pet companion following player in RunnerScene and TitleScene.
3. **Rainbow Rush Fever Mode (`QuestionScene.ts`, `RunnerScene.ts`)**:
   - Energy gauge filled by correct answers.
   - Invincible speed boost with rainbow aura and obstacle-to-coin conversion.
4. **Daily 3-Minute Quest & Lucky Spin Wheel (`DailyQuestManager.ts`, `TitleScene.ts`)**:
   - Daily 3-question quest (Chinese, Math, English).
   - Interactive Lucky Spin Wheel dialog with coin & cosmetic rewards.
5. **Landmark Stamp Book & 10 Biome Theming (`MapScene.ts`, `ResultScene.ts`)**:
   - Hong Kong landmark stamp badges upon clearing stations.
   - Procedural themed sky gradients and parallax biomes across 10 stations.
6. **Mascot Leo Dynamics & Gentle Retry Flow (`QuestionScene.ts`, `ResultScene.ts`)**:
   - Speech-safe mascot animations & speech bubbles.
   - Spring balloon-bounce 3-star settlement animations.

---
