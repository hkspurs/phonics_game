import React, { useState, useEffect } from 'react';
import BilingualPrompt from '../components/BilingualPrompt';

export default function OrderingQuestion({ question, onAnswer }) {
  const { values, answer } = question;
  // Initialize with shuffled choices provided by engine
  const [currentOrder, setCurrentOrder] = useState([...question.choices]);
  const [attempts, setAttempts] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setCurrentOrder([...question.choices]);
    setAttempts(0);
    setSelectedIdx(null);
    setIsAnswered(false);
    setShowHint(false);
  }, [question.id]);

  const handleItemClick = (idx) => {
    if (isAnswered) return;
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else {
      if (selectedIdx !== idx) {
        const newOrder = [...currentOrder];
        const temp = newOrder[selectedIdx];
        newOrder[selectedIdx] = newOrder[idx];
        newOrder[idx] = temp;
        setCurrentOrder(newOrder);
      }
      setSelectedIdx(null);
    }
  };

  const checkOrder = () => {
    if (isAnswered) return;
    setAttempts(a => a + 1);
    const isCorrect = currentOrder.every((val, i) => val === answer[i]);
    
    if (isCorrect) {
      setIsAnswered(true);
      onAnswer(true, attempts + 1);
    } else {
      if (attempts + 1 >= 2) {
        setShowHint(true);
      }
      // On 3rd attempt, auto-solve first element
      if (attempts + 1 >= 3) {
        const newOrder = [...currentOrder];
        const firstVal = answer[0];
        const currIdx = newOrder.indexOf(firstVal);
        if (currIdx !== -1) {
          [newOrder[0], newOrder[currIdx]] = [newOrder[currIdx], newOrder[0]];
          setCurrentOrder(newOrder);
        }
      }
      onAnswer(false, attempts + 1);
    }
  };

  const isAscending = values.direction === 'ascending';
  const promptKey = isAscending ? 'orderNumbersAsc' : 'orderNumbersDesc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
      <BilingualPrompt promptKey={promptKey} />
      
      <p style={{ color: '#64748b', fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
        Tap two numbers to swap them
      </p>

      {showHint && (
        <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem', animation: 'fadeIn 0.5s' }}>
          Hint: Look for the {isAscending ? 'smallest' : 'biggest'} number first!
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        width: '100%'
      }}>
        {currentOrder.map((num, i) => {
          let bg = selectedIdx === i ? '#3b82f6' : '#ffffff';
          let border = selectedIdx === i ? '#2563eb' : '#cbd5e1';
          let color = selectedIdx === i ? '#ffffff' : '#1e293b';
          
          if (isAnswered) {
            bg = '#dcfce7';
            border = '#22c55e';
            color = '#15803d';
          } else if (showHint && attempts >= 3 && i === 0 && num === answer[0]) {
            // Highlight the auto-solved one
            bg = '#fef3c7';
            border = '#f59e0b';
          }

          return (
            <button
              key={i}
              onClick={() => handleItemClick(i)}
              disabled={isAnswered}
              style={{
                width: '80px',
                height: '80px',
                fontSize: '32px',
                fontWeight: 'bold',
                color: color,
                backgroundColor: bg,
                border: `3px solid ${border}`,
                borderRadius: '16px',
                cursor: isAnswered ? 'default' : 'pointer',
                transform: selectedIdx === i ? 'translateY(-4px)' : 'none',
                transition: 'all 0.2s',
                boxShadow: selectedIdx === i ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              {num}
            </button>
          );
        })}
      </div>

      <button 
        className="btn-primary" 
        onClick={checkOrder}
        disabled={isAnswered}
        style={{ width: '200px', fontSize: '24px', padding: '16px', opacity: isAnswered ? 0.5 : 1 }}
      >
        Check
      </button>
    </div>
  );
}
