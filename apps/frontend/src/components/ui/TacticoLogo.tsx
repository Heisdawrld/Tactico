'use client';

import { cn } from '@/lib/utils';

/**
 * TacticoLogo — the official Tactico brand mark.
 *
 * Concept: A hexagonal tactical pitch with a football at its center,
 * surrounded by gold formation dots. Represents:
 * - Hexagon = tactical precision + structural integrity
 * - Center football = the game itself
 * - Formation dots = managerial control
 * - Gold gradient = premium quality
 *
 * Designed as crisp SVG — scales from 16px to 512px without artifacts.
 */

interface TacticoLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'mark' | 'wordmark';
  animated?: boolean;
}

export function TacticoLogo({
  size = 64,
  className,
  variant = 'mark',
  animated = false,
}: TacticoLogoProps) {
  if (variant === 'wordmark') {
    return (
      <span
        className={cn('font-headline font-black tracking-tighter gradient-text-premium', className)}
        style={{ fontSize: size }}
      >
        TACTICO
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <TacticoMark size={size} animated={animated} />
        <div className="leading-none">
          <div
            className="font-headline font-black tracking-tighter gradient-text-premium"
            style={{ fontSize: size * 0.5 }}
          >
            TACTICO
          </div>
          <div
            className="text-tertiary-c font-mono uppercase tracking-widest mt-1"
            style={{ fontSize: size * 0.13 }}
          >
            Football Intelligence
          </div>
        </div>
      </div>
    );
  }

  // mark (default)
  return <TacticoMark size={size} animated={animated} className={className} />;
}

function TacticoMark({
  size = 64,
  animated = false,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && 'animate-pulse-glow', className)}
    >
      <defs>
        {/* Gold gradient for the hex frame */}
        <linearGradient id="tactico-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE680" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B0830C" />
        </linearGradient>
        {/* Inner dark gradient */}
        <radialGradient id="tactico-dark" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1A1A24" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>
        {/* Glow filter */}
        <filter id="tactico-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer hexagonal frame — tactical pitch shape */}
      <path
        d="M50 4 L88 25 L88 75 L50 96 L12 75 L12 25 Z"
        stroke="url(#tactico-gold)"
        strokeWidth="3"
        fill="url(#tactico-dark)"
        filter="url(#tactico-glow)"
      />

      {/* Inner hex (slightly smaller, for depth) */}
      <path
        d="M50 12 L80 28 L80 72 L50 88 L20 72 L20 28 Z"
        stroke="url(#tactico-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* Horizontal pitch line (midfield) */}
      <line
        x1="20" y1="50" x2="80" y2="50"
        stroke="url(#tactico-gold)"
        strokeWidth="0.6"
        strokeOpacity="0.5"
      />

      {/* Vertical center line */}
      <line
        x1="50" y1="20" x2="50" y2="80"
        stroke="url(#tactico-gold)"
        strokeWidth="0.4"
        strokeOpacity="0.3"
      />

      {/* Center circle */}
      <circle
        cx="50" cy="50" r="10"
        stroke="url(#tactico-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.6"
        fill="none"
      />

      {/* Formation dots — represents a 4-3-3 tactical formation */}
      {/* Top row (FOR): 3 dots */}
      <circle cx="38" cy="32" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="50" cy="29" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="62" cy="32" r="1.8" fill="url(#tactico-gold)" />

      {/* Middle row (MID): 3 dots */}
      <circle cx="38" cy="48" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="50" cy="45" r="2" fill="url(#tactico-gold)" />
      <circle cx="62" cy="48" r="1.8" fill="url(#tactico-gold)" />

      {/* Bottom row (DEF): 4 dots */}
      <circle cx="30" cy="65" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="43" cy="67" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="57" cy="67" r="1.8" fill="url(#tactico-gold)" />
      <circle cx="70" cy="65" r="1.8" fill="url(#tactico-gold)" />

      {/* Goalkeeper dot at the bottom */}
      <circle cx="50" cy="80" r="2" fill="url(#tactico-gold)" />

      {/* Center football icon — small, nested inside center circle */}
      <g transform="translate(50, 50)">
        <circle r="3.5" fill="url(#tactico-gold)" />
        {/* Football pentagon pattern */}
        <path
          d="M0 -2 L1.5 -0.5 L1 1.5 L-1 1.5 L-1.5 -0.5 Z"
          fill="#0A0A0F"
          stroke="#0A0A0F"
          strokeWidth="0.2"
        />
      </g>
    </svg>
  );
}

/**
 * TacticoLogoLockup — horizontal lockup for headers/footers.
 * Logo mark + wordmark + tagline.
 */
export function TacticoLogoLockup({
  size = 40,
  className,
  showTagline = true,
}: {
  size?: number;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TacticoMark size={size} />
      <div className="leading-none">
        <div
          className="font-headline font-black tracking-tighter gradient-text-premium"
          style={{ fontSize: size * 0.45 }}
        >
          TACTICO
        </div>
        {showTagline && (
          <div
            className="text-tertiary-c font-mono uppercase tracking-widest mt-0.5"
            style={{ fontSize: size * 0.13 }}
          >
            Football Intelligence
          </div>
        )}
      </div>
    </div>
  );
}
