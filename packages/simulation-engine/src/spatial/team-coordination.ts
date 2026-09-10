import type { EntityId, PlayerRole } from '../core/types';
import type {
  FootballDecisionTrace, FootballPhase, FootballTactics, MatchActorIntent,
  MatchPitchDimensions, MatchVector3, RoleDuty,
} from '../protocol';
import type { FootballerSnapshot } from './football-intelligence';
import type { FormationAssignment } from './formation-layout';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const distance = (a: MatchVector3, b: MatchVector3) => Math.hypot(a.x - b.x, a.y - b.y);
const centreBack = (role: PlayerRole) => ['CB', 'RCB', 'LCB', 'SW'].includes(role);
const holdingMidfielder = (role: PlayerRole) => ['CDM', 'LDM', 'RDM'].includes(role);
const fullback = (role: PlayerRole) => ['LB', 'RB', 'LWB', 'RWB'].includes(role);
const wideForward = (role: PlayerRole) => ['LW', 'RW', 'AML', 'AMR'].includes(role);
const forward = (role: PlayerRole) => ['ST', 'CF', 'LS', 'RS'].includes(role);
const idOrder = (a: EntityId, b: EntityId) => {
  const left = `${typeof a}:${String(a)}`;
  const right = `${typeof b}:${String(b)}`;
  return left < right ? -1 : left > right ? 1 : 0;
};

export interface CoordinatedMovement {
  readonly target: MatchVector3;
  readonly intent: MatchActorIntent;
  readonly trace: FootballDecisionTrace;
}

export interface TeamCoordinationInput {
  readonly teamId: EntityId;
  readonly attackDirection: 1 | -1;
  readonly pitch: MatchPitchDimensions;
  readonly assignments: readonly FormationAssignment[];
  /** Every player describes the same immutable tick-start world. */
  readonly players: readonly FootballerSnapshot[];
  readonly ball: MatchVector3;
  readonly ballOwnerId: EntityId | null;
  readonly possessionTeamId: EntityId;
  readonly ticksSinceTurnover: number;
  readonly tick: number;
  readonly tickRateHz: number;
  readonly tactics: FootballTactics;
}

export function defaultRoleDuty(role: PlayerRole): RoleDuty {
  if (role === 'GK' || centreBack(role) || holdingMidfielder(role)) return 'defend';
  if (wideForward(role) || forward(role)) return 'attack';
  return 'support';
}

/** Team-local coordinates always attack +x. This also mirrors lateral decisions. */
export function planTeamMovement(input: TeamCoordinationInput): ReadonlyMap<EntityId, CoordinatedMovement> {
  const { pitch, attackDirection: direction, tactics, tick } = input;
  const local = (p: MatchVector3): MatchVector3 => direction === 1 ? p :
    ({ x: pitch.lengthM - p.x, y: pitch.widthM - p.y, z: p.z });
  const world = (p: MatchVector3): MatchVector3 => local(p);
  const ball = local(input.ball);
  const inPossession = input.possessionTeamId === input.teamId;
  const transition = input.ticksSinceTurnover < input.tickRateHz * 3;
  const phase: FootballPhase = transition
    ? (inPossession ? 'positive_transition' : 'negative_transition')
    : inPossession
      ? ball.x < pitch.lengthM * 0.35 ? 'build_up' : ball.x > pitch.lengthM * 0.7 ? 'final_third' : 'progression'
      : tactics.defensiveLine > 67 ? 'high_block' : tactics.defensiveLine < 33 ? 'low_block' : 'mid_block';
  const teammates = input.players.filter(p => p.teamId === input.teamId).sort((a, b) => idOrder(a.id, b.id));
  const opponents = input.players.filter(p => p.teamId !== input.teamId).sort((a, b) => idOrder(a.id, b.id));
  const byId = new Map(teammates.map(p => [p.id, p]));
  const assignments = [...input.assignments].filter(a => a.team.teamId === input.teamId)
    .sort((a, b) => idOrder(a.participant.id, b.participant.id));

  // Reserve central cover before considering attacking runs. One player's decision
  // cannot consume another player's cover halfway through the actor update loop.
  const protection = assignments.filter(a => a.participant.role !== 'GK').sort((a, b) => {
    const priority = (a: FormationAssignment) => centreBack(a.participant.role as PlayerRole) ? 0 :
      holdingMidfielder(a.participant.role as PlayerRole) ? 1 : 2;
    return priority(a) - priority(b) || local(a.basePosition).x - local(b.basePosition).x ||
      idOrder(a.participant.id, b.participant.id);
  });
  const restDefenceIds = new Set(protection.slice(0, 3).map(a => a.participant.id));
  const presserCandidates = teammates.filter(p => p.role !== 'GK').map(p => ({
    player: p,
    distance: distance(p.position, input.ball),
    cost: distance(p.position, input.ball) + (centreBack(p.role) ? 8 : holdingMidfielder(p.role) ? 3 : 0),
  })).sort((a, b) => a.cost - b.cost || idOrder(a.player.id, b.player.id));
  const counterpress = transition && !inPossession && tactics.counterpress;
  const pressRadius = 5 + tactics.pressing * 0.23 + (counterpress ? 6 : 0);
  const engagementLine = pitch.lengthM * (0.25 + tactics.pressing * 0.005);
  const canPress = !inPossession && (ball.x <= engagementLine || counterpress);
  const firstPresser = canPress ? presserCandidates.find(c => c.distance <= pressRadius)?.player : undefined;
  const coverPlayer = firstPresser ? presserCandidates.find(c => c.player.id !== firstPresser.id &&
    !centreBack(c.player.role) && c.distance <= pressRadius + 7)?.player : undefined;
  const screeningPlayer = teammates.find(p => holdingMidfielder(p.role) &&
    p.id !== firstPresser?.id && p.id !== coverPlayer?.id);
  const decisions = new Map<EntityId, CoordinatedMovement>();

  for (const assignment of assignments) {
    const player = byId.get(assignment.participant.id);
    if (!player) continue;
    const role = player.role;
    const instructions = assignment.participant.instructions;
    const duty = instructions?.duty ?? defaultRoleDuty(role);
    const base = local(assignment.basePosition);
    const centreY = pitch.widthM / 2;
    const side = base.y < centreY ? -1 : 1;
    const protectedPlayer = restDefenceIds.has(player.id);
    const outlets = opponents.filter(p => local(p.position).x < ball.x && p.role !== 'GK');
    const centralCover = teammates.filter(p => restDefenceIds.has(p.id) && p.id !== player.id &&
      local(p.position).x < ball.x - 3 && Math.abs(local(p.position).y - centreY) < pitch.widthM * 0.3);
    const forwardRunAllowed = inPossession && !protectedPlayer && role !== 'GK' && duty !== 'defend' && !instructions?.holdPosition &&
      (centralCover.length >= Math.min(3, Math.max(2, outlets.length)));
    let responsibility: FootballDecisionTrace['responsibility'] = inPossession ? 'support' : 'block';
    let kind: MatchActorIntent['kind'] = inPossession ? 'support' : 'cover';
    let reason = inPossession ? 'offer_passing_angle' : 'compact_defensive_block';
    let urgency = inPossession ? 0.5 : 0.6;
    let x: number;
    let y: number;

    if (inPossession) {
      const advance = clamp((ball.x - pitch.lengthM / 2) * 0.65, -16, 27);
      x = base.x + advance + (duty === 'attack' ? 12 : duty === 'support' ? 5 : 0);
      y = centreY + (base.y - centreY) * (0.65 + tactics.width * 0.007) + (ball.y - centreY) * 0.12;
      if (protectedPlayer || instructions?.holdPosition || duty === 'defend') {
        x = Math.min(x, ball.x - (centreBack(role) ? 17 : 10));
        responsibility = 'rest_defence'; reason = 'protect_counterattack_outlets'; kind = 'cover';
      } else if (forwardRunAllowed) {
        responsibility = 'run';
        if (transition && tactics.counterattack) { x += 9; urgency = 0.9; reason = 'exploit_turnover_space'; }
        if (forward(role)) {
          x = Math.max(x, ball.x + 10);
          y = centreY + (ball.y - centreY) * 0.28;
          reason = transition && tactics.counterattack ? reason : 'threaten_space_behind';
        }
        const movement = instructions?.wideMovement ?? 'hold_width';
        if (fullback(role) && (movement === 'overlap' || movement === 'underlap')) {
          x = Math.max(x, ball.x + 7);
          y = movement === 'overlap' ? centreY + side * (centreY - 4) : centreY + side * pitch.widthM * 0.2;
          reason = movement === 'overlap' ? 'overlap_outside_winger' : 'underlap_inside_channel';
          urgency = 0.8;
        } else if (wideForward(role)) {
          kind = movement === 'cut_inside' ? 'support' : 'offer_width';
          y = movement === 'cut_inside' ? centreY + side * pitch.widthM * 0.17 : y;
          reason = movement === 'cut_inside' ? 'attack_inside_channel' : 'stretch_defensive_block';
        }
      } else {
        x = Math.min(x, ball.x + 3);
        reason = 'delay_run_until_cover_ready';
      }
      // Maintain a useful lane instead of lining up directly behind a teammate.
      if (responsibility === 'support') {
        const nearest = teammates.filter(p => p.id !== player.id && p.id !== input.ballOwnerId)
          .map(p => local(p.position)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
        if (nearest && Math.hypot(nearest.x - x, nearest.y - y) < 5) y += side * 4;
      }
    } else {
      const line = pitch.lengthM * (0.16 + tactics.defensiveLine * 0.0032);
      x = line + Math.max(0, base.x - pitch.lengthM * 0.23) * 0.72 + clamp((ball.x - pitch.lengthM / 2) * 0.18, -9, 7);
      y = centreY + (base.y - centreY) * 0.72 + (ball.y - centreY) * 0.28;
      // Recover goal-side of an outlet that has broken the line.
      const runner = opponents.filter(p => p.role !== 'GK').map(p => local(p.position))
        .filter(p => p.x < x && Math.abs(p.y - y) < 12).sort((a, b) => a.x - b.x)[0];
      if (runner && (centreBack(role) || fullback(role))) {
        x = runner.x - 2; y = runner.y; reason = 'recover_goal_side_of_runner'; kind = 'track_runner'; urgency = 0.95;
      }
      if (player.id === firstPresser?.id) {
        x = ball.x - 0.8;
        // Approach from the centre to screen the inside pass; close the final metre.
        y = ball.y + Math.sign(centreY - ball.y) * Math.min(2, distance(player.position, input.ball) * 0.12);
        responsibility = 'first_presser'; kind = 'press'; urgency = 0.72 + tactics.pressing * 0.0028;
        reason = counterpress ? 'counterpress_on_turnover' : 'close_ball_screen_inside';
      } else if (player.id === coverPlayer?.id) {
        x = ball.x - 6; y = centreY + (ball.y - centreY) * 0.7;
        responsibility = 'press_cover'; reason = 'cover_behind_first_presser'; kind = 'cover'; urgency = 0.7;
      } else if (player.id === screeningPlayer?.id) {
        x = Math.min(x, ball.x - 10); y = centreY + (ball.y - centreY) * 0.35;
        responsibility = 'screen'; reason = 'screen_central_passing_lane';
      } else if (transition) {
        reason = 'recover_compact_shape'; urgency = 0.85;
      }
    }
    if (role === 'GK') {
      x = clamp(ball.x * 0.09, 2, inPossession ? 11 : 6);
      y = centreY + clamp((ball.y - centreY) * 0.13, -4, 4);
      responsibility = 'goalkeeper'; kind = 'goalkeeper_set'; reason = 'align_ball_goal_angle'; urgency = 0.55;
    }
    const target = world({ x: clamp(x, 1.5, pitch.lengthM - 1.5), y: clamp(y, 2, pitch.widthM - 2), z: 0 });
    decisions.set(player.id, {
      target,
      intent: { kind, sinceTick: tick, urgency, reason, targetPosition: target,
        ...(responsibility === 'first_presser' && input.ballOwnerId !== null ? { targetActorId: input.ballOwnerId } : {}) },
      trace: { phase, duty, responsibility, reason, forwardRunAllowed, evaluatedAtTick: tick },
    });
  }
  return decisions;
}
