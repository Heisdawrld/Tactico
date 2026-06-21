'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import type { Club } from '@/types/club';

/**
 * useSelectedClub — the single hook all pages should use to get the
 * current club. Handles Zustand hydration correctly.
 *
 * Returns:
 *   { club: Club | null, hydrated: boolean }
 *
 * - During SSR + initial render: hydrated=false, club=null
 *   → pages should show a loading spinner (NOT "no club selected")
 * - After hydration: hydrated=true
 *   → if selectedClubId is set: club = the real club
 *   → if selectedClubId is null: club = null → show "no club selected"
 *
 * This prevents the flash of "No Club Selected" that happens when
 * Zustand hasn't read localStorage yet.
 */
export function useSelectedClub(): { club: Club | null; hydrated: boolean } {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const hydrated = useAppStore((s) => s._hasHydrated);

  const club = useMemo(() => {
    if (!hydrated) return null; // Don't compute until hydrated
    if (!selectedClubId) return null; // No club selected
    return getOfflineClub(selectedClubId) || OFFLINE_CLUBS[0]; // Fallback to first club
  }, [selectedClubId, hydrated]);

  return { club, hydrated };
}
