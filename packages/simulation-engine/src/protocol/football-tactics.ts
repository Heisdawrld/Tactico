/** Saved football inputs. All ratings and sliders use 0..100, never renderer state. */
export type RoleDuty = 'defend' | 'support' | 'attack';
export type WideMovement = 'hold_width' | 'cut_inside' | 'overlap' | 'underlap';

export interface FootballAttributes {
  readonly pace: number;
  readonly acceleration: number;
  readonly endurance: number;
  readonly passing: number;
  readonly finishing: number;
  readonly technique: number;
  readonly composure: number;
  readonly anticipation: number;
  readonly reflexes: number;
  readonly agility: number;
  readonly handling: number;
}

export interface RoleInstructions {
  readonly duty?: RoleDuty;
  readonly wideMovement?: WideMovement;
  readonly holdPosition?: boolean;
}

export interface FootballTactics {
  readonly width: number;
  readonly defensiveLine: number;
  readonly pressing: number;
  readonly tempo: number;
  readonly directness: number;
  readonly counterpress: boolean;
  readonly counterattack: boolean;
}

export const DEFAULT_FOOTBALL_TACTICS: Readonly<FootballTactics> = Object.freeze({
  width: 50, defensiveLine: 50, pressing: 50, tempo: 50, directness: 50,
  counterpress: false, counterattack: false,
});

export const DEFAULT_FOOTBALL_ATTRIBUTES: Readonly<FootballAttributes> = Object.freeze({
  pace: 65, acceleration: 65, endurance: 65, passing: 65, finishing: 60,
  technique: 65, composure: 65, anticipation: 65, reflexes: 65, agility: 65, handling: 65,
});

export type FootballPhase = 'build_up' | 'progression' | 'final_third' |
  'positive_transition' | 'negative_transition' | 'high_block' | 'mid_block' | 'low_block';

export interface FootballDecisionTrace {
  readonly phase: FootballPhase;
  readonly duty: RoleDuty;
  readonly responsibility: 'goalkeeper' | 'first_presser' | 'press_cover' |
    'screen' | 'rest_defence' | 'support' | 'run' | 'block';
  readonly reason: string;
  readonly forwardRunAllowed: boolean;
  readonly evaluatedAtTick: number;
}
