'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticoLogo } from '@/components/ui/TacticoLogo';
import { getCrowdAudio } from '@/lib/crowd-audio';

/**
 * IntroCinematic — the cold open that boots the football universe.
 *
 * Sequence:
 *   Phase 1 (0-2s):   Black screen. Silence fades to distant crowd murmur.
 *   Phase 2 (2-4s):   Stadium lights fade in (radial gradient from center).
 *   Phase 3 (4-5s):   TACTICO logo appears, "forged from light" (scale + glow).
 *   Phase 4 (5-6s):   Tagline fades in: "The Living Football Universe"
 *   Phase 5 (6-7s):   Logo fades out. Transition to loading.
 *   Phase 6 (7s+):    Loading messages cycle: "Initializing Football World..."
 *                      "Loading Clubs...", "Loading Players...", etc.
 *
 * No buttons. No UI. The game continues naturally.
 */

type Phase = 'black' | 'lights' | 'logo_reveal' | 'tagline' | 'fade_out' | 'loading';

const LOADING_MESSAGES = [
  'Initializing Football World...',
  'Loading Clubs...',
  'Loading Players...',
  'Building Match Engine...',
  'Calibrating Player Attributes...',
  'Preparing Football Universe...',
];

interface IntroCinematicProps {
  onComplete: () => void;
}

export function IntroCinematic({ onComplete }: IntroCinematicProps) {
  const [phase, setPhase] = useState<Phase>('black');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const crowdRef = useRef(getCrowdAudio());

  // Phase timing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      crowdRef.current.start().catch(() => {});
      setPhase('lights');
    }, 1500));

    timers.push(setTimeout(() => setPhase('logo_reveal'), 3000));
    timers.push(setTimeout(() => setPhase('tagline'), 4200));
    timers.push(setTimeout(() => setPhase('fade_out'), 5700));
    timers.push(setTimeout(() => setPhase('loading'), 6700));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Loading message cycling
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          setTimeout(() => {
            crowdRef.current.setVolume(0.15);
            onComplete();
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [phase, onComplete]);

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
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 60%)',
                  filter: 'blur(20px)',
                }}
                animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 1.2 }}
              />
              <div className="relative">
                <TacticoLogo size={140} variant="mark" />
              </div>
            </motion.div>

            <motion.h1
              className="font-headline text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter mt-8"
              initial={{ opacity: 0, y: 20, letterSpacing: '0.3em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '-0.03em' }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
            transition={{ duration: 0.8, delay: 0.2 }}
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
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <TacticoLogo size={56} variant="mark" />
            </motion.div>

            <div className="h-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-tertiary-c text-sm font-mono tracking-wider"
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="w-48 h-0.5 mt-6 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold-300 to-gold-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((loadingMsgIndex + 1) / LOADING_MESSAGES.length) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle field */}
      {phase !== 'black' && phase !== 'loading' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
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

      {/* Skip hint */}
      <AnimatePresence>
        {(phase === 'logo_reveal' || phase === 'tagline') && (
          <motion.button
            onClick={() => {
              crowdRef.current.setVolume(0.15);
              onComplete();
            }}
            className="absolute bottom-6 right-6 text-[10px] text-quaternary-c hover:text-tertiary-c transition-colors font-mono tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            SKIP ›
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
