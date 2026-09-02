# P1 Adventure — Master Character Art Bible

**Version**: 1.0  
**Project**: 升夢大冒險 / P1 Adventure  
**Audience**: Artists, Technical Artists, AI Coding Agents  

---

## 1. Canvas Specification

All character sprites are authored on a **512 × 512** pixel canvas.

| Property | Value |
|---|---|
| Canvas Size | 512 × 512 px |
| Horizontal Center | X = 256 |
| Foot / Ground Baseline | Y = 460 |
| Character Chibi Ratio | 1:2.5 (Head : Body) |
| Format | Transparent Raster Sprite Sheets (PNG-32, 32-bit) |

---

## 2. Skeleton & Proportions

The **Master Skeleton** defines stable anatomical proportions shared across all characters:

- **Head Height**: ~100 px (approximately 1/3 of total height at 1:2.5 chibi ratio)
- **Total Character Height**: ~250 px at 1x scale
- **Foot Baseline**: Y = 460 (all character feet must be aligned to this Y)
- **Horizontal Center**: X = 256

---

## 3. Outline Specification

| Property | Value |
|---|---|
| Outline Weight | 3.0 px |
| Outline Style | Solid, rounded joins |
| Outline Color | Dark shadow variant of fill color |

---

## 4. Lighting Direction

- **Primary Light Source**: Top-Left (roughly 10 o'clock)
- **Specular Highlights**: Upper-left body surfaces
- **Shadow Direction**: Towards lower-right

---

## 5. Layer Render Order

All characters use the following layer stacking order (bottom to top):

| Depth | Layer Name | Description |
|---|---|---|
| 35 | BACK_ACCESSORY | Behind-character accessories (e.g. Angel Wings) |
| 40 | BODY_BASE | Character body and skin |
| 50 | OUTFIT_TOP | Shirt, jacket, upper garment |
| 55 | OUTFIT_DRESS | Full dress (mutually exclusive with top/bottom) |
| 65 | FACE | Eyes, eyebrows, mouth |
| 70 | HAT | Headwear |

> **Critical Rule**: `BACK_ACCESSORY` items MUST render at **Depth 35**, strictly behind the character body.

---

## 6. Poses (Required)

Each character requires the following **9 core poses** as individual 512×512 PNG files:

| Pose Key | File Name | Description |
|---|---|---|
| `idle_front` | `idle_front.png` | Standing facing camera |
| `idle_side` | `idle_side.png` | Standing side-profile |
| `run` | `run.png` | Running motion |
| `jump` | `jump.png` | Jumping / airborne |
| `landing` | `landing.png` | Landing squash frame |
| `cheer` | `cheer.png` | Celebration pose |
| `hurt` | `hurt.png` | Hit reaction |
| `celebration` | `celebration.png` | Full-body cheer |
| `shop_preview` | `shop_preview.png` | Shop card thumbnail |

---

## 7. Characters

| ID | Name | Stat Perks |
|---|---|---|
| `adventurer` | 冒險家 (Adventurer) | Balanced — starter |
| `heroine` | 俠女 (Heroine) | Speed +15% |
| `soldier` | 士兵 (Soldier) | Shield +1 per run |
| `knight` | 騎士 (Knight) | Coin multiplier +20% |
| `ninja` | 忍者 (Ninja) | Speed +30% |

---

## 8. Heroine Layering Defect (Resolved)

**Defect**: Heroine's back accessory (Wings) rendered disconnected from body skeleton.

**Root Cause**: Back accessory depth was set to 55, causing z-fighting with OUTFIT_TOP.

**Resolution**: Strictly enforce `BACK_ACCESSORY` at **Depth 35** in `CharacterOutfitCompositor`.

---

*Last updated: 2026-09-02 by Antigravity (TASK-20260902-009)*
