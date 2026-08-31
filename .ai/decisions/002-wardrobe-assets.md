# 002 - Wardrobe Depth Layering Architecture

## Status
Accepted

## Context
Accessories like Angel Wings previously shared the foreground layer with hats and glasses, causing wings to render over the character's chest and arms.

## Decision
Establish strict depth order separation:
- `Depth 35`: `BACK_ACCESSORY` (Angel Wings, rear backpack anchors)
- `Depth 40`: Character Base Sprite / Full Outfit Sprite
- `Depth 41-44`: Rigged costume pieces
- `Depth 45`: `FRONT_ACCESSORY` (Glasses, Hats, Front Headwear)
