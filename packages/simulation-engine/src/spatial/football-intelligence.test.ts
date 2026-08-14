import type { PlayerRole } from '../core/types';
import { REGULATION_PITCH, type MatchVector3 } from '../protocol';
import {
  calculatePressure,
  calculateSeparationSteering,
  calculateShapeTarget,
  evaluatePassCandidates,
  selectInterceptionCandidate,
  type FootballerSnapshot,
} from './football-intelligence';

const footballer = (
  id: string,
  teamId: string,
  role: PlayerRole,
  position: MatchVector3,
  velocity: MatchVector3 = { x: 0, y: 0, z: 0 },
): FootballerSnapshot => ({
  id,
  teamId,
  role,
  position,
  velocity,
  stamina: 100,
});

const rotatePosition = (position: MatchVector3): MatchVector3 => ({
  x: REGULATION_PITCH.lengthM - position.x,
  y: REGULATION_PITCH.widthM - position.y,
  z: position.z,
});

const rotateVelocity = (velocity: MatchVector3): MatchVector3 => ({
  x: -velocity.x,
  y: -velocity.y,
  z: velocity.z,
});

const rotateFootballer = (player: FootballerSnapshot): FootballerSnapshot => ({
  ...player,
  position: rotatePosition(player.position),
  velocity: rotateVelocity(player.velocity),
});

const expectRotatedPosition = (
  actual: MatchVector3,
  original: MatchVector3,
): void => {
  const expected = rotatePosition(original);
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
  expect(actual.z).toBeCloseTo(expected.z, 10);
};

describe('football intelligence primitives', () => {
  it('measures local pressure from current opponent geometry', () => {
    const position = { x: 50, y: 34, z: 0 };
    const low = calculatePressure(position, [
      footballer('far', 'away', 'CM', { x: 61, y: 34, z: 0 }),
    ]);
    const high = calculatePressure(position, [
      footballer('close', 'away', 'CM', { x: 51.2, y: 34, z: 0 }),
      footballer('cover', 'away', 'CB', { x: 53, y: 35, z: 0 }),
    ]);

    expect(low.value).toBe(0);
    expect(high.value).toBeGreaterThan(0.9);
    expect(high.nearestOpponentId).toBe('close');
    expect(high.opponentsWithinFiveM).toBe(2);
  });

  it('ranks live pass options using progress, pressure, distance, and lane risk', () => {
    const passer = footballer('passer', 'home', 'CM', { x: 40, y: 34, z: 0 });
    const safeProgression = footballer('safe', 'home', 'RW', { x: 56, y: 48, z: 0 });
    const blockedProgression = footballer('blocked', 'home', 'ST', { x: 62, y: 34, z: 0 });
    const opponents = [
      footballer('screen', 'away', 'CDM', { x: 50, y: 34, z: 0 }),
      footballer('marker', 'away', 'CB', { x: 61, y: 34, z: 0 }),
    ];

    const evaluations = evaluatePassCandidates(
      passer,
      [passer, safeProgression, blockedProgression],
      opponents,
      1,
      REGULATION_PITCH,
    );

    expect(evaluations.map(candidate => candidate.playerId)).toContain('safe');
    expect(evaluations[0]?.playerId).toBe('safe');
    const blocked = evaluations.find(candidate => candidate.playerId === 'blocked');
    const safe = evaluations.find(candidate => candidate.playerId === 'safe');
    expect(blocked?.laneRisk).toBeGreaterThan(safe?.laneRisk ?? 0);
    expect(blocked?.completionProbability).toBeLessThan(safe?.completionProbability ?? 1);
  });

  it('expands the attacking shape and compacts the defending shape around the ball', () => {
    const basePosition = { x: 42, y: 12, z: 0 };
    const ballPosition = { x: 60, y: 45, z: 0 };
    const attacking = calculateShapeTarget({
      attackDirection: 1,
      basePosition,
      ballPosition,
      inPossession: true,
      pitch: REGULATION_PITCH,
      role: 'LW',
    });
    const defending = calculateShapeTarget({
      attackDirection: 1,
      basePosition,
      ballPosition,
      inPossession: false,
      pitch: REGULATION_PITCH,
      role: 'LW',
    });

    expect(Math.abs(attacking.y - 34)).toBeGreaterThan(Math.abs(defending.y - 34));
    expect(attacking.x).toBeGreaterThan(defending.x);
  });

  it('allows a low pass to be intercepted but rejects an airborne contact', () => {
    const defender = footballer('defender', 'away', 'CB', { x: 50.5, y: 34, z: 0 });
    const low = selectInterceptionCandidate(
      { x: 50, y: 34, z: 0.11 },
      { x: 51, y: 34, z: 0.12 },
      [defender],
    );
    const high = selectInterceptionCandidate(
      { x: 50, y: 34, z: 0.8 },
      { x: 51, y: 34, z: 0.82 },
      [defender],
    );

    expect(low?.playerId).toBe('defender');
    expect(high).toBeNull();
  });

  it('produces deterministic separation steering only inside the safety radius', () => {
    const actor = footballer('actor', 'home', 'CM', { x: 50, y: 34, z: 0 });
    const close = footballer('close', 'away', 'CM', { x: 50.5, y: 34, z: 0 });
    const far = footballer('far', 'home', 'CM', { x: 60, y: 34, z: 0 });
    const steering = calculateSeparationSteering(actor, [actor, close, far]);

    expect(steering.x).toBeLessThan(0);
    expect(steering.y).toBe(0);
    expect(calculateSeparationSteering(actor, [actor, far])).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('makes the same football judgments after a 180-degree pitch rotation', () => {
    const passer = footballer(
      'passer',
      'home',
      'CM',
      { x: 38, y: 28, z: 0 },
      { x: 1.4, y: 0.3, z: 0 },
    );
    const teammates = [
      passer,
      footballer(
        'runner',
        'home',
        'RW',
        { x: 55, y: 49, z: 0 },
        { x: 2.1, y: -0.4, z: 0 },
      ),
      footballer(
        'pivot',
        'home',
        'CDM',
        { x: 32, y: 36, z: 0 },
        { x: -0.2, y: 0.5, z: 0 },
      ),
    ];
    const opponents = [
      footballer(
        'screen',
        'away',
        'CDM',
        { x: 46, y: 36, z: 0 },
        { x: -0.8, y: 0.2, z: 0 },
      ),
      footballer(
        'cover',
        'away',
        'LCB',
        { x: 54, y: 43, z: 0 },
        { x: -1.1, y: -0.3, z: 0 },
      ),
    ];

    const originalPasses = evaluatePassCandidates(
      passer,
      teammates,
      opponents,
      1,
      REGULATION_PITCH,
    );
    const rotatedPasses = evaluatePassCandidates(
      rotateFootballer(passer),
      teammates.map(rotateFootballer),
      opponents.map(rotateFootballer),
      -1,
      REGULATION_PITCH,
    );

    expect(rotatedPasses.map(candidate => candidate.playerId)).toEqual(
      originalPasses.map(candidate => candidate.playerId),
    );
    originalPasses.forEach((original, index) => {
      const rotated = rotatedPasses[index];
      expect(rotated.reason).toBe(original.reason);
      expect(rotated.score).toBeCloseTo(original.score, 10);
      expect(rotated.distanceM).toBeCloseTo(original.distanceM, 10);
      expect(rotated.progressM).toBeCloseTo(original.progressM, 10);
      expect(rotated.laneRisk).toBeCloseTo(original.laneRisk, 10);
      expect(rotated.receiverPressure).toBeCloseTo(original.receiverPressure, 10);
      expect(rotated.completionProbability).toBeCloseTo(
        original.completionProbability,
        10,
      );
      expectRotatedPosition(rotated.targetPosition, original.targetPosition);
    });

    const originalPressure = calculatePressure(passer.position, opponents);
    const rotatedPressure = calculatePressure(
      rotatePosition(passer.position),
      opponents.map(rotateFootballer),
    );
    expect(rotatedPressure.nearestOpponentId).toBe(originalPressure.nearestOpponentId);
    expect(rotatedPressure.opponentsWithinFiveM).toBe(
      originalPressure.opponentsWithinFiveM,
    );
    expect(rotatedPressure.value).toBeCloseTo(originalPressure.value, 10);
    expect(rotatedPressure.nearestDistanceM).toBeCloseTo(
      originalPressure.nearestDistanceM,
      10,
    );

    const originalShape = calculateShapeTarget({
      attackDirection: 1,
      basePosition: teammates[1].position,
      ballPosition: { x: 61, y: 42, z: 0.11 },
      inPossession: true,
      pitch: REGULATION_PITCH,
      role: teammates[1].role,
    });
    const rotatedShape = calculateShapeTarget({
      attackDirection: -1,
      basePosition: rotatePosition(teammates[1].position),
      ballPosition: rotatePosition({ x: 61, y: 42, z: 0.11 }),
      inPossession: true,
      pitch: REGULATION_PITCH,
      role: teammates[1].role,
    });
    expectRotatedPosition(rotatedShape, originalShape);

    const previousBall = { x: 45, y: 34, z: 0.11 };
    const nextBall = { x: 47, y: 35, z: 0.12 };
    const interceptors = [
      footballer('interceptor', 'away', 'CB', { x: 46.1, y: 34.55, z: 0 }),
    ];
    const originalInterception = selectInterceptionCandidate(
      previousBall,
      nextBall,
      interceptors,
    );
    const rotatedInterception = selectInterceptionCandidate(
      rotatePosition(previousBall),
      rotatePosition(nextBall),
      interceptors.map(rotateFootballer),
    );
    expect(rotatedInterception?.playerId).toBe(originalInterception?.playerId);
    expect(rotatedInterception?.distanceM).toBeCloseTo(
      originalInterception?.distanceM ?? Number.NaN,
      10,
    );
    expect(rotatedInterception?.controlScore).toBeCloseTo(
      originalInterception?.controlScore ?? Number.NaN,
      10,
    );

    const originalSeparation = calculateSeparationSteering(passer, [
      passer,
      footballer('marker', 'away', 'CM', { x: 38.7, y: 28.2, z: 0 }),
    ]);
    const rotatedSeparation = calculateSeparationSteering(
      rotateFootballer(passer),
      [
        rotateFootballer(passer),
        rotateFootballer(
          footballer('marker', 'away', 'CM', { x: 38.7, y: 28.2, z: 0 }),
        ),
      ],
    );
    expect(rotatedSeparation.x).toBeCloseTo(-originalSeparation.x, 10);
    expect(rotatedSeparation.y).toBeCloseTo(-originalSeparation.y, 10);
    expect(rotatedSeparation.z).toBe(originalSeparation.z);
  });
});
