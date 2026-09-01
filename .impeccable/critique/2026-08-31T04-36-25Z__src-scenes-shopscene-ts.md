---
target: Whole-game graphic review / Dream Wardrobe and adventure loop
total_score: 24
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 5
timestamp: 2026-08-31T04-36-25Z
slug: src-scenes-shopscene-ts
---
# P1 Adventure — Whole-game graphic critique

Method: three-agent PM roundtable (Character/Outfit, World/Scene, UI/Motion) with PM browser evidence. The dedicated detector/browser subtask was interrupted; detector was rerun in parent as a fallback.

## Design Health Score

| Heuristic | Score | Finding |
|---|---:|---|
| Visibility of system status | 3/4 | Strong progress and selected states, but HUD semantics vary by scene. |
| Match to real world | 3/4 | Reward/shop language is child-friendly; world art is generic rather than journey-specific. |
| User control and freedom | 3/4 | Try-on and purchase are separated; some compact controls are visually too small. |
| Consistency and standards | 2/4 | Kenney fallback, full-body chibi art, thumbnails, and depth rules do not fully agree. |
| Error prevention | 2/4 | Star Hoodie is purchasable while its wearing assets are missing. |
| Recognition rather than recall | 3/4 | Large cards and icons help, but compact bilingual text is too dense. |
| Flexibility and efficiency | 2/4 | Categories and poses exist; compact layouts spend too much space on rails and repeated copy. |
| Aesthetic and minimalist design | 2/4 | Palette is memorable, but scenes rely on generic geometry, emoji effects, and dense status bars. |
| Error recovery | 2/4 | Fallback avoids crashes but can silently show an unchanged character. |
| Help and documentation | 2/4 | Hints exist, but important item meaning and status cues are inconsistent. |
| **Total** | **24/40** | **Acceptable foundation; major production polish required.** |

## Design Specificity

The dark-purple, royal-blue, warm-gold identity and learning-to-adventure loop are product-specific foundations. The weakest authored layer is the world art: map terrain, runner scenery, and reward particles can be swapped into another casual game with little change. The strongest layer is the dedicated 512px wardrobe sprite direction, but it is not yet a complete contract because four outfit pose files are byte-identical and Star Hoodie has only a README placeholder.

## Strengths

- Desktop Wardrobe has a clear browse → preview → action composition and a convincing dedicated Princess Dress preview.
- QuestionScene answer cards are large, high-contrast, and easier to scan than the surrounding UI.
- The code already has the right rendering seams: OutfitRenderer, CharacterPreviewController, CharacterOutfitCompositor fallback, depth layers, and independent catalog thumbnails.

## Priority issues

1. [P0] Purchasable outfit without truthful wearing art. `src/config/outfits.ts` points Star Hoodie to missing thumbnail/wearing/run/cheer files; browser preview returns to the unchanged base character. Hide/label unavailable or deliver the four transparent full-body assets. Acceptance: no visible purchasable item lacks an existing wearing idle and matching thumbnail.
2. [P1] Outfit continuity breaks outside the happy full-sprite idle path. Runner directly assigns base-skin jump/walk/cheer textures; Scholar, Princess, Dino, and Magic idle/run/cheer hashes are identical. Route every pose through one outfit-aware resolver and deliver distinct pose art. Acceptance: no base-skin assignment while a full outfit is active; each outfit has visibly distinct run/cheer with stable baseline.
3. [P1] Registration/depth contract is contradictory. Backpack is described as front art in `docs/character-art-spec.md` but routed through the depth-35 back pass; accessory passes can redraw content. Reconcile one authoritative layer contract and render each accessory once. Acceptance: Shop/Runner/Badge/OOTD screenshot matrix has no duplicate, floating, or hidden accessory and baseline stays within tolerance.
4. [P1] Compact landscape is technically fitted but visually undersized. The 844×390 evidence leaves a 693×390 effective game surface; item details, filters, and pose labels become tiny. Recompose only compact Shop/OOTD surfaces, preserving the current desktop layout. Acceptance: no visible compact text below 14px, primary labels at least 16px, visible tap targets at least 44px.
5. [P1] Result celebration has an unbounded visual loop. `ResultScene.ts:183-215` creates 22 emoji tweens with `repeat: -1`; success should finish, not keep competing with the result. Use finite, capped particles. Acceptance: no infinite celebration tween; burst ends within 6 seconds and clears on scene shutdown.
6. [P1] Compact wardrobe copy hierarchy is too dense. `ShopScene.ts:742-769` uses 13px Chinese, 9px English, and 10px status text; preview details repeat five fields. Make Chinese name, one benefit, cost, and CTA dominant; subordinate or hide English in compact mode.
7. [P2] Gameplay contrast and hazard readability vary by scene. Map and Runner use saturated generic terrain while objectives/collectibles are small. Desaturate scenery and reserve gold/white contrast for objectives, hazards, and next actions.
8. [P2] Persistent HUD semantics vary. Title, Map, Shop, and Runner use different ordering and label density for coins, gems, stars, streak, and progress. Define one resource order and keep contextual data secondary.
9. [P2] Station identity does not travel through the loop. Ten biome/name/icon definitions exist, but generic map/runner treatments underuse them. Reuse each station's existing cue in at least three of Map, Question, Runner, Result; defer wholesale landmark artwork.
10. [P2] Selected/owned/equipped/locked states need one visual grammar. Existing labels and checks are good in Wardrobe, but skins/pets/gadgets lean on fill color. Add stable icon + label + outline/ribbon without rebuilding Canvas primitives.

## Conditional / deferred issues

The selected-skin identity issue is real only if the product promises mix-and-match identity. The current art spec says “same child, new clothes,” so keep it as a P2 product decision, not an automatic art commission. Broad transition framework, secondary copy cleanup, and new station artwork wait until P0/P1 continuity and compact readability are stable.

## Evidence

- Browser captures: desktop Wardrobe, mobile Wardrobe, Star Hoodie, Map, Question, Runner, and Result were inspected.
- `npm run build` passed; Vite reported a 1.85 MB minified JS chunk (431 KB gzip), worth a later loading/performance pass.
- Detector fallback on `docs/index.html` found one warning at line 113: bounce/elastic cubic-bezier. The HTML parser modules were unavailable, so this is an undercount, not a clean bill of health.
