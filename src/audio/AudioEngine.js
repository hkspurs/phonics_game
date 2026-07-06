class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master Compressor for Volume Normalization (Challenge 14)
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
    this.compressor.connect(this.audioContext.destination);

    this.preloadedBuffers = new Map(); // Use Map for LRU Cache (Challenge 11)
    this.MAX_CACHE_SIZE = 30;

    this.currentSource = null;
    this.bgmSource = null;
    this.playCallId = 0; // Prevent Race Conditions (Challenge 12)

    // Handle background suspend/resume (Challenge 20)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.audioContext.suspend();
      } else {
        this.audioContext.resume();
      }
    });
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
    for (const url of urls) {
      if (url && !this.preloadedBuffers.has(url)) {
        await this._loadBuffer(url); // Fire and forget can cause issues if awaited linearly.
      }
    }
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
      source.connect(this.compressor); // Connect to compressor instead of raw destination
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
    gainNode.connect(this.compressor); // Connect to compressor
    
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
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.compressor);
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.2);
    }
  }
}

export const audioEngine = new AudioEngine();
