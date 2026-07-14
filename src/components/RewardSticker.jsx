import React from 'react';
import './RewardSticker.css';

export default function RewardSticker({ isRevealed = true, style }) {
  return (
    <div className={`reward-sticker-container ${isRevealed ? 'revealed' : 'hidden'}`} style={style}>
      <img 
        src="/assets/kenney/ui-pack/Vector/star.svg" 
        alt="Star"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.2))' }}
      />
    </div>
  );
}
