# Project: Phonics Balloon Pop

## Architecture
- React front-end using react-router-dom, Zustand store, and existing AudioEngine/QuestionEngine.
- New Mini-game `SoundBalloonPop.jsx` added in `src/games/`.
- Integration in `BrainGamesIsland.jsx` (route, ticket check, UI button).
- Navigation back to `/braingames` on complete/exit.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Create SoundBalloonPop Game | Design and implement the balloon pop game in `src/games/SoundBalloonPop.jsx` using `useTicket`, `audioEngine`, and `questionEngine`. | None | PLANNED |
| 2 | Integrate in BrainGamesIsland & App Router | Register route in `src/App.jsx` and add a play button in `src/screens/BrainGamesIsland.jsx` that deducts 1 ticket and routes to the game. | M1 | PLANNED |
| 3 | Verification & UAT Testing | Run Playwright test suite and check game logic, aesthetics, ticket consumption, and navigation. | M2 | PLANNED |

## Interface Contracts
### `gameStore` ↔ `SoundBalloonPop`
- `tickets`: number of tickets available.
- `useTicket`: function that deducts exactly 1 ticket.
- `questionEngine.sounds`: array of sound objects `{ sound_id, label, audio_url, family, human_review_status }`.
- `audioEngine.play(url)`: plays a sound.

## Code Layout
- `src/games/SoundBalloonPop.jsx`: The balloon pop mini-game component.
- `src/screens/BrainGamesIsland.jsx`: Mini-game selection screen.
- `src/App.jsx`: Main routing.
