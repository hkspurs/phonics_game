import React from 'react';
import { Delete } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

const VirtualKeyboard = ({ onKeyPress, disabled }) => {
  // A-Z alphabetical
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handlePress = (key) => {
    if (disabled) return;
    audioEngine.playUI('pop');
    onKeyPress(key);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '100%',
      maxWidth: '600px',
      margin: '1rem auto 0',
      background: 'rgba(255, 255, 255, 0.8)',
      padding: '1rem',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        justifyContent: 'center'
      }}>
        {letters.map((letter) => (
          <button
            key={letter}
            className="btn-secondary"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              handlePress(letter);
            }}
            style={{
              padding: '0.75rem 0',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              minWidth: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#1e3a8a',
              opacity: disabled ? 0.5 : 1,
              touchAction: 'manipulation' // Prevents double-tap zoom
            }}
          >
            {letter}
          </button>
        ))}
        {/* Backspace Button takes 2 column slots */}
        <button
          className="btn-secondary"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            handlePress('BACKSPACE');
          }}
          style={{
            gridColumn: 'span 2',
            padding: '0.75rem 0',
            color: '#ef4444',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: disabled ? 0.5 : 1,
            touchAction: 'manipulation'
          }}
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
