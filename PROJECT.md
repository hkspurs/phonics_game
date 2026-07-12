# Project: Phonics & Math Learning Platform

## Architecture
- React front-end using `react-router-dom`, Zustand store, and dual domain engines (`AudioEngine`, `QuestionEngine`, `MathQuestionEngine`).
- `SubjectGateway` serves as the entry point, dividing the app into `Phonics Forest` and `Math Kingdom`.
- Comprehensive 60-case Playwright UAT Suite ensuring UI resilience, pedagogical integrity, and state stability.

## Milestones
| # | Name | Scope | Status |
|---|------|-------|--------|
| 1 | Phonics Core | Daily challenge, map, reward system, and audio engine. | COMPLETED |
| 2 | Math Kingdom | Math mastery map, training gym, daily challenges, and analytics. | COMPLETED |
| 3 | Brain Games | Sound Catcher, Memory Match, Balloon Pop mini-games. | COMPLETED |
| 4 | Agent Review Loop | 3-Round UI/UX and Pedagogy agent iterations. Implemented strict distractor sequencing, React immutability, Contrastive Audio Feedback, EMA mastery analytics, and parallel audio prefetching. | COMPLETED |
| 5 | Key Bug Fixes | Resolved React UUID key collisions in Math Daily/Gym generators, and fixed stranding bugs in Math Gym session completions. | COMPLETED |

## Code Layout
- `src/screens/`: Main views including Gateway, HomeDashboard, MathHome, Mastery Maps, and Gyms.
- `src/game/`: Phonics logic (`QuestionEngine.js`).
- `src/math/`: Math logic (`MathQuestionEngine.js`, `generators/`).
- `src/games/`: Phonics mini-games (Brain Games).
- `src/store/`: Zustand stores (`gameStore.js`, `mathSlice.js`, `analyticsSlice.js`).
- `tests/`: 60-case Playwright test suite (`full-uat.spec.js`, `chaos-uat.spec.js`, etc).
