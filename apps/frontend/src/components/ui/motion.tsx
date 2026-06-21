'use client';

import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/* ============================================================
   TACTICO — Cinematic Motion Helpers
   For the "Cinematic Heavy" motion direction.
   ============================================================ */

/**
 * AnimatedCounter — counts up from 0 to `value` when scrolled into view.
 *
 * @example
 * <AnimatedCounter value={2847} format="number" />
 * <AnimatedCounter value={0.847} format="percent" decimals={1} />
 * <AnimatedCounter value={125_000_000} format="currency" />
 */
export function AnimatedCounter({
  value,
  format = 'number',
  decimals = 0,
  duration = 1.2,
  prefix = '',
  suffix = '',
  currency = 'EUR',
  className,
}: {
  value: number;
  format?: 'number' | 'percent' | 'currency';
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  currency?: 'EUR' | 'USD' | 'GBP';
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      let formatted: string;
      if (format === 'percent') {
        formatted = `${latest.toFixed(decimals)}%`;
      } else if (format === 'currency') {
        const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
        const abs = Math.abs(latest);
        if (abs >= 1_000_000) {
          formatted = `${symbol}${(latest / 1_000_000).toFixed(1)}M`;
        } else if (abs >= 1_000) {
          formatted = `${symbol}${(latest / 1_000).toFixed(0)}K`;
        } else {
          formatted = `${symbol}${latest.toFixed(0)}`;
        }
      } else {
        const abs = Math.abs(latest);
        if (abs >= 1_000_000) {
          formatted = `${(latest / 1_000_000).toFixed(1)}M`;
        } else if (abs >= 1_000) {
          formatted = `${(latest / 1_000).toFixed(1)}K`;
        } else {
          formatted = latest.toFixed(decimals);
        }
      }
      setDisplay(formatted);
    });
    return () => unsubscribe();
  }, [spring, format, decimals]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/**
 * PageTransition — wraps page content for a smooth fade-in-up entrance.
 * Use inside the page's main wrapper.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10"
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer — parent that staggers its children's entrance.
 * Children should be <StaggerItem>.
 */
export function StaggerContainer({
  children,
  className,
  stagger = 0.05,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — child of StaggerContainer. Animates up + in.
 */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax — translates the element based on scroll position.
 * Use sparingly — heavy on performance.
 */
export function Parallax({
  children,
  className,
  offset = 50,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = elementCenter - viewportCenter;
      setScrollY(distance * (offset / 1000));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return (
    <div ref={ref} className={className} style={{ transform: `translateY(${scrollY}px)` }}>
      {children}
    </div>
  );
}

/**
 * ShimmerText — gold gradient text that shimmers continuously.
 */
export function ShimmerText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,var(--gold-300),var(--gold-100),var(--gold-400),var(--gold-300))]',
        'bg-[length:200%_100%] animate-gold-shimmer',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * GlowOrb — decorative gold particle/orb background element.
 * Purely decorative, pointer-events: none.
 */
export function GlowOrb({
  size = 400,
  position = 'top-right',
  opacity = 0.15,
}: {
  size?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
}) {
  const positions = {
    'top-left': { top: `-${size * 0.4}px`, left: `-${size * 0.4}px` },
    'top-right': { top: `-${size * 0.4}px`, right: `-${size * 0.4}px` },
    'bottom-left': { bottom: `-${size * 0.4}px`, left: `-${size * 0.4}px` },
    'bottom-right': { bottom: `-${size * 0.4}px`, right: `-${size * 0.4}px` },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        ...positions[position],
        background: `radial-gradient(circle, rgba(255, 215, 0, ${opacity}) 0%, transparent 60%)`,
        filter: 'blur(40px)',
      }}
    />
  );
}

/**
 * FadeInOnView — fades + slides up when scrolled into view.
 */
export function FadeInOnView({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PulseDot — pulsing dot indicator with optional color.
 */
export function PulseDot({
  color = 'gold',
  size = 8,
}: {
  color?: 'gold' | 'success' | 'danger' | 'warning' | 'info';
  size?: number;
}) {
  const colorMap = {
    gold: 'bg-gold-300 shadow-[0_0_8px_var(--gold-glow)]',
    success: 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.7)]',
    danger: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.7)]',
    warning: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.7)]',
    info: 'bg-info shadow-[0_0_8px_rgba(59,130,246,0.7)]',
  };

  return (
    <span
      className={cn('inline-block rounded-full animate-pulse', colorMap[color])}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Skeleton — loading placeholder with shimmer.
 */
export function Skeleton({
  className,
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height }}
    />
  );
}

/**
 * ParticleField — lightweight CSS-based particle background.
 * Renders N gold particles with random positions, sizes, and animation delays.
 * Heavier on CPU than canvas — use sparingly (hero sections only).
 */
export function ParticleField({
  count = 20,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const particles = Array.from({ length: count }, (_, i) => {
    const size = 1 + Math.random() * 3;
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.4,
    };
  });

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gold-300"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * ScaleIn — scales up from 0.94 with a spring bounce on mount.
 */
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn — slides in from a direction.
 */
export function SlideIn({
  children,
  className,
  direction = 'right',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}) {
  const offsets = {
    left: { x: -24, y: 0 },
    right: { x: 24, y: 0 },
    up: { x: 0, y: -24 },
    down: { x: 0, y: 24 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
