// TACTICO World Engine - Finance Types

import { EntityId, DateString } from '../core/types';

// ============================================
// FINANCE TYPES
// ============================================

/** Financial transaction type */
export type TransactionType = 'income' | 'expense';

/** Financial category */
export type FinancialCategory =
  | 'sponsorship'
  | 'ticket_sales'
  | 'tv_revenue'
  | 'merchandise'
  | 'transfer_fee_in'
  | 'transfer_fee_out'
  | 'loan_fee_in'
  | 'loan_fee_out'
  | 'wages'
  | 'signing_bonus'
  | 'release_clause'
  | 'facility_maintenance'
  | 'youth_academy'
  | 'scouting'
  | 'medical'
  | 'other_income'
  | 'other_expense'
  | 'fine'
  | 'prize_money';

/** Financial transaction */
export interface FinancialTransaction {
  id: EntityId;
  clubId: EntityId;
  type: TransactionType;
  category: FinancialCategory;
  amount: number; // In USD
  description: string;
  date: DateString;
  relatedEntityId?: EntityId; // e.g., playerId for wages, matchId for prize money
  relatedEntityType?: string; // e.g., 'player', 'match', 'facility'
}

/** Club financial state */
export interface ClubFinancialState {
  clubId: EntityId;
  balance: number; // Current balance in USD
  wageBudget: number; // Weekly wage budget
  transferBudget: number; // Budget for transfers
  weeklyIncome: number; // Average weekly income
  weeklyExpenses: number; // Average weekly expenses
  monthlyIncome: number; // Average monthly income
  monthlyExpenses: number; // Average monthly expenses
}

/** Club budget */
export interface ClubBudget {
  clubId: EntityId;
  wageBudget: number;
  transferBudget: number;
  allocated: number; // Amount already allocated
  remaining: number; // Remaining budget
}

/** Sponsorship */
export interface Sponsorship {
  id: EntityId;
  clubId: EntityId;
  sponsorName: string;
  type: 'kit' | 'stadium' | 'sleeve' | 'training_ground' | 'other';
  startDate: DateString;
  endDate: DateString;
  annualValue: number; // Annual value in USD
  currency: string; // e.g., 'USD', 'EUR', 'GBP'
  isActive: boolean;
}

/** Prize money distribution */
export interface PrizeMoney {
  competitionId: EntityId;
  season: number;
  champion: number;
  second: number;
  third: number;
  fourth: number;
  fifth?: number;
  // For knockout competitions
  roundOf16?: number;
  quarterFinal?: number;
  semiFinal?: number;
  runnerUp?: number;
}

/** TV revenue distribution */
export interface TVRevenue {
  competitionId: EntityId;
  season: number;
  totalPool: number;
  distribution: {
    champion: number; // percentage
    second: number;
    third: number;
    fourth: number;
    others: number; // percentage for all other teams
  };
}

/** Financial report for a club */
export interface FinancialReport {
  clubId: EntityId;
  startDate: DateString;
  endDate: DateString;
  income: {
    total: number;
    byCategory: Record<FinancialCategory, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<FinancialCategory, number>;
  };
  profit: number;
  balanceChange: number;
  transactions: FinancialTransaction[];
}

/** Financial forecast */
export interface FinancialForecast {
  clubId: EntityId;
  months: number; // Number of months to forecast
  projectedIncome: number;
  projectedExpenses: number;
  projectedProfit: number;
  projectedBalance: number;
  warnings: string[]; // e.g., "Wage budget exceeded", "Transfer budget low"
}

/** Facility costs */
export interface FacilityCosts {
  trainingFacilities: {
    level: number; // 1-5
    upgradeCost: number;
    maintenanceCost: number; // Weekly
  };
  youthAcademy: {
    level: number;
    upgradeCost: number;
    maintenanceCost: number;
  };
  stadium: {
    capacity: number;
    upgradeCost: number;
    maintenanceCost: number;
  };
  medicalCenter: {
    level: number;
    upgradeCost: number;
    maintenanceCost: number;
  };
  scoutingNetwork: {
    level: number;
    upgradeCost: number;
    maintenanceCost: number;
  };
}

/** Financial health status */
export type FinancialHealthStatus =
  | 'excellent'
  | 'good'
  | 'stable'
  | 'concerning'
  | 'critical';

/** Financial health assessment */
export interface FinancialHealth {
  clubId: EntityId;
  status: FinancialHealthStatus;
  score: number; // 0-100
  factors: {
    balance: number; // 0-100
    wageBudgetUtilization: number; // 0-100 (percentage)
    transferBudgetUtilization: number; // 0-100 (percentage)
    incomeStability: number; // 0-100
    expenseControl: number; // 0-100
  };
  recommendations: string[];
}

// ============================================
// FINANCE CONSTANTS
// ============================================

/** Base sponsorship values by club reputation */
export const BASE_SPONSORSHIP_VALUES: Record<number, number> = {
  0: 1000000,   // Very low reputation
  25: 5000000,  // Low reputation
  50: 10000000, // Average reputation
  75: 25000000, // High reputation
  100: 50000000, // Elite reputation
};

/** Sponsorship value multipliers by competition tier */
export const SPONSORSHIP_TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0, // Top tier
  2: 0.7, // Second tier
  3: 0.5, // Third tier
  4: 0.3, // Fourth tier
  5: 0.2, // Fifth tier
};

/** Ticket price ranges by competition tier */
export const TICKET_PRICE_RANGES: Record<number, { min: number; max: number }> = {
  1: { min: 30, max: 100 },  // Top tier
  2: { min: 20, max: 60 },   // Second tier
  3: { min: 15, max: 40 },   // Third tier
  4: { min: 10, max: 30 },   // Fourth tier
  5: { min: 5, max: 20 },    // Fifth tier
};

/** Average attendance by stadium capacity percentage */
export const AVERAGE_ATTENDANCE_PERCENTAGE: number = 0.85; // 85%

/** TV revenue per competition (per season, in USD) */
export const TV_REVENUE_BY_COMPETITION: Record<string, number> = {
  'premier_league': 3000000000,
  'la_liga': 2500000000,
  'bundesliga': 2000000000,
  'serie_a': 1800000000,
  'ligue_1': 1500000000,
  'champions_league': 4000000000,
  'europa_league': 1500000000,
};

/** Facility upgrade costs (in USD) */
export const FACILITY_UPGRADE_COSTS: Record<string, number[]> = {
  training_facilities: [0, 5000000, 10000000, 20000000, 40000000],
  youth_academy: [0, 3000000, 8000000, 15000000, 30000000],
  stadium: [0, 10000000, 25000000, 50000000, 100000000],
  medical_center: [0, 2000000, 5000000, 10000000, 20000000],
  scouting_network: [0, 1000000, 3000000, 6000000, 12000000],
};

/** Facility maintenance costs (weekly, in USD) */
export const FACILITY_MAINTENANCE_COSTS: Record<string, number[]> = {
  training_facilities: [0, 50000, 150000, 300000, 500000],
  youth_academy: [0, 30000, 100000, 200000, 400000],
  stadium: [0, 200000, 500000, 1000000, 2000000],
  medical_center: [0, 100000, 250000, 500000, 1000000],
  scouting_network: [0, 50000, 150000, 300000, 600000],
};

/** Prize money for competitions (in USD) */
export const PRIZE_MONEY: Record<string, PrizeMoney> = {
  premier_league: {
    competitionId: 1,
    season: 2026,
    champion: 200000000,
    second: 150000000,
    third: 100000000,
    fourth: 50000000,
  },
  la_liga: {
    competitionId: 2,
    season: 2026,
    champion: 180000000,
    second: 120000000,
    third: 80000000,
    fourth: 40000000,
  },
  champions_league: {
    competitionId: 3,
    season: 2026,
    champion: 200000000,
    runnerUp: 150000000,
    semiFinal: 50000000,
    quarterFinal: 25000000,
    roundOf16: 10000000,
  },
};
