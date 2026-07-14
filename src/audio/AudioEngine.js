import audioManifest from '../../data/audio_manifest.json';

class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master Gain to boost overall volume
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.setValueAtTime(1.5, this.audioContext.currentTime); // Boost by 50% to make it normal/louder
    
    // Master Compressor for Volume Normalization (Challenge 14)
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.audioContext.currentTime); // Less aggressive threshold
    this.compressor.knee.setValueAtTime(20, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime); // Less squashing
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
    
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.audioContext.destination);

    this.preloadedBuffers = new Map(); // Use Map for LRU Cache (Challenge 11)
    this.MAX_CACHE_SIZE = 30;

    this.currentSource = null;
    this.bgmSource = null;
    this.playCallId = 0; // Prevent Race Conditions (Challenge 12)

    // iOS Safari Fix: Do NOT manually suspend/resume on visibilitychange.
    // iOS handles it natively. Manually resuming without user gesture breaks the context.
    
    // Global unlocker: Ensure context wakes up on next tap if it was suspended (e.g. returning from background)
    const unlockAudio = () => {
      if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
        this.audioContext.resume().catch(() => {});
      }
    };
    
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });
  }

  async _loadBuffer(url, retries = 2) {
    if (this.preloadedBuffers.has(url)) {
      // LRU refresh
      const buf = this.preloadedBuffers.get(url);
      this.preloadedBuffers.delete(url);
      this.preloadedBuffers.set(url, buf);
      return buf;
    }
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Enforce LRU size limit
        if (this.preloadedBuffers.size >= this.MAX_CACHE_SIZE) {
          const firstKey = this.preloadedBuffers.keys().next().value;
          this.preloadedBuffers.delete(firstKey);
        }
        
        this.preloadedBuffers.set(url, audioBuffer);
        return audioBuffer;
      } catch (e) {
        console.warn(`Failed to load audio (Attempt ${i+1}):`, url, e);
        if (i === retries) return null;
        await new Promise(r => setTimeout(r, 500)); // wait 500ms before retry
      }
    }
    return null;
  }

  async preload(urls) {
    const promises = urls
      .filter(url => url && !this.preloadedBuffers.has(url))
      .map(url => this._loadBuffer(url));
      
    await Promise.all(promises);
  }

  play(url, startTimeMs = 0, durationMs = 0, playbackRate = 1.0) {
    return new Promise(async (resolve) => {
      this.stop(); // stop current
      const currentCallId = ++this.playCallId; // Unique ID for this play request

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(()=>{});
      }

      const buffer = await this._loadBuffer(url);
      
      // If a new play call was made while we were fetching, abort this one (Challenge 12)
      if (this.playCallId !== currentCallId || !buffer) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate; // Challenge 26: Playback Speed
      source.connect(this.masterGain); // Connect to master gain
      this.currentSource = source;

      source.onended = () => {
        resolve();
      };

      const startOffset = startTimeMs / 1000;
      const duration = durationMs > 0 ? durationMs / 1000 : (buffer.duration - startOffset) / playbackRate;

      if (durationMs > 0) {
        source.start(0, startOffset, duration);
      } else {
        source.start(0, startOffset);
      }
    });
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.onended = null;
      try { this.currentSource.stop(); } catch (e) {}
      this.currentSource = null;
    }
  }

  async playBGM(url, volume = 0.3) {
    this.stopBGM();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    const buffer = await this._loadBuffer(url);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = true;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain); // Connect to master gain
    
    this.bgmSource = source;
    source.start(0);
  }

  stopBGM() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch (e) {}
      this.bgmSource = null;
    }
  }

  playUI(type = 'pop') {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    
    // Use Kenney Interface Sounds
    const SOUND_MAP = {
      pop: '/assets/kenney/interface-sounds/Audio/click_001.ogg',
      correct: '/assets/kenney/interface-sounds/Audio/confirmation_001.ogg',
      error: '/assets/kenney/interface-sounds/Audio/error_004.ogg',
      win: '/assets/kenney/interface-sounds/Audio/maximize_006.ogg'
    };

    const url = SOUND_MAP[type];
    if (url) {
      // Play it concurrently, don't await, so it acts like a fire-and-forget sound effect
      this.play(url, 0, 0, 1.0);
    }
  }

  async playAudioById(audioId, options = {}) {
    if (!audioId) return false;
    
    const item = audioManifest[audioId];
    if (!item) {
      console.warn(`[AudioEngine] Audio ID not found in manifest: ${audioId}`);
      return false;
    }

    if (item.qaStatus === 'fail') {
      console.warn(`[AudioEngine] Audio ID ${audioId} is marked as fail in QA.`);
      return false;
    }

    // Try playing the file
    if (item.file) {
      const url = `/${item.file}`; // assuming relative to public root
      try {
        const buffer = await this._loadBuffer(url, 0); // 0 retries to fail fast for fallback
        if (buffer) {
          const { startTimeMs = 0, durationMs = 0, playbackRate = 1.0 } = options;
          await this.play(url, startTimeMs, durationMs, playbackRate);
          return true;
        }
      } catch (e) {
        console.warn(`[AudioEngine] Failed to load MP3 for ${audioId}:`, e);
      }
    }

    // File missing or failed to load. Use fallback?
    if (item.type === 'instruction' || item.type === 'feedback') {
      console.log(`[AudioEngine] Using Speech Synthesis fallback for ${audioId}`);
      return this._playSpeechSynthesis(item);
    } else {
      console.warn(`[AudioEngine] Missing audio for strict target sound ${audioId}. No fallback allowed.`);
      return false;
    }
  }

  _playSpeechSynthesis(item) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !item.expectedText) {
        resolve(false);
        return;
      }
      this.stop(); // Stop any other audio
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(item.expectedText);
      if (item.language) utterance.lang = item.language;
      
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      
      window.speechSynthesis.speak(utterance);
      
      // Safety fallback
      setTimeout(() => resolve(true), 5000);
    });
  }
}

export const audioEngine = new AudioEngine();
