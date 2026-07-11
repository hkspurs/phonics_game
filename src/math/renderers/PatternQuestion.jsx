import React, { useState } from 'react';

export default function PatternQuestion({ question, onAnswer }) {
  const { values, choices, answer } = question;
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
        What comes next?
      </h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        padding: '24px', 
        backgroundColor: '#f1f5f9', 
        borderRadius: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {values.visibleItems.map((item, i) => (
          <div key={i} style={{ fontSize: '48px' }}>
            {item}
          </div>
        ))}
        <div style={{ 
          fontSize: '48px', 
          color: '#cbd5e1', 
          borderBottom: '4px dashed #cbd5e1', 
          width: '56px', 
          textAlign: 'center' 
        }}>
          ?
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap', 
        justifyContent: 'center' 
      }}>
        {choices.map((choice, i) => (
          <button 
            key={i}
            className="btn-primary"
            onClick={() => handleChoice(choice)}
            style={{ 
              fontSize: '48px', 
              width: '80px', 
              height: '80px', 
              padding: '0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
