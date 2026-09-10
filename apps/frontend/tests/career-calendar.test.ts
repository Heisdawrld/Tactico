import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoundRobin } from '../src/lib/league-calendar';
import { OFFLINE_CLUBS } from '../src/lib/game-data';
import {
  advanceLeagueCalendar, applyResultToStandings, createFreshStandings,
  createLeagueFixtures, createUserFixtures, markFixturePlayed, simulateBackgroundMatches,
} from '../src/lib/career-engine';

for (const size of [2, 3, 7, 20]) {
  test(`${size}-club schedule has two meetings per pair, balanced venues and no double bookings`, () => {
    const ids = Array.from({ length: size }, (_, i) => i + 1);
    const schedule = createRoundRobin(ids);
    assert.equal(schedule.length, size * (size - 1));
    assert.deepEqual(createRoundRobin([...ids].reverse()), schedule);
    for (const id of ids) {
      assert.equal(schedule.filter(f => f.homeClubId === id).length, size - 1);
      assert.equal(schedule.filter(f => f.awayClubId === id).length, size - 1);
      for (const opponent of ids.filter(i => i !== id)) {
        assert.equal(schedule.filter(f => f.homeClubId === id && f.awayClubId === opponent).length, 1);
      }
    }
    for (const week of new Set(schedule.map(f => f.week))) {
      const playing = schedule.filter(f => f.week === week).flatMap(f => [f.homeClubId, f.awayClubId]);
      assert.equal(new Set(playing).size, playing.length);
    }
  });
}

test('empty and single-club leagues have no fixtures; duplicate clubs are rejected', () => {
  assert.deepEqual(createRoundRobin([]), []);
  assert.deepEqual(createRoundRobin([1]), []);
  assert.throws(() => createRoundRobin([1, 1]));
});

test('next seasons have new dates and distinct fixture identities', () => {
  const first = createUserFixtures(1), second = createUserFixtures(1, 2);
  assert.equal(first.length, 12);
  assert.equal(second.length, 12);
  assert.ok(second.every(f => f.matchDate.startsWith('2027')));
  assert.ok(second.every(f => !first.some(old => old.id === f.id)));
});

test('all clubs complete a balanced season, including opening and closing bye rounds', () => {
  for (const club of OFFLINE_CLUBS) {
    const leagueId = club.leagueId || 1;
    let fixtures = createUserFixtures(club.id);
    let standings = createFreshStandings(leagueId);
    let completedWeeks: number[] = [];
    const schedule = createLeagueFixtures(leagueId);
    for (const f of fixtures) {
      fixtures = markFixturePlayed(fixtures, f.id, 1, 1);
      standings = applyResultToStandings(standings, f.homeClubId, f.awayClubId, 1, 1);
      const result = advanceLeagueCalendar({ leagueId, clubId: club.id, fixtures, standings, completedWeeks, throughDate: f.matchDate });
      standings = result.standings; completedWeeks = result.completedWeeks;
    }
    const final = advanceLeagueCalendar({ leagueId, clubId: club.id, fixtures, standings, completedWeeks,
      throughDate: schedule[schedule.length - 1].matchDate });
    const requiredGames = (final.standings.length - 1) * 2;
    assert.ok(final.standings.every(row => row.played === requiredGames), `${club.name}: ${JSON.stringify(final.standings.map(r => r.played))}`);
    assert.equal(final.standings.reduce((n, r) => n + r.goalsFor, 0), final.standings.reduce((n, r) => n + r.goalsAgainst, 0));
    assert.equal(final.standings.reduce((n, r) => n + r.won, 0), final.standings.reduce((n, r) => n + r.lost, 0));
    const again = advanceLeagueCalendar({ leagueId, clubId: club.id, fixtures,
      standings: final.standings, completedWeeks: final.completedWeeks, throughDate: '2027-07-01' });
    assert.deepEqual(again.standings, final.standings);
    assert.deepEqual(again.results, []);
  }
});

test('background scores survive reruns and pending user matches block future rounds', () => {
  const fixtures = createUserFixtures(1);
  assert.deepEqual(simulateBackgroundMatches(1, 1, 1, fixtures), simulateBackgroundMatches(1, 1, 1, fixtures));
  const calendar = advanceLeagueCalendar({ leagueId: 1, clubId: 1, fixtures,
    standings: createFreshStandings(1), completedWeeks: [], throughDate: '2030-01-01' });
  assert.ok(calendar.completedWeeks.every(week => week < fixtures[0].week));
});

test('store plays through two seasons, archives the final table and preserves club assets', async () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  } });
  const { useAppStore } = await import('../src/lib/store');
  useAppStore.getState().selectClub(1);
  useAppStore.getState().initializeCareer(1);
  const starting = useAppStore.getState();
  const squads = JSON.stringify(starting.squads), budgets = { ...starting.clubBudgets };
  for (let day = 0; day < 450 && useAppStore.getState().currentSeason < 3; day++) {
    const state = useAppStore.getState();
    const fixture = state.fixtures.find(f => f.status !== 'finished');
    if (fixture && fixture.matchDate <= state.currentDate) {
      state.recordMatchResult(fixture.id, 2, 1);
      const recorded = JSON.stringify(useAppStore.getState().leagueStandings);
      useAppStore.getState().recordMatchResult(fixture.id, 2, 1);
      assert.equal(JSON.stringify(useAppStore.getState().leagueStandings), recorded);
    } else state.continueGame();
  }
  const final = useAppStore.getState();
  assert.equal(final.currentSeason, 3);
  assert.equal(final.seasonHistory.length, 2);
  assert.ok(final.seasonHistory.every(s => s.standings.every(r => r.played === 12)));
  assert.equal(JSON.stringify(final.squads), squads);
  assert.deepEqual(final.clubBudgets, budgets);
  assert.equal(final.fixtures[0].season, 3);
  const saved = JSON.parse(data.get('tactico-app-state')!).state;
  assert.equal(saved.seasonHistory.length, 2);
  assert.deepEqual(saved.completedRoundWeeks, []);
  assert.equal(final.buyPlayer(1, 2, -100), false);
  assert.equal(final.sellPlayer(final.squads[1][0].id, Infinity), false);
});
