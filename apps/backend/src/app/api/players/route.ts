import { NextResponse } from "next/server";
import { db } from "@tactico/database";

export async function GET() {
  try {
    const rows = await db.query(`
      SELECT p.*, pe.first_name, pe.last_name, pe.date_of_birth, pe.nation_code
      FROM players p JOIN people pe ON p.person_id = pe.id LIMIT 50
    `);
    
    // Map database rows to frontend Player interface
    const players = rows.map((row: any) => {
      // Calculate age from date_of_birth
      let age = 25; // Default age
      if (row.date_of_birth) {
        const birthDate = new Date(row.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
      }

      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        age: age,
        clubId: row.club_id,
        position: row.position,
        overallRating: row.current_ability,
        potentialRating: row.potential_ability,
        pace: row.pace,
        shooting: row.shooting,
        passing: row.passing,
        dribbling: row.dribbling,
        defending: Math.round((row.positioning + row.tackling + row.marking) / 3) || 50, // Simplified defending
        physicality: Math.round((row.strength + row.stamina) / 2) || 50, // Simplified physicality
        wage: row.wage,
        morale: row.morale,
        stamina: row.stamina,
        injuryStatus: "fit", // TODO: Implement injury system
      };
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
