/**
 * Tactico Club type — matches the `teams` table in the real Turso DB.
 *
 * Note: We keep the `Club` name for backwards-compat with existing pages,
 * but the source of truth is the teams table.
 */
export interface Club {
  // ---------- IDENTITY ----------
  id: number;
  name: string;
  shortName: string;
  country: string;

  // ---------- LEAGUE ----------
  league: string;             // League name (denormalized)
  leagueId: number | null;
  leagueReputation?: number;

  // ---------- RATINGS ----------
  reputation: number;          // 1-100

  // ---------- FINANCES ----------
  finances: number;            // legacy alias for balance
  balance: number;
  wageBudget: number;
  transferBudget: number;
  marketValue: number;         // sum of squad market values

  // ---------- FACILITIES ----------
  stadium: string | null;
  stadiumCapacity: number;
  trainingFacilities: number;  // 1-5
  youthAcademy: number;        // 1-5
  coach: string | null;

  // ---------- VISUAL ----------
  homeKitColor: string;
  awayKitColor: string;
}

/**
 * League type — matches the `leagues` table.
 */
export interface League {
  id: number;
  name: string;
  shortName?: string | null;
  country: string | null;
  season: string | null;
  isCup: boolean;
  active: boolean;
  reputation: number;
  tier?: number;
}

/**
 * Default empty-state club (used by ClubSelector before fetch completes).
 */
export const EMPTY_CLUB: Club = {
  id: 0,
  name: '',
  shortName: '',
  country: '',
  league: '',
  leagueId: null,
  reputation: 50,
  finances: 0,
  balance: 0,
  wageBudget: 0,
  transferBudget: 0,
  marketValue: 0,
  stadium: null,
  stadiumCapacity: 0,
  trainingFacilities: 3,
  youthAcademy: 3,
  coach: null,
  homeKitColor: '#FFD700',
  awayKitColor: '#0A0A0F',
};

/**
 * @deprecated Static fallback clubs removed.
 * Use OFFLINE_CLUBS from @/lib/game-data instead — single source of truth.
 * This file only exports the Club type.
 */
