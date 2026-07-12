# Phonics & Math Learning Platform — Project Rules

## Project Identity

This is a KooBits-style phonics and math learning app for a 6-year-old child. It must feel like a real education platform, not a normal AI-generated HTML quiz. 
It features a Home Dashboard, Daily Challenges, Subject Gateways, Mastery Maps, Assignments, Rewards, Brain Games, Reports, and a human-reviewed Audio System.
The daily educational practice should feel like a small adventure, not homework.

## Technology Stack

- Frontend: React or Vue (Component-based architecture)
- Game rendering: PixiJS or Canvas for mini-games
- Animation: Lottie, CSS animation, SVG
- Audio: Web Audio API
- State management: Zustand, Pinia, or Redux Toolkit
- Deployment: GitHub Pages (CRITICAL: Use relative paths `.` for all routing and assets, no absolute paths).
- Architecture: Modular, separated by concerns (`/src/screens`, `/src/components`, `/src/game`, `/src/audio`, etc.)

## Anti-Template Quality Gate (MANDATORY)

The app must NOT look like an AI-generated quiz template. Every screen, component, and interaction MUST be evaluated against these rules.

### REJECT the implementation if:
1. The main UI is a plain white card with one question and four buttons.
2. The Home screen is just a menu of text links.
3. Answer choices are plain HTML buttons.
4. There is no animated mascot or visual world.
5. Correct feedback is only text ("Correct!").
6. Wrong feedback shames the child (Red text, "Wrong!").
7. The map uses plain numbered circles.
8. Reward is only an alert box or simple modal.
9. There is no central dashboard.
10. The experience feels like a homework worksheet.

### PASS only if:
1. The Home world is a colourful animated place (Dashboard) prioritizing "Start Today's Mission".
2. The game loop provides instant, animated positive feedback for actions.
3. Wrong answers allow gentle retries (e.g., highlighting mouth-shape hints, reducing choices).
4. Map progression feels satisfying (Vowel Beach, Sound Forest, Echo Cave, etc.).
5. Rewards include Stars, Sound Gems, Stickers, or unlockable animations.
6. Question templates vary (Listen and Choose, Sound Match, Build the Sound, Echo Sequence).
7. Audio includes rigorous human-review workflow and metadata.
8. The game feels more like an app platform than a template.

## Child UX Rules
- Text must be minimal. The child should understand through visuals and audio.
- The next action must always be obvious (largest button).
- All interactive elements must be large and touch-friendly for tablets.
- Keep the Daily Mission under 5-8 minutes.
- Brain games should be short (1-3 minutes) and locked behind daily learning completion.

## Parent/Teacher UX Rules
- Provide clear reports on daily completion, weak sounds, mastered sounds, and confused pairs.
- First-attempt accuracy is tracked separately from final correctness.
- Support an Assignment mode.

## Audio Review System Rules
- Every audio segment must have review metadata (sound_id, label, start time, end time, human review status).
- Start time = visual target start time. End time = final tail of the target segment.
- Only approved audio enters production learning.

## File Structure Convention (Example)
```
/src/app
/src/screens
/src/components
/src/game
/src/audio
/src/data
/src/animations
/src/rewards
/src/reports
/src/admin
/src/tests
```
