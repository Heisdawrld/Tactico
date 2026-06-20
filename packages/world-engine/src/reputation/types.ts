// TACTICO World Engine - Reputation Types

import { EntityId, DateString } from '../core/types';

// ============================================
// REPUTATION TYPES
// ============================================

/** Reputation value (0-100) */
export type ReputationValue = number;

/** Entity type that can have reputation */
export type ReputableEntityType = 'player' | 'club' | 'manager' | 'nation' | 'competition' | 'stadium';

/** Reputation entity */
export interface Reputation {
  entityId: EntityId;
  entityType: ReputableEntityType;
  value: ReputationValue;
  // History
  history: ReputationHistoryEntry[];
  // Trend
  trend: ReputationTrend;
  // Last updated
  lastUpdated: DateString;
}

/** Reputation history entry */
export interface ReputationHistoryEntry {
  date: DateString;
  oldValue: ReputationValue;
  newValue: ReputationValue;
  change: number; // Positive or negative
  reason: string;
  category: ReputationCategory;
}

/** Reputation trend */
export type ReputationTrend = 'rising' | 'stable' | 'falling' | 'new';

/** Reputation category */
export type ReputationCategory =
  | 'match_performance'
  | 'trophy_win'
  | 'trophy_runner_up'
  | 'individual_award'
  | 'transfer'
  | 'financial'
  | 'youth_development'
  | 'facility_improvement'
  | 'media_coverage'
  | 'fan_engagement'
  | 'scandal'
  | 'long_service'
  | 'international_duty'
  | 'retirement';

/** Reputation change */
export interface ReputationChange {
  entityId: EntityId;
  entityType: ReputableEntityType;
  amount: number; // Positive or negative
  reason: string;
  category: ReputationCategory;
  date: DateString;
}

/** Reputation event */
export interface ReputationEvent {
  id: EntityId;
  entityId: EntityId;
  entityType: ReputableEntityType;
  oldReputation: ReputationValue;
  newReputation: ReputationValue;
  change: number;
  reason: string;
  category: ReputationCategory;
  date: DateString;
}

/** Reputation factor */
export interface ReputationFactor {
  name: string;
  description: string;
  category: ReputationCategory;
  weight: number; // 0-1 (importance of this factor)
  // Function to calculate the effect
  calculateEffect: (entityId: EntityId, entityType: ReputableEntityType) => number;
}

/** Club reputation factors */
export interface ClubReputationFactors {
  clubId: EntityId;
  // Performance factors
  leaguePosition: number; // 1-20 (current position)
  recentForm: number; // 0-100 (based on last 5 matches)
  cupProgress: number; // 0-100
  trophiesWon: number; // Number of trophies in last 5 years
  
  // Financial factors
  financialStability: number; // 0-100
  transferActivity: number; // 0-100 (based on transfers in/out)
  commercialRevenue: number; // 0-100
  
  // Squad factors
  squadQuality: number; // 0-100 (average player rating)
  squadDepth: number; // 0-100
  youthProduction: number; // 0-100 (quality of youth players produced)
  
  // Facility factors
  stadiumQuality: number; // 0-100
  trainingFacilities: number; // 0-100
  youthAcademy: number; // 0-100
  
  // External factors
  fanBase: number; // 0-100
  mediaPresence: number; // 0-100
  historicalSuccess: number; // 0-100
}

/** Player reputation factors */
export interface PlayerReputationFactors {
  playerId: EntityId;
  // Performance factors
  currentAbility: number; // 1-100
  potentialAbility: number; // 1-100
  recentForm: number; // 0-100 (based on last 5 matches)
  consistency: number; // 0-100 (based on performance consistency)
  
  // Achievements
  trophiesWon: number;
  individualAwards: number;
  capsForNation: number;
  goalsScored: number;
  assists: number;
  cleanSheets: number; // For goalkeepers
  
  // Club factors
  clubReputation: number; // 0-100
  clubLeagueLevel: number; // 1-5
  firstTeamStatus: boolean; // Is player a first-team regular?
  
  // Personal factors
  professionalism: number; // 0-100 (hidden attribute)
  sportsmanship: number; // 0-100 (hidden attribute)
  controversy: number; // 0-100 (hidden attribute, lower is better)
  
  // External factors
  mediaPresence: number; // 0-100
  fanPopularity: number; // 0-100
}

/** Manager reputation factors */
export interface ManagerReputationFactors {
  managerId: EntityId;
  // Performance factors
  winPercentage: number; // 0-100
  recentForm: number; // 0-100
  trophiesWon: number;
  
  // Club factors
  clubReputation: number; // 0-100
  clubLeagueLevel: number; // 1-5
  clubProgress: number; // 0-100 (improvement under manager)
  
  // Tactical factors
  tacticalSuccess: number; // 0-100 (how well tactics work)
  adaptability: number; // 0-100 (manager's adaptability attribute)
  
  // Personal factors
  leadership: number; // 0-100 (manager's leadership attribute)
  manManagement: number; // 0-100
  
  // External factors
  mediaPresence: number; // 0-100
  fanPopularity: number; // 0-100
}

/** Nation reputation factors */
export interface NationReputationFactors {
  nationCode: string;
  // Performance factors
  fifaRanking: number; // 1-200+ (lower is better)
  recentResults: number; // 0-100 (based on last 10 matches)
  tournamentProgress: number; // 0-100 (progress in major tournaments)
  
  // Development factors
  youthQuality: number; // 0-100
  infrastructure: number; // 0-100
  coachingLevel: number; // 0-100
  
  // Player factors
  playerPoolQuality: number; // 0-100 (average quality of national team players)
  playerPoolDepth: number; // 0-100
  playersAbroad: number; // Number of players in top leagues
  
  // Historical factors
  historicalSuccess: number; // 0-100
  worldCupPedigree: number; // 0-100
}

/** Reputation leaderboard entry */
export interface ReputationLeaderboardEntry {
  entityId: EntityId;
  entityType: ReputableEntityType;
  name: string;
  reputation: ReputationValue;
  change: number; // Change from last update
  rank: number;
}

/** Reputation leaderboard */
export interface ReputationLeaderboard {
  entityType: ReputableEntityType;
  entries: ReputationLeaderboardEntry[];
  lastUpdated: DateString;
}

/** Reputation report */
export interface ReputationReport {
  entityId: EntityId;
  entityType: ReputableEntityType;
  currentReputation: ReputationValue;
  previousReputation: ReputationValue;
  change: number;
  trend: ReputationTrend;
  history: ReputationHistoryEntry[]; // Last 10 entries
  factors: Record<string, number>; // Reputation factors and their values
  comparisons: ReputationComparison[]; // Comparisons with similar entities
  recommendations: string[];
}

/** Reputation comparison */
export interface ReputationComparison {
  entityId: EntityId;
  entityType: ReputableEntityType;
  name: string;
  reputation: ReputationValue;
  difference: number; // Difference from the main entity
}

/** Reputation milestone */
export interface ReputationMilestone {
  id: EntityId;
  entityId: EntityId;
  entityType: ReputableEntityType;
  milestone: string; // e.g., "Reached 80 reputation"
  description: string;
  date: DateString;
  reputationAtTime: ReputationValue;
}

// ============================================
// REPUTATION CONSTANTS
// ============================================

/** Base reputation values by entity type */
export const BASE_REPUTATION_VALUES: Record<ReputableEntityType, ReputationValue> = {
  player: 1,
  club: 50,
  manager: 30,
  nation: 50,
  competition: 50,
  stadium: 30,
};

/** Maximum reputation change per event */
export const MAX_REPUTATION_CHANGE: number = 10;

/** Minimum reputation change per event */
export const MIN_REPUTATION_CHANGE: number = 1;

/** Reputation change multipliers by category */
export const REPUTATION_CHANGE_MULTIPLIERS: Record<ReputationCategory, number> = {
  match_performance: 1.0,
  trophy_win: 2.0,
  trophy_runner_up: 1.5,
  individual_award: 1.5,
  transfer: 1.2,
  financial: 0.8,
  youth_development: 1.0,
  facility_improvement: 0.8,
  media_coverage: 0.5,
  fan_engagement: 0.6,
  scandal: -1.5,
  long_service: 0.5,
  international_duty: 1.0,
  retirement: 0.5,
};

/** Club reputation factors weights */
export const CLUB_REPUTATION_FACTOR_WEIGHTS: Record<string, number> = {
  leaguePosition: 0.15,
  recentForm: 0.10,
  cupProgress: 0.10,
  trophiesWon: 0.15,
  financialStability: 0.10,
  transferActivity: 0.05,
  commercialRevenue: 0.05,
  squadQuality: 0.10,
  squadDepth: 0.05,
  youthProduction: 0.05,
  stadiumQuality: 0.03,
  trainingFacilities: 0.03,
  youthAcademy: 0.03,
  fanBase: 0.02,
  mediaPresence: 0.02,
  historicalSuccess: 0.05,
};

/** Player reputation factors weights */
export const PLAYER_REPUTATION_FACTOR_WEIGHTS: Record<string, number> = {
  currentAbility: 0.20,
  potentialAbility: 0.15,
  recentForm: 0.15,
  consistency: 0.10,
  trophiesWon: 0.10,
  individualAwards: 0.10,
  capsForNation: 0.05,
  goalsScored: 0.03,
  assists: 0.02,
  cleanSheets: 0.02,
  clubReputation: 0.05,
  clubLeagueLevel: 0.03,
  firstTeamStatus: 0.05,
  professionalism: 0.02,
  sportsmanship: 0.02,
  controversy: -0.03,
  mediaPresence: 0.01,
  fanPopularity: 0.02,
};

/** Manager reputation factors weights */
export const MANAGER_REPUTATION_FACTOR_WEIGHTS: Record<string, number> = {
  winPercentage: 0.25,
  recentForm: 0.20,
  trophiesWon: 0.20,
  clubReputation: 0.10,
  clubLeagueLevel: 0.05,
  clubProgress: 0.10,
  tacticalSuccess: 0.05,
  adaptability: 0.02,
  leadership: 0.02,
  manManagement: 0.01,
  mediaPresence: 0.01,
  fanPopularity: 0.01,
};

/** Nation reputation factors weights */
export const NATION_REPUTATION_FACTOR_WEIGHTS: Record<string, number> = {
  fifaRanking: 0.20,
  recentResults: 0.15,
  tournamentProgress: 0.15,
  youthQuality: 0.10,
  infrastructure: 0.10,
  coachingLevel: 0.10,
  playerPoolQuality: 0.10,
  playerPoolDepth: 0.05,
  playersAbroad: 0.03,
  historicalSuccess: 0.02,
  worldCupPedigree: 0.02,
};

/** Reputation thresholds */
export const REPUTATION_THRESHOLDS = {
  unknown: 0,
  very_low: 10,
  low: 30,
  moderate: 50,
  high: 70,
  very_high: 85,
  elite: 95,
  world_class: 100,
} as const;

/** Reputation descriptions */
export const REPUTATION_DESCRIPTIONS: Record<keyof typeof REPUTATION_THRESHOLDS, string> = {
  unknown: 'Unknown entity',
  very_low: 'Very low reputation',
  low: 'Low reputation',
  moderate: 'Moderate reputation',
  high: 'High reputation',
  very_high: 'Very high reputation',
  elite: 'Elite reputation',
  world_class: 'World class reputation',
};

/** Trophy reputation bonuses */
export const TROPHY_REPUTATION_BONUSES: Record<string, number> = {
  // Club trophies
  'champions_league': 15,
  'europa_league': 10,
  'super_cup': 5,
  'domestic_league': 10,
  'domestic_cup': 8,
  'league_cup': 5,
  'super_cup_national': 3,
  
  // Individual trophies
  'ballon_dor': 20,
  'world_player_of_the_year': 18,
  'european_player_of_the_year': 15,
  'golden_boot': 12,
  'golden_glove': 10,
  'best_young_player': 10,
  'team_of_the_year': 8,
  
  // Manager trophies
  'manager_of_the_year': 12,
  'best_manager': 10,
};

/** Individual award reputation bonuses */
export const INDIVIDUAL_AWARD_REPUTATION_BONUSES: Record<string, number> = {
  'player_of_the_month': 2,
  'young_player_of_the_month': 2,
  'team_of_the_month': 1,
  'man_of_the_match': 1,
  'top_scorer': 5,
  'most_assists': 4,
  'most_clean_sheets': 4,
};

/** Transfer reputation effects */
export const TRANSFER_REPUTATION_EFFECTS: Record<string, number> = {
  // For selling club
  'sold_player_high_fee': 5,
  'sold_player_low_fee': -2,
  'sold_star_player': 3,
  'sold_youth_player': 2,
  
  // For buying club
  'bought_player_high_fee': 3,
  'bought_player_low_fee': 1,
  'bought_star_player': 5,
  'bought_youth_player': 2,
  
  // For player
  'joined_bigger_club': 8,
  'joined_smaller_club': -3,
  'joined_rival_club': -5,
  'high_transfer_fee': 5,
  'low_transfer_fee': -2,
};

/** Financial reputation effects */
export const FINANCIAL_REPUTATION_EFFECTS: Record<string, number> = {
  'record_profits': 3,
  'record_losses': -5,
  'big_sponsorship_deal': 4,
  'lost_sponsorship': -3,
  'new_stadium': 5,
  'stadium_renovation': 3,
  'financial_crisis': -10,
  'takeover': 5,
};

/** Scandal reputation effects */
export const SCANDAL_REPUTATION_EFFECTS: Record<string, number> = {
  'minor_scandal': -3,
  'moderate_scandal': -7,
  'major_scandal': -15,
  'match_fixing': -20,
  'doping': -20,
  'financial_fraud': -18,
  'racism': -25,
  'violence': -20,
};
