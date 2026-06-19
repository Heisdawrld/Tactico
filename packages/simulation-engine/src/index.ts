// TACTICO Simulation Engine
// Core package for match simulation, player AI, and tactical processing
//
// NOTE: The previous version of this file imported from many subdirectories
// (players/, teams/, match-engine/, event-generator/, physics/, analytics/)
// that were never created. Those imports caused the package to fail compiling.
// For now, we only export what actually exists (core/). The other modules
// should be re-added as they get implemented.

// Re-export core modules (the only ones that actually exist)
export * from './core/engine';
export * from './core/types';
export * from './core/constants';

// Main exports
import { SimulationEngine } from './core/engine';
export { SimulationEngine };
