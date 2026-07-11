import React, { useState } from 'react';
import TenFrame from '../components/TenFrame';

export default function NumberBondQuestion({ question, onAnswer }) {
  const { values, choices, answer } = question;
  const { target, givenPart } = values;
  const [attempts, setAttempts] = useState(0);

  const handleChoice = (choice) => {
    setAttempts(a => a + 1);
    if (choice === answer) {
      onAnswer(true, attempts + 1);
    } else {
      onAnswer(false, attempts + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
      <h2 style={{ color: '#1e293b', textAlign: 'center' }}>
        Make {target}!
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <TenFrame count={givenPart} max={target === 5 ? 5 : 10} />
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
          {givenPart} and <span style={{ color: '#ef4444' }}>?</span> make {target}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        {choices.map((choice, i) => (
          <button 
            key={i}
            className="btn-primary"
            onClick={() => handleChoice(choice)}
            style={{ fontSize: '28px', padding: '16px', minHeight: '64px' }}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
