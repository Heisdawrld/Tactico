import type { MatchPitchDimensions, MatchVector3 } from '../protocol';

export const CAUSAL_SCORING_VERSION = 1 as const;

export const CAUSAL_SCORING_LIMITS = Object.freeze({
  ballRadiusM: 0.11,
  goalWidthM: 7.32,
  goalHeightM: 2.44,
  gravityMps2: 9.81,
  minimumShotSpeedMps: 12,
  maximumShotSpeedMps: 38,
  maximumFlightSeconds: 5,
});

export type AttackDirection = 1 | -1;

export interface ShotBlocker {
  readonly position: MatchVector3;
  /** Approximate planar body/control radius. Defaults to 0.45 metres. */
  readonly controlRadiusM?: number;
}

export interface ShotOpportunityInput {
  readonly pitch: MatchPitchDimensions;
  readonly attackDirection: AttackDirection;
  readonly ballPosition: MatchVector3;
  readonly targetPoint: MatchVector3;
  readonly shooterFacingYaw: number;
  readonly pressure: number;
  readonly balance: number;
  readonly goalkeeperPosition: MatchVector3;
  readonly blockers: readonly ShotBlocker[];
}

export type ShotOpportunityReason =
  | 'close_range'
  | 'wide_angle'
  | 'heavy_pressure'
  | 'blocked_lane'
  | 'goalkeeper_covers_target'
  | 'body_misaligned'
  | 'clear_sight';

export interface ShotOpportunityEvaluation {
  /** A bounded decision aid, not a goal probability or outcome selector. */
  readonly opportunityScore: number;
  readonly distanceM: number;
  readonly goalOpeningAngleRad: number;
  readonly distanceQuality: number;
  readonly openingQuality: number;
  readonly bodyAlignment: number;
  readonly laneObstruction: number;
  readonly goalkeeperCoverage: number;
  readonly targetInsideGoalMouth: boolean;
  readonly reasons: readonly ShotOpportunityReason[];
}

export interface ShotExecutionAttributes {
  readonly finishing: number;
  readonly technique: number;
  readonly composure: number;
  readonly balance: number;
  readonly pressure: number;
  readonly fatigue: number;
  /** 1 is the preferred foot; 0 represents no useful proficiency. */
  readonly footProficiency: number;
}

/** Independent [0, 1] samples supplied by the caller's semantic RNG keys. */
export interface ShotContactSamples {
  readonly lateralError: number;
  readonly elevationError: number;
  readonly powerError: number;
  readonly spin: number;
}

export interface ShotContactInput {
  readonly attackDirection: AttackDirection;
  readonly ballPosition: MatchVector3;
  readonly targetPoint: MatchVector3;
  readonly requestedPower: number;
  readonly attributes: ShotExecutionAttributes;
  readonly samples: ShotContactSamples;
}

export interface ShotTrajectory {
  readonly origin: MatchVector3;
  readonly initialVelocity: MatchVector3;
  readonly angularVelocity: MatchVector3;
  /** Constant first-flight curve approximation; renderers must not replace it. */
  readonly lateralAcceleration: MatchVector3;
  readonly gravityMps2: number;
  readonly ballRadiusM: number;
}

export interface ShotContactResult {
  readonly contactQuality: number;
  readonly speedMps: number;
  readonly intendedElevationRad: number;
  readonly actualElevationRad: number;
  readonly lateralErrorRad: number;
  readonly elevationErrorRad: number;
  readonly powerErrorFraction: number;
  readonly trajectory: ShotTrajectory;
}

export interface ShotTrajectoryPoint {
  readonly timeSeconds: number;
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
}

export interface GoalkeeperAttributes {
  readonly anticipation: number;
  readonly reflexes: number;
  readonly agility: number;
  readonly handling: number;
}

/** Independent [0, 1] samples supplied by the caller's semantic RNG keys. */
export interface GoalkeeperResponseSamples {
  readonly perceptionLateral: number;
  readonly perceptionVertical: number;
  readonly perceptionTiming: number;
  readonly reactionTiming: number;
  readonly diveExecution: number;
}

export interface GoalkeeperResponseInput {
  readonly trajectory: ShotTrajectory;
  readonly attackDirection: AttackDirection;
  readonly goalkeeperPosition: MatchVector3;
  readonly attributes: GoalkeeperAttributes;
  readonly lineOfSight: number;
  readonly fatigue: number;
  readonly samples: GoalkeeperResponseSamples;
}

export interface GoalkeeperResponse {
  readonly shotArrivalSeconds: number;
  readonly perceptionDelaySeconds: number;
  readonly reactionDelaySeconds: number;
  readonly movementTimeSeconds: number;
  readonly actualInterceptPoint: MatchVector3;
  readonly perceivedInterceptPoint: MatchVector3;
  readonly committedReachPoint: MatchVector3;
  readonly requiredReachM: number;
  readonly maximumReachM: number;
  readonly contactDistanceM: number;
  readonly contactRadiusM: number;
  /** Geometric reach envelope before perception error is considered. */
  readonly canReach: boolean;
  /** Physical overlap at the committed reach point. */
  readonly makesContact: boolean;
}

export type GoalLineOutcome =
  | 'goal'
  | 'no_full_crossing'
  | 'wrong_direction'
  | 'wide'
  | 'over_bar'
  | 'below_pitch';

export interface GoalLineAdjudicationInput {
  readonly pitch: MatchPitchDimensions;
  readonly attackDirection: AttackDirection;
  readonly previousBallPosition: MatchVector3;
  readonly nextBallPosition: MatchVector3;
  readonly ballRadiusM?: number;
}

export interface GoalLineDecision {
  readonly isGoal: boolean;
  readonly wholeBallCrossed: boolean;
  readonly insideGoalMouth: boolean;
  readonly outcome: GoalLineOutcome;
  /** Centre position when the trailing edge of the ball clears the line. */
  readonly crossingPoint: MatchVector3 | null;
}

const EPSILON = 1e-9;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const unit = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a finite number in [0, 1]`);
  }
  return value;
};

const rating = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be a finite number in [0, 100]`);
  }
  return value / 100;
};

const finite = (value: number, label: string): number => {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
};

const vector = (value: MatchVector3, label: string): MatchVector3 => ({
  x: finite(value.x, `${label}.x`),
  y: finite(value.y, `${label}.y`),
  z: finite(value.z, `${label}.z`),
});

const pitchDimensions = (pitch: MatchPitchDimensions): MatchPitchDimensions => {
  if (!Number.isFinite(pitch.lengthM) || pitch.lengthM <= 0) {
    throw new Error('pitch.lengthM must be positive and finite');
  }
  if (!Number.isFinite(pitch.widthM) || pitch.widthM <= CAUSAL_SCORING_LIMITS.goalWidthM) {
    throw new Error('pitch.widthM must be finite and wider than the goal');
  }
  return pitch;
};

const direction = (value: number): AttackDirection => {
  if (value !== 1 && value !== -1) throw new Error('attackDirection must be 1 or -1');
  return value;
};

const centeredSample = (value: number, label: string): number => unit(value, label) * 2 - 1;

const goalLineX = (pitch: MatchPitchDimensions, attackDirection: AttackDirection): number =>
  attackDirection === 1 ? pitch.lengthM : 0;

const normalizeAngle = (angle: number): number => {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
};

const distance2D = (left: MatchVector3, right: MatchVector3): number =>
  Math.hypot(left.x - right.x, left.y - right.y);

const distanceYZ = (left: MatchVector3, right: MatchVector3): number =>
  Math.hypot(left.y - right.y, left.z - right.z);

const pointToSegmentDistance2D = (
  point: MatchVector3,
  start: MatchVector3,
  end: MatchVector3,
): { readonly distanceM: number; readonly projection: number } => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared <= EPSILON) return { distanceM: distance2D(point, start), projection: 0 };

  const projection = clamp(
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared,
    0,
    1,
  );
  return {
    distanceM: Math.hypot(
      point.x - (start.x + deltaX * projection),
      point.y - (start.y + deltaY * projection),
    ),
    projection,
  };
};

const unsignedAngle = (
  origin: MatchVector3,
  first: MatchVector3,
  second: MatchVector3,
): number => {
  const firstX = first.x - origin.x;
  const firstY = first.y - origin.y;
  const secondX = second.x - origin.x;
  const secondY = second.y - origin.y;
  const denominator = Math.hypot(firstX, firstY) * Math.hypot(secondX, secondY);
  if (denominator <= EPSILON) return 0;
  const cosine = clamp((firstX * secondX + firstY * secondY) / denominator, -1, 1);
  return Math.acos(cosine);
};

const targetInsideMouth = (
  target: MatchVector3,
  pitch: MatchPitchDimensions,
  ballRadiusM: number,
): boolean => {
  const halfAvailableWidth = CAUSAL_SCORING_LIMITS.goalWidthM / 2 - ballRadiusM;
  return (
    Math.abs(target.y - pitch.widthM / 2) <= halfAvailableWidth + EPSILON &&
    target.z >= ballRadiusM - EPSILON &&
    target.z <= CAUSAL_SCORING_LIMITS.goalHeightM - ballRadiusM + EPSILON
  );
};

const assertGoalTarget = (
  target: MatchVector3,
  pitch: MatchPitchDimensions,
  attackDirection: AttackDirection,
): MatchVector3 => {
  const checked = vector(target, 'targetPoint');
  if (Math.abs(checked.x - goalLineX(pitch, attackDirection)) > 1e-6) {
    throw new Error('targetPoint.x must lie on the attacked goal line');
  }
  return checked;
};

/**
 * Scores whether a supplied shot option is attractive. It does not choose to
 * shoot, determine success, change a score, or know which team should win.
 */
export function evaluateShotOpportunity(input: ShotOpportunityInput): ShotOpportunityEvaluation {
  const pitch = pitchDimensions(input.pitch);
  const attackDirection = direction(input.attackDirection);
  const ball = vector(input.ballPosition, 'ballPosition');
  const target = assertGoalTarget(input.targetPoint, pitch, attackDirection);
  const goalkeeper = vector(input.goalkeeperPosition, 'goalkeeperPosition');
  const pressure = unit(input.pressure, 'pressure');
  const balance = unit(input.balance, 'balance');
  const facingYaw = finite(input.shooterFacingYaw, 'shooterFacingYaw');
  const targetProgress = (target.x - ball.x) * attackDirection;
  if (targetProgress <= 0) throw new Error('targetPoint must be ahead in the attack direction');

  const centreY = pitch.widthM / 2;
  const halfGoal = CAUSAL_SCORING_LIMITS.goalWidthM / 2;
  const nearPost = { x: target.x, y: centreY - halfGoal, z: 0 };
  const farPost = { x: target.x, y: centreY + halfGoal, z: 0 };
  const distanceM = distance2D(ball, { x: target.x, y: centreY, z: 0 });
  const openingAngle = unsignedAngle(ball, nearPost, farPost);
  const distanceQuality = 1 - clamp((distanceM - 5) / 32, 0, 1);
  const openingQuality = clamp(openingAngle / 0.72, 0, 1);
  const targetYaw = Math.atan2(target.y - ball.y, target.x - ball.x);
  const yawDifference = Math.abs(normalizeAngle(targetYaw - facingYaw));
  const bodyAlignment = clamp(1 - yawDifference / (Math.PI / 2), 0, 1);

  const laneObstruction = clamp(input.blockers.reduce((total, blocker, index) => {
    const blockerPosition = vector(blocker.position, `blockers[${index}].position`);
    const controlRadiusM = blocker.controlRadiusM ?? 0.45;
    if (!Number.isFinite(controlRadiusM) || controlRadiusM < 0 || controlRadiusM > 2) {
      throw new Error(`blockers[${index}].controlRadiusM must be finite and in [0, 2]`);
    }
    const lane = pointToSegmentDistance2D(blockerPosition, ball, target);
    if (lane.projection <= 0.03 || lane.projection >= 0.99) return total;
    const influenceRadius = 1.25 + controlRadiusM;
    const proximity = clamp((influenceRadius - lane.distanceM) / influenceRadius, 0, 1);
    return total + proximity * (0.55 + lane.projection * 0.45);
  }, 0), 0, 1);

  const goalkeeperReference = { x: goalkeeper.x, y: goalkeeper.y, z: 1.05 };
  const goalkeeperCoverage = 1 - clamp(distanceYZ(goalkeeperReference, target) / 4.2, 0, 1);
  const insideGoalMouth = targetInsideMouth(target, pitch, CAUSAL_SCORING_LIMITS.ballRadiusM);
  const opportunityScore = insideGoalMouth
    ? clamp(
        distanceQuality * 0.27 +
        openingQuality * 0.23 +
        bodyAlignment * 0.14 +
        (1 - pressure) * 0.14 +
        balance * 0.08 +
        (1 - laneObstruction) * 0.1 +
        (1 - goalkeeperCoverage) * 0.04,
        0,
        1,
      )
    : 0;

  const reasons: ShotOpportunityReason[] = [];
  if (distanceM <= 13) reasons.push('close_range');
  if (openingQuality < 0.35) reasons.push('wide_angle');
  if (pressure >= 0.68) reasons.push('heavy_pressure');
  if (laneObstruction >= 0.48) reasons.push('blocked_lane');
  if (goalkeeperCoverage >= 0.62) reasons.push('goalkeeper_covers_target');
  if (bodyAlignment < 0.5) reasons.push('body_misaligned');
  if (laneObstruction < 0.2 && pressure < 0.45) reasons.push('clear_sight');

  return {
    opportunityScore,
    distanceM,
    goalOpeningAngleRad: openingAngle,
    distanceQuality,
    openingQuality,
    bodyAlignment,
    laneObstruction,
    goalkeeperCoverage,
    targetInsideGoalMouth: insideGoalMouth,
    reasons,
  };
}

/**
 * Converts an attempted shot into physical first-flight inputs. Random samples
 * perturb contact only; none of them represents `goal`, `save`, or a winner.
 */
export function createShotContact(input: ShotContactInput): ShotContactResult {
  const attackDirection = direction(input.attackDirection);
  const ball = vector(input.ballPosition, 'ballPosition');
  const target = vector(input.targetPoint, 'targetPoint');
  if ((target.x - ball.x) * attackDirection <= 0) {
    throw new Error('targetPoint must be ahead in the attack direction');
  }
  const requestedPower = unit(input.requestedPower, 'requestedPower');
  const finishing = rating(input.attributes.finishing, 'attributes.finishing');
  const technique = rating(input.attributes.technique, 'attributes.technique');
  const composure = rating(input.attributes.composure, 'attributes.composure');
  const balance = unit(input.attributes.balance, 'attributes.balance');
  const pressure = unit(input.attributes.pressure, 'attributes.pressure');
  const fatigue = unit(input.attributes.fatigue, 'attributes.fatigue');
  const footProficiency = unit(input.attributes.footProficiency, 'attributes.footProficiency');

  const skillQuality = finishing * 0.45 + technique * 0.35 + composure * 0.2;
  const contextQuality =
    balance * 0.35 + (1 - fatigue) * 0.2 + (1 - pressure) * 0.3 + footProficiency * 0.15;
  const contactQuality = clamp(skillQuality * 0.65 + contextQuality * 0.35, 0, 1);

  const planarX = target.x - ball.x;
  const planarY = target.y - ball.y;
  const planarDistance = Math.hypot(planarX, planarY);
  if (planarDistance <= EPSILON) throw new Error('shot target requires non-zero planar distance');
  const forwardX = planarX / planarDistance;
  const forwardY = planarY / planarDistance;
  const lateralX = -forwardY;
  const lateralY = forwardX;
  const intendedElevationRad = Math.atan2(target.z - ball.z, planarDistance);

  const lateralLimitRad =
    0.012 + (1 - contactQuality) * 0.15 + pressure * 0.035 + (1 - balance) * 0.02;
  const elevationLimitRad =
    0.01 + (1 - contactQuality) * 0.105 + pressure * 0.025 + fatigue * 0.015;
  const lateralErrorRad =
    centeredSample(input.samples.lateralError, 'samples.lateralError') * lateralLimitRad;
  const elevationErrorRad =
    centeredSample(input.samples.elevationError, 'samples.elevationError') * elevationLimitRad;
  const powerErrorLimit = 0.025 + (1 - contactQuality) * 0.14 + fatigue * 0.025;
  const powerErrorFraction =
    centeredSample(input.samples.powerError, 'samples.powerError') * powerErrorLimit;
  const spinSample = centeredSample(input.samples.spin, 'samples.spin');

  const actualElevationRad = clamp(intendedElevationRad + elevationErrorRad, -0.03, 0.44);
  const rotatedX = forwardX * Math.cos(lateralErrorRad) + lateralX * Math.sin(lateralErrorRad);
  const rotatedY = forwardY * Math.cos(lateralErrorRad) + lateralY * Math.sin(lateralErrorRad);
  const nominalSpeed = 16 + requestedPower * 20;
  const speedMps = clamp(
    nominalSpeed * (0.9 + technique * 0.1) * (1 + powerErrorFraction),
    CAUSAL_SCORING_LIMITS.minimumShotSpeedMps,
    CAUSAL_SCORING_LIMITS.maximumShotSpeedMps,
  );
  const planarSpeed = speedMps * Math.cos(actualElevationRad);
  const initialVelocity = {
    x: rotatedX * planarSpeed,
    y: rotatedY * planarSpeed,
    z: speedMps * Math.sin(actualElevationRad),
  };
  const spinZRadPerSecond = spinSample * (4 + (1 - contactQuality) * 9);
  const curveMagnitudeMps2 = spinZRadPerSecond / 13 * 1.15;
  const curveLeftX = -rotatedY;
  const curveLeftY = rotatedX;

  return {
    contactQuality,
    speedMps,
    intendedElevationRad,
    actualElevationRad,
    lateralErrorRad,
    elevationErrorRad,
    powerErrorFraction,
    trajectory: {
      origin: { ...ball, z: Math.max(ball.z, CAUSAL_SCORING_LIMITS.ballRadiusM) },
      initialVelocity,
      angularVelocity: { x: 0, y: 0, z: spinZRadPerSecond },
      lateralAcceleration: {
        x: curveLeftX * curveMagnitudeMps2,
        y: curveLeftY * curveMagnitudeMps2,
        z: 0,
      },
      gravityMps2: CAUSAL_SCORING_LIMITS.gravityMps2,
      ballRadiusM: CAUSAL_SCORING_LIMITS.ballRadiusM,
    },
  };
}

const validateTrajectory = (trajectory: ShotTrajectory): ShotTrajectory => {
  vector(trajectory.origin, 'trajectory.origin');
  vector(trajectory.initialVelocity, 'trajectory.initialVelocity');
  vector(trajectory.angularVelocity, 'trajectory.angularVelocity');
  vector(trajectory.lateralAcceleration, 'trajectory.lateralAcceleration');
  if (!Number.isFinite(trajectory.gravityMps2) || trajectory.gravityMps2 <= 0) {
    throw new Error('trajectory.gravityMps2 must be positive and finite');
  }
  if (!Number.isFinite(trajectory.ballRadiusM) || trajectory.ballRadiusM <= 0) {
    throw new Error('trajectory.ballRadiusM must be positive and finite');
  }
  return trajectory;
};

export function predictShotTrajectoryPoint(
  trajectoryInput: ShotTrajectory,
  timeSeconds: number,
): ShotTrajectoryPoint {
  const trajectory = validateTrajectory(trajectoryInput);
  if (
    !Number.isFinite(timeSeconds) ||
    timeSeconds < 0 ||
    timeSeconds > CAUSAL_SCORING_LIMITS.maximumFlightSeconds
  ) {
    throw new Error(
      `timeSeconds must be finite and in [0, ${CAUSAL_SCORING_LIMITS.maximumFlightSeconds}]`,
    );
  }

  const position = {
    x: trajectory.origin.x + trajectory.initialVelocity.x * timeSeconds +
      0.5 * trajectory.lateralAcceleration.x * timeSeconds * timeSeconds,
    y: trajectory.origin.y + trajectory.initialVelocity.y * timeSeconds +
      0.5 * trajectory.lateralAcceleration.y * timeSeconds * timeSeconds,
    z: Math.max(
      trajectory.ballRadiusM,
      trajectory.origin.z + trajectory.initialVelocity.z * timeSeconds -
        0.5 * trajectory.gravityMps2 * timeSeconds * timeSeconds,
    ),
  };
  const velocity = {
    x: trajectory.initialVelocity.x + trajectory.lateralAcceleration.x * timeSeconds,
    y: trajectory.initialVelocity.y + trajectory.lateralAcceleration.y * timeSeconds,
    z: position.z <= trajectory.ballRadiusM + EPSILON
      ? 0
      : trajectory.initialVelocity.z - trajectory.gravityMps2 * timeSeconds,
  };

  return { timeSeconds, position, velocity };
}

export function predictShotAtXPlane(
  trajectoryInput: ShotTrajectory,
  planeX: number,
  maximumSeconds = CAUSAL_SCORING_LIMITS.maximumFlightSeconds,
): ShotTrajectoryPoint | null {
  const trajectory = validateTrajectory(trajectoryInput);
  const targetX = finite(planeX, 'planeX');
  if (!Number.isFinite(maximumSeconds) || maximumSeconds <= 0 ||
      maximumSeconds > CAUSAL_SCORING_LIMITS.maximumFlightSeconds) {
    throw new Error(
      `maximumSeconds must be finite and in (0, ${CAUSAL_SCORING_LIMITS.maximumFlightSeconds}]`,
    );
  }

  const halfAcceleration = 0.5 * trajectory.lateralAcceleration.x;
  const velocity = trajectory.initialVelocity.x;
  const offset = trajectory.origin.x - targetX;
  const candidateTimes: number[] = [];

  if (Math.abs(halfAcceleration) <= EPSILON) {
    if (Math.abs(velocity) <= EPSILON) return null;
    candidateTimes.push(-offset / velocity);
  } else {
    const discriminant = velocity * velocity - 4 * halfAcceleration * offset;
    if (discriminant < 0) return null;
    const root = Math.sqrt(discriminant);
    candidateTimes.push(
      (-velocity - root) / (2 * halfAcceleration),
      (-velocity + root) / (2 * halfAcceleration),
    );
  }

  const timeSeconds = candidateTimes
    .filter(candidate => candidate >= -EPSILON && candidate <= maximumSeconds + EPSILON)
    .map(candidate => Math.max(0, candidate))
    .sort((left, right) => left - right)[0];
  return timeSeconds === undefined
    ? null
    : predictShotTrajectoryPoint(trajectory, Math.min(timeSeconds, maximumSeconds));
}

const accelerationDistance = (
  seconds: number,
  accelerationMps2: number,
  maximumSpeedMps: number,
): number => {
  if (seconds <= 0) return 0;
  const timeToMaximumSpeed = maximumSpeedMps / accelerationMps2;
  if (seconds <= timeToMaximumSpeed) return 0.5 * accelerationMps2 * seconds * seconds;
  return 0.5 * accelerationMps2 * timeToMaximumSpeed * timeToMaximumSpeed +
    maximumSpeedMps * (seconds - timeToMaximumSpeed);
};

/**
 * Resolves keeper perception, reaction and committed reach against an already
 * created trajectory. `makesContact` follows spatial overlap, not a save roll.
 */
export function evaluateGoalkeeperResponse(
  input: GoalkeeperResponseInput,
): GoalkeeperResponse | null {
  const trajectory = validateTrajectory(input.trajectory);
  const attackDirection = direction(input.attackDirection);
  const goalkeeper = vector(input.goalkeeperPosition, 'goalkeeperPosition');
  if ((goalkeeper.x - trajectory.origin.x) * attackDirection <= 0) {
    throw new Error('goalkeeperPosition must be ahead of the shot origin');
  }
  const anticipation = rating(input.attributes.anticipation, 'attributes.anticipation');
  const reflexes = rating(input.attributes.reflexes, 'attributes.reflexes');
  const agility = rating(input.attributes.agility, 'attributes.agility');
  const handling = rating(input.attributes.handling, 'attributes.handling');
  const lineOfSight = unit(input.lineOfSight, 'lineOfSight');
  const fatigue = unit(input.fatigue, 'fatigue');
  const intercept = predictShotAtXPlane(trajectory, goalkeeper.x);
  if (!intercept) return null;

  const perceptionDelaySeconds = clamp(
    0.065 + (1 - anticipation) * 0.12 + (1 - lineOfSight) * 0.14 +
      centeredSample(input.samples.perceptionTiming, 'samples.perceptionTiming') * 0.025,
    0.035,
    0.36,
  );
  const reactionDelaySeconds = clamp(
    0.085 + (1 - reflexes) * 0.16 + fatigue * 0.06 +
      centeredSample(input.samples.reactionTiming, 'samples.reactionTiming') * 0.025,
    0.05,
    0.34,
  );
  const movementTimeSeconds = Math.max(
    0,
    intercept.timeSeconds - perceptionDelaySeconds - reactionDelaySeconds,
  );

  const maximumLateralPerceptionErrorM =
    0.05 + (1 - anticipation) * 0.45 + (1 - lineOfSight) * 0.6;
  const maximumVerticalPerceptionErrorM =
    0.035 + (1 - anticipation) * 0.28 + (1 - lineOfSight) * 0.3;
  const perceivedInterceptPoint = {
    x: intercept.position.x,
    // Goal-mouth lateral orientation reverses under a 180-degree pitch mirror.
    y: intercept.position.y + attackDirection *
      centeredSample(input.samples.perceptionLateral, 'samples.perceptionLateral') *
      maximumLateralPerceptionErrorM,
    z: Math.max(
      trajectory.ballRadiusM,
      intercept.position.z +
        centeredSample(input.samples.perceptionVertical, 'samples.perceptionVertical') *
        maximumVerticalPerceptionErrorM,
    ),
  };

  const neutralReachPoint = { x: goalkeeper.x, y: goalkeeper.y, z: 1.05 };
  const accelerationMps2 = (3.8 + agility * 3.2) * (1 - fatigue * 0.22);
  const maximumSpeedMps = (2.5 + agility * 2.7) * (1 - fatigue * 0.2);
  const footworkDistanceM = accelerationDistance(
    movementTimeSeconds,
    accelerationMps2,
    maximumSpeedMps,
  );
  const bodyExtensionM = 0.56 + agility * 0.42;
  const diveExecutionFactor = 0.88 +
    unit(input.samples.diveExecution, 'samples.diveExecution') * 0.12;
  const maximumReachM = (footworkDistanceM + bodyExtensionM) *
    (1 - fatigue * 0.18) * diveExecutionFactor;

  const perceivedDeltaY = perceivedInterceptPoint.y - neutralReachPoint.y;
  const perceivedDeltaZ = perceivedInterceptPoint.z - neutralReachPoint.z;
  const perceivedDistanceM = Math.hypot(perceivedDeltaY, perceivedDeltaZ);
  const committedDistanceM = Math.min(perceivedDistanceM, maximumReachM);
  const perceivedScale = perceivedDistanceM <= EPSILON
    ? 0
    : committedDistanceM / perceivedDistanceM;
  const committedReachPoint = {
    x: goalkeeper.x,
    y: neutralReachPoint.y + perceivedDeltaY * perceivedScale,
    z: neutralReachPoint.z + perceivedDeltaZ * perceivedScale,
  };
  const requiredReachM = distanceYZ(neutralReachPoint, intercept.position);
  const contactDistanceM = distanceYZ(committedReachPoint, intercept.position);
  const contactRadiusM = trajectory.ballRadiusM + 0.16 + handling * 0.08;

  return {
    shotArrivalSeconds: intercept.timeSeconds,
    perceptionDelaySeconds,
    reactionDelaySeconds,
    movementTimeSeconds,
    actualInterceptPoint: intercept.position,
    perceivedInterceptPoint,
    committedReachPoint,
    requiredReachM,
    maximumReachM,
    contactDistanceM,
    contactRadiusM,
    canReach: requiredReachM <= maximumReachM + contactRadiusM + EPSILON,
    makesContact: contactDistanceM <= contactRadiusM + EPSILON,
  };
}

/**
 * Applies only the geometric whole-ball test. It reports a decision and never
 * mutates a match score, selects a winner, or compensates for match context.
 */
export function adjudicateGoalLine(input: GoalLineAdjudicationInput): GoalLineDecision {
  const pitch = pitchDimensions(input.pitch);
  const attackDirection = direction(input.attackDirection);
  const previous = vector(input.previousBallPosition, 'previousBallPosition');
  const next = vector(input.nextBallPosition, 'nextBallPosition');
  const ballRadiusM = input.ballRadiusM ?? CAUSAL_SCORING_LIMITS.ballRadiusM;
  if (!Number.isFinite(ballRadiusM) || ballRadiusM <= 0 || ballRadiusM >= 0.5) {
    throw new Error('ballRadiusM must be finite and in (0, 0.5)');
  }

  const lineX = goalLineX(pitch, attackDirection);
  const wholeBallPlaneX = lineX + attackDirection * ballRadiusM;
  const deltaX = next.x - previous.x;
  if (deltaX * attackDirection <= EPSILON) {
    return {
      isGoal: false,
      wholeBallCrossed: false,
      insideGoalMouth: false,
      outcome: 'wrong_direction',
      crossingPoint: null,
    };
  }

  const previousProgress = (previous.x - lineX) * attackDirection;
  const nextProgress = (next.x - lineX) * attackDirection;
  if (previousProgress >= ballRadiusM - EPSILON || nextProgress < ballRadiusM - EPSILON) {
    return {
      isGoal: false,
      wholeBallCrossed: false,
      insideGoalMouth: false,
      outcome: 'no_full_crossing',
      crossingPoint: null,
    };
  }

  const interpolation = (wholeBallPlaneX - previous.x) / deltaX;
  const crossingPoint = {
    x: wholeBallPlaneX,
    y: previous.y + (next.y - previous.y) * interpolation,
    z: previous.z + (next.z - previous.z) * interpolation,
  };
  const withinWidth = Math.abs(crossingPoint.y - pitch.widthM / 2) <=
    CAUSAL_SCORING_LIMITS.goalWidthM / 2 - ballRadiusM + EPSILON;
  const abovePitch = crossingPoint.z >= ballRadiusM - EPSILON;
  const belowBar = crossingPoint.z <=
    CAUSAL_SCORING_LIMITS.goalHeightM - ballRadiusM + EPSILON;
  const insideGoalMouth = withinWidth && abovePitch && belowBar;
  const outcome: GoalLineOutcome = !withinWidth
    ? 'wide'
    : !abovePitch
      ? 'below_pitch'
      : !belowBar
        ? 'over_bar'
        : 'goal';

  return {
    isGoal: insideGoalMouth,
    wholeBallCrossed: true,
    insideGoalMouth,
    outcome,
    crossingPoint,
  };
}
