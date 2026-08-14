import type { PlayerRole } from '../core/types';
import {
  DEFAULT_MATCH_TICK_RATE_HZ,
  MATCH_PROTOCOL_VERSION,
  REGULATION_PITCH,
  validateMatchFrame,
  type MatchActorFrame,
  type MatchFrame,
  type MatchManifest,
  type MatchParticipant,
} from '../protocol';
import {
  SPATIAL_SIMULATION_LIMITS,
  SeededKickoffSimulation,
} from './seeded-kickoff-simulation';
import { calculateOffsideReference } from './offside-reference';

const HOME_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW',
];
const AWAY_ROLES: readonly PlayerRole[] = [
  'GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'AML', 'CAM', 'AMR', 'ST',
];

const player = (teamId: string, role: PlayerRole, index: number): MatchParticipant => ({
  id: `${teamId}-${role.toLowerCase()}-${index + 1}`,
  kind: 'player',
  teamId,
  displayName: `${teamId} ${role}`,
  role,
  shirtNumber: index + 1,
});

const createManifest = (seed = 20260810): MatchManifest => {
  const homePlayers = HOME_ROLES.map((role, index) => player('home', role, index));
  const awayPlayers = AWAY_ROLES.map((role, index) => player('away', role, index));

  return {
    version: MATCH_PROTOCOL_VERSION,
    matchId: 'spatial-fixture-1',
    seed,
    tickRateHz: DEFAULT_MATCH_TICK_RATE_HZ,
    pitch: REGULATION_PITCH,
    home: {
      teamId: 'home',
      formation: '4-3-3',
      attacksPositiveXFirstHalf: true,
      startingPlayerIds: homePlayers.map(entry => entry.id),
    },
    away: {
      teamId: 'away',
      formation: '4-2-3-1',
      attacksPositiveXFirstHalf: false,
      startingPlayerIds: awayPlayers.map(entry => entry.id),
    },
    participants: [
      ...homePlayers,
      ...awayPlayers,
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
};

const planarMagnitude = (vector: { x: number; y: number }): number =>
  Math.hypot(vector.x, vector.y);

const planarDistance = (
  left: { x: number; y: number },
  right: { x: number; y: number },
): number => Math.hypot(left.x - right.x, left.y - right.y);

const actorById = (frame: MatchFrame, id: MatchActorFrame['id']): MatchActorFrame => {
  const actor = frame.actors.find(entry => entry.id === id);
  if (!actor) throw new Error(`Missing actor ${String(id)}`);
  return actor;
};

const maxSpeedFor = (manifest: MatchManifest, actor: MatchActorFrame): number => {
  const participant = manifest.participants.find(entry => entry.id === actor.id);
  if (!participant) throw new Error(`Missing participant ${String(actor.id)}`);
  if (participant.kind === 'referee') return SPATIAL_SIMULATION_LIMITS.refereeMaxSpeedMps;
  if (participant.kind === 'assistant_referee') return SPATIAL_SIMULATION_LIMITS.assistantMaxSpeedMps;
  return participant.role === 'GK'
    ? SPATIAL_SIMULATION_LIMITS.goalkeeperMaxSpeedMps
    : SPATIAL_SIMULATION_LIMITS.outfieldMaxSpeedMps;
};

const maxAccelerationFor = (manifest: MatchManifest, actor: MatchActorFrame): number => {
  const participant = manifest.participants.find(entry => entry.id === actor.id);
  if (!participant) throw new Error(`Missing participant ${String(actor.id)}`);
  if (participant.kind === 'referee') return SPATIAL_SIMULATION_LIMITS.refereeMaxAccelerationMps2;
  if (participant.kind === 'assistant_referee') {
    return SPATIAL_SIMULATION_LIMITS.assistantMaxAccelerationMps2;
  }
  return participant.role === 'GK'
    ? SPATIAL_SIMULATION_LIMITS.goalkeeperMaxAccelerationMps2
    : SPATIAL_SIMULATION_LIMITS.outfieldMaxAccelerationMps2;
};

describe('SeededKickoffSimulation', () => {
  it('emits a deterministic protocol-valid stream with a stable 25-actor topology', () => {
    const manifest = createManifest();
    const first = new SeededKickoffSimulation(manifest).advanceTicks(240);
    const second = new SeededKickoffSimulation(createManifest()).advanceTicks(240);

    expect(first).toEqual(second);
    expect(first).toHaveLength(240);

    first.forEach((frame, index) => {
      expect(frame.tick).toBe(index + 1);
      expect(frame.sequence).toBe(index + 1);
      expect(frame.simTimeMs).toBe((index + 1) * 50);
      expect(frame.actors).toHaveLength(25);
      expect(frame.actors.map(actor => actor.id)).toEqual(
        manifest.participants.map(participant => participant.id),
      );
      expect(validateMatchFrame(frame, manifest)).toEqual([]);
    });
  });

  it('does not consult ambient randomness or wall-clock time', () => {
    const random = jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('ambient randomness is forbidden');
    });
    const now = jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('wall-clock time is forbidden');
    });

    try {
      expect(() => new SeededKickoffSimulation(createManifest()).advanceTicks(120)).not.toThrow();
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
  });

  it('is independent of tick batching and never mutates an emitted frame', () => {
    const batched = new SeededKickoffSimulation(createManifest());
    const individual = new SeededKickoffSimulation(createManifest());
    const firstBatch = batched.advanceTicks(20);
    const oldFrame = firstBatch[firstBatch.length - 1];
    if (!oldFrame) throw new Error('Expected a frame');
    const serializedOldFrame = JSON.stringify(oldFrame);

    const batchedTail = batched.advanceTicks(180);
    const individualFrames = Array.from({ length: 200 }, () => individual.step());

    expect(batchedTail[batchedTail.length - 1]).toEqual(individualFrames[individualFrames.length - 1]);
    expect(JSON.stringify(oldFrame)).toBe(serializedOldFrame);
    expect(individual.getFrame()).toBe(individualFrames[individualFrames.length - 1]);
  });

  it('produces the same goal and event stream one tick at a time or in a batch', () => {
    const batched = new SeededKickoffSimulation(createManifest(20260814));
    const stepped = new SeededKickoffSimulation(createManifest(20260814));
    const batchedFrames = batched.advanceTicks(650);
    const steppedFrames = Array.from({ length: 650 }, () => stepped.step());

    expect(steppedFrames).toEqual(batchedFrames);
    expect(batchedFrames.flatMap(frame => frame.events).some(event => event.type === 'goal')).toBe(true);
    expect(batched.getFrame().score).toEqual({ home: 1, away: 0 });
  });

  it('keeps actors finite, bounded, and within explicit speed, acceleration, and turn limits', () => {
    const manifest = createManifest();
    const simulation = new SeededKickoffSimulation(manifest);
    const frames = [simulation.getFrame(), ...simulation.advanceTicks(240)];
    const deltaSeconds = 1 / manifest.tickRateHz;

    for (let frameIndex = 1; frameIndex < frames.length; frameIndex += 1) {
      const previous = frames[frameIndex - 1];
      const current = frames[frameIndex];

      current.actors.forEach(actor => {
        const participant = manifest.participants.find(entry => entry.id === actor.id);
        if (!participant) throw new Error(`Missing participant ${String(actor.id)}`);
        const previousActor = actorById(previous, actor.id);
        const maximumSpeed = maxSpeedFor(manifest, actor);
        const maximumAcceleration = maxAccelerationFor(manifest, actor);
        const speed = planarMagnitude(actor.velocity);
        const velocityDelta = planarDistance(actor.velocity, previousActor.velocity);
        const displacement = planarDistance(actor.position, previousActor.position);
        const yawDelta = Math.atan2(
          Math.sin(actor.yaw - previousActor.yaw),
          Math.cos(actor.yaw - previousActor.yaw),
        );

        expect(Number.isFinite(actor.position.x)).toBe(true);
        expect(Number.isFinite(actor.position.y)).toBe(true);
        expect(Number.isFinite(actor.yaw)).toBe(true);
        expect(speed).toBeLessThanOrEqual(maximumSpeed + 1e-9);
        expect(velocityDelta).toBeLessThanOrEqual(maximumAcceleration * deltaSeconds + 1e-9);
        expect(displacement).toBeLessThanOrEqual(maximumSpeed * deltaSeconds + 1e-9);
        expect(Math.abs(yawDelta)).toBeLessThanOrEqual(
          SPATIAL_SIMULATION_LIMITS.maxTurnRateRadPerSecond * deltaSeconds + 1e-9,
        );

        if (participant.kind === 'player' || participant.kind === 'referee') {
          expect(actor.position.x).toBeGreaterThanOrEqual(0);
          expect(actor.position.x).toBeLessThanOrEqual(manifest.pitch.lengthM);
          expect(actor.position.y).toBeGreaterThanOrEqual(0);
          expect(actor.position.y).toBeLessThanOrEqual(manifest.pitch.widthM);
          expect(actor.position.z).toBe(0);
        }
      });

      expect(current.ball.position.x).toBeGreaterThanOrEqual(0);
      expect(current.ball.position.x).toBeLessThanOrEqual(manifest.pitch.lengthM);
      expect(current.ball.position.y).toBeGreaterThanOrEqual(0);
      expect(current.ball.position.y).toBeLessThanOrEqual(manifest.pitch.widthM);
      expect(current.ball.position.z).toBeGreaterThanOrEqual(0.11 - 1e-9);
      expect(planarMagnitude(current.ball.velocity)).toBeLessThanOrEqual(
        SPATIAL_SIMULATION_LIMITS.ballMaxSpeedMps,
      );
    }
  });

  it('keeps assistants on their assigned touchlines and the referee operationally close to play', () => {
    const manifest = createManifest();
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(240);

    frames.forEach(frame => {
      const near = actorById(frame, 'assistant-near');
      const far = actorById(frame, 'assistant-far');
      const referee = actorById(frame, 'referee');

      expect(near.position.y).toBeCloseTo(manifest.pitch.widthM + 0.75, 10);
      expect(far.position.y).toBeCloseTo(-0.75, 10);
      expect(Math.abs(near.velocity.y)).toBeLessThan(1e-9);
      expect(Math.abs(far.velocity.y)).toBeLessThan(1e-9);
      expect(planarDistance(referee.position, frame.ball.position)).toBeLessThanOrEqual(30);
      expect(frame.ball.ownerId).not.toBe(near.id);
      expect(frame.ball.ownerId).not.toBe(far.id);
      expect(frame.ball.ownerId).not.toBe(referee.id);
    });
  });

  it('uses one shared authoritative offside-reference calculation', () => {
    const manifest = createManifest();
    const frame = new SeededKickoffSimulation(manifest).getFrame();
    const homeReference = calculateOffsideReference(
      manifest,
      frame.actors,
      frame.ball.position.x,
      manifest.home.teamId,
    );
    const awayReference = calculateOffsideReference(
      manifest,
      frame.actors,
      frame.ball.position.x,
      manifest.away.teamId,
    );

    expect(homeReference).toMatchObject({ x: 24, source: 'second_last_defender' });
    expect(awayReference).toMatchObject({ x: 81, source: 'second_last_defender' });
  });

  it('emits one whistle, kickoff, and two complete pass lifecycles in global event order', () => {
    const manifest = createManifest();
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(240);
    const events = frames.flatMap(frame => frame.events);
    const eventTypes = events.map(event => event.type);

    expect(eventTypes.filter(type => type === 'whistle')).toHaveLength(1);
    expect(eventTypes.filter(type => type === 'kickoff')).toHaveLength(1);
    expect(eventTypes.filter(type => type === 'pass_started')).toHaveLength(2);
    expect(eventTypes.filter(type => type === 'pass_completed')).toHaveLength(2);
    expect(events.map(event => event.sequence)).toEqual(
      Array.from({ length: events.length }, (_, index) => index + 1),
    );
    expect(events.find(event => event.type === 'whistle')?.teamId).toBeUndefined();
    expect(events.find(event => event.type === 'kickoff')?.teamId).toBe(manifest.home.teamId);

    const releasedFrames = frames.filter(frame => frame.ball.ownerId === null);
    expect(releasedFrames.length).toBeGreaterThan(2);
    releasedFrames.forEach(frame => {
      expect(frame.possession.playerId).toBeNull();
      expect(frame.actors.some(actor => actor.hasPossession)).toBe(false);
    });

    const final = frames[frames.length - 1];
    if (!final) throw new Error('Expected a final frame');
    expect(final.ball.ownerId).not.toBeNull();
    expect(final.ball.ownerId).toBe(final.possession.playerId);
    expect(final.actors.filter(actor => actor.hasPossession)).toHaveLength(1);
  });

  it('maintains consistent possession and a controlled owner-to-ball distance every tick', () => {
    const manifest = createManifest();
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(240);

    frames.forEach(frame => {
      const possessingActors = frame.actors.filter(actor => actor.hasPossession);
      if (frame.ball.ownerId === null) {
        expect(possessingActors).toHaveLength(0);
        expect(frame.possession.playerId).toBeNull();
        return;
      }

      expect(possessingActors).toHaveLength(1);
      expect(possessingActors[0].id).toBe(frame.ball.ownerId);
      expect(frame.possession.playerId).toBe(frame.ball.ownerId);
      expect(frame.possession.teamId).toBe('home');
      expect(planarDistance(possessingActors[0].position, frame.ball.position)).toBeLessThan(0.5);
    });
  });

  it('starts from a legal kickoff shape and then produces meaningful coordinated movement', () => {
    const manifest = createManifest();
    const simulation = new SeededKickoffSimulation(manifest);
    const initial = simulation.getFrame();
    const frames = simulation.advanceTicks(240);
    const centre = { x: manifest.pitch.lengthM / 2, y: manifest.pitch.widthM / 2 };
    const initialOwner = initial.ball.ownerId;

    initial.actors.forEach(actor => {
      const participant = manifest.participants.find(entry => entry.id === actor.id);
      if (!participant || participant.kind !== 'player') return;
      if (participant.teamId === 'home' && actor.id !== initialOwner) {
        expect(actor.position.x).toBeLessThanOrEqual(centre.x);
      }
      if (participant.teamId === 'away') {
        expect(planarDistance(actor.position, centre)).toBeGreaterThanOrEqual(9.5 - 1e-9);
      }
    });

    const movedPlayers = manifest.participants
      .filter(participant => participant.kind === 'player')
      .filter(participant => {
        const start = actorById(initial, participant.id).position;
        return frames.some(frame => planarDistance(start, actorById(frame, participant.id).position) > 0.75);
      });
    const refereeStart = actorById(initial, 'referee').position;
    const assistantStarts = ['assistant-near', 'assistant-far'].map(id => actorById(initial, id).position);
    const ballTravel = frames.reduce((distance, frame, index) => {
      const previous = index === 0 ? initial : frames[index - 1];
      return distance + planarDistance(previous.ball.position, frame.ball.position);
    }, 0);

    expect(movedPlayers.length).toBeGreaterThanOrEqual(18);
    expect(ballTravel).toBeGreaterThan(20);
    expect(frames.some(frame => planarDistance(refereeStart, actorById(frame, 'referee').position) > 1)).toBe(true);
    expect(
      frames.some(frame => assistantStarts.some((start, index) =>
        planarDistance(start, actorById(frame, index === 0 ? 'assistant-near' : 'assistant-far').position) > 0.5)),
    ).toBe(true);
    expect(frames.some(frame => frame.actors.some(actor => actor.locomotion !== 'idle'))).toBe(true);
  });

  it('continues into deterministic live decisions, fixed pass flights, and genuine interceptions', () => {
    const manifest = createManifest();
    const first = new SeededKickoffSimulation(manifest).advanceTicks(720);
    const second = new SeededKickoffSimulation(createManifest()).advanceTicks(720);
    const events = first.flatMap(frame => frame.events);

    expect(first).toEqual(second);
    expect(events.filter(event => event.type === 'decision_selected').length).toBeGreaterThanOrEqual(2);
    expect(events.some(event => event.type === 'interception_attempted')).toBe(true);
    expect(events.some(event => event.type === 'interception')).toBe(true);
    expect(events.some(event => event.type === 'possession_changed')).toBe(true);
    expect(first.some(frame => frame.possession.phase === 'contested')).toBe(true);
    expect(first.some(frame => frame.possession.teamId === manifest.away.teamId)).toBe(true);
    const possessionChanges = events
      .filter(event => event.type === 'possession_changed')
      .map(event => event.outcome);
    expect(possessionChanges).toContain('home_to_away');
    expect(possessionChanges).toContain('away_to_home');

    events.filter(event => event.type === 'interception').forEach(interception => {
      expect(interception.decisionId).toBeDefined();
      expect(events.some(event =>
        event.type === 'decision_selected' && event.decisionId === interception.decisionId)).toBe(true);
      expect(events.some(event =>
        event.type === 'pass_started' && event.decisionId === interception.decisionId)).toBe(true);
      const interceptor = manifest.participants.find(
        participant => participant.id === interception.actorIds[0],
      );
      expect(interception.teamId).toBe(interceptor?.teamId);
      const outcomeFrame = first.find(frame =>
        frame.events.some(event => event.sequence === interception.sequence));
      if (!outcomeFrame) throw new Error('Missing interception outcome frame');
      expect(actorById(outcomeFrame, interception.actorIds[0]).intent?.kind).toBe('carry');
      expect(actorById(outcomeFrame, interception.actorIds[2]).intent).toMatchObject({
        kind: 'press',
        targetActorId: interception.actorIds[0],
        reason: 'counterpress_after_turnover',
      });
    });

    const flights = first.filter(frame => frame.ball.flight !== null);
    expect(flights.length).toBeGreaterThan(2);
    const flightTargets = new Map<number, string>();
    flights.forEach(frame => {
      const flight = frame.ball.flight;
      if (!flight) return;
      const serializedTarget = JSON.stringify(flight.targetPosition);
      const existing = flightTargets.get(flight.releasedAtTick);
      if (existing) expect(serializedTarget).toBe(existing);
      else flightTargets.set(flight.releasedAtTick, serializedTarget);
    });
  });

  it('derives shots, goalkeeper actions, and score changes from one causal event chain', () => {
    const manifest = createManifest(20260814);
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(800);
    const events = frames.flatMap(frame => frame.events);
    const goal = events.find(event => event.type === 'goal');
    if (!goal?.decisionId) throw new Error('Expected a deterministic goal decision');

    const chain = events.filter(event => event.decisionId === goal.decisionId);
    expect(chain.map(event => event.type)).toEqual([
      'shot_selected',
      'shot_contact',
      'goalkeeper_reaction',
      'goal_line_crossed',
      'goal',
    ]);
    expect(chain.map(event => event.sequence)).toEqual(
      [...chain.map(event => event.sequence)].sort((left, right) => left - right),
    );
    const crossing = chain[chain.length - 2];
    expect(crossing).toMatchObject({
      type: 'goal_line_crossed',
      outcome: 'valid',
      teamId: goal.teamId,
    });
    expect(goal.outcome).toBe('awarded');
    expect(goal.sequence).toBe((crossing?.sequence ?? 0) + 1);

    const contactFrameIndex = frames.findIndex(frame =>
      frame.events.some(event => event.type === 'shot_contact' && event.decisionId === goal.decisionId));
    const goalFrameIndex = frames.findIndex(frame =>
      frame.events.some(event => event.type === 'goal' && event.decisionId === goal.decisionId));
    expect(contactFrameIndex).toBeGreaterThanOrEqual(0);
    expect(goalFrameIndex).toBeGreaterThan(contactFrameIndex);
    frames.slice(contactFrameIndex, goalFrameIndex).forEach(frame => {
      expect(frame.ball.state).toBe('shot_in_flight');
      expect(frame.ball.ownerId).toBeNull();
      expect(frame.ball.flight).toMatchObject({
        kind: 'shot',
        decisionId: goal.decisionId,
        fromActorId: goal.actorIds[0],
      });
      expect(frame.ball.flight?.intendedTargetActorId).toBeUndefined();
      expect(frame.score).toEqual({ home: 0, away: 0 });
    });

    const goalFrame = frames[goalFrameIndex];
    expect(goalFrame.score).toEqual({ home: 1, away: 0 });
    expect(goalFrame.playState).toBe('dead_ball');
    expect(goalFrame.phase).toBe('stoppage');
    expect(goalFrame.ball).toMatchObject({ state: 'loose', ownerId: null, flight: null });

    let previousScore = { home: 0, away: 0 };
    frames.forEach(frame => {
      const homeDelta = frame.score.home - previousScore.home;
      const awayDelta = frame.score.away - previousScore.away;
      const goalEvents = frame.events.filter(event => event.type === 'goal');
      if (homeDelta !== 0 || awayDelta !== 0) {
        expect(homeDelta + awayDelta).toBe(1);
        expect(goalEvents).toHaveLength(1);
        expect(goalEvents[0].teamId).toBe(
          homeDelta === 1 ? manifest.home.teamId : manifest.away.teamId,
        );
      } else {
        expect(goalEvents).toHaveLength(0);
      }
      previousScore = frame.score;
    });
    expect(events.filter(event => event.type === 'goal')).toHaveLength(
      frames[frames.length - 1].score.home + frames[frames.length - 1].score.away,
    );
  });

  it('lets physical goalkeeper contact end a shot without changing the score', () => {
    const manifest = createManifest(20260810);
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(650);
    const saveFrame = frames.find(frame =>
      frame.events.some(event => event.type === 'shot_saved'));
    if (!saveFrame) throw new Error('Expected a deterministic goalkeeper save');
    const save = saveFrame.events.find(event => event.type === 'shot_saved');
    const goalkeeperId = save?.actorIds[0];

    expect(save).toMatchObject({
      outcome: 'caught',
      teamId: manifest.away.teamId,
    });
    expect(goalkeeperId).toBe('away-gk-1');
    expect(saveFrame.score).toEqual({ home: 0, away: 0 });
    expect(saveFrame.ball).toMatchObject({
      state: 'controlled',
      ownerId: goalkeeperId,
      lastTouchId: goalkeeperId,
      flight: null,
    });
    expect(saveFrame.possession).toMatchObject({
      teamId: manifest.away.teamId,
      playerId: goalkeeperId,
      phase: 'controlled',
    });
  });

  it.each([
    { seed: 1, ticks: 1200, terminalType: 'shot_woodwork', outcome: 'right_post' },
    { seed: 5, ticks: 1400, terminalType: 'shot_missed', outcome: 'wide' },
  ])(
    'resolves seed $seed as $terminalType without manufacturing a goal',
    ({ seed, ticks, terminalType, outcome }) => {
      const manifest = createManifest(seed);
      const frames = new SeededKickoffSimulation(manifest).advanceTicks(ticks);
      const events = frames.flatMap(frame => frame.events);
      const terminal = events.find(event => event.type === terminalType);
      if (!terminal?.decisionId) throw new Error(`Expected ${terminalType}`);
      const chain = events.filter(event => event.decisionId === terminal.decisionId);

      expect(chain.map(event => event.type)).toEqual([
        'shot_selected',
        'shot_contact',
        'goalkeeper_reaction',
        terminalType,
      ]);
      expect(terminal.outcome).toBe(outcome);
      expect(events.some(event =>
        event.type === 'goal' && event.decisionId === terminal.decisionId)).toBe(false);
      const final = frames[frames.length - 1];
      expect(final.score).toEqual({ home: 0, away: 0 });
      expect(final.playState).toBe('dead_ball');
      expect(final.ball).toMatchObject({ state: 'loose', ownerId: null, flight: null });
    },
  );

  it('publishes typed player and official intents plus normalized pressure every frame', () => {
    const manifest = createManifest();
    const frames = new SeededKickoffSimulation(manifest).advanceTicks(360);
    const openPlayFrames = frames.slice(240);

    openPlayFrames.forEach(frame => {
      frame.actors.forEach(actor => {
        const participant = manifest.participants.find(entry => entry.id === actor.id);
        expect(actor.intent).not.toBeNull();
        if (participant?.kind === 'player') {
          expect(actor.pressure).toBeGreaterThanOrEqual(0);
          expect(actor.pressure).toBeLessThanOrEqual(1);
        }
        if (actor.intent?.targetPosition) {
          expect(Number.isFinite(actor.intent.targetPosition.x)).toBe(true);
          expect(Number.isFinite(actor.intent.targetPosition.y)).toBe(true);
        }
      });
    });

    const refereeFrames = openPlayFrames.map(frame => actorById(frame, 'referee'));
    expect(refereeFrames.every(actor => actor.intent?.kind === 'referee_position')).toBe(true);
    expect(refereeFrames.every(actor => actor.intent?.reason === 'referee_diagonal')).toBe(true);
    expect(openPlayFrames.some(frame => frame.actors.some(actor =>
      actor.intent?.kind === 'pass' || actor.intent?.kind === 'receive_pass'))).toBe(true);
    expect(openPlayFrames.some(frame => frame.actors.some(actor =>
      actor.intent?.kind === 'press' || actor.intent?.kind === 'intercept'))).toBe(true);
  });
});
