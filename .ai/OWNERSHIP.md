# Active AI Ownership

| Path / Module | Agent | Task | Status |
|---|---|---|---|

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
