# Active AI Ownership

| Path / Module | Agent | Task | Status |
|---|---|---|---|
| `e2e/gamer-deep-interactive-playtest.spec.ts` | Codex | TASK-20260831-014 | LOCKED |
| `e2e/wardrobe-hybrid-shop-visual.spec.ts` | Codex | TASK-20260831-014 | LOCKED |
| `e2e/gamer-tester-3-full-playthrough-inspector.spec.ts` | Codex | TASK-20260831-014 | LOCKED |
| `e2e/ui-qa-responsive-hover-and-slots.spec.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/ShopScene.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/QuestionScene.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/RunnerScene.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/RunnerScene.test.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/PreloadScene.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/scenes.test.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/scenes/ResultScene.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/config.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/config/outfits.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/ui/PlayerAvatarBadge.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/ui/OutfitRegistry.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/ui/CharacterOutfitCompositor.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/services/PlayerAvatarService.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/ui/CharacterPreviewController.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/ui/OutfitRenderer.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/services/DataManager.test.ts` | Codex | TASK-20260831-014 | LOCKED |
| `src/test/character-aesthetics-anatomical-fitting-qa.test.ts` | Codex | TASK-20260831-014 | LOCKED |
| Wardrobe, QuestionScene, and avatar regression tests | Codex | TASK-20260831-014 | LOCKED |
| `.ai/ARCHITECTURE.md` | Codex | TASK-20260831-014 | LOCKED |
| `docs/character-art-spec.md` | Codex | TASK-20260831-014 | LOCKED |
| `docs/outfit-art-prompts.md` | Codex | TASK-20260831-014 | LOCKED |
| `docs/superpowers/plans/2026-08-31-dream-wardrobe-p0-p1.md` | Codex | TASK-20260831-014 | LOCKED |
| `public/assets/generated/outfits/{scholar_gown,princess_dress,dino_onesie,magic_robe}/README.md` | Codex | TASK-20260831-014 | LOCKED |

---

## Ownership Rules
- **LOCKED** means another agent must not modify that scope.
- Prefer module/directory ownership when appropriate instead of listing dozens of individual files.
- Always check this file before touching source code.
- Remove ownership immediately after task completion and verification.
- If a required file is locked, **STOP** and report the conflict before modifying it.

## Example Lock Entry
```markdown
| src/scenes/ShopScene.ts | Codex | TASK-20260831-002 | LOCKED |
```
