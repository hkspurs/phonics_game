# Design & Implementation Strategy: Phonics Sound Balloon Pop Mini-Game

This report outlines the technical design, UX considerations, and implementation strategy for the new mini-game **Sound Balloon Pop** (`src/games/SoundBalloonPop.jsx`).

---

## 1. Game Mechanics: Sound Balloon Pop

The mini-game introduces a fast-paced, engaging phonics mechanic based on identifying spoken sounds and matching them to floating letter labels (consonant-vowel and consonant-vowel-consonant sounds).

### Core Gameplay Loop
1. **Target Generation**: The game selects an approved sound from the `questionEngine.sounds` array.
2. **Audio Prompt**: The target sound is played automatically at the start of a round.
3. **Balloon Spawning**: Balloons containing letters/labels float upwards from the bottom of the screen.
   - **Target Balloon**: Contains the label matching the target sound.
   - **Distractor Balloons**: Contain labels of other sounds randomly selected from the available curriculum pool.
4. **Interaction**:
   - **Correct Selection**: Popping the target balloon triggers a visual pop animation, play of `assets/correct_chime.mp3`, a point increase, and combo counter increment. If the score is less than 10, the active balloons are cleared, a new target sound is chosen, and a new round begins.
   - **Incorrect Selection**: Clicking a distractor balloon plays that balloon's specific sound (reinforcing phonetics) and plays a low error buzzer/synth sound (`audioEngine.playUI('error')`). The balloon shakes horizontally, and the combo counter resets. There is no score penalty.
5. **Win Condition**: Reaching a score of 10 completes the game. A win screen appears showing a trophy (🏆), overlaying canvas-based confetti (`ConfettiSVG`), and then redirects the player back to `/braingames` after 4 seconds.

### Escalate Difficulty (Dynamic Balancing)
As the user's score increases:
- The spawn rate of balloons speeds up dynamically.
- The ratio of target balloons to distractors decreases slightly to increase density and cognitive challenge.
- To prevent visual overlapping, a collision prevention mechanism prevents consecutive balloons from spawning at similar X coordinates.

---

## 2. Integration with Audio/Sounds Engine

The mini-game fully integrates with the custom Web Audio API wrapper `audioEngine` located in `src/audio/AudioEngine.js`.

### Key Audio Controls
* **Preloading**: At start, the game collects a list of sound assets and preloads them:
  ```javascript
  audioEngine.preload(pool.map(s => s.audio_url));
  ```
* **Target Sound Playback**: Played automatically or when clicking the speaker replay button:
  ```javascript
  audioEngine.play(targetSound.audio_url);
  ```
* **Distractor Phonic Feedback**: When a user selects a wrong balloon, the corresponding phonic audio plays to teach them the correct sound of what they clicked:
  ```javascript
  audioEngine.play(balloon.audioUrl);
  ```
* **UI/Feedback Sound Effects**:
  - Pop synth: `audioEngine.playUI('pop')`
  - Buzzer/Error synth: `audioEngine.playUI('error')`
  - Success chime: `audioEngine.play('assets/correct_chime.mp3')`
* **Lifecycle Cleanup**: When the component unmounts, any ongoing audio is immediately halted to prevent memory/playback leaks:
  ```javascript
  return () => audioEngine.stop();
  ```

---

## 3. Ticket Management & React 18 StrictMode Guard

The game requires exactly **1 Ticket** to play, managed through the global Zustand store `useGameStore`.

### Ticket Check and Deductions
* On mount, the component checks if `tickets > 0`. If `0`, they are redirected back to the `/braingames` hub.
* If tickets are available, exactly 1 ticket is deducted immediately using `useTicket()`.
* **Quit Confirmation**: If the user exits via the exit button, a confirmation dialog pops up: `"Quit game? You will lose your ticket!"` before navigating back.

### The React 18 StrictMode Guard
In React 18, `useEffect` runs twice on mount in development mode to catch potential side-effect cleanup issues. Without protection, a user entering the game would be charged **2 tickets** instead of 1.

To resolve this, we employ a reference-based initialization guard (`useRef`):
```javascript
const hasInitializedRef = useRef(false);

useEffect(() => {
  if (hasInitializedRef.current) return;

  if (!isPlaying && tickets > 0) {
    hasInitializedRef.current = true;
    useTicket(); // Deducts exactly 1 ticket
    setIsPlaying(true);
    // Initialize pool...
  } else if (!isPlaying) {
    navigate('/braingames');
  }
}, []);
```
* **How it works**: The `hasInitializedRef.current` starts as `false`. During the first mount, it executes the ticket deduction and switches to `true`. When React unmounts and remounts the component in development StrictMode, the second execution hits the guard check (`if (hasInitializedRef.current) return;`) and does nothing, preserving the single ticket deduction.

---

## 4. UX and CSS-Based Animations

To build a playful and responsive learning experience, the game utilizes pure CSS animations embedded via a React `<style>` block.

### Visual Elements
* **Balloons**: Rendered as highly customizable inline SVGs consisting of:
  - An elliptical balloon body (`ellipse` with varying bright colors).
  - A triangular balloon knot (`polygon`).
  - A curvy string path (`path` with bezier curve).
  - A semi-transparent glossy highlight (`path` and `circle`).
  - Highly legible, bold phonic labels (`text`).
* **Background**: A sky-blue vertical gradient background (`linear-gradient(to bottom, #bae6fd, #e0f2fe)`) populated with drifting decorative clouds.

### CSS Keyframes
1. **Vertical Floating (`floatUp`)**:
   Floats the balloon from below the viewport (`top: 110%`) to above the top (`top: -20%`) over 6 seconds.
   ```css
   @keyframes floatUp {
     0% { top: 110%; opacity: 0; }
     10% { opacity: 1; }
     90% { opacity: 1; }
     100% { top: -20%; opacity: 0; }
   }
   ```
2. **Horizontal Swaying (`floatWobble`)**:
   Applies an alternating side-to-side translation and minor tilt to simulate a wind-blown drifting effect.
   ```css
   @keyframes floatWobble {
     0% { transform: translateX(-15px) rotate(-3deg); }
     100% { transform: translateX(15px) rotate(3deg); }
   }
   ```
3. **Balloon Pop (`popBalloon`)**:
   Triggered on click, rapidly scaling the balloon up and fading it to zero in `0.3s`.
   ```css
   @keyframes popBalloon {
     0% { transform: scale(1); opacity: 1; }
     50% { transform: scale(1.3); opacity: 0.5; }
     100% { transform: scale(0); opacity: 0; }
   }
   ```
4. **Incorrect Shake (`shake`)**:
   Provides immediate visual feedback when an incorrect balloon is popped.
   ```css
   @keyframes shake {
     0%, 100% { transform: translateX(0); }
     20%, 60% { transform: translateX(-10px); }
     40%, 80% { transform: translateX(10px); }
   }
   ```
5. **Glow Pulse (`pulse-glow`)**:
   Highlights the audio speaker replay button to guide children to click it for sound guidance.
   ```css
   @keyframes pulse-glow {
     0%, 100% { transform: scale(1); box-shadow: 0 8px 0 #0369a1, 0 0 0 0px rgba(2, 132, 199, 0.4); }
     50% { transform: scale(1.05); box-shadow: 0 4px 0 #0369a1, 0 0 0 15px rgba(2, 132, 199, 0); }
   }
   ```

---

## 5. Proposed Component Implementation

Here is the recommended source code for `src/games/SoundBalloonPop.jsx`:

```jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'
import ConfettiSVG from '../components/ConfettiSVG'

export default function SoundBalloonPop() {
  const navigate = useNavigate()
  const { tickets, useTicket } = useGameStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [targetSound, setTargetSound] = useState(null)
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isWon, setIsWon] = useState(false)

  const hasPlayedRef = useRef(false)
  const lastXRef = useRef(50)
  const hasInitializedRef = useRef(false)

  // Ticket validation & consumption on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (!isPlaying && tickets > 0) {
      hasInitializedRef.current = true;
      useTicket()
      setIsPlaying(true)
      const pool = [...questionEngine.sounds].sort(() => Math.random() - 0.5)
      const target = pool[0]
      setTargetSound(target)
      if (!hasPlayedRef.current) {
        audioEngine.play(target.audio_url).catch(()=>{})
        hasPlayedRef.current = true
      }
    } else if (!isPlaying) {
      navigate('/braingames')
    }
    
    return () => audioEngine.stop()
  }, [])

  // Balloon Spawner Logic (Dynamic Difficulty & Collision Guard)
  useEffect(() => {
    if (!isPlaying || !targetSound || isWon) return;
    
    let balloonId = 0
    const spawnRate = Math.max(800, 2000 - (score * 100))
    
    const interval = setInterval(() => {
      if (document.hidden) return;

      setBalloons(prev => {
        // Distractor selection logic
        const isCorrect = Math.random() > (0.4 + (score * 0.02))
        
        const soundObj = isCorrect 
          ? targetSound 
          : questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)[Math.floor(Math.random() * (questionEngine.sounds.length - 1))]

        const now = Date.now()
        const activeBalloons = prev.filter(b => now - b.createdAt < 6000)

        // Select X coordinate and prevent spatial overlap
        let newX = Math.random() * 80 + 10;
        while (Math.abs(newX - lastXRef.current) < 20) {
          newX = Math.random() * 80 + 10;
        }
        lastXRef.current = newX;

        return [...activeBalloons, {
          id: balloonId++,
          label: soundObj.label,
          audioUrl: soundObj.audio_url,
          isCorrect,
          createdAt: now,
          x: newX,
          color: getRandomBalloonColor()
        }]
      })
    }, spawnRate)

    return () => clearInterval(interval)
  }, [isPlaying, targetSound, score, isWon])

  const getRandomBalloonColor = () => {
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#f97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const handlePop = (balloon) => {
    // Mark balloon as popping to initiate animation
    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isPopping: true } : b))
    
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== balloon.id))
    }, 300)
    
    if (balloon.isCorrect) {
      setScore(s => {
        const newScore = s + 1
        if (newScore >= 10) {
          setIsWon(true)
          setTimeout(() => navigate('/braingames'), 4000)
        }
        return newScore
      })
      setCombo(c => c + 1)
      
      // Play pop synth & correct chime audio
      audioEngine.playUI('pop')
      audioEngine.play('assets/correct_chime.mp3').catch(()=>{}).finally(() => {
        if (score + 1 < 10) {
          const newPool = questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)
          const newTarget = newPool[Math.floor(Math.random() * newPool.length)]
          setTargetSound(newTarget)
          setBalloons([]) // Clear existing balloons for next sound round
          setTimeout(() => audioEngine.play(newTarget.audio_url).catch(()=>{}), 500)
        }
      })
    } else {
      setCombo(0)
      audioEngine.playUI('error')
      if (balloon.audioUrl) audioEngine.play(balloon.audioUrl).catch(()=>{})
      
      // Trigger horizontal shake feedback
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isShaking: true } : b))
      setTimeout(() => {
        setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isShaking: false } : b))
      }, 500)
    }
  }

  if (!isPlaying || !targetSound) return null;

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', zIndex: 10, position: 'relative' }}>
        <button 
          onClick={() => audioEngine.play(targetSound.audio_url)}
          style={{
            width: '100px', height: '100px', borderRadius: '50%', background: '#0284c7',
            color: 'white', border: '4px solid white', boxShadow: '0 8px 0 #0369a1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            animation: 'pulse-glow 2s infinite'
          }}
        >
          <Volume2 size={48} />
        </button>
        <h2 style={{ color: '#0369a1', marginTop: '1rem', textShadow: '1px 1px 0 white', fontSize: '2.5rem', textAlign: 'center' }}>
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

      {/* Balloon Field */}
      {score < 10 && balloons.map(balloon => {
        const balloonClass = `balloon-item ${balloon.isPopping ? 'popping' : ''} ${balloon.isShaking ? 'shaking' : ''}`;
        return (
          <div
            key={balloon.id}
            onClick={() => { if (!balloon.isPopping) handlePop(balloon) }}
            className={balloonClass}
            style={{
              position: 'absolute',
              left: `${balloon.x}%`,
              width: '100px',
              height: '140px',
              cursor: balloon.isPopping ? 'default' : 'pointer',
              pointerEvents: balloon.isPopping ? 'none' : 'auto',
              animation: balloon.isPopping ? 'none' : `floatUp 6s linear forwards, floatWobble 2s ease-in-out infinite alternate`
            }}
          >
            <svg viewBox="0 0 100 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M 50 100 Q 45 115 50 130 T 48 140" fill="none" stroke="#64748b" strokeWidth="2" />
                <polygon points="46,100 54,100 50,94" fill={balloon.color} />
                <ellipse cx="50" cy="55" rx="40" ry="45" fill={balloon.color} stroke="#ffffff" strokeWidth="2" />
                <path d="M 25 35 A 30 35 0 0 1 75 35 A 25 30 0 0 0 25 35 Z" fill="#ffffff" opacity="0.4" />
                <circle cx="70" cy="70" r="4" fill="#ffffff" opacity="0.4" />
                <text x="50" y="62" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="bold" fill="#ffffff" textAnchor="middle" stroke="#000000" strokeWidth="1">
                  {balloon.label}
                </text>
              </g>
            </svg>
          </div>
        );
      })}

      {/* Embedded CSS Animations */}
      <style>{`
        .balloon-item {
          transform-origin: center bottom;
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

---

## 6. App Integration Proposal

### Router Registration (`src/App.jsx`)
In `src/App.jsx`, register the route so the app recognizes the component:
```javascript
// Import
import SoundBalloonPop from './games/SoundBalloonPop'

// Route element
<Route path="/games/soundballoonpop" element={<SoundBalloonPop />} />
```

### Brain Games Selection UI (`src/screens/BrainGamesIsland.jsx`)
Add a new game selection card under `Brain Games Island`:
```jsx
const handlePlaySoundBalloonPop = () => {
  if (tickets > 0) {
    navigate('/games/soundballoonpop')
  }
}

// Inside return display grid/flex container:
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
