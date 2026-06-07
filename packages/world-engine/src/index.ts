// TACTICO World Engine
// Core package for managing the living football universe

// Re-export all modules
export * from './core/engine';
export * from './core/types';
export * from './core/constants';

export * from './time/time-engine';
export * from './time/season-engine';

export * from './training/training-engine';
export * from './development/development-engine';

export * from './finance/finance-engine';
export * from './contracts/contract-engine';
export * from './injuries/injury-engine';
export * from './morale/morale-engine';

export * from './youth/youth-engine';
export * from './reputation/reputation-engine';
export * from './media/media-engine';

// Main exports
import { WorldEngine } from './core/engine';

export { WorldEngine };
