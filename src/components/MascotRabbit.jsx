import React from 'react';
import './MascotRabbit.css'; // Keep css for animations if any

export default function MascotRabbit({ style, isListening = false, feedbackState = null }) {
  const isCorrect = feedbackState === 'correct';
  const isWrong = feedbackState === 'wrong';

  let sprite = 'player_idle.png';
  if (isCorrect) {
    sprite = 'player_cheer1.png';
  } else if (isWrong) {
    sprite = 'player_hurt.png';
  } else if (isListening) {
    sprite = 'player_talk.png';
  }

  const imgSrc = `/assets/kenney/platformer-characters/PNG/Player/Poses/${sprite}`;

  return (
    <div className={`mascot-rabbit-container ${isListening ? 'listening' : 'idle'}`} 
         style={{ 
           ...style, 
           transform: isCorrect ? 'translateY(-20px)' : 'none', 
           transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           position: 'relative'
         }}>
         
      {/* Shadow */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        width: '60%',
        height: '10px',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '50%',
        zIndex: 0
      }}></div>

      <img 
        src={imgSrc} 
        alt="Mascot" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          zIndex: 1,
          filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))'
        }} 
      />
    </div>
  );
}
