import React from 'react';
import './MissionSun.css';

export default function MissionSun({ style }) {
  return (
    <div className="mission-sun-container" style={style}>
      <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="mission-sun" transform="translate(40, 40)">
          <g id="sun-rays">
            <line x1="0" y1="-22" x2="0" y2="-28" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="0" y1="22" x2="0" y2="28" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="-22" y1="0" x2="-28" y2="0" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="22" y1="0" x2="28" y2="0" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="-15" y1="-15" x2="-20" y2="-20" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="15" y1="15" x2="20" y2="20" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="-15" y1="15" x2="-20" y2="20" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
            <line x1="15" y1="-15" x2="20" y2="-20" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round"/>
          </g>
          <circle id="sun-body" cx="0" cy="0" r="18" fill="#FFE4A0" stroke="#8D7A6F" strokeWidth="2"/>
          <g id="sun-face">
            <circle cx="-6" cy="-2" r="1.5" fill="#8D7A6F"/>
            <circle cx="6" cy="-2" r="1.5" fill="#8D7A6F"/>
            <path d="M -4 4 Q 0 8 4 4" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="-10" cy="2" r="2" fill="#FFD1D1"/>
            <circle cx="10" cy="2" r="2" fill="#FFD1D1"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
