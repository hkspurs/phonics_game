import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Play, X, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import MapNodeCloud from '../components/MapNodeCloud'
import MascotRabbit from '../components/MascotRabbit'
import { audioEngine } from '../audio/AudioEngine'
import { questionEngine } from '../game/QuestionEngine'
import { useTranslation } from '../hooks/useTranslation'

export default function MasteryMap() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getNodeStatus, unlockedSounds, currentNode, currentChapter = 'A Families' } = useGameStore()
  const [selectedNode, setSelectedNode] = useState(null)
  const [isSwapping, setIsSwapping] = useState(false); // QA FIX: Prevent DOM thrashing

  // Extract dynamic chapters
  const families = Array.from(new Set(questionEngine.sounds.map(s => s.family).filter(Boolean)));
  const currentChapterIndex = families.indexOf(currentChapter);
  const handlePrevChapter = () => {
    if (isSwapping || currentChapterIndex <= 0) return;
    setIsSwapping(true);
    audioEngine.playUI('pop');
    useGameStore.getState().setChapter(families[currentChapterIndex - 1]);
    setTimeout(() => setIsSwapping(false), 400); // 400ms debounce matches CSS transition
  }
  const handleNextChapter = () => {
    if (isSwapping || currentChapterIndex >= families.length - 1) return;
    setIsSwapping(true);
    audioEngine.playUI('pop');
    useGameStore.getState().setChapter(families[currentChapterIndex + 1]);
    setTimeout(() => setIsSwapping(false), 400);
  }

  // QA FIX: Generate absolute pixel coordinates for perfect DOM vs SVG alignment
  const MAP_HEIGHT = 600;
  const chapterSounds = questionEngine.sounds.filter(s => s.family === currentChapter);
  const nodes = chapterSounds.map((sound, index) => {
    const isEven = index % 2 === 0;
    return {
      id: sound.label,
      status: getNodeStatus(sound.sound_id),
      x: 100 + (index * 150), 
      y: isEven ? 420 : 180, 
      soundId: sound.sound_id,
      soundData: sound
    };
  });
  const MAP_WIDTH = Math.max(1000, nodes.length * 150 + 200);

  const handleNodeClick = (node) => {
    if (node.status === 'locked') return;
    audioEngine.play(node.soundData.audio_url);
    setSelectedNode(node);
  }

  const handlePractice = () => {
    audioEngine.playUI('correct'); // QA FIX: Magical mission start sound
    if (selectedNode.status === 'weak') {
      useGameStore.getState().startGymWorkout(selectedNode.soundData.sound_id);
      navigate('/gym');
    } else {
      useGameStore.setState({ activeAssignment: { id: 'map_practice', targetSoundId: selectedNode.soundData.label, title: `Practice: ${selectedNode.soundData.label}` } });
      navigate('/challenge');
    }
  }

  const playSoundAgain = () => {
    audioEngine.play(selectedNode.soundData.audio_url);
  }

  // QA FIX: Scroll lock & Escape dismissal for Modal
  useEffect(() => {
    if (selectedNode) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => e.key === 'Escape' && setSelectedNode(null);
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [selectedNode]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'mastered': return '#fbbf24'; // Gold
      case 'unlocked': return '#4ade80'; // Green
      case 'practising': return '#38bdf8'; // Light Blue
      case 'weak': return '#a855f7'; // QA FIX: Purple (Power-up) instead of Red (Punishment)
      default: return '#94a3b8'; // Grey
    }
  }

  // QA FIX: Smooth cubic bezier paths (C) instead of rigid (Q/T)
  const generatePath = () => {
    if (nodes.length === 0) return '';
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i-1];
      const curr = nodes[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  // QA FIX: Find latest unlocked node for rabbit to prevent amnesia
  const unlockedNodesInChapter = nodes.filter(n => n.status !== 'locked');
  let currentLevelNode = nodes.find(n => n.soundId === currentNode);
  
  if (!currentLevelNode) {
    if (unlockedNodesInChapter.length > 0) {
      currentLevelNode = unlockedNodesInChapter[unlockedNodesInChapter.length - 1];
    } else if (nodes.length > 0) {
      currentLevelNode = nodes[0];
    }
  }

  const hasNodes = nodes.length > 0;

  return (
    <div className="screen-container" style={{ background: '#fef3c7', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/')}>
          <Home size={24} /> {t('backToHome')}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 
            style={{ textAlign: 'center', color: '#b45309', fontSize: '2.5rem', margin: 0 }}
          >
            {t('adventureMap')}
          </h1>
          <button 
            style={{
              background: '#fcd34d',
              border: '4px solid white',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(245,158,11,0.3), 0 4px 0 #fbbf24',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(245,158,11,0.3), 0 0px 0 #fbbf24'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(245,158,11,0.3), 0 4px 0 #fbbf24'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(245,158,11,0.3), 0 4px 0 #fbbf24'; }}
            onClick={() => {
              import('../audio/AudioEngine').then(m => m.audioEngine.playUI('pop'));
            }}
            aria-label="Read Aloud"
          >
            <Volume2 size={24} color="#b45309" strokeWidth={3} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.95)', padding: '0.5rem', borderRadius: '100px', border: '4px solid #fcd34d', boxShadow: '0 8px 0 #fbbf24, 0 4px 12px rgba(0,0,0,0.1)' }}>
          <button onClick={handlePrevChapter} disabled={isSwapping || currentChapterIndex <= 0} style={{ background: currentChapterIndex <= 0 ? '#f1f5f9' : '#38bdf8', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: currentChapterIndex <= 0 ? 'not-allowed' : 'pointer', opacity: currentChapterIndex <= 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: currentChapterIndex <= 0 ? 'none' : '0 4px 0 #0284c7', transform: isSwapping ? 'scale(0.95)' : 'none', transition: 'all 0.2s' }}>
            <ArrowLeft size={32} color="white" />
          </button>
          <span style={{ fontSize: '1.5rem', color: '#b45309', fontWeight: 'bold', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>
            {currentChapter ? currentChapter.split(' ')[0] : '...'}
          </span>
          <button onClick={handleNextChapter} disabled={isSwapping || currentChapterIndex >= families.length - 1} style={{ background: currentChapterIndex >= families.length - 1 ? '#f1f5f9' : '#38bdf8', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: currentChapterIndex >= families.length - 1 ? 'not-allowed' : 'pointer', opacity: currentChapterIndex >= families.length - 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: currentChapterIndex >= families.length - 1 ? 'none' : '0 4px 0 #0284c7', transform: isSwapping ? 'scale(0.95)' : 'none', transition: 'all 0.2s' }}>
            <ArrowLeft size={32} color="white" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      {/* Scrollable Map Area */}
      <div style={{ 
        position: 'relative', width: '100%', flex: 1, marginTop: '1rem', 
        border: '6px solid #fcd34d', borderRadius: '32px', overflowX: 'auto', overflowY: 'auto', 
        background: 'linear-gradient(to bottom, #dbeafe, #fef3c7)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' 
      }}>
        
        {/* Absolute Canvas */}
        <div style={{ position: 'relative', width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px`, opacity: isSwapping ? 0 : 1, transform: isSwapping ? 'translateY(10px)' : 'none', transition: 'opacity 0.2s, transform 0.2s' }}>
          
          {/* Decorative Scenery */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '4rem', opacity: 0.6, pointerEvents: 'none' }}>☁️</div>
          <div style={{ position: 'absolute', top: '15%', right: '25%', fontSize: '3rem', opacity: 0.5, pointerEvents: 'none' }}>☁️</div>
          <div style={{ position: 'absolute', bottom: '20%', left: '15%', fontSize: '3rem', opacity: 0.7, pointerEvents: 'none' }}>🌲</div>
          <div style={{ position: 'absolute', bottom: '15%', left: '40%', fontSize: '4rem', opacity: 0.7, pointerEvents: 'none' }}>🌲</div>
          <div style={{ position: 'absolute', top: '30%', left: '60%', fontSize: '3rem', opacity: 0.5, pointerEvents: 'none' }}>⛰️</div>
          <div style={{ position: 'absolute', bottom: '25%', right: '10%', fontSize: '3.5rem', opacity: 0.8, pointerEvents: 'none' }}>🍄</div>
          <div style={{ position: 'absolute', top: '40%', right: '5%', fontSize: '3rem', opacity: 0.6, pointerEvents: 'none' }}>🌲</div>

          {!hasNodes && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <div style={{ transform: 'scale(1.5)', marginBottom: '3rem', opacity: 0.4, filter: 'grayscale(1)' }}>
                <MascotRabbit />
              </div>
              <div style={{ background: '#f1f5f9', padding: '1rem 2rem', borderRadius: '32px', border: '4px dashed #cbd5e1' }}>
                {t('underConstruction')}
              </div>
            </div>
          )}

          {hasNodes && (
            <>
              {/* Global SVG Defs to save GPU */}
          <svg style={{ width: 0, height: 0, position: 'absolute' }}>
            <defs>
              <filter id="global-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </svg>

          {/* Base Path (Locked) */}
          <svg width={MAP_WIDTH} height={MAP_HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
            <path d={generatePath()} fill="none" stroke="#cbd5e1" strokeWidth="16" strokeDasharray="1 30" strokeLinecap="round" />
          </svg>

          {/* Mastered/Unlocked Path */}
          <svg width={MAP_WIDTH} height={MAP_HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
            <path d={generatePath()} fill="none" stroke="#fbbf24" strokeWidth="16" strokeDasharray="1 30" strokeLinecap="round" className="map-path-animate" style={{ clipPath: `inset(0 ${MAP_WIDTH - currentLevelNode.x}px 0 0)` }} />
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id} style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{ position: 'relative', width: '120px', height: '100px' }}>
                <MapNodeCloud 
                  status={node.status}
                  statusColor={getStatusColor(node.status)}
                  isMastered={node.status === 'mastered'} 
                  isLocked={node.status === 'locked'} 
                  onClick={() => handleNodeClick(node)}
                  style={{ position: 'absolute', inset: 0 }}
                />
                <div style={{
                  position: 'absolute',
                  top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
                  fontSize: '1.4rem', fontWeight: 'bold', pointerEvents: 'none',
                  color: node.status === 'locked' ? '#94A3B8' : '#6b21a8',
                  display: 'flex', alignItems: 'center', gap: '0.2rem'
                }}>
                  {node.id}
                  {node.status === 'weak' && <span style={{ fontSize: '1rem' }}>🏋️‍♂️</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Mascot Rabbit */}
          {currentLevelNode && (
            <div style={{
              position: 'absolute',
              left: `${currentLevelNode.x}px`,
              top: `${currentLevelNode.y - 70}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              pointerEvents: 'none',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' // Soft animation
            }}>
              <div style={{ animation: 'bounce 2s infinite' }}>
                <MascotRabbit style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
              </div>
            </div>
          )}
          
          </>
        )}
        </div>
      </div>

      {/* Pan Affordance */}
      {hasNodes && (
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)', padding: '0.75rem 1.5rem', borderRadius: '100px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)', border: '2px solid #fcd34d',
          color: '#b45309', fontWeight: 'bold', fontSize: '1.2rem',
          animation: 'bounce 2s infinite', pointerEvents: 'none', zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          👆 Swipe to explore ↔️
        </div>
      )}

      {/* Accessible Interactive Modal */}
      {selectedNode && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'popIn 0.3s', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            {/* QA FIX: Larger Touch Target for X */}
            <button className="btn-secondary" aria-label="Close modal" style={{ position: 'absolute', top: '1rem', right: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={() => setSelectedNode(null)}>
              <X size={28} />
            </button>
            
            <h2 id="modal-title" style={{ color: '#6b21a8', fontSize: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {selectedNode.id}
              {/* QA FIX: Giant Replay Audio Button */}
              <button onClick={playSoundAgain} style={{ background: '#fef08a', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 #eab308' }}>
                <Volume2 size={24} color="#ca8a04" />
              </button>
            </h2>

            {/* Visual Reward Status */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem', marginBottom: '1rem' }}>
              {selectedNode.status === 'mastered' ? '⭐⭐⭐' : '⭐☆☆'}
            </div>

            {/* QA FIX: Child-friendly adaptive copy */}
            <p style={{ color: '#475569', fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 'bold' }}>
              {selectedNode.status === 'mastered' 
                ? t('mapMastered')
                : selectedNode.status === 'weak'
                  ? t('mapNeedsPractice', { skill: selectedNode.id })
                  : t('mapLearn')}
            </p>

            <button className="btn-primary" style={{ width: '100%', fontSize: '1.5rem', padding: '1rem', justifyContent: 'center' }} onClick={handlePractice}>
              {selectedNode.status === 'weak' ? (
                <>🏋️‍♂️ {t('toTheGym')}</>
              ) : (
                <><Play size={28} fill="currentColor" /> {t('go')}</>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
