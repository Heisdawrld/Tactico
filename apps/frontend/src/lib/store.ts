'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  advanceWeek: () => void;
  setCurrentSeason: (s: number) => void;
  setCurrentWeek: (w: number) => void;

  // ---------- ACTIONS ----------
  selectClub: (clubId: number) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      advanceWeek: () =>
        set((s) => {
          const isNewSeason = s.currentWeek >= 38;
          return {
            currentWeek: isNewSeason ? 1 : s.currentWeek + 1,
            currentSeason: isNewSeason ? s.currentSeason + 1 : s.currentSeason,
          };
        }),
      setCurrentSeason: (s) => set({ currentSeason: s }),
      setCurrentWeek: (w) => set({ currentWeek: w }),

      // ---------- ACTIONS ----------
      selectClub: (clubId) => set({ selectedClubId: clubId }),
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
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after localStorage has been read
        state?.setHasHydrated(true);
      },
    }
  )
);
