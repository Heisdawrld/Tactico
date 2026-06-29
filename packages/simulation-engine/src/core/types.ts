// TACTICO Simulation Engine - Core Types (Updated for Intelligent Engine)

// ============================================
// BASE TYPES
// ============================================

export type EntityId = number | string;
export type Timestamp = string;

export interface Coordinates {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

// ============================================
// MATCH TYPES
// ============================================

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

export type WeatherCondition =
  | 'clear'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'windy'
  | 'fog';

export interface MatchVenue {
  id: EntityId;
  name: string;
  capacity: number;
  city: string;
  country: string;
  pitchCondition: 'good' | 'average' | 'poor';
}

export interface MatchOfficial {
  id: EntityId;
  name: string;
  role: 'referee' | 'assistant_referee' | 'fourth_official';
  reputation: number;
  strictness: number;
}

// ============================================
// TEAM TYPES
// ============================================

export type Formation =
  | '4-4-2'
  | '4-3-3'
  | '3-5-2'
  | '4-2-3-1'
  | '5-3-2'
  | '3-4-3'
  | '4-1-4-1'
  | '5-4-1';

export interface TeamFormation {
  formation: Formation;
  positions: FormationPosition[];
}

export interface FormationPosition {
  id: EntityId;
  role: PlayerRole;
  x: number;
  y: number;
  instructions?: PlayerInstructions;
}

export type PlayerRole =
  | 'GK'
  | 'SW'
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

export interface PlayerInstructions {
  marking?: 'man' | 'zonal' | 'ball';
  pressingIntensity?: 'low' | 'medium' | 'high';
  creativeFreedom?: 'low' | 'medium' | 'high';
  stayBack?: boolean;
  getForward?: boolean;
  roamFromPosition?: boolean;
}

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

export interface TacticalDNA {
  possession: number;
  pressing: number;
  width: number;
  tempo: number;
  creativity: number;
  directness: number;
  defensiveLine: number;
  compactness: number;
  style: TacticalStyle;
}

// ============================================
// PLAYER TYPES
// ============================================

export type FootPreference = 'right' | 'left' | 'both';
export type InjuryStatus = 'fit' | 'injured' | 'suspended' | 'unavailable';
export type ContractType = 'full_time' | 'loan' | 'youth' | 'trial';

export interface TechnicalAttributes {
  passing: number;
  shooting: number;
  dribbling: number;
  ballControl: number;
  firstTouch: number;
  heading: number;
  crossing: number;
  finishing: number;
  longShots: number;
  setPieces: number;
  penaltyTaking: number;
}

export interface PhysicalAttributes {
  pace: number;
  acceleration: number;
  agility: number;
  balance: number;
  strength: number;
  stamina: number;
  jumpingReach: number;
  naturalFitness: number;
}

export interface MentalAttributes {
  aggression: number;
  anticipation: number;
  composure: number;
  concentration: number;
  creativity: number;
  decisions: number;
  determination: number;
  flair: number;
  leadership: number;
  offTheBall: number;
  positioning: number;
  teamwork: number;
  vision: number;
  workRate: number;
}

export interface HiddenAttributes {
  professionalism: number;
  consistency: number;
  pressureHandling: number;
  adaptability: number;
  sportsmanship: number;
  injuryProneness: number;
  controversy: number;
  loyalty: number;
  ambition: number;
  hiddenPotential: number;
}

export interface PlayerContract {
  type: ContractType;
  startDate: Timestamp;
  expiryDate: Timestamp;
  wage: number;
  signingBonus: number;
  releaseClause: number | null;
  loanClubId: EntityId | null;
  loanExpiry: Timestamp | null;
}

export interface PlayerInjury {
  type: string;
  severity: 'minor' | 'moderate' | 'serious' | 'career_ending';
  durationDays: number;
  startDate: Timestamp;
  recoveryDate: Timestamp;
}

export interface PlayerRelationship {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'staff';
  relationshipType: 'teammate' | 'rival' | 'mentor' | 'mentee' | 'friend' | 'enemy';
  value: number;
  reason?: string;
}

// ============================================
// EVENT TYPES
// ============================================

export interface BaseEvent {
  id: EntityId;
  type: string;
  timestamp: Timestamp;
  matchId: EntityId;
  minute: number;
  second: number;
  description: string;
  commentary?: string;
}

export interface PossessionEvent extends BaseEvent {
  type: 'possession';
  playerId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  previousHolder?: EntityId;
}

export interface PassEvent extends BaseEvent {
  type: 'pass';
  passerId: EntityId;
  receiverId: EntityId | null;
  teamId: EntityId;
  success: boolean;
  from: Coordinates;
  to: Coordinates;
  passType: 'short' | 'long' | 'through' | 'cross' | 'backheel' | 'header';
  accuracy: number;
  completion?: boolean;
}

export interface ShotEvent extends BaseEvent {
  type: 'shot';
  shooterId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  shotType: 'first_time' | 'volley' | 'half_volley' | 'header' | 'bicycle_kick' | 'penalty' | 'free_kick';
  target: 'goal' | 'off_target' | 'blocked' | 'saved' | 'post' | 'bar';
  xg: number;
  onTarget: boolean;
  goal?: GoalEvent;
}

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

export interface CardEvent extends BaseEvent {
  type: 'card';
  playerId: EntityId;
  teamId: EntityId;
  cardType: 'yellow' | 'second_yellow' | 'red';
  reason: string;
  coordinates: Coordinates;
}

export interface SubstitutionEvent extends BaseEvent {
  type: 'substitution';
  teamId: EntityId;
  playerOffId: EntityId;
  playerOnId: EntityId;
  reason: 'tactical' | 'injury' | 'fatigue' | 'red_card' | 'time_wasting';
}

export interface InjuryEvent extends BaseEvent {
  type: 'injury';
  playerId: EntityId;
  teamId: EntityId;
  injuryType: string;
  severity: PlayerInjury['severity'];
  durationMinutes: number;
  coordinates: Coordinates;
}

export interface SetPieceEvent extends BaseEvent {
  type: 'set_piece';
  setPieceType: 'corner' | 'free_kick' | 'penalty' | 'throw_in' | 'goal_kick';
  teamId: EntityId;
  takerId: EntityId;
  coordinates: Coordinates;
  outcome?: 'goal' | 'save' | 'miss' | 'cleared' | 'ongoing';
}

export interface PressEvent extends BaseEvent {
  type: 'press';
  playerId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  success: boolean;
}

export interface InterceptEvent extends BaseEvent {
  type: 'intercept';
  playerId: EntityId;
  teamId: EntityId;
  coordinates: Coordinates;
  fromPasserId: EntityId;
}

export interface DribbleEvent extends BaseEvent {
  type: 'dribble';
  playerId: EntityId;
  teamId: EntityId;
  from: Coordinates;
  to: Coordinates;
  success: boolean;
  beatenPlayerId?: EntityId;
}

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
  | SetPieceEvent
  | PressEvent
  | InterceptEvent
  | DribbleEvent;

// ============================================
// SIMULATION TYPES
// ============================================

export interface SimulationConfig {
  tickRate: number;
  matchSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  detailLevel: 'basic' | 'standard' | 'detailed' | 'full';
  enablePhysics: boolean;
  enableCommentary: boolean;
  enableStats: boolean;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isHalfTime?: boolean;
  isFullTime?: boolean;
  currentTime: number;
  totalTime: number;
  events: MatchEvent[];
  stats: MatchStats;
  weatherEffects?: WeatherEffect;
  homeScore?: number;
  awayScore?: number;
}

export interface MatchStats {
  possession: {
    home: number;
    away: number;
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
      accuracy: number;
    };
    away: {
      completed: number;
      attempted: number;
      accuracy: number;
    };
  };
  tackles: {
    home: {
      won: number;
      attempted: number;
      successRate: number;
    };
    away: {
      won: number;
      attempted: number;
      successRate: number;
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

export interface PlayerMatchStats {
  playerId: EntityId;
  minutesPlayed: number;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesCompleted: number;
  passesAttempted: number;
  passAccuracy: number;
  tacklesWon: number;
  tacklesAttempted: number;
  tackleSuccessRate: number;
  fouls: number;
  foulsSuffered: number;
  yellowCards: number;
  redCards: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  dribblesCompleted: number;
  dribblesAttempted: number;
  dribbleSuccessRate: number;
  aerialsWon: number;
  aerialsLost: number;
  aerialSuccessRate: number;
  distanceCovered: number;
  sprints: number;
  highIntensityActions: number;
}

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

export interface AIDecision {
  type: AIDecisionType;
  playerId: EntityId;
  teamId: EntityId;
  confidence: number;
  target?: EntityId | Coordinates;
  power?: number;
  accuracy?: number;
  timestamp: number;
}

export interface AIPlayerState {
  playerId: EntityId;
  teamId: EntityId;
  position: PlayerRole;
  currentAction: AIDecisionType | null;
  stamina: number;
  morale: number;
  confidence: number;
  fatigue: number;
  sharpness: number;
  hasBall: boolean;
  inPossession: boolean;
  marking: EntityId | null;
  pressing: boolean;
  offsidePosition: Coordinates | null;
  isInjured?: boolean;
  isSentOff?: boolean;
}

export interface AITeamState {
  teamId: EntityId;
  formation: Formation;
  instructions: TeamInstructions;
  tacticalDNA: TacticalDNA;
  playerStates: AIPlayerState[];
  inPossession: boolean;
  pressingIntensity: number;
  defensiveShape: 'compact' | 'spread' | 'asymmetric';
  attackingShape: 'narrow' | 'wide' | 'overload_left' | 'overload_right';
}

// ============================================
// WORLD ENGINE TYPES
// ============================================

export type WorldTickType = 'minute' | 'hour' | 'day' | 'week' | 'month';

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

export interface TransferUpdate {
  playerId: EntityId;
  fromClubId: EntityId;
  toClubId: EntityId;
  fee: number;
  type: 'transfer' | 'loan' | 'free';
}

export interface InjuryUpdate {
  playerId: EntityId;
  clubId: EntityId;
  injuryType: string;
  severity: PlayerInjury['severity'];
  durationDays: number;
}

export interface ContractUpdate {
  playerId: EntityId;
  clubId: EntityId;
  newWage?: number;
  newExpiryDate?: Timestamp;
  newReleaseClause?: number | null;
}

export interface FinanceUpdate {
  clubId: EntityId;
  incomeChange?: number;
  expenseChange?: number;
  transferBudgetChange?: number;
  wageBudgetChange?: number;
}

export interface YouthUpdate {
  clubId: EntityId;
  newPlayers: Player[];
  intakeQuality: number;
}

export interface MediaUpdate {
  clubId: EntityId;
  headline: string;
  category: 'transfer' | 'result' | 'injury' | 'news' | 'rumor';
  priority: 'low' | 'medium' | 'high';
}

// ============================================
// WEATHER EFFECTS
// ============================================

export interface WeatherEffect {
  name: string;
  description: string;
  ballSpeedModifier: number;
  passAccuracyModifier: number;
  shotAccuracyModifier: number;
  playerSpeedModifier: number;
  staminaDrainModifier: number;
  injuryRateModifier: number;
  slipChance: number;
}

// ============================================
// PLAYER TYPE (for engine integration)
// ============================================

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  age: number;
  nationality?: string;
  clubId: number;
  clubName?: string;
  position: string;
  overallRating: number;
  potentialRating: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
  wage: number;
  morale: number;
  fatigue?: number;
  sharpness?: number;
  stamina?: number;
  injuryStatus: string;
  injury?: string | null;
  marketValue?: number;
  contractExpires?: string | null;
  appearances?: number;
  goals?: number;
  assists?: number;
  averageRating?: number;
  shirtNumber?: number | null;
  foot?: string;
  height?: number;
  weight?: number;
}

// ============================================
// CLUB TYPE (for engine integration)
// ============================================

export interface Club {
  id: number;
  name: string;
  shortName: string;
  country: string;
  league: string;
  leagueId: number | null;
  leagueReputation?: number;
  reputation: number;
  finances: number;
  balance: number;
  wageBudget: number;
  transferBudget: number;
  marketValue: number;
  stadium: string | null;
  stadiumCapacity: number;
  trainingFacilities: number;
  youthAcademy: number;
  coach: string | null;
  homeKitColor: string;
  awayKitColor: string;
}

// ============================================
// MATCH PHASE
// ============================================

export type MatchPhase =
  | 'kickoff'
  | 'build_up'
  | 'transition'
  | 'chance_creation'
  | 'shot'
  | 'set_piece'
  | 'dead_ball'
  | 'half_time'
  | 'full_time';

export interface PhaseState {
  phase: MatchPhase;
  possessionTeam: number | null;
  ballCarrier: number | null;
  lastPasser: number | null;
  pressureLevel: number;
  dangerLevel: number;
  phaseTimer: number;
}
