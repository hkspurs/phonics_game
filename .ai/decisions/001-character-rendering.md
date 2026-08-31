# 001 - Character Full-Sprite Asset Standard

## Status
Accepted

## Context
Previous wardrobe implementations rendered vector geometry and emoji text over low-resolution base sprites, resulting in visual clipping and misaligned chest boxes.

## Decision
1. Standardize on 512x512 Master Character Sprites with fixed ground baseline at Y=460 and Chibi 1:2.5 head-to-body ratio.
2. Produce full character wearing artwork for all major outfits (School Uniform, Scholar Gown, Princess Dress, Dino Onesie, Magic Robe).
3. Downscale dynamically in Phaser using `OutfitRenderer` (`0.23x` scale factor) with linear texture filtering for crisp Retina display.
