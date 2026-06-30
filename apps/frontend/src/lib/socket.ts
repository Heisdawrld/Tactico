'use client';

/**
 * Socket.io Client Hook
 * 
 * Connects the frontend to the game-loop.ts server.
 * Provides typed event emitters and listeners.
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('error', (data: { message: string }) => {
      console.error('[Socket] Error:', data.message);
    });
  }
  return socket;
}

/**
 * Main hook for socket connection
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => { socketRef.current?.off(event, callback); };
  }, []);

  return { socket: socketRef.current, emit, on };
}

/**
 * Career events hook
 */
export function useCareerSocket() {
  const { emit, on } = useSocket();
  const store = useAppStore();

  const startCareer = useCallback((clubId: number, managerName: string, formation: string) => {
    emit('career:start', { clubId, managerName, formation });
  }, [emit]);

  const continueCareer = useCallback(() => {
    emit('career:continue');
  }, [emit]);

  useEffect(() => {
    const cleanups = [
      on('career:started', (data) => {
        console.log('[Career] Started:', data);
        // Store will be updated via the event
      }),
      on('career:advanced', (data) => {
        console.log('[Career] Advanced to:', data.currentDate);
      }),
    ];

    return () => cleanups.forEach(fn => fn());
  }, [on]);

  return { startCareer, continueCareer };
}

/**
 * Match events hook
 */
export function useMatchSocket() {
  const { emit, on } = useSocket();

  const playMatch = useCallback((fixtureId: number) => {
    emit('match:play', { fixtureId });
  }, [emit]);

  const updateTactics = useCallback((tactics: any) => {
    emit('match:tactics', tactics);
  }, [emit]);

  const makeSubstitution = useCallback((playerOff: number, playerOn: number) => {
    emit('match:substitution', { playerOff, playerOn });
  }, [emit]);

  useEffect(() => {
    const cleanups = [
      on('match:started', (data) => {
        console.log('[Match] Started:', data);
      }),
      on('match:tick', (data) => {
        // Real-time match updates — handled by MatchSimulation component
      }),
      on('match:finished', (data) => {
        console.log('[Match] Finished:', data.homeScore, '-', data.awayScore);
      }),
    ];

    return () => cleanups.forEach(fn => fn());
  }, [on]);

  return { playMatch, updateTactics, makeSubstitution };
}

/**
 * Transfer events hook
 */
export function useTransferSocket() {
  const { emit, on } = useSocket();

  const searchPlayers = useCallback((filters: { position?: string; maxAge?: number; maxPrice?: number }) => {
    emit('transfer:search', filters);
  }, [emit]);

  const placeBid = useCallback((playerId: number, fromClubId: number, amount: number, wageOffer: number) => {
    emit('transfer:bid', { playerId, fromClubId, amount, wageOffer });
  }, [emit]);

  return { searchPlayers, placeBid, on };
}
