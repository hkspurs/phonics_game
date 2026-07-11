import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MascotRabbit from '../components/MascotRabbit'
import { audioEngine } from '../audio/AudioEngine'

/**
 * MathHome — Placeholder screen for the Math Kingdom subject.
 * Shows a "Coming Soon" message with the mascot and a back button.
 */
export default function MathHome() {
  const navigate = useNavigate()

  return (
    <div className="screen-container" style={{
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #fef3c7, #fde68a)',
      textAlign: 'center'
    }}>
      {/* Back button */}
      <button
        onClick={() => { audioEngine.playUI('pop'); navigate('/'); }}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 10
        }}
      >
        <ArrowLeft size={24} color="#f59e0b" />
      </button>

      {/* Mascot */}
      <div style={{ marginBottom: '2rem', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))' }}>
        <MascotRabbit style={{ width: '200px', height: '200px' }} />
      </div>

      {/* Title */}
      <h1 style={{ fontSize: '2.5rem', color: '#92400e', marginBottom: '0.5rem' }}>
        🔢 Math Kingdom
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#b45309', marginBottom: '2rem' }}>
        Coming Soon! 🚧
      </p>
      <p style={{ fontSize: '1rem', color: '#d97706' }}>
        Fun maths adventures are on the way!
      </p>
    </div>
  )
}
