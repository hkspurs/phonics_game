class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.preloadedBuffers = {};
    this.currentSource = null;
    this.bgmSource = null;
  }

  async _loadBuffer(url) {
    if (this.preloadedBuffers[url]) return this.preloadedBuffers[url];
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.preloadedBuffers[url] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.warn("Failed to load audio:", url, e);
      return null;
    }
  }

  async preload(urls) {
    for (const url of urls) {
      if (url && !this.preloadedBuffers[url]) {
        await this._loadBuffer(url);
      }
    }
  }

  play(url, startTimeMs = 0, durationMs = 0) {
    return new Promise(async (resolve) => {
      this.stop(); // stop current
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = await this._loadBuffer(url);
      if (!buffer) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      this.currentSource = source;

      source.onended = () => {
        resolve();
      };

      const startOffset = startTimeMs / 1000;
      const duration = durationMs > 0 ? durationMs / 1000 : buffer.duration - startOffset;

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
    gainNode.connect(this.audioContext.destination);
    
    this.bgmSource = source;
    source.start(0);
  }

  stopBGM() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch (e) {}
      this.bgmSource = null;
    }
  }
}

export const audioEngine = new AudioEngine();
