# Analysis & Design Proposal: SoundBalloonPop Mini-Game

## Overview
This report proposes the design and implementation strategy for the new mini-game: **Sound Balloon Pop** (`src/games/SoundBalloonPop.jsx`). It is integrated into the existing Phonics Game framework alongside `SoundCatcher` and `MemoryMatch`. The game challenges children to identify letter sounds by popping balloon shapes labeled with target sounds floating upwards from the bottom of the screen.

---

## 1. Balloon Pop Mechanics

### 1.1 Core Game Flow
- **Ticket Check & Deduction**: On load, the game checks if the player has at least 1 ticket. If so, a ticket is consumed, and the game starts. Otherwise, the player is routed back to `/braingames`.
- **Target Sound Selection**: The game selects a random target sound from `questionEngine.sounds`.
- **Initial Prompt**: The audio engine plays the target sound immediately when the game begins.
- **Spawner Loop**: A background spawner adds balloons to the screen periodically.
- **Goal**: Reach a score of **10 correct pops** to win the game. On win, an interactive celebration is displayed, and the player is returned to the Brain Games Island selector screen.
- **Interactive Replay**: A large prominent button at the top center allows repeating the target sound at any time.

### 1.2 Escalating Difficulty (Dynamic Spawning & Speed)
To keep the game challenging and engaging:
- **Spawn Interval Decay**: Balloons spawn faster as the score increases.
  `spawnRate = Math.max(700, 2000 - (score * 120))` (ms).
- **Float Speed Acceleration**: Balloons rise faster as the score increases.
  `floatSpeed = Math.max(3.5, 7 - (score * 0.3))` (seconds for a balloon to traverse the screen).

### 1.3 Choice & Pop Logic
- Each spawned balloon is designated as either a **correct choice** (target sound) or **incorrect choice** (distractor).
- **Correct Choice**:
  - The score is incremented.
  - The combo counter is incremented.
  - A correct feedback audio chime (`assets/correct_chime.mp3`) is played.
  - The popped balloon plays its pop animation, and all active balloons are cleared.
  - A new target sound is chosen from the curriculum pool and played to prevent visual guessing exploits.
- **Incorrect Choice**:
  - The combo counter resets to 0.
  - The distractor sound's audio url (or the synth `'error'` sound) is played as corrective feedback.
  - The popped balloon plays its pop animation. The rest of the balloons remain on-screen.

---

## 2. Audio Engine Integration
The mini-game interacts with the custom Web Audio API-based `AudioEngine` to provide zero-latency tactile feedback.

### 2.1 Key Methods Used
- `audioEngine.play(url)`: Plays target sounds and distractor sounds.
- `audioEngine.playUI('pop')`: Synthesizes a sine wave balloon pop sound on clicking a balloon.
- `audioEngine.playUI('error')`: Synthesizes a square wave error sound on incorrect selection.
- `audioEngine.stop()`: Stops active audio tracks immediately (called on component unmount to prevent leaks).

### 2.2 Audio Playback Flow
1. **Target Pronunciation**: Called via `audioEngine.play(targetSound.audio_url)`.
2. **Correct feedback**: Play a synthesizer `'pop'` UI sound: `audioEngine.playUI('pop')`, then chain with a success chime: `audioEngine.play('assets/correct_chime.mp3')`.
3. **Incorrect feedback**: Play a synthesizer `'error'` UI sound: `audioEngine.playUI('error')` (or target sound audio for reinforcement).

---

## 3. Ticket Handling & React 18 StrictMode Guard

### 3.1 StrictMode Double-Effect Issue
In React 18 development, `React.StrictMode` deliberately mounts, unmounts, and remounts components, running all `useEffect` hooks twice. In a naive implementation, this causes the game to call the `useTicket()` state action twice, deducting two tickets instead of one when the component first renders.

### 3.2 The `hasInitializedRef` Guard
To prevent double ticket consumption, we implement a persistent reference guard using `React.useRef`. The component instance is preserved across the StrictMode simulated remount.

```javascript
const hasInitializedRef = React.useRef(false);

useEffect(() => {
  if (hasInitializedRef.current) return;

  if (!isPlaying && tickets > 0) {
    hasInitializedRef.current = true; // Set guard flag immediately
    useTicket(); // Deduct exactly 1 ticket
    setIsPlaying(true);
    // Initialize target sound ...
  } else if (!isPlaying) {
    navigate('/braingames'); // No tickets, eject
  }

  return () => {
    audioEngine.stop();
  };
}, [isPlaying, tickets, navigate, useTicket]);
```

- **First effect execution**: `hasInitializedRef.current` is `false`. It goes into the block, flips the ref to `true`, calls `useTicket()`, and schedules state updates.
- **Simulated cleanup/re-run**: `useEffect` runs again. It sees `hasInitializedRef.current` is `true` and returns immediately without running the inner block.
- **Genuine unmount/remount** (e.g. user leaves page and comes back): The component is completely destroyed. A new component instance is created, resetting `hasInitializedRef` to `false`, which correctly permits ticket consumption for the new game.

---

## 4. UX & CSS-Based Animations
The balloon pop game relies heavily on CSS keyframes to create a playful, physics-based environment.

### 4.1 Balloon Component Styling
Each balloon is structured using a custom SVG containing:
- An egg-shaped path for the balloon body.
- A triangular polygon representing the bottom knot.
- A wavy SVG path showing the trailing balloon string.
- A highlight gradient overlay giving the balloon a glossy, 3D reflection.

### 4.2 CSS Keyframes

```css
/* Float Balloons Upwards */
@keyframes rise {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-120vh); opacity: 0; }
}

/* Horizontal Swaying / Wobble (Simulates air currents) */
@keyframes sway {
  0% { transform: translateX(-15px) rotate(-3deg); }
  100% { transform: translateX(15px) rotate(3deg); }
}

/* Balloon Burst / Pop animation */
@keyframes balloon-pop {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35) rotate(5deg); opacity: 0.5; }
  100% { transform: scale(1.7); opacity: 0; }
}

/* Pulse effect for Target Play button */
@keyframes pulse-glow {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}
```

- Balloons use `pointer-events: none` once clicked to prevent double-clicks during the pop animation.
- A combination of different colors is randomly assigned to balloons to make the screen visually stimulating.

---

## 5. Proposed Implementation Strategy

### 5.1 Route Registration (`src/App.jsx`)
Insert the route in the router configuration:
```javascript
import SoundBalloonPop from './games/SoundBalloonPop'
...
<Route path="/games/soundballoonpop" element={<SoundBalloonPop />} />
```

### 5.2 Island Screen Integration (`src/screens/BrainGamesIsland.jsx`)
Add the play handler and UI card matching the existing design system:
```javascript
const handlePlaySoundBalloonPop = () => {
  if (tickets > 0) {
    navigate('/games/soundballoonpop');
  }
};
```
Add the card in the game list grid using a balloon emoji (🎈) and a warm theme color (orange/amber):
```jsx
{/* Sound Balloon Pop Card */}
<div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #fed7aa', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎈</div>
  <h2 style={{ color: '#ea580c', marginBottom: '1rem' }}>Balloon Pop</h2>
  <p style={{ color: '#f97316', textAlign: 'center', marginBottom: '2rem' }}>Pop the balloons matching the sound!</p>
  <button 
    className="btn-primary" 
    style={{ background: tickets > 0 ? '#f97316' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #ea580c' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
    onClick={handlePlaySoundBalloonPop}
    disabled={tickets <= 0}
  >
    {tickets > 0 ? 'Play (1 🎟️)' : 'Need Tickets'}
  </button>
</div>
```

---

## 6. Proposed Code: `src/games/SoundBalloonPop.jsx`
Below is the draft component file:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { questionEngine } from '../game/QuestionEngine';
import { audioEngine } from '../audio/AudioEngine';

const BALLOON_COLORS = [
  '#f87171', // soft red
  '#60a5fa', // soft blue
  '#34d399', // soft green
  '#fbbf24', // soft yellow
  '#a78bfa', // soft purple
  '#f472b6', // soft pink
  '#fb923c', // soft orange
  '#2dd4bf', // soft teal
];

// Reusable SVG Balloon Component
function GameBalloon({ letter, isPopping, color, onClick }) {
  return (
    <div 
      className={`balloon-container ${isPopping ? 'popping' : ''}`} 
      style={{ cursor: 'pointer', width: '100%', height: '100%' }}
      onClick={onClick}
    >
      <svg viewBox="0 0 100 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g className="balloon-body" style={{ transformOrigin: '50px 70px' }}>
          {/* Balloon string */}
          <path d="M 50 110 Q 45 135, 50 160" fill="none" stroke="#94a3b8" strokeWidth="2" />
          
          {/* Balloon knot */}
          <polygon points="46,110 54,110 50,102" fill={color} stroke="#64748b" strokeWidth="1" />
          
          {/* Balloon shape */}
          <path 
            d="M 50 10 C 20 10, 20 90, 50 110 C 80 90, 80 10, 50 10 Z" 
            fill={color} 
            stroke="#475569" 
            strokeWidth="1.5" 
          />
          
          {/* Highlight Gloss */}
          <path d="M 35 25 C 27 33, 27 50, 31 60 A 3 3 0 0 1 26 55 C 22 45, 22 33, 30 25 A 3 3 0 0 1 35 25 Z" fill="#ffffff" opacity="0.4" />
          
          {/* Phonics label */}
          <text 
            x="50" 
            y="65" 
            fontFamily="'Arial', sans-serif" 
            fontSize="32" 
            fontWeight="bold" 
            fill="#ffffff" 
            textAnchor="middle"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}
          >
            {letter}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function SoundBalloonPop() {
  const navigate = useNavigate();
  const { tickets, useTicket } = useGameStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [targetSound, setTargetSound] = useState(null);
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const hasPlayedRef = useRef(false);
  const lastXRef = useRef(50);
  const hasInitializedRef = useRef(false);

  // 1. StrictMode Guarded Initialization
  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (!isPlaying && tickets > 0) {
      hasInitializedRef.current = true;
      useTicket();
      setIsPlaying(true);
      
      const pool = [...questionEngine.sounds].sort(() => Math.random() - 0.5);
      const target = pool[0];
      setTargetSound(target);

      if (!hasPlayedRef.current) {
        audioEngine.play(target.audio_url).catch(() => {});
        hasPlayedRef.current = true;
      }
    } else if (!isPlaying) {
      navigate('/braingames');
    }

    return () => audioEngine.stop();
  }, [isPlaying, tickets, useTicket, navigate]);

  // 2. Balloon Spawner Loop with Dynamic Difficulty
  useEffect(() => {
    if (!isPlaying || !targetSound || isWon) return;

    let balloonId = 0;
    const spawnRate = Math.max(700, 2000 - (score * 120));

    const interval = setInterval(() => {
      if (document.hidden) return;

      setBalloons(prev => {
        // Distractor calculation probability increases slightly with score
        const isCorrect = Math.random() > (0.4 + (score * 0.02));
        
        const soundObj = isCorrect
          ? targetSound
          : questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)[
              Math.floor(Math.random() * (questionEngine.sounds.length - 1))
            ];

        // Unique X coordinate layout to avoid visual stacking
        let newX = Math.random() * 80 + 10;
        while (Math.abs(newX - lastXRef.current) < 18) {
          newX = Math.random() * 80 + 10;
        }
        lastXRef.current = newX;

        const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
        const speed = Math.max(3.5, 7 - (score * 0.3));

        return [...prev, {
          id: balloonId++,
          label: soundObj.label,
          audioUrl: soundObj.audio_url,
          isCorrect,
          color,
          speed,
          x: newX,
          createdAt: Date.now()
        }];
      });
    }, spawnRate);

    return () => clearInterval(interval);
  }, [isPlaying, targetSound, score, isWon]);

  // 3. Cleanup Out of Bounds Balloons
  useEffect(() => {
    if (!isPlaying || isWon) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setBalloons(prev => prev.filter(b => now - b.createdAt < (b.speed * 1000 + 500)));
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [isPlaying, isWon]);

  // 4. Click Handler: Balloon Pop
  const handlePop = (balloon) => {
    // Immediate audio feed
    audioEngine.playUI('pop');

    // Trigger pop state for class animation
    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isPopping: true } : b));

    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));
    }, 300);

    if (balloon.isCorrect) {
      setScore(s => {
        const newScore = s + 1;
        if (newScore >= 10) {
          setIsWon(true);
          setTimeout(() => navigate('/braingames'), 3500); // 3.5s delay to celebrate
        }
        return newScore;
      });
      setCombo(c => c + 1);

      audioEngine.play('assets/correct_chime.mp3').catch(() => {}).finally(() => {
        if (score + 1 < 10) {
          const pool = questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id);
          const newTarget = pool[Math.floor(Math.random() * pool.length)];
          setTargetSound(newTarget);
          setBalloons([]); // Clear screen for new target
          setTimeout(() => audioEngine.play(newTarget.audio_url).catch(() => {}), 400);
        }
      });
    } else {
      setCombo(0);
      audioEngine.playUI('error');
      // reinforcement audio playback
      if (balloon.audioUrl) {
        setTimeout(() => audioEngine.play(balloon.audioUrl).catch(() => {}), 200);
      }
    }
  };

  if (!isPlaying || !targetSound) return null;

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to top, #ffedd5, #fffff0)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background clouds */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '5rem', opacity: 0.2, animation: 'sway 8s infinite alternate' }}>☁️</div>
      <div style={{ position: 'absolute', top: '35%', right: '15%', fontSize: '4rem', opacity: 0.15, animation: 'sway 6s infinite alternate-reverse' }}>☁️</div>

      {/* Header Bar */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <button className="btn-secondary" style={{ padding: '0.5rem', background: 'white' }} onClick={() => {
          if (window.confirm("Quit game? You will lose your ticket!")) navigate('/braingames');
        }}>
          <X size={24} />
        </button>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {combo > 2 && (
             <div style={{ background: '#f97316', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', animation: 'popIn 0.3s', boxShadow: '0 4px 0 #ea580c' }}>
               🔥 {combo} Combo!
             </div>
          )}
          <div style={{ background: 'white', padding: '0.5rem 2rem', borderRadius: '100px', fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c', boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}>
            Score: {score} / 10
          </div>
        </div>
      </div>

      {/* Target Sound Box */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', zIndex: 20 }}>
        <button 
          onClick={() => audioEngine.play(targetSound.audio_url)}
          style={{
            width: '90px', height: '90px', borderRadius: '50%', background: '#fb923c',
            color: 'white', border: '4px solid white', boxShadow: '0 6px 0 #ea580c',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            animation: 'pulse-glow 2s infinite'
          }}
        >
          <Volume2 size={40} />
        </button>
        <h2 style={{ color: '#7c2d12', marginTop: '1rem', textShadow: '1px 1px 0 white', fontSize: '2.2rem', fontWeight: 'bold' }}>
          {isWon ? '🎉 Fantastic! 🎉' : 'Pop the sound:'}
        </h2>
      </div>

      {/* Win Celebration Graphic */}
      {isWon && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 255, 255, 0.4)' }}>
           <div style={{ fontSize: '10rem', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>🎈🏆🎉</div>
        </div>
      )}

      {/* Balloons Layer */}
      {score < 10 && balloons.map(balloon => (
        <div
          key={balloon.id}
          style={{
            position: 'absolute',
            left: `${balloon.x}%`,
            bottom: '-160px',
            width: '120px',
            height: '170px',
            animation: `rise ${balloon.speed}s linear forwards, sway 2.5s ease-in-out infinite alternate`,
            pointerEvents: balloon.isPopping ? 'none' : 'auto'
          }}
        >
          <GameBalloon
            letter={balloon.label}
            isPopping={balloon.isPopping}
            color={balloon.color}
            onClick={() => { if (!balloon.isPopping) handlePop(balloon); }}
          />
        </div>
      ))}

      {/* Injected Styles */}
      <style>{`
        @keyframes rise {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-130vh); opacity: 0; }
        }
        @keyframes sway {
          0% { transform: translateX(-15px) rotate(-3deg); }
          100% { transform: translateX(15px) rotate(3deg); }
        }
        .balloon-body {
          transition: transform 0.1s ease-out;
        }
        .balloon-container.popping .balloon-body {
          animation: balloon-pop 0.3s ease-out forwards;
        }
        @keyframes balloon-pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35) rotate(5deg); opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.6); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(251, 146, 60, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
```
