import React from 'react';

/**
 * A TenFrame component to visually display numbers up to 10.
 */
export default function TenFrame({ count, filledIcon = '🟢', emptyIcon = '⭕', max = 10, style }) {
  const cells = Array.from({ length: max }, (_, i) => i < count);
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '4px',
      padding: '8px',
      backgroundColor: '#f8fafc',
      border: '2px solid #cbd5e1',
      borderRadius: '8px',
      maxWidth: '300px',
      margin: '0 auto',
      ...style
    }}>
      {cells.map((isFilled, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
          fontSize: '24px'
        }}>
          {isFilled ? filledIcon : emptyIcon}
        </div>
      ))}
    </div>
  );
}
