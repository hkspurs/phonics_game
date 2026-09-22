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
  - `TitleScene`: Storybook home scene, profile banner, play navigation, wardrobe shop entry.
  - `MapScene`: World islands, station nodes progression, and responsive station detail flow.
  - `QuestionScene`: Chinese sentence scrambler, English CVC phonics, dynamic Math questions, blackboard frame, explicit Continue pacing, and responsive reading surface.
  - `RunnerScene`: Platformer with jump/double-jump, springboard squash, dynamic contact shadow, obstacle rocks, treasure chest fountain burst, and companion pets.
  - `ShopScene`: Dream Wardrobe, skin purchasing, live character preview controller, spotlight pedestal, OOTD Polaroid with washi tape, and warm storybook palette.
  - `ResultScene`: Reward settlement, star celebration, trophy queue, and responsive reading-first result view.
- **Responsive presentation layer**:
  - `ScreenHost` owns one active DOM view and its lifecycle. `HomeView`,
    `MapView`, `StationDetailView`, `QuestionView`, `ResultView`,
    `SettingsView`, `TrophyView` and `DiagnosticReportView` provide CSS-pixel
    layouts with safe-area padding, keyboard focus and 48px-class touch
    controls.
  - The responsive question surface is the sole interactive layer while it is
    mounted; its callbacks still use the scene models and `DataManager` as the
    single source of truth, and Phaser input is restored during shutdown.
  - Supporting dialogs expose named headings, live status, Escape handling,
    focus trapping/return and explicit destructive reset confirmation. Phaser
    remains the fallback renderer where no DOM host exists.
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
- Storybook UX migration (Phases 0–7): Warm woodland art direction, responsive Home → Map → Station Detail → Question → Result flow, explicit answer feedback pacing, stable sentence-token interaction, runner input blur safety, and consistent shop/result styling.
- Supporting accessibility and release verification (Phases 8–9): Responsive Settings/Trophy/Diagnostic Report destinations, truthful diagnostic empty states, semantic keyboard/touch controls, queued mistake reconstruction for current and legacy saves, explicit additive session IDs for new attempt history, conservative legacy hint aggregation, visibly labelled replacement practice, optional portrait guidance, 48px short-landscape scrolling fixes, real-control journey coverage and the seven-viewport release matrix.
- Release hardening Task C: PR-targeted CI runs unit/build/local browser gates with bounded artifacts; deployed checks are isolated in `test:e2e:live` and require `LIVE_BASE_URL` plus `EXPECTED_SOURCE_SHA`. Vite emits `build-info.json` and the Pages workflow verifies the SHA before publication.
- Release hardening Task 6: boot keeps core art plus the equipped outfit available,
  while unselected wardrobe and pet art load per destination through a
  group-isolated, retryable `RuntimeAssetLoader`. Shop purchase controls remain
  disabled until the selected art is verified in Phaser's texture store.
- 65 test suites and 1,958 unit tests passing. Production TypeScript/Vite build succeeds; Vite reports only its existing large-chunk advisory.

## Known Issues
- Vitest JSDOM environment lacks some Phaser Graphics mock functions (`strokeCircle`), requiring defensive checks (`typeof g.strokeCircle === 'function'`).
- Web Speech API voice availability varies by OS/browser, requiring text-only fallback on unsupported platforms.
- Traditional Chinese glyph shape depends on fonts installed by the host browser; responsive layout uses system fallback fonts and keeps the minimum readable size at 16px.
- The local Playwright release gate is now isolated from deployment transport: the Task C source passes 87/87 local tests. Six preserved public-host probes (including the new source-identity smoke) run only through `test:e2e:live`; the current Pages index is reachable but `/build-info.json` returns 404, so deployed source identity and interaction evidence remain `ENVIRONMENT_BLOCKED` until a normal publication serves the new artifact.
- Release-hardening recovery confirmed that only Tasks A-C are reachable. The
  later D-H commit IDs recorded in earlier handoff text are absent from refs,
  reflogs and unreachable-object scans, so the missing work is being rebuilt.
  The required browser gate is Google Chrome at seven CSS viewport sizes;
  physical devices and other browser engines are OUT_OF_SCOPE by revised user
  acceptance and are not represented as passes.

## Important Decisions
- **Master Character Spec**: Standard 512x512 canvas, ground baseline Y=460, X=256 center, Chibi 1:2.5 ratio.
- **Layer Stacking**: Back Accessories (Angel Wings) strictly rendered at Depth 35 behind character body.
- **AI Control Plane**: `.ai/` and `AGENTS.md` govern all automated AI coordination.
