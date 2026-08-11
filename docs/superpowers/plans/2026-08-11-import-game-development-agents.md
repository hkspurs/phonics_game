# Game Development Agent Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the five requested game-development agent definitions into this repo's existing `.agents/skills` structure.

**Architecture:** Preserve each upstream Markdown file verbatim as a project-local `SKILL.md` inside a descriptive skill directory. Do not install global Codex skills or add runtime dependencies; the existing `.agents/AGENTS.md` and local skill format remain authoritative.

**Tech Stack:** Markdown, GitHub file contents, local `.agents/skills` conventions.

## Global Constraints

- Import exactly these five upstream files from `msitarzewski/agency-agents` on `main`.
- Keep YAML frontmatter and agent instructions unchanged.
- Use one directory per agent under `.agents/skills/`.
- Add no application code or dependencies.

### Task 1: Confirm local agent layout

**Files:**
- Read: `.agents/AGENTS.md`
- Read: `.agents/skills/full-stack-game-engineer/SKILL.md`

- [x] Confirm that project-local agents use `.agents/skills/<name>/SKILL.md` and that no global installation is needed.

### Task 2: Fetch the requested upstream definitions

**Source files:**
- `game-development/economy-designer.md`
- `game-development/game-designer.md`
- `game-development/game-audio-engineer.md`
- `game-development/narrative-designer.md`
- `game-development/technical-artist.md`

- [x] Fetch each file from the upstream `main` branch through the GitHub connector.
- [x] Confirm each response is UTF-8 Markdown with YAML frontmatter.

### Task 3: Add project-local agent skills

**Files:**
- Create: `.agents/skills/economy-designer/SKILL.md`
- Create: `.agents/skills/game-designer/SKILL.md`
- Create: `.agents/skills/game-audio-engineer/SKILL.md`
- Create: `.agents/skills/narrative-designer/SKILL.md`
- Create: `.agents/skills/technical-artist/SKILL.md`

- [x] Add the five fetched definitions verbatim at the corresponding paths.
- [x] Do not alter the upstream role names, frontmatter, or instructions.

### Task 4: Validate the import

**Files:**
- No additional files.

- [x] Check all five files exist and begin with YAML frontmatter.
- [x] Compare each local file with its upstream content.
- [x] Run `git diff --check` and confirm only the requested agent files and this plan are changed.
