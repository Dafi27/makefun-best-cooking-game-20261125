// Sizzle & Serve — audio.js
// All sound is synthesised with the Web Audio API: no audio files, no
// network. A tiny helper for clicks, sizzles, dings and the serve fanfare.

export class KitchenAudio {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(frequency, duration, type, volume, when = 0) {
    if (this.muted || !this.context) return;
    const start = this.context.currentTime + when;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  click() { this.ensure(); this.tone(660, 0.07, 'square', 0.05); }
  pickUp() { this.ensure(); this.tone(520, 0.08, 'sine', 0.08); this.tone(780, 0.08, 'sine', 0.06, 0.05); }
  place() { this.ensure(); this.tone(340, 0.09, 'triangle', 0.1); }
  chop() { this.ensure(); this.tone(180, 0.06, 'square', 0.09); this.tone(140, 0.06, 'square', 0.07, 0.07); }
  error() { this.ensure(); this.tone(160, 0.16, 'sawtooth', 0.07); }
  ding() { this.ensure(); this.tone(880, 0.25, 'sine', 0.1); this.tone(1318, 0.3, 'sine', 0.08, 0.09); }
  serveFanfare() {
    this.ensure();
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, i * 0.09));
  }

  startSizzle() {
    if (this.muted || !this.context || this.sizzleNodes) return;
    const length = this.context.sampleRate * 1;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = this.context.createGain();
    gain.gain.value = 0.035;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
    this.sizzleNodes = { source, gain };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.source.stop(); } catch { /* already stopped */ }
    this.sizzleNodes = null;
  }
}
