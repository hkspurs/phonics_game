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
- **Avatar Sync**: `PlayerAvatarService` provides consistent sprite keys and tints across scenes. `RunnerScene` routes idle, run, jump, and cheer poses through the same outfit-aware resolver; dedicated full-sprite outfits remain authoritative, optional jump art is preferred, and explicit `idleFallback` metadata prevents duplicate run/cheer files from being treated as authored motion. The compositor only receives modular accessories while a full sprite is active. Dedicated 512px wearing art maps its shared Y=460 foot baseline to the Runner visual center without changing physics coordinates, and full-sprite accessory passes use that same visual center. `CharacterPreviewController`, `RunnerScene`, Title, Map, Question, Shop, the compact avatar badge, and companion pets suppress non-essential motion when `prefers-reduced-motion` is enabled. The Title mascot and badge use `OutfitRenderer` for the same equipped wardrobe contract.
- **Station Identity**: `normalizeStationId()` converts numeric and legacy string scene payloads to the numeric station definition used by `MapScene.STATIONS`; Question, Runner, and Result use that normalized identity for labels, icons, and Runner sky themes.
- **Accessory Passes**: full-sprite and layered previews render back accessories once behind the body and front accessories once above it; full-sprite passes map those accessories from the canonical 512×512 wearing-art coordinate space, while base/composite paths retain their existing anchor contract. Composite fallback uses a dedicated rear graphics pass when available and keeps a one-pass fallback only when no rear target exists. OOTD follows the same contract.
- **Preview Cache Ownership**: each `CharacterPreviewController` owns one stable `OutfitRenderTarget`, allowing `OutfitRenderer` to reuse unchanged render results while still revalidating asset readiness, base texture, and scale.

## 4. Wardrobe & Rendering Depth Hierarchy
```
 [Depth 35] BACK_ACCESSORY (Wardrobe preview: angel_wings, star_backpack rear anchor)
 [Depth 40] Character Body Sprite (Wardrobe preview: Full-Sprite Outfit or Base Character)
 [Depth 41-44] Rigged Modular Costume Layers
 [Depth 45] FRONT_ACCESSORY (Wardrobe preview: star_glasses at eyes, cat_ears / scholar_cap on head)
 [Depth 50] FX & Sparkle Particle Bursts

Runner and OOTD use the same ordering at their local scale: back accessory
depth 14, body depth 15, and front accessory depth 16.
```

Full-sprite outfits are authoritative when their registered pose texture is
available and marked authored. Catalog thumbnails are never accepted as
wearing candidates, even if metadata accidentally reuses the same path.
Dedicated wearing art may declare `supportedCharacterIds`; the currently
delivered full-body outfit set supports `adventurer` only. When another skin is
selected, the shared renderer/service/OOTD paths retain that skin's base sprite
and use layered or compositor fallback until matching per-skin artwork exists.
Because a dedicated full-body sprite cannot represent a second body garment,
it is eligible only when exactly one of `dress`, `top`, or `bottom` is active;
multi-slot body try-ons use the existing compositor so every selected garment
remains visible. Accessories continue to render through the shared back/front
passes in either mode.
The purchase gate may require both catalog thumbnail and idle wearing art;
runtime Runner/OOTD rendering uses the wearing-source-only readiness check so
an available full sprite is not discarded just because its thumbnail is absent.
Preload uses the independent `OutfitDefinition.thumbnailStatus` field: a
catalogue thumbnail can be requested before wearing art is ready only when its
readiness is explicit (`thumbnailStatus: 'ready'`); an
`artworkStatus: 'placeholder'` definition with no confirmed thumbnail still
contributes no catalogue, wearing, run, or cheer paths. This prevents
missing-art 404s and preserves the safe base character fallback.
Placeholder definitions are never promoted to full-sprite mode, even if a
stale wearing path happens to be loaded; the registry also hides full-sprite
and layered paths/keys from direct asset callers. Layered fallback is opt-in
through explicit `OutfitDefinition.layers`; full-sprite definitions do not
synthesize missing layer paths. A layered entry that reuses the catalogue
thumbnail invalidates the layered candidate as well, so catalog art cannot
become wearing art through a malformed layer definition. If neither path is
available, `OutfitRenderer` delegates to the cached
`CharacterOutfitCompositor` fallback and ultimately the base character.

## 5. Audio & TTS Architecture
- **SoundManager**: Procedural Web Audio oscillator synthesis (no external audio assets required).
- **SpeechService**: Web Speech API (`window.speechSynthesis`) with voice selection for Cantonese (`zh-HK`), Mandarin (`zh-TW`), and English (`en-US`).
