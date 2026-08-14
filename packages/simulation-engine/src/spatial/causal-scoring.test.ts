import type { MatchPitchDimensions, MatchVector3 } from '../protocol';
import {
  CAUSAL_SCORING_LIMITS,
  CAUSAL_SCORING_VERSION,
  adjudicateGoalLine,
  createShotContact,
  evaluateGoalkeeperResponse,
  evaluateShotOpportunity,
  predictShotAtXPlane,
  predictShotTrajectoryPoint,
  type GoalkeeperResponseInput,
  type ShotContactInput,
  type ShotOpportunityInput,
  type ShotTrajectory,
} from './causal-scoring';

const PITCH: MatchPitchDimensions = { lengthM: 105, widthM: 68 };

const closeToVector = (received: MatchVector3, expected: MatchVector3): void => {
  expect(received.x).toBeCloseTo(expected.x, 10);
  expect(received.y).toBeCloseTo(expected.y, 10);
  expect(received.z).toBeCloseTo(expected.z, 10);
};

const rotatePoint = (point: MatchVector3): MatchVector3 => ({
  x: PITCH.lengthM - point.x,
  y: PITCH.widthM - point.y,
  z: point.z,
});

const rotatePlanarVector = (value: MatchVector3): MatchVector3 => ({
  x: -value.x,
  y: -value.y,
  z: value.z,
});

const rotatedYaw = (yaw: number): number => {
  const result = yaw + Math.PI;
  return result > Math.PI ? result - Math.PI * 2 : result;
};

const opportunityInput = (): ShotOpportunityInput => ({
  pitch: PITCH,
  attackDirection: 1,
  ballPosition: { x: 88, y: 29, z: 0.11 },
  targetPoint: { x: 105, y: 32.4, z: 1.05 },
  shooterFacingYaw: Math.atan2(3.4, 17),
  pressure: 0.18,
  balance: 0.91,
  goalkeeperPosition: { x: 103.2, y: 34.6, z: 0 },
  blockers: [
    { position: { x: 94, y: 30.8, z: 0 }, controlRadiusM: 0.45 },
    { position: { x: 97, y: 35.5, z: 0 }, controlRadiusM: 0.5 },
  ],
});

const contactInput = (): ShotContactInput => ({
  attackDirection: 1,
  ballPosition: { x: 88, y: 29, z: 0.11 },
  targetPoint: { x: 105, y: 32.4, z: 1.05 },
  requestedPower: 0.77,
  attributes: {
    finishing: 84,
    technique: 87,
    composure: 82,
    balance: 0.9,
    pressure: 0.22,
    fatigue: 0.14,
    footProficiency: 1,
  },
  samples: {
    lateralError: 0.63,
    elevationError: 0.42,
    powerError: 0.57,
    spin: 0.66,
  },
});

const goalkeeperInput = (trajectory: ShotTrajectory): GoalkeeperResponseInput => ({
  trajectory,
  attackDirection: 1,
  goalkeeperPosition: { x: 103.2, y: 32.7, z: 0 },
  attributes: { anticipation: 83, reflexes: 88, agility: 86, handling: 81 },
  lineOfSight: 0.86,
  fatigue: 0.12,
  samples: {
    perceptionLateral: 0.58,
    perceptionVertical: 0.46,
    perceptionTiming: 0.52,
    reactionTiming: 0.43,
    diveExecution: 0.81,
  },
});

describe('Causal Scoring v1', () => {
  it('exposes the bounded versioned football contract', () => {
    expect(CAUSAL_SCORING_VERSION).toBe(1);
    expect(CAUSAL_SCORING_LIMITS).toEqual(expect.objectContaining({
      ballRadiusM: 0.11,
      goalWidthM: 7.32,
      goalHeightM: 2.44,
      gravityMps2: 9.81,
    }));
  });

  it('rates causal opportunity factors without selecting a result', () => {
    const clear = evaluateShotOpportunity({ ...opportunityInput(), blockers: [] });
    const difficult = evaluateShotOpportunity({
      ...opportunityInput(),
      ballPosition: { x: 73, y: 9, z: 0.11 },
      shooterFacingYaw: Math.PI / 2,
      pressure: 0.92,
      balance: 0.3,
      blockers: [
        { position: { x: 84, y: 18.8, z: 0 }, controlRadiusM: 0.7 },
        { position: { x: 91, y: 25.7, z: 0 }, controlRadiusM: 0.7 },
      ],
    });

    expect(clear.opportunityScore).toBeGreaterThan(difficult.opportunityScore);
    expect(clear.opportunityScore).toBeGreaterThanOrEqual(0);
    expect(clear.opportunityScore).toBeLessThanOrEqual(1);
    expect(clear.reasons).toContain('clear_sight');
    expect(difficult.reasons).toEqual(expect.arrayContaining([
      'wide_angle',
      'heavy_pressure',
      'body_misaligned',
    ]));
    expect(Object.keys(clear)).not.toEqual(expect.arrayContaining(['winner', 'score', 'isGoal']));
  });

  it('is independent of blocker iteration order', () => {
    const input = opportunityInput();
    const reversed = { ...input, blockers: [...input.blockers].reverse() };

    expect(evaluateShotOpportunity(reversed)).toEqual(evaluateShotOpportunity(input));
  });

  it('turns supplied samples into bounded physical contact and trajectory inputs', () => {
    const contact = createShotContact(contactInput());
    const atRelease = predictShotTrajectoryPoint(contact.trajectory, 0);
    const later = predictShotTrajectoryPoint(contact.trajectory, 0.25);

    expect(contact.contactQuality).toBeGreaterThanOrEqual(0);
    expect(contact.contactQuality).toBeLessThanOrEqual(1);
    expect(contact.speedMps).toBeGreaterThanOrEqual(CAUSAL_SCORING_LIMITS.minimumShotSpeedMps);
    expect(contact.speedMps).toBeLessThanOrEqual(CAUSAL_SCORING_LIMITS.maximumShotSpeedMps);
    expect(atRelease.position).toEqual(contact.trajectory.origin);
    expect(later.position.x).toBeGreaterThan(atRelease.position.x);
    expect(later.position.z).toBeGreaterThanOrEqual(CAUSAL_SCORING_LIMITS.ballRadiusM);
    expect(Number.isFinite(later.velocity.x)).toBe(true);
  });

  it('makes higher contact quality reduce error for the same supplied samples', () => {
    const high = createShotContact({
      ...contactInput(),
      attributes: {
        finishing: 100,
        technique: 100,
        composure: 100,
        balance: 1,
        pressure: 0,
        fatigue: 0,
        footProficiency: 1,
      },
      samples: { lateralError: 1, elevationError: 1, powerError: 1, spin: 1 },
    });
    const low = createShotContact({
      ...contactInput(),
      attributes: {
        finishing: 20,
        technique: 20,
        composure: 20,
        balance: 0.2,
        pressure: 1,
        fatigue: 1,
        footProficiency: 0.2,
      },
      samples: { lateralError: 1, elevationError: 1, powerError: 1, spin: 1 },
    });

    expect(high.contactQuality).toBeGreaterThan(low.contactQuality);
    expect(Math.abs(high.lateralErrorRad)).toBeLessThan(Math.abs(low.lateralErrorRad));
    expect(Math.abs(high.elevationErrorRad)).toBeLessThan(Math.abs(low.elevationErrorRad));
    expect(Math.abs(high.powerErrorFraction)).toBeLessThan(Math.abs(low.powerErrorFraction));
  });

  it('predicts an x-plane interception from trajectory rather than a result roll', () => {
    const contact = createShotContact(contactInput());
    const intercept = predictShotAtXPlane(contact.trajectory, 103.2);

    expect(intercept).not.toBeNull();
    expect(intercept?.position.x).toBeCloseTo(103.2, 10);
    expect(intercept?.timeSeconds).toBeGreaterThan(0);
    expect(intercept?.timeSeconds).toBeLessThan(2);
  });

  it('models goalkeeper delay, perceived intercept and committed physical reach', () => {
    const contact = createShotContact(contactInput());
    const response = evaluateGoalkeeperResponse(goalkeeperInput(contact.trajectory));

    expect(response).not.toBeNull();
    if (!response) throw new Error('Expected shot to reach goalkeeper plane');
    expect(response.perceptionDelaySeconds).toBeGreaterThan(0);
    expect(response.reactionDelaySeconds).toBeGreaterThan(0);
    expect(response.movementTimeSeconds).toBeGreaterThanOrEqual(0);
    expect(response.maximumReachM).toBeGreaterThan(0);
    expect(response.contactRadiusM).toBeGreaterThan(contact.trajectory.ballRadiusM);
    expect(response.canReach).toBe(true);
    expect(response.makesContact).toBe(true);
  });

  it('distinguishes theoretical reach from a perception-led committed miss', () => {
    const contact = createShotContact({
      ...contactInput(),
      targetPoint: { x: 105, y: 32.9, z: 1.05 },
      samples: { lateralError: 0.5, elevationError: 0.5, powerError: 0.5, spin: 0.5 },
    });
    const response = evaluateGoalkeeperResponse({
      ...goalkeeperInput(contact.trajectory),
      goalkeeperPosition: { x: 103.2, y: 33.1, z: 0 },
      attributes: { anticipation: 5, reflexes: 95, agility: 95, handling: 20 },
      lineOfSight: 0,
      samples: {
        perceptionLateral: 1,
        perceptionVertical: 0.5,
        perceptionTiming: 0,
        reactionTiming: 0,
        diveExecution: 1,
      },
    });

    expect(response).not.toBeNull();
    if (!response) throw new Error('Expected shot to reach goalkeeper plane');
    expect(response.canReach).toBe(true);
    expect(response.makesContact).toBe(false);
  });

  it('requires the whole ball to cross between the posts and below the bar', () => {
    const goal = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 104.96, y: 34, z: 1.1 },
      nextBallPosition: { x: 105.24, y: 34, z: 1.1 },
    });
    const partial = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 104.96, y: 34, z: 1.1 },
      nextBallPosition: { x: 105.07, y: 34, z: 1.1 },
    });
    const wide = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 104.96, y: 37.7, z: 1.1 },
      nextBallPosition: { x: 105.24, y: 37.7, z: 1.1 },
    });
    const high = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 104.96, y: 34, z: 2.4 },
      nextBallPosition: { x: 105.24, y: 34, z: 2.4 },
    });

    expect(goal).toEqual(expect.objectContaining({
      isGoal: true,
      wholeBallCrossed: true,
      insideGoalMouth: true,
      outcome: 'goal',
    }));
    expect(goal.crossingPoint?.x).toBeCloseTo(105.11, 10);
    expect(partial).toEqual(expect.objectContaining({
      isGoal: false,
      wholeBallCrossed: false,
      outcome: 'no_full_crossing',
    }));
    expect(wide).toEqual(expect.objectContaining({ isGoal: false, outcome: 'wide' }));
    expect(high).toEqual(expect.objectContaining({ isGoal: false, outcome: 'over_bar' }));
  });

  it('does not emit duplicate crossings or accept motion out of the goal', () => {
    const alreadyCrossed = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 105.12, y: 34, z: 1 },
      nextBallPosition: { x: 105.3, y: 34, z: 1 },
    });
    const backwards = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 105.2, y: 34, z: 1 },
      nextBallPosition: { x: 104.9, y: 34, z: 1 },
    });

    expect(alreadyCrossed.outcome).toBe('no_full_crossing');
    expect(backwards.outcome).toBe('wrong_direction');
  });

  it('is deterministic and never consults ambient randomness or wall-clock time', () => {
    const random = jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('ambient randomness is forbidden');
    });
    const now = jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('wall-clock time is forbidden');
    });

    try {
      const firstContact = createShotContact(contactInput());
      const secondContact = createShotContact(contactInput());
      expect(secondContact).toEqual(firstContact);
      expect(evaluateGoalkeeperResponse(goalkeeperInput(firstContact.trajectory))).toEqual(
        evaluateGoalkeeperResponse(goalkeeperInput(secondContact.trajectory)),
      );
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
  });

  it('preserves the complete causal chain under a 180-degree direction mirror', () => {
    const originalOpportunityInput = opportunityInput();
    const mirroredOpportunityInput: ShotOpportunityInput = {
      ...originalOpportunityInput,
      attackDirection: -1,
      ballPosition: rotatePoint(originalOpportunityInput.ballPosition),
      targetPoint: rotatePoint(originalOpportunityInput.targetPoint),
      shooterFacingYaw: rotatedYaw(originalOpportunityInput.shooterFacingYaw),
      goalkeeperPosition: rotatePoint(originalOpportunityInput.goalkeeperPosition),
      blockers: originalOpportunityInput.blockers.map(blocker => ({
        ...blocker,
        position: rotatePoint(blocker.position),
      })),
    };
    const originalOpportunity = evaluateShotOpportunity(originalOpportunityInput);
    const mirroredOpportunity = evaluateShotOpportunity(mirroredOpportunityInput);

    expect(mirroredOpportunity.opportunityScore).toBeCloseTo(
      originalOpportunity.opportunityScore,
      12,
    );
    expect(mirroredOpportunity.distanceM).toBeCloseTo(originalOpportunity.distanceM, 12);
    expect(mirroredOpportunity.goalOpeningAngleRad).toBeCloseTo(
      originalOpportunity.goalOpeningAngleRad,
      12,
    );
    expect(mirroredOpportunity.bodyAlignment).toBeCloseTo(originalOpportunity.bodyAlignment, 12);
    expect(mirroredOpportunity.laneObstruction).toBeCloseTo(
      originalOpportunity.laneObstruction,
      12,
    );
    expect(mirroredOpportunity.goalkeeperCoverage).toBeCloseTo(
      originalOpportunity.goalkeeperCoverage,
      12,
    );

    const originalContactInput = contactInput();
    const mirroredContactInput: ShotContactInput = {
      ...originalContactInput,
      attackDirection: -1,
      ballPosition: rotatePoint(originalContactInput.ballPosition),
      targetPoint: rotatePoint(originalContactInput.targetPoint),
    };
    const originalContact = createShotContact(originalContactInput);
    const mirroredContact = createShotContact(mirroredContactInput);
    expect(mirroredContact.contactQuality).toBeCloseTo(originalContact.contactQuality, 12);
    expect(mirroredContact.speedMps).toBeCloseTo(originalContact.speedMps, 12);
    closeToVector(
      mirroredContact.trajectory.initialVelocity,
      rotatePlanarVector(originalContact.trajectory.initialVelocity),
    );
    closeToVector(
      mirroredContact.trajectory.lateralAcceleration,
      rotatePlanarVector(originalContact.trajectory.lateralAcceleration),
    );
    closeToVector(
      predictShotTrajectoryPoint(mirroredContact.trajectory, 0.4).position,
      rotatePoint(predictShotTrajectoryPoint(originalContact.trajectory, 0.4).position),
    );

    const originalGoalkeeperInput = goalkeeperInput(originalContact.trajectory);
    const mirroredGoalkeeperInput: GoalkeeperResponseInput = {
      ...originalGoalkeeperInput,
      trajectory: mirroredContact.trajectory,
      attackDirection: -1,
      goalkeeperPosition: rotatePoint(originalGoalkeeperInput.goalkeeperPosition),
    };
    const originalResponse = evaluateGoalkeeperResponse(originalGoalkeeperInput);
    const mirroredResponse = evaluateGoalkeeperResponse(mirroredGoalkeeperInput);
    expect(originalResponse).not.toBeNull();
    expect(mirroredResponse).not.toBeNull();
    if (!originalResponse || !mirroredResponse) throw new Error('Expected mirrored responses');
    expect(mirroredResponse.shotArrivalSeconds).toBeCloseTo(
      originalResponse.shotArrivalSeconds,
      12,
    );
    expect(mirroredResponse.maximumReachM).toBeCloseTo(originalResponse.maximumReachM, 12);
    expect(mirroredResponse.contactDistanceM).toBeCloseTo(originalResponse.contactDistanceM, 12);
    expect(mirroredResponse.canReach).toBe(originalResponse.canReach);
    expect(mirroredResponse.makesContact).toBe(originalResponse.makesContact);
    closeToVector(
      mirroredResponse.actualInterceptPoint,
      rotatePoint(originalResponse.actualInterceptPoint),
    );
    closeToVector(
      mirroredResponse.perceivedInterceptPoint,
      rotatePoint(originalResponse.perceivedInterceptPoint),
    );
    closeToVector(
      mirroredResponse.committedReachPoint,
      rotatePoint(originalResponse.committedReachPoint),
    );

    const originalDecision = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: 104.96, y: 33.2, z: 1.2 },
      nextBallPosition: { x: 105.24, y: 33.3, z: 1.17 },
    });
    const mirroredDecision = adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: -1,
      previousBallPosition: rotatePoint({ x: 104.96, y: 33.2, z: 1.2 }),
      nextBallPosition: rotatePoint({ x: 105.24, y: 33.3, z: 1.17 }),
    });
    expect(mirroredDecision.isGoal).toBe(originalDecision.isGoal);
    expect(mirroredDecision.outcome).toBe(originalDecision.outcome);
    expect(mirroredDecision.wholeBallCrossed).toBe(originalDecision.wholeBallCrossed);
    if (!originalDecision.crossingPoint || !mirroredDecision.crossingPoint) {
      throw new Error('Expected mirrored crossing points');
    }
    closeToVector(mirroredDecision.crossingPoint, rotatePoint(originalDecision.crossingPoint));
  });

  it('rejects invalid normalized samples and invalid attack geometry', () => {
    expect(() => createShotContact({
      ...contactInput(),
      samples: { ...contactInput().samples, spin: 1.01 },
    })).toThrow('samples.spin must be a finite number in [0, 1]');
    expect(() => evaluateShotOpportunity({
      ...opportunityInput(),
      targetPoint: { x: 0, y: 34, z: 1 },
    })).toThrow('targetPoint.x must lie on the attacked goal line');
    expect(() => adjudicateGoalLine({
      pitch: PITCH,
      attackDirection: 1,
      previousBallPosition: { x: Number.NaN, y: 34, z: 1 },
      nextBallPosition: { x: 106, y: 34, z: 1 },
    })).toThrow('previousBallPosition.x must be finite');
  });
});
