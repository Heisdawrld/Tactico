// TACTICO Simulation Engine - Core Engine
import * as Matter from 'matter-js';
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
  MATCH_CONSTANTS,
  WEATHER_EFFECTS,
  POSITION_MODIFIERS,
  TACTICAL_STYLE_MODIFIERS,
} from './types';

/**
 * SimulationEngine - Core class for managing match simulations
 * 
 * This is the heart of TACTICO's match simulation. It handles:
 * - Match state management
 * - Event generation and processing
 * - Player AI decisions
 * - Physics simulation (optional)
 * - Statistics tracking
 */
export class SimulationEngine {
  private config: SimulationConfig;
  private state: SimulationState;
  private physicsEngine: Matter.Engine | null = null;
  private physicsBodies: Matter.Body[] = [];
  private aiTeams: Map<number, AITeamState> = new Map();
  private decisionQueue: AIDecision[] = [];
  private eventQueue: MatchEvent[] = [];
  private animationFrame: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  /**
   * Create a new SimulationEngine instance
   * @param config Simulation configuration
   */
  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      tickRate: 16, // ~60fps
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

    // Initialize physics engine if enabled
    if (this.config.enablePhysics) {
      this.physicsEngine = Matter.Engine.create();
      this.setupPhysicsWorld();
    }
  }

  /**
   * Create initial match statistics
   */
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

  /**
   * Setup the physics world
   */
  private setupPhysicsWorld(): void {
    if (!this.physicsEngine) return;

    // Create ground
    const ground = Matter.Bodies.rectangle(
      MATCH_CONSTANTS.PITCH_WIDTH / 2,
      MATCH_CONSTANTS.PITCH_HEIGHT + 1,
      MATCH_CONSTANTS.PITCH_WIDTH * 2,
      2,
      { isStatic: true }
    );

    // Create walls
    const walls = [
      Matter.Bodies.rectangle(
        -1,
        MATCH_CONSTANTS.PITCH_HEIGHT / 2,
        2,
        MATCH_CONSTANTS.PITCH_HEIGHT * 2,
        { isStatic: true }
      ),
      Matter.Bodies.rectangle(
        MATCH_CONSTANTS.PITCH_WIDTH + 1,
        MATCH_CONSTANTS.PITCH_HEIGHT / 2,
        2,
        MATCH_CONSTANTS.PITCH_HEIGHT * 2,
        { isStatic: true }
      ),
      Matter.Bodies.rectangle(
        MATCH_CONSTANTS.PITCH_WIDTH / 2,
        -1,
        MATCH_CONSTANTS.PITCH_WIDTH * 2,
        2,
        { isStatic: true }
      ),
    ];

    this.physicsBodies = [ground, ...walls];
    Matter.World.add(this.physicsEngine.world, this.physicsBodies);
  }

  /**
   * Initialize a match with teams and instructions
   * @param homeTeamId ID of the home team
   * @param awayTeamId ID of the away team
   * @param homeInstructions Team instructions for home team
   * @param awayInstructions Team instructions for away team
   * @param weather Weather condition for the match
   */
  initializeMatch(
    homeTeamId: number,
    awayTeamId: number,
    homeInstructions: TeamInstructions,
    awayInstructions: TeamInstructions,
    weather: string = 'clear'
  ): void {
    // Reset state
    this.state = {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      totalTime: MATCH_CONSTANTS.MATCH_DURATION,
      events: [],
      stats: this.createInitialStats(),
    };

    // Clear previous bodies (except ground and walls)
    if (this.physicsEngine) {
      const bodiesToKeep = this.physicsBodies.slice(0, 4); // Keep ground and 3 walls
      this.physicsBodies = bodiesToKeep;
      Matter.World.clear(this.physicsEngine.world, false);
      Matter.World.add(this.physicsEngine.world, bodiesToKeep);
      this.setupPhysicsWorld();
    }

    // Initialize AI teams
    this.aiTeams.clear();
    this.aiTeams.set(homeTeamId, this.createAITeamState(homeTeamId, homeInstructions));
    this.aiTeams.set(awayTeamId, this.createAITeamState(awayTeamId, awayInstructions));

    // Add ball
    this.addBall();

    // Set weather effects
    this.applyWeatherEffects(weather);
  }

  /**
   * Create AI team state
   */
  private createAITeamState(teamId: number, instructions: TeamInstructions): AITeamState {
    // For now, create placeholder player states
    // In a real implementation, this would be populated with actual players
    const playerStates: AIPlayerState[] = [];
    
    // Create 11 players for the team
    for (let i = 0; i < 11; i++) {
      const position = this.getPositionForIndex(i);
      playerStates.push({
        playerId: i + 1,
        teamId,
        position,
        currentAction: null,
        stamina: 100,
        morale: 75,
        confidence: 75,
        fatigue: 0,
        sharpness: 75,
        hasBall: false,
        inPossession: false,
        marking: null,
        pressing: false,
        offsidePosition: null,
      });
    }

    // Determine tactical DNA from instructions
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

  /**
   * Get position for player index (simplified)
   */
  private getPositionForIndex(index: number): PlayerRole {
    const positions: PlayerRole[] = [
      'GK', 'RCB', 'CB', 'LCB', 'RWB', 'CDM', 'LCM', 'RCM', 'LWB', 'ST', 'CF'
    ];
    return positions[index] || 'CM';
  }

  /**
   * Convert team instructions to tactical DNA
   */
  private instructionsToTacticalDNA(instructions: TeamInstructions): TacticalDNA {
    // Map instruction values to DNA values
    const possessionMap: Record<string, number> = {
      'short': 80,
      'mixed': 50,
      'direct': 30,
      'long': 20,
    };

    const pressingMap: Record<string, number> = {
      'low': 20,
      'medium': 50,
      'high': 80,
      'very_high': 95,
    };

    const defensiveLineMap: Record<string, number> = {
      'low': 20,
      'medium': 50,
      'high': 80,
      'very_high': 95,
    };

    const tempoMap: Record<string, number> = {
      'slow': 20,
      'standard': 50,
      'high': 80,
      'very_high': 95,
    };

    return {
      possession: possessionMap[instructions.passingStyle] || 50,
      pressing: pressingMap[instructions.pressingIntensity] || 50,
      width: 50, // Would be calculated from formation
      tempo: tempoMap[instructions.tempo] || 50,
      creativity: 50, // Would be calculated from player attributes
      directness: 100 - (possessionMap[instructions.passingStyle] || 50),
      defensiveLine: defensiveLineMap[instructions.defensiveLine] || 50,
      compactness: 50,
      style: 'positional_play', // Default, would be determined from DNA
    };
  }

  /**
   * Calculate pressing intensity from instructions
   */
  private calculatePressingIntensity(instructions: TeamInstructions): number {
    const pressingMap: Record<string, number> = {
      'low': 20,
      'medium': 50,
      'high': 80,
      'very_high': 95,
    };
    return pressingMap[instructions.pressingIntensity] || 50;
  }

  /**
   * Add ball to physics world
   */
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

  /**
   * Add player to physics world
   */
  addPlayer(
    playerId: number,
    teamId: number,
    position: PlayerRole,
    x: number,
    y: number
  ): void {
    if (!this.physicsEngine) return;

    const player = Matter.Bodies.circle(
      x,
      y,
      MATCH_CONSTANTS.PLAYER_RADIUS,
      {
        restitution: MATCH_CONSTANTS.PLAYER_RESTITUTION,
        friction: MATCH_CONSTANTS.PLAYER_FRICTION,
        frictionAir: MATCH_CONSTANTS.PLAYER_AIR_FRICTION,
        mass: MATCH_CONSTANTS.PLAYER_MASS,
        label: `player_${playerId}_${teamId}`,
      }
    );

    this.physicsBodies.push(player);
    Matter.World.add(this.physicsEngine.world, [player]);

    // Update AI team state
    const teamState = this.aiTeams.get(teamId);
    if (teamState) {
      const playerState = teamState.playerStates.find(p => p.playerId === playerId);
      if (playerState) {
        playerState.hasBall = false;
        playerState.inPossession = false;
      }
    }
  }

  /**
   * Apply weather effects to the simulation
   */
  private applyWeatherEffects(weather: string): void {
    const effects = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS.clear;
    
    // Store weather effects for later use in calculations
    this.state.weatherEffects = effects;
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastTime = performance.now();
    
    this.runSimulationLoop();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    this.state.isPaused = true;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.lastTime = performance.now();
      this.runSimulationLoop();
    }
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    this.state.isPaused = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  /**
   * Main simulation loop
   */
  private runSimulationLoop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Update physics
    if (this.physicsEngine && this.config.enablePhysics) {
      Matter.Engine.update(this.physicsEngine, delta);
    }

    // Process AI decisions
    this.processAIDecisions(delta);

    // Generate events
    this.generateEvents(delta);

    // Process event queue
    this.processEventQueue();

    // Update match time
    this.updateMatchTime(delta);

    // Continue loop
    this.animationFrame = requestAnimationFrame(() => this.runSimulationLoop());
  }

  /**
   * Process AI decisions
   */
  private processAIDecisions(delta: number): void {
    // For now, generate random decisions for demonstration
    // In a real implementation, this would use proper AI logic
    
    const now = Date.now();
    if (now % 1000 < delta) { // Generate decisions every ~1 second
      this.aiTeams.forEach((teamState, teamId) => {
        // Find a player to make a decision
        const activePlayers = teamState.playerStates.filter(
          p => !p.isInjured && !p.isSentOff
        );
        
        if (activePlayers.length > 0) {
          const player = activePlayers[Math.floor(Math.random() * activePlayers.length)];
          const decision = this.generateRandomDecision(player, teamState);
          this.decisionQueue.push(decision);
        }
      });
    }
  }

  /**
   * Generate a random AI decision (for demonstration)
   */
  private generateRandomDecision(
    playerState: AIPlayerState,
    teamState: AITeamState
  ): AIDecision {
    const positionModifiers = POSITION_MODIFIERS[playerState.position];
    const random = Math.random();
    
    let decisionType: AIDecision['type'];
    let confidence = 50 + Math.random() * 50;
    
    // Weighted random selection based on position modifiers
    const weights = [
      { type: 'pass' as const, weight: positionModifiers.passWeight },
      { type: 'shoot' as const, weight: positionModifiers.shootWeight },
      { type: 'dribble' as const, weight: positionModifiers.dribbleWeight },
      { type: 'cross' as const, weight: positionModifiers.crossWeight },
      { type: 'tackle' as const, weight: positionModifiers.tackleWeight },
      { type: 'intercept' as const, weight: positionModifiers.interceptWeight },
      { type: 'press' as const, weight: teamState.pressingIntensity / 100 },
    ];
    
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let cumulativeWeight = 0;
    const randomWeight = Math.random() * totalWeight;
    
    for (const weight of weights) {
      cumulativeWeight += weight.weight;
      if (randomWeight <= cumulativeWeight) {
        decisionType = weight.type;
        break;
      }
    }
    
    // Default to pass if no decision was selected
    if (!decisionType) {
      decisionType = 'pass';
    }

    return {
      type: decisionType,
      playerId: playerState.playerId,
      teamId: playerState.teamId,
      confidence,
      timestamp: this.state.currentTime,
    };
  }

  /**
   * Generate events based on AI decisions and match state
   */
  private generateEvents(delta: number): void {
    // Process decision queue
    while (this.decisionQueue.length > 0) {
      const decision = this.decisionQueue.shift()!;
      const event = this.decisionToEvent(decision);
      if (event) {
        this.eventQueue.push(event);
      }
    }

    // Generate random events (for now, until AI is more sophisticated)
    const now = Date.now();
    if (now % 3000 < delta) { // Every ~3 seconds
      const event = this.generateRandomEvent();
      if (event) {
        this.eventQueue.push(event);
      }
    }
  }

  /**
   * Convert AI decision to match event
   */
  private decisionToEvent(decision: AIDecision): MatchEvent | null {
    const teamState = this.aiTeams.get(decision.teamId);
    if (!teamState) return null;

    const playerState = teamState.playerStates.find(
      p => p.playerId === decision.playerId
    );
    if (!playerState) return null;

    // Create a basic event based on decision type
    const baseEvent: MatchEvent = {
      id: this.state.events.length + 1,
      type: decision.type,
      timestamp: new Date().toISOString(),
      matchId: 1, // Would be set to actual match ID
      minute: Math.floor(this.state.currentTime / 60),
      second: Math.floor(this.state.currentTime % 60),
      description: `${decision.type} by player ${decision.playerId}`,
    };

    switch (decision.type) {
      case 'pass':
        return {
          ...baseEvent,
          type: 'pass',
          passerId: decision.playerId,
          receiverId: null, // Would be determined by AI
          teamId: decision.teamId,
          success: Math.random() > 0.2, // 80% success rate for now
          from: { x: 0.5, y: 0.5 }, // Would use actual coordinates
          to: { x: 0.6, y: 0.6 }, // Would use actual coordinates
          passType: 'short',
          accuracy: 75 + Math.random() * 25,
        };

      case 'shoot':
        return {
          ...baseEvent,
          type: 'shot',
          shooterId: decision.playerId,
          teamId: decision.teamId,
          coordinates: { x: 0.8, y: 0.5 },
          shotType: 'first_time',
          target: Math.random() > 0.7 ? 'goal' : 'off_target',
          xg: Math.random(),
          onTarget: Math.random() > 0.5,
        };

      case 'dribble':
        return {
          ...baseEvent,
          type: 'dribble',
          // For now, treat dribble as a pass to self
          passerId: decision.playerId,
          receiverId: decision.playerId,
          teamId: decision.teamId,
          success: true,
          from: { x: 0.5, y: 0.5 },
          to: { x: 0.55, y: 0.55 },
          passType: 'short',
          accuracy: 80 + Math.random() * 20,
        };

      case 'tackle':
        return {
          ...baseEvent,
          type: 'tackle',
          tacklerId: decision.playerId,
          tacklerTeamId: decision.teamId,
          tackledId: 1, // Would be determined by AI
          tackledTeamId: 2, // Would be determined by AI
          success: Math.random() > 0.3, // 70% success rate
          tackleType: 'slide',
          coordinates: { x: 0.5, y: 0.5 },
        };

      default:
        return null;
    }
  }

  /**
   * Generate a random event (for demonstration)
   */
  private generateRandomEvent(): MatchEvent | null {
    const eventTypes: MatchEvent['type'][] = [
      'pass', 'shot', 'tackle', 'foul', 'corner', 'offside'
    ];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const baseEvent: MatchEvent = {
      id: this.state.events.length + 1,
      type: randomType,
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: Math.floor(this.state.currentTime / 60),
      second: Math.floor(this.state.currentTime % 60),
      description: `Random ${randomType} event`,
    };

    switch (randomType) {
      case 'pass':
        return {
          ...baseEvent,
          type: 'pass',
          passerId: 1,
          receiverId: Math.random() > 0.5 ? 2 : null,
          teamId: 1,
          success: Math.random() > 0.2,
          from: { x: 0.5, y: 0.5 },
          to: { x: 0.6, y: 0.6 },
          passType: 'short',
          accuracy: 75 + Math.random() * 25,
        };

      case 'shot':
        return {
          ...baseEvent,
          type: 'shot',
          shooterId: 1,
          teamId: 1,
          coordinates: { x: 0.85, y: 0.4 + Math.random() * 0.2 },
          shotType: 'first_time',
          target: Math.random() > 0.85 ? 'goal' : Math.random() > 0.5 ? 'saved' : 'off_target',
          xg: Math.random() * 0.5,
          onTarget: Math.random() > 0.5,
        };

      case 'tackle':
        return {
          ...baseEvent,
          type: 'tackle',
          tacklerId: 1,
          tacklerTeamId: 1,
          tackledId: 2,
          tackledTeamId: 2,
          success: Math.random() > 0.3,
          tackleType: 'slide',
          coordinates: { x: 0.5, y: 0.5 },
        };

      case 'foul':
        const foulSeverity = Math.random();
        return {
          ...baseEvent,
          type: 'foul',
          foulerId: 1,
          foulerTeamId: 1,
          fouledId: 2,
          fouledTeamId: 2,
          foulType: 'tackle',
          card: foulSeverity > 0.9 ? 'red' : foulSeverity > 0.7 ? 'yellow' : undefined,
          coordinates: { x: 0.5, y: 0.5 },
          inBox: Math.random() > 0.8,
        };

      case 'corner':
        return {
          ...baseEvent,
          type: 'set_piece',
          setPieceType: 'corner',
          teamId: Math.random() > 0.5 ? 1 : 2,
          takerId: 1,
          coordinates: { x: Math.random() > 0.5 ? 0.95 : 0.05, y: Math.random() > 0.5 ? 0.1 : 0.9 },
        };

      case 'offside':
        return {
          ...baseEvent,
          type: 'offside',
          // Offside doesn't have standard fields, so we'll use description
          description: `Player from team ${Math.random() > 0.5 ? 1 : 2} caught offside`,
        } as MatchEvent;

      default:
        return null;
    }
  }

  /**
   * Process the event queue
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      // Add to match events
      this.state.events.push(event);

      // Update statistics
      this.updateStatsFromEvent(event);

      // Handle special events (goals, cards, etc.)
      this.handleSpecialEvent(event);
    }
  }

  /**
   * Update statistics from an event
   */
  private updateStatsFromEvent(event: MatchEvent): void {
    const teamId = 'teamId' in event ? event.teamId : null;
    if (!teamId) return;

    const isHome = teamId === 1; // For now, assume team 1 is home
    const teamKey = isHome ? 'home' : 'away';
    const opponentKey = isHome ? 'away' : 'home';

    switch (event.type) {
      case 'pass':
        this.state.stats.passes[teamKey].attempted++;
        if (event.success) {
          this.state.stats.passes[teamKey].completed++;
        }
        this.state.stats.passes[teamKey].accuracy = 
          (this.state.stats.passes[teamKey].completed / 
           this.state.stats.passes[teamKey].attempted) * 100;
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
        this.state.stats.xg[teamKey] += 1; // Goal = 1.0 xG
        if (isHome) {
          this.state.possession.home = 50 + Math.random() * 10;
          this.state.possession.away = 100 - this.state.possession.home;
        } else {
          this.state.possession.away = 50 + Math.random() * 10;
          this.state.possession.home = 100 - this.state.possession.away;
        }
        break;

      case 'tackle':
        this.state.stats.tackles[teamKey].attempted++;
        if (event.success) {
          this.state.stats.tackles[teamKey].won++;
        }
        this.state.stats.tackles[teamKey].successRate = 
          (this.state.stats.tackles[teamKey].won / 
           this.state.stats.tackles[teamKey].attempted) * 100;
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

  /**
   * Handle special events (goals, cards, etc.)
   */
  private handleSpecialEvent(event: MatchEvent): void {
    switch (event.type) {
      case 'shot':
        if (event.target === 'goal') {
          // Convert shot to goal
          const goalEvent: MatchEvent = {
            id: this.state.events.length + 1,
            type: 'goal',
            timestamp: event.timestamp,
            matchId: event.matchId,
            minute: event.minute,
            second: event.second,
            scorerId: event.shooterId,
            teamId: ('teamId' in event ? event.teamId : 1),
            coordinates: event.coordinates,
            shotType: event.shotType,
            isOwnGoal: false,
            description: `GOAL! Player ${event.shooterId} scores!`,
          };
          this.eventQueue.push(goalEvent);

          // Update score
          const teamKey = 'teamId' in event && event.teamId === 1 ? 'home' : 'away';
          if (teamKey === 'home') {
            this.state.homeScore = (this.state as any).homeScore + 1 || 1;
          } else {
            this.state.awayScore = (this.state as any).awayScore + 1 || 1;
          }
        }
        break;

      case 'foul':
        if (event.card === 'yellow' || event.card === 'second_yellow' || event.card === 'red') {
          // Card event already handled in stats
          // Could trigger additional actions (e.g., penalty for red card foul in box)
          if (event.inBox && event.card === 'red') {
            const penaltyEvent: MatchEvent = {
              id: this.state.events.length + 1,
              type: 'set_piece',
              timestamp: event.timestamp,
              matchId: event.matchId,
              minute: event.minute,
              second: event.second,
              setPieceType: 'penalty',
              teamId: event.fouledTeamId,
              takerId: 1, // Would be determined by AI
              coordinates: { x: 0.85, y: 0.5 },
              description: `PENALTY! Awarded to team ${event.fouledTeamId}`,
            };
            this.eventQueue.push(penaltyEvent);
          }
        }
        break;
    }
  }

  /**
   * Update match time
   */
  private updateMatchTime(delta: number): void {
    const timeIncrease = (delta / 1000) * this.getSpeedMultiplier();
    this.state.currentTime += timeIncrease;

    // Check for half-time
    if (this.state.currentTime >= MATCH_CONSTANTS.FIRST_HALF_DURATION && 
        this.state.currentTime - timeIncrease < MATCH_CONSTANTS.FIRST_HALF_DURATION) {
      this.triggerHalfTime();
    }

    // Check for full-time
    if (this.state.currentTime >= MATCH_CONSTANTS.MATCH_DURATION && 
        this.state.currentTime - timeIncrease < MATCH_CONSTANTS.MATCH_DURATION) {
      this.triggerFullTime();
    }
  }

  /**
   * Get speed multiplier based on match speed setting
   */
  private getSpeedMultiplier(): number {
    switch (this.config.matchSpeed) {
      case 'slow': return 0.5;
      case 'normal': return 1.0;
      case 'fast': return 2.0;
      case 'instant': return 10.0;
      default: return 1.0;
    }
  }

  /**
   * Trigger half-time
   */
  private triggerHalfTime(): void {
    this.state.isHalfTime = true;
    this.pause();
    
    // Add half-time event
    const event: MatchEvent = {
      id: this.state.events.length + 1,
      type: 'half_time',
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: 45,
      second: 0,
      description: 'Half-time: End of first half',
    } as MatchEvent;
    this.state.events.push(event);

    // Recover some stamina for all players
    this.aiTeams.forEach(teamState => {
      teamState.playerStates.forEach(player => {
        player.stamina = Math.min(
          100,
          player.stamina + (MATCH_CONSTANTS.STAMINA_RECOVERY_HALF_TIME * 45 * 60)
        );
        player.fatigue = Math.max(0, player.fatigue - 20);
      });
    });
  }

  /**
   * Trigger full-time
   */
  private triggerFullTime(): void {
    this.state.isFullTime = true;
    this.stop();

    // Add full-time event
    const event: MatchEvent = {
      id: this.state.events.length + 1,
      type: 'full_time',
      timestamp: new Date().toISOString(),
      matchId: 1,
      minute: 90,
      second: 0,
      description: 'Full-time: End of match',
    } as MatchEvent;
    this.state.events.push(event);
  }

  /**
   * Get current match state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Get AI team state
   */
  getAITeamState(teamId: number): AITeamState | undefined {
    return this.aiTeams.get(teamId);
  }

  /**
   * Get all AI team states
   */
  getAllAITeamStates(): Map<number, AITeamState> {
    return new Map(this.aiTeams);
  }

  /**
   * Get physics engine (for rendering)
   */
  getPhysicsEngine(): Matter.Engine | null {
    return this.physicsEngine;
  }

  /**
   * Get all physics bodies
   */
  getPhysicsBodies(): Matter.Body[] {
    return [...this.physicsBodies];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    if (this.physicsEngine) {
      Matter.Engine.clear(this.physicsEngine);
      this.physicsEngine = null;
    }
    
    this.physicsBodies = [];
    this.aiTeams.clear();
    this.decisionQueue = [];
    this.eventQueue = [];
  }
}

// ============================================
// EXPORTS
// ============================================

export { Matter };
export type { Engine as PhysicsEngine } from 'matter-js';
