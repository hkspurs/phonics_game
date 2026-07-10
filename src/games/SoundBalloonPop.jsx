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
