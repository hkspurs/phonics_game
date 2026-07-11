import React, { useState, useEffect } from 'react';
import AnswerChoice from '../components/AnswerChoice';
import BilingualPrompt from '../components/BilingualPrompt';

export default function PatternQuestion({ question, onAnswer }) {
  const { values, choices, answer } = question;
  const [attempts, setAttempts] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setAttempts(0);
    setSelectedChoice(null);
    setEliminatedChoices(new Set());
    setIsAnswered(false);
    setShowHint(false);
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
      
      if (attempts + 1 >= 2) {
        setShowHint(true);
      }

      setEliminatedChoices(newEliminated);
      setTimeout(() => setSelectedChoice(null), 500);
      onAnswer(false, attempts + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
      <BilingualPrompt promptKey="shapePattern" />
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        padding: '24px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '16px',
        border: '3px solid #e2e8f0',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {values.visibleItems.map((item, i) => {
          // highlight repeating pattern as hint
          const isHintPattern = showHint && i < values.template.length;
          return (
            <div key={i} style={{ 
              fontSize: '48px',
              borderBottom: isHintPattern ? '4px solid #f59e0b' : '4px solid transparent'
            }}>
              {item}
            </div>
          );
        })}
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
            />
          );
        })}
      </div>
    </div>
  );
}
