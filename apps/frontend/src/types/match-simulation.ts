// Match simulation types

// Match state
export interface MatchState {
  homeClubId: number;
  awayClubId: number;
  homeScore: number;
  awayScore: number;
  time: number; // in seconds
  isPlaying: boolean;
  isPaused: boolean;
  isHalfTime: boolean;
  isFullTime: boolean;
  possession: "home" | "away" | "none";
  lastTouch: "home" | "away";
  matchEvents: MatchEvent[];
  stats: MatchStats;
}

// Match event
export interface MatchEvent {
  id: number;
  type: "goal" | "assist" | "shot" | "save" | "foul" | "yellow_card" | "red_card" | "corner" | "offside" | "substitution" | "injury";
  time: number; // in seconds
  playerId: number;
  playerName: string;
  clubId: number;
  description: string;
  x?: number; // x position on pitch (0-1)
  y?: number; // y position on pitch (0-1)
}

// Match stats
export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
  total: {
    shots: number;
    shotsOnTarget: number;
    possession: number;
    fouls: number;
    corners: number;
    offsides: number;
  };
}

export interface TeamStats {
  shots: number;
  shotsOnTarget: number;
  possession: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  corners: number;
  offsides: number;
  passesCompleted: number;
  passesAttempted: number;
  passAccuracy: number;
}

// Player match stats
export interface PlayerMatchStats {
  playerId: number;
  rating: number; // 1-10
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesCompleted: number;
  passesAttempted: number;
  tackles: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  distanceCovered: number; // in meters
  minutesPlayed: number;
}

// Ball state
export interface BallState {
  x: number; // 0-1
  y: number; // 0-1
  vx: number; // velocity x
  vy: number; // velocity y
  inPlay: boolean;
  lastTouchedBy: number | null; // playerId
}

// Player state during match
export interface PlayerMatchState {
  id: number;
  x: number; // 0-1
  y: number; // 0-1
  vx: number; // velocity x
  vy: number; // velocity y
  stamina: number; // 0-100
  hasBall: boolean;
  isTackling: boolean;
  isSprinting: boolean;
  isInjured: boolean;
  isBooked: boolean; // yellow card
  isSentOff: boolean; // red card
  minutesPlayed: number;
}

// Match settings (from tactics)
export interface MatchSettings {
  homeFormation: string;
  awayFormation: string;
  homeTactics: {
    pressingIntensity: string;
    passingStyle: string;
    defensiveLine: string;
    tempo: string;
    timewasting: boolean;
  };
  awayTactics: {
    pressingIntensity: string;
    passingStyle: string;
    defensiveLine: string;
    tempo: string;
    timewasting: boolean;
  };
  weather: string;
}

// Match result summary
export interface MatchResult {
  homeScore: number;
  awayScore: number;
  winner: "home" | "away" | "draw";
  manOfTheMatch: number | null;
  homePlayerStats: PlayerMatchStats[];
  awayPlayerStats: PlayerMatchStats[];
  matchStats: MatchStats;
  keyMoments: MatchEvent[];
}

// AI decision types
export type AIDecisionType = 
  | "pass"
  | "shoot"
  | "dribble"
  | "tackle"
  | "intercept"
  | "clear"
  | "cross"
  | "header"
  | "save";

// AI decision
export interface AIDecision {
  type: AIDecisionType;
  playerId: number;
  targetX?: number;
  targetY?: number;
  targetPlayerId?: number;
  power: number; // 0-100
  accuracy: number; // 0-100
}

// Match simulation constants
export const MATCH_CONSTANTS = {
  MATCH_DURATION: 90 * 60, // 90 minutes in seconds
  HALF_TIME: 45 * 60, // 45 minutes in seconds
  PITCH_WIDTH: 1,
  PITCH_HEIGHT: 1,
  PLAYER_RADIUS: 0.02,
  BALL_RADIUS: 0.01,
  PLAYER_SPEED: 0.002, // units per second
  PLAYER_SPRINT_SPEED: 0.004,
  BALL_SPEED: 0.006,
  PASS_ACCURACY_BASE: 0.85,
  SHOT_ACCURACY_BASE: 0.75,
  GOALKEEPER_SAVE_RATE: 0.7,
  FOUL_RATE: 0.1,
  INJURY_RATE: 0.01,
  STAMINA_DRAIN_RATE: 0.01, // per second
  STAMINA_SPRINT_DRAIN: 0.03, // per second
  STAMINA_RECOVERY: 0.005, // per second when not sprinting
};

// Weather effects on match
export const WEATHER_EFFECTS: Record<string, {
  passAccuracy: number;
  shotAccuracy: number;
  playerSpeed: number;
  ballSpeed: number;
}> = {
  clear: { passAccuracy: 0, shotAccuracy: 0, playerSpeed: 0, ballSpeed: 0 },
  rain: { passAccuracy: -0.1, shotAccuracy: -0.05, playerSpeed: -0.001, ballSpeed: -0.001 },
  snow: { passAccuracy: -0.15, shotAccuracy: -0.1, playerSpeed: -0.002, ballSpeed: -0.002 },
  windy: { passAccuracy: -0.05, shotAccuracy: 0, playerSpeed: 0, ballSpeed: 0.001 },
};

// Tactical style modifiers
export const TACTIC_MODIFIERS: Record<string, {
  pressing: number;
  passing: number;
  tempo: number;
  creativity: number;
}> = {
  // Pressing intensities
  low_pressing: { pressing: -0.3, passing: 0.1, tempo: -0.2, creativity: 0.1 },
  medium_pressing: { pressing: 0, passing: 0, tempo: 0, creativity: 0 },
  high_pressing: { pressing: 0.3, passing: -0.1, tempo: 0.2, creativity: -0.1 },
  
  // Passing styles
  short_passing: { pressing: 0, passing: 0.2, tempo: -0.1, creativity: 0.1 },
  mixed_passing: { pressing: 0, passing: 0, tempo: 0, creativity: 0 },
  long_passing: { pressing: 0, passing: -0.2, tempo: 0.1, creativity: -0.1 },
  
  // Defensive lines
  low_defensive_line: { pressing: -0.2, passing: 0.1, tempo: -0.1, creativity: 0.1 },
  medium_defensive_line: { pressing: 0, passing: 0, tempo: 0, creativity: 0 },
  high_defensive_line: { pressing: 0.2, passing: -0.1, tempo: 0.1, creativity: -0.1 },
  
  // Tempos
  slow_tempo: { pressing: -0.1, passing: 0.2, tempo: -0.2, creativity: 0.2 },
  normal_tempo: { pressing: 0, passing: 0, tempo: 0, creativity: 0 },
  fast_tempo: { pressing: 0.1, passing: -0.2, tempo: 0.2, creativity: -0.2 },
};

// Player position modifiers for AI decisions
export const POSITION_MODIFIERS: Record<string, {
  passFrequency: number;
  shootFrequency: number;
  dribbleFrequency: number;
  defensiveWork: number;
  offensiveWork: number;
}> = {
  GK: { passFrequency: 0.3, shootFrequency: 0.0, dribbleFrequency: 0.0, defensiveWork: 0.0, offensiveWork: 0.0 },
  CB: { passFrequency: 0.4, shootFrequency: 0.05, dribbleFrequency: 0.1, defensiveWork: 0.9, offensiveWork: 0.3 },
  RB: { passFrequency: 0.5, shootFrequency: 0.1, dribbleFrequency: 0.3, defensiveWork: 0.8, offensiveWork: 0.7 },
  LB: { passFrequency: 0.5, shootFrequency: 0.1, dribbleFrequency: 0.3, defensiveWork: 0.8, offensiveWork: 0.7 },
  CDM: { passFrequency: 0.7, shootFrequency: 0.15, dribbleFrequency: 0.2, defensiveWork: 0.85, offensiveWork: 0.4 },
  CM: { passFrequency: 0.8, shootFrequency: 0.2, dribbleFrequency: 0.3, defensiveWork: 0.6, offensiveWork: 0.6 },
  CAM: { passFrequency: 0.85, shootFrequency: 0.3, dribbleFrequency: 0.4, defensiveWork: 0.3, offensiveWork: 0.8 },
  RW: { passFrequency: 0.6, shootFrequency: 0.3, dribbleFrequency: 0.5, defensiveWork: 0.4, offensiveWork: 0.8 },
  LW: { passFrequency: 0.6, shootFrequency: 0.3, dribbleFrequency: 0.5, defensiveWork: 0.4, offensiveWork: 0.8 },
  CF: { passFrequency: 0.7, shootFrequency: 0.4, dribbleFrequency: 0.4, defensiveWork: 0.2, offensiveWork: 0.9 },
  ST: { passFrequency: 0.5, shootFrequency: 0.5, dribbleFrequency: 0.3, defensiveWork: 0.1, offensiveWork: 0.95 },
};
