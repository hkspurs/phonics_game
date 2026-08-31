# Repository AI Development Protocol

This repository may be modified by multiple coding agents including
OpenAI Codex and Google Antigravity.

`.ai/` is the shared coordination system.

The rules in this file apply AUTOMATICALLY to EVERY coding task.

The user does NOT need to repeat these rules.

--------------------------------------------------
BEFORE EVERY CODING TASK
--------------------------------------------------

Before modifying source code, automatically:

1. Read:
   - .ai/CURRENT_STATE.md
   - .ai/TASK_BOARD.md
   - .ai/OWNERSHIP.md
   - .ai/ARCHITECTURE.md
   - .ai/CONVENTIONS.md
   - Read .ai/TESTING.md when relevant.
   - Read recent .ai/CHANGELOG.md entries when needed.

2. Inspect repository state:
   - `git status`
   - `git log --oneline -15`

3. Determine whether another coding agent has active work.

4. Check .ai/OWNERSHIP.md.

5. Detect whether the requested work conflicts with another active task.

6. Register the new task in:
   - .ai/TASK_BOARD.md (Status: IN_PROGRESS)

7. Register the files/modules expected to be modified in:
   - .ai/OWNERSHIP.md

8. Only after these checks may implementation begin.

THIS PROCESS IS AUTOMATIC.
The user should NOT need to say:
"Follow the repository AI startup protocol first." or "Check what the other agent is doing."

--------------------------------------------------
DURING EVERY CODING TASK
--------------------------------------------------

Assume another AI agent may also modify this repository.
Never assume the current conversation contains the complete project state.
Repository + `.ai/` are authoritative.

- Do not overwrite another agent's active work.
- If a file/module is LOCKED by another active task: **DO NOT MODIFY IT**.
- If the requested work genuinely requires that file:
  **STOP** before changing it and report the ownership conflict.
- Do not silently remove another agent's changes.
- Do not revert unrelated changes.
- If task scope changes significantly during implementation, update `TASK_BOARD.md` and `OWNERSHIP.md` accordingly.

--------------------------------------------------
AFTER EVERY CODING TASK
--------------------------------------------------

After implementation and verification automatically:

1. Update .ai/TASK_BOARD.md
   - Set task status to: DONE, BLOCKED, or appropriate state.

2. Release completed ownership entries from:
   - .ai/OWNERSHIP.md

3. Add an entry to:
   - .ai/CHANGELOG.md
   including:
   - date/time
   - agent
   - task ID
   - summary
   - files/modules changed
   - tests performed
   - pending work if any

4. Update .ai/CURRENT_STATE.md ONLY if meaningful project state changed.
   (Do NOT rewrite CURRENT_STATE.md for trivial changes).

5. Update .ai/ARCHITECTURE.md ONLY if architecture changed.

6. Update .ai/CONVENTIONS.md ONLY if development conventions changed.

7. Update .ai/TESTING.md ONLY if testing procedures changed.

8. Add an ADR/document under .ai/decisions/ ONLY for meaningful architectural or technical decisions.

THIS PROCESS IS AUTOMATIC.
The user should NOT need to say:
"After completion update the shared .ai project state."

--------------------------------------------------
DEFINITION OF DONE
--------------------------------------------------

A coding task is not considered complete until:
- implementation is complete
- relevant tests/checks have been performed
- TASK_BOARD is updated
- CHANGELOG is updated
- ownership is released
- relevant shared documentation is updated when necessary

--------------------------------------------------
NORMAL USER EXPERIENCE
--------------------------------------------------

The user should only need to describe WHAT they want.

Example:
User: "Make Angel Wings 20% smaller and animate them naturally."
The coding agent automatically performs:
read shared state → inspect git → check other agents → register task → register ownership → implement → test → update shared state → release ownership
without requiring additional coordination instructions.
