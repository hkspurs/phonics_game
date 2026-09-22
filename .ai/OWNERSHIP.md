| Path / Module | Agent | Task | Status |
|---|---|---|---|
| docs/qa/release-hardening/ | OpenAI Codex | TASK-20260913-RELEASE-HARDENING | LOCKED |
| docs/superpowers/plans/2026-09-13-release-hardening.md | OpenAI Codex | TASK-20260913-RELEASE-HARDENING | LOCKED |
| e2e/ | OpenAI Codex | TASK-20260913-RELEASE-HARDENING | LOCKED |
| playwright.config.ts | OpenAI Codex | TASK-20260913-RELEASE-HARDENING | LOCKED |
| (none) | — | — | AVAILABLE |


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
