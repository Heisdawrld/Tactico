'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import type { Club } from '@/types/club';

/**
 * useSelectedClub — handles Zustand hydration correctly.
 *
 * Uses typeof window check for synchronous hydration detection.
 * During SSR: window is undefined → hydrated=false → loading state
 * On client: window exists → hydrated=true → real data
 */
export function useSelectedClub(): { club: Club | null; hydrated: boolean } {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  
  // Synchronous hydration check — no useEffect needed
  // On the client, window is always defined after the first render
  // During SSR, window is undefined
  const hydrated = typeof window !== 'undefined';
  
  const club = useMemo(() => {
    if (!hydrated) return null;
    if (!selectedClubId) return null;
    return getOfflineClub(selectedClubId) || OFFLINE_CLUBS[0];
  }, [selectedClubId, hydrated]);

  return { club, hydrated };
}
