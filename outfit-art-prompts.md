# Dream Wardrobe Outfit Art Prompts

These prompts are for authored wearing sprites, not shop thumbnails. Keep the
same base character, face, hairstyle, body proportions, outline thickness,
top-left soft lighting, and cel-shading treatment across every outfit and
pose. Export transparent PNGs with no text, UI, card background, or decorative
rectangle.

## Shared character lock

Cute chibi primary-school adventure game character, full body, front-facing,
same base-game character identity, same facial proportions, same hairstyle,
same head-to-body ratio, same hand and foot placement, consistent clean mobile
game sprite, soft cel shading, consistent dark outline, top-left soft light,
gentle contact shadows, children friendly, transparent background, no text, no
UI, no background.

Use the shared character lock at the start of every prompt, then append the
outfit-specific description below. Generate separate neutral idle, run, and
cheer poses only when listed in the asset handoff.

## Scholar Gown

`Shared character lock. Wearing an elegant navy-black primary-school graduation scholar gown with gold embroidered trim, small red striped necktie, black mortarboard with a golden tassel, visible hands naturally emerging from the sleeves, polished full-body mobile game wearing sprite, neutral idle pose.`

Required wearing assets:

- `public/assets/character/outfits/scholar_gown/idle.png`
- `public/assets/character/outfits/scholar_gown/run.png`
- `public/assets/character/outfits/scholar_gown/cheer.png`
- `public/assets/outfits/scholar_gown/thumbnail.png` (catalogue art only)

## Princess Dress

`Shared character lock. Wearing a cute fantasy princess dress in soft pink with a layered skirt, small gold trim, matching child-friendly shoes and a delicate star accent, hands visible in front of the sleeves, polished full-body mobile game wearing sprite, neutral idle pose.`

Required wearing assets:

- `public/assets/character/outfits/princess_dress/idle.png`
- `public/assets/character/outfits/princess_dress/run.png`
- `public/assets/character/outfits/princess_dress/cheer.png`
- `public/assets/outfits/princess_dress/thumbnail.png` (catalogue art only)

## Dino Onesie

`Shared character lock. Wearing a cheerful mint-green dinosaur onesie with a soft cream belly, small rounded dinosaur hood, short tail silhouette, matching child-friendly slippers, hands naturally visible at the sleeve cuffs, polished full-body mobile game wearing sprite, neutral idle pose.`

Required wearing assets:

- `public/assets/character/outfits/dino_onesie/idle.png`
- `public/assets/character/outfits/dino_onesie/run.png`
- `public/assets/character/outfits/dino_onesie/jump.png` (currently missing; the code safely falls back to run/idle)
- `public/assets/character/outfits/dino_onesie/cheer.png`
- `public/assets/outfits/dino_onesie/thumbnail.png` (catalogue art only)

For run, jump, and cheer, preserve the same hood, face, belly markings, tail
shape, and lighting. Change pose only; do not redesign the character.

## Magic Robe

`Shared character lock. Wearing a small star-themed purple magic apprentice robe with a soft violet cape, gold constellation trim, child-friendly pointed wizard hat, visible hands and shoes, polished full-body mobile game wearing sprite, neutral idle pose.`

Required wearing assets:

- `public/assets/character/outfits/magic_robe/idle.png`
- `public/assets/character/outfits/magic_robe/run.png`
- `public/assets/character/outfits/magic_robe/cheer.png`
- `public/assets/outfits/magic_robe/thumbnail.png` (catalogue art only)

## Star Hoodie — art hold

Star Hoodie is intentionally not promoted by the game until transparent
wearing artwork is delivered. Do not use the orange catalogue thumbnail as a
wearing sprite.

Required handoff:

- `public/assets/outfits/star_hoodie/star_hoodie_thumbnail.png`
- `public/assets/character/outfits/star_hoodie/star_hoodie_wearing.png`
- `public/assets/character/outfits/star_hoodie/star_hoodie_run.png`
- `public/assets/character/outfits/star_hoodie/star_hoodie_cheer.png`

If the catalogue thumbnail is delivered first, update only `thumbnailStatus` to
`ready`; keep `artworkStatus: 'placeholder'` until all required transparent
wearing poses have been checked on the base character. When the formal wearing
set is delivered, update `artworkStatus` to `ready` only after that check.

## Base character preview — resolution hold

The current Kenney base preview source is 80×110 at
`public/assets/kenney/platformer-characters/PNG/Player/Poses/` (with Heroine's
matching files under `Female/Poses/`). It becomes visibly soft when the Dressing
Room enlarges it, so do not upscale it further as a substitute for artwork.
Generate matching transparent high-resolution Adventurer and Heroine base sets
at the following proposed new target paths before the final visual pass:

- `public/assets/character/base/adventurer/idle.png`
- `public/assets/character/base/adventurer/run.png`
- `public/assets/character/base/adventurer/cheer.png`
- `public/assets/character/base/heroine/idle.png`
- `public/assets/character/base/heroine/run.png`
- `public/assets/character/base/heroine/cheer.png`

These target files do not exist yet; after delivery, register both sets in
`PreloadScene` and `AVATAR_SKIN_CONFIGS` rather than replacing the Kenney files
implicitly. Keep the current Kenney paths as the safe fallback until each
character set has passed the transparent-background, baseline, and mobile
preview checks.

Use at least a 512×512 working canvas with the character aligned to the shared
ground baseline; keep the final visible character proportions identical to the
existing base sprite.
