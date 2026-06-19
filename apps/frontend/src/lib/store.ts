'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * App Shell state — drives the Hybrid Command Center navigation.
 * Persists to localStorage so the user's preferences survive refresh.
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
  // ---------- CLUB SELECTION ----------
  selectedClubId: number | null;

  // ---------- NAVIGATION ----------
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;

  // ---------- LAYOUT ----------
  leftRailExpanded: boolean;        // hover-expand on desktop
  setLeftRailExpanded: (v: boolean) => void;

  rightPanelOpen: boolean;          // live feed panel
  toggleRightPanel: () => void;
  setRightPanelOpen: (v: boolean) => void;

  // ---------- AUDIO ----------
  audioEnabled: boolean;
  masterVolume: number;             // 0..1
  ambienceVolume: number;           // 0..1
  sfxVolume: number;                // 0..1
  toggleAudio: () => void;
  setMasterVolume: (v: number) => void;
  setAmbienceVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;

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
      // ---------- CLUB SELECTION ----------
      selectedClubId: null,

      // ---------- NAVIGATION ----------
      activeSection: 'dashboard',
      setActiveSection: (section) => set({ activeSection: section }),

      // ---------- LAYOUT ----------
      leftRailExpanded: false,
      setLeftRailExpanded: (v) => set({ leftRailExpanded: v }),

      rightPanelOpen: true,  // open by default on desktop
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      setRightPanelOpen: (v) => set({ rightPanelOpen: v }),

      // ---------- AUDIO ----------
      audioEnabled: false, // off by default (browser autoplay policies)
      masterVolume: 0.7,
      ambienceVolume: 0.5,
      sfxVolume: 0.8,
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      setMasterVolume: (v) => set({ masterVolume: v }),
      setAmbienceVolume: (v) => set({ ambienceVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),

      // ---------- CAREER / WORLD ----------
      currentSeason: 1,
      currentWeek: 1,
      advanceWeek: () =>
        set((s) => ({
          currentWeek: s.currentWeek + 1,
          currentSeason: s.currentWeek >= 38 ? s.currentSeason + 1 : s.currentSeason,
        })),
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
      }),
    }
  )
);
