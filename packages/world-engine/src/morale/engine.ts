// TACTICO World Engine - Morale Engine
// Handles player, manager, and team morale

import { EntityId, DateString, Player, Club, Manager } from '../core/types';
import {
  MoraleLevel,
  MoraleCategory,
  MoraleFactor,
  MoraleEvent,
  MoraleState,
  TeamMorale,
  MoraleModifier,
  MoraleCondition,
  MoraleBoost,
  MoralePenalty,
  MoraleReport,
  PlayerMoraleFactors,
  TeamMoraleFactors,
  BASE_MORALE_VALUES,
  MORALE_EFFECT_WEIGHTS,
  MATCH_RESULT_MORALE_EFFECTS,
  TRAINING_MORALE_EFFECTS,
  CONTRACT_MORALE_EFFECTS,
  TRANSFER_MORALE_EFFECTS,
  INJURY_MORALE_EFFECTS,
  DEFAULT_MORALE_BOOSTS,
  DEFAULT_MORALE_PENALTIES,
  MORALE_THRESHOLDS,
  MORALE_EFFECT_DURATIONS,
} from './types';

/**
 * MoraleEngine - Manages morale for players, managers, and teams
 * 
 * Handles:
 * - Individual morale tracking
 * - Team morale aggregation
 * - Morale events and effects
 * - Morale modifiers and boosts
 * - Morale reports and recommendations
 */
export class MoraleEngine {
  private players: Map<EntityId, Player> = new Map();
  private clubs: Map<EntityId, Club> = new Map();
  private managers: Map<EntityId, Manager> = new Map();
  private playerMorale: Map<EntityId, MoraleState> = new Map();
  private managerMorale: Map<EntityId, MoraleState> = new Map();
  private clubMorale: Map<EntityId, MoraleState> = new Map();
  private teamMorale: Map<EntityId, TeamMorale> = new Map();
  private moraleModifiers: Map<MoraleCategory, MoraleModifier[]> = new Map();
  private moraleBoosts: MoraleBoost[] = [...DEFAULT_MORALE_BOOSTS];
  private moralePenalties: MoralePenalty[] = [...DEFAULT_MORALE_PENALTIES];
  private moraleEvents: Map<EntityId, MoraleEvent[]> = new Map();

  /**
   * Initialize the morale engine
   */
  initialize(
    players: Player[],
    clubs: Club[],
    managers: Manager[]
  ): void {
    players.forEach(player => {
      this.players.set(player.id, player);
      this.playerMorale.set(player.id, this.createInitialMoraleState(player.id, 'player'));
    });
    
    clubs.forEach(club => {
      this.clubs.set(club.id, club);
      this.clubMorale.set(club.id, this.createInitialMoraleState(club.id, 'club'));
      this.teamMorale.set(club.id, this.createInitialTeamMorale(club.id));
    });
    
    managers.forEach(manager => {
      this.managers.set(manager.id, manager);
      this.managerMorale.set(manager.id, this.createInitialMoraleState(manager.id, 'manager'));
    });

    // Initialize morale modifiers
    this.initializeMoraleModifiers();
  }

  /**
   * Create initial morale state for an entity
   */
  private createInitialMoraleState(entityId: EntityId, entityType: 'player' | 'manager' | 'club' | 'team'): MoraleState {
    const baseMorale = BASE_MORALE_VALUES[entityType] || 70;
    
    return {
      entityId,
      entityType,
      currentMorale: baseMorale,
      baseMorale,
      temporaryEffects: [],
      history: [],
      trend: 'stable',
    };
  }

  /**
   * Create initial team morale
   */
  private createInitialTeamMorale(clubId: EntityId): TeamMorale {
    return {
      clubId,
      averageMorale: BASE_MORALE_VALUES.team,
      playerMorale: {},
      positionMorale: {},
      squadHarmony: 70,
      managerRelationship: 70,
      fanRelationship: 70,
    };
  }

  /**
   * Initialize morale modifiers
   */
  private initializeMoraleModifiers(): void {
    // Add default modifiers for each category
    Object.keys(MORALE_EFFECT_WEIGHTS).forEach(category => {
      this.moraleModifiers.set(category as MoraleCategory, []);
    });
  }

  // ============================================
  // MORALE UPDATE METHODS
  // ============================================

  /**
   * Update morale for all entities
   * @param date Current date
   */
  updateMorale(date: DateString): void {
    // Update player morale
    this.playerMorale.forEach((state, playerId) => {
      this.updateEntityMorale(state, date);
    });

    // Update manager morale
    this.managerMorale.forEach((state, managerId) => {
      this.updateEntityMorale(state, date);
    });

    // Update club morale
    this.clubMorale.forEach((state, clubId) => {
      this.updateEntityMorale(state, date);
    });

    // Update team morale
    this.teamMorale.forEach((teamState, clubId) => {
      this.updateTeamMorale(clubId, date);
    });
  }

  /**
   * Update morale for a single entity
   */
  private updateEntityMorale(state: MoraleState, date: DateString): void {
    // Remove expired temporary effects
    state.temporaryEffects = state.temporaryEffects.filter(effect => {
      if (effect.expiresAt < date) {
        // Add to history
        state.history.push(effect);
        return false;
      }
      return true;
    });

    // Recalculate current morale
    const temporaryEffect = state.temporaryEffects.reduce(
      (sum, effect) => sum + effect.effect,
      0
    );
    
    const newMorale = Math.min(
      100,
      Math.max(
        0,
        state.baseMorale + temporaryEffect
      )
    );

    // Update trend
    const previousMorale = state.currentMorale;
    if (newMorale > previousMorale + 5) {
      state.trend = 'improving';
    } else if (newMorale < previousMorale - 5) {
      state.trend = 'declining';
    } else {
      state.trend = 'stable';
    }

    state.currentMorale = newMorale;
  }

  /**
   * Update team morale for a club
   */
  private updateTeamMorale(clubId: EntityId, date: DateString): void {
    const teamState = this.teamMorale.get(clubId);
    if (!teamState) return;

    // Calculate average player morale
    let totalMorale = 0;
    let playerCount = 0;
    const positionMorale: Record<string, { total: number; count: number }> = {};

    this.playerMorale.forEach((state, playerId) => {
      const player = this.players.get(playerId);
      if (player && player.clubId === clubId) {
        totalMorale += state.currentMorale;
        playerCount++;

        // Track by position
        const position = player.position;
        if (!positionMorale[position]) {
          positionMorale[position] = { total: 0, count: 0 };
        }
        positionMorale[position].total += state.currentMorale;
        positionMorale[position].count++;
      }
    });

    teamState.averageMorale = playerCount > 0 ? Math.round(totalMorale / playerCount) : 70;

    // Calculate position morale
    teamState.positionMorale = {};
    for (const [position, data] of Object.entries(positionMorale)) {
      teamState.positionMorale[position] = Math.round(data.total / data.count);
    }

    // Update squad harmony (based on morale variance)
    teamState.squadHarmony = this.calculateSquadHarmony(clubId);

    // Update manager relationship
    teamState.managerRelationship = this.calculateManagerRelationship(clubId);

    // Update fan relationship
    teamState.fanRelationship = this.calculateFanRelationship(clubId);
  }

  /**
   * Calculate squad harmony (0-100)
   */
  private calculateSquadHarmony(clubId: EntityId): MoraleLevel {
    const club = this.clubs.get(clubId);
    if (!club) return 70;

    const playerMorales: number[] = [];
    this.playerMorale.forEach((state, playerId) => {
      const player = this.players.get(playerId);
      if (player && player.clubId === clubId) {
        playerMorales.push(state.currentMorale);
      }
    });

    if (playerMorales.length === 0) return 70;

    // Calculate variance
    const avgMorale = playerMorales.reduce((sum, m) => sum + m, 0) / playerMorales.length;
    const variance = playerMorales.reduce((sum, m) => sum + Math.pow(m - avgMorale, 2), 0) / playerMorales.length;
    const stdDev = Math.sqrt(variance);

    // Higher standard deviation = lower harmony
    // 0 stdDev = 100 harmony, 20 stdDev = 0 harmony
    return Math.max(0, Math.min(100, 100 - stdDev * 5));
  }

  /**
   * Calculate manager relationship (0-100)
   */
  private calculateManagerRelationship(clubId: EntityId): MoraleLevel {
    const club = this.clubs.get(clubId);
    if (!club) return 70;

    const manager = this.managers.get(club.id);
    if (!manager) return 70;

    // Get manager's morale
    const managerState = this.managerMorale.get(manager.id);
    const managerMorale = managerState?.currentMorale || 70;

    // Get average player morale
    const teamState = this.teamMorale.get(clubId);
    const avgPlayerMorale = teamState?.averageMorale || 70;

    // Relationship is based on both manager and player morale
    return Math.round((managerMorale + avgPlayerMorale) / 2);
  }

  /**
   * Calculate fan relationship (0-100)
   */
  private calculateFanRelationship(clubId: EntityId): MoraleLevel {
    const club = this.clubs.get(clubId);
    if (!club) return 70;

    // Based on recent results (simplified for now)
    // In a real implementation, this would be based on actual match results
    return Math.min(100, club.reputation + 20);
  }

  // ============================================
  // MORALE EVENT METHODS
  // ============================================

  /**
   * Add a morale event
   */
  addMoraleEvent(event: Omit<MoraleEvent, 'id' | 'expiresAt' | 'isActive'>): MoraleEvent {
    const id = this.generateId();
    const duration = MORALE_EFFECT_DURATIONS[event.category] || 7;
    const expiresAt = this.addDaysToDate(event.date, duration);

    const fullEvent: MoraleEvent = {
      id,
      ...event,
      expiresAt,
      isActive: true,
    };

    // Add to the appropriate map
    if (event.entityType === 'player') {
      if (!this.moraleEvents.has(event.entityId)) {
        this.moraleEvents.set(event.entityId, []);
      }
      this.moraleEvents.get(event.entityId)!.push(fullEvent);
      
      // Add to player's temporary effects
      const playerState = this.playerMorale.get(event.entityId);
      if (playerState) {
        playerState.temporaryEffects.push(fullEvent);
        this.playerMorale.set(event.entityId, playerState);
      }
    } else if (event.entityType === 'manager') {
      if (!this.moraleEvents.has(event.entityId)) {
        this.moraleEvents.set(event.entityId, []);
      }
      this.moraleEvents.get(event.entityId)!.push(fullEvent);
      
      const managerState = this.managerMorale.get(event.entityId);
      if (managerState) {
        managerState.temporaryEffects.push(fullEvent);
        this.managerMorale.set(event.entityId, managerState);
      }
    } else if (event.entityType === 'club') {
      if (!this.moraleEvents.has(event.entityId)) {
        this.moraleEvents.set(event.entityId, []);
      }
      this.moraleEvents.get(event.entityId)!.push(fullEvent);
      
      const clubState = this.clubMorale.get(event.entityId);
      if (clubState) {
        clubState.temporaryEffects.push(fullEvent);
        this.clubMorale.set(event.entityId, clubState);
      }
    } else if (event.entityType === 'team') {
      // Team events affect all players in the team
      const club = this.clubs.get(event.entityId);
      if (club) {
        this.players.forEach((player, playerId) => {
          if (player.clubId === event.entityId) {
            const playerEvent: MoraleEvent = {
              ...fullEvent,
              entityId: playerId,
              entityType: 'player',
            };
            if (!this.moraleEvents.has(playerId)) {
              this.moraleEvents.set(playerId, []);
            }
            this.moraleEvents.get(playerId)!.push(playerEvent);
            
            const playerState = this.playerMorale.get(playerId);
            if (playerState) {
              playerState.temporaryEffects.push(playerEvent);
              this.playerMorale.set(playerId, playerState);
            }
          }
        });
      }
    }

    return fullEvent;
  }

  /**
   * Add a match result morale event
   */
  addMatchResultEvent(
    clubId: EntityId,
    result: 'win' | 'draw' | 'loss' | 'heavy_loss' | 'last_minute_win' | 'last_minute_loss' | 'derby_win' | 'derby_loss' | 'cup_win' | 'cup_loss',
    date: DateString,
    matchId?: EntityId
  ): MoraleEvent[] {
    const effect = MATCH_RESULT_MORALE_EFFECTS[result];
    const events: MoraleEvent[] = [];

    // Add team event
    const teamEvent = this.addMoraleEvent({
      entityId: clubId,
      entityType: 'team',
      category: 'match_result',
      description: `Team ${result.replace('_', ' ')}`,
      effect,
      date,
    });
    events.push(teamEvent);

    // Add individual player events (based on performance)
    this.players.forEach((player, playerId) => {
      if (player.clubId === clubId) {
        // Calculate individual effect based on whether they played and their rating
        let individualEffect = effect * 0.5; // Base effect for all players
        
        // If player played and had a good rating, increase effect
        // If player didn't play, decrease effect
        // (In a real implementation, this would use actual match data)
        const played = Math.random() > 0.3; // 70% chance player played
        const rating = played ? 6 + Math.random() * 4 : 0; // Rating 6-10 or 0 if didn't play
        
        if (played) {
          individualEffect *= 1 + (rating - 7) * 0.1; // +10% per rating point above 7
        } else {
          individualEffect *= 0.5; // 50% effect if didn't play
        }

        const playerEvent = this.addMoraleEvent({
          entityId: playerId,
          entityType: 'player',
          category: 'match_result',
          description: `Team ${result.replace('_', ' ')} - ${played ? `Played (${rating}/10)` : 'Did not play'}`,
          effect: Math.round(individualEffect),
          date,
        });
        events.push(playerEvent);
      }
    });

    return events;
  }

  /**
   * Add a training morale event
   */
  addTrainingEvent(
    playerId: EntityId,
    result: 'excellent_session' | 'good_session' | 'average_session' | 'poor_session' | 'very_poor_session' | 'individual_focus' | 'ignored',
    date: DateString
  ): MoraleEvent {
    const effect = TRAINING_MORALE_EFFECTS[result];
    
    return this.addMoraleEvent({
      entityId: playerId,
      entityType: 'player',
      category: 'training',
      description: `Training: ${result.replace('_', ' ')}`,
      effect,
      date,
    });
  }

  /**
   * Add a contract morale event
   */
  addContractEvent(
    playerId: EntityId,
    eventType: 'new_contract' | 'contract_extension' | 'wage_increase' | 'wage_decrease' | 'contract_expiring' | 'contract_expired' | 'released' | 'loaned_out' | 'recalled_from_loan',
    date: DateString
  ): MoraleEvent {
    const effect = CONTRACT_MORALE_EFFECTS[eventType];
    
    return this.addMoraleEvent({
      entityId: playerId,
      entityType: 'player',
      category: 'contract',
      description: `Contract: ${eventType.replace('_', ' ')}`,
      effect,
      date,
    });
  }

  /**
   * Add a transfer morale event
   */
  addTransferEvent(
    playerId: EntityId,
    eventType: 'transfer_request_accepted' | 'transfer_request_rejected' | 'sold' | 'bought' | 'joined_bigger_club' | 'joined_smaller_club' | 'transfer_to_rival' | 'transfer_from_rival',
    date: DateString
  ): MoraleEvent {
    const effect = TRANSFER_MORALE_EFFECTS[eventType];
    
    return this.addMoraleEvent({
      entityId: playerId,
      entityType: 'player',
      category: 'transfer',
      description: `Transfer: ${eventType.replace('_', ' ')}`,
      effect,
      date,
    });
  }

  /**
   * Add an injury morale event
   */
  addInjuryEvent(
    playerId: EntityId,
    injuryType: 'minor_injury' | 'moderate_injury' | 'serious_injury' | 'career_ending_injury' | 'recovered_from_injury' | 'teammate_injured' | 'teammate_recovered',
    date: DateString
  ): MoraleEvent {
    const effect = INJURY_MORALE_EFFECTS[injuryType];
    
    return this.addMoraleEvent({
      entityId: playerId,
      entityType: 'player',
      category: 'injury',
      description: `Injury: ${injuryType.replace('_', ' ')}`,
      effect,
      date,
    });
  }

  /**
   * Add a team meeting morale event
   */
  addTeamMeetingEvent(
    clubId: EntityId,
    result: 'positive' | 'neutral' | 'negative',
    date: DateString
  ): MoraleEvent {
    let effect = 0;
    if (result === 'positive') effect = 10;
    else if (result === 'negative') effect = -10;

    return this.addMoraleEvent({
      entityId: clubId,
      entityType: 'team',
      category: 'team_meeting',
      description: `Team meeting: ${result}`,
      effect,
      date,
    });
  }

  /**
   * Add a press conference morale event
   */
  addPressConferenceEvent(
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club',
    sentiment: 'positive' | 'neutral' | 'negative',
    date: DateString
  ): MoraleEvent {
    let effect = 0;
    if (sentiment === 'positive') effect = 5;
    else if (sentiment === 'negative') effect = -5;

    return this.addMoraleEvent({
      entityId,
      entityType,
      category: 'press_conference',
      description: `Press conference: ${sentiment}`,
      effect,
      date,
    });
  }

  // ============================================
  // MORALE MODIFIER METHODS
  // ============================================

  /**
   * Add a morale modifier
   */
  addMoraleModifier(modifier: MoraleModifier): void {
    if (!this.moraleModifiers.has(modifier.category)) {
      this.moraleModifiers.set(modifier.category, []);
    }
    this.moraleModifiers.get(modifier.category)!.push(modifier);
  }

  /**
   * Remove a morale modifier
   */
  removeMoraleModifier(modifierId: EntityId): void {
    this.moraleModifiers.forEach((modifiers, category) => {
      this.moraleModifiers.set(
        category,
        modifiers.filter(m => m.id !== modifierId)
      );
    });
  }

  /**
   * Get morale modifiers for a category
   */
  getMoraleModifiers(category: MoraleCategory): MoraleModifier[] {
    return this.moraleModifiers.get(category) || [];
  }

  /**
   * Apply morale modifiers to an entity
   */
  applyMoraleModifiers(
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team',
    date: DateString
  ): void {
    const state = this.getMoraleState(entityId, entityType);
    if (!state) return;

    // Get all applicable modifiers
    const allModifiers: MoraleModifier[] = [];
    this.moraleModifiers.forEach(modifiers => {
      allModifiers.push(...modifiers);
    });

    // Apply each modifier
    allModifiers.forEach(modifier => {
      // Check conditions
      if (this.checkMoraleConditions(modifier.conditions, entityId, entityType)) {
        this.addMoraleEvent({
          entityId,
          entityType,
          category: modifier.category,
          description: modifier.description,
          effect: modifier.effect,
          date,
        });
      }
    });
  }

  /**
   * Check if morale conditions are met
   */
  private checkMoraleConditions(
    conditions: MoraleCondition[] | undefined,
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team'
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    const state = this.getMoraleState(entityId, entityType);
    if (!state) return false;

    for (const condition of conditions) {
      let value: number | string = 0;

      switch (condition.type) {
        case 'min_morale':
          value = state.currentMorale;
          break;
        case 'max_morale':
          value = state.currentMorale;
          break;
        case 'player_age':
          if (entityType === 'player') {
            const player = this.players.get(entityId);
            value = player?.age || 0;
          }
          break;
        case 'player_position':
          if (entityType === 'player') {
            const player = this.players.get(entityId);
            value = player?.position || '';
          }
          break;
        case 'team_performance':
          if (entityType === 'team' || entityType === 'player') {
            const clubId = entityType === 'team' ? entityId : this.players.get(entityId)?.clubId;
            if (clubId) {
              const teamState = this.teamMorale.get(clubId);
              value = teamState?.averageMorale || 0;
            }
          }
          break;
        case 'contract_status':
          if (entityType === 'player') {
            const player = this.players.get(entityId);
            // In a real implementation, check contract status
            value = 'active';
          }
          break;
      }

      // Compare values
      const conditionValue = condition.value;
      switch (condition.comparison) {
        case '==':
          if (value !== conditionValue) return false;
          break;
        case '!=':
          if (value === conditionValue) return false;
          break;
        case '>':
          if (typeof value === 'number' && typeof conditionValue === 'number') {
            if (value <= conditionValue) return false;
          }
          break;
        case '<':
          if (typeof value === 'number' && typeof conditionValue === 'number') {
            if (value >= conditionValue) return false;
          }
          break;
        case '>=':
          if (typeof value === 'number' && typeof conditionValue === 'number') {
            if (value < conditionValue) return false;
          }
          break;
        case '<=':
          if (typeof value === 'number' && typeof conditionValue === 'number') {
            if (value > conditionValue) return false;
          }
          break;
      }
    }

    return true;
  }

  // ============================================
  // MORALE BOOST AND PENALTY METHODS
  // ============================================

  /**
   * Apply a morale boost
   */
  applyMoraleBoost(
    boostId: EntityId,
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team',
    date: DateString
  ): boolean {
    const boost = this.moraleBoosts.find(b => b.id === boostId);
    if (!boost) return false;

    // Check cooldown
    const lastApplication = this.getLastBoostApplication(boostId, entityId);
    if (lastApplication) {
      const daysSinceLast = this.getDaysBetween(lastApplication, date);
      if (daysSinceLast < boost.cooldown) {
        return false; // Still in cooldown
      }
    }

    // Apply the boost
    this.addMoraleEvent({
      entityId,
      entityType,
      category: 'team_meeting', // Morale boosts are categorized as team meetings for now
      description: `Morale boost: ${boost.name}`,
      effect: boost.effect,
      date,
    });

    // Record application
    this.recordBoostApplication(boostId, entityId, date);

    return true;
  }

  /**
   * Get last application date for a boost
   */
  private getLastBoostApplication(
    boostId: EntityId,
    entityId: EntityId
  ): DateString | null {
    // In a real implementation, this would track when boosts were applied
    // For now, return null (no tracking)
    return null;
  }

  /**
   * Record boost application
   */
  private recordBoostApplication(
    boostId: EntityId,
    entityId: EntityId,
    date: DateString
  ): void {
    // In a real implementation, this would store the application date
    // For now, do nothing
  }

  /**
   * Apply a morale penalty
   */
  applyMoralePenalty(
    penaltyId: EntityId,
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team',
    date: DateString
  ): boolean {
    const penalty = this.moralePenalties.find(p => p.id === penaltyId);
    if (!penalty) return false;

    this.addMoraleEvent({
      entityId,
      entityType,
      category: 'match_result', // Morale penalties are categorized as match results for now
      description: `Morale penalty: ${penalty.name}`,
      effect: penalty.effect,
      date,
    });

    return true;
  }

  // ============================================
  // MORALE REPORT METHODS
  // ============================================

  /**
   * Generate a morale report for an entity
   */
  generateMoraleReport(
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team'
  ): MoraleReport | null {
    const state = this.getMoraleState(entityId, entityType);
    if (!state) return null;

    // Get recent events (last 5)
    const allEvents = entityType === 'team' 
      ? this.getTeamMoraleEvents(entityId)
      : this.moraleEvents.get(entityId) || [];
    const recentEvents = [...allEvents]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generateMoraleRecommendations(state, entityType);

    return {
      entityId,
      entityType,
      currentMorale: state.currentMorale,
      baseMorale: state.baseMorale,
      temporaryEffects: state.temporaryEffects,
      recentEvents,
      trend: state.trend,
      recommendations,
    };
  }

  /**
   * Generate morale recommendations
   */
  private generateMoraleRecommendations(
    state: MoraleState,
    entityType: 'player' | 'manager' | 'club' | 'team'
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on morale level
    if (state.currentMorale >= MORALE_THRESHOLDS.excellent) {
      recommendations.push('Morale is excellent. Keep up the good work!');
    } else if (state.currentMorale >= MORALE_THRESHOLDS.very_good) {
      recommendations.push('Morale is very good. Consider small boosts to maintain it.');
    } else if (state.currentMorale >= MORALE_THRESHOLDS.good) {
      recommendations.push('Morale is good. Address any minor issues before they become problems.');
    } else if (state.currentMorale >= MORALE_THRESHOLDS.average) {
      recommendations.push('Morale is average. Consider team building activities.');
    } else if (state.currentMorale >= MORALE_THRESHOLDS.poor) {
      recommendations.push('Morale is poor. Address the root causes immediately.');
    } else if (state.currentMorale >= MORALE_THRESHOLDS.very_poor) {
      recommendations.push('Morale is very poor. Urgent action is required.');
    } else {
      recommendations.push('Morale is terrible. Consider major changes to improve the situation.');
    }

    // Trend-based recommendations
    if (state.trend === 'declining') {
      recommendations.push('Morale is declining. Investigate and address the causes.');
    } else if (state.trend === 'improving') {
      recommendations.push('Morale is improving. Continue with current approaches.');
    }

    // Entity-type specific recommendations
    if (entityType === 'player') {
      const player = this.players.get(state.entityId);
      if (player) {
        if (player.fatigue > 70) {
          recommendations.push('Player is fatigued. Consider rest or rotation.');
        }
        if (player.injury) {
          recommendations.push('Player is injured. Ensure proper recovery.');
        }
      }
    } else if (entityType === 'team') {
      const teamState = this.teamMorale.get(state.entityId);
      if (teamState) {
        if (teamState.squadHarmony < 50) {
          recommendations.push('Squad harmony is low. Organize team building activities.');
        }
        if (teamState.managerRelationship < 50) {
          recommendations.push('Manager-player relationship is strained. Improve communication.');
        }
        if (teamState.fanRelationship < 50) {
          recommendations.push('Fan relationship is poor. Engage with fans and improve results.');
        }
      }
    }

    return recommendations;
  }

  // ============================================
  // GETTERS AND SETTERS
  // ============================================

  /**
   * Get morale state for an entity
   */
  getMoraleState(
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team'
  ): MoraleState | null {
    switch (entityType) {
      case 'player':
        return this.playerMorale.get(entityId) || null;
      case 'manager':
        return this.managerMorale.get(entityId) || null;
      case 'club':
        return this.clubMorale.get(entityId) || null;
      case 'team':
        // For teams, return the club's morale state
        return this.clubMorale.get(entityId) || null;
      default:
        return null;
    }
  }

  /**
   * Get team morale for a club
   */
  getTeamMorale(clubId: EntityId): TeamMorale | null {
    return this.teamMorale.get(clubId) || null;
  }

  /**
   * Get player morale
   */
  getPlayerMorale(playerId: EntityId): MoraleLevel | null {
    const state = this.playerMorale.get(playerId);
    return state?.currentMorale || null;
  }

  /**
   * Set base morale for an entity
   */
  setBaseMorale(
    entityId: EntityId,
    entityType: 'player' | 'manager' | 'club' | 'team',
    morale: MoraleLevel
  ): void {
    const state = this.getMoraleState(entityId, entityType);
    if (state) {
      state.baseMorale = Math.min(100, Math.max(0, morale));
    }
  }

  /**
   * Get all morale events for an entity
   */
  getMoraleEvents(entityId: EntityId): MoraleEvent[] {
    return this.moraleEvents.get(entityId) || [];
  }

  /**
   * Get team morale events (events affecting the whole team)
   */
  private getTeamMoraleEvents(clubId: EntityId): MoraleEvent[] {
    const events: MoraleEvent[] = [];
    this.moraleEvents.forEach((entityEvents, entityId) => {
      const entity = this.players.get(entityId) || this.managers.get(entityId);
      if (entity && 'clubId' in entity && entity.clubId === clubId) {
        events.push(...entityEvents.filter(e => e.entityType === 'team'));
      }
    });
    return events;
  }

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.playerMorale.set(player.id, this.createInitialMoraleState(player.id, 'player'));

    // Add to team morale if they have a club
    if (player.clubId) {
      this.updateTeamMorale(player.clubId, this.getCurrentDate());
    }
  }

  /**
   * Remove a player
   */
  removePlayer(playerId: EntityId): void {
    this.players.delete(playerId);
    this.playerMorale.delete(playerId);
    this.moraleEvents.delete(playerId);
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
    this.clubMorale.set(club.id, this.createInitialMoraleState(club.id, 'club'));
    this.teamMorale.set(club.id, this.createInitialTeamMorale(club.id));
  }

  /**
   * Remove a club
   */
  removeClub(clubId: EntityId): void {
    this.clubs.delete(clubId);
    this.clubMorale.delete(clubId);
    this.teamMorale.delete(clubId);
    this.moraleEvents.delete(clubId);
  }

  /**
   * Add a manager
   */
  addManager(manager: Manager): void {
    this.managers.set(manager.id, manager);
    this.managerMorale.set(manager.id, this.createInitialMoraleState(manager.id, 'manager'));
  }

  /**
   * Remove a manager
   */
  removeManager(managerId: EntityId): void {
    this.managers.delete(managerId);
    this.managerMorale.delete(managerId);
    this.moraleEvents.delete(managerId);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get current date
   */
  private getCurrentDate(): DateString {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Add days to a date
   */
  private addDaysToDate(date: DateString, days: number): DateString {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get days between two dates
   */
  private getDaysBetween(startDate: DateString, endDate: DateString): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
    this.playerMorale.clear();
    this.managerMorale.clear();
    this.clubMorale.clear();
    this.teamMorale.clear();
    this.moraleModifiers.clear();
    this.moraleEvents.clear();
  }
}
