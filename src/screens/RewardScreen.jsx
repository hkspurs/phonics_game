import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import TreasureChest from '../components/TreasureChest'
import RewardSticker from '../components/RewardSticker'
import ConfettiSVG from '../components/ConfettiSVG'
import { audioEngine } from '../audio/AudioEngine'

export default function RewardScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subject = searchParams.get('subject') || 'phonics'

  const { sessionScore, endChallenge, math, completeMathDaily } = useGameStore()
  const [chestState, setChestState] = useState('closed'); // 'closed', 'shaking', 'open'

  const handleGoHome = () => {
    if (subject === 'math') {
      completeMathDaily()
      navigate('/math', { replace: true })
    } else {
      endChallenge()
      navigate('/', { replace: true })
    }
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
      
      {/* Canvas Confetti Background */}
      <ConfettiSVG isVisible={chestState === 'open'} />

      <h1 style={{ fontSize: '5rem', color: '#86198f', marginBottom: '1rem', textShadow: '4px 4px 0px #f0abfc', animation: 'pulse-glow 2s infinite', zIndex: 2, opacity: chestState === 'open' ? 1 : 0, transition: 'opacity 1s' }}>Mission Complete!</h1>
      
      {chestState !== 'open' ? (
        <div 
          onClick={handleChestClick}
          style={{
            width: '300px', height: '300px',
            animation: chestState === 'shaking' ? 'shake 0.1s infinite' : 'float 3s infinite',
            transform: chestState === 'shaking' ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s',
            zIndex: 10,
            padding: '2rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            boxShadow: chestState === 'shaking' ? '0 0 50px gold' : '0 10px 30px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          <TreasureChest state={chestState} />
          <div style={{ fontSize: '2rem', textAlign: 'center', color: '#a21caf', marginTop: '1rem', whiteSpace: 'nowrap' }}>Tap to open!</div>
        </div>
      ) : (
        <>
          {/* Starburst background */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(253,224,71,0.8) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(-50%, -50%)', animation: 'spin 10s linear infinite', zIndex: 1 }} />
          
          <div style={{ width: '200px', height: '200px', marginBottom: '2rem', animation: 'float 3s infinite, popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', zIndex: 2 }}>
            <RewardSticker isRevealed={true} />
          </div>

          <div style={{ background: 'white', padding: '3rem 5rem', borderRadius: '48px', border: '6px solid #f0abfc', boxShadow: '0 16px 0 #f0abfc, 0 20px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem', zIndex: 2, animation: 'popIn 0.5s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
            <h2 style={{ color: '#a21caf', fontSize: '2.5rem' }}>You earned:</h2>
            
            {subject === 'math' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1.5rem', color: '#475569', marginBottom: '1rem', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                  <span>Questions completed:</span>
                  <span style={{ fontWeight: 'bold' }}>+8 ⭐</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                  <span>Perfect-answer bonus:</span>
                  <span style={{ fontWeight: 'bold', color: '#eab308' }}>+{math.mathSessionScore.stars - 8} ⭐</span>
                </div>
                <div style={{ height: '2px', background: '#e2e8f0', margin: '0.5rem 0' }} />
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '3rem', fontSize: '4rem', fontWeight: 'bold' }}>
              <span style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>+{(subject === 'math' ? math.mathSessionScore.stars : sessionScore.stars)}</span> ⭐</span>
              {subject !== 'math' && <span style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>+{sessionScore.gems}</span> 💎</span>}
            </div>
            
            <p style={{ color: '#d946ef', fontWeight: 'bold', fontSize: '1.5rem', marginTop: '1rem', background: '#fdf4ff', padding: '1rem 2rem', borderRadius: '100px', display: 'inline-block', textAlign: 'center' }}>
              🎟️ {subject === 'math' ? '1 Brain Game Ticket Unlocked!' : '2 Brain Game Tickets Unlocked!'}
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
