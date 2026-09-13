import type { EntityId, PlayerRole } from '../core/types';
import type { FootballAttributes, FootballTactics, MatchPitchDimensions, MatchVector3 } from '../protocol';

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const distance2D = (left: MatchVector3, right: MatchVector3): number =>
  Math.hypot(left.x - right.x, left.y - right.y);

export interface FootballerSnapshot {
  readonly id: EntityId;
  readonly teamId: EntityId;
  readonly role: PlayerRole;
  readonly position: MatchVector3;
  readonly velocity: MatchVector3;
  readonly stamina: number;
  readonly attributes?: Partial<FootballAttributes>;
}

export interface PressureAssessment {
  readonly value: number;
  readonly nearestOpponentId: EntityId | null;
  readonly nearestDistanceM: number;
  readonly opponentsWithinFiveM: number;
}

export interface PassCandidateEvaluation {
  readonly playerId: EntityId;
  readonly score: number;
  readonly distanceM: number;
  readonly progressM: number;
  readonly laneRisk: number;
  readonly receiverPressure: number;
  readonly completionProbability: number;
  readonly targetPosition: MatchVector3;
  readonly reason: 'break_line' | 'switch_play' | 'progress_safe' | 'retain_possession';
}

export interface ShapeTargetInput {
  readonly attackDirection: 1 | -1;
  readonly basePosition: MatchVector3;
  readonly ballPosition: MatchVector3;
  readonly inPossession: boolean;
  readonly pitch: MatchPitchDimensions;
  readonly role: PlayerRole;
}

export interface InterceptionCandidate {
  readonly playerId: EntityId;
  readonly distanceM: number;
  readonly controlScore: number;
}

const roleLineWeight = (role: PlayerRole): number => {
  if (role === 'GK') return 0.08;
  if (['SW', 'CB', 'RCB', 'LCB', 'RB', 'LB', 'RWB', 'LWB'].includes(role)) return 0.38;
  if (['CDM', 'RDM', 'LDM', 'CM', 'RCM', 'LCM'].includes(role)) return 0.68;
  return 1;
};

const pointToSegmentDistance = (
  point: MatchVector3,
  start: MatchVector3,
  end: MatchVector3,
): number => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (segmentLengthSquared <= 1e-9) return distance2D(point, start);

  const projection = clamp(
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) /
      segmentLengthSquared,
    0,
    1,
  );
  return Math.hypot(
    point.x - (start.x + segmentX * projection),
    point.y - (start.y + segmentY * projection),
  );
};

const segmentProjection = (
  point: MatchVector3,
  start: MatchVector3,
  end: MatchVector3,
): number => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (segmentLengthSquared <= 1e-9) return 0;
  return (
    (point.x - start.x) * segmentX + (point.y - start.y) * segmentY
  ) / segmentLengthSquared;
};

export function calculatePressure(
  position: MatchVector3,
  opponents: readonly FootballerSnapshot[],
): PressureAssessment {
  const ranked = opponents
    .map(opponent => ({ id: opponent.id, distance: distance2D(position, opponent.position) }))
    .sort((left, right) => left.distance - right.distance ||
      String(left.id).localeCompare(String(right.id)));
  const nearest = ranked[0] ?? null;
  const opponentsWithinFiveM = ranked.filter(entry => entry.distance <= 5).length;
  const nearestValue = nearest ? clamp((7 - nearest.distance) / 6.2, 0, 1) : 0;
  const crowdingValue = clamp((opponentsWithinFiveM - 1) * 0.12, 0, 0.24);

  return {
    value: clamp(nearestValue + crowdingValue, 0, 1),
    nearestOpponentId: nearest?.id ?? null,
    nearestDistanceM: nearest?.distance ?? Number.POSITIVE_INFINITY,
    opponentsWithinFiveM,
  };
}

export function calculateShapeTarget({
  attackDirection,
  basePosition,
  ballPosition,
  inPossession,
  pitch,
  role,
}: ShapeTargetInput): MatchVector3 {
  const centreX = pitch.lengthM / 2;
  const centreY = pitch.widthM / 2;
  const lineWeight = roleLineWeight(role);
  const longitudinalBallShift = clamp((ballPosition.x - centreX) * 0.28, -10, 10);
  const lateralBallShift = clamp((ballPosition.y - centreY) * 0.2, -6.5, 6.5);
  const widthScale = inPossession ? 1.08 : 0.82;
  const phaseAdvance = attackDirection * (inPossession ? 2.2 : -1.2) * lineWeight;

  return {
    x: clamp(
      basePosition.x + longitudinalBallShift * lineWeight + phaseAdvance,
      role === 'GK' ? 1.5 : 1,
      role === 'GK' ? pitch.lengthM - 1.5 : pitch.lengthM - 1,
    ),
    y: clamp(
      centreY + (basePosition.y - centreY) * widthScale +
        lateralBallShift * (0.3 + lineWeight * 0.45),
      1,
      pitch.widthM - 1,
    ),
    z: 0,
  };
}

export function predictReceptionPosition(
  receiver: FootballerSnapshot,
  travelSeconds: number,
  pitch: MatchPitchDimensions,
): MatchVector3 {
  const leadSeconds = clamp(travelSeconds * 0.55, 0.15, 0.8);
  return {
    x: clamp(receiver.position.x + receiver.velocity.x * leadSeconds, 1, pitch.lengthM - 1),
    y: clamp(receiver.position.y + receiver.velocity.y * leadSeconds, 1, pitch.widthM - 1),
    z: 0.11,
  };
}

export function evaluatePassCandidates(
  passer: FootballerSnapshot,
  teammates: readonly FootballerSnapshot[],
  opponents: readonly FootballerSnapshot[],
  attackDirection: 1 | -1,
  pitch: MatchPitchDimensions,
  tactics?: FootballTactics,
): readonly PassCandidateEvaluation[] {
  return teammates
    .filter(candidate => candidate.id !== passer.id)
    .map(candidate => {
      const distanceM = distance2D(passer.position, candidate.position);
      const travelSeconds = clamp(distanceM / 13.5, 0.45, 1.8);
      const targetPosition = predictReceptionPosition(candidate, travelSeconds, pitch);
      const progressM = (targetPosition.x - passer.position.x) * attackDirection;
      const receiverPressure = calculatePressure(targetPosition, opponents).value;
      const laneRisk = opponents.reduce((risk, opponent) => {
        const laneDistance = pointToSegmentDistance(
          opponent.position,
          passer.position,
          targetPosition,
        );
        const projection = segmentProjection(opponent.position, passer.position, targetPosition);
        if (projection <= 0.04 || projection >= 0.96 || laneDistance > 5.5) return risk;
        return risk + clamp((5.5 - laneDistance) / 5.5, 0, 1);
      }, 0);
      const preferredDistance = tactics ? 7 + tactics.directness * 0.33 : 15;
      const distanceQuality = 1 - clamp(Math.abs(distanceM - preferredDistance) / 25, 0, 1);
      const completionProbability = clamp(
        0.97 - distanceM * 0.012 - laneRisk * 0.13 - receiverPressure * 0.18 +
          (passer.attributes ? ((passer.attributes.passing ?? 65) - 65) * 0.0025 : 0),
        0.18,
        0.97,
      );
      const switchValue = Math.abs(targetPosition.y - passer.position.y) >= 18 ? 1 : 0;
      const score =
        progressM * (tactics ? 0.03 + tactics.directness * 0.0026 : 0.16) +
        distanceQuality * 2.4 +
        completionProbability * 5.2 +
        switchValue * 0.75 -
        laneRisk * 2.3 -
        receiverPressure * 2.2;
      const reason: PassCandidateEvaluation['reason'] = progressM >= 9 && laneRisk < 0.9
        ? 'break_line'
        : switchValue > 0 && laneRisk < 1.25
          ? 'switch_play'
          : progressM > 1 && completionProbability >= 0.62
            ? 'progress_safe'
            : 'retain_possession';

      return {
        playerId: candidate.id,
        score,
        distanceM,
        progressM,
        laneRisk,
        receiverPressure,
        completionProbability,
        targetPosition,
        reason,
      };
    })
    .filter(candidate => candidate.distanceM >= 3 && candidate.distanceM <= (tactics ? 55 : 38))
    .sort((left, right) =>
      right.score - left.score || String(left.playerId).localeCompare(String(right.playerId)));
}

export function selectInterceptionCandidate(
  previousBallPosition: MatchVector3,
  nextBallPosition: MatchVector3,
  opponents: readonly FootballerSnapshot[],
): InterceptionCandidate | null {
  if (Math.max(previousBallPosition.z, nextBallPosition.z) > 0.72) return null;

  const candidates = opponents
    .map(opponent => {
      const distanceM = pointToSegmentDistance(
        opponent.position,
        previousBallPosition,
        nextBallPosition,
      );
      const speedMps = Math.hypot(opponent.velocity.x, opponent.velocity.y);
      const controlRadiusM = 0.76 + Math.min(speedMps, 7.5) * 0.035;
      const controlScore =
        (controlRadiusM - distanceM) + opponent.stamina / 100 * 0.08;
      return { playerId: opponent.id, distanceM, controlScore, controlRadiusM };
    })
    .filter(candidate => candidate.distanceM <= candidate.controlRadiusM)
    .sort((left, right) =>
      right.controlScore - left.controlScore ||
      String(left.playerId).localeCompare(String(right.playerId)));
  const winner = candidates[0];
  return winner
    ? {
        playerId: winner.playerId,
        distanceM: winner.distanceM,
        controlScore: winner.controlScore,
      }
    : null;
}

export function calculateSeparationSteering(
  actor: FootballerSnapshot,
  others: readonly FootballerSnapshot[],
  desiredMinimumM = 1.15,
): MatchVector3 {
  let x = 0;
  let y = 0;
  for (const other of others) {
    if (other.id === actor.id) continue;
    const dx = actor.position.x - other.position.x;
    const dy = actor.position.y - other.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= desiredMinimumM || distance <= 1e-6) continue;
    const strength = (desiredMinimumM - distance) / desiredMinimumM;
    x += dx / distance * strength;
    y += dy / distance * strength;
  }
  return { x, y, z: 0 };
}
