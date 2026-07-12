import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import BilingualPrompt from '../components/BilingualPrompt';

export default function OrderingQuestion({ question, onAnswer }) {
  const { values, answer } = question;
  // Initialize with shuffled choices provided by engine
  const [currentOrder, setCurrentOrder] = useState([...question.choices]);
  const [attempts, setAttempts] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setCurrentOrder([...question.choices]);
    setAttempts(0);
    setIsAnswered(false);
    setShowHint(false);
  }, [question.id]);

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
      // On 3rd attempt, auto-solve first element to help them
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', touchAction: 'none' }}>
      <BilingualPrompt promptKey={promptKey} />
      
      <p style={{ color: '#64748b', fontSize: '18px', margin: 0, fontWeight: 'bold' }}>
        👆 Drag and drop to order (拉動並排序)
      </p>

      {showHint && (
        <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem', animation: 'fadeIn 0.5s' }}>
          Hint: Look for the {isAscending ? 'smallest' : 'biggest'} number first!
        </div>
      )}

      <Reorder.Group 
        axis="x"
        values={currentOrder} 
        onReorder={setCurrentOrder}
        style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'nowrap', // Force single line to fix Framer Motion 2D layout glitch
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          overflowX: 'auto', // Safely contain items on tiny screens without breaking physics
          listStyleType: 'none',
          margin: 0
        }}
      >
        {currentOrder.map((num, i) => {
          let bg = '#ffffff';
          let border = '#cbd5e1';
          let color = '#1e293b';
          
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
            <Reorder.Item
              key={num}
              value={num}
              disabled={isAnswered}
              style={{
                flexShrink: 0,
                width: currentOrder.length > 4 ? '55px' : '80px',
                height: currentOrder.length > 4 ? '55px' : '80px',
                fontSize: currentOrder.length > 4 ? '24px' : '32px',
                fontWeight: 'bold',
                color: color,
                backgroundColor: bg,
                border: `3px solid ${border}`,
                borderRadius: '16px',
                cursor: isAnswered ? 'default' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                touchAction: 'none'
              }}
              whileDrag={{
                scale: 1.15,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                cursor: 'grabbing',
                zIndex: 10
              }}
            >
              {num}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

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
