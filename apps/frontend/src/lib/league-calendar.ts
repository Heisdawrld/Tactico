/** Circle-method double round robin. A null participant represents a bye. */
export interface LeaguePairing { homeClubId: number; awayClubId: number; week: number }

export function createRoundRobin(clubIds: readonly number[]): LeaguePairing[] {
  if (new Set(clubIds).size !== clubIds.length) throw new Error('League club ids must be unique');
  if (clubIds.some(id => !Number.isSafeInteger(id))) throw new Error('League club ids must be integers');
  if (clubIds.length < 2) return [];
  const rotation: (number | null)[] = [...clubIds].sort((a, b) => a - b);
  if (rotation.length % 2) rotation.push(null);
  const rounds = rotation.length - 1;
  const firstLeg: LeaguePairing[] = [];
  for (let round = 0; round < rounds; round++) {
    for (let pair = 0; pair < rotation.length / 2; pair++) {
      const a = rotation[pair], b = rotation[rotation.length - 1 - pair];
      if (a === null || b === null) continue;
      const swap = (round + pair) % 2 === 1;
      firstLeg.push({ homeClubId: swap ? b : a, awayClubId: swap ? a : b, week: round + 1 });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }
  return [...firstLeg, ...firstLeg.map(f => ({ homeClubId: f.awayClubId, awayClubId: f.homeClubId, week: f.week + rounds }))];
}
