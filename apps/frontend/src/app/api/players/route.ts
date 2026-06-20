import { NextResponse } from "next/server";
import { db } from "@tactico/database";

/**
 * GET /api/players
 *
 * Returns players from the real Turso DB.
 * Supports optional query params:
 *   ?team_id=N     - filter by team
 *   ?league_id=N   - filter by league
 *   ?limit=N       - limit results (default 50, max 500)
 *   ?search=STR    - search by name
 *   ?order=OVR|POT|MKT|AGE|WAGE  - sort order (default OVR)
 *
 * Maps real DB schema (players table with attributes JSON) → frontend Player interface.
 * Parses the `attributes` JSON to extract FIFA-style 6-stat breakdown.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team_id");
    const leagueId = searchParams.get("league_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const search = searchParams.get("search");
    const order = (searchParams.get("order") || "OVR").toUpperCase();

    // Build query
    const conditions: string[] = [];
    const args: any[] = [];

    if (teamId) {
      conditions.push("team_id = ?");
      args.push(parseInt(teamId));
    }
    if (leagueId) {
      conditions.push("league_id = ?");
      args.push(parseInt(leagueId));
    }
    if (search) {
      conditions.push("(name LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Sort order
    const orderBy = {
      OVR: "overall_rating DESC NULLS LAST",
      POT: "CASE WHEN overall_rating IS NULL THEN 0 ELSE 1 END DESC, overall_rating DESC NULLS LAST", // would need potential; use OVR for now
      MKT: "market_value DESC NULLS LAST",
      AGE: "date_of_birth ASC", // younger = later DOB
      WAGE: "wage DESC NULLS LAST",
      NAME: "last_name ASC, first_name ASC",
    }[order] || "overall_rating DESC NULLS LAST";

    const sql = `
      SELECT p.*, t.name AS team_name, t.short_name AS team_short,
             t.primary_color, t.league_id AS team_league_id
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${where}
      ORDER BY ${orderBy}, p.name ASC
      LIMIT ?
    `;
    args.push(limit);

    const rows = await db.query(sql, args);

    // Map DB rows → frontend Player interface
    const players = rows.map((row: any) => {
      // Parse attributes JSON
      let attrs: any = null;
      if (row.attributes) {
        try {
          attrs = typeof row.attributes === "string"
            ? JSON.parse(row.attributes)
            : row.attributes;
        } catch {
          attrs = null;
        }
      }

      // Calculate age from date_of_birth
      let age = 25;
      if (row.date_of_birth) {
        const birth = new Date(row.date_of_birth);
        const now = new Date();
        age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      }

      // Derive FIFA-style 6-stat breakdown from full attributes
      const pace = attrs?.pace ?? attrs?.acceleration ?? 50;
      const shooting = attrs?.finishing ?? attrs?.long_shots ?? 50;
      const passing = attrs?.passing ?? attrs?.crossing ?? 50;
      const dribbling = attrs?.dribbling ?? attrs?.technique ?? 50;
      const defending = attrs?.tackling ?? attrs?.marking ?? 50;
      const physicality = attrs?.strength ?? attrs?.stamina ?? 50;

      return {
        id: row.id,
        firstName: row.first_name || (row.name || "").split(" ")[0] || "",
        lastName: row.last_name || (row.name || "").split(" ").slice(1).join(" ") || "",
        fullName: row.name,
        age,
        dateOfBirth: row.date_of_birth,
        clubId: row.team_id,
        clubName: row.team_name,
        clubShort: row.team_short,
        clubColor: row.primary_color,
        nationality: row.nationality,
        nationalityCode: row.nationality_code,
        position: row.position,
        secondaryPositions: row.secondary_positions,
        foot: row.foot,
        height: row.height,
        weight: row.weight,
        shirtNumber: row.shirt_number,

        overallRating: row.overall_rating ?? 50,
        potentialRating: row.overall_rating ? Math.min(99, row.overall_rating + 5) : 50, // placeholder until we add potential column

        // FIFA-style 6-stat breakdown (derived from full attrs)
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physicality,

        // Game state
        wage: row.wage ?? 0,
        morale: row.morale ?? 70,
        fatigue: row.fatigue ?? 0,
        sharpness: row.sharpness ?? 80,
        injuryStatus: row.injury ? "injured" : "fit",
        injury: row.injury,

        // Contract
        marketValue: row.market_value ?? 0,
        contractExpires: row.contract_expires,

        // Season stats
        appearances: row.appearances ?? 0,
        goals: row.goals ?? 0,
        assists: row.assists ?? 0,
        cleanSheets: row.clean_sheets ?? 0,
        averageRating: row.average_rating ?? 0,

        // Full attributes (for detailed player view)
        attributes: attrs,
      };
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
