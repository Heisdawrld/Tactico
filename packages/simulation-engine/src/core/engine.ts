// TACTICO Simulation Engine — Intelligent Match Simulation
// Version 2.0: Attribute-based AI, tactical DNA influence, match phases

// Matter.js is optional — only available in browser context.
// Server-side simulation works without physics rendering.
let Matter: any = null;
try {
  // Dynamic import — won't crash in Node.js
  if (typeof window !== 'undefined') {
    Matter = require('matter-js');
  }
} catch {
  // Running on server — physics disabled, simulation still works
}

import {
  MatchState,
  MatchEvent,
  MatchStats,
  SimulationConfig,
  SimulationState,
  TeamInstructions,
  TacticalDNA,
  PlayerRole,
  Coordinates,
  AIDecision,
  AIPlayerState,
  AITeamState,
  Player,
  Club,
} from './types';
import {
  MATCH_CONSTANTS,
  WEATHER_EFFECTS,
  POSITION_MODIFIERS,
  TACTICAL_STYLE_MODIFIERS,
} from './constants';

// ============================================================
// MATCH PHASE SYSTEM
// ============================================================

type MatchPhase = 
  | 'kickoff'
  | 'build_up'
  | 'transition'
  | 'chance_creation'
  | 'shot'
  | 'set_piece'
  | 'dead_ball'
  | 'half_time'
  | 'full_time';

interface PhaseState {
  phase: MatchPhase;
  possessionTeam: number | null;
  ballCarrier: number | null;
  lastPasser: number | null;
  pressureLevel: number; // 0-100
  dangerLevel: number; // 0-100, distance to goal
  phaseTimer: number; // seconds in current phase
}

// ============================================================
// PLAYER ATTRIBUTE MAPPING
// ============================================================

interface PlayerAttributes {
  passing: number;
  shooting: number;
  dribbling: number;
  ballControl: number;
  firstTouch: number;
  heading: number;
  crossing: number;
  finishing: number;
  longShots: number;
  setPieces: number;
  penaltyTaking: number;
  pace: number;
  acceleration: number;
  agility: number;
  balance: number;
  strength: number;
  stamina: number;
  jumpingReach: number;
  aggression: number;
  anticipation: number;
  composure: number;
  concentration: number;
  creativity: number;
  decisions: number;
  determination: number;
  flair: number;
  leadership: number;
  offTheBall: number;
  positioning: number;
  teamwork: number;
  vision: number;
  workRate: number;
}

function mapPlayerToAttributes(player: Player): PlayerAttributes {
  return {
    passing: player.passing || Math.round(player.passing || (player.overallRating - 10 + Math.random() * 20)),
    shooting: player.shooting || Math.round(player.shooting || (player.overallRating - 15 + Math.random() * 25)),
    dribbling: player.dribbling || Math.round(player.dribbling || (player.overallRating - 10 + Math.random() * 20)),
    ballControl: player.dribbling || Math.round(player.dribbling || (player.overallRating - 5 + Math.random() * 10)),
    firstTouch: player.dribbling || Math.round(player.dribbling || (player.overallRating - 8 + Math.random() * 16)),
    heading: player.defending || Math.round(player.defending || (player.overallRating - 15 + Math.random() * 25)),
    crossing: player.passing || Math.round(player.passing || (player.overallRating - 12 + Math.random() * 24)),
    finishing: player.shooting || Math.round(player.shooting || (player.overallRating - 10 + Math.random() * 20)),
    longShots: player.shooting || Math.round(player.shooting || (player.overallRating - 15 + Math.random() * 25)),
    setPieces: player.passing || Math.round(player.passing || (player.overallRating - 10 + Math.random() * 20)),
    penaltyTaking: player.shooting || Math.round(player.shooting || (player.overallRating - 10 + Math.random() * 20)),
    pace: player.pace || Math.round(player.pace || (player.overallRating - 15 + Math.random() * 25)),
    acceleration: player.pace || Math.round(player.pace || (player.overallRating - 12 + Math.random() * 24)),
    agility: player.dribbling || Math.round(player.dribbling || (player.overallRating - 10 + Math.random() * 20)),
    balance: player.physicality || Math.round(player.physicality || (player.overallRating - 12 + Math.random() * 24)),
    strength: player.physicality || Math.round(player.physicality || (player.overallRating - 10 + Math.random() * 20)),
    stamina: player.physicality || Math.round(player.physicality || (player.overallRating - 8 + Math.random() * 16)),
    jumpingReach: player.physicality || Math.round(player.physicality || (player.overallRating - 12 + Math.random() * 24)),
    aggression: player.defending || Math.round(player.defending || (player.overallRating - 15 + Math.random() * 25)),
    anticipation: player.defending || Math.round(player.defending || (player.overallRating - 10 + Math.random() * 20)),
    composure: player.overallRating,
    concentration: player.overallRating,
    creativity: player.passing || Math.round(player.passing || (player.overallRating - 5 + Math.random() * 10)),
    decisions: player.overallRating,
    determination: player.overallRating,
    flair: player.dribbling || Math.round(player.dribbling || (player.overallRating - 10 + Math.random() * 20)),
    leadership: player.overallRating,
    offTheBall: player.overallRating,
    positioning: player.defending || Math.round(player.defending || (player.overallRating - 8 + Math.random() * 16)),
    teamwork: player.passing || Math.round(player.passing || (player.overallRating - 5 + Math.random() * 10)),
    vision: player.passing || Math.round(player.passing || (player.overallRating - 8 + Math.random() * 16)),
    workRate: player.physicality || Math.round(player.physicality || (player.overallRating - 10 + Math.random() * 20)),
  };
}

// ============================================================
// DECISION PROBABILITY ENGINE
// ============================================================

interface DecisionContext {
  player: AIPlayerState;
  attributes: PlayerAttributes;
  teamState: AITeamState;
  opponentState: AITeamState;
  phase: PhaseState;
  weather: WeatherEffect;
  matchTime: number; // seconds
  scoreDiff: number; // positive = winning
  fatigue: number; // 0-100
}

interface WeatherEffect {
  ballSpeedModifier: number;
  passAccuracyModifier: number;
  shotAccuracyModifier: number;
  playerSpeedModifier: number;
  staminaDrainModifier: number;
  injuryRateModifier: number;
  slipChance: number;
}

interface DecisionProbability {
  type: AIDecisionType;
  probability: number;
  expectedValue: number;
  risk: number; // 0-1
}

function calculatePassProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase, weather, fatigue } = ctx;

  // Base probability from player passing skill
  let baseProb = attributes.passing / 100;

  // Pressure modifier (more pressure = harder to pass)
  const pressureMod = 1 - (phase.pressureLevel / 200); // 0.5 at max pressure

  // Fatigue modifier
  const fatigueMod = 1 - (fatigue / 200); // 0.5 at max fatigue

  // Weather modifier
  const weatherMod = weather.passAccuracyModifier;

  // Tactical modifier (short passing teams are better at passing)
  const tacticalMod = 0.7 + (teamState.tacticalDNA.possession / 100) * 0.3;

  // Position modifier
  const posMod = POSITION_MODIFIERS[player.position]?.passWeight || 0.4;

  const finalProb = baseProb * pressureMod * fatigueMod * weatherMod * tacticalMod;

  // Expected value: high for possession teams, lower for direct teams
  const expectedValue = teamState.tacticalDNA.possession > 60 ? 0.8 : 0.5;

  // Risk: low for short passes, higher for long passes
  const risk = phase.pressureLevel > 70 ? 0.6 : 0.2;

  return {
    type: 'pass',
    probability: finalProb * posMod,
    expectedValue,
    risk,
  };
}

function calculateShootProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase, weather, fatigue, scoreDiff } = ctx;

  // Only shoot if in dangerous area
  if (phase.dangerLevel < 30) {
    return { type: 'shoot', probability: 0, expectedValue: 0, risk: 1 };
  }

  let baseProb = attributes.shooting / 100;

  // Distance to goal (dangerLevel is inverse distance)
  const distanceMod = phase.dangerLevel / 100;

  // Composure under pressure
  const composureMod = attributes.composure / 100;

  // Fatigue
  const fatigueMod = 1 - (fatigue / 150);

  // Weather
  const weatherMod = weather.shotAccuracyModifier;

  // Tactical: direct teams shoot more, possession teams pass more
  const tacticalMod = 0.5 + (teamState.tacticalDNA.directness / 100) * 0.5;

  // Desperation modifier (losing = shoot more)
  const desperationMod = scoreDiff < 0 ? 1.2 : scoreDiff > 2 ? 0.7 : 1.0;

  const posMod = POSITION_MODIFIERS[player.position]?.shootWeight || 0.1;

  const finalProb = baseProb * distanceMod * composureMod * fatigueMod * weatherMod * tacticalMod * desperationMod;

  // xG estimation for expected value
  const xg = calculateXG(phase.dangerLevel, attributes.finishing, weather);

  return {
    type: 'shoot',
    probability: finalProb * posMod,
    expectedValue: xg,
    risk: 0.7, // Shooting always risks losing possession
  };
}

function calculateDribbleProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase, weather, fatigue } = ctx;

  let baseProb = attributes.dribbling / 100;

  // Agility and balance
  const agilityMod = (attributes.agility + attributes.balance) / 200;

  // Pressure (harder to dribble under pressure)
  const pressureMod = 1 - (phase.pressureLevel / 150);

  // Fatigue
  const fatigueMod = 1 - (fatigue / 120);

  // Weather (slippery = harder to dribble)
  const weatherMod = 1 - weather.slipChance;

  // Tactical: creative teams dribble more
  const tacticalMod = 0.6 + (teamState.tacticalDNA.creativity / 100) * 0.4;

  const posMod = POSITION_MODIFIERS[player.position]?.dribbleWeight || 0.2;

  const finalProb = baseProb * agilityMod * pressureMod * fatigueMod * weatherMod * tacticalMod;

  return {
    type: 'dribble',
    probability: finalProb * posMod,
    expectedValue: 0.4, // Can create space
    risk: 0.5, // Risk of being tackled
  };
}

function calculateTackleProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase, weather, fatigue } = ctx;

  // Only tackle if opponent has ball
  if (phase.possessionTeam === player.teamId) {
    return { type: 'tackle', probability: 0, expectedValue: 0, risk: 1 };
  }

  let baseProb = (attributes.tackling || attributes.defending) / 100;

  // Positioning and anticipation
  const posMod = (attributes.positioning + attributes.anticipation) / 200;

  // Aggression
  const aggroMod = attributes.aggression / 100;

  // Fatigue
  const fatigueMod = 1 - (fatigue / 100);

  // Weather (slippery = harder to tackle)
  const weatherMod = 1 - (weather.slipChance * 0.5);

  // Tactical: high press teams tackle more
  const tacticalMod = 0.5 + (teamState.tacticalDNA.pressing / 100) * 0.5;

  const positionMod = POSITION_MODIFIERS[player.position]?.tackleWeight || 0.2;

  const finalProb = baseProb * posMod * aggroMod * fatigueMod * weatherMod * tacticalMod;

  return {
    type: 'tackle',
    probability: finalProb * positionMod,
    expectedValue: 0.7, // Winning ball back is valuable
    risk: 0.4, // Risk of foul or being beaten
  };
}

function calculatePressProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase, fatigue } = ctx;

  // Only press if opponent has ball and team presses high
  if (phase.possessionTeam === player.teamId || teamState.tacticalDNA.pressing < 40) {
    return { type: 'press', probability: 0, expectedValue: 0, risk: 1 };
  }

  let baseProb = attributes.workRate / 100;

  // Stamina check (can't press if exhausted)
  const staminaMod = player.stamina > 30 ? 1 : player.stamina / 30;

  // Team pressing intensity
  const pressMod = teamState.tacticalDNA.pressing / 100;

  // Fatigue
  const fatigueMod = 1 - (fatigue / 100);

  const finalProb = baseProb * staminaMod * pressMod * fatigueMod;

  return {
    type: 'press',
    probability: finalProb * 0.5,
    expectedValue: 0.5,
    risk: 0.3, // Risk of being bypassed
  };
}

function calculateInterceptProbability(ctx: DecisionContext): DecisionProbability {
  const { player, attributes, teamState, phase } = ctx;

  // Only intercept if opponent is passing
  if (phase.possessionTeam === player.teamId) {
    return { type: 'intercept', probability: 0, expectedValue: 0, risk: 1 };
  }

  let baseProb = (attributes.anticipation + attributes.positioning) / 200;

  // Vision (reading the game)
  const visionMod = attributes.vision / 100;

  // Tactical: high press teams intercept more
  const tacticalMod = 0.6 + (teamState.tacticalDNA.pressing / 100) * 0.4;

  const posMod = POSITION_MODIFIERS[player.position]?.interceptWeight || 0.1;

  const finalProb = baseProb * visionMod * tacticalMod;

  return {
    type: 'intercept',
    probability: finalProb * posMod,
    expectedValue: 0.8, // Intercepting is very valuable
    risk: 0.2,
  };
}

function calculateXG(dangerLevel: number, finishing: number, weather: WeatherEffect): number {
  // Base xG from danger level (distance to goal)
  const baseXG = dangerLevel / 100 * 0.4; // Max 0.4 from position

  // Finishing modifier
  const finishMod = finishing / 100;

  // Weather modifier
  const weatherMod = weather.shotAccuracyModifier;

  return Math.min(0.95, baseXG * finishMod * weatherMod);
}

// ============================================================
// DECISION ENGINE
// ============================================================

function selectBestDecision(ctx: DecisionContext): AIDecision | null {
  const probabilities: DecisionProbability[] = [
    calculatePassProbability(ctx),
    calculateShootProbability(ctx),
    calculateDribbleProbability(ctx),
    calculateTackleProbability(ctx),
    calculatePressProbability(ctx),
    calculateInterceptProbability(ctx),
  ];

  // Filter out impossible decisions
  const valid = probabilities.filter(p => p.probability > 0.05);
  if (valid.length === 0) return null;

  // Score each decision: expectedValue * probability / risk
  const scored = valid.map(p => ({
    ...p,
    score: (p.expectedValue * p.probability) / (p.risk + 0.1),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Pick top decision with some randomness (decisions attribute affects consistency)
  const topChoice = scored[0];
  const consistency = ctx.attributes.decisions / 100;

  // Higher decisions = more likely to pick best choice
  if (Math.random() < consistency) {
    return createDecision(ctx, topChoice);
  } else {
    // Pick from top 3 with weighted random
    const top3 = scored.slice(0, Math.min(3, scored.length));
    const totalWeight = top3.reduce((sum, d) => sum + d.score, 0);
    let roll = Math.random() * totalWeight;
    for (const decision of top3) {
      roll -= decision.score;
      if (roll <= 0) return createDecision(ctx, decision);
    }
    return createDecision(ctx, top3[0]);
  }
}

function createDecision(ctx: DecisionContext, prob: DecisionProbability): AIDecision {
  const { player, teamState } = ctx;

  let target: number | Coordinates | undefined;

  if (prob.type === 'pass') {
    // Find best passing target based on vision and teamwork
    target = findBestPassTarget(ctx);
  } else if (prob.type === 'shoot') {
    // Target is the goal
    target = { x: 1.0, y: 0.5 }; // Goal center
  } else if (prob.type === 'dribble') {
    // Target is space ahead
    target = findDribbleTarget(ctx);
  }

  return {
    type: prob.type,
    playerId: player.playerId,
    teamId: player.teamId,
    confidence: prob.probability * 100,
    target,
    timestamp: ctx.matchTime,
  };
}

function findBestPassTarget(ctx: DecisionContext): number | Coordinates {
  // Simplified: return a teammate ID or coordinates
  // In full implementation, this would analyze positions, pressure, and passing lanes
  const teammates = ctx.teamState.playerStates.filter(p => p.playerId !== ctx.player.playerId && !p.isInjured && !p.isSentOff);
  if (teammates.length === 0) return { x: 0.5, y: 0.5 };

  // Pick teammate with best position (simplified)
  const best = teammates[Math.floor(Math.random() * teammates.length)];
  return best.playerId;
}

function findDribbleTarget(ctx: DecisionContext): Coordinates {
  // Move toward goal
  const isHome = ctx.teamState.teamId === 1; // Simplified
  const direction = isHome ? 1 : -1;
  return {
    x: 0.5 + direction * 0.2,
    y: 0.5 + (Math.random() - 0.5) * 0.3,
  };
}

// ============================================================
// MATCH PHASE TRANSITIONS
// ============================================================

function updatePhaseState(
  phase: PhaseState,
  lastEvent: MatchEvent | null,
  homeTeam: AITeamState,
  awayTeam: AITeamState,
  time: number,
): PhaseState {
  const newPhase = { ...phase, phaseTimer: phase.phaseTimer + 1 };

  // Phase transitions based on events
  if (lastEvent) {
    switch (lastEvent.type) {
      case 'pass':
        if (lastEvent.success) {
          newPhase.phase = 'build_up';
          newPhase.dangerLevel = calculateDangerLevel(lastEvent.to);
        } else {
          newPhase.phase = 'transition';
          newPhase.possessionTeam = newPhase.possessionTeam === homeTeam.teamId ? awayTeam.teamId : homeTeam.teamId;
        }
        break;
      case 'shot':
        if (lastEvent.target === 'goal') {
          newPhase.phase = 'dead_ball';
          newPhase.possessionTeam = null;
        } else if (lastEvent.target === 'saved' || lastEvent.target === 'off_target') {
          newPhase.phase = 'dead_ball';
          newPhase.possessionTeam = newPhase.possessionTeam === homeTeam.teamId ? awayTeam.teamId : homeTeam.teamId;
        }
        break;
      case 'tackle':
        if (lastEvent.success) {
          newPhase.phase = 'transition';
          newPhase.possessionTeam = lastEvent.tacklerTeamId;
        }
        break;
      case 'foul':
        if (lastEvent.inBox && lastEvent.card === 'red') {
          newPhase.phase = 'set_piece';
        } else {
          newPhase.phase = 'dead_ball';
        }
        break;
      case 'set_piece':
        newPhase.phase = 'build_up';
        break;
    }
  }

  // Auto-transitions
  if (newPhase.phase === 'build_up' && newPhase.phaseTimer > 15) {
    // Too long in build-up, force a decision
    newPhase.pressureLevel = Math.min(100, newPhase.pressureLevel + 5);
  }

  if (newPhase.phase === 'transition' && newPhase.phaseTimer > 5) {
    newPhase.phase = 'build_up';
    newPhase.phaseTimer = 0;
  }

  if (newPhase.phase === 'dead_ball' && newPhase.phaseTimer > 3) {
    newPhase.phase = 'build_up';
    newPhase.phaseTimer = 0;
  }

  return newPhase;
}

function calculateDangerLevel(position: Coordinates): number {
  // Distance to goal (assuming goal is at x=1)
  const distanceToGoal = 1 - position.x;
  const centerDistance = Math.abs(position.y - 0.5);

  // Danger is higher closer to goal and more central
  const danger = (1 - distanceToGoal) * (1 - centerDistance * 0.5) * 100;
  return Math.min(100, Math.max(0, danger));
}

// ============================================================
// MAIN SIMULATION ENGINE CLASS
// ============================================================

export class SimulationEngine {
  private config: SimulationConfig;
  private state: SimulationState;
  private physicsEngine: Matter.Engine | null = null;
  private physicsBodies: Matter.Body[] = [];
  private aiTeams: Map<number, AITeamState> = new Map();
  private playerAttributes: Map<number, PlayerAttributes> = new Map();
  private decisionQueue: AIDecision[] = [];
  private eventQueue: MatchEvent[] = [];
  private phaseState: PhaseState;
  private animationFrame: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private homeSquad: Player[] = [];
  private awaySquad: Player[] = [];
  private weather: WeatherEffect = WEATHER_EFFECTS.clear;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      tickRate: 16,
      matchSpeed: 'normal',
      detailLevel: 'standard',
      enablePhysics: true,
      enableCommentary: true,
      enableStats: true,
      ...config,
    };

    this.state = {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      totalTime: MATCH_CONSTANTS.MATCH_DURATION,
      events: [],
      stats: this.createInitialStats(),
    };

    this.phaseState = {
      phase: 'kickoff',
      possessionTeam: null,
      ballCarrier: null,
      lastPasser: null,
      pressureLevel: 50,
      dangerLevel: 0,
      phaseTimer: 0,
    };

    if (this.config.enablePhysics && Matter) {
      this.physicsEngine = Matter.Engine.create();
      this.setupPhysicsWorld();
    }
  }

  private createInitialStats(): MatchStats {
    return {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0, onTarget: { home: 0, away: 0 } },
      passes: {
        home: { completed: 0, attempted: 0, accuracy: 0 },
        away: { completed: 0, attempted: 0, accuracy: 0 },
      },
      tackles: {
        home: { won: 0, attempted: 0, successRate: 0 },
        away: { won: 0, attempted: 0, successRate: 0 },
      },
      fouls: { home: 0, away: 0 },
      cards: { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } },
      corners: { home: 0, away: 0 },
      offsides: { home: 0, away: 0 },
      xg: { home: 0, away: 0 },
    };
  }

  private setupPhysicsWorld(): void {
    if (!this.physicsEngine) return;

    const ground = Matter.Bodies.rectangle(
      MATCH_CONSTANTS.PITCH_WIDTH / 2,
      MATCH_CONSTANTS.PITCH_HEIGHT + 1,
      MATCH_CONSTANTS.PITCH_WIDTH * 2,
      2,
      { isStatic: true }
    );

    const walls = [
      Matter.Bodies.rectangle(-1, MATCH_CONSTANTS.PITCH_HEIGHT / 2, 2, MATCH_CONSTANTS.PITCH_HEIGHT * 2, { isStatic: true }),
      Matter.Bodies.rectangle(MATCH_CONSTANTS.PITCH_WIDTH + 1, MATCH_CONSTANTS.PITCH_HEIGHT / 2, 2, MATCH_CONSTANTS.PITCH_HEIGHT * 2, { isStatic: true }),
      Matter.Bodies.rectangle(MATCH_CONSTANTS.PITCH_WIDTH / 2, -1, MATCH_CONSTANTS.PITCH_WIDTH * 2, 2, { isStatic: true }),
    ];

    this.physicsBodies = [ground, ...walls];
    Matter.World.add(this.physicsEngine.world, this.physicsBodies);
  }

  initializeMatch(
    homeTeamId: number,
    awayTeamId: number,
    homeSquad: Player[],
    awaySquad: Player[],
    homeInstructions: TeamInstructions,
    awayInstructions: TeamInstructions,
    weather: string = 'clear',
  ): void {
    this.homeSquad = homeSquad;
    this.awaySquad = awaySquad;
    this.weather = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS.clear;

    this.state = {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      totalTime: MATCH_CONSTANTS.MATCH_DURATION,
      events: [],
      stats: this.createInitialStats(),
    };

    this.phaseState = {
      phase: 'kickoff',
      possessionTeam: homeTeamId,
      ballCarrier: null,
      lastPasser: null,
      pressureLevel: 50,
      dangerLevel: 0,
      phaseTimer: 0,
    };

    if (this.physicsEngine) {
      const bodiesToKeep = this.physicsBodies.slice(0, 4);
      this.physicsBodies = bodiesToKeep;
      Matter.World.clear(this.physicsEngine.world, false);
      Matter.World.add(this.physicsEngine.world, bodiesToKeep);
      this.setupPhysicsWorld();
    }

    this.aiTeams.clear();
    this.playerAttributes.clear();

    this.aiTeams.set(homeTeamId, this.createAITeamState(homeTeamId, homeInstructions, homeSquad));
    this.aiTeams.set(awayTeamId, this.createAITeamState(awayTeamId, awayInstructions, awaySquad));

    // Map player attributes
    [...homeSquad, ...awaySquad].forEach(p => {
      this.playerAttributes.set(p.id, mapPlayerToAttributes(p));
    });

    this.addBall();
  }

  private createAITeamState(teamId: number, instructions: TeamInstructions, squad: Player[]): AITeamState {
    const playerStates: AIPlayerState[] = [];
    const startingXI = squad.slice(0, 11);

    startingXI.forEach((player, i) => {
      const position = this.getPositionForIndex(i, instructions.formation);
      playerStates.push({
        playerId: player.id,
        teamId,
        position,
        currentAction: null,
        stamina: 100,
        morale: 75,
        confidence: 75,
        fatigue: 0,
        sharpness: 80,
        hasBall: false,
        inPossession: false,
        marking: null,
        pressing: false,
        offsidePosition: null,
        isInjured: player.injuryStatus === 'injured',
        isSentOff: false,
      });
    });

    const tacticalDNA = this.instructionsToTacticalDNA(instructions);

    return {
      teamId,
      formation: instructions.formation,
      instructions,
      tacticalDNA,
      playerStates,
      inPossession: false,
      pressingIntensity: this.calculatePressingIntensity(instructions),
      defensiveShape: 'compact',
      attackingShape: 'narrow',
    };
  }

  private getPositionForIndex(index: number, formation: string): PlayerRole {
    const formations: Record<string, PlayerRole[]> = {
      '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
      '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CDM', 'CM', 'LWB', 'CAM', 'ST', 'ST'],
      '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'CAM', 'CAM', 'ST'],
      '5-3-2': ['GK', 'RWB', 'CB', 'CB', 'CB', 'LWB', 'CDM', 'CM', 'CM', 'ST', 'ST'],
      '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW'],
      '4-1-4-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'RM', 'CM', 'CM', 'LM', 'ST'],
      '5-4-1': ['GK', 'RWB', 'CB', 'CB', 'CB', 'LWB', 'RM', 'CM', 'CM', 'LM', 'ST'],
    };

    const positions = formations[formation] || formations['4-3-3'];
    return positions[index] || 'CM';
  }

  private instructionsToTacticalDNA(instructions: TeamInstructions): TacticalDNA {
    const possessionMap: Record<string, number> = {
      'short': 80, 'mixed': 50, 'direct': 30, 'long': 20,
    };
    const pressingMap: Record<string, number> = {
      'low': 20, 'medium': 50, 'high': 80, 'very_high': 95,
    };
    const defensiveLineMap: Record<string, number> = {
      'low': 20, 'medium': 50, 'high': 80, 'very_high': 95,
    };
    const tempoMap: Record<string, number> = {
      'slow': 20, 'standard': 50, 'high': 80, 'very_high': 95,
    };

    const possession = possessionMap[instructions.passingStyle] || 50;

    return {
      possession,
      pressing: pressingMap[instructions.pressingIntensity] || 50,
      width: 50,
      tempo: tempoMap[instructions.tempo] || 50,
      creativity: 50,
      directness: 100 - possession,
      defensiveLine: defensiveLineMap[instructions.defensiveLine] || 50,
      compactness: 50,
      style: 'positional_play',
    };
  }

  private calculatePressingIntensity(instructions: TeamInstructions): number {
    const pressingMap: Record<string, number> = {
      'low': 20, 'medium': 50, 'high': 80, 'very_high': 95,
    };
    return pressingMap[instructions.pressingIntensity] || 50;
  }

  private addBall(): void {
    if (!this.physicsEngine) return;

    const ball = Matter.Bodies.circle(
      MATCH_CONSTANTS.PITCH_WIDTH / 2,
      MATCH_CONSTANTS.PITCH_HEIGHT / 2,
      MATCH_CONSTANTS.BALL_RADIUS,
      {
        restitution: MATCH_CONSTANTS.BALL_RESTITUTION,
        friction: MATCH_CONSTANTS.BALL_FRICTION,
        frictionAir: MATCH_CONSTANTS.BALL_AIR_FRICTION,
        label: 'ball',
      }
    );

    this.physicsBodies.push(ball);
    Matter.World.add(this.physicsEngine.world, [ball]);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastTime = performance.now();
    this.runSimulationLoop();
  }

  pause(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    this.state.isPaused = true;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  resume(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.lastTime = performance.now();
      this.runSimulationLoop();
    }
  }

  stop(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    this.state.isPaused = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  private runSimulationLoop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Update physics
    if (this.physicsEngine && this.config.enablePhysics) {
      Matter.Engine.update(this.physicsEngine, delta);
    }

    // Process AI decisions (every ~1 second of simulation time)
    this.processIntelligentDecisions(delta);

    // Generate events from decisions
    this.generateEventsFromDecisions();

    // Process event queue
    this.processEventQueue();

    // Update match time
    this.updateMatchTime(delta);

    // Update phase state
    const lastEvent = this.state.events[this.state.events.length - 1] || null;
    const homeTeam = this.aiTeams.get(this.homeSquad[0]?.clubId || 1);
    const awayTeam = this.aiTeams.get(this.awaySquad[0]?.clubId || 2);
    if (homeTeam && awayTeam) {
      this.phaseState = updatePhaseState(this.phaseState, lastEvent, homeTeam, awayTeam, this.state.currentTime);
    }

    this.animationFrame = requestAnimationFrame(() => this.runSimulationLoop());
  }

  private processIntelligentDecisions(delta: number): void {
    const now = Date.now();
    if (now % 1000 >= delta) return; // Run every ~1 second

    this.aiTeams.forEach((teamState, teamId) => {
      const opponentId = Array.from(this.aiTeams.keys()).find(id => id !== teamId);
      const opponentState = opponentId ? this.aiTeams.get(opponentId) : undefined;
      if (!opponentState) return;

      const activePlayers = teamState.playerStates.filter(p => !p.isInjured && !p.isSentOff);

      // Only process 2-3 players per tick for performance
      const playersToProcess = activePlayers.slice(0, 3);

      playersToProcess.forEach(playerState => {
        const player = this.findPlayerById(playerState.playerId);
        if (!player) return;

        const attributes = this.playerAttributes.get(player.id);
        if (!attributes) return;

        const scoreDiff = (this.state as any).homeScore || 0 - (this.state as any).awayScore || 0;
        const isHome = teamId === (this.homeSquad[0]?.clubId || 1);
        const adjustedScoreDiff = isHome ? scoreDiff : -scoreDiff;

        const ctx: DecisionContext = {
          player: playerState,
          attributes,
          teamState,
          opponentState,
          phase: this.phaseState,
          weather: this.weather,
          matchTime: this.state.currentTime,
          scoreDiff: adjustedScoreDiff,
          fatigue: playerState.fatigue,
        };

        const decision = selectBestDecision(ctx);
        if (decision) {
          this.decisionQueue.push(decision);
        }
      });
    });
  }

  private findPlayerById(playerId: number): Player | undefined {
    return [...this.homeSquad, ...this.awaySquad].find(p => p.id === playerId);
  }

  private generateEventsFromDecisions(): void {
    while (this.decisionQueue.length > 0) {
      const decision = this.decisionQueue.shift()!;
      const event = this.decisionToIntelligentEvent(decision);
      if (event) {
        this.eventQueue.push(event);
      }
    }
  }

  private decisionToIntelligentEvent(decision: AIDecision): MatchEvent | null {
    const teamState = this.aiTeams.get(decision.teamId);
    if (!teamState) return null;

    const player = this.findPlayerById(decision.playerId);
    if (!player) return null;

    const attributes = this.playerAttributes.get(player.id);
    if (!attributes) return null;

    const baseEvent = {
      id: this.state.events.length + 1,
      type: decision.type,
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: Math.floor(this.state.currentTime / 60),
      second: Math.floor(this.state.currentTime % 60),
      description: '',
    };

    switch (decision.type) {
      case 'pass': {
        const success = this.resolvePass(decision, attributes, teamState);
        const receiverId = typeof decision.target === 'number' ? decision.target : null;

        return {
          ...baseEvent,
          type: 'pass',
          passerId: decision.playerId,
          receiverId,
          teamId: decision.teamId,
          success,
          from: { x: 0.5, y: 0.5 }, // Would use actual coordinates
          to: { x: 0.6, y: 0.6 },
          passType: 'short',
          accuracy: attributes.passing,
        };
      }

      case 'shoot': {
        const xg = calculateXG(this.phaseState.dangerLevel, attributes.finishing, this.weather);
        const onTarget = Math.random() < (attributes.shooting / 100) * this.weather.shotAccuracyModifier;
        const isGoal = onTarget && Math.random() < xg;

        return {
          ...baseEvent,
          type: 'shot',
          shooterId: decision.playerId,
          teamId: decision.teamId,
          coordinates: { x: 0.85, y: 0.5 },
          shotType: 'first_time',
          target: isGoal ? 'goal' : onTarget ? 'saved' : 'off_target',
          xg,
          onTarget,
        };
      }

      case 'dribble': {
        const success = Math.random() < (attributes.dribbling / 100) * (1 - this.weather.slipChance);

        return {
          ...baseEvent,
          type: 'dribble',
          passerId: decision.playerId,
          receiverId: decision.playerId,
          teamId: decision.teamId,
          success,
          from: { x: 0.5, y: 0.5 },
          to: { x: 0.55, y: 0.55 },
          passType: 'short',
          accuracy: attributes.dribbling,
        };
      }

      case 'tackle': {
        const success = Math.random() < (attributes.positioning + attributes.anticipation) / 200 * (1 - this.weather.slipChance * 0.5);

        return {
          ...baseEvent,
          type: 'tackle',
          tacklerId: decision.playerId,
          tacklerTeamId: decision.teamId,
          tackledId: 1, // Would find nearest opponent
          tackledTeamId: teamState.teamId === this.homeSquad[0]?.clubId ? this.awaySquad[0]?.clubId || 2 : this.homeSquad[0]?.clubId || 1,
          success,
          tackleType: 'standing',
          coordinates: { x: 0.5, y: 0.5 },
        };
      }

      case 'press': {
        return {
          ...baseEvent,
          type: 'press',
          description: `${player.firstName} ${player.lastName} presses high up the pitch`,
        };
      }

      case 'intercept': {
        const success = Math.random() < (attributes.anticipation + attributes.vision) / 200;

        return {
          ...baseEvent,
          type: 'intercept',
          description: success 
            ? `${player.firstName} ${player.lastName} reads the pass and intercepts!`
            : `${player.firstName} ${player.lastName} nearly intercepts but just misses`,
        };
      }

      default:
        return null;
    }
  }

  private resolvePass(decision: AIDecision, attributes: PlayerAttributes, teamState: AITeamState): boolean {
    const pressureMod = 1 - (this.phaseState.pressureLevel / 200);
    const fatigueMod = 1 - (this.findPlayerById(decision.playerId)?.fatigue || 0) / 200;
    const weatherMod = this.weather.passAccuracyModifier;
    const tacticalMod = 0.7 + (teamState.tacticalDNA.possession / 100) * 0.3;

    const successChance = (attributes.passing / 100) * pressureMod * fatigueMod * weatherMod * tacticalMod;
    return Math.random() < successChance;
  }

  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.state.events.push(event);
      this.updateStatsFromEvent(event);
      this.handleSpecialEvent(event);
      this.generateCommentary(event);
    }
  }

  private generateCommentary(event: MatchEvent): void {
    if (!this.config.enableCommentary) return;

    const player = this.findPlayerById(
      (event as any).passerId || (event as any).shooterId || (event as any).tacklerId || (event as any).scorerId
    );
    const playerName = player ? `${player.firstName} ${player.lastName}` : 'The player';

    let commentary = '';

    switch (event.type) {
      case 'pass':
        if (event.success) {
          commentary = `${playerName} finds space and plays a precise pass.`;
        } else {
          commentary = `${playerName} tries to thread it through but the pass is intercepted.`;
        }
        break;
      case 'shot':
        if (event.target === 'goal') {
          commentary = `${playerName} unleashes a powerful strike... IT'S IN! WHAT A GOAL!`;
        } else if (event.target === 'saved') {
          commentary = `${playerName} gets the shot away but the keeper makes a brilliant save!`;
        } else {
          commentary = `${playerName} goes for it but the shot drifts wide.`;
        }
        break;
      case 'tackle':
        if (event.success) {
          commentary = `${playerName} wins the ball back with a perfectly timed tackle.`;
        } else {
          commentary = `${playerName} goes in hard but misses the ball entirely.`;
        }
        break;
      case 'foul':
        commentary = `${playerName} commits a foul and the referee has a word.`;
        break;
      case 'goal':
        commentary = `GOAL! ${playerName} sends the crowd into raptures!`;
        break;
    }

    if (commentary) {
      (event as any).commentary = commentary;
    }
  }

  private updateStatsFromEvent(event: MatchEvent): void {
    const teamId = 'teamId' in event ? event.teamId : null;
    if (!teamId) return;

    const isHome = teamId === (this.homeSquad[0]?.clubId || 1);
    const teamKey = isHome ? 'home' : 'away';
    const opponentKey = isHome ? 'away' : 'home';

    switch (event.type) {
      case 'pass':
        this.state.stats.passes[teamKey].attempted++;
        if (event.success) {
          this.state.stats.passes[teamKey].completed++;
        }
        this.state.stats.passes[teamKey].accuracy =
          (this.state.stats.passes[teamKey].completed / this.state.stats.passes[teamKey].attempted) * 100;

        // Update possession
        if (event.success) {
          this.state.stats.possession[teamKey] = Math.min(80, this.state.stats.possession[teamKey] + 1);
          this.state.stats.possession[opponentKey] = 100 - this.state.stats.possession[teamKey];
        }
        break;

      case 'shot':
        this.state.stats.shots[teamKey]++;
        if (event.onTarget) {
          this.state.stats.shots.onTarget[teamKey]++;
        }
        this.state.stats.xg[teamKey] += event.xg || 0;
        break;

      case 'goal':
        this.state.stats.shots.onTarget[teamKey]++;
        this.state.stats.xg[teamKey] += 1;
        if (isHome) {
          (this.state as any).homeScore = ((this.state as any).homeScore || 0) + 1;
        } else {
          (this.state as any).awayScore = ((this.state as any).awayScore || 0) + 1;
        }
        break;

      case 'tackle':
        this.state.stats.tackles[teamKey].attempted++;
        if (event.success) {
          this.state.stats.tackles[teamKey].won++;
        }
        this.state.stats.tackles[teamKey].successRate =
          (this.state.stats.tackles[teamKey].won / this.state.stats.tackles[teamKey].attempted) * 100;
        break;

      case 'foul':
        this.state.stats.fouls[teamKey]++;
        if (event.card === 'yellow') {
          this.state.stats.cards[teamKey].yellow++;
        } else if (event.card === 'red' || event.card === 'second_yellow') {
          this.state.stats.cards[teamKey].red++;
        }
        break;

      case 'set_piece':
        if (event.setPieceType === 'corner') {
          this.state.stats.corners[teamKey]++;
        }
        break;

      case 'offside':
        this.state.stats.offsides[teamKey]++;
        break;
    }
  }

  private handleSpecialEvent(event: MatchEvent): void {
    switch (event.type) {
      case 'shot':
        if (event.target === 'goal') {
          const goalEvent: MatchEvent = {
            id: this.state.events.length + 1,
            type: 'goal',
            timestamp: event.timestamp,
            matchId: event.matchId,
            minute: event.minute,
            second: event.second,
            scorerId: event.shooterId,
            teamId: event.teamId,
            coordinates: event.coordinates,
            shotType: event.shotType,
            isOwnGoal: false,
            description: `GOAL! Player ${event.shooterId} scores!`,
          };
          this.eventQueue.push(goalEvent);
        }
        break;

      case 'foul':
        if (event.card === 'red' && event.inBox) {
          const penaltyEvent: MatchEvent = {
            id: this.state.events.length + 1,
            type: 'set_piece',
            timestamp: event.timestamp,
            matchId: event.matchId,
            minute: event.minute,
            second: event.second,
            setPieceType: 'penalty',
            teamId: event.fouledTeamId,
            takerId: 1,
            coordinates: { x: 0.85, y: 0.5 },
            description: `PENALTY! Awarded to team ${event.fouledTeamId}`,
          };
          this.eventQueue.push(penaltyEvent);
        }
        break;
    }
  }

  private updateMatchTime(delta: number): void {
    const timeIncrease = (delta / 1000) * this.getSpeedMultiplier();
    this.state.currentTime += timeIncrease;

    if (this.state.currentTime >= MATCH_CONSTANTS.FIRST_HALF_DURATION &&
        this.state.currentTime - timeIncrease < MATCH_CONSTANTS.FIRST_HALF_DURATION) {
      this.triggerHalfTime();
    }

    if (this.state.currentTime >= MATCH_CONSTANTS.MATCH_DURATION &&
        this.state.currentTime - timeIncrease < MATCH_CONSTANTS.MATCH_DURATION) {
      this.triggerFullTime();
    }
  }

  private getSpeedMultiplier(): number {
    switch (this.config.matchSpeed) {
      case 'slow': return 0.5;
      case 'normal': return 1.0;
      case 'fast': return 2.0;
      case 'instant': return 10.0;
      default: return 1.0;
    }
  }

  private triggerHalfTime(): void {
    this.state.isHalfTime = true;
    this.pause();

    const event: MatchEvent = {
      id: this.state.events.length + 1,
      type: 'half_time',
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: 45,
      second: 0,
      description: `Half-time: ${(this.state as any).homeScore || 0}-${(this.state as any).awayScore || 0}`,
    };
    this.state.events.push(event);

    this.aiTeams.forEach(teamState => {
      teamState.playerStates.forEach(player => {
        player.stamina = Math.min(100, player.stamina + 15);
        player.fatigue = Math.max(0, player.fatigue - 20);
      });
    });
  }

  private triggerFullTime(): void {
    this.state.isFullTime = true;
    this.stop();

    const event: MatchEvent = {
      id: this.state.events.length + 1,
      type: 'full_time',
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: 90,
      second: 0,
      description: `Full-time: ${(this.state as any).homeScore || 0}-${(this.state as any).awayScore || 0}`,
    };
    this.state.events.push(event);
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  getPhaseState(): PhaseState {
    return { ...this.phaseState };
  }

  getAITeamState(teamId: number): AITeamState | undefined {
    return this.aiTeams.get(teamId);
  }

  getAllAITeamStates(): Map<number, AITeamState> {
    return new Map(this.aiTeams);
  }

  getPhysicsEngine(): Matter.Engine | null {
    return this.physicsEngine;
  }

  getPhysicsBodies(): Matter.Body[] {
    return [...this.physicsBodies];
  }

  destroy(): void {
    this.stop();
    if (this.physicsEngine) {
      Matter.Engine.clear(this.physicsEngine);
      this.physicsEngine = null;
    }
    this.physicsBodies = [];
    this.aiTeams.clear();
    this.playerAttributes.clear();
    this.decisionQueue = [];
    this.eventQueue = [];
  }
}

