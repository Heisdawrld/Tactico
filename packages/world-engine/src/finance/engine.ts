// TACTICO World Engine - Finance Engine
// Handles all financial operations for clubs

import { EntityId, DateString, Club, Player } from '../core/types';
import {
  TransactionType,
  FinancialCategory,
  FinancialTransaction,
  ClubFinancialState,
  ClubBudget,
  Sponsorship,
  PrizeMoney,
  TVRevenue,
  FinancialReport,
  FinancialForecast,
  FinancialHealth,
  FinancialHealthStatus,
  BASE_SPONSORSHIP_VALUES,
  SPONSORSHIP_TIER_MULTIPLIERS,
  TICKET_PRICE_RANGES,
  AVERAGE_ATTENDANCE_PERCENTAGE,
  TV_REVENUE_BY_COMPETITION,
  FACILITY_UPGRADE_COSTS,
  FACILITY_MAINTENANCE_COSTS,
  PRIZE_MONEY,
} from './types';

/**
 * FinanceEngine - Manages all financial operations for clubs
 * 
 * Handles:
 * - Weekly/monthly financial updates
 * - Income (sponsorships, tickets, TV, merchandise, transfers)
 * - Expenses (wages, maintenance, transfers, fines)
 * - Budgets and financial health
 * - Sponsorships and prize money
 */
export class FinanceEngine {
  private clubs: Map<EntityId, Club> = new Map();
  private players: Map<EntityId, Player> = new Map();
  private transactions: Map<EntityId, FinancialTransaction[]> = new Map();
  private sponsorships: Map<EntityId, Sponsorship[]> = new Map();
  private prizeMoney: Map<string, PrizeMoney> = new Map();
  private tvRevenue: Map<string, TVRevenue> = new Map();

  constructor() {
    // Initialize prize money
    Object.entries(PRIZE_MONEY).forEach(([key, value]) => {
      this.prizeMoney.set(key, value);
    });
  }

  /**
   * Initialize the finance engine
   */
  initialize(clubs: Club[], players: Player[]): void {
    clubs.forEach(club => this.clubs.set(club.id, club));
    players.forEach(player => this.players.set(player.id, player));
  }

  /**
   * Process weekly finances for all clubs
   * @param date Current date
   * @returns Financial reports for each club
   */
  processWeeklyFinances(date: DateString): FinancialReport[] {
    const reports: FinancialReport[] = [];

    this.clubs.forEach(club => {
      const report = this.processClubWeeklyFinances(club.id, date);
      reports.push(report);
    });

    return reports;
  }

  /**
   * Process weekly finances for a single club
   */
  private processClubWeeklyFinances(clubId: EntityId, date: DateString): FinancialReport {
    const club = this.clubs.get(clubId);
    if (!club) {
      throw new Error(`Club ${clubId} not found`);
    }

    const income: Record<FinancialCategory, number> = {
      sponsorship: 0,
      ticket_sales: 0,
      tv_revenue: 0,
      merchandise: 0,
      transfer_fee_in: 0,
      loan_fee_in: 0,
      prize_money: 0,
      other_income: 0,
    };

    const expenses: Record<FinancialCategory, number> = {
      wages: 0,
      signing_bonus: 0,
      release_clause: 0,
      transfer_fee_out: 0,
      loan_fee_out: 0,
      facility_maintenance: 0,
      youth_academy: 0,
      scouting: 0,
      medical: 0,
      other_expense: 0,
      fine: 0,
    };

    const transactions: FinancialTransaction[] = [];

    // Calculate income
    const weeklyIncome = this.calculateWeeklyIncome(club, date, income, transactions);

    // Calculate expenses
    const weeklyExpenses = this.calculateWeeklyExpenses(club, date, expenses, transactions);

    const profit = weeklyIncome.total - weeklyExpenses.total;
    const balanceChange = profit;

    // Update club balance
    club.balance += balanceChange;

    return {
      clubId: club.id,
      startDate: this.getStartOfWeek(date),
      endDate: date,
      income: {
        total: weeklyIncome.total,
        byCategory: income,
      },
      expenses: {
        total: weeklyExpenses.total,
        byCategory: expenses,
      },
      profit,
      balanceChange,
      transactions,
    };
  }

  /**
   * Calculate weekly income for a club
   */
  private calculateWeeklyIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): { total: number; byCategory: Record<FinancialCategory, number> } {
    // 1. Sponsorship income (weekly portion of annual value)
    const sponsorshipIncome = this.calculateSponsorshipIncome(club, date, income, transactions);

    // 2. Ticket sales (if there was a home match this week)
    const ticketIncome = this.calculateTicketIncome(club, date, income, transactions);

    // 3. TV revenue (weekly portion)
    const tvIncome = this.calculateTVIncome(club, date, income, transactions);

    // 4. Merchandise (estimated based on reputation)
    const merchandiseIncome = this.calculateMerchandiseIncome(club, date, income, transactions);

    // 5. Transfer fees in (from player sales)
    const transferIncome = this.calculateTransferIncome(club, date, income, transactions);

    // 6. Prize money (if won something recently)
    const prizeIncome = this.calculatePrizeIncome(club, date, income, transactions);

    // Calculate total
    const total = Object.values(income).reduce((sum, val) => sum + val, 0);

    return { total, byCategory: income };
  }

  /**
   * Calculate sponsorship income
   */
  private calculateSponsorshipIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    const sponsorships = this.sponsorships.get(club.id) || [];
    let total = 0;

    sponsorships.forEach(sponsorship => {
      if (!sponsorship.isActive) return;

      // Calculate weekly portion (annual value / 52)
      const weeklyValue = sponsorship.annualValue / 52;
      total += weeklyValue;

      // Add transaction
      transactions.push({
        id: this.generateId(),
        clubId: club.id,
        type: 'income',
        category: 'sponsorship',
        amount: Math.round(weeklyValue),
        description: `Weekly sponsorship income from ${sponsorship.sponsorName}`,
        date,
        relatedEntityId: sponsorship.id,
        relatedEntityType: 'sponsorship',
      });
    });

    // If no sponsorships, use base value based on reputation
    if (sponsorships.length === 0) {
      const baseValue = this.getBaseSponsorshipValue(club.reputation);
      const weeklyValue = baseValue / 52;
      total += weeklyValue;

      transactions.push({
        id: this.generateId(),
        clubId: club.id,
        type: 'income',
        category: 'sponsorship',
        amount: Math.round(weeklyValue),
        description: 'Base sponsorship income (no active sponsorships)',
        date,
      });
    }

    income.sponsorship = Math.round(total);
    return total;
  }

  /**
   * Calculate ticket income
   */
  private calculateTicketIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // In a real implementation, this would check if there was a home match this week
    // For now, assume 1 home match per week on average
    const matchesThisWeek = 1;
    
    if (matchesThisWeek === 0) return 0;

    // Calculate average ticket price based on competition tier
    // For now, use club reputation to estimate tier
    const tier = Math.max(1, Math.min(5, Math.ceil(club.reputation / 20)));
    const priceRange = TICKET_PRICE_RANGES[tier];
    const avgTicketPrice = (priceRange.min + priceRange.max) / 2;

    // Calculate attendance (85% of capacity on average)
    const attendance = Math.round(club.stadiumCapacity * AVERAGE_ATTENDANCE_PERCENTAGE);

    const total = avgTicketPrice * attendance * matchesThisWeek;

    income.ticket_sales = Math.round(total);

    transactions.push({
      id: this.generateId(),
      clubId: club.id,
      type: 'income',
      category: 'ticket_sales',
      amount: Math.round(total),
      description: `Ticket sales for ${matchesThisWeek} home match(es)`,
      date,
    });

    return total;
  }

  /**
   * Calculate TV income
   */
  private calculateTVIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // In a real implementation, this would be based on actual TV deals
    // For now, estimate based on club reputation and competition
    const competitionId = club.leagueId; // Assuming leagueId is the main competition
    const competitionKey = this.getCompetitionKey(competitionId);
    const tvPool = TV_REVENUE_BY_COMPETITION[competitionKey] || 1000000000;

    // Estimate club's share based on reputation
    const clubShare = (club.reputation / 100) * 0.01; // Top clubs get ~1%, others less
    const weeklyTV = (tvPool * clubShare) / 52; // Annual TV pool divided by 52 weeks

    income.tv_revenue = Math.round(weeklyTV);

    transactions.push({
      id: this.generateId(),
      clubId: club.id,
      type: 'income',
      category: 'tv_revenue',
      amount: Math.round(weeklyTV),
      description: 'Weekly TV revenue share',
      date,
    });

    return weeklyTV;
  }

  /**
   * Calculate merchandise income
   */
  private calculateMerchandiseIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // Estimate based on reputation (higher reputation = more merchandise sales)
    const weeklyMerchandise = club.reputation * 10000; // $10,000 per reputation point per week

    income.merchandise = Math.round(weeklyMerchandise);

    transactions.push({
      id: this.generateId(),
      clubId: club.id,
      type: 'income',
      category: 'merchandise',
      amount: Math.round(weeklyMerchandise),
      description: 'Weekly merchandise sales',
      date,
    });

    return weeklyMerchandise;
  }

  /**
   * Calculate transfer income
   */
  private calculateTransferIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // In a real implementation, this would check for completed transfers this week
    // For now, return 0 (handled separately in transfer engine)
    return 0;
  }

  /**
   * Calculate prize income
   */
  private calculatePrizeIncome(
    club: Club,
    date: DateString,
    income: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // In a real implementation, this would check for recent competition wins
    // For now, return 0 (handled separately in competition engine)
    return 0;
  }

  /**
   * Calculate weekly expenses for a club
   */
  private calculateWeeklyExpenses(
    club: Club,
    date: DateString,
    expenses: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): { total: number; byCategory: Record<FinancialCategory, number> } {
    // 1. Wages (players and staff)
    const wageExpenses = this.calculateWageExpenses(club, date, expenses, transactions);

    // 2. Facility maintenance
    const maintenanceExpenses = this.calculateMaintenanceExpenses(club, date, expenses, transactions);

    // 3. Transfer fees out (for player purchases)
    const transferExpenses = this.calculateTransferExpenses(club, date, expenses, transactions);

    // Calculate total
    const total = Object.values(expenses).reduce((sum, val) => sum + val, 0);

    return { total, byCategory: expenses };
  }

  /**
   * Calculate wage expenses
   */
  private calculateWageExpenses(
    club: Club,
    date: DateString,
    expenses: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // Get all players at the club
    const clubPlayers = Array.from(this.players.values())
      .filter(p => p.clubId === club.id);

    // Calculate total weekly wages
    const totalWages = clubPlayers.reduce((sum, player) => sum + player.wage, 0);

    // Estimate staff wages (50% of player wages)
    const staffWages = totalWages * 0.5;
    const total = totalWages + staffWages;

    expenses.wages = Math.round(total);

    transactions.push({
      id: this.generateId(),
      clubId: club.id,
      type: 'expense',
      category: 'wages',
      amount: Math.round(total),
      description: `Weekly wages (players: $${totalWages.toLocaleString()}, staff: $${staffWages.toLocaleString()})`,
      date,
    });

    return total;
  }

  /**
   * Calculate maintenance expenses
   */
  private calculateMaintenanceExpenses(
    club: Club,
    date: DateString,
    expenses: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    let total = 0;

    // Training facilities maintenance
    const trainingCost = FACILITY_MAINTENANCE_COSTS.training_facilities[club.trainingFacilities] || 0;
    total += trainingCost;
    expenses.facility_maintenance += trainingCost;

    // Youth academy maintenance
    const youthCost = FACILITY_MAINTENANCE_COSTS.youth_academy[club.youthAcademy] || 0;
    total += youthCost;
    expenses.youth_academy += youthCost;

    // Stadium maintenance (based on capacity)
    const stadiumCost = club.stadiumCapacity * 0.1; // $0.10 per seat per week
    total += stadiumCost;
    expenses.facility_maintenance += stadiumCost;

    // Medical center maintenance
    const medicalCost = FACILITY_MAINTENANCE_COSTS.medical_center[club.medicalCenter] || 0;
    total += medicalCost;
    expenses.medical += medicalCost;

    // Scouting network maintenance
    const scoutingCost = FACILITY_MAINTENANCE_COSTS.scouting_network[club.scoutingNetwork] || 0;
    total += scoutingCost;
    expenses.scouting += scoutingCost;

    transactions.push({
      id: this.generateId(),
      clubId: club.id,
      type: 'expense',
      category: 'facility_maintenance',
      amount: Math.round(total),
      description: 'Weekly facility maintenance costs',
      date,
    });

    return total;
  }

  /**
   * Calculate transfer expenses
   */
  private calculateTransferExpenses(
    club: Club,
    date: DateString,
    expenses: Record<FinancialCategory, number>,
    transactions: FinancialTransaction[]
  ): number {
    // In a real implementation, this would check for player purchases this week
    // For now, return 0 (handled separately in transfer engine)
    return 0;
  }

  /**
   * Get base sponsorship value for a club's reputation
   */
  private getBaseSponsorshipValue(reputation: number): number {
    const tiers = [0, 25, 50, 75, 100];
    let value = BASE_SPONSORSHIP_VALUES[0];

    for (let i = 1; i < tiers.length; i++) {
      if (reputation >= tiers[i]) {
        value = BASE_SPONSORSHIP_VALUES[tiers[i]];
      } else {
        break;
      }
    }

    return value;
  }

  /**
   * Get competition key from ID
   */
  private getCompetitionKey(competitionId: number): string {
    // In a real implementation, this would map competition IDs to keys
    // For now, use a simple mapping
    const mapping: Record<number, string> = {
      1: 'premier_league',
      2: 'la_liga',
      3: 'bundesliga',
      4: 'serie_a',
      5: 'ligue_1',
      10: 'champions_league',
    };
    return mapping[competitionId] || 'other';
  }

  /**
   * Get start of the week (Monday) for a given date
   */
  private getStartOfWeek(date: DateString): DateString {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Get club financial state
   */
  getClubFinancialState(clubId: EntityId): ClubFinancialState | null {
    const club = this.clubs.get(clubId);
    if (!club) return null;

    return {
      clubId: club.id,
      balance: club.balance,
      wageBudget: club.wageBudget,
      transferBudget: club.transferBudget,
      weeklyIncome: 0, // Would be calculated from history
      weeklyExpenses: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
    };
  }

  /**
   * Get club budget
   */
  getClubBudget(clubId: EntityId): ClubBudget | null {
    const club = this.clubs.get(clubId);
    if (!club) return null;

    // Calculate allocated amount (wages + transfers + other expenses)
    const transactions = this.transactions.get(clubId) || [];
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(thisMonth));
    const expensesThisMonth = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      clubId: club.id,
      wageBudget: club.wageBudget,
      transferBudget: club.transferBudget,
      allocated: expensesThisMonth,
      remaining: club.transferBudget - expensesThisMonth,
    };
  }

  /**
   * Add a financial transaction
   */
  addTransaction(transaction: Omit<FinancialTransaction, 'id'>): FinancialTransaction {
    const id = this.generateId();
    const fullTransaction: FinancialTransaction = { id, ...transaction };

    if (!this.transactions.has(transaction.clubId)) {
      this.transactions.set(transaction.clubId, []);
    }
    this.transactions.get(transaction.clubId)!.push(fullTransaction);

    // Update club balance
    const club = this.clubs.get(transaction.clubId);
    if (club) {
      club.balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
    }

    return fullTransaction;
  }

  /**
   * Get transactions for a club
   */
  getTransactions(clubId: EntityId): FinancialTransaction[] {
    return this.transactions.get(clubId) || [];
  }

  /**
   * Get transactions for a club in a date range
   */
  getTransactionsInRange(
    clubId: EntityId,
    startDate: DateString,
    endDate: DateString
  ): FinancialTransaction[] {
    const allTransactions = this.getTransactions(clubId);
    return allTransactions.filter(t => t.date >= startDate && t.date <= endDate);
  }

  /**
   * Add a sponsorship
   */
  addSponsorship(sponsorship: Sponsorship): void {
    if (!this.sponsorships.has(sponsorship.clubId)) {
      this.sponsorships.set(sponsorship.clubId, []);
    }
    this.sponsorships.get(sponsorship.clubId)!.push(sponsorship);
  }

  /**
   * Remove a sponsorship
   */
  removeSponsorship(sponsorshipId: EntityId, clubId: EntityId): void {
    const sponsorships = this.sponsorships.get(clubId);
    if (sponsorships) {
      this.sponsorships.set(
        clubId,
        sponsorships.filter(s => s.id !== sponsorshipId)
      );
    }
  }

  /**
   * Get sponsorships for a club
   */
  getSponsorships(clubId: EntityId): Sponsorship[] {
    return this.sponsorships.get(clubId) || [];
  }

  /**
   * Add prize money for a competition
   */
  addPrizeMoney(prizeMoney: PrizeMoney): void {
    const key = `${prizeMoney.competitionId}-${prizeMoney.season}`;
    this.prizeMoney.set(key, prizeMoney);
  }

  /**
   * Get prize money for a competition
   */
  getPrizeMoney(competitionId: EntityId, season: number): PrizeMoney | null {
    const key = `${competitionId}-${season}`;
    return this.prizeMoney.get(key) || null;
  }

  /**
   * Add TV revenue for a competition
   */
  addTVRevenue(tvRevenue: TVRevenue): void {
    const key = `${tvRevenue.competitionId}-${tvRevenue.season}`;
    this.tvRevenue.set(key, tvRevenue);
  }

  /**
   * Get TV revenue for a competition
   */
  getTVRevenue(competitionId: EntityId, season: number): TVRevenue | null {
    const key = `${competitionId}-${season}`;
    return this.tvRevenue.get(key) || null;
  }

  /**
   * Award prize money to a club
   */
  awardPrizeMoney(
    clubId: EntityId,
    competitionId: EntityId,
    position: string,
    season: number,
    date: DateString
  ): FinancialTransaction | null {
    const prize = this.getPrizeMoney(competitionId, season);
    if (!prize) return null;

    let amount = 0;
    switch (position) {
      case 'champion':
        amount = prize.champion;
        break;
      case 'second':
        amount = prize.second;
        break;
      case 'third':
        amount = prize.third;
        break;
      case 'fourth':
        amount = prize.fourth;
        break;
      case 'semi_final':
        amount = prize.semiFinal || 0;
        break;
      case 'quarter_final':
        amount = prize.quarterFinal || 0;
        break;
      case 'round_of_16':
        amount = prize.roundOf16 || 0;
        break;
      default:
        return null;
    }

    if (amount === 0) return null;

    return this.addTransaction({
      clubId,
      type: 'income',
      category: 'prize_money',
      amount,
      description: `Prize money for ${position} place in competition ${competitionId}`,
      date,
      relatedEntityId: competitionId,
      relatedEntityType: 'competition',
    });
  }

  /**
   * Calculate financial health for a club
   */
  calculateFinancialHealth(clubId: EntityId): FinancialHealth | null {
    const club = this.clubs.get(clubId);
    if (!club) return null;

    const state = this.getClubFinancialState(clubId);
    if (!state) return null;

    const budget = this.getClubBudget(clubId);
    if (!budget) return null;

    // Calculate factors (0-100)
    const balanceFactor = Math.min(100, (club.balance / 10000000) * 100); // $10M = 100%
    const wageBudgetFactor = Math.min(100, ((club.wageBudget - budget.allocated) / club.wageBudget) * 100);
    const transferBudgetFactor = Math.min(100, (budget.remaining / club.transferBudget) * 100);

    // Estimate income stability (based on sponsorships)
    const sponsorships = this.getSponsorships(clubId);
    const sponsorshipFactor = Math.min(100, (sponsorships.length / 5) * 100); // 5 sponsorships = 100%

    // Estimate expense control (lower expenses relative to income = better)
    const expenseFactor = state.weeklyExpenses > 0 
      ? Math.min(100, (state.weeklyIncome / state.weeklyExpenses) * 100) 
      : 100;

    // Calculate overall score
    const score = (
      balanceFactor * 0.3 +
      wageBudgetFactor * 0.2 +
      transferBudgetFactor * 0.2 +
      sponsorshipFactor * 0.15 +
      expenseFactor * 0.15
    );

    // Determine status
    let status: FinancialHealthStatus = 'stable';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'concerning';
    else status = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (balanceFactor < 50) {
      recommendations.push('Increase revenue streams (sponsorships, merchandise)');
    }
    if (wageBudgetFactor < 50) {
      recommendations.push('Reduce wage bill or increase wage budget');
    }
    if (transferBudgetFactor < 50) {
      recommendations.push('Reduce transfer spending or increase transfer budget');
    }
    if (sponsorshipFactor < 50) {
      recommendations.push('Negotiate more sponsorship deals');
    }
    if (expenseFactor < 100) {
      recommendations.push('Improve expense control');
    }

    return {
      clubId: club.id,
      status,
      score: Math.round(score),
      factors: {
        balance: Math.round(balanceFactor),
        wageBudgetUtilization: Math.round(100 - wageBudgetFactor),
        transferBudgetUtilization: Math.round(100 - transferBudgetFactor),
        incomeStability: Math.round(sponsorshipFactor),
        expenseControl: Math.round(expenseFactor),
      },
      recommendations,
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): EntityId {
    return Math.floor(Math.random() * 1000000000);
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
  }

  /**
   * Remove a club
   */
  removeClub(clubId: EntityId): void {
    this.clubs.delete(clubId);
    this.transactions.delete(clubId);
    this.sponsorships.delete(clubId);
  }

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  /**
   * Remove a player
   */
  removePlayer(playerId: EntityId): void {
    this.players.delete(playerId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.clubs.clear();
    this.players.clear();
    this.transactions.clear();
    this.sponsorships.clear();
    this.prizeMoney.clear();
    this.tvRevenue.clear();
  }
}
