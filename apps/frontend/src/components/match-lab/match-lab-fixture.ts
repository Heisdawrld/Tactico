import type { PlayerRole } from '@tactico/simulation-engine/protocol';
import {
  DEFAULT_MATCH_TICK_RATE_HZ,
  MATCH_PROTOCOL_VERSION,
  REGULATION_PITCH,
  DEFAULT_FOOTBALL_TACTICS,
  DEFAULT_FOOTBALL_ATTRIBUTES,
  type MatchManifest,
  type MatchParticipant,
} from '@tactico/simulation-engine/protocol';

export const MATCH_LAB_STABLE_END_TICK = 720;
export const MATCH_LAB_END_TICK = 800;
export const MATCH_LAB_SEED = 20260814;

const HOME_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW',
];
const AWAY_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'AML', 'CAM', 'AMR', 'ST',
];

const HOME_NAMES = [
  'A. Stone', 'L. Vale', 'M. Okoro', 'T. Reed', 'J. Cole', 'D. Adebayo',
  'S. Mensah', 'K. Hart', 'N. Ibe', 'R. King', 'E. Blake',
] as const;
const AWAY_NAMES = [
  'L. Costa', 'I. Silva', 'P. Duarte', 'A. Mendez', 'R. Soto', 'M. Cruz',
  'J. Vega', 'T. Rios', 'C. Luna', 'F. Navarro', 'D. Santos',
] as const;

const createPlayer = (
  teamId: 'home' | 'away',
  role: PlayerRole,
  name: string,
  index: number,
): MatchParticipant => ({
  id: `${teamId}-${role.toLowerCase()}-${index + 1}`,
  kind: 'player',
  teamId,
  displayName: name,
  role,
  shirtNumber: index + 1,
  attributes: {
    ...DEFAULT_FOOTBALL_ATTRIBUTES,
    pace: role === 'GK' ? 48 : 58 + (index * 7) % 32,
    acceleration: 55 + (index * 11) % 35,
    endurance: 60 + (index * 3) % 30,
    passing: ['CDM', 'LCM', 'RCM', 'LDM', 'RDM', 'CAM'].includes(role) ? 82 : 65,
    finishing: role === 'ST' ? 84 : ['LW', 'RW', 'AML', 'AMR'].includes(role) ? 76 : 48,
  },
});

export function createMatchLabManifest(seed = MATCH_LAB_SEED): MatchManifest {
  const homePlayers = HOME_ROLES.map((role, index) =>
    createPlayer('home', role, HOME_NAMES[index], index));
  const awayPlayers = AWAY_ROLES.map((role, index) =>
    createPlayer('away', role, AWAY_NAMES[index], index));

  return {
    version: MATCH_PROTOCOL_VERSION,
    matchId: 'match-lab-causal-scoring-v1',
    seed,
    tickRateHz: DEFAULT_MATCH_TICK_RATE_HZ,
    pitch: REGULATION_PITCH,
    home: {
      teamId: 'home',
      formation: '4-3-3',
      attacksPositiveXFirstHalf: true,
      startingPlayerIds: homePlayers.map(player => player.id),
      tactics: { ...DEFAULT_FOOTBALL_TACTICS, width: 65, pressing: 65, tempo: 60 },
    },
    away: {
      teamId: 'away',
      formation: '4-2-3-1',
      attacksPositiveXFirstHalf: false,
      startingPlayerIds: awayPlayers.map(player => player.id),
      tactics: { ...DEFAULT_FOOTBALL_TACTICS, defensiveLine: 35, pressing: 35, directness: 70, counterattack: true },
    },
    participants: [
      ...homePlayers,
      ...awayPlayers,
      {
        id: 'referee',
        kind: 'referee',
        teamId: null,
        displayName: 'Central Referee',
        role: 'referee',
      },
      {
        id: 'assistant-near',
        kind: 'assistant_referee',
        teamId: null,
        displayName: 'Near Assistant',
        role: 'assistant_near',
      },
      {
        id: 'assistant-far',
        kind: 'assistant_referee',
        teamId: null,
        displayName: 'Far Assistant',
        role: 'assistant_far',
      },
    ],
  };
}
