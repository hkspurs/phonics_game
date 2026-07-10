import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'
import GameBubble from '../components/GameBubble'

export default function SoundCatcher() {
  const navigate = useNavigate()
  const { tickets, useTicket } = useGameStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [targetSound, setTargetSound] = useState(null)
  const [bubbles, setBubbles] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isWon, setIsWon] = useState(false)

  const hasPlayedRef = React.useRef(false)
  const lastXRef = React.useRef(50)

  const hasInitializedRef = React.useRef(false);

  // Use ticket on mount if not playing yet
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
      navigate('/braingames') // No tickets, kick out
    }
    
    return () => audioEngine.stop()
  }, [])

  // Bubble Spawner Logic (Dynamic Difficulty)
  useEffect(() => {
    if (!isPlaying || !targetSound || isWon) return;
    
    let bubbleId = 0
    // QA FIX: Escalating difficulty (faster spawn rate as score increases)
    const spawnRate = Math.max(800, 2000 - (score * 100))
    
    const interval = setInterval(() => {
      if (document.hidden) return;

      setBubbles(prev => {
        // As score goes up, more distractors (isCorrect probability goes down slightly)
        const isCorrect = Math.random() > (0.4 + (score * 0.02))
        
        const soundObj = isCorrect 
          ? targetSound 
          : questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)[Math.floor(Math.random() * (questionEngine.sounds.length - 1))]

        const now = Date.now()
        const activeBubbles = prev.filter(b => now - b.createdAt < 6000)

        let newX = Math.random() * 80 + 10;
        while (Math.abs(newX - lastXRef.current) < 20) {
          newX = Math.random() * 80 + 10;
        }
        lastXRef.current = newX;

        return [...activeBubbles, {
          id: bubbleId++,
          label: soundObj.label,
          audioUrl: soundObj.audio_url,
          isCorrect,
          createdAt: now,
          x: newX,
          y: -20
        }]
      })
    }, spawnRate)

    return () => clearInterval(interval)
  }, [isPlaying, targetSound, score, isWon])

  const handlePop = (bubble) => {
    // Mark as popping for animation
    setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b))
    
    // Remove after animation (300ms)
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id))
    }, 300)
    
    if (bubble.isCorrect) {
      setScore(s => {
        const newScore = s + 1
        if (newScore >= 10) {
          setIsWon(true)
          setTimeout(() => navigate('/braingames'), 4000) // Longer delay for celebration
        }
        return newScore
      })
      setCombo(c => c + 1)
      
      // QA FIX: Change target sound to prevent visual guessing exploit!
      audioEngine.play('assets/correct_chime.mp3').catch(()=>{}).finally(() => {
        if (score + 1 < 10) {
          const newPool = questionEngine.sounds.filter(s => s.sound_id !== targetSound.sound_id)
          const newTarget = newPool[Math.floor(Math.random() * newPool.length)]
          setTargetSound(newTarget)
          setBubbles([]) // Clear screen for new target
          setTimeout(() => audioEngine.play(newTarget.audio_url).catch(()=>{}), 500)
        }
      })
    } else {
      // QA FIX: Remove score penalty, reset combo, provide corrective audio
      setCombo(0)
      if (bubble.audioUrl) audioEngine.play(bubble.audioUrl).catch(()=>{})
      // Optional: Visual shake effect could be added here
    }
  }

  if (!isPlaying || !targetSound) return null;

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to bottom, #0ea5e9, #0284c7)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '4rem', opacity: 0.3, animation: 'wobble 4s infinite alternate' }}>🫧</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', fontSize: '6rem', opacity: 0.2, animation: 'wobble 3s infinite alternate-reverse' }}>🫧</div>

      {/* Header */}
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

      {/* Target Sound Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', zIndex: 10, position: 'relative' }}>
        <button 
          onClick={() => audioEngine.play(targetSound.audio_url)}
          style={{
            width: '100px', height: '100px', borderRadius: '50%', background: '#38bdf8',
            color: 'white', border: '4px solid white', boxShadow: '0 8px 0 #0284c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            animation: 'pulse-glow 2s infinite'
          }}
        >
          <Volume2 size={48} />
        </button>
        <h2 style={{ color: 'white', marginTop: '1rem', textShadow: '2px 2px 0 #0369a1', fontSize: '2.5rem', animation: isWon ? 'pulse-glow 2s infinite' : 'none' }}>
          {isWon ? '🎉 You Win! 🎉' : 'Catch the matching sound!'}
        </h2>
      </div>

      {/* Win Effects */}
      {isWon && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ fontSize: '10rem', animation: 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>🏆</div>
        </div>
      )}

      {/* Falling Bubbles */}
      {score < 10 && bubbles.map(bubble => (
        <div
          key={bubble.id}
          style={{
            position: 'absolute',
            left: `${bubble.x}%`,
            width: '120px', height: '120px',
            animation: `fall 6s linear forwards, fall-wobble 2s ease-in-out infinite alternate`,
            pointerEvents: bubble.isPopping ? 'none' : 'auto'
          }}
        >
          <GameBubble 
            letter={bubble.label} 
            isPopping={bubble.isPopping}
            onClick={() => { if (!bubble.isPopping) handlePop(bubble) }} 
          />
        </div>
      ))}

      <style>{`
        @keyframes fall {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes fall-wobble {
          0% { transform: translateX(-15px); }
          100% { transform: translateX(15px); }
        }
      `}</style>
    </div>
  )
}
