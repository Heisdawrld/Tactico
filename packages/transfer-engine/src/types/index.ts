/**
 * Transfer Engine Types
 * Core type definitions for the transfer market system
 *
 * Aligned with frontend types in apps/frontend/src/types/player.ts and club.ts
 */

// Re-export frontend types for compatibility
export type { Player } from '../../../../apps/frontend/src/types/player';
export type { Club } from '../../../../apps/frontend/src/types/club';

/**
 * Extended Player type with transfer-specific fields.
 * Uses frontend Player as base, adds personality traits.
 */
export interface TransferPlayer {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: string;
  overallRating: number;
  potentialRating: number;
  marketValue: number;
  wage: number;
  contractExpires: string | null;
  clubId: number;
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

/**
 * Extended Club type with transfer-specific fields.
 * Uses frontend Club as base, adds financial details.
 */
export interface TransferClub {
  id: number;
  name: string;
  reputation: number;
  balance: number;
  wageBudget: number;
  transferBudget: number;
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
