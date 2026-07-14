import React from 'react';

export default function MapNodeCloud({ status, statusColor, isMastered, isLocked, style, onClick }) {
  const isPractising = status === 'practising';
  const isWeak = status === 'weak';

  let color = 'Blue';
  if (isLocked) color = 'Grey';
  else if (isMastered) color = 'Yellow';
  else if (isPractising) color = 'Green';
  else if (isWeak) color = 'Red';

  const imgSrc = `assets/kenney/ui-pack/PNG/${color}/Default/button_round_depth_flat.png`;

  return (
    <div 
      className={`map-node-container ${status}`} 
      style={{ 
        cursor: isLocked ? 'default' : 'pointer', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style 
      }}
      onClick={!isLocked ? onClick : undefined}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${status} node`}
    >
      <img 
        src={imgSrc} 
        alt=""
        style={{ 
          width: '90%', 
          height: '90%',
          filter: isPractising || isWeak ? 'drop-shadow(0 0 15px rgba(255,255,255,0.8))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
          transition: 'all 0.3s'
        }} 
      />
      
      {isLocked && (
        <img 
          src="assets/kenney/game-icons/PNG/White/2x/locked.png" 
          alt="" 
          style={{ position: 'absolute', width: '30px', opacity: 0.5, top: '40%' }}
        />
      )}

      {isMastered && (
        <img 
          src="assets/kenney/ui-pack/PNG/Yellow/Default/star.png" 
          alt="" 
          style={{ 
            position: 'absolute', 
            width: '40px', 
            top: '-10px', 
            right: '-10px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
        />
      )}
    </div>
  );
}
