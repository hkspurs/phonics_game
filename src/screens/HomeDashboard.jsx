import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Play, Trophy, Puzzle, ClipboardList, Settings, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { audioEngine } from '../audio/AudioEngine'
import MascotRabbit from '../components/MascotRabbit'
import MissionSun from '../components/MissionSun'
import ParentGateModal from '../components/ParentGateModal'
import { useTranslation } from '../hooks/useTranslation'

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showParentGate, setShowParentGate] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  
  // Connect to global state
  const { stars, gems, tickets, streak, unlockedSounds, startDailyChallenge, startBubbleChallenge, activeAssignment, hasCompletedDaily, checkDailyReset, setParentAuthenticated } = useGameStore()

  useEffect(() => {
    checkDailyReset()
    setTimeout(() => setIsEntering(false), 800)
  }, [checkDailyReset])

  const handleStartMission = () => {
    audioEngine.playUI('pop');
    startDailyChallenge()
    navigate('/challenge')
  }

  const handleStartBubble = () => {
    audioEngine.playUI('pop');
    startBubbleChallenge()
    navigate('/bubble')
  }

  const handleParentAccess = () => {
    setParentAuthenticated(true);
    navigate('/parent');
  };

  return (
    <div className="screen-container" style={{ position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #bae6fd, #e0f2fe)' }}>
      {showParentGate && <ParentGateModal onClose={() => setShowParentGate(false)} onSuccess={handleParentAccess} />}
      
      {/* Dynamic Game World Background Elements */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '4rem', opacity: 0.7, animation: 'float 4s ease-in-out infinite alternate' }}>☁️</div>
      <div style={{ position: 'absolute', top: '25%', right: '10%', fontSize: '5rem', opacity: 0.6, animation: 'float 6s ease-in-out infinite alternate-reverse' }}>☁️</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '15%', fontSize: '3rem', opacity: 0.5, animation: 'float 5s ease-in-out infinite alternate' }}>✨</div>
      <div style={{ position: 'absolute', bottom: '30%', right: '5%', fontSize: '4rem', opacity: 0.8, animation: 'float 4.5s ease-in-out infinite alternate-reverse' }}>🎈</div>
      
      {/* Header / Stats - Simplified for UX */}
      <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', zIndex: 10 }}>
        <button
          onClick={() => { audioEngine.playUI('pop'); navigate('/'); }}
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '100px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            color: '#3b82f6',
            fontWeight: 'bold'
          }}
        >
          &lt; {t('back')}
        </button>
        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', gap: '1rem', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#eab308' }}>⭐ {stars}</span>
          {gems > 0 && <span style={{ color: '#0ea5e9' }}>💎 {gems}</span>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeAssignment && !activeAssignment.completed && (
             <div onClick={() => { audioEngine.playUI('pop'); navigate('/assignments'); }} style={{ background: '#fef3c7', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' }}>
               <ClipboardList size={20} />
               <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', fontSize: '0.7rem', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
             </div>
          )}
          
          {/* Visual Streak: More dramatic styling if streak is high */}
          <div style={{ 
            background: streak > 2 ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'white', 
            color: streak > 2 ? 'white' : '#ef4444',
            padding: '0.5rem 1rem', 
            borderRadius: '100px', 
            fontWeight: 'bold', 
            boxShadow: streak > 2 ? '0 4px 10px rgba(239,68,68,0.4)' : '0 4px 6px rgba(0,0,0,0.05)',
            transform: isEntering ? 'scale(0)' : 'scale(1)',
            transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.6s'
          }}>
            {streak > 2 ? '🔥' : '⭐'} Streak: {streak}
          </div>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }} 
            onClick={() => { audioEngine.playUI('pop'); setShowParentGate(true); }}
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Mascot Area */}
      <div className="mascot-container" style={{ 
        marginBottom: '2rem', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))', zIndex: 10,
        transform: isEntering ? 'translateY(50px) scale(0.8)' : 'translateY(0) scale(1)',
        opacity: isEntering ? 0 : 1,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
      }}>
        <MascotRabbit style={{ width: '250px', height: '250px' }} />
      </div>
      
      <div style={{
        opacity: isEntering ? 0 : 1,
        transform: isEntering ? 'translateY(20px)' : 'translateY(0)',
        transition: 'all 0.6s ease-out 0.4s',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', color: '#1e3a8a', marginBottom: '0.5rem', textAlign: 'center' }}>{t('readyToLearn')}</h1>
        <p style={{ fontSize: '1.5rem', color: '#3b82f6', marginBottom: '3rem' }}>{t('todayMissionWaiting')}</p>
      </div>

      {/* Main Action */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '100px', height: '100px', zIndex: 0 }}>
          <MissionSun />
        </div>
        <button 
          className="btn-primary" 
          style={{ fontSize: '2rem', padding: '1.5rem 4rem', animation: 'pulse-glow 2s infinite', position: 'relative', zIndex: 1 }}
          onClick={handleStartMission}
        >
          <Play size={32} /> {t('startTodayMission')}
        </button>
      </div>

      {/* Secondary Actions (QA FIX: Mobile Responsive & Gamification Lock) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '4rem', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/map'); }}>
          <Map size={24} /> {t('soundMap')}
        </button>
        
        {/* Super Bubble Challenge */}
        {unlockedSounds.length >= 10 && (
          <button className="btn-secondary" onClick={handleStartBubble} style={{ background: '#fef08a', color: '#a16207', borderColor: '#fde047' }}>
            <span style={{ fontSize: '24px' }}>🎈</span> {t('bubbleChallenge')}
          </button>
        )}

        <button 
          className="btn-secondary" 
          onClick={(e) => { 
            if (hasCompletedDaily || tickets > 0) {
              audioEngine.playUI('pop');
              navigate('/braingames');
            } else {
              audioEngine.playUI('error');
              // visual shake
              e.currentTarget.style.animation = 'shake 0.3s';
              setTimeout(() => { e.currentTarget.style.animation = '' }, 300);
            }
          }}
          style={{ opacity: (hasCompletedDaily || tickets > 0) ? 1 : 0.5, cursor: (hasCompletedDaily || tickets > 0) ? 'pointer' : 'default' }}
        >
          {(hasCompletedDaily || tickets > 0) ? <Puzzle size={24} /> : <span style={{fontSize:'24px'}}>🔒</span>} {t('brainGames')}
        </button>
        <button className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/assignments'); }}>
          <ClipboardList size={24} /> {t('assignments')}
        </button>
      </div>

    </div>
  )
}
