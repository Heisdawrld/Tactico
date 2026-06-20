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
 * @deprecated Static fallback clubs — DO NOT USE in new code.
 * Fetch from /api/clubs instead. This exists only for backwards-compat
 * with pages that haven't been migrated to use real DB data yet.
 *
 * Will be removed once all pages use the API.
 */
export const clubs: Club[] = [
  {
    id: 18, name: 'Arsenal', shortName: 'ARS', country: 'England',
    league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 92,
    finances: 200_000_000, balance: 200_000_000, wageBudget: 80_000_000, transferBudget: 60_000_000,
    marketValue: 1_100_000_000, stadium: 'Emirates Stadium', stadiumCapacity: 60704,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Mikel Arteta',
    homeKitColor: '#EF0107', awayKitColor: '#FFFFFF',
  },
  {
    id: 1, name: 'Liverpool FC', shortName: 'LIV', country: 'England',
    league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 93,
    finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000,
    marketValue: 1_000_000_000, stadium: 'Anfield', stadiumCapacity: 61276,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Arne Slot',
    homeKitColor: '#C8102E', awayKitColor: '#F6EB61',
  },
  {
    id: 2, name: 'Manchester City', shortName: 'MCI', country: 'England',
    league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 95,
    finances: 300_000_000, balance: 300_000_000, wageBudget: 120_000_000, transferBudget: 90_000_000,
    marketValue: 1_300_000_000, stadium: 'Etihad Stadium', stadiumCapacity: 53400,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Pep Guardiola',
    homeKitColor: '#6CABDD', awayKitColor: '#1C2C5B',
  },
  {
    id: 57, name: 'Real Madrid', shortName: 'RMA', country: 'Spain',
    league: 'La Liga', leagueId: 3, leagueReputation: 95, reputation: 96,
    finances: 280_000_000, balance: 280_000_000, wageBudget: 110_000_000, transferBudget: 80_000_000,
    marketValue: 1_400_000_000, stadium: 'Santiago Bernabéu', stadiumCapacity: 81044,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Carlo Ancelotti',
    homeKitColor: '#FFFFFF', awayKitColor: '#FEBE10',
  },
  {
    id: 503, name: 'Barcelona', shortName: 'BAR', country: 'Spain',
    league: 'La Liga', leagueId: 3, leagueReputation: 95, reputation: 92,
    finances: 150_000_000, balance: 150_000_000, wageBudget: 80_000_000, transferBudget: 40_000_000,
    marketValue: 1_000_000_000, stadium: 'Camp Nou', stadiumCapacity: 99354,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Hansi Flick',
    homeKitColor: '#A50044', awayKitColor: '#004D98',
  },
  {
    id: 5, name: 'Bayern Munich', shortName: 'BAY', country: 'Germany',
    league: 'Bundesliga', leagueId: 5, leagueReputation: 93, reputation: 94,
    finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000,
    marketValue: 1_000_000_000, stadium: 'Allianz Arena', stadiumCapacity: 75000,
    trainingFacilities: 5, youthAcademy: 5, coach: 'Vincent Kompany',
    homeKitColor: '#DC052D', awayKitColor: '#FFFFFF',
  },
  {
    id: 7, name: 'Paris Saint-Germain', shortName: 'PSG', country: 'France',
    league: 'Ligue 1', leagueId: 6, leagueReputation: 90, reputation: 91,
    finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 80_000_000,
    marketValue: 1_000_000_000, stadium: 'Parc des Princes', stadiumCapacity: 47929,
    trainingFacilities: 5, youthAcademy: 4, coach: 'Luis Enrique',
    homeKitColor: '#004170', awayKitColor: '#DA291C',
  },
];
