import { NextResponse } from "next/server";
import { db } from "@tactico/database";

export async function GET() {
  try {
    let rows = await db.query(`
      SELECT p.*, pe.first_name, pe.last_name, pe.date_of_birth, pe.nation_code
      FROM players p JOIN people pe ON p.person_id = pe.id LIMIT 50
    `);
    
    // If database is empty, return some sample data
    if (rows.length === 0) {
      rows = [
        { id: 1, first_name: "Erling", last_name: "Haaland", date_of_birth: "2000-07-21", club_id: 1, position: "ST", current_ability: 91, potential_ability: 94, pace: 89, shooting: 93, passing: 66, dribbling: 80, positioning: 96, tackling: 43, marking: 30, strength: 93, stamina: 76, wage: 375000, morale: 80 },
        { id: 2, first_name: "Kevin", last_name: "De Bruyne", date_of_birth: "1991-06-28", club_id: 1, position: "CM", current_ability: 91, potential_ability: 91, pace: 72, shooting: 88, passing: 94, dribbling: 87, positioning: 88, tackling: 65, marking: 60, strength: 74, stamina: 78, wage: 400000, morale: 85 },
      ];
    }
    
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
