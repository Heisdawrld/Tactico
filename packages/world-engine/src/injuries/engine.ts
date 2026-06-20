// TACTICO World Engine - Injury Engine
// Handles player injuries, recovery, and prevention

import { EntityId, DateString, Player, Club } from '../core/types';
import {
  InjurySeverity,
  InjuryType,
  PlayerInjury,
  InjuryRiskFactors,
  InjuryPrevention,
  RecoveryPlan,
  RecoveryPhase,
  MedicalStaff,
  MedicalFacility,
  PlayerInjuryHistory,
  InjuryReport,
  BASE_INJURY_RATES,
  INJURY_TYPE_PROBABILITIES,
  INJURY_SEVERITY_DISTRIBUTION,
  BASE_RECOVERY_TIMES,
  RECOVERY_TIME_MODIFIERS,
  INJURY_RISK_MODIFIERS,
  DEFAULT_RECOVERY_PHASES,
} from './types';

/**
 * InjuryEngine - Manages player injuries and recovery
 * 
 * Handles:
 * - Injury occurrence and diagnosis
 * - Recovery process and timelines
 * - Injury prevention
 * - Medical facility effects
 * - Player injury history
 */
export class InjuryEngine {
  private players: Map<EntityId, Player> = new Map();
  private clubs: Map<EntityId, Club> = new Map();
  private injuries: Map<EntityId, PlayerInjury> = new Map();
  private playerInjuries: Map<EntityId, PlayerInjury[]> = new Map();
  private recoveryPlans: Map<EntityId, RecoveryPlan> = new Map();
  private medicalFacilities: Map<EntityId, MedicalFacility> = new Map();
  private medicalStaff: Map<EntityId, MedicalStaff[]> = new Map();

  /**
   * Initialize the injury engine
   */
  initialize(
    players: Player[],
    clubs: Club[],
    medicalFacilities: MedicalFacility[] = []
  ): void {
    players.forEach(player => this.players.set(player.id, player));
    clubs.forEach(club => this.clubs.set(club.id, club));
    medicalFacilities.forEach(facility => {
      this.medicalFacilities.set(facility.clubId, facility);
    });
  }

  // ============================================
  // INJURY METHODS
  // ============================================

  /**
   * Check for injuries after a match or training session
   * @param playerIds Player IDs to check
   * @param context Context (match or training)
   * @param matchId Optional match ID if injury occurred in a match
   * @returns Array of new injuries
   */
  checkForInjuries(
    playerIds: EntityId[],
    context: 'match' | 'training',
    matchId?: EntityId
  ): PlayerInjury[] {
    const newInjuries: PlayerInjury[] = [];

    playerIds.forEach(playerId => {
      const player = this.players.get(playerId);
      if (!player) return;

      // Skip already injured players
      if (this.isPlayerInjured(playerId)) return;

      // Calculate injury probability
      const injuryProbability = this.calculateInjuryProbability(playerId, context);

      // Roll the dice
      if (Math.random() < injuryProbability) {
        const injury = this.generateInjury(playerId, context, matchId);
        newInjuries.push(injury);
        this.injuries.set(injury.id, injury);
        this.addPlayerInjury(playerId, injury);

        // Update player injury status
        player.injury = {
          type: injury.type,
          severity: injury.severity,
          durationDays: injury.durationDays,
          startDate: injury.startDate,
          recoveryDate: injury.recoveryDate,
        };

        // Create recovery plan
        this.createRecoveryPlan(injury);
      }
    });

    return newInjuries;
  }

  /**
   * Calculate injury probability for a player
   */
  private calculateInjuryProbability(
    playerId: EntityId,
    context: 'match' | 'training'
  ): number {
    const player = this.players.get(playerId);
    if (!player) return 0;

    const club = this.clubs.get(player.clubId!);
    if (!club) return 0;

    // Get base injury rate for position
    const baseRate = BASE_INJURY_RATES[player.position] || BASE_INJURY_RATES.DEFAULT;

    // Calculate risk factors
    const riskFactors = this.calculateInjuryRiskFactors(playerId, context);

    // Calculate total risk (0-100)
    const totalRisk = riskFactors.totalRisk;

    // Convert to probability (0-1)
    // Base rate is per 1000 minutes, so for a match (90 minutes) or training (60 minutes)
    const minutes = context === 'match' ? 90 : 60;
    const baseProbability = (baseRate * minutes) / 1000;

    // Adjust by risk factors (totalRisk is 0-100, convert to multiplier 0-2)
    const riskMultiplier = 1 + (totalRisk / 100);

    return baseProbability * riskMultiplier;
  }

  /**
   * Calculate injury risk factors for a player
   */
  private calculateInjuryRiskFactors(
    playerId: EntityId,
    context: 'match' | 'training'
  ): InjuryRiskFactors {
    const player = this.players.get(playerId);
    if (!player) {
      return {
        playerId,
        baseRisk: 50,
        positionRisk: 50,
        ageRisk: 50,
        injuryProneness: 50,
        fitnessRisk: 50,
        fatigueRisk: 50,
        playingTimeRisk: 50,
        weatherRisk: 50,
        opponentRisk: 50,
        totalRisk: 50,
      };
    }

    // Base risk (50 = average)
    const baseRisk = 50;

    // Position risk (0-100)
    const positionRisk = (BASE_INJURY_RATES[player.position] || BASE_INJURY_RATES.DEFAULT) * 10;

    // Age risk (0-100)
    const ageRisk = this.calculateAgeRisk(player.age);

    // Injury proneness (0-100, from hidden attribute)
    const injuryProneness = player.hiddenAttributes.injuryProneness;

    // Fitness risk (0-100, based on current fitness)
    const fitnessRisk = 100 - player.attributes.naturalFitness;

    // Fatigue risk (0-100)
    const fatigueRisk = player.fatigue;

    // Playing time risk (0-100, based on recent playing time)
    const playingTimeRisk = this.calculatePlayingTimeRisk(playerId);

    // Weather risk (0-100)
    const weatherRisk = this.calculateWeatherRisk();

    // Opponent risk (0-100)
    const opponentRisk = this.calculateOpponentRisk(playerId, context);

    // Calculate total risk
    const totalRisk = (
      baseRisk * 0.1 +
      positionRisk * 0.2 +
      ageRisk * 0.15 +
      injuryProneness * 0.15 +
      fitnessRisk * 0.1 +
      fatigueRisk * 0.1 +
      playingTimeRisk * 0.05 +
      weatherRisk * 0.05 +
      opponentRisk * 0.1
    );

    return {
      playerId,
      baseRisk,
      positionRisk,
      ageRisk,
      injuryProneness,
      fitnessRisk,
      fatigueRisk,
      playingTimeRisk,
      weatherRisk,
      opponentRisk,
      totalRisk: Math.round(totalRisk),
    };
  }

  /**
   * Calculate age risk
   */
  private calculateAgeRisk(age: number): number {
    if (age < 21) return 20; // Younger players have lower injury risk
    if (age < 25) return 30;
    if (age < 28) return 40;
    if (age < 32) return 60;
    if (age < 35) return 80;
    return 100; // Older players have higher injury risk
  }

  /**
   * Calculate playing time risk
   */
  private calculatePlayingTimeRisk(playerId: EntityId): number {
    // In a real implementation, this would be based on actual playing time
    // For now, use a random value based on position
    const player = this.players.get(playerId);
    if (!player) return 50;

    // Defenders and midfielders play more minutes
    if (['CB', 'RB', 'LB', 'CDM', 'CM'].includes(player.position)) {
      return 70;
    }
    // Wingers and forwards have more intense playing time
    if (['RW', 'LW', 'ST', 'CF'].includes(player.position)) {
      return 60;
    }
    // Goalkeepers and others
    return 50;
  }

  /**
   * Calculate weather risk
   */
  private calculateWeatherRisk(): number {
    // In a real implementation, this would be based on current weather
    // For now, return a random value
    return Math.random() * 20; // 0-20
  }

  /**
   * Calculate opponent risk
   */
  private calculateOpponentRisk(playerId: EntityId, context: 'match' | 'training'): number {
    if (context === 'training') return 10; // Lower risk in training

    // In a real implementation, this would be based on opponent's physicality
    // For now, return a random value
    return Math.random() * 30; // 0-30
  }

  /**
   * Generate a random injury for a player
   */
  private generateInjury(
    playerId: EntityId,
    context: 'match' | 'training',
    matchId?: EntityId
  ): PlayerInjury {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const club = this.clubs.get(player.clubId!);

    // Determine injury type based on position probabilities
    const position = player.position;
    const typeProbabilities = INJURY_TYPE_PROBABILITIES[position] || INJURY_TYPE_PROBABILITIES.DEFAULT;
    const injuryType = this.selectWeightedRandom(typeProbabilities);

    // Determine severity based on injury type
    const severityProbabilities = INJURY_SEVERITY_DISTRIBUTION[injuryType];
    const severity = this.selectWeightedRandom(severityProbabilities) as InjurySeverity;

    // Calculate duration based on type and severity
    const baseDuration = BASE_RECOVERY_TIMES[injuryType][severity];
    const durationDays = this.calculateInjuryDuration(playerId, injuryType, severity, baseDuration);

    // Calculate start and recovery dates
    const today = this.getCurrentDate();
    const startDate = today;
    const recoveryDate = this.addDaysToDate(today, durationDays);

    // Determine if it was a foul (only for match injuries)
    const isFoul = context === 'match' && Math.random() > 0.7;

    // Determine if surgery is required
    const requiresSurgery = this.doesInjuryRequireSurgery(injuryType, severity);

    const id = this.generateId();

    const injury: PlayerInjury = {
      id,
      playerId,
      type: injuryType,
      severity,
      durationDays,
      startDate,
      recoveryDate,
      isActive: true,
      matchId,
      minute: context === 'match' ? Math.floor(Math.random() * 90) + 1 : undefined,
      opponentPlayerId: isFoul ? this.getRandomOpponentPlayerId(playerId) : undefined,
      isFoul,
      recoveryProgress: 0,
      rehabStartDate: undefined,
      setbackCount: 0,
      requiresSurgery,
      surgeryDate: requiresSurgery ? this.addDaysToDate(today, Math.floor(durationDays * 0.2)) : undefined,
      surgerySuccess: null,
    };

    return injury;
  }

  /**
   * Select a random item based on weights
   */
  private selectWeightedRandom<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [item, weight] of entries) {
      random -= weight;
      if (random <= 0) {
        return item;
      }
    }

    return entries[0][0];
  }

  /**
   * Calculate injury duration with modifiers
   */
  private calculateInjuryDuration(
    playerId: EntityId,
    injuryType: InjuryType,
    severity: InjurySeverity,
    baseDuration: number
  ): number {
    const player = this.players.get(playerId);
    if (!player) return baseDuration;

    const club = this.clubs.get(player.clubId!);
    if (!club) return baseDuration;

    let duration = baseDuration;

    // Apply medical facility modifier
    const medicalFacility = this.medicalFacilities.get(club.id);
    if (medicalFacility) {
      const facilityModifier = 1 - (medicalFacility.recoverySpeed / 100);
      duration *= facilityModifier;
    }

    // Apply player attribute modifiers
    duration *= 1 - (player.attributes.naturalFitness / 2000);
    duration *= 1 - (player.attributes.stamina / 2000);
    duration *= 1 - (player.attributes.strength / 2000);

    // Apply age modifier
    duration *= 1 + (player.age / 2000);

    // Round to nearest day
    return Math.round(duration);
  }

  /**
   * Check if an injury requires surgery
   */
  private doesInjuryRequireSurgery(injuryType: InjuryType, severity: InjurySeverity): boolean {
    // Severe injuries often require surgery
    if (severity === 'serious') return Math.random() > 0.3;
    if (severity === 'career_ending') return true;

    // Some injury types always require surgery for certain severities
    if (injuryType === 'knee_ligament' && severity !== 'minor') return true;
    if (injuryType === 'achilles_tendon' && severity !== 'minor') return true;
    if (injuryType === 'broken_bone' && severity !== 'minor') return Math.random() > 0.5;
    if (injuryType === 'muscle_tear' && severity !== 'minor') return Math.random() > 0.5;

    return false;
  }

  /**
   * Get a random opponent player ID (for fouls)
   */
  private getRandomOpponentPlayerId(playerId: EntityId): EntityId | undefined {
    const player = this.players.get(playerId);
    if (!player || !player.clubId) return undefined;

    // In a real implementation, this would get the actual opponent
    // For now, return a random player from a different club
    const allPlayers = Array.from(this.players.values());
    const opponentPlayers = allPlayers.filter(p => p.clubId !== player.clubId);
    
    if (opponentPlayers.length === 0) return undefined;
    
    return opponentPlayers[Math.floor(Math.random() * opponentPlayers.length)].id;
  }

  /**
   * Create a recovery plan for an injury
   */
  private createRecoveryPlan(injury: PlayerInjury): RecoveryPlan {
    const player = this.players.get(injury.playerId);
    if (!player) {
      throw new Error(`Player ${injury.playerId} not found`);
    }

    // Get default phases for this injury type
    const defaultPhases = DEFAULT_RECOVERY_PHASES[injury.type] || DEFAULT_RECOVERY_PHASES.DEFAULT;

    // Calculate phase durations based on total recovery time
    const totalDuration = injury.durationDays;
    const phaseCount = defaultPhases.length;

    // Distribute duration across phases
    const phases: RecoveryPhase[] = defaultPhases.map((phase, index) => {
      // Last phase gets remaining duration
      const isLastPhase = index === phaseCount - 1;
      const duration = isLastPhase 
        ? totalDuration - defaultPhases.slice(0, index).reduce((sum, p) => sum + p.durationDays, 0)
        : phase.durationDays;

      return {
        ...phase,
        startDate: undefined,
        endDate: undefined,
        isComplete: false,
        durationDays: Math.max(1, Math.round(duration)),
      };
    });

    const id = this.generateId();
    const plan: RecoveryPlan = {
      id,
      injuryId: injury.id,
      playerId: injury.playerId,
      phases,
      currentPhase: 0,
      estimatedRecoveryDate: injury.recoveryDate,
      actualRecoveryDate: undefined,
      isComplete: false,
    };

    this.recoveryPlans.set(id, plan);
    return plan;
  }

  /**
   * Update recovery progress for all injured players
   * @param date Current date
   */
  updateRecoveryProgress(date: DateString): void {
    this.injuries.forEach(injury => {
      if (!injury.isActive) return;

      const player = this.players.get(injury.playerId);
      if (!player) return;

      const recoveryPlan = this.getRecoveryPlanForInjury(injury.id);
      if (!recoveryPlan) return;

      // Check if injury should be healed
      if (date >= injury.recoveryDate) {
        this.healInjury(injury.id, date);
        return;
      }

      // Update recovery progress
      const daysInjured = this.getDaysBetween(injury.startDate, date);
      const totalDays = injury.durationDays;
      injury.recoveryProgress = Math.round((daysInjured / totalDays) * 100);

      // Update current phase
      let currentPhaseIndex = recoveryPlan.currentPhase;
      let daysInCurrentPhase = daysInjured;

      for (let i = 0; i < recoveryPlan.phases.length; i++) {
        const phase = recoveryPlan.phases[i];
        if (daysInCurrentPhase <= phase.durationDays) {
          currentPhaseIndex = i;
          break;
        }
        daysInCurrentPhase -= phase.durationDays;
      }

      recoveryPlan.currentPhase = currentPhaseIndex;
      this.recoveryPlans.set(recoveryPlan.id, recoveryPlan);

      // Check for setbacks (random chance)
      if (Math.random() < 0.01) { // 1% chance of setback per day
        this.addSetback(injury.id, date);
      }
    });
  }

  /**
   * Add a setback to an injury
   */
  private addSetback(injuryId: EntityId, date: DateString): void {
    const injury = this.injuries.get(injuryId);
    if (!injury) return;

    // Increase duration by 10-30%
    const extensionDays = Math.floor(injury.durationDays * (0.1 + Math.random() * 0.2));
    injury.durationDays += extensionDays;
    injury.recoveryDate = this.addDaysToDate(injury.startDate, injury.durationDays);
    injury.setbackCount++;

    // Update recovery plan
    const recoveryPlan = this.getRecoveryPlanForInjury(injuryId);
    if (recoveryPlan) {
      recoveryPlan.estimatedRecoveryDate = injury.recoveryDate;
      this.recoveryPlans.set(recoveryPlan.id, recoveryPlan);
    }
  }

  /**
   * Heal an injury
   */
  private healInjury(injuryId: EntityId, date: DateString): void {
    const injury = this.injuries.get(injuryId);
    if (!injury) return;

    injury.isActive = false;
    injury.recoveryProgress = 100;

    const recoveryPlan = this.getRecoveryPlanForInjury(injuryId);
    if (recoveryPlan) {
      recoveryPlan.isComplete = true;
      recoveryPlan.actualRecoveryDate = date;
      this.recoveryPlans.set(recoveryPlan.id, recoveryPlan);
    }

    // Update player
    const player = this.players.get(injury.playerId);
    if (player) {
      player.injury = null;
    }
  }

  /**
   * Perform surgery on an injury
   */
  performSurgery(injuryId: EntityId, date: DateString): boolean {
    const injury = this.injuries.get(injuryId);
    if (!injury) return false;

    // Can only perform surgery if required and not already performed
    if (!injury.requiresSurgery || injury.surgeryDate) return false;

    // Check if it's time for surgery (typically early in recovery)
    const today = date;
    const daysSinceInjury = this.getDaysBetween(injury.startDate, today);
    if (daysSinceInjury < injury.durationDays * 0.1) {
      return false; // Too early for surgery
    }

    // Calculate surgery success rate
    const player = this.players.get(injury.playerId);
    const club = this.clubs.get(player?.clubId!);
    let successRate = 0.8; // Base success rate

    if (club) {
      const medicalFacility = this.medicalFacilities.get(club.id);
      if (medicalFacility) {
        successRate += medicalFacility.surgerySuccessRate / 100 * 0.2; // Add up to 20%
      }
    }

    // Perform surgery
    injury.surgeryDate = today;
    injury.surgerySuccess = Math.random() < successRate;

    // If successful, reduce recovery time by 10-30%
    if (injury.surgerySuccess) {
      const reduction = Math.floor(injury.durationDays * (0.1 + Math.random() * 0.2));
      injury.durationDays -= reduction;
      injury.recoveryDate = this.addDaysToDate(injury.startDate, injury.durationDays);

      // Update recovery plan
      const recoveryPlan = this.getRecoveryPlanForInjury(injuryId);
      if (recoveryPlan) {
        recoveryPlan.estimatedRecoveryDate = injury.recoveryDate;
        this.recoveryPlans.set(recoveryPlan.id, recoveryPlan);
      }
    }

    return injury.surgerySuccess;
  }

  /**
   * Get recovery plan for an injury
   */
  private getRecoveryPlanForInjury(injuryId: EntityId): RecoveryPlan | null {
    for (const plan of this.recoveryPlans.values()) {
      if (plan.injuryId === injuryId) {
        return plan;
      }
    }
    return null;
  }

  /**
   * Get current recovery phase for an injury
   */
  getCurrentRecoveryPhase(injuryId: EntityId): RecoveryPhase | null {
    const recoveryPlan = this.getRecoveryPlanForInjury(injuryId);
    if (!recoveryPlan) return null;

    return recoveryPlan.phases[recoveryPlan.currentPhase] || null;
  }

  /**
   * Get injury by ID
   */
  getInjury(injuryId: EntityId): PlayerInjury | null {
    return this.injuries.get(injuryId) || null;
  }

  /**
   * Get all injuries for a player
   */
  getPlayerInjuries(playerId: EntityId): PlayerInjury[] {
    return this.playerInjuries.get(playerId) || [];
  }

  /**
   * Get active injuries for a player
   */
  getActivePlayerInjuries(playerId: EntityId): PlayerInjury[] {
    const injuries = this.getPlayerInjuries(playerId);
    return injuries.filter(i => i.isActive);
  }

  /**
   * Check if a player is currently injured
   */
  isPlayerInjured(playerId: EntityId): boolean {
    const injuries = this.getActivePlayerInjuries(playerId);
    return injuries.length > 0;
  }

  /**
   * Get injury history for a player
   */
  getPlayerInjuryHistory(playerId: EntityId): PlayerInjuryHistory | null {
    const injuries = this.getPlayerInjuries(playerId);
    if (injuries.length === 0) return null;

    const totalDaysInjured = injuries.reduce((sum, injury) => sum + injury.durationDays, 0);
    const severities: InjurySeverity[] = injuries.map(i => i.severity);
    const mostSevere = this.getMostSevereInjury(severities);
    const types: InjuryType[] = injuries.map(i => i.type);
    const mostCommonType = this.getMostCommonInjuryType(types);

    // Calculate injury-free streak
    const activeInjuries = injuries.filter(i => i.isActive);
    let injuryFreeStreak = 0;
    if (activeInjuries.length === 0) {
      const lastInjury = injuries[injuries.length - 1];
      if (lastInjury) {
        injuryFreeStreak = this.getDaysBetween(lastInjury.recoveryDate, this.getCurrentDate());
      }
    }

    return {
      playerId,
      injuries,
      totalInjuries: injuries.length,
      totalDaysInjured,
      mostSevereInjury: mostSevere,
      mostCommonInjuryType: mostCommonType,
      injuryFreeStreak,
    };
  }

  /**
   * Get the most severe injury from a list
   */
  private getMostSevereInjury(severities: InjurySeverity[]): InjurySeverity | null {
    const severityOrder: InjurySeverity[] = ['minor', 'moderate', 'serious', 'career_ending'];
    for (let i = severityOrder.length - 1; i >= 0; i--) {
      if (severities.includes(severityOrder[i])) {
        return severityOrder[i];
      }
    }
    return null;
  }

  /**
   * Get the most common injury type from a list
   */
  private getMostCommonInjuryType(types: InjuryType[]): InjuryType | null {
    const counts: Record<InjuryType, number> = {} as Record<InjuryType, number>;
    types.forEach(type => {
      counts[type] = (counts[type] || 0) + 1;
    });

    let mostCommon: InjuryType | null = null;
    let maxCount = 0;
    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        mostCommon = type as InjuryType;
        maxCount = count;
      }
    }

    return mostCommon;
  }

  /**
   * Generate an injury report for a player
   */
  generateInjuryReport(playerId: EntityId, injuryId: EntityId): InjuryReport | null {
    const injury = this.getInjury(injuryId);
    if (!injury) return null;

    const player = this.players.get(playerId);
    if (!player) return null;

    const recoveryPlan = this.getRecoveryPlanForInjury(injuryId);
    const history = this.getPlayerInjuryHistory(playerId);

    // Generate prevention recommendations
    const recommendations = this.generatePreventionRecommendations(playerId, injury);

    return {
      playerId,
      injuryId,
      type: injury.type,
      severity: injury.severity,
      estimatedRecoveryTime: injury.durationDays,
      actualRecoveryTime: injury.isActive ? undefined : this.getDaysBetween(injury.startDate, injury.recoveryDate),
      date: injury.startDate,
      matchContext: injury.matchId ? {
        matchId: injury.matchId,
        minute: injury.minute!,
        opponentPlayerId: injury.opponentPlayerId!,
        isFoul: injury.isFoul,
      } : undefined,
      recoveryPlan: recoveryPlan!,
      preventionRecommendations: recommendations,
    };
  }

  /**
   * Generate prevention recommendations based on injury
   */
  private generatePreventionRecommendations(
    playerId: EntityId,
    injury: PlayerInjury
  ): string[] {
    const recommendations: string[] = [];
    const player = this.players.get(playerId);
    if (!player) return recommendations;

    // General recommendations
    recommendations.push('Improve warm-up and cool-down routines');
    recommendations.push('Increase focus on strength and conditioning');

    // Position-specific recommendations
    switch (player.position) {
      case 'GK':
        recommendations.push('Work on landing techniques to prevent knee injuries');
        break;
      case 'CB':
      case 'RB':
      case 'LB':
        recommendations.push('Strengthen leg muscles to prevent tackles and collisions');
        break;
      case 'CM':
      case 'CDM':
        recommendations.push('Improve core strength to handle physical battles');
        break;
      case 'RW':
      case 'LW':
        recommendations.push('Work on agility to avoid tackles');
        break;
      case 'ST':
        recommendations.push('Improve upper body strength for holding off defenders');
        break;
    }

    // Injury-specific recommendations
    switch (injury.type) {
      case 'ankle_sprain':
        recommendations.push('Wear ankle supports during matches');
        recommendations.push('Strengthen ankle muscles with specific exercises');
        break;
      case 'hamstring_strain':
        recommendations.push('Increase warm-up time before high-intensity activities');
        recommendations.push('Work on hamstring flexibility');
        break;
      case 'groin_strain':
        recommendations.push('Improve hip mobility');
        recommendations.push('Strengthen adductor muscles');
        break;
      case 'knee_ligament':
        recommendations.push('Wear knee brace for support');
        recommendations.push('Avoid excessive pivoting movements');
        break;
      case 'achilles_tendon':
        recommendations.push('Wear proper footwear with good heel support');
        recommendations.push('Strengthen calf muscles');
        break;
      case 'concussion':
        recommendations.push('Wear proper head protection if available');
        recommendations.push('Avoid heading in training for a period');
        break;
    }

    // If injury was from a foul
    if (injury.isFoul) {
      recommendations.push('Request better protection from referees');
      recommendations.push('Work on evasive techniques to avoid dangerous tackles');
    }

    // If player has high injury proneness
    if (player.hiddenAttributes.injuryProneness > 70) {
      recommendations.push('Implement personalized injury prevention program');
      recommendations.push('Monitor training load carefully');
    }

    // If player is older
    if (player.age > 30) {
      recommendations.push('Adjust training intensity to account for age');
      recommendations.push('Increase recovery time between matches');
    }

    return recommendations;
  }

  /**
   * Add medical staff to a club
   */
  addMedicalStaff(staff: MedicalStaff): void {
    if (!this.medicalStaff.has(staff.clubId)) {
      this.medicalStaff.set(staff.clubId, []);
    }
    this.medicalStaff.get(staff.clubId)!.push(staff);
  }

  /**
   * Remove medical staff from a club
   */
  removeMedicalStaff(staffId: EntityId, clubId: EntityId): void {
    const staff = this.medicalStaff.get(clubId);
    if (staff) {
      this.medicalStaff.set(
        clubId,
        staff.filter(s => s.id !== staffId)
      );
    }
  }

  /**
   * Add a medical facility for a club
   */
  addMedicalFacility(facility: MedicalFacility): void {
    this.medicalFacilities.set(facility.clubId, facility);
  }

  /**
   * Update a medical facility for a club
   */
  updateMedicalFacility(clubId: EntityId, updates: Partial<MedicalFacility>): void {
    const facility = this.medicalFacilities.get(clubId);
    if (facility) {
      this.medicalFacilities.set(clubId, { ...facility, ...updates });
    }
  }

  /**
   * Add an injury to a player's history
   */
  private addPlayerInjury(playerId: EntityId, injury: PlayerInjury): void {
    if (!this.playerInjuries.has(playerId)) {
      this.playerInjuries.set(playerId, []);
    }
    this.playerInjuries.get(playerId)!.push(injury);
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
    this.medicalFacilities.delete(clubId);
    this.medicalStaff.delete(clubId);
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
    this.playerInjuries.delete(playerId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.players.clear();
    this.clubs.clear();
    this.injuries.clear();
    this.playerInjuries.clear();
    this.recoveryPlans.clear();
    this.medicalFacilities.clear();
    this.medicalStaff.clear();
  }
}
