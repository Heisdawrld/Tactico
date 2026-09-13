/**
 * Pure career logic — standings, fixtures, match simulation.
 * No React/Zustand dependencies; consumed by store.ts.
 */

import type { Player } from '@/types/player';
import type { Club } from '@/types/club';
import { createRoundRobin } from './league-calendar';
import { sampleSemanticRandom } from '@tactico/simulation-engine/spatial';
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
  /** Absent on the original eight-fixture saves; upgraded at the next season. */
  calendarVersion?: 2;
  season?: number;
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
  category: 'transfer' | 'result' | 'injury' | 'news' | 'rumor' | 'preview';
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

export function createLeagueFixtures(leagueId: number, season = 1): CareerFixture[] {
  if (!Number.isSafeInteger(season) || season < 1 || season > 7000) throw new Error('Invalid season');
  const clubs = OFFLINE_CLUBS.filter(c => c.leagueId === leagueId);
  if (clubs.length < 2) return [];
  const seasonStart = new Date(Date.UTC(2025 + season, 7, 16, 12));
  return createRoundRobin(clubs.map(c => c.id)).map((pair, index) => {
    const date = new Date(seasonStart);
    date.setUTCDate(date.getUTCDate() + (pair.week - 1) * 7);
    return {
      ...pair, id: (season - 1) * 100000 + leagueId * 1000 + index + 1,
      homeScore: null, awayScore: null, status: 'scheduled',
      matchDate: date.toISOString().slice(0, 10), competition: clubs[0].league,
      calendarVersion: 2, season,
    };
  });
}

export function createUserFixtures(clubId: number, season = 1): CareerFixture[] {
  const club = getOfflineClub(clubId);
  if (!club) return [];
  return createLeagueFixtures(club.leagueId || 1, season)
    .filter(f => f.homeClubId === clubId || f.awayClubId === clubId);
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

/** Background approximation pending integration of the full spatial match engine.
 * Each club's goals are sampled independently; no winner or required score is chosen.
 */
export function simulateMatchScore(homeClub: Club, awayClub: Club, fixtureKey = 'exhibition', season = 1): { home: number; away: number } {
  const strengthDifference = (clubStrength(homeClub) - clubStrength(awayClub)) / 40;
  const goals = (clubId: number, mean: number) => {
    const sample = sampleSemanticRandom({ matchSeed: 20260816 + season,
      namespace: 'career.background.goals', period: 'full_time', tick: 0,
      decisionId: fixtureKey, actorIds: [clubId], sampleKind: 'poisson_goals', sampleIndex: 0 });
    let probability = Math.exp(-mean), cumulative = probability, count = 0;
    while (sample > cumulative && count < 20) {
      count++; probability *= mean / count; cumulative += probability;
    }
    return count;
  };
  return {
    home: goals(homeClub.id, Math.max(0.25, Math.min(4, 1.5 + strengthDifference))),
    away: goals(awayClub.id, Math.max(0.25, Math.min(4, 1.2 - strengthDifference))),
  };
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

  if (userFixtures[0]?.calendarVersion === 2) {
    const season = userFixtures[0].season ?? 1;
    return createLeagueFixtures(leagueId, season).filter(f => f.week === week &&
      f.homeClubId !== userClubId && f.awayClubId !== userClubId).map(f => {
      const score = simulateMatchScore(getOfflineClub(f.homeClubId)!, getOfflineClub(f.awayClubId)!, String(f.id), season);
      return { homeClubId: f.homeClubId, awayClubId: f.awayClubId, homeScore: score.home, awayScore: score.away };
    });
  }

  const userFixture = userFixtures.find(
    (f) => f.week === week && (f.homeClubId === userClubId || f.awayClubId === userClubId),
  );
  const userOpponentId = userFixture
    ? (userFixture.homeClubId === userClubId ? userFixture.awayClubId : userFixture.homeClubId)
    : null;

  const available = clubs.filter((c) => c.id !== userClubId && c.id !== userOpponentId);
  const ordered = [...available].sort((a, b) => a.id - b.id);
  const offset = week % Math.max(1, ordered.length);
  const shuffled = [...ordered.slice(offset), ...ordered.slice(0, offset)];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    if (!home || !away) continue;
    const scores = simulateMatchScore(home, away, `legacy-${leagueId}-${week}-${home.id}-${away.id}`);
    results.push({
      homeClubId: home.id,
      awayClubId: away.id,
      homeScore: scores.home,
      awayScore: scores.away,
    });
  }
  return results;
}

/** Commit only completed rounds, including bye weeks, exactly once. User scores
 * are committed by recordMatchResult; this function handles the other fixtures.
 */
export function advanceLeagueCalendar(input: {
  leagueId: number; clubId: number; fixtures: CareerFixture[]; throughDate: string;
  completedWeeks: number[]; standings: LeagueStanding[];
}): { completedWeeks: number[]; standings: LeagueStanding[]; results: BackgroundMatch[] } {
  const { leagueId, clubId, fixtures, throughDate } = input;
  const completedWeeks = new Set(input.completedWeeks);
  let standings = input.standings;
  const results: BackgroundMatch[] = [];
  if (fixtures[0]?.calendarVersion !== 2) return { completedWeeks: [...completedWeeks], standings, results };
  const schedule = createLeagueFixtures(leagueId, fixtures[0].season ?? 1);
  const dueWeeks = [...new Set(schedule.filter(f => f.matchDate <= throughDate).map(f => f.week))];
  for (const week of dueWeeks) {
    if (completedWeeks.has(week)) continue;
    if (fixtures.some(f => f.week === week && f.status !== 'finished')) break;
    const matches = simulateBackgroundMatches(leagueId, week, clubId, fixtures);
    for (const match of matches) standings = applyResultToStandings(standings,
      match.homeClubId, match.awayClubId, match.homeScore, match.awayScore);
    completedWeeks.add(week);
    results.push(...matches);
  }
  return { completedWeeks: [...completedWeeks].sort((a, b) => a - b), standings, results };
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
