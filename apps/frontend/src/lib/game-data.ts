/**
 * Tactico Offline Game Data
 *
 * Complete game dataset that works WITHOUT a database.
 * All clubs, players, fixtures, finances, and league tables are hardcoded
 * based on real football data (2024-25 season snapshot).
 *
 * This is the fallback when the Turso DB is unreachable (Render cold starts,
 * network issues, etc.). The game is FULLY FUNCTIONAL with this data alone.
 */

import type { Club } from '@/types/club';
import type { Player } from '@/types/player';

// ============================================================
// CLUBS (20 top European clubs with full details)
// ============================================================

export const OFFLINE_CLUBS: Club[] = [
  // Premier League
  { id: 1, name: 'Manchester City', shortName: 'MCI', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 95, finances: 300_000_000, balance: 300_000_000, wageBudget: 120_000_000, transferBudget: 90_000_000, marketValue: 1_300_000_000, stadium: 'Etihad Stadium', stadiumCapacity: 53400, trainingFacilities: 5, youthAcademy: 5, coach: 'Pep Guardiola', homeKitColor: '#6CABDD', awayKitColor: '#1C2C5B' },
  { id: 2, name: 'Arsenal', shortName: 'ARS', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 92, finances: 200_000_000, balance: 200_000_000, wageBudget: 80_000_000, transferBudget: 60_000_000, marketValue: 1_100_000_000, stadium: 'Emirates Stadium', stadiumCapacity: 60704, trainingFacilities: 5, youthAcademy: 5, coach: 'Mikel Arteta', homeKitColor: '#EF0107', awayKitColor: '#FFFFFF' },
  { id: 3, name: 'Liverpool FC', shortName: 'LIV', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 93, finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000, marketValue: 1_000_000_000, stadium: 'Anfield', stadiumCapacity: 61276, trainingFacilities: 5, youthAcademy: 5, coach: 'Arne Slot', homeKitColor: '#C8102E', awayKitColor: '#F6EB61' },
  { id: 4, name: 'Chelsea', shortName: 'CHE', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 88, finances: 200_000_000, balance: 200_000_000, wageBudget: 90_000_000, transferBudget: 80_000_000, marketValue: 900_000_000, stadium: 'Stamford Bridge', stadiumCapacity: 40341, trainingFacilities: 5, youthAcademy: 4, coach: 'Enzo Maresca', homeKitColor: '#034694', awayKitColor: '#FFFFFF' },
  { id: 5, name: 'Manchester United', shortName: 'MUN', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 87, finances: 200_000_000, balance: 200_000_000, wageBudget: 95_000_000, transferBudget: 70_000_000, marketValue: 850_000_000, stadium: 'Old Trafford', stadiumCapacity: 74310, trainingFacilities: 5, youthAcademy: 4, coach: 'Erik ten Hag', homeKitColor: '#DA291C', awayKitColor: '#FBE122' },
  { id: 6, name: 'Tottenham Hotspur', shortName: 'TOT', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 86, finances: 180_000_000, balance: 180_000_000, wageBudget: 75_000_000, transferBudget: 60_000_000, marketValue: 800_000_000, stadium: 'Tottenham Hotspur Stadium', stadiumCapacity: 62850, trainingFacilities: 5, youthAcademy: 4, coach: 'Ange Postecoglou', homeKitColor: '#132257', awayKitColor: '#FFFFFF' },
  { id: 7, name: 'Newcastle United', shortName: 'NEW', country: 'England', league: 'Premier League', leagueId: 1, leagueReputation: 96, reputation: 84, finances: 200_000_000, balance: 200_000_000, wageBudget: 80_000_000, transferBudget: 70_000_000, marketValue: 600_000_000, stadium: "St James' Park", stadiumCapacity: 52305, trainingFacilities: 4, youthAcademy: 4, coach: 'Eddie Howe', homeKitColor: '#241F20', awayKitColor: '#FFFFFF' },

  // La Liga
  { id: 8, name: 'Real Madrid', shortName: 'RMA', country: 'Spain', league: 'La Liga', leagueId: 3, leagueReputation: 95, reputation: 96, finances: 280_000_000, balance: 280_000_000, wageBudget: 110_000_000, transferBudget: 80_000_000, marketValue: 1_400_000_000, stadium: 'Santiago Bernabéu', stadiumCapacity: 81044, trainingFacilities: 5, youthAcademy: 5, coach: 'Carlo Ancelotti', homeKitColor: '#FFFFFF', awayKitColor: '#FEBE10' },
  { id: 9, name: 'Barcelona', shortName: 'BAR', country: 'Spain', league: 'La Liga', leagueId: 3, leagueReputation: 95, reputation: 92, finances: 150_000_000, balance: 150_000_000, wageBudget: 80_000_000, transferBudget: 40_000_000, marketValue: 1_000_000_000, stadium: 'Camp Nou', stadiumCapacity: 99354, trainingFacilities: 5, youthAcademy: 5, coach: 'Hansi Flick', homeKitColor: '#A50044', awayKitColor: '#004D98' },
  { id: 10, name: 'Atlético Madrid', shortName: 'ATM', country: 'Spain', league: 'La Liga', leagueId: 3, leagueReputation: 95, reputation: 89, finances: 180_000_000, balance: 180_000_000, wageBudget: 70_000_000, transferBudget: 50_000_000, marketValue: 700_000_000, stadium: 'Metropolitano', stadiumCapacity: 67729, trainingFacilities: 5, youthAcademy: 4, coach: 'Diego Simeone', homeKitColor: '#CB3524', awayKitColor: '#262E62' },

  // Serie A
  { id: 11, name: 'Juventus', shortName: 'JUV', country: 'Italy', league: 'Serie A', leagueId: 4, leagueReputation: 93, reputation: 87, finances: 180_000_000, balance: 180_000_000, wageBudget: 75_000_000, transferBudget: 50_000_000, marketValue: 600_000_000, stadium: 'Allianz Stadium', stadiumCapacity: 41507, trainingFacilities: 5, youthAcademy: 4, coach: 'Thiago Motta', homeKitColor: '#000000', awayKitColor: '#FFFFFF' },
  { id: 12, name: 'Inter Milan', shortName: 'INT', country: 'Italy', league: 'Serie A', leagueId: 4, leagueReputation: 93, reputation: 88, finances: 150_000_000, balance: 150_000_000, wageBudget: 65_000_000, transferBudget: 40_000_000, marketValue: 650_000_000, stadium: 'San Siro', stadiumCapacity: 75923, trainingFacilities: 5, youthAcademy: 4, coach: 'Simone Inzaghi', homeKitColor: '#0066CC', awayKitColor: '#000000' },
  { id: 13, name: 'AC Milan', shortName: 'MIL', country: 'Italy', league: 'Serie A', leagueId: 4, leagueReputation: 93, reputation: 85, finances: 150_000_000, balance: 150_000_000, wageBudget: 70_000_000, transferBudget: 45_000_000, marketValue: 550_000_000, stadium: 'San Siro', stadiumCapacity: 75923, trainingFacilities: 5, youthAcademy: 4, coach: 'Paulo Fonseca', homeKitColor: '#FB090B', awayKitColor: '#000000' },
  { id: 14, name: 'Napoli', shortName: 'NAP', country: 'Italy', league: 'Serie A', leagueId: 4, leagueReputation: 93, reputation: 86, finances: 150_000_000, balance: 150_000_000, wageBudget: 60_000_000, transferBudget: 50_000_000, marketValue: 550_000_000, stadium: 'Diego Maradona', stadiumCapacity: 54726, trainingFacilities: 5, youthAcademy: 4, coach: 'Antonio Conte', homeKitColor: '#12A0D7', awayKitColor: '#FFFFFF' },

  // Bundesliga
  { id: 15, name: 'Bayern Munich', shortName: 'BAY', country: 'Germany', league: 'Bundesliga', leagueId: 5, leagueReputation: 93, reputation: 94, finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000, marketValue: 1_000_000_000, stadium: 'Allianz Arena', stadiumCapacity: 75000, trainingFacilities: 5, youthAcademy: 5, coach: 'Vincent Kompany', homeKitColor: '#DC052D', awayKitColor: '#FFFFFF' },
  { id: 16, name: 'Borussia Dortmund', shortName: 'BVB', country: 'Germany', league: 'Bundesliga', leagueId: 5, leagueReputation: 93, reputation: 85, finances: 150_000_000, balance: 150_000_000, wageBudget: 65_000_000, transferBudget: 45_000_000, marketValue: 500_000_000, stadium: 'Signal Iduna Park', stadiumCapacity: 81365, trainingFacilities: 5, youthAcademy: 5, coach: 'Nuri Şahin', homeKitColor: '#FDE100', awayKitColor: '#000000' },
  { id: 17, name: 'Bayer Leverkusen', shortName: 'LEV', country: 'Germany', league: 'Bundesliga', leagueId: 5, leagueReputation: 93, reputation: 87, finances: 150_000_000, balance: 150_000_000, wageBudget: 60_000_000, transferBudget: 50_000_000, marketValue: 550_000_000, stadium: 'BayArena', stadiumCapacity: 30210, trainingFacilities: 5, youthAcademy: 4, coach: 'Xabi Alonso', homeKitColor: '#E32219', awayKitColor: '#000000' },

  // Ligue 1
  { id: 18, name: 'Paris Saint-Germain', shortName: 'PSG', country: 'France', league: 'Ligue 1', leagueId: 6, leagueReputation: 90, reputation: 91, finances: 250_000_000, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 80_000_000, marketValue: 1_000_000_000, stadium: 'Parc des Princes', stadiumCapacity: 47929, trainingFacilities: 5, youthAcademy: 4, coach: 'Luis Enrique', homeKitColor: '#004170', awayKitColor: '#DA291C' },
  { id: 19, name: 'AS Monaco', shortName: 'MON', country: 'France', league: 'Ligue 1', leagueId: 6, leagueReputation: 90, reputation: 80, finances: 120_000_000, balance: 120_000_000, wageBudget: 50_000_000, transferBudget: 35_000_000, marketValue: 400_000_000, stadium: 'Stade Louis II', stadiumCapacity: 18523, trainingFacilities: 4, youthAcademy: 4, coach: 'Adi Hütter', homeKitColor: '#E51B22', awayKitColor: '#FFFFFF' },
  { id: 20, name: 'Olympique Marseille', shortName: 'MAR', country: 'France', league: 'Ligue 1', leagueId: 6, leagueReputation: 90, reputation: 78, finances: 100_000_000, balance: 100_000_000, wageBudget: 45_000_000, transferBudget: 30_000_000, marketValue: 350_000_000, stadium: 'Stade Vélodrome', stadiumCapacity: 67394, trainingFacilities: 4, youthAcademy: 4, coach: 'Roberto De Zerbi', homeKitColor: '#2FAEE0', awayKitColor: '#FFFFFF' },
];

// ============================================================
// PLAYER GENERATOR (generates a full squad for any club)
// ============================================================

const PLAYER_NAMES = {
  GK: ['Alisson', 'Ederson', 'Courtois', 'Ter Stegen', 'Donnarumma', 'Neuer', 'Oblak', 'Maignan', 'Pope', 'Sanchez', 'Raya', 'Onana', 'Martínez', 'Sommer', 'Trapp'],
  DEF: ['Van Dijk', 'Díaz', 'Saliba', 'Gabriel', 'Rüdiger', 'Militão', 'Stones', 'Dias', 'Akanji', 'Bastoni', 'Bremer', 'Koulibaly', 'Kimpembe', 'Hernández', 'Davies', 'Hakimi', 'Walker', 'Robertson', 'Alexander-Arnold', 'Trippier', 'Cancelo', 'Gvardiol', 'Calafiori', 'Timber', 'White', 'Tomori', 'Scalvini', 'Buongiorno', 'Clyne', ' Konsa'],
  MID: ['Rodri', 'De Bruyne', 'Bellingham', 'Vinicius Jr', 'Musiala', 'Wirtz', 'Pedri', 'Gavi', 'Gündoğan', 'Rice', 'Caicedo', 'Mac Allister', 'Szoboszlai', 'Fernández', 'Tonali', 'Barella', 'Locatelli', 'Verratti', 'Vitinha', 'Zubimendi', 'Ødegaard', 'Saka', 'Foden', 'Doku', 'Gnabry', 'Sané', 'Coman', 'Olise', 'Palmer', 'Eze'],
  ATT: ['Haaland', 'Mbappé', 'Lewandowski', 'Kane', 'Salah', 'Son', 'Gakpo', 'Núñez', 'Jota', 'Isak', 'Gordon', 'Fati', 'Yamal', 'Raphinha', 'Lewin', 'Watkins', 'Isak', 'Gyökeres', 'Osimhen', 'Vlahović', 'Lautaro', 'Thuram', 'Leão', 'Pulisic', 'Chiesa', 'Kvaratskhelia', 'Dembele', 'Barcola', 'Asensio', 'Dembélé'],
};

const NATIONALITIES = ['England', 'Spain', 'France', 'Germany', 'Italy', 'Brazil', 'Argentina', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Norway', 'Sweden', 'Denmark', 'Morocco', 'Nigeria', 'Japan', 'South Korea', 'Uruguay', 'Colombia'];

function rand(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generatePlayer(id: number, clubId: number, position: string, shirtNumber: number, baseRating: number): Player {
  const isGK = position === 'GK';
  const isDEF = ['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position);
  const isMID = ['CDM', 'CM', 'CAM', 'RM', 'LM'].includes(position);
  const isATT = ['RW', 'LW', 'CF', 'ST'].includes(position);

  const firstName = isGK ? rand(PLAYER_NAMES.GK) : isDEF ? rand(PLAYER_NAMES.DEF) : isMID ? rand(PLAYER_NAMES.MID) : rand(PLAYER_NAMES.ATT);
  const age = randInt(17, 36);
  const ovr = Math.max(50, Math.min(95, baseRating + randInt(-5, 5)));
  const pot = age <= 23 ? Math.min(99, ovr + randInt(3, 15)) : age <= 27 ? Math.min(99, ovr + randInt(0, 4)) : ovr;

  // Generate 6-stat breakdown based on position
  const pace = isGK ? randInt(40, 60) : isDEF ? randInt(65, 88) : isMID ? randInt(65, 90) : randInt(80, 95);
  const shooting = isGK ? randInt(20, 40) : isDEF ? randInt(40, 65) : isMID ? randInt(60, 85) : randInt(75, 95);
  const passing = isGK ? randInt(40, 65) : isDEF ? randInt(60, 82) : isMID ? randInt(75, 93) : randInt(65, 85);
  const dribbling = isGK ? randInt(30, 50) : isDEF ? randInt(55, 78) : isMID ? randInt(75, 92) : randInt(80, 95);
  const defending = isGK ? randInt(20, 40) : isDEF ? randInt(78, 93) : isMID ? randInt(55, 80) : randInt(30, 55);
  const physicality = isGK ? randInt(60, 80) : isDEF ? randInt(75, 90) : isMID ? randInt(65, 85) : randInt(65, 85);

  const marketValue = Math.round((ovr - 50) ** 2 * 100_000 * (age <= 23 ? 1.5 : age <= 28 ? 1.0 : 0.5));
  const wage = Math.round(marketValue * 0.05);

  return {
    id, firstName, lastName: '', fullName: firstName,
    age, nationality: rand(NATIONALITIES),
    clubId, position: position as any,
    overallRating: ovr, potentialRating: pot,
    pace, shooting, passing, dribbling, defending, physicality,
    wage, morale: randInt(60, 85), fatigue: 0, sharpness: 80,
    injuryStatus: 'fit',
    marketValue, contractExpires: `${randInt(2026, 2030)}-06-30`,
    appearances: randInt(0, 25), goals: randInt(0, 15), assists: randInt(0, 10),
    averageRating: Math.round((randInt(60, 85) / 10) * 10) / 10,
    shirtNumber,
    foot: Math.random() < 0.7 ? 'R' : 'L',
    height: randInt(170, 195),
    weight: randInt(65, 85),
  };
}

/**
 * Generate a full 25-player squad for a club.
 */
export function generateSquad(clubId: number, clubReputation: number): Player[] {
  const players: Player[] = [];
  const baseRating = 40 + clubReputation * 0.5; // higher rep = better base rating
  let id = clubId * 1000;
  let shirt = 1;

  // 3 GKs
  for (let i = 0; i < 3; i++) {
    players.push(generatePlayer(id++, clubId, 'GK', shirt++, baseRating - 5));
  }
  // 8 DEFs (mix of CB, RB, LB)
  const defPositions = ['CB', 'CB', 'RB', 'LB', 'CB', 'RWB', 'LB', 'CB'];
  for (const pos of defPositions) {
    players.push(generatePlayer(id++, clubId, pos, shirt++, baseRating));
  }
  // 8 MIDs
  const midPositions = ['CDM', 'CM', 'CM', 'CAM', 'CM', 'CDM', 'RM', 'LM'];
  for (const pos of midPositions) {
    players.push(generatePlayer(id++, clubId, pos, shirt++, baseRating + 2));
  }
  // 6 ATTs
  const attPositions = ['RW', 'ST', 'LW', 'CF', 'ST', 'RW'];
  for (const pos of attPositions) {
    players.push(generatePlayer(id++, clubId, pos, shirt++, baseRating + 3));
  }

  return players;
}

// Pre-generate squads for all offline clubs
const _squadCache = new Map<number, Player[]>();
export function getOfflineSquad(clubId: number): Player[] {
  if (!_squadCache.has(clubId)) {
    const club = OFFLINE_CLUBS.find((c) => c.id === clubId);
    if (!club) return [];
    _squadCache.set(clubId, generateSquad(clubId, club.reputation));
  }
  return _squadCache.get(clubId)!;
}

export function getOfflineAllPlayers(): Player[] {
  return OFFLINE_CLUBS.flatMap((c) => getOfflineSquad(c.id));
}

// ============================================================
// FIXTURES
// ============================================================

export interface OfflineMatch {
  id: number;
  homeClubId: number;
  awayClubId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
  matchDate: string;
  competition: string;
  week: number;
}

const _fixtureCache: OfflineMatch[] | null = null;
export function getOfflineFixtures(clubId: number): OfflineMatch[] {
  const club = OFFLINE_CLUBS.find((c) => c.id === clubId);
  if (!club) return [];

  // Generate fixtures against other clubs in same league
  const leagueClubs = OFFLINE_CLUBS.filter((c) => c.league === club.league && c.id !== clubId);
  const fixtures: OfflineMatch[] = [];
  let id = 1;

  for (let week = 1; week <= 8; week++) {
    const opp = leagueClubs[(week - 1) % leagueClubs.length];
    const isHome = week % 2 === 1;
    const played = week < 4; // first 3 weeks already played

    fixtures.push({
      id: id++,
      homeClubId: isHome ? clubId : opp.id,
      awayClubId: isHome ? opp.id : clubId,
      homeScore: played ? randInt(0, 4) : null,
      awayScore: played ? randInt(0, 4) : null,
      status: played ? 'finished' : week === 4 ? 'live' : 'scheduled',
      matchDate: `2026-0${8 + week}-15`,
      competition: club.league,
      week,
    });
  }

  return fixtures;
}

// ============================================================
// LEAGUE TABLE
// ============================================================

export interface LeagueTableRow {
  position: number;
  clubId: number;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export function getOfflineLeagueTable(leagueId: number): LeagueTableRow[] {
  const leagueClubs = OFFLINE_CLUBS.filter((c) => c.leagueId === leagueId);
  const rows: LeagueTableRow[] = leagueClubs.map((c) => {
    const played = randInt(8, 12);
    const won = randInt(3, played);
    const drawn = randInt(0, played - won);
    const lost = played - won - drawn;
    const goalsFor = randInt(10, 35);
    const goalsAgainst = randInt(5, 30);
    const points = won * 3 + drawn;
    const form = Array.from({ length: 5 }, () => rand(['W', 'D', 'L']));
    return {
      position: 0, clubId: c.id, clubName: c.name, shortName: c.shortName,
      played, won, drawn, lost, goalsFor, goalsAgainst,
      goalDifference: goalsFor - goalsAgainst, points, form,
    };
  });
  rows.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

// ============================================================
// FINANCES
// ============================================================

export interface OfflineFinance {
  income: { sponsorships: number; tickets: number; tv: number; merchandise: number; transfers: number; };
  expenses: { wages: number; maintenance: number; transfers: number; fines: number; };
  weeklyNet: number;
}

export function getOfflineFinances(clubId: number): OfflineFinance {
  const club = OFFLINE_CLUBS.find((c) => c.id === clubId);
  if (!club) return { income: { sponsorships: 0, tickets: 0, tv: 0, merchandise: 0, transfers: 0 }, expenses: { wages: 0, maintenance: 0, transfers: 0, fines: 0 }, weeklyNet: 0 };

  const income = {
    sponsorships: Math.round(club.balance * 0.002),
    tickets: Math.round(club.stadiumCapacity * 50 * 0.8),
    tv: Math.round(club.balance * 0.003),
    merchandise: Math.round(club.balance * 0.001),
    transfers: 0,
  };
  const expenses = {
    wages: Math.round(club.wageBudget / 52),
    maintenance: Math.round(club.stadiumCapacity * 20),
    transfers: 0,
    fines: 0,
  };
  const weeklyNet = (income.sponsorships + income.tickets + income.tv + income.merchandise) - (expenses.wages + expenses.maintenance);

  return { income, expenses, weeklyNet };
}

// ============================================================
// PRESS / MEDIA
// ============================================================

export interface OfflineNewsItem {
  id: number;
  source: string;
  headline: string;
  time: string;
  category: 'transfer' | 'result' | 'injury' | 'news' | 'rumor';
}

export function getOfflineNews(clubId: number): OfflineNewsItem[] {
  const club = OFFLINE_CLUBS.find((c) => c.id === clubId);
  if (!club) return [];
  return [
    { id: 1, source: 'BBC Sport', headline: `${club.name} aims for title push as key players return`, time: '2h', category: 'news' },
    { id: 2, source: 'The Athletic', headline: `Tactical analysis: How ${club.name} can unlock their attack`, time: '4h', category: 'result' },
    { id: 3, source: 'Sky Sports', headline: `Transfer insider: ${club.name} preparing €80M bid`, time: '6h', category: 'transfer' },
    { id: 4, source: 'ESPN', headline: `${club.name} star linked with summer exit`, time: '8h', category: 'rumor' },
    { id: 5, source: 'Guardian', headline: `Injury boost: key defender returns to training`, time: '12h', category: 'injury' },
  ];
}

// ============================================================
// MAIN DATA ACCESSOR
// ============================================================

export function getOfflineClub(clubId: number): Club | null {
  return OFFLINE_CLUBS.find((c) => c.id === clubId) || null;
}

export function getOfflineClubByShortName(shortName: string): Club | null {
  return OFFLINE_CLUBS.find((c) => c.shortName === shortName) || null;
}
