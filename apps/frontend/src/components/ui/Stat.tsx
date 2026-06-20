'use client';

import * as React from 'react';
import { cn, ratingColor } from '@/lib/utils';

/**
 * StatBlock — Bloomberg-dense data tile with label, value, and optional delta.
 *
 * @example
 * <StatBlock label="Goals" value={28} delta={+3} />
 * <StatBlock label="Possession" value="62%" tone="gold" />
 */
export function StatBlock({
  label,
  value,
  delta,
  deltaSuffix = '',
  icon,
  tone = 'default',
  size = 'md',
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'gold' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const toneColors = {
    default: 'text-primary-c',
    gold: 'text-gold-300',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  };
  const sizeMap = {
    sm: { value: 'text-base', label: 'text-[9px]' },
    md: { value: 'text-2xl', label: 'text-[10px]' },
    lg: { value: 'text-3xl', label: 'text-xs' },
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-3 rounded-md bg-surface-2/60 border border-white/5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'font-mono uppercase tracking-widest text-tertiary-c font-semibold',
            sizeMap[size].label
          )}
        >
          {label}
        </span>
        {icon && <span className="text-tertiary-c">{icon}</span>}
      </div>
      <div className={cn('font-display font-bold tabular-nums leading-none', sizeMap[size].value, toneColors[tone])}>
        {value}
      </div>
      {delta !== undefined && (
        <div
          className={cn(
            'text-[10px] font-mono font-semibold tabular-nums',
            delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-tertiary-c'
          )}
        >
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '−'} {Math.abs(delta)}
          {deltaSuffix}
        </div>
      )}
    </div>
  );
}

/**
 * RatingBadge — colored rating number (gold/green/yellow/red based on value).
 *
 * @example
 * <RatingBadge rating={91} />
 */
export function RatingBadge({
  rating,
  size = 'md',
  className,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-mono font-bold tabular-nums',
        ratingColor(rating),
        sizes[size],
        className
      )}
    >
      {rating}
    </span>
  );
}

/**
 * ProgressBar — animated gold progress bar.
 */
export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  tone = 'gold',
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  tone?: 'gold' | 'success' | 'danger' | 'warning';
}) {
  const percent = Math.min(100, (value / max) * 100);
  const toneGradient = {
    gold: 'from-gold-200 to-gold-500',
    success: 'from-emerald-400 to-emerald-600',
    danger: 'from-red-400 to-red-600',
    warning: 'from-amber-400 to-amber-600',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-premium', toneGradient[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono tabular-nums text-tertiary-c w-9 text-right">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

/**
 * Sparkline — tiny inline chart (no labels, just the shape).
 * Uses pure SVG for performance.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  tone = 'gold',
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: 'gold' | 'success' | 'danger';
  className?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const colors = {
    gold: 'var(--gold-300)',
    success: 'var(--success)',
    danger: 'var(--danger)',
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={colors[tone]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
