'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FootballGlobe — the signature Tactico moment.
 *
 * Earth at night. One by one, lights appear over football cities:
 *   London, Madrid, Lagos, Buenos Aires, São Paulo, Munich, Milan, Tokyo, etc.
 *
 * Then a narrator-style text appears:
 *   "Millions of supporters. Thousands of clubs. One living football universe.
 *    Your story begins now."
 *
 * The globe slowly zooms in (toward the user's chosen region) when they proceed.
 */

interface FootballCity {
  name: string;
  // Position on the globe as percentage (x: 0-100 left-right, y: 0-100 top-bottom)
  x: number;
  y: number;
  size: number; // dot size in px
  delay: number; // appearance delay in seconds
}

// Stylized positions for famous football cities on a 2D world map projection
const FOOTBALL_CITIES: FootballCity[] = [
  { name: 'London',     x: 47, y: 32, size: 4, delay: 0.5 },
  { name: 'Madrid',     x: 45, y: 38, size: 4, delay: 0.8 },
  { name: 'Paris',      x: 46, y: 34, size: 3, delay: 1.0 },
  { name: 'Munich',     x: 49, y: 33, size: 3, delay: 1.2 },
  { name: 'Milan',      x: 50, y: 36, size: 3, delay: 1.4 },
  { name: 'Barcelona',  x: 44, y: 38, size: 3, delay: 1.6 },
  { name: 'Lisbon',     x: 42, y: 40, size: 2, delay: 1.8 },
  { name: 'Amsterdam',  x: 47, y: 31, size: 2, delay: 2.0 },
  { name: 'Lagos',      x: 49, y: 56, size: 4, delay: 2.2 },
  { name: 'Cairo',      x: 55, y: 44, size: 3, delay: 2.4 },
  { name: 'Istanbul',   x: 54, y: 36, size: 3, delay: 2.6 },
  { name: 'Moscow',     x: 55, y: 28, size: 3, delay: 2.8 },
  { name: 'Mumbai',     x: 65, y: 47, size: 3, delay: 3.0 },
  { name: 'Tokyo',      x: 82, y: 36, size: 4, delay: 3.2 },
  { name: 'Seoul',      x: 80, y: 35, size: 3, delay: 3.4 },
  { name: 'Beijing',    x: 78, y: 33, size: 3, delay: 3.6 },
  { name: 'Shanghai',   x: 80, y: 38, size: 3, delay: 3.8 },
  { name: 'Buenos Aires', x: 33, y: 70, size: 4, delay: 4.0 },
  { name: 'São Paulo',  x: 36, y: 65, size: 4, delay: 4.2 },
  { name: 'Rio',        x: 37, y: 63, size: 3, delay: 4.4 },
  { name: 'Lima',       x: 28, y: 58, size: 2, delay: 4.6 },
  { name: 'Bogotá',     x: 27, y: 52, size: 2, delay: 4.8 },
  { name: 'Mexico City', x: 22, y: 48, size: 3, delay: 5.0 },
  { name: 'New York',   x: 26, y: 36, size: 3, delay: 5.2 },
  { name: 'Los Angeles', x: 17, y: 38, size: 3, delay: 5.4 },
  { name: 'Sydney',     x: 85, y: 70, size: 3, delay: 5.6 },
];

interface FootballGlobeProps {
  onComplete: () => void;
}

export function FootballGlobe({ onComplete }: FootballGlobeProps) {
  const [showNarration, setShowNarration] = useState(false);
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    // After all cities have appeared (~6s), show narration
    const t1 = setTimeout(() => setShowNarration(true), 6500);
    // Auto-advance after narration (12s total)
    const t2 = setTimeout(() => handleProceed(), 14000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleProceed = () => {
    if (zooming) return;
    setZooming(true);
    setTimeout(() => onComplete(), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-max overflow-hidden bg-black flex items-center justify-center cursor-pointer"
      onClick={handleProceed}
    >
      {/* Deep space background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 80%)',
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() < 0.8 ? 1 : 2,
              height: Math.random() < 0.8 ? 1 : 2,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* The Globe */}
      <motion.div
        className="relative"
        style={{ width: 'min(90vw, 600px)', aspectRatio: '2 / 1' }}
        animate={zooming ? { scale: 2.5, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Earth base — dark sphere with subtle blue glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 40% 40%, #0d1b2a 0%, #050a12 60%, #000 100%)',
            boxShadow: '0 0 80px rgba(30, 60, 100, 0.3), inset -20px -20px 60px rgba(0,0,0,0.8)',
            borderRadius: '50%',
          }}
        />

        {/* Continent outlines (simplified — just suggestive shapes) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          {/* Stylized continent shapes */}
          <g fill="rgba(40, 60, 90, 0.5)" stroke="rgba(60, 90, 130, 0.3)" strokeWidth="0.2">
            {/* Europe + Africa */}
            <path d="M 44 18 Q 46 16 48 18 L 50 22 Q 52 28 50 35 L 48 40 Q 46 42 44 38 L 43 30 Q 42 24 44 18 Z" />
            {/* North America */}
            <path d="M 18 20 Q 22 18 26 20 L 28 26 Q 26 30 22 30 L 18 28 Q 16 24 18 20 Z" />
            {/* South America */}
            <path d="M 30 32 Q 33 30 35 34 L 36 42 Q 34 46 32 44 L 30 38 Z" />
            {/* Asia */}
            <path d="M 55 18 Q 65 16 75 20 L 82 24 Q 80 28 75 28 L 65 26 Q 58 24 55 22 Z" />
            {/* Australia */}
            <path d="M 80 38 Q 85 36 88 40 L 86 44 Q 82 44 80 42 Z" />
          </g>
        </svg>

        {/* City lights — fade in one by one */}
        {FOOTBALL_CITIES.map((city) => (
          <motion.div
            key={city.name}
            className="absolute"
            style={{
              left: `${city.x}%`,
              top: `${city.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: city.delay, duration: 0.4, ease: 'easeOut' }}
          >
            {/* Glow halo */}
            <div
              className="absolute rounded-full"
              style={{
                width: city.size * 4,
                height: city.size * 4,
                left: -city.size * 1.5,
                top: -city.size * 1.5,
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            {/* The light itself */}
            <div
              className="rounded-full bg-gold-200"
              style={{
                width: city.size,
                height: city.size,
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
              }}
            />
            {/* City name label (appears on hover-like delay) */}
            <motion.span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gold-200/70 whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: city.delay + 0.5, duration: 0.6 }}
            >
              {city.name}
            </motion.span>
          </motion.div>
        ))}

        {/* Subtle rotation shimmer */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Narration text */}
      <AnimatePresence>
        {showNarration && !zooming && (
          <motion.div
            className="absolute bottom-[15vh] left-0 right-0 text-center px-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-tertiary-c text-sm sm:text-base font-display font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
              Millions of supporters. Thousands of clubs.{' '}
              <span className="text-gold-300 font-semibold">One living football universe.</span>
            </p>
            <p className="text-quaternary-c text-xs sm:text-sm mt-3 font-mono tracking-widest uppercase">
              Your story begins now
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to continue hint */}
      <AnimatePresence>
        {showNarration && !zooming && (
          <motion.div
            className="absolute bottom-6 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <motion.p
              className="text-quaternary-c text-[10px] font-mono tracking-widest uppercase"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Tap to continue
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
