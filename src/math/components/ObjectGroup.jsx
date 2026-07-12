import React from 'react';

export default function ObjectGroup({ 
  count, 
  emoji = '🍎', 
  imgUrl,
  layout = 'grid', // 'grid' | 'line' | 'scatter'
  interactive = false,
  onItemClick,
  highlightedIndices = [],
  countedIndices = new Set(),
  style 
}) {
  const items = Array.from({ length: count }, (_, i) => i);
  
  const getLayoutStyle = () => {
    switch (layout) {
      case 'line':
        return { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' };
      case 'scatter':
        return { display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '300px' };
      case 'grid':
      default:
        // Try to make roughly square grids or ten-frame like
        const cols = count > 5 ? 5 : count;
        return { 
          display: 'grid', 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '12px',
          justifyContent: 'center',
          justifyItems: 'center'
        };
    }
  };

  return (
    <div style={{
      ...getLayoutStyle(),
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '16px',
      border: '3px solid #e2e8f0',
      minWidth: '120px',
      minHeight: '120px',
      ...style
    }}>
      {items.map(i => {
        const isHighlighted = highlightedIndices.includes(i);
        const isCounted = countedIndices.has(i);
        
        return (
          <div 
            key={i}
            onClick={() => interactive && onItemClick && onItemClick(i)}
            style={{
              position: 'relative',
              fontSize: '48px',
              cursor: interactive ? 'pointer' : 'default',
              transform: isHighlighted ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              filter: isCounted ? 'brightness(0.9) drop-shadow(0 0 8px rgba(245,158,11,0.6))' : (isHighlighted ? 'drop-shadow(0px 8px 12px rgba(0,0,0,0.15))' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'),
              userSelect: 'none',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: isCounted ? 'rgba(254, 243, 199, 0.5)' : 'transparent',
              border: isCounted ? '3px solid #f59e0b' : '3px solid transparent',
            }}
          >
            {imgUrl ? (
              <img src={imgUrl} alt={emoji} style={{ width: '80%', height: '80%', objectFit: 'contain', borderRadius: '50%' }} />
            ) : (
              emoji
            )}
            {isCounted && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#f59e0b',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
