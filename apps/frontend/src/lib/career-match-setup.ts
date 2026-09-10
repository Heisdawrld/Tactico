import type { TeamInstructions } from '@tactico/simulation-engine';
import type { TacticsState } from './career-engine';

/** Explicit adapter while career matches still use the legacy engine. */
export function careerTeamInstructions(tactics: TacticsState, defaults: TeamInstructions): TeamInstructions {
  return {
    ...defaults,
    formation: tactics.formation,
    pressingIntensity: tactics.pressing >= 85 ? 'very_high' : tactics.pressing >= 60 ? 'high' : tactics.pressing >= 30 ? 'medium' : 'low',
    defensiveLine: tactics.defensiveLine >= 85 ? 'very_high' : tactics.defensiveLine >= 60 ? 'high' : tactics.defensiveLine >= 30 ? 'medium' : 'low',
    tempo: tactics.tempo >= 85 ? 'very_high' : tactics.tempo >= 60 ? 'high' : tactics.tempo >= 30 ? 'standard' : 'slow',
    pressingTrigger: tactics.pressing >= 85 ? 'extreme' : tactics.pressing >= 60 ? 'aggressive' : 'standard',
    lineOfEngagement: tactics.defensiveLine >= 85 ? 'much_higher' : tactics.defensiveLine >= 60 ? 'higher' : 'standard',
    passingStyle: tactics.style === 'possession' ? 'short' : tactics.style === 'counter' ? 'direct' : 'mixed',
    passingDirectness: tactics.style === 'counter' ? 'more_direct' : 'standard',
    counterPress: tactics.style === 'gegenpress',
    counterAttack: tactics.style === 'counter',
    offsideTrap: tactics.defensiveLine >= 60,
  };
}
