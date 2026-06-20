import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 * Combines clsx (conditional) + tailwind-merge (last-wins for conflicts).
 *
 * @example cn('px-2 py-1', isActive && 'bg-gold-300', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (default: USD).
 * Compact for values >= 1 million.
 */
export function formatCurrency(value: number, currency = 'USD', compact = true): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get a Tailwind class for a rating value (gold/green/yellow/red).
 */
export function ratingColor(rating: number): string {
  if (rating >= 88) return 'rating-badge-gold';
  if (rating >= 80) return 'rating-badge-green';
  if (rating >= 70) return 'rating-badge-yellow';
  return 'rating-badge-red';
}

/**
 * Get a Tailwind text color class for a stat delta (positive/negative/neutral).
 */
export function deltaColor(delta: number): string {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-danger';
  return 'text-secondary-c';
}

/**
 * Format a delta with a + or - sign.
 */
export function formatDelta(delta: number, suffix = ''): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '' : '';
  return `${sign}${delta}${suffix}`;
}

/**
 * Sleep for ms milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate a simple unique id.
 */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}
