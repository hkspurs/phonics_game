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
- `QuestionScene`: Chinese sentence scrambler, English CVC phonics, dynamic Math questions, blackboard frame, reduced-motion-safe celebration. Celebration particles and banner are now tracked and cleaned on re-entry/shutdown.
  - `RunnerScene`: Platformer with jump/double-jump, springboard squash, dynamic contact shadow, obstacle rocks, treasure chest fountain burst, companion pets, and outfit-aware idle/run/jump/cheer pose routing.
  - `ShopScene`: Dream Wardrobe, skin purchasing, live character preview controller, spotlight pedestal, OOTD Polaroid with washi tape. Live dedicated-outfit purchase gating verifies registered thumbnail and idle wearing textures before offering purchase; placeholder art remains unavailable. Authored full-body previews bypass selectable skin tint while modular/base fallbacks retain it, and dedicated art is restricted to its declared character IDs.
  - Catalogue thumbnails use the canonical `public/assets/outfits/{id}/` paths;
    full-body wearing sources remain isolated under
    `public/assets/character/outfits/{id}/`.
  - Outfit preload treats `thumbnailStatus` independently from
    `artworkStatus`, so a future catalogue thumbnail may ship before wearing
    art without requesting or promoting missing character assets; placeholder
    thumbnails must be explicitly marked ready before preload requests them.
  - `OutfitRegistry` also hides full-sprite and layered wearing candidates for
    placeholder definitions from direct path/key callers, and rejects a
    catalogue thumbnail reused by any layered entry.
- **Character & Wardrobe System**:
  - 5 Playable Character Skins (Adventurer, Heroine, Soldier, Knight, Ninja) with distinct stat perks.
  - 5 Major Production Full-Sprite Outfits (`school_uniform`, `scholar_gown`, `princess_dress`, `dino_onesie`, `magic_robe`) at 512x512 with ground baseline Y=460.
  - 18 Modular Clothing Items with dress vs top/bottom mutual exclusivity.
- `OutfitRenderer` & `CharacterOutfitCompositor` with depth layering (`BACK_ACCESSORY` at Depth 35); pose metadata prevents duplicate motion files from being treated as authored animation.
- Delivered 512px full-body outfit art currently declares `adventurer` compatibility only; Heroine and other skins keep their own base character and use the shared layered/compositor fallback until matching per-skin wearing art is delivered.
- Dedicated full-body outfit art is selected only for a single active `dress`, `top`, or `bottom`; when a player combines body slots (for example a full-body school top plus shorts), the renderer and OOTD safely use the existing composite path so the selected secondary garment is not hidden.
- `OutfitRenderer` layered parts now use the shared 512px master-art local
  scale and linear filtering, keeping future layered outfit pieces aligned
  with dedicated full-sprite previews.
- Full-sprite rectangular scholar-cap and tram-visor accessory bounds now
  normalize their transformed edges, keeping hats centered when the Runner
  flips direction.
- `PlayerAvatarService` and `RunnerScene.applyRunnerPose()` keep dedicated full-sprite outfits visible across Runner poses; optional jump art is checked before run/idle/base fallback, duplicate run/cheer files use the idle sprite safely, and placeholder garments are omitted from the Runner compositor.
- `PlayerAvatarService` now resolves the configured base-skin jump texture when
  dedicated outfit art is unavailable, keeping the shared fallback contract
  from silently returning idle art.
- Full-sprite Runner rendering keeps one constant +36px visual ground offset
  across grounded and airborne physics frames, preserving the authored Y=460
  foot baseline without changing Runner physics or collision coordinates.
- `OutfitRenderer` now gives full-sprite/layered previews one back-accessory pass and one front-accessory pass; composite fallback, Runner, and OOTD use a dedicated rear pass when available and keep garments/front accessories in the foreground pass. Runner/OOTD use the equivalent 14/15/16 depth stack. The same renderer is reused by the Title mascot and compact avatar badge.
- `OutfitRenderer` revalidates a cached target against asset readiness, base texture, and scale, allowing late-loaded full/layered art to recover from the same fallback target without recreating render objects.
- `OutfitRegistry.isWearingTextureReady()` now separates runtime wearing-source readiness from the thumbnail-inclusive purchase gate; Runner and OOTD use the live texture check before invoking the legacy compositor.
- `CharacterPreviewController` now keeps one stable render target per preview, so unchanged refreshes reuse `OutfitRenderer`'s cache instead of retaining a new target object for every render.
- Live Wardrobe confirmation now blocks duplicate taps while its delayed
  purchase callback is pending; the existing Currency, Inventory, and equip
  accounting path is unchanged.
- Responsive Shop rebuilds now preserve the selected skin and active wardrobe
  try-on state across compact breakpoint restarts; persisted equipment remains
  unchanged until an explicit purchase/equip action.
- Switching from the Wardrobe tab to the skin catalogue, or selecting an empty
  `owned` filter, preserves the active temporary try-on in the live character
  preview, keeping the character and wardrobe indicators on the same preview
  state.
- Responsive Wardrobe restarts are suppressed while the existing delayed
  purchase callback is pending, so a breakpoint resize cannot cancel a
  confirmed purchase before it completes.
- Wardrobe Home and Map navigation are also suppressed during that same pending
  purchase callback, so leaving the shop cannot cancel an already-confirmed
  purchase before it completes.
- Compact Wardrobe pager navigation is suppressed during that same pending
  purchase callback, so a confirmed item stays on its current catalogue page
  until the existing purchase/equip path completes.
- OOTD Photo Booth opening is suppressed during that same pending purchase
  callback, so purchase-success feedback cannot overlap a newly opened OOTD
  modal or lose the confirmed-purchase context.
- OOTD Photo Booth's existing close button is mounted inside the modal at
  modal-relative `(0,205)` coordinates and is destroyed with the modal; the
  live inspector verifies the button is present and can close the photo.
- During the existing delayed live Wardrobe purchase callback, the action
  button now shows disabled `⏳ 購買中…` feedback and is restored through the
  normal success or failure state path; no economy state is changed.
- Runner jump/keyboard input now stays inert while the chest reward card is
  readable, leaving `下一題` as the explicit handoff and `skipRunner()` as the
  intentional fast-forward path; the reward and transition accounting are
  unchanged.
- ResultScene celebration confetti is a capped one-shot burst (`repeat: 0`),
  removes each particle on completion, and clears active particles on scene
  shutdown; no infinite result-loop remains.
- The live Wardrobe visual check now covers a laptop/compact/laptop breakpoint
  round trip and verifies the Scholar full-sprite try-on remains visible and
  bounded after scene rebuild.
- A live dedicated-outfit persistence regression now verifies Scholar wearing
  art stays on the same full-sprite source through Shop, Runner, Question
  avatar, and page reload; the focused Wardrobe visual suite is now 10/10.
- Saved placeholder outfits now remain visibly unavailable in Wardrobe: the
  action button is disabled as `🎨 美術準備中`, with no equipped checkmark or
  unequip path. The default Adventurer fallback pose keys are aligned across
  Title, Map, Question, Shop, and Runner, preventing a missing-art preview
  from changing character identity between scenes.
- A regression now checks idle/run/jump/cheer base texture parity for all five
  registered skins across Avatar service, Runner, and Shop mappings.
- The Wardrobe clearance matrix also measures visible dedicated-character
  height against the Preview Area: the logical 1280×720, supplied 1662×920
  recording size, desktop, laptop, iPad landscape, and mobile landscape
  buckets all meet the 55% minimum while staying inside the stage.
- The full Playwright suite is green at 87/87 in the latest 8.2-minute run
  under the approved local preview server, covering responsive, purchase,
  scene-flow, stress, and Wardrobe visual checks, including the saved
  placeholder cross-scene fallback gate. The earlier sandbox-only server
  failure was `listen EPERM` on `127.0.0.1:4173`, before any test ran.
- Compact Wardrobe primary controls now use a 16px logical label minimum for
  tabs, filters/categories, pose controls, and OOTD; the existing responsive
  layout and purchase flow remain unchanged.
- Map's resource HUD now follows the shared coin → gem → star order used by
  Title, Shop, and Runner; the progress label remains contextual and all
  resource values are unchanged.
- The deep interactive browser flow also asserts that rendered Map header
  order and remains green with zero page errors.
- The deep interactive browser flow also checks the Runner chest reward card
  and `下一題` button at 844×390 mobile landscape; both remain inside the
  Scale.FIT canvas during the existing calm handoff delay.
- The same live flow now verifies both explicit `下一題` continuation and the
  existing 1600ms automatic transition into QuestionScene.
- Full-sprite pose fallback now checks the actually loaded requested pose asset,
  so missing authored run/cheer files correctly keep the idle wearing sprite
  and its restrained fallback motion.
- `CharacterPreviewController` now cancels an active cheer tween when Stand or Run is selected and ignores stale cheer completion, so rapid pose changes cannot reset the player's chosen pose.
- Refreshing the preview character now also invalidates any in-flight Cheer
  completion, preventing a skin/outfit refresh from letting an old callback
  override the newly selected Cheer pose.
- Refreshing the preview character during an idle-based run fallback now stops
  the stale run tween and resumes idle motion, so a new skin cannot inherit
  the old character's movement state.
- Preview idle-motion restarts now call Phaser's `isPaused()` method correctly,
  so a live idle tween is not accidentally paused after a fitted stage offset
  changes.
- Direct Stand/Run pose changes now cancel and invalidate an active try-on pop,
  so a late completion cannot resume idle motion after the selected pose.
- OOTD full-sprite previews now use the same effective accessory rig scale as
  `OutfitRenderer`, keeping rear/front modular accessories aligned with the
  512px wearing sprite.
- Full-sprite previews now map modular rear/front accessories in the canonical
  512px wearing-art coordinate space, and category/item changes preserve the
  active multi-slot try-on instead of resetting to persisted equipment.
- Runner now passes that same full-sprite coordinate space during dedicated
  outfit initialization and movement/cheer syncing; composite fallback keeps
  the existing base-coordinate path. Dedicated 512px wearing art is mapped
  from its shared Y=460 foot baseline to the visual render center, so the
  character sits on the Runner grass line without changing physics coordinates.
- Selected skin, pet, and gadget previews now expose an explicit `👀 預覽中`
  marker in addition to the existing selected color treatment, so preview state
  is not communicated by color alone.
- `QuestionScene` now gives the equipped avatar badge a bounded 88 logical px
  size, with a motion-safe top anchor that keeps the existing idle float from
  clipping the ring; `PlayerAvatarBadge` reads the actual dedicated sprite
  source width so 512px wearing art remains crisp and contained in compact HUD
  badges. Desktop and mobile-landscape browser checks verify the badge remains
  inside the Scale.FIT canvas.
- `PlayerAvatarBadge` now applies its avatar vertical offset to the back and
  front outfit graphics as well as the avatar sprite, keeping compact
  cross-scene accessory passes aligned.
- Wardrobe catalog thumbnails are now capped to card-safe display sizes (54–72 virtual px), so large source thumbnails cannot overflow or dominate the item list.
- Compact Wardrobe category catalogues now show at most three cards per page and reuse the existing pager, keeping accessory browsing readable without changing the desktop layout.
- Low-resolution fallback preview motion now keeps idle/cheer offsets relative to the fitted stage baseline, preventing a capped base sprite from jumping off the pedestal.
- Live Wardrobe verification now samples each registered production wearing
  texture: Princess, Scholar, Dino, and Magic use separate 512px-class
  transparent full-body sources rather than catalog thumbnails; Star Hoodie
  remains an explicit non-purchasable placeholder.
- Both Wardrobe and cross-scene avatar resolvers reject a catalog thumbnail if
  future metadata accidentally reuses that path as a wearing asset.
- Wardrobe top tabs now share the preview panel's browser-aware compact
  breakpoint, including short landscape viewports such as 1280×590; the
  1280×590 tab boundary is covered by unit and browser regression checks.
- The sentence-scramble browser audit now allows the intentional wrong-answer
  wobble (up to 8 virtual px) while still requiring every card to remain
  attached to its slot vertically. The previously flaky case passes 5/5
  repeated runs.
- Reduced-motion Wardrobe selection keeps the yellow selected state but skips
  the non-essential 140ms card scale tween; the behavior is covered by unit
  regression and the live reduced-motion Wardrobe audit.
- Reduced-motion purchase success keeps its text/action but omits sparkle
  particles; the outfit-sync toast stays static and still cleans up after its
  normal hold.
- Historical checkpoint: bundle `assets/index-DhIFOIYo.js` passed all 43 unit suites
  (1,305/1,305), the Wardrobe visual checkpoint (5/5), and the fresh combined
  local browser pass (8/8), and
  the focused Wardrobe + cross-scene browser smoke (7/7), and
  the latest targeted deep interactive/full-playthrough browser flow (4/4)
  with zero page errors, plus the full deep interactive E2E (3/3) and the
  latest complete Playwright matrix (81/81 in 7.7 minutes); it was later
  superseded by the deployed `TASK-20260831-014` checkpoint below.
- The Wardrobe browser audit also covers the real `prefers-reduced-motion:
  reduce` media preference: try-on and cheer keep the full-sprite preview
  visible, suppress optional loops, and remain inside the mobile-landscape
  canvas.
- The Wardrobe browser audit now measures the visible alpha bounds of the
  Scholar wearing sprite (rather than its transparent source canvas) across
  desktop, laptop, iPad landscape, and mobile landscape; the character stays
  inside the stage and the pose/action controls stay inside the preview panel.
- The live Wardrobe audit also removes a loaded Scholar wearing texture to
  exercise the real missing-art path; the preview falls back to the composite
  renderer without selecting the catalog thumbnail and remains canvas-safe.
- The live purchase flow now covers two rapid confirmation taps: one Scholar
  purchase produces one ownership/equip result, one success modal, and one
  currency deduction; the duplicate tap is ignored while the existing delayed
  purchase callback is pending.
- The live Runner flow now re-enters `onReachChest()` immediately to verify the
  chest summary is idempotent: session/profile values increase by exactly +5
  coins and +1 gem, with one readable reward card and one `下一題` handoff.
- Historical checkpoint: bundle `assets/index-sM5N5zs0.js` passed the targeted
  Wardrobe visual and deep shop-to-Runner Playwright smoke (`2/2`).
- Wardrobe now rebuilds its scene-owned responsive catalog at the compact breakpoint while carrying tab/filter/selection/pose and active try-on state across Scale.FIT resizes; dense catalog cards remain readable on desktop and mobile landscape.
- Runner, Question, and Result normalize legacy string station IDs before
  selecting themes or labels, so Map station names/icons remain consistent
  through the learning-to-adventure loop.
- Runner's top-left resource badge now shows coins, gems, and stars in the
  same primary order used by the other resource HUDs; the center progress
  track remains separate.
- Star Hoodie is explicitly marked as placeholder artwork: its missing thumbnail/wearing assets are skipped by preload, and preview falls back safely without using a thumbnail or drawing a rectangular garment.
- The remaining legacy compositor branch that could draw an orange Star Hoodie
  rectangle has been removed; direct compositor callers now also leave the
  placeholder as the base character until formal wearing art exists.
- Wardrobe and Runner now expose truthful try-on/equipped states, a bounded chest reward card with an explicit next-question handoff, responsive full-sprite scale bounds, and reduced-motion guards for non-essential loops. Title, Map, Question, Shop, avatar badges, and companion pets now honor the same preference.
- Phaser Scale.FIT now coalesces browser resize events before refreshing, so desktop → tablet/mobile-landscape resizing does not leave the canvas one viewport behind.
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
- `origin/main` and `origin/master` point to deployed commit `f84a2f5b`.
- The live bundle is `assets/index-UtBMJzhy.js` with build timestamp
  `202609011528`, verified at `https://hkspurs.github.io/phonics_game/`.
- TASK-20260831-014 is deployed and remains `IN_PROGRESS` only for formal
  artwork, high-resolution/per-skin art, distinct motion art, and real-device
  evidence.

## Completed Major Features
- Complete Grade 1 Chinese, English, and Math interactive question mechanics.
- Production-grade character sprite asset pipeline (512x512 transparent PNGs, 1:2.5 Chibi proportion).
- Full runner platforming physics, dynamic contact shadow, and chest celebration.
- OOTD Polaroid photo modal and live outfit previewing across Stand, Run, Cheer poses.
- 43 test suites and 1,321 unit tests 100% passing.

## Known Issues
- Vitest JSDOM environment lacks some Phaser Graphics mock functions (`strokeCircle`), requiring defensive checks (`typeof g.strokeCircle === 'function'`).
- Web Speech API voice availability varies by OS/browser, requiring text-only fallback on unsupported platforms.
- Formal Star Hoodie artwork is still required before it can be purchased: `public/assets/outfits/star_hoodie/star_hoodie_thumbnail.png`, `public/assets/character/outfits/star_hoodie/star_hoodie_wearing.png`, `star_hoodie_run.png`, and `star_hoodie_cheer.png`.
- Runner supports an optional dedicated jump asset, but the current Dino, Scholar, Princess, and Magic run/cheer files are byte-identical to idle and are now explicitly treated as idle-tween fallback art; distinct authored motion remains an art dependency.
- A partial layered outfit is treated as a failed layered render and falls back
  cleanly after hiding all mounted layers; duplicate idle-based full-sprite run
  poses use a small controller tween instead of replacing the authored idle art.
- The base Kenney character preview source is 80x110 and can look pixelated at the enlarged Dressing Room scale: Adventurer uses `public/assets/kenney/platformer-characters/PNG/Player/Poses/{player_stand,player_walk1,player_cheer1}.png` and Heroine uses the corresponding `Female/Poses/female_*` files. A new registered high-resolution base set is still required for final visual polish.
- Existing dedicated outfit art is not a universal skin replacement: the current Scholar, Princess, Dino, Magic, and School Uniform wearing sets are authored for Adventurer; per-skin full-body variants are still required before those assets can represent Heroine, Soldier, Knight, or Ninja.
- `PlayerAvatarBadge`, `CompanionPet`, Title, Map, Question, and Shop now receive explicit reduced-motion state where scene-level control is available; the deployed Pages bundle now includes the current TASK-20260831-014 checkpoint.

## Important Decisions
- **Master Character Spec**: Standard 512x512 canvas, ground baseline Y=460, X=256 center, Chibi 1:2.5 ratio.
- **Layer Stacking**: Back Accessories (Angel Wings) strictly rendered at Depth 35 behind character body.
- **AI Control Plane**: `.ai/` and `AGENTS.md` govern all automated AI coordination.
