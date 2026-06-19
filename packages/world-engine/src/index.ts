// TACTICO World Engine
// Core package for managing the living football universe
//
// The package exposes `WorldEngine` and the core types at the root. Sub-engines
// are imported directly from their sub-paths to avoid type-name collisions
// (core/types.ts re-exports many names that also exist in sub-engine type files).
//
// Usage:
//   import { WorldEngine } from '@tactico/world-engine';
//   import type { WorldState } from '@tactico/world-engine';
//   import { TimeEngine } from '@tactico/world-engine/time/engine';
//   import type { TimeState } from '@tactico/world-engine/time/types';

// Core (engine + types) — flat exports
export * from './core/engine';
export * from './core/types';

// Re-export sub-engine CLASSES only (no types, to avoid collisions)
export { TimeEngine } from './time/engine';
export { TrainingEngine } from './training/engine';
export { FinanceEngine } from './finance/engine';
export { ContractEngine } from './contracts/engine';
export { InjuryEngine } from './injuries/engine';
export { MoraleEngine } from './morale/engine';
export { YouthEngine } from './youth/engine';
export { ReputationEngine } from './reputation/engine';
export { MediaEngine } from './media/engine';

// Main exports
import { WorldEngine } from './core/engine';
export { WorldEngine };
