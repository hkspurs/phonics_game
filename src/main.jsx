import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Keep direct math links usable with the app's HashRouter (bookmarks/tests often omit `/#`).
if (!window.location.hash && /^\/math(?:\/(?:gym|map|daily|reward))?$/.test(window.location.pathname)) {
  window.location.replace(`/#${window.location.pathname}${window.location.search}`);
}

// Global Input Debouncer (Issue 13: Prevent button mashing)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button, .map-node');
  if (btn && !btn.disabled) {
    if (btn.dataset.debouncing) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    btn.dataset.debouncing = "true";
    const originalPointerEvents = btn.style.pointerEvents;
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      if (document.contains(btn)) {
        btn.style.pointerEvents = originalPointerEvents;
        delete btn.dataset.debouncing;
      }
    }, 500);
  }
}, true); // Use capture phase to intercept early

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
