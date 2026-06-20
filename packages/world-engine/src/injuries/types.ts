// TACTICO World Engine - Injury Types

import { EntityId, DateString } from '../core/types';

// ============================================
// INJURY TYPES
// ============================================

/** Injury severity */
export type InjurySeverity = 'minor' | 'moderate' | 'serious' | 'career_ending';

/** Injury type */
export type InjuryType =
  | 'ankle_sprain'
  | 'hamstring_strain'
  | 'groin_strain'
  | 'calf_strain'
  | 'quadriceps_strain'
  | 'knee_ligament'
  | 'achilles_tendon'
  | 'concussion'
  | 'broken_bone'
  | 'muscle_tear'
  | 'shoulder_injury'
  | 'back_injury'
  | 'rib_injury'
  | 'wrist_injury'
  | 'finger_fracture'
  | 'nose_fracture'
  | 'eye_injury'
  | 'dental_injury';

/** Player injury */
export interface PlayerInjury {
  id: EntityId;
  playerId: EntityId;
  type: InjuryType;
  severity: InjurySeverity;
  durationDays: number;
  startDate: DateString;
  recoveryDate: DateString;
  isActive: boolean;
  // Context
  matchId?: EntityId; // Match where injury occurred
  minute?: number; // Minute of match when injury occurred
  opponentPlayerId?: EntityId; // Player who caused the injury (if foul)
  isFoul: boolean; // Whether injury was caused by a foul
  // Recovery
  recoveryProgress: number; // 0-100
  rehabStartDate?: DateString; // When rehab started
  setbackCount: number; // Number of setbacks in recovery
  // Medical
  requiresSurgery: boolean;
  surgeryDate?: DateString;
  surgerySuccess: boolean | null; // null = not yet performed
}

/** Injury risk factors */
export interface InjuryRiskFactors {
  playerId: EntityId;
  baseRisk: number; // 0-100
  positionRisk: number; // 0-100
  ageRisk: number; // 0-100
  injuryProneness: number; // 0-100 (hidden attribute)
  fitnessRisk: number; // 0-100 (based on current fitness)
  fatigueRisk: number; // 0-100 (based on current fatigue)
  playingTimeRisk: number; // 0-100 (based on recent playing time)
  weatherRisk: number; // 0-100 (based on weather conditions)
  opponentRisk: number; // 0-100 (based on opponent's physicality)
  totalRisk: number; // 0-100 (combined risk)
}

/** Injury prevention methods */
export interface InjuryPrevention {
  playerId: EntityId;
  warmUp: boolean;
  coolDown: boolean;
  stretching: boolean;
  strengthTraining: boolean;
  conditioning: boolean;
  restDays: number; // Days rested since last match
  medicalCheckups: number; // Frequency of medical checkups
  physiotherapy: boolean;
}

/** Recovery plan */
export interface RecoveryPlan {
  id: EntityId;
  injuryId: EntityId;
  playerId: EntityId;
  phases: RecoveryPhase[];
  currentPhase: number;
  estimatedRecoveryDate: DateString;
  actualRecoveryDate?: DateString;
  isComplete: boolean;
}

/** Recovery phase */
export interface RecoveryPhase {
  phase: number;
  name: string;
  description: string;
  durationDays: number;
  startDate?: DateString;
  endDate?: DateString;
  isComplete: boolean;
  activities: string[]; // e.g., ["rest", "light stretching", "physiotherapy"]
  restrictions: string[]; // e.g., ["no running", "no contact"]
}

/** Medical staff */
export interface MedicalStaff {
  id: EntityId;
  clubId: EntityId;
  name: string;
  role: 'physiotherapist' | 'doctor' | 'sports_scientist' | 'nutritionist' | 'massage_therapist';
  specialty?: string; // e.g., "knee injuries", "concussions"
  experience: number; // Years of experience
  reputation: number; // 1-100
  salary: number;
}

/** Medical facility */
export interface MedicalFacility {
  clubId: EntityId;
  level: number; // 1-5
  quality: number; // 1-100
  recoverySpeed: number; // -50 to +50 (percentage improvement in recovery time)
  injuryPrevention: number; // -50 to +50 (percentage reduction in injury risk)
  surgerySuccessRate: number; // 0-100
  staff: MedicalStaff[];
}

/** Injury history for a player */
export interface PlayerInjuryHistory {
  playerId: EntityId;
  injuries: PlayerInjury[];
  totalInjuries: number;
  totalDaysInjured: number;
  mostSevereInjury: InjurySeverity | null;
  mostCommonInjuryType: InjuryType | null;
  injuryFreeStreak: number; // Days since last injury
}

/** Injury report */
export interface InjuryReport {
  playerId: EntityId;
  injuryId: EntityId;
  type: InjuryType;
  severity: InjurySeverity;
  estimatedRecoveryTime: number; // In days
  actualRecoveryTime?: number; // In days
  date: DateString;
  matchContext?: {
    matchId: EntityId;
    minute: number;
    opponentPlayerId: EntityId;
    isFoul: boolean;
  };
  recoveryPlan: RecoveryPlan;
  preventionRecommendations: string[];
}

// ============================================
// INJURY CONSTANTS
// ============================================

/** Base injury rates per position (injuries per 1000 minutes) */
export const BASE_INJURY_RATES: Record<string, number> = {
  GK: 0.5,
  CB: 1.2,
  RB: 1.5,
  LB: 1.5,
  CDM: 1.8,
  CM: 1.5,
  CAM: 1.0,
  RW: 1.8,
  LW: 1.8,
  ST: 1.2,
  DEFAULT: 1.0,
};

/** Injury type probabilities by position */
export const INJURY_TYPE_PROBABILITIES: Record<string, Record<InjuryType, number>> = {
  GK: {
    ankle_sprain: 0.20,
    hamstring_strain: 0.10,
    groin_strain: 0.10,
    knee_ligament: 0.15,
    achilles_tendon: 0.05,
    concussion: 0.05,
    broken_bone: 0.10,
    muscle_tear: 0.05,
    shoulder_injury: 0.10,
    finger_fracture: 0.10,
  },
  CB: {
    ankle_sprain: 0.25,
    hamstring_strain: 0.15,
    groin_strain: 0.10,
    knee_ligament: 0.20,
    achilles_tendon: 0.05,
    concussion: 0.10,
    broken_bone: 0.05,
    muscle_tear: 0.05,
    shoulder_injury: 0.03,
    back_injury: 0.02,
  },
  RB: {
    ankle_sprain: 0.30,
    hamstring_strain: 0.20,
    groin_strain: 0.10,
    knee_ligament: 0.15,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.05,
    broken_bone: 0.03,
    muscle_tear: 0.02,
  },
  LB: {
    ankle_sprain: 0.30,
    hamstring_strain: 0.20,
    groin_strain: 0.10,
    knee_ligament: 0.15,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.05,
    broken_bone: 0.03,
    muscle_tear: 0.02,
  },
  CDM: {
    ankle_sprain: 0.25,
    hamstring_strain: 0.15,
    groin_strain: 0.10,
    knee_ligament: 0.20,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.08,
    broken_bone: 0.05,
    muscle_tear: 0.02,
  },
  CM: {
    ankle_sprain: 0.20,
    hamstring_strain: 0.15,
    groin_strain: 0.10,
    knee_ligament: 0.15,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.08,
    broken_bone: 0.05,
    muscle_tear: 0.05,
    rib_injury: 0.02,
  },
  CAM: {
    ankle_sprain: 0.15,
    hamstring_strain: 0.20,
    groin_strain: 0.15,
    knee_ligament: 0.10,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.08,
    muscle_tear: 0.05,
    rib_injury: 0.05,
    back_injury: 0.02,
  },
  RW: {
    ankle_sprain: 0.25,
    hamstring_strain: 0.25,
    groin_strain: 0.15,
    knee_ligament: 0.10,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.05,
    broken_bone: 0.03,
    muscle_tear: 0.02,
  },
  LW: {
    ankle_sprain: 0.25,
    hamstring_strain: 0.25,
    groin_strain: 0.15,
    knee_ligament: 0.10,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.05,
    broken_bone: 0.03,
    muscle_tear: 0.02,
  },
  ST: {
    ankle_sprain: 0.20,
    hamstring_strain: 0.25,
    groin_strain: 0.15,
    knee_ligament: 0.10,
    achilles_tendon: 0.05,
    calf_strain: 0.08,
    quadriceps_strain: 0.07,
    broken_bone: 0.05,
    muscle_tear: 0.03,
    rib_injury: 0.02,
  },
  DEFAULT: {
    ankle_sprain: 0.20,
    hamstring_strain: 0.20,
    groin_strain: 0.10,
    knee_ligament: 0.15,
    achilles_tendon: 0.05,
    calf_strain: 0.10,
    quadriceps_strain: 0.08,
    broken_bone: 0.05,
    muscle_tear: 0.03,
    concussion: 0.02,
  },
};

/** Injury severity distribution */
export const INJURY_SEVERITY_DISTRIBUTION: Record<InjuryType, Record<InjurySeverity, number>> = {
  ankle_sprain: { minor: 0.7, moderate: 0.25, serious: 0.05, career_ending: 0 },
  hamstring_strain: { minor: 0.4, moderate: 0.4, serious: 0.2, career_ending: 0 },
  groin_strain: { minor: 0.6, moderate: 0.3, serious: 0.1, career_ending: 0 },
  calf_strain: { minor: 0.8, moderate: 0.15, serious: 0.05, career_ending: 0 },
  quadriceps_strain: { minor: 0.5, moderate: 0.35, serious: 0.15, career_ending: 0 },
  knee_ligament: { minor: 0, moderate: 0.3, serious: 0.6, career_ending: 0.1 },
  achilles_tendon: { minor: 0.1, moderate: 0.4, serious: 0.4, career_ending: 0.1 },
  concussion: { minor: 0.8, moderate: 0.15, serious: 0.05, career_ending: 0 },
  broken_bone: { minor: 0, moderate: 0.2, serious: 0.6, career_ending: 0.2 },
  muscle_tear: { minor: 0, moderate: 0.3, serious: 0.6, career_ending: 0.1 },
  shoulder_injury: { minor: 0.5, moderate: 0.4, serious: 0.1, career_ending: 0 },
  back_injury: { minor: 0.4, moderate: 0.4, serious: 0.15, career_ending: 0.05 },
  rib_injury: { minor: 0.6, moderate: 0.3, serious: 0.1, career_ending: 0 },
  wrist_injury: { minor: 0.8, moderate: 0.15, serious: 0.05, career_ending: 0 },
  finger_fracture: { minor: 0.9, moderate: 0.1, serious: 0, career_ending: 0 },
  nose_fracture: { minor: 0.7, moderate: 0.25, serious: 0.05, career_ending: 0 },
  eye_injury: { minor: 0.8, moderate: 0.15, serious: 0.05, career_ending: 0 },
  dental_injury: { minor: 0.95, moderate: 0.05, serious: 0, career_ending: 0 },
};

/** Base recovery times by injury type and severity (in days) */
export const BASE_RECOVERY_TIMES: Record<InjuryType, Record<InjurySeverity, number>> = {
  ankle_sprain: { minor: 7, moderate: 14, serious: 21, career_ending: 0 },
  hamstring_strain: { minor: 10, moderate: 21, serious: 42, career_ending: 0 },
  groin_strain: { minor: 7, moderate: 14, serious: 28, career_ending: 0 },
  calf_strain: { minor: 5, moderate: 10, serious: 14, career_ending: 0 },
  quadriceps_strain: { minor: 7, moderate: 14, serious: 28, career_ending: 0 },
  knee_ligament: { minor: 0, moderate: 28, serious: 180, career_ending: 365 },
  achilles_tendon: { minor: 14, moderate: 42, serious: 180, career_ending: 365 },
  concussion: { minor: 7, moderate: 14, serious: 21, career_ending: 0 },
  broken_bone: { minor: 0, moderate: 28, serious: 90, career_ending: 365 },
  muscle_tear: { minor: 0, moderate: 21, serious: 90, career_ending: 365 },
  shoulder_injury: { minor: 7, moderate: 14, serious: 28, career_ending: 0 },
  back_injury: { minor: 7, moderate: 14, serious: 30, career_ending: 90 },
  rib_injury: { minor: 10, moderate: 21, serious: 30, career_ending: 0 },
  wrist_injury: { minor: 7, moderate: 14, serious: 21, career_ending: 0 },
  finger_fracture: { minor: 7, moderate: 14, serious: 0, career_ending: 0 },
  nose_fracture: { minor: 7, moderate: 14, serious: 21, career_ending: 0 },
  eye_injury: { minor: 3, moderate: 7, serious: 14, career_ending: 0 },
  dental_injury: { minor: 3, moderate: 7, serious: 0, career_ending: 0 },
};

/** Recovery time modifiers */
export const RECOVERY_TIME_MODIFIERS: Record<string, number> = {
  // Player attributes
  natural_fitness: -0.02, // Higher fitness = faster recovery
  stamina: -0.01,
  strength: -0.01,
  
  // Medical factors
  medical_facility_level: -0.05, // Higher level = faster recovery
  physiotherapy: -0.1,
  surgery_success: -0.2,
  
  // Other factors
  age: 0.005, // Older players recover slower
  setback: 0.1, // Each setback adds 10% to recovery time
  
  // Weather (for outdoor recovery)
  good_weather: -0.05,
  bad_weather: 0.05,
};

/** Injury risk modifiers */
export const INJURY_RISK_MODIFIERS: Record<string, number> = {
  // Player attributes
  injury_proneness: 0.01, // Higher proneness = higher risk
  natural_fitness: -0.005, // Higher fitness = lower risk
  stamina: -0.005,
  strength: -0.003,
  agility: -0.002,
  balance: -0.002,
  
  // Player state
  fatigue: 0.01, // Higher fatigue = higher risk
  morale: -0.002, // Higher morale = lower risk
  sharpness: -0.003, // Higher sharpness = lower risk
  
  // Playing conditions
  wet_pitch: 0.1,
  hard_pitch: 0.05,
  high_temperature: 0.05,
  low_temperature: 0.03,
  
  // Opponent
  opponent_aggression: 0.005,
  opponent_physicality: 0.003,
  
  // Match context
  high_intensity: 0.1,
  derbies: 0.15,
  cup_matches: 0.05,
};

/** Default recovery phases */
export const DEFAULT_RECOVERY_PHASES: Record<InjuryType, RecoveryPhase[]> = {
  ankle_sprain: [
    { phase: 1, name: 'Rest and Ice', description: 'Rest the ankle, apply ice to reduce swelling', durationDays: 3, activities: ['rest', 'ice'], restrictions: ['no weight bearing', 'no running'] },
    { phase: 2, name: 'Light Movement', description: 'Begin light movement and stretching', durationDays: 4, activities: ['light stretching', 'physiotherapy'], restrictions: ['no running', 'no jumping'] },
    { phase: 3, name: 'Strengthening', description: 'Strengthen the ankle with exercises', durationDays: 7, activities: ['strength exercises', 'balance training'], restrictions: ['no contact'] },
    { phase: 4, name: 'Return to Training', description: 'Gradually return to full training', durationDays: 7, activities: ['light training', 'running'], restrictions: [] },
  ],
  hamstring_strain: [
    { phase: 1, name: 'Rest', description: 'Complete rest to allow healing', durationDays: 5, activities: ['rest', 'ice'], restrictions: ['no movement'] },
    { phase: 2, name: 'Light Stretching', description: 'Gentle stretching to maintain flexibility', durationDays: 5, activities: ['light stretching'], restrictions: ['no running', 'no kicking'] },
    { phase: 3, name: 'Strengthening', description: 'Strengthen the hamstring and surrounding muscles', durationDays: 10, activities: ['strength exercises', 'physiotherapy'], restrictions: ['no sprinting'] },
    { phase: 4, name: 'Return to Training', description: 'Gradually return to full training', durationDays: 10, activities: ['light training', 'jogging'], restrictions: [] },
  ],
  knee_ligament: [
    { phase: 1, name: 'Rest and Immobilization', description: 'Rest and immobilize the knee', durationDays: 14, activities: ['rest', 'ice'], restrictions: ['no weight bearing', 'no movement'] },
    { phase: 2, name: 'Physiotherapy', description: 'Begin physiotherapy to restore movement', durationDays: 14, activities: ['physiotherapy', 'light movement'], restrictions: ['no running', 'no jumping'] },
    { phase: 3, name: 'Strengthening', description: 'Strengthen the knee and surrounding muscles', durationDays: 28, activities: ['strength exercises', 'balance training'], restrictions: ['no contact'] },
    { phase: 4, name: 'Return to Training', description: 'Gradually return to full training', durationDays: 28, activities: ['light training', 'running'], restrictions: [] },
  ],
  // Add more injury types as needed
  DEFAULT: [
    { phase: 1, name: 'Rest', description: 'Complete rest', durationDays: 7, activities: ['rest'], restrictions: ['no training', 'no matches'] },
    { phase: 2, name: 'Recovery', description: 'Light recovery activities', durationDays: 7, activities: ['light stretching', 'physiotherapy'], restrictions: ['no intense training'] },
    { phase: 3, name: 'Return', description: 'Gradual return to normal activities', durationDays: 7, activities: ['light training'], restrictions: [] },
  ],
};
