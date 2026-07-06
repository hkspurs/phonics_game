import React from 'react';

export default function DonutChart({ percentage, color = '#0ea5e9', label = '' }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth="10"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a">
          {Math.round(percentage)}%
        </text>
      </svg>
      {label && <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', marginTop: '0.5rem' }}>{label}</span>}
    </div>
  );
}
