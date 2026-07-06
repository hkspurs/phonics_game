import React from 'react';

export default function AppleIcon({ isRed = false, size = 64 }) {
  const color1 = isRed ? '#EF4444' : '#10B981'; // Red or Green
  const color2 = isRed ? '#B91C1C' : '#047857'; // Darker shade for gradient
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`apple-grad-${isRed ? 'red' : 'green'}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </radialGradient>
      </defs>
      <g transform="translate(0, 10)">
        {/* Leaf */}
        <path d="M 50 15 C 65 -5 80 5 70 20 C 60 25 50 20 50 15 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" strokeLinejoin="round"/>
        {/* Stem */}
        <path d="M 50 15 C 50 5 45 0 45 0" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round"/>
        {/* Apple Body */}
        <path d="M 50 15 C 30 10 10 25 15 50 C 20 75 35 85 50 80 C 65 85 80 75 85 50 C 90 25 70 10 50 15 Z" fill={`url(#apple-grad-${isRed ? 'red' : 'green'})`} stroke={color2} strokeWidth="2"/>
        {/* Shine */}
        <path d="M 25 40 C 20 55 25 65 30 70" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
      </g>
    </svg>
  );
}
