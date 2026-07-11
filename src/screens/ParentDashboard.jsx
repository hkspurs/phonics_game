import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { questionEngine } from '../game/QuestionEngine'
import { audioEngine } from '../audio/AudioEngine'
import { ArrowLeft, Volume2, AlertTriangle, CheckCircle, Trash2, BookOpen, Skull, Play, XCircle } from 'lucide-react'
import DonutChart from '../components/DonutChart'
import MascotRabbit from '../components/MascotRabbit'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { learningStats, unlockedSounds, currentNode, activeAssignment, getNodeStatus, resetProgress, refresherMode, toggleRefresherMode, tickets, addTicket, math, resetMathProgress } = useGameStore()
  const [toastMsg, setToastMsg] = React.useState(null);
  const [selectedChapter, setSelectedChapter] = React.useState('A Families');
  const [activeTab, setActiveTab] = React.useState('phonics'); // 'phonics' | 'math'

  const showToast = (msg) => {
    setToastMsg(msg);
    audioEngine.playUI('pop');
    setTimeout(() => setToastMsg(null), 3000);
  }

  const handleReset = () => {
    if (window.confirm("Are you sure you want to wipe all progress? This will reset the child's entire journey for both subjects. This cannot be undone.")) {
      resetProgress();
      resetMathProgress();
      navigate('/');
    }
  }

  const handleAssign = (sound) => {
    if (activeAssignment?.targetSoundId === sound.label) {
      useGameStore.setState({ activeAssignment: null });
      showToast(`Removed assignment for ${sound.label}.`);
    } else {
      useGameStore.setState({
        activeAssignment: { id: 'asgn_' + Date.now(), targetSoundId: sound.label, title: `Custom Assignment: ${sound.label}`, completed: false }
      });
      showToast(`Assigned ${sound.label} to the child's dashboard.`);
    }
  }

  const handleForceUnlock = (sound) => {
    if (window.confirm(`Warning: Jumping ahead to ${sound.label} might frustrate the child if they miss foundational sounds. Proceed?`)) {
      useGameStore.setState(state => {
        const newUnlocked = state.unlockedSounds.includes(sound.sound_id) ? state.unlockedSounds : [...state.unlockedSounds, sound.sound_id];
        return { currentNode: sound.label, unlockedSounds: newUnlocked };
      });
      showToast(`Map Current Node forcibly set to ${sound.label}.`);
    }
  }

  const handleGiveTicket = () => {
    addTicket();
    showToast(`Gave 1 Train Ticket to the child! (Total: ${tickets + 1})`);
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
  const topConfusions = confusedPairs.slice(0, 5); // Limit to top 5

  let totalAttempts = 0;
  let totalFirstHits = 0;
  Object.values(learningStats).forEach(stat => {
    totalAttempts += stat.attempts || 0;
    totalFirstHits += stat.firstAttemptHits || 0;
  });
  const overallAccuracy = totalAttempts > 0 ? ((totalFirstHits / totalAttempts) * 100).toFixed(1) : 0;

  // --- Math Analytics ---
  const mathStats = math.learningStats || {};
  const weakMathSkills = Object.entries(mathStats).filter(([k, v]) => v.attempts >= 3 && (v.firstAttemptHits / v.attempts) < 0.6);
  const masteredMathSkills = Object.entries(mathStats).filter(([k, v]) => v.attempts >= 3 && (v.firstAttemptHits / v.attempts) >= 0.9);
  
  let mathTotalAttempts = 0;
  let mathTotalFirstHits = 0;
  Object.values(mathStats).forEach(stat => {
    mathTotalAttempts += stat.attempts || 0;
    mathTotalFirstHits += stat.firstAttemptHits || 0;
  });
  const mathOverallAccuracy = mathTotalAttempts > 0 ? ((mathTotalFirstHits / mathTotalAttempts) * 100).toFixed(1) : 0;

  // Group sounds by first letter
  const groupedSounds = {};
  questionEngine.sounds.forEach(sound => {
    const letter = sound.label[0].toUpperCase();
    if (!groupedSounds[letter]) groupedSounds[letter] = [];
    groupedSounds[letter].push(sound);
  });
  const sortedLetters = Object.keys(groupedSounds).sort();

  // Extract dynamic families for Chapter Refresher
  const families = Array.from(new Set(questionEngine.sounds.map(s => s.family).filter(Boolean)));

  return (
    <div className="screen-container" style={{ background: '#f8fafc', padding: '2rem', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(59,130,246,0.5)', zIndex: 100, animation: 'float 2s infinite' }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/'); }}>
            <ArrowLeft size={24} /> Back to Game
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MascotRabbit style={{ width: '50px', height: '50px' }} />
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.8rem' }}>Learning Hub</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', border: '2px solid #e2e8f0', fontWeight: 'bold', color: '#64748b' }}>
            Tickets: <span style={{ color: '#d946ef' }}>{tickets} 🎟️</span>
          </div>
          <button 
            className="btn-primary" 
            style={{ background: '#d946ef', boxShadow: '0 6px 0 #a21caf, 0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '1rem', padding: '0.75rem 1.5rem' }} 
            onClick={handleGiveTicket}
          >
            + Give Ticket
          </button>
        </div>
      </div>

      {/* Subject Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('phonics')}
          style={{
            flex: 1, padding: '1rem', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            background: activeTab === 'phonics' ? '#3b82f6' : '#e2e8f0',
            color: activeTab === 'phonics' ? 'white' : '#64748b',
            boxShadow: activeTab === 'phonics' ? '0 4px 6px rgba(59,130,246,0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >🔤 Phonics</button>
        <button 
          onClick={() => setActiveTab('math')}
          style={{
            flex: 1, padding: '1rem', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            background: activeTab === 'math' ? '#f59e0b' : '#e2e8f0',
            color: activeTab === 'math' ? 'white' : '#64748b',
            boxShadow: activeTab === 'math' ? '0 4px 6px rgba(245,158,11,0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >🔢 Maths</button>
      </div>

      {activeTab === 'phonics' && (
        <>

      {/* Refresher Mode Banner */}
      <div style={{ background: refresherMode ? '#fef3c7' : 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: refresherMode ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ Refresher Bootcamp Mode
          </h2>
          <p style={{ color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>
            Batch unlocks vowel families and changes daily missions to rapid diagnostic tests to quickly revive forgotten sounds.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: '#334155' }}>Select Chapter:</label>
            <select 
              value={selectedChapter} 
              onChange={(e) => { audioEngine.playUI('pop'); setSelectedChapter(e.target.value); }}
              disabled={refresherMode}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: refresherMode ? '#f1f5f9' : 'white', cursor: refresherMode ? 'not-allowed' : 'pointer' }}
            >
              {families.map(family => (
                <option key={family} value={family}>{family}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={() => { audioEngine.playUI('pop'); toggleRefresherMode(selectedChapter); showToast(refresherMode ? 'Refresher Mode Disabled' : `Refresher Mode Enabled for ${selectedChapter}!`); }}
          style={{
            background: refresherMode ? '#f59e0b' : '#e2e8f0',
            color: refresherMode ? 'white' : '#64748b',
            border: 'none', borderRadius: '100px', padding: '0.75rem 2rem', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: refresherMode ? '0 4px 10px rgba(245,158,11,0.4)' : 'none',
            transition: 'all 0.3s'
          }}
        >
          {refresherMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: 'calc(100vh - 150px)' }}>
        
        {/* Left Column: Analytics */}
        <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Learning Analytics</h2>
          
          {/* Overview Metrics */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>TOTAL FOCUS</span>
              <span style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 'bold' }}>{totalAttempts}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Meaningful Attempts</span>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>LEARNING GROWTH</span>
              <DonutChart percentage={parseFloat(overallAccuracy)} color={overallAccuracy > 80 ? '#10b981' : '#0ea5e9'} />
            </div>
          </div>

          <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20}/> Areas to Practice</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Sounds that need a little more love.</p>
          {weakSounds.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '3rem', animation: 'float 3s infinite' }}>🏆</div>
              <p style={{ color: '#64748b', fontWeight: 'bold', marginTop: '0.5rem' }}>Looking Great!</p>
            </div>
          ) : (
            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {weakSounds.map(([soundId, stats]) => (
                <li key={soundId} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#991b1b', fontSize: '1.2rem' }}>{soundId}</strong> 
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{(stats.firstAttemptHits/stats.attempts * 100).toFixed(0)}%</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#991b1b', opacity: 0.8 }}>💡 Tip: Try practicing this sound in front of a mirror together!</span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}><Skull size={20}/> Confused Pairs</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Sounds that sound alike (Top 5).</p>
          {topConfusions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>No confusions logged yet.</p>
          ) : (
            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topConfusions.map((pair, idx) => (
                <li key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fef3c7', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#92400e' }}>Mixed <strong>{pair.target}</strong> & <strong>{pair.confused}</strong></span>
                    <span style={{ background: '#f59e0b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>{pair.count}x</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button onClick={() => { audioEngine.playUI('pop'); audioEngine.play(questionEngine.sounds.find(s=>s.label===pair.target)?.audio_url) }} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fcd34d', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Volume2 size={12}/> {pair.target}</button>
                     <button onClick={() => { audioEngine.playUI('pop'); audioEngine.play(questionEngine.sounds.find(s=>s.label===pair.confused)?.audio_url) }} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fcd34d', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Volume2 size={12}/> {pair.confused}</button>
                  </div>
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
        <div style={{ flex: '2 1 500px', background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            Curriculum Control
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>Total Sounds: {questionEngine.sounds.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {sortedLetters.map(letter => (
              <div key={letter}>
                <h3 style={{ color: '#0ea5e9', borderBottom: '2px solid #bae6fd', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '1.2rem' }}>{letter}</span> Sounds
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, listStyle: 'none' }}>
                  {groupedSounds[letter].map(sound => {
                    const status = getNodeStatus(sound.sound_id);
                    const isAssigned = activeAssignment?.targetSoundId === sound.label;

                    return (
                      <li key={sound.sound_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s', ':hover': { boxShadow: '0 4px 6px rgba(0,0,0,0.05)' } }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '150px' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{sound.label}</span>
                          <span style={{ 
                            fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '100px', fontWeight: 'bold',
                            background: status === 'mastered' ? '#d1fae5' : status === 'weak' ? '#fee2e2' : status === 'practising' ? '#dbeafe' : status === 'unlocked' ? '#e0f2fe' : '#f1f5f9',
                            color: status === 'mastered' ? '#047857' : status === 'weak' ? '#b91c1c' : status === 'practising' ? '#1d4ed8' : status === 'unlocked' ? '#0369a1' : '#64748b'
                          }}>
                            {status.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" aria-label={`Preview Audio for ${sound.label}`} style={{ padding: '0.5rem', fontSize: '1rem' }} onClick={() => { audioEngine.playUI('pop'); audioEngine.play(sound.audio_url); }} title="Preview Audio">
                            <Volume2 size={20} />
                          </button>
                          <button 
                            className="btn-secondary" 
                            aria-label={isAssigned ? `Unassign ${sound.label}` : `Assign ${sound.label}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '1rem', color: isAssigned ? '#ef4444' : '#0ea5e9', borderColor: isAssigned ? '#ef4444' : '#bae6fd' }} 
                            onClick={() => handleAssign(sound)}
                          >
                            {isAssigned ? <><XCircle size={18}/> Unassign</> : <><BookOpen size={18} /> Assign</>}
                          </button>
                          <button className="btn-secondary" aria-label={`Force Unlock ${sound.label}`} style={{ padding: '0.5rem 1rem', fontSize: '1rem', color: '#d946ef' }} onClick={() => handleForceUnlock(sound)}>
                            Force Unlock
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '4rem', padding: '2rem', borderTop: '2px dashed #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>Advanced Settings</h3>
            <button className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', margin: '0 auto' }} onClick={handleReset}>
              <Trash2 size={20} /> Wipe All Progress
            </button>
          </div>
        </div>

      </div>
      </>)}

      {activeTab === 'math' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: 'calc(100vh - 150px)' }}>
          <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Maths Analytics</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>TOTAL FOCUS</span>
                <span style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 'bold' }}>{mathTotalAttempts}</span>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>GROWTH</span>
                <DonutChart percentage={parseFloat(mathOverallAccuracy)} color={mathOverallAccuracy > 80 ? '#10b981' : '#f59e0b'} />
              </div>
            </div>

            <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20}/> Skills to Practice</h3>
            {weakMathSkills.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Looking Great!</p>
            ) : (
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weakMathSkills.map(([skillId, stats]) => (
                  <li key={skillId} style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                    <strong>{skillId}</strong> ({(stats.firstAttemptHits/stats.attempts * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            )}

            <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}><CheckCircle size={20}/> Mastered Skills</h3>
            {masteredMathSkills.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Keep practicing!</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {masteredMathSkills.map(([skillId]) => (
                  <span key={skillId} style={{ background: '#d1fae5', color: '#047857', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold' }}>
                    {skillId}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: '2 1 500px', background: 'white', borderRadius: '16px', padding: '1.5rem', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Maths Curriculum Status
            </h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, listStyle: 'none' }}>
              {math.unlockedSkillIds.map(skillId => {
                const stats = math.learningStats[skillId];
                return (
                  <li key={skillId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{skillId}</span>
                    <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>Unlocked</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
