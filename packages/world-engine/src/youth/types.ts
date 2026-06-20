// TACTICO World Engine - Youth Types

import { EntityId, DateString, Player, Club } from '../core/types';

// ============================================
// YOUTH TYPES
// ============================================

/** Youth intake */
export interface YouthIntake {
  id: EntityId;
  clubId: EntityId;
  date: DateString;
  quality: number; // 1-100 (quality of this intake)
  numberOfPlayers: number;
  players: YouthPlayer[];
  // Stats
  averageCurrentAbility: number;
  averagePotentialAbility: number;
  bestPlayer: YouthPlayer | null;
}

/** Youth player (newly generated) */
export interface YouthPlayer {
  id: EntityId;
  clubId: EntityId;
  intakeId: EntityId;
  // Personal info
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: DateString;
  age: number;
  height: number; // cm
  weight: number; // kg
  // Position
  position: string;
  foot: 'left' | 'right' | 'both';
  // Attributes
  attributes: Record<string, number>; // Technical, physical, mental
  hiddenAttributes: Record<string, number>;
  // Potential
  currentAbility: number; // 1-100
  potentialAbility: number; // 1-100
  potentialRating: 'world_class' | 'elite' | 'great' | 'good' | 'decent' | 'limited';
  // Development
  developmentRate: number; // Attributes gained per week
  peakAge: number; // Age at which player will peak
  // Contract
  contract: {
    type: 'youth';
    startDate: DateString;
    expiryDate: DateString;
    wage: number;
  };
  // Appearance
  appearance: {
    skinTone: string;
    hairColor: string;
    hairStyle: string;
    facialHair: string;
    build: string;
  };
}

/** Youth academy */
export interface YouthAcademy {
  clubId: EntityId;
  level: number; // 1-5
  quality: number; // 1-100
  reputation: number; // 1-100
  // Facilities
  trainingFacilities: number; // 1-5
  medicalFacilities: number; // 1-5
  accommodation: number; // 1-5
  // Staff
  coaches: YouthCoach[];
  scouts: YouthScout[];
  // Production
  playersProduced: number;
  playersGraduated: number; // Promoted to senior team
  averagePotential: number;
  // Finances
  budget: number; // Annual budget in USD
  weeklyCost: number; // Weekly maintenance cost
}

/** Youth coach */
export interface YouthCoach {
  id: EntityId;
  name: string;
  nationality: string;
  age: number;
  // Attributes
  coachingAbility: number; // 1-100
  judgingPotential: number; // 1-100
  manManagement: number; // 1-100
  technicalKnowledge: number; // 1-100
  mentalKnowledge: number; // 1-100
  // Specialization
  preferredPositions: string[];
  // Employment
  clubId: EntityId;
  startDate: DateString;
  salary: number;
  reputation: number; // 1-100
}

/** Youth scout */
export interface YouthScout {
  id: EntityId;
  name: string;
  nationality: string;
  // Attributes
  judgingAbility: number; // 1-100
  judgingPotential: number; // 1-100
  knowledge: number; // 1-100
  // Regions
  preferredRegions: string[]; // e.g., ['Africa', 'South America']
  // Employment
  clubId: EntityId;
  startDate: DateString;
  salary: number;
  reputation: number; // 1-100
}

/** Youth development plan */
export interface YouthDevelopmentPlan {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  // Goals
  targetAttributes: Record<string, number>; // Target values for each attribute
  targetPotential: number; // Target potential ability
  // Training focus
  primaryFocus: string[]; // e.g., ['passing', 'vision', 'composure']
  secondaryFocus: string[]; // e.g., ['dribbling', 'pace']
  // Progress tracking
  currentProgress: Record<string, number>; // Current progress towards goals
  lastUpdated: DateString;
  // Mentorship
  mentorId: EntityId | null; // Senior player acting as mentor
  // Notes
  notes: string;
}

/** Youth academy upgrade */
export interface YouthAcademyUpgrade {
  id: EntityId;
  clubId: EntityId;
  upgradeType: 'facilities' | 'coaching' | 'scouting' | 'accommodation' | 'medical';
  oldLevel: number;
  newLevel: number;
  cost: number;
  date: DateString;
  completed: boolean;
}

/** Youth player graduation */
export interface YouthGraduation {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  date: DateString;
  newContract: {
    type: 'full_time' | 'loan';
    startDate: DateString;
    expiryDate: DateString;
    wage: number;
  };
  // Performance since graduation
  seniorAppearances: number;
  seniorGoals: number;
  seniorAssists: number;
  successRating: number; // 1-100 (how successful the graduate has been)
}

/** Youth intake schedule */
export interface YouthIntakeSchedule {
  clubId: EntityId;
  intakeFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextIntakeDate: DateString;
  intakeDay: number; // Day of month (1-28)
  qualityTarget: number; // Target quality (1-100)
}

/** Youth scouting report */
export interface YouthScoutingReport {
  id: EntityId;
  scoutId: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  reportDate: DateString;
  // Assessment
  currentAbility: number;
  potentialAbility: number;
  confidence: number; // 0-100 (scout's confidence in assessment)
  // Attribute ratings
  attributeRatings: Record<string, { rating: number; confidence: number }>;
  // Recommendations
  recommendedAction: 'sign' | 'monitor' | 'reject' | 'trial';
  notes: string;
  // Follow-up
  followUpDate: DateString | null;
  followUpNotes: string;
}

// ============================================
// YOUTH CONSTANTS
// ============================================

/** Youth intake frequency */
export const YOUTH_INTAKE_FREQUENCY = {
  weekly: 7,     // Days between intakes
  monthly: 30,   // Days between intakes
  quarterly: 90, // Days between intakes
  yearly: 365,   // Days between intakes
};

/** Base number of youth players per intake by academy level */
export const BASE_YOUTH_PLAYERS_PER_INTAKE: Record<number, number> = {
  1: 2,  // Very poor academy
  2: 4,  // Poor academy
  3: 6,  // Average academy
  4: 8,  // Good academy
  5: 10, // Excellent academy
};

/** Youth player quality modifiers by academy level */
export const YOUTH_QUALITY_MODIFIERS: Record<number, number> = {
  1: 0.5,  // Very poor academy
  2: 0.8,  // Poor academy
  3: 1.0,  // Average academy
  4: 1.3,  // Good academy
  5: 1.6,  // Excellent academy
};

/** Youth player potential modifiers by nation youth quality */
export const NATION_YOUTH_MODIFIERS: Record<number, number> = {
  0: 0.5,
  25: 0.8,
  50: 1.0,
  75: 1.2,
  100: 1.5,
};

/** Youth player attribute ranges by potential */
export const YOUTH_ATTRIBUTE_RANGES: Record<string, { min: number; max: number }> = {
  world_class: { min: 70, max: 90 },
  elite: { min: 65, max: 85 },
  great: { min: 60, max: 80 },
  good: { min: 55, max: 75 },
  decent: { min: 50, max: 70 },
  limited: { min: 40, max: 60 },
};

/** Youth player position distribution */
export const YOUTH_POSITION_DISTRIBUTION: Record<string, number> = {
  GK: 0.05,
  CB: 0.15,
  RB: 0.10,
  LB: 0.10,
  CDM: 0.10,
  CM: 0.15,
  CAM: 0.05,
  RW: 0.10,
  LW: 0.10,
  ST: 0.10,
};

/** Youth player foot preference distribution */
export const YOUTH_FOOT_PREFERENCE: Record<'right' | 'left' | 'both', number> = {
  right: 0.85,
  left: 0.10,
  both: 0.05,
};

/** Youth development rates by potential */
export const YOUTH_DEVELOPMENT_RATES: Record<string, number> = {
  world_class: 0.5,
  elite: 0.4,
  great: 0.3,
  good: 0.2,
  decent: 0.15,
  limited: 0.1,
};

/** Youth academy upgrade costs (in USD) */
export const YOUTH_ACADEMY_UPGRADE_COSTS: Record<string, number[]> = {
  training_facilities: [0, 1000000, 2500000, 5000000, 10000000],
  medical_facilities: [0, 500000, 1500000, 3000000, 6000000],
  accommodation: [0, 500000, 1000000, 2000000, 4000000],
  coaching: [0, 200000, 500000, 1000000, 2000000],
  scouting: [0, 300000, 800000, 1500000, 3000000],
};

/** Youth academy weekly costs (in USD) */
export const YOUTH_ACADEMY_WEEKLY_COSTS: Record<string, number[]> = {
  training_facilities: [0, 20000, 50000, 100000, 200000],
  medical_facilities: [0, 10000, 30000, 60000, 120000],
  accommodation: [0, 10000, 20000, 40000, 80000],
  coaching: [0, 50000, 100000, 200000, 400000],
  scouting: [0, 30000, 70000, 150000, 300000],
};

/** Youth coach salary by ability */
export const YOUTH_COACH_SALARIES: Record<number, number> = {
  50: 50000,   // Average coach
  70: 100000,  // Good coach
  85: 200000,  // Excellent coach
  100: 300000, // World-class coach
};

/** Youth scout salary by ability */
export const YOUTH_SCOUT_SALARIES: Record<number, number> = {
  50: 40000,   // Average scout
  70: 80000,   // Good scout
  85: 150000,  // Excellent scout
  100: 250000, // World-class scout
};

/** Youth player wage by potential */
export const YOUTH_PLAYER_WAGES: Record<string, number> = {
  world_class: 10000,
  elite: 5000,
  great: 2500,
  good: 1000,
  decent: 500,
  limited: 250,
};

/** Youth contract duration (in years) */
export const YOUTH_CONTRACT_DURATION = 2;

/** Minimum age for youth players */
export const MIN_YOUTH_AGE = 15;

/** Maximum age for youth players */
export const MAX_YOUTH_AGE = 21;

/** Age at which youth players must be graduated or released */
export const YOUTH_GRADUATION_AGE = 19;

/** Probability of youth player making it to senior team by potential */
export const YOUTH_GRADUATION_PROBABILITIES: Record<string, number> = {
  world_class: 0.90,
  elite: 0.75,
  great: 0.60,
  good: 0.40,
  decent: 0.20,
  limited: 0.05,
};
