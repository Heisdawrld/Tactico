// TACTICO World Engine - Youth Engine
// Handles youth player generation, development, and graduation

import { EntityId, DateString, Player, Club, Nation } from '../core/types';
import {
  YouthIntake,
  YouthPlayer,
  YouthAcademy,
  YouthCoach,
  YouthScout,
  YouthDevelopmentPlan,
  YouthAcademyUpgrade,
  YouthGraduation,
  YouthIntakeSchedule,
  YouthScoutingReport,
  BASE_YOUTH_PLAYERS_PER_INTAKE,
  YOUTH_QUALITY_MODIFIERS,
  YOUTH_ATTRIBUTE_RANGES,
  YOUTH_POSITION_DISTRIBUTION,
  YOUTH_FOOT_PREFERENCE,
  YOUTH_DEVELOPMENT_RATES,
  YOUTH_ACADEMY_UPGRADE_COSTS,
  YOUTH_ACADEMY_WEEKLY_COSTS,
  YOUTH_COACH_SALARIES,
  YOUTH_SCOUT_SALARIES,
  YOUTH_PLAYER_WAGES,
  YOUTH_CONTRACT_DURATION,
  MIN_YOUTH_AGE,
  MAX_YOUTH_AGE,
  YOUTH_GRADUATION_AGE,
  YOUTH_GRADUATION_PROBABILITIES,
  NATION_YOUTH_MODIFIERS,
} from './types';

/**
 * YouthEngine - Manages youth player generation and development
 * 
 * Handles:
 * - Youth intake (weekly/monthly/quarterly)
 * - Youth player generation
 * - Youth academy management
 * - Youth player development
 * - Youth player graduation to senior team
 * - Youth scouting
 */
export class YouthEngine {
  private clubs: Map<EntityId, Club> = new Map();
  private nations: Map<string, Nation> = new Map();
  private players: Map<EntityId, Player> = new Map();
  private youthAcademies: Map<EntityId, YouthAcademy> = new Map();
  private youthIntakes: Map<EntityId, YouthIntake[]> = new Map();
  private youthPlayers: Map<EntityId, YouthPlayer> = new Map();
  private developmentPlans: Map<EntityId, YouthDevelopmentPlan> = new Map();
  private graduations: Map<EntityId, YouthGraduation[]> = new Map();
  private youthCoaches: Map<EntityId, YouthCoach[]> = new Map();
  private youthScouts: Map<EntityId, YouthScout[]> = new Map();
  private scoutingReports: Map<EntityId, YouthScoutingReport[]> = new Map();
  private intakeSchedules: Map<EntityId, YouthIntakeSchedule> = new Map();

  /**
   * Initialize the youth engine
   */
  initialize(
    clubs: Club[],
    nations: Nation[],
    players: Player[]
  ): void {
    clubs.forEach(club => {
      this.clubs.set(club.id, club);
      // Initialize youth academy for each club
      this.youthAcademies.set(club.id, this.createYouthAcademy(club));
      // Initialize intake schedule
      this.intakeSchedules.set(club.id, this.createIntakeSchedule(club));
    });
    nations.forEach(nation => this.nations.set(nation.code, nation));
    players.forEach(player => this.players.set(player.id, player));
  }

  /**
   * Create a youth academy for a club
   */
  private createYouthAcademy(club: Club): YouthAcademy {
    return {
      clubId: club.id,
      level: club.youthAcademy,
      quality: club.youthAcademy * 20, // Convert 1-5 to 20-100
      reputation: club.reputation * 0.8, // Youth academy reputation is 80% of club reputation
      trainingFacilities: club.trainingFacilities,
      medicalFacilities: club.medicalCenter,
      accommodation: 3, // Default accommodation level
      coaches: [],
      scouts: [],
      playersProduced: 0,
      playersGraduated: 0,
      averagePotential: 50,
      budget: club.youthAcademy * 5000000, // $5M per level per year
      weeklyCost: club.youthAcademy * 100000, // $100K per level per week
    };
  }

  /**
   * Create an intake schedule for a club
   */
  private createIntakeSchedule(club: Club): YouthIntakeSchedule {
    return {
      clubId: club.id,
      intakeFrequency: 'monthly',
      nextIntakeDate: this.getNextIntakeDate('monthly'),
      intakeDay: 1,
      qualityTarget: club.youthAcademy * 20,
    };
  }

  /**
   * Get next intake date based on frequency
   */
  private getNextIntakeDate(frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): DateString {
    const today = this.getCurrentDate();
    const daysToAdd = YOUTH_INTAKE_FREQUENCY[frequency];
    return this.addDaysToDate(today, daysToAdd);
  }

  // ============================================
  // YOUTH INTAKE METHODS
  // ============================================

  /**
   * Process youth intake for all clubs
   * @param date Current date
   * @returns Array of youth intakes
   */
  processYouthIntake(date: DateString): YouthIntake[] {
    const intakes: YouthIntake[] = [];

    this.clubs.forEach(club => {
      const schedule = this.intakeSchedules.get(club.id);
      if (!schedule) return;

      // Check if it's time for intake
      if (date >= schedule.nextIntakeDate) {
        const intake = this.processClubYouthIntake(club.id, date);
        if (intake) {
          intakes.push(intake);
          
          // Update next intake date
          schedule.nextIntakeDate = this.addDaysToDate(
            date,
            YOUTH_INTAKE_FREQUENCY[schedule.intakeFrequency]
          );
          this.intakeSchedules.set(club.id, schedule);
        }
      }
    });

    return intakes;
  }

  /**
   * Process youth intake for a single club
   */
  private processClubYouthIntake(clubId: EntityId, date: DateString): YouthIntake | null {
    const club = this.clubs.get(clubId);
    if (!club) return null;

    const academy = this.youthAcademies.get(clubId);
    if (!academy) return null;

    // Calculate number of players to generate
    const baseNumber = BASE_YOUTH_PLAYERS_PER_INTAKE[academy.level];
    const qualityModifier = YOUTH_QUALITY_MODIFIERS[academy.level];
    const nation = this.nations.get(club.nationCode);
    const nationModifier = nation ? NATION_YOUTH_MODIFIERS[nation.youthQuality] || 1 : 1;
    
    // Add some randomness
    const randomModifier = 0.8 + Math.random() * 0.4;
    const numberOfPlayers = Math.max(
      1,
      Math.round(baseNumber * qualityModifier * nationModifier * randomModifier)
    );

    // Generate players
    const players: YouthPlayer[] = [];
    let totalCurrentAbility = 0;
    let totalPotentialAbility = 0;
    let bestPlayer: YouthPlayer | null = null;

    for (let i = 0; i < numberOfPlayers; i++) {
      const player = this.generateYouthPlayer(club, academy, date);
      players.push(player);
      
      totalCurrentAbility += player.currentAbility;
      totalPotentialAbility += player.potentialAbility;
      
      if (!bestPlayer || player.potentialAbility > bestPlayer.potentialAbility) {
        bestPlayer = player;
      }
    }

    const averageCurrentAbility = Math.round(totalCurrentAbility / players.length);
    const averagePotentialAbility = Math.round(totalPotentialAbility / players.length);

    const intake: YouthIntake = {
      id: this.generateId(),
      clubId,
      date,
      quality: Math.round(qualityModifier * 100),
      numberOfPlayers: players.length,
      players,
      averageCurrentAbility,
      averagePotentialAbility,
      bestPlayer,
    };

    // Store intake
    if (!this.youthIntakes.has(clubId)) {
      this.youthIntakes.set(clubId, []);
    }
    this.youthIntakes.get(clubId)!.push(intake);

    // Store players
    players.forEach(player => {
      this.youthPlayers.set(player.id, player);
      academy.playersProduced++;
    });

    // Update academy stats
    academy.averagePotential = (
      (academy.averagePotential * (academy.playersProduced - players.length)) + 
      totalPotentialAbility
    ) / academy.playersProduced;

    this.youthAcademies.set(clubId, academy);

    return intake;
  }

  /**
   * Generate a youth player
   */
  private generateYouthPlayer(
    club: Club,
    academy: YouthAcademy,
    date: DateString
  ): YouthPlayer {
    const id = this.generateId();

    // Generate personal info
    const nationality = this.getRandomNationality(club.nationCode);
    const { firstName, lastName } = this.generateRandomName(nationality);
    const age = this.generateRandomAge();
    const dateOfBirth = this.subtractYearsFromDate(date, age);
    const height = this.generateRandomHeight();
    const weight = this.generateRandomWeight(height);

    // Generate position
    const position = this.selectWeightedRandom(YOUTH_POSITION_DISTRIBUTION);

    // Generate foot preference
    const foot = this.selectWeightedRandom(YOUTH_FOOT_PREFERENCE);

    // Generate attributes based on position and academy quality
    const attributes = this.generateYouthAttributes(position, academy);

    // Generate hidden attributes
    const hiddenAttributes = this.generateYouthHiddenAttributes();

    // Calculate current and potential ability
    const currentAbility = this.calculateYouthCurrentAbility(attributes, age);
    const potentialAbility = this.calculateYouthPotentialAbility(
      attributes,
      hiddenAttributes,
      academy,
      club,
      nationality
    );

    // Determine potential rating
    const potentialRating = this.getPotentialRating(potentialAbility);

    // Calculate development rate
    const developmentRate = YOUTH_DEVELOPMENT_RATES[potentialRating];

    // Calculate peak age
    const peakAge = this.calculatePeakAge(position);

    // Generate appearance
    const appearance = this.generateRandomAppearance(nationality);

    // Create contract
    const wage = YOUTH_PLAYER_WAGES[potentialRating];
    const contract = {
      type: 'youth' as const,
      startDate: date,
      expiryDate: this.addYearsToDate(date, YOUTH_CONTRACT_DURATION),
      wage,
    };

    return {
      id,
      clubId: club.id,
      intakeId: 0, // Will be set later
      firstName,
      lastName,
      nationality,
      dateOfBirth,
      age,
      height,
      weight,
      position,
      foot,
      attributes,
      hiddenAttributes,
      currentAbility,
      potentialAbility,
      potentialRating,
      developmentRate,
      peakAge,
      contract,
      appearance,
    };
  }

  /**
   * Generate random nationality (biased towards club's nation)
   */
  private getRandomNationality(clubNationCode: string): string {
    // 70% chance to be from club's nation
    if (Math.random() < 0.7) {
      return clubNationCode;
    }

    // 30% chance to be from another nation
    const nationCodes = Array.from(this.nations.keys());
    return nationCodes[Math.floor(Math.random() * nationCodes.length)];
  }

  /**
   * Generate random name based on nationality
   */
  private generateRandomName(nationality: string): { firstName: string; lastName: string } {
    // In a real implementation, this would use nationality-specific name databases
    // For now, use generic names
    const firstNames = ['James', 'John', 'Michael', 'David', 'Robert', 'William', 'Daniel', 'Matthew', 'Christopher', 'Andrew'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];

    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    };
  }

  /**
   * Generate random age for youth player
   */
  private generateRandomAge(): number {
    return MIN_YOUTH_AGE + Math.floor(Math.random() * (MAX_YOUTH_AGE - MIN_YOUTH_AGE + 1));
  }

  /**
   * Generate random height for youth player
   */
  private generateRandomHeight(): number {
    // Base height based on position
    let baseHeight = 175; // cm
    
    // Goalkeepers and defenders tend to be taller
    if (['GK', 'CB', 'RB', 'LB'].includes(this.selectWeightedRandom(YOUTH_POSITION_DISTRIBUTION))) {
      baseHeight = 185;
    }
    // Midfielders and forwards tend to be average height
    else if (['CM', 'CDM', 'CAM', 'RW', 'LW', 'ST'].includes(this.selectWeightedRandom(YOUTH_POSITION_DISTRIBUTION))) {
      baseHeight = 178;
    }

    // Add random variation (±10 cm)
    return baseHeight - 5 + Math.floor(Math.random() * 10);
  }

  /**
   * Generate random weight based on height
   */
  private generateRandomWeight(height: number): number {
    // Rough estimate: weight (kg) = (height (cm) - 100) * 0.9 ± 10%
    const baseWeight = (height - 100) * 0.9;
    return Math.round(baseWeight * (0.9 + Math.random() * 0.2));
  }

  /**
   * Generate youth player attributes
   */
  private generateYouthAttributes(position: string, academy: YouthAcademy): Record<string, number> {
    // Get attribute ranges based on academy quality
    const qualityModifier = YOUTH_QUALITY_MODIFIERS[academy.level];
    
    // Base attribute range for youth players (40-70)
    const baseMin = 40;
    const baseMax = 70;

    // Position-specific modifiers
    const positionModifiers = this.getPositionAttributeModifiers(position);

    // Generate attributes
    const attributes: Record<string, number> = {};

    // Technical attributes
    ['passing', 'shooting', 'dribbling', 'ballControl', 'firstTouch', 'heading', 'crossing', 'finishing', 'longShots', 'setPieces', 'penaltyTaking'].forEach(attr => {
      const modifier = positionModifiers[attr as keyof typeof positionModifiers] || 1.0;
      attributes[attr] = this.generateAttribute(baseMin, baseMax, modifier, qualityModifier);
    });

    // Physical attributes
    ['pace', 'acceleration', 'agility', 'balance', 'strength', 'stamina', 'jumpingReach', 'naturalFitness'].forEach(attr => {
      const modifier = positionModifiers[attr as keyof typeof positionModifiers] || 1.0;
      attributes[attr] = this.generateAttribute(baseMin, baseMax, modifier, qualityModifier);
    });

    // Mental attributes
    ['aggression', 'anticipation', 'composure', 'concentration', 'creativity', 'decisions', 'determination', 'flair', 'leadership', 'offTheBall', 'positioning', 'teamwork', 'vision', 'workRate'].forEach(attr => {
      const modifier = positionModifiers[attr as keyof typeof positionModifiers] || 1.0;
      attributes[attr] = this.generateAttribute(baseMin, baseMax, modifier, qualityModifier);
    });

    return attributes;
  }

  /**
   * Get position-specific attribute modifiers
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
    qualityModifier: number
  ): number {
    const baseValue = baseMin + Math.random() * (baseMax - baseMin);
    const modifiedValue = baseValue * positionModifier * qualityModifier;
    return Math.min(100, Math.max(1, Math.round(modifiedValue)));
  }

  /**
   * Generate youth hidden attributes
   */
  private generateYouthHiddenAttributes(): Record<string, number> {
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
  private calculateYouthCurrentAbility(
    attributes: Record<string, number>,
    age: number
  ): number {
    // Calculate average of all attributes
    const attrValues = Object.values(attributes);
    const avgAttribute = attrValues.reduce((sum, val) => sum + val, 0) / attrValues.length;

    // Adjust for age (younger players have lower current ability relative to potential)
    const ageFactor = 1 - ((21 - age) / 100); // At age 15: 0.6, at age 21: 1.0

    return Math.round(avgAttribute * ageFactor);
  }

  /**
   * Calculate youth player's potential ability
   */
  private calculateYouthPotentialAbility(
    attributes: Record<string, number>,
    hiddenAttributes: Record<string, number>,
    academy: YouthAcademy,
    club: Club,
    nationality: string
  ): number {
    // Calculate weighted average of attributes
    const attrValues = Object.values(attributes);
    const avgAttribute = attrValues.reduce((sum, val) => sum + val, 0) / attrValues.length;

    // Adjust for hidden attributes
    const proFactor = hiddenAttributes.professionalism / 100;
    const consistencyFactor = hiddenAttributes.consistency / 100;
    const ambitionFactor = hiddenAttributes.ambition / 100;
    const hiddenPotentialFactor = hiddenAttributes.hiddenPotential / 100;

    // Adjust for academy quality
    const academyFactor = academy.quality / 100;

    // Adjust for club reputation
    const clubFactor = club.reputation / 100;

    // Adjust for nation youth quality
    const nation = this.nations.get(nationality);
    const nationFactor = nation ? nation.youthQuality / 100 : 0.8;

    // Adjust for age (younger players have more potential to grow)
    // Age is not passed here, but we can assume an average age of 18
    const ageFactor = 1.0; // Placeholder

    // Calculate potential
    let potential = avgAttribute * 
                    proFactor * 
                    consistencyFactor * 
                    ambitionFactor * 
                    hiddenPotentialFactor * 
                    academyFactor * 
                    clubFactor * 
                    nationFactor * 
                    ageFactor;

    // Add some randomness
    potential *= 0.9 + Math.random() * 0.2;

    return Math.min(100, Math.round(potential));
  }

  /**
   * Get potential rating from potential ability
   */
  private getPotentialRating(potentialAbility: number): 'world_class' | 'elite' | 'great' | 'good' | 'decent' | 'limited' {
    if (potentialAbility >= 90) return 'world_class';
    if (potentialAbility >= 80) return 'elite';
    if (potentialAbility >= 70) return 'great';
    if (potentialAbility >= 60) return 'good';
    if (potentialAbility >= 50) return 'decent';
    return 'limited';
  }

  /**
   * Calculate peak age for a position
   */
  private calculatePeakAge(position: string): number {
    const peakAges: Record<string, number> = {
      GK: 30,
      CB: 29,
      RB: 28,
      LB: 28,
      CDM: 29,
      CM: 28,
      CAM: 27,
      RW: 26,
      LW: 26,
      ST: 27,
      DEFAULT: 28,
    };
    return peakAges[position] || peakAges.DEFAULT;
  }

  /**
   * Generate random appearance
   */
  private generateRandomAppearance(nationality: string): {
    skinTone: string;
    hairColor: string;
    hairStyle: string;
    facialHair: string;
    build: string;
  } {
    const skinTones = ['light', 'fair', 'medium', 'olive', 'brown', 'dark_brown', 'deep_dark'];
    const hairColors = ['black', 'brown', 'blonde', 'red', 'grey', 'white', 'bald'];
    const hairStyles = ['short', 'medium', 'long', 'buzz_cut', 'afro', 'dreadlocks', 'braids', 'mohawk'];
    const facialHairs = ['clean_shaven', 'stubble', 'goatee', 'full_beard', 'moustache'];
    const builds = ['slim', 'average', 'stocky', 'muscular', 'tall_slim', 'tall_muscular'];

    return {
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      facialHair: facialHairs[Math.floor(Math.random() * facialHairs.length)],
      build: builds[Math.floor(Math.random() * builds.length)],
    };
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

  // ============================================
  // YOUTH DEVELOPMENT METHODS
  // ============================================

  /**
   * Process youth player development for all clubs
   * @param date Current date
   */
  processYouthDevelopment(date: DateString): void {
    this.youthPlayers.forEach((youthPlayer, playerId) => {
      // Skip if player has graduated or been released
      if (youthPlayer.age >= YOUTH_GRADUATION_AGE) {
        this.graduateYouthPlayer(playerId, date);
        return;
      }

      // Apply development
      this.developYouthPlayer(youthPlayer, date);

      // Age the player
      youthPlayer.age++;
      youthPlayer.dateOfBirth = this.subtractYearsFromDate(date, youthPlayer.age);
    });
  }

  /**
   * Develop a youth player
   */
  private developYouthPlayer(youthPlayer: YouthPlayer, date: DateString): void {
    const club = this.clubs.get(youthPlayer.clubId);
    if (!club) return;

    const academy = this.youthAcademies.get(youthPlayer.clubId);
    if (!academy) return;

    // Get development plan
    const plan = this.developmentPlans.get(youthPlayer.id);

    // Calculate development for each attribute
    for (const [attribute, value] of Object.entries(youthPlayer.attributes)) {
      // Calculate improvement
      let improvement = youthPlayer.developmentRate * (1 + Math.random() * 0.2); // Base improvement

      // Apply academy quality modifier
      improvement *= academy.quality / 100;

      // Apply position modifier
      const positionModifiers = this.getPositionAttributeModifiers(youthPlayer.position);
      const positionModifier = positionModifiers[attribute] || 1.0;
      improvement *= positionModifier;

      // Apply hidden attribute modifiers
      improvement *= youthPlayer.hiddenAttributes.professionalism / 100;
      improvement *= youthPlayer.hiddenAttributes.consistency / 100;

      // Apply age modifier (younger players develop faster)
      const ageModifier = 1 + ((YOUTH_GRADUATION_AGE - youthPlayer.age) / 100);
      improvement *= ageModifier;

      // Apply random variation
      improvement *= 0.8 + Math.random() * 0.4;

      // Clamp improvement
      improvement = Math.max(0.01, Math.min(2.0, improvement));

      // Apply improvement
      youthPlayer.attributes[attribute] = Math.min(
        100,
        youthPlayer.attributes[attribute] + improvement
      );
    }

    // Recalculate current ability
    youthPlayer.currentAbility = this.calculateYouthCurrentAbility(
      youthPlayer.attributes,
      youthPlayer.age
    );

    // Occasionally improve potential
    if (Math.random() > 0.9) {
      const potentialIncrease = Math.min(
        100 - youthPlayer.potentialAbility,
        Math.floor(Math.random() * 3) + 1
      );
      youthPlayer.potentialAbility += potentialIncrease;
      youthPlayer.potentialRating = this.getPotentialRating(youthPlayer.potentialAbility);
    }

    // Update development plan progress if exists
    if (plan) {
      for (const [attribute, target] of Object.entries(plan.targetAttributes)) {
        const current = youthPlayer.attributes[attribute] || 0;
        plan.currentProgress[attribute] = Math.min(100, (current / target) * 100);
      }
      plan.lastUpdated = date;
      this.developmentPlans.set(youthPlayer.id, plan);
    }
  }

  /**
   * Graduate a youth player to senior team
   */
  private graduateYouthPlayer(playerId: EntityId, date: DateString): void {
    const youthPlayer = this.youthPlayers.get(playerId);
    if (!youthPlayer) return;

    const club = this.clubs.get(youthPlayer.clubId);
    if (!club) return;

    const academy = this.youthAcademies.get(youthPlayer.clubId);
    if (!academy) return;

    // Check if player meets graduation criteria
    const graduationProbability = YOUTH_GRADUATION_PROBABILITIES[youthPlayer.potentialRating];
    const willGraduate = Math.random() < graduationProbability;

    if (willGraduate) {
      // Create senior player from youth player
      const seniorPlayer: Player = {
        id: youthPlayer.id,
        firstName: youthPlayer.firstName,
        lastName: youthPlayer.lastName,
        nationality: youthPlayer.nationality,
        dateOfBirth: youthPlayer.dateOfBirth,
        age: youthPlayer.age,
        height: youthPlayer.height,
        weight: youthPlayer.weight,
        clubId: youthPlayer.clubId,
        position: youthPlayer.position,
        foot: youthPlayer.foot,
        attributes: youthPlayer.attributes,
        hiddenAttributes: youthPlayer.hiddenAttributes,
        currentAbility: youthPlayer.currentAbility,
        potentialAbility: youthPlayer.potentialAbility,
        reputation: 1,
        marketValue: youthPlayer.potentialAbility * 100000,
        wage: youthPlayer.contract.wage * 2, // Double youth wage for senior contract
        morale: 70,
        fatigue: 0,
        sharpness: 70,
        contract: {
          type: 'full_time',
          startDate: date,
          expiryDate: this.addYearsToDate(date, 3), // 3-year contract
          wage: youthPlayer.contract.wage * 2,
          signingBonus: 0,
          releaseClause: null,
        },
        injury: null,
        relationships: [],
        careerHistory: [{
          clubId: youthPlayer.clubId,
          startDate: date,
          endDate: null,
          appearances: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          averageRating: 0,
          trophies: [],
        }],
        appearance: youthPlayer.appearance,
      };

      // Add to senior players
      this.players.set(seniorPlayer.id, seniorPlayer);

      // Record graduation
      const graduation: YouthGraduation = {
        id: this.generateId(),
        playerId: youthPlayer.id,
        clubId: youthPlayer.clubId,
        date,
        newContract: seniorPlayer.contract,
        seniorAppearances: 0,
        seniorGoals: 0,
        seniorAssists: 0,
        successRating: 50,
      };

      if (!this.graduations.has(youthPlayer.clubId)) {
        this.graduations.set(youthPlayer.clubId, []);
      }
      this.graduations.get(youthPlayer.clubId)!.push(graduation);

      // Update academy stats
      academy.playersGraduated++;
      this.youthAcademies.set(youthPlayer.clubId, academy);
    } else {
      // Release the player (didn't make it)
      // In a real implementation, the player would be removed from the game
      // or added to the free agent pool
    }

    // Remove from youth players
    this.youthPlayers.delete(playerId);
  }

  /**
   * Force graduate a youth player
   */
  forceGraduateYouthPlayer(playerId: EntityId, date: DateString): Player | null {
    const youthPlayer = this.youthPlayers.get(playerId);
    if (!youthPlayer) return null;

    // Temporarily set age to trigger graduation
    youthPlayer.age = YOUTH_GRADUATION_AGE;
    this.graduateYouthPlayer(playerId, date);

    // Return the senior player if graduation was successful
    return this.players.get(playerId) || null;
  }

  /**
   * Create a development plan for a youth player
   */
  createDevelopmentPlan(
    playerId: EntityId,
    targetAttributes: Record<string, number>,
    primaryFocus: string[],
    secondaryFocus: string[]
  ): YouthDevelopmentPlan | null {
    const youthPlayer = this.youthPlayers.get(playerId);
    if (!youthPlayer) return null;

    const currentProgress: Record<string, number> = {};
    for (const [attribute, target] of Object.entries(targetAttributes)) {
      const current = youthPlayer.attributes[attribute] || 0;
      currentProgress[attribute] = Math.min(100, (current / target) * 100);
    }

    const plan: YouthDevelopmentPlan = {
      id: this.generateId(),
      playerId,
      clubId: youthPlayer.clubId,
      targetAttributes,
      targetPotential: youthPlayer.potentialAbility,
      primaryFocus,
      secondaryFocus,
      currentProgress,
      lastUpdated: this.getCurrentDate(),
      mentorId: null,
      notes: '',
    };

    this.developmentPlans.set(playerId, plan);
    return plan;
  }

  /**
   * Set a mentor for a youth player
   */
  setMentor(playerId: EntityId, mentorId: EntityId): boolean {
    const plan = this.developmentPlans.get(playerId);
    if (!plan) return false;

    plan.mentorId = mentorId;
    this.developmentPlans.set(playerId, plan);
    return true;
  }

  // ============================================
  // YOUTH ACADEMY METHODS
  // ============================================

  /**
   * Get youth academy for a club
   */
  getYouthAcademy(clubId: EntityId): YouthAcademy | null {
    return this.youthAcademies.get(clubId) || null;
  }

  /**
   * Upgrade youth academy
   */
  upgradeYouthAcademy(
    clubId: EntityId,
    upgradeType: 'facilities' | 'coaching' | 'scouting' | 'accommodation' | 'medical',
    club: Club
  ): YouthAcademyUpgrade | null {
    const academy = this.youthAcademies.get(clubId);
    if (!academy) return null;

    // Check current level
    let currentLevel = 1;
    switch (upgradeType) {
      case 'facilities':
        currentLevel = academy.trainingFacilities;
        break;
      case 'coaching':
        // Count coaches to estimate level
        currentLevel = Math.min(5, Math.floor(academy.coaches.length / 2) + 1);
        break;
      case 'scouting':
        currentLevel = Math.min(5, academy.scouts.length + 1);
        break;
      case 'accommodation':
        currentLevel = academy.accommodation;
        break;
      case 'medical':
        currentLevel = academy.medicalFacilities;
        break;
    }

    // Check if already at max level
    if (currentLevel >= 5) return null;

    // Calculate cost
    const costs = YOUTH_ACADEMY_UPGRADE_COSTS[upgradeType];
    const cost = costs[currentLevel];

    // Check if club can afford it
    if (club.balance < cost) return null;

    // Deduct cost from club
    club.balance -= cost;
    this.clubs.set(club.id, club);

    // Apply upgrade
    const newLevel = currentLevel + 1;
    const upgrade: YouthAcademyUpgrade = {
      id: this.generateId(),
      clubId,
      upgradeType,
      oldLevel: currentLevel,
      newLevel,
      cost,
      date: this.getCurrentDate(),
      completed: true,
    };

    // Update academy
    switch (upgradeType) {
      case 'facilities':
        academy.trainingFacilities = newLevel;
        break;
      case 'coaching':
        // Add more coaches
        this.addYouthCoach(this.generateRandomCoach(clubId));
        break;
      case 'scouting':
        // Add more scouts
        this.addYouthScout(this.generateRandomScout(clubId));
        break;
      case 'accommodation':
        academy.accommodation = newLevel;
        break;
      case 'medical':
        academy.medicalFacilities = newLevel;
        break;
    }

    // Recalculate academy quality and reputation
    academy.quality = this.calculateAcademyQuality(academy);
    academy.reputation = Math.min(100, academy.quality + 10);

    this.youthAcademies.set(clubId, academy);

    return upgrade;
  }

  /**
   * Calculate academy quality
   */
  private calculateAcademyQuality(academy: YouthAcademy): number {
    // Base quality from facilities
    let quality = academy.trainingFacilities * 20;

    // Add coaching quality
    const avgCoachingAbility = academy.coaches.length > 0
      ? academy.coaches.reduce((sum, coach) => sum + coach.coachingAbility, 0) / academy.coaches.length
      : 0;
    quality += avgCoachingAbility * 0.4;

    // Add scouting quality
    const avgScoutingAbility = academy.scouts.length > 0
      ? academy.scouts.reduce((sum, scout) => sum + scout.judgingAbility, 0) / academy.scouts.length
      : 0;
    quality += avgScoutingAbility * 0.2;

    // Add medical facilities
    quality += academy.medicalFacilities * 5;

    // Add accommodation
    quality += academy.accommodation * 5;

    // Clamp to 0-100
    return Math.min(100, Math.max(0, Math.round(quality)));
  }

  // ============================================
  // YOUTH COACH AND SCOUT METHODS
  // ============================================

  /**
   * Add a youth coach
   */
  addYouthCoach(coach: YouthCoach): void {
    if (!this.youthCoaches.has(coach.clubId)) {
      this.youthCoaches.set(coach.clubId, []);
    }
    this.youthCoaches.get(coach.clubId)!.push(coach);

    // Update academy
    const academy = this.youthAcademies.get(coach.clubId);
    if (academy) {
      academy.coaches.push(coach);
      academy.quality = this.calculateAcademyQuality(academy);
      this.youthAcademies.set(coach.clubId, academy);
    }
  }

  /**
   * Remove a youth coach
   */
  removeYouthCoach(coachId: EntityId, clubId: EntityId): void {
    const coaches = this.youthCoaches.get(clubId);
    if (coaches) {
      this.youthCoaches.set(
        clubId,
        coaches.filter(c => c.id !== coachId)
      );

      // Update academy
      const academy = this.youthAcademies.get(clubId);
      if (academy) {
        academy.coaches = academy.coaches.filter(c => c.id !== coachId);
        academy.quality = this.calculateAcademyQuality(academy);
        this.youthAcademies.set(clubId, academy);
      }
    }
  }

  /**
   * Add a youth scout
   */
  addYouthScout(scout: YouthScout): void {
    if (!this.youthScouts.has(scout.clubId)) {
      this.youthScouts.set(scout.clubId, []);
    }
    this.youthScouts.get(scout.clubId)!.push(scout);

    // Update academy
    const academy = this.youthAcademies.get(scout.clubId);
    if (academy) {
      academy.scouts.push(scout);
      academy.quality = this.calculateAcademyQuality(academy);
      this.youthAcademies.set(scout.clubId, academy);
    }
  }

  /**
   * Remove a youth scout
   */
  removeYouthScout(scoutId: EntityId, clubId: EntityId): void {
    const scouts = this.youthScouts.get(clubId);
    if (scouts) {
      this.youthScouts.set(
        clubId,
        scouts.filter(s => s.id !== scoutId)
      );

      // Update academy
      const academy = this.youthAcademies.get(clubId);
      if (academy) {
        academy.scouts = academy.scouts.filter(s => s.id !== scoutId);
        academy.quality = this.calculateAcademyQuality(academy);
        this.youthAcademies.set(clubId, academy);
      }
    }
  }

  /**
   * Generate a random youth coach
   */
  private generateRandomCoach(clubId: EntityId): YouthCoach {
    const id = this.generateId();
    const nation = this.clubs.get(clubId)?.nationCode || 'ENG';
    const { firstName, lastName } = this.generateRandomName(nation);
    const age = 30 + Math.floor(Math.random() * 30); // 30-60 years old
    const coachingAbility = 50 + Math.floor(Math.random() * 50); // 50-100
    const judgingPotential = 50 + Math.floor(Math.random() * 50);
    const manManagement = 50 + Math.floor(Math.random() * 50);
    const technicalKnowledge = 50 + Math.floor(Math.random() * 50);
    const mentalKnowledge = 50 + Math.floor(Math.random() * 50);
    const salary = YOUTH_COACH_SALARIES[Math.min(100, Math.max(50, coachingAbility))];

    // Generate preferred positions
    const positions = Object.keys(YOUTH_POSITION_DISTRIBUTION);
    const preferredPositions: string[] = [];
    for (let i = 0; i < 3; i++) {
      preferredPositions.push(positions[Math.floor(Math.random() * positions.length)]);
    }

    return {
      id,
      name: `${firstName} ${lastName}`,
      nationality: nation,
      age,
      coachingAbility,
      judgingPotential,
      manManagement,
      technicalKnowledge,
      mentalKnowledge,
      preferredPositions,
      clubId,
      startDate: this.getCurrentDate(),
      salary,
      reputation: coachingAbility,
    };
  }

  /**
   * Generate a random youth scout
   */
  private generateRandomScout(clubId: EntityId): YouthScout {
    const id = this.generateId();
    const nation = this.clubs.get(clubId)?.nationCode || 'ENG';
    const { firstName, lastName } = this.generateRandomName(nation);
    const age = 25 + Math.floor(Math.random() * 30); // 25-55 years old
    const judgingAbility = 50 + Math.floor(Math.random() * 50); // 50-100
    const judgingPotential = 50 + Math.floor(Math.random() * 50);
    const knowledge = 50 + Math.floor(Math.random() * 50);
    const salary = YOUTH_SCOUT_SALARIES[Math.min(100, Math.max(50, judgingAbility))];

    // Generate preferred regions
    const regions = ['Africa', 'South America', 'Europe', 'Asia', 'North America'];
    const preferredRegions: string[] = [];
    for (let i = 0; i < 2; i++) {
      preferredRegions.push(regions[Math.floor(Math.random() * regions.length)]);
    }

    return {
      id,
      name: `${firstName} ${lastName}`,
      nationality: nation,
      age,
      judgingAbility,
      judgingPotential,
      knowledge,
      preferredRegions,
      clubId,
      startDate: this.getCurrentDate(),
      salary,
      reputation: judgingAbility,
    };
  }

  // ============================================
  // YOUTH SCOUTING METHODS
  // ============================================

  /**
   * Create a youth scouting report
   */
  createScoutingReport(
    scoutId: EntityId,
    playerId: EntityId,
    clubId: EntityId
  ): YouthScoutingReport | null {
    const scout = this.getYouthScout(scoutId, clubId);
    if (!scout) return null;

    const youthPlayer = this.youthPlayers.get(playerId);
    if (!youthPlayer) return null;

    // Calculate accuracy based on scout's ability
    const accuracy = scout.judgingAbility / 100;

    // Generate ratings with some inaccuracy
    const attributeRatings: Record<string, { rating: number; confidence: number }> = {};
    for (const [attribute, value] of Object.entries(youthPlayer.attributes)) {
      // Add random error based on accuracy
      const error = (1 - accuracy) * 20; // Max 20 points error at 0% accuracy
      const ratedValue = Math.min(
        100,
        Math.max(
          1,
          value + (Math.random() * error * 2 - error)
        )
      );
      
      attributeRatings[attribute] = {
        rating: Math.round(ratedValue),
        confidence: Math.round(scout.judgingAbility * (0.5 + Math.random() * 0.5)),
      };
    }

    // Calculate overall potential with inaccuracy
    const potentialError = (1 - accuracy) * 15;
    const ratedPotential = Math.min(
      100,
      Math.max(
        1,
        youthPlayer.potentialAbility + (Math.random() * potentialError * 2 - potentialError)
      )
    );

    // Determine recommended action
    let recommendedAction: 'sign' | 'monitor' | 'reject' | 'trial' = 'monitor';
    if (ratedPotential >= 80) {
      recommendedAction = 'sign';
    } else if (ratedPotential >= 65) {
      recommendedAction = 'trial';
    } else if (ratedPotential < 50) {
      recommendedAction = 'reject';
    }

    const report: YouthScoutingReport = {
      id: this.generateId(),
      scoutId,
      playerId,
      clubId,
      reportDate: this.getCurrentDate(),
      currentAbility: Math.round(youthPlayer.currentAbility * (0.8 + Math.random() * 0.4)),
      potentialAbility: Math.round(ratedPotential),
      confidence: Math.round(scout.judgingAbility * 0.8),
      attributeRatings,
      recommendedAction,
      notes: `Scouted by ${scout.name}. Potential: ${ratedPotential}/100.`,
      followUpDate: null,
      followUpNotes: '',
    };

    if (!this.scoutingReports.has(clubId)) {
      this.scoutingReports.set(clubId, []);
    }
    this.scoutingReports.get(clubId)!.push(report);

    return report;
  }

  /**
   * Get a youth scout
   */
  private getYouthScout(scoutId: EntityId, clubId: EntityId): YouthScout | null {
    const scouts = this.youthScouts.get(clubId);
    if (!scouts) return null;
    return scouts.find(s => s.id === scoutId) || null;
  }

  /**
   * Get scouting reports for a club
   */
  getScoutingReports(clubId: EntityId): YouthScoutingReport[] {
    return this.scoutingReports.get(clubId) || [];
  }

  // ============================================
  // GETTERS AND SETTERS
  // ============================================

  /**
   * Get youth intake for a club
   */
  getYouthIntakes(clubId: EntityId): YouthIntake[] {
    return this.youthIntakes.get(clubId) || [];
  }

  /**
   * Get all youth players for a club
   */
  getClubYouthPlayers(clubId: EntityId): YouthPlayer[] {
    const players: YouthPlayer[] = [];
    this.youthPlayers.forEach(player => {
      if (player.clubId === clubId) {
        players.push(player);
      }
    });
    return players;
  }

  /**
   * Get a specific youth player
   */
  getYouthPlayer(playerId: EntityId): YouthPlayer | null {
    return this.youthPlayers.get(playerId) || null;
  }

  /**
   * Get development plan for a youth player
   */
  getDevelopmentPlan(playerId: EntityId): YouthDevelopmentPlan | null {
    return this.developmentPlans.get(playerId) || null;
  }

  /**
   * Get graduations for a club
   */
  getGraduations(clubId: EntityId): YouthGraduation[] {
    return this.graduations.get(clubId) || [];
  }

  /**
   * Get youth coaches for a club
   */
  getYouthCoaches(clubId: EntityId): YouthCoach[] {
    return this.youthCoaches.get(clubId) || [];
  }

  /**
   * Get youth scouts for a club
   */
  getYouthScouts(clubId: EntityId): YouthScout[] {
    return this.youthScouts.get(clubId) || [];
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
    this.youthAcademies.set(club.id, this.createYouthAcademy(club));
    this.intakeSchedules.set(club.id, this.createIntakeSchedule(club));
  }

  /**
   * Remove a club
   */
  removeClub(clubId: EntityId): void {
    this.clubs.delete(clubId);
    this.youthAcademies.delete(clubId);
    this.youthIntakes.delete(clubId);
    this.youthCoaches.delete(clubId);
    this.youthScouts.delete(clubId);
    this.scoutingReports.delete(clubId);
    this.intakeSchedules.delete(clubId);
    this.graduations.delete(clubId);

    // Remove youth players from this club
    this.youthPlayers.forEach((player, playerId) => {
      if (player.clubId === clubId) {
        this.youthPlayers.delete(playerId);
        this.developmentPlans.delete(playerId);
      }
    });
  }

  /**
   * Add a nation
   */
  addNation(nation: Nation): void {
    this.nations.set(nation.code, nation);
  }

  /**
   * Add a player (senior player)
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
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
   * Add years to a date
   */
  private addYearsToDate(date: DateString, years: number): DateString {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split('T')[0];
  }

  /**
   * Subtract years from a date
   */
  private subtractYearsFromDate(date: DateString, years: number): DateString {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().split('T')[0];
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
    this.clubs.clear();
    this.nations.clear();
    this.players.clear();
    this.youthAcademies.clear();
    this.youthIntakes.clear();
    this.youthPlayers.clear();
    this.developmentPlans.clear();
    this.graduations.clear();
    this.youthCoaches.clear();
    this.youthScouts.clear();
    this.scoutingReports.clear();
    this.intakeSchedules.clear();
  }
}
