# ADR-001: Character Full-Sprite Asset Pipeline

## Context
Previous iterations of the Dream Wardrobe used vector geometry and floating text emojis overlaid on low-resolution (80x110px) Kenney base sprites. This caused visual clashing, misaligned chest boxes, and a "cheap sticker" aesthetic.

## Decision
1. Establish a **512x512 Master Character Specification** (`docs/character-art-spec.md`) with ground baseline at Y=460px and Chibi 1:2.5 proportions.
2. Produce **Full Character Wearing Assets** (Idle, Run, Cheer, Thumb) for all major outfits (`school_uniform`, `scholar_gown`, `princess_dress`, `dino_onesie`, `magic_robe`).
3. Render modular accessories in strict depth order: `BACK_ACCESSORY` (Angel Wings) at Depth 35 behind the body sprite, and `FRONT_ACCESSORY` at Depth 45.

## Status
Accepted and implemented.
