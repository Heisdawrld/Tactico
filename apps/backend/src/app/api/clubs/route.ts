import { NextResponse } from "next/server";
import { db } from "@tactico/database";

export async function GET() {
  try {
    let rows = await db.query("SELECT * FROM clubs LIMIT 50");
    
    // If database is empty, return some sample data for demonstration
    if (rows.length === 0) {
      rows = [
        { id: 1, name: "Manchester City", nation_code: "ENG", reputation: 95, balance: 100000000, stadium_capacity: 53400, home_kit_color: "#6CABDD", away_kit_color: "#FFFFFF" },
        { id: 2, name: "Real Madrid", nation_code: "ESP", reputation: 98, balance: 150000000, stadium_capacity: 81044, home_kit_color: "#FFFFFF", away_kit_color: "#000000" },
        { id: 3, name: "Liverpool", nation_code: "ENG", reputation: 88, balance: 80000000, stadium_capacity: 53287, home_kit_color: "#C8102E", away_kit_color: "#FFFFFF" },
        { id: 4, name: "Barcelona", nation_code: "ESP", reputation: 97, balance: 140000000, stadium_capacity: 99354, home_kit_color: "#A50044", away_kit_color: "#FDB813" },
        { id: 5, name: "Manchester United", nation_code: "ENG", reputation: 90, balance: 50000000, stadium_capacity: 74140, home_kit_color: "#DA291C", away_kit_color: "#FFFFFF" },
      ];
    }
    
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
