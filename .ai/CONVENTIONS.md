# Coding & Development Conventions

All AI agents (**Google Antigravity** and **OpenAI Codex**) must strictly adhere to these conventions.

---

## 1. TypeScript & Defensive Coding Standards
- **Strict Checks**: Never call methods on optional Phaser subsystems without existence guards:
  ```typescript
  if (this.tweens?.add) { ... }
  if (this.add?.graphics) { ... }
  if (typeof (g as any).strokeCircle === 'function') { ... }
  ```
- **Mock Safety in Vitest/JSDOM**:
  - JSDOM does not provide full Canvas rendering contexts.
  - Always use fallback drawing logic (e.g. `CharacterOutfitCompositor.drawLine()` or `fillCircle()`).
- **LocalStorage Safety**:
  - Wrap all `localStorage` reads and writes in `try / catch` blocks to handle private browsing storage quotas.

---

## 2. UI & Responsive Design Conventions
- **Mobile Typography Standards**:
  - Primary Prompts: `>= 24px - 32px` bold.
  - Interactive Buttons & Word Chips: `>= 20px - 26px`.
  - HUD / Secondary Labels: `>= 16px - 18px`.
  - Avoid text sizes `< 14px` on mobile viewports.
- **Touch Hit Areas**:
  - Minimum interactive tap target: `44 x 44 px`.
  - Use Phaser container-relative coordinates rather than raw browser window coordinates.
- **High-DPI Retina Rendering**:
  - Specify `resolution: Math.max(2, window.devicePixelRatio || 2)` on Phaser Text objects.

---

## 3. Asset & Layering Standards
- **Master Character Specification**:
  - Standard Canvas: `512 x 512 px` transparent PNG.
  - Ground Baseline: `Y = 460 px`.
  - Proportions: 1:2.5 Chibi Q-version.
- **Depth Stacking**:
  - `Depth 35`: Back Accessories (`angel_wings`).
  - `Depth 40`: Character Body Sprite.
  - `Depth 45`: Front Accessories (`star_glasses`, `scholar_cap`, `cat_ears`).
