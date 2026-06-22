'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Player } from '@/types/player';
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
  careerInitialized: boolean;
  leagueStandings: Record<number, LeagueStanding[]>;
  fixtures: CareerFixture[];
  matchHistory: MatchHistoryEntry[];
  squads: Record<number, Player[]>;
  clubBudgets: Record<number, number>;
  tactics: TacticsState;
  boardConfidence: number;
  pressEvents: PressEvent[];
  nextHistoryId: number;
  nextPressId: number;

  initializeCareer: (clubId: number) => void;
  getSquad: (clubId: number) => Player[];
  setTactics: (t: Partial<TacticsState>) => void;
  recordMatchResult: (fixtureId: number, homeScore: number, awayScore: number) => void;
  buyPlayer: (playerId: number, fromClubId: number, price: number) => boolean;
  sellPlayer: (playerId: number, price: number) => boolean;
  advanceWeek: () => void;
  setCurrentSeason: (s: number) => void;
  setCurrentWeek: (w: number) => void;

  // ---------- ACTIONS ----------
  selectClub: (clubId: number) => void;
  resetApp: () => void;
}

const CAREER_DEFAULTS = {
  careerInitialized: false,
  leagueStandings: {} as Record<number, LeagueStanding[]>,
  fixtures: [] as CareerFixture[],
  matchHistory: [] as MatchHistoryEntry[],
  squads: {} as Record<number, Player[]>,
  clubBudgets: {} as Record<number, number>,
  tactics: DEFAULT_TACTICS,
  boardConfidence: 75,
  pressEvents: [] as PressEvent[],
  nextHistoryId: 1,
  nextPressId: 1,
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
        set({
          careerInitialized: true,
          leagueStandings: { [leagueId]: createFreshStandings(leagueId) },
          fixtures: createUserFixtures(clubId),
          matchHistory: [],
          squads: initializeAllSquads(),
          clubBudgets: initializeClubBudgets(),
          tactics: { ...DEFAULT_TACTICS, formation: get().managerFormation || '4-3-3' },
          boardConfidence: 75,
          pressEvents: [],
          nextHistoryId: 1,
          nextPressId: 1,
          currentSeason: 1,
          currentWeek: 1,
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
        const standings = state.leagueStandings[leagueId] ?? createFreshStandings(leagueId);
        const updatedStandings = applyResultToStandings(
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
        if (userParticipated && homeClub && awayClub) {
          const userWon =
            (homeScore > awayScore && fixture.homeClubId === clubId) ||
            (awayScore > homeScore && fixture.awayClubId === clubId);
          const userLost =
            (homeScore > awayScore && fixture.awayClubId === clubId) ||
            (awayScore > homeScore && fixture.homeClubId === clubId);
          if (userWon) boardConfidence = Math.min(100, boardConfidence + 3);
          else if (userLost) boardConfidence = Math.max(20, boardConfidence - 4);
          else boardConfidence = Math.min(100, boardConfidence + 1);
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
        if (userParticipated && homeClub && awayClub) {
          pressEvents.unshift({
            id: state.nextPressId,
            headline: generatePressHeadline(homeClub, awayClub, homeScore, awayScore, clubId),
            time: 'Just now',
            category: 'result',
          });
        }

        const playedWeek = fixture.week;
        const shouldAdvanceWeek = userParticipated && playedWeek === state.currentWeek;

        set({
          leagueStandings: { ...state.leagueStandings, [leagueId]: updatedStandings },
          fixtures: updatedFixtures,
          matchHistory: [historyEntry, ...state.matchHistory].slice(0, 50),
          nextHistoryId: state.nextHistoryId + 1,
          boardConfidence,
          pressEvents: pressEvents.slice(0, 20),
          nextPressId: state.nextPressId + (userParticipated ? 1 : 0),
          currentWeek: shouldAdvanceWeek ? playedWeek + 1 : state.currentWeek,
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

      advanceWeek: () => {
        const state = get();
        const clubId = state.selectedClubId;
        if (!clubId) return;

        const club = getOfflineClub(clubId);
        if (!club) return;

        const leagueId = club.leagueId || 1;
        let standings = state.leagueStandings[leagueId] ?? createFreshStandings(leagueId);
        const week = state.currentWeek;

        const bgMatches = simulateBackgroundMatches(leagueId, week, clubId, state.fixtures);
        for (const m of bgMatches) {
          standings = applyResultToStandings(
            standings,
            m.homeClubId,
            m.awayClubId,
            m.homeScore,
            m.awayScore,
          );
        }

        const pressEvents = [...state.pressEvents];
        if (bgMatches.length > 0) {
          const sample = bgMatches[0];
          const home = getOfflineClub(sample.homeClubId);
          const away = getOfflineClub(sample.awayClubId);
          if (home && away) {
            pressEvents.unshift({
              id: state.nextPressId,
              headline: `${home.shortName} ${sample.homeScore}-${sample.awayScore} ${away.shortName} — ${club.league} roundup`,
              time: '1h',
              category: 'result',
            });
          }
        }

        const myRow = standings.find((r) => r.clubId === clubId);
        const myPosition = myRow ? standings.indexOf(myRow) + 1 : 0;
        let boardConfidence = state.boardConfidence;
        if (myRow) {
          if (myPosition <= 4) boardConfidence = Math.min(100, boardConfidence + 2);
          else if (myPosition >= standings.length - 3) boardConfidence = Math.max(20, boardConfidence - 3);
        }

        const isNewSeason = week >= 38;
        set({
          leagueStandings: { ...state.leagueStandings, [leagueId]: standings },
          currentWeek: isNewSeason ? 1 : week + 1,
          currentSeason: isNewSeason ? state.currentSeason + 1 : state.currentSeason,
          boardConfidence,
          pressEvents: pressEvents.slice(0, 20),
          nextPressId: state.nextPressId + (bgMatches.length > 0 ? 1 : 0),
        });
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
        pressEvents: state.pressEvents,
        nextHistoryId: state.nextHistoryId,
        nextPressId: state.nextPressId,
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
