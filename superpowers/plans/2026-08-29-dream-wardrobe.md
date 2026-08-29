# Dream Wardrobe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a responsive Dream Wardrobe shop whose character preview uses full Outfit sprites when available, layered assets when available, and the improved compositor as a safe fallback.

**Architecture:** Keep `ShopScene` and `DataManager` as compatibility boundaries, extracting outfit metadata/resolution, rendering, preview animation, and responsive geometry into focused modules. The wardrobe tab owns a temporary try-on wardrobe; persistence occurs only from the action button.

**Tech Stack:** TypeScript 5, Phaser 3.87, Vite, Vitest, Playwright, existing Web Audio/Web Speech services.

**Spec:** `docs/superpowers/specs/2026-08-29-dream-wardrobe-design.md`

## Global Constraints

- Preserve `ShopScene`, the four shop entries, DataManager profile/currency/inventory, RunnerScene, and existing public test contracts.
- Use `fullSprite → layered → CharacterOutfitCompositor → base character` and check texture existence before use.
- Do not generate Scholar Gown, Princess Dress, Dino Onesie, or Magic Robe PNGs.
- Selecting a card only changes temporary try-on state; purchase/equip writes profile state.
- Use approximately 40% item area and 60% preview area; derive bounds from canvas width/height.
- Keep important touch targets at least 44×44 CSS px equivalent and do not rely on color alone for selection.
- Verify 1920×1080, 1366×768, 1280×720, tablet landscape, and mobile landscape.

---

### Task 1: Lock the product and visual contract

**Files:**
- Create: `PRODUCT.md`
- Create: `docs/superpowers/specs/2026-08-29-dream-wardrobe-design.md`
- Create: `docs/superpowers/plans/2026-08-29-dream-wardrobe.md`
- Modify: `index.html:body first child`

**Interfaces:**
- Produces the persisted product facts and the Moonlit Mirror Stage contract used by the implementation.

- [x] **Step 1: Capture confirmed product facts**

Write `PRODUCT.md` with web platform, Hong Kong P1 learner audience, learning-through-adventure purpose, existing assets, Phaser constraints, and child-friendly accessibility requirements.

- [x] **Step 2: Record the design contract**

Write the spec with the exact fallback order, state flow, responsive rules, missing-asset policy, and verification matrix.

- [ ] **Step 3: Add the emitted markup contract**

Put this as the first child of `<body>` in `index.html`:

```html
<!--
THESIS: Dream Wardrobe is a magical mirror stage, not an icon catalog.
OWN-WORLD: dark purple night, royal-blue stage, warm-gold rails and soft spotlight.
STORY: choose a category, try the outfit on, understand its effect and price, then buy or wear it.
FIRST VIEWPORT: 40% item rail on the left; 60% stage on the right with a 60%-height character and purchase panel below.
FORM: Moonlit Mirror Stage, grounded direction candidate 3, seed e5d862dd; degraded roll, product brief pinned.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
```

- [ ] **Step 4: Verify the contract is present**

Run: `rg -n "THESIS: Dream Wardrobe|FINISH: unreviewed" index.html`

Expected: both contract lines are found before implementation begins.

- [ ] **Step 5: Commit the design artifacts**

```bash
git add PRODUCT.md docs/superpowers/specs/2026-08-29-dream-wardrobe-design.md docs/superpowers/plans/2026-08-29-dream-wardrobe.md index.html
git commit -m "docs: define dream wardrobe design contract"
```

### Task 2: Add metadata, resolution, and responsive geometry

**Files:**
- Create: `src/config/outfits.ts`
- Create: `src/ui/OutfitRegistry.ts`
- Create: `src/ui/wardrobeLayout.ts`
- Test: `src/test/wardrobe-preview-system.test.ts`

**Interfaces:**
- `OutfitRegistry.get(id: string): OutfitDefinition | undefined`
- `OutfitRegistry.resolveId(id: string): string`
- `OutfitRegistry.getAssetKey(id: string, pose: PreviewPose): string`
- `OutfitRegistry.resolveMode(id: string, pose: PreviewPose, hasTexture: (key: string) => boolean): PreviewMode | 'base'`
- `OutfitRegistry.getCacheKey(characterId: string, wardrobe: EquippedWardrobe, pose: PreviewPose): string`
- `getWardrobeSlot(item: WardrobeItem): keyof EquippedWardrobe`
- `getWardrobeLayout(width: number, height: number): WardrobeLayout`

- [ ] **Step 1: Write the failing tests**

```ts
it('resolves full sprite before layered, composite, and base fallback', () => {
  const registry = new OutfitRegistry([SCHOLAR_GOWN]);
  expect(registry.resolveMode('scholar_gown', 'idle', key => key.endsWith(':idle'))).toBe('fullSprite');
  expect(registry.resolveMode('scholar_gown', 'idle', key => key.includes(':layer:'))).toBe('layered');
  expect(registry.resolveMode('scholar_gown', 'idle', () => true)).toBe('fullSprite');
  expect(registry.resolveMode('scholar_gown', 'idle', () => false)).toBe('composite');
  expect(registry.resolveMode('unknown', 'idle', () => false)).toBe('base');
});

it('creates a stable cache key from character, outfit state, and pose', () => {
  const key = wardrobeRegistry.getCacheKey('boy01', { dress: 'scholar_robe' }, 'idle');
  expect(key).toBe('character:boy01:scholar_robe:idle');
});

it('keeps preview bounds inside the canvas on compact landscape', () => {
  const layout = getWardrobeLayout(932, 430);
  expect(layout.preview.x + layout.preview.width).toBeLessThanOrEqual(932);
  expect(layout.items.x + layout.items.width).toBeLessThanOrEqual(layout.preview.x);
  expect(layout.character.height).toBeGreaterThanOrEqual(layout.preview.height * 0.5);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: FAIL because the registry, metadata, and layout exports do not exist.

- [ ] **Step 3: Implement the smallest metadata and resolver**

Define `OutfitLayer`, `OutfitSlot`, `CharacterAnchor`, `PreviewMode`, `AnchorOffset`, and `OutfitDefinition`. Register the four first-batch dresses with separate thumbnail/idle/run/cheer paths, `scholar_robe` compatibility plus `scholar_gown` alias, and absent production assets. Resolve only keys whose `hasTexture` callback returns true.

- [ ] **Step 4: Implement responsive layout**

Return `items`, `preview`, `stage`, `character`, `details`, `header`, and `compact` rectangles from `width` and `height`; clamp all right edges to `width` and reserve at least 54 virtual pixels for button hit areas.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: PASS.

### Task 3: Build the cached renderer and animated preview controller

**Files:**
- Create: `src/ui/OutfitRenderer.ts`
- Create: `src/ui/CharacterPreviewController.ts`
- Modify: `src/ui/CharacterOutfitCompositor.ts`
- Test: `src/test/wardrobe-preview-system.test.ts`

**Interfaces:**
- `OutfitRenderer.render(target: OutfitRenderTarget, options: OutfitRenderOptions): OutfitRenderResult`
- `CharacterPreviewController.setCharacter(character: PreviewCharacter): void`
- `CharacterPreviewController.setWardrobe(wardrobe: EquippedWardrobe): void`
- `CharacterPreviewController.setPose(pose: PreviewPose): void`
- `CharacterPreviewController.playTryOn(wardrobe: EquippedWardrobe): void`
- `CharacterPreviewController.destroy(): void`

- [ ] **Step 1: Add failing resolver/render tests**

```ts
it('renders a missing full outfit through the compositor without throwing', () => {
  const renderer = new OutfitRenderer(mockScene as any, wardrobeRegistry);
  const result = renderer.render(target, {
    characterId: 'adventurer', baseTextureKey: 'adventurer_stand', pose: 'idle',
    wardrobe: { dress: 'scholar_robe' }, scale: 2,
  });
  expect(result.mode).toBe('composite');
  expect(target.graphics.clear).toHaveBeenCalled();
});

it('does not re-render an unchanged cache key', () => {
  controller.setWardrobe({ dress: 'scholar_robe' });
  controller.setWardrobe({ dress: 'scholar_robe' });
  expect(compositorSpy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: FAIL because `OutfitRenderer` and `CharacterPreviewController` do not exist.

- [ ] **Step 3: Add an anchored compositor path without changing the legacy default**

Keep existing `renderOutfit()` coordinates and call order for current Runner/tests. Add `renderPreviewOutfit()` using the character-center anchor profile: wings/backpack at shoulder, garment body at chest/waist, bottoms at hips, glasses at eye line, and hats at crown. Draw the fallback once into a reusable Graphics target; do not create/destroy Canvas or Phaser textures on every frame.

- [ ] **Step 4: Implement renderer fallback and cache**

Check `scene.textures.exists()` through the registry. Use the full outfit texture key when present; otherwise use layered keys if available; otherwise call `CharacterOutfitCompositor.renderPreviewOutfit()`. Keep a `Map<string, RenderPlan>` keyed by `character:<id>:<outfit>:<pose>` and return base sprite when the definition or texture is missing.

- [ ] **Step 5: Implement preview controller animation**

Create one container, base Image, fallback Graphics, shadow and FX references. Apply a 1,800–2,400ms low-amplitude idle bob, swap pose texture when available, simulate missing run/cheer with idle plus tween, and play try-on at `0.96 → 1.04 → 1.00` within 300ms. Sparkles are bounded to a small burst and never flash continuously.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: PASS.

### Task 4: Integrate wardrobe try-on state and purchase behavior

**Files:**
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/types/index.ts` only if the new preview pose type needs a shared export
- Test: `src/test/wardrobe-preview-system.test.ts`

**Interfaces:**
- `ShopScene.getPreviewWardrobe(): EquippedWardrobe`
- `ShopScene.getWardrobeSlot(item: WardrobeItem): keyof EquippedWardrobe`
- Existing `selectWardrobeItem()`, `handleActionClick()`, `updatePreviewDisplay()` remain callable.

- [ ] **Step 1: Write failing try-on tests**

```ts
it('previews an unowned card without mutating profile equipment', () => {
  scene.create();
  scene.switchTab('wardrobe');
  scene.switchWardrobeCategory('dress');
  scene.selectWardrobeItem(1); // scholar robe
  expect(scene.getPreviewWardrobe().dress).toBe('scholar_robe');
  expect(DataManager.getInstance().getEquippedWardrobe().dress).toBeUndefined();
});

it('purchase persists ownership and equips only after the action button', () => {
  const dm = DataManager.getInstance();
  dm.getProfile().coins = 300;
  scene.create();
  scene.switchTab('wardrobe');
  scene.switchWardrobeCategory('dress');
  scene.selectWardrobeItem(1);
  expect(dm.isWardrobeOwned('scholar_robe')).toBe(false);
  scene.handleActionClick();
  expect(dm.isWardrobeOwned('scholar_robe')).toBe(true);
  expect(dm.getEquippedWardrobe().dress).toBe('scholar_robe');
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: the first test fails because preview still reads only the persisted equipped wardrobe.

- [ ] **Step 3: Implement temporary preview state**

Copy `DataManager.getEquippedWardrobe()`, apply the selected item to the correct slot, delete dress/top/bottom conflicts in the copy, and feed that copy to `CharacterPreviewController`; never save during selection.

- [ ] **Step 4: Replace preview fields with controller output**

Keep existing public fields and depth values for compatibility, but make the visible character/outfit come from the controller. Hide legacy Emoji text layers and continue updating their text only for existing tests.

- [ ] **Step 5: Keep the explicit action button purchase flow**

Use coins first when affordable, otherwise gems; reject missing currency without mutation; on success buy once, equip once, refresh cards/HUD, play the existing sound, and show a non-alert Phaser success modal with “立即穿上”. Existing direct `handleActionClick()` calls remain synchronous for unit compatibility.

- [ ] **Step 6: Run focused tests and the legacy wardrobe tests**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts src/test/shop-wardrobe-tabs.test.ts src/test/ui-qa-shop-wardrobe-depth-auditor.test.ts`

Expected: PASS with no double purchase or state corruption.

### Task 5: Rebuild the wardrobe presentation layer

**Files:**
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/ui/CanvasButton.ts` only if an existing primitive cannot express the requested gold CTA state
- Test: `src/test/wardrobe-preview-system.test.ts`

**Interfaces:**
- `getWardrobeLayout()` supplies all geometry.
- `CharacterPreviewController` supplies the live avatar.

- [ ] **Step 1: Add layout assertions**

```ts
it('keeps the wardrobe CTA and preview inside 1280×720 and 932×430 layouts', () => {
  for (const [width, height] of [[1280, 720], [932, 430]]) {
    const layout = getWardrobeLayout(width, height);
    expect(layout.action.x + layout.action.width).toBeLessThanOrEqual(width);
    expect(layout.action.y + layout.action.height).toBeLessThanOrEqual(height);
  }
});
```

- [ ] **Step 2: Run the layout test and verify RED**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts`

Expected: FAIL until the new action bounds are exposed.

- [ ] **Step 3: Implement the Moonlit Mirror Stage**

For wardrobe tab, render the left category rail/cards and right stage from layout rectangles. Use dark purple/royal blue/warm gold, a low-contrast wardrobe silhouette, spotlight, circular pedestal, ground shadow, and small sparkle FX. Keep the character at 55–70% of the stage height, with item details and a large CTA below it. Do not use the item icon as the wearing asset.

- [ ] **Step 4: Implement selected and action states**

Selected cards use gold border, glow, checkmark and scale tween. CTA uses gold/high-contrast styling with 1.02 hover and 0.97 pointer-down, and labels `立即購買`, `立即穿戴`, or `目前穿戴中 ✓` according to state. Retain legacy labels where current tests assert them.

- [ ] **Step 5: Add pose controls and success modal**

Place stand/run/cheer buttons inside the preview panel with 44px-equivalent targets. Cheer returns to idle after roughly 1–1.5s. The success modal uses the existing `CanvasModal`, a small sparkle/confetti burst, and no `alert()`.

- [ ] **Step 6: Run focused and regression tests**

Run: `npm run test:unit -- src/test/wardrobe-preview-system.test.ts src/test/shop-wardrobe-tabs.test.ts src/test/ui-qa-shop-wardrobe-depth-auditor.test.ts src/test/wardrobe-anatomical-layering-auditor.test.ts`

Expected: PASS.

### Task 6: Add missing-asset documentation and future extension path

**Files:**
- Create: `docs/outfit-art-prompts.md`
- Create: `public/assets/generated/outfits/scholar_gown/README.md`
- Create: `public/assets/generated/outfits/princess_dress/README.md`
- Create: `public/assets/generated/outfits/dino_onesie/README.md`
- Create: `public/assets/generated/outfits/magic_robe/README.md`
- Modify: `src/config/outfits.ts` if the prompt/asset path names need final alignment

**Interfaces:**
- README files are asset handoff contracts only; they are not loaded as game assets.

- [ ] **Step 1: Write one prompt per Outfit**

Each prompt must require the same character, hairstyle, face, proportions, outline thickness, top-left lighting, soft cel shading, transparent background, front-facing full-body sprite, and no text/UI/background. Include separate thumbnail and wearing-art requirements.

- [ ] **Step 2: Write the placeholder handoff**

Each README lists exactly `*_idle.png`, `*_run.png`, `*_cheer.png`, and `*_thumbnail.png`, plus the rule that the thumbnail must never be used as the wearing texture.

- [ ] **Step 3: Verify no fake assets were added**

Run: `find public/assets/generated/outfits -type f -name '*.png'`

Expected: no output; only README placeholders exist.

### Task 7: Verify build, browser behavior, and finish documentation

**Files:**
- Modify: `DESIGN.md` from the shipped UI evidence
- Create: `.impeccable/review/desktop.png`
- Create: `.impeccable/review/mobile.png`
- Test: existing unit and e2e suites plus the new wardrobe browser test

- [ ] **Step 1: Run all unit tests**

Run: `npm run test:unit`

Expected: all existing and new tests pass.

- [ ] **Step 2: Build TypeScript and Vite output**

Run: `npm run build`

Expected: TypeScript and Vite exit 0; built output contains the `THESIS: Dream Wardrobe` contract.

- [ ] **Step 3: Run browser viewport checks**

Run the Playwright wardrobe flow at 1920×1080, 1366×768, 1280×720, 1024×768 landscape, and 932×430. Navigate to wardrobe, cycle Scholar → Dino → Princess → Magic → Scholar rapidly, assert no page errors, assert the preview remains visible, assert no card/action overflow, and assert a second purchase does not deduct currency.

- [ ] **Step 4: Capture the two review screenshots**

Save the best desktop and mobile-landscape views to `.impeccable/review/desktop.png` and `.impeccable/review/mobile.png`.

- [ ] **Step 5: Run the Impeccable detector once**

Run: `node /root/.codex/skills/impeccable/scripts/detect.mjs --json src/scenes/ShopScene.ts src/ui/CharacterPreviewController.ts src/ui/OutfitRenderer.ts`

Expected: record mechanical findings; fix only applicable findings before the final screenshot round.

- [ ] **Step 6: Write the durable design record**

Create `DESIGN.md` from the shipped palette, stage layout, component language, motion grammar, and responsive rules. Include the current missing-art boundary and do not claim production Outfit sprites exist.

- [ ] **Step 7: Re-run the final verification set**

Run: `npm run test:unit && npm run build`

Expected: exit 0 with fresh evidence before reporting completion.
