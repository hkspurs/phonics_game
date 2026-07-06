import React from 'react';
import './ReplayHelper.css';

export default function ReplayHelper({ isPlaying = false, onClick, style }) {
  return (
    <div 
      className={`replay-helper-container ${isPlaying ? 'playing' : 'idle'}`} 
      style={{ cursor: 'pointer', ...style }} 
      onClick={onClick}
    >
      <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="helper-cat">
          <path id="tail" d="M 25 60 Q 10 65 15 50" fill="none" stroke="#FFF3E0" strokeWidth="6" strokeLinecap="round"/>
          <path id="tail-outline" d="M 25 60 Q 10 65 15 50" fill="none" stroke="#8D7A6F" strokeWidth="2" strokeLinecap="round"/>
          <g id="body">
            <ellipse cx="40" cy="55" rx="15" ry="12" fill="#FFF3E0" stroke="#8D7A6F" strokeWidth="2"/>
          </g>
          <g id="head">
            <polygon id="cat-left-ear" points="32,25 28,15 40,25" fill="#FFF3E0" stroke="#8D7A6F" strokeWidth="2" strokeLinejoin="round"/>
            <polygon id="cat-right-ear" points="48,25 52,15 40,25" fill="#FFF3E0" stroke="#8D7A6F" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="40" cy="35" r="14" fill="#FFF3E0" stroke="#8D7A6F" strokeWidth="2"/>
            <circle cx="35" cy="35" r="1.5" fill="#8D7A6F"/>
            <circle cx="45" cy="35" r="1.5" fill="#8D7A6F"/>
          </g>
          <g id="speaker-group">
            <g id="speaker" transform="translate(42, 45)">
              <path d="M 0 0 L 8 -5 L 8 10 L 0 5 Z" fill="#A7C7E7" stroke="#8D7A6F" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="-4" y="0" width="4" height="5" rx="1" fill="#A7C7E7" stroke="#8D7A6F" strokeWidth="1.5"/>
            </g>
            <g id="sound-waves" className={isPlaying ? 'animate-waves' : ''} opacity="0">
              <path d="M 55 45 Q 58 47.5 55 50" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M 58 42 Q 62 47.5 58 53" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
