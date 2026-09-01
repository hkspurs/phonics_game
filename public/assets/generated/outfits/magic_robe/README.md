# Magic Robe asset handoff notes

The registered 512×512 transparent wearing set is present and is the live
preview source:

- `public/assets/outfits/magic_robe/thumbnail.png` — shop product illustration only
- `public/assets/character/outfits/magic_robe/{idle,run,cheer}.png` — full-body wearing art

The current `run.png` and `cheer.png` are byte-identical to `idle.png`, so the
registry intentionally marks those poses as `idleFallback` until distinct
motion artwork is delivered. The safe fallback remains available for missing
future poses.
