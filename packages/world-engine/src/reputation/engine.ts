// TACTICO World Engine - Reputation Engine
// Handles reputation changes for players, clubs, managers, and nations

import { EntityId, DateString, Player, Club, Manager, Nation } from '../core/types';
import {
  ReputationValue,
  ReputableEntityType,
  Reputation,
  ReputationHistoryEntry,
  ReputationTrend,
  ReputationCategory,
  ReputationChange,
  ReputationEvent,
  ReputationFactor,
  ClubReputationFactors,
  PlayerReputationFactors,
  ManagerReputationFactors,
  NationReputationFactors,
  ReputationLeaderboard,
  ReputationLeaderboardEntry,
  ReputationReport,
  ReputationComparison,
  ReputationMilestone,
  BASE_REPUTATION_VALUES,
  MAX_REPUTATION_CHANGE,
  MIN_REPUTATION_CHANGE,
  REPUTATION_CHANGE_MULTIPLIERS,
  CLUB_REPUTATION_FACTOR_WEIGHTS,
  PLAYER_REPUTATION_FACTOR_WEIGHTS,
  MANAGER_REPUTATION_FACTOR_WEIGHTS,
  NATION_REPUTATION_FACTOR_WEIGHTS,
  REPUTATION_THRESHOLDS,
  REPUTATION_DESCRIPTIONS,
  TROPHY_REPUTATION_BONUSES,
  INDIVIDUAL_AWARD_REPUTATION_BONUSES,
  TRANSFER_REPUTATION_EFFECTS,
  FINANCIAL_REPUTATION_EFFECTS,
  SCANDAL_REPUTATION_EFFECTS,
} from './types';

/**
 * ReputationEngine - Manages reputation for all entities
 * 
 * Handles:
 * - Reputation tracking for players, clubs, managers, nations
 * - Reputation changes from various events
 * - Reputation calculations based on factors
 * - Reputation history and trends
 * - Reputation leaderboards and reports
 */
export class ReputationEngine {
  private players: Map<EntityId, Player> = new Map();
  private clubs: Map<EntityId, Club> = new Map();
  private managers: Map<EntityId, Manager> = new Map();
  private nations: Map<string, Nation> = new Map();
  
  private reputations: Map<string, Reputation> = new Map(); // Key: `${entityType}_${entityId}`
  private reputationEvents: Map<string, ReputationEvent[]> = new Map(); // Same key structure
  private reputationMilestones: Map<string, ReputationMilestone[]> = new Map();
  
  private clubFactors: Map<EntityId, ClubReputationFactors> = new Map();
  private playerFactors: Map<EntityId, PlayerReputationFactors> = new Map();
  private managerFactors: Map<EntityId, ManagerReputationFactors> = new Map();
  private nationFactors: Map<string, NationReputationFactors> = new Map();

  /**
   * Initialize the reputation engine
   */
  initialize(
    players: Player[],
    clubs: Club[],
    managers: Manager[],
    nations: Nation[]
  ): void {
    players.forEach(player => {
      this.players.set(player.id, player);
      this.initializePlayerReputation(player);
      this.initializePlayerFactors(player);
    });
    
    clubs.forEach(club => {
      this.clubs.set(club.id, club);
      this.initializeClubReputation(club);
      this.initializeClubFactors(club);
    });
    
    managers.forEach(manager => {
      this.managers.set(manager.id, manager);
      this.initializeManagerReputation(manager);
      this.initializeManagerFactors(manager);
    });
    
    nations.forEach(nation => {
      this.nations.set(nation.code, nation);
      this.initializeNationReputation(nation);
      this.initializeNationFactors(nation);
    });
  }

  /**
   * Initialize reputation for a player
   */
  private initializePlayerReputation(player: Player): void {
    const key = this.getEntityKey('player', player.id);
    this.reputations.set(key, {
      entityId: player.id,
      entityType: 'player',
      value: player.reputation || BASE_REPUTATION_VALUES.player,
      history: [],
      trend: 'new',
      lastUpdated: this.getCurrentDate(),
    });
  }

  /**
   * Initialize reputation for a club
   */
  private initializeClubReputation(club: Club): void {
    const key = this.getEntityKey('club', club.id);
    this.reputations.set(key, {
      entityId: club.id,
      entityType: 'club',
      value: club.reputation || BASE_REPUTATION_VALUES.club,
      history: [],
      trend: 'new',
      lastUpdated: this.getCurrentDate(),
    });
  }

  /**
   * Initialize reputation for a manager
   */
  private initializeManagerReputation(manager: Manager): void {
    const key = this.getEntityKey('manager', manager.id);
    this.reputations.set(key, {
      entityId: manager.id,
      entityType: 'manager',
      value: manager.reputation || BASE_REPUTATION_VALUES.manager,
      history: [],
      trend: 'new',
      lastUpdated: this.getCurrentDate(),
    });
  }

  /**
   * Initialize reputation for a nation
   */
  private initializeNationReputation(nation: Nation): void {
    const key = this.getEntityKey('nation', nation.code);
    this.reputations.set(key, {
      entityId: nation.code,
      entityType: 'nation',
      value: nation.reputation || BASE_REPUTATION_VALUES.nation,
      history: [],
      trend: 'new',
      lastUpdated: this.getCurrentDate(),
    });
  }

  /**
   * Initialize factors for a player
   */
  private initializePlayerFactors(player: Player): void {
    this.playerFactors.set(player.id, {
      playerId: player.id,
      currentAbility: player.currentAbility,
      potentialAbility: player.potentialAbility,
      recentForm: 50, // Default
      consistency: player.hiddenAttributes.consistency,
      trophiesWon: 0,
      individualAwards: 0,
      capsForNation: 0,
      goalsScored: 0,
      assists: 0,
      cleanSheets: 0,
      clubReputation: this.getReputation('club', player.clubId) || 50,
      clubLeagueLevel: 1, // Default
      firstTeamStatus: true, // Assume first team for now
      professionalism: player.hiddenAttributes.professionalism,
      sportsmanship: player.hiddenAttributes.sportsmanship,
      controversy: player.hiddenAttributes.controversy,
      mediaPresence: 50,
      fanPopularity: 50,
    });
  }

  /**
   * Initialize factors for a club
   */
  private initializeClubFactors(club: Club): void {
    this.clubFactors.set(club.id, {
      clubId: club.id,
      leaguePosition: 10, // Default
      recentForm: 50,
      cupProgress: 0,
      trophiesWon: 0,
      financialStability: 50,
      transferActivity: 50,
      commercialRevenue: 50,
      squadQuality: club.reputation,
      squadDepth: 50,
      youthProduction: club.youthQuality,
      stadiumQuality: club.stadiumCapacity / 1000, // Normalize
      trainingFacilities: club.trainingFacilities * 20,
      youthAcademy: club.youthAcademy * 20,
      fanBase: 50,
      mediaPresence: 50,
      historicalSuccess: 50,
    });
  }

  /**
   * Initialize factors for a manager
   */
  private initializeManagerFactors(manager: Manager): void {
    this.managerFactors.set(manager.id, {
      managerId: manager.id,
      winPercentage: 50,
      recentForm: 50,
      trophiesWon: 0,
      clubReputation: this.getReputation('club', manager.clubId) || 50,
      clubLeagueLevel: 1,
      clubProgress: 50,
      tacticalSuccess: 50,
      adaptability: manager.adaptability,
      leadership: manager.leadership,
      manManagement: manager.manManagement,
      mediaPresence: 50,
      fanPopularity: 50,
    });
  }

  /**
   * Initialize factors for a nation
   */
  private initializeNationFactors(nation: Nation): void {
    this.nationFactors.set(nation.code, {
      nationCode: nation.code,
      fifaRanking: nation.fifaRanking || 100,
      recentResults: 50,
      tournamentProgress: 50,
      youthQuality: nation.youthQuality,
      infrastructure: nation.infrastructure,
      coachingLevel: nation.coachingLevel,
      playerPoolQuality: 50,
      playerPoolDepth: 50,
      playersAbroad: 0,
      historicalSuccess: 50,
      worldCupPedigree: 50,
    });
  }

  // ============================================
  // REPUTATION UPDATE METHODS
  // ============================================

  /**
   * Update reputation for all entities
   * @param date Current date
   */
  updateReputation(date: DateString): void {
    // Update club reputations
    this.clubs.forEach(club => {
      this.updateClubReputation(club.id, date);
    });

    // Update player reputations
    this.players.forEach(player => {
      this.updatePlayerReputation(player.id, date);
    });

    // Update manager reputations
    this.managers.forEach(manager => {
      this.updateManagerReputation(manager.id, date);
    });

    // Update nation reputations
    this.nations.forEach(nation => {
      this.updateNationReputation(nation.code, date);
    });
  }

  /**
   * Update reputation for a club
   */
  private updateClubReputation(clubId: EntityId, date: DateString): void {
    const club = this.clubs.get(clubId);
    if (!club) return;

    const factors = this.clubFactors.get(clubId);
    if (!factors) return;

    // Calculate new reputation based on factors
    let newReputation = BASE_REPUTATION_VALUES.club;
    
    for (const [factor, weight] of Object.entries(CLUB_REPUTATION_FACTOR_WEIGHTS)) {
      const factorValue = factors[factor as keyof ClubReputationFactors] || 0;
      // Normalize factor value to 0-100
      const normalizedValue = this.normalizeFactorValue(factorValue, factor);
      newReputation += normalizedValue * weight * 100;
    }

    // Clamp to 0-100
    newReputation = Math.min(100, Math.max(0, Math.round(newReputation)));

    // Apply reputation change
    this.applyReputationChange({
      entityId: clubId,
      entityType: 'club',
      amount: newReputation - club.reputation,
      reason: 'Regular reputation update',
      category: 'match_performance',
      date,
    });

    // Update club reputation
    club.reputation = newReputation;
    this.clubs.set(clubId, club);
  }

  /**
   * Update reputation for a player
   */
  private updatePlayerReputation(playerId: EntityId, date: DateString): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const factors = this.playerFactors.get(playerId);
    if (!factors) return;

    // Calculate new reputation based on factors
    let newReputation = BASE_REPUTATION_VALUES.player;
    
    for (const [factor, weight] of Object.entries(PLAYER_REPUTATION_FACTOR_WEIGHTS)) {
      const factorValue = factors[factor as keyof PlayerReputationFactors];
      // Normalize factor value to 0-100
      const normalizedValue = this.normalizePlayerFactorValue(factorValue, factor);
      newReputation += normalizedValue * weight * 100;
    }

    // Clamp to 0-100
    newReputation = Math.min(100, Math.max(0, Math.round(newReputation)));

    // Apply reputation change
    this.applyReputationChange({
      entityId: playerId,
      entityType: 'player',
      amount: newReputation - player.reputation,
      reason: 'Regular reputation update',
      category: 'match_performance',
      date,
    });

    // Update player reputation
    player.reputation = newReputation;
    this.players.set(playerId, player);
  }

  /**
   * Update reputation for a manager
   */
  private updateManagerReputation(managerId: EntityId, date: DateString): void {
    const manager = this.managers.get(managerId);
    if (!manager) return;

    const factors = this.managerFactors.get(managerId);
    if (!factors) return;

    // Calculate new reputation based on factors
    let newReputation = BASE_REPUTATION_VALUES.manager;
    
    for (const [factor, weight] of Object.entries(MANAGER_REPUTATION_FACTOR_WEIGHTS)) {
      const factorValue = factors[factor as keyof ManagerReputationFactors];
      // Normalize factor value to 0-100
      const normalizedValue = this.normalizeManagerFactorValue(factorValue, factor);
      newReputation += normalizedValue * weight * 100;
    }

    // Clamp to 0-100
    newReputation = Math.min(100, Math.max(0, Math.round(newReputation)));

    // Apply reputation change
    this.applyReputationChange({
      entityId: managerId,
      entityType: 'manager',
      amount: newReputation - manager.reputation,
      reason: 'Regular reputation update',
      category: 'match_performance',
      date,
    });

    // Update manager reputation
    manager.reputation = newReputation;
    this.managers.set(managerId, manager);
  }

  /**
   * Update reputation for a nation
   */
  private updateNationReputation(nationCode: string, date: DateString): void {
    const nation = this.nations.get(nationCode);
    if (!nation) return;

    const factors = this.nationFactors.get(nationCode);
    if (!factors) return;

    // Calculate new reputation based on factors
    let newReputation = BASE_REPUTATION_VALUES.nation;
    
    for (const [factor, weight] of Object.entries(NATION_REPUTATION_FACTOR_WEIGHTS)) {
      const factorValue = factors[factor as keyof NationReputationFactors];
      // Normalize factor value to 0-100
      const normalizedValue = this.normalizeNationFactorValue(factorValue, factor);
      newReputation += normalizedValue * weight * 100;
    }

    // Clamp to 0-100
    newReputation = Math.min(100, Math.max(0, Math.round(newReputation)));

    // Apply reputation change
    this.applyReputationChange({
      entityId: nationCode,
      entityType: 'nation',
      amount: newReputation - nation.reputation,
      reason: 'Regular reputation update',
      category: 'tournament_progress',
      date,
    });

    // Update nation reputation
    nation.reputation = newReputation;
    this.nations.set(nationCode, nation);
  }

  /**
   * Normalize factor value for clubs
   */
  private normalizeFactorValue(value: number, factor: string): number {
    // Most factors are already 0-100
    if (value >= 0 && value <= 100) return value;
    
    // Special cases
    switch (factor) {
      case 'leaguePosition':
        // Lower position number = better (1st is best)
        // Convert to 0-100 where 1st = 100, 20th = 0
        return Math.max(0, 100 - (value - 1) * 5);
      case 'fifaRanking':
        // Lower ranking = better
        return Math.max(0, 100 - value);
      default:
        return Math.min(100, Math.max(0, value));
    }
  }

  /**
   * Normalize factor value for players
   */
  private normalizePlayerFactorValue(value: number | boolean, factor: string): number {
    if (typeof value === 'boolean') return value ? 100 : 0;
    
    if (value >= 0 && value <= 100) return value as number;
    
    // Special cases
    switch (factor) {
      case 'currentAbility':
      case 'potentialAbility':
        // Already 0-100
        return value as number;
      case 'goalsScored':
      case 'assists':
      case 'cleanSheets':
        // Cap at 100
        return Math.min(100, value as number);
      case 'capsForNation':
        // Cap at 100
        return Math.min(100, (value as number) * 2);
      case 'controversy':
        // Invert (lower controversy = better)
        return 100 - (value as number);
      default:
        return Math.min(100, Math.max(0, value as number));
    }
  }

  /**
   * Normalize factor value for managers
   */
  private normalizeManagerFactorValue(value: number, factor: string): number {
    if (value >= 0 && value <= 100) return value;
    
    // Special cases
    switch (factor) {
      case 'winPercentage':
        // Already 0-100
        return value;
      default:
        return Math.min(100, Math.max(0, value));
    }
  }

  /**
   * Normalize factor value for nations
   */
  private normalizeNationFactorValue(value: number, factor: string): number {
    if (value >= 0 && value <= 100) return value;
    
    // Special cases
    switch (factor) {
      case 'fifaRanking':
        // Lower ranking = better
        return Math.max(0, 100 - value);
      case 'playersAbroad':
        // Cap at 100
        return Math.min(100, value * 2);
      default:
        return Math.min(100, Math.max(0, value));
    }
  }

  // ============================================
  // REPUTATION CHANGE METHODS
  // ============================================

  /**
   * Apply a reputation change
   */
  applyReputationChange(change: ReputationChange): ReputationEvent | null {
    const key = this.getEntityKey(change.entityType, change.entityId);
    const reputation = this.reputations.get(key);
    if (!reputation) return null;

    // Get multiplier for category
    const multiplier = REPUTATION_CHANGE_MULTIPLIERS[change.category] || 1.0;
    
    // Calculate actual change
    let actualChange = change.amount * multiplier;
    
    // Clamp change
    actualChange = Math.max(
      -MAX_REPUTATION_CHANGE,
      Math.min(MAX_REPUTATION_CHANGE, actualChange)
    );

    // Calculate new reputation
    const oldReputation = reputation.value;
    let newReputation = oldReputation + actualChange;
    newReputation = Math.min(100, Math.max(0, newReputation));

    // Create event
    const event: ReputationEvent = {
      id: this.generateId(),
      entityId: change.entityId,
      entityType: change.entityType,
      oldReputation,
      newReputation,
      change: actualChange,
      reason: change.reason,
      category: change.category,
      date: change.date,
    };

    // Store event
    if (!this.reputationEvents.has(key)) {
      this.reputationEvents.set(key, []);
    }
    this.reputationEvents.get(key)!.push(event);

    // Update reputation
    reputation.value = newReputation;
    reputation.lastUpdated = change.date;
    
    // Update history
    reputation.history.push({
      date: change.date,
      oldValue: oldReputation,
      newValue: newReputation,
      change: actualChange,
      reason: change.reason,
      category: change.category,
    });

    // Keep only last 100 history entries
    if (reputation.history.length > 100) {
      reputation.history.shift();
    }

    // Update trend
    this.updateReputationTrend(reputation, actualChange);

    this.reputations.set(key, reputation);

    // Check for milestones
    this.checkReputationMilestones(event);

    return event;
  }

  /**
   * Update reputation trend
   */
  private updateReputationTrend(reputation: Reputation, change: number): void {
    if (reputation.trend === 'new') {
      reputation.trend = change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable';
      return;
    }

    // Track changes over last 5 updates
    const recentChanges = reputation.history.slice(-5).map(h => h.change);
    const avgChange = recentChanges.reduce((sum, c) => sum + c, 0) / recentChanges.length;

    if (avgChange > 2) {
      reputation.trend = 'rising';
    } else if (avgChange < -2) {
      reputation.trend = 'falling';
    } else {
      reputation.trend = 'stable';
    }
  }

  /**
   * Check for reputation milestones
   */
  private checkReputationMilestones(event: ReputationEvent): void {
    const key = this.getEntityKey(event.entityType, event.entityId);
    const milestones = this.reputationMilestones.get(key) || [];

    // Check if crossed any thresholds
    const thresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    for (const threshold of thresholds) {
      // Check if crossed threshold upwards
      if (event.oldReputation < threshold && event.newReputation >= threshold) {
        const milestone: ReputationMilestone = {
          id: this.generateId(),
          entityId: event.entityId,
          entityType: event.entityType,
          milestone: `Reached ${threshold} reputation`,
          description: `Reputation increased to ${threshold} (from ${event.oldReputation})`,
          date: event.date,
          reputationAtTime: event.newReputation,
        };
        milestones.push(milestone);
      }
      // Check if crossed threshold downwards
      else if (event.oldReputation >= threshold && event.newReputation < threshold) {
        const milestone: ReputationMilestone = {
          id: this.generateId(),
          entityId: event.entityId,
          entityType: event.entityType,
          milestone: `Dropped below ${threshold} reputation`,
          description: `Reputation decreased to ${event.newReputation} (from ${event.oldReputation})`,
          date: event.date,
          reputationAtTime: event.newReputation,
        };
        milestones.push(milestone);
      }
    }

    this.reputationMilestones.set(key, milestones);
  }

  // ============================================
  // EVENT-BASED REPUTATION CHANGES
  // ============================================

  /**
   * Apply reputation change for a trophy win
   */
  applyTrophyWinReputation(
    entityId: EntityId,
    entityType: ReputableEntityType,
    trophy: string,
    date: DateString
  ): ReputationEvent | null {
    const bonus = TROPHY_REPUTATION_BONUSES[trophy] || 10;
    
    return this.applyReputationChange({
      entityId,
      entityType,
      amount: bonus,
      reason: `Won ${trophy.replace('_', ' ')}`,
      category: 'trophy_win',
      date,
    });
  }

  /**
   * Apply reputation change for an individual award
   */
  applyIndividualAwardReputation(
    playerId: EntityId,
    award: string,
    date: DateString
  ): ReputationEvent | null {
    const bonus = INDIVIDUAL_AWARD_REPUTATION_BONUSES[award] || 5;
    
    return this.applyReputationChange({
      entityId: playerId,
      entityType: 'player',
      amount: bonus,
      reason: `Won ${award.replace('_', ' ')}`,
      category: 'individual_award',
      date,
    });
  }

  /**
   * Apply reputation change for a transfer
   */
  applyTransferReputation(
    entityId: EntityId,
    entityType: ReputableEntityType,
    transferType: string,
    date: DateString
  ): ReputationEvent | null {
    const effect = TRANSFER_REPUTATION_EFFECTS[transferType] || 0;
    
    if (effect === 0) return null;

    return this.applyReputationChange({
      entityId,
      entityType,
      amount: effect,
      reason: transferType.replace('_', ' '),
      category: 'transfer',
      date,
    });
  }

  /**
   * Apply reputation change for a financial event
   */
  applyFinancialReputation(
    clubId: EntityId,
    eventType: string,
    date: DateString
  ): ReputationEvent | null {
    const effect = FINANCIAL_REPUTATION_EFFECTS[eventType] || 0;
    
    if (effect === 0) return null;

    return this.applyReputationChange({
      entityId: clubId,
      entityType: 'club',
      amount: effect,
      reason: eventType.replace('_', ' '),
      category: 'financial',
      date,
    });
  }

  /**
   * Apply reputation change for a scandal
   */
  applyScandalReputation(
    entityId: EntityId,
    entityType: ReputableEntityType,
    scandalType: string,
    date: DateString
  ): ReputationEvent | null {
    const effect = SCANDAL_REPUTATION_EFFECTS[scandalType] || -5;
    
    return this.applyReputationChange({
      entityId,
      entityType,
      amount: effect,
      reason: scandalType.replace('_', ' '),
      category: 'scandal',
      date,
    });
  }

  // ============================================
  // REPUTATION GETTERS
  // ============================================

  /**
   * Get reputation for an entity
   */
  getReputation(entityType: ReputableEntityType, entityId: EntityId | string): ReputationValue | null {
    const key = this.getEntityKey(entityType, entityId);
    const reputation = this.reputations.get(key);
    return reputation?.value || null;
  }

  /**
   * Get full reputation data for an entity
   */
  getReputationData(entityType: ReputableEntityType, entityId: EntityId | string): Reputation | null {
    const key = this.getEntityKey(entityType, entityId);
    return this.reputations.get(key) || null;
  }

  /**
   * Get reputation history for an entity
   */
  getReputationHistory(entityType: ReputableEntityType, entityId: EntityId | string): ReputationHistoryEntry[] {
    const key = this.getEntityKey(entityType, entityId);
    const reputation = this.reputations.get(key);
    return reputation?.history || [];
  }

  /**
   * Get reputation events for an entity
   */
  getReputationEvents(entityType: ReputableEntityType, entityId: EntityId | string): ReputationEvent[] {
    const key = this.getEntityKey(entityType, entityId);
    return this.reputationEvents.get(key) || [];
  }

  /**
   * Get reputation milestones for an entity
   */
  getReputationMilestones(entityType: ReputableEntityType, entityId: EntityId | string): ReputationMilestone[] {
    const key = this.getEntityKey(entityType, entityId);
    return this.reputationMilestones.get(key) || [];
  }

  /**
   * Get reputation description
   */
  getReputationDescription(reputation: ReputationValue): string {
    if (reputation >= REPUTATION_THRESHOLDS.world_class) return REPUTATION_DESCRIPTIONS.world_class;
    if (reputation >= REPUTATION_THRESHOLDS.elite) return REPUTATION_DESCRIPTIONS.elite;
    if (reputation >= REPUTATION_THRESHOLDS.very_high) return REPUTATION_DESCRIPTIONS.very_high;
    if (reputation >= REPUTATION_THRESHOLDS.high) return REPUTATION_DESCRIPTIONS.high;
    if (reputation >= REPUTATION_THRESHOLDS.moderate) return REPUTATION_DESCRIPTIONS.moderate;
    if (reputation >= REPUTATION_THRESHOLDS.low) return REPUTATION_DESCRIPTIONS.low;
    if (reputation >= REPUTATION_THRESHOLDS.very_low) return REPUTATION_DESCRIPTIONS.very_low;
    return REPUTATION_DESCRIPTIONS.unknown;
  }

  // ============================================
  // REPUTATION REPORT METHODS
  // ============================================

  /**
   * Generate a reputation report for an entity
   */
  generateReputationReport(
    entityType: ReputableEntityType,
    entityId: EntityId | string
  ): ReputationReport | null {
    const reputation = this.getReputationData(entityType, entityId);
    if (!reputation) return null;

    const history = this.getReputationHistory(entityType, entityId);
    const recentHistory = history.slice(-10); // Last 10 entries

    // Get factors based on entity type
    let factors: Record<string, number> = {};
    let comparisons: ReputationComparison[] = [];
    let recommendations: string[] = [];

    switch (entityType) {
      case 'player':
        factors = this.getPlayerReputationFactors(entityId as EntityId);
        comparisons = this.getPlayerReputationComparisons(entityId as EntityId);
        recommendations = this.generatePlayerReputationRecommendations(reputation, factors);
        break;
      case 'club':
        factors = this.getClubReputationFactors(entityId as EntityId);
        comparisons = this.getClubReputationComparisons(entityId as EntityId);
        recommendations = this.generateClubReputationRecommendations(reputation, factors);
        break;
      case 'manager':
        factors = this.getManagerReputationFactors(entityId as EntityId);
        comparisons = this.getManagerReputationComparisons(entityId as EntityId);
        recommendations = this.generateManagerReputationRecommendations(reputation, factors);
        break;
      case 'nation':
        factors = this.getNationReputationFactors(entityId as string);
        comparisons = this.getNationReputationComparisons(entityId as string);
        recommendations = this.generateNationReputationRecommendations(reputation, factors);
        break;
    }

    // Get previous reputation (from 7 days ago)
    const previousReputation = history.length > 0 
      ? history[history.length - 1].oldValue 
      : reputation.value;

    return {
      entityId: entityId as EntityId,
      entityType,
      currentReputation: reputation.value,
      previousReputation,
      change: reputation.value - previousReputation,
      trend: reputation.trend,
      history: recentHistory,
      factors,
      comparisons,
      recommendations,
    };
  }

  /**
   * Get player reputation factors
   */
  private getPlayerReputationFactors(playerId: EntityId): Record<string, number> {
    const factors = this.playerFactors.get(playerId);
    if (!factors) return {};

    return {
      currentAbility: factors.currentAbility,
      potentialAbility: factors.potentialAbility,
      recentForm: factors.recentForm,
      consistency: factors.consistency,
      trophiesWon: factors.trophiesWon,
      individualAwards: factors.individualAwards,
      capsForNation: factors.capsForNation,
      goalsScored: factors.goalsScored,
      assists: factors.assists,
      cleanSheets: factors.cleanSheets,
      clubReputation: factors.clubReputation,
      firstTeamStatus: factors.firstTeamStatus ? 100 : 0,
      professionalism: factors.professionalism,
      sportsmanship: factors.sportsmanship,
      controversy: factors.controversy,
    };
  }

  /**
   * Get club reputation factors
   */
  private getClubReputationFactors(clubId: EntityId): Record<string, number> {
    const factors = this.clubFactors.get(clubId);
    if (!factors) return {};

    return {
      leaguePosition: factors.leaguePosition,
      recentForm: factors.recentForm,
      cupProgress: factors.cupProgress,
      trophiesWon: factors.trophiesWon,
      financialStability: factors.financialStability,
      transferActivity: factors.transferActivity,
      commercialRevenue: factors.commercialRevenue,
      squadQuality: factors.squadQuality,
      squadDepth: factors.squadDepth,
      youthProduction: factors.youthProduction,
      stadiumQuality: factors.stadiumQuality,
      trainingFacilities: factors.trainingFacilities,
      youthAcademy: factors.youthAcademy,
      fanBase: factors.fanBase,
      mediaPresence: factors.mediaPresence,
      historicalSuccess: factors.historicalSuccess,
    };
  }

  /**
   * Get manager reputation factors
   */
  private getManagerReputationFactors(managerId: EntityId): Record<string, number> {
    const factors = this.managerFactors.get(managerId);
    if (!factors) return {};

    return {
      winPercentage: factors.winPercentage,
      recentForm: factors.recentForm,
      trophiesWon: factors.trophiesWon,
      clubReputation: factors.clubReputation,
      clubLeagueLevel: factors.clubLeagueLevel,
      clubProgress: factors.clubProgress,
      tacticalSuccess: factors.tacticalSuccess,
      adaptability: factors.adaptability,
      leadership: factors.leadership,
      manManagement: factors.manManagement,
    };
  }

  /**
   * Get nation reputation factors
   */
  private getNationReputationFactors(nationCode: string): Record<string, number> {
    const factors = this.nationFactors.get(nationCode);
    if (!factors) return {};

    return {
      fifaRanking: factors.fifaRanking,
      recentResults: factors.recentResults,
      tournamentProgress: factors.tournamentProgress,
      youthQuality: factors.youthQuality,
      infrastructure: factors.infrastructure,
      coachingLevel: factors.coachingLevel,
      playerPoolQuality: factors.playerPoolQuality,
      playerPoolDepth: factors.playerPoolDepth,
      playersAbroad: factors.playersAbroad,
      historicalSuccess: factors.historicalSuccess,
      worldCupPedigree: factors.worldCupPedigree,
    };
  }

  /**
   * Get player reputation comparisons
   */
  private getPlayerReputationComparisons(playerId: EntityId): ReputationComparison[] {
    const player = this.players.get(playerId);
    if (!player) return [];

    const comparisons: ReputationComparison[] = [];
    const playerReputation = this.getReputation('player', playerId) || 0;

    // Compare with teammates
    this.players.forEach((teammate, teammateId) => {
      if (teammate.clubId === player.clubId && teammateId !== playerId) {
        const teammateReputation = this.getReputation('player', teammateId) || 0;
        comparisons.push({
          entityId: teammateId,
          entityType: 'player',
          name: `${teammate.firstName} ${teammate.lastName}`,
          reputation: teammateReputation,
          difference: playerReputation - teammateReputation,
        });
      }
    });

    // Sort by reputation difference
    comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    return comparisons.slice(0, 5); // Top 5 comparisons
  }

  /**
   * Get club reputation comparisons
   */
  private getClubReputationComparisons(clubId: EntityId): ReputationComparison[] {
    const club = this.clubs.get(clubId);
    if (!club) return [];

    const comparisons: ReputationComparison[] = [];
    const clubReputation = this.getReputation('club', clubId) || 0;

    // Compare with other clubs in the same league
    this.clubs.forEach((otherClub, otherClubId) => {
      if (otherClubId !== clubId && otherClub.leagueId === club.leagueId) {
        const otherReputation = this.getReputation('club', otherClubId) || 0;
        comparisons.push({
          entityId: otherClubId,
          entityType: 'club',
          name: otherClub.name,
          reputation: otherReputation,
          difference: clubReputation - otherReputation,
        });
      }
    });

    // Sort by reputation difference
    comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    return comparisons.slice(0, 5);
  }

  /**
   * Get manager reputation comparisons
   */
  private getManagerReputationComparisons(managerId: EntityId): ReputationComparison[] {
    const manager = this.managers.get(managerId);
    if (!manager) return [];

    const comparisons: ReputationComparison[] = [];
    const managerReputation = this.getReputation('manager', managerId) || 0;

    // Compare with other managers in the same league
    this.managers.forEach((otherManager, otherManagerId) => {
      if (otherManagerId !== managerId && otherManager.clubId !== manager.clubId) {
        const club = this.clubs.get(otherManager.clubId);
        const managerClub = this.clubs.get(manager.clubId);
        
        if (club && managerClub && club.leagueId === managerClub.leagueId) {
          const otherReputation = this.getReputation('manager', otherManagerId) || 0;
          comparisons.push({
            entityId: otherManagerId,
            entityType: 'manager',
            name: `${otherManager.firstName} ${otherManager.lastName}`,
            reputation: otherReputation,
            difference: managerReputation - otherReputation,
          });
        }
      }
    });

    // Sort by reputation difference
    comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    return comparisons.slice(0, 5);
  }

  /**
   * Get nation reputation comparisons
   */
  private getNationReputationComparisons(nationCode: string): ReputationComparison[] {
    const nation = this.nations.get(nationCode);
    if (!nation) return [];

    const comparisons: ReputationComparison[] = [];
    const nationReputation = this.getReputation('nation', nationCode) || 0;

    // Compare with other nations in the same continent
    this.nations.forEach((otherNation, otherCode) => {
      if (otherCode !== nationCode && otherNation.continentCode === nation.continentCode) {
        const otherReputation = this.getReputation('nation', otherCode) || 0;
        comparisons.push({
          entityId: otherCode,
          entityType: 'nation',
          name: otherNation.name,
          reputation: otherReputation,
          difference: nationReputation - otherReputation,
        });
      }
    });

    // Sort by reputation difference
    comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    return comparisons.slice(0, 5);
  }

  /**
   * Generate reputation recommendations for a player
   */
  private generatePlayerReputationRecommendations(
    reputation: Reputation,
    factors: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on reputation level
    if (reputation.value >= REPUTATION_THRESHOLDS.world_class) {
      recommendations.push('World class reputation. Maintain high performance to stay at the top.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.elite) {
      recommendations.push('Elite reputation. Consistently high performance can push you to world class.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.high) {
      recommendations.push('High reputation. Winning trophies or individual awards can push you to elite status.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.moderate) {
      recommendations.push('Moderate reputation. Improve performance and win awards to increase reputation.');
    } else {
      recommendations.push('Low reputation. Consistent good performances are needed to improve.');
    }

    // Specific recommendations based on factors
    if (factors.recentForm && factors.recentForm < 50) {
      recommendations.push('Poor recent form is affecting reputation. Improve match performances.');
    }
    if (factors.consistency && factors.consistency < 50) {
      recommendations.push('Inconsistent performances are limiting reputation growth. Be more consistent.');
    }
    if (factors.trophiesWon === 0) {
      recommendations.push('Winning trophies would significantly boost reputation.');
    }
    if (factors.individualAwards === 0) {
      recommendations.push('Winning individual awards would help increase reputation.');
    }
    if (factors.controversy && factors.controversy > 50) {
      recommendations.push('High controversy is damaging reputation. Avoid controversial actions.');
    }

    return recommendations;
  }

  /**
   * Generate reputation recommendations for a club
   */
  private generateClubReputationRecommendations(
    reputation: Reputation,
    factors: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on reputation level
    if (reputation.value >= REPUTATION_THRESHOLDS.world_class) {
      recommendations.push('World class reputation. Maintain success to stay at the top.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.elite) {
      recommendations.push('Elite reputation. Winning major trophies can push you to world class.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.high) {
      recommendations.push('High reputation. Consistently competing for trophies can push you to elite status.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.moderate) {
      recommendations.push('Moderate reputation. Improve league position and win cups to increase reputation.');
    } else {
      recommendations.push('Low reputation. Consistent good performances are needed to improve.');
    }

    // Specific recommendations based on factors
    if (factors.leaguePosition && factors.leaguePosition > 10) {
      recommendations.push(`League position (${factors.leaguePosition}th) is affecting reputation. Improve to move up the table.`);
    }
    if (factors.recentForm && factors.recentForm < 50) {
      recommendations.push('Poor recent form is damaging reputation. Improve match results.');
    }
    if (factors.financialStability && factors.financialStability < 50) {
      recommendations.push('Financial instability is affecting reputation. Improve financial management.');
    }
    if (factors.squadQuality && factors.squadQuality < 50) {
      recommendations.push('Low squad quality is limiting reputation. Sign better players.');
    }
    if (factors.stadiumQuality && factors.stadiumQuality < 50) {
      recommendations.push('Poor stadium quality is affecting reputation. Consider upgrading.');
    }

    return recommendations;
  }

  /**
   * Generate reputation recommendations for a manager
   */
  private generateManagerReputationRecommendations(
    reputation: Reputation,
    factors: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on reputation level
    if (reputation.value >= REPUTATION_THRESHOLDS.world_class) {
      recommendations.push('World class reputation. Maintain success to stay at the top.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.elite) {
      recommendations.push('Elite reputation. Winning major trophies can push you to world class.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.high) {
      recommendations.push('High reputation. Consistently winning can push you to elite status.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.moderate) {
      recommendations.push('Moderate reputation. Improve win percentage to increase reputation.');
    } else {
      recommendations.push('Low reputation. Better results are needed to improve.');
    }

    // Specific recommendations based on factors
    if (factors.winPercentage && factors.winPercentage < 50) {
      recommendations.push(`Win percentage (${factors.winPercentage}%) is too low. Improve results.`);
    }
    if (factors.recentForm && factors.recentForm < 50) {
      recommendations.push('Poor recent form is damaging reputation. Turn results around.');
    }
    if (factors.trophiesWon === 0) {
      recommendations.push('Winning trophies would significantly boost reputation.');
    }
    if (factors.clubProgress && factors.clubProgress < 50) {
      recommendations.push('Club is not progressing under your management. Improve performance.');
    }

    return recommendations;
  }

  /**
   * Generate reputation recommendations for a nation
   */
  private generateNationReputationRecommendations(
    reputation: Reputation,
    factors: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on reputation level
    if (reputation.value >= REPUTATION_THRESHOLDS.world_class) {
      recommendations.push('World class reputation. Maintain success to stay at the top.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.elite) {
      recommendations.push('Elite reputation. Winning major tournaments can push you to world class.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.high) {
      recommendations.push('High reputation. Consistently good results can push you to elite status.');
    } else if (reputation.value >= REPUTATION_THRESHOLDS.moderate) {
      recommendations.push('Moderate reputation. Improve FIFA ranking and tournament results.');
    } else {
      recommendations.push('Low reputation. Better results and player development are needed.');
    }

    // Specific recommendations based on factors
    if (factors.fifaRanking && factors.fifaRanking > 50) {
      recommendations.push(`FIFA ranking (${factors.fifaRanking}) is too low. Improve national team results.`);
    }
    if (factors.recentResults && factors.recentResults < 50) {
      recommendations.push('Poor recent results are damaging reputation. Improve match performances.');
    }
    if (factors.youthQuality && factors.youthQuality < 50) {
      recommendations.push('Poor youth development is affecting long-term reputation. Invest in youth.');
    }
    if (factors.infrastructure && factors.infrastructure < 50) {
      recommendations.push('Poor football infrastructure is limiting development. Improve facilities.');
    }

    return recommendations;
  }

  // ============================================
  // REPUTATION LEADERBOARD METHODS
  // ============================================

  /**
   * Generate a reputation leaderboard for an entity type
   */
  generateReputationLeaderboard(
    entityType: ReputableEntityType,
    limit: number = 20
  ): ReputationLeaderboard {
    const entries: ReputationLeaderboardEntry[] = [];

    this.reputations.forEach((reputation, key) => {
      if (reputation.entityType === entityType) {
        const name = this.getEntityName(reputation.entityType, reputation.entityId);
        const previousReputation = reputation.history.length > 0 
          ? reputation.history[reputation.history.length - 1].oldValue 
          : reputation.value;
        
        entries.push({
          entityId: reputation.entityId as EntityId,
          entityType: reputation.entityType,
          name,
          reputation: reputation.value,
          change: reputation.value - previousReputation,
          rank: 0, // Will be set after sorting
        });
      }
    });

    // Sort by reputation (descending)
    entries.sort((a, b) => b.reputation - a.reputation);

    // Set ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return {
      entityType,
      entries: entries.slice(0, limit),
      lastUpdated: this.getCurrentDate(),
    };
  }

  /**
   * Get entity name
   */
  private getEntityName(entityType: ReputableEntityType, entityId: EntityId | string): string {
    switch (entityType) {
      case 'player':
        const player = this.players.get(entityId as EntityId);
        return player ? `${player.firstName} ${player.lastName}` : `Player ${entityId}`;
      case 'club':
        const club = this.clubs.get(entityId as EntityId);
        return club ? club.name : `Club ${entityId}`;
      case 'manager':
        const manager = this.managers.get(entityId as EntityId);
        return manager ? `${manager.firstName} ${manager.lastName}` : `Manager ${entityId}`;
      case 'nation':
        const nation = this.nations.get(entityId as string);
        return nation ? nation.name : `Nation ${entityId}`;
      default:
        return `${entityType} ${entityId}`;
    }
  }

  // ============================================
  // FACTOR UPDATE METHODS
  // ============================================

  /**
   * Update player factors
   */
  updatePlayerFactors(playerId: EntityId, updates: Partial<PlayerReputationFactors>): void {
    const factors = this.playerFactors.get(playerId);
    if (factors) {
      this.playerFactors.set(playerId, { ...factors, ...updates });
    }
  }

  /**
   * Update club factors
   */
  updateClubFactors(clubId: EntityId, updates: Partial<ClubReputationFactors>): void {
    const factors = this.clubFactors.get(clubId);
    if (factors) {
      this.clubFactors.set(clubId, { ...factors, ...updates });
    }
  }

  /**
   * Update manager factors
   */
  updateManagerFactors(managerId: EntityId, updates: Partial<ManagerReputationFactors>): void {
    const factors = this.managerFactors.get(managerId);
    if (factors) {
      this.managerFactors.set(managerId, { ...factors, ...updates });
    }
  }

  /**
   * Update nation factors
   */
  updateNationFactors(nationCode: string, updates: Partial<NationReputationFactors>): void {
    const factors = this.nationFactors.get(nationCode);
    if (factors) {
      this.nationFactors.set(nationCode, { ...factors, ...updates });
    }
  }

  // ============================================
  // ENTITY MANAGEMENT METHODS
  // ============================================

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.initializePlayerReputation(player);
    this.initializePlayerFactors(player);
  }

  /**
   * Remove a player
   */
  removePlayer(playerId: EntityId): void {
    this.players.delete(playerId);
    const key = this.getEntityKey('player', playerId);
    this.reputations.delete(key);
    this.reputationEvents.delete(key);
    this.reputationMilestones.delete(key);
    this.playerFactors.delete(playerId);
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
    this.initializeClubReputation(club);
    this.initializeClubFactors(club);
  }

  /**
   * Remove a club
   */
  removeClub(clubId: EntityId): void {
    this.clubs.delete(clubId);
    const key = this.getEntityKey('club', clubId);
    this.reputations.delete(key);
    this.reputationEvents.delete(key);
    this.reputationMilestones.delete(key);
    this.clubFactors.delete(clubId);
  }

  /**
   * Add a manager
   */
  addManager(manager: Manager): void {
    this.managers.set(manager.id, manager);
    this.initializeManagerReputation(manager);
    this.initializeManagerFactors(manager);
  }

  /**
   * Remove a manager
   */
  removeManager(managerId: EntityId): void {
    this.managers.delete(managerId);
    const key = this.getEntityKey('manager', managerId);
    this.reputations.delete(key);
    this.reputationEvents.delete(key);
    this.reputationMilestones.delete(key);
    this.managerFactors.delete(managerId);
  }

  /**
   * Add a nation
   */
  addNation(nation: Nation): void {
    this.nations.set(nation.code, nation);
    this.initializeNationReputation(nation);
    this.initializeNationFactors(nation);
  }

  /**
   * Remove a nation
   */
  removeNation(nationCode: string): void {
    this.nations.delete(nationCode);
    const key = this.getEntityKey('nation', nationCode);
    this.reputations.delete(key);
    this.reputationEvents.delete(key);
    this.reputationMilestones.delete(key);
    this.nationFactors.delete(nationCode);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get entity key for storage
   */
  private getEntityKey(entityType: ReputableEntityType, entityId: EntityId | string): string {
    return `${entityType}_${entityId}`;
  }

  /**
   * Get current date
   */
  private getCurrentDate(): DateString {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): EntityId {
    return Math.floor(Math.random() * 1000000000);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.players.clear();
    this.clubs.clear();
    this.managers.clear();
    this.nations.clear();
    this.reputations.clear();
    this.reputationEvents.clear();
    this.reputationMilestones.clear();
    this.clubFactors.clear();
    this.playerFactors.clear();
    this.managerFactors.clear();
    this.nationFactors.clear();
  }
}
