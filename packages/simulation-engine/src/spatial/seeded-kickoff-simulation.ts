import type { EntityId, PlayerRole } from '../core/types';
import {
  MATCH_PROTOCOL_VERSION,
  assertValidMatchFrame,
  assertValidMatchManifest,
  type MatchActorAction,
  type MatchActorFrame,
  type MatchActorIntent,
  type MatchBallFrame,
  type MatchEventDelta,
  type MatchFrame,
  type MatchLocomotion,
  type MatchManifest,
  type MatchParticipant,
  type MatchFlowPhase,
  type MatchPlayState,
  type MatchVector3,
  type FootballDecisionTrace,
} from '../protocol';
import { planTeamMovement, type CoordinatedMovement } from './team-coordination';
import {
  CAUSAL_SCORING_LIMITS,
  adjudicateGoalLine,
  createShotContact,
  evaluateGoalkeeperResponse,
  evaluateShotOpportunity,
  predictShotAtXPlane,
  predictShotTrajectoryPoint,
  type GoalkeeperResponse,
  type GoalkeeperResponseSamples,
  type ShotContactResult,
  type ShotContactSamples,
  type ShotOpportunityEvaluation,
} from './causal-scoring';
import {
  createFormationAssignments,
  type FormationAssignment,
} from './formation-layout';
import {
  sampleSemanticRandom,
  sampleSemanticRandomInteger,
  type SemanticRandomKey,
} from './semantic-random';
import { calculateOffsideReference } from './offside-reference';
import {
  calculatePressure,
  calculateSeparationSteering,
  calculateShapeTarget,
  evaluatePassCandidates,
  selectInterceptionCandidate,
  type FootballerSnapshot,
  type PassCandidateEvaluation,
} from './football-intelligence';

const BALL_RADIUS_M = 0.11;
const PLAYER_FOOT_OFFSET_M = 0.35;
const TOUCHLINE_OFFICIAL_OFFSET_M = 0.75;
const SHOT_DECISION_MAX_DISTANCE_M = 42;
const SHOT_DECISION_MIN_SCORE = 0.25;
export const OPEN_PLAY_START_TICK = 240;

const compareEntityIds = (left: EntityId, right: EntityId): number => {
  if (typeof left !== typeof right) return typeof left === 'number' ? -1 : 1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  const leftText = String(left);
  const rightText = String(right);
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
};

interface MutableVector3 {
  x: number;
  y: number;
  z: number;
}

export const SPATIAL_SIMULATION_LIMITS = Object.freeze({
  outfieldMaxSpeedMps: 7.8,
  goalkeeperMaxSpeedMps: 5.8,
  refereeMaxSpeedMps: 7.2,
  assistantMaxSpeedMps: 8.2,
  outfieldMaxAccelerationMps2: 4.8,
  goalkeeperMaxAccelerationMps2: 4.0,
  refereeMaxAccelerationMps2: 4.5,
  assistantMaxAccelerationMps2: 5.2,
  maxTurnRateRadPerSecond: Math.PI * 1.6,
  ballMaxSpeedMps: 45,
});

interface MutableActorState {
  readonly participant: MatchParticipant;
  readonly assignment?: FormationAssignment;
  readonly onField: boolean;
  readonly maxSpeedMps: number;
  readonly maxAccelerationMps2: number;
  position: MatchVector3;
  velocity: MatchVector3;
  target: MatchVector3;
  yaw: number;
  locomotion: MatchLocomotion;
  action: MatchActorAction | null;
  actionExpiresTick: number;
  stamina: number;
  intent: MatchActorIntent | null;
  pressure: number;
  footballDecision?: FootballDecisionTrace;
  targetActorId?: EntityId;
}

interface ActorTickSnapshot {
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
  readonly target: MatchVector3;
  readonly yaw: number;
  readonly locomotion: MatchLocomotion;
  readonly stamina: number;
}

interface ActorKinematicsUpdate {
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
  readonly yaw: number;
  readonly locomotion: MatchLocomotion;
  readonly stamina: number;
}

interface PassPlan {
  readonly fromId: EntityId;
  readonly toId: EntityId;
  readonly actionStartTick: number;
  readonly releaseTick: number;
  readonly arrivalTick: number;
  readonly targetPosition?: MatchVector3;
  readonly reason: string;
  readonly decisionId: number;
  readonly scripted: boolean;
}

interface ActivePass {
  readonly plan: PassPlan;
  readonly arrivalTick: number;
  readonly startPosition: MatchVector3;
  readonly targetPosition: MatchVector3;
  readonly passingTeamId: EntityId;
}

interface ActiveContest {
  readonly plan: PassPlan;
  readonly interceptorId: EntityId;
  readonly passingTeamId: EntityId;
  readonly position: MatchVector3;
  readonly resolveTick: number;
}

interface ShotPlan {
  readonly shooterId: EntityId;
  readonly shootingTeamId: EntityId;
  readonly goalkeeperId: EntityId;
  readonly actionStartTick: number;
  readonly contactTick: number;
  readonly aimPoint: MatchVector3;
  readonly opportunity: ShotOpportunityEvaluation;
  readonly contactSamples: ShotContactSamples;
  readonly goalkeeperSamples: GoalkeeperResponseSamples;
  readonly requestedPower: number;
  readonly reason: string;
  readonly decisionId: number;
}

interface ActiveShot {
  readonly plan: ShotPlan;
  readonly contact: ShotContactResult;
  readonly goalkeeperResponse: GoalkeeperResponse | null;
  readonly releaseTick: number;
  readonly reactionTick: number;
  reactionEmitted: boolean;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const cloneVector = (vector: MatchVector3): MutableVector3 => ({
  x: vector.x,
  y: vector.y,
  z: vector.z,
});

const magnitude2D = (vector: MatchVector3): number => Math.hypot(vector.x, vector.y);

const clampVector2D = (vector: MatchVector3, maximum: number): MatchVector3 => {
  const magnitude = magnitude2D(vector);
  if (magnitude <= maximum || magnitude === 0) return vector;
  const scale = maximum / magnitude;
  return { x: vector.x * scale, y: vector.y * scale, z: vector.z };
};

const normalizeAngle = (angle: number): number => {
  let result = angle;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
};

const moveAngleTowards = (current: number, target: number, maximumDelta: number): number => {
  const delta = normalizeAngle(target - current);
  return normalizeAngle(current + clamp(delta, -maximumDelta, maximumDelta));
};

const locomotionForSpeed = (speedMps: number): MatchLocomotion => {
  if (speedMps < 0.12) return 'idle';
  if (speedMps < 1.8) return 'walk';
  if (speedMps < 3.8) return 'jog';
  if (speedMps < 6.4) return 'run';
  return 'sprint';
};

const isPlayer = (participant: MatchParticipant): boolean => participant.kind === 'player';

const roleOf = (assignment: FormationAssignment): PlayerRole =>
  assignment.participant.role as PlayerRole;

const isGoalkeeper = (assignment?: FormationAssignment): boolean =>
  assignment !== undefined && roleOf(assignment) === 'GK';

const roleLineWeight = (role: PlayerRole): number => {
  if (role === 'GK') return 0.12;
  if (['SW', 'CB', 'RCB', 'LCB', 'RB', 'LB', 'RWB', 'LWB'].includes(role)) return 0.42;
  if (['CDM', 'RDM', 'LDM', 'CM', 'RCM', 'LCM'].includes(role)) return 0.72;
  return 1;
};

/**
 * First renderer-neutral spatial vertical slice.
 *
 * It intentionally models one seeded kickoff/open-play/scoring scenario rather
 * than a complete match. Its reusable outputs are the fixed clock, actor
 * kinematics, causal ball actions, official positioning, deterministic events,
 * and immutable MatchFrame stream.
 */
export class SeededKickoffSimulation {
  readonly manifest: MatchManifest;

  private readonly assignments: ReadonlyMap<EntityId, FormationAssignment>;
  private readonly actors = new Map<EntityId, MutableActorState>();
  private readonly participantOrder: readonly EntityId[];
  private readonly homeDirection: 1 | -1;
  private readonly refereeDiagonalSign: 1 | -1;
  private readonly passPlans: readonly PassPlan[];
  private readonly refereeId: EntityId;
  private readonly assistantIds: readonly [EntityId, EntityId];
  private readonly tickDurationMs: number;
  private tick = 0;
  private sequence = 0;
  private eventSequence = 0;
  private decisionSequence = 2;
  private readonly whistleTick: number;
  private activePass: ActivePass | null = null;
  private activeContest: ActiveContest | null = null;
  private activeShot: ActiveShot | null = null;
  private pendingPass: PassPlan | null = null;
  private pendingShot: ShotPlan | null = null;
  private nextDecisionTick = OPEN_PLAY_START_TICK + 12;
  private possessionPlayerId: EntityId | null;
  private possessionTeamId: EntityId;
  private possessionSinceTick = 0;
  private lastObservedPossessionTeamId: EntityId | null = null;
  private lastTurnoverTick = -1000000;
  private nextTeamPlanTick = 0;
  private coordinatedMovement = new Map<EntityId, CoordinatedMovement>();
  private homeScore = 0;
  private awayScore = 0;
  private playState: MatchPlayState = 'ready';
  private terminalStoppage = false;
  private ball: MatchBallFrame;
  private currentFrame: MatchFrame;

  constructor(manifest: MatchManifest) {
    assertValidMatchManifest(manifest);
    // Own the inputs: editing a UI tactics object must not mutate a running replay.
    this.manifest = JSON.parse(JSON.stringify(manifest)) as MatchManifest;
    manifest = this.manifest;
    this.assignments = createFormationAssignments(manifest);
    // Preserve the manifest's public serialization order. Fairness comparisons
    // canonicalize actor arrays, while every football calculation remains
    // independent of this presentation ordering.
    this.participantOrder = manifest.participants.map(participant => participant.id);
    this.homeDirection = manifest.home.attacksPositiveXFirstHalf ? 1 : -1;
    this.tickDurationMs = 1000 / manifest.tickRateHz;

    const referee = manifest.participants.find(participant => participant.kind === 'referee');
    const assistants = manifest.participants.filter(
      participant => participant.kind === 'assistant_referee',
    );
    if (!referee || assistants.length !== 2) {
      throw new Error('The spatial slice requires one referee and exactly two assistant referees');
    }
    this.refereeId = referee.id;
    this.assistantIds = [assistants[0].id, assistants[1].id];
    this.refereeDiagonalSign = this.semanticInteger({
      namespace: 'official.positioning',
      period: 'pre_match',
      tick: 0,
      decisionId: 'referee-diagonal',
      actorIds: [referee.id],
      sampleKind: 'diagonal_sign',
    }, 0, 1) === 0 ? -1 : 1;

    const homeAssignments = [...this.assignments.values()].filter(
      assignment => assignment.participant.teamId === manifest.home.teamId,
    );
    const kicker = this.selectKicker(homeAssignments);
    const firstReceiver = this.selectFirstReceiver(homeAssignments, kicker.participant.id);
    const channelSign = this.semanticInteger({
      namespace: 'team.kickoff',
      period: 'first_half',
      tick: 0,
      decisionId: 1,
      actorIds: [kicker.participant.id, firstReceiver.participant.id],
      sampleKind: 'opening_channel_sign',
    }, 0, 1) === 0 ? -1 : 1;
    const secondReceiver = this.selectWideReceiver(
      homeAssignments,
      firstReceiver.participant.id,
      channelSign,
    );
    const firstActionTick = this.secondsToTicks(0.9) + this.semanticInteger({
      namespace: 'team.kickoff',
      period: 'first_half',
      tick: 0,
      decisionId: 1,
      actorIds: [kicker.participant.id, firstReceiver.participant.id],
      sampleKind: 'first_action_delay_ticks',
    }, 0, 3);
    this.whistleTick = this.secondsToTicks(0.3);
    const firstReleaseTick = firstActionTick + this.secondsToTicks(0.2);
    const firstArrivalTick = firstReleaseTick + this.secondsToTicks(0.8) +
      this.semanticInteger({
        namespace: 'team.kickoff',
        period: 'first_half',
        tick: firstReleaseTick,
        decisionId: 1,
        actorIds: [kicker.participant.id, firstReceiver.participant.id],
        sampleKind: 'first_pass_travel_delay_ticks',
      }, 0, 2);
    const secondActionTick = firstArrivalTick + this.secondsToTicks(1.15) +
      this.semanticInteger({
        namespace: 'team.kickoff',
        period: 'first_half',
        tick: firstArrivalTick,
        decisionId: 2,
        actorIds: [firstReceiver.participant.id, secondReceiver.participant.id],
        sampleKind: 'second_action_delay_ticks',
      }, 0, 4);
    const secondReleaseTick = secondActionTick + this.secondsToTicks(0.2);
    const secondArrivalTick = secondReleaseTick + this.secondsToTicks(0.9) +
      this.semanticInteger({
        namespace: 'team.kickoff',
        period: 'first_half',
        tick: secondReleaseTick,
        decisionId: 2,
        actorIds: [firstReceiver.participant.id, secondReceiver.participant.id],
        sampleKind: 'second_pass_travel_delay_ticks',
      }, 0, 2);

    this.passPlans = [
      {
        fromId: kicker.participant.id,
        toId: firstReceiver.participant.id,
        actionStartTick: firstActionTick,
        releaseTick: firstReleaseTick,
        arrivalTick: firstArrivalTick,
        reason: 'scripted_kickoff_retain',
        decisionId: 1,
        scripted: true,
      },
      {
        fromId: firstReceiver.participant.id,
        toId: secondReceiver.participant.id,
        actionStartTick: secondActionTick,
        releaseTick: secondReleaseTick,
        arrivalTick: secondArrivalTick,
        reason: 'scripted_kickoff_progress',
        decisionId: 2,
        scripted: true,
      },
    ];

    this.initializeActors();
    this.possessionPlayerId = kicker.participant.id;
    this.possessionTeamId = manifest.home.teamId;
    const kickoffFoot = this.footPosition(this.requireActor(kicker.participant.id));
    this.ball = {
      position: kickoffFoot,
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      state: 'controlled',
      ownerId: kicker.participant.id,
      lastTouchId: kicker.participant.id,
      flight: null,
    };
    this.currentFrame = this.buildFrame([]);
  }

  getFrame(): MatchFrame {
    return this.currentFrame;
  }

  step(): MatchFrame {
    this.advanceOneTick();
    return this.currentFrame;
  }

  advanceTicks(count: number): readonly MatchFrame[] {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('advanceTicks(count) requires a non-negative safe integer');
    }
    return Array.from({ length: count }, () => this.step());
  }

  private secondsToTicks(seconds: number): number {
    return Math.round(seconds * this.manifest.tickRateHz);
  }

  private secondsToCeilingTicks(seconds: number): number {
    return Math.ceil(seconds * this.manifest.tickRateHz - 1e-9);
  }

  private semanticKey(
    key: Omit<SemanticRandomKey, 'matchSeed' | 'sampleIndex'> & { readonly sampleIndex?: number },
  ): SemanticRandomKey {
    return {
      matchSeed: this.manifest.seed,
      sampleIndex: key.sampleIndex ?? 0,
      namespace: key.namespace,
      period: key.period,
      tick: key.tick,
      decisionId: key.decisionId,
      actorIds: key.actorIds,
      sampleKind: key.sampleKind,
    };
  }

  private semanticSample(
    key: Omit<SemanticRandomKey, 'matchSeed' | 'sampleIndex'> & { readonly sampleIndex?: number },
  ): number {
    return sampleSemanticRandom(this.semanticKey(key));
  }

  private semanticInteger(
    key: Omit<SemanticRandomKey, 'matchSeed' | 'sampleIndex'> & { readonly sampleIndex?: number },
    minInclusive: number,
    maxInclusive: number,
  ): number {
    return sampleSemanticRandomInteger(
      this.semanticKey(key),
      minInclusive,
      maxInclusive,
    );
  }

  private initializeActors(): void {
    for (const participant of this.manifest.participants) {
      const assignment = this.assignments.get(participant.id);
      const officialPosition = assignment ? null : this.initialOfficialPosition(participant);
      const position = assignment ? cloneVector(assignment.basePosition) : officialPosition;
      if (!position) throw new Error(`Unsupported match participant ${String(participant.id)}`);

      const goalkeeper = isGoalkeeper(assignment);
      const assistant = participant.kind === 'assistant_referee';
      const referee = participant.kind === 'referee';
      const fourthOfficial = participant.kind === 'fourth_official';
      const yaw = assignment
        ? (assignment.team.attacksPositiveXFirstHalf ? 0 : Math.PI)
        : 0;

      this.actors.set(participant.id, {
        participant,
        assignment,
        onField: !fourthOfficial,
        maxSpeedMps: fourthOfficial
          ? 0
          : assistant
            ? SPATIAL_SIMULATION_LIMITS.assistantMaxSpeedMps
            : referee
              ? SPATIAL_SIMULATION_LIMITS.refereeMaxSpeedMps
              : goalkeeper
                ? SPATIAL_SIMULATION_LIMITS.goalkeeperMaxSpeedMps * (participant.attributes ? 0.65 + (participant.attributes.pace ?? 65) * 0.0035 : 1)
                : SPATIAL_SIMULATION_LIMITS.outfieldMaxSpeedMps * (participant.attributes ? 0.65 + (participant.attributes.pace ?? 65) * 0.0035 : 1),
        maxAccelerationMps2: fourthOfficial
          ? 0
          : assistant
            ? SPATIAL_SIMULATION_LIMITS.assistantMaxAccelerationMps2
            : referee
              ? SPATIAL_SIMULATION_LIMITS.refereeMaxAccelerationMps2
              : goalkeeper
                ? SPATIAL_SIMULATION_LIMITS.goalkeeperMaxAccelerationMps2 * (participant.attributes ? 0.6 + (participant.attributes.acceleration ?? 65) * 0.004 : 1)
                : SPATIAL_SIMULATION_LIMITS.outfieldMaxAccelerationMps2 * (participant.attributes ? 0.6 + (participant.attributes.acceleration ?? 65) * 0.004 : 1),
        position,
        velocity: { x: 0, y: 0, z: 0 },
        target: cloneVector(position),
        yaw,
        locomotion: 'idle',
        action: null,
        actionExpiresTick: -1,
        stamina: 100,
        intent: assignment
          ? {
              kind: 'hold_shape',
              sinceTick: 0,
              urgency: 0.35,
              reason: 'kickoff_shape',
              targetPosition: cloneVector(position),
            }
          : null,
        pressure: 0,
      });
    }
  }

  private initialOfficialPosition(participant: MatchParticipant): MatchVector3 | null {
    const { lengthM, widthM } = this.manifest.pitch;
    if (participant.kind === 'referee') {
      return {
        x: lengthM / 2 - this.homeDirection * 7,
        y: widthM / 2 + this.refereeDiagonalSign * 5,
        z: 0,
      };
    }
    if (participant.kind === 'assistant_referee') {
      const near = participant.role === 'assistant_near';
      return {
        x: this.initialOffsideLine(near ? this.manifest.home.teamId : this.manifest.away.teamId),
        y: near ? widthM + TOUCHLINE_OFFICIAL_OFFSET_M : -TOUCHLINE_OFFICIAL_OFFSET_M,
        z: 0,
      };
    }
    if (participant.kind === 'fourth_official') {
      return { x: lengthM / 2, y: -2, z: 0 };
    }
    return null;
  }

  private initialOffsideLine(defendingTeamId: EntityId): number {
    const defendingTeam = defendingTeamId === this.manifest.home.teamId
      ? this.manifest.home
      : this.manifest.away;
    const defenders = [...this.assignments.values()]
      .filter(assignment => assignment.participant.teamId === defendingTeamId)
      .map(assignment => assignment.basePosition.x)
      .sort((left, right) => defendingTeam.attacksPositiveXFirstHalf
        ? left - right
        : right - left);
    const secondLastOpponent = defenders[1] ?? this.manifest.pitch.lengthM / 2;
    return defendingTeam.attacksPositiveXFirstHalf
      ? Math.min(secondLastOpponent, this.manifest.pitch.lengthM / 2)
      : Math.max(secondLastOpponent, this.manifest.pitch.lengthM / 2);
  }

  private selectKicker(assignments: readonly FormationAssignment[]): FormationAssignment {
    const forwards = assignments.filter(assignment =>
      ['ST', 'CF', 'LS', 'RS'].includes(roleOf(assignment)),
    );
    const candidates = forwards.length > 0 ? forwards : assignments.filter(assignment => roleOf(assignment) !== 'GK');
    return [...candidates].sort((left, right) =>
      Math.abs(left.basePosition.x - this.manifest.pitch.lengthM / 2) -
      Math.abs(right.basePosition.x - this.manifest.pitch.lengthM / 2)
    )[0];
  }

  private selectFirstReceiver(
    assignments: readonly FormationAssignment[],
    kickerId: EntityId,
  ): FormationAssignment {
    const midfielders = assignments.filter(assignment =>
      ['CDM', 'RDM', 'LDM', 'CM', 'RCM', 'LCM'].includes(roleOf(assignment)),
    );
    const candidates = midfielders.length > 0
      ? midfielders
      : assignments.filter(assignment => assignment.participant.id !== kickerId && roleOf(assignment) !== 'GK');
    const centreY = this.manifest.pitch.widthM / 2;
    return [...candidates].sort((left, right) =>
      Math.abs(left.basePosition.y - centreY) - Math.abs(right.basePosition.y - centreY)
    )[0];
  }

  private selectWideReceiver(
    assignments: readonly FormationAssignment[],
    excludedId: EntityId,
    channelSign: 1 | -1,
  ): FormationAssignment {
    const centreY = this.manifest.pitch.widthM / 2;
    const widePlayers = assignments.filter(assignment =>
      assignment.participant.id !== excludedId &&
      roleOf(assignment) !== 'GK' &&
      ['RW', 'LW', 'AMR', 'AML', 'RB', 'LB', 'RWB', 'LWB'].includes(roleOf(assignment)),
    );
    const candidates = widePlayers.length > 0
      ? widePlayers
      : assignments.filter(assignment => assignment.participant.id !== excludedId && roleOf(assignment) !== 'GK');

    return [...candidates].sort((left, right) =>
      channelSign * ((right.basePosition.y - centreY) - (left.basePosition.y - centreY))
    )[0];
  }

  private teamIdForPlayer(playerId: EntityId): EntityId {
    const participant = this.requireActor(playerId).participant;
    if (participant.kind !== 'player' || participant.teamId === null) {
      throw new Error(`Actor ${String(playerId)} is not a team player`);
    }
    return participant.teamId;
  }

  private teamManifest(teamId: EntityId): MatchManifest['home'] {
    if (teamId === this.manifest.home.teamId) return this.manifest.home;
    if (teamId === this.manifest.away.teamId) return this.manifest.away;
    throw new Error(`Unknown team ${String(teamId)}`);
  }

  private attackDirection(teamId: EntityId): 1 | -1 {
    return this.teamManifest(teamId).attacksPositiveXFirstHalf ? 1 : -1;
  }

  private playerSnapshot(actor: MutableActorState): FootballerSnapshot {
    const assignment = actor.assignment;
    if (!assignment || actor.participant.teamId === null) {
      throw new Error(`Actor ${String(actor.participant.id)} is not an on-field player`);
    }
    return {
      id: actor.participant.id,
      teamId: actor.participant.teamId,
      role: roleOf(assignment),
      position: actor.position,
      velocity: actor.velocity,
      stamina: actor.stamina,
      attributes: actor.participant.attributes,
    };
  }

  private playerSnapshots(teamId?: EntityId): FootballerSnapshot[] {
    return [...this.actors.values()]
      .filter(actor => actor.onField && actor.assignment &&
        (teamId === undefined || actor.participant.teamId === teamId))
      .map(actor => this.playerSnapshot(actor));
  }

  private setIntent(actor: MutableActorState, intent: MatchActorIntent): void {
    const current = actor.intent;
    const sameIntent = current?.kind === intent.kind &&
      current.reason === intent.reason &&
      current.targetActorId === intent.targetActorId &&
      current.decisionId === intent.decisionId;
    actor.intent = sameIntent
      ? { ...intent, sinceTick: current.sinceTick }
      : intent;
    actor.targetActorId = actor.intent.targetActorId;
  }

  private shouldMakeOpenPlayDecision(): boolean {
    return !this.terminalStoppage &&
      this.tick >= OPEN_PLAY_START_TICK &&
      this.tick >= this.nextDecisionTick &&
      this.ball.state === 'controlled' &&
      this.ball.ownerId !== null &&
      this.activePass === null &&
      this.activeShot === null &&
      this.pendingPass === null &&
      this.pendingShot === null;
  }

  private opposingGoalkeeper(teamId: EntityId): MutableActorState {
    const defendingTeamId = teamId === this.manifest.home.teamId
      ? this.manifest.away.teamId
      : this.manifest.home.teamId;
    const goalkeeper = [...this.actors.values()].find(actor =>
      actor.participant.kind === 'player' &&
      actor.participant.teamId === defendingTeamId &&
      actor.participant.role === 'GK');
    if (!goalkeeper) {
      throw new Error(`Missing goalkeeper for team ${String(defendingTeamId)}`);
    }
    return goalkeeper;
  }

  private shotExecutionRatings(role: PlayerRole): {
    readonly finishing: number;
    readonly technique: number;
    readonly composure: number;
  } {
    if (['ST', 'CF', 'SS'].includes(role)) {
      return { finishing: 76, technique: 72, composure: 74 };
    }
    if (['RW', 'LW', 'AMR', 'AML', 'CAM'].includes(role)) {
      return { finishing: 70, technique: 75, composure: 69 };
    }
    if (['CM', 'RCM', 'LCM'].includes(role)) {
      return { finishing: 64, technique: 72, composure: 67 };
    }
    return { finishing: 54, technique: 64, composure: 61 };
  }

  private createOpenPlayShotPlan(): ShotPlan | null {
    const shooterId = this.ball.ownerId;
    if (shooterId === null) return null;
    const shooter = this.requireActor(shooterId);
    const shootingTeamId = this.teamIdForPlayer(shooterId);
    const attackDirection = this.attackDirection(shootingTeamId);
    const goalkeeper = this.opposingGoalkeeper(shootingTeamId);
    const prospectiveDecisionId = this.decisionSequence + 1;
    const actorIds = [shooterId, goalkeeper.participant.id];
    const side = this.semanticInteger({
      namespace: 'player.shot.decision',
      period: 'first_half',
      tick: this.tick,
      decisionId: prospectiveDecisionId,
      actorIds,
      sampleKind: 'aim_side',
    }, 0, 1) === 0 ? -1 : 1;
    const lateralDepth = 2.35 + this.semanticSample({
      namespace: 'player.shot.decision',
      period: 'first_half',
      tick: this.tick,
      decisionId: prospectiveDecisionId,
      actorIds,
      sampleKind: 'aim_lateral_depth',
    }) * 0.65;
    const aimPoint = {
      x: attackDirection === 1 ? this.manifest.pitch.lengthM : 0,
      y: this.manifest.pitch.widthM / 2 + attackDirection * side * lateralDepth,
      z: 0.55 + this.semanticSample({
        namespace: 'player.shot.decision',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'aim_height',
      }) * 1.25,
    };
    const opponents = this.playerSnapshots().filter(player =>
      player.teamId !== shootingTeamId && player.id !== goalkeeper.participant.id);
    const balance = clamp(0.7 + shooter.stamina / 100 * 0.18 - shooter.pressure * 0.16, 0, 1);
    const opportunity = evaluateShotOpportunity({
      pitch: this.manifest.pitch,
      attackDirection,
      ballPosition: this.ball.position,
      targetPoint: aimPoint,
      shooterFacingYaw: shooter.yaw,
      pressure: shooter.pressure,
      balance,
      goalkeeperPosition: goalkeeper.position,
      blockers: opponents.map(opponent => ({ position: opponent.position })),
    });
    if (opportunity.distanceM > SHOT_DECISION_MAX_DISTANCE_M ||
        opportunity.opportunityScore < SHOT_DECISION_MIN_SCORE) {
      return null;
    }

    const contactSamples: ShotContactSamples = {
      lateralError: this.semanticSample({
        namespace: 'player.shot.execution',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'contact_lateral_error',
      }),
      elevationError: this.semanticSample({
        namespace: 'player.shot.execution',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'contact_elevation_error',
      }),
      powerError: this.semanticSample({
        namespace: 'player.shot.execution',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'contact_power_error',
      }),
      spin: this.semanticSample({
        namespace: 'player.shot.execution',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'contact_spin',
      }),
    };
    const goalkeeperSamples: GoalkeeperResponseSamples = {
      perceptionLateral: this.semanticSample({
        namespace: 'goalkeeper.shot.response',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'perception_lateral',
      }),
      perceptionVertical: this.semanticSample({
        namespace: 'goalkeeper.shot.response',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'perception_vertical',
      }),
      perceptionTiming: this.semanticSample({
        namespace: 'goalkeeper.shot.response',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'perception_timing',
      }),
      reactionTiming: this.semanticSample({
        namespace: 'goalkeeper.shot.response',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'reaction_timing',
      }),
      diveExecution: this.semanticSample({
        namespace: 'goalkeeper.shot.response',
        period: 'first_half',
        tick: this.tick,
        decisionId: prospectiveDecisionId,
        actorIds,
        sampleKind: 'dive_execution',
      }),
    };

    this.decisionSequence = prospectiveDecisionId;
    return {
      shooterId,
      shootingTeamId,
      goalkeeperId: goalkeeper.participant.id,
      actionStartTick: this.tick,
      contactTick: this.tick + this.secondsToTicks(0.25),
      aimPoint,
      opportunity,
      contactSamples,
      goalkeeperSamples,
      requestedPower: clamp(opportunity.distanceM / 44, 0.65, 0.96),
      reason: opportunity.reasons[0] ?? 'clear_sight',
      decisionId: prospectiveDecisionId,
    };
  }

  private createOpenPlayPassPlan(): PassPlan | null {
    const ownerId = this.ball.ownerId;
    if (ownerId === null) return null;
    const passerActor = this.requireActor(ownerId);
    const passer = this.playerSnapshot(passerActor);
    const teammates = this.playerSnapshots(passer.teamId);
    const opponents = this.playerSnapshots().filter(player => player.teamId !== passer.teamId);
    const evaluations = evaluatePassCandidates(
      passer,
      teammates,
      opponents,
      this.attackDirection(passer.teamId),
      this.manifest.pitch,
      this.teamManifest(passer.teamId).tactics,
    );
    if (evaluations.length === 0) return null;

    const decisionId = this.decisionSequence + 1;
    const pressure = calculatePressure(passer.position, opponents).value;
    const shortlist = evaluations.slice(0, Math.min(5, evaluations.length));
    const candidateIds = shortlist.map(candidate => candidate.playerId);
    const riskAppetite = this.semanticSample({
      namespace: 'player.decision',
      period: 'first_half',
      tick: this.tick,
      decisionId,
      actorIds: [ownerId, ...candidateIds],
      sampleKind: 'pass_risk_appetite',
    });
    const progressive = [...shortlist].sort((left, right) =>
      right.progressM - left.progressM || right.score - left.score)[0];
    const selected: PassCandidateEvaluation =
      riskAppetite > 0.7 - pressure * 0.18 && progressive
        ? progressive
        : shortlist[0];
    const releaseTick = this.tick + this.secondsToTicks(0.2);
    const travelSeconds = clamp(selected.distanceM / 13.5, 0.45, 1.8);
    const arrivalTick = releaseTick + Math.max(2, this.secondsToTicks(travelSeconds));
    const errorMagnitude = (1 - selected.completionProbability) * 1.6;
    const errorAngle = this.semanticSample({
      namespace: 'player.execution',
      period: 'first_half',
      tick: this.tick,
      decisionId,
      actorIds: [ownerId, selected.playerId],
      sampleKind: 'pass_contact_error_angle',
    }) * Math.PI * 2;
    const targetPosition = {
      x: clamp(
        selected.targetPosition.x + Math.cos(errorAngle) * errorMagnitude,
        1,
        this.manifest.pitch.lengthM - 1,
      ),
      y: clamp(
        selected.targetPosition.y + Math.sin(errorAngle) * errorMagnitude,
        1,
        this.manifest.pitch.widthM - 1,
      ),
      z: BALL_RADIUS_M,
    };
    this.decisionSequence = decisionId;

    return {
      fromId: ownerId,
      toId: selected.playerId,
      actionStartTick: this.tick,
      releaseTick,
      arrivalTick,
      targetPosition,
      reason: selected.reason,
      decisionId,
      scripted: false,
    };
  }

  private advanceOneTick(): void {
    this.tick += 1;
    this.sequence += 1;
    const events: MatchEventDelta[] = [];

    this.expireActions();

    if (this.tick === this.whistleTick) {
      this.playState = 'running';
      const referee = this.requireActor(this.refereeId);
      referee.action = {
        kind: 'whistle',
        startedAtMs: this.tick * this.tickDurationMs,
        impactAtMs: this.tick * this.tickDurationMs,
      };
      referee.actionExpiresTick = this.tick + this.secondsToTicks(0.3);
      events.push(this.createEvent('whistle', [this.refereeId], 'play_authorized'));
      events.push(this.createEvent(
        'kickoff',
        [this.passPlans[0].fromId],
        'started',
        this.manifest.home.teamId,
      ));
    }

    for (const plan of this.passPlans) {
      if (this.tick === plan.actionStartTick) this.preparePass(plan);
      if (this.tick === plan.releaseTick) events.push(this.releasePass(plan));
    }

    if (this.pendingPass && this.tick === this.pendingPass.releaseTick) {
      events.push(this.releasePass(this.pendingPass));
      this.pendingPass = null;
    }

    if (this.pendingShot && this.tick === this.pendingShot.contactTick) {
      events.push(...this.releaseShot(this.pendingShot));
      this.pendingShot = null;
    }

    if (this.shouldMakeOpenPlayDecision()) {
      const shot = this.createOpenPlayShotPlan();
      if (shot) {
        this.pendingShot = shot;
        this.prepareShot(shot);
        events.push(this.createEvent(
          'shot_selected',
          [shot.shooterId],
          shot.reason,
          this.possessionTeamId,
          shot.decisionId,
        ));
      } else {
        const decision = this.createOpenPlayPassPlan();
        if (decision) {
          this.pendingPass = decision;
          this.preparePass(decision);
          events.push(this.createEvent(
            'decision_selected',
            [decision.fromId, decision.toId],
            decision.reason,
            this.possessionTeamId,
            decision.decisionId,
          ));
        } else {
          this.nextDecisionTick = this.tick + this.secondsToTicks(0.75);
        }
      }
    }

    events.push(...this.updateGoalkeeperReaction());

    this.updateActorTargets();
    const deltaSeconds = this.tickDurationMs / 1000;
    this.integrateActors(deltaSeconds);

    events.push(...this.updateBall(deltaSeconds));

    this.currentFrame = this.buildFrame(events);
  }

  private expireActions(): void {
    for (const actor of this.actors.values()) {
      if (actor.action && this.tick > actor.actionExpiresTick) actor.action = null;
    }
  }

  private preparePass(plan: PassPlan): void {
    const passer = this.requireActor(plan.fromId);
    passer.action = {
      kind: 'pass',
      startedAtMs: plan.actionStartTick * this.tickDurationMs,
      impactAtMs: plan.releaseTick * this.tickDurationMs,
      targetActorId: plan.toId,
    };
    passer.actionExpiresTick = plan.releaseTick + this.secondsToTicks(0.25);
    this.setIntent(passer, {
      kind: 'pass',
      decisionId: plan.decisionId,
      sinceTick: this.tick,
      urgency: 0.82,
      reason: plan.reason,
      targetPosition: plan.targetPosition,
      targetActorId: plan.toId,
    });
  }

  private prepareShot(plan: ShotPlan): void {
    const shooter = this.requireActor(plan.shooterId);
    shooter.action = {
      kind: 'shoot',
      startedAtMs: plan.actionStartTick * this.tickDurationMs,
      impactAtMs: plan.contactTick * this.tickDurationMs,
      targetActorId: plan.goalkeeperId,
    };
    shooter.actionExpiresTick = plan.contactTick + this.secondsToTicks(0.35);
    shooter.target = cloneVector(shooter.position);
    this.setIntent(shooter, {
      kind: 'shoot',
      decisionId: plan.decisionId,
      sinceTick: this.tick,
      urgency: 0.98,
      reason: plan.reason,
      targetPosition: plan.aimPoint,
      targetActorId: plan.goalkeeperId,
    });
  }

  private releaseShot(plan: ShotPlan): readonly MatchEventDelta[] {
    if (this.activePass || this.activeShot) {
      throw new Error('Cannot contact a shot while another ball flight is active');
    }
    if (this.ball.ownerId !== plan.shooterId) {
      this.nextDecisionTick = this.tick + this.secondsToTicks(0.75);
      return [this.createEvent(
        'shot_cancelled',
        [plan.shooterId],
        'possession_lost',
        plan.shootingTeamId,
        plan.decisionId,
      )];
    }

    const shooter = this.requireActor(plan.shooterId);
    const goalkeeper = this.requireActor(plan.goalkeeperId);
    const role = shooter.participant.role as PlayerRole;
    const roleRatings = this.shotExecutionRatings(role);
    const ratings = {
      finishing: shooter.participant.attributes?.finishing ?? roleRatings.finishing,
      technique: shooter.participant.attributes?.technique ?? roleRatings.technique,
      composure: shooter.participant.attributes?.composure ?? roleRatings.composure,
    };
    const contact = createShotContact({
      attackDirection: this.attackDirection(plan.shootingTeamId),
      ballPosition: this.ball.position,
      targetPoint: plan.aimPoint,
      requestedPower: plan.requestedPower,
      attributes: {
        ...ratings,
        balance: clamp(0.7 + shooter.stamina / 100 * 0.18 - shooter.pressure * 0.16, 0, 1),
        pressure: shooter.pressure,
        fatigue: clamp(1 - shooter.stamina / 100, 0, 1),
        footProficiency: 0.88,
      },
      samples: plan.contactSamples,
    });
    const goalkeeperResponse = evaluateGoalkeeperResponse({
      trajectory: contact.trajectory,
      attackDirection: this.attackDirection(plan.shootingTeamId),
      goalkeeperPosition: goalkeeper.position,
      attributes: {
        anticipation: goalkeeper.participant.attributes?.anticipation ?? 72,
        reflexes: goalkeeper.participant.attributes?.reflexes ?? 74,
        agility: goalkeeper.participant.attributes?.agility ?? 71,
        handling: goalkeeper.participant.attributes?.handling ?? 70,
      },
      lineOfSight: clamp(1 - plan.opportunity.laneObstruction * 0.65, 0, 1),
      fatigue: clamp(1 - goalkeeper.stamina / 100, 0, 1),
      samples: plan.goalkeeperSamples,
    });
    const attackDirection = this.attackDirection(plan.shootingTeamId);
    const goalLineX = attackDirection === 1 ? this.manifest.pitch.lengthM : 0;
    const predictedGoalPlane = predictShotAtXPlane(contact.trajectory, goalLineX);
    const expectedArrivalTick = predictedGoalPlane
      ? this.tick + Math.max(1, this.secondsToCeilingTicks(predictedGoalPlane.timeSeconds))
      : undefined;
    const reactionDelaySeconds = goalkeeperResponse
      ? goalkeeperResponse.perceptionDelaySeconds + goalkeeperResponse.reactionDelaySeconds
      : 0.2;
    this.activeShot = {
      plan,
      contact,
      goalkeeperResponse,
      releaseTick: this.tick,
      reactionTick: this.tick + Math.max(1, this.secondsToCeilingTicks(reactionDelaySeconds)),
      reactionEmitted: false,
    };
    const actualTarget = predictedGoalPlane?.position ?? plan.aimPoint;
    this.ball = {
      position: cloneVector(contact.trajectory.origin),
      velocity: cloneVector(contact.trajectory.initialVelocity),
      angularVelocity: cloneVector(contact.trajectory.angularVelocity),
      state: 'shot_in_flight',
      ownerId: null,
      lastTouchId: plan.shooterId,
      flight: {
        kind: 'shot',
        decisionId: plan.decisionId,
        fromActorId: plan.shooterId,
        targetPosition: cloneVector(actualTarget),
        releasedAtTick: this.tick,
        expectedArrivalTick,
      },
    };
    this.possessionPlayerId = null;
    this.possessionTeamId = plan.shootingTeamId;
    this.possessionSinceTick = this.tick;

    return [this.createEvent(
      'shot_contact',
      [plan.shooterId],
      'released',
      plan.shootingTeamId,
      plan.decisionId,
    )];
  }

  private updateGoalkeeperReaction(): readonly MatchEventDelta[] {
    const shot = this.activeShot;
    if (!shot || shot.reactionEmitted || this.tick < shot.reactionTick) return [];
    shot.reactionEmitted = true;
    const goalkeeper = this.requireActor(shot.plan.goalkeeperId);
    const target = shot.goalkeeperResponse?.committedReachPoint ?? goalkeeper.position;
    goalkeeper.target = {
      x: clamp(target.x, 0.5, this.manifest.pitch.lengthM - 0.5),
      y: clamp(target.y, 0.5, this.manifest.pitch.widthM - 0.5),
      z: 0,
    };
    goalkeeper.action = {
      kind: 'save',
      startedAtMs: this.tick * this.tickDurationMs,
      impactAtMs: shot.goalkeeperResponse
        ? (shot.releaseTick + this.secondsToCeilingTicks(shot.goalkeeperResponse.shotArrivalSeconds)) *
          this.tickDurationMs
        : undefined,
      targetActorId: shot.plan.shooterId,
    };
    goalkeeper.actionExpiresTick = this.tick + this.secondsToTicks(1.1);
    this.setIntent(goalkeeper, {
      kind: 'goalkeeper_save',
      decisionId: shot.plan.decisionId,
      sinceTick: this.tick,
      urgency: 1,
      reason: 'commit_to_predicted_intercept',
      targetPosition: goalkeeper.target,
      targetActorId: shot.plan.shooterId,
    });

    return [this.createEvent(
      'goalkeeper_reaction',
      [shot.plan.goalkeeperId, shot.plan.shooterId],
      'committed',
      this.teamIdForPlayer(shot.plan.goalkeeperId),
      shot.plan.decisionId,
      goalkeeper.position,
    )];
  }

  private releasePass(plan: PassPlan): MatchEventDelta {
    if (this.activePass) throw new Error('Cannot release a pass while another pass is active');
    if (this.ball.ownerId !== plan.fromId) {
      throw new Error(`Player ${String(plan.fromId)} cannot pass without owning the ball`);
    }

    const receiver = this.requireActor(plan.toId);
    const targetPosition = plan.targetPosition
      ? cloneVector(plan.targetPosition)
      : this.footPosition(receiver);
    const passingTeamId = this.teamIdForPlayer(plan.fromId);
    const passDistance = Math.hypot(
      targetPosition.x - this.ball.position.x,
      targetPosition.y - this.ball.position.y,
    );
    const minimumTravelTicks = Math.ceil(
      passDistance * 1.55 / SPATIAL_SIMULATION_LIMITS.ballMaxSpeedMps * this.manifest.tickRateHz,
    );
    const arrivalTick = Math.max(plan.arrivalTick, plan.releaseTick + minimumTravelTicks);
    this.activePass = {
      plan,
      arrivalTick,
      startPosition: cloneVector(this.ball.position),
      targetPosition,
      passingTeamId,
    };
    this.ball = {
      ...this.ball,
      state: 'pass_in_flight',
      ownerId: null,
      lastTouchId: plan.fromId,
      flight: {
        kind: 'pass',
        decisionId: plan.decisionId,
        fromActorId: plan.fromId,
        intendedTargetActorId: plan.toId,
        targetPosition,
        releasedAtTick: this.tick,
        expectedArrivalTick: arrivalTick,
      },
    };
    this.possessionPlayerId = null;
    this.possessionSinceTick = this.tick;
    this.setIntent(receiver, {
      kind: 'receive_pass',
      decisionId: plan.decisionId,
      sinceTick: this.tick,
      urgency: 0.9,
      reason: 'attack_pass_target',
      targetPosition,
      targetActorId: plan.fromId,
    });

    return this.createEvent(
      'pass_started',
      [plan.fromId, plan.toId],
      'released',
      passingTeamId,
      plan.decisionId,
    );
  }

  private updateActorTargets(): void {
    const { lengthM, widthM } = this.manifest.pitch;
    const kickoffSettled = this.tick >= this.passPlans[0].releaseTick;
    const allPlayers = this.playerSnapshots();
    const possessionChanged = this.lastObservedPossessionTeamId !== null &&
      this.lastObservedPossessionTeamId !== this.possessionTeamId;
    if (possessionChanged) this.lastTurnoverTick = this.tick;
    this.lastObservedPossessionTeamId = this.possessionTeamId;
    if (this.tick >= OPEN_PLAY_START_TICK && (possessionChanged || this.tick >= this.nextTeamPlanTick)) {
      this.coordinatedMovement = new Map();
      for (const team of [this.manifest.home, this.manifest.away]) {
        if (!team.tactics) continue;
        const plan = planTeamMovement({
          teamId: team.teamId, attackDirection: this.attackDirection(team.teamId),
          pitch: this.manifest.pitch, assignments: [...this.assignments.values()],
          players: allPlayers, ball: this.ball.position, ballOwnerId: this.ball.ownerId,
          possessionTeamId: this.possessionTeamId, ticksSinceTurnover: this.tick - this.lastTurnoverTick,
          tick: this.tick, tickRateHz: this.manifest.tickRateHz, tactics: team.tactics,
        });
        for (const [id, movement] of plan) this.coordinatedMovement.set(id, movement);
      }
      // Brief commitment avoids changing every player's responsibility at 20 Hz.
      // A turnover invalidates this immediately, using the next tick-start world.
      this.nextTeamPlanTick = this.tick + Math.max(1, this.secondsToTicks(0.25));
    }
    const pressureTargetPosition = this.activePass?.targetPosition ?? this.ball.position;
    const defendingPlayers = allPlayers
      .filter(player => player.teamId !== this.possessionTeamId && player.role !== 'GK')
      .sort((left, right) =>
        Math.hypot(
          left.position.x - pressureTargetPosition.x,
          left.position.y - pressureTargetPosition.y,
        ) -
        Math.hypot(
          right.position.x - pressureTargetPosition.x,
          right.position.y - pressureTargetPosition.y,
        ) || String(left.id).localeCompare(String(right.id)));
    const pressingIds = new Set<EntityId>(
      kickoffSettled ? defendingPlayers.slice(0, this.activePass ? 1 : 2).map(player => player.id) : [],
    );
    const interceptionId = this.activePass ? defendingPlayers[0]?.id : undefined;

    for (const actor of this.actors.values()) {
      const assignment = actor.assignment;
      if (!assignment) continue;

      const role = roleOf(assignment);
      const teamId = assignment.participant.teamId;
      if (teamId === null) continue;
      const opponents = allPlayers.filter(player => player.teamId !== teamId);
      actor.pressure = calculatePressure(actor.position, opponents).value;
      const inPossession = teamId === this.possessionTeamId;
      const shapeTarget = kickoffSettled
        ? calculateShapeTarget({
            attackDirection: this.attackDirection(teamId),
            basePosition: assignment.basePosition,
            ballPosition: this.ball.position,
            inPossession,
            pitch: this.manifest.pitch,
            role,
          })
        : cloneVector(assignment.basePosition);
      actor.target = cloneVector(shapeTarget);
      const coordinated = this.coordinatedMovement.get(actor.participant.id);
      actor.footballDecision = coordinated?.trace;
      if (coordinated) actor.target = cloneVector(coordinated.target);

      if (this.pendingShot?.shooterId === actor.participant.id) {
        actor.target = cloneVector(actor.position);
        this.setIntent(actor, {
          kind: 'shoot',
          decisionId: this.pendingShot.decisionId,
          sinceTick: this.pendingShot.actionStartTick,
          urgency: 0.98,
          reason: this.pendingShot.reason,
          targetPosition: this.pendingShot.aimPoint,
          targetActorId: this.pendingShot.goalkeeperId,
        });
        continue;
      }

      if (this.activeShot?.plan.goalkeeperId === actor.participant.id) {
        const response = this.activeShot.goalkeeperResponse;
        const committed = this.activeShot.reactionEmitted && response
          ? response.committedReachPoint
          : actor.position;
        actor.target = {
          x: clamp(committed.x, 0.5, lengthM - 0.5),
          y: clamp(committed.y, 0.5, widthM - 0.5),
          z: 0,
        };
        this.setIntent(actor, {
          kind: this.activeShot.reactionEmitted ? 'goalkeeper_save' : 'goalkeeper_set',
          decisionId: this.activeShot.plan.decisionId,
          sinceTick: this.activeShot.reactionEmitted
            ? this.activeShot.reactionTick
            : this.activeShot.releaseTick,
          urgency: this.activeShot.reactionEmitted ? 1 : 0.9,
          reason: this.activeShot.reactionEmitted
            ? 'commit_to_predicted_intercept'
            : 'set_for_shot',
          targetPosition: actor.target,
          targetActorId: this.activeShot.plan.shooterId,
        });
        continue;
      }

      if (this.activeShot?.plan.shooterId === actor.participant.id) {
        this.setIntent(actor, {
          kind: 'shoot',
          decisionId: this.activeShot.plan.decisionId,
          sinceTick: this.activeShot.plan.actionStartTick,
          urgency: 0.9,
          reason: 'follow_shot',
          targetPosition: this.activeShot.plan.aimPoint,
          targetActorId: this.activeShot.plan.goalkeeperId,
        });
        continue;
      }

      if (this.pendingPass?.fromId === actor.participant.id) {
        this.setIntent(actor, {
          kind: 'pass',
          decisionId: this.pendingPass.decisionId,
          sinceTick: this.pendingPass.actionStartTick,
          urgency: 0.88,
          reason: this.pendingPass.reason,
          targetPosition: this.pendingPass.targetPosition,
          targetActorId: this.pendingPass.toId,
        });
        continue;
      }

      if (this.activePass?.plan.toId === actor.participant.id) {
        actor.target = cloneVector(this.activePass.targetPosition);
        this.setIntent(actor, {
          kind: 'receive_pass',
          decisionId: this.activePass.plan.decisionId,
          sinceTick: this.activePass.plan.releaseTick,
          urgency: 0.96,
          reason: 'attack_pass_target',
          targetPosition: this.activePass.targetPosition,
          targetActorId: this.activePass.plan.fromId,
        });
        continue;
      }

      if (this.activeContest?.plan.toId === actor.participant.id) {
        actor.target = cloneVector(this.activeContest.position);
        this.setIntent(actor, {
          kind: 'receive_pass',
          decisionId: this.activeContest.plan.decisionId,
          sinceTick: this.tick,
          urgency: 1,
          reason: 'contest_first_touch',
          targetPosition: this.activeContest.position,
          targetActorId: this.activeContest.interceptorId,
        });
        continue;
      }

      if (this.activeContest?.interceptorId === actor.participant.id) {
        actor.target = cloneVector(this.activeContest.position);
        this.setIntent(actor, {
          kind: 'intercept',
          decisionId: this.activeContest.plan.decisionId,
          sinceTick: this.tick,
          urgency: 1,
          reason: 'win_contested_ball',
          targetPosition: this.activeContest.position,
          targetActorId: this.activeContest.plan.toId,
        });
        continue;
      }

      if (this.activePass && interceptionId === actor.participant.id && !coordinated) {
        actor.target = {
          x: clamp(this.ball.position.x, 1, lengthM - 1),
          y: clamp(this.ball.position.y, 1, widthM - 1),
          z: 0,
        };
        this.setIntent(actor, {
          kind: 'intercept',
          decisionId: this.activePass.plan.decisionId,
          sinceTick: this.activePass.plan.releaseTick,
          urgency: 1,
          reason: 'nearest_pass_lane_challenge',
          targetPosition: this.activePass.targetPosition,
          targetActorId: this.activePass.plan.toId,
        });
        continue;
      }

      if (actor.participant.id === this.possessionPlayerId && kickoffSettled) {
        const direction = this.attackDirection(teamId);
        const nearest = calculatePressure(actor.position, opponents);
        const nearestOpponent = nearest.nearestOpponentId === null
          ? null
          : this.requireActor(nearest.nearestOpponentId);
        const escapeY = nearestOpponent
          ? Math.sign(actor.position.y - nearestOpponent.position.y || 1) * nearest.value * 1.8
          : 0;
        actor.target = {
          x: clamp(actor.position.x + direction * (2.3 - nearest.value * 0.8), 1, lengthM - 1),
          y: clamp(actor.position.y + escapeY, 1, widthM - 1),
          z: 0,
        };
        this.setIntent(actor, {
          kind: 'carry',
          sinceTick: this.tick,
          urgency: 0.55 + nearest.value * 0.35,
          reason: nearest.value > 0.55 ? 'escape_local_pressure' : 'advance_with_control',
          targetPosition: actor.target,
        });
        continue;
      }

      if (coordinated) {
        this.setIntent(actor, coordinated.intent);
        continue;
      }

      if (pressingIds.has(actor.participant.id)) {
        const targetActorId = this.possessionPlayerId ?? this.activePass?.plan.toId;
        actor.target = {
          x: clamp(pressureTargetPosition.x, 1, lengthM - 1),
          y: clamp(pressureTargetPosition.y, 1, widthM - 1),
          z: 0,
        };
        this.setIntent(actor, {
          kind: 'press',
          sinceTick: this.tick,
          urgency: 0.9,
          reason: 'nearest_press_trigger',
          targetPosition: actor.target,
          targetActorId,
        });
        continue;
      }

      const wideRole = ['RB', 'LB', 'RWB', 'LWB', 'RW', 'LW', 'AMR', 'AML'].includes(role);
      this.setIntent(actor, {
        kind: inPossession ? (wideRole ? 'offer_width' : 'support') :
          (roleLineWeight(role) >= 0.68 ? 'track_runner' : 'cover'),
        sinceTick: this.tick,
        urgency: inPossession ? 0.52 : 0.58,
        reason: inPossession
          ? (wideRole ? 'stretch_defensive_block' : 'maintain_support_triangle')
          : 'protect_team_shape',
        targetPosition: actor.target,
      });
    }

    this.updateOfficialTargets();
  }

  private updateOfficialTargets(): void {
    const { lengthM, widthM } = this.manifest.pitch;
    const referee = this.requireActor(this.refereeId);
    referee.target = {
      x: clamp(this.ball.position.x - this.attackDirection(this.possessionTeamId) * 7, 5, lengthM - 5),
      y: clamp(this.ball.position.y + this.refereeDiagonalSign * 5, 5, widthM - 5),
      z: 0,
    };
    this.setIntent(referee, {
      kind: 'referee_position',
      sinceTick: this.tick,
      urgency: 0.72,
      reason: 'referee_diagonal',
      targetPosition: referee.target,
      targetActorId: this.possessionPlayerId ?? undefined,
    });

    this.assistantIds.forEach(assistantId => {
      const assistant = this.requireActor(assistantId);
      const near = assistant.participant.role === 'assistant_near';
      const defendingTeamId = near ? this.manifest.home.teamId : this.manifest.away.teamId;
      assistant.target = {
        x: clamp(this.currentOffsideLine(defendingTeamId), 0, lengthM),
        y: near
          ? widthM + TOUCHLINE_OFFICIAL_OFFSET_M
          : -TOUCHLINE_OFFICIAL_OFFSET_M,
        z: 0,
      };
      this.setIntent(assistant, {
        kind: 'offside_line',
        sinceTick: this.tick,
        urgency: 0.8,
        reason: 'second_last_defender_reference',
        targetPosition: assistant.target,
      });
    });
  }

  private currentOffsideLine(defendingTeamId: EntityId): number {
    const actorFrames: MatchActorFrame[] = [...this.actors.values()].map(actor => ({
      id: actor.participant.id,
      onField: actor.onField,
      position: actor.position,
      velocity: actor.velocity,
      yaw: actor.yaw,
      locomotion: actor.locomotion,
      action: actor.action,
    }));
    return calculateOffsideReference(
      this.manifest,
      actorFrames,
      this.ball.position.x,
      defendingTeamId,
    ).x;
  }

  private integrateActors(deltaSeconds: number): void {
    const tickStartById = new Map<EntityId, ActorTickSnapshot>();

    for (const actor of this.actors.values()) {
      tickStartById.set(actor.participant.id, {
        position: cloneVector(actor.position),
        velocity: cloneVector(actor.velocity),
        target: cloneVector(actor.target),
        yaw: actor.yaw,
        locomotion: actor.locomotion,
        stamina: actor.stamina,
      });
    }

    // Keep separation summation stable even if actor storage or manifest order
    // changes. Every player in this collection describes the same tick-start
    // world; no actor can observe a neighbour that has already moved.
    const tickStartPlayers = [...this.actors.values()]
      .filter(actor => actor.onField && actor.assignment)
      .sort((left, right) => compareEntityIds(left.participant.id, right.participant.id))
      .map(actor => {
        const snapshot = tickStartById.get(actor.participant.id);
        const assignment = actor.assignment;
        if (!snapshot || !assignment || actor.participant.teamId === null) {
          throw new Error(`Actor ${String(actor.participant.id)} is not an on-field player`);
        }
        return {
          id: actor.participant.id,
          teamId: actor.participant.teamId,
          role: roleOf(assignment),
          position: snapshot.position,
          velocity: snapshot.velocity,
          stamina: snapshot.stamina,
        } satisfies FootballerSnapshot;
      });

    const updates = new Map<EntityId, ActorKinematicsUpdate>();
    for (const actor of this.actors.values()) {
      const snapshot = tickStartById.get(actor.participant.id);
      if (!snapshot) throw new Error(`Missing tick-start actor ${String(actor.participant.id)}`);
      updates.set(
        actor.participant.id,
        this.integrateActor(actor, snapshot, tickStartPlayers, deltaSeconds),
      );
    }

    for (const [id, update] of updates) {
      const actor = this.requireActor(id);
      actor.position = update.position;
      actor.velocity = update.velocity;
      actor.yaw = update.yaw;
      actor.locomotion = update.locomotion;
      actor.stamina = update.stamina;
    }
  }

  private integrateActor(
    actor: MutableActorState,
    snapshot: ActorTickSnapshot,
    tickStartPlayers: readonly FootballerSnapshot[],
    deltaSeconds: number,
  ): ActorKinematicsUpdate {
    if (actor.maxSpeedMps === 0) return snapshot;

    const displacement = {
      x: snapshot.target.x - snapshot.position.x,
      y: snapshot.target.y - snapshot.position.y,
      z: 0,
    };
    const distance = magnitude2D(displacement);
    const brakingSpeed = Math.sqrt(2 * actor.maxAccelerationMps2 * distance);
    const effort = actor.footballDecision ? 0.55 + (actor.intent?.urgency ?? 0.6) * 0.45 : 1;
    const effectiveMaxSpeed = actor.maxSpeedMps * (0.78 + snapshot.stamina / 100 * 0.22);
    const desiredSpeed = Math.min(effectiveMaxSpeed * effort, brakingSpeed);
    let desiredVelocity: MatchVector3 = distance > 0.0001
      ? {
          x: displacement.x / distance * desiredSpeed,
          y: displacement.y / distance * desiredSpeed,
          z: 0,
        }
      : { x: 0, y: 0, z: 0 };

    if (actor.assignment) {
      const teamId = actor.participant.teamId;
      if (teamId === null) {
        throw new Error(`Actor ${String(actor.participant.id)} is not an on-field player`);
      }
      const separation = calculateSeparationSteering(
        {
          id: actor.participant.id,
          teamId,
          role: roleOf(actor.assignment),
          position: snapshot.position,
          velocity: snapshot.velocity,
          stamina: snapshot.stamina,
        },
        tickStartPlayers,
      );
      desiredVelocity = clampVector2D({
        x: desiredVelocity.x + separation.x * 1.6,
        y: desiredVelocity.y + separation.y * 1.6,
        z: 0,
      }, effectiveMaxSpeed);
    }

    const velocityDelta = clampVector2D({
      x: desiredVelocity.x - snapshot.velocity.x,
      y: desiredVelocity.y - snapshot.velocity.y,
      z: 0,
    }, actor.maxAccelerationMps2 * deltaSeconds);
    const nextVelocity = clampVector2D({
      x: snapshot.velocity.x + velocityDelta.x,
      y: snapshot.velocity.y + velocityDelta.y,
      z: 0,
    }, effectiveMaxSpeed);

    const nextX = snapshot.position.x + nextVelocity.x * deltaSeconds;
    const nextY = snapshot.position.y + nextVelocity.y * deltaSeconds;
    const keepInsidePitch = actor.assignment !== undefined || actor.participant.kind === 'referee';
    const position = {
      x: keepInsidePitch ? clamp(nextX, 0, this.manifest.pitch.lengthM) : nextX,
      y: keepInsidePitch ? clamp(nextY, 0, this.manifest.pitch.widthM) : nextY,
      z: 0,
    };

    const speed = magnitude2D(nextVelocity);
    let yaw = snapshot.yaw;
    if (speed > 0.08) {
      const desiredYaw = Math.atan2(nextVelocity.y, nextVelocity.x);
      yaw = moveAngleTowards(
        snapshot.yaw,
        desiredYaw,
        SPATIAL_SIMULATION_LIMITS.maxTurnRateRadPerSecond * deltaSeconds,
      );
    }
    return {
      position,
      velocity: nextVelocity,
      yaw,
      locomotion: locomotionForSpeed(speed),
      stamina: actor.participant.attributes
        ? clamp(snapshot.stamina + deltaSeconds * (speed < 1.8 ? 0.015 :
          -0.009 * Math.pow(speed / 4, 2) * (1.6 - (actor.participant.attributes.endurance ?? 65) / 100)), 0, 100)
        : Math.max(0, snapshot.stamina - speed * deltaSeconds * 0.0008),
    };
  }

  private updateBall(deltaSeconds: number): MatchEventDelta[] {
    if (this.activeContest) return this.resolveContest();
    if (this.activeShot) return this.updateShotBall();

    if (!this.activePass) {
      if (this.ball.ownerId !== null) {
        const owner = this.requireActor(this.ball.ownerId);
        this.ball = {
          position: this.footPosition(owner),
          velocity: cloneVector(owner.velocity),
          angularVelocity: { x: 0, y: 0, z: 0 },
          state: 'controlled',
          ownerId: owner.participant.id,
          lastTouchId: this.ball.lastTouchId,
          flight: null,
        };
      }
      return [];
    }

    const activePass = this.activePass;
    const { plan, arrivalTick, startPosition, targetPosition, passingTeamId } = activePass;
    const progress = clamp(
      (this.tick - plan.releaseTick + 1) / (arrivalTick - plan.releaseTick + 1),
      0,
      1,
    );
    const easedProgress = progress * progress * (3 - 2 * progress);
    const previousPosition = this.ball.position;
    const nextPosition = {
      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
      z: BALL_RADIUS_M + Math.sin(Math.PI * progress) * (plan.scripted ? 0.18 : 0.12),
    };
    const velocity = {
      x: (nextPosition.x - previousPosition.x) / deltaSeconds,
      y: (nextPosition.y - previousPosition.y) / deltaSeconds,
      z: (nextPosition.z - previousPosition.z) / deltaSeconds,
    };
    const planarSpeed = Math.hypot(velocity.x, velocity.y);
    this.ball = {
      position: nextPosition,
      velocity,
      angularVelocity: {
        x: -velocity.y / BALL_RADIUS_M,
        y: velocity.x / BALL_RADIUS_M,
        z: planarSpeed * 0.08,
      },
      state: 'pass_in_flight',
      ownerId: null,
      lastTouchId: plan.fromId,
      flight: this.ball.flight,
    };

    if (!plan.scripted && this.tick > plan.releaseTick + 1) {
      const opponents = this.playerSnapshots().filter(player => player.teamId !== passingTeamId);
      const interception = selectInterceptionCandidate(previousPosition, nextPosition, opponents);
      if (interception) {
        const interceptor = this.requireActor(interception.playerId);
        interceptor.action = {
          kind: 'intercept',
          startedAtMs: this.tick * this.tickDurationMs,
          impactAtMs: (this.tick + 1) * this.tickDurationMs,
          targetActorId: plan.toId,
        };
        interceptor.actionExpiresTick = this.tick + this.secondsToTicks(0.45);
        this.activeContest = {
          plan,
          interceptorId: interception.playerId,
          passingTeamId,
          position: cloneVector(nextPosition),
          resolveTick: this.tick + 1,
        };
        this.activePass = null;
        this.ball = {
          ...this.ball,
          velocity: { x: velocity.x * 0.22, y: velocity.y * 0.22, z: 0 },
          angularVelocity: { x: 0, y: 0, z: 0 },
          state: 'contested',
          flight: null,
        };
        this.possessionSinceTick = this.tick;
        return [this.createEvent(
          'interception_attempted',
          [interception.playerId, plan.fromId, plan.toId],
          'first_contact',
          this.teamIdForPlayer(interception.playerId),
          plan.decisionId,
        )];
      }
    }

    if (this.tick < arrivalTick) return [];

    const receiver = this.requireActor(plan.toId);
    receiver.action = {
      kind: 'receive',
      startedAtMs: this.tick * this.tickDurationMs,
      impactAtMs: this.tick * this.tickDurationMs,
      targetActorId: plan.fromId,
    };
    receiver.actionExpiresTick = this.tick + this.secondsToTicks(0.4);
    this.possessionPlayerId = plan.toId;
    this.possessionTeamId = this.teamIdForPlayer(plan.toId);
    this.possessionSinceTick = this.tick;
    this.ball = {
      position: this.footPosition(receiver),
      velocity: cloneVector(receiver.velocity),
      angularVelocity: { x: 0, y: 0, z: 0 },
      state: 'controlled',
      ownerId: plan.toId,
      lastTouchId: plan.toId,
      flight: null,
    };
    this.activePass = null;
    this.nextDecisionTick = Math.max(
      OPEN_PLAY_START_TICK + 1,
      this.tick + this.secondsToTicks(this.teamManifest(passingTeamId).tactics
        ? 1.2 - this.teamManifest(passingTeamId).tactics!.tempo * 0.009 : 0.75) + this.semanticInteger({
        namespace: 'team.decision.schedule',
        period: 'first_half',
        tick: this.tick,
        decisionId: plan.decisionId,
        actorIds: [plan.fromId, plan.toId],
        sampleKind: 'delay_after_completed_pass_ticks',
      }, 0, 8),
    );

    return [
      this.createEvent(
        'receive_started',
        [plan.toId, plan.fromId],
        'controlled_touch',
        passingTeamId,
        plan.decisionId,
      ),
      this.createEvent(
        'pass_completed',
        [plan.fromId, plan.toId],
        'received',
        passingTeamId,
        plan.decisionId,
      ),
    ];
  }

  private goalFrameContact(
    previousPosition: MatchVector3,
    nextPosition: MatchVector3,
    attackDirection: 1 | -1,
  ): { readonly location: MatchVector3; readonly outcome: string } | null {
    const lineX = attackDirection === 1 ? this.manifest.pitch.lengthM : 0;
    const deltaX = nextPosition.x - previousPosition.x;
    if (deltaX * attackDirection <= 0) return null;
    const interpolation = (lineX - previousPosition.x) / deltaX;
    if (interpolation < 0 || interpolation > 1) return null;
    const location = {
      x: lineX,
      y: previousPosition.y + (nextPosition.y - previousPosition.y) * interpolation,
      z: previousPosition.z + (nextPosition.z - previousPosition.z) * interpolation,
    };
    const centreY = this.manifest.pitch.widthM / 2;
    const halfGoalWidth = CAUSAL_SCORING_LIMITS.goalWidthM / 2;
    const lateralDistance = Math.abs(location.y - centreY);
    const postContact = Math.abs(lateralDistance - halfGoalWidth) <= BALL_RADIUS_M &&
      location.z <= CAUSAL_SCORING_LIMITS.goalHeightM + BALL_RADIUS_M;
    if (postContact) {
      return {
        location,
        outcome: location.y < centreY ? 'left_post' : 'right_post',
      };
    }
    const crossbarContact = lateralDistance <= halfGoalWidth + BALL_RADIUS_M &&
      Math.abs(location.z - CAUSAL_SCORING_LIMITS.goalHeightM) <= BALL_RADIUS_M;
    return crossbarContact ? { location, outcome: 'crossbar' } : null;
  }

  private updateShotBall(): MatchEventDelta[] {
    const shot = this.activeShot;
    if (!shot) return [];
    const elapsedSeconds = (this.tick - shot.releaseTick) / this.manifest.tickRateHz;
    const previousPosition = this.ball.position;
    const next = predictShotTrajectoryPoint(
      shot.contact.trajectory,
      Math.min(elapsedSeconds, CAUSAL_SCORING_LIMITS.maximumFlightSeconds),
    );
    this.ball = {
      position: cloneVector(next.position),
      velocity: cloneVector(next.velocity),
      angularVelocity: cloneVector(shot.contact.trajectory.angularVelocity),
      state: 'shot_in_flight',
      ownerId: null,
      lastTouchId: shot.plan.shooterId,
      flight: this.ball.flight,
    };

    const goalkeeperResponse = shot.goalkeeperResponse;
    if (goalkeeperResponse) {
      const goalkeeperContactTick = shot.releaseTick +
        Math.max(1, this.secondsToCeilingTicks(goalkeeperResponse.shotArrivalSeconds));
      if (this.tick >= goalkeeperContactTick && goalkeeperResponse.makesContact) {
        const goalkeeper = this.requireActor(shot.plan.goalkeeperId);
        const defendingTeamId = this.teamIdForPlayer(shot.plan.goalkeeperId);
        const previousTeamId = this.possessionTeamId;
        this.activeShot = null;
        this.possessionPlayerId = shot.plan.goalkeeperId;
        this.possessionTeamId = defendingTeamId;
        this.possessionSinceTick = this.tick;
        this.ball = {
          position: this.footPosition(goalkeeper),
          velocity: cloneVector(goalkeeper.velocity),
          angularVelocity: { x: 0, y: 0, z: 0 },
          state: 'controlled',
          ownerId: shot.plan.goalkeeperId,
          lastTouchId: shot.plan.goalkeeperId,
          flight: null,
        };
        this.nextDecisionTick = this.tick + this.secondsToTicks(0.9);
        return [
          this.createEvent(
            'shot_saved',
            [shot.plan.goalkeeperId, shot.plan.shooterId],
            'caught',
            defendingTeamId,
            shot.plan.decisionId,
            goalkeeperResponse.actualInterceptPoint,
          ),
          this.createEvent(
            'possession_changed',
            [shot.plan.goalkeeperId],
            `${String(previousTeamId)}_to_${String(defendingTeamId)}`,
            defendingTeamId,
            shot.plan.decisionId,
          ),
        ];
      }
    }

    const attackDirection = this.attackDirection(shot.plan.shootingTeamId);
    const frameContact = this.goalFrameContact(previousPosition, next.position, attackDirection);
    if (frameContact) {
      this.activeShot = null;
      this.terminalStoppage = true;
      this.playState = 'dead_ball';
      this.possessionPlayerId = null;
      this.possessionSinceTick = this.tick;
      this.ball = {
        position: cloneVector(frameContact.location),
        velocity: {
          x: -next.velocity.x * 0.34,
          y: next.velocity.y * 0.58,
          z: Math.max(0, next.velocity.z) * 0.45,
        },
        angularVelocity: cloneVector(shot.contact.trajectory.angularVelocity),
        state: 'loose',
        ownerId: null,
        lastTouchId: shot.plan.shooterId,
        flight: null,
      };
      return [this.createEvent(
        'shot_woodwork',
        [shot.plan.shooterId],
        frameContact.outcome,
        shot.plan.shootingTeamId,
        shot.plan.decisionId,
        frameContact.location,
      )];
    }

    const goalLineDecision = adjudicateGoalLine({
      pitch: this.manifest.pitch,
      attackDirection,
      previousBallPosition: previousPosition,
      nextBallPosition: next.position,
      ballRadiusM: BALL_RADIUS_M,
    });
    if (goalLineDecision.wholeBallCrossed && goalLineDecision.crossingPoint) {
      const crossingPoint = goalLineDecision.crossingPoint;
      this.activeShot = null;
      this.terminalStoppage = true;
      this.playState = 'dead_ball';
      this.possessionPlayerId = null;
      this.possessionSinceTick = this.tick;
      this.ball = {
        position: cloneVector(crossingPoint),
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        state: 'loose',
        ownerId: null,
        lastTouchId: shot.plan.shooterId,
        flight: null,
      };
      if (goalLineDecision.isGoal) {
        if (shot.plan.shootingTeamId === this.manifest.home.teamId) this.homeScore += 1;
        else this.awayScore += 1;
        const shooter = this.requireActor(shot.plan.shooterId);
        shooter.action = {
          kind: 'celebrate',
          startedAtMs: this.tick * this.tickDurationMs,
        };
        shooter.actionExpiresTick = this.tick + this.secondsToTicks(2);
        this.setIntent(shooter, {
          kind: 'celebrate',
          decisionId: shot.plan.decisionId,
          sinceTick: this.tick,
          urgency: 1,
          reason: 'goal_awarded',
          targetPosition: cloneVector(shooter.position),
        });
        return [
          this.createEvent(
            'goal_line_crossed',
            [shot.plan.shooterId],
            'valid',
            shot.plan.shootingTeamId,
            shot.plan.decisionId,
            crossingPoint,
          ),
          this.createEvent(
            'goal',
            [shot.plan.shooterId],
            'awarded',
            shot.plan.shootingTeamId,
            shot.plan.decisionId,
            crossingPoint,
          ),
        ];
      }
      return [this.createEvent(
        'shot_missed',
        [shot.plan.shooterId],
        goalLineDecision.outcome,
        shot.plan.shootingTeamId,
        shot.plan.decisionId,
        crossingPoint,
      )];
    }

    if (elapsedSeconds >= CAUSAL_SCORING_LIMITS.maximumFlightSeconds) {
      this.activeShot = null;
      this.terminalStoppage = true;
      this.playState = 'dead_ball';
      this.ball = { ...this.ball, state: 'loose', flight: null };
      return [this.createEvent(
        'shot_missed',
        [shot.plan.shooterId],
        'flight_expired',
        shot.plan.shootingTeamId,
        shot.plan.decisionId,
      )];
    }

    return [];
  }

  private resolveContest(): MatchEventDelta[] {
    const contest = this.activeContest;
    if (!contest || this.tick < contest.resolveTick) return [];
    const interceptor = this.requireActor(contest.interceptorId);
    const previousTeamId = this.possessionTeamId;
    const interceptorTeamId = this.teamIdForPlayer(contest.interceptorId);
    this.possessionPlayerId = contest.interceptorId;
    this.possessionTeamId = interceptorTeamId;
    this.possessionSinceTick = this.tick;
    this.ball = {
      position: this.footPosition(interceptor),
      velocity: cloneVector(interceptor.velocity),
      angularVelocity: { x: 0, y: 0, z: 0 },
      state: 'controlled',
      ownerId: contest.interceptorId,
      lastTouchId: contest.interceptorId,
      flight: null,
    };
    const carryTarget = {
      x: clamp(
        interceptor.position.x + this.attackDirection(interceptorTeamId) * 2,
        1,
        this.manifest.pitch.lengthM - 1,
      ),
      y: clamp(interceptor.position.y, 1, this.manifest.pitch.widthM - 1),
      z: 0,
    };
    interceptor.target = carryTarget;
    this.setIntent(interceptor, {
      kind: 'carry',
      decisionId: contest.plan.decisionId,
      sinceTick: this.tick,
      urgency: 0.9,
      reason: 'secure_interception',
      targetPosition: carryTarget,
    });
    const intendedReceiver = this.requireActor(contest.plan.toId);
    intendedReceiver.target = cloneVector(interceptor.position);
    this.setIntent(intendedReceiver, {
      kind: 'press',
      decisionId: contest.plan.decisionId,
      sinceTick: this.tick,
      urgency: 0.96,
      reason: 'counterpress_after_turnover',
      targetPosition: cloneVector(interceptor.position),
      targetActorId: contest.interceptorId,
    });
    this.activeContest = null;
    this.nextDecisionTick = this.tick + this.secondsToTicks(0.85) + this.semanticInteger({
      namespace: 'team.decision.schedule',
      period: 'first_half',
      tick: this.tick,
      decisionId: contest.plan.decisionId,
      actorIds: [contest.interceptorId, contest.plan.fromId, contest.plan.toId],
      sampleKind: 'delay_after_interception_ticks',
    }, 0, 8);

    return [
      this.createEvent(
        'interception',
        [contest.interceptorId, contest.plan.fromId, contest.plan.toId],
        'possession_won',
        interceptorTeamId,
        contest.plan.decisionId,
      ),
      this.createEvent(
        'possession_changed',
        [contest.interceptorId],
        `${String(previousTeamId)}_to_${String(interceptorTeamId)}`,
        interceptorTeamId,
        contest.plan.decisionId,
      ),
    ];
  }

  private footPosition(actor: MutableActorState): MatchVector3 {
    return {
      x: actor.position.x + Math.cos(actor.yaw) * PLAYER_FOOT_OFFSET_M,
      y: actor.position.y + Math.sin(actor.yaw) * PLAYER_FOOT_OFFSET_M,
      z: BALL_RADIUS_M,
    };
  }

  private createEvent(
    type: string,
    actorIds: readonly EntityId[],
    outcome: string,
    teamId?: EntityId,
    decisionId?: number,
    location?: MatchVector3,
  ): MatchEventDelta {
    this.eventSequence += 1;
    return {
      sequence: this.eventSequence,
      decisionId,
      type,
      simTimeMs: this.tick * this.tickDurationMs,
      teamId,
      actorIds,
      location: cloneVector(location ?? this.ball.position),
      outcome,
    };
  }

  private phase(): MatchFlowPhase {
    if (this.terminalStoppage) return 'stoppage';
    if (this.tick < this.passPlans[0].releaseTick) return 'kickoff';
    if (this.tick < this.passPlans[1].arrivalTick) return 'build_up';
    if (this.pendingShot || this.activeShot) return 'final_third';
    if (this.ball.state === 'contested' ||
        (this.tick >= OPEN_PLAY_START_TICK &&
          this.tick - this.possessionSinceTick <= this.secondsToTicks(1.2))) {
      return 'transition';
    }
    const direction = this.attackDirection(this.possessionTeamId);
    const progress = direction === 1
      ? this.ball.position.x / this.manifest.pitch.lengthM
      : (this.manifest.pitch.lengthM - this.ball.position.x) / this.manifest.pitch.lengthM;
    if (progress >= 0.72) return 'final_third';
    return progress >= 0.48 ? 'progression' : 'build_up';
  }

  private buildFrame(events: readonly MatchEventDelta[]): MatchFrame {
    const actors: MatchActorFrame[] = this.participantOrder.map(id => {
      const actor = this.requireActor(id);
      return {
        id,
        onField: actor.onField,
        position: cloneVector(actor.position),
        velocity: cloneVector(actor.velocity),
        yaw: actor.yaw,
        locomotion: actor.locomotion,
        action: actor.action ? { ...actor.action } : null,
        stamina: actor.stamina,
        hasPossession: id === this.possessionPlayerId,
        intent: actor.intent
          ? {
              ...actor.intent,
              targetPosition: actor.intent.targetPosition
                ? cloneVector(actor.intent.targetPosition)
                : undefined,
            }
          : null,
        pressure: actor.pressure,
        ...(actor.footballDecision ? { footballDecision: actor.footballDecision } : {}),
        targetActorId: actor.targetActorId,
      };
    });

    const frame: MatchFrame = {
      version: MATCH_PROTOCOL_VERSION,
      matchId: this.manifest.matchId,
      sequence: this.sequence,
      tick: this.tick,
      simTimeMs: this.tick * this.tickDurationMs,
      period: 'first_half',
      playState: this.playState,
      phase: this.phase(),
      score: { home: this.homeScore, away: this.awayScore },
      possession: {
        teamId: this.possessionTeamId,
        playerId: this.possessionPlayerId,
        phase: this.ball.state === 'controlled'
          ? 'controlled'
          : this.ball.state === 'pass_in_flight'
            ? 'pass_in_flight'
            : this.ball.state === 'shot_in_flight'
              ? 'shot_in_flight'
            : this.ball.state === 'contested'
              ? 'contested'
              : 'unclaimed',
        sinceTick: this.possessionSinceTick,
      },
      actors,
      ball: {
        position: cloneVector(this.ball.position),
        velocity: cloneVector(this.ball.velocity),
        angularVelocity: cloneVector(this.ball.angularVelocity),
        state: this.ball.state,
        ownerId: this.ball.ownerId,
        lastTouchId: this.ball.lastTouchId,
        flight: this.ball.flight
          ? {
              ...this.ball.flight,
              targetPosition: cloneVector(this.ball.flight.targetPosition),
            }
          : null,
      },
      events: events.map(event => ({
        ...event,
        actorIds: [...event.actorIds],
        location: event.location ? cloneVector(event.location) : undefined,
      })),
    };

    assertValidMatchFrame(frame, this.manifest);
    return frame;
  }

  private requireActor(id: EntityId): MutableActorState {
    const actor = this.actors.get(id);
    if (!actor) throw new Error(`Unknown match actor ${String(id)}`);
    return actor;
  }
}
