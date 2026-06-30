/**
 * Transfer Engine Types
 * Core type definitions for the transfer market system
 *
 * Field names aligned with frontend types (apps/frontend/src/types/player.ts and club.ts)
 * for seamless integration. IDs are `number`, ratings use `overallRating`/`potentialRating`.
 */

// ============================================
// PLAYER TYPE (aligned with frontend)
// ============================================

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  age: number;
  dateOfBirth?: string | null;
  nationality?: string;
  nationalityCode?: string | null;
  clubId: number;
  clubName?: string;
  clubShort?: string;
  clubColor?: string;
  position: string;
  secondaryPositions?: string | null;
  foot?: string | null;
  height?: number | null;
  weight?: number | null;
  shirtNumber?: number | null;
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
  injuryStatus: 'fit' | 'injured' | 'suspended';
  injury?: string | null;
  marketValue?: number;
  contractExpires?: string | null;
  appearances?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  averageRating?: number;
  // Transfer-specific personality traits (optional)
  personality?: Personality;
  ambition?: number;
  loyalty?: number;
}

export interface Personality {
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

// ============================================
// CLUB TYPE (aligned with frontend)
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
  // Transfer-specific fields
  tacticalNeeds?: TacticalNeeds;
  scoutingNetwork?: number;
}

export interface ClubFinances {
  budget: number;
  wageBudget: number;
  debt: number;
  revenue: number;
}

export interface TacticalNeeds {
  positions: Record<string, number>; // position -> priority (1-10)
  playingStyle: string;
}

// ============================================
// TRANSFER TYPES
// ============================================

export interface TransferOffer {
  id: string;
  playerId: number;
  fromClubId: number;
  toClubId: number;
  offerAmount: number;
  wageOffer: number;
  contractLength: number; // years
  status: TransferStatus;
  createdAt: Date;
  expiresAt: Date;
  agentFee?: number;
  addOns?: AddOnClause[];
}

export type TransferStatus = 
  | 'PENDING'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'WITHDRAWN';

export interface AddOnClause {
  type: 'APPEARANCES' | 'GOALS' | 'TROPHIES' | 'INTERNATIONAL_CAPS';
  threshold: number;
  amount: number;
}

export interface NegotiationState {
  offerId: string;
  currentStep: number;
  history: NegotiationHistory[];
  playerInterest: number; // 0-100
  clubInterest: number; // 0-100
  likelihood: number; // 0-100
}

export interface NegotiationHistory {
  timestamp: Date;
  actor: 'CLUB' | 'PLAYER' | 'AGENT' | 'BOTH';
  action: string;
  details: string;
}

export interface TransferMarketConfig {
  transferWindowOpen: boolean;
  windowType: 'SUMMER' | 'WINTER' | 'CLOSED';
  deadlineDate: Date;
  maxTransferLength: number; // years
  minTransferLength: number; // years
  agentFeePercentage: number;
}

export interface MarketAnalysis {
  averagePrices: Record<string, number>; // position -> avg price
  trendData: PriceTrend[];
  demandSupply: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'>;
}

export interface PriceTrend {
  date: Date;
  position: string;
  averagePrice: number;
  volume: number;
}

export interface ScoutReport {
  playerId: number;
  scoutAccuracy: number;
  reportedAbility: number;
  reportedPotential: number;
  uncertainty: number;
  recommendation: string;
}
