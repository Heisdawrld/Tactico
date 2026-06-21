'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import type { Club } from '@/types/club';

export function useSelectedClub(): { club: Club | null; hydrated: boolean } {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    useAppStore.getState().setHasHydrated(true);
  }, []);

  const club = useMemo(() => {
    if (!hydrated) return null;
    if (!selectedClubId) return null;
    return getOfflineClub(selectedClubId) || OFFLINE_CLUBS[0];
  }, [selectedClubId, hydrated]);

  return { club, hydrated };
}
