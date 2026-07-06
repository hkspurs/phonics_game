import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import RewardSticker from '../components/RewardSticker'
import { audioEngine } from '../audio/AudioEngine'

export default function RewardScreen() {
  const navigate = useNavigate()
  const { sessionScore, endChallenge } = useGameStore()
  const [chestState, setChestState] = useState('closed'); // 'closed', 'shaking', 'open'

  const handleGoHome = () => {
    endChallenge()
    navigate('/', { replace: true })
  }

  const handleChestClick = () => {
    if (chestState === 'closed') {
      setChestState('shaking');
      audioEngine.play('assets/correct_chime.mp3'); // Fallback sound
      setTimeout(() => {
        setChestState('open');
      }, 1000);
    }
  }

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative Confetti Background */}
      {chestState === 'open' && (
        <>
          <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '3rem', animation: 'float 3s infinite', opacity: 0.6 }}>✨</div>
          <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '4rem', animation: 'float 4s infinite alternate-reverse', opacity: 0.7 }}>🎉</div>
          <div style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: '3rem', animation: 'float 5s infinite', opacity: 0.5 }}>💎</div>
          <div style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: '4rem', animation: 'float 3.5s infinite alternate', opacity: 0.8 }}>⭐</div>
        </>
      )}

      <h1 style={{ fontSize: '5rem', color: '#86198f', marginBottom: '1rem', textShadow: '4px 4px 0px #f0abfc', animation: 'pulse-glow 2s infinite', zIndex: 2, opacity: chestState === 'open' ? 1 : 0, transition: 'opacity 1s' }}>Mission Complete!</h1>
      
      {chestState !== 'open' ? (
        <div 
          onClick={handleChestClick}
          style={{
            fontSize: '8rem',
            cursor: 'pointer',
            animation: chestState === 'shaking' ? 'shake 0.1s infinite' : 'float 3s infinite',
            transform: chestState === 'shaking' ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s',
            zIndex: 10
          }}
        >
          🎁
          <div style={{ fontSize: '2rem', textAlign: 'center', color: '#a21caf', marginTop: '1rem' }}>Tap to open!</div>
        </div>
      ) : (
        <>
          <div style={{ width: '200px', height: '200px', marginBottom: '2rem', animation: 'float 3s infinite, popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', zIndex: 2 }}>
            <RewardSticker isRevealed={true} />
          </div>

          <div style={{ background: 'white', padding: '3rem 5rem', borderRadius: '48px', border: '6px solid #f0abfc', boxShadow: '0 16px 0 #f0abfc, 0 20px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem', zIndex: 2, animation: 'popIn 0.5s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
            <h2 style={{ color: '#a21caf', fontSize: '2.5rem' }}>You earned:</h2>
            <div style={{ display: 'flex', gap: '3rem', fontSize: '4rem', fontWeight: 'bold' }}>
              <span style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>+{sessionScore.stars}</span> ⭐</span>
              <span style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>+{sessionScore.gems}</span> 💎</span>
            </div>
            <p style={{ color: '#d946ef', fontWeight: 'bold', fontSize: '1.5rem', marginTop: '1rem', background: '#fdf4ff', padding: '1rem 2rem', borderRadius: '100px', display: 'inline-block' }}>
              🎟️ 2 Brain Game Tickets Unlocked!
            </p>
          </div>

          <button className="btn-primary" style={{ padding: '1.5rem 5rem', fontSize: '2.5rem', background: '#d946ef', boxShadow: '0 10px 0 #a21caf', zIndex: 2, transition: 'transform 0.2s', animation: 'popIn 0.5s 0.4s both' }} onClick={handleGoHome}>
            <Home size={40} /> Back to Home
          </button>
        </>
      )}

    </div>
  )
}
