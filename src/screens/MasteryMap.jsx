import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import MapNodeCloud from '../components/MapNodeCloud'
import MascotRabbit from '../components/MascotRabbit'
import { audioEngine } from '../audio/AudioEngine'
import { questionEngine } from '../game/QuestionEngine'

export default function MasteryMap() {
  const navigate = useNavigate()
  const { getNodeStatus, unlockedSounds, currentNode } = useGameStore()
  const [selectedNode, setSelectedNode] = React.useState(null)

  const handleNodeClick = (nodeId, status) => {
    if (status === 'locked') return;
    const soundData = questionEngine.sounds.find(s => s.label === nodeId || s.sound_id === nodeId);
    if (soundData) {
      audioEngine.play(soundData.audio_url);
      setSelectedNode({ id: nodeId, status, soundData });
    }
  }

  const handlePractice = () => {
    audioEngine.playUI('pop');
    // For now, redirect to challenge. Ideally we'd set an active assignment.
    useGameStore.setState({ activeAssignment: { id: 'map_practice', targetSoundId: selectedNode.soundData.label, title: `Practice: ${selectedNode.soundData.label}` } });
    navigate('/challenge');
  }

  // Generate dynamic nodes based on curriculum order
  const nodes = [];
  questionEngine.sounds.slice(0, 15).forEach((sound, index) => {
    // Generate a zigzag pattern automatically
    const isEven = index % 2 === 0;
    nodes.push({
      id: sound.label,
      status: getNodeStatus(sound.sound_id),
      x: 10 + (index * 15), // space out horizontally
      y: isEven ? 70 : 30, // zigzag vertically
      soundId: sound.sound_id
    });
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'mastered': return '#fbbf24'; // Gold
      case 'unlocked': return '#4ade80'; // Green
      case 'practising': return '#38bdf8'; // Light Blue
      case 'weak': return '#f43f5e'; // Rose
      default: return '#94a3b8'; // Grey (locked)
    }
  }

  // Build dynamic SVG paths
  const generatePath = () => {
    if (nodes.length === 0) return '';
    let d = `M ${nodes[0].x * 10} ${nodes[0].y * 6}`;
    for (let i = 1; i < nodes.length; i++) {
      // Add a simple curve
      const midX = ((nodes[i-1].x + nodes[i].x) / 2) * 10;
      const midY = ((nodes[i-1].y + nodes[i].y) / 2) * 6;
      d += ` Q ${midX} ${nodes[i-1].y * 6} ${midX} ${midY} T ${nodes[i].x * 10} ${nodes[i].y * 6}`;
    }
    return d;
  }

  // Find where the rabbit should stand
  const currentLevelNode = nodes.find(n => n.soundId === currentNode) || nodes.find(n => n.status !== 'locked') || nodes[0];

  return (
    <div className="screen-container" style={{ background: '#fef3c7', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
        <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/')}>
          <ArrowLeft size={24} /> Back
        </button>
      </div>
      <h1 style={{ textAlign: 'center', color: '#b45309', fontSize: '2.5rem', marginTop: '1rem', zIndex: 10, position: 'relative' }}>Adventure Map</h1>

      {/* Map Area (Scrollable without breaking aspect ratio) */}
      <div style={{ 
        position: 'relative', width: '100%', flex: 1, marginTop: '1rem', 
        border: '6px solid #fcd34d', borderRadius: '32px', overflowX: 'auto', overflowY: 'hidden', 
        background: 'linear-gradient(to bottom, #dbeafe, #fef3c7)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' 
      }}>
        
        {/* Dynamic Canvas Size based on node count */}
        <div style={{ position: 'relative', width: `${Math.max(100, nodes.length * 15)}%`, minWidth: '800px', height: '100%' }}>
          
          {/* Base Path (Locked) */}
          <svg viewBox={`0 0 ${Math.max(1000, nodes.length * 150)} 600`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} preserveAspectRatio="none">
            <path d={generatePath()} fill="none" stroke="#cbd5e1" strokeWidth="12" strokeDasharray="1 24" strokeLinecap="round" />
          </svg>

          {/* Mastered/Unlocked Path (Overlay) */}
          <svg viewBox={`0 0 ${Math.max(1000, nodes.length * 150)} 600`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} preserveAspectRatio="none">
            <path d={generatePath()} fill="none" stroke="#fbbf24" strokeWidth="12" strokeDasharray="1 24" strokeLinecap="round" className="map-path-animate" style={{ clipPath: `inset(0 ${100 - ((nodes.indexOf(currentLevelNode) + 1) / nodes.length) * 100}% 0 0)` }} />
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
            }}>
              <div style={{ position: 'relative', width: '120px', height: '100px' }}>
                <MapNodeCloud 
                  status={node.status}
                  statusColor={getStatusColor(node.status)}
                  isMastered={node.status === 'mastered'} 
                  isLocked={node.status === 'locked'} 
                  onClick={() => handleNodeClick(node.id, node.status)}
                  style={{ position: 'absolute', inset: 0 }}
                />
                <div style={{
                  position: 'absolute',
                  top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                  fontSize: '1.4rem', fontWeight: 'bold', pointerEvents: 'none',
                  color: node.status === 'locked' ? '#94A3B8' : '#6b21a8'
                }}>
                  {node.id}
                </div>
              </div>
            </div>
          ))}

          {/* Mascot Rabbit indicating current position! */}
          {currentLevelNode && (
            <div style={{
              position: 'absolute',
              left: `${currentLevelNode.x}%`,
              top: `${currentLevelNode.y - 12}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              pointerEvents: 'none',
              animation: 'bounce 2s infinite'
            }}>
              <MascotRabbit style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
            </div>
          )}
        </div>
      </div>

      {/* Node Interaction Modal */}
      {selectedNode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'popIn 0.3s', position: 'relative' }}>
            <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem' }} onClick={() => setSelectedNode(null)}>
              <X size={24} />
            </button>
            <h2 style={{ color: '#6b21a8', fontSize: '2rem', marginBottom: '1rem' }}>Sound: {selectedNode.id}</h2>
            <div style={{ display: 'inline-block', background: getStatusColor(selectedNode.status), color: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold', marginBottom: '2rem' }}>
              {selectedNode.status.toUpperCase()}
            </div>
            <p style={{ color: '#475569', marginBottom: '2rem' }}>Ready to practice this sound and earn stars?</p>
            <button className="btn-primary" style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }} onClick={handlePractice}>
              <Play size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Let's Practice!
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
