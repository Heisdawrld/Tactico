import type { EntityId, PlayerRole } from '../core/types';
import type {
  MatchManifest,
  MatchParticipant,
  MatchTeamManifest,
  MatchVector3,
} from '../protocol';

export interface FormationAssignment {
  readonly participant: MatchParticipant;
  readonly team: MatchTeamManifest;
  readonly basePosition: MatchVector3;
}

interface FormationSlot {
  readonly role: PlayerRole;
  /** Position for a team attacking toward +x on a 105 x 68 metre pitch. */
  readonly x: number;
  readonly y: number;
}

const FORMATION_SLOTS: Record<string, readonly FormationSlot[]> = {
  '4-3-3': [
    { role: 'GK', x: 6, y: 34 },
    { role: 'LB', x: 27, y: 8.5 },
    { role: 'LCB', x: 24, y: 25.5 },
    { role: 'RCB', x: 24, y: 42.5 },
    { role: 'RB', x: 27, y: 59.5 },
    { role: 'CDM', x: 36, y: 34 },
    { role: 'LCM', x: 42, y: 23 },
    { role: 'RCM', x: 42, y: 45 },
    { role: 'LW', x: 48.5, y: 9.5 },
    { role: 'ST', x: 52.15, y: 34 },
    { role: 'RW', x: 48.5, y: 58.5 },
  ],
  '4-2-3-1': [
    { role: 'GK', x: 6, y: 34 },
    { role: 'LB', x: 27, y: 8.5 },
    { role: 'LCB', x: 24, y: 25.5 },
    { role: 'RCB', x: 24, y: 42.5 },
    { role: 'RB', x: 27, y: 59.5 },
    { role: 'LDM', x: 34, y: 25 },
    { role: 'RDM', x: 34, y: 43 },
    { role: 'AML', x: 40, y: 9.5 },
    { role: 'CAM', x: 38, y: 34 },
    { role: 'AMR', x: 40, y: 58.5 },
    { role: 'ST', x: 43, y: 34 },
  ],
};

const ROLE_FAMILIES: readonly (readonly PlayerRole[])[] = [
  ['GK'],
  ['RB', 'RWB'],
  ['LB', 'LWB'],
  ['CB', 'RCB', 'LCB', 'SW'],
  ['CDM', 'RDM', 'LDM'],
  ['CM', 'RCM', 'LCM'],
  ['CAM', 'AMC'],
  ['RW', 'AMR'],
  ['LW', 'AML'],
  ['ST', 'CF', 'LS', 'RS'],
];

const isPlayer = (participant: MatchParticipant): boolean => participant.kind === 'player';

const rolesAreCompatible = (left: MatchParticipant['role'], right: PlayerRole): boolean =>
  ROLE_FAMILIES.some(family => family.includes(left as PlayerRole) && family.includes(right));

const transformSlot = (
  slot: FormationSlot,
  team: MatchTeamManifest,
  pitch: MatchManifest['pitch'],
): MatchVector3 => {
  const scaleX = pitch.lengthM / 105;
  const scaleY = pitch.widthM / 68;
  const positiveX = { x: slot.x * scaleX, y: slot.y * scaleY, z: 0 };

  if (team.attacksPositiveXFirstHalf) return positiveX;

  return {
    x: pitch.lengthM - positiveX.x,
    y: pitch.widthM - positiveX.y,
    z: 0,
  };
};

function assignTeam(
  manifest: MatchManifest,
  team: MatchTeamManifest,
): FormationAssignment[] {
  const participantsById = new Map(manifest.participants.map(participant => [participant.id, participant]));
  const players = team.startingPlayerIds.map(playerId => participantsById.get(playerId)).filter(
    (participant): participant is MatchParticipant =>
      participant !== undefined && isPlayer(participant) && participant.teamId === team.teamId,
  );

  if (players.length !== 11) {
    throw new Error(`Team ${String(team.teamId)} must provide exactly 11 on-field players`);
  }

  const slots = FORMATION_SLOTS[String(team.formation)];
  if (!slots) throw new Error(`Unsupported spatial formation ${String(team.formation)}`);
  const remaining = [...players];

  return slots.map(slot => {
    let index = remaining.findIndex(player => player.role === slot.role);
    if (index < 0) index = remaining.findIndex(player => rolesAreCompatible(player.role, slot.role));
    if (index < 0) index = remaining.findIndex(player => player.role !== 'GK');
    if (index < 0) index = 0;

    const [participant] = remaining.splice(index, 1);
    return {
      participant,
      team,
      basePosition: transformSlot(slot, team, manifest.pitch),
    };
  });
}

export function createFormationAssignments(
  manifest: MatchManifest,
): ReadonlyMap<EntityId, FormationAssignment> {
  const assignments = [
    ...assignTeam(manifest, manifest.home),
    ...assignTeam(manifest, manifest.away),
  ];

  return new Map(assignments.map(assignment => [assignment.participant.id, assignment]));
}
