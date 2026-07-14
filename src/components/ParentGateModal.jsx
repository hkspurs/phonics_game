import React, { useState, useEffect } from 'react'

/**
 * ParentGateModal — Shared parent-gate component.
 * Requires entering a valid birth year (1900–2010) to access parent settings.
 * Designed with a simple numeric keypad, child-safe and touch-friendly.
 */
const ParentGateModal = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const year = parseInt(pin, 10);
        if (pin.length === 4 && year >= 1900 && year <= 2010) {
          onSuccess();
        } else {
          setPin('');
        }
      } else if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
      } else if (e.key === 'Escape') {
        onClose();
      } else if (/^[0-9]$/.test(e.key)) {
        setPin(p => (p + e.key).slice(0, 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, onSuccess, onClose]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', textAlign: 'center', width: '300px' }}>
        <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>For Parents Only</h3>
        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>Enter year of birth to access settings:</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {[1,2,3,4].map((_, i) => (
            <div key={i} style={{ width: '40px', height: '40px', border: '2px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {pin[i] || ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <button key={num} className="btn-secondary" style={{ padding: 0, height: '4rem', fontSize: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPin(p => (p + num).slice(0,4))}>{num}</button>
          ))}
          <button className="btn-secondary" style={{ padding: 0, height: '4rem', fontSize: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPin('')}>C</button>
          <button className="btn-secondary" style={{ padding: 0, height: '4rem', fontSize: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPin(p => (p + '0').slice(0,4))}>0</button>
          <button className="btn-secondary" style={{ padding: 0, height: '4rem', fontSize: '1.5rem', borderRadius: '1rem', background: '#22c55e', color: 'white', borderColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { 
            const year = parseInt(pin, 10);
            if(pin.length === 4 && year >= 1900 && year <= 2010) {
              onSuccess();
            } else {
              setPin(''); // Reset on wrong pin
            }
          }}>GO</button>
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ width: '100%', marginTop: '0.5rem', border: '2px solid #cbd5e1', background: '#f8fafc', color: '#475569' }}>Cancel</button>
      </div>
    </div>
  );
};

export default ParentGateModal;
