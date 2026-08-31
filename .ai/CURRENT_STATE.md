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
  - `RunnerScene`: Platformer with jump/double-jump, springboard squash, dynamic contact shadow, obstacle rocks, treasure chest fountain burst, companion pets, and outfit-aware idle/run/jump/cheer pose routing.
  - `ShopScene`: Dream Wardrobe, skin purchasing, live character preview controller, spotlight pedestal, OOTD Polaroid with washi tape.
- **Character & Wardrobe System**:
  - 5 Playable Character Skins (Adventurer, Heroine, Soldier, Knight, Ninja) with distinct stat perks.
  - 5 Major Production Full-Sprite Outfits (`school_uniform`, `scholar_gown`, `princess_dress`, `dino_onesie`, `magic_robe`) at 512x512 with ground baseline Y=460.
  - 18 Modular Clothing Items with dress vs top/bottom mutual exclusivity.
  - `OutfitRenderer` & `CharacterOutfitCompositor` with depth layering (`BACK_ACCESSORY` at Depth 35).
  - `PlayerAvatarService` and `RunnerScene.applyRunnerPose()` keep dedicated full-sprite outfits visible across Runner poses; missing outfit poses fall back to run/idle/base art, while placeholder garments are omitted from the Runner compositor.
  - Star Hoodie is explicitly marked as placeholder artwork: its missing thumbnail/wearing assets are skipped by preload, and preview falls back safely without using a thumbnail or drawing a rectangular garment.
- **Audio & Speech**:
  - `SoundManager`: Procedural synthesized Web Audio sound effects (coin arpeggio, springboard bounce, chest chime).
  - `SpeechService`: Multi-lingual Web Speech API synthesis (`zh-HK`, `zh-TW`, `en-US`).
- **Data & Economy**:
  - `DataManager`: Single source of truth for profile, currency (coins, gems, stars), inventory, equipped wardrobe, and LocalStorage (`p1_adventure_save_v1`).

## Current Development Direction
- Multi-device responsive UX polish (iPhone 16 Pro Max, iPhone SE, iPad).
- Speech synthesis fallback resilience across mobile WebKit browsers.
- Curriculum expansion for World 2 (Kowloon) and World 3 (New Territories).

## Deployment State
- The public GitHub Pages site currently consumes the tracked `main/docs` artifact through the managed `pages build and deployment` workflow.
- The custom deploy workflow also publishes `dist` to `gh-pages`; future source changes must update `main` or the repository Pages source should be switched to `gh-pages`.
- `origin/main` is currently fast-forwarded to the verified implementation commit `ef320675`.
- The live bundle is `assets/index-DqhY_5sP.js` with build timestamp `202608311450`.

## Completed Major Features
- Complete Grade 1 Chinese, English, and Math interactive question mechanics.
- Production-grade character sprite asset pipeline (512x512 transparent PNGs, 1:2.5 Chibi proportion).
- Full runner platforming physics, dynamic contact shadow, and chest celebration.
- OOTD Polaroid photo modal and live outfit previewing across Stand, Run, Cheer poses.
- 43 test suites and 1,158 unit tests 100% passing.

## Known Issues
- Vitest JSDOM environment lacks some Phaser Graphics mock functions (`strokeCircle`), requiring defensive checks (`typeof g.strokeCircle === 'function'`).
- Web Speech API voice availability varies by OS/browser, requiring text-only fallback on unsupported platforms.
- Formal Star Hoodie artwork is still required before it can be purchased: `public/assets/outfits/star_hoodie/star_hoodie_thumbnail.png`, `public/assets/character/outfits/star_hoodie/star_hoodie_wearing.png`, `star_hoodie_run.png`, and `star_hoodie_cheer.png`.
- Runner reuses a dedicated outfit's run or idle art for jump/celebration when a distinct pose asset is unavailable; distinct pose artwork remains a future art-quality improvement.
- The base Kenney character preview source remains low resolution and can look pixelated at the enlarged Dressing Room scale; a high-resolution base preview asset is still needed for final visual polish.

## Important Decisions
- **Master Character Spec**: Standard 512x512 canvas, ground baseline Y=460, X=256 center, Chibi 1:2.5 ratio.
- **Layer Stacking**: Back Accessories (Angel Wings) strictly rendered at Depth 35 behind character body.
- **AI Control Plane**: `.ai/` and `AGENTS.md` govern all automated AI coordination.
