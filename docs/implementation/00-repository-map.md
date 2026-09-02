# Repository Architecture & Symbol Map
## 升夢大冒險 (P1 Adventure) — Phase 0

---

## 1. Application Architecture & Entry Points

| Path | Primary Role | Exported Symbols & Classes |
|---|---|---|
| `src/main.ts` | Game entry & Phaser Config | `P1AdventureGame`, `gameConfig`, `GAME_WIDTH` (1280), `GAME_HEIGHT` (720) |
| `src/config.ts` | Global Game Config & Registry | `GAME_WIDTH`, `GAME_HEIGHT`, `STATION_COUNT`, `StationId`, `normalizeStationId` |
| `src/types.ts` | Core Type Definitions | `PlayerProfile`, `QuizQuestion`, `EquippedWardrobe`, `StationProgress`, `PetCompanion` |
| `src/config/skins.ts` | Skin Definitions & Perks | `CHARACTER_SKINS`, `CharacterSkin`, `SkinPerk` |
| `src/config/outfits.ts` | Outfits & Wardrobe Registry | `OUTFIT_DEFINITIONS`, `OutfitDefinition`, `OutfitSlot`, `OutfitLayer`, `getWardrobePreloadPaths` |
| `src/config/wardrobe.ts` | Wardrobe Item Specs | `WARDROBE_ITEMS`, `WardrobeItem`, `WardrobeCategory` |

---

## 2. Scene Controllers (Lifecycle & Route Mapping)

| Scene | File Path | Route / Purpose | Key Methods & Lifecycles |
|---|---|---|---|
| **BootScene** | `src/scenes/BootScene.ts` | Engine bootstrap & asset init | `preload()`, `create()` -> transitions to `PreloadScene` |
| **PreloadScene** | `src/scenes/PreloadScene.ts` | Master asset preloader | `preload()`, `loadKenneyAssets()`, `loadCharacterMasterSprites()` |
| **TitleScene** | `src/scenes/TitleScene.ts` | Home screen & Adventure entrance | `create()`, `createMascotShowcase()`, `openLearningReportModal()` |
| **MapScene** | `src/scenes/MapScene.ts` | Station map & Mission selector | `create()`, `createStationNodes()`, `showMissionCard()`, `createReportButton()` |
| **QuestionScene** | `src/scenes/QuestionScene.ts` | Learning challenges & Feedback | `create()`, `handleAnswer()`, `handleHint()`, `showKnowledgeBanner()` |
| **RunnerScene** | `src/scenes/RunnerScene.ts` | Action platformer & collectibles | `create()`, `update()`, `applyRunnerPose()`, `onReachChest()`, `onSkip()` |
| **ResultScene** | `src/scenes/ResultScene.ts` | 3-Star settlement & Rewards | `init()`, `calculateStars()`, `getItemisedRewardBreakdown()`, `applySettlementProgress()` |
| **ShopScene** | `src/scenes/ShopScene.ts` | Collectible store & Fitting room | `create()`, `selectSkin()`, `selectWardrobeItem()`, `confirmPurchase()`, `equipSkin()` |
| **TrophyScene** | `src/scenes/TrophyScene.ts` | Achievements & Hall of Fame | `create()`, `createTrophyGrid()`, `claimReward()` |
| **SettingsScene** | `src/scenes/SettingsScene.ts` | Audio, Speed & Preferences | `create()`, `toggleSound()`, `toggleBGM()`, `toggleSpeed()` |

---

## 3. Services & State Management

| Service | File Path | Scope & Authority |
|---|---|---|
| **DataManager** | `src/services/DataManager.ts` | Single source of truth for player save, coins, gems, stars, inventory, transactions, and unlocks |
| **PlayerAvatarService** | `src/services/PlayerAvatarService.ts` | Resolves active skin, 512x512 Master Art Bible texture keys, and equipped wardrobe layers |
| **SoundManager** | `src/services/SoundManager.ts` | Synthesized audio, chime arpeggios, sound effects, and mute state |
| **SpeechService** | `src/services/SpeechService.ts` | Cantonese & English TTS speech synthesis for reading assistance |

---

## 4. UI Component Library (`src/ui/`)

| Component | File Path | Description & States |
|---|---|---|
| **CanvasButton** | `src/ui/CanvasButton.ts` | 3D beveled game buttons with procedural vector icons, sound, and hover/pressed states |
| **CanvasIcon** | `src/ui/CanvasIcon.ts` | Procedural vector icon generator (Shop, Rocket, Play, Pause, Wardrobe, Pet, Skip, etc.) |
| **CanvasCard** | `src/ui/CanvasCard.ts` | Quiz option cards, draggable word tokens, selection glow |
| **CanvasModal** | `src/ui/CanvasModal.ts` | Accessible modal dialogs with backdrop dim, focus containment, and safe dismiss |
| **DiagnosticReportModal**| `src/ui/DiagnosticReportModal.ts` | Comprehensive learning diagnostic report, accuracy analysis, and mistake review |
| **FeedbackPanel** | `src/ui/FeedbackPanel.ts` | Pedagogical feedback container with strategy hints and knowledge reinforcement |
| **CharacterOutfitCompositor** | `src/ui/CharacterOutfitCompositor.ts` | Layered clothing compositor, socket alignment, and depth stacking |
| **CharacterPreviewController** | `src/ui/CharacterPreviewController.ts` | Dynamic fitting room rig managing Stand/Run/Cheer preview states |
| **PlayerAvatarBadge** | `src/ui/PlayerAvatarBadge.ts` | Circular golden avatar badge showing player skin, outfit, and companion pet |
| **StarRating** | `src/ui/StarRating.ts` | Interactive animated 3-star rating component with fanfare sounds |
| **SlotBox** | `src/ui/SlotBox.ts` | Sentence scramble target slots with snapping and reordering mechanics |
| **CompanionPet** | `src/ui/CompanionPet.ts` | Animated pet companion entity following player during gameplay |
| **DesignTokens** | `src/ui/DesignTokens.ts` | Spacing, radius, elevation, semantic colours, and typography tokens |

---

## 5. Pedagogical & Question Engine (`src/engine/`)

| Engine | File Path | Responsibility |
|---|---|---|
| **QuestionEngine** | `src/engine/QuestionEngine.ts` | Subject question generation, distractor selection, hint levels 1–3 |
| **SentenceEngine** | `src/engine/SentenceEngine.ts` | CVC word construction, Chinese sentence unscrambling, token tokenization |
| **MathGenerator** | `src/engine/MathGenerator.ts` | Dynamic primary mathematics generation (addition, subtraction, comparison) |
| **PedagogyEngine** | `src/engine/PedagogyEngine.ts` | Curriculum progression, mistake tracking, and knowledge-tag aggregation |
| **CurriculumBank** | `src/engine/CurriculumBank.ts` | Hong Kong Primary 1 syllabus question bank for Chinese, English, and Math |

---

## 6. Build, Test & Deployment Setup

| Target | Configuration File | Command |
|---|---|---|
| **Vite Bundler** | `vite.config.ts` | `npm run build` (`tsc && vite build`) |
| **Unit Testing** | `vitest.config.ts` | `npm run test:unit` (`vitest run`) |
| **End-to-End Testing** | `playwright.config.ts` | `npm run test:e2e` (`playwright test`) |
| **Preview Server** | `package.json` | `npm run preview` (`vite preview`) |
| **GitHub Pages** | `.github/workflows/deploy.yml` | Output directory: `docs/` |
