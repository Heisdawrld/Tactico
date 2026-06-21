export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@tactico/database";

/**
 * GET /api/clubs
 *
 * Returns teams from the real Turso DB.
 * Supports optional query params:
 *   ?league_id=N   - filter by league
 *   ?limit=N       - limit results (default 30, max 500)
 *   ?search=STR    - search by name
 *
 * Includes a 30-second in-memory cache to survive Render cold starts
 * (which can be 30+ seconds on the free tier).
 *
 * Maps real DB schema (teams table) → frontend Club interface.
 */

// In-memory cache (survives within a single server instance)
let _cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("league_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 500);
    const search = searchParams.get("search");

    // Use cache for default (no-filter) requests when fresh
    const canUseCache = !leagueId && !search && limit <= 100;
    if (canUseCache && _cache && Date.now() - _cache.ts < CACHE_TTL) {
      return NextResponse.json(_cache.data.slice(0, limit));
    }

    // Build query
    const conditions: string[] = ["t.name IS NOT NULL", "length(t.name) > 1"];
    const args: any[] = [];

    if (leagueId) {
      conditions.push("t.league_id = ?");
      args.push(parseInt(leagueId));
    }
    if (search) {
      conditions.push("(t.name LIKE ? OR t.short_name LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT t.*,
             l.name AS league_name,
             l.reputation AS league_reputation
      FROM teams t
      LEFT JOIN leagues l ON t.league_id = l.id
      ${where}
      ORDER BY
        CASE WHEN t.reputation IS NULL THEN 0 ELSE 1 END DESC,
        t.reputation DESC NULLS LAST,
        t.name ASC
      LIMIT ?
    `;
    args.push(limit);

    const rows = await db.query(sql, args);

    // Map DB rows → frontend Club interface
    const clubs = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      country: row.country || "Unknown",
      league: row.league_name || "Unaffiliated",
      leagueId: row.league_id,
      leagueReputation: row.league_reputation,
      reputation: row.reputation ?? 50,
      finances: row.balance ?? 0,
      balance: row.balance ?? 0,
      wageBudget: row.wage_budget ?? 0,
      transferBudget: row.transfer_budget ?? 0,
      marketValue: row.market_value ?? 0,
      stadiumCapacity: row.stadium_capacity ?? 0,
      stadium: row.stadium || null,
      homeKitColor: row.primary_color || "#FFD700",
      awayKitColor: row.secondary_color || "#0A0A0F",
      trainingFacilities: row.training_facilities ?? 3,
      youthAcademy: row.youth_academy ?? 3,
      coach: row.coach || null,
    }));

    // Cache default query results
    if (canUseCache) {
      _cache = { data: clubs, ts: Date.now() };
    }

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Failed to fetch clubs:", error);

    // Return a small fallback list instead of a 500 — keeps the UI working
    // even when Turso is unreachable from Render's free tier
    const FALLBACK = [
      { id: 18, name: "Arsenal", shortName: "ARS", country: "England", league: "Premier League", reputation: 92, balance: 200_000_000, wageBudget: 80_000_000, transferBudget: 60_000_000, marketValue: 1_100_000_000, stadium: "Emirates Stadium", stadiumCapacity: 60704, homeKitColor: "#EF0107", awayKitColor: "#FFFFFF", trainingFacilities: 5, youthAcademy: 5 },
      { id: 1, name: "Liverpool FC", shortName: "LIV", country: "England", league: "Premier League", reputation: 93, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000, marketValue: 1_000_000_000, stadium: "Anfield", stadiumCapacity: 61276, homeKitColor: "#C8102E", awayKitColor: "#F6EB61", trainingFacilities: 5, youthAcademy: 5 },
      { id: 2, name: "Manchester City", shortName: "MCI", country: "England", league: "Premier League", reputation: 95, balance: 300_000_000, wageBudget: 120_000_000, transferBudget: 90_000_000, marketValue: 1_300_000_000, stadium: "Etihad Stadium", stadiumCapacity: 53400, homeKitColor: "#6CABDD", awayKitColor: "#1C2C5B", trainingFacilities: 5, youthAcademy: 5 },
      { id: 57, name: "Real Madrid", shortName: "RMA", country: "Spain", league: "La Liga", reputation: 96, balance: 280_000_000, wageBudget: 110_000_000, transferBudget: 80_000_000, marketValue: 1_400_000_000, stadium: "Santiago Bernabéu", stadiumCapacity: 81044, homeKitColor: "#FFFFFF", awayKitColor: "#FEBE10", trainingFacilities: 5, youthAcademy: 5 },
      { id: 503, name: "Barcelona", shortName: "BAR", country: "Spain", league: "La Liga", reputation: 92, balance: 150_000_000, wageBudget: 80_000_000, transferBudget: 40_000_000, marketValue: 1_000_000_000, stadium: "Camp Nou", stadiumCapacity: 99354, homeKitColor: "#A50044", awayKitColor: "#004D98", trainingFacilities: 5, youthAcademy: 5 },
      { id: 5, name: "Bayern Munich", shortName: "BAY", country: "Germany", league: "Bundesliga", reputation: 94, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 75_000_000, marketValue: 1_000_000_000, stadium: "Allianz Arena", stadiumCapacity: 75000, homeKitColor: "#DC052D", awayKitColor: "#FFFFFF", trainingFacilities: 5, youthAcademy: 5 },
      { id: 7, name: "Paris Saint-Germain", shortName: "PSG", country: "France", league: "Ligue 1", reputation: 91, balance: 250_000_000, wageBudget: 100_000_000, transferBudget: 80_000_000, marketValue: 1_000_000_000, stadium: "Parc des Princes", stadiumCapacity: 47929, homeKitColor: "#004170", awayKitColor: "#DA291C", trainingFacilities: 5, youthAcademy: 4 },
    ];
    return NextResponse.json(FALLBACK);
  }
}
