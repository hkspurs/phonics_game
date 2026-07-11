import React, { useState, useEffect } from 'react';

export default function OrderingQuestion({ question, onAnswer }) {
  const { values, answer } = question;
  // Initialize with shuffled choices provided by engine
  const [currentOrder, setCurrentOrder] = useState([...question.choices]);
  const [attempts, setAttempts] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Keyboard/Tap to swap instead of drag-and-drop for accessibility and mobile ease
  const handleItemClick = (idx) => {
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
    setAttempts(a => a + 1);
    const isCorrect = currentOrder.every((val, i) => val === answer[i]);
    
    if (isCorrect) {
      onAnswer(true, attempts + 1);
    } else {
      onAnswer(false, attempts + 1);
    }
  };

  const isAscending = values.direction === 'ascending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
      <h2 style={{ color: '#1e293b', textAlign: 'center' }}>
        Put the numbers in order ({isAscending ? 'smallest to largest' : 'largest to smallest'})
      </h2>
      
      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
        Tap two numbers to swap them
      </p>

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
        {currentOrder.map((num, i) => (
          <button
            key={i}
            onClick={() => handleItemClick(i)}
            style={{
              width: '64px',
              height: '80px',
              fontSize: '32px',
              fontWeight: 'bold',
              color: selectedIdx === i ? '#ffffff' : '#1e293b',
              backgroundColor: selectedIdx === i ? '#3b82f6' : '#ffffff',
              border: `3px solid ${selectedIdx === i ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transform: selectedIdx === i ? 'translateY(-4px)' : 'none',
              transition: 'all 0.2s',
              boxShadow: selectedIdx === i ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            {num}
          </button>
        ))}
      </div>

      <button 
        className="btn-primary" 
        onClick={checkOrder}
        style={{ width: '200px', fontSize: '20px', padding: '12px' }}
      >
        Check Answer
      </button>
    </div>
  );
}
