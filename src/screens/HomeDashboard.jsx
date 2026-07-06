import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Play, Trophy, Puzzle, ClipboardList, Settings } from 'lucide-react'
import { useGameStore } from '../store/gameStore'

export default function HomeDashboard() {
  const navigate = useNavigate()
  
  // Connect to global state
  const { stars, gems, tickets, streak, startDailyChallenge, activeAssignment, hasCompletedDaily, checkDailyReset } = useGameStore()

  useEffect(() => {
    checkDailyReset()
  }, [checkDailyReset])

  const handleStartMission = () => {
    startDailyChallenge()
    navigate('/challenge')
  }

  return (
    <div className="screen-container" style={{ position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #bae6fd, #e0f2fe)' }}>
      
      {/* Dynamic Game World Background Elements */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '4rem', opacity: 0.7, animation: 'float 4s ease-in-out infinite alternate' }}>☁️</div>
      <div style={{ position: 'absolute', top: '25%', right: '10%', fontSize: '5rem', opacity: 0.6, animation: 'float 6s ease-in-out infinite alternate-reverse' }}>☁️</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '15%', fontSize: '3rem', opacity: 0.5, animation: 'float 5s ease-in-out infinite alternate' }}>✨</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '5%', fontSize: '4rem', opacity: 0.8, animation: 'float 4.5s ease-in-out infinite alternate-reverse' }}>🎈</div>
      
      {/* Header / Stats (QA FIX: Mobile Responsive) */}
      <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontWeight: 'bold' }}>
          <span style={{ color: '#eab308' }}>⭐ {stars}</span>
          <span style={{ color: '#0ea5e9' }}>💎 {gems}</span>
          <span style={{ color: '#d946ef' }}>🎟️ {tickets}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {activeAssignment && !activeAssignment.completed && (
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', borderColor: '#f59e0b', color: '#b45309' }} onClick={() => navigate('/assignments')}>
              <ClipboardList size={20} /> 1 New Assignment!
            </button>
          )}
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold', color: '#ef4444' }}>
            🔥 {streak} Day Streak
          </div>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }} 
            onClick={() => {
              const pin = prompt('Parent Gate: Enter PIN (1234)');
              if (pin === '1234') navigate('/parent');
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Mascot Area */}
      <div className="mascot-container" style={{ fontSize: '10rem', marginBottom: '2rem', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))', zIndex: 10 }}>
        🦉
      </div>
      
      <h1 style={{ fontSize: '3rem', color: '#1e3a8a', marginBottom: '0.5rem', textAlign: 'center' }}>Ready to Learn?</h1>
      <p style={{ fontSize: '1.5rem', color: '#3b82f6', marginBottom: '3rem' }}>Today's Mission is waiting for you!</p>

      {/* Main Action */}
      <button 
        className="btn-primary" 
        style={{ fontSize: '2rem', padding: '1.5rem 4rem', animation: 'pulse-glow 2s infinite' }}
        onClick={handleStartMission}
      >
        <Play size={32} /> Start Today's Mission
      </button>

      {/* Secondary Actions (QA FIX: Mobile Responsive & Gamification Lock) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '4rem', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={() => navigate('/map')}>
          <Map size={24} /> Sound Map
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => { if (hasCompletedDaily) navigate('/braingames') }}
          style={{ opacity: hasCompletedDaily ? 1 : 0.5, cursor: hasCompletedDaily ? 'pointer' : 'not-allowed' }}
        >
          {hasCompletedDaily ? <Puzzle size={24} /> : <span style={{fontSize:'24px'}}>🔒</span>} Brain Games
        </button>
        <button className="btn-secondary" onClick={() => navigate('/assignments')}>
          <ClipboardList size={24} /> Assignments
        </button>
      </div>

    </div>
  )
}
