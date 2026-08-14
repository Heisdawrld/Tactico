import {
  DEFAULT_MATCH_TICK_RATE_HZ,
  MATCH_PROTOCOL_VERSION,
  REGULATION_PITCH,
  assertValidMatchFrame,
  assertValidMatchManifest,
  toNormalizedPitchPosition,
  validateMatchFrame,
  validateMatchManifest,
  type MatchActorFrame,
  type MatchFrame,
  type MatchManifest,
  type MatchParticipant,
} from './match-frame';

const participant = (
  id: string,
  teamId: string,
  role: MatchParticipant['role'],
): MatchParticipant => ({
  id,
  kind: 'player',
  teamId,
  displayName: id,
  role,
});

const manifest: MatchManifest = {
  version: MATCH_PROTOCOL_VERSION,
  matchId: 'fixture-1',
  seed: 20260810,
  tickRateHz: DEFAULT_MATCH_TICK_RATE_HZ,
  pitch: REGULATION_PITCH,
  home: {
    teamId: 'home',
    formation: '4-3-3',
    attacksPositiveXFirstHalf: true,
    startingPlayerIds: Array.from({ length: 11 }, (_, index) => `home-${index + 1}`),
  },
  away: {
    teamId: 'away',
    formation: '4-2-3-1',
    attacksPositiveXFirstHalf: false,
    startingPlayerIds: Array.from({ length: 11 }, (_, index) => `away-${index + 1}`),
  },
  participants: [
    ...Array.from({ length: 11 }, (_, index) =>
      participant(`home-${index + 1}`, 'home', index === 0 ? 'GK' : 'CM')),
    ...Array.from({ length: 11 }, (_, index) =>
      participant(`away-${index + 1}`, 'away', index === 0 ? 'GK' : 'CM')),
    { id: 'referee', kind: 'referee', teamId: null, displayName: 'Referee', role: 'referee' },
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

const actor = (id: string, x: number, y: number): MatchActorFrame => ({
  id,
  onField: true,
  position: { x, y, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: 0,
  locomotion: 'idle',
  action: null,
});

const frame: MatchFrame = {
  version: MATCH_PROTOCOL_VERSION,
  matchId: manifest.matchId,
  sequence: 1,
  tick: 1,
  simTimeMs: 50,
  period: 'first_half',
  playState: 'running',
  phase: 'kickoff',
  score: { home: 0, away: 0 },
  possession: {
    teamId: 'home',
    playerId: 'home-9',
    phase: 'controlled',
    sinceTick: 0,
  },
  actors: manifest.participants.map((entry, index) => ({
    ...actor(String(entry.id), index * 2, 34),
    hasPossession: entry.id === 'home-9',
  })),
  ball: {
    position: { x: 52.5, y: 34, z: 0.11 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    state: 'controlled',
    ownerId: 'home-9',
    lastTouchId: 'home-9',
    flight: null,
  },
  events: [],
};

describe('match frame protocol', () => {
  it('accepts a valid 22-player and three-official manifest and frame', () => {
    expect(() => assertValidMatchManifest(manifest)).not.toThrow();
    expect(() => assertValidMatchFrame(frame, manifest)).not.toThrow();
    expect(frame.actors).toHaveLength(25);
  });

  it('rejects non-finite actor transforms', () => {
    const invalid: MatchFrame = {
      ...frame,
      actors: [{ ...frame.actors[0], position: { x: Number.NaN, y: 34, z: 0 } }],
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'actors[0].position',
      message: 'all components must be finite',
    });
  });

  it('rejects actors that are absent from the manifest', () => {
    const invalid: MatchFrame = {
      ...frame,
      actors: [...frame.actors, actor('unknown-player', 10, 10)],
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'actors[25].id',
      message: 'must exist in the match manifest',
    });
  });

  it('normalizes canonical metre coordinates for a 2D renderer', () => {
    expect(toNormalizedPitchPosition({ x: 52.5, y: 34, z: 1.5 })).toEqual({
      x: 0.5,
      y: 0.5,
      z: 1.5,
    });
  });

  it('rejects a starting XI with duplicate or foreign player ids', () => {
    const invalid: MatchManifest = {
      ...manifest,
      home: {
        ...manifest.home,
        startingPlayerIds: [
          ...manifest.home.startingPlayerIds.slice(0, 10),
          manifest.away.startingPlayerIds[0],
        ],
      },
    };

    expect(() => assertValidMatchManifest(invalid)).toThrow(
      'home.startingPlayerIds[10] must identify a player belonging to this team',
    );
  });

  it('rejects teams attacking in the same first-half direction', () => {
    const invalid: MatchManifest = {
      ...manifest,
      away: {
        ...manifest.away,
        attacksPositiveXFirstHalf: manifest.home.attacksPositiveXFirstHalf,
      },
    };

    expect(validateMatchManifest(invalid)).toContainEqual({
      path: 'away.attacksPositiveXFirstHalf',
      message: 'must oppose the home team attack direction',
    });
  });

  it('rejects an event attributed to a non-competing team', () => {
    const invalid: MatchFrame = {
      ...frame,
      events: [{
        sequence: 1,
        type: 'shot_attempted',
        simTimeMs: frame.simTimeMs,
        teamId: 'third-team',
        actorIds: ['home-9'],
      }],
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'events[0].teamId',
      message: 'must identify a competing team',
    });
  });

  it('rejects event actors that are absent from the manifest', () => {
    const invalid: MatchFrame = {
      ...frame,
      events: [{
        sequence: 1,
        type: 'duel_resolved',
        simTimeMs: frame.simTimeMs,
        teamId: manifest.home.teamId,
        actorIds: ['home-9', 'unknown-actor'],
      }],
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'events[0].actorIds[1]',
      message: 'must exist in the match manifest',
    });
  });

  it('rejects contradictory controlled-possession and ball-flight state', () => {
    const invalid: MatchFrame = {
      ...frame,
      possession: {
        teamId: 'home',
        playerId: null,
        phase: 'controlled',
        sinceTick: 1,
      },
      actors: frame.actors.map(entry => ({ ...entry, hasPossession: false })),
      ball: {
        ...frame.ball,
        state: 'pass_in_flight',
        ownerId: null,
        flight: {
          kind: 'pass',
          fromActorId: 'home-9',
          intendedTargetActorId: 'home-10',
          targetPosition: { x: 58, y: 34, z: 0.11 },
          releasedAtTick: 1,
          expectedArrivalTick: 10,
        },
      },
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'possession.phase',
      message: 'must agree with the controlled ball state',
    });
  });

  it('rejects a pass flight aimed at an opponent', () => {
    const invalid: MatchFrame = {
      ...frame,
      possession: {
        teamId: 'home',
        playerId: null,
        phase: 'pass_in_flight',
        sinceTick: 1,
      },
      actors: frame.actors.map(entry => ({ ...entry, hasPossession: false })),
      ball: {
        ...frame.ball,
        state: 'pass_in_flight',
        ownerId: null,
        flight: {
          kind: 'pass',
          fromActorId: 'home-9',
          intendedTargetActorId: 'away-9',
          targetPosition: { x: 58, y: 34, z: 0.11 },
          releasedAtTick: 1,
          expectedArrivalTick: 10,
        },
      },
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'ball.flight.intendedTargetActorId',
      message: 'must identify a teammate of the flight source',
    });
  });

  it('accepts a renderer-neutral shot flight without inventing a receiver', () => {
    const shotFrame: MatchFrame = {
      ...frame,
      possession: {
        teamId: 'home',
        playerId: null,
        phase: 'shot_in_flight',
        sinceTick: 1,
      },
      actors: frame.actors.map(entry => ({ ...entry, hasPossession: false })),
      ball: {
        ...frame.ball,
        state: 'shot_in_flight',
        ownerId: null,
        flight: {
          kind: 'shot',
          fromActorId: 'home-9',
          targetPosition: { x: manifest.pitch.lengthM, y: 34, z: 1.1 },
          releasedAtTick: 1,
          expectedArrivalTick: 24,
        },
      },
    };

    expect(validateMatchFrame(shotFrame, manifest)).toEqual([]);
  });

  it('rejects a shot payload disguised as a pass flight', () => {
    const invalid: MatchFrame = {
      ...frame,
      possession: {
        teamId: 'home',
        playerId: null,
        phase: 'pass_in_flight',
        sinceTick: 1,
      },
      actors: frame.actors.map(entry => ({ ...entry, hasPossession: false })),
      ball: {
        ...frame.ball,
        state: 'pass_in_flight',
        ownerId: null,
        flight: {
          kind: 'shot',
          fromActorId: 'home-9',
          targetPosition: { x: manifest.pitch.lengthM, y: 34, z: 1.1 },
          releasedAtTick: 1,
          expectedArrivalTick: 24,
        },
      },
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'ball.flight.kind',
      message: 'must not be shot during a pass flight',
    });
  });

  it('rejects an invalid decision correlation on an active shot flight', () => {
    const invalid: MatchFrame = {
      ...frame,
      possession: {
        teamId: 'home',
        playerId: null,
        phase: 'shot_in_flight',
        sinceTick: 1,
      },
      actors: frame.actors.map(entry => ({ ...entry, hasPossession: false })),
      ball: {
        ...frame.ball,
        state: 'shot_in_flight',
        ownerId: null,
        flight: {
          kind: 'shot',
          decisionId: 0,
          fromActorId: 'home-9',
          targetPosition: { x: manifest.pitch.lengthM, y: 34, z: 1.1 },
          releasedAtTick: 1,
        },
      },
    };

    expect(validateMatchFrame(invalid, manifest)).toContainEqual({
      path: 'ball.flight.decisionId',
      message: 'must be a positive safe integer',
    });
  });
});
