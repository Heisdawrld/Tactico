'use client';

import { motion } from 'framer-motion';
import { TacticoLogo } from '@/components/ui/TacticoLogo';

/**
 * WelcomeScreen — the first interactive moment.
 *
 * "Welcome to Tactico. Every decision creates history."
 * Single button: "Begin Journey"
 *
 * No menus. No "New Game / Continue / Settings". Just one button.
 * The game continues naturally.
 */
interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-max flex flex-col items-center justify-center bg-surface-base overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background — subtle stadium-at-night feel */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.03) 0%, rgba(10, 10, 15, 1) 70%)',
        }}
      />

      {/* Subtle floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold-300"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            opacity: 0.3,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
          <TacticoLogo size={64} variant="mark" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-tertiary-c text-xs font-mono tracking-[0.3em] uppercase mb-4"
        >
          Welcome to
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-headline text-5xl sm:text-6xl font-black tracking-tighter mb-6"
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

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-secondary-c text-base sm:text-lg font-display font-medium leading-relaxed mb-12"
        >
          Every decision creates history.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          onClick={onContinue}
          className="group relative px-10 py-4 rounded-md font-display font-bold text-base tracking-tight text-black overflow-hidden transition-transform hover:scale-105 active:scale-100"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #B0830C 100%)',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}
        >
          <span className="relative z-10">Begin Journey</span>
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
            }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
