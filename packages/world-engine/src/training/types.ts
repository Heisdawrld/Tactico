// TACTICO World Engine - Training Types

import { EntityId, DateString } from '../core/types';

// ============================================
// TRAINING TYPES
// ============================================

/** Training category */
export type TrainingCategory = 'physical' | 'technical' | 'mental' | 'tactical' | 'goalkeeping';

/** Training intensity (1-5) */
export type TrainingIntensity = 1 | 2 | 3 | 4 | 5;

/** Training focus area */
export type TrainingFocusArea =
  // Physical
  | 'stamina'
  | 'strength'
  | 'pace'
  | 'acceleration'
  | 'agility'
  | 'balance'
  | 'jumping_reach'
  | 'natural_fitness'
  // Technical
  | 'passing'
  | 'shooting'
  | 'dribbling'
  | 'ball_control'
  | 'first_touch'
  | 'heading'
  | 'crossing'
  | 'finishing'
  | 'long_shots'
  | 'set_pieces'
  | 'penalty_taking'
  // Mental
  | 'aggression'
  | 'anticipation'
  | 'composure'
  | 'concentration'
  | 'creativity'
  | 'decisions'
  | 'determination'
  | 'flair'
  | 'leadership'
  | 'off_the_ball'
  | 'positioning'
  | 'teamwork'
  | 'vision'
  | 'work_rate'
  // Tactical
  | 'positioning'
  | 'teamwork'
  | 'decision_making'
  | 'game_understanding'
  | 'tactical_awareness'
  // Goalkeeping
  | 'handling'
  | 'reflexes'
  | 'aerial_ability'
  | 'distribution'
  | 'command_of_area'
  | 'one_on_ones';

/** Training session */
export interface TrainingSession {
  id: EntityId;
  clubId: EntityId;
  date: DateString;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  focusAreas: TrainingFocusArea[];
  durationMinutes: number;
  coachId?: EntityId;
  notes?: string;
}

/** Individual training focus */
export interface IndividualTraining {
  playerId: EntityId;
  category: TrainingCategory;
  focusArea: TrainingFocusArea;
  intensity: TrainingIntensity;
}

/** Training schedule for a club */
export interface ClubTrainingSchedule {
  clubId: EntityId;
  weeklySchedule: Record<TrainingCategory, TrainingIntensity>;
  individualTraining: IndividualTraining[];
}

/** Training effect on a player */
export interface TrainingEffect {
  playerId: EntityId;
  attribute: TrainingFocusArea;
  improvement: number; // Attribute points gained
  reason: string;
}

/** Training results for a week */
export interface WeeklyTrainingResults {
  clubId: EntityId;
  date: DateString;
  playerEffects: TrainingEffect[];
  overallImprovement: number; // Average improvement across all players
}

/** Training facility quality */
export interface TrainingFacility {
  clubId: EntityId;
  quality: number; // 1-5
  effectMultiplier: number; // Multiplier for training effects
  maintenanceCost: number; // Weekly maintenance cost
}

/** Coaching staff */
export interface CoachingStaff {
  id: EntityId;
  clubId: EntityId;
  name: string;
  role: 'head_coach' | 'assistant_coach' | 'fitness_coach' | 'goalkeeping_coach' | 'youth_coach';
  coachingAbility: number; // 1-100
  judgingAbility: number; // 1-100
  judgingPotential: number; // 1-100
  personality: 'attacking' | 'defensive' | 'balanced' | 'technical' | 'physical';
  salary: number;
}

/** Training config for a club */
export interface TrainingConfig {
  clubId: EntityId;
  intensity: TrainingIntensity;
  focus: TrainingCategory[];
  individualTrainingSlots: number; // How many players can have individual training
  youthTrainingQuality: number; // 1-100
}

// ============================================
// TRAINING CONSTANTS
// ============================================

/** Base training effects per intensity level */
export const BASE_TRAINING_EFFECTS: Record<TrainingIntensity, number> = {
  1: 0.5,  // Very light
  2: 1.0,  // Light
  3: 1.5,  // Moderate
  4: 2.0,  // Heavy
  5: 2.5,  // Very heavy
};

/** Training category multipliers */
export const TRAINING_CATEGORY_MULTIPLIERS: Record<TrainingCategory, number> = {
  physical: 1.0,
  technical: 1.2,
  mental: 0.8,
  tactical: 1.0,
  goalkeeping: 1.1,
};

/** Attribute to category mapping */
export const ATTRIBUTE_TO_CATEGORY: Record<TrainingFocusArea, TrainingCategory> = {
  // Physical
  stamina: 'physical',
  strength: 'physical',
  pace: 'physical',
  acceleration: 'physical',
  agility: 'physical',
  balance: 'physical',
  jumping_reach: 'physical',
  natural_fitness: 'physical',
  
  // Technical
  passing: 'technical',
  shooting: 'technical',
  dribbling: 'technical',
  ball_control: 'technical',
  first_touch: 'technical',
  heading: 'technical',
  crossing: 'technical',
  finishing: 'technical',
  long_shots: 'technical',
  set_pieces: 'technical',
  penalty_taking: 'technical',
  
  // Mental
  aggression: 'mental',
  anticipation: 'mental',
  composure: 'mental',
  concentration: 'mental',
  creativity: 'mental',
  decisions: 'mental',
  determination: 'mental',
  flair: 'mental',
  leadership: 'mental',
  off_the_ball: 'mental',
  positioning: 'mental',
  teamwork: 'mental',
  vision: 'mental',
  work_rate: 'mental',
  
  // Tactical (same as mental for now)
  game_understanding: 'mental',
  tactical_awareness: 'mental',
  
  // Goalkeeping
  handling: 'goalkeeping',
  reflexes: 'goalkeeping',
  aerial_ability: 'goalkeeping',
  distribution: 'goalkeeping',
  command_of_area: 'goalkeeping',
  one_on_ones: 'goalkeeping',
};

/** Maximum attribute improvement per week per attribute */
export const MAX_WEEKLY_IMPROVEMENT: number = 2.0;

/** Minimum attribute improvement per week per attribute */
export const MIN_WEEKLY_IMPROVEMENT: number = 0.0;

/** Training facility quality effects */
export const FACILITY_QUALITY_EFFECTS: Record<number, number> = {
  1: 0.5,  // Very poor
  2: 0.8,  // Poor
  3: 1.0,  // Average
  4: 1.2,  // Good
  5: 1.5,  // Excellent
};

/** Coaching ability effects */
export const COACHING_ABILITY_EFFECTS: Record<number, number> = {
  1: 0.5,   // Very poor
  50: 1.0,  // Average
  100: 1.5, // Excellent
};

// ============================================
// PLAYER DEVELOPMENT TYPES
// ============================================

/** Player development status */
export interface PlayerDevelopment {
  playerId: EntityId;
  currentAbility: number;
  potentialAbility: number;
  age: number;
  position: string;
  attributes: Record<string, number>;
  hiddenAttributes: Record<string, number>;
  developmentRate: number; // Attributes gained per week
  peakAge: number; // Age at which player peaks
  declineRate: number; // Attribute loss per week after peak
}

/** Development curve for a player */
export interface DevelopmentCurve {
  age: number;
  growthRate: number; // Multiplier for development (0-2)
  peakMultiplier: number; // Multiplier at peak (1.0 = no change)
  declineRate: number; // Multiplier for decline (0-1)
}

/** Development factors */
export interface DevelopmentFactors {
  professionalism: number; // 0-100
  consistency: number; // 0-100
  pressureHandling: number; // 0-100
  adaptability: number; // 0-100
  ambition: number; // 0-100
  loyalty: number; // 0-100
  trainingFacilities: number; // 1-5
  coachingQuality: number; // 0-100
  morale: number; // 0-100
  matchPerformance: number; // 0-10 (average rating)
  playingTime: number; // 0-100 (percentage of matches played)
}
