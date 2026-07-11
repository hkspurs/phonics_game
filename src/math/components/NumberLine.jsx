import React from 'react';

export default function NumberLine({ min = 0, max = 10, highlight = null, style }) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      padding: '20px 10px',
      margin: '20px 0',
      width: '100%',
      ...style
    }}>
      {/* The line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '15px',
        right: '15px',
        height: '4px',
        backgroundColor: '#cbd5e1',
        transform: 'translateY(-50%)',
        zIndex: 0
      }} />
      
      {/* Ticks and numbers */}
      {numbers.map(n => (
        <div key={n} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: highlight === n ? '#ef4444' : '#64748b',
            border: '2px solid white',
            marginBottom: '4px',
            transform: highlight === n ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.2s',
          }} />
          <span style={{
            fontSize: '16px',
            fontWeight: highlight === n ? 'bold' : 'normal',
            color: highlight === n ? '#ef4444' : '#475569'
          }}>
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}
