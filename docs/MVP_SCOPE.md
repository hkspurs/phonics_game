# Phonics Learning Platform — MVP Scope

The goal of the Minimum Viable Product (MVP) is to prove the core learning loop, ensure the architecture is sound (React/Vue + State Management), and validate that the app avoids the "generic AI template" trap.

## In Scope for MVP (Phase 1 & 2 - Completed)

### 1. Core Architecture
- Component-based frontend framework setup (React/Vite).
- State management setup (Zustand) with `versioning`, `migrate`, and optimized `partialize` to prevent LocalStorage bloat.
- Strict UTC timezone anchoring for daily resets to prevent time-travel exploits.
- React Router configuration including protected entry points.

### 2. Child Interface
- **Home Dashboard**: Animated background, working "Start Daily Challenge" button.
- **Daily Sound Challenge**: The 10-question adaptive loop.
- **Question Templates (3 minimum)**:
  1. Listen and Choose (Standard)
  2. Same or Different (Comparison)
  3. Boss Question (Animated finale)
- **Feedback System**: Complete visual feedback loops for correct/wrong answers (no text-only feedback).
- **Reward Screen**: End-of-mission celebration, basic Star/Gem counting.

### 3. Learning Data & Content
- **Sound Families**: Implemented 105 total sounds with strict human-reviewed `approved` metadata filtering.
- **Learning Analytics State (`learningStats`)**: Track `attempts`, `firstAttemptHits`, and `confusedWith` dictionary to capture deep learning data rather than superficial game scores.
- **Adaptive Algorithm**: Question engine strictly isolates Daily Challenges from Assignments. Randomizes the first 8 questions to prevent pattern recognition. Boss questions dynamically scale to 5 choices for higher difficulty.

### 4. Audio Pipeline
- **Audio Review Metadata**: Data structure implementation for audio start/end times and human review status. (MVP can use a static JSON file for this, rather than a full CMS).

### 5. Parent & Teacher Dashboard
- **Analytics**: Deep reporting on Weak Sounds, Mastered Sounds (>=90%), and Confused Pairs.
- **Curriculum Control**: Manual audio previews, direct Assignments override, and Map node force-unlocks.
- **Security**: Hidden UI entry point protected by a PIN gate. Nuclear Factory Reset option included.

## Out of Scope for MVP (Pushed to V3)

- **Backend / Database**: MVP uses LocalStorage. Full cloud sync and database architecture are V3.
- **Brain Games**: Mini-games are complex to build and distract from the core loop validation. V3 feature.
- **Reward Room (Stickers/Decorations)**: MVP simply counts Stars/Gems. A full inventory/dress-up system is V3.
- **Audio Admin Tool**: The actual waveform review UI for admins is V3. (For MVP, we use python data scripts).
- **Complex Animations (Lottie/PixiJS)**: MVP relies on high-quality CSS keyframes and SVG transitions (e.g. Sparkles, Fade outs). Heavy game engines are V3.
- **Complex Animations (Lottie/PixiJS)**: MVP will rely on high-quality CSS keyframes and SVG transitions. Heavy game engines are V2.
