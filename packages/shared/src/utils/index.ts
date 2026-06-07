/**
 * Shared Utility Functions
 */

import { CURRENCY_SYMBOL } from '../constants';

/**
 * Format currency value
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate contract years remaining
 */
export function getContractYearsRemaining(contractExpiry: Date): number {
  const now = new Date();
  const expiry = new Date(contractExpiry);
  const diffTime = expiry.getTime() - now.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
  return Math.max(0, parseFloat(diffYears.toFixed(2)));
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${timestamp}-${randomPart}` : `${timestamp}-${randomPart}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Weighted random selection
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have the same length');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return new Date(date) > new Date();
}

/**
 * Get days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
