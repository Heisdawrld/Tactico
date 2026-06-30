'use client';

import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { useAppStore } from '@/lib/store';

/**
 * Tactico Audio System
 *
 * Three audio layers:
 * 1. Ambience — low-volume crowd noise loop in menus
 * 2. SFX      — UI clicks, hovers, score stings
 * 3. Matchday — full crowd atmosphere during match simulation
 *
 * Audio is OFF by default (browser autoplay policies).
 * Toggled on by user interaction (click on audio button).
 *
 * Sound files are expected at /public/sounds/ — placeholder paths only,
 * the system silently no-ops if files are missing.
 */

type SfxName =
  | 'click'
  | 'hover'
  | 'success'
  | 'error'
  | 'goal'
  | 'whistle'
  | 'notification'
  | 'tab-switch'
  | 'advance-week';

interface SoundEntry {
  howl: Howl;
  volume: number; // base volume (0..1), multiplied by user setting
}

const SFX_PATHS: Record<SfxName, string> = {
  click:           '/sounds/sfx/click.mp3',
  hover:           '/sounds/sfx/hover.mp3',
  success:         '/sounds/sfx/success.mp3',
  error:           '/sounds/sfx/error.mp3',
  goal:            '/sounds/sfx/goal.mp3',
  whistle:         '/sounds/sfx/whistle.mp3',
  notification:    '/sounds/sfx/notification.mp3',
  'tab-switch':    '/sounds/sfx/tab-switch.mp3',
  'advance-week':  '/sounds/sfx/advance-week.mp3',
};

const AMBIENCE_PATH = '/sounds/ambience/menu-crowd.mp3';
const MATCHDAY_PATH = '/sounds/ambience/matchday-crowd.mp3';

class TacticoAudioEngine {
  private sfxCache = new Map<SfxName, SoundEntry>();
  private ambience: Howl | null = null;
  private matchday: Howl | null = null;
  private initialized = false;

  /**
   * Lazily load all sound files. Called after the first user interaction
   * (when audio is first toggled on).
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load SFX
    (Object.keys(SFX_PATHS) as SfxName[]).forEach((name) => {
      const howl = new Howl({
        src: [SFX_PATHS[name]],
        volume: 0,
        preload: true,
        onloaderror: () => { /* silent — file may not exist yet */ },
        onplayerror: () => { /* silent */ },
      });
      this.sfxCache.set(name, { howl, volume: 0.6 });
    });

    // Load ambience
    this.ambience = new Howl({
      src: [AMBIENCE_PATH],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => { /* silent */ },
    });

    this.matchday = new Howl({
      src: [MATCHDAY_PATH],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => { /* silent */ },
    });
  }

  /**
   * Apply user volume settings to all channels.
   */
  applyVolumes(master: number, ambience: number, sfx: number) {
    Howler.volume(master);
    if (this.ambience) this.ambience.volume(ambience * 0.4); // menu ambience is subtle
    if (this.matchday) this.matchday.volume(ambience * 0.7);
    this.sfxCache.forEach((entry) => {
      entry.howl.volume(entry.volume * sfx);
    });
  }

  /**
   * Play a one-shot SFX.
   */
  playSfx(name: SfxName) {
    const entry = this.sfxCache.get(name);
    if (!entry) return;
    if (entry.howl.state() === 'loaded') {
      entry.howl.play();
    }
  }

  /**
   * Start menu ambience (low volume crowd noise).
   */
  startAmbience() {
    if (!this.ambience) return;
    if (!this.ambience.playing()) {
      this.ambience.play();
    }
  }

  /**
   * Stop menu ambience.
   */
  stopAmbience() {
    if (this.ambience && this.ambience.playing()) {
      this.ambience.fade(this.ambience.volume(), 0, 500);
      setTimeout(() => this.ambience?.stop(), 500);
    }
  }

  /**
   * Switch to matchday atmosphere (louder, more intense).
   */
  startMatchday() {
    this.stopAmbience();
    if (!this.matchday) return;
    if (!this.matchday.playing()) {
      this.matchday.play();
    }
  }

  /**
   * Stop matchday ambience.
   */
  stopMatchday() {
    if (this.matchday && this.matchday.playing()) {
      this.matchday.fade(this.matchday.volume(), 0, 800);
      setTimeout(() => this.matchday?.stop(), 800);
    }
  }

  /**
   * Mute everything.
   */
  muteAll() {
    Howler.mute(true);
  }

  /**
   * Unmute everything.
   */
  unmuteAll() {
    Howler.mute(false);
  }
}

// Singleton
let _engine: TacticoAudioEngine | null = null;
function getEngine(): TacticoAudioEngine {
  if (!_engine) _engine = new TacticoAudioEngine();
  return _engine;
}

/**
 * Public API: play a UI sound.
 * Uses the full TacticoAudioEngine if audio is enabled.
 * Falls back to a simple Web Audio click if engine isn't ready.
 */
export function playSfx(name: SfxName) {
  const state = useAppStore.getState();
  if (!state.audioEnabled) {
    // Even if "audio disabled" in settings, still play a very quiet click
    // via raw Web Audio (so taps always feel responsive). Volume controlled
    // by sfxVolume setting.
    playRawClick(state.sfxVolume * 0.3);
    return;
  }
  getEngine().playSfx(name);
}

/**
 * Play a raw Web Audio click — no dependency on the engine or audio files.
 * This is the fallback that ALWAYS works (even before engine is initialized).
 */
// Shared AudioContext — reuse to avoid browser limit (~6 concurrent contexts)
let _sharedCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!_sharedCtx || _sharedCtx.state === 'closed') {
    _sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _sharedCtx;
}

export function playRawClick(volume: number = 0.1) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

/**
 * React hook that subscribes to the audio store and keeps the engine in sync.
 * Mount this once at the app root.
 */
export function useAudioEngine() {
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const ambienceVolume = useAppStore((s) => s.ambienceVolume);
  const sfxVolume = useAppStore((s) => s.sfxVolume);
  const activeSection = useAppStore((s) => s.activeSection);
  const lastSection = useRef(activeSection);

  // Initialize + apply volumes whenever settings change
  useEffect(() => {
    if (!audioEnabled) return;
    const engine = getEngine();
    engine.init();
    engine.applyVolumes(masterVolume, ambienceVolume, sfxVolume);
    engine.unmuteAll();
    engine.startAmbience();
    return () => {
      // Don't stop on every setting change — just keep running
    };
  }, [audioEnabled, masterVolume, ambienceVolume, sfxVolume]);

  // Switch to matchday ambience when entering match-simulation
  useEffect(() => {
    if (!audioEnabled) return;
    const engine = getEngine();
    if (activeSection === 'match-simulation') {
      engine.startMatchday();
    } else if (lastSection.current === 'match-simulation') {
      engine.stopMatchday();
      engine.startAmbience();
    }
    lastSection.current = activeSection;
  }, [activeSection, audioEnabled]);

  // Mute/unmute on toggle
  useEffect(() => {
    const engine = getEngine();
    if (audioEnabled) {
      engine.init();
      engine.applyVolumes(masterVolume, ambienceVolume, sfxVolume);
      engine.unmuteAll();
      engine.startAmbience();
    } else {
      engine.muteAll();
    }
  }, [audioEnabled, masterVolume, ambienceVolume, sfxVolume]);
}
