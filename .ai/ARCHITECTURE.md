# Architecture of P1 Adventure (升夢大冒險)

## 1. High-Level Technology Stack
- **Game Engine**: Phaser 3 (`^3.87.0`)
- **Language**: TypeScript (`^5.5.3`) with strict mode
- **Bundler & Dev Server**: Vite (`^5.3.3`)
- **Unit Test Runner**: Vitest (`^2.0.2`) with JSDOM environment
- **E2E & Visual QA**: Playwright (`^1.47.0`)
- **Deployment**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

---

## 2. Directory Layout & Module Structure

```
p1-adventure/
├── .ai/                       # AI Coordination System (Single Source of Truth)
│   ├── CURRENT_STATE.md       # Real-time state of codebase & features
│   ├── TASK_BOARD.md          # Active & planned AI tasks
│   ├── OWNERSHIP.md           # Module locking to avoid collision
│   ├── CHANGELOG.md           # History of AI modifications
│   ├── ARCHITECTURE.md        # Technical architecture reference
│   ├── CONVENTIONS.md         # Coding style & safety rules
│   ├── TESTING.md             # Testing & verification procedures
│   └── decisions/             # Architecture Decision Records (ADRs)
├── docs/                      # Production build distribution & specifications
│   ├── character-art-spec.md  # Master Character Specification
│   └── index.html             # GitHub Pages landing bundle
├── public/                    # Static runtime assets
│   └── assets/
│       └── character/outfits/ # 512x512 Master transparent PNG sprites
├── src/
│   ├── config/                # Game configuration & registries
│   │   ├── curriculum.ts      # Primary 1 questions (Chinese, English, Math)
│   │   ├── outfits.ts         # Full character sprite outfit definitions
│   │   ├── wardrobe.ts        # 18 modular clothing items & categories
│   │   ├── pets.ts            # Companion pet stats and animations
│   │   ├── skins.ts           # 5 playable character skins & perk bonuses
│   │   └── worlds.ts          # World map nodes & station IDs
│   ├── engine/                # Core pedagogical & gameplay engines
│   │   ├── QuestionEngine.ts  # Question evaluation, scoring, and streaks
│   │   ├── SentenceEngine.ts  # Chinese/English sentence token scrambler & slot validator
│   │   └── MathGenerator.ts   # Dynamic Grade 1 math problem generator
│   ├── scenes/                # Phaser 3 Scene State Machine
│   │   ├── PreloadScene.ts    # Asset preloading & procedural texture generation
│   │   ├── TitleScene.ts      # Title screen, menu, profile modal
│   │   ├── MapScene.ts        # World map, station selection, world unlock gates
│   │   ├── QuestionScene.ts   # Interactive quiz screen with token/card slots
│   │   ├── RunnerScene.ts     # 2D platforming runner with physics & collectibles
│   │   └── ShopScene.ts       # Dream Wardrobe, skin purchase, OOTD photo booth
│   ├── services/              # Cross-cutting state managers & APIs
│   │   ├── DataManager.ts     # LocalStorage persistence (`p1_adventure_save_v1`)
│   │   ├── SoundManager.ts    # Procedural Web Audio API sound synthesizer
│   │   ├── SpeechService.ts   # Web Speech API multi-language TTS synthesizer
│   │   └── PlayerAvatarService.ts # Cross-scene character sprite sync
│   ├── ui/                    # Reusable Phaser UI components
│   │   ├── CanvasButton.ts    # Vector button with glossy gradient & hover feedback
│   │   ├── CanvasCard.ts      # Word chip draggable/tappable card component
│   │   ├── SlotBox.ts         # Word insertion slot with border glow & error state
│   │   ├── CharacterOutfitCompositor.ts # Wardrobe positioning & vector compositing
│   │   ├── OutfitRenderer.ts  # Hybrid sprite & accessory layer renderer
│   │   └── CharacterPreviewController.ts # Live wardrobe showcase controller
│   └── main.ts                # Phaser.Game initialization & Scale FIT configuration
├── GEMINI.md                  # Google AGY startup protocol
└── AGENTS.md                  # OpenAI Codex startup protocol
```

---

## 3. Core Subsystems

### A. Scene Transition Flow
```
[PreloadScene] 
      │
      ▼
 [TitleScene] ──► [ShopScene] (Wardrobe & Skins)
      │
      ▼
  [MapScene] (World & Station Select)
      │
      ▼
[QuestionScene] (1-3 Educational Questions)
      │ (onCorrectAnswer)
      ▼
 [RunnerScene] (Platforming & Treasure Chest Loot)
      │ (onReachChest)
      ▼
 [Return to Map / Next Question]
```

### B. Scaled Display Standard
- **Internal Resolution**: `1280 x 720 px` (16:9 Landscape)
- **Scale Mode**: `Phaser.Scale.FIT` with `Phaser.Scale.CENTER_BOTH`
- **Retina Crispness**: Text objects specify `resolution: Math.max(2, window.devicePixelRatio || 2)` for sharp Retina text rendering.

### C. Wardrobe & Layer Stacking Hierarchy
```
[Depth 35] Back Accessories (angel_wings, star_backpack rear anchor)
[Depth 40] Character Body Sprite (Full-Sprite Outfit or Base Character)
[Depth 41-44] Rigged Modular Costume Layers
[Depth 45] Front Accessories (star_glasses at eyes, cat_ears / scholar_cap on crown)
[Depth 50] Gold Sparkle FX & Celebration Particles
```
