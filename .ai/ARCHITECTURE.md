# Architecture Reference

## 1. Directory Structure

```
p1-adventure/
├── .ai/                       # Shared AI Coordination Control Plane
│   ├── CURRENT_STATE.md       # Concise current project overview
│   ├── TASK_BOARD.md          # Active & completed AI tasks
│   ├── OWNERSHIP.md           # File/module locks
│   ├── CHANGELOG.md           # Chronological development log
│   ├── ARCHITECTURE.md        # Technical architecture reference
│   ├── CONVENTIONS.md         # Coding style & safety rules
│   ├── TESTING.md             # Testing commands & QA protocols
│   └── decisions/             # Architecture Decision Records
├── docs/                      # Production build & specifications
│   ├── character-art-spec.md  # Master Character Specification
│   └── index.html             # Static web bundle
├── public/
│   └── assets/character/      # 512x512 transparent character sprites
├── src/
│   ├── config/                # Curriculum, outfits, wardrobe, pets, skins
│   ├── engine/                # QuestionEngine, SentenceEngine, MathGenerator
│   ├── scenes/                # Phaser 3 Scenes (Preload, Title, Map, Question, Runner, Shop)
│   ├── services/              # DataManager, SoundManager, SpeechService, PlayerAvatarService
│   ├── ui/                    # CanvasButton, CanvasCard, SlotBox, OutfitRenderer, Compositor
│   └── main.ts                # Phaser game bootstrap & Scale FIT
├── AGENTS.md                  # Master AI Development Protocol
└── GEMINI.md                  # Google Antigravity entry point
```

## 2. Scene Flow & State Machine

```
               ┌──────────────┐
               │ PreloadScene │
               └──────┬───────┘
                      ▼
               ┌──────────────┐       ┌───────────┐
               │  TitleScene  │◄─────►│ ShopScene │
               └──────┬───────┘       └───────────┘
                      ▼
               ┌──────────────┐
               │   MapScene   │
               └──────┬───────┘
                      ▼
               ┌──────────────┐
               │QuestionScene │
               └──────┬───────┘
                      ▼ (onCorrectAnswer)
               ┌──────────────┐
               │ RunnerScene  │
               └──────┬───────┘
                      ▼ (onReachChest)
           [Next Question / Map]
```

## 3. Data & State Management
- **Persistence**: Managed by `DataManager.getInstance()` using LocalStorage key `p1_adventure_save_v1`.
- **Currency & Progression**: Coins, gems, unlocked worlds/stations, owned skins, and equipped wardrobe dictionary.
- **Avatar Sync**: `PlayerAvatarService` provides consistent sprite keys and tints across scenes.

## 4. Wardrobe & Rendering Depth Hierarchy
```
[Depth 35] BACK_ACCESSORY (angel_wings, star_backpack rear anchor)
[Depth 40] Character Body Sprite (Full-Sprite Outfit or Base Character)
[Depth 41-44] Rigged Modular Costume Layers
[Depth 45] FRONT_ACCESSORY (star_glasses at eyes, cat_ears / scholar_cap on head)
[Depth 50] FX & Sparkle Particle Bursts
```

## 5. Audio & TTS Architecture
- **SoundManager**: Procedural Web Audio oscillator synthesis (no external audio assets required).
- **SpeechService**: Web Speech API (`window.speechSynthesis`) with voice selection for Cantonese (`zh-HK`), Mandarin (`zh-TW`), and English (`en-US`).
