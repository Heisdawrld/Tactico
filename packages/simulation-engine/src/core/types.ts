// TACTICO Simulation Engine - Core Types

// ============================================
// BASE TYPES
// ============================================

/** Unique identifier for entities */
export type EntityId = number | string;

/** Timestamp in ISO format */
export type Timestamp = string;

/** Coordinates on the pitch (0-1) */
export interface Coordinates {
  x: number;
  y: number;
}

/** Vector for physics */
export interface Vector {
  x: number;
  y: number;
}

// ============================================
// MATCH TYPES
// ============================================

/** Match status */
export type MatchStatus = 
  | 'scheduled'
  | 'pre_match'
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'extra_time'
  | 'penalties'
  | 'completed'
  | 'abandoned';

/** Match weather conditions */
export type WeatherCondition = 
  | 'clear'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'windy'
  | 'fog';

/** Match venue */
export interface MatchVenue {
  id: EntityId;
  name: string;
  capacity: number;
  city: string;
  country: string;
  pitchCondition: 'good' | 'average' | 'poor';
}

/** Match official */
export interface MatchOfficial {
  id: EntityId;
  name: string;
  role: 'referee' | 'assistant_referee' | 'fourth_official';
  reputation: number; // 1-100
  strictness: number; // 1-100 (higher = more cards)
}

// ============================================
// TEAM TYPES
// ============================================

/** Team formation */
export type Formation = 
  | '4-4-2'
  | '4-3-3'
  | '3-5-2'
  | '4-2-3-1'
  | '5-3-2'
  | '3-4-3'
  | '4-1-4-1'
  | '5-4-1';

/** Team formation with player positions */
export interface TeamFormation {
  formation: Formation;
  positions: FormationPosition[];
}

/** Position in formation */
export interface FormationPosition {
  id: EntityId;
  role: PlayerRole;
  x: number; // 0-1
  y: number; // 0-1
  instructions?: PlayerInstructions;
}

/** Player role in formation */
export type PlayerRole = 
  | 'GK'
  | 'SW'  // Sweeper Keeper
  | 'CB'
  | 'RCB'
  | 'LCB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'LB'
  | 'CDM'
  | 'LDM'
  | 'RDM'
  | 'CM'
  | 'LCM'
  | 'RCM'
  | 'CAM'
  | 'AMC'
  | 'AMR'
  | 'AML'
  | 'RW'
  | 'LW'
  | 'CF'
  | 'ST'
  | 'LS'
  | 'RS';

/** Player instructions within a formation */
export interface PlayerInstructions {
  marking?: 'man' | 'zonal' | 'ball';
  pressingIntensity?: 'low' | 'medium' | 'high';
  creativeFreedom?: 'low' | 'medium' | 'high';
  stayBack?: boolean;
  getForward?: boolean;
  roamFromPosition?: boolean;
}

/** Team instructions */
export interface TeamInstructions {
  formation: Formation;
  pressingIntensity: 'low' | 'medium' | 'high' | 'very_high';
  pressingTrigger: 'standard' | 'aggressive' | 'extreme';
  defensiveLine: 'low' | 'medium' | 'high' | 'very_high';
  lineOfEngagement: 'standard' | 'higher' | 'much_higher';
  passingStyle: 'short' | 'mixed' | 'direct' | 'long';
  passingDirectness: 'standard' | 'more_direct' | 'extreme';
  tempo: 'slow' | 'standard' | 'high' | 'very_high';
  timeWasting: boolean;
  offsideTrap: boolean;
  counterPress: boolean;
  counterAttack: boolean;
  playForSetPieces: boolean;
  beMoreExpressive: boolean;
  stayOnFeet: boolean;
  tackleHarder: boolean;
}

/** Team tactical style (high-level philosophy) */
export type TacticalStyle = 
  | 'positional_play'
  | 'gegenpress'
  | 'low_block'
  | 'counter_attack'
  | 'direct_play'
  | 'fluid_attack'
  | 'total_football'
  | 'tiki_taka'
  | 'vertical_tiki_taka'
  | 'high_press';

/** Tactical DNA - Core philosophy of a team/manager */
export interface TacticalDNA {
  possession: number; // 0-100
  pressing: number;    // 0-100
  width: number;      // 0-100
  tempo: number;      // 0-100
  creativity: number; // 0-100
  directness: number; // 0-100
  defensiveLine: number; // 0-100
  compactness: number; // 0-100
  style: TacticalStyle;
}

// ============================================
// PLAYER TYPES
// ============================================

/** Player foot preference */
export type FootPreference = 'right' | 'left' | 'both';

/** Player injury status */
export type InjuryStatus = 'fit' | 'injured' | 'suspended' | 'unavailable';

/** Player contract type */
export type ContractType = 'full_time' | 'loan' | 'youth' | 'trial';

/** Player attributes (technical) */
export interface TechnicalAttributes {
  passing: number;        // 0-100
  shooting: number;       // 0-100
  dribbling: number;      // 0-100
  ballControl: number;    // 0-100
  firstTouch: number;     // 0-100
  heading: number;         // 0-100
  crossing: number;        // 0-100
  finishing: number;       // 0-100
  longShots: number;      // 0-100
  setPieces: number;      // 0-100
  penaltyTaking: number;   // 0-100
}

/** Player attributes (physical) */
export interface PhysicalAttributes {
  pace: number;           // 0-100
  acceleration: number;   // 0-100
  agility: number;        // 0-100
  balance: number;        // 0-100
  strength: number;       // 0-100
  stamina: number;        // 0-100
  jumpingReach: number;   // 0-100
  naturalFitness: number; // 0-100 (hidden)
}

/** Player attributes (mental) */
export interface MentalAttributes {
  aggression: number;      // 0-100
  anticipation: number;   // 0-100
  composure: number;      // 0-100
  concentration: number;  // 0-100
  creativity: number;      // 0-100
  decisions: number;      // 0-100
  determination: number;   // 0-100
  flair: number;          // 0-100
  leadership: number;     // 0-100
  offTheBall: number;     // 0-100
  positioning: number;     // 0-100
  teamwork: number;       // 0-100
  vision: number;         // 0-100
  workRate: number;       // 0-100
}

/** Player hidden attributes */
export interface HiddenAttributes {
  professionalism: number;    // 0-100
  consistency: number;       // 0-100
  pressureHandling: number;   // 0-100
  adaptability: number;      // 0-100
  sportsmanship: number;     // 0-100
  injuryProneness: number;   // 0-100 (lower = less injury prone)
  controversy: number;        // 0-100
  loyalty: number;            // 0-100
  ambition: number;          // 0-100
  hiddenPotential: number;   // 0-100 (affects development)
}

/** Player contract details */
export interface PlayerContract {
  type: ContractType;
  startDate: Timestamp;
  expiryDate: Timestamp;
  wage: number; // Weekly wage in USD
  signingBonus: number;
  releaseClause: number | null;
  loanClubId: EntityId | null;
  loanExpiry: Timestamp | null;
}

/** Player injury details */
export interface PlayerInjury {
  type: string; // e.g., 'hamstring', 'ankle', 'knee'
  severity: 'minor' | 'moderate' | 'serious' | 'career_ending';
  durationDays: number;
  startDate: Timestamp;
  recoveryDate: Timestamp;
}

/** Player relationship with another entity */
export interface PlayerRelationship {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'staff';
  relationshipType: 'teammate' | 'rival' | 'mentor' | 'mentee' | 'friend' | 'enemy';
  value: number; // -100 (hate) to +100 (love)
  reason?: string;
}

// ============================================
// EVENT TYPES
// ============================================

/** Base event type */
export interface BaseEvent {
  id: EntityId;
  type: string;
  timestamp: Timestamp;
  matchId: EntityId;
  minute: number;
  second: number;
  description: string;
}

/** Possession event */
export interface PossessionEvent extends BaseEvent {
  type: 'possession';
  playerId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  previousHolder?: EntityId;
}

/** Pass event */
export interface PassEvent extends BaseEvent {
  type: 'pass';
  passerId: EntityId;
  receiverId: EntityId | null;
  teamId: EntityId;
  success: boolean;
  from: Coordinates;
  to: Coordinates;
  passType: 'short' | 'long' | 'through' | 'cross' | 'backheel' | 'header';
  accuracy: number; // 0-100
  completion?: boolean;
}

/** Shot event */
export interface ShotEvent extends BaseEvent {
  type: 'shot';
  shooterId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  shotType: 'first_time' | 'volley' | 'half_volley' | 'header' | 'bicycle_kick' | 'penalty' | 'free_kick';
  target: 'goal' | 'off_target' | 'blocked' | 'saved' | 'post' | 'bar';
  xg: number; // Expected goals (0-1)
  onTarget: boolean;
  goal?: GoalEvent; // If shot resulted in goal
}

/** Goal event */
export interface GoalEvent extends BaseEvent {
  type: 'goal';
  scorerId: EntityId;
  teamId: EntityId;
  assistId?: EntityId;
  assistType?: 'pass' | 'cross' | 'through_ball' | 'rebound' | 'penalty_won';
  coordinates: Coordinates;
  shotType: ShotEvent['shotType'];
  isOwnGoal: boolean;
}

/** Tackle event */
export interface TackleEvent extends BaseEvent {
  type: 'tackle';
  tacklerId: EntityId;
  tacklerTeamId: EntityId;
  tackledId: EntityId;
  tackledTeamId: EntityId;
  success: boolean;
  tackleType: 'slide' | 'standing' | 'block' | 'interception';
  coordinates: Coordinates;
  foul?: FoulEvent;
}

/** Foul event */
export interface FoulEvent extends BaseEvent {
  type: 'foul';
  foulerId: EntityId;
  foulerTeamId: EntityId;
  fouledId: EntityId;
  fouledTeamId: EntityId;
  foulType: 'tackle' | 'push' | 'holding' | 'handball' | 'high_foot' | 'late_tackle' | 'elbow';
  card?: 'yellow' | 'second_yellow' | 'red';
  coordinates: Coordinates;
  inBox: boolean;
}

/** Card event */
export interface CardEvent extends BaseEvent {
  type: 'card';
  playerId: EntityId;
  teamId: EntityId;
  cardType: 'yellow' | 'second_yellow' | 'red';
  reason: string;
  coordinates: Coordinates;
}

/** Substitution event */
export interface SubstitutionEvent extends BaseEvent {
  type: 'substitution';
  teamId: EntityId;
  playerOffId: EntityId;
  playerOnId: EntityId;
  reason: 'tactical' | 'injury' | 'fatigue' | 'red_card' | 'time_wasting';
}

/** Injury event */
export interface InjuryEvent extends BaseEvent {
  type: 'injury';
  playerId: EntityId;
  teamId: EntityId;
  injuryType: string;
  severity: PlayerInjury['severity'];
  durationMinutes: number;
  coordinates: Coordinates;
}

/** Set piece event */
export interface SetPieceEvent extends BaseEvent {
  type: 'set_piece';
  setPieceType: 'corner' | 'free_kick' | 'penalty' | 'throw_in' | 'goal_kick';
  teamId: EntityId;
  takerId: EntityId;
  coordinates: Coordinates;
  outcome?: 'goal' | 'save' | 'miss' | 'cleared' | 'ongoing';
}

/** Match event (union type) */
export type MatchEvent = 
  | PossessionEvent
  | PassEvent
  | ShotEvent
  | GoalEvent
  | TackleEvent
  | FoulEvent
  | CardEvent
  | SubstitutionEvent
  | InjuryEvent
  | SetPieceEvent;

// ============================================
// SIMULATION TYPES
// ============================================

/** Simulation configuration */
export interface SimulationConfig {
  tickRate: number; // ms per tick
  matchSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  detailLevel: 'basic' | 'standard' | 'detailed' | 'full';
  enablePhysics: boolean;
  enableCommentary: boolean;
  enableStats: boolean;
}

/** Simulation state */
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // in seconds
  totalTime: number; // total match duration in seconds
  events: MatchEvent[];
  stats: MatchStats;
}

/** Match statistics */
export interface MatchStats {
  possession: {
    home: number; // percentage
    away: number; // percentage
  };
  shots: {
    home: number;
    away: number;
    onTarget: {
      home: number;
      away: number;
    };
  };
  passes: {
    home: {
      completed: number;
      attempted: number;
      accuracy: number; // percentage
    };
    away: {
      completed: number;
      attempted: number;
      accuracy: number; // percentage
    };
  };
  tackles: {
    home: {
      won: number;
      attempted: number;
      successRate: number; // percentage
    };
    away: {
      won: number;
      attempted: number;
      successRate: number; // percentage
    };
  };
  fouls: {
    home: number;
    away: number;
  };
  cards: {
    home: {
      yellow: number;
      red: number;
    };
    away: {
      yellow: number;
      red: number;
    };
  };
  corners: {
    home: number;
    away: number;
  };
  offsides: {
    home: number;
    away: number;
  };
  xg: {
    home: number;
    away: number;
  };
}

/** Player match statistics */
export interface PlayerMatchStats {
  playerId: EntityId;
  minutesPlayed: number;
  rating: number; // 1-10
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesCompleted: number;
  passesAttempted: number;
  passAccuracy: number; // percentage
  tacklesWon: number;
  tacklesAttempted: number;
  tackleSuccessRate: number; // percentage
  fouls: number;
  foulsSuffered: number;
  yellowCards: number;
  redCards: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  dribblesCompleted: number;
  dribblesAttempted: number;
  dribbleSuccessRate: number; // percentage
  aerialsWon: number;
  aerialsLost: number;
  aerialSuccessRate: number; // percentage
  distanceCovered: number; // in meters
  sprints: number;
  highIntensityActions: number;
}

/** Team match statistics */
export interface TeamMatchStats {
  teamId: EntityId;
  playerStats: PlayerMatchStats[];
  averageRating: number;
  formation: Formation;
  instructions: TeamInstructions;
}

// ============================================
// AI TYPES
// ============================================

/** AI decision type */
export type AIDecisionType = 
  | 'pass'
  | 'shoot'
  | 'dribble'
  | 'cross'
  | 'through_ball'
  | 'hold_up_play'
  | 'tackle'
  | 'intercept'
  | 'clear'
  | 'mark'
  | 'press'
  | 'drop_off'
  | 'run_with_ball'
  | 'layoff'
  | 'flick_on';

/** AI decision */
export interface AIDecision {
  type: AIDecisionType;
  playerId: EntityId;
  teamId: EntityId;
  confidence: number; // 0-100
  target?: EntityId | Coordinates; // Target player or coordinates
  power?: number; // 0-100
  accuracy?: number; // 0-100
  timestamp: number; // simulation time in ms
}

/** AI player state */
export interface AIPlayerState {
  playerId: EntityId;
  teamId: EntityId;
  position: PlayerRole;
  currentAction: AIDecisionType | null;
  stamina: number; // 0-100
  morale: number; // 0-100
  confidence: number; // 0-100
  fatigue: number; // 0-100
  sharpness: number; // 0-100
  hasBall: boolean;
  inPossession: boolean;
  marking: EntityId | null; // Player being marked
  pressing: boolean;
  offsidePosition: Coordinates | null;
}

/** AI team state */
export interface AITeamState {
  teamId: EntityId;
  formation: Formation;
  instructions: TeamInstructions;
  tacticalDNA: TacticalDNA;
  playerStates: AIPlayerState[];
  inPossession: boolean;
  pressingIntensity: number; // 0-100
  defensiveShape: 'compact' | 'spread' | 'asymmetric';
  attackingShape: 'narrow' | 'wide' | 'overload_left' | 'overload_right';
}

// ============================================
// WORLD ENGINE TYPES
// ============================================

/** World tick type */
export type WorldTickType = 'minute' | 'hour' | 'day' | 'week' | 'month';

/** World state */
export interface WorldState {
  id: EntityId;
  currentDate: Timestamp;
  currentSeason: number;
  currentWeek: number;
  currentDay: number;
  transferWindowOpen: boolean;
  lastTick: Timestamp;
  lastTickType: WorldTickType;
}

/** World update result */
export interface WorldUpdateResult {
  timestamp: Timestamp;
  tickType: WorldTickType;
  changes: {
    players: PlayerUpdate[];
    clubs: ClubUpdate[];
    transfers: TransferUpdate[];
    injuries: InjuryUpdate[];
    contracts: ContractUpdate[];
    finances: FinanceUpdate[];
    youth: YouthUpdate[];
    media: MediaUpdate[];
  };
}

/** Player update from world tick */
export interface PlayerUpdate {
  playerId: EntityId;
  attributeChanges: Partial<TechnicalAttributes & PhysicalAttributes & MentalAttributes>;
  hiddenAttributeChanges?: Partial<HiddenAttributes>;
  newCurrentAbility?: number;
  newPotentialAbility?: number;
  newReputation?: number;
  newMarketValue?: number;
  reason: string;
}

/** Club update from world tick */
export interface ClubUpdate {
  clubId: EntityId;
  reputationChange?: number;
  financialChange?: number;
  facilityUpgrades?: Partial<{
    trainingFacilities: number;
    youthAcademy: number;
    stadium: number;
    medicalCenter: number;
  }>;
  reason: string;
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  EntityId,
  Timestamp,
  Coordinates,
  Vector,
  MatchStatus,
  WeatherCondition,
  Formation,
  PlayerRole,
  FootPreference,
  InjuryStatus,
  ContractType,
  TacticalStyle,
  WorldTickType,
};
