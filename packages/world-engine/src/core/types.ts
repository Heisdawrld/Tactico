// TACTICO World Engine - Core Types

// ============================================
// BASE TYPES
// ============================================

/** Unique identifier for entities */
export type EntityId = number | string;

/** Timestamp in ISO format */
export type Timestamp = string;

/** Date in YYYY-MM-DD format */
export type DateString = string;

// ============================================
// WORLD STATE TYPES
// ============================================

/** World tick type */
export type WorldTickType = 'minute' | 'hour' | 'day' | 'week' | 'month';

/** Current world state */
export interface WorldState {
  id: EntityId;
  currentDate: DateString;
  currentTime: Timestamp;
  currentSeason: number;
  currentWeek: number;
  currentDay: number;
  transferWindowOpen: boolean;
  youthIntakeDay: number; // Day of month for youth intake
  lastTick: Timestamp;
  lastTickType: WorldTickType;
}

/** World tick result */
export interface WorldTickResult {
  tickType: WorldTickType;
  timestamp: Timestamp;
  duration: number; // Duration of tick in ms
  changes: WorldChanges;
}

/** All changes that occurred during a world tick */
export interface WorldChanges {
  players: PlayerChange[];
  clubs: ClubChange[];
  managers: ManagerChange[];
  transfers: TransferUpdate[];
  injuries: InjuryUpdate[];
  contracts: ContractUpdate[];
  finances: FinanceUpdate[];
  youth: YouthUpdate[];
  reputation: ReputationUpdate[];
  media: MediaUpdate[];
  matches: MatchUpdate[];
  leagueTables: LeagueTableUpdate[];
}

// ============================================
// ENTITY TYPES
// ============================================

// Nations
/** Nation entity */
export interface Nation {
  code: string; // ISO country code (primary key)
  name: string;
  // Youth development ratings (1-100)
  youthQuality: number;
  infrastructure: number;
  coachingLevel: number;
  financialStrength: number;
  footballCulture: number;
  // Reputation
  reputation: number; // 1-100
  // Continent
  continent: Continent;
}

/** Continent */
export type Continent = 'AF' | 'AS' | 'EU' | 'NA' | 'OC' | 'SA';

// Leagues
/** League entity */
export interface League {
  id: EntityId;
  name: string;
  countryCode: string; // Nation code
  tier: number; // 1 = top division
  reputation: number; // 1-100
  financialStrength: number; // 1-100
  competitiveness: number; // 1-100
  // Prize money
  prizeMoney: {
    champion: number;
    second: number;
    third: number;
    fourth: number;
    relegation: number[]; // Prize money for each relegation position
  };
  // TV revenue distribution
  tvRevenueDistribution: {
    champion: number;
    second: number;
    third: number;
    fourth: number;
    others: number;
  };
  // Promotion/relegation
  promotionSpots: number;
  relegationSpots: number;
  playoffSpots: number;
}

// Clubs
/** Club entity */
export interface Club {
  id: EntityId;
  name: string;
  shortName: string;
  countryCode: string; // Nation code
  leagueId: EntityId;
  foundedYear: number;
  // Finances
  balance: number; // Current balance in USD
  wageBudget: number; // Weekly wage budget
  transferBudget: number; // Budget for transfers
  // Facilities (1-5)
  trainingFacilities: number;
  youthAcademy: number;
  stadiumCapacity: number;
  medicalCenter: number;
  scoutingNetwork: number;
  // Quality ratings (1-100)
  reputation: number;
  tacticalCulture: number;
  youthQuality: number;
  scoutingQuality: number;
  // Ownership
  ownershipType: OwnershipType;
  ownerName: string;
  // Tactical preferences
  preferredFormation: Formation;
  tacticalDNA: TacticalDNA;
  // Colors
  homeKitColor: string;
  awayKitColor: string;
  thirdKitColor?: string;
  // Stadium
  stadiumName: string;
  // History
  trophies: Trophy[];
  // Current season
  currentSeasonStats: ClubSeasonStats;
}

/** Club ownership type */
export type OwnershipType = 
  | 'private'
  | 'public'
  | 'fan_owned'
  | 'state_owned'
  | 'sugar_daddy';

/** Club trophy */
export interface Trophy {
  competition: string;
  year: number;
  timesWon: number;
}

/** Club season statistics */
export interface ClubSeasonStats {
  season: number;
  leaguePosition: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  // Cup progress
  domesticCup: CupProgress;
  leagueCup?: CupProgress;
  continentalCup?: CupProgress;
  // Finances
  revenue: number;
  expenses: number;
  profit: number;
}

/** Cup competition progress */
export type CupProgress = 
  | 'not_entered'
  | 'group_stage'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'final'
  | 'winner';

// Players
/** Player entity */
export interface Player {
  id: EntityId;
  firstName: string;
  lastName: string;
  commonName?: string;
  nationality: string; // Nation code
  dateOfBirth: DateString;
  age: number;
  height: number; // cm
  weight: number; // kg
  clubId: EntityId | null;
  position: PlayerRole;
  foot: FootPreference;
  // Technical attributes (1-100)
  attributes: TechnicalAttributes & PhysicalAttributes & MentalAttributes;
  // Hidden attributes (1-100)
  hiddenAttributes: HiddenAttributes;
  // Dynamic stats
  currentAbility: number; // 1-100
  potentialAbility: number; // 1-100
  reputation: number; // 1-100
  marketValue: number; // USD
  wage: number; // Weekly wage in USD
  morale: number; // 0-100
  fatigue: number; // 0-100
  sharpness: number; // 0-100
  // Contract
  contract: PlayerContract;
  // Injury
  injury: PlayerInjury | null;
  // Relationships
  relationships: PlayerRelationship[];
  // History
  careerHistory: PlayerCareerHistory[];
  // Appearance
  appearance: PlayerAppearance;
}

/** Player role */
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

/** Player foot preference */
export type FootPreference = 'right' | 'left' | 'both';

/** Player technical attributes */
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

/** Player physical attributes */
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

/** Player mental attributes */
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

/** Player hidden attributes */
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

/** Player contract */
export interface PlayerContract {
  type: ContractType;
  startDate: DateString;
  expiryDate: DateString;
  wage: number;
  signingBonus: number;
  releaseClause: number | null;
  loanClubId: EntityId | null;
  loanExpiryDate: DateString | null;
}

/** Player contract type */
export type ContractType = 'full_time' | 'loan' | 'youth' | 'trial';

/** Player injury */
export interface PlayerInjury {
  type: string;
  severity: InjurySeverity;
  durationDays: number;
  startDate: DateString;
  recoveryDate: DateString;
}

/** Injury severity */
export type InjurySeverity = 'minor' | 'moderate' | 'serious' | 'career_ending';

/** Player relationship */
export interface PlayerRelationship {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'staff' | 'nation';
  relationshipType: 'teammate' | 'rival' | 'mentor' | 'mentee' | 'friend' | 'enemy' | 'idol' | 'fan';
  value: number; // -100 (hate) to +100 (love)
  reason?: string;
}

/** Player career history */
export interface PlayerCareerHistory {
  clubId: EntityId;
  startDate: DateString;
  endDate: DateString | null;
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number; // For goalkeepers
  averageRating: number;
  trophies: Trophy[];
}

/** Player appearance */
export interface PlayerAppearance {
  skinTone: SkinTone;
  hairColor: HairColor;
  hairStyle: HairStyle;
  facialHair: FacialHair;
  build: BodyBuild;
}

/** Skin tone */
export type SkinTone = 
  | 'light'
  | 'fair'
  | 'medium'
  | 'olive'
  | 'brown'
  | 'dark_brown'
  | 'deep_dark';

/** Hair color */
export type HairColor = 
  | 'black'
  | 'brown'
  | 'blonde'
  | 'red'
  | 'grey'
  | 'white'
  | 'bald';

/** Hair style */
export type HairStyle = 
  | 'short'
  | 'medium'
  | 'long'
  | 'buzz_cut'
  | 'afro'
  | 'dreadlocks'
  | 'braids'
  | 'mohawk';

/** Facial hair */
export type FacialHair = 
  | 'clean_shaven'
  | 'stubble'
  | 'goatee'
  | 'full_beard'
  | 'moustache';

/** Body build */
export type BodyBuild = 
  | 'slim'
  | 'average'
  | 'stocky'
  | 'muscular'
  | 'tall_slim'
  | 'tall_muscular';

// Managers
/** Manager entity */
export interface Manager {
  id: EntityId;
  userId: EntityId | null; // null for AI managers
  firstName: string;
  lastName: string;
  nationality: string; // Nation code
  dateOfBirth: DateString;
  age: number;
  // Tactical DNA
  tacticalDNA: TacticalDNA;
  // Manager attributes (1-100)
  reputation: number;
  leadership: number;
  adaptability: number;
  judgingAbility: number;
  judgingPotential: number;
  manManagement: number;
  motivation: number;
  tacticalKnowledge: number;
  technicalKnowledge: number;
  mentalKnowledge: number;
  physicalKnowledge: number;
  // Preferred style
  preferredStyle: TacticalStyle;
  preferredFormation: Formation;
  // Current club
  clubId: EntityId | null;
  // History
  careerHistory: ManagerCareerHistory[];
  // Relationships
  relationships: ManagerRelationship[];
  // AI personality (for AI managers)
  aiPersonality?: ManagerAIPersonality;
}

/** Manager tactical DNA */
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

/** Manager tactical style */
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

/** Manager formation */
export type Formation = 
  | '4-4-2'
  | '4-3-3'
  | '3-5-2'
  | '4-2-3-1'
  | '5-3-2'
  | '3-4-3'
  | '4-1-4-1'
  | '5-4-1';

/** Manager career history */
export interface ManagerCareerHistory {
  clubId: EntityId;
  startDate: DateString;
  endDate: DateString | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  trophies: Trophy[];
  achievements: string[];
}

/** Manager relationship */
export interface ManagerRelationship {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'chairman' | 'media';
  relationshipType: 'friend' | 'rival' | 'ally' | 'enemy' | 'mentor' | 'mentee' | 'respects' | 'dislikes';
  value: number; // -100 to +100
  reason?: string;
}

/** Manager AI personality */
export interface ManagerAIPersonality {
  adaptability: number; // 0-100, how quickly they adapt to new situations
  loyalty: number; // 0-100, how loyal they are to their club
  ambition: number; // 0-100, how ambitious they are
  patience: number; // 0-100, how patient they are with results
  attackingMindset: number; // 0-100, preference for attacking football
  defensiveMindset: number; // 0-100, preference for defensive football
  youthFocus: number; // 0-100, focus on youth development
  transferStrategy: TransferStrategy; // Preferred transfer approach
}

/** Manager transfer strategy */
export type TransferStrategy = 
  | 'buy_established'
  | 'develop_youth'
  | 'sell_for_profit'
  | 'balanced'
  | 'bargain_hunter'
  | 'big_spender';

// ============================================
// CHANGE TYPES
// ============================================

/** Player change from world tick */
export interface PlayerChange {
  playerId: EntityId;
  attributeChanges: Partial<TechnicalAttributes & PhysicalAttributes & MentalAttributes>;
  hiddenAttributeChanges?: Partial<HiddenAttributes>;
  newCurrentAbility?: number;
  newPotentialAbility?: number;
  newReputation?: number;
  newMarketValue?: number;
  newMorale?: number;
  newFatigue?: number;
  newSharpness?: number;
  reason: string;
}

/** Club change from world tick */
export interface ClubChange {
  clubId: EntityId;
  reputationChange?: number;
  financialChange?: number;
  facilityUpgrades?: Partial<{
    trainingFacilities: number;
    youthAcademy: number;
    stadiumCapacity: number;
    medicalCenter: number;
    scoutingNetwork: number;
  }>;
  newTacticalDNA?: Partial<TacticalDNA>;
  reason: string;
}

/** Manager change from world tick */
export interface ManagerChange {
  managerId: EntityId;
  reputationChange?: number;
  newClubId?: EntityId;
  reason: string;
}

// ============================================
// UPDATE TYPES
// ============================================

/** Transfer update */
export interface TransferUpdate {
  transferId: EntityId;
  playerId: EntityId;
  fromClubId: EntityId;
  toClubId: EntityId;
  fee: number;
  wage: number;
  status: TransferStatus;
  completionDate?: DateString;
  reason?: string;
}

/** Transfer status */
export type TransferStatus = 
  | 'negotiating'
  | 'agreed_personal_terms'
  | 'agreed_fee'
  | 'medical'
  | 'completed'
  | 'cancelled'
  | 'rejected';

/** Injury update */
export interface InjuryUpdate {
  playerId: EntityId;
  injuryType: string;
  severity: InjurySeverity;
  durationDays: number;
  startDate: DateString;
  recoveryDate: DateString;
  reason: string;
}

/** Contract update */
export interface ContractUpdate {
  playerId: EntityId;
  clubId: EntityId;
  newContract: PlayerContract;
  oldContract: PlayerContract;
  reason: string;
}

/** Finance update */
export interface FinanceUpdate {
  clubId: EntityId;
  type: FinanceTransactionType;
  category: string;
  amount: number;
  description: string;
  date: DateString;
}

/** Finance transaction type */
export type FinanceTransactionType = 'income' | 'expense';

/** Youth update */
export interface YouthUpdate {
  clubId: EntityId;
  newPlayers: Player[];
  reason: string;
}

/** Reputation update */
export interface ReputationUpdate {
  entityId: EntityId;
  entityType: 'player' | 'club' | 'manager' | 'nation';
  reputationChange: number;
  newReputation: number;
  reason: string;
}

/** Media update */
export interface MediaUpdate {
  id: EntityId;
  type: MediaType;
  title: string;
  content: string;
  entityId: EntityId;
  entityType: 'player' | 'club' | 'manager' | 'match';
  sentiment: MediaSentiment;
  importance: MediaImportance;
  date: Timestamp;
}

/** Media type */
export type MediaType = 
  | 'news'
  | 'rumor'
  | 'interview'
  | 'press_conference'
  | 'social_media'
  | 'podcast'
  | 'analysis';

/** Media sentiment */
export type MediaSentiment = 
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_positive'
  | 'very_negative';

/** Media importance */
export type MediaImportance = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/** Match update */
export interface MatchUpdate {
  matchId: EntityId;
  homeScore?: number;
  awayScore?: number;
  status?: MatchStatus;
  events?: any[]; // MatchEvent[] - would import from simulation-engine
  stats?: any; // MatchStats - would import from simulation-engine
}

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
  | 'postponed'
  | 'abandoned';

/** League table update */
export interface LeagueTableUpdate {
  leagueId: EntityId;
  updatedPositions: LeagueTableEntry[];
}

/** League table entry */
export interface LeagueTableEntry {
  clubId: EntityId;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string; // e.g., 'WWDLW'
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  EntityId,
  Timestamp,
  DateString,
  WorldTickType,
  Continent,
  OwnershipType,
  PlayerRole,
  FootPreference,
  ContractType,
  InjurySeverity,
  SkinTone,
  HairColor,
  HairStyle,
  FacialHair,
  BodyBuild,
  TacticalStyle,
  Formation,
  TransferStatus,
  FinanceTransactionType,
  MediaType,
  MediaSentiment,
  MediaImportance,
  MatchStatus,
};
