import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'
import { ArrowLeft, Volume2, AlertTriangle, CheckCircle, Trash2, BookOpen, Skull } from 'lucide-react'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { learningStats, unlockedSounds, currentNode, activeAssignment, getNodeStatus } = useGameStore()

  const handleReset = () => {
    if (window.confirm("NUCLEAR OPTION: Are you sure you want to wipe all progress? This cannot be undone.")) {
      localStorage.removeItem('phonics-game-storage');
      window.location.href = '/';
    }
  }

  const handleAssign = (sound) => {
    useGameStore.setState({
      activeAssignment: { id: 'asgn_' + Date.now(), targetSoundId: sound.label, title: `Custom Assignment: ${sound.label}`, completed: false }
    });
    alert(`Assigned ${sound.label} to the child's dashboard.`);
  }

  const handleForceUnlock = (sound) => {
    useGameStore.setState(state => {
      const newUnlocked = state.unlockedSounds.includes(sound.sound_id) ? state.unlockedSounds : [...state.unlockedSounds, sound.sound_id];
      return { currentNode: sound.label, unlockedSounds: newUnlocked };
    });
    alert(`Map Current Node forcibly set to ${sound.label}.`);
  }

  // Analytics Computation
  const weakSounds = Object.entries(learningStats).filter(([k, v]) => v.attempts >= 3 && (v.firstAttemptHits / v.attempts) < 0.6);
  const masteredSounds = Object.entries(learningStats).filter(([k, v]) => v.attempts >= 3 && (v.firstAttemptHits / v.attempts) >= 0.9);
  
  const confusedPairs = [];
  Object.entries(learningStats).forEach(([k, v]) => {
    Object.entries(v.confusedWith || {}).forEach(([confusedWithLabel, count]) => {
      if (count > 0) confusedPairs.push({ target: k, confused: confusedWithLabel, count });
    });
  });
  confusedPairs.sort((a, b) => b.count - a.count);

  let totalAttempts = 0;
  let totalFirstHits = 0;
  Object.values(learningStats).forEach(stat => {
    totalAttempts += stat.attempts || 0;
    totalFirstHits += stat.firstAttemptHits || 0;
  });
  const overallAccuracy = totalAttempts > 0 ? ((totalFirstHits / totalAttempts) * 100).toFixed(1) : 0;

  return (
    <div className="screen-container" style={{ background: '#f8fafc', padding: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={24} /> Back to Game
        </button>
        <h1 style={{ color: '#0f172a', margin: 0 }}>Parent & Teacher Dashboard</h1>
        <button className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={handleReset}>
          <Trash2 size={24} /> Factory Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
        
        {/* Left Column: Analytics */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Learning Analytics</h2>
          
          {/* Overview Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold' }}>TOTAL ATTEMPTS</span>
              <span style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}>{totalAttempts}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold' }}>OVERALL ACCURACY</span>
              <span style={{ color: '#0ea5e9', fontSize: '2rem', fontWeight: 'bold' }}>{overallAccuracy}%</span>
            </div>
          </div>

          <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20}/> Weak Sounds</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Accuracy below 60% after 3+ attempts.</p>
          {weakSounds.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>No weak sounds detected yet.</p> : (
            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {weakSounds.map(([soundId, stats]) => (
                <li key={soundId} style={{ display: 'flex', justifyContent: 'space-between', background: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <strong style={{ color: '#991b1b' }}>{soundId}</strong> 
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{(stats.firstAttemptHits/stats.attempts * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}><Skull size={20}/> Confused Pairs</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Sounds that the child frequently mixes up.</p>
          {confusedPairs.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>No confusions logged yet.</p> : (
            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {confusedPairs.map((pair, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#fef3c7', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <span style={{ color: '#92400e' }}>Confused <strong>{pair.target}</strong> with <strong>{pair.confused}</strong></span>
                  <span style={{ background: '#f59e0b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>{pair.count}x</span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}><CheckCircle size={20}/> Mastered Sounds</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Accuracy above 90% after 3+ attempts.</p>
          {masteredSounds.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>None mastered yet.</p> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {masteredSounds.map(([soundId]) => (
                <span key={soundId} style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#047857', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 2px 0 #10b981' }}>
                  {soundId}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Curriculum Control */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            Curriculum Control
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>Total Sounds: {questionEngine.sounds.length}</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questionEngine.sounds.map(sound => {
              const status = getNodeStatus(sound.sound_id);
              return (
                <div key={sound.sound_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '200px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{sound.label}</span>
                    <span style={{ 
                      fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '100px', fontWeight: 'bold',
                      background: status === 'mastered' ? '#d1fae5' : status === 'weak' ? '#fee2e2' : status === 'practising' ? '#dbeafe' : status === 'unlocked' ? '#e0f2fe' : '#f1f5f9',
                      color: status === 'mastered' ? '#047857' : status === 'weak' ? '#b91c1c' : status === 'practising' ? '#1d4ed8' : status === 'unlocked' ? '#0369a1' : '#64748b'
                    }}>
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '1rem' }} onClick={() => audioEngine.play(sound.audio_url)} title="Preview Audio">
                      <Volume2 size={20} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '1rem', color: '#0ea5e9' }} onClick={() => handleAssign(sound)}>
                      <BookOpen size={20} /> Assign
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '1rem', color: '#d946ef' }} onClick={() => handleForceUnlock(sound)}>
                      Force Unlock
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
