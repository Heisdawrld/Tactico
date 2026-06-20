'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * AnimatedBackground — the cinematic $10B-grade background layer.
 *
 * Layers (back to front):
 *   1. Deep gradient base (surface-base → surface-1)
 *   2. Animated gold glow orbs (slow drift, blurred)
 *   3. Blurred football trails (ball silhouettes moving diagonally)
 *   4. Floating gold particles (subtle twinkle)
 *   5. Subtle pitch-line grid (very faint, evokes a football pitch)
 *
 * Pointer-events: none on all layers (clicks pass through to UI).
 * Performance: uses CSS transforms (GPU-accelerated), limited particle count.
 *
 * Mount once in the AppShell — every page inherits the atmosphere.
 */

interface AnimatedBackgroundProps {
  /** Number of blurred football trails (default 4) */
  ballCount?: number;
  /** Number of gold particles (default 20) */
  particleCount?: number;
  /** Intensity of glow orbs (default 0.08) */
  glowIntensity?: number;
  /** Show the faint pitch grid (default true) */
  showPitchGrid?: boolean;
  /** Variant: 'default' | 'matchday' (more intense) */
  variant?: 'default' | 'matchday';
}

export function AnimatedBackground({
  ballCount = 4,
  particleCount = 20,
  glowIntensity = 0.08,
  showPitchGrid = true,
  variant = 'default',
}: AnimatedBackgroundProps) {
  // Pre-generate random values once (don't re-randomize on re-render)
  const balls = useMemo(
    () =>
      Array.from({ length: ballCount }, (_, i) => ({
        id: i,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        endX: Math.random() * 100,
        endY: Math.random() * 100,
        size: 40 + Math.random() * 60,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 10,
        opacity: 0.04 + Math.random() * 0.06,
      })),
    [ballCount]
  );

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 5,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    [particleCount]
  );

  const orbs = useMemo(
    () => [
      { size: 600, top: '-10%', right: '-5%', duration: 25, delay: 0 },
      { size: 500, bottom: '-10%', left: '-5%', duration: 30, delay: 5 },
      ...(variant === 'matchday'
        ? [{ size: 400, top: '40%', left: '30%', duration: 20, delay: 2 }]
        : []),
    ],
    [variant]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Layer 1: Deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(255, 215, 0, 0.03) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 80% 100%, rgba(255, 215, 0, 0.02) 0%, transparent 50%), ' +
            'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-base) 100%)',
        }}
      />

      {/* Layer 2: Animated gold glow orbs (slow drift) */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            bottom: orb.bottom,
            left: orb.left,
            right: orb.right,
            background: `radial-gradient(circle, rgba(255, 215, 0, ${glowIntensity}) 0%, transparent 60%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Layer 3: Blurred football trails (diagonal movement) */}
      {balls.map((ball) => (
        <motion.div
          key={`ball-${ball.id}`}
          className="absolute rounded-full"
          style={{
            width: ball.size,
            height: ball.size,
            left: `${ball.startX}%`,
            top: `${ball.startY}%`,
            background:
              'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0.1) 40%, transparent 70%)',
            filter: 'blur(8px)',
            opacity: ball.opacity,
          }}
          animate={{
            left: [`${ball.startX}%`, `${ball.endX}%`, `${ball.startX}%`],
            top: [`${ball.startY}%`, `${ball.endY}%`, `${ball.startY}%`],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: ball.duration,
            delay: ball.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Layer 4: Floating gold particles (subtle twinkle) */}
      {particles.map((p) => (
        <motion.span
          key={`particle-${p.id}`}
          className="absolute rounded-full bg-gold-300"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 4px rgba(255, 215, 0, 0.6)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Layer 5: Faint pitch grid (evokes a football pitch from above) */}
      {showPitchGrid && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 215, 0, 0.5) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255, 215, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Layer 6: Matchday variant — pulsing center field glow */}
      {variant === 'matchday' && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '80vw',
            height: '80vh',
            background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.04) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.05, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Layer 7: Vignette (darkens edges for focus) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(5, 5, 7, 0.4) 100%)',
        }}
      />
    </div>
  );
}
