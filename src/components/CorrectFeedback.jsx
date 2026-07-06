import React from 'react';
import './CorrectFeedback.css';

export default function CorrectFeedback({ trigger, style }) {
  // trigger can be a boolean or a counter. The keyframes rely on it having the "active" class.
  return (
    <div className={`correct-feedback-container ${trigger ? 'active' : ''}`} style={style}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="correct-feedback">
          <circle id="sparkle-ring" cx="50" cy="50" r="30" fill="none" stroke="#FFD1D1" strokeWidth="3" opacity="0"/>
          <g id="stars-group" transform="translate(50, 50)">
            <polygon className="star star-1" points="0,-15 3,-5 14,-5 5,2 8,12 0,5 -8,12 -5,2 -14,-5 -3,-5" fill="#FFB347"/>
            <polygon className="star star-2" points="0,-15 3,-5 14,-5 5,2 8,12 0,5 -8,12 -5,2 -14,-5 -3,-5" fill="#FFB347"/>
            <polygon className="star star-3" points="0,-15 3,-5 14,-5 5,2 8,12 0,5 -8,12 -5,2 -14,-5 -3,-5" fill="#FFB347"/>
          </g>
          <path id="bubble-base" d="M 30 50 Q 30 30 50 30 Q 70 30 70 50 Q 70 70 50 70 Q 40 70 30 75 Q 35 65 30 50 Z" fill="#FFF4CC" stroke="#8D7A6F" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="50" cy="50" r="15" fill="#FFF" opacity="0.5"/>
        </g>
      </svg>
    </div>
  );
}
