import React, { useState } from 'react';
import ObjectGroup from '../components/ObjectGroup';

export default function ChoiceQuestion({ question, onAnswer }) {
  const { values, choices, answer, type } = question;
  const [attempts, setAttempts] = useState(0);

  const handleChoice = (choice) => {
    setAttempts(a => a + 1);
    if (choice === answer) {
      onAnswer(true, attempts + 1);
    } else {
      onAnswer(false, attempts + 1);
    }
  };

  const renderVisuals = () => {
    if (type === 'comparison') {
      return (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ObjectGroup count={values.a} emoji="🍎" />
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{values.a}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#cbd5e1' }}>?</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ObjectGroup count={values.b} emoji="🍎" />
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{values.b}</span>
          </div>
        </div>
      );
    }
    
    if (type === 'addition') {
      return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <ObjectGroup count={values.a} emoji={values.emoji || '🍎'} />
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>+</div>
          <ObjectGroup count={values.b} emoji={values.emoji || '🍎'} />
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>=</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>?</div>
        </div>
      );
    }

    if (type === 'subtraction') {
      return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <ObjectGroup count={values.a} emoji={values.emoji || '🍎'} />
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>-</div>
          <span style={{ fontSize: '48px' }}>{values.b}</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>=</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>?</div>
        </div>
      );
    }

    if (type === 'ordinal') {
      return (
        <div style={{ display: 'flex', gap: '8px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          {values.queue.map((char, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '48px' }}>{char}</span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>{i + 1}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const getTitle = () => {
    switch (type) {
      case 'comparison': return "Which is more?";
      case 'addition': return "How many altogether?";
      case 'subtraction': return "How many are left?";
      case 'ordinal': return `Who is at position ${values.position}?`;
      default: return "Choose the right answer!";
    }
  };

  // Extract label if choice is an object (for comparison)
  const getChoiceText = (c) => {
    if (typeof c === 'object' && c !== null) return c.label || c.value;
    if (type === 'comparison' && values.choiceLabels) {
      const labelObj = values.choiceLabels.find(l => l.value === c);
      return labelObj ? labelObj.label : c;
    }
    return c;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
      <h2 style={{ color: '#1e293b', textAlign: 'center' }}>{getTitle()}</h2>
      
      {renderVisuals()}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: choices.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '500px' 
      }}>
        {choices.map((choice, i) => (
          <button 
            key={i}
            className="btn-primary"
            onClick={() => handleChoice(choice)}
            style={{ fontSize: '24px', padding: '16px', minHeight: '64px' }}
          >
            {getChoiceText(choice)}
          </button>
        ))}
      </div>
    </div>
  );
}
