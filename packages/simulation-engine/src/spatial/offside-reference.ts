import type { EntityId } from '../core/types';
import type { MatchActorFrame, MatchManifest } from '../protocol';

export type OffsideReferenceSource = 'ball' | 'second_last_defender' | 'halfway';

export interface OffsideReference {
  readonly defendingTeamId: EntityId;
  readonly secondLastDefenderId: EntityId | null;
  readonly source: OffsideReferenceSource;
  readonly x: number;
}

/**
 * Calculates the live offside reference for the team defending the supplied
 * goal. This is a reference line for officials and diagnostics; it does not
 * adjudicate whether an attacker is interfering with play.
 */
export function calculateOffsideReference(
  manifest: MatchManifest,
  actors: readonly MatchActorFrame[],
  ballX: number,
  defendingTeamId: EntityId,
): OffsideReference {
  const defendingTeam = defendingTeamId === manifest.home.teamId
    ? manifest.home
    : defendingTeamId === manifest.away.teamId
      ? manifest.away
      : null;
  if (!defendingTeam) throw new Error(`Unknown defending team ${String(defendingTeamId)}`);

  const participants = new Map(manifest.participants.map(participant => [participant.id, participant]));
  const defenders = actors
    .filter(actor => participants.get(actor.id)?.teamId === defendingTeamId)
    .map(actor => ({ id: actor.id, x: actor.position.x }))
    .sort((left, right) => defendingTeam.attacksPositiveXFirstHalf
      ? left.x - right.x
      : right.x - left.x);

  const secondLastDefender = defenders[1] ?? null;
  const halfway = manifest.pitch.lengthM / 2;
  if (!secondLastDefender) {
    return {
      defendingTeamId,
      secondLastDefenderId: null,
      source: 'halfway',
      x: halfway,
    };
  }

  const rawReference = defendingTeam.attacksPositiveXFirstHalf
    ? Math.min(ballX, secondLastDefender.x)
    : Math.max(ballX, secondLastDefender.x);
  const x = defendingTeam.attacksPositiveXFirstHalf
    ? Math.min(rawReference, halfway)
    : Math.max(rawReference, halfway);
  const source: OffsideReferenceSource = x === halfway && rawReference !== halfway
    ? 'halfway'
    : rawReference === ballX
      ? 'ball'
      : 'second_last_defender';

  return {
    defendingTeamId,
    secondLastDefenderId: secondLastDefender.id,
    source,
    x,
  };
}
