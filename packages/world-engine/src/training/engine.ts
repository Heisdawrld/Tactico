// TACTICO World Engine - Training Engine
// Handles player development and training effects

import {
  EntityId,
  DateString,
  Player,
  Club,
} from '../core/types';
import {
  TrainingCategory,
  TrainingIntensity,
  TrainingFocusArea,
  TrainingSession,
  IndividualTraining,
  ClubTrainingSchedule,
  TrainingEffect,
  WeeklyTrainingResults,
  TrainingFacility,
  CoachingStaff,
  TrainingConfig,
  PlayerDevelopment,
  DevelopmentFactors,
  BASE_TRAINING_EFFECTS,
  TRAINING_CATEGORY_MULTIPLIERS,
  ATTRIBUTE_TO_CATEGORY,
  MAX_WEEKLY_IMPROVEMENT,
  MIN_WEEKLY_IMPROVEMENT,
  FACILITY_QUALITY_EFFECTS,
  COACHING_ABILITY_EFFECTS,
  getCoachingEffect,
} from './types';

/**
 * TrainingEngine - Manages player training and development
 * 
 * Handles:
 * - Weekly training sessions
 * - Individual player training
 * - Attribute improvements
 * - Development curves
 * - Facility and coaching effects
 */
export class TrainingEngine {
  private clubs: Map<EntityId, Club> = new Map();
  private players: Map<EntityId, Player> = new Map();
  private coachingStaff: Map<EntityId, CoachingStaff[]> = new Map();
  private trainingSchedules: Map<EntityId, ClubTrainingSchedule> = new Map();

  /**
   * Initialize the training engine
   */
  initialize(
    clubs: Club[],
    players: Player[],
    coachingStaff: CoachingStaff[]
  ): void {
    clubs.forEach(club => this.clubs.set(club.id, club));
    players.forEach(player => this.players.set(player.id, player));
    coachingStaff.forEach(staff => {
      if (!this.coachingStaff.has(staff.clubId)) {
        this.coachingStaff.set(staff.clubId, []);
      }
      this.coachingStaff.get(staff.clubId)!.push(staff);
    });
  }

  /**
   * Process weekly training for all clubs
   * @param date Current date
   * @returns Training results for the week
   */
  processWeeklyTraining(date: DateString): WeeklyTrainingResults[] {
    const results: WeeklyTrainingResults[] = [];

    this.clubs.forEach(club => {
      const clubPlayers = this.getClubPlayers(club.id);
      if (clubPlayers.length === 0) return;

      const schedule = this.getTrainingSchedule(club.id);
      const facilityEffect = FACILITY_QUALITY_EFFECTS[club.trainingFacilities];
      const coachingEffect = this.calculateCoachingEffect(club.id);

      const playerEffects: TrainingEffect[] = [];
      let totalImprovement = 0;
      let effectCount = 0;

      clubPlayers.forEach(player => {
        // Skip injured players
        if (player.injury) return;

        // Get individual training for this player
        const individualTraining = schedule.individualTraining.find(
          it => it.playerId === player.id
        );

        // Process each training category
        for (const [category, intensity] of Object.entries(schedule.weeklySchedule)) {
          const effects = this.processTrainingCategory(
            player,
            category as TrainingCategory,
            intensity as TrainingIntensity,
            facilityEffect,
            coachingEffect,
            individualTraining
          );
          playerEffects.push(...effects);
        }

        // Calculate total improvement for this player
        const playerImprovement = playerEffects
          .filter(e => e.playerId === player.id)
          .reduce((sum, e) => sum + e.improvement, 0);
        
        if (playerImprovement > 0) {
          totalImprovement += playerImprovement;
          effectCount++;
        }
      });

      const averageImprovement = effectCount > 0 
        ? totalImprovement / effectCount 
        : 0;

      results.push({
        clubId: club.id,
        date,
        playerEffects,
        overallImprovement: averageImprovement,
      });
    });

    return results;
  }

  /**
   * Process training for a specific category
   */
  private processTrainingCategory(
    player: Player,
    category: TrainingCategory,
    intensity: TrainingIntensity,
    facilityEffect: number,
    coachingEffect: number,
    individualTraining?: IndividualTraining
  ): TrainingEffect[] {
    const effects: TrainingEffect[] = [];
    const baseEffect = BASE_TRAINING_EFFECTS[intensity];
    const categoryMultiplier = TRAINING_CATEGORY_MULTIPLIERS[category];
    
    // Get focus areas for this category
    const focusAreas = this.getFocusAreasForCategory(category);

    // If player has individual training in this category, prioritize their focus
    if (individualTraining?.category === category) {
      const effect = this.calculateTrainingEffect(
        player,
        individualTraining.focusArea,
        baseEffect * 1.5, // Individual training gets 50% bonus
        categoryMultiplier,
        facilityEffect,
        coachingEffect
      );
      if (effect.improvement > 0) {
        effects.push(effect);
      }
      return effects;
    }

    // Otherwise, apply training to all focus areas in this category
    for (const focusArea of focusAreas) {
      const effect = this.calculateTrainingEffect(
        player,
        focusArea,
        baseEffect,
        categoryMultiplier,
        facilityEffect,
        coachingEffect
      );
      if (effect.improvement > 0) {
        effects.push(effect);
      }
    }

    return effects;
  }

  /**
   * Calculate the effect of training on a specific attribute
   */
  private calculateTrainingEffect(
    player: Player,
    focusArea: TrainingFocusArea,
    baseEffect: number,
    categoryMultiplier: number,
    facilityEffect: number,
    coachingEffect: number
  ): TrainingEffect {
    const currentValue = player.attributes?.[focusArea as keyof typeof player.attributes] || 50;
    
    // Don't improve if already at max
    if (currentValue >= 100) {
      return {
        playerId: player.id,
        attribute: focusArea,
        improvement: 0,
        reason: `Already at maximum (${currentValue})`,
      };
    }

    // Calculate improvement
    let improvement = baseEffect * categoryMultiplier * facilityEffect * coachingEffect;

    // Apply age modifier (younger players improve faster)
    improvement *= this.getAgeModifier(player.age);

    // Apply potential modifier (higher potential = more room to grow)
    improvement *= (100 - currentValue) / 100;

    // Apply professionalism modifier
    improvement *= player.hiddenAttributes?.professionalism / 100;

    // Apply consistency modifier
    improvement *= player.hiddenAttributes?.consistency / 100;

    // Apply random variation (±20%)
    improvement *= 0.8 + Math.random() * 0.4;

    // Clamp improvement
    improvement = Math.max(MIN_WEEKLY_IMPROVEMENT, Math.min(MAX_WEEKLY_IMPROVEMENT, improvement));

    // Round to 2 decimal places
    improvement = Math.round(improvement * 100) / 100;

    return {
      playerId: player.id,
      attribute: focusArea,
      improvement,
      reason: `Training: ${category} (intensity ${intensity})`,
    };
  }

  /**
   * Get focus areas for a training category
   */
  private getFocusAreasForCategory(category: TrainingCategory): TrainingFocusArea[] {
    const allFocusAreas: TrainingFocusArea[] = [
      // Physical
      'stamina', 'strength', 'pace', 'acceleration', 'agility', 'balance', 'jumping_reach', 'natural_fitness',
      // Technical
      'passing', 'shooting', 'dribbling', 'ball_control', 'first_touch', 'heading', 'crossing', 'finishing', 'long_shots', 'set_pieces', 'penalty_taking',
      // Mental
      'aggression', 'anticipation', 'composure', 'concentration', 'creativity', 'decisions', 'determination', 'flair', 'leadership', 'off_the_ball', 'positioning', 'teamwork', 'vision', 'work_rate',
      // Tactical
      'positioning', 'teamwork', 'decision_making', 'game_understanding', 'tactical_awareness',
      // Goalkeeping
      'handling', 'reflexes', 'aerial_ability', 'distribution', 'command_of_area', 'one_on_ones',
    ];

    return allFocusAreas.filter(area => ATTRIBUTE_TO_CATEGORY[area] === category);
  }

  /**
   * Get age modifier for development
   */
  private getAgeModifier(age: number): number {
    if (age < 18) return 1.5;   // Under 18: very fast development
    if (age < 21) return 1.3;   // Under 21: fast development
    if (age < 25) return 1.1;   // Under 25: good development
    if (age < 28) return 1.0;   // 25-28: peak development
    if (age < 32) return 0.8;   // 29-32: slowing down
    if (age < 35) return 0.5;   // 33-35: minimal development
    return 0.2;               // 36+: very minimal development
  }

  /**
   * Calculate coaching effect for a club
   */
  private calculateCoachingEffect(clubId: EntityId): number {
    const staff = this.coachingStaff.get(clubId);
    if (!staff || staff.length === 0) return 1.0;

    // Calculate average coaching ability
    const avgAbility = staff.reduce((sum, s) => sum + s.coachingAbility, 0) / staff.length;
    return getCoachingEffect(avgAbility);
  }

  /**
   * Get players for a club
   */
  private getClubPlayers(clubId: EntityId): Player[] {
    return Array.from(this.players.values())
      .filter(p => p.clubId === clubId && !p.injury);
  }

  /**
   * Get training schedule for a club (default if not set)
   */
  private getTrainingSchedule(clubId: EntityId): ClubTrainingSchedule {
    const existing = this.trainingSchedules.get(clubId);
    if (existing) return existing;

    // Default schedule: moderate intensity for all categories
    return {
      clubId,
      weeklySchedule: {
        physical: 3,
        technical: 3,
        mental: 3,
        tactical: 2,
        goalkeeping: 2,
      },
      individualTraining: [],
    };
  }

  /**
   * Set training schedule for a club
   */
  setTrainingSchedule(clubId: EntityId, schedule: ClubTrainingSchedule): void {
    this.trainingSchedules.set(clubId, schedule);
  }

  /**
   * Set individual training for a player
   */
  setIndividualTraining(
    clubId: EntityId,
    playerId: EntityId,
    training: IndividualTraining
  ): void {
    const schedule = this.getTrainingSchedule(clubId);
    const existingIndex = schedule.individualTraining.findIndex(
      it => it.playerId === playerId
    );

    if (existingIndex >= 0) {
      schedule.individualTraining[existingIndex] = training;
    } else if (schedule.individualTraining.length < 2) {
      // Max 2 players per club for individual training
      schedule.individualTraining.push(training);
    }

    this.trainingSchedules.set(clubId, schedule);
  }

  /**
   * Remove individual training for a player
   */
  removeIndividualTraining(clubId: EntityId, playerId: EntityId): void {
    const schedule = this.getTrainingSchedule(clubId);
    schedule.individualTraining = schedule.individualTraining.filter(
      it => it.playerId !== playerId
    );
    this.trainingSchedules.set(clubId, schedule);
  }

  /**
   * Apply training effects to players
   */
  applyTrainingEffects(effects: TrainingEffect[]): void {
    effects.forEach(effect => {
      const player = this.players.get(effect.playerId);
      if (!player) return;

      const attribute = effect.attribute as keyof typeof player.attributes;
      if (player.attributes?.[attribute] !== undefined) {
        player.attributes?.[attribute] = Math.min(
          100,
          player.attributes?.[attribute] + effect.improvement
        );
      }

      // Recalculate current ability
      player.currentAbility = this.calculateCurrentAbility(player);
    });
  }

  /**
   * Calculate player's current ability from attributes
   */
  private calculateCurrentAbility(player: Player): number {
    const positionWeights = this.getPositionWeights(player.position);
    
    let total = 0;
    let weightSum = 0;

    for (const [attribute, weight] of Object.entries(positionWeights)) {
      const attrValue = player.attributes?.[attribute as keyof typeof player.attributes] || 50;
      total += attrValue * weight;
      weightSum += weight;
    }

    return Math.round(total / weightSum);
  }

  /**
   * Get attribute weights for a position
   */
  private getPositionWeights(position: string): Record<string, number> {
    const weights: Record<string, Record<string, number>> = {
      GK: { 
        handling: 0.3, reflexes: 0.3, aerial_ability: 0.2, 
        distribution: 0.1, command_of_area: 0.1 
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
      DEFAULT: {
        passing: 0.2, shooting: 0.2, dribbling: 0.2,
        pace: 0.15, strength: 0.15, defending: 0.1
      }
    };

    // Map generic attributes to specific ones
    const mappedWeights: Record<string, number> = {};
    for (const [attr, weight] of Object.entries(weights[position] || weights.DEFAULT)) {
      // Map generic names to actual attribute names
      const mappedAttr = this.mapAttributeName(attr);
      if (mappedAttr) {
        mappedWeights[mappedAttr] = weight;
      }
    }

    return mappedWeights;
  }

  /**
   * Map generic attribute names to actual attribute names
   */
  private mapAttributeName(name: string): string | null {
    const mapping: Record<string, string> = {
      handling: 'ballControl',
      reflexes: 'ballControl',
      aerial_ability: 'heading',
      distribution: 'passing',
      command_of_area: 'positioning',
      one_on_ones: 'composure',
      tackling: 'defending',
      defending: 'defending',
    };
    return mapping[name] || name;
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
    this.trainingSchedules.delete(clubId);
    this.coachingStaff.delete(clubId);
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
    // Remove from individual training
    this.trainingSchedules.forEach(schedule => {
      schedule.individualTraining = schedule.individualTraining.filter(
        it => it.playerId !== playerId
      );
    });
  }

  /**
   * Add coaching staff
   */
  addCoachingStaff(staff: CoachingStaff): void {
    if (!this.coachingStaff.has(staff.clubId)) {
      this.coachingStaff.set(staff.clubId, []);
    }
    this.coachingStaff.get(staff.clubId)!.push(staff);
  }

  /**
   * Remove coaching staff
   */
  removeCoachingStaff(staffId: EntityId, clubId: EntityId): void {
    const staff = this.coachingStaff.get(clubId);
    if (staff) {
      this.coachingStaff.set(
        clubId,
        staff.filter(s => s.id !== staffId)
      );
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.clubs.clear();
    this.players.clear();
    this.coachingStaff.clear();
    this.trainingSchedules.clear();
  }
}
