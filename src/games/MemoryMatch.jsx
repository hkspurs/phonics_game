import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { questionEngine } from '../game/QuestionEngine';
import { audioEngine } from '../audio/AudioEngine';

export default function MemoryMatch() {
  const navigate = useNavigate();
  const { tickets, useTicket } = useGameStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);

  // Initialize Game
  useEffect(() => {
    if (!isPlaying && tickets > 0) {
      useTicket();
      setIsPlaying(true);
      
      // Select 6 unique sounds from the curriculum
      const pool = [...questionEngine.sounds].sort(() => Math.random() - 0.5).slice(0, 6);
      
      // Create pairs: each sound has an "Audio" card and a "Text" card
      const deck = [];
      pool.forEach((sound, index) => {
        deck.push({ id: `audio_${index}`, pairId: index, type: 'audio', sound });
        deck.push({ id: `text_${index}`, pairId: index, type: 'text', sound });
      });
      
      // Shuffle deck
      deck.sort(() => Math.random() - 0.5);
      setCards(deck);
      
      // Preload audio
      audioEngine.preload(pool.map(s => s.audio_url));
      
    } else if (!isPlaying) {
      navigate('/braingames');
    }
  }, [isPlaying, tickets, navigate, useTicket]);

  const handleCardClick = (index) => {
    if (isLocked || flippedIndices.includes(index) || matchedPairs.includes(cards[index].pairId)) return;
    
    const card = cards[index];
    
    // Play sound if it's an audio card
    if (card.type === 'audio') {
      audioEngine.play(card.sound.audio_url);
    } else {
      audioEngine.playUI('pop');
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      
      const [firstIndex, secondIndex] = newFlipped;
      if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
        // Match!
        setTimeout(() => {
          audioEngine.play('assets/correct_chime.mp3').catch(()=>{});
          setMatchedPairs(prev => [...prev, cards[firstIndex].pairId]);
          setFlippedIndices([]);
          setIsLocked(false);
          
          if (matchedPairs.length + 1 === 6) {
             // Win!
             setTimeout(() => navigate('/braingames'), 3000);
          }
        }, 800);
      } else {
        // No match
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1200);
      }
    }
  };

  if (!isPlaying) return null;

  return (
    <div className="screen-container" style={{ background: '#f5f3ff', position: 'relative' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, marginBottom: '2rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem', background: 'white' }} onClick={() => navigate('/braingames')}>
          <X size={24} />
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ background: 'white', padding: '0.5rem 2rem', borderRadius: '100px', fontSize: '1.25rem', fontWeight: 'bold', color: '#6d28d9', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
             Moves: {moves}
           </div>
           <div style={{ background: 'white', padding: '0.5rem 2rem', borderRadius: '100px', fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
             Matches: {matchedPairs.length} / 6
           </div>
        </div>
      </div>

      <h1 style={{ textAlign: 'center', color: '#7c3aed', fontSize: '2.5rem', marginBottom: '2rem' }}>
        {matchedPairs.length === 6 ? '🎉 You matched them all! 🎉' : 'Memory Match'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '800px', margin: '0 auto', flex: 1 }}>
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card.pairId);
          
          return (
            <div 
              key={card.id} 
              onClick={() => handleCardClick(index)}
              style={{
                perspective: '1000px',
                height: '140px',
                cursor: isFlipped ? 'default' : 'pointer'
              }}
            >
              <div style={{
                position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>
                {/* Back of Card */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', borderRadius: '16px', border: '4px solid #ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '3rem', opacity: 0.5 }}>❓</div>
                </div>
                
                {/* Front of Card */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  background: matchedPairs.includes(card.pairId) ? '#d1fae5' : 'white', 
                  borderRadius: '16px', border: `4px solid ${matchedPairs.includes(card.pairId) ? '#34d399' : '#c4b5fd'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {card.type === 'audio' ? (
                    <Volume2 size={48} color={matchedPairs.includes(card.pairId) ? '#059669' : '#7c3aed'} />
                  ) : (
                    <span style={{ fontSize: '3rem', fontWeight: 'bold', color: matchedPairs.includes(card.pairId) ? '#059669' : '#1e3a8a' }}>
                      {card.sound.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
