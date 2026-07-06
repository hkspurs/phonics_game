import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'

export default function SoundCatcher() {
  const navigate = useNavigate()
  const { tickets, useTicket } = useGameStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [targetSound, setTargetSound] = useState(null)
  const [bubbles, setBubbles] = useState([])
  const [score, setScore] = useState(0)

  // Use ticket on mount if not playing yet
  useEffect(() => {
    if (!isPlaying && tickets > 0) {
      useTicket()
      setIsPlaying(true)
      // Pick a random target sound
      const q = questionEngine.generateDailyChallenge()[0]
      setTargetSound(q.targetSound)
      audioEngine.play(q.targetSound.audio_url)
    } else if (!isPlaying) {
      navigate('/braingames') // No tickets, kick out
    }
    
    return () => audioEngine.stop()
  }, [])

  // Bubble Spawner Logic (Simplified for Prototype)
  useEffect(() => {
    if (!isPlaying || !targetSound) return;
    
    let bubbleId = 0
    const interval = setInterval(() => {
      setBubbles(prev => {
        // Randomly decide if bubble is correct or distractor
        const isCorrect = Math.random() > 0.5
        const soundLabel = isCorrect 
          ? targetSound.label 
          : questionEngine.sounds[Math.floor(Math.random() * questionEngine.sounds.length)].label

        // QA FIX 1: Remove bubbles that have fallen off screen (older than 6s) to prevent memory leaks
        const now = Date.now()
        const activeBubbles = prev.filter(b => now - b.createdAt < 6000)

        return [...activeBubbles, {
          id: bubbleId++,
          label: soundLabel,
          isCorrect,
          createdAt: now,
          x: Math.random() * 80 + 10, // 10% to 90% width
          y: -20 // Start above screen
        }]
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying, targetSound])

  const handlePop = (bubble) => {
    // Remove the clicked bubble
    setBubbles(prev => prev.filter(b => b.id !== bubble.id))
    
    if (bubble.isCorrect) {
      setScore(s => {
        const newScore = s + 1
        if (newScore >= 10) {
          setTimeout(() => navigate('/braingames'), 2000)
        }
        return newScore
      })
      
      // Play correct chime, then repeat target sound
      audioEngine.play('assets/correct_chime.mp3').then(() => {
        if (targetSound) audioEngine.play(targetSound.audio_url)
      })
    } else {
      setScore(s => Math.max(0, s - 1)) // Penalty
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
        <button className="btn-secondary" style={{ padding: '0.5rem', background: 'white' }} onClick={() => navigate('/braingames')}>
          <X size={24} />
        </button>
        
        <div style={{ background: 'white', padding: '0.5rem 2rem', borderRadius: '100px', fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
          Score: {score} / 10
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
        <h2 style={{ color: 'white', marginTop: '1rem', textShadow: '2px 2px 0 #0369a1' }}>
          {score >= 10 ? '🎉 You Win! 🎉' : 'Catch the matching sound!'}
        </h2>
      </div>

      {/* Falling Bubbles */}
      {score < 10 && bubbles.map(bubble => (
        <button
          key={bubble.id}
          onClick={() => handlePop(bubble)}
          style={{
            position: 'absolute',
            left: `${bubble.x}%`,
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(186,230,253,0.5))',
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: 'inset -10px -10px 20px rgba(2,132,199,0.3), 0 10px 20px rgba(0,0,0,0.1)',
            fontSize: '3rem', fontWeight: 'bold', color: '#0369a1',
            cursor: 'crosshair',
            animation: 'fall 6s linear forwards, wobble 2s ease-in-out infinite alternate',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0
          }}
        >
          {bubble.label}
        </button>
      ))}

      <style>{`
        @keyframes fall {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes wobble {
          0% { transform: translateX(-15px); }
          100% { transform: translateX(15px); }
        }
      `}</style>
    </div>
  )
}
