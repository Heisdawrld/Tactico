// Player positions
export const PLAYER_POSITIONS = [
  "GK",
  "CB",
  "RB",
  "LB",
  "CDM",
  "CM",
  "CAM",
  "RW",
  "LW",
  "CF",
  "ST",
] as const;

// Formations
export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "3-5-2",
  "4-2-3-1",
  "5-3-2",
] as const;

// Weather conditions
export const WEATHER_CONDITIONS = [
  "clear",
  "rain",
  "snow",
  "windy",
] as const;

// Match statuses
export const MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
] as const;

// Pressing intensities
export const PRESSING_INTENSITIES = [
  "low",
  "medium",
  "high",
] as const;

// Passing styles
export const PASSING_STYLES = [
  "short",
  "long",
  "mixed",
] as const;

// Defensive line heights
export const DEFENSIVE_LINE_HEIGHTS = [
  "low",
  "medium",
  "high",
] as const;

// Transfer statuses
export const TRANSFER_STATUSES = [
  "pending",
  "completed",
  "rejected",
] as const;

// Event types
export const EVENT_TYPES = [
  "goal",
  "assist",
  "yellow_card",
  "red_card",
  "substitution",
] as const;

// Injury statuses
export const INJURY_STATUSES = [
  "fit",
  "injured",
  "suspended",
] as const;