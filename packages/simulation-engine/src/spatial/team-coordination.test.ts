import {
  DEFAULT_FOOTBALL_TACTICS, DEFAULT_FOOTBALL_ATTRIBUTES, MATCH_PROTOCOL_VERSION,
  type MatchManifest, type MatchParticipant, type PlayerRole, type FootballTactics,
  validateMatchManifest,
} from '../protocol';
import { createFormationAssignments } from './formation-layout';
import { planTeamMovement, type TeamCoordinationInput } from './team-coordination';
import { evaluatePassCandidates, type FootballerSnapshot } from './football-intelligence';
import { SeededKickoffSimulation } from './seeded-kickoff-simulation';

const roles: PlayerRole[] = ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW'];
function manifest(): MatchManifest {
  const players = (teamId: string): MatchParticipant[] => roles.map((role, i) => ({
    id: `${teamId}-${role}`, teamId, role, kind: 'player', displayName: `${teamId} ${role}`,
    attributes: { ...DEFAULT_FOOTBALL_ATTRIBUTES, pace: 50 + i * 4, acceleration: 50 + i * 3 },
  }));
  return {
    version: MATCH_PROTOCOL_VERSION, matchId: 'tactical-causality', seed: 12345, tickRateHz: 20,
    pitch: { lengthM: 105, widthM: 68 },
    home: { teamId: 'home', formation: '4-3-3', attacksPositiveXFirstHalf: true,
      startingPlayerIds: players('home').map(p => p.id), tactics: DEFAULT_FOOTBALL_TACTICS },
    away: { teamId: 'away', formation: '4-3-3', attacksPositiveXFirstHalf: false,
      startingPlayerIds: players('away').map(p => p.id), tactics: DEFAULT_FOOTBALL_TACTICS },
    participants: [...players('home'), ...players('away'),
      { id: 'ref', kind: 'referee', teamId: null, role: 'referee', displayName: 'Referee' },
      { id: 'near', kind: 'assistant_referee', teamId: null, role: 'assistant_near', displayName: 'Near' },
      { id: 'far', kind: 'assistant_referee', teamId: null, role: 'assistant_far', displayName: 'Far' }],
  };
}

function scenario(overrides: Partial<TeamCoordinationInput> = {}): TeamCoordinationInput {
  const m = manifest();
  const assignments = [...createFormationAssignments(m).values()];
  return {
    teamId: 'home', attackDirection: 1, pitch: m.pitch, assignments,
    players: assignments.map(a => ({ id: a.participant.id, teamId: a.team.teamId,
      role: a.participant.role as PlayerRole, position: a.basePosition,
      velocity: { x: 0, y: 0, z: 0 }, stamina: 100 })),
    ball: { x: 60, y: 34, z: 0 }, ballOwnerId: 'home-LCM', possessionTeamId: 'home',
    ticksSinceTurnover: 100, tick: 300, tickRateHz: 20, tactics: DEFAULT_FOOTBALL_TACTICS,
    ...overrides,
  };
}

const withTactics = (input: TeamCoordinationInput, change: Partial<FootballTactics>) =>
  planTeamMovement({ ...input, tactics: { ...input.tactics, ...change } });

it('spreads the attacking team when width increases, while retaining central cover', () => {
  const input = scenario();
  const narrow = withTactics(input, { width: 10 });
  const wide = withTactics(input, { width: 90 });
  const spread = (p: ReturnType<typeof planTeamMovement>) =>
    [...p.values()].reduce((sum, d) => sum + Math.abs(d.target.y - 34), 0);
  expect(spread(wide)).toBeGreaterThan(spread(narrow) + 30);
  for (const id of ['home-LCB', 'home-RCB', 'home-CDM']) {
    expect(wide.get(id)?.trace.responsibility).toBe('rest_defence');
    expect(wide.get(id)!.target.x).toBeLessThan(input.ball.x - 5);
  }
});

it('raises the defensive block when line height increases', () => {
  const input = scenario({ possessionTeamId: 'away', ballOwnerId: 'away-ST', ball: { x: 75, y: 34, z: 0 } });
  const low = withTactics(input, { defensiveLine: 10, pressing: 0 });
  const high = withTactics(input, { defensiveLine: 90, pressing: 0 });
  expect(high.get('home-LCB')!.target.x).toBeGreaterThan(low.get('home-LCB')!.target.x + 20);
});

it('coordinates one presser and cover rather than sending the whole team to the ball', () => {
  const input = scenario({ possessionTeamId: 'away', ballOwnerId: 'away-ST', ball: { x: 55, y: 40, z: 0 } });
  const passive = withTactics(input, { pressing: 0 });
  const aggressive = withTactics(input, { pressing: 100 });
  expect([...passive.values()].filter(d => d.intent.kind === 'press')).toHaveLength(0);
  expect([...aggressive.values()].filter(d => d.intent.kind === 'press')).toHaveLength(1);
  expect([...aggressive.values()].filter(d => d.trace.responsibility === 'press_cover')).toHaveLength(1);
  expect([...aggressive.values()].filter(d => d.trace.responsibility === 'screen')).toHaveLength(1);
});

it('counterpresses only in the turnover window and otherwise regroups', () => {
  const input = scenario({ possessionTeamId: 'away', ballOwnerId: 'away-ST', ball: { x: 55, y: 40, z: 0 }, ticksSinceTurnover: 10 });
  const counterpress = withTactics(input, { pressing: 30, counterpress: true });
  const regroup = withTactics(input, { pressing: 30, counterpress: false });
  expect([...counterpress.values()].some(d => d.intent.reason === 'counterpress_on_turnover')).toBe(true);
  expect([...regroup.values()].some(d => d.intent.reason === 'counterpress_on_turnover')).toBe(false);
  const settled = withTactics({ ...input, ticksSinceTurnover: 61 }, { pressing: 30, counterpress: true });
  expect([...settled.values()].some(d => d.intent.reason === 'counterpress_on_turnover')).toBe(false);
});

it('sends overlaps outside and underlaps inside, and cancels both when cover is missing', () => {
  const input = scenario();
  const withMovement = (movement: 'overlap' | 'underlap', players = input.players) => planTeamMovement({
    ...input, players,
    assignments: input.assignments.map(a => a.participant.id === 'home-LB' ? { ...a,
      participant: { ...a.participant, instructions: { duty: 'attack', wideMovement: movement } } } : a),
  });
  const overlap = withMovement('overlap').get('home-LB')!;
  const underlap = withMovement('underlap').get('home-LB')!;
  expect(overlap.trace.forwardRunAllowed).toBe(true);
  expect(overlap.target.x).toBeGreaterThan(input.ball.x);
  expect(overlap.target.y).toBeLessThan(underlap.target.y - 10);
  const exposed = input.players.map(p => ['home-LCB', 'home-RCB', 'home-CDM'].includes(String(p.id))
    ? { ...p, position: { x: 80, y: 34, z: 0 } } : p);
  const denied = withMovement('overlap', exposed).get('home-LB')!;
  expect(denied.trace.forwardRunAllowed).toBe(false);
  expect(denied.intent.reason).toBe('delay_run_until_cover_ready');
});

it('holds a player on defend duty behind the ball despite an overlap instruction', () => {
  const input = scenario();
  const plan = planTeamMovement({ ...input, assignments: input.assignments.map(a => a.participant.id === 'home-LB'
    ? { ...a, participant: { ...a.participant, instructions: { duty: 'defend', wideMovement: 'overlap' } } } : a) });
  expect(plan.get('home-LB')!.target.x).toBeLessThan(input.ball.x);
  expect(plan.get('home-LB')!.trace.forwardRunAllowed).toBe(false);
});

it('makes direct passing prefer the longer progressive option in an open lane', () => {
  const p = (id: string, x: number, y: number): FootballerSnapshot => ({
    id, teamId: 'home', role: 'CM', position: { x, y, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, stamina: 100,
  });
  const passer = p('passer', 30, 34);
  const team = [passer, p('short', 38, 35), p('long', 65, 36)];
  const candidates = (directness: number) => evaluatePassCandidates(passer, team, [], 1, { lengthM: 105, widthM: 68 }, { ...DEFAULT_FOOTBALL_TACTICS, directness });
  expect(candidates(0)[0].playerId).toBe('short');
  expect(candidates(100)[0].playerId).toBe('long');
});

it('is invariant to actor/assignment iteration order and pitch rotation', () => {
  const input = scenario();
  const original = planTeamMovement(input);
  expect(planTeamMovement({ ...input, assignments: [...input.assignments].reverse(), players: [...input.players].reverse() })).toEqual(original);
  const rotate = (p: { x: number; y: number; z: number }) => ({ x: 105 - p.x, y: 68 - p.y, z: p.z });
  const mirrored = planTeamMovement({ ...input, attackDirection: -1, ball: rotate(input.ball),
    assignments: input.assignments.map(a => ({ ...a, basePosition: rotate(a.basePosition) })),
    players: input.players.map(p => ({ ...p, position: rotate(p.position), velocity: { x: -p.velocity.x, y: -p.velocity.y, z: 0 } })) });
  for (const [id, decision] of original) {
    expect(mirrored.get(id)!.target.x).toBeCloseTo(105 - decision.target.x, 10);
    expect(mirrored.get(id)!.target.y).toBeCloseTo(68 - decision.target.y, 10);
    expect(mirrored.get(id)!.trace).toEqual(decision.trace);
  }
});

it('rejects invalid tactical inputs and ratings before simulation', () => {
  const m = manifest();
  const invalid = { ...m, home: { ...m.home, tactics: { ...DEFAULT_FOOTBALL_TACTICS, width: NaN } },
    participants: m.participants.map((p, i) => i === 0 ? { ...p, attributes: { pace: 101 } } : p) };
  expect(validateMatchManifest(invalid).map(i => i.path)).toEqual(expect.arrayContaining(['home.tactics.width', 'participants[0].attributes.pace']));
  expect(() => new SeededKickoffSimulation(invalid)).toThrow();
});

it('uses pace and acceleration as physical constraints on the same player', () => {
  const m = manifest();
  const run = (rating: number) => {
    const sim = new SeededKickoffSimulation({ ...m, participants: m.participants.map(p => p.id === 'home-LW'
      ? { ...p, attributes: { ...p.attributes, pace: rating, acceleration: rating } } : p) });
    return sim.advanceTicks(300).map(f => f.actors.find(p => p.id === 'home-LW')!);
  };
  const slow = run(5), fast = run(95);
  const maxSpeed = (frames: typeof slow) => Math.max(...frames.map(p => Math.hypot(p.velocity.x, p.velocity.y)));
  expect(maxSpeed(fast)).toBeGreaterThan(maxSpeed(slow) + 0.5);
  for (let i = 1; i < fast.length; i++) {
    expect(Math.hypot(fast[i].velocity.x - fast[i - 1].velocity.x, fast[i].velocity.y - fast[i - 1].velocity.y)).toBeLessThanOrEqual(4.8 / 20 + 1e-6);
  }
});

it('replays coordinated football identically across batching and participant order', () => {
  const m = manifest();
  const a = new SeededKickoffSimulation(m);
  const b = new SeededKickoffSimulation({ ...m, participants: [...m.participants].reverse() });
  const canonical = (f: ReturnType<typeof a.getFrame>) => ({ ...f, actors: [...f.actors].sort((a, b) => String(a.id).localeCompare(String(b.id))) });
  const frames = a.advanceTicks(360);
  expect(frames.some(f => f.actors.some(a => a.footballDecision))).toBe(true);
  for (const frame of frames) expect(canonical(b.step())).toEqual(canonical(frame));
});

it('isolates the running simulation from later edits to the caller manifest', () => {
  const m = manifest();
  const a = new SeededKickoffSimulation(m);
  const b = new SeededKickoffSimulation(m);
  (m.home as { tactics: FootballTactics }).tactics = { ...DEFAULT_FOOTBALL_TACTICS, width: 0 };
  expect(a.advanceTicks(260)).toEqual(b.advanceTicks(260));
});
