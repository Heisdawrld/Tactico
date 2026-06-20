'use client';

/**
 * Tactico Crowd Audio Synthesizer
 *
 * Generates procedural stadium crowd ambience using the Web Audio API.
 * No audio files needed — everything is synthesized in-browser.
 *
 * Layers:
 * 1. Brown noise (base crowd murmur) → low-pass filter → sounds like distant crowd
 * 2. Random "swells" (gain modulation) → simulates crowd reactions
 * 3. Occasional high-frequency "whistles" (filtered noise bursts)
 *
 * API:
 *   const audio = new CrowdAudio();
 *   await audio.start();    // begins crowd ambience
 *   audio.swell();          // trigger a crowd reaction (e.g., goal)
 *   audio.setVolume(0.5);   // 0..1
 *   audio.stop();
 */

export class CrowdAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private swellOsc: OscillatorNode | null = null;
  private swellGain: GainNode | null = null;
  private isRunning = false;
  private currentVolume = 0.4;

  /**
   * Generate a buffer of brown noise (smoother than white noise, sounds more natural).
   */
  private createBrownNoiseBuffer(ctx: AudioContext, durationSec: number = 4): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise: integrate white noise with a leaky integrator
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  /**
   * Start the crowd ambience. Must be called after a user gesture (browser autoplay policy).
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, this.ctx.currentTime + 2); // fade in over 2s
      this.masterGain.connect(this.ctx.destination);

      // --- Layer 1: Base crowd murmur (brown noise + lowpass) ---
      const noiseBuffer = this.createBrownNoiseBuffer(this.ctx, 4);
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 600; // muffled crowd sound
      this.lowpass.Q.value = 0.7;

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = 0.6;

      this.noiseSource.connect(this.lowpass);
      this.lowpass.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      this.noiseSource.start();

      // --- Layer 2: Subtle swell modulation (LFO on noise gain) ---
      // This makes the crowd "breathe" — slight volume variations
      this.swellOsc = this.ctx.createOscillator();
      this.swellOsc.frequency.value = 0.15; // very slow LFO
      this.swellGain = this.ctx.createGain();
      this.swellGain.gain.value = 0.15; // depth of modulation
      this.swellOsc.connect(this.swellGain);
      this.swellGain.connect(this.noiseGain.gain);
      this.swellOsc.start();

      // --- Layer 3: Random periodic "roar" swells ---
      // Every 8-15 seconds, trigger a subtle crowd reaction
      this.scheduleRandomSwell();

      this.isRunning = true;
    } catch (e) {
      console.warn('CrowdAudio start failed:', e);
    }
  }

  /**
   * Schedule random swell events to make the crowd feel alive.
   */
  private scheduleRandomSwell() {
    if (!this.ctx || !this.noiseGain || !this.isRunning) return;

    const nextDelay = 8000 + Math.random() * 7000; // 8-15s
    setTimeout(() => {
      if (!this.isRunning) return;
      this.subtleSwell();
      this.scheduleRandomSwell();
    }, nextDelay);
  }

  /**
   * A subtle crowd reaction — slight volume bump (not a full roar).
   */
  private subtleSwell() {
    if (!this.ctx || !this.noiseGain) return;
    const now = this.ctx.currentTime;
    const targetGain = 0.85;
    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
    this.noiseGain.gain.linearRampToValueAtTime(targetGain, now + 0.5);
    this.noiseGain.gain.linearRampToValueAtTime(0.6, now + 2.5);
  }

  /**
   * Trigger a big crowd reaction (goal, near miss, etc.).
   * Boosts the noise gain + raises the filter frequency briefly.
   */
  swell(intensity: number = 1) {
    if (!this.ctx || !this.noiseGain || !this.lowpass) return;
    const now = this.ctx.currentTime;
    const peakGain = 0.6 + 0.4 * intensity;
    const peakFreq = 600 + 1200 * intensity;

    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
    this.noiseGain.gain.linearRampToValueAtTime(peakGain, now + 0.15);
    this.noiseGain.gain.linearRampToValueAtTime(0.6, now + 2.5);

    this.lowpass.frequency.cancelScheduledValues(now);
    this.lowpass.frequency.setValueAtTime(this.lowpass.frequency.value, now);
    this.lowpass.frequency.linearRampToValueAtTime(peakFreq, now + 0.15);
    this.lowpass.frequency.linearRampToValueAtTime(600, now + 2.5);
  }

  /**
   * Play a referee whistle sound (filtered square wave burst).
   */
  whistle() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 2200;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 2350;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.setValueAtTime(0.08, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  /**
   * Set the master volume (0..1).
   */
  setVolume(v: number) {
    this.currentVolume = v;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.3);
    }
  }

  /**
   * Stop the crowd ambience and clean up.
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 1); // 1s fade out
    }

    setTimeout(() => {
      try {
        this.noiseSource?.stop();
        this.swellOsc?.stop();
        this.ctx?.close();
      } catch {}
      this.ctx = null;
      this.masterGain = null;
      this.noiseSource = null;
      this.noiseGain = null;
      this.lowpass = null;
      this.swellOsc = null;
      this.swellGain = null;
    }, 1100);
  }

  get running() {
    return this.isRunning;
  }
}

// Singleton
let _instance: CrowdAudio | null = null;
export function getCrowdAudio(): CrowdAudio {
  if (!_instance) _instance = new CrowdAudio();
  return _instance;
}
