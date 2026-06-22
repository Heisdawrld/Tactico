/**
 * Shared formation definitions for tactics UI and match engine.
 * UI coords: x = width (0–100), y = depth (0 = attack, 100 = GK).
 * Match engine converts these to pitch pixels via `toPitchCoords`.
 */

export interface FormationSlot {
  x: number;
  y: number;
  pos: string;
}

export type FormationId = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2';

export const FORMATIONS: Record<FormationId, FormationSlot[]> = {
  '4-3-3': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 25, y: 55, pos: 'CM' }, { x: 50, y: 50, pos: 'CDM' }, { x: 75, y: 55, pos: 'CM' },
    { x: 20, y: 25, pos: 'LW' }, { x: 50, y: 18, pos: 'ST' }, { x: 80, y: 25, pos: 'RW' },
  ],
  '4-4-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 15, y: 50, pos: 'LM' }, { x: 38, y: 52, pos: 'CM' }, { x: 62, y: 52, pos: 'CM' }, { x: 85, y: 50, pos: 'RM' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
  '4-2-3-1': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 15, y: 75, pos: 'LB' }, { x: 38, y: 78, pos: 'CB' }, { x: 62, y: 78, pos: 'CB' }, { x: 85, y: 75, pos: 'RB' },
    { x: 38, y: 60, pos: 'CDM' }, { x: 62, y: 60, pos: 'CDM' },
    { x: 20, y: 35, pos: 'LM' }, { x: 50, y: 32, pos: 'CAM' }, { x: 80, y: 35, pos: 'RM' },
    { x: 50, y: 15, pos: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 25, y: 78, pos: 'CB' }, { x: 50, y: 80, pos: 'CB' }, { x: 75, y: 78, pos: 'CB' },
    { x: 10, y: 55, pos: 'LWB' }, { x: 35, y: 55, pos: 'CM' }, { x: 50, y: 50, pos: 'CDM' }, { x: 65, y: 55, pos: 'CM' }, { x: 90, y: 55, pos: 'RWB' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
  '5-3-2': [
    { x: 50, y: 92, pos: 'GK' },
    { x: 10, y: 72, pos: 'LWB' }, { x: 30, y: 78, pos: 'CB' }, { x: 50, y: 80, pos: 'CB' }, { x: 70, y: 78, pos: 'CB' }, { x: 90, y: 72, pos: 'RWB' },
    { x: 30, y: 50, pos: 'CM' }, { x: 50, y: 48, pos: 'CDM' }, { x: 70, y: 50, pos: 'CM' },
    { x: 35, y: 22, pos: 'ST' }, { x: 65, y: 22, pos: 'ST' },
  ],
};

export const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];

export type PlayerRole = 'GK' | 'DEF' | 'MID' | 'ATT';

export function getPlayerRole(pos: string): PlayerRole {
  if (pos === 'GK') return 'GK';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'RM', 'LM'].includes(pos)) return 'MID';
  return 'ATT';
}

export interface MatchRoleConfig {
  pos: string;
  x: number;
  y: number;
  role: PlayerRole;
  stayBackWeight: number;
  pressWeight: number;
}

const PITCH_W = 1050;
const PITCH_H = 680;
const GK_X_HOME = 80;
const ATT_X_HOME = 700;

/** Convert UI formation slot to match-engine pitch coordinates (home side, attacking right). */
export function slotToPitchCoords(slot: FormationSlot): { x: number; y: number } {
  const depth = (100 - slot.y) / 100;
  const x = GK_X_HOME + depth * (ATT_X_HOME - GK_X_HOME);
  const y = (slot.x / 100) * PITCH_H;
  return { x, y };
}

export function buildMatchFormation(
  formationId: FormationId,
  pressing: number,
  defensiveLine: number,
  style: string,
): MatchRoleConfig[] {
  const slots = FORMATIONS[formationId] ?? FORMATIONS['4-3-3'];
  const pressBase = pressing / 100;
  const lineBase = defensiveLine / 100;

  let pressMod = 0;
  let stayMod = 0;
  if (style === 'gegenpress') pressMod = 0.2;
  if (style === 'defensive') stayMod = 0.25;
  if (style === 'counter') stayMod = 0.1;
  if (style === 'possession') pressMod = -0.05;

  return slots.map((slot) => {
    const role = getPlayerRole(slot.pos);
    const { x, y } = slotToPitchCoords(slot);
    const stayBackWeight = Math.min(1, Math.max(0.05,
      role === 'GK' ? 1.0 :
      role === 'DEF' ? 0.75 + lineBase * 0.15 + stayMod :
      role === 'MID' ? 0.35 + lineBase * 0.1 :
      0.1 + stayMod * 0.5,
    ));
    const pressWeight = Math.min(1, Math.max(0,
      role === 'GK' ? 0 :
      role === 'DEF' ? 0.2 + pressBase * 0.3 + pressMod :
      role === 'MID' ? 0.4 + pressBase * 0.4 + pressMod :
      0.3 + pressBase * 0.2,
    ));
    return { pos: slot.pos, x, y, role, stayBackWeight, pressWeight };
  });
}

export function mirrorFormationForAway(home: MatchRoleConfig[]): MatchRoleConfig[] {
  return home.map((p) => ({
    ...p,
    x: PITCH_W - p.x,
  }));
}
