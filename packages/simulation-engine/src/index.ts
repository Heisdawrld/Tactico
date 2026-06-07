// TACTICO Simulation Engine
// Core package for match simulation, player AI, and tactical processing

// Re-export all modules
export * from './core/engine';
export * from './core/types';
export * from './core/constants';

export * from './players/player';
export * from './players/attributes';
export * from './players/ai';

export * from './teams/team';
export * from './teams/tactics';

export * from './match-engine/match';
export * from './match-engine/events';
export * from './match-engine/simulator';

export * from './event-generator/generator';
export * from './event-generator/handlers';

export * from './physics/engine';
export * from './physics/body';

export * from './analytics/stats';
export * from './analytics/ratings';

// Main exports
import { SimulationEngine } from './core/engine';
import { MatchSimulator } from './match-engine/simulator';
import { EventGenerator } from './event-generator/generator';

export { SimulationEngine, MatchSimulator, EventGenerator };
