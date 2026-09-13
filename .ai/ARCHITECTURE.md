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
│   ├── presentation/         # ScreenHost and responsive CSS-pixel storybook views
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

## 6. Responsive Presentation Boundary
- **`ScreenHost`** owns one active DOM view under `#screen-host`, toggles the
  `body.has-screen-view` state, and destroys the previous view before mounting a
  new scene surface. Settings and Trophy scenes own their view handles, while
  `DiagnosticReportModal` mounts a modal handle over the current Home surface.
- **Responsive views** (`HomeView`, `MapView`, `StationDetailView`,
  `QuestionView`, `ResultView`, `SettingsView`, `TrophyView` and
  `DiagnosticReportView`) render reading-heavy controls in CSS pixels with
  safe-area padding, 48px-class targets and keyboard/focus semantics. Their
  callbacks call the owning Phaser scene, so navigation, progression, reports
  and reset mutations still use scene models and `DataManager` as the source of
  truth.
- **Mistake review reconstruction**: `QuestionEngine.getMistakeReviewQuestions()`
  resolves queued IDs in persisted order, preferring serialized `questionSnapshot`
  data and falling back to exact curriculum items or a same-subject generated
  question for legacy dynamic attempts.
- **Diagnostic hint aggregation**: `DataManager.getDiagnosticSummary()` treats
  `hintLevelUsed` as cumulative within a question session. It counts each
  session's highest level and detects a revisit when `attemptNumber` resets,
  so repeated practice of one curriculum ID is represented without counting
  every retry as another hint.
- **Interactive ownership**: while `QuestionView` is mounted, the hidden
  Phaser question controls are disabled and restored on scene shutdown. This
  prevents duplicate answer paths and keeps DOM feedback, hint and Continue
  actions synchronized with one authoritative scene model. Runner and Shop
  remain canvas-owned because they have no responsive DOM migration yet.
- **Fallback behavior**: when no host is available (embedded tests or a
  non-browser shell), the existing Phaser canvas UI remains usable. The
  optional portrait orientation toast is non-interactive and never blocks the
  active view.
