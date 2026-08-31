# ADR-002: Shared AI Coordination System

## Context
This repository is edited alternately by Google AGY (Antigravity) and OpenAI Codex. Without a standardized control plane, agents may overwrite tasks, introduce architectural drift, or cause file collision.

## Decision
1. Establish `.ai/` at repository root as the **single source of truth** for project state, architecture, conventions, task tracking, and module ownership.
2. Require both agents to follow the **Mandatory Startup Protocol** defined in `GEMINI.md` and `AGENTS.md` before modifying source code.

## Status
Accepted and implemented.
