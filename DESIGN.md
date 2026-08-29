# Dream Wardrobe UI Design System

## Direction

Dream Wardrobe is a Moonlit Mirror Stage: a calm fantasy fitting room where the child can compare an outfit, understand its effect, and choose whether to buy it. The product stays cute and primary-school friendly rather than becoming an adult RPG inventory.

## Tokens

- Night background: `#140e1b` → `#231a2e`
- Royal-blue stage: `#1d2c64`
- Warm gold focus: `#f5bd42` / `#ffd45b`
- Child-readable body text: `#ffffff` / `#c8d5ff`
- Minimum important control height: 44 virtual px on compact layouts; 64 virtual px for the primary action on desktop.
- Preview depth: stage `40`, base character `40`, composite garment `45`, accessory compatibility layers `35–49`, controls `60+`.

## Composition

`getWardrobeLayout(width, height)` owns the responsive split: roughly 40% item browsing and 60% dressing-room preview. The stage reserves the character 55–70% of its height, then places item details and the primary action below it. Compact landscape uses two card columns; larger screens use a readable single card column.

## Rendering

`CharacterPreviewController` owns pose, try-on, idle motion and the single visual rig. `OutfitRenderer` resolves full wearing art first, then layered art, then the fitted `CharacterOutfitCompositor`, then the untouched base character. `CharacterOutfitCompositor.renderOutfit` remains the Runner-compatible legacy path; `renderPreviewOutfit` is the preview-specific fit path and uses the base character neck anchor rather than repainting the old Runner coordinates.

The shop card illustration is catalog-only. If a production thumbnail is loaded, it is rendered as a card image; it is never passed to the wearing renderer. Missing production art deliberately stays a fallback/TODO state.

## Motion

- Idle: synchronized sprite/composite bob of 2 virtual px over 2100 ms, Sine ease.
- Try-on: immediate state change with a restrained 0.96 → 1.04 → 1.00 container pop over 300 ms total.
- Cheer: 250 ms bounce repeated twice, then returns to idle through the tween completion.
- Buttons: 1.02 hover and 0.97 press scale; no flashing or screen shake.

## Interaction state

Selecting a card only updates `previewWardrobeState`. Currency and inventory remain untouched until the primary action is pressed. Buying reuses `DataManager.buyWardrobeItem`, equips the mapped slot, refreshes the HUD, and shows a `CanvasModal` success confirmation. Owned items equip; equipped items unequip.

## Asset handoff

The canonical TypeScript metadata is `src/config/outfits.ts`; art handoff prompts and file contracts are in `docs/outfit-art-prompts.md`. The current `public/assets/generated/outfits/*/README.md` files are placeholders, not fake art. Add actual `idle`, `run`, `cheer`, and `thumbnail` assets before treating the four dedicated full-body looks as production-final.
