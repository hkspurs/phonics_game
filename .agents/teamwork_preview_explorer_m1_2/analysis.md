# Design & Implementation Strategy: Phonics Sound Balloon Pop Mini-Game

## Executive Summary
This report outlines the technical design, architectural integration, and UX strategy for the new **Sound Balloon Pop** mini-game (`src/games/SoundBalloonPop.jsx`). It introduces a vertical-scrolling, physics-inspired phonics game that reinforces phoneme-grapheme matching through interactive audio feedback, state-managed progress, and child-friendly animations.

---

## 1. Game Mechanics: Sound Balloon Pop
The mini-game introduces a dynamic, vertical-scrolling gameplay loop designed to test and reinforce auditory discrimination.

### Core Gameplay Loop
1. **Target Generation**: The game selects a random approved phonics sound from the `questionEngine.sounds` curriculum array.
2. **Audio Prompt**: The target phoneme is played automatically via the audio engine. The speaker button at the top pulses to indicate it can be clicked to repeat the sound.
3. **Balloon Spawning**: Balloons containing letter labels (e.g., "AB", "EB") float upward from the bottom of the screen.
   - **Target Balloon**: Contains the label matching the target sound.
   - **Distractor Balloons**: Contain labels of other sounds randomly selected from the available curriculum pool.
4. **Player Interaction**:
   - **Correct Pop**: Popping the target balloon triggers a visual pop animation, a synthetic pop sound effect (`audioEngine.playUI('pop')`), an incremental chime (`assets/correct_chime.mp3`), a score increase, and a combo counter increment. If the score is less than 10, the active balloons are cleared, a new target sound is chosen, and the next round begins.
   - **Incorrect Click**: Clicking a distractor balloon triggers an error buzzer sound (`audioEngine.playUI('error')`) and immediately plays that distractor's specific phoneme (e.g., "EB") to provide active corrective feedback. The distractor balloon shakes horizontally, and the combo counter resets. To maintain a low-friction, positive learning environment, there is no score penalty.
5. **Win Condition**: Reaching a score of 10 completes the game. A win screen overlay appears showing a large trophy (🏆) with canvas confetti (`ConfettiSVG`), and the player is navigated back to the selection screen (`/braingames`) after a 4-second delay.

### Escalate Difficulty (Dynamic Balancing)
To keep the game challenging and prevent cognitive fatigue:
* **Escalating Speed**: The vertical floating speed of the balloons increases as the player's score increases.
* **Distractor Density**: The ratio of target balloons to distractor balloons decreases slightly over time.
* **Collision Guard**: A spatial guard prevents consecutive balloons from spawning at similar X coordinates, avoiding overlapping balloons.

---

## 2. Integration with Audio/Sounds Engine
The game connects directly with the unified Web Audio API wrapper `audioEngine` in `src/audio/AudioEngine.js`.

### Key Audio APIs
* **Preloading Assets**: The game collects a list of sound assets and preloads them at start-up to prevent fetch delays during active gameplay:
  ```javascript
  audioEngine.preload(pool.map(s => s.audio_url));
  ```
* **Phoneme Playback**: Played automatically on target rotation and manual replay:
  ```javascript
  audioEngine.play(targetSound.audio_url);
  ```
* **Corrective Audio Feedback**: Plays when the user taps an incorrect balloon, ensuring they hear the sound of the letter they clicked:
  ```javascript
  audioEngine.play(balloon.audioUrl);
  ```
* **Synthesized Audio Effects**:
  - Pop Effect: `audioEngine.playUI('pop')`
  - Error Buzzer: `audioEngine.playUI('error')`
  - Correct Chime: `audioEngine.play('assets/correct_chime.mp3')`
* **Lifecycle Cleanup**: When the component unmounts, any playing audio is stopped to avoid overlapping sound loops on navigation:
  ```javascript
  return () => audioEngine.stop();
  ```

---

## 3. Ticket Management & React 18 StrictMode Guard
The game consumes exactly **1 ticket** per play session, managed via the global Zustand store `useGameStore`.

### Ticket Consumption
* On component mount, the game checks if the user has `tickets > 0`. If not, they are redirected back to the `/braingames` selection screen.
* If a ticket is available, exactly 1 ticket is deducted using the store action `useTicket()`.
* **Quit Confirmation**: If the user exits mid-game via the exit button, a confirmation dialog pops up: `"Quit game? You will lose your ticket!"` to prevent accidental losses.

### React 18 StrictMode Ticket-use Guard
In development, React 18 StrictMode mounts, unmounts, and mounts components again to verify effect cleanups. Without a guard, this causes a double invocation of the mount `useEffect`, deducting **2 tickets** instead of 1.

To protect the player's ticket balance, a combination of a mutable ref (`hasInitializedRef`) and local state (`isPlaying`) is used:
```javascript
const hasInitializedRef = useRef(false);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => {
  if (hasInitializedRef.current) return;

  if (!isPlaying && tickets > 0) {
    hasInitializedRef.current = true;
    useTicket(); // Deducts exactly 1 ticket in Zustand store
    setIsPlaying(true);
    // Game initialization logic (select targets, preload sounds, etc.)
  } else if (!isPlaying) {
    navigate('/braingames');
  }
  
  return () => audioEngine.stop();
}, [isPlaying, tickets, navigate, useTicket]);
```

#### Why it Works:
1. **Ref Mutability**: `hasInitializedRef.current` is updated synchronously inside the effect block.
2. **Persistence Across Double Mount**: When React 18 StrictMode unmounts and remounts the component in development, it preserves the component state and ref instance.
3. **Execution Skip**: On the second execution of the effect, `hasInitializedRef.current` is already `true`. The early return `if (hasInitializedRef.current) return;` triggers, skipping the `useTicket()` invocation and protecting the ticket balance.

---

## 4. UX and CSS-Based Animations
Visual polish is achieved through custom SVG layouts and clean, hardware-accelerated CSS animations declared inside an inline `<style>` block.

### Visual Components
* **Balloons**: Rendered as inline SVGs consisting of an elliptical balloon body (`ellipse`), a triangular knot (`polygon`), a wavy string (`path` with cubic Bezier curves), gloss highlights, and a bold text label.
* **Mascot Integration**: Incorporates the custom `MascotRabbit` component. The mascot's state changes contextually:
  - **Listening**: Animate ears/face when the target sound is playing.
  - **Correct/Celebration**: The mascot jumps and smiles when a correct balloon is popped.
  - **Incorrect/Sad**: The mascot shows a disappointed/thinking expression when a wrong balloon is selected.

### CSS Keyframes
1. **Floating Rise (`floatUp`)**: Moves the balloon vertically from below the viewport (`top: 110%`) to above the top edge (`top: -20%`).
   ```css
   @keyframes floatUp {
     0% { top: 110%; opacity: 0; }
     10% { opacity: 1; }
     90% { opacity: 1; }
     100% { top: -20%; opacity: 0; }
   }
   ```
2. **Sway Wobble (`floatWobble`)**: Applies a gentle side-to-side translation and tilt to simulate floating in the air.
   ```css
   @keyframes floatWobble {
     0% { transform: translateX(-15px) rotate(-3deg); }
     100% { transform: translateX(15px) rotate(3deg); }
   }
   ```
3. **Pop Scale (`popBalloon`)**: Rapidly expands and fades out the balloon on click.
   ```css
   @keyframes popBalloon {
     0% { transform: scale(1); opacity: 1; }
     50% { transform: scale(1.3); opacity: 0.5; }
     100% { transform: scale(0); opacity: 0; }
   }
   ```
4. **Horizontal Shake (`shake`)**: Shakes the balloon horizontally if a wrong choice is clicked.
   ```css
   @keyframes shake {
     0%, 100% { transform: translateX(0); }
     20%, 60% { transform: translateX(-10px); }
     40%, 80% { transform: translateX(10px); }
   }
   ```

### Animation Event Cleanup (Refined UX)
Rather than using fragile `setTimeout` timers to clean up balloon states, the game utilizes React's `onAnimationEnd` event to clean up floated or popped balloons. This prevents memory leaks and stale state references:
```javascript
const handleAnimationEnd = (e, balloon) => {
  if (e.animationName === 'floatUp' || e.animationName === 'popBalloon') {
    setBalloons(prev => prev.filter(b => b.id !== balloon.id));
  }
};
```

---

## 5. Integration Strategy & Router Changes

### 5.1 Route Registration (`src/App.jsx`)
Register the route in the main app routes layout:
```jsx
// Import the component
import SoundBalloonPop from './games/SoundBalloonPop'

// Insert the Route element inside <Routes>
<Route path="/games/soundballoonpop" element={<SoundBalloonPop />} />
```

### 5.2 Selection Screen Update (`src/screens/BrainGamesIsland.jsx`)
Add a play card for the Balloon Pop game:
```jsx
const handlePlaySoundBalloonPop = () => {
  if (tickets > 0) {
    navigate('/games/soundballoonpop')
  }
}

// Inside the return layout, adjacent to the other games:
<div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #bae6fd', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎈</div>
  <h2 style={{ color: '#0369a1', marginBottom: '1rem' }}>Balloon Pop</h2>
  <p style={{ color: '#0284c7', textAlign: 'center', marginBottom: '2rem' }}>Pop the balloons that match the sound!</p>
  <button 
    className="btn-primary" 
    style={{ background: tickets > 0 ? '#0284c7' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #0369a1' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
    onClick={handlePlaySoundBalloonPop}
    disabled={tickets <= 0}
  >
    {tickets > 0 ? 'Play (1 🎟️)' : 'Need Tickets'}
  </button>
</div>
```

---

## 6. Complete Proposed Implementation
The complete React 18 component code is structured below. It is self-contained, preloads resources, handles layout-responsive grid systems, and integrates the mascot feedback.

```jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'
import ConfettiSVG from '../components/ConfettiSVG'
import MascotRabbit from '../components/MascotRabbit'

export default function SoundBalloonPop() {
  const navigate = useNavigate()
  const { tickets, useTicket } = useGameStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [targetSound, setTargetSound] = useState(null)
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isWon, setIsWon] = useState(false)
  
  // Mascot feedback states
  const [mascotState, setMascotState] = useState(null) // null | 'correct' | 'wrong'
  const [mascotListening, setMascotListening] = useState(false)

  const hasPlayedRef = useRef(false)
  const lastXRef = useRef(50)
  const hasInitializedRef = useRef(false)
  const audioPlayTimeoutRef = useRef(null)

  // 1. Initial mounting and ticket guard
  useEffect(() => {
    if (hasInitializedRef.current) return

    if (!isPlaying && tickets > 0) {
      hasInitializedRef.current = true
      useTicket()
      setIsPlaying(true)
      
      const pool = [...questionEngine.sounds].sort(() => Math.random() - 0.5)
      const target = pool[0]
      setTargetSound(target)

      // Preload a subset of sounds to optimize local asset caching
      audioEngine.preload(pool.slice(0, 10).map(s => s.audio_url))

      if (!hasPlayedRef.current) {
        setMascotListening(true)
        audioEngine.play(target.audio_url)
          .catch(() => {})
          .finally(() => setMascotListening(false))
        hasPlayedRef.current = true
      }
    } else if (!isPlaying) {
      navigate('/braingames')
    }
    
    return () => {
      audioEngine.stop()
      if (audioPlayTimeoutRef.current) clearTimeout(audioPlayTimeoutRef.current)
    }
  }, [])

  // 2. Balloon Spawner Loop (Dynamic Difficulty and Collision Guard)
  useEffect(() => {
    if (!isPlaying || !targetSound || isWon) return

    let balloonId = 0
    // Speeds up spawn rate from 2s down to 800ms as score increases
    const spawnRate = Math.max(800, 2000 - (score * 120))

    const interval = setInterval(() => {
      if (document.hidden) return

      setBalloons(prev => {
        // Probability of correct targets decreases slightly as score increases to raise difficulty
        const isCorrect = Math.random() > (0.45 + (score * 0.02))
        
        let soundObj
        if (isCorrect) {
          soundObj = targetSound
        } else {
          const distractors = questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)
          soundObj = distractors[Math.floor(Math.random() * distractors.length)]
        }

        const now = Date.now()
        // Active filter backup (primarily handled by onAnimationEnd)
        const activeBalloons = prev.filter(b => now - b.createdAt < 6500)

        // Collision guard: Ensure X coordinate is spaced from the last spawn position
        let newX = Math.random() * 80 + 10
        while (Math.abs(newX - lastXRef.current) < 22) {
          newX = Math.random() * 80 + 10
        }
        lastXRef.current = newX

        return [...activeBalloons, {
          id: balloonId++,
          label: soundObj.label,
          audioUrl: soundObj.audio_url,
          isCorrect,
          createdAt: now,
          x: newX,
          color: getRandomBalloonColor(),
          isPopping: false,
          isShaking: false
        }]
      })
    }, spawnRate)

    return () => clearInterval(interval)
  }, [isPlaying, targetSound, score, isWon])

  const getRandomBalloonColor = () => {
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#f97316']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // 3. Audio Prompter replay trigger
  const handleReplayTargetSound = () => {
    if (isWon) return
    setMascotListening(true)
    audioEngine.play(targetSound.audio_url)
      .catch(() => {})
      .finally(() => setMascotListening(false))
  }

  // 4. Pop event dispatcher
  const handlePop = (balloon) => {
    if (balloon.isPopping) return

    // Set popping animation in state
    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isPopping: true } : b))

    if (balloon.isCorrect) {
      setMascotState('correct')
      setCombo(c => c + 1)
      audioEngine.playUI('pop')
      
      const nextScore = score + 1
      setScore(nextScore)

      if (nextScore >= 10) {
        setIsWon(true)
        audioEngine.play('assets/correct_chime.mp3').catch(() => {})
        setTimeout(() => navigate('/braingames'), 4000)
      } else {
        // Correct answer chime leads into sound transition
        audioEngine.play('assets/correct_chime.mp3').catch(() => {}).finally(() => {
          const newPool = questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)
          const newTarget = newPool[Math.floor(Math.random() * newPool.length)]
          
          setTargetSound(newTarget)
          setBalloons([]) // Reset screen to clear distracting sounds
          setMascotState(null)
          
          audioPlayTimeoutRef.current = setTimeout(() => {
            setMascotListening(true)
            audioEngine.play(newTarget.audio_url)
              .catch(() => {})
              .finally(() => setMascotListening(false))
          }, 500)
        })
      }
    } else {
      setCombo(0)
      setMascotState('wrong')
      audioEngine.playUI('error')
      if (balloon.audioUrl) {
        audioEngine.play(balloon.audioUrl).catch(() => {})
      }
      
      // Trigger horizontal shake feedback on incorrect balloon
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isShaking: true } : b))
      setTimeout(() => {
        setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isShaking: false } : b))
        setMascotState(null)
      }, 1000)
    }
  }

  // 5. Clean up animation states safely using event listeners
  const handleAnimationEnd = (e, balloonId) => {
    if (e.animationName === 'floatUp' || e.animationName === 'popBalloon') {
      setBalloons(prev => prev.filter(b => b.id !== balloonId))
    }
  }

  if (!isPlaying || !targetSound) return null

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to bottom, #bae6fd, #e0f2fe)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decor Clouds */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '4rem', opacity: 0.3, animation: 'floatWobble 6s infinite alternate' }}>☁️</div>
      <div style={{ position: 'absolute', top: '30%', right: '15%', fontSize: '5rem', opacity: 0.25, animation: 'floatWobble 8s infinite alternate-reverse' }}>☁️</div>
      <div style={{ position: 'absolute', bottom: '25%', left: '20%', fontSize: '6rem', opacity: 0.2, animation: 'floatWobble 7s infinite alternate' }}>☁️</div>

      {/* Header Panel */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <button className="btn-secondary" style={{ padding: '0.5rem', background: 'white' }} onClick={() => {
          if (window.confirm("Quit game? You will lose your ticket!")) navigate('/braingames')
        }}>
          <X size={24} />
        </button>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {combo > 2 && (
             <div style={{ background: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', animation: 'popIn 0.3s' }}>
               {combo} Combo! 🔥
             </div>
          )}
          <div style={{ background: 'white', padding: '0.5rem 2rem', borderRadius: '100px', fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
            Score: {score} / 10
          </div>
        </div>
      </div>

      {/* Target Speaker Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem', zIndex: 10, position: 'relative' }}>
        <button 
          onClick={handleReplayTargetSound}
          style={{
            width: '100px', height: '100px', borderRadius: '50%', background: '#0284c7',
            color: 'white', border: '4px solid white', boxShadow: '0 8px 0 #0369a1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            animation: 'pulse-glow 2s infinite'
          }}
        >
          <Volume2 size={48} />
        </button>
        <h2 style={{ color: '#0369a1', marginTop: '1rem', textShadow: '1px 1px 0 white', fontSize: '2.2rem', textAlign: 'center', fontWeight: 'bold' }}>
          {isWon ? '🎉 You Win! 🎉' : 'Pop the matching balloon!'}
        </h2>
      </div>

      {/* Win Celebration */}
      <ConfettiSVG isVisible={isWon} />
      {isWon && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ fontSize: '10rem', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>🏆</div>
        </div>
      )}

      {/* Mascot Integration */}
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', width: '130px', height: '160px', zIndex: 5, pointerEvents: 'none' }}>
        <MascotRabbit feedbackState={mascotState} isListening={mascotListening} />
      </div>

      {/* Balloon Field */}
      {score < 10 && balloons.map(balloon => {
        const balloonClass = `balloon-item ${balloon.isPopping ? 'popping' : ''} ${balloon.isShaking ? 'shaking' : ''}`
        return (
          <div
            key={balloon.id}
            onClick={() => handlePop(balloon)}
            onAnimationEnd={(e) => handleAnimationEnd(e, balloon.id)}
            className={balloonClass}
            style={{
              position: 'absolute',
              left: `${balloon.x}%`,
              width: '100px',
              height: '140px',
              cursor: balloon.isPopping ? 'default' : 'pointer',
              pointerEvents: balloon.isPopping ? 'none' : 'auto',
              // Use dynamic animation speed based on current score
              animation: balloon.isPopping ? 'none' : `floatUp ${Math.max(4.5, 7 - (score * 0.25))}s linear forwards, floatWobble 2s ease-in-out infinite alternate`
            }}
          >
            <svg viewBox="0 0 100 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <g>
                {/* Balloon string */}
                <path d="M 50 100 Q 45 115 50 130 T 48 140" fill="none" stroke="#64748b" strokeWidth="2" />
                {/* Connection knot */}
                <polygon points="46,100 54,100 50,94" fill={balloon.color} />
                {/* Main balloon body */}
                <ellipse cx="50" cy="55" rx="40" ry="45" fill={balloon.color} stroke="#ffffff" strokeWidth="2" />
                {/* Gloss highlights */}
                <path d="M 25 35 A 30 35 0 0 1 75 35 A 25 30 0 0 0 25 35 Z" fill="#ffffff" opacity="0.4" />
                <circle cx="70" cy="70" r="4" fill="#ffffff" opacity="0.4" />
                {/* Text Label */}
                <text x="50" y="62" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#ffffff" textAnchor="middle" stroke="#475569" strokeWidth="1">
                  {balloon.label}
                </text>
              </g>
            </svg>
          </div>
        )
      })}

      {/* Embedded CSS Animations */}
      <style>{`
        .balloon-item {
          transform-origin: center bottom;
          will-change: transform, top, opacity;
        }
        @keyframes floatUp {
          0% { top: 110%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: -20%; opacity: 0; }
        }
        @keyframes floatWobble {
          0% { transform: translateX(-15px) rotate(-3deg); }
          100% { transform: translateX(15px) rotate(3deg); }
        }
        .balloon-item.popping {
          animation: popBalloon 0.3s ease-out forwards !important;
        }
        @keyframes popBalloon {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        .balloon-item.shaking {
          animation: shake 0.5s ease-in-out !important;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 0 #0369a1, 0 0 0 0px rgba(2, 132, 199, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 4px 0 #0369a1, 0 0 0 15px rgba(2, 132, 199, 0); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```
