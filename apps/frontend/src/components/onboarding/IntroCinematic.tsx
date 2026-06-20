'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticoLogo } from '@/components/ui/TacticoLogo';
import { getCrowdAudio } from '@/lib/crowd-audio';

/**
 * IntroCinematic — the cold open that boots the football universe.
 *
 * Total duration: ~8 seconds (skippable after 3s).
 *
 * Sequence:
 *   0.0s  Black screen. Silence.
 *   1.0s  Crowd audio fades in. Stadium lights fade on.
 *   2.0s  TACTICO logo "forged from light" (scale + glow).
 *   3.0s  Tagline: "The Living Football Universe"
 *   4.0s  Logo fades out.
 *   4.5s  Loading screen — messages cycle every 0.8s.
 *   8.0s  Auto-advance to next step.
 */

type Phase = 'black' | 'lights' | 'logo_reveal' | 'tagline' | 'fade_out' | 'loading';

const LOADING_MESSAGES = [
  'Initializing Football World...',
  'Loading Clubs...',
  'Loading Players...',
  'Building Match Engine...',
  'Preparing Football Universe...',
];

// Master timeline (milliseconds)
const TIMING = {
  lights: 1000,
  logo_reveal: 2000,
  tagline: 3000,
  fade_out: 4000,
  loading: 4500,
  complete: 8000, // total duration before auto-advance
};

interface IntroCinematicProps {
  onComplete: () => void;
}

export function IntroCinematic({ onComplete }: IntroCinematicProps) {
  const [phase, setPhase] = useState<Phase>('black');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const crowdRef = useRef(getCrowdAudio());
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const safeComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      crowdRef.current.setVolume(0.15);
    } catch {}
    onCompleteRef.current();
  }, []);

  // ---------- AUDIO UNLOCK (user gesture required) ----------
  // Browsers block AudioContext until a user interacts. We show a
  // "TAP TO BEGIN" overlay. When tapped, we start the crowd audio
  // and kick off the cinematic timeline.
  const handleAudioUnlock = useCallback(() => {
    if (audioUnlocked) return;
    setAudioUnlocked(true);
    // Start crowd audio immediately on the user gesture
    crowdRef.current.start().catch(() => {});
    // Play a UI click sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      ctx.close();
    } catch {}
  }, [audioUnlocked]);

  // ---------- MASTER TIMELINE (starts after audio unlock) ----------
  useEffect(() => {
    if (!audioUnlocked) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('lights'), 1000));
    timers.push(setTimeout(() => setPhase('logo_reveal'), 2000));
    timers.push(setTimeout(() => setPhase('tagline'), 3000));
    timers.push(setTimeout(() => setPhase('fade_out'), 4000));
    timers.push(setTimeout(() => setPhase('loading'), 4500));
    timers.push(setTimeout(() => safeComplete(), 8000));

    return () => timers.forEach(clearTimeout);
  }, [audioUnlocked, safeComplete]);

  // ---------- LOADING MESSAGE CYCLING ----------
  // Separate effect — only depends on `phase` (not onComplete).
  useEffect(() => {
    if (phase !== 'loading') return;

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < LOADING_MESSAGES.length) {
        setLoadingMsgIndex(msgIdx);
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [phase]);

  // ---------- SKIP ----------
  const handleSkip = useCallback(() => {
    safeComplete();
  }, [safeComplete]);

  return (
    <div className="fixed inset-0 z-max overflow-hidden bg-black">
      {/* Phase 1: BLACK */}
      <AnimatePresence>
        {phase === 'black' && (
          <motion.div
            className="absolute inset-0 bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {/* Phase 2: STADIUM LIGHTS */}
      <AnimatePresence>
        {(phase === 'lights' || phase === 'logo_reveal' || phase === 'tagline' || phase === 'fade_out') && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'fade_out' ? 0 : 1 }}
            transition={{ duration: phase === 'fade_out' ? 1 : 2 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.04) 0%, rgba(20, 20, 28, 0.6) 40%, #050507 80%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  linear-gradient(90deg, transparent 0%, transparent 45%, rgba(255, 215, 0, 0.08) 50%, transparent 55%, transparent 100%),
                  linear-gradient(0deg, transparent 0%, transparent 45%, rgba(255, 215, 0, 0.04) 50%, transparent 55%, transparent 100%)
                `,
              }}
            />
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[60%]"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 240, 180, 0.15) 0%, transparent 70%)',
                clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 1.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: LOGO REVEAL */}
      <AnimatePresence>
        {(phase === 'logo_reveal' || phase === 'tagline') && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, filter: 'brightness(3) blur(8px)' }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: ['brightness(3) blur(8px)', 'brightness(2) blur(2px)', 'brightness(1) blur(0px)'],
              }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 60%)',
                  filter: 'blur(20px)',
                }}
                animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 1 }}
              />
              <div className="relative">
                <TacticoLogo size={120} variant="mark" />
              </div>
            </motion.div>

            <motion.h1
              className="font-headline text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter mt-8"
              initial={{ opacity: 0, y: 20, letterSpacing: '0.3em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '-0.03em' }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 50%, #B0830C 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TACTICO
              </span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: TAGLINE */}
      <AnimatePresence>
        {phase === 'tagline' && (
          <motion.div
            className="absolute inset-0 flex items-end justify-center pb-[25vh]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <p className="text-tertiary-c text-xs sm:text-sm uppercase tracking-[0.4em] font-mono font-semibold">
              The Living Football Universe
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 6: LOADING */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <TacticoLogo size={48} variant="mark" />
            </motion.div>

            {/* Cycling loading message */}
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-tertiary-c text-sm font-mono tracking-wider"
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar — fills over 3.5s (loading duration) */}
            <div className="w-40 h-0.5 mt-5 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold-300 to-gold-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.5, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle field during lights/logo phases */}
      {phase !== 'black' && phase !== 'loading' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-gold-300"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 1 + Math.random() * 2,
                height: 1 + Math.random() * 2,
              }}
              animate={{ opacity: [0, 0.6, 0], y: [0, -20, 0] }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      )}

      {/* Skip button — always visible after 2s */}
      {phase !== 'black' && phase !== 'loading' && (
        <motion.button
          onClick={handleSkip}
          className="absolute bottom-6 right-6 text-[10px] text-quaternary-c hover:text-tertiary-c transition-colors font-mono tracking-widest z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          SKIP ›
        </motion.button>
      )}

      {/* Tap to continue during loading (in case auto-advance fails) */}
      {phase === 'loading' && (
        <motion.button
          onClick={handleSkip}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-quaternary-c hover:text-tertiary-c transition-colors font-mono tracking-widest z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          TAP TO CONTINUE
        </motion.button>
      )}

      {/* ---------- TAP TO BEGIN overlay (audio unlock) ---------- */}
      {!audioUnlocked && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black cursor-pointer"
          onClick={handleAudioUnlock}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Faint Tactico logo in background */}
          <div className="opacity-20 mb-8">
            <TacticoLogo size={80} variant="mark" />
          </div>

          <motion.p
            className="text-tertiary-c text-sm font-mono tracking-[0.4em] uppercase mb-4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Tap to Begin
          </motion.p>
          <p className="text-quaternary-c text-[10px] font-mono tracking-widest">
            🔊 Best with sound on
          </p>
        </motion.div>
      )}
    </div>
  );
}
