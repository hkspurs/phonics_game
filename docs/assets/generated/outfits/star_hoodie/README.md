# Star Hoodie production-art placeholder

No Star Hoodie wearing artwork is present yet. Keep the game on the safe base-character fallback until these transparent, registration-matched files are delivered:

- `star_hoodie_thumbnail.png` — isolated shop product illustration only.
- `star_hoodie_wearing.png` — full-body idle character wearing the hoodie.
- `star_hoodie_run.png` — full-body run pose wearing the hoodie.
- `star_hoodie_cheer.png` — full-body cheer pose wearing the hoodie.

Required wearing sprite constraints:

- Same canvas size and registration point as the base character.
- Transparent background; no card, frame, or product backdrop.
- Hoodie shoulders, neck opening, sleeves, cuffs, hands, and waist designed into the character art.
- Same character face, hairstyle, proportions, outline thickness, top-left lighting, and cel-shading as the base game sprite.

The renderer must never use the thumbnail as a wearing texture. Until the files exist, `CharacterOutfitCompositor` intentionally draws no Star Hoodie garment block.
