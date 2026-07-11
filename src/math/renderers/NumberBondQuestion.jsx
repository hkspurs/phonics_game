import React, { useState, useEffect } from 'react';
import TenFrame from '../components/TenFrame';
import AnswerChoice from '../components/AnswerChoice';
import BilingualPrompt from '../components/BilingualPrompt';

export default function NumberBondQuestion({ question, onAnswer }) {
  const { values, choices, answer } = question;
  const { target, givenPart } = values;
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
      <BilingualPrompt 
        promptKey="numberBond" 
        promptParams={{ target, givenPart }}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <TenFrame count={givenPart} max={target === 5 ? 5 : 10} />
        {showHint && (
          <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem', animation: 'fadeIn 0.5s' }}>
            Hint: Count the empty spaces!
          </div>
        )}
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
          {givenPart} + <span style={{ color: '#ef4444' }}>?</span> = {target}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '400px' 
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
