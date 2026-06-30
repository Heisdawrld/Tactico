// TACTICO World Engine - Core Engine
// Manages the living football universe: time, seasons, training, transfers, etc.

import {
  WorldState,
  WorldTickResult,
  WorldTickType,
  WorldChanges,
  Player,
  Club,
  Nation,
  Manager,
  PlayerChange,
  ClubChange,
  ManagerChange,
  TransferUpdate,
  InjuryUpdate,
  ContractUpdate,
  FinanceUpdate,
  YouthUpdate,
  ReputationUpdate,
  MediaUpdate,
  MatchUpdate,
  LeagueTableUpdate,
  DateString,
  Timestamp,
} from './types';

/**
 * WorldEngine - Core class for managing the football universe
 * 
 * This is the heart of TACTICO. It handles:
 * - Time progression (minutes, hours, days, weeks, months)
 * - Season management
 * - Player development and training
 * - Club finances and facilities
 * - Transfers and contracts
 * - Injuries and morale
 * - Youth intake
 * - Reputation changes
 * - Media stories
 * - Match scheduling and results
 */
export class WorldEngine {
  private state: WorldState;
  private nations: Map<string, Nation> = new Map();
  private leagues: Map<number, any> = new Map(); // Would import League type
  private clubs: Map<number, Club> = new Map();
  private players: Map<number, Player> = new Map();
  private managers: Map<number, Manager> = new Map();
  
  private tickIntervals: Map<WorldTickType, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  
  // Engine components (would be initialized properly)
  private timeEngine: any; // TimeEngine
  private trainingEngine: any; // TrainingEngine
  private developmentEngine: any; // DevelopmentEngine
  private financeEngine: any; // FinanceEngine
  private contractEngine: any; // ContractEngine
  private injuryEngine: any; // InjuryEngine
  private moraleEngine: any; // MoraleEngine
  private youthEngine: any; // YouthEngine
  private reputationEngine: any; // ReputationEngine
  private mediaEngine: any; // MediaEngine

  /**
   * Create a new WorldEngine instance
   * @param initialDate Starting date for the world (YYYY-MM-DD)
   */
  constructor(initialDate: DateString = '2026-06-07') {
    // Initialize world state
    this.state = {
      id: 1,
      currentDate: initialDate,
      currentTime: new Date(`${initialDate}T00:00:00`).toISOString(),
      currentSeason: 2026,
      currentWeek: this.getWeekOfYear(initialDate),
      currentDay: this.getDayOfYear(initialDate),
      transferWindowOpen: this.isTransferWindowOpen(initialDate),
      youthIntakeDay: 1,
      lastTick: new Date().toISOString(),
      lastTickType: 'day',
    };

    // Initialize engines (would be proper instances in real implementation)
    this.timeEngine = {};
    this.trainingEngine = {};
    this.developmentEngine = {};
    this.financeEngine = {};
    this.contractEngine = {};
    this.injuryEngine = {};
    this.moraleEngine = {};
    this.youthEngine = {};
    this.reputationEngine = {};
    this.mediaEngine = {};
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize the world with nations, leagues, clubs, players, and managers
   * @param data World initialization data
   */
  initialize(data: {
    nations?: Nation[];
    leagues?: any[]; // Would use League type
    clubs?: Club[];
    players?: Player[];
    managers?: Manager[];
  }): void {
    // Load nations
    if (data.nations) {
      data.nations.forEach(nation => this.nations.set(nation.code, nation));
    }

    // Load leagues
    if (data.leagues) {
      data.leagues.forEach(league => this.leagues.set(league.id, league));
    }

    // Load clubs
    if (data.clubs) {
      data.clubs.forEach(club => this.clubs.set(club.id, club));
    }

    // Load players
    if (data.players) {
      data.players.forEach(player => this.players.set(player.id, player));
    }

    // Load managers
    if (data.managers) {
      data.managers.forEach(manager => this.managers.set(manager.id, manager));
    }

    console.log(`World initialized with ${this.nations.size} nations, ${this.leagues.size} leagues, ${this.clubs.size} clubs, ${this.players.size} players, ${this.managers.size} managers`);
  }

  // ============================================
  // WORLD TICK SYSTEM
  // ============================================

  /**
   * Start the world simulation
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('World Engine started');

    // Start all tick intervals
    this.startTickIntervals();
  }

  /**
   * Stop the world simulation
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('World Engine stopped');

    // Clear all tick intervals
    this.clearTickIntervals();
  }

  /**
   * Start all tick intervals
   */
  private startTickIntervals(): void {
    // Minute tick (for match simulation)
    this.startTickInterval('minute', 60000); // 1 minute

    // Hour tick (for training, fatigue recovery)
    this.startTickInterval('hour', 3600000); // 1 hour

    // Day tick (for morale, injuries, contracts)
    this.startTickInterval('day', 86400000); // 1 day

    // Week tick (for development, finances, youth intake)
    this.startTickInterval('week', 604800000); // 1 week

    // Month tick (for reputation, long-term development)
    this.startTickInterval('month', 2592000000); // 1 month
  }

  /**
   * Start a specific tick interval
   */
  private startTickInterval(tickType: WorldTickType, intervalMs: number): void {
    // Clear existing interval for this tick type
    this.clearTickInterval(tickType);

    // Create new interval
    const interval = setInterval(() => {
      this.tick(tickType);
    }, intervalMs);

    this.tickIntervals.set(tickType, interval);
  }

  /**
   * Clear all tick intervals
   */
  private clearTickIntervals(): void {
    this.tickIntervals.forEach(interval => clearInterval(interval));
    this.tickIntervals.clear();
  }

  /**
   * Clear a specific tick interval
   */
  private clearTickInterval(tickType: WorldTickType): void {
    const interval = this.tickIntervals.get(tickType);
    if (interval) {
      clearInterval(interval);
      this.tickIntervals.delete(tickType);
    }
  }

  /**
   * Perform a world tick
   * @param tickType Type of tick to perform
   */
  tick(tickType: WorldTickType): WorldTickResult {
    const startTime = Date.now();
    const changes: WorldChanges = {
      players: [],
      clubs: [],
      managers: [],
      transfers: [],
      injuries: [],
      contracts: [],
      finances: [],
      youth: [],
      reputation: [],
      media: [],
      matches: [],
      leagueTables: [],
    };

    // Update last tick info
    this.state.lastTick = new Date().toISOString();
    this.state.lastTickType = tickType;

    // Advance time
    this.advanceTime(tickType);

    // Perform updates based on tick type
    switch (tickType) {
      case 'minute':
        this.tickMinute(changes);
        break;
      case 'hour':
        this.tickHour(changes);
        break;
      case 'day':
        this.tickDay(changes);
        break;
      case 'week':
        this.tickWeek(changes);
        break;
      case 'month':
        this.tickMonth(changes);
        break;
    }

    const duration = Date.now() - startTime;
    
    return {
      tickType,
      timestamp: new Date().toISOString(),
      duration,
      changes,
    };
  }

  /**
   * Advance world time
   */
  private advanceTime(tickType: WorldTickType): void {
    switch (tickType) {
      case 'minute':
        this.advanceMinutes(1);
        break;
      case 'hour':
        this.advanceHours(1);
        break;
      case 'day':
        this.advanceDays(1);
        break;
      case 'week':
        this.advanceDays(7);
        break;
      case 'month':
        this.advanceMonths(1);
        break;
    }
  }

  /**
   * Advance time by minutes
   */
  private advanceMinutes(minutes: number): void {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setMinutes(currentDate.getMinutes() + minutes);
    
    this.state.currentDate = this.formatDate(currentDate);
    this.state.currentTime = currentDate.toISOString();
    this.state.currentDay = this.getDayOfYear(this.state.currentDate);
    
    // Update week if day changed
    if (this.getDayOfYear(this.state.currentDate) !== this.state.currentDay + minutes) {
      this.state.currentWeek = this.getWeekOfYear(this.state.currentDate);
    }
  }

  /**
   * Advance time by hours
   */
  private advanceHours(hours: number): void {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setHours(currentDate.getHours() + hours);
    
    this.state.currentDate = this.formatDate(currentDate);
    this.state.currentTime = currentDate.toISOString();
    this.state.currentDay = this.getDayOfYear(this.state.currentDate);
    
    // Update week if day changed
    if (this.getDayOfYear(this.state.currentDate) !== this.state.currentDay + hours * 24) {
      this.state.currentWeek = this.getWeekOfYear(this.state.currentDate);
    }
  }

  /**
   * Advance time by days
   */
  private advanceDays(days: number): void {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    
    const newDate = this.formatDate(currentDate);
    this.state.currentDate = newDate;
    this.state.currentTime = currentDate.toISOString();
    this.state.currentDay = this.getDayOfYear(newDate);
    this.state.currentWeek = this.getWeekOfYear(newDate);
    
    // Check if season changed
    const newYear = currentDate.getFullYear();
    if (newYear !== this.state.currentSeason) {
      this.state.currentSeason = newYear;
      this.state.currentWeek = 1;
    }
    
    // Update transfer window status
    this.state.transferWindowOpen = this.isTransferWindowOpen(newDate);
  }

  /**
   * Advance time by months
   */
  private advanceMonths(months: number): void {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setMonth(currentDate.getMonth() + months);
    
    const newDate = this.formatDate(currentDate);
    this.state.currentDate = newDate;
    this.state.currentTime = currentDate.toISOString();
    this.state.currentDay = this.getDayOfYear(newDate);
    this.state.currentWeek = this.getWeekOfYear(newDate);
    
    // Update season
    const newYear = currentDate.getFullYear();
    if (newYear !== this.state.currentSeason) {
      this.state.currentSeason = newYear;
      this.state.currentWeek = 1;
    }
    
    // Update transfer window status
    this.state.transferWindowOpen = this.isTransferWindowOpen(newDate);
  }

  // ============================================
  // TICK HANDLERS
  // ============================================

  /**
   * Handle minute tick
   */
  private tickMinute(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Process ongoing matches
    // - Update match time
    // - Generate match events
    // - Update player stamina during matches
    
    // For now, just log
    console.log(`[World Engine] Minute tick at ${this.state.currentTime}`);
  }

  /**
   * Handle hour tick
   */
  private tickHour(changes: WorldChanges): void {
    // Process training for all clubs
    this.processTraining(changes);
    
    // Process fatigue recovery
    this.processFatigueRecovery(changes);
    
    // Process morale changes from training
    this.processMoraleFromTraining(changes);
    
    console.log(`[World Engine] Hour tick at ${this.state.currentTime}`);
  }

  /**
   * Handle day tick
   */
  private tickDay(changes: WorldChanges): void {
    // Process contracts
    this.processContracts(changes);
    
    // Process injuries
    this.processInjuries(changes);
    
    // Process morale changes
    this.processMorale(changes);
    
    // Process match scheduling
    this.processMatchScheduling(changes);
    
    // Process match results (if matches were played)
    this.processMatchResults(changes);
    
    // Update league tables
    this.updateLeagueTables(changes);
    
    // Generate media stories
    this.generateMediaStories(changes);
    
    console.log(`[World Engine] Day tick at ${this.state.currentDate}`);
  }

  /**
   * Handle week tick
   */
  private tickWeek(changes: WorldChanges): void {
    // Process player development
    this.processPlayerDevelopment(changes);
    
    // Process club finances
    this.processFinances(changes);
    
    // Process youth intake
    this.processYouthIntake(changes);
    
    // Process transfers
    this.processTransfers(changes);
    
    // Process reputation changes
    this.processReputation(changes);
    
    // Process manager changes (sackings, new hires)
    this.processManagerChanges(changes);
    
    console.log(`[World Engine] Week tick at ${this.state.currentDate} (Week ${this.state.currentWeek})`);
  }

  /**
   * Handle month tick
   */
  private tickMonth(changes: WorldChanges): void {
    // Process long-term reputation changes
    this.processLongTermReputation(changes);
    
    // Process long-term development
    this.processLongTermDevelopment(changes);
    
    // Process season transitions
    this.processSeasonTransitions(changes);
    
    console.log(`[World Engine] Month tick at ${this.state.currentDate}`);
  }

  // ============================================
  // PROCESSING METHODS
  // ============================================

  /**
   * Process training for all clubs
   */
  private processTraining(changes: WorldChanges): void {
    this.clubs.forEach(club => {
      // Get players at this club
      const clubPlayers = Array.from(this.players.values())
        .filter(p => p.clubId === club.id && !p.injury);
      
      // For each player, apply training effects
      clubPlayers.forEach(player => {
        // Calculate training effects based on club facilities
        const trainingEffect = this.calculateTrainingEffect(club, player);
        
        // Apply attribute improvements
        const attributeChanges: Partial<any> = {};
        
        // Technical attributes
        if (player.attributes?.passing < 100) {
          attributeChanges.passing = Math.min(
            100,
            player.attributes?.passing + trainingEffect.technical
          );
        }
        if (player.attributes?.shooting < 100) {
          attributeChanges.shooting = Math.min(
            100,
            player.attributes?.shooting + trainingEffect.technical * 0.8
          );
        }
        if (player.attributes?.dribbling < 100) {
          attributeChanges.dribbling = Math.min(
            100,
            player.attributes?.dribbling + trainingEffect.technical
          );
        }
        
        // Physical attributes
        if (player.attributes?.pace < 100) {
          attributeChanges.pace = Math.min(
            100,
            player.attributes?.pace + trainingEffect.physical
          );
        }
        if (player.attributes?.stamina < 100) {
          attributeChanges.stamina = Math.min(
            100,
            player.attributes?.stamina + trainingEffect.physical * 1.2
          );
        }
        if (player.attributes?.strength < 100) {
          attributeChanges.strength = Math.min(
            100,
            player.attributes?.strength + trainingEffect.physical * 0.8
          );
        }
        
        // Mental attributes
        if (player.attributes?.decisions < 100) {
          attributeChanges.decisions = Math.min(
            100,
            player.attributes?.decisions + trainingEffect.mental
          );
        }
        if (player.attributes?.vision < 100) {
          attributeChanges.vision = Math.min(
            100,
            player.attributes?.vision + trainingEffect.mental * 1.2
          );
        }
        
        // Only add change if attributes improved
        if (Object.keys(attributeChanges).length > 0) {
          changes.players.push({
            playerId: player.id,
            attributeChanges,
            newCurrentAbility: this.calculateCurrentAbility(player, attributeChanges),
            newPotentialAbility: player.potentialAbility,
            reason: 'Training improvement',
          });
        }
      });
    });
  }

  /**
   * Calculate training effect for a player at a club
   */
  private calculateTrainingEffect(club: Club, player: Player): {
    technical: number;
    physical: number;
    mental: number;
  } {
    // Base training effect
    const baseEffect = 0.1;
    
    // Modify by club facilities (1-5 scale)
    const facilityModifier = club.trainingFacilities / 5;
    
    // Modify by player age (younger players develop faster)
    const ageModifier = this.getAgeModifier(player.age);
    
    // Modify by player potential (higher potential = faster development)
    const potentialModifier = player.potentialAbility / 100;
    
    // Modify by player professionalism (hidden attribute)
    const proModifier = player.hiddenAttributes?.professionalism / 100;
    
    // Calculate total modifier
    const totalModifier = facilityModifier * ageModifier * potentialModifier * proModifier;
    
    return {
      technical: baseEffect * totalModifier * 1.2,
      physical: baseEffect * totalModifier * 1.0,
      mental: baseEffect * totalModifier * 0.8,
    };
  }

  /**
   * Get age modifier for development
   */
  private getAgeModifier(age: number): number {
    if (age < 18) return 1.5;  // Under 18: very fast development
    if (age < 21) return 1.3;  // Under 21: fast development
    if (age < 25) return 1.1;  // Under 25: good development
    if (age < 28) return 1.0;  // 25-28: peak development
    if (age < 32) return 0.8;  // 29-32: slowing down
    return 0.5;              // 33+: minimal development
  }

  /**
   * Calculate player's current ability based on attributes
   */
  private calculateCurrentAbility(
    player: Player,
    attributeChanges?: Partial<any>
  ): number {
    // Calculate weighted average of attributes
    const attributes = attributeChanges ? 
      { ...player.attributes, ...attributeChanges } : 
      player.attributes;
    
    // Weights for different positions
    const weights = this.getAttributeWeights(player.position);
    
    let total = 0;
    let weightSum = 0;
    
    for (const [attr, weight] of Object.entries(weights)) {
      const attrValue = attributes[attr as keyof typeof attributes] || 0;
      total += attrValue * weight;
      weightSum += weight;
    }
    
    return Math.round(total / weightSum);
  }

  /**
   * Get attribute weights for a position
   */
  private getAttributeWeights(position: string): Record<string, number> {
    // Simplified weights for demonstration
    // In a real implementation, this would be more sophisticated
    const weights: Record<string, Record<string, number>> = {
      GK: { 
        handling: 0.3, reflexes: 0.3, aerial: 0.2, 
        passing: 0.1, kicking: 0.1 
      },
      CB: { 
        defending: 0.3, strength: 0.2, heading: 0.2, 
        pace: 0.1, passing: 0.1, anticipation: 0.1 
      },
      RB: { 
        defending: 0.25, stamina: 0.2, pace: 0.2, 
        crossing: 0.15, passing: 0.1, dribbling: 0.1 
      },
      LB: { 
        defending: 0.25, stamina: 0.2, pace: 0.2, 
        crossing: 0.15, passing: 0.1, dribbling: 0.1 
      },
      CDM: { 
        defending: 0.25, passing: 0.2, stamina: 0.2, 
        strength: 0.15, anticipation: 0.1, tackling: 0.1 
      },
      CM: { 
        passing: 0.25, stamina: 0.2, vision: 0.2, 
        dribbling: 0.15, defending: 0.1, shooting: 0.1 
      },
      CAM: { 
        passing: 0.25, vision: 0.2, creativity: 0.2, 
        shooting: 0.15, dribbling: 0.15, flair: 0.05 
      },
      RW: { 
        dribbling: 0.25, pace: 0.2, crossing: 0.2, 
        shooting: 0.15, passing: 0.1, stamina: 0.1 
      },
      LW: { 
        dribbling: 0.25, pace: 0.2, crossing: 0.2, 
        shooting: 0.15, passing: 0.1, stamina: 0.1 
      },
      ST: { 
        finishing: 0.3, shooting: 0.25, pace: 0.2, 
        strength: 0.15, heading: 0.1 
      },
      // Default for any position
      DEFAULT: {
        passing: 0.2, shooting: 0.2, dribbling: 0.2,
        pace: 0.15, strength: 0.15, defending: 0.1
      }
    };
    
    return weights[position] || weights.DEFAULT;
  }

  /**
   * Process fatigue recovery
   */
  private processFatigueRecovery(changes: WorldChanges): void {
    this.players.forEach(player => {
      if (player.fatigue > 0) {
        // Recover fatigue based on natural fitness
        const recoveryRate = player.hiddenAttributes?.naturalFitness / 100;
        const fatigueReduction = Math.min(player.fatigue, recoveryRate * 10);
        
        changes.players.push({
          playerId: player.id,
          newFatigue: player.fatigue - fatigueReduction,
          reason: 'Fatigue recovery',
        });
      }
    });
  }

  /**
   * Process morale changes from training
   */
  private processMoraleFromTraining(changes: WorldChanges): void {
    // For now, just apply small morale changes
    this.players.forEach(player => {
      // Random morale change based on training
      const moraleChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      const newMorale = Math.min(100, Math.max(0, player.morale + moraleChange));
      
      if (moraleChange !== 0) {
        changes.players.push({
          playerId: player.id,
          newMorale,
          reason: moraleChange > 0 ? 'Positive training session' : 'Negative training session',
        });
      }
    });
  }

  /**
   * Process contracts
   */
  private processContracts(changes: WorldChanges): void {
    const today = this.state.currentDate;
    
    this.players.forEach(player => {
      // Check if contract is expiring
      if (player.contract.expiryDate === today) {
        // Contract expired - player becomes free agent
        changes.contracts.push({
          playerId: player.id,
          clubId: player.clubId!,
          newContract: {
            ...player.contract,
            type: 'free_agent',
          },
          oldContract: player.contract,
          reason: 'Contract expired',
        });
        
        // Also update player's club
        changes.players.push({
          playerId: player.id,
          reason: 'Contract expired, became free agent',
        });
      }
      
      // Check for contract renewal (simplified)
      if (player.contract.type === 'full_time' && 
          this.daysUntilContractExpiry(player) <= 30) {
        // Club might offer new contract
        if (Math.random() > 0.7) { // 30% chance of renewal offer
          changes.contracts.push({
            playerId: player.id,
            clubId: player.clubId!,
            newContract: {
              ...player.contract,
              expiryDate: this.addYearsToDate(today, 2),
              wage: Math.round(player.contract.wage * 1.1), // 10% raise
            },
            oldContract: player.contract,
            reason: 'Contract renewal offered',
          });
        }
      }
    });
  }

  /**
   * Get days until contract expiry
   */
  private daysUntilContractExpiry(player: Player): number {
    if (!player.contract.expiryDate) return 0;
    
    const expiryDate = new Date(player.contract.expiryDate);
    const currentDate = new Date(this.state.currentDate);
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Process injuries
   */
  private processInjuries(changes: WorldChanges): void {
    // Check each player for potential injury
    this.players.forEach(player => {
      // Skip already injured players
      if (player.injury) return;
      
      // Calculate injury probability
      const injuryProbability = this.calculateInjuryProbability(player);
      
      // Roll the dice
      if (Math.random() < injuryProbability) {
        // Player gets injured
        const injury = this.generateRandomInjury();
        
        changes.injuries.push({
          playerId: player.id,
          injuryType: injury.type,
          severity: injury.severity,
          durationDays: injury.durationDays,
          startDate: this.state.currentDate,
          recoveryDate: this.addDaysToDate(this.state.currentDate, injury.durationDays),
          reason: 'Injured during training/match',
        });
      }
    });
    
    // Process injury recovery
    this.players.forEach(player => {
      if (player.injury && player.injury.recoveryDate === this.state.currentDate) {
        // Player recovers from injury
        changes.injuries.push({
          playerId: player.id,
          injuryType: player.injury.type,
          severity: player.injury.severity,
          durationDays: player.injury.durationDays,
          startDate: player.injury.startDate,
          recoveryDate: player.injury.recoveryDate,
          reason: 'Recovered from injury',
        });
      }
    });
  }

  /**
   * Calculate injury probability for a player
   */
  private calculateInjuryProbability(player: Player): number {
    // Base injury probability per day
    const baseProbability = 0.002; // 0.2%
    
    // Modify by position
    const positionModifier = this.getInjuryModifierByPosition(player.position);
    
    // Modify by injury proneness
    const pronenessModifier = player.hiddenAttributes?.injuryProneness / 50;
    
    // Modify by age
    const ageModifier = this.getInjuryAgeModifier(player.age);
    
    // Modify by fatigue
    const fatigueModifier = 1 + (player.fatigue / 100);
    
    // Modify by natural fitness
    const fitnessModifier = 1 - (player.hiddenAttributes?.naturalFitness / 200);
    
    return baseProbability * 
           positionModifier * 
           pronenessModifier * 
           ageModifier * 
           fatigueModifier * 
           fitnessModifier;
  }

  /**
   * Get injury probability modifier by position
   */
  private getInjuryModifierByPosition(position: string): number {
    const modifiers: Record<string, number> = {
      GK: 0.7,
      CB: 1.2,
      RB: 1.3,
      LB: 1.3,
      CDM: 1.4,
      CM: 1.0,
      CAM: 0.8,
      RW: 1.3,
      LW: 1.3,
      ST: 1.0,
      DEFAULT: 1.0,
    };
    return modifiers[position] || modifiers.DEFAULT;
  }

  /**
   * Get injury probability modifier by age
   */
  private getInjuryAgeModifier(age: number): number {
    if (age < 21) return 0.8;
    if (age < 25) return 0.9;
    if (age < 28) return 1.0;
    if (age < 32) return 1.1;
    if (age < 35) return 1.3;
    return 1.5; // 35+
  }

  /**
   * Generate a random injury
   */
  private generateRandomInjury(): {
    type: string;
    severity: any;
    durationDays: number;
  } {
    const injuryTypes = [
      { type: 'ankle_sprain', probability: 0.25, minDays: 7, maxDays: 14 },
      { type: 'hamstring_strain', probability: 0.20, minDays: 14, maxDays: 28 },
      { type: 'knee_ligament', probability: 0.10, minDays: 28, maxDays: 56 },
      { type: 'groin_strain', probability: 0.15, minDays: 10, maxDays: 21 },
      { type: 'calf_strain', probability: 0.10, minDays: 5, maxDays: 10 },
      { type: 'quadriceps_strain', probability: 0.10, minDays: 10, maxDays: 21 },
      { type: 'achilles_tendon', probability: 0.05, minDays: 21, maxDays: 42 },
      { type: 'concussion', probability: 0.03, minDays: 7, maxDays: 14 },
      { type: 'broken_bone', probability: 0.01, minDays: 42, maxDays: 90 },
      { type: 'muscle_tear', probability: 0.01, minDays: 28, maxDays: 84 },
    ];
    
    // Select injury type based on probability
    const totalProbability = injuryTypes.reduce((sum, injury) => sum + injury.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const injury of injuryTypes) {
      random -= injury.probability;
      if (random <= 0) {
        // Determine severity based on duration
        const duration = Math.floor(
          Math.random() * (injury.maxDays - injury.minDays + 1) + injury.minDays
        );
        
        let severity: any = 'moderate';
        if (duration <= 7) severity = 'minor';
        else if (duration <= 21) severity = 'moderate';
        else if (duration <= 56) severity = 'serious';
        else severity = 'career_ending';
        
        return {
          type: injury.type,
          severity,
          durationDays: duration,
        };
      }
    }
    
    // Fallback
    return {
      type: 'ankle_sprain',
      severity: 'minor',
      durationDays: 7,
    };
  }

  /**
   * Process morale changes
   */
  private processMorale(changes: WorldChanges): void {
    // For now, apply random morale changes
    this.players.forEach(player => {
      // Small random morale change
      const moraleChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const newMorale = Math.min(100, Math.max(0, player.morale + moraleChange));
      
      if (moraleChange !== 0) {
        changes.players.push({
          playerId: player.id,
          newMorale,
          reason: moraleChange > 0 ? 'Positive morale change' : 'Negative morale change',
        });
      }
    });
  }

  /**
   * Process match scheduling
   */
  private processMatchScheduling(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Check the current date
    // - Schedule matches for the current week
    // - Assign referees, venues, etc.
    
    // For now, just log
    console.log(`[World Engine] Scheduling matches for ${this.state.currentDate}`);
  }

  /**
   * Process match results
   */
  private processMatchResults(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Get all matches played on the current day
    // - Simulate results (using SimulationEngine)
    // - Update league tables
    // - Update player stats
    
    // For now, just log
    console.log(`[World Engine] Processing match results for ${this.state.currentDate}`);
  }

  /**
   * Update league tables
   */
  private updateLeagueTables(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Recalculate league tables based on match results
    // - Update positions, points, goal difference, etc.
    
    // For now, just log
    console.log(`[World Engine] Updating league tables for ${this.state.currentDate}`);
  }

  /**
   * Process player development
   */
  private processPlayerDevelopment(changes: WorldChanges): void {
    // Apply weekly development to all players
    this.players.forEach(player => {
      // Calculate development based on age, potential, training, etc.
      const development = this.calculatePlayerDevelopment(player);
      
      if (development > 0) {
        // Apply development to current ability
        const newCurrentAbility = Math.min(
          player.potentialAbility,
          player.currentAbility + development
        );
        
        changes.players.push({
          playerId: player.id,
          newCurrentAbility,
          reason: 'Weekly development',
        });
        
        // Occasionally improve potential too (for young players)
        if (player.age < 21 && Math.random() > 0.9) {
          const potentialIncrease = Math.min(
            100 - player.potentialAbility,
            Math.floor(Math.random() * 3) + 1
          );
          
          if (potentialIncrease > 0) {
            changes.players.push({
              playerId: player.id,
              newPotentialAbility: player.potentialAbility + potentialIncrease,
              reason: 'Potential increase from development',
            });
          }
        }
      }
    });
  }

  /**
   * Calculate player development for the week
   */
  private calculatePlayerDevelopment(player: Player): number {
    // Base development
    let development = 0.1;
    
    // Modify by age
    development *= this.getAgeModifier(player.age);
    
    // Modify by potential (higher potential = more room to grow)
    development *= (100 - player.currentAbility) / 100;
    
    // Modify by professionalism
    development *= player.hiddenAttributes?.professionalism / 100;
    
    // Modify by training (would be based on actual training in a real implementation)
    development *= 1.0; // Placeholder
    
    // Modify by match performance (would be based on actual matches)
    development *= 1.0; // Placeholder
    
    return development;
  }

  /**
   * Process club finances
   */
  private processFinances(changes: WorldChanges): void {
    this.clubs.forEach(club => {
      // Weekly income
      const weeklyIncome = this.calculateWeeklyIncome(club);
      const weeklyExpenses = this.calculateWeeklyExpenses(club);
      const weeklyProfit = weeklyIncome - weeklyExpenses;
      
      // Update club balance
      const newBalance = club.balance + weeklyProfit;
      
      changes.clubs.push({
        clubId: club.id,
        financialChange: weeklyProfit,
        reason: 'Weekly financial update',
      });
      
      // Add finance transaction
      changes.finances.push({
        clubId: club.id,
        type: weeklyProfit >= 0 ? 'income' : 'expense',
        category: 'weekly_update',
        amount: Math.abs(weeklyProfit),
        description: `Weekly financial update: $${weeklyIncome.toLocaleString()} income - $${weeklyExpenses.toLocaleString()} expenses`,
        date: this.state.currentDate,
      });
    });
  }

  /**
   * Calculate weekly income for a club
   */
  private calculateWeeklyIncome(club: Club): number {
    // Base income from sponsorships
    const sponsorshipIncome = club.reputation * 10000;
    
    // Income from ticket sales (if there was a home match)
    const ticketIncome = club.stadiumCapacity * 50; // Average ticket price $50
    
    // Income from TV revenue
    const tvIncome = club.reputation * 5000;
    
    // Income from merchandise
    const merchandiseIncome = club.reputation * 2000;
    
    return sponsorshipIncome + ticketIncome + tvIncome + merchandiseIncome;
  }

  /**
   * Calculate weekly expenses for a club
   */
  private calculateWeeklyExpenses(club: Club): number {
    // Wages for all players
    const playerWages = Array.from(this.players.values())
      .filter(p => p.clubId === club.id)
      .reduce((sum, player) => sum + player.wage, 0);
    
    // Staff wages (estimated at 50% of player wages)
    const staffWages = playerWages * 0.5;
    
    // Facility maintenance
    const facilityCosts = (
      club.trainingFacilities * 50000 +
      club.youthAcademy * 30000 +
      club.stadiumCapacity * 100 +
      club.medicalCenter * 20000
    );
    
    // Other expenses
    const otherExpenses = club.reputation * 1000;
    
    return playerWages + staffWages + facilityCosts + otherExpenses;
  }

  /**
   * Process youth intake
   */
  private processYouthIntake(changes: WorldChanges): void {
    // Check if today is youth intake day
    if (this.state.currentDay % 28 !== this.state.youthIntakeDay) return;
    
    // Process youth intake for each club
    this.clubs.forEach(club => {
      // Number of youth players to generate based on youth academy quality
      const numYouthPlayers = Math.floor(club.youthAcademy * 2);
      
      const newPlayers: Player[] = [];
      
      for (let i = 0; i < numYouthPlayers; i++) {
        const youthPlayer = this.generateYouthPlayer(club);
        newPlayers.push(youthPlayer);
        
        // Add to players map
        this.players.set(youthPlayer.id, youthPlayer);
      }
      
      if (newPlayers.length > 0) {
        changes.youth.push({
          clubId: club.id,
          newPlayers,
          reason: 'Youth intake',
        });
      }
    });
  }

  /**
   * Generate a youth player for a club
   */
  private generateYouthPlayer(club: Club): Player {
    // Generate random ID
    const id = this.generateRandomId();
    
    // Generate random name
    const { firstName, lastName } = this.generateRandomName(club.countryCode);
    
    // Generate random nationality (biased towards club's country)
    const nationality = Math.random() > 0.3 ? club.countryCode : this.getRandomNationCode();
    
    // Generate random age (16-18)
    const age = 16 + Math.floor(Math.random() * 3);
    const dateOfBirth = this.subtractYearsFromDate(this.state.currentDate, age);
    
    // Generate random height (170-195 cm)
    const height = 170 + Math.floor(Math.random() * 25);
    
    // Generate random weight (60-90 kg)
    const weight = 60 + Math.floor(Math.random() * 30);
    
    // Generate random position (weighted towards common positions)
    const position = this.generateRandomPosition();
    
    // Generate random foot preference
    const foot: any = Math.random() > 0.1 ? (Math.random() > 0.5 ? 'right' : 'left') : 'both';
    
    // Generate random attributes based on position and club quality
    const attributes = this.generateRandomAttributes(position, club);
    
    // Generate random hidden attributes
    const hiddenAttributes = this.generateRandomHiddenAttributes();
    
    // Calculate current and potential ability
    const currentAbility = this.calculateYouthCurrentAbility(attributes, age);
    const potentialAbility = this.calculateYouthPotentialAbility(
      attributes,
      hiddenAttributes,
      club,
      age
    );
    
    // Generate contract
    const contract = {
      type: 'youth' as const,
      startDate: this.state.currentDate,
      expiryDate: this.addYearsToDate(this.state.currentDate, 2),
      wage: 1000 + Math.floor(Math.random() * 5000),
      signingBonus: 0,
      releaseClause: null,
      loanClubId: null,
      loanExpiryDate: null,
    };
    
    // Create player
    return {
      id,
      firstName,
      lastName,
      nationality,
      dateOfBirth,
      age,
      height,
      weight,
      clubId: club.id,
      position,
      foot,
      attributes,
      hiddenAttributes,
      currentAbility,
      potentialAbility,
      reputation: 1,
      marketValue: currentAbility * 10000,
      wage: contract.wage,
      morale: 70 + Math.floor(Math.random() * 30),
      fatigue: 0,
      sharpness: 70 + Math.floor(Math.random() * 30),
      contract,
      injury: null,
      relationships: [],
      careerHistory: [{
        clubId: club.id,
        startDate: this.state.currentDate,
        endDate: null,
        appearances: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        averageRating: 0,
        trophies: [],
      }],
      appearance: this.generateRandomAppearance(),
    };
  }

  /**
   * Generate a random ID
   */
  private generateRandomId(): number {
    return Math.floor(Math.random() * 1000000000);
  }

  /**
   * Generate a random name based on nationality
   */
  private generateRandomName(nationCode: string): { firstName: string; lastName: string } {
    // In a real implementation, this would use nationality-specific name databases
    // For now, use generic names
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    };
  }

  /**
   * Get a random nation code
   */
  private getRandomNationCode(): string {
    const nationCodes = Array.from(this.nations.keys());
    return nationCodes[Math.floor(Math.random() * nationCodes.length)];
  }

  /**
   * Generate a random position
   */
  private generateRandomPosition(): any {
    const positions: any[] = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
    const weights = [0.05, 0.15, 0.1, 0.1, 0.1, 0.15, 0.1, 0.1, 0.1, 0.15];
    
    let totalWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      totalWeight += weights[i];
    }
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < positions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return positions[i];
      }
    }
    
    return 'CM';
  }

  /**
   * Generate random attributes for a youth player
   */
  private generateRandomAttributes(position: string, club: Club): any {
    // Base attributes (40-70 for youth players)
    const baseMin = 40;
    const baseMax = 70;
    
    // Position-specific modifiers
    const positionModifiers = this.getPositionAttributeModifiers(position);
    
    // Club quality modifier (better clubs produce better youth)
    const clubModifier = club.youthQuality / 100;
    
    // Generate attributes
    const attributes: Record<string, number> = {};
    
    // Technical attributes
    attributes.passing = this.generateAttribute(baseMin, baseMax, positionModifiers.passing, clubModifier);
    attributes.shooting = this.generateAttribute(baseMin, baseMax, positionModifiers.shooting, clubModifier);
    attributes.dribbling = this.generateAttribute(baseMin, baseMax, positionModifiers.dribbling, clubModifier);
    attributes.ballControl = this.generateAttribute(baseMin, baseMax, positionModifiers.ballControl, clubModifier);
    attributes.firstTouch = this.generateAttribute(baseMin, baseMax, positionModifiers.firstTouch, clubModifier);
    attributes.heading = this.generateAttribute(baseMin, baseMax, positionModifiers.heading, clubModifier);
    attributes.crossing = this.generateAttribute(baseMin, baseMax, positionModifiers.crossing, clubModifier);
    attributes.finishing = this.generateAttribute(baseMin, baseMax, positionModifiers.finishing, clubModifier);
    attributes.longShots = this.generateAttribute(baseMin, baseMax, positionModifiers.longShots, clubModifier);
    attributes.setPieces = this.generateAttribute(baseMin, baseMax, positionModifiers.setPieces, clubModifier);
    attributes.penaltyTaking = this.generateAttribute(baseMin, baseMax, positionModifiers.penaltyTaking, clubModifier);
    
    // Physical attributes
    attributes.pace = this.generateAttribute(baseMin, baseMax, positionModifiers.pace, clubModifier);
    attributes.acceleration = this.generateAttribute(baseMin, baseMax, positionModifiers.acceleration, clubModifier);
    attributes.agility = this.generateAttribute(baseMin, baseMax, positionModifiers.agility, clubModifier);
    attributes.balance = this.generateAttribute(baseMin, baseMax, positionModifiers.balance, clubModifier);
    attributes.strength = this.generateAttribute(baseMin, baseMax, positionModifiers.strength, clubModifier);
    attributes.stamina = this.generateAttribute(baseMin, baseMax, positionModifiers.stamina, clubModifier);
    attributes.jumpingReach = this.generateAttribute(baseMin, baseMax, positionModifiers.jumpingReach, clubModifier);
    attributes.naturalFitness = this.generateAttribute(50, 90, 1.0, clubModifier); // Higher base for natural fitness
    
    // Mental attributes
    attributes.aggression = this.generateAttribute(baseMin, baseMax, positionModifiers.aggression, clubModifier);
    attributes.anticipation = this.generateAttribute(baseMin, baseMax, positionModifiers.anticipation, clubModifier);
    attributes.composure = this.generateAttribute(baseMin, baseMax, positionModifiers.composure, clubModifier);
    attributes.concentration = this.generateAttribute(baseMin, baseMax, positionModifiers.concentration, clubModifier);
    attributes.creativity = this.generateAttribute(baseMin, baseMax, positionModifiers.creativity, clubModifier);
    attributes.decisions = this.generateAttribute(baseMin, baseMax, positionModifiers.decisions, clubModifier);
    attributes.determination = this.generateAttribute(baseMin, baseMax, positionModifiers.determination, clubModifier);
    attributes.flair = this.generateAttribute(baseMin, baseMax, positionModifiers.flair, clubModifier);
    attributes.leadership = this.generateAttribute(baseMin, baseMax, positionModifiers.leadership, clubModifier);
    attributes.offTheBall = this.generateAttribute(baseMin, baseMax, positionModifiers.offTheBall, clubModifier);
    attributes.positioning = this.generateAttribute(baseMin, baseMax, positionModifiers.positioning, clubModifier);
    attributes.teamwork = this.generateAttribute(baseMin, baseMax, positionModifiers.teamwork, clubModifier);
    attributes.vision = this.generateAttribute(baseMin, baseMax, positionModifiers.vision, clubModifier);
    attributes.workRate = this.generateAttribute(baseMin, baseMax, positionModifiers.workRate, clubModifier);
    
    return attributes;
  }

  /**
   * Get position-specific attribute modifiers for youth generation
   */
  private getPositionAttributeModifiers(position: string): Record<string, number> {
    const modifiers: Record<string, Record<string, number>> = {
      GK: {
        passing: 0.8, shooting: 0.2, dribbling: 0.2, ballControl: 0.5, firstTouch: 0.5,
        heading: 0.3, crossing: 0.1, finishing: 0.1, longShots: 0.1, setPieces: 0.1,
        pace: 0.5, acceleration: 0.5, agility: 0.8, balance: 0.7, strength: 0.6,
        stamina: 0.5, jumpingReach: 1.5, naturalFitness: 1.0,
        aggression: 0.5, anticipation: 1.2, composure: 1.2, concentration: 1.2,
        creativity: 0.5, decisions: 1.2, determination: 0.8, flair: 0.3,
        leadership: 1.0, offTheBall: 0.5, positioning: 1.5, teamwork: 0.8,
        vision: 1.2, workRate: 0.8,
      },
      CB: {
        passing: 0.8, shooting: 0.3, dribbling: 0.5, ballControl: 0.7, firstTouch: 0.7,
        heading: 1.5, crossing: 0.3, finishing: 0.2, longShots: 0.2, setPieces: 0.3,
        pace: 0.8, acceleration: 0.8, agility: 0.7, balance: 0.8, strength: 1.5,
        stamina: 0.9, jumpingReach: 1.5, naturalFitness: 1.0,
        aggression: 1.2, anticipation: 1.2, composure: 1.0, concentration: 1.2,
        creativity: 0.5, decisions: 1.2, determination: 1.0, flair: 0.3,
        leadership: 1.2, offTheBall: 0.8, positioning: 1.5, teamwork: 1.0,
        vision: 1.0, workRate: 1.0,
      },
      RB: {
        passing: 0.9, shooting: 0.4, dribbling: 1.0, ballControl: 0.9, firstTouch: 0.8,
        heading: 0.5, crossing: 1.5, finishing: 0.3, longShots: 0.3, setPieces: 0.4,
        pace: 1.3, acceleration: 1.3, agility: 1.2, balance: 1.0, strength: 0.8,
        stamina: 1.3, jumpingReach: 0.7, naturalFitness: 1.1,
        aggression: 0.8, anticipation: 1.0, composure: 0.8, concentration: 1.0,
        creativity: 0.7, decisions: 1.0, determination: 0.9, flair: 0.5,
        leadership: 0.8, offTheBall: 1.0, positioning: 1.0, teamwork: 1.0,
        vision: 1.2, workRate: 1.3,
      },
      LB: {
        passing: 0.9, shooting: 0.4, dribbling: 1.0, ballControl: 0.9, firstTouch: 0.8,
        heading: 0.5, crossing: 1.5, finishing: 0.3, longShots: 0.3, setPieces: 0.4,
        pace: 1.3, acceleration: 1.3, agility: 1.2, balance: 1.0, strength: 0.8,
        stamina: 1.3, jumpingReach: 0.7, naturalFitness: 1.1,
        aggression: 0.8, anticipation: 1.0, composure: 0.8, concentration: 1.0,
        creativity: 0.7, decisions: 1.0, determination: 0.9, flair: 0.5,
        leadership: 0.8, offTheBall: 1.0, positioning: 1.0, teamwork: 1.0,
        vision: 1.2, workRate: 1.3,
      },
      CDM: {
        passing: 1.0, shooting: 0.5, dribbling: 0.8, ballControl: 0.9, firstTouch: 0.9,
        heading: 0.8, crossing: 0.5, finishing: 0.3, longShots: 0.5, setPieces: 0.4,
        pace: 0.8, acceleration: 0.8, agility: 0.8, balance: 0.9, strength: 1.2,
        stamina: 1.2, jumpingReach: 0.8, naturalFitness: 1.1,
        aggression: 1.3, anticipation: 1.3, composure: 1.0, concentration: 1.2,
        creativity: 0.8, decisions: 1.3, determination: 1.2, flair: 0.5,
        leadership: 1.2, offTheBall: 1.0, positioning: 1.3, teamwork: 1.2,
        vision: 1.3, workRate: 1.3,
      },
      CM: {
        passing: 1.3, shooting: 0.7, dribbling: 1.0, ballControl: 1.2, firstTouch: 1.1,
        heading: 0.5, crossing: 0.7, finishing: 0.5, longShots: 0.7, setPieces: 0.7,
        pace: 0.9, acceleration: 0.9, agility: 1.0, balance: 1.0, strength: 0.8,
        stamina: 1.1, jumpingReach: 0.5, naturalFitness: 1.0,
        aggression: 0.8, anticipation: 1.2, composure: 1.2, concentration: 1.2,
        creativity: 1.2, decisions: 1.3, determination: 1.0, flair: 0.8,
        leadership: 1.0, offTheBall: 1.0, positioning: 1.0, teamwork: 1.2,
        vision: 1.5, workRate: 1.2,
      },
      CAM: {
        passing: 1.2, shooting: 1.0, dribbling: 1.3, ballControl: 1.3, firstTouch: 1.2,
        heading: 0.3, crossing: 0.5, finishing: 1.0, longShots: 0.8, setPieces: 1.0,
        pace: 0.8, acceleration: 0.9, agility: 1.3, balance: 1.1, strength: 0.5,
        stamina: 0.8, jumpingReach: 0.3, naturalFitness: 0.9,
        aggression: 0.5, anticipation: 1.3, composure: 1.3, concentration: 1.3,
        creativity: 1.5, decisions: 1.2, determination: 0.9, flair: 1.3,
        leadership: 0.8, offTheBall: 1.2, positioning: 1.0, teamwork: 1.0,
        vision: 1.5, workRate: 0.9,
      },
      RW: {
        passing: 0.8, shooting: 0.8, dribbling: 1.3, ballControl: 1.2, firstTouch: 1.0,
        heading: 0.4, crossing: 1.5, finishing: 0.8, longShots: 0.5, setPieces: 0.4,
        pace: 1.5, acceleration: 1.4, agility: 1.4, balance: 1.2, strength: 0.6,
        stamina: 1.0, jumpingReach: 0.5, naturalFitness: 1.0,
        aggression: 0.7, anticipation: 1.0, composure: 0.9, concentration: 1.0,
        creativity: 1.0, decisions: 1.0, determination: 0.8, flair: 1.2,
        leadership: 0.5, offTheBall: 1.3, positioning: 0.8, teamwork: 0.9,
        vision: 1.2, workRate: 1.0,
      },
      LW: {
        passing: 0.8, shooting: 0.8, dribbling: 1.3, ballControl: 1.2, firstTouch: 1.0,
        heading: 0.4, crossing: 1.5, finishing: 0.8, longShots: 0.5, setPieces: 0.4,
        pace: 1.5, acceleration: 1.4, agility: 1.4, balance: 1.2, strength: 0.6,
        stamina: 1.0, jumpingReach: 0.5, naturalFitness: 1.0,
        aggression: 0.7, anticipation: 1.0, composure: 0.9, concentration: 1.0,
        creativity: 1.0, decisions: 1.0, determination: 0.8, flair: 1.2,
        leadership: 0.5, offTheBall: 1.3, positioning: 0.8, teamwork: 0.9,
        vision: 1.2, workRate: 1.0,
      },
      ST: {
        passing: 0.6, shooting: 1.3, dribbling: 0.9, ballControl: 1.0, firstTouch: 1.1,
        heading: 1.0, crossing: 0.3, finishing: 1.5, longShots: 0.8, setPieces: 0.3,
        pace: 1.0, acceleration: 1.1, agility: 0.9, balance: 0.8, strength: 1.2,
        stamina: 0.8, jumpingReach: 1.2, naturalFitness: 0.9,
        aggression: 1.0, anticipation: 1.3, composure: 1.3, concentration: 1.2,
        creativity: 0.8, decisions: 1.1, determination: 1.2, flair: 0.8,
        leadership: 0.8, offTheBall: 0.9, positioning: 1.3, teamwork: 0.9,
        vision: 1.0, workRate: 1.1,
      },
      DEFAULT: {
        passing: 1.0, shooting: 1.0, dribbling: 1.0, ballControl: 1.0, firstTouch: 1.0,
        heading: 1.0, crossing: 1.0, finishing: 1.0, longShots: 1.0, setPieces: 1.0,
        pace: 1.0, acceleration: 1.0, agility: 1.0, balance: 1.0, strength: 1.0,
        stamina: 1.0, jumpingReach: 1.0, naturalFitness: 1.0,
        aggression: 1.0, anticipation: 1.0, composure: 1.0, concentration: 1.0,
        creativity: 1.0, decisions: 1.0, determination: 1.0, flair: 1.0,
        leadership: 1.0, offTheBall: 1.0, positioning: 1.0, teamwork: 1.0,
        vision: 1.0, workRate: 1.0,
      },
    };
    
    return modifiers[position] || modifiers.DEFAULT;
  }

  /**
   * Generate a random attribute value
   */
  private generateAttribute(
    baseMin: number,
    baseMax: number,
    positionModifier: number,
    clubModifier: number
  ): number {
    const baseValue = baseMin + Math.random() * (baseMax - baseMin);
    const modifiedValue = baseValue * positionModifier * clubModifier;
    return Math.min(100, Math.max(1, Math.round(modifiedValue)));
  }

  /**
   * Generate random hidden attributes
   */
  private generateRandomHiddenAttributes(): any {
    return {
      professionalism: 40 + Math.floor(Math.random() * 60),
      consistency: 40 + Math.floor(Math.random() * 60),
      pressureHandling: 40 + Math.floor(Math.random() * 60),
      adaptability: 40 + Math.floor(Math.random() * 60),
      sportsmanship: 40 + Math.floor(Math.random() * 60),
      injuryProneness: 10 + Math.floor(Math.random() * 40), // Lower is better
      controversy: 10 + Math.floor(Math.random() * 40),
      loyalty: 40 + Math.floor(Math.random() * 60),
      ambition: 40 + Math.floor(Math.random() * 60),
      hiddenPotential: 40 + Math.floor(Math.random() * 60),
    };
  }

  /**
   * Calculate youth player's current ability
   */
  private calculateYouthCurrentAbility(attributes: any, age: number): number {
    // Calculate average of all attributes
    const attrValues = Object.values(attributes);
    const avgAttribute = attrValues.reduce((sum, val) => sum + val, 0) / attrValues.length;
    
    // Adjust for age (younger players have lower current ability relative to potential)
    const ageFactor = 1 - ((21 - age) / 100); // At age 16: 0.85, at age 21: 1.0
    
    return Math.round(avgAttribute * ageFactor);
  }

  /**
   * Calculate youth player's potential ability
   */
  private calculateYouthPotentialAbility(
    attributes: any,
    hiddenAttributes: any,
    club: Club,
    age: number
  ): number {
    // Calculate weighted average of attributes
    const attrValues = Object.values(attributes);
    const avgAttribute = attrValues.reduce((sum, val) => sum + val, 0) / attrValues.length;
    
    // Adjust for hidden attributes
    const proFactor = hiddenAttributes.professionalism / 100;
    const consistencyFactor = hiddenAttributes.consistency / 100;
    const ambitionFactor = hiddenAttributes.ambition / 100;
    const hiddenPotentialFactor = hiddenAttributes.hiddenPotential / 100;
    
    // Adjust for club youth quality
    const clubFactor = club.youthQuality / 100;
    
    // Adjust for age (younger players have more potential to grow)
    const ageFactor = 1 + ((21 - age) / 200); // At age 16: 1.25, at age 21: 1.0
    
    // Calculate potential
    let potential = avgAttribute * 
                    proFactor * 
                    consistencyFactor * 
                    ambitionFactor * 
                    hiddenPotentialFactor * 
                    clubFactor * 
                    ageFactor;
    
    // Add some randomness
    potential *= 0.9 + Math.random() * 0.2;
    
    return Math.min(100, Math.round(potential));
  }

  /**
   * Generate random appearance
   */
  private generateRandomAppearance(): any {
    const skinTones: any[] = ['light', 'fair', 'medium', 'olive', 'brown', 'dark_brown', 'deep_dark'];
    const hairColors: any[] = ['black', 'brown', 'blonde', 'red', 'grey', 'white', 'bald'];
    const hairStyles: any[] = ['short', 'medium', 'long', 'buzz_cut', 'afro', 'dreadlocks', 'braids', 'mohawk'];
    const facialHairs: any[] = ['clean_shaven', 'stubble', 'goatee', 'full_beard', 'moustache'];
    const builds: any[] = ['slim', 'average', 'stocky', 'muscular', 'tall_slim', 'tall_muscular'];
    
    return {
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      facialHair: facialHairs[Math.floor(Math.random() * facialHairs.length)],
      build: builds[Math.floor(Math.random() * builds.length)],
    };
  }

  /**
   * Process transfers
   */
  private processTransfers(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Process transfer negotiations
    // - Handle contract signings
    // - Process loan moves
    // - Handle free agent signings
    
    // For now, just log
    console.log(`[World Engine] Processing transfers for ${this.state.currentDate}`);
  }

  /**
   * Process reputation changes
   */
  private processReputation(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Update club reputations based on performance
    // - Update player reputations based on performance
    // - Update manager reputations based on results
    
    // For now, just log
    console.log(`[World Engine] Processing reputation changes for ${this.state.currentDate}`);
  }

  /**
   * Process manager changes (sackings, new hires)
   */
  private processManagerChanges(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Check club performance vs. board expectations
    // - Sack managers who fail to meet expectations
    // - Hire new managers for vacant positions
    
    // For now, just log
    console.log(`[World Engine] Processing manager changes for ${this.state.currentDate}`);
  }

  /**
   * Process long-term reputation changes
   */
  private processLongTermReputation(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Adjust reputations based on long-term trends
    // - Handle reputation decay for inactive entities
    
    // For now, just log
    console.log(`[World Engine] Processing long-term reputation changes for ${this.state.currentDate}`);
  }

  /**
   * Process long-term development
   */
  private processLongTermDevelopment(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Apply long-term development effects
    // - Handle player career arcs
    
    // For now, just log
    console.log(`[World Engine] Processing long-term development for ${this.state.currentDate}`);
  }

  /**
   * Process season transitions
   */
  private processSeasonTransitions(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Handle promotion/relegation
    // - Reset season stats
    // - Process end-of-season awards
    // - Handle contract expirations
    
    // For now, just log
    console.log(`[World Engine] Processing season transitions for ${this.state.currentDate}`);
  }

  /**
   * Generate media stories
   */
  private generateMediaStories(changes: WorldChanges): void {
    // In a real implementation, this would:
    // - Generate news stories based on recent events
    // - Create transfer rumors
    // - Generate match previews/reviews
    // - Create player interviews
    
    // For now, generate a few random stories
    const storyTypes = ['news', 'rumor', 'interview', 'analysis'];
    const sentiments: any[] = ['positive', 'neutral', 'negative', 'very_positive', 'very_negative'];
    const importances: any[] = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 3; i++) {
      const storyType = storyTypes[Math.floor(Math.random() * storyTypes.length)];
      const entityType = ['player', 'club', 'manager'][Math.floor(Math.random() * 3)];
      const entityId = entityType === 'player' ? 
        Array.from(this.players.keys())[Math.floor(Math.random() * this.players.size)] :
        entityType === 'club' ? 
          Array.from(this.clubs.keys())[Math.floor(Math.random() * this.clubs.size)] :
          Array.from(this.managers.keys())[Math.floor(Math.random() * this.managers.size)];
      
      changes.media.push({
        id: this.generateRandomId(),
        type: storyType,
        title: this.generateRandomStoryTitle(storyType, entityType),
        content: this.generateRandomStoryContent(storyType, entityType, entityId),
        entityId,
        entityType: entityType as any,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        importance: importances[Math.floor(Math.random() * importances.length)],
        date: new Date().toISOString(),
      });
    }
  }

  /**
   * Generate random story title
   */
  private generateRandomStoryTitle(storyType: string, entityType: string): string {
    const titles: Record<string, Record<string, string[]>> = {
      news: {
        player: [
          'Breaking: Player signs new contract',
          'Exclusive: Player reveals transfer plans',
          'Injury update: Player to miss 4 weeks',
          'Player wins Player of the Month award',
        ],
        club: [
          'Club announces record profits',
          'New stadium plans revealed',
          'Club unveils new training facilities',
          'Board sets ambitious targets for next season',
        ],
        manager: [
          'Manager signs contract extension',
          'Manager linked with top job',
          'Manager faces sack after poor run',
          'Manager named Manager of the Month',
        ],
      },
      rumor: {
        player: [
          'Rumor: Top club interested in player',
          'Speculation: Player could leave in January',
          'Whispers: Player unhappy at current club',
          'Rumor mill: Player linked with surprise move',
        ],
        club: [
          'Rumor: Club to make big-money signing',
          'Speculation: Club could sell star player',
          'Whispers: Club in talks with new sponsor',
          'Rumor: Club to undergo ownership change',
        ],
        manager: [
          'Rumor: Manager to be sacked',
          'Speculation: Manager could leave for rival',
          'Whispers: Manager interested in national team job',
          'Rumor: Manager to bring in former player as coach',
        ],
      },
      interview: {
        player: [
          'Player: "I\'m happy at the club"',
          'Exclusive interview: Player on form and future',
          'Player opens up about injury struggles',
          'Player discusses international ambitions',
        ],
        club: [
          'Chairman: "We have big plans"',
          'Club CEO discusses financial strategy',
          'Director of Football reveals transfer plans',
          'Club legend returns as ambassador',
        ],
        manager: [
          'Manager: "We need to improve"',
          'Exclusive: Manager on tactics and squad',
          'Manager discusses pressure of the job',
          'Manager reveals his football philosophy',
        ],
      },
      analysis: {
        player: [
          'Analysis: Why player is having a breakthrough season',
          'Tactical breakdown: How player fits into system',
          'Data deep dive: Player\'s underlying stats',
          'Scouting report: Player\'s strengths and weaknesses',
        ],
        club: [
          'Analysis: Club\'s impressive financial growth',
          'Tactical breakdown: Club\'s system explained',
          'Data deep dive: Club\'s transfer strategy',
          'Scouting report: Club\'s youth academy production',
        ],
        manager: [
          'Analysis: Manager\'s tactical evolution',
          'Tactical breakdown: Manager\'s preferred formation',
          'Data deep dive: Manager\'s win percentage',
          'Scouting report: Manager\'s strengths and weaknesses',
        ],
      },
    };
    
    return titles[storyType]?.[entityType]?.[0] || 'Breaking News';
  }

  /**
   * Generate random story content
   */
  private generateRandomStoryContent(storyType: string, entityType: string, entityId: EntityId): string {
    // In a real implementation, this would generate meaningful content
    // For now, return placeholder text
    return `This is a ${storyType} story about ${entityType} ${entityId}. In a real implementation, this would contain detailed, dynamically generated content based on recent events and data.`;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): DateString {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get day of year (1-366)
   */
  private getDayOfYear(date: DateString): number {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Get week of year (1-53)
   */
  private getWeekOfYear(date: DateString): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayOfYear = this.getDayOfYear(date);
    return Math.ceil(dayOfYear / 7);
  }

  /**
   * Check if transfer window is open
   */
  private isTransferWindowOpen(date: DateString): boolean {
    const d = new Date(date);
    const month = d.getMonth(); // 0-11
    const day = d.getDate();
    
    // Summer window: June 1 - August 31
    if (month >= 5 && month <= 7) return true;
    // Winter window: January 1 - January 31
    if (month === 0) return true;
    
    return false;
  }

  /**
   * Add days to a date
   */
  private addDaysToDate(date: DateString, days: number): DateString {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }

  /**
   * Add years to a date
   */
  private addYearsToDate(date: DateString, years: number): DateString {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return this.formatDate(d);
  }

  /**
   * Subtract years from a date
   */
  private subtractYearsFromDate(date: DateString, years: number): DateString {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - years);
    return this.formatDate(d);
  }

  /**
   * Get current state
   */
  getCurrentState(): WorldState {
    return { ...this.state };
  }

  /**
   * Get all nations
   */
  getNations(): Nation[] {
    return Array.from(this.nations.values());
  }

  /**
   * Get all clubs
   */
  getClubs(): Club[] {
    return Array.from(this.clubs.values());
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Get all managers
   */
  getManagers(): Manager[] {
    return Array.from(this.managers.values());
  }

  /**
   * Get a specific nation
   */
  getNation(code: string): Nation | undefined {
    return this.nations.get(code);
  }

  /**
   * Get a specific club
   */
  getClub(id: EntityId): Club | undefined {
    return this.clubs.get(id as number);
  }

  /**
   * Get a specific player
   */
  getPlayer(id: EntityId): Player | undefined {
    return this.players.get(id as number);
  }

  /**
   * Get a specific manager
   */
  getManager(id: EntityId): Manager | undefined {
    return this.managers.get(id as number);
  }

  /**
   * Add a nation
   */
  addNation(nation: Nation): void {
    this.nations.set(nation.code, nation);
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
  }

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  /**
   * Add a manager
   */
  addManager(manager: Manager): void {
    this.managers.set(manager.id, manager);
  }

  /**
   * Remove a nation
   */
  removeNation(code: string): boolean {
    return this.nations.delete(code);
  }

  /**
   * Remove a club
   */
  removeClub(id: EntityId): boolean {
    return this.clubs.delete(id as number);
  }

  /**
   * Remove a player
   */
  removePlayer(id: EntityId): boolean {
    return this.players.delete(id as number);
  }

  /**
   * Remove a manager
   */
  removeManager(id: EntityId): boolean {
    return this.managers.delete(id as number);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.nations.clear();
    this.leagues.clear();
    this.clubs.clear();
    this.players.clear();
    this.managers.clear();
    this.state = {
      id: 1,
      currentDate: '2026-06-07',
      currentTime: new Date('2026-06-07T00:00:00').toISOString(),
      currentSeason: 2026,
      currentWeek: this.getWeekOfYear('2026-06-07'),
      currentDay: this.getDayOfYear('2026-06-07'),
      transferWindowOpen: this.isTransferWindowOpen('2026-06-07'),
      youthIntakeDay: 1,
      lastTick: new Date().toISOString(),
      lastTickType: 'day',
    };
  }
}
