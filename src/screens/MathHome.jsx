import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Map as MapIcon, Lock } from 'lucide-react';
import MathMascot from '../math/components/MathMascot';
import { audioEngine } from '../audio/AudioEngine';
import { useGameStore } from '../store/gameStore';
import { composeMathSession } from '../math/engine/difficulty';
import { mathQuestionEngine } from '../math/engine/MathQuestionEngine';
import { createRandom } from '../math/engine/random';

export default function MathHome() {
  const navigate = useNavigate();
  const { 
    math, 
    startMathSession,
    getMathSkillStatus
  } = useGameStore();

  const handleStartDaily = () => {
    audioEngine.playUI('pop');
    // Generate session
    const plan = composeMathSession(math.unlockedSkillIds, math, getMathSkillStatus);
    const skills = plan.map(p => p.skillId);
    
    // The composeMathSession gives difficulty but MathQuestionEngine.generateSession needs stats
    // Or we just generate questions individually based on the plan.
    // Let's map plan to questions directly:
    const questions = plan.map((p, i) => {
      // Use index to salt the seed
      return mathQuestionEngine.generateQuestion(p.skillId, {
        difficulty: p.difficulty,
        random: createRandom(Date.now() + i) 
      });
    });

    startMathSession(questions);
    navigate('/math/daily');
  };

  const handleStartGym = () => {
    audioEngine.playUI('pop');
    // Find weakest skill
    let weakestSkill = null;
    let minScore = Infinity;
    Object.keys(math.learningStats || {}).forEach(skillId => {
      const stats = math.learningStats[skillId];
      if (stats.attempts >= 3) {
        const accuracy = stats.firstAttemptHits / stats.attempts;
        if (accuracy < minScore) {
          minScore = accuracy;
          weakestSkill = skillId;
        }
      }
    });
    
    // Fallback to first unlocked if no weak skill
    if (!weakestSkill) {
      weakestSkill = math.unlockedSkillIds[0];
    }

    const questions = [];
    for(let i=0; i<5; i++) {
      const q = mathQuestionEngine.generateQuestion(weakestSkill, {
        difficulty: 1, // Start easy
        random: createRandom(Date.now() + i)
      });
      if(q) {
        q.id = crypto.randomUUID();
        questions.push(q);
      }
    }
    
    startMathSession(questions);
    navigate('/math/gym');
  };

  return (
    <div className="screen-container" style={{
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #fef3c7, #fde68a)',
    }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => { audioEngine.playUI('pop'); navigate('/'); }}
          style={{
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
          }}
        >
          <ArrowLeft size={24} color="#f59e0b" />
          <span style={{color: '#f59e0b', fontWeight: 'bold', marginLeft: '0.5rem'}}>Back</span>
        </button>
        <h1 style={{ fontSize: '2rem', color: '#92400e', margin: 0 }}>
          Math Kingdom
        </h1>
        <div style={{ width: '48px' }} /> {/* Spacer */}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%', maxWidth: '600px' }}>
        
        {/* Mascot */}
        <div style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))' }}>
          <MathMascot style={{ width: '200px', height: '200px' }} />
        </div>

        {/* Daily Challenge Button */}
        {math.completedToday ? (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '24px',
            border: '4px solid #fcd34d',
            textAlign: 'center',
            width: '100%'
          }}>
            <h2 style={{ color: '#d97706', marginBottom: '1rem' }}>Great job today! 🎉</h2>
            <p style={{ color: '#92400e' }}>You completed your daily math challenge.</p>
          </div>
        ) : (
          <button 
            className="btn-primary" 
            onClick={handleStartDaily}
            style={{ 
              width: '100%', 
              padding: '2rem', 
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              background: '#f59e0b',
              boxShadow: '0 8px 0 #d97706, 0 15px 20px rgba(0,0,0,0.2)',
              animation: 'pulse-glow 2s infinite'
            }}
          >
            <Play size={40} /> Daily Challenge
          </button>
        )}

        {/* Other Areas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
          <button 
            className="btn-secondary"
            onClick={() => { audioEngine.playUI('pop'); navigate('/math/map'); }}
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.25rem',
              color: '#d97706',
              borderColor: '#fde68a'
            }}
          >
            <MapIcon size={32} />
            Mastery Map
          </button>
          
          <button 
            className="btn-secondary"
            onClick={handleStartGym}
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.25rem',
              color: '#4f46e5',
              borderColor: '#c7d2fe',
              background: 'white'
            }}
          >
            <span style={{ fontSize: '32px' }}>🏋️‍♂️</span>
            Training Gym
          </button>
        </div>

      </div>
    </div>
  );
}
