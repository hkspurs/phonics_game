# Phonics Learning Platform — Product Specification

## 1. Product Vision
A daily phonics learning app for six-year-old children that feels like a real education platform (inspired by KooBits), not a normal AI-generated HTML quiz. 
**Core Philosophy**: Daily phonics practice should feel like a small adventure, not homework.

## 2. Target Users
- **Primary**: Six-year-old child learning phonics. Needs a simple, visual, audio-guided, colourful, animated, and forgiving interface.
- **Secondary**: Parents and teachers. Need to understand progress quickly (weak sounds, mastered sounds, improving trends, actionable insights).
- **Tertiary**: Content/QA reviewers. Need to ensure audio accuracy (start/end timing, preserved consonants).

## 3. Core App Modules
1. **Subject Gateway**: A vibrant entry screen directing children to either `Phonics Forest` or `Math Kingdom`.
2. **Home World (Dashboard)**: A colourful animated place prioritizing "Start Today's Mission". Contains hidden Parent Gate.
3. **Daily Challenges**: Short 10-question practice sessions (Phonics and Math) based on adaptive learning.
4. **Mastery Maps**: Visual maps showing skill statuses. Phonics uses vowel families; Math uses numerical concepts.
5. **Math Training Gym**: An endless, procedurally generated practice arena targeting the child's weakest math skills.
6. **Assignments**: Teacher/parent tasks that override the daily mission queue when active.
7. **Reward Room**: Visual tracking of earned stars, sound gems, stickers, and badges.
8. **Brain Games**: Listening and memory mini-games. **Strictly locked** behind a `hasCompletedDaily` flag.
9. **Reports (Parent Dashboard)**: PIN-gated dashboard showing accuracy, weak skills, confused pairs, and curriculum controls (Reset, Assign, Force Unlock).
10. **Audio Data System**: Multi-channel `AudioEngine` with parallel preloading, and a strict 105-sound JSON metadata file pre-filtered by `human_review_status = approved`.

## 4. Reward Rules
Rewards give children a reason to return, without utilizing gambling patterns or loot boxes.
- **First-attempt correct**: 3 stars, 5 gems.
- **Correct on retry**: 1 star, 2 gems (Encourages trying again without harsh punishment).
- **Complete daily mission**: Daily badge, unlocks 2 Brain Game tickets.
- **5-day streak**: Special sticker or mascot accessory.
- **Master a sound family**: Unlock room decoration.
- **Complete assignment**: Special Teacher Owl badge.

## 5. Core User Journey
1. Open app -> Animated mascot greeting.
2. Home dashboard shows today's main mission.
3. Tap "Start Daily Sound Challenge" (biggest button).
4. Complete 10 adaptive phonics questions with instant, animated feedback.
5. Receive daily reward and unlock Brain Game tickets.
6. Progress map updates; weak sounds are added to tomorrow's queue.
7. (Optional) Play 1-2 short Brain Games.
8. Parent checks dashboard for progress.
