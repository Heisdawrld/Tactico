import { NextResponse } from "next/server";
import { db } from "@tactico/database";

export async function GET() {
  try {
    const rows = await db.query("SELECT * FROM clubs LIMIT 50");
    
    // Map database rows to frontend Club interface
    const clubs = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      country: row.nation_code, // Simplified: using nation_code as country
      league: "Unknown", // TODO: Join with competitions table
      reputation: row.reputation,
      finances: row.balance,
      stadiumCapacity: row.stadium_capacity,
      homeKitColor: row.home_kit_color,
      awayKitColor: row.away_kit_color,
    }));

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Failed to fetch clubs:", error);
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
  }
}
