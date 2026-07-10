# Original User Request

## Initial Request — 2026-07-10T14:48:20Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

A new "Brain Game" mini-game for the existing Phonics Game app, designed to help 6-year-old children practice phonics sounds in a fun and engaging way.

Working directory: /data/phonics_game/phonics_game
Integrity mode: development

## Requirements

### R1. Creative Phonics Game
Design and implement a completely new, creative phonics mini-game component. The specific mechanics are up to the agent team, but it must be fun, intuitive for a 6-year-old, and practice phonics sounds using the existing `questionEngine.sounds` data.

### R2. Integration & Ticket System
The new game must be integrated into the `BrainGamesIsland.jsx` screen. It must cost 1 Ticket to play, using the existing `useTicket` action from the Zustand `gameStore`. The game should navigate back to `/braingames` upon completion or exit.

### R3. Premium Aesthetics
The game must match the existing app's high-quality design standards: vibrant colors, smooth CSS/framer-motion animations, responsive design (safe-area support for mobile), and avoid looking like a generic template.

## Acceptance Criteria

### Integration & Core Logic
- [ ] A new button is present in `BrainGamesIsland.jsx` that routes to the new game.
- [ ] Clicking the new game button strictly deducts exactly 1 ticket via the `gameStore`, handling React 18 StrictMode double-invocations correctly (e.g., using a `useRef` guard).
- [ ] The game component mounts successfully without throwing runtime errors.
- [ ] The game pulls audio URLs and sound labels correctly from `questionEngine.sounds`.
- [ ] Completing or quitting the game successfully routes the user back to `/braingames`.
