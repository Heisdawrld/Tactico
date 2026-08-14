import type { EntityId, Formation, PlayerRole } from '../core/types';

/**
 * Renderer-neutral protocol shared by the headless simulation, desktop 3D,
 * mobile 2D, replays, and match tests.
 *
 * Coordinate system (metres):
 * - x: goal line to goal line, 0..pitch.lengthM
 * - y: touchline to touchline, 0..pitch.widthM
 * - z: height above the pitch
 * - yaw: radians on the pitch plane, with 0 facing +x
 */

export const MATCH_PROTOCOL_VERSION = 1 as const;
export const DEFAULT_MATCH_TICK_RATE_HZ = 20 as const;
export const REGULATION_PITCH = Object.freeze({ lengthM: 105, widthM: 68 });

export type MatchProtocolVersion = typeof MATCH_PROTOCOL_VERSION;

export interface MatchVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface MatchPitchDimensions {
  readonly lengthM: number;
  readonly widthM: number;
}

export type MatchActorKind =
  | 'player'
  | 'referee'
  | 'assistant_referee'
  | 'fourth_official';

export type MatchOfficialRole =
  | 'referee'
  | 'assistant_near'
  | 'assistant_far'
  | 'fourth_official';

export interface MatchParticipant {
  readonly id: EntityId;
  readonly kind: MatchActorKind;
  readonly teamId: EntityId | null;
  readonly displayName: string;
  readonly role: PlayerRole | MatchOfficialRole;
  readonly shirtNumber?: number;
}

export interface MatchTeamManifest {
  readonly teamId: EntityId;
  readonly formation: Formation | string;
  readonly attacksPositiveXFirstHalf: boolean;
  /** Ordered matchday XI; substitutes belong in a later squad/bench manifest. */
  readonly startingPlayerIds: readonly EntityId[];
}

export interface MatchManifest {
  readonly version: MatchProtocolVersion;
  readonly matchId: EntityId;
  readonly seed: number;
  readonly tickRateHz: number;
  readonly pitch: MatchPitchDimensions;
  readonly home: MatchTeamManifest;
  readonly away: MatchTeamManifest;
  readonly participants: readonly MatchParticipant[];
}

export type MatchPeriod =
  | 'pre_match'
  | 'first_half'
  | 'half_time'
  | 'second_half'
  | 'extra_time'
  | 'penalties'
  | 'full_time';

export type MatchPlayState = 'ready' | 'running' | 'paused' | 'dead_ball' | 'finished';

export type MatchFlowPhase =
  | 'kickoff'
  | 'build_up'
  | 'progression'
  | 'final_third'
  | 'transition'
  | 'set_piece'
  | 'stoppage';

export type MatchLocomotion =
  | 'idle'
  | 'walk'
  | 'jog'
  | 'run'
  | 'sprint'
  | 'backpedal';

export type MatchActionKind =
  | 'receive'
  | 'carry'
  | 'pass'
  | 'cross'
  | 'shoot'
  | 'header'
  | 'intercept'
  | 'tackle'
  | 'block'
  | 'save'
  | 'fall'
  | 'celebrate'
  | 'whistle'
  | 'signal_advantage'
  | 'show_yellow_card'
  | 'show_red_card'
  | 'raise_flag'
  | 'substitution_board';

export interface MatchActorAction {
  readonly kind: MatchActionKind;
  readonly startedAtMs: number;
  readonly impactAtMs?: number;
  readonly targetActorId?: EntityId;
}

export type MatchIntentKind =
  | 'hold_shape'
  | 'support'
  | 'offer_width'
  | 'cover'
  | 'press'
  | 'track_runner'
  | 'carry'
  | 'pass'
  | 'shoot'
  | 'receive_pass'
  | 'intercept'
  | 'goalkeeper_set'
  | 'goalkeeper_save'
  | 'celebrate'
  | 'referee_position'
  | 'offside_line';

/**
 * Authoritative movement/decision intent emitted by the simulation.
 *
 * Renderers may visualize this data, but must never infer or replace it. The
 * reason is a stable machine-readable code rather than presentation copy.
 */
export interface MatchActorIntent {
  readonly kind: MatchIntentKind;
  readonly decisionId?: number;
  readonly sinceTick: number;
  readonly urgency: number;
  readonly reason: string;
  readonly targetPosition?: MatchVector3;
  readonly targetActorId?: EntityId;
}

export interface MatchActorFrame {
  readonly id: EntityId;
  readonly onField: boolean;
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
  readonly yaw: number;
  readonly locomotion: MatchLocomotion;
  readonly action: MatchActorAction | null;
  readonly stamina?: number;
  readonly hasPossession?: boolean;
  readonly intent?: MatchActorIntent | null;
  /** Normalized local opponent pressure, from 0 (free) to 1 (immediate). */
  readonly pressure?: number;
  /** @deprecated Prefer intent.targetActorId for renderer-neutral semantics. */
  readonly targetActorId?: EntityId;
}

export type MatchPossessionPhase =
  | 'controlled'
  | 'pass_in_flight'
  | 'shot_in_flight'
  | 'contested'
  | 'unclaimed';

export type MatchBallState =
  | 'controlled'
  | 'pass_in_flight'
  | 'shot_in_flight'
  | 'contested'
  | 'loose';

export interface MatchBallFlight {
  readonly kind: 'pass' | 'cross' | 'shot' | 'clearance';
  /** Stable decision correlation shared with intents and event deltas. */
  readonly decisionId?: number;
  readonly fromActorId: EntityId;
  readonly intendedTargetActorId?: EntityId;
  readonly targetPosition: MatchVector3;
  readonly releasedAtTick: number;
  readonly expectedArrivalTick?: number;
}

export interface MatchBallFrame {
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
  readonly angularVelocity: MatchVector3;
  readonly state: MatchBallState;
  readonly ownerId: EntityId | null;
  readonly lastTouchId: EntityId | null;
  readonly flight: MatchBallFlight | null;
}

export interface MatchEventDelta {
  readonly sequence: number;
  readonly decisionId?: number;
  readonly type: string;
  readonly simTimeMs: number;
  readonly teamId?: EntityId;
  readonly actorIds: readonly EntityId[];
  readonly location?: MatchVector3;
  readonly outcome?: string;
}

export interface MatchFrame {
  readonly version: MatchProtocolVersion;
  readonly matchId: EntityId;
  readonly sequence: number;
  readonly tick: number;
  readonly simTimeMs: number;
  readonly period: MatchPeriod;
  readonly playState: MatchPlayState;
  readonly phase: MatchFlowPhase;
  readonly score: {
    readonly home: number;
    readonly away: number;
  };
  readonly possession: {
    readonly teamId: EntityId | null;
    readonly playerId: EntityId | null;
    readonly phase: MatchPossessionPhase;
    readonly sinceTick: number;
  };
  readonly actors: readonly MatchActorFrame[];
  readonly ball: MatchBallFrame;
  /** Events produced since the preceding frame. */
  readonly events: readonly MatchEventDelta[];
}

export interface MatchProtocolIssue {
  readonly path: string;
  readonly message: string;
}

const isEntityId = (value: unknown): value is EntityId =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim().length > 0);

const isFiniteVector = (value: MatchVector3): boolean =>
  Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);

const pushFiniteNumberIssue = (
  issues: MatchProtocolIssue[],
  path: string,
  value: number,
): void => {
  if (!Number.isFinite(value)) issues.push({ path, message: 'must be a finite number' });
};

export function validateMatchManifest(manifest: MatchManifest): MatchProtocolIssue[] {
  const issues: MatchProtocolIssue[] = [];

  if (manifest.version !== MATCH_PROTOCOL_VERSION) {
    issues.push({ path: 'version', message: `must equal ${MATCH_PROTOCOL_VERSION}` });
  }
  if (!isEntityId(manifest.matchId)) {
    issues.push({ path: 'matchId', message: 'must be a non-empty string or finite number' });
  }
  if (!Number.isSafeInteger(manifest.seed) || manifest.seed < 0) {
    issues.push({ path: 'seed', message: 'must be a non-negative safe integer' });
  }
  if (!Number.isFinite(manifest.tickRateHz) || manifest.tickRateHz <= 0) {
    issues.push({ path: 'tickRateHz', message: 'must be greater than zero' });
  }
  if (!Number.isFinite(manifest.pitch.lengthM) || manifest.pitch.lengthM <= 0) {
    issues.push({ path: 'pitch.lengthM', message: 'must be greater than zero' });
  }
  if (!Number.isFinite(manifest.pitch.widthM) || manifest.pitch.widthM <= 0) {
    issues.push({ path: 'pitch.widthM', message: 'must be greater than zero' });
  }
  if (!isEntityId(manifest.home.teamId)) {
    issues.push({ path: 'home.teamId', message: 'must be a valid entity id' });
  }
  if (!isEntityId(manifest.away.teamId)) {
    issues.push({ path: 'away.teamId', message: 'must be a valid entity id' });
  }
  if (manifest.home.teamId === manifest.away.teamId) {
    issues.push({ path: 'away.teamId', message: 'must differ from the home team id' });
  }
  if (manifest.home.attacksPositiveXFirstHalf === manifest.away.attacksPositiveXFirstHalf) {
    issues.push({
      path: 'away.attacksPositiveXFirstHalf',
      message: 'must oppose the home team attack direction',
    });
  }

  const participantIds = new Set<EntityId>();
  manifest.participants.forEach((participant, index) => {
    const path = `participants[${index}]`;
    if (!isEntityId(participant.id)) {
      issues.push({ path: `${path}.id`, message: 'must be a valid entity id' });
    } else if (participantIds.has(participant.id)) {
      issues.push({ path: `${path}.id`, message: 'must be unique' });
    } else {
      participantIds.add(participant.id);
    }

    if (!participant.displayName.trim()) {
      issues.push({ path: `${path}.displayName`, message: 'must not be empty' });
    }
    if (participant.kind === 'player' && participant.teamId === null) {
      issues.push({ path: `${path}.teamId`, message: 'players must belong to a team' });
    }
    if (participant.kind !== 'player' && participant.teamId !== null) {
      issues.push({ path: `${path}.teamId`, message: 'officials must be neutral' });
    }
  });

  const participantsById = new Map(
    manifest.participants.map(participant => [participant.id, participant]),
  );
  ([['home', manifest.home], ['away', manifest.away]] as const).forEach(([label, team]) => {
    const startingPlayerIds = Array.isArray(team.startingPlayerIds)
      ? team.startingPlayerIds
      : [];
    if (!Array.isArray(team.startingPlayerIds)) {
      issues.push({ path: `${label}.startingPlayerIds`, message: 'must be an array' });
    }
    const uniqueIds = new Set(startingPlayerIds);
    if (startingPlayerIds.length !== 11) {
      issues.push({ path: `${label}.startingPlayerIds`, message: 'must contain exactly 11 ids' });
    }
    if (uniqueIds.size !== startingPlayerIds.length) {
      issues.push({ path: `${label}.startingPlayerIds`, message: 'must not contain duplicate ids' });
    }
    startingPlayerIds.forEach((playerId, index) => {
      const participant = participantsById.get(playerId);
      if (!participant || participant.kind !== 'player' || participant.teamId !== team.teamId) {
        issues.push({
          path: `${label}.startingPlayerIds[${index}]`,
          message: 'must identify a player belonging to this team',
        });
      }
    });
  });

  return issues;
}

export function validateMatchFrame(
  frame: MatchFrame,
  manifest?: MatchManifest,
): MatchProtocolIssue[] {
  const issues: MatchProtocolIssue[] = [];

  if (frame.version !== MATCH_PROTOCOL_VERSION) {
    issues.push({ path: 'version', message: `must equal ${MATCH_PROTOCOL_VERSION}` });
  }
  if (!isEntityId(frame.matchId)) {
    issues.push({ path: 'matchId', message: 'must be a non-empty string or finite number' });
  }
  if (!Number.isSafeInteger(frame.sequence) || frame.sequence < 0) {
    issues.push({ path: 'sequence', message: 'must be a non-negative safe integer' });
  }
  if (!Number.isSafeInteger(frame.tick) || frame.tick < 0) {
    issues.push({ path: 'tick', message: 'must be a non-negative safe integer' });
  }
  if (!Number.isFinite(frame.simTimeMs) || frame.simTimeMs < 0) {
    issues.push({ path: 'simTimeMs', message: 'must be a non-negative finite number' });
  }
  if (!Number.isSafeInteger(frame.score.home) || frame.score.home < 0) {
    issues.push({ path: 'score.home', message: 'must be a non-negative integer' });
  }
  if (!Number.isSafeInteger(frame.score.away) || frame.score.away < 0) {
    issues.push({ path: 'score.away', message: 'must be a non-negative integer' });
  }

  const participantIds = manifest
    ? new Set(manifest.participants.map(participant => participant.id))
    : null;
  const actorIds = new Set<EntityId>();

  frame.actors.forEach((actor, index) => {
    const path = `actors[${index}]`;
    if (!isEntityId(actor.id)) {
      issues.push({ path: `${path}.id`, message: 'must be a valid entity id' });
    } else if (actorIds.has(actor.id)) {
      issues.push({ path: `${path}.id`, message: 'must be unique within a frame' });
    } else {
      actorIds.add(actor.id);
    }

    if (participantIds && !participantIds.has(actor.id)) {
      issues.push({ path: `${path}.id`, message: 'must exist in the match manifest' });
    }
    if (!isFiniteVector(actor.position)) {
      issues.push({ path: `${path}.position`, message: 'all components must be finite' });
    }
    if (!isFiniteVector(actor.velocity)) {
      issues.push({ path: `${path}.velocity`, message: 'all components must be finite' });
    }
    pushFiniteNumberIssue(issues, `${path}.yaw`, actor.yaw);
    if (actor.stamina !== undefined &&
        (!Number.isFinite(actor.stamina) || actor.stamina < 0 || actor.stamina > 100)) {
      issues.push({ path: `${path}.stamina`, message: 'must be between 0 and 100' });
    }
    if (actor.pressure !== undefined &&
        (!Number.isFinite(actor.pressure) || actor.pressure < 0 || actor.pressure > 1)) {
      issues.push({ path: `${path}.pressure`, message: 'must be between 0 and 1' });
    }
    if (actor.intent) {
      if (actor.intent.decisionId !== undefined &&
          (!Number.isSafeInteger(actor.intent.decisionId) || actor.intent.decisionId <= 0)) {
        issues.push({
          path: `${path}.intent.decisionId`,
          message: 'must be a positive safe integer',
        });
      }
      if (!Number.isSafeInteger(actor.intent.sinceTick) ||
          actor.intent.sinceTick < 0 || actor.intent.sinceTick > frame.tick) {
        issues.push({
          path: `${path}.intent.sinceTick`,
          message: 'must be a non-negative safe integer no greater than the frame tick',
        });
      }
      if (!Number.isFinite(actor.intent.urgency) ||
          actor.intent.urgency < 0 || actor.intent.urgency > 1) {
        issues.push({ path: `${path}.intent.urgency`, message: 'must be between 0 and 1' });
      }
      if (!actor.intent.reason.trim()) {
        issues.push({ path: `${path}.intent.reason`, message: 'must not be empty' });
      }
      if (actor.intent.targetPosition && !isFiniteVector(actor.intent.targetPosition)) {
        issues.push({
          path: `${path}.intent.targetPosition`,
          message: 'all components must be finite',
        });
      }
    }
    if (actor.action) {
      if (!Number.isFinite(actor.action.startedAtMs) || actor.action.startedAtMs < 0) {
        issues.push({ path: `${path}.action.startedAtMs`, message: 'must be non-negative' });
      }
      if (actor.action.impactAtMs !== undefined &&
          actor.action.impactAtMs < actor.action.startedAtMs) {
        issues.push({
          path: `${path}.action.impactAtMs`,
          message: 'must not precede the action start',
        });
      }
    }
  });

  if (!isFiniteVector(frame.ball.position)) {
    issues.push({ path: 'ball.position', message: 'all components must be finite' });
  }
  if (!isFiniteVector(frame.ball.velocity)) {
    issues.push({ path: 'ball.velocity', message: 'all components must be finite' });
  }
  if (!isFiniteVector(frame.ball.angularVelocity)) {
    issues.push({ path: 'ball.angularVelocity', message: 'all components must be finite' });
  }
  if (frame.ball.position.z < 0) {
    issues.push({ path: 'ball.position.z', message: 'must not be below the pitch' });
  }
  if (frame.ball.state === 'controlled' && frame.ball.ownerId === null) {
    issues.push({ path: 'ball.ownerId', message: 'must be set while the ball is controlled' });
  }
  if (frame.ball.state !== 'controlled' && frame.ball.ownerId !== null) {
    issues.push({ path: 'ball.ownerId', message: 'must be null while the ball is not controlled' });
  }
  const ballIsInFlight = frame.ball.state === 'pass_in_flight' ||
    frame.ball.state === 'shot_in_flight';
  if (ballIsInFlight && frame.ball.flight === null) {
    issues.push({ path: 'ball.flight', message: 'must be set while the ball is in flight' });
  }
  if (!ballIsInFlight && frame.ball.flight !== null) {
    issues.push({ path: 'ball.flight', message: 'must be null outside an active ball flight' });
  }
  if (frame.ball.state === 'pass_in_flight' && frame.ball.flight?.kind === 'shot') {
    issues.push({ path: 'ball.flight.kind', message: 'must not be shot during a pass flight' });
  }
  if (frame.ball.state === 'shot_in_flight' && frame.ball.flight?.kind !== 'shot') {
    issues.push({ path: 'ball.flight.kind', message: 'must be shot during a shot flight' });
  }
  if (frame.possession.phase === 'controlled' && frame.ball.state !== 'controlled') {
    issues.push({ path: 'possession.phase', message: 'must agree with the controlled ball state' });
  }
  if (frame.possession.phase === 'pass_in_flight' && frame.ball.state !== 'pass_in_flight') {
    issues.push({ path: 'possession.phase', message: 'must agree with the in-flight ball state' });
  }
  if (frame.possession.phase === 'shot_in_flight' && frame.ball.state !== 'shot_in_flight') {
    issues.push({ path: 'possession.phase', message: 'must agree with the shot-flight ball state' });
  }
  if (!Number.isSafeInteger(frame.possession.sinceTick) ||
      frame.possession.sinceTick < 0 || frame.possession.sinceTick > frame.tick) {
    issues.push({
      path: 'possession.sinceTick',
      message: 'must be a non-negative safe integer no greater than the frame tick',
    });
  }

  if (manifest) {
    if (frame.matchId !== manifest.matchId) {
      issues.push({ path: 'matchId', message: 'must match the manifest matchId' });
    }
    if (frame.possession.teamId !== null &&
        frame.possession.teamId !== manifest.home.teamId &&
        frame.possession.teamId !== manifest.away.teamId) {
      issues.push({ path: 'possession.teamId', message: 'must identify a competing team' });
    }
    if (frame.possession.playerId !== null && !participantIds?.has(frame.possession.playerId)) {
      issues.push({ path: 'possession.playerId', message: 'must exist in the manifest' });
    }
    if (frame.ball.ownerId !== null && !participantIds?.has(frame.ball.ownerId)) {
      issues.push({ path: 'ball.ownerId', message: 'must exist in the manifest' });
    }
    if (frame.ball.lastTouchId !== null && !participantIds?.has(frame.ball.lastTouchId)) {
      issues.push({ path: 'ball.lastTouchId', message: 'must exist in the manifest' });
    }
    if (frame.ball.flight) {
      if (frame.ball.flight.decisionId !== undefined &&
          (!Number.isSafeInteger(frame.ball.flight.decisionId) ||
            frame.ball.flight.decisionId <= 0)) {
        issues.push({
          path: 'ball.flight.decisionId',
          message: 'must be a positive safe integer',
        });
      }
      if (!participantIds?.has(frame.ball.flight.fromActorId)) {
        issues.push({ path: 'ball.flight.fromActorId', message: 'must exist in the manifest' });
      }
      if (frame.ball.flight.intendedTargetActorId !== undefined &&
          !participantIds?.has(frame.ball.flight.intendedTargetActorId)) {
        issues.push({
          path: 'ball.flight.intendedTargetActorId',
          message: 'must exist in the manifest',
        });
      }
      if (!isFiniteVector(frame.ball.flight.targetPosition)) {
        issues.push({ path: 'ball.flight.targetPosition', message: 'all components must be finite' });
      }
      if (!Number.isSafeInteger(frame.ball.flight.releasedAtTick) ||
          frame.ball.flight.releasedAtTick < 0 || frame.ball.flight.releasedAtTick > frame.tick) {
        issues.push({
          path: 'ball.flight.releasedAtTick',
          message: 'must be a non-negative safe integer no greater than the frame tick',
        });
      }
      if (frame.ball.flight.expectedArrivalTick !== undefined &&
          frame.ball.flight.expectedArrivalTick < frame.ball.flight.releasedAtTick) {
        issues.push({
          path: 'ball.flight.expectedArrivalTick',
          message: 'must not precede the release tick',
        });
      }
    }

    const participantsById = new Map(
      manifest.participants.map(participant => [participant.id, participant]),
    );
    if (frame.ball.flight?.intendedTargetActorId !== undefined) {
      const passer = participantsById.get(frame.ball.flight.fromActorId);
      const receiver = participantsById.get(frame.ball.flight.intendedTargetActorId);
      if (!passer || !receiver || passer.kind !== 'player' || receiver.kind !== 'player' ||
          passer.teamId !== receiver.teamId) {
        issues.push({
          path: 'ball.flight.intendedTargetActorId',
          message: 'must identify a teammate of the flight source',
        });
      }
    }

    const possessingActors = frame.actors.filter(actor => actor.hasPossession === true);
    if (frame.ball.ownerId !== null) {
      const owner = participantsById.get(frame.ball.ownerId);
      if (!owner || owner.kind !== 'player') {
        issues.push({ path: 'ball.ownerId', message: 'must identify an on-field player' });
      } else {
        if (frame.possession.playerId !== frame.ball.ownerId) {
          issues.push({
            path: 'possession.playerId',
            message: 'must match the controlled ball owner',
          });
        }
        if (frame.possession.teamId !== owner.teamId) {
          issues.push({
            path: 'possession.teamId',
            message: 'must match the controlled ball owner team',
          });
        }
      }
      if (possessingActors.length !== 1 || possessingActors[0]?.id !== frame.ball.ownerId) {
        issues.push({
          path: 'actors',
          message: 'exactly one possession actor must match the controlled ball owner',
        });
      }
    } else if (frame.possession.playerId !== null) {
      issues.push({
        path: 'possession.playerId',
        message: 'must be null while the ball has no owner',
      });
    } else if (possessingActors.length > 0) {
      issues.push({
        path: 'actors',
        message: 'no actor may have possession while the ball has no owner',
      });
    }

    frame.actors.forEach((actor, index) => {
      if (actor.intent?.targetActorId !== undefined &&
          !participantsById.has(actor.intent.targetActorId)) {
        issues.push({
          path: `actors[${index}].intent.targetActorId`,
          message: 'must exist in the manifest',
        });
      }
    });
  }

  let previousEventSequence = -1;
  frame.events.forEach((event, index) => {
    const path = `events[${index}]`;
    if (!Number.isSafeInteger(event.sequence) || event.sequence < 0) {
      issues.push({ path: `${path}.sequence`, message: 'must be a non-negative safe integer' });
    }
    if (event.decisionId !== undefined &&
        (!Number.isSafeInteger(event.decisionId) || event.decisionId <= 0)) {
      issues.push({ path: `${path}.decisionId`, message: 'must be a positive safe integer' });
    }
    if (event.sequence <= previousEventSequence) {
      issues.push({ path: `${path}.sequence`, message: 'must be strictly increasing' });
    }
    previousEventSequence = event.sequence;
    if (!Number.isFinite(event.simTimeMs) || event.simTimeMs < 0 || event.simTimeMs > frame.simTimeMs) {
      issues.push({
        path: `${path}.simTimeMs`,
        message: 'must be between zero and the frame simulation time',
      });
    }
    if (event.location && !isFiniteVector(event.location)) {
      issues.push({ path: `${path}.location`, message: 'all components must be finite' });
    }
    if (manifest && event.teamId !== undefined &&
        event.teamId !== manifest.home.teamId && event.teamId !== manifest.away.teamId) {
      issues.push({ path: `${path}.teamId`, message: 'must identify a competing team' });
    }
    if (participantIds) {
      event.actorIds.forEach((actorId, actorIndex) => {
        if (!participantIds.has(actorId)) {
          issues.push({
            path: `${path}.actorIds[${actorIndex}]`,
            message: 'must exist in the match manifest',
          });
        }
      });
    }
  });

  return issues;
}

export function assertValidMatchManifest(manifest: MatchManifest): void {
  const issues = validateMatchManifest(manifest);
  if (issues.length > 0) {
    throw new Error(`Invalid MatchManifest: ${issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
  }
}

export function assertValidMatchFrame(frame: MatchFrame, manifest?: MatchManifest): void {
  const issues = validateMatchFrame(frame, manifest);
  if (issues.length > 0) {
    throw new Error(`Invalid MatchFrame: ${issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
  }
}

export function toNormalizedPitchPosition(
  position: MatchVector3,
  pitch: MatchPitchDimensions = REGULATION_PITCH,
): MatchVector3 {
  return {
    x: position.x / pitch.lengthM,
    y: position.y / pitch.widthM,
    z: position.z,
  };
}
