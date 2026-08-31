# Module & File Ownership Registry

This document prevents file edit collisions between **Google AGY** and **OpenAI Codex**.

---

## ⚠️ Mandatory Ownership Rules
1. **Check Before Touching**: Before modifying any source file, verify it is not marked `LOCKED` by another agent.
2. **Locking Protocol**:
   - Register your active lock below with `Module / Path`, `Agent`, `Since`, `Task ID`, and `Lock Type (EXCLUSIVE / SHARED_READ)`.
   - Update `TASK_BOARD.md` to set task to `IN_PROGRESS`.
3. **Collision Policy**:
   - If a required file is `LOCKED` by another agent: **DO NOT MODIFY IT**.
   - Stop immediately and report the active conflict to the user.
4. **Release Protocol**:
   - Upon completing the task, running verification tests, and committing to git, immediately remove or release the lock below.

---

## 🔒 Active Ownership Locks

| Module / Path | Locked By Agent | Since | Task ID | Lock Type | Description |
|---|---|---|---|---|---|
| `.ai/*` | `AGY (Antigravity)` | 2026-08-31 11:50 | `TASK-001` | `EXCLUSIVE` | Initializing AI coordination control plane |
| `GEMINI.md`, `AGENTS.md` | `AGY (Antigravity)` | 2026-08-31 11:50 | `TASK-001` | `EXCLUSIVE` | Creating startup entry protocols |

---

## 📖 Example Lock Entry
```markdown
| `src/scenes/ShopScene.ts` | `Codex` | 2026-08-31 12:00 | `TASK-004` | `EXCLUSIVE` | Refactoring shop filter tabs |
```
