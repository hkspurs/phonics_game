# Character Art Bible & Master Specification
## 升夢大冒險 / P1 Adventure

---

## 1. Core Art Direction & Aesthetic Pillars
- **Target Audience**: Hong Kong Primary 1 Pupils (Ages 5–7).
- **Style**: Vibrant, modern, friendly Chibi Q-version (2.5D Anime Pop).
- **Inking & Outline Weight**:
  - Main Outer Contour: **3.0 px** in dark warm coffee `#2d1a0e` (never pure `#000000` pitch black to maintain warmth).
  - Interior Seam & Crease Lines: **1.5 px** in warm shadow `#4a2c18`.
- **Lighting Direction**: **Top-Left 45° Key Light** with subtle ambient bounce.
- **Shading Technique**: Two-step clean cel-shading (65% base tone, 30% shadow tone, 5% specular/glint).

---

## 2. Master Rig & Proportion Metrics
- **Canvas Dimensions**: **512 × 512 px** (Master 32-bit transparent RGBA PNG).
- **Proportion Ratio**: **1:2.5 Chibi**
  - **Head Height**: 160 px (Center at Y = 175 px, X = 256 px).
  - **Torso Height**: 110 px (Center at Y = 295 px, X = 256 px).
  - **Legs & Feet Height**: 140 px (Baseline at Y = 460 px).
  - **Total Visual Character Height**: 390–410 px.
- **Ground Foot Anchor**: Locked at **Y = 460 px** (Canvas baseline).
- **Perspective**:
  - UI / Home / Shop / Map / Results: **Frontal 2.5D Orthographic** (5° downward tilt).
  - Runner / Platformer: **Side 2.5D Profile** (Facing right, 8° dynamic forward tilt).

---

## 3. Attachment Sockets & Coordinates
All characters share identical socket attachment points across 512×512 space:
- **Head Crown Socket**: `(256, 105)` (Hats, caps, cat ears, tiaras)
- **Face / Eye Socket**: `(256, 185)` (Glasses, eye patches, masks)
- **Collar / Neck Socket**: `(256, 260)` (Ties, scarves, necklaces)
- **Torso / Chest Socket**: `(256, 290)` (Tops, shirts, vests)
- **Waist / Hip Socket**: `(256, 350)` (Belts, skirts, pants)
- **Back Shoulder Socket**: `(256, 270)` (Wings, cloaks, capes)
- **Side Shoulder Socket**: `(285, 290)` (Backpacks, satchels)

---

## 4. Layer Order & Z-Depth Hierarchy
Strict Z-indexing prevents rendering glitches or z-fighting:
1. **Depth 35: `BACK_ACCESSORY`** (Angel wings, hero capes)
2. **Depth 40: `BODY_SPRITE`** (Base character rig with skin & hair)
3. **Depth 42: `OUTFIT_LOWER`** (Skirts, shorts, trousers)
4. **Depth 43: `OUTFIT_UPPER / DRESS`** (Shirts, vests, full-body dresses, onesies, robes)
5. **Depth 45: `FRONT_ACCESSORY`** (Backpacks over shoulder, sashes)
6. **Depth 48: `FACE_ACCESSORY`** (Smart glasses, shades)
7. **Depth 50: `HEADWEAR`** (Scholar cap, tram hat, cat ears)
8. **Depth 55: `COMPANION_PET`** (Floating companion hovering at upper side)
9. **Depth 60: `FX_PARTICLES`** (Stars, gold sparkles, victory confetti)

---

## 5. Standard Poses & Frame Breakdown
Every character and major outfit supports 9 core poses:
1. `idle_front`: Neutral frontal breathing pose (Home, Shop Stand, Map).
2. `idle_side`: Runner waiting at starting gate.
3. `run`: Dynamic 2.5D profile run cycle (Runner).
4. `jump`: Airborne tucked posture with raised arms (Runner jumping).
5. `landing`: Impact compression pose (Runner landing).
6. `cheer`: Double arms raised in joyous celebration (Shop Cheer, Correct Answer).
7. `hurt`: Recoil flinch with > < eyes (Obstacle collision, Incorrect Answer).
8. `celebration`: 3-star victory cheer with star sparkles (ResultScene).
9. `shop_preview`: 3/4 dynamic posture displaying equipped cosmetics (ShopScene).

---

## 6. Asset Format Separation
- **Characters, Outfits, and Pets**: **100% Transparent Raster Sprite Sheets** (32-bit RGBA PNG).
- **Interface Icons & Simple UI Badges**: Scalable procedural SVG / Vector Canvas icons (`CanvasIcon.ts`).
