/**
 * Shared Constants for Tactico
 */

// Football Positions
export const POSITIONS = {
  GK: 'GK',
  CB: 'CB',
  RB: 'RB',
  LB: 'LB',
  CDM: 'CDM',
  CM: 'CM',
  CAM: 'CAM',
  RW: 'RW',
  LW: 'LW',
  ST: 'ST',
} as const;

export type Position = typeof POSITIONS[keyof typeof POSITIONS];

// Player Attributes Categories
export const ATTRIBUTE_CATEGORIES = {
  TECHNICAL: ['crossing', 'dribbling', 'finishing', 'firstTouch', 'freeKickTaking', 'heading', 'longShots', 'longThrows', 'marking', 'passing', 'penaltyTaking', 'tackling', 'technique'],
  PHYSICAL: ['acceleration', 'agility', 'balance', 'jumpingReach', 'naturalFitness', 'pace', 'stamina', 'strength'],
  MENTAL: ['aggression', 'anticipation', 'bravery', 'composure', 'concentration', 'decisions', 'determination', 'flair', 'leadership', 'offTheBall', 'positioning', 'teamwork', 'vision', 'workRate'],
  HIDDEN: ['professionalism', 'consistency', 'pressureHandling', 'adaptability', 'sportsmanship', 'injuryProneness', 'controversy', 'loyalty', 'ambition'],
} as const;

// Tactical Styles
export const TACTICAL_STYLES = {
  POSITIONAL_PLAY: 'Positional Play',
  GEGENPRESS: 'Gegenpress',
  LOW_BLOCK: 'Low Block',
  COUNTER_ATTACK: 'Counter Attack',
  DIRECT_PLAY: 'Direct Play',
  FLUID_ATTACK: 'Fluid Attack',
  TOTAL_FOOTBALL: 'Total Football',
} as const;

export type TacticalStyle = typeof TACTICAL_STYLES[keyof typeof TACTICAL_STYLES];

// Transfer Window Types
export const TRANSFER_WINDOWS = {
  SUMMER: 'SUMMER',
  WINTER: 'WINTER',
  CLOSED: 'CLOSED',
} as const;

export type TransferWindow = typeof TRANSFER_WINDOWS[keyof typeof TRANSFER_WINDOWS];

// Additional constants from apps/shared
export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "3-5-2",
  "4-2-3-1",
  "5-3-2",
] as const;

export type Formation = typeof FORMATIONS[number];

export const WEATHER_CONDITIONS = [
  "clear",
  "rain",
  "snow",
  "windy",
] as const;

export type Weather = typeof WEATHER_CONDITIONS[number];

export const MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
] as const;

export type MatchStatus = typeof MATCH_STATUSES[number];

export const PRESSING_INTENSITIES = [
  "low",
  "medium",
  "high",
] as const;

export const PASSING_STYLES = [
  "short",
  "long",
  "mixed",
] as const;

// Contract Status
export const CONTRACT_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRING: 'EXPIRING',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const;

// Match Status
export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  HALFTIME: 'HALFTIME',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
} as const;

// Currency formatting
export const CURRENCY_SYMBOL = '€';

// Default values
export const DEFAULT_VALUES = {
  PLAYER_AGE_MIN: 16,
  PLAYER_AGE_MAX: 40,
  PLAYER_PEAK_AGE: 27,
  CONTRACT_MIN_YEARS: 1,
  CONTRACT_MAX_YEARS: 5,
  TRANSFER_WINDOW_DAYS: 30,
  OFFER_EXPIRY_DAYS: 7,
  AGENT_FEE_PERCENTAGE: 5,
} as const;

// Formation presets
export const FORMATIONS = {
  '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
  '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW'],
  '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'RW', 'LW', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'LWB', 'ST', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW'],
  '4-1-4-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'RM', 'CM', 'CM', 'LM', 'ST'],
} as const;

export type Formation = keyof typeof FORMATIONS;
