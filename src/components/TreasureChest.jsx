import React from 'react';

export default function TreasureChest({ state, onClick }) {
  // state: 'closed', 'shaking', 'open'
  
  const lidRotation = state === 'open' ? '-110deg' : '0deg';
  
  return (
    <div onClick={onClick} style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <g id="treasure-chest" transform="translate(10, 20)">
          
          {/* Back of the chest (visible when open) */}
          <path d="M 10 30 L 70 30 L 70 60 L 10 60 Z" fill="#6B4226"/>
          
          {/* Gold coins spilling out (visible when open) */}
          <g style={{ opacity: state === 'open' ? 1 : 0, transition: 'opacity 0.3s ease 0.2s', transform: state === 'open' ? 'translateY(-10px)' : 'translateY(10px)', transitionProperty: 'opacity, transform' }}>
            <circle cx="25" cy="25" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <circle cx="35" cy="20" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <circle cx="45" cy="28" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <circle cx="55" cy="22" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <circle cx="30" cy="30" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <circle cx="50" cy="30" r="5" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
            <path d="M 40 25 L 45 15 L 50 20 Z" fill="#E6E6FA"/> {/* Diamond */}
            <circle cx="30" cy="15" r="3" fill="#FF69B4"/> {/* Ruby */}
          </g>

          {/* Chest Base */}
          <path d="M 10 30 L 70 30 L 65 65 L 15 65 Z" fill="#8B5A2B" stroke="#4A2F1D" strokeWidth="2" strokeLinejoin="round"/>
          {/* Base Wood panels */}
          <line x1="12" y1="42" x2="68" y2="42" stroke="#4A2F1D" strokeWidth="1.5"/>
          <line x1="14" y1="54" x2="66" y2="54" stroke="#4A2F1D" strokeWidth="1.5"/>
          {/* Base Gold trims */}
          <path d="M 10 30 L 15 65" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 70 30 L 65 65" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 15 65 L 65 65" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round"/>

          {/* Lid (Rotates open) */}
          <g id="lid-group" style={{ transformOrigin: '10px 30px', transform: `rotate(${lidRotation})`, transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <path d="M 10 30 C 10 10 70 10 70 30 Z" fill="#8B5A2B" stroke="#4A2F1D" strokeWidth="2" strokeLinejoin="round"/>
            {/* Lid Wood panels */}
            <path d="M 16 18 Q 40 10 64 18" fill="none" stroke="#4A2F1D" strokeWidth="1.5"/>
            {/* Lid Gold trims */}
            <path d="M 10 30 C 10 10 70 10 70 30" fill="none" stroke="#FFD700" strokeWidth="3"/>
            <line x1="10" y1="30" x2="70" y2="30" stroke="#FFD700" strokeWidth="3"/>
            <path d="M 40 10 L 40 30" stroke="#FFD700" strokeWidth="3"/>
            {/* Lock */}
            <rect x="36" y="26" width="8" height="10" rx="2" fill="#FFD700" stroke="#4A2F1D" strokeWidth="1"/>
            <circle cx="40" cy="31" r="1.5" fill="#4A2F1D"/>
          </g>
          
        </g>
      </svg>
    </div>
  );
}
