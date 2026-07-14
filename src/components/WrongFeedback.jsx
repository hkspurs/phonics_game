import React from 'react';
import './WrongFeedback.css';

export default function WrongFeedback({ trigger, style }) {
  return (
    <div className={`wrong-feedback-container ${trigger ? 'active' : ''}`} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        src="/assets/kenney/ui-pack/Vector/Red/icon_cross.svg" 
        alt="Wrong"
        style={{ width: '80%', height: '80%', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.2))' }}
      />
    </div>
  );
}
