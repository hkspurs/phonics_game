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
    const t = this.audioContext.currentTime;

    if (type === 'pop') {
      // Bubbly marimba pop
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.start(t);
      osc.stop(t + 0.2);

    } else if (type === 'correct') {
      // Cheerful magical chime (C6 - E6 - G6 - C7)
      const playNote = (freq, delay, duration) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + delay);
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(0.3, t + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
        osc.start(t + delay);
        osc.stop(t + delay + duration);
      };
      playNote(1046.50, 0.00, 0.3); // C6
      playNote(1318.51, 0.06, 0.3); // E6
      playNote(1567.98, 0.12, 0.4); // G6
      playNote(2093.00, 0.18, 0.5); // C7
      
    } else if (type === 'error') {
      // Soft double boop (much less harsh than square wave)
      const playBoop = (delay) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t + delay);
        osc.frequency.exponentialRampToValueAtTime(150, t + delay + 0.15);
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(0.5, t + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.2);
        osc.start(t + delay);
        osc.stop(t + delay + 0.3);
      };
      playBoop(0);
      playBoop(0.15);

    } else if (type === 'win') {
      // Triumphant Fanfare
      const playNote = (freq, delay, duration) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        
        // Add a slight vibrato
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 6; // 6Hz vibrato
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t + delay);
        lfo.stop(t + delay + duration);

        osc.frequency.setValueAtTime(freq, t + delay);
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(0.15, t + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
        osc.start(t + delay);
        osc.stop(t + delay + duration);
      };
      playNote(523.25, 0.0, 0.2); // C5
      playNote(523.25, 0.15, 0.2); // C5
      playNote(523.25, 0.30, 0.2); // C5
      playNote(659.25, 0.45, 0.8); // E5
    }
  }
}

export const audioEngine = new AudioEngine();
