// TACTICO World Engine - Morale Types

import { EntityId, DateString } from '../core/types';

// ============================================
// MORALE TYPES
// ============================================

/** Morale level (0-100) */
export type MoraleLevel = number;

/** Morale category */
export type MoraleCategory = 
  | 'match_result'
  | 'training'
  | 'contract'
  | 'transfer'
  | 'injury'
  | 'team_meeting'
  | 'press_conference'
  | 'fan_reaction'
  | 'board_expectations'
  | 'personal_issue'
  | 'weather';

/** Morale factor */
export interface MoraleFactor {
  category: MoraleCategory;
  description: string;
  effect: number; // -100 to +100
  weight: number; // 0-1 (importance of this factor)
  duration: number; // In days (how long this effect lasts)
}

/** Morale event */
export interface MoraleEvent {
  id: EntityId;
  entityId: EntityId; // Player, manager, or club
  entityType: 'player' | 'manager' | 'club' | 'team';
  category: MoraleCategory;
  description: string;
  effect: number; // -100 to +100
  date: DateString;
  expiresAt: DateString;
  isActive: boolean;
}

/** Morale state for an entity */
export interface MoraleState {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'team';
  currentMorale: MoraleLevel;
  baseMorale: MoraleLevel; // Morale without temporary effects
  temporaryEffects: MoraleEvent[];
  history: MoraleEvent[]; // Past morale events
  trend: 'improving' | 'stable' | 'declining';
}

/** Team morale (aggregate of player morale) */
export interface TeamMorale {
  clubId: EntityId;
  averageMorale: MoraleLevel;
  playerMorale: Record<EntityId, MoraleLevel>; // Player ID -> morale
  positionMorale: Record<string, MoraleLevel>; // Position -> average morale
  squadHarmony: MoraleLevel; // 0-100 (how well players get along)
  managerRelationship: MoraleLevel; // 0-100 (relationship with manager)
  fanRelationship: MoraleLevel; // 0-100 (relationship with fans)
}

/** Morale modifier */
export interface MoraleModifier {
  id: EntityId;
  name: string;
  description: string;
  category: MoraleCategory;
  effect: number; // -100 to +100
  duration: number; // In days
  conditions?: MoraleCondition[]; // Conditions that must be met to apply
}

/** Condition for applying a morale modifier */
export interface MoraleCondition {
  type: 'min_morale' | 'max_morale' | 'player_age' | 'player_position' | 'team_performance' | 'contract_status';
  value: number | string;
  comparison: '==' | '!=' | '>' | '<' | '>=' | '<=';
}

/** Morale boost (positive effect) */
export interface MoraleBoost {
  id: EntityId;
  name: string;
  description: string;
  effect: number; // +1 to +50
  duration: number; // In days
  cooldown: number; // In days (how long until can be used again)
  cost?: number; // Optional cost (e.g., for team building events)
}

/** Morale penalty (negative effect) */
export interface MoralePenalty {
  id: EntityId;
  name: string;
  description: string;
  effect: number; // -1 to -50
  duration: number; // In days
  cause: string;
}

/** Morale report */
export interface MoraleReport {
  entityId: EntityId;
  entityType: 'player' | 'manager' | 'club' | 'team';
  currentMorale: MoraleLevel;
  baseMorale: MoraleLevel;
  temporaryEffects: MoraleEvent[];
  recentEvents: MoraleEvent[]; // Last 5 events
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

/** Player morale factors */
export interface PlayerMoraleFactors {
  playerId: EntityId;
  // Performance factors
  recentForm: number; // 0-100 (based on recent match ratings)
  playingTime: number; // 0-100 (percentage of matches played)
  goalsAssists: number; // 0-100 (based on recent contributions)
  cleanSheets: number; // 0-100 (for defenders/goalkeepers)
  
  // Team factors
  teamPerformance: number; // 0-100 (based on team results)
  teamHarmony: number; // 0-100 (relationship with teammates)
  managerRelationship: number; // 0-100
  
  // Personal factors
  contractSatisfaction: number; // 0-100 (based on contract terms)
  wageSatisfaction: number; // 0-100
  personalIssues: number; // 0-100 (negative effect from personal problems)
  
  // External factors
  fanSupport: number; // 0-100
  mediaSentiment: number; // 0-100
  
  // Overall morale calculation
  calculatedMorale: MoraleLevel;
}

/** Team morale factors */
export interface TeamMoraleFactors {
  clubId: EntityId;
  // Performance factors
  recentResults: number; // 0-100 (based on last 5 matches)
  leaguePosition: number; // 0-100 (higher position = better morale)
  cupProgress: number; // 0-100
  
  // Squad factors
  squadDepth: number; // 0-100 (more depth = better morale)
  squadQuality: number; // 0-100 (higher quality = better morale)
  squadHarmony: number; // 0-100
  
  // Management factors
  managerQuality: number; // 0-100
  managerStyle: number; // 0-100 (how well manager's style fits the squad)
  boardSupport: number; // 0-100
  
  // External factors
  fanSupport: number; // 0-100
  mediaSentiment: number; // 0-100
  financialStability: number; // 0-100
  
  // Overall morale calculation
  calculatedMorale: MoraleLevel;
}

// ============================================
// MORALE CONSTANTS
// ============================================

/** Base morale values */
export const BASE_MORALE_VALUES: Record<string, MoraleLevel> = {
  player: 70,
  manager: 75,
  club: 75,
  team: 75,
};

/** Morale effect weights by category */
export const MORALE_EFFECT_WEIGHTS: Record<MoraleCategory, number> = {
  match_result: 0.30,      // High impact
  training: 0.10,         // Medium impact
  contract: 0.20,        // High impact
  transfer: 0.15,        // Medium-high impact
  injury: 0.20,          // High impact
  team_meeting: 0.05,    // Low impact
  press_conference: 0.05, // Low impact
  fan_reaction: 0.10,    // Medium impact
  board_expectations: 0.15, // Medium impact
  personal_issue: 0.10,  // Medium impact
  weather: 0.05,         // Low impact
};

/** Match result morale effects */
export const MATCH_RESULT_MORALE_EFFECTS: Record<string, number> = {
  win: 15,       // +15 morale
  draw: 5,       // +5 morale
  loss: -15,     // -15 morale
  heavy_loss: -25, // -25 morale (lost by 3+ goals)
  last_minute_win: 25, // +25 morale
  last_minute_loss: -25, // -25 morale
  derby_win: 20, // +20 morale
  derby_loss: -20, // -20 morale
  cup_win: 20,   // +20 morale
  cup_loss: -10, // -10 morale
  promotion: 30, // +30 morale
  relegation: -30, // -30 morale
};

/** Training morale effects */
export const TRAINING_MORALE_EFFECTS: Record<string, number> = {
  excellent_session: 10,    // +10 morale
  good_session: 5,         // +5 morale
  average_session: 0,      // No effect
  poor_session: -5,        // -5 morale
  very_poor_session: -10, // -10 morale
  individual_focus: 15,    // +15 morale (player received individual training)
  ignored: -10,           // -10 morale (player was ignored in training)
};

/** Contract morale effects */
export const CONTRACT_MORALE_EFFECTS: Record<string, number> = {
  new_contract: 20,       // +20 morale
  contract_extension: 15, // +15 morale
  wage_increase: 25,      // +25 morale
  wage_decrease: -20,     // -20 morale
  contract_expiring: -10, // -10 morale (6 months left)
  contract_expired: -25,  // -25 morale
  released: -30,          // -30 morale
  loaned_out: -15,        // -15 morale
  recalled_from_loan: 10, // +10 morale
};

/** Transfer morale effects */
export const TRANSFER_MORALE_EFFECTS: Record<string, number> = {
  transfer_request_accepted: 20, // +20 morale
  transfer_request_rejected: -20, // -20 morale
  sold: -5,              // -5 morale (player was sold)
  bought: 15,            // +15 morale (player was bought by a bigger club)
  joined_bigger_club: 25, // +25 morale
  joined_smaller_club: -15, // -15 morale
  transfer_to_rival: -20, // -20 morale (player transferred to a rival)
  transfer_from_rival: 20, // +20 morale (club signed player from rival)
};

/** Injury morale effects */
export const INJURY_MORALE_EFFECTS: Record<string, number> = {
  minor_injury: -5,      // -5 morale
  moderate_injury: -15,  // -15 morale
  serious_injury: -25,    // -25 morale
  career_ending_injury: -50, // -50 morale
  recovered_from_injury: 10, // +10 morale
  teammate_injured: -5,  // -5 morale (teammate injured)
  teammate_recovered: 5, // +5 morale
};

/** Default morale boosts */
export const DEFAULT_MORALE_BOOSTS: MoraleBoost[] = [
  {
    id: 1,
    name: 'Team Building Event',
    description: 'Organize a team building event to improve squad harmony',
    effect: 15,
    duration: 14,
    cooldown: 30,
    cost: 50000,
  },
  {
    id: 2,
    name: 'Bonus Payment',
    description: 'Pay bonuses to players for good performance',
    effect: 10,
    duration: 7,
    cooldown: 14,
    cost: 100000,
  },
  {
    id: 3,
    name: 'Pep Talk',
    description: 'Give an inspiring pep talk to the team',
    effect: 10,
    duration: 7,
    cooldown: 7,
    cost: 0,
  },
  {
    id: 4,
    name: 'Training Camp',
    description: 'Organize a special training camp',
    effect: 20,
    duration: 21,
    cooldown: 90,
    cost: 200000,
  },
  {
    id: 5,
    name: 'Player of the Month Award',
    description: 'Award a player for excellent performance',
    effect: 5,
    duration: 14,
    cooldown: 30,
    cost: 10000,
  },
];

/** Default morale penalties */
export const DEFAULT_MORALE_PENALTIES: MoralePenalty[] = [
  {
    id: 1,
    name: 'Poor Team Performance',
    description: 'Team has been performing poorly',
    effect: -10,
    duration: 14,
    cause: 'poor_results',
  },
  {
    id: 2,
    name: 'Manager Criticism',
    description: 'Manager publicly criticized the team',
    effect: -15,
    duration: 7,
    cause: 'manager_criticism',
  },
  {
    id: 3,
    name: 'Contract Dispute',
    description: 'Player is in a contract dispute with the club',
    effect: -20,
    duration: 30,
    cause: 'contract_dispute',
  },
  {
    id: 4,
    name: 'Injury Crisis',
    description: 'Multiple key players are injured',
    effect: -15,
    duration: 14,
    cause: 'injury_crisis',
  },
  {
    id: 5,
    name: 'Fan Protests',
    description: 'Fans are protesting against the team/manager',
    effect: -15,
    duration: 7,
    cause: 'fan_protests',
  },
];

/** Morale thresholds */
export const MORALE_THRESHOLDS = {
  excellent: 90,
  very_good: 80,
  good: 70,
  average: 60,
  poor: 50,
  very_poor: 40,
  terrible: 30,
  disastrous: 20,
  rebellious: 10,
  mutiny: 0,
} as const;

/** Morale effect durations (in days) */
export const MORALE_EFFECT_DURATIONS: Record<MoraleCategory, number> = {
  match_result: 7,      // Lasts 1 week
  training: 7,         // Lasts 1 week
  contract: 30,       // Lasts 1 month
  transfer: 14,       // Lasts 2 weeks
  injury: 14,         // Lasts 2 weeks
  team_meeting: 7,    // Lasts 1 week
  press_conference: 7, // Lasts 1 week
  fan_reaction: 7,    // Lasts 1 week
  board_expectations: 30, // Lasts 1 month
  personal_issue: 14,  // Lasts 2 weeks
  weather: 1,         // Lasts 1 day
};
