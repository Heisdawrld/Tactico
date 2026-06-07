// TACTICO Simulation Engine - Core Constants

// ============================================
// MATCH CONSTANTS
// ============================================

export const MATCH_CONSTANTS = {
  // Match duration (in seconds)
  MATCH_DURATION: 90 * 60,           // 90 minutes
  FIRST_HALF_DURATION: 45 * 60,     // 45 minutes
  SECOND_HALF_DURATION: 45 * 60,    // 45 minutes
  EXTRA_TIME_DURATION: 30 * 60,     // 30 minutes (15 each half)
  PENALTY_SHOOTOUT_DURATION: 10 * 60, // 10 minutes
  
  // Stoppage time (in seconds)
  STOPPAGE_TIME_FIRST_HALF: 2 * 60,  // 2 minutes
  STOPPAGE_TIME_SECOND_HALF: 4 * 60, // 4 minutes
  
  // Pitch dimensions (in game units)
  PITCH_WIDTH: 100,
  PITCH_HEIGHT: 100,
  
  // Pitch zones
  GOAL_AREA_WIDTH: 18.32,  // 18.32 yards
  GOAL_AREA_HEIGHT: 5.5,   // 5.5 yards
  PENALTY_AREA_WIDTH: 44,   // 44 yards
  PENALTY_AREA_HEIGHT: 18,  // 18 yards
  PENALTY_SPOT_DISTANCE: 12, // 12 yards from goal
  
  // Ball constants
  BALL_RADIUS: 0.4,       // In game units
  BALL_MASS: 0.45,        // kg
  BALL_RESTITUTION: 0.8,  // Bounciness
  BALL_FRICTION: 0.01,    // Ground friction
  BALL_AIR_FRICTION: 0.01,
  
  // Player constants
  PLAYER_RADIUS: 0.6,      // In game units
  PLAYER_MASS: 75,         // kg (average)
  PLAYER_RESTITUTION: 0.5,
  PLAYER_FRICTION: 0.1,
  PLAYER_AIR_FRICTION: 0.05,
  
  // Player speeds (units per second)
  PLAYER_WALK_SPEED: 2.5,
  PLAYER_JOG_SPEED: 4.0,
  PLAYER_RUN_SPEED: 5.5,
  PLAYER_SPRINT_SPEED: 7.0,
  
  // Player acceleration (units per second squared)
  PLAYER_ACCELERATION: 0.08,
  PLAYER_DECELERATION: 0.12,
  
  // Stamina constants
  STAMINA_MAX: 100,
  STAMINA_WALK_DRAIN: 0.005,   // per second
  STAMINA_JOG_DRAIN: 0.01,     // per second
  STAMINA_RUN_DRAIN: 0.02,     // per second
  STAMINA_SPRINT_DRAIN: 0.05,  // per second
  STAMINA_RECOVERY: 0.002,    // per second when not moving
  STAMINA_RECOVERY_HALF_TIME: 0.008, // per second at half-time
  STAMINA_RECOVERY_FULL_TIME: 0.015, // per second at full-time
  
  // Fatigue thresholds
  STAMINA_FRESH: 80,
  STAMINA_TIRED: 50,
  STAMINA_EXHAUSTED: 20,
  
  // Action probabilities (base values, modified by attributes)
  PASS_ACCURACY_BASE: 0.85,
  SHOT_ACCURACY_BASE: 0.75,
  TACKLE_SUCCESS_BASE: 0.70,
  INTERCEPTION_SUCCESS_BASE: 0.65,
  HEADING_ACCURACY_BASE: 0.70,
  
  // Goalkeeper constants
  GK_SAVE_RATE_BASE: 0.70,
  GK_REACTION_TIME: 0.3,    // seconds
  GK_DIVE_SPEED: 8.0,
  GK_DIVE_DISTANCE: 4.0,   // in game units
  
  // Decision making constants
  DECISION_TIME_AVERAGE: 0.8, // seconds to make a decision
  DECISION_TIME_MIN: 0.3,
  DECISION_TIME_MAX: 1.5,
  
  // Event probabilities (per minute)
  INJURY_RATE_BASE: 0.02,   // Base injury rate per minute per player
  FOUL_RATE_BASE: 0.05,     // Base foul rate per minute per player
  OFFSIDE_RATE_BASE: 0.03,  // Base offside rate per minute per team
  CORNER_RATE_BASE: 0.04,   // Base corner rate per minute per team
  
  // Card thresholds
  YELLOW_CARD_THRESHOLD: 0.3, // Foul severity threshold for yellow card
  RED_CARD_THRESHOLD: 0.7,   // Foul severity threshold for red card
  SECOND_YELLOW_THRESHOLD: 2, // Number of yellow cards for red
} as const;

// ============================================
// WEATHER EFFECTS
// ============================================

export const WEATHER_EFFECTS: Record<string, {
  name: string;
  description: string;
  ballSpeedModifier: number;      // Multiplier for ball speed
  passAccuracyModifier: number;   // Multiplier for pass accuracy
  shotAccuracyModifier: number;   // Multiplier for shot accuracy
  playerSpeedModifier: number;    // Multiplier for player speed
  staminaDrainModifier: number;    // Multiplier for stamina drain
  injuryRateModifier: number;     // Multiplier for injury rate
  slipChance: number;             // Chance of slipping (0-1)
}> = {
  clear: {
    name: 'Clear',
    description: 'Perfect conditions for football',
    ballSpeedModifier: 1.0,
    passAccuracyModifier: 1.0,
    shotAccuracyModifier: 1.0,
    playerSpeedModifier: 1.0,
    staminaDrainModifier: 1.0,
    injuryRateModifier: 1.0,
    slipChance: 0.0,
  },
  rain: {
    name: 'Rain',
    description: 'Wet pitch, ball moves faster',
    ballSpeedModifier: 1.05,
    passAccuracyModifier: 0.95,
    shotAccuracyModifier: 0.98,
    playerSpeedModifier: 0.98,
    staminaDrainModifier: 1.05,
    injuryRateModifier: 1.0,
    slipChance: 0.02,
  },
  heavy_rain: {
    name: 'Heavy Rain',
    description: 'Very wet pitch, difficult conditions',
    ballSpeedModifier: 1.1,
    passAccuracyModifier: 0.90,
    shotAccuracyModifier: 0.95,
    playerSpeedModifier: 0.95,
    staminaDrainModifier: 1.1,
    injuryRateModifier: 1.05,
    slipChance: 0.05,
  },
  snow: {
    name: 'Snow',
    description: 'Snow on pitch, ball control difficult',
    ballSpeedModifier: 0.95,
    passAccuracyModifier: 0.85,
    shotAccuracyModifier: 0.90,
    playerSpeedModifier: 0.90,
    staminaDrainModifier: 1.2,
    injuryRateModifier: 1.1,
    slipChance: 0.08,
  },
  windy: {
    name: 'Windy',
    description: 'Wind affects ball trajectory',
    ballSpeedModifier: 1.0,
    passAccuracyModifier: 0.90,
    shotAccuracyModifier: 0.85,
    playerSpeedModifier: 1.0,
    staminaDrainModifier: 1.0,
    injuryRateModifier: 1.0,
    slipChance: 0.0,
  },
  fog: {
    name: 'Fog',
    description: 'Reduced visibility',
    ballSpeedModifier: 1.0,
    passAccuracyModifier: 0.85,
    shotAccuracyModifier: 0.85,
    playerSpeedModifier: 1.0,
    staminaDrainModifier: 1.0,
    injuryRateModifier: 1.0,
    slipChance: 0.0,
  },
} as const;

// ============================================
// POSITION MODIFIERS
// ============================================

/** Modifiers for each position affecting AI decisions */
export const POSITION_MODIFIERS: Record<PlayerRole, {
  // Decision weights (0-1, sum should be ~1)
  passWeight: number;
  shootWeight: number;
  dribbleWeight: number;
  crossWeight: number;
  throughBallWeight: number;
  holdUpWeight: number;
  tackleWeight: number;
  interceptWeight: number;
  clearWeight: number;
  
  // Attribute importance (0-1)
  passingImportance: number;
  shootingImportance: number;
  dribblingImportance: number;
  defendingImportance: number;
  physicalImportance: number;
  mentalImportance: number;
  
  // Movement preferences
  stayBack: number;       // 0-1, higher = more defensive
  getForward: number;     // 0-1, higher = more attacking
  roamFromPosition: number; // 0-1, higher = more free-roaming
  
  // Set piece involvement
  cornerTaking: number;   // 0-1
  freeKickTaking: number; // 0-1
  penaltyTaking: number;  // 0-1
  
  // Defensive behavior
  pressingIntensity: number; // 0-1
  markingStyle: 'zonal' | 'man' | 'mixed';
  
  // Stamina usage
  staminaDrainRate: number; // Multiplier
}> = {
  // Goalkeepers
  GK: {
    passWeight: 0.3,
    shootWeight: 0.0,
    dribbleWeight: 0.0,
    crossWeight: 0.0,
    throughBallWeight: 0.0,
    holdUpWeight: 0.0,
    tackleWeight: 0.0,
    interceptWeight: 0.0,
    clearWeight: 0.7,
    passingImportance: 0.3,
    shootingImportance: 0.0,
    dribblingImportance: 0.0,
    defendingImportance: 0.0,
    physicalImportance: 0.2,
    mentalImportance: 0.5,
    stayBack: 1.0,
    getForward: 0.0,
    roamFromPosition: 0.0,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.0,
    markingStyle: 'zonal',
    staminaDrainRate: 0.5,
  },
  SW: {
    passWeight: 0.4,
    shootWeight: 0.0,
    dribbleWeight: 0.1,
    crossWeight: 0.0,
    throughBallWeight: 0.1,
    holdUpWeight: 0.0,
    tackleWeight: 0.0,
    interceptWeight: 0.1,
    clearWeight: 0.3,
    passingImportance: 0.4,
    shootingImportance: 0.0,
    dribblingImportance: 0.1,
    defendingImportance: 0.1,
    physicalImportance: 0.2,
    mentalImportance: 0.2,
    stayBack: 0.8,
    getForward: 0.2,
    roamFromPosition: 0.3,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.1,
    markingStyle: 'zonal',
    staminaDrainRate: 0.6,
  },
  
  // Defenders
  CB: {
    passWeight: 0.4,
    shootWeight: 0.05,
    dribbleWeight: 0.1,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.2,
    interceptWeight: 0.2,
    clearWeight: 0.1,
    passingImportance: 0.3,
    shootingImportance: 0.05,
    dribblingImportance: 0.1,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.9,
    getForward: 0.1,
    roamFromPosition: 0.1,
    cornerTaking: 0.1,
    freeKickTaking: 0.05,
    penaltyTaking: 0.0,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.8,
  },
  RCB: {
    passWeight: 0.4,
    shootWeight: 0.05,
    dribbleWeight: 0.1,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.2,
    interceptWeight: 0.2,
    clearWeight: 0.1,
    passingImportance: 0.3,
    shootingImportance: 0.05,
    dribblingImportance: 0.1,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.9,
    getForward: 0.1,
    roamFromPosition: 0.1,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.8,
  },
  LCB: {
    passWeight: 0.4,
    shootWeight: 0.05,
    dribbleWeight: 0.1,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.2,
    interceptWeight: 0.2,
    clearWeight: 0.1,
    passingImportance: 0.3,
    shootingImportance: 0.05,
    dribblingImportance: 0.1,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.9,
    getForward: 0.1,
    roamFromPosition: 0.1,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.8,
  },
  
  // Full-backs
  RB: {
    passWeight: 0.3,
    shootWeight: 0.1,
    dribbleWeight: 0.2,
    crossWeight: 0.3,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.15,
    interceptWeight: 0.15,
    clearWeight: 0.05,
    passingImportance: 0.25,
    shootingImportance: 0.1,
    dribblingImportance: 0.25,
    defendingImportance: 0.3,
    physicalImportance: 0.25,
    mentalImportance: 0.15,
    stayBack: 0.7,
    getForward: 0.3,
    roamFromPosition: 0.4,
    cornerTaking: 0.3,
    freeKickTaking: 0.1,
    penaltyTaking: 0.0,
    pressingIntensity: 0.4,
    markingStyle: 'man',
    staminaDrainRate: 1.0,
  },
  LB: {
    passWeight: 0.3,
    shootWeight: 0.1,
    dribbleWeight: 0.2,
    crossWeight: 0.3,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.15,
    interceptWeight: 0.15,
    clearWeight: 0.05,
    passingImportance: 0.25,
    shootingImportance: 0.1,
    dribblingImportance: 0.25,
    defendingImportance: 0.3,
    physicalImportance: 0.25,
    mentalImportance: 0.15,
    stayBack: 0.7,
    getForward: 0.3,
    roamFromPosition: 0.4,
    cornerTaking: 0.3,
    freeKickTaking: 0.1,
    penaltyTaking: 0.0,
    pressingIntensity: 0.4,
    markingStyle: 'man',
    staminaDrainRate: 1.0,
  },
  RWB: {
    passWeight: 0.25,
    shootWeight: 0.15,
    dribbleWeight: 0.3,
    crossWeight: 0.2,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.1,
    interceptWeight: 0.1,
    clearWeight: 0.0,
    passingImportance: 0.2,
    shootingImportance: 0.15,
    dribblingImportance: 0.3,
    defendingImportance: 0.2,
    physicalImportance: 0.3,
    mentalImportance: 0.15,
    stayBack: 0.4,
    getForward: 0.6,
    roamFromPosition: 0.6,
    cornerTaking: 0.4,
    freeKickTaking: 0.2,
    penaltyTaking: 0.0,
    pressingIntensity: 0.6,
    markingStyle: 'man',
    staminaDrainRate: 1.2,
  },
  LWB: {
    passWeight: 0.25,
    shootWeight: 0.15,
    dribbleWeight: 0.3,
    crossWeight: 0.2,
    throughBallWeight: 0.05,
    holdUpWeight: 0.0,
    tackleWeight: 0.1,
    interceptWeight: 0.1,
    clearWeight: 0.0,
    passingImportance: 0.2,
    shootingImportance: 0.15,
    dribblingImportance: 0.3,
    defendingImportance: 0.2,
    physicalImportance: 0.3,
    mentalImportance: 0.15,
    stayBack: 0.4,
    getForward: 0.6,
    roamFromPosition: 0.6,
    cornerTaking: 0.4,
    freeKickTaking: 0.2,
    penaltyTaking: 0.0,
    pressingIntensity: 0.6,
    markingStyle: 'man',
    staminaDrainRate: 1.2,
  },
  
  // Defensive Midfielders
  CDM: {
    passWeight: 0.4,
    shootWeight: 0.1,
    dribbleWeight: 0.15,
    crossWeight: 0.0,
    throughBallWeight: 0.1,
    holdUpWeight: 0.1,
    tackleWeight: 0.25,
    interceptWeight: 0.25,
    clearWeight: 0.15,
    passingImportance: 0.35,
    shootingImportance: 0.1,
    dribblingImportance: 0.15,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.8,
    getForward: 0.2,
    roamFromPosition: 0.3,
    cornerTaking: 0.0,
    freeKickTaking: 0.05,
    penaltyTaking: 0.0,
    pressingIntensity: 0.5,
    markingStyle: 'zonal',
    staminaDrainRate: 1.1,
  },
  LDM: {
    passWeight: 0.4,
    shootWeight: 0.1,
    dribbleWeight: 0.15,
    crossWeight: 0.0,
    throughBallWeight: 0.1,
    holdUpWeight: 0.1,
    tackleWeight: 0.25,
    interceptWeight: 0.25,
    clearWeight: 0.15,
    passingImportance: 0.35,
    shootingImportance: 0.1,
    dribblingImportance: 0.15,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.8,
    getForward: 0.2,
    roamFromPosition: 0.2,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.5,
    markingStyle: 'zonal',
    staminaDrainRate: 1.1,
  },
  RDM: {
    passWeight: 0.4,
    shootWeight: 0.1,
    dribbleWeight: 0.15,
    crossWeight: 0.0,
    throughBallWeight: 0.1,
    holdUpWeight: 0.1,
    tackleWeight: 0.25,
    interceptWeight: 0.25,
    clearWeight: 0.15,
    passingImportance: 0.35,
    shootingImportance: 0.1,
    dribblingImportance: 0.15,
    defendingImportance: 0.4,
    physicalImportance: 0.3,
    mentalImportance: 0.2,
    stayBack: 0.8,
    getForward: 0.2,
    roamFromPosition: 0.2,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.0,
    pressingIntensity: 0.5,
    markingStyle: 'zonal',
    staminaDrainRate: 1.1,
  },
  
  // Central Midfielders
  CM: {
    passWeight: 0.45,
    shootWeight: 0.15,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.15,
    holdUpWeight: 0.05,
    tackleWeight: 0.15,
    interceptWeight: 0.15,
    clearWeight: 0.0,
    passingImportance: 0.4,
    shootingImportance: 0.15,
    dribblingImportance: 0.2,
    defendingImportance: 0.2,
    physicalImportance: 0.2,
    mentalImportance: 0.3,
    stayBack: 0.5,
    getForward: 0.5,
    roamFromPosition: 0.5,
    cornerTaking: 0.2,
    freeKickTaking: 0.3,
    penaltyTaking: 0.1,
    pressingIntensity: 0.4,
    markingStyle: 'zonal',
    staminaDrainRate: 1.0,
  },
  LCM: {
    passWeight: 0.45,
    shootWeight: 0.15,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.15,
    holdUpWeight: 0.05,
    tackleWeight: 0.15,
    interceptWeight: 0.15,
    clearWeight: 0.0,
    passingImportance: 0.4,
    shootingImportance: 0.15,
    dribblingImportance: 0.2,
    defendingImportance: 0.2,
    physicalImportance: 0.2,
    mentalImportance: 0.3,
    stayBack: 0.5,
    getForward: 0.5,
    roamFromPosition: 0.5,
    cornerTaking: 0.2,
    freeKickTaking: 0.3,
    penaltyTaking: 0.1,
    pressingIntensity: 0.4,
    markingStyle: 'zonal',
    staminaDrainRate: 1.0,
  },
  RCM: {
    passWeight: 0.45,
    shootWeight: 0.15,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.15,
    holdUpWeight: 0.05,
    tackleWeight: 0.15,
    interceptWeight: 0.15,
    clearWeight: 0.0,
    passingImportance: 0.4,
    shootingImportance: 0.15,
    dribblingImportance: 0.2,
    defendingImportance: 0.2,
    physicalImportance: 0.2,
    mentalImportance: 0.3,
    stayBack: 0.5,
    getForward: 0.5,
    roamFromPosition: 0.5,
    cornerTaking: 0.2,
    freeKickTaking: 0.3,
    penaltyTaking: 0.1,
    pressingIntensity: 0.4,
    markingStyle: 'zonal',
    staminaDrainRate: 1.0,
  },
  
  // Attacking Midfielders
  CAM: {
    passWeight: 0.4,
    shootWeight: 0.3,
    dribbleWeight: 0.25,
    crossWeight: 0.0,
    throughBallWeight: 0.25,
    holdUpWeight: 0.1,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.35,
    shootingImportance: 0.3,
    dribblingImportance: 0.25,
    defendingImportance: 0.05,
    physicalImportance: 0.1,
    mentalImportance: 0.35,
    stayBack: 0.2,
    getForward: 0.8,
    roamFromPosition: 0.7,
    cornerTaking: 0.5,
    freeKickTaking: 0.5,
    penaltyTaking: 0.3,
    pressingIntensity: 0.3,
    markingStyle: 'zonal',
    staminaDrainRate: 0.9,
  },
  AMC: {
    passWeight: 0.4,
    shootWeight: 0.3,
    dribbleWeight: 0.25,
    crossWeight: 0.0,
    throughBallWeight: 0.25,
    holdUpWeight: 0.1,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.35,
    shootingImportance: 0.3,
    dribblingImportance: 0.25,
    defendingImportance: 0.05,
    physicalImportance: 0.1,
    mentalImportance: 0.35,
    stayBack: 0.2,
    getForward: 0.8,
    roamFromPosition: 0.7,
    cornerTaking: 0.5,
    freeKickTaking: 0.5,
    penaltyTaking: 0.3,
    pressingIntensity: 0.3,
    markingStyle: 'zonal',
    staminaDrainRate: 0.9,
  },
  
  // Wingers
  RW: {
    passWeight: 0.3,
    shootWeight: 0.25,
    dribbleWeight: 0.35,
    crossWeight: 0.3,
    throughBallWeight: 0.05,
    holdUpWeight: 0.05,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.25,
    shootingImportance: 0.25,
    dribblingImportance: 0.35,
    defendingImportance: 0.1,
    physicalImportance: 0.2,
    mentalImportance: 0.25,
    stayBack: 0.3,
    getForward: 0.7,
    roamFromPosition: 0.6,
    cornerTaking: 0.4,
    freeKickTaking: 0.2,
    penaltyTaking: 0.1,
    pressingIntensity: 0.4,
    markingStyle: 'man',
    staminaDrainRate: 1.0,
  },
  LW: {
    passWeight: 0.3,
    shootWeight: 0.25,
    dribbleWeight: 0.35,
    crossWeight: 0.3,
    throughBallWeight: 0.05,
    holdUpWeight: 0.05,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.25,
    shootingImportance: 0.25,
    dribblingImportance: 0.35,
    defendingImportance: 0.1,
    physicalImportance: 0.2,
    mentalImportance: 0.25,
    stayBack: 0.3,
    getForward: 0.7,
    roamFromPosition: 0.6,
    cornerTaking: 0.4,
    freeKickTaking: 0.2,
    penaltyTaking: 0.1,
    pressingIntensity: 0.4,
    markingStyle: 'man',
    staminaDrainRate: 1.0,
  },
  AMR: {
    passWeight: 0.35,
    shootWeight: 0.25,
    dribbleWeight: 0.3,
    crossWeight: 0.2,
    throughBallWeight: 0.1,
    holdUpWeight: 0.05,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.3,
    shootingImportance: 0.25,
    dribblingImportance: 0.3,
    defendingImportance: 0.1,
    physicalImportance: 0.15,
    mentalImportance: 0.25,
    stayBack: 0.2,
    getForward: 0.8,
    roamFromPosition: 0.7,
    cornerTaking: 0.4,
    freeKickTaking: 0.3,
    penaltyTaking: 0.2,
    pressingIntensity: 0.3,
    markingStyle: 'zonal',
    staminaDrainRate: 0.9,
  },
  AML: {
    passWeight: 0.35,
    shootWeight: 0.25,
    dribbleWeight: 0.3,
    crossWeight: 0.2,
    throughBallWeight: 0.1,
    holdUpWeight: 0.05,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.3,
    shootingImportance: 0.25,
    dribblingImportance: 0.3,
    defendingImportance: 0.1,
    physicalImportance: 0.15,
    mentalImportance: 0.25,
    stayBack: 0.2,
    getForward: 0.8,
    roamFromPosition: 0.7,
    cornerTaking: 0.4,
    freeKickTaking: 0.3,
    penaltyTaking: 0.2,
    pressingIntensity: 0.3,
    markingStyle: 'zonal',
    staminaDrainRate: 0.9,
  },
  
  // Forwards
  CF: {
    passWeight: 0.35,
    shootWeight: 0.35,
    dribbleWeight: 0.25,
    crossWeight: 0.0,
    throughBallWeight: 0.15,
    holdUpWeight: 0.3,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.3,
    shootingImportance: 0.35,
    dribblingImportance: 0.25,
    defendingImportance: 0.05,
    physicalImportance: 0.2,
    mentalImportance: 0.25,
    stayBack: 0.2,
    getForward: 0.8,
    roamFromPosition: 0.6,
    cornerTaking: 0.1,
    freeKickTaking: 0.2,
    penaltyTaking: 0.4,
    pressingIntensity: 0.3,
    markingStyle: 'zonal',
    staminaDrainRate: 0.8,
  },
  ST: {
    passWeight: 0.25,
    shootWeight: 0.45,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.2,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.2,
    shootingImportance: 0.45,
    dribblingImportance: 0.2,
    defendingImportance: 0.05,
    physicalImportance: 0.2,
    mentalImportance: 0.2,
    stayBack: 0.1,
    getForward: 0.9,
    roamFromPosition: 0.5,
    cornerTaking: 0.0,
    freeKickTaking: 0.1,
    penaltyTaking: 0.5,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.7,
  },
  LS: {
    passWeight: 0.25,
    shootWeight: 0.45,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.2,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.2,
    shootingImportance: 0.45,
    dribblingImportance: 0.2,
    defendingImportance: 0.05,
    physicalImportance: 0.2,
    mentalImportance: 0.2,
    stayBack: 0.1,
    getForward: 0.9,
    roamFromPosition: 0.4,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.4,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.7,
  },
  RS: {
    passWeight: 0.25,
    shootWeight: 0.45,
    dribbleWeight: 0.2,
    crossWeight: 0.0,
    throughBallWeight: 0.05,
    holdUpWeight: 0.2,
    tackleWeight: 0.05,
    interceptWeight: 0.05,
    clearWeight: 0.0,
    passingImportance: 0.2,
    shootingImportance: 0.45,
    dribblingImportance: 0.2,
    defendingImportance: 0.05,
    physicalImportance: 0.2,
    mentalImportance: 0.2,
    stayBack: 0.1,
    getForward: 0.9,
    roamFromPosition: 0.4,
    cornerTaking: 0.0,
    freeKickTaking: 0.0,
    penaltyTaking: 0.4,
    pressingIntensity: 0.2,
    markingStyle: 'zonal',
    staminaDrainRate: 0.7,
  },
} as const;

// ============================================
// TACTICAL STYLE MODIFIERS
// ============================================

export const TACTICAL_STYLE_MODIFIERS: Record<TacticalStyle, {
  possession: number;
  pressing: number;
  width: number;
  tempo: number;
  creativity: number;
  directness: number;
  defensiveLine: number;
  compactness: number;
  description: string;
}> = {
  positional_play: {
    possession: 0.9,
    pressing: 0.3,
    width: 0.4,
    tempo: 0.2,
    creativity: 0.8,
    directness: 0.1,
    defensiveLine: 0.6,
    compactness: 0.7,
    description: 'Short passing, patient build-up, high possession',
  },
  gegenpress: {
    possession: 0.4,
    pressing: 0.9,
    width: 0.5,
    tempo: 0.8,
    creativity: 0.6,
    directness: 0.7,
    defensiveLine: 0.8,
    compactness: 0.5,
    description: 'High pressing, quick transitions, direct play',
  },
  low_block: {
    possession: 0.2,
    pressing: 0.1,
    width: 0.3,
    tempo: 0.1,
    creativity: 0.2,
    directness: 0.8,
    defensiveLine: 0.2,
    compactness: 0.9,
    description: 'Deep defensive line, compact shape, counter-attacking',
  },
  counter_attack: {
    possession: 0.3,
    pressing: 0.2,
    width: 0.6,
    tempo: 0.9,
    creativity: 0.4,
    directness: 0.9,
    defensiveLine: 0.4,
    compactness: 0.6,
    description: 'Fast breaks, direct play, absorb pressure',
  },
  direct_play: {
    possession: 0.2,
    pressing: 0.3,
    width: 0.5,
    tempo: 0.7,
    creativity: 0.3,
    directness: 0.95,
    defensiveLine: 0.5,
    compactness: 0.5,
    description: 'Long passes, aerial duels, physical play',
  },
  fluid_attack: {
    possession: 0.7,
    pressing: 0.5,
    width: 0.7,
    tempo: 0.6,
    creativity: 0.9,
    directness: 0.4,
    defensiveLine: 0.5,
    compactness: 0.4,
    description: 'Positional rotations, creative freedom, attacking full-backs',
  },
  total_football: {
    possession: 0.8,
    pressing: 0.6,
    width: 0.8,
    tempo: 0.7,
    creativity: 0.8,
    directness: 0.3,
    defensiveLine: 0.6,
    compactness: 0.3,
    description: 'Positional interchange, everyone attacks and defends',
  },
  tiki_taka: {
    possession: 0.95,
    pressing: 0.4,
    width: 0.3,
    tempo: 0.3,
    creativity: 0.7,
    directness: 0.05,
    defensiveLine: 0.7,
    compactness: 0.8,
    description: 'Short passing, quick one-twos, patient build-up',
  },
  vertical_tiki_taka: {
    possession: 0.85,
    pressing: 0.6,
    width: 0.4,
    tempo: 0.6,
    creativity: 0.8,
    directness: 0.3,
    defensiveLine: 0.6,
    compactness: 0.6,
    description: 'Short passing with vertical progression, high pressing',
  },
  high_press: {
    possession: 0.5,
    pressing: 0.95,
    width: 0.5,
    tempo: 0.8,
    creativity: 0.5,
    directness: 0.6,
    defensiveLine: 0.9,
    compactness: 0.5,
    description: 'Aggressive pressing, win ball high up pitch',
  },
} as const;

// ============================================
// INJURY CONSTANTS
// ============================================

export const INJURY_CONSTANTS = {
  // Base injury rates (per minute)
  BASE_INJURY_RATE: 0.0002,
  
  // Injury rate modifiers by position
  POSITION_INJURY_MODIFIERS: {
    GK: 0.5,
    CB: 1.0,
    RB: 1.1,
    LB: 1.1,
    CDM: 1.2,
    CM: 1.0,
    CAM: 0.8,
    RW: 1.3,
    LW: 1.3,
    ST: 1.0,
  } as Record<PlayerRole, number>,
  
  // Injury rate modifiers by attribute
  ATTRIBUTE_INJURY_MODIFIERS: {
    strength: -0.002,      // Higher strength = lower injury risk
    stamina: -0.0015,      // Higher stamina = lower injury risk
    agility: -0.001,      // Higher agility = lower injury risk
    balance: -0.001,      // Higher balance = lower injury risk
    injuryProneness: 0.005, // Higher proneness = higher injury risk
  } as Record<string, number>,
  
  // Injury types with probabilities and durations
  INJURY_TYPES: {
    'ankle_sprain': { probability: 0.25, minDays: 7, maxDays: 14 },
    'hamstring_strain': { probability: 0.20, minDays: 14, maxDays: 28 },
    'knee_ligament': { probability: 0.10, minDays: 28, maxDays: 56 },
    'groin_strain': { probability: 0.15, minDays: 10, maxDays: 21 },
    'calf_strain': { probability: 0.10, minDays: 5, maxDays: 10 },
    'quadriceps_strain': { probability: 0.10, minDays: 10, maxDays: 21 },
    'achilles_tendon': { probability: 0.05, minDays: 21, maxDays: 42 },
    'concussion': { probability: 0.03, minDays: 7, maxDays: 14 },
    'broken_bone': { probability: 0.01, minDays: 42, maxDays: 90 },
    'muscle_tear': { probability: 0.01, minDays: 28, maxDays: 84 },
  } as Record<string, { probability: number; minDays: number; maxDays: number }>,
  
  // Severity levels
  SEVERITY_LEVELS: {
    minor: { minDays: 1, maxDays: 7 },
    moderate: { minDays: 8, maxDays: 21 },
    serious: { minDays: 22, maxDays: 56 },
    career_ending: { minDays: 365, maxDays: 730 },
  } as Record<'minor' | 'moderate' | 'serious' | 'career_ending', { minDays: number; maxDays: number }>,
  
  // Recovery modifiers
  RECOVERY_MODIFIERS: {
    youth: 1.2,       // Younger players recover faster
    veteran: 0.8,     // Older players recover slower
    highFitness: 1.3, // Higher natural fitness = faster recovery
    lowFitness: 0.7,  // Lower natural fitness = slower recovery
    goodFacilities: 1.4, // Better medical facilities = faster recovery
    poorFacilities: 0.6, // Worse medical facilities = slower recovery
  } as Record<string, number>,
} as const;

// ============================================
// DEVELOPMENT CONSTANTS
// ============================================

export const DEVELOPMENT_CONSTANTS = {
  // Training effects (attribute points per week)
  TRAINING_EFFECTS: {
    physical: {
      pace: 0.2,
      acceleration: 0.2,
      agility: 0.3,
      balance: 0.2,
      strength: 0.3,
      stamina: 0.4,
      jumpingReach: 0.2,
    },
    technical: {
      passing: 0.4,
      shooting: 0.3,
      dribbling: 0.4,
      ballControl: 0.4,
      firstTouch: 0.3,
      heading: 0.3,
      crossing: 0.3,
      finishing: 0.3,
      longShots: 0.2,
      setPieces: 0.2,
      penaltyTaking: 0.1,
    },
    mental: {
      aggression: 0.2,
      anticipation: 0.3,
      composure: 0.3,
      concentration: 0.3,
      creativity: 0.3,
      decisions: 0.4,
      determination: 0.3,
      flair: 0.1,
      leadership: 0.2,
      offTheBall: 0.3,
      positioning: 0.3,
      teamwork: 0.3,
      vision: 0.3,
      workRate: 0.3,
    },
  } as Record<'physical' | 'technical' | 'mental', Record<string, number>>,
  
  // Training intensity modifiers
  TRAINING_INTENSITY_MODIFIERS: {
    1: 0.5,  // Very light
    2: 0.8,  // Light
    3: 1.0,  // Moderate
    4: 1.2,  // Heavy
    5: 1.5,  // Very heavy
  } as Record<1 | 2 | 3 | 4 | 5, number>,
  
  // Age modifiers for development
  AGE_MODIFIERS: {
    under18: 1.5,   // Rapid development
    under21: 1.3,   // Fast development
    under25: 1.1,   // Good development
    prime: 1.0,     // Peak (25-28)
    declining: 0.8, // Slow decline (29-32)
    veteran: 0.5,   // Rapid decline (33+)
  } as Record<string, number>,
  
  // Potential fulfillment modifiers
  POTENTIAL_MODIFIERS: {
    professionalism: 0.02,    // Higher pro = better development
    consistency: 0.015,      // More consistent = better development
    ambition: 0.015,         // More ambitious = better development
    loyalty: 0.01,           // More loyal = better development
    trainingFacilities: 0.02, // Better facilities = better development
    youthAcademy: 0.015,     // Better academy = better youth development
  } as Record<string, number>,
  
  // Maximum development per attribute per week
  MAX_WEEKLY_DEVELOPMENT: 2.0,
  
  // Minimum development per attribute per week
  MIN_WEEKLY_DEVELOPMENT: 0.0,
} as const;
