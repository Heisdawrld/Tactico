/**
 * Pure career logic — standings, fixtures, match simulation.
 * No React/Zustand dependencies; consumed by store.ts.
 */

import type { Player } from '@/types/player';
import type { Club } from '@/types/club';
import {
  OFFLINE_CLUBS,
  getOfflineClub,
  getOfflineSquad,
  type LeagueTableRow,
} from '@/lib/game-data';

// ============================================================
// TYPES
// ============================================================

export type FixtureStatus = 'scheduled' | 'live' | 'finished';

export interface CareerFixture {
  id: number;
  homeClubId: number;
  awayClubId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  matchDate: string;
  competition: string;
  week: number;
}

export interface LeagueStanding {
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
  form: ('W' | 'D' | 'L')[];
}

export interface MatchHistoryEntry {
  id: number;
  fixtureId: number;
  homeClubId: number;
  awayClubId: number;
  homeScore: number;
  awayScore: number;
  week: number;
  competition: string;
  playedAt: string;
  userParticipated: boolean;
}

export interface PressEvent {
  id: number;
  headline: string;
  time: string;
  category: 'transfer' | 'result' | 'injury' | 'news' | 'rumor';
}

export type TacticalStyle = 'possession' | 'gegenpress' | 'counter' | 'defensive';

export interface TacticsState {
  formation: string;
  style: TacticalStyle;
  pressing: number;
  defensiveLine: number;
  tempo: number;
}

export const DEFAULT_TACTICS: TacticsState = {
  formation: '4-3-3',
  style: 'possession',
  pressing: 60,
  defensiveLine: 50,
  tempo: 55,
};

// ============================================================
// INITIALIZATION
// ============================================================

export function createFreshStandings(leagueId: number): LeagueStanding[] {
  const clubs = OFFLINE_CLUBS.filter((c) => c.leagueId === leagueId);
  return clubs.map((c) => ({
    clubId: c.id,
    clubName: c.name,
    shortName: c.shortName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [] as ('W' | 'D' | 'L')[],
  }));
}

export function createUserFixtures(clubId: number): CareerFixture[] {
  const club = getOfflineClub(clubId);
  if (!club) return [];

  const leagueClubs = OFFLINE_CLUBS.filter((c) => c.league === club.league && c.id !== clubId);
  const fixtures: CareerFixture[] = [];
  let id = 1;
  const seasonStart = new Date('2026-08-16T12:00:00Z');

  for (let week = 1; week <= 8; week++) {
    const opp = leagueClubs[(week - 1) % leagueClubs.length];
    const isHome = week % 2 === 1;
    const matchDate = new Date(seasonStart);
    matchDate.setUTCDate(seasonStart.getUTCDate() + (week - 1) * 7);
    fixtures.push({
      id: id++,
      homeClubId: isHome ? clubId : opp.id,
      awayClubId: isHome ? opp.id : clubId,
      homeScore: null,
      awayScore: null,
      status: 'scheduled',
      matchDate: matchDate.toISOString().slice(0, 10),
      competition: club.league,
      week,
    });
  }
  return fixtures;
}

export function initializeAllSquads(): Record<number, Player[]> {
  const squads: Record<number, Player[]> = {};
  OFFLINE_CLUBS.forEach((c) => {
    squads[c.id] = getOfflineSquad(c.id).map((p) => ({ ...p }));
  });
  return squads;
}

export function initializeClubBudgets(): Record<number, number> {
  const budgets: Record<number, number> = {};
  OFFLINE_CLUBS.forEach((c) => {
    budgets[c.id] = c.transferBudget;
  });
  return budgets;
}

// ============================================================
// STANDINGS
// ============================================================

export function sortStandings(rows: LeagueStanding[]): LeagueStanding[] {
  const sorted = [...rows].sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor,
  );
  return sorted;
}

export function applyResultToStandings(
  standings: LeagueStanding[],
  homeClubId: number,
  awayClubId: number,
  homeScore: number,
  awayScore: number,
): LeagueStanding[] {
  const updated = standings.map((r) => ({ ...r, form: [...r.form] }));

  const home = updated.find((r) => r.clubId === homeClubId);
  const away = updated.find((r) => r.clubId === awayClubId);
  if (!home || !away) return standings;

  home.played += 1;
  away.played += 1;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
    home.form.push('W');
    away.form.push('L');
  } else if (homeScore < awayScore) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
    home.form.push('L');
    away.form.push('W');
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
    home.form.push('D');
    away.form.push('D');
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
  home.form = home.form.slice(-5);
  away.form = away.form.slice(-5);

  return sortStandings(updated);
}

// ============================================================
// MATCH SIMULATION (background)
// ============================================================

function clubStrength(club: Club): number {
  return club.reputation + (club.leagueReputation ?? 0) * 0.3;
}

export function simulateMatchScore(homeClub: Club, awayClub: Club): { home: number; away: number } {
  const homeStr = clubStrength(homeClub) + 5; // home advantage
  const awayStr = clubStrength(awayClub);
  const total = homeStr + awayStr;
  const homeWinProb = homeStr / total;

  const roll = Math.random();
  let home: number;
  let away: number;

  if (roll < homeWinProb * 0.55) {
    home = randInt(1, 3);
    away = randInt(0, home - 1);
  } else if (roll < homeWinProb * 0.55 + 0.25) {
    home = randInt(0, 2);
    away = home;
  } else {
    away = randInt(1, 3);
    home = randInt(0, away - 1);
  }
  return { home, away };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface BackgroundMatch {
  homeClubId: number;
  awayClubId: number;
  homeScore: number;
  awayScore: number;
}

/** Simulate league matches for other clubs in the current week. */
export function simulateBackgroundMatches(
  leagueId: number,
  week: number,
  userClubId: number,
  userFixtures: CareerFixture[],
): BackgroundMatch[] {
  const clubs = OFFLINE_CLUBS.filter((c) => c.leagueId === leagueId);
  const results: BackgroundMatch[] = [];

  const userFixture = userFixtures.find(
    (f) => f.week === week && (f.homeClubId === userClubId || f.awayClubId === userClubId),
  );
  const userOpponentId = userFixture
    ? (userFixture.homeClubId === userClubId ? userFixture.awayClubId : userFixture.homeClubId)
    : null;

  const available = clubs.filter((c) => c.id !== userClubId && c.id !== userOpponentId);
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    if (!home || !away) continue;
    const scores = simulateMatchScore(home, away);
    results.push({
      homeClubId: home.id,
      awayClubId: away.id,
      homeScore: scores.home,
      awayScore: scores.away,
    });
  }
  return results;
}

// ============================================================
// FIXTURE HELPERS
// ============================================================

export function getNextUserFixture(fixtures: CareerFixture[], clubId: number): CareerFixture | null {
  return fixtures.find(
    (f) => f.status !== 'finished' && (f.homeClubId === clubId || f.awayClubId === clubId),
  ) ?? null;
}

export function markFixturePlayed(
  fixtures: CareerFixture[],
  fixtureId: number,
  homeScore: number,
  awayScore: number,
): CareerFixture[] {
  return fixtures.map((f) => {
    if (f.id !== fixtureId) return f;
    return { ...f, homeScore, awayScore, status: 'finished' as FixtureStatus };
  });
}

export function standingToTableRow(standing: LeagueStanding, position: number): LeagueTableRow {
  return {
    position,
    clubId: standing.clubId,
    clubName: standing.clubName,
    shortName: standing.shortName,
    played: standing.played,
    won: standing.won,
    drawn: standing.drawn,
    lost: standing.lost,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    goalDifference: standing.goalDifference,
    points: standing.points,
    form: standing.form,
  };
}

export function generatePressHeadline(
  homeClub: Club,
  awayClub: Club,
  homeScore: number,
  awayScore: number,
  userClubId: number,
): string {
  const userWon =
    (homeScore > awayScore && homeClub.id === userClubId) ||
    (awayScore > homeScore && awayClub.id === userClubId);
  const userLost =
    (homeScore > awayScore && awayClub.id === userClubId) ||
    (awayScore > homeScore && homeClub.id === userClubId);

  if (userWon) return `${homeClub.shortName} ${homeScore}-${awayScore} ${awayClub.shortName}: Manager's tactics pay off`;
  if (userLost) return `Upset at ${homeClub.stadium}: ${homeClub.shortName} ${homeScore}-${awayScore} ${awayClub.shortName}`;
  if (homeScore === awayScore) return `Honours even: ${homeClub.shortName} ${homeScore}-${awayScore} ${awayClub.shortName}`;
  return `${homeClub.shortName} beat ${awayClub.shortName} ${homeScore}-${awayScore} in ${homeClub.league} clash`;
}
