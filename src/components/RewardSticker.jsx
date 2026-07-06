import React from 'react';
import './RewardSticker.css';

export default function RewardSticker({ isRevealed = true, style }) {
  return (
    <div className={`reward-sticker-container ${isRevealed ? 'revealed' : 'hidden'}`} style={style}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="sticker-clip">
            <circle cx="50" cy="50" r="40"/>
          </clipPath>
        </defs>
        <g id="reward-sticker">
          <circle cx="50" cy="52" r="40" fill="#E6E0D8"/>
          <circle id="sticker-border" cx="50" cy="50" r="40" fill="#FFFFFF" stroke="#8D7A6F" strokeWidth="2"/>
          
          <g id="sticker-art" clipPath="url(#sticker-clip)">
            <circle cx="50" cy="50" r="35" fill="#FFF4CC"/>
            <ellipse cx="50" cy="60" rx="20" ry="18" fill="#FFE4A0"/>
            <circle cx="43" cy="55" r="2" fill="#8D7A6F"/>
            <circle cx="57" cy="55" r="2" fill="#8D7A6F"/>
            <polygon points="47,58 53,58 50,62" fill="#FFB347"/>
            <path d="M 30 65 Q 25 60 30 55" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M 70 65 Q 75 60 70 55" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
          </g>
          
          <path id="shine-highlight" d="M 20 10 L 40 -10 L 80 90 L 60 110 Z" fill="#FFFFFF" opacity="0.3" clipPath="url(#sticker-clip)"/>
        </g>
      </svg>
    </div>
  );
}
