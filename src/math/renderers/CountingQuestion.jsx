import React, { useState } from 'react';
import ObjectGroup from '../components/ObjectGroup';

export default function CountingQuestion({ question, onAnswer }) {
  const { values, choices } = question;
  const [attempts, setAttempts] = useState(0);
  const [highlighted, setHighlighted] = useState([]);

  const handleChoice = (choice) => {
    setAttempts(a => a + 1);
    if (choice === question.answer) {
      onAnswer(true, attempts + 1);
    } else {
      // First incorrect attempt: gently show them how to count by highlighting one
      if (attempts === 0) {
        setHighlighted([0]);
      } else {
        // Second incorrect: highlight all to make it easier to count
        setHighlighted(Array.from({ length: values.count }, (_, i) => i));
      }
      onAnswer(false, attempts + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <h2 style={{ color: '#1e293b', textAlign: 'center' }}>
        How many {values.label || 'items'}?
      </h2>
      
      <ObjectGroup 
        count={values.count} 
        emoji={values.emoji} 
        highlightedIndices={highlighted}
        layout="grid"
      />

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
            style={{ fontSize: '24px', padding: '16px', minHeight: '64px' }}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
