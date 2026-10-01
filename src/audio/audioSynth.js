/**
 * Web Audio API synthesizer for medical HUD telemetry, ECG heart monitor, and AR scanner sounds.
 */
export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.volume = 0.15;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.init();
      this.playBeep(880, 0.08, 'sine');
    }
    return this.isEnabled;
  }

  playHeartbeat() {
    if (!this.isEnabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // First lub (lower frequency)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain1.gain.setValueAtTime(this.volume * 0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Second dub (slightly higher frequency)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, now + 0.11);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.18);

      gain2.gain.setValueAtTime(this.volume * 0.9, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.2);
    } catch (e) {
      // Audio context might be restricted
    }
  }

  playBeep(freq = 640, duration = 0.05, type = 'sine') {
    if (!this.isEnabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }
}
