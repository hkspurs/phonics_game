# Current Project State

## Technology Stack
- **Game Engine**: Phaser 3 (`^3.87.0`)
- **Language**: TypeScript (`^5.5.3`) in strict mode
- **Build Tool**: Vite (`^5.3.3`)
- **Unit Testing**: Vitest (`^2.0.2`) with JSDOM
- **E2E & Visual Testing**: Playwright (`^1.47.0`)
- **Web APIs**: Web Audio API (procedural SFX), Web Speech API (multi-lingual TTS)

## Current Major Systems
- **Phaser Scenes**:
  - `PreloadScene`: Asset preloading & canvas procedural textures (coin, gem, springboard, mossy rock).
  - `TitleScene`: Title screen, profile banner, play navigation, wardrobe shop entry.
  - `MapScene`: World islands & station nodes progression.
  - `QuestionScene`: Chinese sentence scrambler, English CVC phonics, dynamic Math questions, blackboard frame, 16-particle celebration.
  - `RunnerScene`: Platformer with jump/double-jump, springboard squash, dynamic contact shadow, obstacle rocks, treasure chest fountain burst, and companion pets.
  - `ShopScene`: Dream Wardrobe, skin purchasing, live character preview controller, spotlight pedestal, OOTD Polaroid with washi tape.
- **Character & Wardrobe System**:
  - 5 Playable Character Skins (Adventurer, Heroine, Soldier, Knight, Ninja) with distinct stat perks.
  - 5 Major Production Full-Sprite Outfits (`school_uniform`, `scholar_gown`, `princess_dress`, `dino_onesie`, `magic_robe`) at 512x512 with ground baseline Y=460.
  - 18 Modular Clothing Items with dress vs top/bottom mutual exclusivity.
  - `OutfitRenderer` & `CharacterOutfitCompositor` with depth layering (`BACK_ACCESSORY` at Depth 35).
- **Audio & Speech**:
  - `SoundManager`: Procedural synthesized Web Audio sound effects (coin arpeggio, springboard bounce, chest chime).
  - `SpeechService`: Multi-lingual Web Speech API synthesis (`zh-HK`, `zh-TW`, `en-US`).
- **Data & Economy**:
  - `DataManager`: Single source of truth for profile, currency (coins, gems, stars), inventory, equipped wardrobe, and LocalStorage (`p1_adventure_save_v1`).

## Current Development Direction
- Multi-device responsive UX polish (iPhone 16 Pro Max, iPhone SE, iPad).
- Speech synthesis fallback resilience across mobile WebKit browsers.
- Curriculum expansion for World 2 (Kowloon) and World 3 (New Territories).

## Completed Major Features
- Complete Grade 1 Chinese, English, and Math interactive curriculum question mechanics with 3 cognitive progression tiers.
- `PedagogyEngine`: 3-tier progressive hints (Direction -> Visual Support -> Guided Solution), age-appropriate wrong-answer instructional feedback, and reinforcement sentences for correct answers.
- Authoritative Reward Ledger (`RewardTransaction` in `DataManager`) recording source type, transaction ID, balance transitions, with idempotent first-clear rewards.
- Clear Progress Semantics: Strict separation of completed stations count (`X/10 已通關`) from unlocked station index.
- Diagnostic Learning Report (`DiagnosticReportModal.ts`): Visual summary of accuracy rates, total hints used, mistakes made, subject breakdown, and interactive Review Mistakes practice flow.
- Runner Experience: Skip confirmation modal with explicit reward forfeiture disclosure (`跳過跑酷？你會保留答題獎勵，但不會獲得尚未收集的跑酷獎勵。`), first-run 3-step interactive tutorial, and min 48px multi-touch hitboxes.
- Shop Item State Lifecycle: Formalized 4-state item model (`locked`, `available_not_owned`, `owned_not_equipped`, `equipped`) with non-mutating preview overlay and atomic ledger deductions.
- Mobile Landscape Responsive Layout: Native FIT scaling across 844x390, 667x375, 932x430, and 1024x768 viewports with safe area padding.
- Production-grade character sprite asset pipeline (512x512 transparent PNGs, 1:2.5 Chibi proportion).
- Full runner platforming physics, dynamic contact shadow, and chest celebration.
- OOTD Polaroid photo modal and live outfit previewing across Stand, Run, Cheer poses.
- 52 test suites and 1,538 unit tests 100% passing.

## Known Issues
- Vitest JSDOM environment lacks some Phaser Graphics mock functions (`strokeCircle`), requiring defensive checks (`typeof g.strokeCircle === 'function'`).
- Web Speech API voice availability varies by OS/browser, requiring text-only fallback on unsupported platforms.

## Important Decisions
- **Master Character Spec**: Standard 512x512 canvas, ground baseline Y=460, X=256 center, Chibi 1:2.5 ratio.
- **Layer Stacking**: Back Accessories (Angel Wings) strictly rendered at Depth 35 behind character body.
- **AI Control Plane**: `.ai/` and `AGENTS.md` govern all automated AI coordination.
