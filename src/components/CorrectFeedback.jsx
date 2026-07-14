import React from 'react';
import './CorrectFeedback.css';

export default function CorrectFeedback({ trigger, style }) {
  // trigger can be a boolean or a counter. The keyframes rely on it having the "active" class.
  return (
    <div className={`correct-feedback-container ${trigger ? 'active' : ''}`} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        src="/assets/kenney/ui-pack/Vector/Green/check_round_color.svg" 
        alt="Correct"
        style={{ width: '80%', height: '80%', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.2))' }}
      />
    </div>
  );
}
