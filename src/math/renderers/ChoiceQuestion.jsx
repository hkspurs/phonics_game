import React, { useState, useEffect } from 'react';
import ObjectGroup from '../components/ObjectGroup';
import AnswerChoice from '../components/AnswerChoice';
import BilingualPrompt from '../components/BilingualPrompt';

export default function ChoiceQuestion({ question, onAnswer }) {
  const { values, choices, answer, type } = question;
  const [attempts, setAttempts] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setAttempts(0);
    setSelectedChoice(null);
    setEliminatedChoices(new Set());
    setIsAnswered(false);
  }, [question.id]);

  const handleChoice = (choice) => {
    if (isAnswered || eliminatedChoices.has(choice)) return;
    
    setSelectedChoice(choice);
    const isCorrect = choice === answer;

    if (isCorrect) {
      setIsAnswered(true);
      onAnswer(true, attempts + 1);
    } else {
      setAttempts(a => a + 1);
      
      const newEliminated = new Set(eliminatedChoices);
      newEliminated.add(choice);
      setEliminatedChoices(newEliminated);
      
      setTimeout(() => setSelectedChoice(null), 500);
      onAnswer(false, attempts + 1);
    }
  };

  const renderVisuals = () => {
    if (type === 'comparison') {
      return (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ObjectGroup count={values.a} emoji="🍎" imgUrl={values.imgUrl} />
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{values.a}</span>
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#cbd5e1' }}>?</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ObjectGroup count={values.b} emoji="🍎" imgUrl={values.imgUrl} />
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{values.b}</span>
          </div>
        </div>
      );
    }
    
    if (type === 'addition') {
      return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <ObjectGroup count={values.a} emoji={values.emoji || '🍎'} imgUrl={values.imgUrl} />
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6' }}>+</div>
          <ObjectGroup count={values.b} emoji={values.emoji || '🍎'} />
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e293b' }}>=</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>?</div>
        </div>
      );
    }

    if (type === 'subtraction') {
      return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <ObjectGroup count={values.a} emoji={values.emoji || '🍎'} imgUrl={values.imgUrl} />
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>-</div>
          <span style={{ fontSize: '64px' }}>{values.b}</span>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e293b' }}>=</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>?</div>
        </div>
      );
    }

    if (type === 'ordinal') {
      return (
        <div style={{ display: 'flex', gap: '12px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '3px solid #e2e8f0' }}>
          {values.queue.map((char, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '64px' }}>{char}</span>
              <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 'bold' }}>{i + 1}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const getPromptKey = () => {
    switch (type) {
      case 'comparison': return 'compareQuantity';
      case 'addition': return 'visualAddition';
      case 'subtraction': return 'visualSubtraction';
      case 'ordinal': return 'ordinalPosition';
      default: return 'compareQuantity';
    }
  };

  const getChoiceText = (c) => {
    if (typeof c === 'object' && c !== null) return c.label || c.value;
    if (type === 'comparison' && values.choiceLabels) {
      const labelObj = values.choiceLabels.find(l => l.value === c);
      // Ensure we display traditional Chinese or English correctly here. 
      // values.choiceLabels already has `label` mapped to Traditional Chinese.
      return labelObj ? labelObj.label : c;
    }
    return c;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
      <BilingualPrompt 
        promptKey={getPromptKey()} 
        promptParams={type === 'ordinal' ? { position: values.position } : {}}
      />
      
      {renderVisuals()}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: choices.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '500px' 
      }}>
        {choices.map((choice, i) => {
          let state = 'idle';
          if (eliminatedChoices.has(choice)) state = 'eliminated';
          else if (selectedChoice === choice) {
            state = choice === answer ? 'correct' : 'wrong_shake';
          } else if (isAnswered && choice === answer) {
            state = 'correct';
          }

          return (
            <AnswerChoice 
              key={i}
              value={choice}
              state={state}
              disabled={isAnswered || eliminatedChoices.has(choice)}
              onSelect={handleChoice}
            >
              {getChoiceText(choice)}
            </AnswerChoice>
          );
        })}
      </div>
    </div>
  );
}
