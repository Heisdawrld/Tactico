// TACTICO World Engine - Contract Types

import { EntityId, DateString } from '../core/types';

// ============================================
// CONTRACT TYPES
// ============================================

/** Contract type */
export type ContractType = 
  | 'full_time'
  | 'loan'
  | 'youth'
  | 'trial'
  | 'free_agent'
  | 'retired';

/** Contract status */
export type ContractStatus = 
  | 'active'
  | 'expiring'    // Within last 6 months
  | 'expired'
  | 'negotiating' // New contract being discussed
  | 'offered'     // New contract offered
  | 'accepted'   // New contract accepted
  | 'rejected'   // New contract rejected
  | 'terminated' // Contract terminated early
  | 'released';   // Player released by club

/** Player contract */
export interface PlayerContract {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  type: ContractType;
  startDate: DateString;
  expiryDate: DateString;
  // Financial terms
  wage: number; // Weekly wage in USD
  signingBonus: number; // One-time signing bonus
  releaseClause: number | null; // Minimum fee to buy out contract
  sellOnPercentage: number; // Percentage of future transfer fee (0-100)
  // Loan terms (if applicable)
  isLoan: boolean;
  parentClubId: EntityId | null; // Club that owns the player (for loans)
  loanExpiryDate: DateString | null;
  loanFee: number | null; // Fee paid to parent club for loan
  loanWagePercentage: number | null; // Percentage of wage paid by loaning club (0-100)
  // Status
  status: ContractStatus;
  // History
  createdAt: DateString;
  updatedAt: DateString;
}

/** Contract offer from a club */
export interface ContractOffer {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  type: ContractType;
  startDate: DateString;
  expiryDate: DateString;
  wage: number;
  signingBonus: number;
  releaseClause: number | null;
  sellOnPercentage: number;
  isLoan: boolean;
  loanExpiryDate: DateString | null;
  loanFee: number | null;
  loanWagePercentage: number | null;
  // Offer status
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  offeredAt: DateString;
  respondedAt: DateString | null;
  // Negotiation
  counterOffers: ContractOffer[];
}

/** Contract negotiation */
export interface ContractNegotiation {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId;
  offers: ContractOffer[];
  status: 'ongoing' | 'completed' | 'failed' | 'cancelled';
  startedAt: DateString;
  completedAt: DateString | null;
  notes: string;
}

/** Contract history for a player */
export interface PlayerContractHistory {
  playerId: EntityId;
  contracts: PlayerContract[];
  totalEarnings: number; // Total wages + bonuses earned
  longestContract: number; // Longest contract duration in days
  mostValuableContract: number; // Highest total value (wages + bonuses)
}

/** Contract clause */
export interface ContractClause {
  id: EntityId;
  contractId: EntityId;
  type: ClauseType;
  value: number | string | boolean;
  description: string;
}

/** Contract clause type */
export type ClauseType = 
  | 'release_clause'
  | 'sell_on_percentage'
  | 'appearance_bonus'
  | 'goal_bonus'
  | 'clean_sheet_bonus'
  | 'win_bonus'
  | 'relegation_clause'
  | 'promotion_bonus'
  | 'loyalty_bonus'
  | 'image_rights'
  | 'no_buyout_clause'
  | 'option_to_buy';

/** Bonus clause details */
export interface BonusClause {
  type: 'appearance' | 'goal' | 'assist' | 'clean_sheet' | 'win' | 'trophy';
  amount: number; // Bonus amount per occurrence
  threshold?: number; // Minimum threshold (e.g., 20 appearances)
  maxAmount?: number; // Maximum bonus per season
}

/** Contract template (for quick contract creation) */
export interface ContractTemplate {
  id: EntityId;
  name: string;
  description: string;
  type: ContractType;
  durationYears: number;
  wageMultiplier: number; // Multiplier based on player rating
  signingBonusMultiplier: number;
  releaseClauseMultiplier: number;
  sellOnPercentage: number;
  isDefault: boolean;
}

// ============================================
// TRANSFER TYPES
// ============================================

/** Transfer type */
export type TransferType = 
  | 'permanent'
  | 'loan'
  | 'loan_with_option'
  | 'free'
  | 'end_of_contract'
  | 'compensation';

/** Transfer status */
export type TransferStatus = 
  | 'negotiating'
  | 'agreed_personal_terms'
  | 'agreed_fee'
  | 'medical'
  | 'completed'
  | 'cancelled'
  | 'rejected_by_player'
  | 'rejected_by_club'
  | 'collapsed';

/** Transfer */
export interface Transfer {
  id: EntityId;
  playerId: EntityId;
  fromClubId: EntityId | null; // null for free agents
  toClubId: EntityId;
  type: TransferType;
  status: TransferStatus;
  // Financial terms
  fee: number; // Transfer fee in USD
  wage: number; // Weekly wage at new club
  signingBonus: number;
  sellOnPercentage: number; // 0-100
  // Loan terms
  isLoan: boolean;
  loanDuration: number | null; // In months
  loanExpiryDate: DateString | null;
  loanFee: number | null; // Fee for loan
  loanWagePercentage: number | null; // 0-100
  optionToBuy: boolean;
  optionFee: number | null; // Fee to make loan permanent
  // Timing
  announcedDate: DateString | null;
  completionDate: DateString | null;
  // People involved
  agentId: EntityId | null;
  agentFee: number | null; // Agent's commission
  // History
  createdAt: DateString;
  updatedAt: DateString;
}

/** Transfer bid */
export interface TransferBid {
  id: EntityId;
  transferId: EntityId;
  clubId: EntityId; // Club making the bid
  amount: number;
  installments: number | null; // Number of installments
  upfrontPercentage: number | null; // Percentage paid upfront
  addOns: TransferBidAddOn[];
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  bidDate: DateString;
  expiryDate: DateString | null;
}

/** Transfer bid add-on */
export interface TransferBidAddOn {
  type: 'appearance_bonus' | 'goal_bonus' | 'trophy_bonus' | 'sell_on_clause';
  value: number | string;
}

/** Transfer negotiation */
export interface TransferNegotiation {
  id: EntityId;
  transferId: EntityId;
  clubId: EntityId; // Club involved in negotiation
  type: 'fee' | 'wage' | 'bonus' | 'clause';
  currentValue: number | string;
  proposedValue: number | string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: DateString;
  resolvedAt: DateString | null;
}

/** Transfer window */
export interface TransferWindow {
  id: EntityId;
  name: string;
  competitionId: EntityId | null; // null for global windows
  startDate: DateString;
  endDate: DateString;
  isOpen: boolean;
  // Rules
  maxTransfers: number | null; // Maximum transfers per club
  maxSpending: number | null; // Maximum spending per club
  // History
  createdAt: DateString;
}

/** Transfer history for a player */
export interface PlayerTransferHistory {
  playerId: EntityId;
  transfers: Transfer[];
  totalTransferFees: number;
  highestFee: number;
  mostRecentTransfer: DateString | null;
}

/** Transfer market listing */
export interface TransferListing {
  id: EntityId;
  playerId: EntityId;
  clubId: EntityId | null; // null for free agents
  askingPrice: number | null;
  wageDemand: number | null;
  contractType: ContractType;
  listedAt: DateString;
  expiresAt: DateString | null;
  isActive: boolean;
  // Interest
  interestedClubs: EntityId[];
  bids: TransferBid[];
}

// ============================================
// AGENT TYPES
// ============================================

/** Agent */
export interface Agent {
  id: EntityId;
  personId: EntityId;
  name: string;
  nationality: string;
  // Attributes
  reputation: number; // 1-100
  negotiationSkill: number; // 1-100
  networkSize: number; // 1-100 (number of clubs/players connected)
  commissionRate: number; // 0-20 (percentage)
  // Clients
  playerClients: EntityId[];
  clubClients: EntityId[];
  // Finances
  earnings: number; // Total earnings from commissions
  // Status
  isActive: boolean;
  createdAt: DateString;
}

/** Agent commission */
export interface AgentCommission {
  id: EntityId;
  agentId: EntityId;
  transferId: EntityId;
  amount: number;
  percentage: number; // 0-100
  paid: boolean;
  paymentDate: DateString | null;
}

// ============================================
// CONTRACT CONSTANTS
// ============================================

/** Default contract durations by type (in years) */
export const DEFAULT_CONTRACT_DURATIONS: Record<ContractType, number> = {
  full_time: 4,
  loan: 1,
  youth: 2,
  trial: 0.5,
  free_agent: 0,
  retired: 0,
};

/** Minimum contract durations by type (in years) */
export const MIN_CONTRACT_DURATIONS: Record<ContractType, number> = {
  full_time: 1,
  loan: 0.5,
  youth: 1,
  trial: 0.1,
  free_agent: 0,
  retired: 0,
};

/** Maximum contract durations by type (in years) */
export const MAX_CONTRACT_DURATIONS: Record<ContractType, number> = {
  full_time: 5,
  loan: 2,
  youth: 3,
  trial: 1,
  free_agent: 0,
  retired: 0,
};

/** Default wage multipliers by player rating */
export const WAGE_MULTIPLIERS: Record<number, number> = {
  50: 10000,   // 50-rated player: $10,000/week
  60: 20000,   // 60-rated: $20,000
  70: 50000,   // 70-rated: $50,000
  80: 100000,  // 80-rated: $100,000
  90: 200000,  // 90-rated: $200,000
  100: 400000, // 100-rated: $400,000
};

/** Default signing bonus multipliers by player rating */
export const SIGNING_BONUS_MULTIPLIERS: Record<number, number> = {
  50: 100000,   // 50-rated: $100,000
  60: 250000,   // 60-rated: $250,000
  70: 500000,   // 70-rated: $500,000
  80: 1000000,  // 80-rated: $1M
  90: 2000000,  // 90-rated: $2M
  100: 5000000, // 100-rated: $5M
};

/** Default release clause multipliers by player rating */
export const RELEASE_CLAUSE_MULTIPLIERS: Record<number, number> = {
  50: 1000000,   // 50-rated: $1M
  60: 2500000,   // 60-rated: $2.5M
  70: 5000000,   // 70-rated: $5M
  80: 10000000,  // 80-rated: $10M
  90: 25000000,  // 90-rated: $25M
  100: 50000000, // 100-rated: $50M
};

/** Default sell-on percentage */
export const DEFAULT_SELL_ON_PERCENTAGE: number = 10; // 10%

/** Default loan wage percentage */
export const DEFAULT_LOAN_WAGE_PERCENTAGE: number = 50; // 50%

/** Default loan fee by player rating */
export const DEFAULT_LOAN_FEE: Record<number, number> = {
  50: 100000,   // 50-rated: $100,000
  60: 250000,   // 60-rated: $250,000
  70: 500000,   // 70-rated: $500,000
  80: 1000000,  // 80-rated: $1M
  90: 2000000,  // 90-rated: $2M
  100: 4000000, // 100-rated: $4M
};

/** Default option to buy fee by player rating */
export const DEFAULT_OPTION_FEE: Record<number, number> = {
  50: 500000,   // 50-rated: $500,000
  60: 1000000,  // 60-rated: $1M
  70: 2000000,  // 70-rated: $2M
  80: 4000000,  // 80-rated: $4M
  90: 8000000,  // 90-rated: $8M
  100: 15000000, // 100-rated: $15M
};

/** Contract expiry warning threshold (in days) */
export const CONTRACT_EXPIRY_WARNING_DAYS: number = 180; // 6 months

/** Contract expiry danger threshold (in days) */
export const CONTRACT_EXPIRY_DANGER_DAYS: number = 90; // 3 months
