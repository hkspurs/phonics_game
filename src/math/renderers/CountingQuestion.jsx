import React, { useState, useEffect } from 'react';
import ObjectGroup from '../components/ObjectGroup';
import AnswerChoice from '../components/AnswerChoice';
import BilingualPrompt from '../components/BilingualPrompt';
import { getMathCopy } from '../content/mathCopy';

export default function CountingQuestion({ question, onAnswer }) {
  const { values, choices } = question;
  const [attempts, setAttempts] = useState(0);
  const [highlighted, setHighlighted] = useState([]);
  const [countedIndices, setCountedIndices] = useState(new Set());
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Reset state when question changes
  useEffect(() => {
    setAttempts(0);
    setHighlighted([]);
    setCountedIndices(new Set());
    setSelectedChoice(null);
    setEliminatedChoices(new Set());
    setIsAnswered(false);
    setFeedbackMsg(null);
  }, [question.id]);

  const handleItemClick = (index) => {
    if (isAnswered) return;
    setCountedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // Spoken number
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(next.size.toString());
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        }
      }
      return next;
    });
  };

  const handleChoice = (choice) => {
    if (isAnswered || eliminatedChoices.has(choice)) return;
    
    setSelectedChoice(choice);
    const isCorrect = choice === question.answer;

    if (isCorrect) {
      setIsAnswered(true);
      onAnswer(true, attempts + 1);
    } else {
      setAttempts(a => a + 1);
      
      const nextAttempts = attempts + 1;
      const newEliminated = new Set(eliminatedChoices);
      newEliminated.add(choice);

      if (nextAttempts === 1) {
        // First incorrect: Guided counting animation
        setFeedbackMsg("Almost! Let's count together.");
        let i = 0;
        const intervalId = setInterval(() => {
          if (i < values.count) {
            setHighlighted([i]);
            if (window.speechSynthesis) {
               window.speechSynthesis.cancel();
               const u = new SpeechSynthesisUtterance((i + 1).toString());
               u.rate = 1.2;
               window.speechSynthesis.speak(u);
            }
            i++;
          } else {
            clearInterval(intervalId);
            setHighlighted(Array.from({ length: values.count }, (_, idx) => idx));
            setFeedbackMsg(null);
          }
        }, 800);
      } else if (nextAttempts === 2) {
        // Second incorrect: highlight all to make it easier to count, remove another wrong option
        setHighlighted(Array.from({ length: values.count }, (_, i) => i));
        // Remove an obviously incorrect option
        const remainingWrong = choices.filter(c => c !== question.answer && !newEliminated.has(c));
        if (remainingWrong.length > 0) {
          // find farthest
          let farthest = remainingWrong[0];
          let maxDist = Math.abs(remainingWrong[0] - question.answer);
          for (const c of remainingWrong) {
            const d = Math.abs(c - question.answer);
            if (d > maxDist) {
              farthest = c;
              maxDist = d;
            }
          }
          newEliminated.add(farthest);
        }
      } else {
        // Guide through process - highlight all, eliminate all but answer
        setHighlighted(Array.from({ length: values.count }, (_, i) => i));
        choices.forEach(c => {
          if (c !== question.answer) newEliminated.add(c);
        });
      }
      
      setEliminatedChoices(newEliminated);
      setTimeout(() => setSelectedChoice(null), 500); // clear selection state
      onAnswer(false, nextAttempts);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <BilingualPrompt 
        promptKey="countObjects" 
        promptParams={{ objectNameZh: values.label || '物品', objectNameEn: values.theme ? values.theme.split('_')[1] : 'items' }} 
      />
      
      {feedbackMsg && (
        <div style={{ color: '#d97706', fontSize: '1.5rem', fontWeight: 'bold', animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          {feedbackMsg}
        </div>
      )}
      
      <ObjectGroup 
        count={values.count} 
        emoji={values.emoji} 
        highlightedIndices={highlighted}
        countedIndices={countedIndices}
        layout={values.count <= 5 ? 'scatter' : 'grid'}
        interactive={!isAnswered}
        onItemClick={handleItemClick}
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '400px',
        marginTop: '16px'
      }}>
        {choices.map((choice, i) => {
          let state = 'idle';
          if (eliminatedChoices.has(choice)) state = 'eliminated';
          else if (selectedChoice === choice) {
            state = choice === question.answer ? 'correct' : 'wrong_shake';
          } else if (isAnswered && choice === question.answer) {
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
