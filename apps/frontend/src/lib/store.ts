'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Player } from '@/types/player';
import { clamp } from '@/lib/utils';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import {
  type CareerFixture,
  type LeagueStanding,
  type MatchHistoryEntry,
  type PressEvent,
  type TacticsState,
  DEFAULT_TACTICS,
  createFreshStandings,
  createUserFixtures,
  initializeAllSquads,
  initializeClubBudgets,
  applyResultToStandings,
  markFixturePlayed,
  simulateBackgroundMatches,
  generatePressHeadline,
  getNextUserFixture,
} from '@/lib/career-engine';

/**
 * App Shell state — drives the Hybrid Command Center navigation.
 * Persists to localStorage so the user's preferences survive refresh.
 *
 * CRITICAL: The `_hasHydrated` flag tells components when localStorage
 * has been read. During SSR and initial client render, `selectedClubId`
 * is null. After hydration, it gets the real value from localStorage.
 * Pages must check `_hasHydrated` before showing "no club selected"
 * empty states — otherwise they flash empty during hydration.
 */

export type NavSection =
  | 'dashboard'
  | 'squad'
  | 'tactics'
  | 'training'
  | 'matches'
  | 'match-simulation'
  | 'career'
  | 'finances'
  | 'press'
  | 'transfers'
  | 'settings';

export type CareerPhase =
  | 'normal_day'
  | 'match_eve'
  | 'matchday'
  | 'post_match'
  | 'recovery_day';

export type InboxCategory = 'match' | 'media' | 'club' | 'board' | 'world';
export type InboxPriority = 'low' | 'medium' | 'high';

export interface InboxItem {
  id: number;
  title: string;
  body: string;
  category: InboxCategory;
  priority: InboxPriority;
  createdAt: string;
  actionLabel?: string;
  actionPath?: string;
  fixtureId?: number;
}

const MAX_INBOX_ITEMS = 16;
const MAX_PRESS_ITEMS = 20;

// clamp imported from @/lib/utils

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(currentDate: string, targetDate: string): number {
  const current = new Date(`${currentDate}T12:00:00Z`);
  const target = new Date(`${targetDate}T12:00:00Z`);
  return Math.round((target.getTime() - current.getTime()) / 86_400_000);
}

function getCareerStartDate(fixtures: CareerFixture[]): string {
  const firstFixture = fixtures[0];
  return firstFixture ? addDays(firstFixture.matchDate, -3) : '2026-08-13';
}

function pushInbox(existing: InboxItem[], item: InboxItem): InboxItem[] {
  return [item, ...existing].slice(0, MAX_INBOX_ITEMS);
}

function createInboxItem(
  id: number,
  title: string,
  body: string,
  category: InboxCategory,
  priority: InboxPriority,
  createdAt: string,
  options: Partial<Pick<InboxItem, 'actionLabel' | 'actionPath' | 'fixtureId'>> = {},
): InboxItem {
  return {
    id,
    title,
    body,
    category,
    priority,
    createdAt,
    ...options,
  };
}

function promoteFixturesForDate(
  fixtures: CareerFixture[],
  currentDate: string,
  clubId: number,
): CareerFixture[] {
  return fixtures.map((fixture) => {
    const isUserFixture = fixture.homeClubId === clubId || fixture.awayClubId === clubId;
    if (!isUserFixture || fixture.status === 'finished') return fixture;
    if (fixture.matchDate <= currentDate) {
      return { ...fixture, status: 'live' };
    }
    return { ...fixture, status: 'scheduled' };
  });
}

function createWorldRoundup(
  clubId: number,
  currentWeek: number,
  currentDate: string,
  nextInboxId: number,
): InboxItem {
  const rivals = OFFLINE_CLUBS.filter((club) => club.id !== clubId).slice(0, 6);
  const rival = rivals[currentWeek % rivals.length];
  return createInboxItem(
    nextInboxId,
    'World Update',
    `${rival.shortName} are building momentum in the wider title picture while pundits keep one eye on your next move.`,
    'world',
    'low',
    currentDate,
  );
}

function createTrainingReport(
  clubId: number,
  currentDate: string,
  nextInboxId: number,
): InboxItem {
  const club = getOfflineClub(clubId);
  return createInboxItem(
    nextInboxId,
    'Training Report',
    `${club?.coach ?? 'Your staff'} report a sharp session. Shape looks good and the dressing room feel is positive ahead of the next fixture.`,
    'club',
    'medium',
    currentDate,
    { actionLabel: 'Review Tactics', actionPath: '/tactics' },
  );
}

interface AppState {
  // ---------- HYDRATION ----------
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // ---------- CLUB SELECTION ----------
  selectedClubId: number | null;

  // ---------- NAVIGATION ----------
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;

  // ---------- LAYOUT ----------
  leftRailExpanded: boolean;
  setLeftRailExpanded: (v: boolean) => void;

  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (v: boolean) => void;

  // ---------- AUDIO ----------
  audioEnabled: boolean;
  masterVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
  toggleAudio: () => void;
  setMasterVolume: (v: number) => void;
  setAmbienceVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;

  // ---------- MANAGER ----------
  managerName: string;
  managerNationality: string;
  managerStyle: string;
  managerFormation: string;
  managerPhilosophy: string;
  careerMode: string;
  startDate: string;
  setManager: (m: Partial<Pick<AppState, 'managerName' | 'managerNationality' | 'managerStyle' | 'managerFormation' | 'managerPhilosophy' | 'careerMode' | 'startDate'>>) => void;

  // ---------- CAREER / WORLD ----------
  currentSeason: number;
  currentWeek: number;
  currentDate: string;
  currentPhase: CareerPhase;
  careerInitialized: boolean;
  leagueStandings: Record<number, LeagueStanding[]>;
  fixtures: CareerFixture[];
  matchHistory: MatchHistoryEntry[];
  squads: Record<number, Player[]>;
  clubBudgets: Record<number, number>;
  tactics: TacticsState;
  boardConfidence: number;
  squadMorale: number;
  fanSentiment: number;
  inbox: InboxItem[];
  pressEvents: PressEvent[];
  nextHistoryId: number;
  nextPressId: number;
  nextInboxId: number;

  initializeCareer: (clubId: number) => void;
  getSquad: (clubId: number) => Player[];
  setTactics: (t: Partial<TacticsState>) => void;
  recordMatchResult: (fixtureId: number, homeScore: number, awayScore: number) => void;
  buyPlayer: (playerId: number, fromClubId: number, price: number) => boolean;
  sellPlayer: (playerId: number, price: number) => boolean;
  continueGame: () => void;
  advanceWeek: () => void;
  setCurrentSeason: (s: number) => void;
  setCurrentWeek: (w: number) => void;

  // ---------- ACTIONS ----------
  selectClub: (clubId: number) => void;
  resetApp: () => void;
}

const CAREER_DEFAULTS = {
  currentDate: '',
  currentPhase: 'normal_day' as CareerPhase,
  careerInitialized: false,
  leagueStandings: {} as Record<number, LeagueStanding[]>,
  fixtures: [] as CareerFixture[],
  matchHistory: [] as MatchHistoryEntry[],
  squads: {} as Record<number, Player[]>,
  clubBudgets: {} as Record<number, number>,
  tactics: DEFAULT_TACTICS,
  boardConfidence: 75,
  squadMorale: 72,
  fanSentiment: 68,
  inbox: [] as InboxItem[],
  pressEvents: [] as PressEvent[],
  nextHistoryId: 1,
  nextPressId: 1,
  nextInboxId: 1,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---------- HYDRATION ----------
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // ---------- CLUB SELECTION ----------
      selectedClubId: null,

      // ---------- NAVIGATION ----------
      activeSection: 'dashboard',
      setActiveSection: (section) => set({ activeSection: section }),

      // ---------- LAYOUT ----------
      leftRailExpanded: false,
      setLeftRailExpanded: (v) => set({ leftRailExpanded: v }),

      rightPanelOpen: true,
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      setRightPanelOpen: (v) => set({ rightPanelOpen: v }),

      // ---------- AUDIO ----------
      audioEnabled: false,
      masterVolume: 0.7,
      ambienceVolume: 0.5,
      sfxVolume: 0.8,
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      setMasterVolume: (v) => set({ masterVolume: v }),
      setAmbienceVolume: (v) => set({ ambienceVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),

      // ---------- MANAGER ----------
      managerName: '',
      managerNationality: 'England',
      managerStyle: '',
      managerFormation: '4-3-3',
      managerPhilosophy: '',
      careerMode: '',
      startDate: '',
      setManager: (m) => set(m),

      // ---------- CAREER / WORLD ----------
      currentSeason: 1,
      currentWeek: 1,
      ...CAREER_DEFAULTS,

      initializeCareer: (clubId) => {
        const club = getOfflineClub(clubId);
        if (!club) return;
        const leagueId = club.leagueId || 1;
        const fixtures = createUserFixtures(clubId);
        const currentDate = getCareerStartDate(fixtures);
        const openingFixture = getNextUserFixture(fixtures, clubId);
        const inbox: InboxItem[] = [
          createInboxItem(
            1,
            'Welcome To The Dugout',
            `You are now in charge of ${club.name}. The board wants fast momentum and the supporters want to feel belief from day one.`,
            'board',
            'high',
            currentDate,
          ),
          createTrainingReport(clubId, currentDate, 2),
        ];

        if (openingFixture) {
          const opponentId =
            openingFixture.homeClubId === clubId ? openingFixture.awayClubId : openingFixture.homeClubId;
          const opponent = getOfflineClub(opponentId);
          if (opponent) {
            inbox.unshift(
              createInboxItem(
                3,
                'Opening Match Preview',
                `${opponent.name} are up next on ${openingFixture.matchDate}. The media are already framing it as an early tone-setter for your season.`,
                'match',
                'high',
                currentDate,
                { actionLabel: 'Open Matches', actionPath: '/matches', fixtureId: openingFixture.id },
              ),
            );
          }
        }

        set({
          careerInitialized: true,
          leagueStandings: { [leagueId]: createFreshStandings(leagueId) },
          fixtures,
          matchHistory: [],
          squads: initializeAllSquads(),
          clubBudgets: initializeClubBudgets(),
          tactics: { ...DEFAULT_TACTICS, formation: get().managerFormation || '4-3-3' },
          boardConfidence: 75,
          squadMorale: 72,
          fanSentiment: 68,
          inbox,
          pressEvents: [],
          nextHistoryId: 1,
          nextPressId: 1,
          nextInboxId: 4,
          currentSeason: 1,
          currentWeek: 1,
          currentDate,
          currentPhase: 'normal_day',
        });
      },

      getSquad: (clubId) => {
        const squads = get().squads;
        return squads[clubId] ?? [];
      },

      setTactics: (t) => set((s) => ({
        tactics: { ...s.tactics, ...t },
        managerFormation: t.formation ?? s.managerFormation,
      })),

      recordMatchResult: (fixtureId, homeScore, awayScore) => {
        const state = get();
        const clubId = state.selectedClubId;
        if (!clubId) return;

        const club = getOfflineClub(clubId);
        if (!club) return;

        const fixture = state.fixtures.find((f) => f.id === fixtureId);
        if (!fixture || fixture.status === 'finished') return;

        const leagueId = club.leagueId || 1;
        let standings = state.leagueStandings[leagueId] ?? createFreshStandings(leagueId);
        const backgroundMatches = simulateBackgroundMatches(leagueId, fixture.week, clubId, state.fixtures);
        for (const match of backgroundMatches) {
          standings = applyResultToStandings(
            standings,
            match.homeClubId,
            match.awayClubId,
            match.homeScore,
            match.awayScore,
          );
        }

        standings = applyResultToStandings(
          standings,
          fixture.homeClubId,
          fixture.awayClubId,
          homeScore,
          awayScore,
        );

        const updatedFixtures = markFixturePlayed(state.fixtures, fixtureId, homeScore, awayScore);
        const userParticipated =
          fixture.homeClubId === clubId || fixture.awayClubId === clubId;

        const homeClub = getOfflineClub(fixture.homeClubId);
        const awayClub = getOfflineClub(fixture.awayClubId);

        let boardConfidence = state.boardConfidence;
        let squadMorale = state.squadMorale;
        let fanSentiment = state.fanSentiment;
        if (userParticipated && homeClub && awayClub) {
          const userWon =
            (homeScore > awayScore && fixture.homeClubId === clubId) ||
            (awayScore > homeScore && fixture.awayClubId === clubId);
          const userLost =
            (homeScore > awayScore && fixture.awayClubId === clubId) ||
            (awayScore > homeScore && fixture.homeClubId === clubId);
          if (userWon) {
            boardConfidence = Math.min(100, boardConfidence + 3);
            squadMorale = Math.min(100, squadMorale + 4);
            fanSentiment = Math.min(100, fanSentiment + 5);
          } else if (userLost) {
            boardConfidence = Math.max(20, boardConfidence - 4);
            squadMorale = Math.max(35, squadMorale - 4);
            fanSentiment = Math.max(25, fanSentiment - 5);
          } else {
            boardConfidence = Math.min(100, boardConfidence + 1);
            squadMorale = clamp(squadMorale + 1, 0, 100);
          }
        }

        const historyEntry: MatchHistoryEntry = {
          id: state.nextHistoryId,
          fixtureId,
          homeClubId: fixture.homeClubId,
          awayClubId: fixture.awayClubId,
          homeScore,
          awayScore,
          week: fixture.week,
          competition: fixture.competition,
          playedAt: new Date().toISOString(),
          userParticipated,
        };

        const pressEvents = [...state.pressEvents];
        let nextPressId = state.nextPressId;
        if (backgroundMatches.length > 0) {
          const sample = backgroundMatches[0];
          const bgHome = getOfflineClub(sample.homeClubId);
          const bgAway = getOfflineClub(sample.awayClubId);
          if (bgHome && bgAway) {
            pressEvents.unshift({
              id: nextPressId++,
              headline: `${bgHome.shortName} ${sample.homeScore}-${sample.awayScore} ${bgAway.shortName} keeps the ${club.league} conversation moving.`,
              time: 'Just now',
              category: 'result',
            });
          }
        }
        if (userParticipated && homeClub && awayClub) {
          pressEvents.unshift({
            id: nextPressId++,
            headline: generatePressHeadline(homeClub, awayClub, homeScore, awayScore, clubId),
            time: 'Just now',
            category: 'result',
          });
        }

        const playedWeek = fixture.week;
        const shouldAdvanceWeek = userParticipated && playedWeek === state.currentWeek;
        const nextDate = addDays(fixture.matchDate || state.currentDate, 1);
        const promotedFixtures = promoteFixturesForDate(updatedFixtures, nextDate, clubId);
        const nextFixture = getNextUserFixture(promotedFixtures, clubId);
        const myRow = standings.find((row) => row.clubId === clubId);
        const myPosition = myRow ? standings.indexOf(myRow) + 1 : null;
        let nextInboxId = state.nextInboxId;
        let inbox = state.inbox.slice();

        const resultSummary =
          homeScore === awayScore
            ? `A draw keeps things moving, but the conversation around ${club.name} will be about whether more control was possible.`
            : ((fixture.homeClubId === clubId && homeScore > awayScore) ||
                (fixture.awayClubId === clubId && awayScore > homeScore))
              ? `${club.name} take the points and the media narrative swings in your favour immediately.`
              : `${club.name} come away bruised and the spotlight will only grow stronger over the next few days.`;

        inbox = pushInbox(
          inbox,
          createInboxItem(
            nextInboxId++,
            'Post-Match Report',
            resultSummary,
            'match',
            'high',
            nextDate,
            { actionLabel: 'Review Match', actionPath: '/matches', fixtureId },
          ),
        );

        if (myPosition != null) {
          inbox = pushInbox(
            inbox,
            createInboxItem(
              nextInboxId++,
              'Table Impact',
              `${club.name} now sit ${myPosition}${myPosition === 1 ? 'st' : myPosition === 2 ? 'nd' : myPosition === 3 ? 'rd' : 'th'} in ${club.league}. The board confidence meter reacts to every result now.`,
              'board',
              'medium',
              nextDate,
              { actionLabel: 'View Standings', actionPath: '/career' },
            ),
          );
        }

        if (nextFixture) {
          const nextOpponentId =
            nextFixture.homeClubId === clubId ? nextFixture.awayClubId : nextFixture.homeClubId;
          const nextOpponent = getOfflineClub(nextOpponentId);
          if (nextOpponent) {
            inbox = pushInbox(
              inbox,
              createInboxItem(
                nextInboxId++,
                'Next Fixture Set',
                `${nextOpponent.name} are next on ${nextFixture.matchDate}. Recovery starts now and the media will quickly shift focus.`,
                'match',
                'medium',
                nextDate,
                { actionLabel: 'Open Dashboard', actionPath: '/dashboard', fixtureId: nextFixture.id },
              ),
            );
          }
        }

        set({
          leagueStandings: { ...state.leagueStandings, [leagueId]: standings },
          fixtures: promotedFixtures,
          matchHistory: [historyEntry, ...state.matchHistory].slice(0, 50),
          nextHistoryId: state.nextHistoryId + 1,
          boardConfidence,
          squadMorale,
          fanSentiment,
          inbox,
          pressEvents: pressEvents.slice(0, MAX_PRESS_ITEMS),
          nextPressId,
          nextInboxId,
          currentWeek: shouldAdvanceWeek ? playedWeek + 1 : state.currentWeek,
          currentDate: nextDate,
          currentPhase: 'post_match',
        });
      },

      buyPlayer: (playerId, fromClubId, price) => {
        const state = get();
        const clubId = state.selectedClubId;
        if (!clubId || fromClubId === clubId) return false;

        const budget = state.clubBudgets[clubId] ?? 0;
        if (price > budget) return false;

        const fromSquad = state.squads[fromClubId] ?? [];
        const player = fromSquad.find((p) => p.id === playerId);
        if (!player) return false;

        const mySquad = state.squads[clubId] ?? [];
        if (mySquad.length >= 30) return false;

        const myClub = getOfflineClub(clubId);
        const updatedPlayer: Player = {
          ...player,
          clubId,
          clubName: myClub?.name,
        };

        set({
          squads: {
            ...state.squads,
            [fromClubId]: fromSquad.filter((p) => p.id !== playerId),
            [clubId]: [...mySquad, updatedPlayer],
          },
          clubBudgets: {
            ...state.clubBudgets,
            [clubId]: budget - price,
            [fromClubId]: (state.clubBudgets[fromClubId] ?? 0) + price,
          },
        });
        return true;
      },

      sellPlayer: (playerId, price) => {
        const state = get();
        const clubId = state.selectedClubId;
        if (!clubId) return false;

        const mySquad = state.squads[clubId] ?? [];
        const player = mySquad.find((p) => p.id === playerId);
        if (!player) return false;

        set({
          squads: {
            ...state.squads,
            [clubId]: mySquad.filter((p) => p.id !== playerId),
          },
          clubBudgets: {
            ...state.clubBudgets,
            [clubId]: (state.clubBudgets[clubId] ?? 0) + price,
          },
        });
        return true;
      },

      continueGame: () => {
        const state = get();
        const clubId = state.selectedClubId;
        if (!clubId) return;

        const club = getOfflineClub(clubId);
        if (!club) return;

        const activeDate = state.currentDate || getCareerStartDate(state.fixtures);
        let nextDate = addDays(activeDate, 1);
        let currentPhase: CareerPhase = 'normal_day';
        let inbox = state.inbox.slice();
        let pressEvents = state.pressEvents.slice();
        let nextInboxId = state.nextInboxId;
        let nextPressId = state.nextPressId;
        let squadMorale = state.squadMorale;
        let fanSentiment = state.fanSentiment;

        const currentFixtures = promoteFixturesForDate(state.fixtures, activeDate, clubId);
        const nextFixture = getNextUserFixture(currentFixtures, clubId);

        if (nextFixture && nextFixture.matchDate <= activeDate) {
          set({
            fixtures: promoteFixturesForDate(state.fixtures, activeDate, clubId),
            currentPhase: 'matchday',
            inbox: pushInbox(
              inbox,
              createInboxItem(
                nextInboxId,
                'Matchday Is Here',
                `${club.name} face ${getOfflineClub(nextFixture.homeClubId === clubId ? nextFixture.awayClubId : nextFixture.homeClubId)?.name ?? 'their opponents'} today. The tunnel is close now.`,
                'match',
                'high',
                activeDate,
                { actionLabel: 'Play Match', actionPath: '/match-simulation', fixtureId: nextFixture.id },
              ),
            ),
            nextInboxId: nextInboxId + 1,
          });
          return;
        }

        if (state.currentPhase === 'post_match') {
          currentPhase = 'recovery_day';
          squadMorale = clamp(squadMorale - 1, 0, 100);
          inbox = pushInbox(
            inbox,
            createInboxItem(
              nextInboxId++,
              'Recovery Day',
              `The coaching staff have dialed training back. Focus is on recovery, atmosphere, and preparing the next story around ${club.name}.`,
              'club',
              'medium',
              nextDate,
              { actionLabel: 'Open Squad', actionPath: '/squad' },
            ),
          );
        } else if (!nextFixture) {
          inbox = pushInbox(
            inbox,
            createInboxItem(
              nextInboxId++,
              'Season Checkpoint',
              `There is no scheduled fixture in the queue right now. The backroom staff are waiting for the next calendar update.`,
              'board',
              'medium',
              nextDate,
            ),
          );
        } else {
          const opponentId = nextFixture.homeClubId === clubId ? nextFixture.awayClubId : nextFixture.homeClubId;
          const opponent = getOfflineClub(opponentId);
          const daysUntilMatch = diffDays(nextDate, nextFixture.matchDate);

          if (daysUntilMatch > 2) {
            inbox = pushInbox(inbox, createTrainingReport(clubId, nextDate, nextInboxId++));
            if ((state.currentWeek + nextInboxId) % 2 === 0) {
              inbox = pushInbox(inbox, createWorldRoundup(clubId, state.currentWeek, nextDate, nextInboxId++));
            }
          } else if (daysUntilMatch === 2 && opponent) {
            inbox = pushInbox(
              inbox,
              createInboxItem(
                nextInboxId++,
                'Pundit Preview',
                `Two days out: the panel believes ${opponent.name} can be hurt in transition, but they also think your full-backs will be tested for ninety minutes.`,
                'media',
                'medium',
                nextDate,
                { actionLabel: 'Open Press', actionPath: '/press', fixtureId: nextFixture.id },
              ),
            );
            pressEvents.unshift({
              id: nextPressId++,
              headline: `Pundits debate whether ${club.shortName} can control the rhythm against ${opponent.shortName}.`,
              time: 'Just now',
              category: 'preview',
            });
          } else if (daysUntilMatch === 1 && opponent) {
            currentPhase = 'match_eve';
            squadMorale = clamp(squadMorale + 1, 0, 100);
            fanSentiment = clamp(fanSentiment + 1, 0, 100);
            inbox = pushInbox(
              inbox,
              createInboxItem(
                nextInboxId++,
                'Match Eve Briefing',
                `${opponent.name} await tomorrow. Media pressure is building, predicted lineups are circulating, and your words in the press room can shape the mood.`,
                'match',
                'high',
                nextDate,
                { actionLabel: 'Hold Press Conference', actionPath: '/press', fixtureId: nextFixture.id },
              ),
            );
            pressEvents.unshift({
              id: nextPressId++,
              headline: `${club.shortName} vs ${opponent.shortName}: analysts expect a tight tactical duel under the lights.`,
              time: 'Just now',
              category: 'preview',
            });
          } else if (opponent) {
            currentPhase = 'matchday';
            nextDate = nextFixture.matchDate;
            inbox = pushInbox(
              inbox,
              createInboxItem(
                nextInboxId++,
                'Kickoff Approaches',
                `${opponent.name} are waiting. The crowd is building, the pundits have made their calls, and it is time for your team talk.`,
                'match',
                'high',
                nextDate,
                { actionLabel: 'Play Match', actionPath: '/match-simulation', fixtureId: nextFixture.id },
              ),
            );
            pressEvents.unshift({
              id: nextPressId++,
              headline: `Kickoff day: ${club.shortName} meet ${opponent.shortName} with the spotlight fully on the dugout.`,
              time: 'Just now',
              category: 'preview',
            });
          }
        }

        set({
          currentDate: nextDate,
          currentPhase,
          fixtures: promoteFixturesForDate(state.fixtures, nextDate, clubId),
          squadMorale,
          fanSentiment,
          inbox,
          pressEvents: pressEvents.slice(0, MAX_PRESS_ITEMS),
          nextInboxId,
          nextPressId,
        });
      },

      advanceWeek: () => {
        get().continueGame();
      },

      setCurrentSeason: (s) => set({ currentSeason: s }),
      setCurrentWeek: (w) => set({ currentWeek: w }),

      // ---------- ACTIONS ----------
      selectClub: (clubId) => {
        const state = get();
        if (!state.careerInitialized || state.selectedClubId !== clubId) {
          get().initializeCareer(clubId);
        }
        set({ selectedClubId: clubId });
      },

      resetApp: () =>
        set({
          selectedClubId: null,
          activeSection: 'dashboard',
          rightPanelOpen: true,
          audioEnabled: false,
          currentSeason: 1,
          currentWeek: 1,
          managerName: '',
          managerStyle: '',
          managerPhilosophy: '',
          careerMode: '',
          startDate: '',
          ...CAREER_DEFAULTS,
        }),
    }),
    {
      name: 'tactico-app-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedClubId: state.selectedClubId,
        activeSection: state.activeSection,
        rightPanelOpen: state.rightPanelOpen,
        audioEnabled: state.audioEnabled,
        masterVolume: state.masterVolume,
        ambienceVolume: state.ambienceVolume,
        sfxVolume: state.sfxVolume,
        currentSeason: state.currentSeason,
        currentWeek: state.currentWeek,
        currentDate: state.currentDate,
        currentPhase: state.currentPhase,
        managerName: state.managerName,
        managerNationality: state.managerNationality,
        managerStyle: state.managerStyle,
        managerFormation: state.managerFormation,
        managerPhilosophy: state.managerPhilosophy,
        careerMode: state.careerMode,
        startDate: state.startDate,
        careerInitialized: state.careerInitialized,
        leagueStandings: state.leagueStandings,
        fixtures: state.fixtures,
        matchHistory: state.matchHistory,
        squads: state.squads,
        clubBudgets: state.clubBudgets,
        tactics: state.tactics,
        boardConfidence: state.boardConfidence,
        squadMorale: state.squadMorale,
        fanSentiment: state.fanSentiment,
        inbox: state.inbox,
        pressEvents: state.pressEvents,
        nextHistoryId: state.nextHistoryId,
        nextPressId: state.nextPressId,
        nextInboxId: state.nextInboxId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.selectedClubId && !state.careerInitialized) {
          state.initializeCareer(state.selectedClubId);
        }
      },
    }
  )
);

// Re-export career types for convenience
export type { CareerFixture, LeagueStanding, MatchHistoryEntry, TacticsState, PressEvent };
