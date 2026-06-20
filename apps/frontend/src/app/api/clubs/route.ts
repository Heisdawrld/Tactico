import { NextResponse } from "next/server";
import { db } from "@tactico/database";

/**
 * GET /api/clubs
 *
 * Returns all teams from the real Turso DB.
 * Supports optional query params:
 *   ?league_id=N   - filter by league
 *   ?limit=N       - limit results (default 50, max 500)
 *   ?search=STR    - search by name
 *
 * Maps real DB schema (teams table) → frontend Club interface.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("league_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 500);
    const search = searchParams.get("search");

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

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Failed to fetch clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
