# Dream Wardrobe Design

## Goal

把既有商店的夢幻衣櫥改成兒童向 mobile-game dressing room：玩家選商品時立即看到角色穿上它，商品預覽與穿戴資產分離，正式 Outfit 美術未到位時安全退回現有 base character 與 anchored compositor。

## Scope

- 保留 `ShopScene`、四個商店入口、DataManager profile/currency/inventory、RunnerScene 及現有 public test contract。
- 新增 Outfit metadata、render-mode resolver、preview controller 與 responsive wardrobe layout。
- 只重做 wardrobe tab 的商品瀏覽和大型 character preview；skins、pets、gadgets 保持現有行為。
- 不生成 Scholar Gown、Princess Dress、Dino Onesie、Magic Robe 的假 PNG。

## Visual Contract

- **THESIS:** 這是一個魔法鏡台，不是 icon catalog；孩子第一眼看到的是大型角色穿上當前選中的衣服。
- **OWN-WORLD:** 暗紫夜幕背景、皇室藍 mirror-stage、暖金描邊與按鈕、低對比衣櫥/衣架輪廓、柔和 spotlight 和圓形 pedestal。
- **STORY:** 選分類 → 點商品試穿 → 讀懂效果和價格 → 明確購買或穿戴；已選狀態由金框、glow、checkmark 同時表達。
- **FIRST VIEWPORT:** virtual canvas 依寬度分成約 40% 商品區與 60% preview 區；右側角色高度約佔 stage 60%，資料與大型購買按鈕固定在角色下方，所有位置由 canvas width/height 計算。
- **FORM:** Moonlit Mirror Stage，grounded direction candidate 3，seed `e5d862dd`；direction roll degraded，沒有 challengers/quality boards，產品 brief 為 pinned direction。
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md

## Architecture

### Outfit metadata

`src/config/outfits.ts` 定義 `OutfitLayer`、`OutfitSlot`、`CharacterAnchor`、`PreviewMode`、`AnchorOffset`、`OutfitDefinition`。四件第一批商品以既有 `scholar_robe` id 維持存檔相容，metadata 對外名稱為 Scholar Gown；registry 同時提供 `scholar_gown` alias。

Each definition has distinct `thumbnail`, `idle`, `run`, and `cheer` references. Current references point to future production asset locations and are deliberately absent from the shipped asset tree.

### Rendering

`OutfitRegistry` resolves definitions, aliases, slot mapping, asset keys and cache keys without mutating profile state.

`OutfitRenderer` chooses `fullSprite`, then `layered`, then `composite`, then base. It checks `scene.textures.exists()` before using a texture. The preview keeps one sprite and one set of graphics targets alive; selecting an outfit rerenders only the changed composite plan.

`CharacterOutfitCompositor.renderOutfit()` remains backward compatible for RunnerScene and existing coordinate tests. A new anchored preview path uses the base sprite's center/anchor profile, draws garment/back accessory/front accessory separately, and never draws Emoji layers over the character.

`CharacterPreviewController` owns the preview sprite, fallback graphics, pose switching, idle bob, try-on transition and sparkle burst. It accepts a temporary try-on wardrobe separately from `DataManager.getEquippedWardrobe()`.

### Data flow

Selecting a card creates a copy of the equipped wardrobe, applies the selected item's slot and exclusivity rules, and renders that copy only. It does not write localStorage. The action button is the explicit purchase/equip confirmation: it checks currency, buys once, persists ownership, equips the item, refreshes the cards, and shows a child-friendly Phaser success modal. Owned items only equip; current items show the current state.

### Responsive rules

`getWardrobeLayout(width, height)` derives panel bounds, card size, stage bounds and character scale. It supports 1920×1080, 1366×768, 1280×720, tablet landscape and mobile landscape without right-panel overflow. Compact landscape uses fewer card rows and smaller text while preserving 44px-equivalent hit targets.

## Missing assets

The code must ship with placeholder README files, not invented artwork. Each placeholder lists the four required production files and the style rules: same character, hairstyle, face, proportions, outline thickness, top-left lighting and soft cel shading. The art prompts live in `docs/outfit-art-prompts.md`.

## Verification

- Unit: resolver order, alias/metadata integrity, preview wardrobe exclusivity, responsive bounds, cache key stability, missing texture fallback.
- Regression: existing unit suite and TypeScript/Vite build.
- Browser: wardrobe at 1920×1080, 1366×768, 1280×720, iPad landscape and mobile landscape; rapid Scholar → Dino → Princess → Magic → Scholar selection; no page errors, overflow, missing texture or double purchase.
- Finish: capture desktop and mobile review screenshots, run Impeccable detector once over changed UI targets, record final design system in `DESIGN.md`.
