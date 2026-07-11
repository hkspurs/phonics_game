import '@testing-library/jest-dom';

// Mock localStorage for Zustand persist
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock AudioContext for audio engine
window.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
  }
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
  createDynamicsCompressor() {
    return {
      connect: () => {},
      threshold: { setValueAtTime: () => {} },
      knee: { setValueAtTime: () => {} },
      ratio: { setValueAtTime: () => {} },
      attack: { setValueAtTime: () => {} },
      release: { setValueAtTime: () => {} },
    };
  }
  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      buffer: null,
      playbackRate: { value: 1 },
      onended: null,
    };
  }
  decodeAudioData() { return Promise.resolve({}); }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  get destination() { return {}; }
};

window.webkitAudioContext = window.AudioContext;

// Suppress fetch warnings in tests
global.fetch = vi.fn(() => Promise.resolve({ ok: false }));

// Mock IntersectionObserver
window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  };
};
