# Dino Onesie asset handoff notes

The registered 512×512 transparent wearing set is present and is the live
preview source:

- `public/assets/outfits/dino_onesie/thumbnail.png` — shop product illustration only
- `public/assets/character/outfits/dino_onesie/{idle,run,cheer}.png` — full-body wearing art

The current `run.png` and `cheer.png` are byte-identical to `idle.png`, so the
registry intentionally marks those poses as `idleFallback` until the authored
Dino motion set is delivered. Keep the base character identity, proportions,
lighting and registration point unchanged.
