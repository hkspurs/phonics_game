import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global Input Debouncer (Issue 13: Prevent button mashing)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button, .map-node');
  if (btn && !btn.disabled && !btn.dataset.debouncing) {
    btn.dataset.debouncing = "true";
    const originalPointerEvents = btn.style.pointerEvents;
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.style.pointerEvents = originalPointerEvents;
      delete btn.dataset.debouncing;
    }, 500);
  }
}, true); // Use capture phase to intercept early

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
