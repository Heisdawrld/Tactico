export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@tactico/database";

/**
 * GET /api/health
 *
 * Returns the health status of all Tactico services.
 * Useful for debugging "is the DB connected?" questions.
 */
export async function GET() {
  const start = Date.now();
  const status: {
    status: 'ok' | 'degraded' | 'down';
    timestamp: string;
    responseTimeMs: number;
    services: {
      database: {
        status: 'connected' | 'disconnected';
        url?: string;
        latencyMs?: number;
        error?: string;
        counts?: {
          leagues: number;
          teams: number;
          players: number;
          playersWithRatings: number;
        };
      };
      bzzoiro: {
        status: 'configured' | 'missing';
        hasKey: boolean;
      };
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTimeMs: 0,
    services: {
      database: { status: 'disconnected' },
      bzzoiro: { status: 'missing', hasKey: false },
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    const leagues = await db.query('SELECT COUNT(*) AS n FROM leagues');
    const teams = await db.query('SELECT COUNT(*) AS n FROM teams');
    const players = await db.query('SELECT COUNT(*) AS n FROM players');
    const playersWithRatings = await db.query(
      'SELECT COUNT(*) AS n FROM players WHERE overall_rating IS NOT NULL'
    );

    status.services.database = {
      status: 'connected',
      url: process.env.TURSO_DATABASE_URL?.replace(/:[^:@]+@/, ':***@'),
      latencyMs: Date.now() - dbStart,
      counts: {
        leagues: (leagues[0] as any)?.n ?? 0,
        teams: (teams[0] as any)?.n ?? 0,
        players: (players[0] as any)?.n ?? 0,
        playersWithRatings: (playersWithRatings[0] as any)?.n ?? 0,
      },
    };
  } catch (e: any) {
    status.status = 'down';
    status.services.database = {
      status: 'disconnected',
      error: e.message,
    };
  }

  // Check Bzzoiro
  status.services.bzzoiro = {
    status: process.env.BZZOIRO_API_KEY ? 'configured' : 'missing',
    hasKey: !!process.env.BZZOIRO_API_KEY,
  };

  if (status.services.database.status === 'disconnected') {
    status.status = 'down';
  }

  status.responseTimeMs = Date.now() - start;

  const httpStatus = status.status === 'down' ? 503 : 200;
  return NextResponse.json(status, { status: httpStatus });
}
