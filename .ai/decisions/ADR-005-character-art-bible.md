# ADR-005: Character Art Bible, Standard Skeleton, and Vertical Slice Protocol

## Status
Accepted

## Date
2026-09-02

## Context
Previous character art iterations suffered from:
1. Fragmented resolutions (mix of 80x110 Kenney sprite bases and 512x512 full outfits).
2. Fragmented render techniques (vector procedural overlays over PNG sprites).
3. The "Heroine layering defect", where the character appeared back-facing, disconnected, or covered by a vertical costume block.
4. Differing foot baselines causing vertical jitter during pose/skin switches.

## Decision
1. **Master Character Art Bible**: Standardize all characters, outfits, and pets to a unified 512x512 Canvas, Chibi 1:2.5 ratio, Ground Baseline Y=460, Top-Left 45° soft cel-shading, and 3px contour / 1.5px inner seam inking.
2. **Transparent Raster Sprite Sheets**: All characters, outfits, and pets must use 32-bit transparent RGBA PNG sprite assets. SVG is strictly reserved for UI icons and scalable interface buttons.
3. **Layer Order**: Enforce strict Z-depth hierarchy (Depth 35 Back Accessory -> Depth 40 Body Base -> Depth 42-43 Outfit -> Depth 45 Front Accessory -> Depth 48 Face/Glasses -> Depth 50 Headwear -> Depth 55 Pet -> Depth 60 FX).
4. **Vertical Slice Gating**: Produce and verify one production-quality vertical slice (Adventurer & Heroine across 9 core poses/actions + 1 complete outfit + 1 equipped pet) across Home, Runner, Shop, Map, and Results scenes before batch-generating the rest of the cast.

## Consequences
- 100% visual consistency and zero foot jitter across all animations.
- Elimination of the Heroine layering and costume block defect.
- Clear production roadmap for full cast migration after vertical slice visual review.
