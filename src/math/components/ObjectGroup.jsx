import React from 'react';

export default function ObjectGroup({ 
  count, 
  emoji = '🍎', 
  layout = 'grid', // 'grid' | 'line' | 'scatter'
  interactive = false,
  onItemClick,
  highlightedIndices = [],
  style 
}) {
  const items = Array.from({ length: count }, (_, i) => i);
  
  const getLayoutStyle = () => {
    switch (layout) {
      case 'line':
        return { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' };
      case 'scatter':
        return { display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' };
      case 'grid':
      default:
        // Try to make roughly square grids
        const cols = Math.ceil(Math.sqrt(count));
        return { 
          display: 'grid', 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '8px',
          justifyContent: 'center',
          justifyItems: 'center'
        };
    }
  };

  return (
    <div style={{
      ...getLayoutStyle(),
      padding: '12px',
      backgroundColor: '#f1f5f9',
      borderRadius: '12px',
      border: '2px solid #e2e8f0',
      minWidth: '100px',
      minHeight: '100px',
      ...style
    }}>
      {items.map(i => {
        const isHighlighted = highlightedIndices.includes(i);
        return (
          <div 
            key={i}
            onClick={() => interactive && onItemClick && onItemClick(i)}
            style={{
              fontSize: '32px',
              cursor: interactive ? 'pointer' : 'default',
              transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              filter: isHighlighted ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' : 'none',
              userSelect: 'none',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
}
