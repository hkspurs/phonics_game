# Phonics Learning Platform 🦉

A premium, daily phonics learning application designed specifically for 6-year-old children. Inspired by top-tier ed-tech platforms, this app transforms phonics practice from "boring homework" into a vibrant, bite-sized daily adventure.

## 🌟 Key Features

*   **Adaptive Daily Challenges:** A core 10-question loop that dynamically adjusts to the child's learning history, focusing on weak sounds while introducing new concepts linearly.
*   **Child-First Psychology UI:** No harsh "Wrong!" text or red crosses. The app uses gentle process-of-elimination mechanics and positive micro-animations (sparkles, mascots) to build confidence.
*   **Parent & Teacher Dashboard (PIN Protected):** A hidden analytics screen that tracks exact accuracies, identifies "Confused Pairs" (e.g., mixing up AB and EB), and allows teachers to assign specific sound practice.
*   **Robust Audio Engine:** Preloads audio, handles multi-channel playback (SFX + Voice), and enforces strict metadata validation to ensure children only hear human-approved pronunciations.
*   **Bulletproof State Persistence:** Built with Zustand's local storage engine, featuring schema versioning, bloat protection, and strict UTC-timezone resets to prevent cheating.

## 🛠️ Tech Stack

*   **Frontend Framework:** React (Vite)
*   **State Management:** Zustand (with Persistence)
*   **Styling:** Vanilla CSS (Tailwind-free, using custom bubbly 3D variables for a child-friendly aesthetic)
*   **Icons:** Lucide-React
*   **Routing:** React Router v6

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd phonics_game
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
├── docs/                  # Comprehensive project documentation (Specs, Designs)
├── src/
│   ├── audio/             # Multi-channel Audio Engine
│   ├── components/        # Reusable UI components
│   ├── game/              # Question Engine and Generation Logic
│   ├── screens/           # Main Views (Home, DailyChallenge, ParentDashboard)
│   ├── store/             # Zustand Game Store (gameStore.js)
│   └── index.css          # Global CSS and Animation Keyframes
├── data/
│   └── sounds.json        # The 105-sound dataset with human_review_status
└── public/
    └── assets/            # MP3 audio files and static assets
```

## 📚 Documentation

For deep dives into the platform's architecture and design philosophy, please refer to the `/docs` folder:
*   [Product Spec](./docs/PRODUCT_SPEC.md)
*   [Game Design & Algorithms](./docs/GAME_DESIGN.md)
*   [MVP Scope](./docs/MVP_SCOPE.md)
*   [Screen & Flow List](./docs/SCREEN_LIST.md)
*   [Audio Review Report](./docs/AUDIO_REVIEW_REPORT.md)
