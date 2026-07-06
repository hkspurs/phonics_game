import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import MapNodeCloud from '../components/MapNodeCloud'
import { audioEngine } from '../audio/AudioEngine'
import { questionEngine } from '../game/QuestionEngine'

export default function MasteryMap() {
  const navigate = useNavigate()
  const { getNodeStatus } = useGameStore()

  const handleNodeClick = (nodeId, status) => {
    if (status === 'locked') return;
    const soundData = questionEngine.sounds.find(s => s.label === nodeId || s.sound_id === nodeId);
    if (soundData && soundData.audio_url) {
      audioEngine.play(soundData.audio_url);
    }
  }

  // Dynamic status based on learning progression
  const nodes = [
    { id: 'AB', status: getNodeStatus('AB'), x: 20, y: 80, name: "Vowel Beach" },
    { id: 'EB', status: getNodeStatus('EB'), x: 40, y: 70 },
    { id: 'IB', status: getNodeStatus('IB'), x: 60, y: 50 },
    { id: 'OB', status: getNodeStatus('OB'), x: 80, y: 30 },
    { id: 'UB', status: getNodeStatus('UB'), x: 70, y: 10, name: "Echo Cave" },
  ]

  const getStatusColor = (status) => {
    switch(status) {
      case 'mastered': return '#fbbf24'; // Gold
      case 'unlocked': return '#4ade80'; // Green
      case 'practising': return '#f472b6'; // Pink
      case 'weak': return '#ef4444'; // Red
      default: return '#cbd5e1'; // Grey (locked)
    }
  }

  return (
    <div className="screen-container" style={{ background: '#fef3c7', position: 'relative' }}>
      
      <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={24} /> Back
      </button>

      <h1 style={{ textAlign: 'center', color: '#b45309', fontSize: '2.5rem', marginTop: '1rem' }}>Sound Mastery Map</h1>

      {/* Map Area */}
      <div style={{ position: 'relative', width: '100%', height: '600px', marginTop: '2rem', border: '6px solid #fcd34d', borderRadius: '32px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
        
        {/* Inner Map Container (wide enough to pan) */}
        <div style={{ position: 'relative', width: '150%', minWidth: '800px', height: '100%', background: 'linear-gradient(to bottom, #dbeafe, #fef3c7)' }}>
          {/* Decorative Scenery */}
          <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '4rem', opacity: 0.8 }}>🏔️</div>
          <div style={{ position: 'absolute', top: '45%', right: '15%', fontSize: '5rem', opacity: 0.9 }}>🌲</div>
          <div style={{ position: 'absolute', bottom: '25%', left: '30%', fontSize: '3rem', opacity: 0.7 }}>🌲</div>
          <div style={{ position: 'absolute', bottom: '10%', right: '25%', fontSize: '4rem', opacity: 0.8 }}>🏖️</div>
          <div style={{ position: 'absolute', top: '5%', right: '30%', fontSize: '3rem', animation: 'float 6s infinite alternate' }}>☁️</div>
          
          {/* Draw lines (mocking a path) */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            <path d="M 20% 80% Q 30% 60% 40% 70% T 60% 50% T 80% 30% T 70% 10%" fill="none" stroke="#fbbf24" strokeWidth="12" strokeDasharray="16 16" strokeLinecap="round" className="map-path-animate" />
          </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <div key={node.id} style={{
            position: 'absolute',
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {node.name && <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold', fontSize: '1rem', color: '#92400e', border: '2px solid #fcd34d', boxShadow: '0 4px 0 #fcd34d', marginBottom: '0.5rem' }}>{node.name}</div>}
            <div style={{ position: 'relative', width: node.status === 'practising' ? '140px' : '120px', height: node.status === 'practising' ? '112px' : '96px' }}>
              <MapNodeCloud 
                isMastered={node.status === 'mastered'} 
                isLocked={node.status === 'locked'} 
                onClick={() => handleNodeClick(node.id, node.status)}
                style={{ position: 'absolute', inset: 0, animation: node.status === 'practising' ? 'pulse-glow 2s infinite' : 'none' }}
              />
              <div style={{
                position: 'absolute',
                top: '55%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem', fontWeight: 'bold', pointerEvents: 'none',
                color: node.status === 'locked' ? '#94A3B8' : '#8D7A6F'
              }}>
                {node.id}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
