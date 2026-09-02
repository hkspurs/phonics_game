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
- Shop Item State Lifecycle & Single-Source Pricing: Formalized 4-state item model (`locked`, `available_not_owned`, `owned_not_equipped`, `equipped`) with single authoritative currency pricing, explicit purchase confirmation modals (`showSkinPurchaseConfirm`, `showPetPurchaseConfirm`), non-mutating preview overlay, and atomic ledger deductions.
- Question & Runner Screen Stabilization (Phase 2): 4-region vertical budget, structured feedback states without UI collision, slot correct styling, Continue CTA button, 3-step progressive tutorial coaching, and safe skip confirmation.
- Progression & Celebration (Phase 3): Map hierarchy, progress terminology (`X/10 已通關`, `X/30 ⭐`), itemized arithmetic reward breakdown, non-blocking achievement queue, and unified diagnostic report entry.
- Home & Collectible Presentation (Phase 4): Dominant Start CTA, hero character composition with companion pet, 4-state shop item lifecycle, P0 reproduction test compliance, non-mutating preview restore, and atomic purchases.
- Responsive & Production Polish (Phase 5): Multi-viewport matrix verification (iPhone 16 Pro Max, iPhone 14, iPhone SE, iPad 4:3, Desktop 16:9), touch targets >=48px, minimum rendered font size >=16px, SpeechService fallback resilience, and reduced motion compliance.
- 58 test suites and 1,824 unit tests 100% passing. Production build clean.

## Known Issues
- Vitest JSDOM environment lacks some Phaser Graphics mock functions (`strokeCircle`), requiring defensive checks (`typeof g.strokeCircle === 'function'`).
- Web Speech API voice availability varies by OS/browser, requiring text-only fallback on unsupported platforms.

## Important Decisions
- **Master Character Spec**: Standard 512x512 canvas, ground baseline Y=460, X=256 center, Chibi 1:2.5 ratio.
- **Layer Stacking**: Back Accessories (Angel Wings) strictly rendered at Depth 35 behind character body.
- **AI Control Plane**: `.ai/` and `AGENTS.md` govern all automated AI coordination.
