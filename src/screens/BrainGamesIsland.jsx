import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Puzzle } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { useTranslation } from '../hooks/useTranslation'

export default function BrainGamesIsland() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { tickets } = useGameStore()

  const handlePlaySoundCatcher = () => {
    if (tickets > 0) {
      navigate('/games/soundcatcher')
    }
  }

  const handlePlayMemoryMatch = () => {
    if (tickets > 0) {
      navigate('/games/memorymatch')
    }
  }

  const handlePlaySoundBalloonPop = () => {
    if (tickets > 0) {
      navigate('/games/soundballoonpop')
    }
  }

  return (
    <div className="screen-container" style={{ background: '#fdf4ff', position: 'relative' }}>
      
      <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={24} /> {t('back')}
      </button>

      <div style={{ position: 'absolute', top: '1rem', right: '2rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold' }}>
        <span style={{ color: '#d946ef' }}>🎟️ {tickets} {t('tickets')}</span>
      </div>

      <h1 style={{ textAlign: 'center', color: '#86198f', fontSize: '2.5rem', marginTop: '2rem' }}>{t('brainGamesIsland')}</h1>
      <p style={{ textAlign: 'center', color: '#d946ef', fontSize: '1.25rem', marginBottom: '1rem' }}>{t('useTicketsToPlay')}</p>
      
      {tickets <= 0 && (
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'wobble 2s infinite' }}>
          <div style={{ display: 'inline-block', background: '#fee2e2', color: '#b91c1c', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #f87171' }}>
            {t('outOfTickets')}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Sound Catcher */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #f0abfc', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🫧</div>
          <h2 style={{ color: '#a21caf', marginBottom: '1rem' }}>{t('soundCatcher')}</h2>
          <p style={{ color: '#d946ef', textAlign: 'center', marginBottom: '2rem' }}>{t('popBubbles')}</p>
          <button 
            className="btn-primary" 
            style={{ background: tickets > 0 ? '#d946ef' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #a21caf' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
            onClick={handlePlaySoundCatcher}
            disabled={tickets <= 0}
          >
            {tickets > 0 ? t('playCost') : t('needTickets')}
          </button>
        </div>

        {/* Memory Match */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #c4b5fd', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🃏</div>
          <h2 style={{ color: '#6d28d9', marginBottom: '1rem' }}>{t('memoryMatch')}</h2>
          <p style={{ color: '#8b5cf6', textAlign: 'center', marginBottom: '2rem' }}>{t('matchSounds')}</p>
          <button 
            className="btn-primary" 
            style={{ background: tickets > 0 ? '#8b5cf6' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #6d28d9' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
            onClick={handlePlayMemoryMatch}
            disabled={tickets <= 0}
          >
            {tickets > 0 ? t('playCost') : t('needTickets')}
          </button>
        </div>

        {/* Balloon Pop */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #bae6fd', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎈</div>
          <h2 style={{ color: '#0369a1', marginBottom: '1rem' }}>{t('balloonPop')}</h2>
          <p style={{ color: '#0284c7', textAlign: 'center', marginBottom: '2rem' }}>{t('popBalloons')}</p>
          <button 
            className="btn-primary" 
            style={{ background: tickets > 0 ? '#0284c7' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #0369a1' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
            onClick={handlePlaySoundBalloonPop}
            disabled={tickets <= 0}
          >
            {tickets > 0 ? t('playCost') : t('needTickets')}
          </button>
        </div>

      </div>
    </div>
  )
}
