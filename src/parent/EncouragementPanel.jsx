import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function EncouragementPanel() {
  const { sendEncouragement, encouragements } = useGameStore();
  const [customMsg, setCustomMsg] = useState('');
  
  // Check if an encouragement was already sent today
  const today = new Date().toDateString();
  const sentToday = encouragements?.some(e => new Date(e.createdAt).toDateString() === today);

  const presets = [
    "今日你好專心，做得好！",
    "你肯再試一次，已經好叻！",
    "我見到你數數進步咗！",
    "唔怕答錯，慢慢學就得！"
  ];

  const handleSend = (msg) => {
    if (sentToday) return;
    sendEncouragement({ message: msg, rewardType: 'sticker' });
    setCustomMsg('');
    alert('鼓勵已送出！小朋友下次登入時會收到。');
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        💌 Encourage Your Child
      </h3>
      
      {sentToday ? (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          今日已經送出鼓勵了，明天再來吧！
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            發送一句鼓勵說話，小朋友下次登入時會收到一張貼紙獎勵！(每日限一次)
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {presets.map((msg, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(msg)}
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '100px', padding: '0.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
              >
                {msg}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value.slice(0, 60))}
              placeholder="自訂鼓勵說話 (最多60字)..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button 
              onClick={() => customMsg.trim() && handleSend(customMsg.trim())}
              disabled={!customMsg.trim()}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', opacity: customMsg.trim() ? 1 : 0.5 }}
            >
              發送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
