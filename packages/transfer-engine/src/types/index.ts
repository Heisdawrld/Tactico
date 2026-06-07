/**
 * Transfer Engine Types
 * Core type definitions for the transfer market system
 */

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: string;
  currentAbility: number;
  potentialAbility: number;
  marketValue: number;
  wage: number;
  contractExpiry: Date;
  clubId: string | null;
  personality: Personality;
  ambition: number;
  loyalty: number;
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

export interface Club {
  id: string;
  name: string;
  finances: ClubFinances;
  reputation: number;
  tacticalNeeds: TacticalNeeds;
  scoutingNetwork: number;
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
  playerId: string;
  fromClubId: string;
  toClubId: string;
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
  actor: 'CLUB' | 'PLAYER' | 'AGENT';
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
  playerId: string;
  scoutAccuracy: number;
  reportedAbility: number;
  reportedPotential: number;
  uncertainty: number;
  recommendation: string;
}
