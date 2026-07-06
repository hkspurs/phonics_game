import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Puzzle } from 'lucide-react'
import { useGameStore } from '../store/gameStore'

export default function BrainGamesIsland() {
  const navigate = useNavigate()
  const { tickets } = useGameStore()

  const handlePlaySoundCatcher = () => {
    if (tickets > 0) {
      navigate('/games/soundcatcher')
    }
  }

  return (
    <div className="screen-container" style={{ background: '#fdf4ff', position: 'relative' }}>
      
      <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={24} /> Back
      </button>

      <div style={{ position: 'absolute', top: '1rem', right: '2rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold' }}>
        <span style={{ color: '#d946ef' }}>🎟️ {tickets} Tickets</span>
      </div>

      <h1 style={{ textAlign: 'center', color: '#86198f', fontSize: '2.5rem', marginTop: '2rem' }}>Brain Games Island</h1>
      <p style={{ textAlign: 'center', color: '#d946ef', fontSize: '1.25rem', marginBottom: '3rem' }}>Use tickets to play fun mini-games!</p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Sound Catcher */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #f0abfc', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🫧</div>
          <h2 style={{ color: '#a21caf', marginBottom: '1rem' }}>Sound Catcher</h2>
          <p style={{ color: '#d946ef', textAlign: 'center', marginBottom: '2rem' }}>Pop the bubbles that match the sound!</p>
          <button 
            className="btn-primary" 
            style={{ background: tickets > 0 ? '#d946ef' : '#e5e7eb', boxShadow: tickets > 0 ? '0 6px 0 #a21caf' : 'none', color: tickets > 0 ? 'white' : '#9ca3af' }}
            onClick={handlePlaySoundCatcher}
            disabled={tickets <= 0}
          >
            {tickets > 0 ? 'Play (1 🎟️)' : 'Need Tickets'}
          </button>
        </div>

        {/* Coming Soon */}
        <div style={{ background: '#f3f4f6', padding: '2rem', borderRadius: '24px', border: '4px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px', opacity: 0.7 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'grayscale(1)' }}>🚂</div>
          <h2 style={{ color: '#6b7280', marginBottom: '1rem' }}>Letter Train</h2>
          <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '2rem' }}>Coming soon in the next update!</p>
          <button className="btn-secondary" disabled>Locked</button>
        </div>

      </div>
    </div>
  )
}
