import React from 'react';

/**
 * Reusable answer choice button for math questions.
 * @param {{ value: any, state: 'idle'|'selected'|'correct'|'eliminated', disabled: boolean, onSelect: Function, children?: React.ReactNode }} props
 */
export default function AnswerChoice({ value, state = 'idle', disabled = false, onSelect, children }) {
  const isCorrect = state === 'correct';
  const isSelected = state === 'selected';
  const isEliminated = state === 'eliminated';
  
  let bg = '#ffffff';
  let border = '4px solid #e5e7eb';
  let color = '#374151';
  let transform = 'scale(1)';
  let opacity = 1;
  let animation = 'none';
  let pointerEvents = 'auto';

  if (isEliminated) {
    opacity = 0.3;
    pointerEvents = 'none';
  } else if (isCorrect) {
    bg = '#dcfce7'; // green-100
    border = '4px solid #22c55e'; // green-500
    color = '#15803d'; // green-700
    transform = 'scale(1.05)';
  } else if (isSelected) {
    bg = '#fffbeb'; // amber-50
    border = '4px solid #f59e0b'; // amber-500
    transform = 'scale(1.02)';
  }

  // Basic gentle shake for wrong choice could be applied via parent class or state but we'll stick to styles here
  // Actually, "Incorrect attempt: gentle shake, no bright red cross."
  // We can handle the shake in CSS class. Let's add a generic choice-btn class.
  
  return (
    <button
      onClick={() => onSelect(value)}
      disabled={disabled || isEliminated}
      style={{
        background: bg,
        border: border,
        color: color,
        transform: transform,
        opacity: opacity,
        pointerEvents: pointerEvents,
        borderRadius: '16px',
        padding: '1rem 2rem',
        fontSize: '2rem',
        fontWeight: 'bold',
        cursor: (disabled || isEliminated) ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '80px',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: animation,
        boxShadow: (isSelected || isCorrect) ? '0 4px 6px -1px rgba(0,0,0,0.1)' : '0 2px 4px -1px rgba(0,0,0,0.06)'
      }}
      className={state === 'wrong_shake' ? 'shake-animation' : ''}
    >
      {children || value}
    </button>
  );
}
