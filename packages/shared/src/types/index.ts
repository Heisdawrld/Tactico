/**
 * Shared Type Definitions
 */

import type { Position, TacticalStyle, TransferWindow, Formation, Weather, MatchStatus } from '../constants';

// ... existing types ...

export interface Club {
  id: number;
  name: string;
  country: string;
  leagueId: number;
  reputation: number;
  finances: number;
  stadiumCapacity: number;
  trainingFacilities: number;
  youthAcademy: number;
  homeKitColor: string;
  awayKitColor: string;
}

export interface Match {
  id: number;
  homeClubId: number;
  awayClubId: number;
  competition: string;
  matchDate: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  weather: Weather;
}

export interface Tactics {
  id: number;
  userId: string;
  clubId: number;
  formation: Formation;
  instructions: {
    pressingIntensity: "low" | "medium" | "high";
    passingStyle: "short" | "long" | "mixed";
    defensiveLine: "low" | "medium" | "high";
  };
}

// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common attributes for football entities
export interface FootballEntity {
  name: string;
  shortName?: string;
  founded?: number;
  country: string;
  city?: string;
}

// Player basic info
export interface PlayerBase {
  firstName: string;
  lastName: string;
  commonName?: string;
  dateOfBirth: Date;
  nationality: string;
  secondNationality?: string;
  height: number; // cm
  weight: number; // kg
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
}

// Player attributes
export interface PlayerAttributes {
  // Technical
  crossing: number;
  dribbling: number;
  finishing: number;
  firstTouch: number;
  freeKickTaking: number;
  heading: number;
  longShots: number;
  longThrows: number;
  marking: number;
  passing: number;
  penaltyTaking: number;
  tackling: number;
  technique: number;

  // Physical
  acceleration: number;
  agility: number;
  balance: number;
  jumpingReach: number;
  naturalFitness: number;
  pace: number;
  stamina: number;
  strength: number;

  // Mental
  aggression: number;
  anticipation: number;
  bravery: number;
  composure: number;
  concentration: number;
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

// Hidden player attributes
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
}

// Contract details
export interface Contract {
  startDate: Date;
  expiryDate: Date;
  wage: number; // weekly
  releaseClause?: number;
  signingBonus?: number;
  agentFee?: number;
  performanceBonuses?: PerformanceBonus[];
}

export interface PerformanceBonus {
  type: 'APPEARANCES' | 'GOALS' | 'ASSISTS' | 'CLEAN_SHEETS' | 'TROPHIES';
  threshold: number;
  amount: number;
}

// Club finances
export interface ClubFinances {
  balance: number;
  transferBudget: number;
  wageBudget: number;
  remainingTransferBudget: number;
  remainingWageBudget: number;
  debt: number;
  revenue: number;
  expenses: number;
  profit: number;
}

// Match result
export interface MatchResult {
  homeScore: number;
  awayScore: number;
  homeXG?: number;
  awayXG?: number;
  attendance?: number;
  venue?: string;
  referee?: string;
}

// League table entry
export interface LeagueTableEntry {
  position: number;
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

// Season configuration
export interface SeasonConfig {
  startDate: Date;
  endDate: Date;
  transferWindows: {
    summer: { start: Date; end: Date };
    winter: { start: Date; end: Date };
  };
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
