import type { PlayerRole } from '../core/types';
import {
  DEFAULT_MATCH_TICK_RATE_HZ,
  MATCH_PROTOCOL_VERSION,
  REGULATION_PITCH,
  type MatchFrame,
  type MatchManifest,
  type MatchParticipant,
} from '../protocol';
import { SeededKickoffSimulation } from './seeded-kickoff-simulation';

const HOME_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW',
];
const AWAY_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'AML', 'CAM', 'AMR', 'ST',
];

const createPlayer = (
  teamId: 'home' | 'away',
  role: PlayerRole,
  index: number,
): MatchParticipant => ({
  id: `${teamId}-${role.toLowerCase()}-${index + 1}`,
  kind: 'player',
  teamId,
  displayName: `${teamId} ${role}`,
  role,
  shirtNumber: index + 1,
});

const createManifest = (seed = 20260810): MatchManifest => {
  const homePlayers = HOME_ROLES.map((role, index) => createPlayer('home', role, index));
  const awayPlayers = AWAY_ROLES.map((role, index) => createPlayer('away', role, index));

  return {
    version: MATCH_PROTOCOL_VERSION,
    matchId: 'participant-order-fairness-fixture',
    seed,
    tickRateHz: DEFAULT_MATCH_TICK_RATE_HZ,
    pitch: REGULATION_PITCH,
    home: {
      teamId: 'home',
      formation: '4-3-3',
      attacksPositiveXFirstHalf: true,
      startingPlayerIds: homePlayers.map(player => player.id),
    },
    away: {
      teamId: 'away',
      formation: '4-2-3-1',
      attacksPositiveXFirstHalf: false,
      startingPlayerIds: awayPlayers.map(player => player.id),
    },
    participants: [
      ...homePlayers,
      ...awayPlayers,
      {
        id: 'referee',
        kind: 'referee',
        teamId: null,
        displayName: 'Referee',
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
};

const canonicalEntityId = (id: string | number): string => `${typeof id}:${String(id)}`;

const canonicalizeActorSerializationOrder = (frame: MatchFrame): MatchFrame => ({
  ...frame,
  actors: [...frame.actors].sort((left, right) =>
    canonicalEntityId(left.id).localeCompare(canonicalEntityId(right.id))),
});

const run = (manifest: MatchManifest) => {
  const simulation = new SeededKickoffSimulation(manifest);
  return [simulation.getFrame(), ...simulation.advanceTicks(650)];
};

const fixedShuffle = (
  participants: readonly MatchParticipant[],
): readonly MatchParticipant[] => {
  // 11 and 25 are coprime, so this visits every participant exactly once.
  return participants.map((_, index) => participants[(index * 11 + 7) % participants.length]);
};

const permutations: ReadonlyArray<{
  readonly label: string;
  readonly reorder: (
    participants: readonly MatchParticipant[],
  ) => readonly MatchParticipant[];
}> = [
  {
    label: 'reversed participant serialization',
    reorder: participants => [...participants].reverse(),
  },
  {
    label: 'deterministically shuffled participant serialization',
    reorder: fixedShuffle,
  },
];

describe.each(permutations)('participant-order fairness: $label', ({ reorder }) => {
  let canonicalFrames: readonly MatchFrame[];
  let reorderedFrames: readonly MatchFrame[];

  beforeAll(() => {
    const manifest = createManifest();
    const reorderedManifest: MatchManifest = {
      ...manifest,
      participants: reorder(manifest.participants),
    };

    canonicalFrames = run(manifest);
    reorderedFrames = run(reorderedManifest);
  });

  it('preserves every canonical frame after actor serialization order is normalized', () => {
    expect(reorderedFrames).toHaveLength(canonicalFrames.length);

    canonicalFrames.forEach((frame, index) => {
      expect(canonicalizeActorSerializationOrder(reorderedFrames[index])).toEqual(
        canonicalizeActorSerializationOrder(frame),
      );
    });
  });

  it('preserves the authoritative event stream without event normalization', () => {
    expect(reorderedFrames.flatMap(frame => frame.events)).toEqual(
      canonicalFrames.flatMap(frame => frame.events),
    );
  });
});

it('preserves the complete scoring stream when participant serialization is reversed', () => {
  const manifest = createManifest(20260814);
  const reversed: MatchManifest = {
    ...manifest,
    participants: [...manifest.participants].reverse(),
  };
  const canonicalFrames = run(manifest);
  const reversedFrames = run(reversed);

  expect(canonicalFrames.some(frame => frame.events.some(event => event.type === 'goal'))).toBe(true);
  canonicalFrames.forEach((frame, index) => {
    expect(canonicalizeActorSerializationOrder(reversedFrames[index])).toEqual(
      canonicalizeActorSerializationOrder(frame),
    );
  });
  expect(reversedFrames.flatMap(frame => frame.events)).toEqual(
    canonicalFrames.flatMap(frame => frame.events),
  );
  expect(reversedFrames[reversedFrames.length - 1].score).toEqual({ home: 1, away: 0 });
});

/**
 * A full-stream pitch-mirror/team-swap assertion is intentionally omitted.
 * This spatial slice always awards kickoff and initial possession to `home`,
 * while manifests may give the two sides different formations. The public
 * protocol also does not define the actor/team-ID remapping that a mirrored
 * comparison would need. A simple swap would therefore change gameplay inputs
 * rather than express a sound symmetry invariant. Direction-neutral geometry
 * is covered independently in football-intelligence.test.ts.
 */
